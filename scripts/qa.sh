#!/bin/zsh
# QA for a rendered reel: contact sheet (1 frame/s), loop seam check, audio + length report.
# Usage: scripts/qa.sh out/<slug>.mp4
set -e
IN=$1
[[ -f $IN ]] || { echo "usage: scripts/qa.sh out/<slug>.mp4"; exit 1; }
BASE=${IN:r}
mkdir -p $BASE.qa
DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 $IN)
echo "duration: ${DUR}s"
ffprobe -v error -select_streams v:0 -show_entries stream=width,height,r_frame_rate -of csv=p=0 $IN | sed 's/^/video: /'
ffprobe -v error -select_streams a:0 -show_entries stream=codec_name -of csv=p=0 $IN | sed 's/^/audio: /'

# contact sheets, 12 frames each
ffmpeg -v error -y -i $IN -vf "fps=1,scale=270:-1,tile=6x2" $BASE.qa/sheet_%02d.jpg
echo "sheets: $(ls $BASE.qa/sheet_*.jpg | wc -l | tr -d ' ') in $BASE.qa/"

# loop seam: first vs last frame (PSNR > 30 dB ≈ visually identical)
ffmpeg -v error -y -i $IN -vf "select=eq(n\,0)" -frames:v 1 $BASE.qa/first.png
# last frame by count (seeking from the end missed it when the audio track runs longer)
NF=$(ffprobe -v error -count_frames -select_streams v:0 -show_entries stream=nb_read_frames -of csv=p=0 $IN)
ffmpeg -v error -y -i $IN -vf "select=eq(n\\,$((NF - 1)))" -frames:v 1 $BASE.qa/last.png
PSNR=$(ffmpeg -i $BASE.qa/first.png -i $BASE.qa/last.png -lavfi psnr -f null - 2>&1 | grep -o "average:[0-9.inf]*" | cut -d: -f2)
echo "loop seam PSNR first↔last: ${PSNR} dB (≥30 = seamless)"

# loudness (target around -14 LUFS for social)
ffmpeg -nostats -i $IN -af ebur128=framelog=quiet -f null - 2>&1 | grep -E "^ +I:" | tail -1 | sed 's/^ */loudness /'

# flicker: pixels that flip A→B→A (z-fighting, render-tab state bugs, strobes)
.venv/bin/python scripts/flicker.py $IN || true
