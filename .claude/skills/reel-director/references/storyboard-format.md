# File formats the director writes

All in `videos/<slug>/`.

## brief.md

```md
# <working title>
- Question: <the one question the video answers>
- Length: 30–40 s · Language: en · Voice: <engine + voice, e.g. chatterbox default @1.0 | openai onyx | edge AndrewNeural> · Music: tension
- Palette: night | deep · Captions: karaoke | punch
- Audience: <who, what they already know>
- Protagonist: <the one thing/person the viewer follows through the sets>
- Loop: "<last line>…" → "<hook>"

## Facts
1. <fact> — <source URL or "computed: formula = result">
```

## script.txt

Spoken words only. `#` lines are beat names (ignored by TTS). Blank lines between beats.

## storyboard.md

```md
# Storyboard — <slug>

## Beats
| # | Cue (exact words from words.json) | VO | Set · mode | Visual | Camera | On-screen | Transition / SFX |
|---|---|---|---|---|---|---|---|
| 1 | "Black boxes" | Black boxes aren't black. | A · normal | orange recorder spinning in a dark void, rim light | slow orbit + push-in | punch captions, "black" in accent | impact on f0, music in |
| 2 | "They're bright" | They're bright orange, … | B · xray | airliner flies by; tail goes translucent, recorder glows inside | follow cam → tail | Callout "FLIGHT RECORDER · TAIL" | whoosh, pop on label |
| … |

## Sets
| Set | What it is | Beats |
|---|---|---|
| A | void + hero object | 1, 7 |
| B | airliner in clouds | 2–3 |

## World
- Recurring objects: <recorder, plane, …>
- Lighting / palette: <…>

## Sound
- Music bed: <name>, ducked; deliberate silence before <cue>.
- Hits: impact on hook, whoosh per set change, ticks under counters, riser → <reveal>.

## Loop
- Last line: "Which is why…" — first line completes it.
- Final 16 frames dissolve into frame 0 (LoopBridge). Camera returns to the opening values.

## Self-check (tension.md)
<n> sets · modes: <list> · stakes: <cue> · comparison: <device> · rehooks: <cues>
<n> visual events in <s> s = one every <x> s (target ≤ 3 s)
```

Rules: cues are exact phrases that occur in words.json (the builder resolves them with
`cue.at("…")`). If a phrase occurs twice, write `"the" #2`. Every number in the VO has an
On-screen entry.
