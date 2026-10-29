# COMPLETE HANDOFF TO NEXT CHAT — MotionShorts / Pocket Puh Vacuum Episode
**Verified 2026-10-29 (Austria timezone).** This is the working cross-chat handoff: conversation history, user decisions, source pointers, current technical status, quality verdicts, blockers, and precise next actions. Not a claim that the output looks good.

## 0 — Read first, use actual GitHub access
- Production/creative specification repository: private [oskar14156/motionshorts](https://github.com/oskar14156/motionshorts), branch \`main\`.
- GitHub rendering/actual code execution: public [oskar14156/Playground](https://github.com/oskar14156/Playground), ACTIVE WORKING BRANCH \`vacuum-v2-3d\` (not \`main\`).
- READ \`motionshorts/AGENTS.md\` **completely**, especially §3a (detailed true 3D), §3b (frame-sequence QA), §3d (build-it reels), and both \`.claude/skills/reel-director/SKILL.md\`, \`.claude/skills/reel-build/SKILL.md\`; references are also important.
- Read [active technical QA report](https://github.com/oskar14156/Playground/blob/vacuum-v2-3d/videos/vacuum-cleaner/active3d-qa-2026-10-28.md) and [Blender image-round log](https://github.com/oskar14156/Playground/blob/vacuum-v2-3d/videos/vacuum-cleaner/blender-review-log.md).
- GitHub repository access in ChatGPT is via connected GitHub connector (discover through tool catalog, do not claim inability without checking).
- The owner explicitly permits experimentation and GitHub Actions runs in the *public* \`Playground\` repo to render/test, including low-quality full-video previews. **No high-quality final render, publish or post without final visual approval.**

## 1 — User's long-standing vision / non-negotiables
Produce a **professional, potentially viral, funny ~60–90-second vertical 9:16 English 3D engineering explainer Reel/TikTok** in the same *real* cinematic Remotion motion-graphics standard as the user's reference **elevator, submarine, AC-130, FedEx** videos. A sharp hook, rapid *But → So you* escalation through genuinely researched engineering subsystems, absurd callback ending, narrator, synced bold captions, interesting educational text and actual moving cutaway mechanisms.
- **Not a slide show!** The user has complained repeatedly and vehemently: moving a Blender PNG with zoom/pan/2D particles, stitching stills, or using AI image generation to make fake screenshots DOES NOT fulfill the requirement.
- **Must be real frame-by-frame 3D:** detailed mesh/geometries (ideally imported professional PBR glTF), meaningful 3D camera dolly/rotation/parallax, mechanically accurate rotating brush/fan, air pressure / cyclone / dust motion visible, dynamic 3D exploded assembly, synchronized visual consequences, elegant animated technical overlays, studio lighting and real material detail.
- After EVERY change: render samples and frame sequences from the **actual code**, inspect visually yourself, list specific errors, fix, rerender, compare, and only after genuinely strong quality produce full low-quality video; render only after looking at the frames. No declaring "perfect" on technical tests alone. Continue to build concrete progress rather than just narrate status.
- Quality benchmark is user-provided reference videos, **not** generic "technically Three.js". Avoid boxy room props, fake physics, tiny faraway subjects, awkward angles, object clipping, strobe, unreadable technical text, static repeated shots, noisy orange dots, blue triangle arrows and toy-like fox helmet.

## 2 — Crucial character canon update
**The giant Pocket Puh is NOW an orange-and-white wearable furry FOX FURSUIT HEAD / HELMET**, with pointed ears, expressive eyes, cream/white muzzle, synthetic fur and a visibly hollow opening for a wearer. It is NOT the old blue animal plush; do not revert. This was explicitly decided by owner after separate helmet sample and was updated in \`motionshorts/AGENTS.md\`.
- First original coding model of new fox helmet: \`Playground/blender/fox_helmet_sample.py\` (front, 3/4, hollow rear). Several renders; best sample runner [40742755079](https://github.com/oskar14156/Playground/actions/runs/40742755079), but still looks cartoonish, sparse/pointed fur and exaggerated eyes. Owner accepted it as the canon identity **not as final high-quality character asset**.
- Active video script: \`Playground/videos/vacuum-cleaner/fox-preview-script.txt\`: a friend's giant furry fox helmet sheds orange fur all over apartment; broom fails; build vacuum with fan/impeller, bin/filter, cyclone, fine filter, brush, thermal cutoff; accidentally sucks up fox helmet; eyes in bin; friend says "You cleaned the wrong thing." English narration ~72–73sec with voices generated previously.
- Keep humor, factual engineering, climactic cartoon absurdity. Preserve persona/story while improving asset realism and action.

## 3 — Chronological history: what was tried, why user rejected it
1. User initially asked for work from \`motionshorts/NEXT.md\` but clarified NEXT was stale and asked assistant to independently conceive funny episode. The episode chosen was **building a vacuum cleaner because giant Pocket Puh sheds**. Prior unrelated submarine episode exists in notes, not current task.
2. Early assistant used image generation/illustrative stills, then simple Remotion SVG/2D previews; user: **"das ist ja generiert nich code was machst du?"**. Explicitly rejected generated images as substitute for real code-render.
3. Branch \`vacuum-v2-3d\` created in \`oskar14156/Playground\`; \`src/videos/vacuum3d/Vacuum3DLab.tsx\` true Three.js blockout rendered as simple meshes. Ugly toy/blocky; first tests with 5 stills and 5sec test, workflow \`.github/workflows/vacuum-v2-lookdev.yml\`. User rejected despite real 3D.
4. New Blender hard-surface \`blender/vacuum_hero.py\`, automation \`.github/workflows/vacuum-blender-lookdev.yml\`; ~4 repeated QA rounds, including clear cyclone vessel, 484 roller bristles, 3 stills and 12-frame motion proof. Examples: [40708454431](https://github.com/oskar14156/Playground/actions/runs/40708454431) to [40713013472](https://github.com/oskar14156/Playground/actions/runs/40713013472). Still simplistic product prototype, unconvincing glowing helix and minimal detail.
5. Additional Blender \`blender/vacuum_story_samples.py\` for room, shedding and punchline, workflow \`.github/workflows/vacuum-story-samples.yml\`. 4 rounds (ending [40719560480](https://github.com/oskar14156/Playground/actions/runs/40719560480)). Basic cube furniture and rough cartoon. User rejected.
6. New fox helmet modeled in \`blender/fox_helmet_sample.py\` under \`.github/workflows/fox-helmet-samples.yml\`: 3 rounds; physical back opening, cheek/ear detail. Sample [40742755079](https://github.com/oskar14156/Playground/actions/runs/40742755079). Canon accepted by owner.
7. First **full low-quality ~72.9s movie** \`src/videos/vacuum3d/VacuumFoxFullPreview.tsx\`, workflow \`.github/workflows/vacuum-fox-full-preview.yml\`, run [40744763890](https://github.com/oskar14156/Playground/actions/runs/40744763890). This cut together Blender STILL FRAMES with simple zooms, voice/captions. **Owner specifically rejected**: "das sind ja nur stillframes nicht so remotion motion graphics videos die aktiv was bewegen". Do not use that as good baseline.
8. **Per-frame moving** Three.js \`src/videos/vacuum3d/VacuumActive3D.tsx\`, workflow \`.github/workflows/vacuum-active-3d.yml\`; short QA [40756050927](https://github.com/oskar14156/Playground/actions/runs/40756050927) and second [40756874789](https://github.com/oskar14156/Playground/actions/runs/40756874789). Actually moving fur, fan, cyclone and camera, but huge crude orange particles, cyan arrows, cone/cylinder machine, room basic box mesh. Even after shrinking particles, unacceptable.
9. First full **real active 3D** 72.77sec at 324x576, 30fps, English narration rendered [40756575346](https://github.com/oskar14156/Playground/actions/runs/40756575346). Technically correct animation, **still visually awful**.
10. More sophisticated \`src/videos/vacuum3d/VacuumPremiumCyclone.tsx\` using an exported Blender GLB \`vacuum_body.glb\`, moving helical lint, machined rings/bolts, physical filter, rotating fan and animated camera. Standalone \`src/vacuum-quality-entry.tsx\`; 4+ rounds of three QA frames and 5sec MP4, see [40762906332](https://github.com/oskar14156/Playground/actions/runs/40762906332) and [40763494510](https://github.com/oskar14156/Playground/actions/runs/40763494510). Better mechanical intelligibility, changing cinematic angles, but still far from reference level.
11. Integrated better cyclone/filter components into full episode in \`VacuumActive3D.tsx\`, via \`.github/workflows/vacuum-active-full.yml\`; **V2 full run [40763518607](https://github.com/oskar14156/Playground/actions/runs/40763518607) is NOW VERIFIED COMPLETED SUCCESS**, artifact \`fox-vacuum-full-true-3d-preview\` (approx 3.18 MB; GitHub retention 7 days). **It is NOT approved visually**.
12. \`src/videos/vacuum3d/VacuumFoxRoomCinematic.tsx\`, \`src/vacuum-room-quality-entry.tsx\`, \`.github/workflows/vacuum-fox-room-quality.yml\`: imports actual Blender GLB \`room.glb\` and \`fox_helmet.glb\`, moves fur strands and camera in 3D. Latest run [40764603537](https://github.com/oskar14156/Playground/actions/runs/40764603537) **VERIFIED COMPLETED SUCCESS**, artifact \`blender-glb-fox-room-actual-motion\` (~1.85MB). Assistant downloaded and inspected actual stills: **still awful** (cartoon toy fox; under-furnished room, a sofa and shelves; materials/camera still inferior).
13. Most recent owner feedback: **"schaut ja noch immer schrecklich aus"**. Correct response: STOP cosmetic tweaks to primitive scene. Must replace underlying assets with **real detailed CC0/PBR or properly licensed high-end glTF** and build cinematic geometry/lighting. User then asked handoff for next chat.

## 4 — Very latest work (critical resume point, partially complete)
- Created \`Playground/scripts/polyhaven_asset.py\` on \`vacuum-v2-3d\` which downloads Poly Haven glTF model and dependencies with checksum validation and records CC0 license.
- Created \`Playground/blender/fox_pbr_living_room_hero.py\` on same branch: imports a **real detailed glTF sofa** rather than sculpting it from Blender cubes; multi-layer oak floor and wool rug procedural textures, architectural window, physical lighting, three camera views \`wide/sofa/close\`; accepts \`--sofa <gltf path>\`, optional \`--fox <gltf path>\`, and renders frames.
- **THE NEXT GITHUB WORKFLOW WAS NOT CREATED**. The previous chat's attempt to create \`.github/workflows/....yml\` was interrupted at a tool call. Do not claim a new PBR replacement render exists. Immediate action: validate exact Poly Haven API slug \`sofa_02\` and asset availability using web or API, fix \`polyhaven_asset.py\` if API response shape differs; create GitHub Actions workflow to download a real CC0 PBR couch, render 3 frames with \`blender/fox_pbr_living_room_hero.py\` on public runner, upload PNGs, inspect actual images. If model is missing/not licensed, use a verified alternative and record license.
- Don't present an asset name, quality, license or availability as verified until source/download checked.
- Need source or custom rig a **production-grade fox fursuit helmet** with dense realistic faux fur, credible eyes, muzzle and clear wearable opening (copyright/licensing respected); earlier homemade model is not sufficient. For external Sketchfab assets verify concrete download permission and Creative Commons conditions; user wants usable commercial publishing.
- New room should be detailed with real furniture/decor/PBR textures, not just one asset plus empty walls. Improve framing and lighting. Output per-frame **moving 3D** camera/character/fur sequence, not pan/zoom on a PNG. Avoid baking everything into still images.
- Resume fresh after checking actual GitHub current state, branch, running Actions, and artifacts.

## 5 — Where everything lives
| Purpose | Repository branch / path |
| --- | --- |
| Rules & reference reels | \`oskar14156/motionshorts\` main: \`AGENTS.md\`, \`.claude/skills/reel-director/SKILL.md\`, \`.claude/skills/reel-build/SKILL.md\`, \`src/videos/elevator/\`, \`videos/elevator/\`, \`videos/submarine/\` |
| Current running code | \`oskar14156/Playground\` branch \`vacuum-v2-3d\` |
| Most recent quality rejection log | \`videos/vacuum-cleaner/active3d-qa-2026-10-28.md\`; \`videos/vacuum-cleaner/blender-review-log.md\` |
| Story / voice script | \`videos/vacuum-cleaner/fox-preview-script.txt\` |
| Core animated full film | \`src/videos/vacuum3d/VacuumActive3D.tsx\` |
| GLB premium technical cutaway | \`src/videos/vacuum3d/VacuumPremiumCyclone.tsx\` |
| Full render runner | \`.github/workflows/vacuum-active-full.yml\` |
| Real room+fox glTF motion test | \`src/videos/vacuum3d/VacuumFoxRoomCinematic.tsx\`, \`.github/workflows/vacuum-fox-room-quality.yml\` |
| Blender fox mask baseline | \`blender/fox_helmet_sample.py\` |
| Existing procedural Blender vacuum | \`blender/vacuum_hero.py\` |
| **Latest new untested PBR asset pipeline** | \`scripts/polyhaven_asset.py\`, \`blender/fox_pbr_living_room_hero.py\` |
| Root registration & source package | \`src/Root.tsx\`, \`package.json\` |

## 6 — Verified GitHub runs (checked in follow-up chat 2026-10-29)
- [40744763890](https://github.com/oskar14156/Playground/actions/runs/40744763890): original Blender *stills*-based full preview; NOT what owner wants.
- [40756575346](https://github.com/oskar14156/Playground/actions/runs/40756575346): first full moving Three.js 72.77s; success; unacceptable look.
- [40763494510](https://github.com/oskar14156/Playground/actions/runs/40763494510): stronger 5-second detailed moving cyclone; success; still only a prototype.
- [40763518607](https://github.com/oskar14156/Playground/actions/runs/40763518607): full active V2 with more detailed cyclone; **SUCCESS**, low-quality artifact exists, still rejected-looking.
- [40764603537](https://github.com/oskar14156/Playground/actions/runs/40764603537): real Blender GLB room+fox actual motion; **SUCCESS**, artifact exists, sample visually rejected.
GitHub Actions archives may expire after ~7 days; inspect before linking/downloading; rebuild models on runner when needed. Always verify current status instead of assuming these 2026-10-29 status observations remain current.

## 7 — Render and QA workflow
- User allows extensive free/public GitHub Actions runs in \`oskar14156/Playground\`. Check path-trigger filters; workflow may require explicit dispatch (discover tools). Don't try to run Blender on the user's Mac; no direct local execution. GitHub runner \`ubuntu-24.04\`, \`npm ci\`, Blender 5.2.3 (cached), Remotion \`--gl=swangle\` or suitable GPU/runtime.
- Confirm actual \`mp4\` metadata via ffprobe: fps, resolution, duration, frame count, audio stream.
- Low-quality preview: \`npx remotion render ... --scale=0.4 --crf=30\`, use \`--concurrency=2\` for CPU software GL and verify adequate timeout. Never start final high-quality render without approval.
- For QA, render 3–5 key frames, then short motion mp4, extract contact sheet plus critical frames, inspect for geometry accuracy, framing, collision, materials, facial proportions, moving parts, air flow and typography; iterate as many times as needed. Do not write "checked" unless you genuinely opened/visually analyzed frames.
- Voice: prior workflow synthesized English voice (Edge Neural, offline espeak fallback), supplied \`vo.mp3\` and \`words.json\` from artifact of run 40744763890. Timing can be reused for new edits, but validate sync (old stills often failed).
- Use browser or connector for fresh asset sources and licensing; do not invent permission or license.
- Commit changes to appropriate feature branch, not production \`main\` or publication. Keep user informed with concrete files and candid quality assessment.

## 8 — Recommended immediate next 10 operations for the successor
1. Read complete rules and this handoff. Open rendered frames in [40764603537](https://github.com/oskar14156/Playground/actions/runs/40764603537) and [40763518607](https://github.com/oskar14156/Playground/actions/runs/40763518607) as baseline (download actual artifacts, do not only read notes).
2. Verify current git branch and newest Actions so as not to conflict with another agent.
3. Verify actual downloadable **commercially usable detailed sofa and room/furnishings** via Poly Haven API. Check actual \`sofa_02\` slug or find the real one.
4. Test \`scripts/polyhaven_asset.py\` and \`blender/fox_pbr_living_room_hero.py\` end-to-end through a new GitHub Actions workflow, fixing API include paths, Blender asset importer and orientation if necessary.
5. Render \`wide/sofa/close\` frames at low sample settings and inspect them personally. Reject and repair if lighting/materials/geometry not near benchmark; don't use them as hero shots prematurely.
6. Find or model a **much more professional actual wearable fox head**, with verified asset license, groom, neck-hole, correct silhouette; render front/3-quarter/rear on appropriate stage to check.
7. Export the best assembled models as efficient scene GLBs with PBR textures, normals, proper transform bounds and no broken dependencies. Ensure rendering in Remotion/Three.js truly updates 3D every frame.
8. Make a 4–7sec *real moving* test with fox shedding and camera dolly, plus separate brush/cyclone engineering shot; critique 8–12 temporal frames, fix and repeat.
9. Only when convincing, replace lower-quality compositions in the 70–85s full active script; rerender complete low-quality 9:16 preview with English narrator/captions, inspect all transitions, log findings.
10. Ask user to approve look and script after evidence; do not publish/final-high-res without approval. They prefer action over repeated questions, generic promises or asking them to run commands manually.

## 9 — User communication
User speaks German, expects autonomous execution and very high standards; has already told the assistant multiple times "schaut noch immer schrecklich aus", "das ist ja generiert nicht code", "das sind ja nur stillframes", "loop dich ... bis perfekt", "schau die bilder selbst an". Do NOT reassure on technical success if visual still weak. Show actual proof and improvement from a *verified* completed render. Tell truth about limitations; no asynchronous/background work claims. No need to ask for confirmation of known decisions. Update user briefly during longer operations; deliver links to code, run and real MP4/samples.

**START HERE NOW: finish the interrupted CC0 PBR sofa GitHub render workflow.** Read the two just-created Python files, run/import a verified model, inspect actual results; continue to a better character and moving room instead of endlessly relighting placeholder boxes.
