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

## Round 4 — GitHub run 40710755828
- Three stills and Python syntax validation succeeded. The brush is finally visibly bristled with 484 modeled orange and blue curved fibers; the closer hero camera shows more of the real cyclone separator.
- Honest visual review: better than rounds 1–3, **NOT production quality and NOT close enough to the references**. The scene is still a stand-alone studio prototype, not the required furnished realistic apartment. Plush and working human figures are not yet integrated. The brush head still needs connected airflow, physical debris motion and sequence review. Cyclone airflow looks like a luminous spring rather than a sampled moving dust cloud. Materials and silhouette lack manufacturer-grade detail.
- No full reel/voice/final render is approved. Stop polishing simple primitives endlessly; next substantive step must be a robust authored/CC0 3D asset set with PBR textures, rigged characters and a real animated 3D room before full script assembly. Recheck CC0 licensing and attribution notes prior to asset imports.
- Artifact (7-day GitHub retention): https://github.com/oskar14156/Playground/actions/runs/40710755828

## Motion QA loop 1 → 2
- Run 40712067234: 12 Blender-rendered frame samples across 1.5 seconds with camera and cyclone particles updated in 3D. Review: movement barely perceptible; camera angle too static, dust motes too small; NOT approved.
- Run 40713013472: same 12 temporal samples rerendered with a 1.25 m orbital x-travel, 0.65 m y-shift, 24 enlarged emissive 3D flow beads moving around the cyclone. Review: visibly moving through the bin in continuous orbit, and the actual viewpoint changes. This is a meaningful animation improvement, but still a simplified mechanical demonstration, not the owners' photoreal short-form reference quality.
- Current source: `blender/vacuum_hero.py` `--motion` branch. Rendered artifact: https://github.com/oskar14156/Playground/actions/runs/40713013472
- Outstanding before any full short: replace unconvincing studio with believable furnished apartment, replace product blockout with manufacturer-level asset/detail, faithfully build original giant pocket puh plus rigged people, storyboard and time real script, and inspect every moving shot. Required ★ checkpoints before final remain in force.

## New story-scene samples (2026-10-28)
- Source `blender/vacuum_story_samples.py`; automated workflow `.github/workflows/vacuum-story-samples.yml`; no AI-generated images, pure Cycles render.
- Round 1 (40717776571): three scenes rendered; vacuum falsely appears in the living-room opener and occludes the giant pocket puh; strange overbright white materials; hard upper edge of set; fake googly-eyed jar in punchline.
- Round 2 (40718386631): corrected hierarchy masking, lighting, ceiling and open shell, but room was dark and captured character's child meshes were still mispositioned.
- Round 3 (40719046060): fixed Blender parenting to use true local hierarchy and proper positions; plush sits on sofa and inside bin. Exposure too dark.
- Round 4 (40719560480): brighter exposure, tighter room/punchline shots; both the plush-on-sofa and captured-plush read clearly. Still **FAILS reference quality**: artificial primitives, simple bookshelf, lifeless plush with visibly sparse fur, unrealistically bright washed-out palette, blue particles like isolated beads, and bin geometry that resembles an open tank, not a real canister vacuum. No rendered movement for these new story scenes. Do NOT call perfect or start final render.
- Artifacts round 4: https://github.com/oskar14156/Playground/actions/runs/40719560480
- Required next step: genuinely detailed CC0/PBR furnished room, better stylized plush rig + fur, actual carpet shedding/brush motion, mechanically plausible transparent bin and realistic actor integration. Inspect motion sequences before the full low-quality preview.

## Full fox-helmet Pocket Puh episode: Low-quality preview
- Run: https://github.com/oskar14156/Playground/actions/runs/40744763890
- Composition: `src/videos/vacuum3d/VacuumFoxFullPreview.tsx`.
- New owner-approved Pocket Puh design: orange/white wearable fox fursuit helmet from `blender/fox_helmet_sample.py`. The former blue plush is superseded.
- Story script: `videos/vacuum-cleaner/fox-preview-script.txt`; about 286 words; narrator generated with Edge TTS (offline voice fallback wired).
- Blender scene images with orange fox helmet: `blender/vacuum_story_samples.py`, six room and container views.
- Mechanism and fox-head plates from previously QA-checked Blender Github artifact runs `40713013472` and `40742755079`.
- Output: 72.90 s, 432 x 768, 30 fps, 2187 frames, MP4 with embedded narration, synchronized on-screen word captions. GitHub artifact `vacuum-fox-full-low-quality-preview`, 7-day retention.
- Reviewed actual `contact.jpg`, `frame10.jpg`, `frame50.jpg`, opening and near-end frames. Technical audio and video streams are present.
- CRITICAL remaining quality gate: This is **a full timing/storyboard low-quality animatic assembled from actual Blender-rendered 3D plates**, with animated overlays, particle/caption graphics and camera-crop moves; it is **not** continuously animated 3D throughout. The mechanical 3D plate is frequently repeated. The fox-head prop and room are still visibly simplified. The full project quality bar `AGENTS.md` §3a/3b/3d is not yet passed; do not call it final or publish it. Need distinct continuous Blender 3D shots, a faithful physically coherent fox helmet in all scenes, believable character interaction, sound design, refined material/lighting and frame-sequence QA before final release.
- Next: user review and direction on pacing, premise, comic payoff; then rebuild repetitive still-plate sections as proper 3D animated shots. No final render without signoff.
