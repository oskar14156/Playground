// Builds public/data/land-dots.json: [lat, lon] pairs on an even grid, land only.
// Used by dot-matrix globes and flat maps. Data: Natural Earth via world-atlas (public domain).
// Usage: node scripts/landdots.mjs [stepDegrees=1.2]
import fs from "node:fs";
import path from "node:path";
import { feature } from "topojson-client";

const step = Number(process.argv[2] ?? 1.2);
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const topo = JSON.parse(fs.readFileSync(path.join(root, "node_modules/world-atlas/land-110m.json"), "utf8"));
const land = feature(topo, topo.objects.land);

const rings = [];
for (const f of land.features) {
  const polys = f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates;
  for (const poly of polys) rings.push(poly);
}

const inRing = (lon, lat, ring) => {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};
const isLand = (lon, lat) => rings.some((poly) => inRing(lon, lat, poly[0]) && !poly.slice(1).some((h) => inRing(lon, lat, h)));

// Equal-area-ish grid: fewer dots per row near the poles so the globe looks even.
const dots = [];
for (let lat = -84; lat <= 84; lat += step) {
  const n = Math.max(1, Math.round((360 / step) * Math.cos((lat * Math.PI) / 180)));
  for (let k = 0; k < n; k++) {
    const lon = -180 + (k + 0.5) * (360 / n);
    if (isLand(lon, lat)) dots.push([+lat.toFixed(2), +lon.toFixed(2)]);
  }
}
fs.mkdirSync(path.join(root, "public/data"), { recursive: true });
fs.writeFileSync(path.join(root, "public/data/land-dots.json"), JSON.stringify(dots));
console.log(`${dots.length} land dots @ ${step}°`);
