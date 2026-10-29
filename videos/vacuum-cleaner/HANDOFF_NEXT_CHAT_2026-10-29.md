# HANDOFF — MotionShorts / Pocket Puh Vacuum Cleaner (29 Oct 2026)

> **Read this ENTIRE report before touching code.** It is a continuity summary of the user's long prior ChatGPT conversation, NOT a claim that the finished video meets target quality. The primary project is `oskar14156/motionshorts` (private), and cloud builds/rendering have been done on `oskar14156/Playground`, working branch `vacuum-v2-3d`. Respond to the user **in German**. Do not ask the user to restate established facts.

## 1. What the user actually wants

- A **high-quality, funny, viral, cinematic 3D engineering explainer reel**, currently "You Build a Vacuum Cleaner", vertical 9:16, 30 FPS, English natural narrator, word-synced captions, script beats that progress through **BUT → SO YOU → new engineering solution**, punchline, loop ending.
- Quality target = user's previously supplied **AC-130 / submarine / FedEx / elevator** reference videos and source code, especially professional detailed objects, credible PBR materials, spatial tracking-camera moves, exploded cutaways, legible animated technical diagrams, continuous physics, rapid storytelling. User has repeatedly said all previous video/frames **look awful** and wants substantive quality improvements, not superficial claims.
- **ABSOLUTELY NOT** an AI-generated still-video, PNG slideshow, image-pan or fake "motion graphics". Real 3D objects must **animate frame-by-frame**: camera positions, rotating motor, brush, cyclone, falling fur, actual airflow, separating components. The initial "full preview" was a 72.9s slideshow and was explicitly rejected. Later true animated 3D preview exists but is still too cheap visually.
- Character decision made explicitly: **"Pocket Puh" is now a WEARABLE ORANGE/WHITE FURSUIT FOX HEAD/HELMET**, with pointed ears, muzzle, eye openings/expressive eyes, realistic faux fur and a genuinely hollow opening so a person can wear it. **NEVER revert to old blue plush** (`src/lib/three/Plush.tsx` historical only). `oskar14156/motionshorts/AGENTS.md` was updated with the new canon.
- User specifically asked to render/test free via `oskar14156/Playground` GitHub Actions; Blender / Remotion / Three.js, no expensive service. Model assets can be Blender-exported GLB, but actual movement is driven in code or rendered from 3D. Google Colab if necessary, GitHub first.
- User wants **the assistant to inspect its own actual frames**, improve, rerender, inspect again, repeat until high quality, and show honestly what is/isn't good. Low-quality full preview (e.g. `--scale=0.4 --crf=30`) **before** full-quality final render; NO publishing/release or full final render without explicit approval. Don't call it "perfect" prematurely.

## 2. Source of truth and mandatory reading

1. `oskar14156/motionshorts`, main: `AGENTS.md` (complete; respect §3a realistic modeling/assets, §3b frame-by-frame QA, §3d build-it explainer rhythm); `.claude/skills/reel-director/SKILL.md` and `.claude/skills/reel-build/SKILL.md` and relevant references.
2. Reference: `src/videos/elevator/`, `videos/elevator/` in motionshorts, plus real referenced films if available. Do not claim to have watched a reference MP4 just from code; inspect actual footage if accessible.
3. `oskar14156/Playground`, branch `vacuum-v2-3d`: `AGENTS.md`, `videos/vacuum-cleaner/active3d-qa-2026-10-28.md` and `videos/vacuum-cleaner/blender-review-log.md`.
4. Current English episode script: `videos/vacuum-cleaner/fox-preview-script.txt`. It is 72–73s as voiced in existing previews. This is the current vacuum episode; `motionshorts/NEXT.md` submarine plan was outdated according to user. Do not revert to submarine.

## 3. Conversation history / what was tried and why rejected

### Phase A — no real animation / failed source media
- Initially generated pseudo-3D stillframes; user rejected both the looks and that these were **generated images instead of code**.
- True 3D Three.js blockout in `src/videos/vacuum3d/Vacuum3DLab.tsx`; rendered via GitHub, but furniture, people and vacuum modeled with primitive boxes/spheres; awful quality.
- Blender-generated mechanical vacuum stills with `blender/vacuum_hero.py`, rendered multiple QA rounds: vacuum, visible transparent cyclone, brush with 484 strands. Some real 3D, still crude. Studio set not enough.
- Blender story-frame prototypes with `blender/vacuum_story_samples.py`: living room, fur, bin punchline; masking and rigging errors fixed, but boxy toy furniture, poor lights, fake fur, unsatisfactory.
- Separate `blender/fox_helmet_sample.py` Fursuit fox helmet. User explicitly accepted this CHARACTER CONCEPT and made it new Pocket Puh; **acceptance is not approval of the visual quality of the model**. Actual model remains low-quality (bulging googly eyes, foam triangle ears).
- First complete narrated MP4 from `VacuumFoxFullPreview.tsx`, run **40744763890**: ~72.9s, 432x768, 30fps, voice/captions, but largely a slideshow of Blender PNG frames with fake zooms; user explicitly rejected it.

### Phase B — actual frame-by-frame 3D animation, still low-quality
- New `src/videos/vacuum3d/VacuumActive3D.tsx` with Three.js live animation per frame; `.github/workflows/vacuum-active-3d.yml` proof run **40756050927** 8s. Actual dust/vortex/brush/camera moving, but particles look like giant polygons and mechanics like cylinders. Reduced debris in next pass, run **40756874789**.
- Full actual live-3D episode, run **40756575346**, ~72.77s @30fps 324x576, voice/captions. It is technically an animated video and is downloadable from its GitHub Action artifact, BUT aesthetically NOT accepted.
- Built `src/videos/vacuum3d/VacuumPremiumCyclone.tsx`: Blender glTF machine body + true runtime rotating impeller, cyclone 3D particle motion, rings, bolts, pleated HEPA, animated camera and exploded assembly.
- Six-plus iterations inspecting stills and motion: runs **40761860192**, **40761423071**, **40762241659**, **40762565609**, **40762906332**, and successful quality MP4 **40763494510**. Camera now goes product wide → cyclone detail → filter reveal, more credible mechanical visualization; not yet reference-grade.
- Integrated premium cyclone/filter into full active episode (`VacuumActive3D.tsx`); successful **40763518607** full-render GitHub Action. IMPORTANT: check artifacts/actual video before making new claims.
- Built `src/videos/vacuum3d/VacuumFoxRoomCinematic.tsx`, `src/vacuum-room-quality-entry.tsx`, and workflow `.github/workflows/vacuum-fox-room-quality.yml`; successful **40764603537**. Blender GLBs and true moving fur/camera, BUT visual evaluation remains bad, never treat successful CI as quality approval.

### Phase C — latest, professional asset pivot (CRITICAL NEXT WORK)
- The user again says the footage looks "schrecklich" after long iteration. The core problem is NOT particle count, captions or resolution; **the cheap geometry/materials, fake fox head and empty room**. Do NOT continue decorating boxy primitives.
- Look for legal premium 3D assets; **Poly Haven (CC0)** chosen for furniture; separately a **fox fursuit head** source was identified on Sketchfab with CC BY, but download/access, correct license, attribution and fidelity need verification; don't assume asset downloaded.
- Added `scripts/polyhaven_asset.py`: downloads Poly Haven glTF along with textures, dependency integrity, MD5 checks, records source/license. 
- Added `blender/fox_pbr_living_room_hero.py`: asset-first Blender Cycles set with genuine CC0 sofa, room/texture detailing, camera wide/sofa/close. 
- Added `.github/workflows/vacuum-pbr-assets.yml`: automation downloads CC0 sofa and earlier fox GLB, renders 3 comparison frames.
- **Latest SUCCESSFUL run 40864014799** (https://github.com/oskar14156/Playground/actions/runs/40864014799), artifact **`vacuum-quality-real-cc0-pbr-model-comparison`**. Actual Poly Haven `sofa_02` PBR glTF imported with textures and scene rendered. Frames **already visually reviewed**: sofa reads better as physically modeled tufted black leather, **BUT overall scene STILL FAILS reference quality**: fox helmet still catastrophically fake with inflated goggle eyes, triangle ears and smooth cheeks; carpet looks like foam, wall empty and composition lacks a convincing action. Original QA report contains further notes. This is the true latest status, not "workflow pending". Don't claim asset success solves aesthetics.
- Highest-leverage next step: REPLACE THE FOX HELMET SOURCE MODEL with **professionally modeled wearable realistic fursuit head**, with correctly designed muzzle and eye proportions, soft faux fur groom, hollow wearable shell, physically plausible material. Candidate Sketchfab model source recorded in QA: https://sketchfab.com/3d-models/fursuit-base-kemono-fox-3d-print-015d8f28b7bf4c03baede4f0a6ca619d — license and downloadable GLB/OBJ must be verified. If unsuitable/inaccessible, find alternative correctly licensed real modeled asset. Need license/attribution for CC BY or prefer CC0. DO NOT represent simple head base as fully fur-covered high-quality costume unless it actually is.

## 4. Current main files (Playground / vacuum-v2-3d)

| Purpose | Path |
|--|--|
| Validated goals, failures, previous rounds | `videos/vacuum-cleaner/active3d-qa-2026-10-28.md` |
| Earlier Blender still QA | `videos/vacuum-cleaner/blender-review-log.md` |
| Story text/voice source | `videos/vacuum-cleaner/fox-preview-script.txt` |
| Actual full 3D animated episode | `src/videos/vacuum3d/VacuumActive3D.tsx` |
| Improved true 3D machine cutaway | `src/videos/vacuum3d/VacuumPremiumCyclone.tsx` |
| Existing GLB fox/room animation | `src/videos/vacuum3d/VacuumFoxRoomCinematic.tsx` |
| Legacy Blender fox mask prototype | `blender/fox_helmet_sample.py` |
| Latest CC0/PBR sofa downloader | `scripts/polyhaven_asset.py` |
| Latest real sofa render | `blender/fox_pbr_living_room_hero.py` |
| Latest PBR GH Actions | `.github/workflows/vacuum-pbr-assets.yml` |
| Full active-3D GH Actions | `.github/workflows/vacuum-active-full.yml` |
| Cinematic machine QA GH Actions | `.github/workflows/vacuum-premium-quality.yml`, `.github/workflows/vacuum-premium-stills.yml` |

Older code/data files can be checked on the branch; trust the git state, not an outdated verbal summary. GitHub Actions artifacts often expire after **7 days**; if an artifact is missing, **rerender** instead of claiming the MP4 exists.

## 5. How the next assistant should proceed, without another lengthy discussion

1. Read `AGENTS.md`, two Claude skills, prior QA docs and latest source scripts *completely*. Confirm current branch and workflows, inspect actual render artifacts (download and view key full-resolution samples). First answer the user with real state and action, not vague plans.
2. **Start from latest PBR successful run 40864014799**: examine all 3 real frames. Confirm existing model quality is far below reference.
3. Find/download and license-check superior **fursuit fox head** (reusable professional mesh, realistic eyes, muzzle, ears and groom); test import via Blender with appropriate material/textures. Build *one* convincing hero shot: fox helmet shedding orange fur on a premium couch in believable modern room, with thoughtful film lighting/camera, minimal clutter. No PNG slides.
4. Render low-res sample frames; inspect them yourself visually, identify concrete defects, fix source mesh/material/camera, render again. Continue for a few substantive look-dev iterations (don't just fiddle with exposure). Do not promise indefinite asynchronous work; work in the current tool turn and show tangible artifacts.
5. Once the single 3D shot meets target, animate real fur shedding, camera motion, object/lighting interaction, then render and inspect 10–15 sequential frames. For mechanics, reuse improved `VacuumPremiumCyclone.tsx`, but bring other shots up to same quality.
6. Replace all primitive 3D or still-plate shots with proper assets and real per-frame motion, then low-quality full ~73s video **including sound, captions, all chapters**; inspect the full preview, identify clippings, sudden cuts, unrealistic motion.
7. User approval before high-quality final render or publishing. Only send watchable MP4 download that was actually verified in current run, plus precise GitHub workflow and branch links.

## 6. Communication requirements

- Answer in **German**, direct, compact but technically grounded.
- User strongly dislikes excuses, quality overclaims and repeated "I will make it better" without substantive model improvement. Do not say "on par" unless direct side-by-side QA supports it.
- User explicitly said **"loop dich" / "check immer samples" / "schaut noch immer schrecklich aus"**; interpret as autonomous iterative *within a live session*, not permission to promise background work or release.
- No need to ask whether Fursuit fox is now Pocket Puh; already decided.
- If Github connected, use connector tools to modify branch/test. Do not guess repo workflow commands. `oskar14156/Playground` runner was used for all previews.
- Watch for concurrent work: verify actual GitHub HEAD and any new runs before writing; don't overwrite newer fixes.
- If a connector file cannot be downloaded locally, report what is and isn't verified; no invented sandbox paths.

## 7. Immediate user request status at handoff

The user asked multiple times for a handoff so another ChatGPT conversation can **continue seamlessly**. This document is that handoff. **No new, reference-quality finished video exists or is approved.** The latest successful improvement is imported CC0 PBR furniture, but the wearable fox head model remains the dominant visual failure. **Next agent should work on the fox source asset and one excellent hero scene before another full film render.**
