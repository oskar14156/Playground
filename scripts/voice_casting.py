#!/usr/bin/env python3
"""Voice casting: the same lines in several Chatterbox voices, so the user can pick one.

Chatterbox ships one built-in voice; every other voice is cloned from a ~10 s reference clip.
Reference clips here are synthesised with edge-tts (no real person's voice is cloned) and
stored in voices/refs/<name>.wav — afterwards use one with:

  .venv-tts/bin/python scripts/voice.py <slug> --ref voices/refs/<name>.wav

Usage:
  .venv-tts/bin/python scripts/voice_casting.py [--only brian,ryan] [--text "…"]
Writes out/voices/<nn>_<name>.mp3 and out/voices/casting.mp3 (all, with a short gap).
"""
import argparse
import asyncio
import os
import pathlib
import subprocess
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from voice import ROOT, guard_memory, preflight, trim_silence  # noqa: E402

# name -> edge voice used to synthesise the reference clip (None = Chatterbox's built-in voice)
CAST = {
    "default": None,
    "andrew": "en-US-AndrewNeural",
    "brian": "en-US-BrianNeural",
    "christopher": "en-US-ChristopherNeural",
    "guy": "en-US-GuyNeural",
    "eric": "en-US-EricNeural",
    "ryan-uk": "en-GB-RyanNeural",
    "thomas-uk": "en-GB-ThomasNeural",
    "ava": "en-US-AvaNeural",
    "sonia-uk": "en-GB-SoniaNeural",
}

# narration-style reference text (~12 s): varied sounds, a question, a number
REF_TEXT = (
    "Deep under the Atlantic, a steel tube rests on the sand. Nobody inside can see out. "
    "So how do they get home? The answer takes about twenty seconds, and it is completely insane."
)

SAMPLE = (
    "Black boxes aren't black. They're bright orange, and they sit in the tail. "
    "Inside is a memory chip built to survive 3,400 g. But there's a catch."
)


async def _edge(text, voice, mp3):
    import edge_tts

    await edge_tts.Communicate(text, voice).save(str(mp3))


def make_ref(name, voice):
    refs = ROOT / "voices" / "refs"
    refs.mkdir(parents=True, exist_ok=True)
    wav = refs / f"{name}.wav"
    if wav.exists():
        return wav
    mp3 = refs / f"{name}.mp3"
    for attempt in range(5):
        try:
            asyncio.run(_edge(REF_TEXT, voice, mp3))
            break
        except Exception:
            if attempt == 4:
                raise
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(mp3), "-ac", "1", "-ar", "24000", str(wav)], check=True)
    mp3.unlink()
    return wav


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", help="comma-separated names from CAST")
    ap.add_argument("--text", default=SAMPLE)
    ap.add_argument("--exaggeration", type=float, default=0.6)
    ap.add_argument("--cfg", type=float, default=0.4)
    a = ap.parse_args()
    preflight()
    names = a.only.split(",") if a.only else list(CAST)

    refs = {n: (make_ref(n, CAST[n]) if CAST[n] else None) for n in names}

    guard_memory("casting")
    import numpy as np
    import torch
    import torchaudio
    from chatterbox.tts import ChatterboxTTS

    torch.set_num_threads(4)
    model = ChatterboxTTS.from_pretrained(device="cpu")
    builtin = model.conds
    out = ROOT / "out" / "voices"
    out.mkdir(parents=True, exist_ok=True)
    files = []
    for i, n in enumerate(names, 1):
        if refs[n]:
            model.prepare_conditionals(str(refs[n]), exaggeration=a.exaggeration)
        else:
            model.conds = builtin
        torch.manual_seed(7)
        with torch.inference_mode():
            wav = model.generate(a.text, exaggeration=a.exaggeration, cfg_weight=a.cfg, temperature=0.8)
        w = trim_silence(wav.squeeze(0).numpy(), model.sr)
        tmp = out / f"_{n}.wav"
        torchaudio.save(str(tmp), torch.from_numpy(w).unsqueeze(0).float(), model.sr)
        mp3 = out / f"{i:02d}_{n}.mp3"
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(tmp), "-filter:a", "atempo=1.05,loudnorm=I=-14:TP=-1.5", "-ar", "48000", str(mp3)], check=True)
        tmp.unlink()
        files.append(mp3)
        print(f"  {i:02d} {n}", flush=True)

    # one file with all voices, 1 s apart, in order
    lst = out / "_list.txt"
    gap = out / "_gap.mp3"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "lavfi", "-i", "anullsrc=r=48000:cl=mono", "-t", "1", str(gap)], check=True)
    lst.write_text("".join(f"file '{f}'\nfile '{gap}'\n" for f in files))
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(lst), "-ac", "1", str(out / "casting.mp3")], check=True)
    lst.unlink()
    gap.unlink()
    print(f"done -> {out}")


if __name__ == "__main__":
    main()
