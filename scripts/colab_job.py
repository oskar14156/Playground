"""Blender render job for a Google Colab GPU VM, driven by the official Colab CLI.

  colab new -s render --gpu L4
  JOB='{"script":"volcano","args":"--stills 330 --res 50"}' \
    colab exec -s render -f <(sed "s|__JOB__|$JOB|" scripts/colab_job.py)   # see scripts/colab_render.sh
  colab download -s render /content/out.tar out/colab/
  colab stop -s render

Poll:  echo 'import os;print(open("/content/job.log").read()[-1500:], os.path.exists("/content/job.done"))' | colab exec -s render

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

# Colab ships the NVIDIA user-space libs in /usr/lib64-nvidia but no EGL vendor file, so Blender's
# EEVEE falls back to Mesa software rendering (EGL_BAD_MATCH). Register the NVIDIA EGL ICD and put
# the libs on the path; the same path also provides libnvoptix for Cycles OptiX.
NV = "/usr/lib64-nvidia"
if os.path.isdir(NV):
    os.makedirs("/usr/share/glvnd/egl_vendor.d", exist_ok=True)
    open("/usr/share/glvnd/egl_vendor.d/10_nvidia.json", "w").write('{"file_format_version":"1.0.0","ICD":{"library_path":"libEGL_nvidia.so.0"}}')
    print("nvidia libs:", sh(f"ls {NV} | grep -iE 'egl|optix|glx' | tr '\\n' ' '", show=False).stdout.strip(), flush=True)
ENV = f"export LD_LIBRARY_PATH={NV}:$LD_LIBRARY_PATH __EGL_VENDOR_LIBRARY_FILENAMES=/usr/share/glvnd/egl_vendor.d/10_nvidia.json; "

# run Blender detached: `colab exec` busy-waits at 100 % local CPU while a cell runs, so the
# cell returns at once and the agent polls /content/job.log with short execs instead
plate = JOB.get("plate", "")
runner = ENV + f"""cd {SRC} && rm -f /content/job.done && START=$(date +%s) && \\
{BL} -b -P blender/{JOB['script']}.py -- {JOB['args']} 2>&1 | grep --line-buffered -E 'BUILT|STILL|RENDERED|BAKED|DONE|Error|Traceback|File "|Saved:|CYCLES GPU' | while read -r l; do echo "$(date +%T) $l"; done > /content/job.log; \\
echo "render $(( $(date +%s) - START )) s" >> /content/job.log; \\
tar -cf /content/out.tar {'public/' + plate if plate else ''} out/stills 2>/dev/null; touch /content/job.done"""
open("/content/run.sh", "w").write(runner)
subprocess.Popen(["bash", "/content/run.sh"], start_new_session=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
print("started", flush=True)
