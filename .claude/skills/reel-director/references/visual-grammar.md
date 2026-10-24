# Visual grammar (from the 3 reference reels)

## Look

| | FedEx / Memphis (`palette: night`) | Submarine (`palette: deep`) | AC-130 |
|---|---|---|---|
| World | night: navy sky, purple horizon, moon, warm city lights, glowing route arcs | deep blue-grey sea, silt floor, orange hero objects | daylight sky, clouds, green terrain, grey aircraft |
| Hero color | gold `#ffc65c`, pink `#ff4f8b` for "too much" | orange suits/frames, yellow `#ffc531` keywords | yellow guns, green screens |
| Captions | karaoke at top: sentence builds word by word, current word bold, key words in a blue "selection box" | punch: 1–3 words center-low, key word yellow | punch: white bold, lower third |
| Numbers | dark glass pill, big gold number + small unit ("84 miles of belts", "1:00 AM", "300 routes") | bracket readout `[ 594 FT ]` + small label ("DEPTH", "TRUNK PRESSURE") | white number top-left + small sub-unit ("40 mm / 1.57 in") |
| Labels | dark pill with gold border on the map ("Memphis") | yellow tag + leader line ("VIRGINIA CLASS · US NAVY, 377 FT LONG") | none |
| People | none (cartoon cats in the CTA) | orange escape-suit figures with faces | soldiers / pilots in flight suits |

## Camera language

- **Slow constant drift** on every shot — nothing is ever locked off.
- **Push-in on the noun** being said; **pull-back to reveal scale** on the number.
- **Top-down ↔ perspective** switch for maps; tilt the map ~25° for depth.
- **Cut-away / x-ray**: walls go transparent to show the inside (sub hull, cargo hold).
- **Follow cam** along a moving object (plane on a route, box on a conveyor).
- **Orbit** around a hero object while explaining it (escape trunk, gun).
- Transitions: dissolve on sentence ends, match-cut on shape (globe→map morph), whip on energy.

## Recurring devices

- Glowing path being drawn = "movement / route / flow".
- Many → one: lines from many points converge into one hub (FedEx payoff).
- Counter ticking while objects multiply on screen (planes landing, routes appearing).
- Down-arrows pressing on a surface = pressure / force.
- Side-by-side gauges = comparison ("8× a car tire").
- Clock pill advancing (10:30 PM → 1:00 AM → 4:30 AM) = time passing in one night.

## What our code stack can and cannot do

Can (Remotion + Three.js, see reel-build): stylised 3D worlds from primitives, procedural
planes / humans / buildings / conveyors, dot-matrix globes and maps with real coastlines,
glowing routes, fog, soft shadows, counters, captions, loops — all deterministic and editable.

Can't (yet): photoreal faces, realistic water simulation, mo-capped character animation,
detailed CAD-level vehicles. Design around it: keep characters stylised and small or in
suits/helmets, show mechanisms (cut-aways, diagrams) instead of realism, use night/fog to
hide geometry simplicity. Real GLB models can be loaded later if the user provides assets.
