import * as THREE from "three";

export type LL = [number, number]; // [lat, lon] degrees

const D = Math.PI / 180;
/** Map center longitude: halfway between New York and Tokyo across the Pacific. */
export const C_LON = -147;
/** Shifts the flat map down so the route sits in the middle of the frame. */
export const MAP_Y = -1.05;

export const NYC: LL = [40.64, -73.78];
export const TYO: LL = [35.55, 139.78];

const wrap = (d: number) => ((((d + 180) % 360) + 360) % 360) - 180;
const mercY = (lat: number) => Math.log(Math.tan(Math.PI / 4 + (Math.max(-85, Math.min(85, lat)) * D) / 2));

export const toSphere = ([lat, lon]: LL, r = 1) => {
  const la = lat * D;
  const lo = wrap(lon - C_LON) * D;
  return new THREE.Vector3(r * Math.cos(la) * Math.sin(lo), r * Math.sin(la), r * Math.cos(la) * Math.cos(lo));
};
export const toPlane = ([lat, lon]: LL, lift = 0) => new THREE.Vector3(wrap(lon - C_LON) * D, mercY(lat) + MAP_Y, lift);

/**
 * The one projection everything uses. morph 0 = globe (rotated by `rot`), 1 = flat Mercator map.
 * `alt` lifts the point off the surface (routes fly above the dots).
 */
export const place = (ll: LL, morph: number, rot: THREE.Quaternion, alt = 0) =>
  toSphere(ll, 1 + alt).applyQuaternion(rot).lerp(toPlane(ll, alt * 0.5), morph);

const toVec = ([lat, lon]: LL) =>
  new THREE.Vector3(Math.cos(lat * D) * Math.cos(lon * D), Math.cos(lat * D) * Math.sin(lon * D), Math.sin(lat * D));
const toLL = (v: THREE.Vector3): LL => [Math.asin(v.z) / D, Math.atan2(v.y, v.x) / D];

/** Great-circle path (shortest route on the sphere), n samples. */
export const greatCircle = (a: LL, b: LL, n = 160): LL[] => {
  const va = toVec(a);
  const vb = toVec(b);
  const om = va.angleTo(vb);
  return Array.from({ length: n }, (_, i) => {
    const t = i / (n - 1);
    const v = va
      .clone()
      .multiplyScalar(Math.sin((1 - t) * om) / Math.sin(om))
      .add(vb.clone().multiplyScalar(Math.sin(t * om) / Math.sin(om)));
    return toLL(v);
  });
};

/** Rhumb line = the straight line on a Mercator map, crossing the Pacific (relative to C_LON). */
export const rhumb = (a: LL, b: LL, n = 160): LL[] => {
  const xa = wrap(a[1] - C_LON);
  const xb = wrap(b[1] - C_LON);
  const ya = mercY(a[0]);
  const yb = mercY(b[0]);
  return Array.from({ length: n }, (_, i) => {
    const t = i / (n - 1);
    const y = ya + (yb - ya) * t;
    return [(2 * Math.atan(Math.exp(y)) - Math.PI / 2) / D, xa + (xb - xa) * t + C_LON];
  });
};

/** Small circle of angular radius r around a center — Tissot's indicatrix. */
export const circleAround = ([lat, lon]: LL, r: number, n = 64): LL[] => {
  const la = lat * D;
  const lo = lon * D;
  const d = r * D;
  return Array.from({ length: n + 1 }, (_, i) => {
    const b = (i / n) * Math.PI * 2;
    const la2 = Math.asin(Math.sin(la) * Math.cos(d) + Math.cos(la) * Math.sin(d) * Math.cos(b));
    const lo2 = lo + Math.atan2(Math.sin(b) * Math.sin(d) * Math.cos(la), Math.cos(d) - Math.sin(la) * Math.sin(la2));
    return [la2 / D, lo2 / D];
  });
};

/** Graticule lines every `step` degrees (only the band we ever see). */
export const graticule = (step = 20): LL[][] => {
  const lines: LL[][] = [];
  for (let lat = -60; lat <= 80; lat += step) lines.push(Array.from({ length: 121 }, (_, i) => [lat, -180 + i * 3] as LL));
  for (let lon = -180; lon < 180; lon += step) lines.push(Array.from({ length: 61 }, (_, i) => [-75 + i * 2.5, lon] as LL));
  return lines;
};

// A handful of real city lights for life on the night globe.
export const CITIES: LL[] = [
  NYC, TYO,
  [34.05, -118.24], [41.88, -87.63], [47.61, -122.33], [37.77, -122.42], [49.28, -123.12], [61.22, -149.9],
  [21.31, -157.86], [19.43, -99.13], [43.65, -79.38], [29.76, -95.37], [33.75, -84.39], [25.76, -80.19],
  [37.57, 126.98], [31.23, 121.47], [39.9, 116.4], [22.32, 114.17], [34.69, 135.5], [43.06, 141.35],
  [1.35, 103.82], [-33.87, 151.21], [14.6, 120.98], [53.0, 158.65], [64.84, -147.72], [51.5, -0.12],
];
