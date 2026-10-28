# Vacuum Pocket Puh visual quality — rejected prototype, asset replacement required

Date: 2026-10-28
Status: **REJECTED**. Do not present the latest stills or prior low-res reels as approved production quality.

## What was actually inspected
- Full true Three.js animation, GitHub Action 40763518607: technically live 3D, visually poor (primitive motor and dust objects, bare set, toy-like helmet).
- Poly Haven CC0 sofa PBR import, Action 40774222729: real leather mesh/texture, but both sofa and fox faced away from camera.
- Corrected PBR framing, Action 40774697608: proper orientation; realistic tufted sofa, but surrounding scene extremely bare and fox helmet still smooth plastic/toy-like.
- Cycles hair groom, Action 40775165985: physically rendered orange hair, but hair stands straight up like short spikes; low-fidelity underlying sculpt and triangles stay obvious. REJECTED. No further polishing this mesh just by adding fur or particles.

## Root cause
The hero character was exported as a simplified foam shell/primitive costume head, not a studio-ready furred 3D fursuit. The shot must not be marked reference-grade without a complete new mesh and believable fabric/fur groom.

## Valid replacement candidates (external sources, not yet imported)
1. Fox fursuit head base, **CC BY**: https://sketchfab.com/3d-models/fursuit-base-kemono-fox-3d-print-015d8f28b7bf4c03baede4f0a6ca619d — ~322,900 tris. Best starting geometry for a genuinely wearable head but still needs custom faux-fur groom, inner padded liner, expressive eyes, shading and camera tests. Download availability may require an authenticated Sketchfab session. Do NOT claim it has been imported.
2. Additional high-detail vacuum mesh, **CC BY**: https://sketchfab.com/3d-models/upright-dyson-vacuum-cleaner-26354cd6800744289bc1754cab8dbd4b — ~16,300 tris, but may be too coarse for ultra-macro and needs an original internal cutaway model. Attribution required.
3. PBR furniture and textures, **CC0**: https://polyhaven.com/a/sofa_02 ; downloaded automatically in Actions and included fully textured. See `scripts/polyhaven_asset.py` and `blender/fox_pbr_living_room_hero.py`. The Poly Haven public API requests attribution of the provider for applications built around its live API (see Poly Haven terms).
4. Additional detail via https://polyhaven.com/models and CC0 HDRIs/textures.

## Requirements before restart full film
- Replace head asset with truly wearable/furred high-detail model and show its hollow neck opening in a dedicated shot.
- Model separate realistic mechanical assembly at manufacturer-grade quality: functional ducts, suction path, rotating impeller and brush; no simple cone or violet cylinder.
- Dress interior with real PBR furniture, environmental props, textured walls/floor, natural indirect lighting and shadows; no empty walls.
- Produce four **independently reviewed** true 3D sequences: fox head close, room wide with motion, vacuum cutaway, final comedic reveal. Inspect spatial parallax and motion frames (at least 8-12 each).
- Exact shot-level QA before making long 75s mp4; reject at design stage if apparent on-screen issue persists.
- Low-res full preview must be shown for user approval; do not final render or publish without approval.

## Current run/source locations
- Action 40775165985: real groom but rejected.
- Source for rejected test: `blender/fox_pbr_living_room_hero.py`.
- Downloader: `scripts/polyhaven_asset.py`.
- Action workflow: `.github/workflows/vacuum-pbr-assets.yml`.
- User-supplied reference quality bar: AC-130, submarine, FedEx styled coded motion explainers.

## Additional completed PBR asset tests (2026-10-28)
- Run 40774222729: first textured Poly Haven sofa; render succeeded, camera saw couch back and helmet opening. Rejected.
- Run 40774697608: front-facing sofa and fox correctly in three inspected stills. Real PBR upholstery and tufting better; blank room and plastic toy helmet remain. Rejected.
- Run 40775165985: 17,000 emitter hairs plus interpolated children via Cycles particle grooming on fox helmet. Inspected all three renders: fur looks like rigid spikes; underlying sculpt still cartoonish, with flat triangle ears and oversized eyes. **Rejected**. Not approved for final reel.
- Poly Haven downloader with maps and checksums works: scripts/polyhaven_asset.py fetched sofa_02.bin, albedo/normal/ARM textures; sample code blender/fox_pbr_living_room_hero.py. Production must use comparable real model assets, not extend poor primitives.
- Replacement mask candidate: CC BY Fox Fursuit base, https://sketchfab.com/3d-models/fursuit-base-kemono-fox-3d-print-015d8f28b7bf4c03baede4f0a6ca619d (~323k tris). **Not yet downloaded nor tested**; may require Sketchfab login. Needs proper fur grooming/face finish. Avoid unlicensed asset copying.
