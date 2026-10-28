# Vacuum Cleaner 3D — code-render review log
Date: 2026-10-28. Owner requires actual code-built 3D (NO AI-generated stills) and repeated frame review until quality reaches the supplied AC-130 / submarine / FedEx references.

## Source of truth
- Python Blender scene: `blender/vacuum_hero.py`
- Public-runner workflow: `.github/workflows/vacuum-blender-lookdev.yml`
- Working branch: `vacuum-v2-3d`
- Original Three.js blockout is not acceptable visual output, don't polish it further.
- All renders use actual Blender meshes, lights, and camera; **no generated artwork**.
- These images are LOOK-DEV, not the full episode or final audio/video.

## Round 1 — GitHub run 40708454431
- Three Cycles frames succeeded, but vessel's translucent glass on camera-facing side hid internal cyclone; brush covered by opaque block; empty frame above machine; cartoon-like product.
- Action: move cutaway opening to camera side, replace opaque brush box with open frame, add actual carpet geometry, adjust camera.

## Round 2 — GitHub run 40709088615
- Three frames succeeded. Cyclone funnel/guide vanes and internal flow became visible; exposed brush roll exists; still excessive fluorescent coil effect, carpet fibers too angular, wide shot too empty.
- Action: reduce glowing spiral strands from 4 to 2 and 7.2 to 4.7 pi turns; fine blue fibers, procedural surface bumps; tighter cameras.

## Round 3 — GitHub run 40709812432
- Three frames succeeded. Mechanism more readable and frame tighter. However brush still reads as smooth copper barrel because only 58 near-hidden fibers; carpeting still too geometric. Hero styling remains technical product prototype, far from high-end reference.
- Action: rebuild brush with 484 true curved red/blue bristles and visibly open inspection housing. Tighten brush camera. Same 3 views will be rerendered.

## Outstanding fail criteria (DO NOT call it perfect)
1. Full furnished apartment and giant pocket puh must be properly modeled/rigged and lit at the level of references. The existing studio product scene proves ONLY the machine closeups.
2. Motor airflow must be mechanically correct and visible with no transparency interference; no fake glowing spring as sole explanation.
3. Brush must show bristle rotation interacting with actual fuzz; stills alone insufficient.
4. Physical scale, material textures, detailed geometry, foreground depth and camera cutaways must equal supplied reference reels. No empty walls / floating props.
5. Build a 3–5 second animated frame sequence with camera movement and rotating brush, inspect samples per AGENTS.md §3b, then user must approve stills and low-quality full preview BEFORE final render.
6. The original plush design from `src/lib/three/Plush.tsx` must be preserved, not replaced with generated bunny/human; use rigged CC0 humans for closer acting.

## Delivery gate
Show only **real inspected renders**, plus the branch link; say candidly what is still deficient. Do not claim the film is done until a genuinely reviewable 60–90 sec low-quality preview with voice exists.
