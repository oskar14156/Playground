"""Generate label textures for the recorder (run with any Python that has Pillow).

  .venv-tts/bin/python blender/make_labels.py
"""
import os

from PIL import Image, ImageDraw, ImageFont

OUT = os.path.join(os.path.dirname(__file__), "assets")
os.makedirs(OUT, exist_ok=True)


def font(size, bold=True):
    for path in [
        "/System/Library/Fonts/Supplemental/Arial Black.ttf",
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
    ]:
        if os.path.exists(path):
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


# CSMU wrap label: white with black stencil-style text, two lines, slightly worn edges
W, H = 2048, 1024
img = Image.new("RGB", (W, H), (236, 234, 228))
d = ImageDraw.Draw(img)
for txt, y, size in (("FLIGHT RECORDER", 360, 160), ("DO NOT OPEN", 660, 175)):
    f = font(size)
    w = d.textlength(txt, font=f)
    d.text(((W - w) / 2, y - size / 2), txt, fill=(18, 18, 18), font=f)
d.rectangle([0, 0, W - 1, H - 1], outline=(200, 196, 188), width=18)
img.save(os.path.join(OUT, "csmu_label.png"))

# small engraved data plate
W, H = 1100, 500
img = Image.new("RGB", (W, H), (178, 182, 186))
d = ImageDraw.Draw(img)
d.rectangle([12, 12, W - 13, H - 13], outline=(60, 62, 66), width=6)
f1, f2 = font(64), font(40)
d.text((50, 50), "SOLID STATE FLIGHT DATA RECORDER", fill=(30, 32, 36), font=f2)
rows = ["PART NO.  0000-0000-000", "SERIAL NO.  000000", "CRASH PROTECTED  ED-112A", "MFG DATE  ----"]
for i, r in enumerate(rows):
    d.text((50, 140 + i * 78), r, fill=(40, 42, 46), font=f2)
img.save(os.path.join(OUT, "data_plate.png"))
# aluminium honeycomb (hex cells), tileable-ish, used for the impact target
import math
W = H = 1024
img = Image.new("RGB", (W, H), (30, 30, 32))
d = ImageDraw.Draw(img)
r = 38
for row in range(-1, int(H / (r * 1.5)) + 2):
    for col in range(-1, int(W / (r * math.sqrt(3))) + 2):
        cx = col * r * math.sqrt(3) + (row % 2) * r * math.sqrt(3) / 2
        cy = row * r * 1.5
        pts = [(cx + r * math.cos(math.radians(60 * k + 30)), cy + r * math.sin(math.radians(60 * k + 30))) for k in range(6)]
        d.polygon(pts, outline=(225, 228, 232), width=7)
img.save(os.path.join(OUT, "honeycomb.png"))
print("labels written to", OUT)
