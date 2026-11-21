import React from "react";
import { AbsoluteFill } from "remotion";
import { fonts } from "../../lib/theme";
import { easeOut, keys, keys3, ramp, seeded } from "../../lib/timing";
import { Cam, V3 } from "../../lib/three/core";
import usDots from "../../../public/data/us-dots.json";
import { c } from "./cues";
import { at, BigNum, Board, Canvas, InfoTag } from "./kit";
import { Model, Outfit } from "../../lib/three/gltf";
import { Bathtub, Bookshelf, Can, Car, Cyl, labelTex, Frame, Fridge, FrontDoor, House, KeyLight, Lamp, Plant, RB, Rug, Slab, Sofa, Streetlight, tex, Tree, Window } from "../../lib/three/diorama";

type SetProps = { f: number };

// ───────────────────────── people (CC0 Quaternius bodies + animation library) ─────────────────────────
export const YOU_OUTFIT: Outfit = { top: "#4c5a3c", pants: "#2c3440", shoes: "#2a2420" };
const PEOPLE = ["man_b.glb", "woman_a.glb", "man_c.glb", "woman_b.glb", "man_d.glb", "woman_c.glb"];
const OUTFITS: Outfit[] = [
  { top: "#3d5a80", pants: "#2b2f36", shoes: "#d8d4cc" },
  { top: "#8a3f3a", pants: "#3a4a6a", shoes: "#e8e4dc" },
  { top: "#c9b48a", pants: "#4a3a2a", shoes: "#2a2420" },
  { top: "#2f4f4f", pants: "#1f2228", shoes: "#2a2a2a" },
  { top: "#d9d4cb", pants: "#3a4a6a", shoes: "#8a3f3a" },
  { top: "#7a5a8a", pants: "#2c3440", shoes: "#e8e4dc" },
  { top: "#c08a3e", pants: "#2b2f36", shoes: "#2a2420" },
];
const HAIR = ["#2a1d14", "#5a3a22", "#1a1a1a", "#8a6a3a", "#3b2a1e"];
const LIB1 = "ual/ual1_ue.glb";
const LIB2 = "ual/ual2.glb";
const ZOMBIE_OUTFIT: Outfit = { top: "#5a5550", pants: "#3a3530", shoes: "#2a2420" };

/** You: man_a with beard, olive top — always the same person. */
const You3D: React.FC<{ p: V3; ry?: number; clip: string; t: number; lib?: string }> = ({ p, ry = 0, clip, t, lib = LIB1 }) => (
  <Model file="man_a.glb" anims={lib} clip={clip} t={t} p={p} ry={ry} outfit={YOU_OUTFIT} tint={{ Hair: "#3b2a1e" }} />
);
const fadeIn = (f: number, a: number, d = 8) => ramp(f, a, a + d, easeOut);

// ───────────────────────── A · living room, the TV news (hook) ─────────────────────────
const TV_C: V3 = [0, 1.55, -3.835]; // front face of the bezel: the HTML screen is projected exactly here
const TV_W = 2.3;
const TV_H = 1.3;

const LivingRoom: React.FC<{ evening?: boolean }> = ({ evening }) => {
  const floor = tex("planks", "#9a6a3e", [3, 3], 2);
  const wall = tex("wallpaper", evening ? "#b9a68a" : "#dccbb0", [4, 2], 3);
  return (
    <group>
      <Slab p={[0, -0.05, 0]} s={[9, 0.1, 8]} map={floor} rough={0.6} />
      <Slab p={[0, 1.6, -4]} s={[9, 3.2, 0.12]} map={wall} rough={0.95} />
      <Slab p={[-4.5, 1.6, 0]} s={[0.12, 3.2, 8]} map={wall} rough={0.95} />
      <Slab p={[4.5, 1.6, 0]} s={[0.12, 3.2, 8]} map={wall} rough={0.95} />
      <RB p={[0, 0.06, -3.93]} s={[9, 0.12, 0.04]} r={0.005} color="#f1ebe0" />
      {/* ceiling + crown molding, so high shots never look past the walls into black */}
      <Slab p={[0, 3.25, 0]} s={[9, 0.1, 8]} color={evening ? "#d9cbb6" : "#f2ece2"} rough={0.95} />
      <RB p={[0, 3.14, -3.92]} s={[9, 0.12, 0.08]} r={0.01} color="#f4efe6" />
      <hemisphereLight args={[evening ? "#ffcf9e" : "#fff4e2", "#4a3626", evening ? 0.35 : 0.75]} />
      <KeyLight p={[-7, 3.4, 0.6]} target={[0, 0.5, 0]} intensity={evening ? 0.9 : 2.6} color={evening ? "#ff9a55" : "#fff1d8"} size={6} />
      <Window p={[-4.43, 1.75, -0.4]} ry={Math.PI / 2} s={[1.8, 1.4]} sky={evening ? "#ff9a5c" : "#d8ecff"} glow={evening ? 0.9 : 1.5} curtains="#8f5a44" />
      {/* TV wall */}
      <RB p={[0, 0.26, -3.62]} s={[3.2, 0.5, 0.6]} r={0.03} color="#4a3626" />
      {[-1.0, 0, 1.0].map((x) => (
        <RB key={x} p={[x, 0.26, -3.31]} s={[0.92, 0.38, 0.02]} r={0.01} color="#5a4430" />
      ))}
      {/* slim wall-mounted TV: thin bezel, back panel, faint screen glow on the wall */}
      <RB p={[0, 1.55, -3.86]} s={[2.38, 1.38, 0.04]} r={0.012} color="#0a0a0c" rough={0.18} metal={0.3} />
      <RB p={[0, 1.55, -3.9]} s={[2.0, 1.0, 0.05]} r={0.02} color="#18181b" rough={0.4} />
      <mesh position={[0, 1.55, -3.93]}>
        <planeGeometry args={[3.2, 2.0]} />
        <meshBasicMaterial color="#6f9fe0" transparent opacity={0.08} />
      </mesh>
      <pointLight position={[0, 1.55, -3.2]} intensity={evening ? 7 : 3} distance={5} color="#9cc4ff" />
      <Plant p={[-2.1, 0, -3.5]} s={1.2} />
      <Frame p={[2.4, 2.0, -3.92]} s={[0.8, 0.6]} art="#6f8fa8" />
      <Frame p={[3.4, 1.7, -3.92]} s={[0.5, 0.7]} art="#b0805a" />
      <Bookshelf p={[4.24, 0, -1.6]} ry={-Math.PI / 2} />
      <Lamp p={[3.6, 0, 1.6]} on={evening ? 1 : 0.35} />
      {/* sofa, coffee table, rug — you on the sofa */}
      <Rug p={[0, 0.005, 0.2]} s={[3.6, 2.6]} color="#8a3f3a" />
      <Sofa p={[0, 0, 1.3]} ry={Math.PI} />
      <RB p={[0, 0.36, -0.2]} s={[1.5, 0.08, 0.75]} r={0.03} color="#7a5638" />
      {[-0.65, 0.65].map((x) => [-0.3, 0.3].map((z) => <RB key={`${x}${z}`} p={[x, 0.17, -0.2 + z]} s={[0.07, 0.34, 0.07]} r={0.02} color="#5a3f28" />))}
      <Cyl p={[0.35, 0.47, -0.1]} r={0.06} h={0.13} color="#e9e3d6" rough={0.4} />
      <RB p={[-0.3, 0.42, -0.25]} s={[0.36, 0.03, 0.12]} r={0.01} color="#1a1a1a" />
      <You3D p={[0.45, 0.0, 1.05]} ry={Math.PI} clip="Sitting_Idle_Loop" t={0} />
    </group>
  );
};

/** What the TV shows, as HTML laid over the projected screen rectangle. */
const NewsScreen: React.FC<{ f: number; update?: boolean }> = ({ f, update }) => {
  const ticker = update ? "300 CASES CONFIRMED · HOSPITALS TURNING PATIENTS AWAY · STAY INDOORS · " : "VIOLENT ATTACKS IN COLUMBUS · AUTHORITIES URGE RESIDENTS TO STAY INDOORS · ";
  const crawl = -((f * 5) % 1400);
  let body: React.ReactNode;
  if (update) {
    body = (
      <div style={{ textAlign: "center", paddingTop: 70 }}>
        <div style={{ fontFamily: fonts.punch, fontWeight: 800, fontSize: 150, color: "#ff3b30", lineHeight: 1 }}>{Math.round(20 + 280 * ramp(f, c.news2, c.news2 + 24, easeOut))}</div>
        <div style={{ fontFamily: fonts.hud, fontWeight: 700, fontSize: 46, letterSpacing: 6, color: "#fff" }}>CONFIRMED CASES</div>
        {f >= c.hospitals ? <div style={{ marginTop: 26, display: "inline-block", padding: "8px 22px", background: "#ff3b30", color: "#fff", fontFamily: fonts.hud, fontWeight: 700, fontSize: 38, letterSpacing: 3 }}>HOSPITALS OVERWHELMED</div> : null}
      </div>
    );
  } else if (f < c.bread) {
    body = (
      <div style={{ position: "relative", height: "100%" }}>
        {/* anchor silhouette at a desk */}
        <div style={{ position: "absolute", left: 360, top: 70, width: 150, height: 150, borderRadius: "50%", background: "#3a2f2a" }} />
        <div style={{ position: "absolute", left: 300, top: 205, width: 270, height: 200, borderRadius: "120px 120px 0 0", background: "#283447" }} />
        <div style={{ position: "absolute", left: 120, top: 330, width: 720, height: 90, background: "#1d2533" }} />
        <div style={{ position: "absolute", left: 600, top: 60, padding: "10px 18px", background: "rgba(0,0,0,0.6)", fontFamily: fonts.hud, fontWeight: 700, color: "#fff", fontSize: 34 }}>
          <div style={{ color: "#ff3b30", fontSize: 26, letterSpacing: 3 }}>INFECTED</div>
          <div style={{ fontSize: 76, lineHeight: 1 }}>{Math.round(3 + 17 * ramp(f, 4, 40, easeOut))}</div>
        </div>
      </div>
    );
  } else if (f < c.hour) {
    // the source: one bad batch of flour
    body = (
      <div style={{ position: "relative", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 60 }}>
        <div style={{ width: 230, height: 300, background: "#efe6d2", borderRadius: "30px 30px 12px 12px", position: "relative", boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}>
          <div style={{ position: "absolute", top: 90, width: "100%", textAlign: "center", fontFamily: fonts.punch, fontWeight: 800, fontSize: 44, color: "#6b4e2e" }}>FLOUR</div>
          <div style={{ position: "absolute", top: 150, width: "100%", textAlign: "center", fontFamily: fonts.hud, fontWeight: 700, fontSize: 24, color: "#6b4e2e" }}>BATCH #2291 · OHIO</div>
          {f >= c.flour + 6 ? <div style={{ position: "absolute", top: 200, left: -30, transform: "rotate(-14deg)", border: "6px solid #e0302a", color: "#e0302a", padding: "2px 14px", fontFamily: fonts.hud, fontWeight: 800, fontSize: 40, letterSpacing: 3, opacity: fadeIn(f, c.flour + 6, 4) }}>CONTAMINATED</div> : null}
        </div>
        <div style={{ width: 210, height: 190, background: "#c98b45", borderRadius: "70px 70px 20px 20px", border: "14px solid #8a5524" }} />
      </div>
    );
  } else if (f < c.bite) {
    // one family, one hour
    const people = [0, 1, 2, 3];
    body = (
      <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 30 }}>
        <div style={{ display: "flex", gap: 46, alignItems: "flex-end" }}>
          {people.map((i) => {
            const turned = f >= c.hour + 6 + i * 7;
            const h = i < 2 ? 260 : 190;
            return (
              <div key={i} style={{ width: h * 0.42, height: h, position: "relative" }}>
                <div style={{ width: h * 0.3, height: h * 0.3, margin: "0 auto", borderRadius: "50%", background: turned ? "#7d1f1f" : "#d9d4cb" }} />
                <div style={{ width: "100%", height: h * 0.66, marginTop: 6, borderRadius: "40px 40px 6px 6px", background: turned ? "#a32a2a" : "#e7e2d8" }} />
              </div>
            );
          })}
        </div>
        <div style={{ fontFamily: fonts.hud, fontWeight: 700, fontSize: 46, letterSpacing: 6, color: "#fff" }}>ONE FAMILY · ONE HOUR</div>
      </div>
    );
  } else if (f < c.word) {
    // the bite → 30 minutes
    const t = ramp(f, c.min30 - 6, c.min30 + 18);
    body = (
      <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 40, fontFamily: fonts.hud, fontWeight: 700, color: "#fff" }}>
        <div style={{ fontSize: 60, padding: "14px 26px", background: "#2a3242" }}>BITE</div>
        <div style={{ fontSize: 70 }}>→</div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 110, color: "#ffd166", lineHeight: 1 }}>{Math.round(30 * t)}:00</div>
          <div style={{ fontSize: 30, letterSpacing: 4 }}>MINUTES</div>
        </div>
        <div style={{ fontSize: 70 }}>→</div>
        <div style={{ fontSize: 60, padding: "14px 26px", background: "#a32a2a" }}>TURNS</div>
      </div>
    );
  } else {
    body = (
      <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontFamily: fonts.punch, fontWeight: 800, fontSize: 96, color: "#fff", letterSpacing: 2, textAlign: "center", lineHeight: 1.05 }}>
          “UNCONTROLLABLE”
          <div style={{ fontFamily: fonts.hud, fontSize: 34, letterSpacing: 6, color: "#ff6b6b", marginTop: 14 }}>OFFICIALS URGE CALM</div>
        </div>
      </div>
    );
  }
  return (
    <div style={{ width: 960, height: 540, position: "relative", overflow: "hidden", background: "linear-gradient(180deg,#0f1a2e,#0a1120)" }}>
      {body}
      <div style={{ position: "absolute", left: 0, top: 0, padding: "8px 18px", background: update ? "#d9881c" : "#d32f2f", color: "#fff", fontFamily: fonts.hud, fontWeight: 800, fontSize: 30, letterSpacing: 3 }}>{update ? "UPDATE · 2:00 PM" : "BREAKING NEWS"}</div>
      <div style={{ position: "absolute", left: 0, bottom: 52, padding: "8px 18px", background: "#fff", color: "#111", fontFamily: fonts.hud, fontWeight: 800, fontSize: 32, letterSpacing: 2 }}>OUTBREAK · COLUMBUS, OHIO</div>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 50, background: "#c62828", overflow: "hidden" }}>
        <div style={{ position: "absolute", left: crawl, top: 8, whiteSpace: "nowrap", color: "#fff", fontFamily: fonts.hud, fontWeight: 700, fontSize: 28, letterSpacing: 2 }}>
          {ticker.repeat(4)}
        </div>
      </div>
      {/* scanlines so it reads as a screen */}
      <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(0deg, rgba(0,0,0,0.12) 0 2px, transparent 2px 4px)" }} />
    </div>
  );
};

export const SetTV: React.FC<SetProps & { update?: boolean }> = ({ f, update }) => {
  const a = update ? c.news2 : 0;
  const cam: Cam = update
    ? { pos: keys3(f, [[c.news2, [0.9, 1.8, 3.6]], [c.news2 + 30, [0.1, 1.58, 2.1]], [c.figured, [0.08, 1.56, 1.9]]]), look: [0, 1.55, -3.5], fov: 42 }
    : {
        pos: keys3(f, [
          [0, [1.9, 2.3, 3.9]],
          [c.anchor + 10, [0.1, 1.58, 2.1]],
          [c.word, [0.08, 1.56, 1.9]],
          [c.zombies + 6, [2.3, 2.4, 4.2]],
          [c.stay, [2.5, 2.45, 4.4]],
        ]),
        look: keys3(f, [
          [0, [0, 1.3, -3.5]],
          [c.anchor + 10, [0, 1.55, -3.5]],
          [c.zombies + 6, [0, 1.2, -2.5]],
        ]),
        fov: 42,
      };
  void a;
  const tl = at(cam, [TV_C[0] - TV_W / 2, TV_C[1] + TV_H / 2, TV_C[2]]);
  const br = at(cam, [TV_C[0] + TV_W / 2, TV_C[1] - TV_H / 2, TV_C[2]]);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Canvas cam={cam} post={{ bloom: 0.7, ao: 1.8 }}>
        <LivingRoom evening={update} />
      </Canvas>
      {tl && br ? (
        <div style={{ position: "absolute", left: tl.x, top: tl.y, width: br.x - tl.x, height: br.y - tl.y, overflow: "hidden", boxShadow: "0 0 60px rgba(120,170,255,0.35)" }}>
          <div style={{ transform: `scale(${(br.x - tl.x) / 960}, ${(br.y - tl.y) / 540})`, transformOrigin: "0 0" }}>
            <NewsScreen f={f} update={update} />
          </div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ───────────────────────── B · the supermarket (security-camera view) ─────────────────────────
/** Walk along a polyline at `speed` m/s; returns position and heading (people never cut through
 * shelves or machines because their paths only use the aisles). */
const follow = (pts: [number, number][], speed: number, t: number) => {
  let d = Math.max(0, t) * speed;
  for (let k = 0; k < pts.length - 1; k++) {
    const [ax, az] = pts[k];
    const [bx, bz] = pts[k + 1];
    const L = Math.hypot(bx - ax, bz - az);
    if (d <= L) return { x: ax + ((bx - ax) * d) / L, z: az + ((bz - az) * d) / L, ry: Math.atan2(bx - ax, bz - az), moving: true };
    d -= L;
  }
  const [lx, lz] = pts[pts.length - 1];
  const [px, pz] = pts[pts.length - 2] ?? [lx, lz - 1];
  return { x: lx, z: lz, ry: Math.atan2(lx - px, lz - pz), moving: false };
};

// shelf units stand at x = −4, 0, 4 (each ~1 m deep, 8.8 m long); the aisles are x = ±2 and ±6
type Shopper = { path?: [number, number][]; stand?: [number, number, number]; speed: number; delay: number; zombie?: number };
const SHOPPERS: Shopper[] = (() => {
  const r = seeded(4);
  const out: Shopper[] = [];
  [-6, -2, 2, 6].forEach((ax, a) => {
    for (let k = 0; k < 4; k++) {
      const dir = (k + a) % 2 ? 1 : -1;
      const off = (k % 2 ? 0.35 : -0.35) + (r() - 0.5) * 0.1;
      out.push({ path: [[ax + off, -6 * dir], [ax + off, 6 * dir]], speed: 1.05 + r() * 0.25, delay: -r() * 8 });
    }
  });
  // people browsing, facing a shelf (x = shelf face, ry toward the shelf)
  ([[-3.35, -2.4, -Math.PI / 2], [0.65, 1.2, -Math.PI / 2], [-0.65, -3.0, Math.PI / 2], [3.35, 2.6, Math.PI / 2], [-4.65, 3.1, Math.PI / 2], [4.65, -1.8, -Math.PI / 2]] as [number, number, number][]).forEach((st) =>
    out.push({ stand: st, speed: 0, delay: r() * 3 }),
  );
  return out;
})();
// the infected: slower, in the aisles, appearing on the cues (1 → 2 → 4)
const INFECTED = (): Shopper[] => [
  { path: [[-2.1, 3.5], [-2.1, -6]], speed: 0.45, delay: 0, zombie: c.crowd + 4 },
  { path: [[2.2, -3.0], [2.2, 6]], speed: 0.45, delay: 0, zombie: c.second },
  { path: [[-1.9, 5.0], [-1.9, -6]], speed: 0.45, delay: 0, zombie: c.four },
  { path: [[5.9, 4.0], [5.9, -6]], speed: 0.45, delay: 0, zombie: c.four },
];
const PRODUCTS = (() => {
  const r = seeded(12);
  const cols = ["#e05a3c", "#f2c14e", "#3c7ae0", "#4caf6e", "#e8e0d0", "#8a4fbf", "#ff8a3d"];
  const out: { p: V3; c: string; k: number }[] = [];
  [-4, 0, 4].forEach((ax) =>
    [-1, 1].forEach((side) =>
      [0, 1, 2, 3].forEach((lv) => {
        for (let n = 0; n < 14; n++) out.push({ p: [ax + side * 0.32, 0.36 + lv * 0.48, -4.2 + n * 0.6], c: cols[Math.floor(r() * cols.length)], k: r() });
      }),
    ),
  );
  return out;
})();

export const SetStore: React.FC<SetProps> = ({ f }) => {
  const stock = 1 - ramp(f, c.days3, c.noon + 20);
  const t = f - c.stay;
  const cam: Cam = { pos: keys3(f, [[c.stay, [8, 8.5, 9]], [c.water, [6, 7.5, 7]]]), look: [0, 0, -0.5], fov: 44 };
  const floor = tex("tiles", "#d9dbd6", [8, 8], 11);
  return (
    <AbsoluteFill>
      <Canvas cam={cam} bg="#20242a" post={{ bloom: 0.8, ao: 1.8, vignette: 0.55 }}>
        <Slab p={[0, -0.05, 0]} s={[18, 0.1, 14]} map={floor} rough={0.4} />
        <hemisphereLight args={["#f4f7ff", "#5a5a5a", 0.8]} />
        <KeyLight p={[3, 12, 6]} target={[0, 0, 0]} intensity={1.6} color="#ffffff" size={10} />
        {[-4, 0, 4].map((ax) => (
          <group key={ax}>
            <RB p={[ax, 0.95, 0]} s={[0.2, 1.9, 8.8]} r={0.02} color="#c9ced4" />
            {[0, 1, 2, 3].map((lv) => (
              <RB key={lv} p={[ax, 0.18 + lv * 0.48, 0]} s={[0.95, 0.04, 8.8]} r={0.01} color="#b6bcc3" />
            ))}
          </group>
        ))}
        {PRODUCTS.map((pr, i) => (pr.k < stock ? <RB key={i} p={pr.p} s={[0.26, 0.3, 0.5]} r={0.03} color={pr.c} /> : null))}
        {SHOPPERS.map((sh, i) => {
          const tt = t / 30 + sh.delay;
          const file = PEOPLE[i % PEOPLE.length];
          const look = { outfit: OUTFITS[i % OUTFITS.length], tint: { Hair: HAIR[i % HAIR.length] } };
          if (sh.stand) {
            const [x, z, ry] = sh.stand;
            return <Model key={i} file={file} anims={LIB1} clip={i % 2 ? "PickUp_Table" : "Idle_Loop"} t={tt} p={[x, 0, z]} ry={ry} {...look} />;
          }
          const w = follow(sh.path!, sh.speed, tt + 6);
          return <Model key={i} file={file} anims={LIB1} clip={w.moving ? "Walk_Loop" : "Idle_Loop"} t={tt * sh.speed} p={[w.x, 0, w.z]} ry={w.ry} {...look} />;
        })}
        {INFECTED().map((sh, i) => {
          if (f < sh.zombie!) return null;
          const w = follow(sh.path!, sh.speed, (f - sh.zombie!) / 30);
          return (
            <group key={`z${i}`}>
              <Model file={PEOPLE[(i + 2) % PEOPLE.length]} anims={LIB2} clip="Zombie_Walk_Fwd_Loop" t={(f - sh.zombie!) / 30} p={[w.x, 0, w.z]} ry={w.ry} outfit={ZOMBIE_OUTFIT} tint={{ Hair: "#2a2420" }} />
              <mesh position={[w.x, 0.02, w.z]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.45, 0.6, 32]} />
                <meshBasicMaterial color="#ff2a1a" transparent opacity={0.9} />
              </mesh>
            </group>
          );
        })}
      </Canvas>
      <div style={{ position: "absolute", right: 50, top: 160, fontFamily: fonts.hud, fontWeight: 700, fontSize: 30, letterSpacing: 3, color: "#fff", textShadow: "0 2px 8px #000" }}>● CAM 04 · AISLE 3–7</div>
      <InfoTag x={540} y={1250} title="ABOUT 3 DAYS OF FOOD" sub="what a supermarket keeps in stock" o={fadeIn(f, c.days3)} />
      {f >= c.second ? <div style={{ position: "absolute", top: 1330, width: "100%", textAlign: "center", fontFamily: fonts.punch, fontWeight: 800, fontSize: 84, color: "#ff5a4f", textShadow: "0 4px 20px #000" }}>{f >= c.four ? "1 → 2 → 4" : "1 → 2"}</div> : null}
    </AbsoluteFill>
  );
};

// ───────────────────────── C · the pump station: workers leave, power fails, pumps spin down ─────────────────────────
const POWER_OFF = () => c.workers + 12;
/** Pump rotation (radians) for a constant speed that decelerates linearly to 0 after power-off. */
const spin = (f: number, w = 0.55, decel = 30) => {
  const p0 = POWER_OFF();
  if (f < p0) return w * f;
  const d = Math.min(f - p0, decel);
  return w * p0 + w * (d - (d * d) / (2 * decel));
};

const Pump: React.FC<{ p: V3; a: number; on: number }> = ({ p, a, on }) => (
  <group position={p}>
    <RB p={[0, 0.25, 0]} s={[2.2, 0.5, 1.0]} r={0.04} color="#4a5560" metal={0.4} rough={0.5} />
    {/* motor */}
    <Cyl p={[-0.5, 0.95, 0]} r={0.38} h={1.0} rot={[0, 0, Math.PI / 2]} color="#2f6aa0" metal={0.5} rough={0.35} />
    {[...Array(8)].map((_, k) => (
      <RB key={k} p={[-0.5 + (k - 3.5) * 0.11, 0.95, 0.4]} s={[0.04, 0.6, 0.06]} r={0.01} color="#28597f" />
    ))}
    {/* rotating coupling with marks */}
    <group position={[0.15, 0.95, 0]} rotation={[a, 0, 0]}>
      <Cyl p={[0, 0, 0]} r={0.2} h={0.18} rot={[0, 0, Math.PI / 2]} color="#c9cdd1" metal={0.8} rough={0.3} />
      {[0, 1, 2].map((k) => (
        <RB key={k} p={[0.0, Math.cos((k * Math.PI * 2) / 3) * 0.15, Math.sin((k * Math.PI * 2) / 3) * 0.15]} s={[0.2, 0.06, 0.06]} r={0.01} color="#e0a020" />
      ))}
    </group>
    {/* pump volute */}
    <Cyl p={[0.65, 0.95, 0]} r={0.45} h={0.45} rot={[0, 0, Math.PI / 2]} color="#3d7ab0" metal={0.5} rough={0.35} />
    <Cyl p={[0.65, 1.7, 0]} r={0.16} h={1.1} color="#3d7ab0" metal={0.5} rough={0.35} />
    <RB p={[1.0, 1.35, 0.3]} s={[0.08, 0.08, 0.08]} r={0.02} color={on > 0.5 ? "#3cff6a" : "#ff2a1a"} emissive={on > 0.5 ? "#3cff6a" : "#ff2a1a"} ei={2.5} />
  </group>
);

export const SetWaterChain: React.FC<SetProps> = ({ f }) => {
  const p0 = POWER_OFF();
  const flicker = f >= p0 && f < p0 + 12 ? (Math.floor((f - p0) / 2) % 2 ? 0.15 : 1) : f >= p0 + 12 ? 0 : 1;
  const flow = 1 - ramp(f, p0, p0 + 30);
  const atTap = f >= c.dry - 2;
  const cam: Cam = atTap
    ? { pos: keys3(f, [[c.dry - 2, [12.6, 1.6, 0.8]], [c.fill, [12.5, 1.55, 0.65]]]), look: [12.0, 1.0, -0.45], fov: 40 }
    : { pos: keys3(f, [[c.water, [6.8, 3.8, 8.6]], [c.workers, [5.6, 3.3, 7.2]], [c.dry, [5.0, 3.0, 6.4]]]), look: [0.8, 1.1, -1.4], fov: 50 };
  const wall = tex("plaster", "#9fb3a6", [4, 2], 21);
  const floor = tex("plaster", "#7d8285", [5, 5], 22);
  const dash = (f * 0.12 * flow) % 1;
  return (
    <AbsoluteFill>
      <Canvas cam={cam} bg="#0b0f14" post={{ bloom: 1.0, ao: 1.8, vignette: 0.55 }}>
        <Slab p={[0, -0.05, 0]} s={[14, 0.1, 12]} map={floor} rough={0.9} />
        <Slab p={[0, 2.5, -3.5]} s={[14, 5, 0.12]} map={wall} rough={0.9} />
        <Slab p={[-5.5, 2.5, 0]} s={[0.12, 5, 12]} map={wall} rough={0.9} />
        <hemisphereLight args={["#e8f2ff", "#3a3a3a", 0.12 + 0.5 * flicker]} />
        {[-2, 2].map((x) => (
          <group key={x}>
            <RB p={[x, 4.4, 0]} s={[2.2, 0.08, 0.3]} r={0.02} color="#f4f8ff" emissive="#eaf4ff" ei={3 * flicker} />
            <pointLight position={[x, 4.1, 0]} intensity={30 * flicker} distance={10} decay={1.4} color="#eaf4ff" castShadow={x < 0} />
          </group>
        ))}
        {/* emergency light: red, after the blackout */}
        <RB p={[-5.4, 3.6, -1.5]} s={[0.1, 0.25, 0.4]} r={0.03} color="#ff2a1a" emissive="#ff2a1a" ei={f >= p0 + 12 ? 3 : 0} />
        <pointLight position={[-5.0, 3.5, -1.5]} intensity={f >= p0 + 12 ? 8 : 0} distance={9} color="#ff3b2a" />
        <Pump p={[-1.8, 0, -1.2]} a={spin(f)} on={flicker} />
        <Pump p={[1.8, 0, -1.2]} a={spin(f) * 0.97 + 1} on={flicker} />
        {/* main pipe along the back wall with a glass section showing the flow */}
        <Cyl p={[0, 2.85, -2.6]} r={0.22} h={12} rot={[0, 0, Math.PI / 2]} color="#3d7ab0" metal={0.5} rough={0.35} />
        <mesh position={[3.6, 2.85, -2.35]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.24, 0.24, 1.4, 24, 1, true]} />
          <meshStandardMaterial color="#cfe8ff" transparent opacity={0.35} roughness={0.1} side={2} />
        </mesh>
        {[0, 1, 2, 3, 4, 5].map((k) => (
          <RB key={k} p={[2.95 + ((k / 6 + dash) % 1) * 1.3, 2.85, -2.35]} s={[0.12, 0.08, 0.08]} r={0.03} color="#7fd6ff" emissive="#7fd6ff" ei={2 * flow} opacity={0.2 + 0.8 * flow} />
        ))}
        {/* control panel + gauge */}
        <RB p={[4.6, 1.0, -3.2]} s={[1.6, 2.0, 0.4]} r={0.03} color="#c9ced4" />
        {[0, 1, 2, 3].map((k) => (
          <RB key={k} p={[4.1 + k * 0.33, 1.6, -2.98]} s={[0.12, 0.12, 0.04]} r={0.04} color={flicker > 0.5 ? "#3cff6a" : "#ff2a1a"} emissive={flicker > 0.5 ? "#3cff6a" : "#ff2a1a"} ei={2} />
        ))}
        <Cyl p={[4.6, 1.1, -2.98]} r={0.25} h={0.04} rot={[Math.PI / 2, 0, 0]} color="#f4f1ea" />
        <group position={[4.6, 1.1, -2.95]} rotation={[0, 0, -2.2 + 3.0 * flow]}>
          <RB p={[0, 0.1, 0]} s={[0.03, 0.2, 0.02]} r={0.005} color="#c4302b" />
        </group>
        {/* technicians in coveralls: one kneels at a pump, one works the panel; then both get up and
            leave along the free floor in front of the machines (never through them) to the door */}
        {[
          { file: "man_c.glb", at: [2.3, 0.15] as [number, number], ry: Math.PI, clip: "Fixing_Kneeling", path: [[2.3, 0.15], [2.3, 1.7], [-4.9, 1.7], [-5.3, 1.8]] as [number, number][] },
          { file: "man_b.glb", at: [4.6, -2.45] as [number, number], ry: Math.PI, clip: "Interact", path: [[4.6, -2.45], [3.9, 1.9], [-4.9, 1.9], [-5.3, 1.9]] as [number, number][] },
        ].map((tech, k) => {
          const t0 = c.workers - 30 + k * 8;
          const walking = f >= t0;
          const w = follow(tech.path, 1.15, (f - t0) / 30);
          return (
            <Model
              key={k}
              file={tech.file}
              anims={LIB1}
              clip={walking ? "Walk_Loop" : tech.clip}
              t={walking ? ((f - t0) / 30) * 1.15 : f / 30 + k * 1.3}
              p={walking ? [w.x, 0, w.z] : [tech.at[0], 0, tech.at[1]]}
              ry={walking ? w.ry : tech.ry}
              outfit={{ top: "#2f4a6a", pants: "#2f4a6a", shoes: "#2a2420" }}
              tint={{ Hair: HAIR[k + 1] }}
            />
          );
        })}
        <RB p={[-5.42, 1.1, 1.8]} s={[0.08, 2.2, 1.1]} r={0.02} color="#5a6a78" />
        {/* your kitchen tap, off to the side (the camera cuts here at "your tap goes dry") */}
        <group position={[12, 0, 0]}>
          <RB p={[0, 0.39, -0.4]} s={[1.6, 0.78, 0.7]} r={0.02} color="#e8e2d4" />
          {[[-0.57, 0.5], [0.57, 0.5]].map(([x, w]) => (
            <RB key={x} p={[x, 0.97, -0.4]} s={[w, 0.05, 0.75]} r={0.01} color="#8a8f94" rough={0.35} />
          ))}
          <RB p={[0, 0.97, -0.69]} s={[0.66, 0.05, 0.17]} r={0.01} color="#8a8f94" rough={0.35} />
          <RB p={[0, 0.97, -0.08]} s={[0.66, 0.05, 0.12]} r={0.01} color="#8a8f94" rough={0.35} />
          {/* stainless sink basin set into the counter: floor + four walls, open on top */}
          <RB p={[0, 0.8, -0.38]} s={[0.62, 0.03, 0.46]} r={0.01} color="#c9cfd4" metal={0.85} rough={0.25} />
          <RB p={[0, 0.89, -0.6]} s={[0.66, 0.2, 0.03]} r={0.01} color="#c9cfd4" metal={0.85} rough={0.25} />
          <RB p={[0, 0.89, -0.16]} s={[0.66, 0.2, 0.03]} r={0.01} color="#c9cfd4" metal={0.85} rough={0.25} />
          <RB p={[-0.32, 0.89, -0.38]} s={[0.03, 0.2, 0.46]} r={0.01} color="#c9cfd4" metal={0.85} rough={0.25} />
          <RB p={[0.32, 0.89, -0.38]} s={[0.03, 0.2, 0.46]} r={0.01} color="#c9cfd4" metal={0.85} rough={0.25} />
          <Cyl p={[0, 0.815, -0.4]} r={0.03} h={0.01} color="#3a3f44" metal={0.6} />
          <Cyl p={[0, 1.1, -0.68]} r={0.03} h={0.36} color="#cfd5da" metal={0.9} rough={0.2} />
          <RB p={[0, 1.27, -0.55]} s={[0.05, 0.05, 0.28]} r={0.02} color="#cfd5da" metal={0.9} rough={0.2} />
          {(() => {
            const ff = f - c.dry;
            const stream = 1 - ramp(f, c.dry, c.dry + 12);
            const drop = ff > 12 && (ff % 20) < 10 ? ((ff % 20) / 10) * 0.33 : -1;
            return (
              <>
                {stream > 0.02 ? <Cyl p={[0, 1.04, -0.43]} r={0.012 * stream + 0.002} h={0.43} color="#a9dcf5" emissive="#bfe8ff" ei={0.3} opacity={0.75} /> : null}
                {drop >= 0 ? <mesh position={[0, 1.23 - drop * 1.25, -0.43]}><sphereGeometry args={[0.014, 10, 8]} /><meshStandardMaterial color="#a9dcf5" emissive="#bfe8ff" emissiveIntensity={0.3} /></mesh> : null}
              </>
            );
          })()}
          <Slab p={[0, 1.5, -0.8]} s={[3, 3, 0.08]} map={tex("tiles", "#e8e2d4", [4, 4], 23)} rough={0.4} />
          <pointLight position={[0.6, 2.2, 0.6]} intensity={6} distance={5} color="#ffe2b8" />
        </group>
      </Canvas>
      {!atTap ? <InfoTag x={640} y={760} title="POWER + PEOPLE" sub="needed every hour" o={fadeIn(f, c.pumps + 6) * (1 - ramp(f, c.workers, c.workers + 10))} /> : null}
      {f >= p0 + 14 && !atTap ? <InfoTag x={160} y={760} title="POWER OUT" sub="pumps stop, pressure drops" o={fadeIn(f, p0 + 14)} /> : null}
      {f >= c.dry ? (
        <div style={{ position: "absolute", left: "50%", top: 1200, transform: `translate(-50%,0) rotate(-8deg) scale(${1.5 - 0.5 * fadeIn(f, c.dry, 5)})`, border: "8px solid #e0302a", color: "#e0302a", padding: "4px 30px", fontFamily: fonts.hud, fontWeight: 800, fontSize: 80, letterSpacing: 6, opacity: fadeIn(f, c.dry, 5) }}>DRY</div>
      ) : null}
    </AbsoluteFill>
  );
};

// ───────────────────────── D · the bathtub fills ─────────────────────────
export const SetTub: React.FC<SetProps> = ({ f }) => {
  const level = ramp(f, c.fill, c.gal40 + 10);
  const cam: Cam = { pos: keys3(f, [[c.fill, [2.6, 2.9, 2.4]], [c.food, [2.0, 2.6, 1.7]]]), look: [-0.1, 0.45, -1.5], fov: 44 };
  const tiles = tex("tiles", "#dfe9ee", [6, 3], 4);
  const floorT = tex("tiles", "#8e9ba3", [4, 4], 5);
  return (
    <AbsoluteFill>
      <Canvas cam={cam} post={{ bloom: 0.6, ao: 2.0 }}>
        <Slab p={[0, -0.05, 0]} s={[6, 0.1, 5]} map={floorT} rough={0.35} />
        <Slab p={[0, 1.5, -2.5]} s={[6, 3, 0.12]} map={tiles} rough={0.3} />
        <Slab p={[-3, 1.5, 0]} s={[0.12, 3, 5]} map={tiles} rough={0.3} />
        <hemisphereLight args={["#f2f8ff", "#556068", 0.7]} />
        <KeyLight p={[-4, 4.5, 2.5]} target={[0, 0.3, -1.5]} intensity={2.2} color="#fff6ea" size={5} />
        <Window p={[-2.93, 2.1, -1.2]} ry={Math.PI / 2} s={[0.9, 0.6]} sky="#e6f3ff" glow={1.6} />
        <Bathtub p={[0, 0, -1.9]} level={level} />
        {/* sink + mirror + towel */}
        <RB p={[2.0, 0.85, -2.2]} s={[0.8, 0.12, 0.5]} r={0.04} color="#f6f6f4" rough={0.25} />
        <Cyl p={[2.0, 0.42, -2.25]} r={0.08} h={0.8} color="#f6f6f4" rough={0.3} />
        <mesh position={[2.0, 1.75, -2.43]}>
          <planeGeometry args={[0.7, 0.9]} />
          <meshStandardMaterial color="#cfe0ea" roughness={0.05} metalness={0.9} />
        </mesh>
        <RB p={[-2.9, 1.3, -0.2]} s={[0.06, 0.04, 0.8]} r={0.01} color="#c9cdd1" metal={0.8} rough={0.3} />
        <RB p={[-2.86, 1.05, -0.2]} s={[0.06, 0.5, 0.7]} r={0.03} color="#e8b04a" />
        {/* pots and bottles on the floor, filled one by one */}
        {[-1.4, -0.8, -0.2].map((x, i) => (
          <group key={i} position={[x, 0, 0.4]} scale={fadeIn(f, c.fill + 12 + i * 5, 6)}>
            <Cyl p={[0, 0.17, 0]} r={0.22} h={0.34} color="#9aa1a8" metal={0.8} rough={0.3} />
            <Cyl p={[0, 0.33, 0]} r={0.2} h={0.02} color="#69b8de" />
            <RB p={[0.3, 0.27, 0]} s={[0.16, 0.04, 0.05]} r={0.015} color="#2a2a2a" />
          </group>
        ))}
        {[0.5, 0.75, 1.0, 1.25, 1.5].map((x, i) => (
          <group key={i} position={[x, 0, 0.7]} scale={fadeIn(f, c.fill + 20 + i * 3, 6)}>
            <Cyl p={[0, 0.16, 0]} r={0.07} h={0.32} color="#a9dcf5" rough={0.1} opacity={0.75} />
            <Cyl p={[0, 0.35, 0]} r={0.03} h={0.06} color="#2f7cf6" />
          </group>
        ))}
      </Canvas>
      <div style={{ position: "absolute", top: 1000, width: "100%", display: "flex", justifyContent: "center", gap: 70 }}>
        <BigNum value="40" label="GALLONS" color="#7fd6ff" size={110} o={fadeIn(f, c.gal40)} />
        <BigNum value="÷ 1" label="GALLON / DAY" color="#fff" size={110} o={fadeIn(f, c.gal1)} />
      </div>
      <div style={{ position: "absolute", top: 1230, width: "100%", display: "flex", justifyContent: "center" }}>
        <BigNum value="40 DAYS" label="OF DRINKING WATER" color="#ffd166" size={130} o={fadeIn(f, c.days40)} />
      </div>
    </AbsoluteFill>
  );
};

// ───────────────────────── E · counting the pantry (kitchen counter) ─────────────────────────
type Item = { name: string; kcal: number; x: number; kind: "bag" | "box" | "can" | "jar" };
// a pantry cupboard: three shelves, so it fits the vertical frame
type Slot = Item & { y: number };
const PANTRY: Slot[] = [
  { name: "FLOUR", kcal: 0, x: 0.55, y: 2.02, kind: "bag" },
  { name: "OATS", kcal: 5700, x: -0.55, y: 2.02, kind: "box" },
  { name: "RICE", kcal: 7200, x: 0.0, y: 2.02, kind: "bag" },
  { name: "PASTA", kcal: 6400, x: -0.55, y: 1.32, kind: "box" },
  { name: "BEANS", kcal: 4100, x: 0.0, y: 1.32, kind: "can" },
  { name: "TUNA", kcal: 1800, x: 0.55, y: 1.32, kind: "can" },
  { name: "SOUP", kcal: 4800, x: 0.0, y: 0.62, kind: "can" },
];

const LABELS: Record<string, [string, string, string, string]> = {
  RICE: ["#f4efe2", "#2f7a4a", "RICE", "LONG GRAIN · 5 LB"],
  PASTA: ["#1f3f8a", "#f2c14e", "PASTA", "SPAGHETTI · 1 LB"],
  BEANS: ["#f0e2c8", "#b5452f", "BEANS", "BAKED · 15 OZ"],
  TUNA: ["#e9f1f8", "#3c7ae0", "TUNA", "IN WATER · 5 OZ"],
  SOUP: ["#f6efe6", "#d9532f", "TOMATO", "SOUP · 10.7 OZ"],
  OATS: ["#f2e6c9", "#8a5a2a", "OATS", "ROLLED · 42 OZ"],
  FLOUR: ["#f7f3ea", "#c4302b", "FLOUR", "BATCH #2291 · OHIO"],
};

const Grocery: React.FC<{ it: Item; s: number }> = ({ it, s }) => {
  const [bg, band, name, sub] = LABELS[it.name];
  const lab = labelTex(bg, band, name, sub);
  return (
    <group scale={s}>
      {it.kind === "bag" ? (
        <>
          <RB p={[-0.12, 0.27, 0]} s={[0.3, 0.54, 0.2]} r={0.08} map={lab} rough={0.85} />
          <RB p={[0.2, 0.22, 0.02]} s={[0.26, 0.44, 0.18]} r={0.07} map={lab} rough={0.85} />
        </>
      ) : null}
      {it.kind === "box" ? (
        <>
          <RB p={[-0.17, 0.3, 0]} s={[0.24, 0.6, 0.1]} r={0.01} map={lab} rough={0.7} />
          <RB p={[0.1, 0.3, 0.02]} s={[0.24, 0.6, 0.1]} r={0.01} map={lab} rough={0.7} />
          <RB p={[0.3, 0.24, -0.04]} s={[0.12, 0.48, 0.24]} r={0.01} map={lab} rough={0.7} rot={[0, 0.3, 0]} />
        </>
      ) : null}
      {it.kind === "can" ? (
        <>
          {[[-0.17, 0.11, 0], [0.0, 0.11, 0.04], [0.17, 0.11, 0], [-0.08, 0.33, 0.02], [0.09, 0.33, 0.02]].map((q, k) => (
            <Can key={k} p={q as V3} label={lab} />
          ))}
        </>
      ) : null}
    </group>
  );
};

export const SetPantry: React.FC<SetProps> = ({ f }) => {
  // far enough back that the whole cupboard sits between the status panel and the captions
  const cam: Cam = { pos: keys3(f, [[c.food, [0.45, 1.75, 5.9]], [c.news2, [0.3, 1.7, 5.3]]]), look: [0.05, 1.42, -0.3], fov: 44 };
  const wall = tex("tiles", "#e8e2d4", [6, 3], 13);
  const flour = PANTRY[0];
  const gone = ramp(f, c.trash, c.trash + 14, easeOut);
  return (
    <AbsoluteFill>
      <Canvas cam={cam} post={{ bloom: 0.7, ao: 1.8 }}>
        <Slab p={[0, 2.5, -0.8]} s={[8, 5, 0.1]} map={wall} rough={0.4} />
        <hemisphereLight args={["#fff4e2", "#4a3626", 0.7]} />
        <KeyLight p={[-3, 4, 3]} target={[0, 1, -0.3]} intensity={2.0} color="#fff1d8" size={4} />
        <pointLight position={[0, 2.4, 0.4]} intensity={6} distance={5} color="#ffd8a8" />
        <Slab p={[0, -0.05, 2.5]} s={[8, 0.1, 8]} map={tex("planks", "#8a5e38", [3, 3], 14)} rough={0.6} />
        {/* cupboard: back, sides, three shelves */}
        <RB p={[0, 1.3, -0.62]} s={[1.9, 2.6, 0.06]} r={0.01} color="#6b4a32" />
        {[-0.95, 0.95].map((x) => (
          <RB key={x} p={[x, 1.3, -0.35]} s={[0.06, 2.6, 0.6]} r={0.01} color="#7a5638" />
        ))}
        {[0.3, 1.0, 1.7, 2.4].map((y) => (
          <RB key={y} p={[0, y, -0.35]} s={[1.9, 0.05, 0.6]} r={0.01} color="#8a6440" />
        ))}
        {/* trash can on the right */}
        <Cyl p={[1.45, 0.4, 0.3]} r={0.26} r2={0.3} h={0.8} color="#7f868d" metal={0.6} rough={0.4} />
        {PANTRY.map((it, i) => {
          const isFlour = it === flour;
          const s0 = fadeIn(f, c.rice + i * 6, 6);
          const fx = isFlour ? it.x + (1.45 - it.x) * gone : it.x;
          const fy = isFlour ? it.y - 0.37 + Math.sin(gone * Math.PI) * 0.5 - gone * (it.y - 0.6) : it.y - 0.37;
          const fz = isFlour ? -0.35 + 0.65 * gone : -0.35;
          return (
            <group key={it.name} position={[fx, fy, fz]} rotation={[0, 0, isFlour ? -gone * 1.2 : 0]}>
              <Grocery it={it} s={s0 * (isFlour ? 1 - gone * 0.3 : 1)} />
            </group>
          );
        })}
      </Canvas>
      {PANTRY.map((it, i) => {
        const pt = at(cam, [it.x, it.y + 0.32, -0.2]);
        if (!pt) return null;
        const bad = it.kcal === 0;
        return (
          <div key={it.name} style={{ position: "absolute", left: pt.x, top: pt.y, transform: "translate(-50%,-50%)", opacity: fadeIn(f, c.rice + i * 6 + 4, 6) * (1 - ramp(f, bad ? c.trash : c.kcal, (bad ? c.trash : c.kcal) + 8)), padding: "4px 10px", background: bad ? "#e0302a" : "#f4f1ea", borderRadius: 6, fontFamily: fonts.hud, fontWeight: 800, fontSize: 24, color: bad ? "#fff" : "#111", whiteSpace: "nowrap" }}>
            {bad ? "FLOUR · BATCH #2291" : `${it.name} · ${it.kcal.toLocaleString("en-US")}`}
          </div>
        );
      })}
      {/* dark band so the sums read cleanly over the shelves */}
      <div style={{ position: "absolute", top: 960, height: 560, width: "100%", opacity: fadeIn(f, c.kcal), background: "linear-gradient(rgba(0,0,0,0), rgba(0,0,0,0.62) 22%, rgba(0,0,0,0.62) 78%, rgba(0,0,0,0))" }} />
      <div style={{ position: "absolute", top: 1040, width: "100%", display: "flex", justifyContent: "center", alignItems: "flex-end", gap: 40 }}>
        <BigNum value={Math.round(30000 * ramp(f, c.kcal, c.kcal + 18, easeOut)).toLocaleString("en-US")} label="CALORIES" size={110} o={fadeIn(f, c.kcal)} />
        <BigNum value="÷ 2,000" label="PER DAY" color="#fff" size={90} o={fadeIn(f, c.perDay)} />
      </div>
      <div style={{ position: "absolute", top: 1250, width: "100%", display: "flex", justifyContent: "center" }}>
        <BigNum value="15 DAYS" label="IF YOU RATION" color="#7dffa8" size={130} o={fadeIn(f, c.days15)} />
      </div>
    </AbsoluteFill>
  );
};

// ───────────────────────── F · they're slow — a race on one scale ─────────────────────────
export const SetSpeed: React.FC<SetProps> = ({ f }) => {
  const t = Math.max(0, f - c.slow);
  const lane = (y: number, label: string, mph: number, color: string, show: number) => {
    const x = 120 + Math.min(820, t * mph * 2.6);
    return (
      <g opacity={show}>
        <line x1={120} y1={y} x2={960} y2={y} stroke="#2c3a52" strokeWidth={6} strokeDasharray="14 12" />
        <circle cx={x} cy={y - 40} r={26} fill={color} />
        <rect x={x - 20} y={y - 14} width={40} height={10} rx={4} fill={color} />
        <text x={120} y={y + 60} fill="#fff" style={{ fontFamily: fonts.hud, fontWeight: 700, fontSize: 40, letterSpacing: 3 }}>
          {label}
        </text>
        <text x={960} y={y + 60} textAnchor="end" fill={color} style={{ fontFamily: fonts.punch, fontWeight: 800, fontSize: 52 }}>
          {mph} MPH
        </text>
      </g>
    );
  };
  return (
    <Board>
      <svg width={1080} height={1920} style={{ position: "absolute" }}>
        {lane(860, "INFECTED", 0.7, "#ff5a4f", fadeIn(f, c.figured + 6))}
        {lane(1180, "YOU, WALKING", 3, "#7dffa8", fadeIn(f, c.walk3))}
      </svg>
    </Board>
  );
};

// ───────────────────────── G · fights: win 8 of 10, and it still doesn't matter ─────────────────────────
export const SetFights: React.FC<SetProps> = ({ f }) => {
  const reveal = (i: number) => fadeIn(f, c.fight + i * 2, 6);
  const judged = f >= c.eight;
  return (
    <Board>
      <div style={{ position: "absolute", top: 560, left: 120, right: 120, display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 26 }}>
        {Array.from({ length: 10 }, (_, i) => {
          const lost = i === 3 || i === 8;
          const col = !judged ? "#3b4c66" : lost ? "#e0302a" : "#2fa865";
          return (
            <div key={i} style={{ opacity: reveal(i), height: 150, borderRadius: 16, background: col, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fonts.hud, fontWeight: 800, fontSize: 34, color: "#fff", letterSpacing: 2 }}>
              {!judged ? "FIGHT" : lost ? "LOST" : "WON"}
            </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", top: 980, width: "100%", textAlign: "center" }}>
        <BigNum value="8 / 10" label="FIGHTS WON BY PEOPLE" color="#7dffa8" size={120} o={fadeIn(f, c.eight)} />
      </div>
      <div style={{ position: "absolute", top: 1260, left: 120, right: 120, display: "flex", justifyContent: "space-between", fontFamily: fonts.hud, fontWeight: 800, letterSpacing: 2 }}>
        <div style={{ opacity: fadeIn(f, c.win), textAlign: "center", width: 380, padding: "20px 0", borderRadius: 16, background: "#173a28", color: "#7dffa8", fontSize: 44 }}>WIN = −1 ZOMBIE</div>
        <div style={{ opacity: fadeIn(f, c.lose), textAlign: "center", width: 380, padding: "20px 0", borderRadius: 16, background: "#4a1a1a", color: "#ff6b6b", fontSize: 44 }}>LOSE = +1 ZOMBIE</div>
      </div>
    </Board>
  );
};

// ───────────────────────── H · the hospital: hundreds of bitten people in one building ─────────────────────────
const BEDS = (() => {
  const r = seeded(9);
  return Array.from({ length: 260 }, () => ({ x: 170 + r() * 740, y: 640 + r() * 820, d: r() * 40 }));
})();

export const SetHospital: React.FC<SetProps> = ({ f }) => (
  <Board>
    <svg width={1080} height={1920} style={{ position: "absolute" }}>
      <rect x={140} y={560} width={800} height={940} fill="#1b2638" stroke="#cfd8e3" strokeWidth={6} />
      {[0, 1, 2, 3].map((k) => (
        <line key={k} x1={140} y1={560 + (k + 1) * 188} x2={940} y2={560 + (k + 1) * 188} stroke="#3b4c66" strokeWidth={4} />
      ))}
      <rect x={470} y={470} width={140} height={90} fill="#cfd8e3" />
      <rect x={525} y={485} width={30} height={60} fill="#e0302a" />
      <rect x={510} y={500} width={60} height={30} fill="#e0302a" />
      {BEDS.map((b, i) => (
        <circle key={i} cx={b.x} cy={b.y} r={8} fill="#ff3b30" opacity={fadeIn(f, c.hospital + b.d * 0.6, 6)} />
      ))}
    </svg>
    <InfoTag x={540} y={1580} title="HUNDREDS OF BITTEN" sub="one building, one hallway, one night" o={fadeIn(f, c.hundreds)} />
  </Board>
);

// ───────────────────────── I · the barricade (hallway) ─────────────────────────
const Hallway: React.FC<{ f: number; night?: boolean; knock?: number }> = ({ f, night, knock = 0 }) => {
  const fridge = ramp(f, c.fridge, c.fridge + 18, easeOut);
  const lightsOff = night ? 1 : ramp(f, c.lights, c.lights + 4);
  const shake = knock ? Math.sin(knock * Math.PI) * 0.02 : 0;
  const floor = tex("planks", "#8a5e38", [2, 3], 6);
  const wall = tex("wallpaper", "#a9b59a", [3, 2], 7);
  return (
    <group>
      <Slab p={[0, -0.05, -0.5]} s={[5, 0.1, 7]} map={floor} rough={0.6} />
      <Slab p={[0, 1.5, -3.5]} s={[5, 3, 0.12]} map={wall} rough={0.95} />
      <Slab p={[-2.5, 1.5, -0.5]} s={[0.12, 3, 7]} map={wall} rough={0.95} />
      <Slab p={[2.5, 1.5, -0.5]} s={[0.12, 3, 7]} map={wall} rough={0.95} />
      {/* ceiling: the pan to the windows looks up past the wall tops */}
      <Slab p={[0, 3.05, -0.5]} s={[5, 0.1, 7]} color="#efe8dc" rough={0.95} />
      <hemisphereLight args={[night ? "#3d4f78" : "#fff1dc", "#2a1d14", night ? 0.35 : 0.55 * (1 - lightsOff) + 0.12]} />
      {/* pendant lamp */}
      <Cyl p={[0, 2.95, -1.2]} r={0.01} h={0.5} color="#222" />
      <Cyl p={[0, 2.6, -1.2]} r={0.25} r2={0.08} h={0.25} color="#f3e6cf" emissive="#ffd29a" ei={2 * (1 - lightsOff)} />
      <pointLight position={[0, 2.4, -1.2]} intensity={16 * (1 - lightsOff)} distance={8} decay={1.5} color="#ffd8a8" castShadow />
      {night ? (
        <>
          <pointLight position={[1.5, 2.2, 1.5]} intensity={2} distance={8} color="#5f78b0" />
        </>
      ) : null}
      <FrontDoor p={[0, 0, -3.42]} sideGlow={night ? 1.4 : 0.2} shake={shake} />
      {/* coat hooks + coats, shoes, rug */}
      <RB p={[-2.42, 1.75, -1.6]} s={[0.06, 0.08, 1.2]} r={0.02} color="#5a3f28" />
      {[-2.0, -1.6, -1.2].map((z, i) => (
        <RB key={z} p={[-2.33, 1.25, z]} s={[0.18, 0.95, 0.34]} r={0.08} color={["#3d4a5c", "#7a3b2e", "#5c6a3c"][i]} />
      ))}
      <RB p={[-1.9, 0.07, -2.6]} s={[0.12, 0.12, 0.3]} r={0.04} color="#2b2b2b" />
      <RB p={[-1.7, 0.07, -2.55]} s={[0.12, 0.12, 0.3]} r={0.04} color="#2b2b2b" />
      <Rug p={[0, 0.006, -2.4]} s={[1.6, 1.0]} color="#5b3a6b" />
      {/* the fridge slides in from the kitchen and braces the door */}
      <Fridge p={[2.9 - 2.9 * fridge, 0, -2.95]} />
      {/* ground-floor window on the left wall, then a mattress over it */}
      <Window p={[-2.43, 1.5, 0.4]} ry={Math.PI / 2} s={[1.2, 1.1]} sky={night ? "#1d2a44" : "#cfe2f5"} glow={night ? 0.4 : 1.2} curtains="#7a6a5a" />
      <RB p={[-2.25, 0.25 + 1.25 * ramp(f, c.windows, c.windows + 16, easeOut), 0.4]} s={[0.22, 1.8, 1.5]} r={0.1} color="#e3dbe8" />
    </group>
  );
};

export const SetDoor: React.FC<SetProps> = ({ f }) => {
  const cam: Cam = {
    pos: keys3(f, [[c.door, [1.6, 1.7, 2.4]], [c.windows, [1.2, 1.7, 1.4]], [c.windows + 18, [1.4, 1.7, 2.6]], [c.lights + 20, [1.2, 1.6, 2.4]]]),
    look: keys3(f, [[c.door, [0, 1.1, -3.3]], [c.windows, [0, 1.1, -3.3]], [c.windows + 18, [-2, 1.2, -0.5]]]),
    fov: 46,
  };
  const doorP = at(cam, [0.5, 1.6, -3.35]);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Canvas cam={cam} post={{ bloom: 0.8, ao: 1.8 }}>
        <Hallway f={f} />
      </Canvas>
      {doorP && f < c.windows ? <InfoTag x={doorP.x + 30} y={doorP.y} title="OPENS INWARD" sub="so it can be braced" o={fadeIn(f, c.door + 8)} /> : null}
    </AbsoluteFill>
  );
};

// ───────────────────────── J · from the street: your house goes dark ─────────────────────────
const STREET: { x: number; siding: string; you?: boolean }[] = [
  { x: -15, siding: "#8fa3b5" },
  { x: -7.5, siding: "#c9b48a" },
  { x: 0, siding: "#b8c4b0", you: true },
  { x: 7.5, siding: "#c7a6a0" },
  { x: 15, siding: "#9fb0c8" },
];

export const SetStreet: React.FC<SetProps> = ({ f }) => {
  const off = ramp(f, c.lights + 16, c.lights + 22);
  const cam: Cam = { pos: keys3(f, [[c.lights, [7, 3.2, 24]], [c.call, [4, 2.8, 18]]]), look: [0, 2.4, 0], fov: 46 };
  const grass = tex("grass", "#2f4a2c", [10, 6], 8);
  const asphalt = tex("asphalt", "#2a2b2f", [12, 1], 9);
  return (
    <AbsoluteFill>
      <Canvas cam={cam} bg="#141c36" fog={["#141c36", 24, 80]} post={{ bloom: 1.1, ao: 1.4, vignette: 0.6, env: 0.08 }}>
        <hemisphereLight args={["#4a5f9a", "#141a12", 0.45]} />
        <KeyLight p={[-12, 14, 10]} target={[0, 0, 0]} intensity={0.45} color="#9fb4ea" size={26} />
        <Slab p={[0, -0.06, 4]} s={[90, 0.1, 22]} map={grass} rough={1} />
        <Slab p={[0, -0.02, 10.5]} s={[90, 0.06, 5]} map={asphalt} rough={0.9} />
        <Slab p={[0, 0.0, 7.6]} s={[90, 0.1, 1.2]} color="#8d8a84" rough={0.9} />
        {Array.from({ length: 12 }, (_, i) => (
          <Slab key={i} p={[-33 + i * 6, 0.02, 10.5]} s={[2.4, 0.01, 0.14]} color="#e8d27a" rough={0.6} />
        ))}
        {STREET.map((h, i) => (
          <House key={h.x} p={[h.x, 0, 0]} siding={h.siding} lit={h.you ? 1 - off : 1} seed={i + 1} />
        ))}
        {[-11, -3.6, 3.6, 11].map((x, i) => (
          <Tree key={x} p={[x, 0, 4.2 + (i % 2) * 1.2]} s={0.95 + (i % 3) * 0.1} />
        ))}
        <Streetlight p={[-9, 0, 8.2]} />
        <Streetlight p={[9, 0, 8.2]} />
        <Car p={[4.5, 0, 9.4]} color="#7a2f2f" ry={Math.PI / 2} />
      </Canvas>
      {(() => {
        const p = at(cam, [0, 5.2, 0]);
        return p ? <InfoTag x={p.x} y={p.y - 40} title="YOUR HOUSE" sub="has to look empty" o={fadeIn(f, c.empty)} /> : null;
      })()}
    </AbsoluteFill>
  );
};

// ───────────────────────── K · the phone ─────────────────────────
export const SetPhone: React.FC<SetProps> = ({ f }) => {
  const failed = f >= c.noGo;
  const sent = f >= c.stayIn;
  const reply = f >= c.tooLate;
  const bars = failed && !sent ? (Math.floor(f / 6) % 2 ? 1 : 0) : 3;
  const bubble = (mine: boolean, text: string, o: number) => (
    <div style={{ alignSelf: mine ? "flex-end" : "flex-start", maxWidth: 470, opacity: o, transform: `translateY(${(1 - o) * 20}px)`, padding: "18px 24px", borderRadius: 28, background: mine ? "#2f7cf6" : "#e9e9ee", color: mine ? "#fff" : "#111", fontFamily: fonts.ui, fontSize: 38, lineHeight: 1.25 }}>
      {text}
    </div>
  );
  return (
    <Board>
      <div style={{ position: "absolute", left: "50%", top: 470, transform: "translate(-50%,0)", width: 640, height: 1180, borderRadius: 70, background: "#0c0d10", border: "10px solid #2a2c33", boxShadow: "0 30px 80px rgba(0,0,0,0.6)", overflow: "hidden" }}>
        <div style={{ height: 70, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 40px", color: "#fff", fontFamily: fonts.hud, fontWeight: 700, fontSize: 28 }}>
          <span>{f < c.answer ? "9:02 PM" : "10:07 PM"}</span>
          <span>
            {[0, 1, 2].map((i) => (
              <span key={i} style={{ display: "inline-block", width: 10, height: 12 + i * 8, marginLeft: 5, background: i < bars ? "#fff" : "#444" }} />
            ))}
          </span>
        </div>
        {f < c.text ? (
          <div style={{ textAlign: "center", marginTop: 160, color: "#fff", fontFamily: fonts.ui }}>
            <div style={{ width: 170, height: 170, margin: "0 auto", borderRadius: "50%", background: "#596273", fontSize: 80, lineHeight: "170px", fontWeight: 700 }}>S</div>
            <div style={{ fontSize: 56, fontWeight: 700, marginTop: 24 }}>Sarah</div>
            <div style={{ fontSize: 36, marginTop: 10, color: failed ? "#ff5a4f" : "#9aa3b2" }}>{failed ? "Call Failed" : "calling…"}</div>
          </div>
        ) : (
          <div style={{ padding: "40px 30px", display: "flex", flexDirection: "column", gap: 24 }}>
            <div style={{ textAlign: "center", color: "#9aa3b2", fontFamily: fonts.ui, fontSize: 28 }}>Sarah</div>
            {bubble(true, "Stay inside. Fill your tub.", fadeIn(f, c.stayIn, 6))}
            {sent ? <div style={{ alignSelf: "flex-end", color: "#9aa3b2", fontFamily: fonts.ui, fontSize: 24 }}>Delivered</div> : null}
            {reply ? bubble(false, "Too late. We're driving to Dad's cabin in Montana.", fadeIn(f, c.tooLate, 6)) : null}
          </div>
        )}
      </div>
      {f >= c.text && f < c.stayIn ? (
        <div style={{ position: "absolute", top: 1700, width: "100%", display: "flex", justifyContent: "center", gap: 40, fontFamily: fonts.hud, fontWeight: 700, fontSize: 34, letterSpacing: 2 }}>
          <span style={{ color: "#ff6b6b" }}>CALL: A CONSTANT STREAM</span>
          <span style={{ color: "#7dffa8" }}>TEXT: ONE TINY PACKET</span>
        </div>
      ) : null}
    </Board>
  );
};

// ───────────────────────── L · the map: Chicago → Montana ─────────────────────────
const X = (lon: number) => 60 + ((lon + 126) / 60) * 960;
const Y = (lat: number) => 1340 - ((lat - 24) / 26) * 760;
const COLUMBUS: [number, number] = [39.96, -83.0];
const CHICAGO: [number, number] = [41.88, -87.63];
const CABIN: [number, number] = [46.8, -110.4];

export const SetMap: React.FC<SetProps> = ({ f }) => {
  const route = ramp(f, c.montana, c.montana + 40, easeOut);
  const spread = ramp(f, c.montana - 30, c.highway, (x) => x);
  const n = 40;
  const pts = Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n;
    const lat = CHICAGO[0] + (CABIN[0] - CHICAGO[0]) * t + Math.sin(t * Math.PI) * 1.2;
    const lon = CHICAGO[1] + (CABIN[1] - CHICAGO[1]) * t;
    return `${X(lon)},${Y(lat)}`;
  });
  const shown = pts.slice(0, Math.max(2, Math.round(route * n) + 1)).join(" ");
  return (
    <Board>
      <svg width={1080} height={1920} style={{ position: "absolute" }}>
        {(usDots as [number, number][]).map(([lat, lon], i) => {
          const d = Math.hypot(lat - COLUMBUS[0], (lon - COLUMBUS[1]) * 0.8);
          const red = d < 0.8 + spread * 2.6;
          return <circle key={i} cx={X(lon)} cy={Y(lat)} r={3.4} fill={red ? "#ff3b30" : "#5d7397"} opacity={red ? 0.95 : 0.55} />;
        })}
        <polyline points={shown} fill="none" stroke="#ffd166" strokeWidth={6} strokeDasharray="16 10" />
        {[
          { ll: COLUMBUS, t: "YOU · COLUMBUS", col: "#ff3b30" },
          { ll: CHICAGO, t: "SARAH · CHICAGO", col: "#ffd166" },
          { ll: CABIN, t: "DAD'S CABIN", col: "#7dffa8" },
        ].map((p) => (
          <g key={p.t}>
            <circle cx={X(p.ll[1])} cy={Y(p.ll[0])} r={14} fill={p.col} />
            <text x={X(p.ll[1])} y={Y(p.ll[0]) + (p.ll === COLUMBUS ? 52 : -26)} textAnchor="middle" fill="#fff" style={{ fontFamily: fonts.hud, fontWeight: 700, fontSize: 32, letterSpacing: 2 }}>
              {p.t}
            </text>
          </g>
        ))}
      </svg>
      <InfoTag x={X(-100)} y={1450} title="≈ 1,300 MILES" sub="Chicago → Montana, by car" o={fadeIn(f, c.montana + 20)} />
    </Board>
  );
};

// ───────────────────────── M · the highway out of Columbus ─────────────────────────
const CARS = (() => {
  const r = seeded(21);
  const cols = ["#5f6a7a", "#7a2f2f", "#d8d8d4", "#2f4a6a", "#3a3a3a", "#8a7a5a"];
  return Array.from({ length: 150 }, (_, i) => ({ lane: i % 3, z: -Math.floor(i / 3) * 6.4 - r() * 1.6, col: cols[Math.floor(r() * cols.length)] }));
})();

export const SetHighway: React.FC<SetProps> = ({ f }) => {
  const cam: Cam = { pos: keys3(f, [[c.highway, [8, 7.5, 16]], [c.street, [5, 6, 4]]]), look: [0, 0, -40], fov: 46 };
  const asphalt = tex("asphalt", "#26272b", [2, 40], 10);
  return (
    <AbsoluteFill>
      <Canvas cam={cam} bg="#0a0e1c" fog={["#0a0e1c", 30, 240]} post={{ bloom: 1.3, ao: 1.0, vignette: 0.6, env: 0.08 }}>
        <hemisphereLight args={["#5a6fae", "#1a1a1a", 0.9]} />
        <KeyLight p={[-20, 30, 20]} target={[0, 0, -30]} intensity={0.7} color="#a9bcff" size={40} />
        {[-9.5, 9.5].map((x) =>
          [0, -40, -80, -120].map((z) => <Streetlight key={`${x}${z}`} p={[x, 0, z]} />),
        )}
        <Slab p={[0, -0.05, -150]} s={[16, 0.1, 340]} map={asphalt} rough={0.9} />
        <Slab p={[0, -0.1, -150]} s={[300, 0.05, 340]} color="#141a14" rough={1} />
        {Array.from({ length: 50 }, (_, i) => [-1.7, 1.7].map((x) => <Slab key={`${i}${x}`} p={[x, 0.01, 4 - i * 7]} s={[0.12, 0.01, 3]} color="#d9d2b0" rough={0.6} />))}
        {[-8.2, 8.2].map((x) => (
          <Slab key={x} p={[x, 0.45, -150]} s={[0.12, 0.3, 340]} color="#9aa0a6" metal={0.7} rough={0.4} />
        ))}
        {CARS.map((car, i) => (
          <Car key={i} p={[(car.lane - 1) * 3.4, 0, car.z]} color={car.col} tail={1} />
        ))}
        {/* overhead sign */}
        <group position={[0, 0, -30]}>
          {[-7.5, 7.5].map((x) => (
            <Cyl key={x} p={[x, 3.5, 0]} r={0.15} h={7} color="#7f868d" metal={0.6} />
          ))}
          <Slab p={[0, 6.8, 0]} s={[15, 0.3, 0.3]} color="#7f868d" metal={0.6} />
          <RB p={[2.5, 5.8, 0.2]} s={[5.5, 1.8, 0.1]} r={0.05} color="#1f6b3a" emissive="#1f6b3a" ei={0.25} />
        </group>
      </Canvas>
      {(() => {
        const p = at(cam, [2.5, 5.8, -29.8]);
        return p ? (
          <div style={{ position: "absolute", left: p.x, top: p.y, transform: "translate(-50%,-50%)", fontFamily: fonts.hud, fontWeight: 800, color: "#fff", fontSize: 30, letterSpacing: 2, textAlign: "center", lineHeight: 1.1 }}>
            I-70 WEST
            <div style={{ fontSize: 20, opacity: 0.85 }}>INDIANAPOLIS</div>
          </div>
        ) : null;
      })()}
      <div style={{ position: "absolute", top: 1180, width: "100%", display: "flex", justifyContent: "center" }}>
        <BigNum value="100 MILES" label="OF TRAFFIC · HOUSTON, 2005" color="#ff6b6b" size={120} o={fadeIn(f, c.miles)} />
      </div>
    </AbsoluteFill>
  );
};

// ───────────────────────── N · 3:12 AM, the knock ─────────────────────────
export const SetKnock: React.FC<SetProps> = ({ f }) => {
  const k = (n: number) => {
    const t = f - (c.knocks + 4 + n * 12);
    return t >= 0 && t < 6 ? t / 6 : 0;
  };
  const knock = k(0) || k(1) || k(2);
  const cam: Cam = {
    pos: keys3(f, [[c.street, [1.6, 1.6, 2.6]], [c.knocks, [1.2, 1.55, 0.6]], [c.arms, [0.95, 1.5, -1.0]], [c.end, [0.9, 1.48, -1.3]]]),
    look: keys3(f, [[c.street, [0.4, 1.3, -3.4]], [c.knocks, [0.7, 1.35, -3.4]], [c.arms, [0.75, 1.4, -3.4]]]),
    fov: 44,
  };
  const markIn = fadeIn(f, c.mark - 10, 12);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Canvas cam={cam} bg="#020306" post={{ bloom: 1.0, ao: 1.6, vignette: 0.7, env: 0.03 }}>
        <Hallway f={f} night knock={knock} />
        {/* Mark behind the frosted glass: a backlit shadow on the pane — head and shoulders, no arms */}
        <group position={[0.75, 0, -3.42 + 0.07]}>
          <mesh position={[0.0, 1.62, 0]}>
            <circleGeometry args={[0.075, 24]} />
            <meshBasicMaterial color="#05070c" transparent opacity={0.95 * markIn} />
          </mesh>
          <mesh position={[0.0, 1.28, 0]}>
            <planeGeometry args={[0.28, 0.56]} />
            <meshBasicMaterial color="#05070c" transparent opacity={0.95 * markIn} />
          </mesh>
        </group>
        <spotLight position={[0, 3, -6]} angle={0.5} penumbra={0.8} intensity={12 * markIn} color="#9fb3d8" />
      </Canvas>
    </AbsoluteFill>
  );
};

/** End: the question, then the series card. */
export const QuestionCard: React.FC<{ f: number }> = ({ f }) => {
  if (f < c.open) return null;
  const o = fadeIn(f, c.open, 8);
  const part = f >= c.end - 70;
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", background: `rgba(0,0,0,${part ? 0.85 : 0.35 * o})` }}>
      {!part ? (
        <div style={{ opacity: o, width: 820, padding: "36px 40px", borderRadius: 22, background: "rgba(9,11,16,0.92)", border: "2px solid rgba(255,255,255,0.18)", textAlign: "center" }}>
          <div style={{ fontFamily: fonts.punch, fontWeight: 800, fontSize: 70, color: "#fff", lineHeight: 1.1 }}>WOULD YOU OPEN THE DOOR?</div>
          <div style={{ display: "flex", justifyContent: "center", gap: 60, marginTop: 30 }}>
            <div style={{ width: 200, padding: "16px 0", borderRadius: 999, background: "#2fa865", color: "#fff", fontFamily: fonts.hud, fontWeight: 800, fontSize: 52 }}>YES</div>
            <div style={{ width: 200, padding: "16px 0", borderRadius: 999, background: "#e0302a", color: "#fff", fontFamily: fonts.hud, fontWeight: 800, fontSize: 52 }}>NO</div>
          </div>
          <div style={{ fontFamily: fonts.hud, fontWeight: 700, fontSize: 30, letterSpacing: 4, color: "rgba(255,255,255,0.6)", marginTop: 22 }}>COMMENT BELOW</div>
        </div>
      ) : (
        <div style={{ textAlign: "center", opacity: fadeIn(f, c.end - 70, 10) }}>
          <div style={{ fontFamily: fonts.hud, fontWeight: 700, fontSize: 34, letterSpacing: 8, color: "#ff5a4f" }}>OUTBREAK · DAY 1</div>
          <div style={{ fontFamily: fonts.punch, fontWeight: 800, fontSize: 170, color: "#fff", lineHeight: 1 }}>PART 2?</div>
          <div style={{ fontFamily: fonts.hud, fontWeight: 700, fontSize: 40, letterSpacing: 4, color: "#ffd166", marginTop: 16 }}>WHAT HAPPENS AT THE DOOR</div>
          <div style={{ fontFamily: fonts.hud, fontWeight: 600, fontSize: 30, letterSpacing: 3, color: "rgba(255,255,255,0.6)", marginTop: 18 }}>COMMENT “PART 2” · FOLLOW</div>
        </div>
      )}
    </AbsoluteFill>
  );
};

export { keys };
