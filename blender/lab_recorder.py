"""Look-dev for the recorder model: three angles under neutral studio light.
  blender -b -P blender/lab_recorder.py   → out/stills/bbb/lab_recorder_{0,1,2}.jpg
"""
import math
import os
import sys

import bpy

sys.path.insert(0, os.path.dirname(__file__))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "models"))
import common as C  # noqa: E402
import recorder  # noqa: E402

sc = C.new_scene("lab", 1, 1, res=50, samples=32)
C.world_hdri(sc, "industrial_workshop_foundry_1k.hdr", strength=0.6)
C.cube("floor", (4, 4, 0.01), (0, 0, -0.005), C.mat("floor", (0.18, 0.18, 0.19), rough=0.5))
root, P = recorder.build("rec")
bpy.ops.object.light_add(type="AREA", location=(0.5, -0.8, 0.9))
k = bpy.context.object
k.data.energy = 40
k.data.size = 0.8
import mathutils  # noqa: E402

k.rotation_euler = (mathutils.Vector((0, 0, 0.08)) - k.location).to_track_quat("-Z", "Y").to_euler()
cam = C.camera(sc, lens=50, fstop=4)
for i, pos in enumerate(((0.75, -0.9, 0.35), (0.05, -1.0, 0.25), (1.1, 0.0, 0.3))):
    C.aim(cam, pos, (0.05, 0, 0.08))
    sc.render.filepath = os.path.join(C.ROOT, "out", "stills", "bbb", f"lab_recorder_{i}.jpg")
    bpy.ops.render.render(write_still=True)
print("DONE")
