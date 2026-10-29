# Fox helmet replacement — asset review (2026-10-29)

## Status: not accepted, replacement required

This is an asset-search checkpoint, **not a new approved render**. The existing `fox_helmet.glb` remains visibly toy-like. Do not increase its hair count or tweak the old procedural sphere/triangle head again. The last successful PBR workflow run is 40864014799, but its visual result was rejected.

## Candidate A: LunaEagle / "Fursuit base kemono fox 3d print"
- https://sketchfab.com/3d-models/fursuit-base-kemono-fox-3d-print-015d8f28b7bf4c03baede4f0a6ca619d
- Sketchfab page lists **322.9k triangles**, **161.5k vertices**, **Download 3D Model**, creator **LunaEagle**, **CC Attribution** and publication **2024-01-16** (verified against listing 2026-10-29).
- **Caveat:** high triangle count does not prove cinematic quality. This is a 3D-print head BASE, not a properly groomed, cloth-covered Fursuit helmet, and it is not verified as imported. Sketchfab downloads may require signing in. Preserve creator attribution and CC BY license link in credits if used.
- Next test: legally obtain source GLB/OBJ/STL from its download interface; ensure file is complete and suitable. Import into Blender and render orthographic/85 mm front, three-quarter and rear with a neutral studio setup. The open neck and interior must be visible in rear/underside views. Reject if morphology, eye sockets and facial silhouette still look plastic or cartoon-prototype.

## Candidates that are NOT suitable substitutes
- https://sketchfab.com/3d-models/fox-realistic-3d-model-demo-free-83b1b144712c43d282d90c2fb15ba450 : realistic *animal*, not wearable Fursuit head; **CC BY-NC**, not acceptable for monetized reels.
- https://www.innerscene.com/tools/library/3d-parts/red-fox-e5cb59a3 : CC0 fox asset, but a **whole animal** and the model description does not establish a wearable helmet, so not an accepted replacement.
- Current in-repo old fox with 17k hairs: **already tested** and rejected because coarse facial shape / spiky hair.

## Acceptance gate before story / complete video
1. Source/license/provenance recorded. Mesh import succeeds without missing textures, hidden faces or geometry errors.
2. Real wearable geometry: cavity, neck opening, head-base wall thickness, realistic eye treatment, two ears, padded rim. Natural fox-like face silhouette, not giant eyeballs glued on a sphere.
3. Material distinction: short orange and cream faux fur, dark nose/ear tips; credible groom / fibers without spikes. No uniform glossy plastic.
4. Render at least four independent views (front, 3/4, profile, underside/rear), inspect them and record specific failures. Repeat with a **different** geometry if the underlying sculpt is unsuitable.
5. Then make a moving 3–5 s orbit with actual 3D geometry and inspect 8–12 temporal samples. Only advance to room, vacuum mechanism and final motion editing when those pass.

## Reproducibility warning
`.github/workflows/vacuum-pbr-assets.yml` still downloads **the discarded fox_helmet.glb from old run 40752972311**. It does not perform an asset replacement. Avoid claiming a new approved asset merely because the sofa importer and Cycles run green. This old run artifact will expire; replacement asset should have stable, license-compliant retrieval or repository storage and checksum validation.
