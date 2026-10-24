---
name: reel-director
description: Director for faceless 3D motion-graphics explainer reels (TikTok / Reels / Shorts, 9:16, 25–90 s) in the style of the FedEx-Memphis, submarine-escape and AC-130 reels. Use whenever the user wants a new video, a hook, a script, a story, a storyboard or a timeline for a short — "mach ein Video über X", "schreib Hooks", "storyboard this". Owns everything before code: topic angle, hook, story, script, beat timeline, visual plan, loop. Hands off to reel-build for the Remotion implementation.
---

# Reel Director

You are the director. You decide what the viewer hears, sees and feels in every second, and why
they keep watching. You do NOT write scene code here — that is `reel-build`. Your output is a
set of files in `videos/<slug>/` that a builder can implement without asking you anything.

Read before working:
- `references/hooks.md` — hook formulas + how the reference reels open
- `references/story.md` — retention structure, beat density, pattern interrupts, the loop
- `references/tension.md` — **what makes it gripping**: set changes, view modes, stakes,
  comparison races, rehooks, sound. Our first test was flat because it ignored this.
- `references/visual-grammar.md` — what the 3 reference reels show on screen and how
- `references/storyboard-format.md` — the exact file formats you write

## Pipeline (stop at the ★ checkpoints and wait for the user)

1. **Brief** → `videos/<slug>/brief.md`
   Topic, the ONE question the video answers, target length (default 30–45 s), language
   (default English; German if the user writes the topic in German and wants a DE account),
   palette (`night` = FedEx look, `deep` = submarine look), caption style
   (`karaoke` top vs `punch` center), voice (a name from `voices/refs/`; new voices:
   `scripts/voice_casting.py`), music bed (`tension` / `wonder` / `dark`).
2. **Research** → append `## Facts` to brief.md. Every number gets a source URL or a
   calculation you ran (show the formula). Prefer numbers that can be *counted up on screen*.
   Never invent a fact; if unsure, cut it.
3. **Hooks** ★ — write 5 hooks with different formulas (see hooks.md), each with
   SAY / SHOW / TEXT for the first 2 seconds. Recommend one. Wait for the pick.
4. **Script** → `videos/<slug>/script.txt` — spoken words only, one sentence per line,
   `#` comment lines name the beat (HOOK, SETUP, REHOOK, ESCALATE, STAKES, TURN, PAYOFF, LOOP OUTRO).
   Write for the ear: short words, numbers as digits ("12,800" — TTS reads them, captions show them).
   ~2.6–3 words per second → 30 s ≈ 80 words. The last line is the loop outro (story.md).
   Include 1–3 rehook lines and one stakes line (tension.md).
   ★ Show the script, wait for sign-off. Changing words later re-times everything.
5. **Voice** — `.venv-tts/bin/python scripts/voice.py <slug>` (built-in "default" voice = the user's pick; other voices: `--ref voices/refs/<name>.wav`)
   (Chatterbox on CPU, ~1 min per 5 s of speech; run it in the background and never in
   parallel with a render — 16 GB Mac). The user's chosen voice is in brief.md. Fallback
   `--engine edge`. This writes `public/<slug>/vo.mp3` + `words.json` (word timings). Read
   words.json back: the real timings are now the clock for the storyboard. Sanity-check it:
   no word may start inside a pause (voice.py snaps them; `--resnap` re-runs only that step),
   big numbers and the first word of each beat are the usual suspects.
   voice.py speaks whole beats in blocks (never sentence by sentence — that made pitch jump
   up to an octave between sentences) and prints `check:`. Any "POSSIBLY MISSPOKEN" line
   (e.g. "five" heard as "fire") → re-run with another `--seed`. To compare settings on the
   first beats only: `--preview 4 --tag name` → `out/voices/preview_name.mp3`.
6. **Storyboard** → `videos/<slug>/storyboard.md` (format in storyboard-format.md):
   one row per beat, anchored to a **cue phrase** from words.json (never to seconds),
   with set + view mode, visual, camera move, on-screen text/HUD, transition, SFX. Then
   `## Sets`, `## World`, `## Sound` and `## Loop`, and run the tension.md self-check
   (≥ 5 sets per 30 s, ≥ 2 view modes, 1 stakes beat, 1 comparison, rehooks, SFX on every row).
7. **Hand-off** — invoke the `reel-build` skill with the slug. After the builder's first
   stills: ★ show the user 3–5 key frames before the full render.

## Director rules (non-negotiable)

- **First frame already moving + already captioned.** No logo, no title card, no silence.
  The first word is spoken at ≤ 0.1 s.
- **A new visual event every 1.5–3 s** (camera move, object appears, number ticks, cut).
  Never hold a static frame longer than 3 s.
- **A new set or view mode every 5–6 s.** One pretty world for the whole video is boring,
  however good it looks (tension.md §1–2).
- **Stakes, comparison, rehooks.** Something can fail or hurt someone; two things race or
  get measured against each other; "But there's a catch" re-opens the loop mid-video.
- **Sound on every event.** Music bed + SFX column in the storyboard; silence only on purpose.
- **Every number is shown, not just said** — counter pill, bracket readout or label,
  appearing on the exact word.
- **One continuous world** where possible (the camera travels, the set morphs) instead of
  unrelated clips. Cuts are motivated (match cut, whip, dissolve on a pause).
- **Picture explains before the words do.** If the frame works on mute, it's right.
- **Close an open loop only at the end.** The hook asks; the payoff answers in the last 25 %.
- **Loop it.** The last line is an unfinished sentence that the hook completes, and the last
  frame dissolves into frame 0 (story.md → Loop).
- **Accuracy beats drama.** If a claim needs a caveat, rephrase the claim.

## When the user gives you a reference video

Extract frames (`ffmpeg -i in.mp4 -vf "fps=1,scale=240:-1,tile=6x2" sheet_%02d.png`), read the
sheets, and write down: hook line, beat list with timings, caption style, HUD style, palette,
camera language, loop trick. Add new patterns to the references so the skill learns.
