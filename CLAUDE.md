# motionshorts — faceless 3D motion-graphics reels

Vertical (1080×1920, 30 fps) explainer shorts made entirely in code: Remotion + Three.js,
free TTS voiceover, word-synced captions, seamless loops. No Blender, no stock footage.

## Workflow
1. `reel-director` skill — brief → research → 5 hooks ★ → script ★ → voice → storyboard
2. `reel-build` skill — storyboard → `src/videos/<slug>/` → stills ★ → render → QA

★ = stop and let the user decide.

## Layout
- `videos/<slug>/` — director files: brief.md, script.txt, storyboard.md
- `public/<slug>/` — vo.mp3 + words.json (from `scripts/voice.py`)
- `src/lib/` — shared component library (see reel-build skill for the API)
- `src/videos/<slug>/` — the video code; registered in `src/Root.tsx`
- `out/` — renders, stills, QA sheets (gitignored)

## Commands
- Voice (Chatterbox, local, CPU): `.venv-tts/bin/python scripts/voice.py <slug> --ref voices/refs/<name>.wav`
  (omit `--ref` for the built-in voice; `--engine edge --voice en-US-AndrewNeural` = old fast fallback)
- Re-time words only (after editing alignment logic): `.venv-tts/bin/python scripts/voice.py <slug> --resnap`
- Review stills: `scripts/stills.sh <slug> 0 120 300 …` → `out/stills/<slug>/sheet.jpg`
- Voice casting (same lines in all voices): `.venv-tts/bin/python scripts/voice_casting.py` → `out/voices/`
- Sound library: `.venv/bin/python scripts/sfx.py` → `public/sfx/*.wav`, `public/music/*.wav`
- Preview: `npm run dev`
- Still: `npx remotion still <slug> out/stills/x.jpg --frame=120 --scale=0.5`
- Render: `npx remotion render <slug> out/<slug>.mp4 --concurrency=3`
- QA: `scripts/qa.sh out/<slug>.mp4`
- Typecheck: `npx tsc --noEmit`

## Notes
- **16 GB Mac, keep ≥ 10 GB disk free.** On 2026-10-23 Chatterbox on the GPU (MPS) took 9 GB
  while the disk was full (no room for swap) and macOS froze → watchdog reboot. voice.py now
  runs on CPU in a child process, checks disk/memory first and aborts if the system drops
  below 18 % free memory. Never run TTS and a render at the same time.
- Voice quality: Chatterbox must speak whole beats in one go (block mode in voice.py) with
  cfg 0.4 / exaggeration 0.6 — the settings of the casting sample the user picked — and
  1 semitone lower (`--pitch -1`, the default; the user wanted it a bit deeper). Watch the
  `check:` line for misspoken words.
- edge-tts sometimes answers with no audio; voice.py retries. Its `rate=` option is broken,
  so speed is applied with ffmpeg atempo.
- Remotion license: free for individuals and companies of up to 3 people.
