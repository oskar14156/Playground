#!/usr/bin/env bash
# Render a Blender job on a Colab GPU with the official Colab CLI, then fetch the result.
#   scripts/colab_render.sh <session> <gpu> '<job json>' <out dir>
#   scripts/colab_render.sh vob L4 '{"script":"volcano","args":"--render --draft","plate":"vob"}' out/colab/vob
# The job runs detached on the VM (scripts/colab_job.py); this script polls its log once a minute
# (sleeping, not busy-waiting), downloads /content/out.tar, unpacks it and always stops the VM.
set -u
S=$1 GPU=$2 JOB=$3 OUT=$4
C="colab --auth=adc"
mkdir -p "$OUT"
trap '$C stop -s "$S" >/dev/null 2>&1; echo "[colab_render] VM stopped"' EXIT
$C sessions 2>/dev/null | grep -q "\[$S\]" || $C new -s "$S" --gpu "$GPU" 2>&1 | tail -1
TMP=$(mktemp -t colabjob).py
sed "s|__JOB__|$JOB|" "$(dirname "$0")/colab_job.py" > "$TMP"
$C exec -s "$S" -f "$TMP" 2>&1 | tail -3
POLL='import os;l=open("/content/job.log").read().splitlines() if os.path.exists("/content/job.log") else [];print(len([x for x in l if "Saved:" in x]),"frames |",(l[-1] if l else "")[:160]);print("DONE" if os.path.exists("/content/job.done") else "RUNNING")'
while true; do
  sleep 60
  R=$(echo "$POLL" | $C exec -s "$S" 2>&1 | tail -2)
  echo "$(date +%T) $R" | head -1
  echo "$R" | grep -q DONE && break
done
echo 'print(open("/content/job.log").read()[-3000:])' | $C exec -s "$S" 2>&1 | grep -vE "Saved:" | tail -25
$C download -s "$S" /content/out.tar "$OUT/out.tar" 2>&1 | tail -1
tar -xf "$OUT/out.tar" -C "$OUT" && rm "$OUT/out.tar"
$C usage 2>&1 | tail -2
