# Tension toolkit — what makes the reference reels gripping

Learned by comparing our first test (great-circle: one globe, one mood, 25 s) with the three
reference reels frame by frame. Our test was *correct* but flat. The references never let the
viewer settle: the **set**, the **view mode** or the **stakes** change every few seconds.

## 1. Set changes (the biggest gap)

| Reel | Distinct sets in 60–90 s |
|---|---|
| AC-130 | sky exterior · cargo-hold cutaway · gun close-ups · towed howitzer on the ground · top-down orbit circle · fighter-jet comparison · shell-trajectory side view · fire-control computer · HUD crosshair · jungle in darkness · crew stations · low-light TV (green) · infrared (white-hot) · radar beacons · gunners loading by hand · ending exterior — **16** |
| Submarine | seabed exterior · flooding trunk close-up · class tag · crew x-section · depth readouts · pressure arrows on hull · lb/in² disc · twin gauges · wireframe trunk diagram · suits close-up · trunk filling · ascent column · x-ray lungs · surface + raft · next sailors climbing in — **15** |
| FedEx | plane in clouds · night city with landing lights · MEMPHIS title · inside hub hangar · conveyor belts · scanning · planes departing · US route map · pause/cats interrupt · 300 pink routes · 25 gold routes — **11** |

**Rule:** a new set or view mode at least every **5–6 s** (30 s ⇒ ≥ 5 sets). Inside a set, the
1.5–3 s event rule still holds. Sets can live in one Three.js scene (camera flies to another
part of the world) or be separate `<Sequence>`s joined by a motivated transition.

## 2. View modes (cheap, very effective)

Switching how we *see* the same object is a pattern interrupt that costs no new geometry.

| Mode | Look | Use when |
|---|---|---|
| `normal` | lit 3D | default |
| `xray` | object turns translucent / wireframe, inside parts glow | "inside it there is…" |
| `blueprint` | dark background, white/cyan lines, grid floor, dimension labels | explaining structure, sizes |
| `thermal` | white-hot / black-cold gradient map, noise | heat, detection, night |
| `nightvision` | green phosphor, scanlines, vignette | darkness, "they can't see" |
| `hud` | crosshair, brackets, telemetry text, blinking REC | targeting, measuring, "data" |
| `danger` | red tint pulses, alarm SFX, warning label | the stakes moment |

Use **≥ 2 non-normal modes per video**. Library: `<ViewMode mode=…>` and `<HudOverlay>`.

## 3. Stakes — make it matter to a body

Every reference has one moment where a person could die or something could fail:
"their lungs could burst" (x-ray lungs turn red), "in total darkness", "a fighter only gets a
few seconds". Facts alone are trivia; facts + consequence are a story.
**Rule:** one explicit stakes beat (red / danger mode + impact SFX) before the payoff.

## 4. Comparison races and gauges

- **Race timer**: two things side by side, two clocks — fighter jet `2.0 s` (red) vs gunship `13 s`
  (green). The viewer watches one lose.
- **Twin gauges**: `35 PSI` car tire vs `267 PSI` sea pressure → "8 times".
- **Size ladder**: object next to a human / bus / football field.
**Rule:** at least one comparison device per video. Library: `<RaceTimer>`, `<Gauge>`.

## 5. Rehooks (re-open the loop mid-video)

Lines that promise more, placed every ~8–12 s, usually right after a fact lands:
- "But there's a catch."  · "You'll see why in a moment."  · "But first…"
- "And that's not even the crazy part." · "Say it's stuck."  · "Here's the problem."
Write them into the script as their own short sentence and give each one a visual hit
(cut, whoosh, mode switch). They must be paid off — never fake.

## 6. The viewer is in it

"your package", "above you", "the room you're in", "say it's stuck". Second person or a
concrete protagonist (one sailor, one package, one plane) to follow through the sets.

## 7. Sound is half the tension

Our test had voice only. The references have a constant bed + a hit on almost every event.
- Music bed under everything, ducked under the voice (`<MusicBed>`).
- `whoosh` on every camera move / set change, `pop`/`tick` on labels and counters,
  `impact` or `thud` on the stakes beat and the hook's first frame, `riser` into reveals,
  `beep`/`glitch` on HUD and mode switches, `chime` on the payoff.
- Silence is a tool: drop the music for 0.5 s right before the biggest reveal.

## Quick self-check for a storyboard

- [ ] ≥ 5 sets in 30 s, none held > 6 s
- [ ] ≥ 2 view modes besides `normal`
- [ ] 1 stakes beat (danger) · 1 comparison device · 1–3 rehooks
- [ ] a protagonist or "you" the viewer can follow
- [ ] every row has an SFX; one music bed chosen; one deliberate silence
