# Why your flight to Tokyo doesn't fly straight
- Question: Why do flights from New York to Tokyo curve up toward the Arctic on a map?
- Length: ~25 s · Language: en · Voice: en-US-AndrewNeural @1.1 (edge-tts)
- Palette: night · Captions: karaoke (top, FedEx style)
- Audience: general, has seen curved flight paths on in-flight maps
- Loop: "Airlines fly close to it every day. Which is why…" → "Your flight from New York to Tokyo doesn't fly straight."

## Facts
1. JFK (40.64°N, 73.78°W) → HND (35.55°N, 139.78°E) great-circle distance ≈ 10,875 km — computed: haversine, R = 6371 km.
2. Rhumb line (= straight line on a Mercator map) across the Pacific ≈ 12,818 km — computed: Δψ = ln(tan(π/4+φ₂/2)/tan(π/4+φ₁/2)), d = √(Δφ² + q²Δλ²)·R.
3. Difference ≈ 1,943 km ("almost 2,000"), the straight map line is ~18 % longer — computed from 1 and 2.
4. The great circle peaks near 69.9°N, north of the Arctic Circle (66.56°N) — computed: φmax = acos(|sin θ · cos φ₁|), initial bearing θ ≈ −27°.
5. Mercator stretches area by 1/cos²(φ): at 60°N shapes are 2× wider and taller than at the equator — standard property; shown with Tissot circles.
6. Real flights deviate from the exact great circle for winds and airspace, hence "fly close to it", not "fly it".
