# HANDOFF POINTER — 2026-10-29

Full private project history, all owner feedback, source files and run IDs:
https://github.com/oskar14156/motionshorts/blob/main/docs/HANDOFF_VACUUM_2026-10-29.md

**Repository:** oskar14156/Playground, active branch `vacuum-v2-3d`.
**Status:** Not release-quality; user rejected all existing primitive-based 3D shorts. Technical video renders succeeded, but the visual target is the supplied AC-130/submarine/FedEx-style detailed 3D motion graphics. Do not call previous renders visually approved.
**Series canon:** Pocket Puh is now a wearable orange-and-white fox fursuit head/helmet, not the older blue plush.

**Critical next task:** Two files have been committed, but **not yet tested or rendered**:
- `scripts/polyhaven_asset.py` — CC0 PBR/glTF model + texture downloader; must validate API schema/asset slug first.
- `blender/fox_pbr_living_room_hero.py` — replacement 3-camera PBR interior that imports licensed external sofa geometry.

Create and run a cloud Blender QA workflow on `vacuum-v2-3d`; inspect actual render frames before adding animated 3D motion. No full-quality render/publication until the owner approves the low-quality preview.

Additional review detail: `videos/vacuum-cleaner/active3d-qa-2026-10-28.md`, `videos/vacuum-cleaner/blender-review-log.md`.

Most recent verified GitHub Actions:
- https://github.com/oskar14156/Playground/actions/runs/40764603537 — 5s GLB room/fox, success, visually poor
- https://github.com/oskar14156/Playground/actions/runs/40763518607 — full 3D animation V2, success, visually poor
- https://github.com/oskar14156/Playground/actions/runs/40763494510 — improved cyclone 5s, success, still below reference

**Do not restart submarine, reuse blue Pocket Puh, or render PNG pan/zoom as a supposed 3D animation.**
