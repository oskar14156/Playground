#!/usr/bin/env bash
# One-time setup (macOS or Linux).
#   scripts/setup.sh                  Node deps + light Python env (edge-tts, numpy, Pillow)
#   scripts/setup.sh --local-voice    + Chatterbox voice + local Whisper (~3 GB download, 16 GB RAM)
# Needs: Node 18+, ffmpeg, Python 3.11 or 3.12. Blender 4.2+ only for the Blender pipeline.
set -e
cd "$(dirname "$0")/.."

command -v node >/dev/null || { echo "Node 18+ missing: https://nodejs.org (or brew install node)"; exit 1; }
command -v ffmpeg >/dev/null || { echo "ffmpeg missing: brew install ffmpeg  /  sudo apt install ffmpeg"; exit 1; }
PYBIN=""
for v in python3.12 python3.11; do command -v $v >/dev/null && PYBIN=$v && break; done
[ -n "$PYBIN" ] || { echo "Python 3.11 or 3.12 missing (Chatterbox/torch need it): brew install python@3.12"; exit 1; }

echo "→ npm ci"
npm ci --no-audit --no-fund

echo "→ Python env .venv-tts ($PYBIN)"
[ -d .venv-tts ] || $PYBIN -m venv .venv-tts
.venv-tts/bin/pip install -q --upgrade pip
.venv-tts/bin/pip install -q edge-tts numpy pillow
[ -e .venv ] || ln -s .venv-tts .venv   # older scripts call .venv/bin/python

if [ "$1" = "--local-voice" ]; then
  echo "→ Chatterbox + Whisper (large download)"
  .venv-tts/bin/pip install -q chatterbox-tts==0.1.7 openai-whisper librosa
fi

echo "→ sound library"
[ -f public/sfx/whoosh.wav ] || .venv-tts/bin/python scripts/sfx.py
chmod +x scripts/*.sh
echo
scripts/doctor.sh
