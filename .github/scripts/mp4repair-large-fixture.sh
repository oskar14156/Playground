#!/usr/bin/env bash
set -euo pipefail
# Prepare a genuine long H.264 recording, then remove only its MP4 index.
# Video is generated entirely within Playground; no user content involved.
OUT=/tmp/mp4repair-large
mkdir -p "$OUT"
ffmpeg -hide_banner -loglevel error -nostdin -y \
  -f lavfi -i 'testsrc2=size=1280x720:rate=30:duration=8' \
  -vf 'noise=alls=8:allf=t+u' -c:v libx264 -threads 2 \
  -preset ultrafast -crf 21 -pix_fmt yuv420p \
  -movflags +faststart "$OUT/reference.mp4"
python3 - <<'PY'
import os
size=os.path.getsize('/tmp/mp4repair-large/reference.mp4')
loops=max(2,int(1_030_000_000/size)+1)
print('REFERENCE_BYTES',size,'STREAM_LOOP',loops,flush=True)
with open('/tmp/mp4repair-large/repeats','w') as f:f.write(str(loops))
PY
LOOPS=$(cat "$OUT/repeats")
ffmpeg -hide_banner -loglevel error -nostdin -y \
  -stream_loop "$LOOPS" -i "$OUT/reference.mp4" -c copy \
  -movflags +faststart "$OUT/healthy.mp4"
python3 - <<'PY'
import os,struct,shutil
src='/tmp/mp4repair-large/healthy.mp4'
dst='/tmp/mp4repair-large/stress-broken.mp4'
size=os.path.getsize(src)
with open(src,'rb') as f,open(dst,'wb') as w:
    offset=0
    skipped=0
    while offset<size:
        f.seek(offset)
        h=f.read(8)
        if len(h)<8:raise Exception('Malformed atom')
        n,atom=struct.unpack('>I4s',h)
        if n==1:n=struct.unpack('>Q',f.read(8))[0]
        if n==0:n=size-offset
        if n<8 or offset+n>size:raise Exception('Bad box size '+str((n,atom,offset,size)))
        print('AT',atom,'LEN',n,flush=True)
        if atom==b'moov':
            skipped+=1
        else:
            f.seek(offset)
            remain=n
            while remain:
                b=f.read(min(8*1024*1024,remain))
                if not b:raise Exception('Incomplete copy')
                w.write(b);remain-=len(b)
        offset+=n
    if skipped!=1:raise Exception('Expected exactly 1 moov, found '+str(skipped))
broken=os.path.getsize(dst)
print('BROKEN_BYTES',broken,flush=True)
if broken<1_000_000_000:raise Exception('Generated video is too small for 1GB stress')
PY
rm -f "$OUT/healthy.mp4"
