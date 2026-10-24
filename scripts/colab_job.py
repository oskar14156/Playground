"""Blender render job for a Google Colab GPU VM, driven by the official Colab CLI.

  colab new -s render --gpu L4
  JOB='{"script":"volcano","args":"--stills 330 --res 50"}' \
    colab exec -s render -f <(sed "s|__JOB__|$JOB|" scripts/colab_job.py)   # see scripts/colab_render.sh
  colab download -s render /content/out.tar out/colab/
  colab stop -s render

The VM pulls the code from the public mirror (branch `motionshorts` of oskar14156/Playground),
installs Blender once per VM, renders, and packs public/<plate>/ + out/stills/ into /content/out.tar.
"""
import json
import os
import subprocess
import time

JOB = json.loads('__JOB__')
REPO = "https://github.com/oskar14156/Playground.git"
BL = "/content/blender/blender"
SRC = "/content/ms"


def sh(cmd, show=True):
    p = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    if show and (p.stdout.strip() or p.stderr.strip()):
        print((p.stdout + p.stderr).strip()[-2000:], flush=True)
    return p


t0 = time.time()
if not os.path.isdir(SRC):
    sh(f"git clone -q --depth 1 -b {JOB.get('ref', 'motionshorts')} {REPO} {SRC}")
else:
    sh(f"git -C {SRC} fetch -q --depth 1 origin {JOB.get('ref', 'motionshorts')} && git -C {SRC} reset -q --hard FETCH_HEAD")
if not os.path.exists(BL):
    sh("apt-get -qq install -y libegl1 libxi6 libxkbcommon0 libxrender1 libxxf86vm1 libsm6 libxfixes3 >/dev/null 2>&1", show=False)
    sh("mkdir -p /content/blender && curl -sL https://download.blender.org/release/Blender5.2/blender-5.2.3-linux-x64.tar.xz | tar -xJ -C /content/blender --strip-components=1")
print("setup", round(time.time() - t0), "s;", sh("nvidia-smi --query-gpu=name,memory.total --format=csv,noheader", show=False).stdout.strip(), flush=True)

t1 = time.time()
cmd = f"cd {SRC} && {BL} -b -P blender/{JOB['script']}.py -- {JOB['args']}"
proc = subprocess.Popen(cmd, shell=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
for line in proc.stdout:
    if any(k in line for k in ("BUILT", "STILL", "RENDERED", "BAKED", "DONE", "Error", "Traceback", "File \"", "GPU", "EGL", "Vulkan", "OpenGL")):
        print(line.rstrip(), flush=True)
proc.wait()
print("render", round(time.time() - t1), "s, exit", proc.returncode, flush=True)
plate = JOB.get("plate", "")
sh(f"cd {SRC} && tar -cf /content/out.tar {'public/' + plate if plate else ''} out/stills 2>/dev/null; ls -la /content/out.tar")
