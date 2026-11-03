#!/usr/bin/env python3
"""Voiceover + word timings for a reel.

Reads episodes/<slug>/script.txt (spoken lines; '#' lines are beat names, blank lines are
beat breaks) and writes:

  public/episodes/<slug>/vo.mp3      the voiceover, -14 LUFS
  public/episodes/<slug>/words.json  [{ "word": str, "start": sec, "end": sec }, ...]

Engines (scripts/doctor.sh tells which ones this machine can use):
  chatterbox  local, natural (default). --ref voice.wav clones a voice from ~10 s of audio
              (only use voices you have the rights to, e.g. your own). Needs setup.sh --local-voice.
  openai      OpenAI TTS (gpt-4o-mini-tts), natural, needs OPENAI_API_KEY (paid API, a few
              cents per video). --voice onyx|ash|echo|… ; word timing via the OpenAI
              transcription API when local Whisper isn't installed.
  edge        Microsoft edge-tts, free, fast, more robotic.
  kokoro      Kokoro-82M (Apache 2.0), free, local, fast on CPU (~10 min of speech in a few
              minutes), natural. No cloning; --voice am_michael|am_adam|bm_george|af_heart|…
              Model (~350 MB) is downloaded once from GitHub into voices/models/.
              Default engine for the long-form finance videos (FINANCE.md).
  elevenlabs  ElevenLabs API (ELEVENLABS_API_KEY, or .env.local from `elevenlabs onboard`). Most
              natural explainer voices; word timing comes back with the audio (no Whisper).
              Default voice: library voice "Alex - Clear Technical Explainer" (owner's pick for the
              finance channel, 2026-10-29); library voices need a paid plan. --model eleven_v3
              allows [dry]/[curious]-style tags in script.txt (stripped from the captions).
              The free plan has no commercial licence — use Starter or above for published videos.
  file        you recorded it yourself: --audio take.m4a, this only aligns the words.

Usage (always with the TTS venv):
  .venv-tts/bin/python scripts/voice.py <slug> [--engine chatterbox] [--ref voices/me.wav]
      [--exaggeration 0.6] [--speed 1.05] [--seed 3] [--voice en-US-AndrewNeural]

Word timings for chatterbox/kokoro/file come from Whisper — or, without local Whisper, from
NVIDIA Parakeet via sherpa-onnx (pip install sherpa-onnx; fast on CPU, model from GitHub) — (word_timestamps) aligned back onto the
script's own words, so captions always show the script spelling.
"""
import argparse
import asyncio
import difflib
import json
import multiprocessing as mp
import os
import pathlib
import re
import shutil
import subprocess
import tempfile
import threading
import time

ROOT = pathlib.Path(__file__).resolve().parent.parent

# Chatterbox once took 9 GB on this 16 GB Mac while the disk had no room for swap, and
# macOS froze until the watchdog rebooted it. So: cap the MPS pool (torch raises a clean
# OOM instead of eating unified memory) and kill ourselves if the system runs low.
os.environ.setdefault("PYTORCH_MPS_HIGH_WATERMARK_RATIO", "0.5")
os.environ.setdefault("PYTORCH_MPS_LOW_WATERMARK_RATIO", "0.4")
MIN_FREE_DISK_GB = 4
MIN_MEM_LEVEL = 18  # kern.memorystatus_level, % of RAM still available system-wide


def mem_level() -> int:
    """% of RAM still available (macOS memorystatus; Linux MemAvailable; 100 if unknown)."""
    try:
        r = subprocess.run(["sysctl", "-n", "kern.memorystatus_level"], capture_output=True, text=True)
        if r.returncode == 0 and r.stdout.strip():
            return int(r.stdout.strip())
        info = dict(l.split(":", 1) for l in open("/proc/meminfo"))
        return int(100 * int(info["MemAvailable"].split()[0]) / int(info["MemTotal"].split()[0]))
    except Exception:
        return 100


def guard_memory(label: str):
    """Background thread: hard-exit this process before macOS starts to starve."""

    def watch():
        while True:
            lvl = mem_level()
            if lvl < MIN_MEM_LEVEL:
                print(f"\n!! {label}: system memory down to {lvl}% — aborting to protect the Mac. "
                      "Close other apps (browsers, Android Studio, simulators) and retry.", flush=True)
                os._exit(3)
            time.sleep(0.5)

    threading.Thread(target=watch, daemon=True).start()


def preflight():
    free = shutil.disk_usage(ROOT).free / 1e9
    if free < MIN_FREE_DISK_GB:
        raise SystemExit(f"only {free:.1f} GB disk free — macOS needs room for swap; free up {MIN_FREE_DISK_GB}+ GB first")
    lvl = mem_level()
    if lvl < 40:
        raise SystemExit(f"only {lvl}% memory available — close heavy apps before running local TTS")


# ---------- script ----------
def read_beats(slug: str) -> list[list[str]]:
    """Beats (blank-line separated) → list of sentences."""
    src = (ROOT / "episodes" / slug / "script.txt").read_text()
    beats, cur = [], []
    for line in src.splitlines():
        s = line.strip()
        if s.startswith("#"):
            continue
        if not s:
            if cur:
                beats.append(cur)
                cur = []
            continue
        cur += [x for x in re.split(r"(?<=[.?!…])\s+", s) if x]
    if cur:
        beats.append(cur)
    return beats


def norm(s: str) -> str:
    return re.sub(r"[^a-z0-9äöüß]", "", s.lower())


# ---------- engines ----------
def tts_chatterbox(beats, wav_out, ref, exaggeration, cfg, seed, device, gaps=(0.14, 0.32)):
    """Runs in a child process, so the model's memory is fully returned before Whisper loads."""
    ctx = mp.get_context("spawn")
    p = ctx.Process(target=_chatterbox_child, args=(beats, str(wav_out), ref, exaggeration, cfg, seed, device, gaps))
    p.start()
    p.join()
    if p.exitcode != 0:
        raise SystemExit(f"chatterbox failed (exit {p.exitcode})")


def chunk_beats(beats, max_chars=170):
    """Whole beats grouped into blocks the model speaks in one go. Generating sentence by
    sentence made every sentence start with a fresh random pitch/tempo (110 → 200 Hz jumps),
    which is what made the voice sound stitched together."""
    chunks, cur = [], []
    for beat in beats:
        text = " ".join(beat)
        if cur and len(" ".join(cur)) + 1 + len(text) > max_chars:
            chunks.append(" ".join(cur))
            cur = []
        cur.append(text)
    if cur:
        chunks.append(" ".join(cur))
    return chunks


def _chatterbox_child(beats, wav_out, ref, exaggeration, cfg, seed, device, gaps):
    guard_memory("chatterbox")
    import numpy as np
    import torch
    import torchaudio
    from chatterbox.tts import ChatterboxTTS

    torch.set_num_threads(4)
    dev = device if device != "mps" or torch.backends.mps.is_available() else "cpu"
    model = ChatterboxTTS.from_pretrained(device=dev)
    if ref:
        model.prepare_conditionals(str(ref), exaggeration=exaggeration)
    sr = model.sr
    # Chatterbox hard-codes max_new_tokens=1000 (~40 s); a runaway take then decodes for 15+ min
    # on CPU. Cap it per block (speech ≈ 25 tokens/s) and remember whether a take hit the cap.
    cap = {"n": 1000, "hit": False}
    orig_inference = model.t3.inference

    def capped(*args, **kw):
        kw["max_new_tokens"] = min(kw.get("max_new_tokens", 1000), cap["n"])
        out = orig_inference(*args, **kw)
        cap["hit"] = out.shape[-1] >= cap["n"] - 2
        return out

    model.t3.inference = capped
    rng = np.random.default_rng(seed)
    pieces, ref_f0 = [], None
    for ci, text in enumerate(chunk_beats(beats)):
        n_words = len(text.split())
        cap["n"] = int(n_words * 14 + 60)
        best = None
        # up to 4 takes per block; keep the first whose pace and pitch match the voice
        # (long blocks drift: a 230-char block came out 3.5 semitones higher than the rest)
        for take in range(4):
            torch.manual_seed(seed + take * 1000)
            with torch.inference_mode():
                wav = model.generate(text, exaggeration=exaggeration, cfg_weight=cfg, temperature=0.8)
            w = trim_silence(wav.squeeze(0).cpu().numpy(), sr)
            rate = n_words / (len(w) / sr)
            f0 = median_f0(w, sr)
            off_pitch = ref_f0 is not None and not (0.89 < f0 / ref_f0 < 1.12)
            ok = 2.3 <= rate <= 4.0 and not off_pitch and not cap["hit"]  # numbers ("16") are one token but several spoken words
            score = abs(rate - 2.9) + (abs(np.log(f0 / ref_f0)) * 8 if ref_f0 else 0) + (50 if cap["hit"] else 0)
            if cap["hit"]:
                print(f"  [{ci + 1}] take {take + 1}: ran into the token cap (runaway) — discarded", flush=True)
            print(f"  [{ci + 1}] take {take + 1}: {rate:.1f} words/s, {f0:.0f} Hz{'' if ok else '  (redo)'}", flush=True)
            if best is None or score < best[0]:
                best = (score, w, f0)
            if ok:
                break
        _, w, f0 = best
        ref_f0 = ref_f0 or f0
        # Chatterbox sometimes rushes a block in every take (4.5 words/s); slow just that block
        # with ffmpeg atempo (pitch kept) instead of re-rolling forever
        rate = n_words / (len(w) / sr)
        if rate > 3.9:
            w = retime(w, sr, 3.6 / rate)
            print(f"      slowed to {n_words / (len(w) / sr):.1f} words/s", flush=True)
        fade = int(sr * 0.012)
        w[:fade] *= np.linspace(0, 1, fade)
        w[-fade:] *= np.linspace(1, 0, fade)
        pieces.append(w)
        # pause between blocks filled with faint room tone, never digital silence
        pieces.append(rng.normal(0, 10 ** (-62 / 20), int(sr * gaps[1])).astype(np.float32))
        print(f"      {text}", flush=True)
        if dev == "mps":
            torch.mps.empty_cache()
    audio = np.concatenate(pieces[:-1]).astype(np.float32)
    torchaudio.save(str(wav_out), torch.from_numpy(audio).unsqueeze(0), sr)


def retime(w, sr, factor):
    """Tempo change without pitch change (factor < 1 = slower)."""
    import numpy as np

    with tempfile.TemporaryDirectory() as td:
        src, dst = pathlib.Path(td) / "a.f32", pathlib.Path(td) / "b.f32"
        w.astype(np.float32).tofile(src)
        subprocess.run(
            ["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(sr), "-ac", "1", "-i", str(src), "-filter:a", f"atempo={factor:.4f}", "-f", "f32le", str(dst)],
            check=True,
        )
        return np.fromfile(dst, dtype=np.float32)


def median_f0(w, sr):
    import librosa
    import numpy as np

    y = librosa.resample(w, orig_sr=sr, target_sr=16000)
    f0, _, _ = librosa.pyin(y, fmin=60, fmax=320, sr=16000, frame_length=1024)
    f0 = f0[~np.isnan(f0)]
    return float(np.median(f0)) if len(f0) else 150.0


def trim_silence(w, sr, thresh=0.012, pad=0.04):
    import numpy as np

    loud = np.where(np.abs(w) > thresh)[0]
    if not len(loud):
        return w
    return w[max(0, loud[0] - int(pad * sr)) : min(len(w), loud[-1] + int(pad * 2 * sr))]


# ---------- Kokoro (local, Apache 2.0; model files from the kokoro-onnx GitHub release) ----------
MODELS = ROOT / "voices" / "models"
KOKORO_URL = "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/"


def _fetch(url, dest):
    if dest.exists():
        return dest
    dest.parent.mkdir(parents=True, exist_ok=True)
    print(f"  downloading {url.rsplit('/', 1)[-1]} (once)…", flush=True)
    subprocess.run(["curl", "-sSLf", "-o", str(dest) + ".part", url], check=True)
    pathlib.Path(str(dest) + ".part").rename(dest)
    return dest


def tts_kokoro(beats, wav_out, voice, gap_sentence=0.24, gap_beat=0.45):
    """Sentence by sentence (Kokoro is deterministic, so unlike Chatterbox the voice does not
    drift between calls), with fixed pauses between sentences and longer ones between beats."""
    import numpy as np
    import soundfile as sf
    from kokoro_onnx import Kokoro

    k = Kokoro(str(_fetch(KOKORO_URL + "kokoro-v1.0.onnx", MODELS / "kokoro" / "kokoro-v1.0.onnx")),
               str(_fetch(KOKORO_URL + "voices-v1.0.bin", MODELS / "kokoro" / "voices-v1.0.bin")))
    lang = "en-gb" if voice.startswith("b") else "en-us"
    parts, sr = [], 24000
    for bi, beat in enumerate(beats):
        for si, sentence in enumerate(beat):
            a, sr = k.create(sentence, voice=voice, speed=1.0, lang=lang)
            parts.append(trim_silence(a, sr))
            last = si == len(beat) - 1
            parts.append(np.zeros(int(sr * (gap_beat if last else gap_sentence)), dtype=np.float32))
        print(f"  kokoro beat {bi + 1}/{len(beats)}", flush=True)
    sf.write(str(wav_out), np.concatenate(parts[:-1]), sr)


async def _edge(text, voice, mp3):
    import edge_tts

    comm = edge_tts.Communicate(text, voice, boundary="WordBoundary")
    words = []
    with mp3.open("wb") as f:
        async for chunk in comm.stream():
            if chunk["type"] == "audio":
                f.write(chunk["data"])
            elif chunk["type"] == "WordBoundary":
                st = chunk["offset"] / 1e7
                words.append({"word": chunk["text"], "start": round(st, 3), "end": round(st + chunk["duration"] / 1e7, 3)})
    return words


def tts_edge(beats, raw_out, voice):
    import edge_tts

    text = " ".join(" ".join(b) for b in beats)
    # the endpoint intermittently answers with no audio; retrying fixes it
    for attempt in range(5):
        try:
            return asyncio.run(_edge(text, voice, raw_out))
        except edge_tts.exceptions.NoAudioReceived:
            if attempt == 4:
                raise
            time.sleep(1.5 * (attempt + 1))


# ---------- ElevenLabs (plain HTTPS; audio + character timestamps in one call) ----------
EL_API = "https://api.elevenlabs.io"
# library voices are added to the account on first use: voice_id -> (public owner id, name)
EL_LIBRARY = {
    "InRyolULHTXjegISsXuJ": ("7547a9e3692d5a0123a5caa0a1bf33a44d1ab030a899995d1e32304ad09fc4ac", "Alex - Clear Technical Explainer"),
}
EL_TAG = re.compile(r"\[[^\]]+\]\s*")


def _el_key():
    key = os.environ.get("ELEVENLABS_API_KEY")
    env = ROOT / ".env.local"
    if not key and env.exists():  # written by `npx @elevenlabs/cli onboard`; never printed
        for line in env.read_text().splitlines():
            if line.startswith("ELEVENLABS_API_KEY="):
                key = line.split("=", 1)[1].strip().strip('"')
    if not key:
        raise SystemExit("ELEVENLABS_API_KEY is not set (environment secret or .env.local)")
    return key


def _el(path, body=None, method=None):
    import urllib.request

    req = urllib.request.Request(EL_API + path, data=json.dumps(body).encode() if body is not None else None, method=method,
                                 headers={"xi-api-key": _el_key(), "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=600) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        raise SystemExit(f"ElevenLabs {path}: HTTP {e.code} {e.read()[:300]!r}")


def _el_voice(voice):
    """Library voices must be in the account before they can speak (paid plans only)."""
    if voice in EL_LIBRARY:
        mine = {v["voice_id"] for v in _el("/v1/voices")["voices"]}
        if voice not in mine:
            owner, name = EL_LIBRARY[voice]
            print(f"  adding library voice '{name}' to the account", flush=True)
            return _el(f"/v1/voices/add/{owner}/{voice}", {"new_name": name}).get("voice_id", voice)
    return voice


def tts_elevenlabs(beats, raw_out, voice, model, speed=1.0, stability=None, gap_beat=0.45, max_chars=2400):
    """Blocks of whole beats (v3 takes ≤3,000 characters per call), each with its own character
    timestamps; previous/next text keeps the delivery continuous across blocks on v2.
    Returns the spoken words with times on raw_out."""
    import base64
    import numpy as np
    import soundfile as sf

    voice = _el_voice(voice)
    v3 = model.startswith("eleven_v3")
    settings = {"stability": stability if stability is not None else (0.5 if v3 else 0.45)}
    if not v3:
        settings.update(similarity_boost=0.8, style=0.15, use_speaker_boost=True, speed=speed)
    blocks = chunk_beats(beats, max_chars)
    parts, words, t0, sr = [], [], 0.0, 44100
    with tempfile.TemporaryDirectory() as td:
        for i, text in enumerate(blocks):
            body = {"text": text, "model_id": model, "voice_settings": settings}
            if not v3:
                body.update(previous_text=blocks[i - 1] if i else None, next_text=blocks[i + 1] if i + 1 < len(blocks) else None)
            res = _el(f"/v1/text-to-speech/{voice}/with-timestamps?output_format=mp3_44100_128", body)
            mp3 = pathlib.Path(td) / f"{i}.mp3"
            mp3.write_bytes(base64.b64decode(res["audio_base64"]))
            wav = mp3.with_suffix(".wav")
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(mp3), "-ac", "1", "-ar", str(sr), str(wav)], check=True)
            w, _ = sf.read(str(wav), dtype="float32")
            al = res.get("normalized_alignment") or res["alignment"]
            cur = None
            for ch, a, b in zip(al["characters"], al["character_start_times_seconds"], al["character_end_times_seconds"]):
                if ch.isspace():
                    cur = None
                    continue
                if cur is None:
                    cur = {"word": "", "start": t0 + a, "end": t0 + b}
                    words.append(cur)
                cur["word"] += ch
                cur["end"] = t0 + b
            parts += [w, np.zeros(int(sr * gap_beat), dtype=np.float32)]
            t0 += len(w) / sr + gap_beat
            print(f"  elevenlabs block {i + 1}/{len(blocks)} ({len(text)} chars)", flush=True)
    sf.write(str(raw_out), np.concatenate(parts[:-1]), sr)
    words = [w for w in words if not w["word"].startswith("[")]  # v3 tags have no speech
    return [{"word": w["word"], "start": round(w["start"], 3), "end": round(w["end"], 3)} for w in words]


# ---------- OpenAI (TTS + word timing over plain HTTPS, no SDK needed) ----------
OPENAI_TONE = ("Calm, deep documentary narrator. Measured pace, clear consonants, "
               "slight tension on surprising facts, never shouting.")


def _openai_key():
    key = os.environ.get("OPENAI_API_KEY")
    if not key:
        raise SystemExit("OPENAI_API_KEY is not set — export it, or use --engine edge / chatterbox")
    return key


def tts_openai(beats, raw_out, voice):
    import urllib.request

    text = "\n\n".join(" ".join(b) for b in beats)  # one request = one consistent voice
    body = json.dumps({"model": "gpt-4o-mini-tts", "voice": voice, "input": text, "instructions": OPENAI_TONE, "response_format": "wav"}).encode()
    req = urllib.request.Request("https://api.openai.com/v1/audio/speech", data=body, headers={"Authorization": f"Bearer {_openai_key()}", "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=300) as r:
        raw_out.write_bytes(r.read())


GEMINI_BLOCK_CHARS = 5000  # ≈ 850 words ≈ 6 min; one request returns at most 16,384 audio tokens ≈ 10.9 min


def tts_gemini(beats, raw_out, voice, gap_beat=0.9, gap_sentence=0.35, model="gemini-3.8-flash-tts", style=""):
    """Google Gemini TTS, one request per block of whole beats (a short reel is one request; a
    10-minute finance script is 2 blocks). Free tier per Google Cloud project and model
    (AI Studio, 2026-10-30): 3 requests/min, 10K input tokens/min, 10 requests/day; 2.5 Pro TTS: 0.
    Paragraph breaks between beats give natural pauses; afterwards extra silence is inserted at
    every sentence end (found with Whisper) and at beat ends, so the delivery breathes like a
    storyteller instead of rushing. `style` is a director's note (only 2.5 models follow it)."""
    import sys as _sys
    import wave

    import numpy as np

    _sys.path.insert(0, str(ROOT / "scripts"))
    from gemini_tts import speak

    if not os.environ.get("GEMINI_API_KEY"):
        raise SystemExit("GEMINI_API_KEY is not set (aistudio.google.com → Get API key; export it in ~/.zshrc)")
    sr = 24000
    with tempfile.TemporaryDirectory() as td:
        blocks, cur = [], []
        for b in beats:  # whole beats per block, so a block never ends mid-thought
            if cur and len("\n\n".join(" ".join(x) for x in cur + [b])) > GEMINI_BLOCK_CHARS:
                blocks.append(cur)
                cur = []
            cur.append(b)
        blocks.append(cur)
        parts = []
        for i, blk in enumerate(blocks):
            bw = pathlib.Path(td) / f"g{i}.wav"
            speak("\n\n".join(" ".join(b) for b in blk), voice, model, style, bw)
            with wave.open(str(bw)) as w:
                parts += [np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768,
                          np.zeros(int(gap_beat * sr), dtype=np.float32)]
            print(f"  gemini block {i + 1}/{len(blocks)}", flush=True)
        a = np.concatenate(parts[:-1])
        wav = pathlib.Path(td) / "g.wav"
        with wave.open(str(wav), "wb") as w:
            w.setnchannels(1)
            w.setsampwidth(2)
            w.setframerate(sr)
            w.writeframes((np.clip(a, -1, 1) * 32767).astype(np.int16).tobytes())
        heard = whisper_words(wav, " ".join(" ".join(b) for b in beats))
    beat_ends = {norm(b[-1].split()[-1]) for b in beats}
    cuts = []
    for k, w_ in enumerate(heard[:-1]):
        if w_["word"].rstrip().endswith((".", "?", "!")):
            # cut in the middle of the gap to the next word, never inside a word
            t = (w_["end"] + heard[k + 1]["start"]) / 2
            cuts.append((t, gap_beat if norm(w_["word"]) in beat_ends else gap_sentence))
    out, last = [], 0
    for t, g in cuts:
        i = int(t * sr)
        out += [a[last:i], np.zeros(int(g * sr), dtype=np.float32)]
        last = i
    out.append(a[last:])
    y = np.concatenate(out)
    with wave.open(str(raw_out), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes((np.clip(y, -1, 1) * 32767).astype(np.int16).tobytes())
    print(f"  gemini: {len(a) / sr:.1f}s → {len(y) / sr:.1f}s with {len(cuts)} pauses", flush=True)


def openai_words(audio_path, script_text):
    """Word timestamps from the OpenAI transcription API (whisper-1, verbose_json)."""
    import urllib.request
    import uuid

    b = uuid.uuid4().hex
    parts = []
    for k, v in (("model", "whisper-1"), ("response_format", "verbose_json"), ("timestamp_granularities[]", "word"), ("prompt", script_text[:800])):
        parts.append(f'--{b}\r\nContent-Disposition: form-data; name="{k}"\r\n\r\n{v}\r\n'.encode())
    parts.append(f'--{b}\r\nContent-Disposition: form-data; name="file"; filename="vo.mp3"\r\nContent-Type: audio/mpeg\r\n\r\n'.encode() + pathlib.Path(audio_path).read_bytes() + b"\r\n")
    parts.append(f"--{b}--\r\n".encode())
    req = urllib.request.Request("https://api.openai.com/v1/audio/transcriptions", data=b"".join(parts), headers={"Authorization": f"Bearer {_openai_key()}", "Content-Type": f"multipart/form-data; boundary={b}"})
    with urllib.request.urlopen(req, timeout=300) as r:
        res = json.loads(r.read())
    return [{"word": w["word"].strip(), "start": w["start"], "end": w["end"]} for w in res["words"]]


# ---------- alignment ----------
def whisper_words(audio_path, script_text):
    try:
        import whisper
    except ImportError:  # light install: no local Whisper → Parakeet if installed, else the API
        try:
            import sherpa_onnx  # noqa: F401

            return parakeet_words(audio_path)
        except ImportError:
            pass
        if os.environ.get("OPENAI_API_KEY"):
            return openai_words(audio_path, script_text)
        raise SystemExit("word timing needs local Whisper (setup.sh --local-voice), sherpa-onnx (setup.sh --kokoro) or OPENAI_API_KEY")
    guard_memory("whisper")

    import torch  # noqa: E402 — whisper already depends on it

    dev = "cuda" if torch.cuda.is_available() else "cpu"  # on a cloud GPU this takes seconds instead of ~20 min
    model = whisper.load_model("small", device=dev)
    res = model.transcribe(str(audio_path), word_timestamps=True, initial_prompt=script_text, fp16=dev == "cuda")
    return [{"word": w["word"].strip(), "start": w["start"], "end": w["end"]} for s in res["segments"] for w in s["words"]]


PARAKEET = "sherpa-onnx-nemo-parakeet-tdt-0.6b-v2-int8"


def parakeet_words(audio_path):
    """Word timestamps from NVIDIA Parakeet TDT 0.6B (CC-BY-4.0) via sherpa-onnx: ~15 min of
    audio in ~2 min on CPU, model from the sherpa-onnx GitHub release (no Hugging Face)."""
    import numpy as np
    import sherpa_onnx

    d = MODELS / PARAKEET
    if not d.exists():
        tar = _fetch(f"https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models/{PARAKEET}.tar.bz2", MODELS / f"{PARAKEET}.tar.bz2")
        subprocess.run(["tar", "xjf", str(tar), "-C", str(MODELS)], check=True)
        tar.unlink()
    rec = sherpa_onnx.OfflineRecognizer.from_transducer(
        encoder=str(d / "encoder.int8.onnx"), decoder=str(d / "decoder.int8.onnx"), joiner=str(d / "joiner.int8.onnx"),
        tokens=str(d / "tokens.txt"), model_type="nemo_transducer", num_threads=4)
    pcm = subprocess.run(["ffmpeg", "-v", "error", "-i", str(audio_path), "-ac", "1", "-ar", "16000", "-f", "f32le", "-"], capture_output=True, check=True).stdout
    a = np.frombuffer(pcm, dtype=np.float32)
    sr, words = 16000, []
    # cut at the quietest 0.1 s near every 20 s mark, so no word is split between chunks
    cuts, pos = [0], 0
    while pos + 25 * sr < len(a):
        lo, hi = pos + 17 * sr, pos + 23 * sr
        e = np.convolve(a[lo:hi] ** 2, np.ones(1600), "valid")
        pos = lo + int(np.argmin(e)) + 800
        cuts.append(pos)
    cuts.append(len(a))
    for c0, c1 in zip(cuts, cuts[1:]):
        s = rec.create_stream()
        s.accept_waveform(sr, a[c0:c1])
        rec.decode_stream(s)
        t0, r = c0 / sr, s.result
        for tok, t in zip(r.tokens, r.timestamps):
            if tok.startswith(" ") or not words or words[-1].get("closed"):
                words.append({"word": tok.strip(), "start": t0 + t, "end": t0 + t + 0.12})
            else:
                words[-1]["word"] += tok
                words[-1]["end"] = t0 + t + 0.12
        if words:
            words[-1]["closed"] = True
    for i, w in enumerate(words):
        w.pop("closed", None)
        if i + 1 < len(words):
            w["end"] = min(max(w["end"], w["start"] + 0.08), words[i + 1]["start"])
    return [{"word": w["word"], "start": round(w["start"], 3), "end": round(w["end"], 3)} for w in words if w["word"]]


UNIT_WORDS = {"dollars", "dollar", "percent", "cents", "billion", "million", "trillion"}


def report_mismatches(script_tokens, heard):
    """Script words Whisper didn't hear back — usually a mumble or a wrong word
    (seen: "five" spoken so it was heard as "fire"). Numbers are skipped (heard as digits/words)."""
    a = [norm(t) for t in script_tokens]
    b = [norm(w["word"]) for w in heard]
    bad = []
    for op, i1, i2, j1, j2 in difflib.SequenceMatcher(None, a, b, autojunk=False).get_opcodes():
        if op == "equal":
            continue
        said = " ".join(script_tokens[i1:i2])
        got = " ".join(w["word"] for w in heard[j1:j2])
        if norm(said) == norm(got):  # same words, split differently ("mid-request" vs "mid -request")
            continue
        if not got and norm(said) in UNIT_WORDS:  # "787 dollars" is heard as "$787"
            continue
        if said and not any(ch.isdigit() for ch in said):
            bad.append(f"'{said}' → heard '{' '.join(w['word'] for w in heard[j1:j2])}'")
        elif not said and j2 - j1 >= 3:
            # extra speech the script doesn't have — usually the TTS looping its last sentence
            # (seen: "You make a plan." spoken five times at the end of a block)
            bad.append(f"EXTRA SPEECH (repeat?) after '{' '.join(script_tokens[max(0, i1 - 3):i1])}': '{got}'")
    print("  check: " + ("all words heard back ✓" if not bad else "POSSIBLY MISSPOKEN: " + "; ".join(bad)), flush=True)


def align(script_tokens, heard):
    """Map heard word times onto the script tokens; runs of unmatched tokens
    (e.g. "12,800" heard as "12,000 800") are spread evenly across their gap."""
    a = [norm(t) for t in script_tokens]
    b = [norm(w["word"]) for w in heard]
    times = [None] * len(a)
    for blk in difflib.SequenceMatcher(None, a, b, autojunk=False).get_matching_blocks():
        for k in range(blk.size):
            h = heard[blk.b + k]
            times[blk.a + k] = (h["start"], h["end"])
    i = 0
    while i < len(times):
        if times[i] is not None:
            i += 1
            continue
        j = i
        while j < len(times) and times[j] is None:
            j += 1
        t0 = times[i - 1][1] if i > 0 else 0.0
        t1 = times[j][0] if j < len(times) else t0 + 0.35 * (j - i)
        step = (t1 - t0) / (j - i)
        for k in range(i, j):
            times[k] = (t0 + step * (k - i), t0 + step * (k - i + 1))
        i = j
    return [{"word": t, "start": round(s, 3), "end": round(max(e, s + 0.05), 3)} for t, (s, e) in zip(script_tokens, times)]


# ---------- post ----------
PITCH = 0.0  # semitones, set from --pitch


def finish(raw, mp3, speed):
    """tempo (pitch preserved) + optional pitch shift (tempo preserved) + loudness to -14 LUFS"""
    shift = ""
    if PITCH:
        r = 2 ** (PITCH / 12)
        shift = f"asetrate=48000*{r:.5f},aresample=48000,atempo={1 / r:.5f},"
    subprocess.run(
        ["ffmpeg", "-v", "error", "-y", "-i", str(raw), "-filter:a", f"aresample=48000,{shift}atempo={speed},loudnorm=I=-14:TP=-1.5:LRA=11", "-ar", "48000", str(mp3)],
        check=True,
    )


def silences(audio, noise_db=-35, min_len=0.18):
    """[(start, end), …] of pauses in the audio (ffmpeg silencedetect)."""
    r = subprocess.run(
        ["ffmpeg", "-v", "info", "-i", str(audio), "-af", f"silencedetect=noise={noise_db}dB:d={min_len}", "-f", "null", "-"],
        capture_output=True,
        text=True,
    )
    st = [float(x) for x in re.findall(r"silence_start: ([0-9.]+)", r.stderr)]
    en = [float(x) for x in re.findall(r"silence_end: ([0-9.]+)", r.stderr)]
    return list(zip(st, en))


def snap_to_silences(words, audio):
    """Whisper sometimes places a word inside a pause (seen: a beat's first word and big
    numbers starting 0.3–0.8 s early). Nobody speaks during silence, so push such word
    starts to the end of the pause and pull word ends back to its start."""
    gaps = silences(audio)
    out = []
    for w in words:
        s0, e0 = w["start"], w["end"]
        for a, b in gaps:
            if a - 0.02 <= s0 < b - 0.03:
                s0 = b
            elif s0 < a and e0 > b + 0.05 and (b - a) > 0.5 * (e0 - s0):
                # a word "spanning" a pause it can't contain: it really starts after it
                s0 = b
            if s0 < a < e0:
                e0 = a
        out.append({**w, "start": round(s0, 3), "end": round(max(e0, s0 + 0.05), 3)})
    # a sentence's first word placed just before the pause that ends the previous sentence
    # (whisper glued it onto "snapped." in one case) belongs after that pause
    for i in range(1, len(out) - 1):
        if not re.search(r"[.?!…]$", out[i - 1]["word"]):
            continue
        for a, b in gaps:
            if b - a >= 0.3 and out[i]["start"] < a <= out[i]["end"] + 0.05 and out[i + 1]["start"] >= b - 0.05:
                d = min(out[i]["end"] - out[i]["start"], max(0.05, out[i + 1]["start"] - b))
                out[i] = {**out[i], "start": round(b, 3), "end": round(b + d, 3)}
                break
    # keep order monotonic after the moves
    for i in range(1, len(out)):
        if out[i]["start"] < out[i - 1]["start"]:
            out[i - 1]["end"] = min(out[i - 1]["end"], out[i]["start"])
            out[i]["start"] = max(out[i]["start"], out[i - 1]["start"] + 0.02)
    return out


def duration(p):
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(p)], capture_output=True, text=True, check=True)
    return float(r.stdout.strip())


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("slug")
    ap.add_argument("--engine", choices=["chatterbox", "kokoro", "elevenlabs", "gemini", "openai", "edge", "file"], default="chatterbox")
    ap.add_argument("--ref", help="chatterbox: reference voice clip (~10 s, wav/mp3)")
    ap.add_argument("--audio", help="file engine: your own recording")
    ap.add_argument("--exaggeration", type=float, default=0.6, help="chatterbox emotion 0.25–1.0 (0.5 neutral)")
    ap.add_argument("--cfg", type=float, default=0.4, help="chatterbox pacing/adherence; lower = faster, livelier")
    ap.add_argument("--seed", type=int, default=3)
    ap.add_argument("--device", choices=["cpu", "mps", "cuda"], default="cpu", help="chatterbox: cpu is slower but needs ~half the memory; cuda on a cloud GPU")
    ap.add_argument("--voice", help="edge voice (default en-US-AndrewNeural), openai (onyx), gemini (Charon), kokoro (am_michael), elevenlabs voice id (Alex)")
    ap.add_argument("--model", help="elevenlabs: eleven_multilingual_v2 (default) or eleven_v3 ([tags]); gemini: gemini-3.8-flash-tts (default), gemini-3.1-flash-tts-preview, gemini-2.5-flash-preview-tts (follows --style)")
    ap.add_argument("--style", default="", help="gemini 2.5 director's note, e.g. 'relaxed YouTube explainer, warm, dry humor'")
    ap.add_argument("--stability", type=float, help="elevenlabs stability (v3: 0 creative, 0.5 natural, 1 robust)")
    ap.add_argument("--speed", type=float, default=1.0, help="tempo after TTS (pitch kept); 1.0 = natural")
    ap.add_argument("--pitch", type=float, help="semitones after TTS (tempo kept); default -1 for chatterbox (the picked voice, 2026-10-24), 0 otherwise")
    ap.add_argument("--gap", type=float, default=0.24, help="chatterbox/kokoro/gemini: pause between sentences (s)")
    ap.add_argument("--beat-gap", type=float, default=0.45, help="chatterbox/kokoro/gemini: pause between blocks of beats (s)")
    ap.add_argument("--resnap", action="store_true", help="only re-run the pause correction on existing words.json")
    ap.add_argument("--preview", type=int, help="only the first N beats → out/voices/preview_<tag>.mp3 (no word timing)")
    ap.add_argument("--tag", default="x", help="name for --preview output")
    a = ap.parse_args()
    global PITCH
    PITCH = a.pitch if a.pitch is not None else (-1.0 if a.engine == "chatterbox" else 0.0)
    if a.resnap:
        wj = ROOT / "public" / "episodes" / a.slug / "words.json"
        wj.write_text(json.dumps(snap_to_silences(json.loads(wj.read_text()), ROOT / "public" / "episodes" / a.slug / "vo.mp3"), indent=1))
        print(f"re-snapped {wj}")
        return
    if a.engine in ("chatterbox", "file"):
        preflight()
    if not a.voice:
        a.voice = {"openai": "onyx", "gemini": "Charon", "kokoro": "am_michael", "elevenlabs": "InRyolULHTXjegISsXuJ"}.get(a.engine, "en-US-AndrewNeural")

    out = ROOT / "public" / "episodes" / a.slug
    out.mkdir(parents=True, exist_ok=True)
    beats = read_beats(a.slug)
    if a.preview:
        prev = ROOT / "out" / "voices" / f"preview_{a.tag}.mp3"
        prev.parent.mkdir(parents=True, exist_ok=True)
        with tempfile.TemporaryDirectory() as td:
            raw = pathlib.Path(td) / "raw.wav"
            tts_chatterbox(beats[: a.preview], raw, a.ref, a.exaggeration, a.cfg, a.seed, a.device, (a.gap, a.beat_gap))
            finish(raw, prev, a.speed)
        print(f"preview -> {prev}")
        return
    script_text = " ".join(" ".join(b) for b in beats)
    tokens = script_text.split()
    mp3 = out / "vo.mp3"

    with tempfile.TemporaryDirectory() as td:
        if a.engine == "elevenlabs":
            raw = pathlib.Path(td) / "raw.wav"
            a.model = a.model or "eleven_multilingual_v2"
            native = not a.model.startswith("eleven_v3")  # v2 changes tempo itself, v3 via ffmpeg
            heard = tts_elevenlabs(beats, raw, a.voice, a.model, a.speed if native else 1.0, a.stability, gap_beat=a.beat_gap)
            tempo = 1.0 if native else a.speed
            finish(raw, mp3, tempo)
            heard = [{**w, "start": w["start"] / tempo, "end": w["end"] / tempo} for w in heard]
            tokens = EL_TAG.sub("", script_text).split()  # captions never show the delivery tags
            report_mismatches(tokens, heard)
            words = snap_to_silences(align(tokens, heard), mp3)
        elif a.engine == "edge":
            raw = pathlib.Path(td) / "raw.mp3"
            words = align(tokens, tts_edge(beats, raw, a.voice))  # re-attach the script's punctuation
            finish(raw, mp3, a.speed)
            words = [{**w, "start": round(w["start"] / a.speed, 3), "end": round(w["end"] / a.speed, 3)} for w in words]
        else:
            if a.engine == "chatterbox":
                raw = pathlib.Path(td) / "raw.wav"
                tts_chatterbox(beats, raw, a.ref, a.exaggeration, a.cfg, a.seed, a.device, (a.gap, a.beat_gap))
            elif a.engine == "kokoro":
                raw = pathlib.Path(td) / "raw.wav"
                tts_kokoro(beats, raw, a.voice, gap_sentence=a.gap, gap_beat=a.beat_gap)
            elif a.engine == "gemini":
                raw = pathlib.Path(td) / "raw.wav"
                tts_gemini(beats, raw, a.voice, gap_beat=a.beat_gap, gap_sentence=a.gap, model=a.model or "gemini-3.8-flash-tts", style=a.style)
            elif a.engine == "openai":
                raw = pathlib.Path(td) / "raw.wav"
                tts_openai(beats, raw, a.voice)
            else:
                raw = pathlib.Path(a.audio)
            finish(raw, mp3, a.speed)
            print("  aligning words…", flush=True)
            heard = whisper_words(mp3, script_text)
            report_mismatches(tokens, heard)
            words = snap_to_silences(align(tokens, heard), mp3)

    (out / "words.json").write_text(json.dumps(words, indent=1))
    print(f"{a.engine}: {len(words)} words, {duration(mp3):.2f}s -> {mp3}")


if __name__ == "__main__":
    main()
