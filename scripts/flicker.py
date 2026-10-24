#!/usr/bin/env python3
"""Flicker check for a rendered reel: finds pixels that jump and jump straight back
(A → B → A over 3 frames). Real motion rarely does that; z-fighting, render-tab state
differences (parallel rendering) and strobing flashes do.

Usage: .venv/bin/python scripts/flicker.py out/<slug>.mp4 [--threshold 3]
Prints the flickering frame ranges (with % of the picture affected and where), exit 1 if any.
"""
import argparse
import subprocess
import sys

import numpy as np

W, H = 108, 192


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("video")
    ap.add_argument("--threshold", type=float, default=3.0, help="%% of pixels flipping to count as flicker")
    a = ap.parse_args()
    raw = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", a.video, "-vf", f"scale={W}:{H},format=gray", "-f", "rawvideo", "-"],
        capture_output=True,
        check=True,
    ).stdout
    v = np.frombuffer(raw, np.uint8).reshape(-1, H, W).astype(np.float32)
    d1 = v[1:-1] - v[:-2]
    d2 = v[2:] - v[1:-1]
    flip = ((d1 * d2) < 0) & (np.abs(d1) > 18) & (np.abs(d2) > 18)
    pct = flip.mean(axis=(1, 2)) * 100
    bad = [i + 1 for i, p in enumerate(pct) if p >= a.threshold]
    if not bad:
        print(f"flicker: none (max {pct.max():.1f}% px)")
        return
    # group consecutive-ish frames into ranges
    ranges, start, prev = [], bad[0], bad[0]
    for f in bad[1:]:
        if f - prev > 4:
            ranges.append((start, prev))
            start = f
        prev = f
    ranges.append((start, prev))
    print(f"flicker: {len(ranges)} range(s)")
    for s, e in ranges:
        sl = flip[s - 1 : e]
        ys, xs = np.nonzero(sl.any(axis=0))
        where = f"y≈{int(np.median(ys)) * 1920 // H}px x≈{int(np.median(xs)) * 1080 // W}px" if len(ys) else ""
        single = " (single frame: a flash/cut?)" if s == e else ""
        print(f"  frames {s}–{e}  peak {pct[s - 1 : e].max():.0f}% px  {where}{single}")
    sys.exit(1)


if __name__ == "__main__":
    main()
