#!/usr/bin/env python3
"""Google Gemini TTS (free tier with an AI Studio key in GEMINI_API_KEY; the key goes in a header,
never in a URL or a file).

  python3 scripts/gemini_tts.py --text-file scripts/tts_samples/text.txt --voices Charon,Algenib \
      --out out/voices/gemini [--model gemini-3.8-flash-tts] [--style "..."]

Writes <out>/<model>_<voice>.wav (24 kHz mono). The style line steers delivery like a director's note.
"""
import argparse
import base64
import json
import os
import pathlib
import subprocess
import time
import urllib.request

STYLE = ("Read aloud in a calm, low, unhurried storytelling voice, like telling a true story late at night, "
         "with natural pauses and a little tension, never dramatic")


def speak(text, voice, model, style, out_wav):
    key = os.environ["GEMINI_API_KEY"]
    body = {
        # 2.5 TTS models treat a "Say …:" prefix as direction; the 3.x ones read it aloud and refuse
        # system instructions, so they get the bare text (their default delivery is already natural)
        "contents": [{"parts": [{"text": f"{style}: {text}" if model.startswith("gemini-2.5") and style else text}]}],
        "generationConfig": {
            "responseModalities": ["AUDIO"],
            "speechConfig": {"voiceConfig": {"prebuiltVoiceConfig": {"voiceName": voice}}},
        },
    }
    req = urllib.request.Request(
        f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
        data=json.dumps(body).encode(),
        headers={"Content-Type": "application/json", "x-goog-api-key": key},
    )
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=600) as r:
                res = json.loads(r.read())
            break
        except TimeoutError:
            raise SystemExit(f"{voice}: no answer within 10 min")
        except urllib.error.HTTPError as e:  # 429 on the free tier → wait and retry
            if e.code == 429 and attempt < 3:
                time.sleep(20 * (attempt + 1))
                continue
            raise SystemExit(f"{voice}: HTTP {e.code} {e.read()[:300]!r}")
    pcm = base64.b64decode(res["candidates"][0]["content"]["parts"][0]["inlineData"]["data"])
    raw = out_wav.with_suffix(".pcm")
    raw.write_bytes(pcm)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "s16le", "-ar", "24000", "-ac", "1", "-i", str(raw), str(out_wav)], check=True)
    raw.unlink()


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--text-file", required=True)
    ap.add_argument("--voices", default="Charon")
    ap.add_argument("--model", default="gemini-3.8-flash-tts")
    ap.add_argument("--style", default=STYLE)
    ap.add_argument("--out", default="out/voices/gemini")
    a = ap.parse_args()
    out = pathlib.Path(a.out)
    out.mkdir(parents=True, exist_ok=True)
    text = pathlib.Path(a.text_file).read_text().strip()
    for v in a.voices.split(","):
        wav = out / f"{a.model}_{v}.wav"
        speak(text, v, a.model, a.style, wav)
        print("ok", wav, flush=True)
