---
name: reel-build
description: Builds a reel from a reel-director storyboard in Remotion + Three.js using this project's component library (captions, HUD counters, loop bridge, 3D camera rig, procedural planes and humans, dot-matrix globe/map). Use when videos/<slug>/storyboard.md exists and the user wants it built, previewed, fixed or rendered — "bau das Video", "render it", "fix shot 4".
---

# Reel Build

Input: `videos/<slug>/{brief.md, script.txt, storyboard.md}` + `public/<slug>/{vo.mp3, words.json}`.
Output: `src/videos/<slug>/*.tsx`, a `<Composition id="<slug>">` in `src/Root.tsx`,
stills for review, then `out/<slug>.mp4`.

Also load the official `remotion-best-practices` skill (3D rules: `remotion-markup/3d.md`).
Reference implementations: `src/videos/black-box/` (multi-set: 8 sets, view modes, gauges,
sound design — **copy this shape**) and `src/videos/great-circle/GreatCircle.tsx` (one continuous world).

## Architecture (copy this shape)

```
src/videos/<slug>/
  cues.ts      words.json → makeCues → the `c = { … }` cue table + DURATION
  sets.tsx     one component per storyboard set: <SetX f={frame}/> = backdrop + ThreeCanvas + its callouts
  parts.tsx    small 3D helpers this video needs (promote to src/lib when reused)
  <Name>.tsx   SETS list → <World/> picks the active set → Hud → GlitchCuts → LoopBridge → FilmLook → Captions → Sound
```
Sets switch by frame (`SETS.filter(s => s.from <= f).pop()`), so only one WebGL canvas
exists per frame. A set can appear twice (hook + outro) — that's how the loop returns to frame 0.

1. `const cue = makeCues(words, 30)` — `cue.at("phrase")`, `cue.end("phrase")`, `cue.voiceEnd`.
   Put every storyboard cue in one `c = { … }` table at the top. If a cue throws, the script
   and storyboard are out of sync — fix the storyboard, never hardcode a frame.
2. `timeline(f)` — ONE pure function returning every animated value (camera, morphs, progress,
   opacities) from `keys()/keys3()/ramp()` keyed on cue frames. No state, no useEffect.
3. `<World/>` — reads `useCurrentFrame()`, calls `timeline`, renders `<ThreeCanvas>` + HTML
   overlays positioned with `project()`. Must look right when frozen at any frame
   (the LoopBridge renders it frozen at frame 0).
4. Composition layer order: World → HUD (StatPill/Readout/Gauge) → `GlitchCut`s → `LoopBridge` →
   `FilmLook` → `Captions` → Sound (`<Audio vo>` + `MusicBed` + every `Sfx` from the storyboard's SFX column).
5. `DURATION = cue.voiceEnd + 8` (loop) and register it in `src/Root.tsx`.

## Library (`src/lib`)

| Module | Use |
|---|---|
| `theme.ts` | `fonts.ui/punch/hud`, `palettes.night/deep`, `VIDEO` (1080×1920@30) |
| `timing.ts` | `makeCues`, `ramp(f,a,b)`, `keys(f,[[frame,val]…])`, `keys3`, `seeded(seed)`, eases |
| `Captions.tsx` | `<Captions words palette variant="karaoke"|"punch" highlight={[…]} />` |
| `Hud.tsx` | `<StatPill at until from value unit color top/>`, `<Readout … label="DEPTH"/>`, `<Callout title sub x y/>` |
| `Loop.tsx` | `<LoopBridge frames={16} opening={<World/>} />` — last frame = frame 0 |
| `Backdrop.tsx` | `<NightBackdrop palette/>` (CSS sky + stars), `<FilmLook/>` (vignette + grain) |
| `three/core.tsx` | `CameraRig cam={{pos,look,fov,roll}}`, `project(p,cam,w,h)`, `Glow`, `Stars3D`, `TubePath` (glowing path with draw-on `progress`), `ThinLine` |
| `three/PlaneModel.tsx` | procedural airliner (nose −Z), nav-light blink, landing light |
| `ViewMode.tsx` | `<ViewMode mode="thermal"|"whitehot"|"nightvision"|"danger">` wraps a set (canvas included); `<GlitchCut at/>` for mode switches; `<HudOverlay title lines crosshair rec/>`; `Scanlines`, `Grain` |
| `Hud.tsx` (more) | `<Gauge value max unit label x y redFrom/>` dial for comparisons (put both on ONE scale so the gap shows), `<RaceTimer lanes/>` two racing clocks, `<WarningTag text/>` |
| `Sound.tsx` | `<Sfx at name/>` (riser/whoosh/swell auto-lead so they peak on the cue), `<Ticks from to/>` under counters, `<MusicBed name words cuts={[[from,to]]}/>` ducked bed with deliberate silences. Sounds come from `scripts/sfx.py` |
| `three/FlightRecorder.tsx` | orange "black box" with `open` (armor lifts, chip rises), `blueprint` (cyan edges), `char` (burnt), `beacon` (ULB glow) — a template for hero objects with built-in view modes |
| `three/PlaneModel.tsx` `xray` | 0–1 translucent skin + wireframe so parts inside show |
| `three/Humanoid.tsx` | procedural human, `look={{suit, helmet:"hood"|"flight"|"none", stripe}}`, poses `idle walk climb wave float seated`, `mixPose` |

Data: `public/data/land-dots.json` (Natural Earth land as [lat,lon] dots — regenerate with
`node scripts/landdots.mjs <stepDeg>`). Globe/Mercator morph math: `src/videos/great-circle/geo.ts`.

When a storyboard needs something the library lacks (conveyor, building, gauge, submarine…),
build it from primitives in `src/lib/three/` as a reusable, frame-driven component with
props for color/size, then use it. Add it to the table above.

## Hard rules (Remotion)

- Everything is a function of `useCurrentFrame()`. No `useFrame`, no `Math.random()`
  (use `seeded`), no CSS transitions/animations, no timers.
- `<ThreeCanvas width height>` always gets explicit size; `<Sequence layout="none">` inside it.
- Never animate by reading previous state — compute from the frame.
- Fonts come from `theme.ts` only. Text on screen ≥ 30 px at 1080 width.
- Keep the 3D set persistent across beats where possible (one canvas, camera travels).
- **No flicker** (the user notices it immediately):
  - never flip `transparent` on a live material — give the material `key={transparent ? "t" : "o"}`
    (otherwise parallel render tabs disagree → every-3rd-frame flicker);
  - no coplanar faces (z-fighting): inner parts ≥ 0.005 inside, decals ≥ 0.005 off the surface;
  - no fast per-frame oscillation (`Math.sin(f * >0.5)`) on lights, camera shake or opacity —
    slow sines, ≤ 3 swings for a shake; respawning particles fade in;
  - no full white flash frames; `GlitchCut` only on view-mode switches.

## Look recipes

- Glow/bloom: `Glow` sprites (additive) at light sources + `TubePath` (has its own halo).
- Depth: `<fog attach="fog" args={[color, near, far]} />`, `FilmLook` vignette.
- Humans: `shadows` on ThreeCanvas, a `spotLight castShadow` + `hemisphereLight`,
  `ACESFilmicToneMapping`, suits in saturated orange/olive, keep them ≤ 40 % of frame height.
- Night city: thousands of tiny warm `Glow`/points on a dark plane, purple horizon gradient.

## Review loop (do this, don't skip)

1. `npx tsc --noEmit`
2. Stills at every beat cue — fastest: `scripts/stills.sh <slug> <frame> <frame> …` → one sheet
   in `out/stills/<slug>/sheet.jpg`. For a new hero model, build a `_lab` composition first
   (see `src/videos/_lab/LinerLab.tsx`) and check it from 4–6 angles before any scene uses it.
   Manual form:
   `npx remotion still <slug> out/stills/<slug>_<f>.jpg --frame=<f> --scale=0.5`
   then hstack them (`ffmpeg … hstack=N`) and LOOK at the sheet. Check: subject framed,
   labels inside the frame, captions readable, nothing static > 3 s, numbers on screen.
   **Self-review — be strict, the user notices everything.** For every still ask:
   - Is the subject recognisable and fully framed? (9:16 is narrow: an 8-unit object needs
     ~15+ units of camera distance; check horizontal FOV = vertical × 0.56)
   - Does the picture show exactly what the words say at that moment? Numbers semantically
     right (limits like "survives 4" don't count up; counters only for quantities)?
   - Lighting: does the hull/object read, or is it a black silhouette? Is the ground/sea a
     bright smear (smooth surfaces mirror fill lights — keep seas matte)?
   - Hidden things: glows inside geometry, sky objects beyond `fog` far (set `fog={false}`),
     callouts off-screen, captions over HUD.
   - Real-world correctness of models (e.g. wings swept back, not forward).
   Fix, re-render those frames, look again. Only then render.
3. ★ Show the user 3–5 key stills before the full render.
4. `npx remotion render <slug> out/<slug>.mp4 --concurrency=3` (run in background; never at
   the same time as voice.py — this Mac has 16 GB and froze once when both ran heavy).
5. `scripts/qa.sh out/<slug>.mp4` → contact sheets, loop-seam PSNR, loudness and a **flicker
   check** (`scripts/flicker.py`). Every flagged range must be a deliberate cut/impact/glitch —
   look at those frames (`ffmpeg -vf "select='between(n,A,B)',tile=…"`) and fix anything else.
   The seam PSNR is ~24 dB when only the caption differs (intended: last line flows into the hook).
6. Report what is done and what still looks weak — honestly.

Preview for the user: `npm run dev` (Remotion Studio) — use the built-in browser.
