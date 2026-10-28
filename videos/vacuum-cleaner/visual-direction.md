# Vacuum Cleaner V2 — reference analysis and non-negotiable visual target (2026-10-28)

The owner supplied and asked us to visually review **three finished example reels**. The V1 preview on Playground (`src/videos/vacuum-cleaner/VacuumPreview.tsx`) has been **rejected**: it is a mostly flat SVG illustration, **not true 3D**. Do not try to improve it by adding more gradients, flat shapes or permanent banners. Rebuild the video in actual 3D before another full-duration preview. Follow `AGENTS.md` §3a, §3b, §3d and both reel skills.

## Reference 1: AC-130 (91.4 s; owner-uploaded v15044…mov)
- 0–6 s: actual dimensional military aircraft, low-angle camera and changing landscape/sky background.
- 11–20 s: 3D cross-section of aircraft cargo bay with fitted equipment, human operators, mounted guns, monitors; camera goes **inside** the 3D model.
- 24–30 s: plane cross-section and crew cockpit.
- 31–50 s: readable orbit diagram, comparison timers and aircraft geometry.
- 60–85 s: nightvision/thermal changes, operating people and close-ups.
- Takeaway: believable, lit 3D hero object, model detail and camera direction; technical inserts to explain motion.

## Reference 2: Submarine escape (76.1 s; owner-uploaded v12044…mov)
- 0–4 s: ocean-floor 3D scene with a giant submarine, moody dark blue atmosphere.
- 4–10 s: detailed underwater escape trunk cross-section with physically placed orange-suited characters and flooding water.
- 19–32 s: hull pressure cutaway, numeric HUD and 3D pressure measurement inserts.
- 36–50 s: highly spatial interiors, orange suits with faces, gauges and animated liquid levels.
- 53–64 s: submarine, rising person, continuous changing depth readout, bubbles; later x-ray of lungs.
- Takeaway: realistic set context, crisp colored components over predominantly real-looking 3D, precise animated mechanisms and a restrained readable technical HUD.

## Reference 3: FedEx logistics (60.4 s; owner-uploaded reelsvideo.io_…mp4)
- 0–8 s: moving aircraft over a luminous night city with depth, purple sky gradient and runway lights.
- 8–24 s: perspective warehouse with multiple conveyor levels, moving cartons and scanners; long vanishing lines / overhead lights.
- 28–56 s: geographical US route map with many animated pink vs few gold arcs, readable counter badges and moving data.
- 32–37 s: brief intentional pattern-interrupt cats.
- Takeaway: cinematic scale, actual moving processes, purposeful glowing numbers and comparisons; overlays are compact and tied to the narration.

## V2 minimum bar
1. **Actual Three.js meshes** for every primary subject; use Remotion + `@remotion/three`, per-frame deterministic animations, perspective camera with orbit, push-ins, follows and a true 3D cutaway. SVG only for labels/2D explanatory close-ups, never for the room, machine, plush, furniture or people.
2. A *believable furnished 3D apartment*: walls with thickness, high ceiling, windows, detailed shelving, sofa, rug, lights, plant and floor boards, coherent scale and PBR materials, soft shadows, ambient occlusion. No missing ceiling/black edges. Use `src/lib/three/diorama.tsx`, `usePbr`, `KeyLight`, `Post`, actual rigged Quaternius humans rather than flat figures.
3. Keep the original blue `src/lib/three/Plush.tsx` character. It must be a volumetric 3D plush with correctly lit belly, fur surface and googly eyes, not a flat drawing.
4. Build a correctly connected **3D vacuum cleaner** (nozzle and powered brush, hose, impeller, transparent dust bin, cyclone, fine filter, exhaust, handle, wheels and thermal cutout). Correct airflow arrows: air enters the nozzle, moves through collection/separation/filter and leaves exhaust; larger particles collect at cyclone wall/bottom, fine dust is filtered. Distinguish ordinary engineering from intentionally impossible final slapstick gag.
5. Distinct shot types and camera language like the refs: apartment wide/close; fan close-up + x-ray; moving cyclone cutaway; filter comparison; ground-level carpet brush; warning insert; final wide room and transparent bin close-up. Change visual event every 1.5–3 s, set/view mode at least every 5–6 s; use x-ray / blueprint / danger modes. Persistent 'BUILD LOG' top bar and thick full-width lower caption bar from V1 should be removed; captions one large white outlined word as the elevator reel.
6. Use sound design and **a natural English explainer voice**, prefer Chatterbox. A fallback robot voice is for testing only and never presented as production quality.
7. **Proof before full reel:** make **five real 3D hero stills** (room, impeller, cyclone, brush, bin punchline) plus **one 3–5-second moving 3D shot**, review a frame sequence (§3b) and compare to these three references. Only when these look good, render the full low-quality MP4 preview. Never confuse *low resolution* with *low-quality geometry*. Always wait for user approval before final render.

## Planned shot sequence (approx 80–88 seconds)
- 0–8s: blue plush sheds in volumetric 3D room; scale reveal; physical fur cloud; broom scatters clumps.
- 8–18s: impeller starts; air rushes into real nozzle; no collector means fibers blast from exhaust.
- 18–28s: transparent container fills with fiber; filter clogs and flow visibly decreases.
- 28–38s: 3D cyclone zoom and flow spiral; large dirt falls, fine particles continue.
- 38–46s: fine filter and small-particle comparison.
- 46–57s: ground-level rotating brush dislodges fur, cleaner stripe appears behind the nozzle.
- 57–68s: a real hose obstruction, motor temperature warning and thermal cutout.
- 68–80s: clean room reveal, 3D Pocket Puh cartoonishly swallowed by oversized nozzle.
- 80–88s: original 3D plush eyes visible in transparent dust bin, friend dryly says “You cleaned the wrong thing.” End loops visually to the hook.

The three uploaded reference videos are for artistic review, not to redistribute or copy directly. They are not automatically available in the GitHub repository, so keep the above exact descriptions/timestamps for future building sessions.