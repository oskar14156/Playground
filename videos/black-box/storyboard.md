# Storyboard — black-box

## Beats
| # | Cue | VO | Set · mode | Visual | Camera | On-screen | Transition / SFX |
|---|---|---|---|---|---|---|---|
| 1 | frame 0 | Black boxes aren't black. | A · normal | recorder in a dark void, only blue rim light → reads as a black silhouette | slow orbit | punch captions, "black" accent | thud on f0, music in |
| 2 | "black" #2 | (same) | A | key spotlight slams on: it's bright orange; light cone + floor pool | orbit continues, push-in | — | impact |
| 3 | "bright orange" | They're bright orange, | A | — | — | Callout HIGH-VIS ORANGE | pop |
| 4 | "search teams" | so search teams can spot them in the wreckage. | B · normal | night debris field, embers, smoke; searchlight beam sweeps | high angle descending | — | whoosh (cut) |
| 5 | "wreckage" | | B | beam lands on the half-buried orange box, ring pulses | push to box | Callout FLIGHT RECORDER | pop |
| 6 | "And they ride" | And they ride in the tail, | C · normal | airliner in dusk clouds, side view | follow, drifting back | — | whoosh (cut) |
| 7 | "tail" | | C · xray | skin turns translucent wireframe, orange box glows in the tail | dolly to the tail | Callout FLIGHT RECORDERS · TAIL | glitch, pop |
| 8 | "most likely" | the part most likely to survive. | C | — | close on tail | — | — |
| 9 | "But the orange" | But the orange box is just armor. | D · blueprint | grid room, solid box, armor plates pulse | 3/4 orbit | — | whoosh (cut) |
| 10 | "The real recorder" | The real recorder is this little chip, | D | box turns to cyan edges, armor lifts away, gold chip rises | push to chip | Callout MEMORY CHIP | swell |
| 11 | "three tests" | and it has to pass three tests. | D | — | — | pills 1 IMPACT · 2 FIRE · 3 OCEAN | 3 × pop |
| 12 | "First" | First, a hit of 3,400 g. | E · normal | test lab: box shot down a rail into a steel block, sparks, white flash, shake | tracks box, holds at wall | Readout [3,400 G] IMPACT TEST | riser → impact, ticks |
| 13 | "A fighter" | A fighter pilot blacks out at 9. | E (dimmed) | lab dims | slow pull-back | twin Gauges on one 0–3,400 scale: BLACK BOX pinned / FIGHTER PILOT barely moves to 9 (red) | pop, ticks |
| 14 | "blacks out" | | E | the frame itself blacks out for a beat | — | — | thud |
| 15 | "Then fire" | Then fire. | F · normal | furnace grate, box in flames, chars over time | orbit | — | whoosh_fast (cut) |
| 16 | "1,100" | 1,100 degrees, for a full hour. | F · thermal | same shot, thermal camera | orbit | Readout [1,100 °C] FURNACE; pill 60 MIN on "full hour" | glitch, ticks |
| 17 | "Then the ocean" | Then the ocean, 20,000 feet down. | G · normal | box sinks, marine snow rising, light shafts fade, water darkens | descending with box | Readout counting to [20,000 FT] DEPTH | whoosh (cut) |
| 18 | "20,000" | | G | red pressure arrows squeeze in from all sides | — | — | thud |
| 19 | "Underwater" | Underwater, a beacon pings every second, for 90 days. | H · nightvision | box on the seabed, sonar rings + wire spheres every 30 frames | slow orbit | HUD SONAR · ULB, 37.5 KHZ; pill 90 DAYS | glitch (cut), beep per ping |
| 20 | "Then it goes" | Then it goes silent. | H | pings stop, image darkens | — | ⚠ SIGNAL LOST, HUD NO SIGNAL | music drops out (deliberate silence) |
| 21 | "So the one" | So the one thing it can't survive is not being found. | A · normal | back in the void, lit orange box | orbit back toward opening pose | — | whoosh, swell on "not being found" |
| 22 | "Which is why" | Which is why… | A | key light fades → rim-only black silhouette = frame 0 | returns to opening | — | LoopBridge 16 f |

## Sets
| Set | What | Beats |
|---|---|---|
| A | dark void, rim + key light | 1–3, 21–22 |
| B | night wreckage + searchlight | 4–5 |
| C | airliner in dusk clouds (x-ray) | 6–8 |
| D | blueprint room | 9–11 |
| E | impact lab + gauges | 12–14 |
| F | furnace (thermal) | 15–16 |
| G | deep ocean | 17–18 |
| H | seabed sonar (night vision) | 19–20 |

## World
- Protagonist: one orange `FlightRecorder` that we follow through every set.
- Palette `deep`; each set has its own light colour (cold blue void, white searchlight, dusk, cyan blueprint, steel lab, fire orange, ocean blue, phosphor green).

## Sound
- Music `tension`, ducked; drops out from "Then it goes" until "So the one".
- Hits listed in the Beats table; beeps sync to the sonar pings (every 30 frames).

## Loop
- Last line: "…not being found. Which is why…" → "Black boxes aren't black."
- Key light fades out during "Which is why", camera returns to the frame-0 pose, LoopBridge dissolves into frame 0.

## Self-check (tension.md)
8 sets · modes: xray, blueprint, thermal, nightvision, danger-ish blackout · stakes: "goes silent" + "blacks out" · comparison: twin gauges 9 vs 3,400 · rehooks: "But the orange box is just armor", "three tests"
≈ 30 visual events in ≈ 36 s = one every ~1.2 s
