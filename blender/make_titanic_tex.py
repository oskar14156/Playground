"""Side texture atlas for the Titanic model (run with any Python that has Pillow).

  .venv-tts/bin/python blender/make_titanic_tex.py

The atlas covers the ship's side: u = (x + L/2) / L along the length, v = (z - Z0) / (Z1 - Z0)
in height. Hull and superstructure share it, so one image paints the whole ship:
red antifouling below the waterline, black hull up to the sheer line (with a thin gold
stripe), white superstructure above, porthole and window rows. A second image holds the
lit windows (emission).
"""
import math
import os
import random

from PIL import Image, ImageDraw

OUT = os.path.join(os.path.dirname(__file__), "assets")
L, Z0, Z1 = 269.0, -11.0, 23.0
W, H = 8192, 1024
SX, SZ = W / L, H / (Z1 - Z0)


def sheer(x):
    """Top of the black hull above the waterline (m): rises toward bow and stern."""
    t = x / (L / 2)
    return 11.0 + (3.6 if t > 0 else 2.4) * t * t


def px(x, z):
    return (x + L / 2) * SX, H - (z - Z0) * SZ


col = Image.new("RGB", (W, H), (245, 242, 232))  # white superstructure
emi = Image.new("RGB", (W, H), (0, 0, 0))
dc, de = ImageDraw.Draw(col), ImageDraw.Draw(emi)
# black hull up to the sheer line, red below the waterline
for i in range(W):
    x = i / SX - L / 2
    _, ytop = px(x, sheer(x))
    _, ywl = px(x, 0.0)
    _, ystripe = px(x, sheer(x) - 0.35)
    dc.line([(i, ytop), (i, ywl)], fill=(14, 14, 16))
    dc.line([(i, ywl), (i, H)], fill=(110, 26, 18))
    dc.line([(i, ystripe - 1), (i, ystripe + 1)], fill=(170, 130, 60))

rnd = random.Random(4)


def window(x, z, w, h, lit=0.88, warm=(255, 196, 120)):
    x0, y0 = px(x - w / 2, z + h / 2)
    x1, y1 = px(x + w / 2, z - h / 2)
    on = rnd.random() < lit
    dc.rectangle([x0, y0, x1, y1], fill=(40, 34, 26) if not on else (250, 214, 150))
    if on:
        k = 0.6 + 0.4 * rnd.random()
        de.rectangle([x0, y0, x1, y1], fill=tuple(int(c * k) for c in warm))


def porthole(x, z, r=0.28, lit=0.8):
    cx, cy = px(x, z)
    rr = r * SX
    on = rnd.random() < lit
    dc.ellipse([cx - rr, cy - rr, cx + rr, cy + rr], fill=(250, 214, 150) if on else (36, 32, 28))
    if on:
        k = 0.55 + 0.45 * rnd.random()
        de.ellipse([cx - rr, cy - rr, cx + rr, cy + rr], fill=(int(255 * k), int(190 * k), int(110 * k)))


# porthole rows in the black hull (D, E, F decks), denser amidships
for z, x0, x1, step in ((2.4, -118, 112, 2.1), (5.0, -122, 118, 1.9), (7.7, -125, 122, 1.8), (10.0, -100, 90, 2.4)):
    x = x0
    while x < x1:
        if z < sheer(x) - 0.9:
            porthole(x, z, lit=0.72 if z < 4 else 0.85)
        x += step * (1 + 0.15 * rnd.random())
# superstructure: B deck (paired windows), A deck promenade (big openings), boat-deck houses
for x in [v * 2.3 for v in range(-40, 36)]:
    window(x, 12.4, 1.1, 1.3)
for x in [v * 3.6 for v in range(-19, 21)]:
    window(x, 15.8, 2.6, 1.9, lit=0.92)
for x in [v * 2.8 for v in range(-17, 25)]:
    window(x, 18.9, 1.2, 1.1, lit=0.75)

col.save(os.path.join(OUT, "titanic_side.jpg"), quality=92)
emi.save(os.path.join(OUT, "titanic_side_emit.jpg"), quality=92)
print("ok", W, H)
