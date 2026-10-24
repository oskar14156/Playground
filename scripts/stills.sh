#!/bin/zsh
# Review stills: renders the given frames of a composition and tiles them into one sheet.
# Usage: scripts/stills.sh <composition> <frame> [frame …]   → out/stills/<composition>/sheet.jpg
set -e
COMP=$1; shift
DIR=out/stills/$COMP
mkdir -p $DIR
setopt null_glob; rm -f $DIR/f_*.jpg; unsetopt null_glob
for fr in "$@"; do
  npx remotion still $COMP $DIR/f_$(printf %04d $fr).jpg --frame=$fr --scale=0.4 --log=error >/dev/null 2>&1 || echo "FAIL frame $fr"
done
N=$#
COLS=$(( N < 6 ? N : 6 ))
ROWS=$(( (N + COLS - 1) / COLS ))
ffmpeg -v error -y -pattern_type glob -i "$DIR/f_*.jpg" -vf "scale=270:480,tile=${COLS}x${ROWS}:padding=4" -frames:v 1 $DIR/sheet.jpg
echo "$DIR/sheet.jpg  (frames: $*)"
