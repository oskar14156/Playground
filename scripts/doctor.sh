#!/usr/bin/env bash
# What can this machine do? Run first in every new session (agents: read the VOICE line).
#   scripts/doctor.sh
# Prints one line per tool and a final "VOICE: <engine>" recommendation:
#   chatterbox  local model installed → use it (best, free)
#   openai      OPENAI_API_KEY is set → --engine openai (natural, a few cents per video)
#   ask         neither → ASK the user: set an OpenAI key, install the local model
#               (scripts/setup.sh --local-voice, ~3 GB), or use free edge-tts (--engine edge)
cd "$(dirname "$0")/.." || exit 1
ok() { printf "  %-12s %s\n" "$1" "$2"; }
PY=.venv-tts/bin/python

ok node "$(node --version 2>/dev/null || echo 'MISSING — install Node 18+')"
ok ffmpeg "$(ffmpeg -version 2>/dev/null | head -1 | awk '{print $3}' || true)"
ffmpeg -version >/dev/null 2>&1 || ok ffmpeg "MISSING — brew install ffmpeg / apt install ffmpeg"
[ -d node_modules ] && ok npm-deps "installed" || ok npm-deps "MISSING — run scripts/setup.sh"
if [ -x $PY ]; then
  ok python "$($PY --version 2>&1)"
  $PY -c "import edge_tts" 2>/dev/null && ok edge-tts "yes (free fallback voice)" || ok edge-tts "no"
  $PY -c "import chatterbox" 2>/dev/null && CB=1 && ok chatterbox "yes (local voice)" || ok chatterbox "no (scripts/setup.sh --local-voice)"
  $PY -c "import whisper" 2>/dev/null && ok whisper "yes (local word timing)" || ok whisper "no (word timing via OpenAI API if a key is set)"
else
  ok python "MISSING — run scripts/setup.sh"
fi
[ -n "$OPENAI_API_KEY" ] && ok openai-key "set" || ok openai-key "not set"
BL=$(command -v blender || ls /Applications/Blender.app/Contents/MacOS/Blender 2>/dev/null)
[ -n "$BL" ] && ok blender "$("$BL" --version 2>/dev/null | head -1)" || ok blender "not installed (only needed for the Blender pipeline)"
ok disk "$(df -h . | tail -1 | awk '{print $4}') free (keep ≥ 10 GB)"
if [ "$(uname)" = Darwin ]; then
  ok ram "$(( $(sysctl -n hw.memsize) / 1073741824 )) GB, $(sysctl -n kern.memorystatus_level)% available"
else
  ok ram "$(free -g | awk '/Mem:/{print $2" GB, "$7" GB available"}')"
fi

if [ -n "$CB" ]; then echo "VOICE: chatterbox"
elif [ -n "$OPENAI_API_KEY" ]; then echo "VOICE: openai"
else echo "VOICE: ask"; fi
