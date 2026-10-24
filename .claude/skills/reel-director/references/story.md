# Story structure & retention

## The spine (30–60 s)

| Beat | Share | Job | Reference example (FedEx) |
|---|---|---|---|
| HOOK | 0–8 % | open the question, subject on screen | "Why do FedEx planes … land in the same city?" |
| SETUP | 8–25 % | name the system, first concrete numbers | "That city is Memphis … 10:30 PM … 140 planes" |
| ESCALATE | 25–45 % | scale up, numbers climb, stakes grow | "84 miles of belts … more than three marathons" |
| INTERRUPT | ~40–50 % | pattern break: pause / CTA / joke / rewind | pause button + cats + "follow really helps" |
| TURN | 50–70 % | the "but why?" — the mechanism | "Picture 25 cities … 300 routes … vs 25 through one hub" |
| PAYOFF | 70–92 % | the answer clicks visually | Memphis hub, "the long way is the shortcut" |
| LOOP OUTRO | last 1–2 s | unfinished sentence → hook | "Subscribe for more." / "Which is why…" |

Short videos (≤ 30 s) drop ESCALATE and INTERRUPT: HOOK → SETUP → TURN → PROOF → PAYOFF → LOOP.

## Beat density

- New visual event every 1.5–3 s. Count them in the storyboard: 30 s ⇒ ≥ 12 events.
- Sentences ≤ 12 words. One idea per sentence. Numbers on their own beat.
- Escalating numbers (10 → 25 → 26 → 129 → 300) are a retention engine: each tick is a
  micro-reward. Prefer a count-up over a static number.

## Pattern interrupts (one per 20–30 s)

- **Fake pause** (FedEx): UI pause button appears, mood switches, a cute/off-topic bit with the
  CTA ("I'm just a student trying to feed my two cats — a follow really helps"), then play.
- **Scale cut**: from macro (globe) to micro (one package, one person) or back.
- **Inside view**: cutaway / x-ray of the object (submarine trunk, AC-130 cargo hold).
- **Gauge / comparison**: "8 times the pressure of a car tire" + two gauges side by side.

## The loop (both submarine and FedEx reels do this)

1. Write the hook so it can be the second half of a sentence.
2. Last spoken line = setup of that sentence, unfinished: "…Which is why…",
   "…and that's why…", "So next time you…".
3. Visually: the final 0.5 s dissolves into the exact first frame (same camera, same set).
   `LoopBridge` in the library does this — the last rendered frame equals frame 0.
4. No end card, no black, no "thanks for watching". The replay should feel like a continuation.

## Writing for voice

- Spoken English, contractions, 2nd person ("your package", "you have to").
- Put the punch word last in the sentence ("…they're all **gone**.").
- Commas create breath pauses in TTS — use them to give big numbers room.
- Read the script against words.json timings: if a beat has no picture change for > 3 s,
  split the sentence or add a visual event.
