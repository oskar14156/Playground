#!/usr/bin/env python3
"""Voiceover + word timings for a reel.

Reads videos/<slug>/script.txt (spoken lines; '#' lines are beat names, blank lines are
beat breaks) and writes:

  public/<slug>/vo.mp3      the voiceover, -14 LUFS
  public/<slug>/words.json  [{ "word": str, "start": sec, "end": sec }, ...]

Engines (scripts/doctor.sh tells which ones this machine can use):
  chatterbox  local, natural (default). --ref voice.wav clones a voice from ~10 s of audio
              (only use voices you have the rights to, e.g. your own). Needs setup.sh --local-voice.
  openai      OpenAI TTS (gpt-4o-mini-tts), natural, needs OPENAI_API_KEY (paid API, a few
              cents per video). --voice onyx|ash|echo|… ; word timing via the OpenAI
              transcription API when local Whisper isn't installed.
  edge        Microsoft edge-tts, free, fast, more robotic.
  file        you recorded it yourself: --audio take.m4a, this only aligns the words.

Usage (always with the TTS venv):
  .venv-tts/bin/python scripts/voice.py <slug> [--engine chatterbox] [--ref voices/me.wav]
      [--exaggeration 0.6] [--speed 1.05] [--seed 3] [--voice en-US-AndrewNeural]

Word timings for chatterbox/file come from Whisper (word_timestamps) aligned back onto the
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
    src = (ROOT / "videos" / slug / "script.txt").read_text()
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
    except ImportError:  # light install: no local Whisper → use the API if a key is there
        if os.environ.get("OPENAI_API_KEY"):
            return openai_words(audio_path, script_text)
        raise SystemExit("word timing needs local Whisper (setup.sh --local-voice) or OPENAI_API_KEY")
    guard_memory("whisper")

    model = whisper.load_model("small", device="cpu")
    res = model.transcribe(str(audio_path), word_timestamps=True, initial_prompt=script_text, fp16=False)
    return [{"word": w["word"].strip(), "start": w["start"], "end": w["end"]} for s in res["segments"] for w in s["words"]]


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
        if said and not any(ch.isdigit() for ch in said):
            bad.append(f"'{said}' → heard '{' '.join(w['word'] for w in heard[j1:j2])}'")
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
    ap.add_argument("--engine", choices=["chatterbox", "openai", "edge", "file"], default="chatterbox")
    ap.add_argument("--ref", help="chatterbox: reference voice clip (~10 s, wav/mp3)")
    ap.add_argument("--audio", help="file engine: your own recording")
    ap.add_argument("--exaggeration", type=float, default=0.6, help="chatterbox emotion 0.25–1.0 (0.5 neutral)")
    ap.add_argument("--cfg", type=float, default=0.4, help="chatterbox pacing/adherence; lower = faster, livelier")
    ap.add_argument("--seed", type=int, default=3)
    ap.add_argument("--device", choices=["cpu", "mps"], default="cpu", help="chatterbox: cpu is slower but needs ~half the memory")
    ap.add_argument("--voice", help="edge voice (default en-US-AndrewNeural) or openai voice (default onyx)")
    ap.add_argument("--speed", type=float, default=1.0, help="tempo after TTS (pitch kept); 1.0 = natural")
    ap.add_argument("--pitch", type=float, help="semitones after TTS (tempo kept); default -1 for chatterbox (the picked voice, 2026-10-24), 0 otherwise")
    ap.add_argument("--gap", type=float, default=0.24, help="chatterbox: pause between sentences (s)")
    ap.add_argument("--beat-gap", type=float, default=0.45, help="chatterbox: pause between blocks of beats (s)")
    ap.add_argument("--resnap", action="store_true", help="only re-run the pause correction on existing words.json")
    ap.add_argument("--preview", type=int, help="only the first N beats → out/voices/preview_<tag>.mp3 (no word timing)")
    ap.add_argument("--tag", default="x", help="name for --preview output")
    a = ap.parse_args()
    global PITCH
    PITCH = a.pitch if a.pitch is not None else (-1.0 if a.engine == "chatterbox" else 0.0)
    if a.resnap:
        wj = ROOT / "public" / a.slug / "words.json"
        wj.write_text(json.dumps(snap_to_silences(json.loads(wj.read_text()), ROOT / "public" / a.slug / "vo.mp3"), indent=1))
        print(f"re-snapped {wj}")
        return
    if a.engine in ("chatterbox", "file"):
        preflight()
    if not a.voice:
        a.voice = "onyx" if a.engine == "openai" else "en-US-AndrewNeural"

    out = ROOT / "public" / a.slug
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
        if a.engine == "edge":
            raw = pathlib.Path(td) / "raw.mp3"
            words = align(tokens, tts_edge(beats, raw, a.voice))  # re-attach the script's punctuation
            finish(raw, mp3, a.speed)
            words = [{**w, "start": round(w["start"] / a.speed, 3), "end": round(w["end"] / a.speed, 3)} for w in words]
        else:
            if a.engine == "chatterbox":
                raw = pathlib.Path(td) / "raw.wav"
                tts_chatterbox(beats, raw, a.ref, a.exaggeration, a.cfg, a.seed, a.device, (a.gap, a.beat_gap))
            elif a.engine == "openai":
                raw = pathlib.Path(td) / "raw.wav"
                tts_openai(beats, raw, a.voice)
            else:
                raw = pathlib.Path(a.audio)
            finish(raw, mp3, a.speed)
            print("  aligning words with whisper…", flush=True)
            heard = whisper_words(mp3, script_text)
            report_mismatches(tokens, heard)
            words = snap_to_silences(align(tokens, heard), mp3)

    (out / "words.json").write_text(json.dumps(words, indent=1))
    print(f"{a.engine}: {len(words)} words, {duration(mp3):.2f}s -> {mp3}")


if __name__ == "__main__":
    main()
