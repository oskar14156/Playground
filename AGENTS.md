# motionshorts — agent handbook

You are the director, builder and quality control for **faceless 3D explainer shorts**
(TikTok / Reels / YouTube Shorts): vertical 1080×1920, 30 fps, 30–45 s. Every video is made
entirely from code:
- **Remotion + Three.js** (default): stylised 3D, renders in about 5 min.
- **Blender/EEVEE** (on request): photoreal, renders in about 25–50 min.

Each video has a TTS voiceover, word-synced captions, sound design and a seamless loop.

This file is the complete playbook. It works for any agent that can run shell commands on this
machine: Codex (ChatGPT), Claude Code, Cursor, Gemini CLI, Copilot. Read it fully once per
session. The detailed rules live in the skill files named below; read each one **before** the
step that needs it, even if your tool does not load skills automatically.

> A chat without a terminal (plain ChatGPT or Claude in the browser) can only do steps 1–4 (brief,
> research, hooks, script). Tell the user that rendering needs an agent with shell access.

---

## 0. Ground rules (always)

1. **Talk in the user's language.** Scripts and on-screen text default to English unless the user
   wants another language.
2. **★ = stop and wait for the user.** These are the only points where you stop. Everything
   between them you do on your own.
3. **One heavy job at a time.** Never run TTS and a render (Remotion or Blender) together on a
   16 GB machine; a Mac froze once doing that. Run anything over ~2 min in the background and
   check back.
4. **Keep ≥ 10 GB disk free.** Renders and Blender caches are big; delete `out/*_cache` after use.
5. **Accuracy beats drama.** Every number gets a source URL or a shown calculation. If unsure, cut it.
6. **Review your own output before showing it.** Look at stills and contact sheets. Name what
   still looks weak, honestly. The user notices blinking, floating objects, wrong mechanics and
   unreadable labels immediately.
7. **Secrets:** API keys only as environment variables. Never write them into files, commits or
   logs.
8. **Git:** commit finished work with a clear message. Never push, publish or upload anything
   without the user's OK.

---

## 1. Start of every session

```bash
scripts/doctor.sh
```

- Anything **MISSING** → run `scripts/setup.sh`. It needs Node 18+, ffmpeg and Python 3.11/3.12;
  if those are missing, tell the user the `brew install …` line it prints.
- The last line says which voice engine to use:

| `VOICE:` | Meaning | What you do |
|---|---|---|
| `chatterbox` | local voice model installed | use it (default engine, free, natural) |
| `openai` | `OPENAI_API_KEY` is set | use `--engine openai` (natural, a few cents per video) |
| `ask` | neither | **ask the user** the question below, then continue |

The question for `ask`, in the user's language:

> "There's no natural voice set up on this computer yet. Which one should I use?
> (a) **OpenAI:** natural, a few cents per video. You need an API key from
> platform.openai.com (not the ChatGPT subscription) and run `export OPENAI_API_KEY=sk-…` in
> the terminal.
> (b) **Local Chatterbox:** free and natural, ~3 GB download, needs 16 GB RAM. I run
> `scripts/setup.sh --local-voice`.
> (c) **edge-tts:** free and instant, but sounds more robotic."

- Blender is only needed for the photoreal pipeline (section 4). If it is missing and the user
  wants that pipeline, tell them to run `brew install --cask blender` (macOS) or install from
  blender.org.

---

## 2. Pick the pipeline

| User says | Pipeline |
|---|---|
| "Make a video about X", "next video", nothing about style | **Remotion** (section 3) |
| "realistic", "like real", "photoreal", "in Blender", "fire/smoke/water must look real" | **Blender** (section 4), still built on the Remotion steps 1–6 |
| "fix shot N", "voice deeper", "render again" | **Edit** (section 5) |

The slug is a short kebab-case name for the video (`black-box`, `titanic`). The same slug is
used in every folder.

---

## 3. Remotion pipeline (default)

Read first: `.claude/skills/reel-director/SKILL.md`, then the files in its `references/`
folder (`hooks.md`, `story.md`, `tension.md`, `visual-grammar.md`, `storyboard-format.md`).

### Step 1: Brief → `videos/<slug>/brief.md`
- The ONE question the video answers.
- Length (default 30–40 s), language and audience.
- Palette (`night` or `deep`), caption style (`punch` centre or `karaoke` top).
- Music bed (`tension`, `wonder` or `dark`) and the voice engine from step 0.

If the user gave no topic, propose 3–5 with a reason each (trends, curiosity gap, visual potential).

### Step 2: Research → `## Facts` in brief.md
- Every fact gets a source URL or a calculation.
- Prefer numbers that can count up on screen.

### Step 3: Hooks ★
- Write **5 hooks with different formulas** (`references/hooks.md`).
- Each hook has SAY / SHOW / TEXT / LOOP lines.
- Recommend one. **Stop and wait for the pick.**

### Step 4: Script ★ → `videos/<slug>/script.txt`
- Spoken words only, one sentence per line.
- `#` lines name the beat (HOOK, SETUP, REHOOK, STAKES, TURN, PAYOFF, LOOP OUTRO).
- Blank lines separate beats. Numbers are written as digits.
- About 80 words per 30 s.
- 1–3 rehooks and one stakes line.
- The last line is an unfinished sentence that the hook completes (the loop).
- **Show the script and wait for the OK.** Changing words later re-times everything.

### Step 5: Voice → `public/<slug>/vo.mp3` + `words.json`

```bash
.venv-tts/bin/python scripts/voice.py <slug> --engine <chatterbox|openai|edge>
```
- Run it in the background.
- Chatterbox needs about 1 min per 5 s of speech; OpenAI and edge take seconds.
- Options:
  - chatterbox: `--ref voices/refs/<name>.wav` for another voice, `--seed N` for another take,
    `--pitch -1` is the default.
  - openai: `--voice onyx|ash|echo|sage`.
  - edge: `--voice en-US-AndrewNeural`, German `de-DE-ConradNeural`.
  - Your own recording: `--engine file --audio take.m4a`.
- After it finishes, read the `check:` line. Any "POSSIBLY MISSPOKEN" → re-run with another
  `--seed` (chatterbox) or rephrase the line.
- Open `words.json`: these timings are now the clock. Big numbers and the first word of each beat
  are the usual problem spots.

### Step 6: Storyboard → `videos/<slug>/storyboard.md`
Format: `references/storyboard-format.md`.
- One row per beat, anchored to a **cue phrase** from words.json, never to seconds.
- Each row has set + view mode, visual, camera, on-screen text, transition and SFX.
- Self-check from `tension.md`:
  - ≥ 5 sets per 30 s and ≥ 2 view modes (thermal, x-ray, blueprint …).
  - A new visual event every 1.5–3 s.
  - A stakes beat, a comparison and rehooks.
  - SFX on every row.
  - A loop plan.

### Step 7: Build → `src/videos/<slug>/`
Read first: `.claude/skills/reel-build/SKILL.md` (architecture, library table, hard rules,
review loop). For Remotion API details, also read
`.claude/skills/remotion-best-practices/SKILL.md`.

- Copy the shape of `src/videos/black-box/` (`cues.ts`, `sets.tsx`, `<Name>.tsx`).
- All timing comes from `cue.at("phrase")` in one `c = {…}` table.
- Reuse `src/lib` (Captions, Hud, Loop, ViewMode, Sound, `three/*` models). New models go into
  `src/lib/three/` as reusable, frame-driven components.
- Register `<Composition id="<slug>" …>` in `src/Root.tsx`.
- `npx tsc --noEmit` must pass.

### Step 8: Stills review ★

```bash
scripts/stills.sh <slug> <frame> <frame> …     # one frame per beat → out/stills/<slug>/sheet.jpg
```
Look at the sheet and go through the questions in reel-build → "Review loop":
- Is the subject framed?
- Does the picture match the words at that moment?
- Are the labels inside the frame?
- Do objects float, z-fight or sit inside other objects?
- Are the mechanics real?

Fix and look again. Then **show the user 3–5 key stills and wait.**

### Step 9: Render + QA

```bash
npx remotion render <slug> out/<slug>.mp4 --concurrency=3    # background
scripts/qa.sh out/<slug>.mp4
```
qa.sh prints contact sheets (`out/<slug>.qa/`), duration, loudness (target about −14 LUFS),
the loop seam PSNR and **flicker ranges**.
- Every flicker range must be a deliberate cut, flash or glitch. Look at those frames and fix
  anything else.
- A seam PSNR around 24 dB is fine when only the caption differs.

### Step 10: Deliver
- Send or point to `out/<slug>.mp4`.
- In 3–6 lines, say what is in it, what you checked, and what still looks weak.
- Commit: `git add -A && git commit -m "<slug>: …"`.

---

## 4. Blender pipeline (photoreal)

Do steps 1–6 as above. Then read `.claude/skills/reel-build/SKILL.md` → "Blender pipeline".
Reference implementation:
- `blender/titanic.py`: shots, a real-scale model, a wreck scan, screen-position export.
- `src/videos/titanic/TitanicBlender.tsx`: the overlay composition.

1. **Script** `blender/<slug>.py`:
   - `C.Cues("<slug>")` reads the same cue phrases as `cues.ts`.
   - One `@shot(name, start, end)` function per 3D set; each builds a fresh scene.
   - Helpers are in `blender/common.py`; models in `blender/models/` (real scale, metres).
   - Diagram or vector sets can stay Remotion components.
2. **Models:** build from primitives at real-world dimensions, then check them in a look-dev
   render from 3+ angles before using them in a shot.
   - Textures and HDRIs: Poly Haven (CC0), stored as
     `public/textures/<name>_{diff,nor_gl,rough}.jpg`.
   - Signs and labels: generate PNGs with Pillow (see `blender/make_labels.py`).
3. **Look-dev stills:**
   `blender -b -P blender/<slug>.py -- --stills 0,150,300 --res 30 --samples 8`
   → `out/stills/…`. Tile them and look hard.
4. **★ Draft video** (about 3 min):
   ```bash
   blender -b -P blender/<slug>.py -- --render --draft      # low-res frames → public/<short>/draft
   npx remotion render <slug>-blender out/<slug>-blender-draft.mp4 --props='{"plate":"<short>/draft"}' --scale=0.5
   ```
   **Send the draft and wait for feedback.** Never start the long final render without it.
5. **Final:** `blender -b -P blender/<slug>.py -- --render` (background, 25–50 min).
   Then the Remotion render and `qa.sh`. To fix one shot, use `--only <shot>` and re-render
   only that shot.
6. Rendered frames are gitignored. A fresh clone has to re-run the Blender render before the
   `*-blender` compositions can render.

---

## 5. Editing an existing video

| Request | Do |
|---|---|
| "Shot N looks bad because …" | Fix the set code; stills of that range; re-render |
| Voice deeper / different | Re-run `voice.py` (e.g. `--pitch -2`, other `--voice`/`--ref`). Cues re-time automatically; check stills at every cue |
| Change words | Edit `script.txt` → voice again → check the storyboard cue phrases still exist (`cue.at` throws if not) |
| Slower pacing | Longer gaps (`--gap`, `--beat-gap`) or `--speed 0.95`; more visual events per beat |
| Another language | New slug, translated script, a voice for that language, same sets |

---

## 6. Troubleshooting

| Symptom | Cause / fix |
|---|---|
| `cue "…" not in words.json` | Script or voice changed. Use phrases that exist in words.json |
| `POSSIBLY MISSPOKEN` | TTS mumbled. Use another `--seed`, or rephrase that word |
| voice.py "memory down to N% — aborting" | Close browsers, simulators and other heavy apps, then retry. Never run it during a render |
| edge-tts "NoAudioReceived" | voice.py retries 5×. Wait a minute and run it again |
| OpenAI 401/429 | Key wrong or no credit. Ask the user to check platform.openai.com |
| Elements blink every few frames | `transparent` toggled on a live material, coplanar faces, or fast sines (reel-build hard rules) |
| Objects float or sit inside each other | Check positions against the real dimensions. Add a lab composition and look from 3 angles |
| Black or empty still | Camera inside geometry, wrong look-at, fog too dense, or a light at 0 |
| Blender `AttributeError` on scene/action APIs | Blender 5 changes: use `scene.compositing_node_group` and `C.fcurves(id)` |
| Disk nearly full | Delete `out/*_cache`, old `out/stills`, and draft frames |

---

## 7. Done checklist (all must be true before you say "done")

- [ ] `npx tsc --noEmit` passes.
- [ ] You reviewed stills for every beat and fixed everything wrong.
- [ ] The final render exists, and `qa.sh` shows about −14 LUFS and no unexplained flicker.
- [ ] Captions are readable and never cover a label or HUD element.
- [ ] Every number on screen matches the facts in brief.md.
- [ ] The last frame flows into frame 0 (the loop).
- [ ] The work is committed, and you told the user what is weak.

---

## 8. Repo map

```
AGENTS.md / CLAUDE.md / GEMINI.md   this handbook (CLAUDE/GEMINI import it)
README.md                           human guide (German)
.claude/skills/reel-director/       step-by-step director playbook + references/
.claude/skills/reel-build/          builder playbook, library table, review loop, Blender pipeline
.claude/skills/remotion-*/          official Remotion know-how
videos/<slug>/                      brief.md, script.txt, storyboard.md
public/<slug>/                      vo.mp3, words.json
public/textures, sfx, music         CC0 textures/HDRIs, generated sounds
src/lib/                            captions, HUD, loop, view modes, sound, three/* 3D models
src/videos/<slug>/                  the video code; registered in src/Root.tsx
blender/                            Blender pipeline: common.py, models/, one script per reel
scripts/                            setup, doctor, voice, sfx, stills, qa, flicker
out/                                renders, stills, QA sheets (gitignored)
```

Existing videos to learn from (`src/videos/` + `videos/`):
- black-box (multi-set reference)
- titanic (+ Blender version)
- volcano
- php2shell
- meteors
- coaster-loop
- great-circle (one continuous world)

---

## 9. Licences
- **Remotion:** free for individuals and companies of up to 3 people; bigger teams need a
  company licence (remotion.dev/license).
- **Textures and HDRIs:** CC0 from Poly Haven.
- **Sounds and music:** generated by `scripts/sfx.py`, no samples.
- **Voices:** only clone voices you have the rights to.
