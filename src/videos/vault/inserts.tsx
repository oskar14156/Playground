import React from "react";
import { fonts } from "../../lib/theme";
import { easeOut, ramp } from "../../lib/timing";

export { Stamp, CounterPill } from "../pyramid/inserts";
export { YearTag } from "../louvre/inserts";
export { Tag, Big } from "../rocket/sets";
export { Pill } from "../sewer/inserts";

const pop = (f: number, a: number, d = 8) => {
  const k = ramp(f, a, a + d, easeOut);
  return k < 1 ? k * (1 + 0.24 * Math.sin(k * Math.PI)) : 1;
};

/** 1. WallCard: 4,200 cu yd / 3,211 m3 concrete · 750 t steel · 1.2 m / 4 ft wall */
export const WallCard: React.FC<{ f: number; at: number; until: number }> = ({ f, at, until }) => {
  if (f < at || f >= until) return null;
  const k = pop(f, at, 8);
  return (
    <div style={{ position: "absolute", top: 190, width: "100%", display: "flex", justifyContent: "center" }}>
      <div
        style={{
          width: 920,
          padding: "20px 26px",
          borderRadius: 22,
          background: "rgba(8,14,24,0.92)",
          border: "4px solid #ffd23f",
          boxShadow: "0 18px 50px rgba(0,0,0,0.6)",
          transform: `scale(${0.86 + 0.14 * k})`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <div style={{ fontFamily: fonts.hud, fontSize: 25, letterSpacing: 2, color: "#90dcff" }}>GRANITE + 750 t STEEL</div>
          <div style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 40, color: "#fff" }}>4,200 cu yd · 3,211 m³</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: fonts.hud, fontSize: 24, color: "#ffd23f" }}>WALL THICKNESS</div>
          <div style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 38, color: "#ffd23f" }}>1.2 m · 4 ft</div>
        </div>
      </div>
    </div>
  );
};

/** 2. DoorCard: 20-ton blast door · 10 split codes */
export const DoorCard: React.FC<{ f: number; at: number; splitAt: number; until: number }> = ({ f, at, splitAt, until }) => {
  if (f < at || f >= until) return null;
  const k = pop(f, at, 8);
  const split = f >= splitAt;
  return (
    <div style={{ position: "absolute", top: 190, width: "100%", display: "flex", justifyContent: "center" }}>
      <div
        style={{
          width: 920,
          padding: "20px 26px",
          borderRadius: 22,
          background: "rgba(8,14,24,0.92)",
          border: `4px solid ${split ? "#42f58a" : "#ffd23f"}`,
          boxShadow: "0 18px 50px rgba(0,0,0,0.6)",
          transform: `scale(${0.86 + 0.14 * k})`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <div style={{ fontFamily: fonts.hud, fontSize: 25, color: split ? "#8effbe" : "#80e8ff" }}>
            {split ? "ZERO MASTER PASSWORD" : "MOSLER ARMOR DOOR"}
          </div>
          <div style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 42, color: "#fff" }}>
            {split ? "10 SPLIT CODES" : "20 TONS · 18 t"}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: fonts.hud, fontSize: 24, color: "#ffd23f" }}>TORCH / DRILL</div>
          <div style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 38, color: "#42f58a" }}>BLAST PROOF ✓</div>
        </div>
      </div>
    </div>
  );
};

/** 3. DefenseCard: Off-grid power/water -> US Army base + radar */
export const DefenseCard: React.FC<{ f: number; at: number; armyAt: number; until: number }> = ({ f, at, armyAt, until }) => {
  if (f < at || f >= until) return null;
  const k = pop(f, at, 8);
  const army = f >= armyAt;
  return (
    <div style={{ position: "absolute", top: 190, width: "100%", display: "flex", justifyContent: "center" }}>
      <div
        style={{
          width: 920,
          padding: "20px 26px",
          borderRadius: 22,
          background: "rgba(8,14,24,0.92)",
          border: `4px solid ${army ? "#ff6b38" : "#4ceeff"}`,
          boxShadow: "0 18px 50px rgba(0,0,0,0.6)",
          transform: `scale(${0.86 + 0.14 * k})`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <div style={{ fontFamily: fonts.hud, fontSize: 25, color: army ? "#ffb088" : "#7cf5ff" }}>
            {army ? "PERIMETER LOCKDOWN" : "OFF-GRID UTILITIES"}
          </div>
          <div style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 40, color: "#fff" }}>
            {army ? "US ARMY BASE + RADAR" : "OWN POWER + WATER"}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: fonts.hud, fontSize: 24, color: "#a4b8cc" }}>SECURITY</div>
          <div style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 36, color: "#5dfc8d" }}>SELF-CONTAINED</div>
        </div>
      </div>
    </div>
  );
};

/** 4. GoldCard: 4,580 t / 147M oz gold -> Code #10 Lost */
export const GoldCard: React.FC<{ f: number; at: number; lostAt: number; until: number }> = ({ f, at, lostAt, until }) => {
  if (f < at || f >= until) return null;
  const k = pop(f, at, 8);
  const lost = f >= lostAt;
  return (
    <div style={{ position: "absolute", top: 190, width: "100%", display: "flex", justifyContent: "center" }}>
      <div
        style={{
          width: 920,
          padding: "20px 26px",
          borderRadius: 22,
          background: "rgba(8,14,24,0.92)",
          border: `4px solid ${lost ? "#ff4238" : "#ffd23f"}`,
          boxShadow: "0 18px 50px rgba(0,0,0,0.6)",
          transform: `scale(${0.86 + 0.14 * k})`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <div style={{ fontFamily: fonts.hud, fontSize: 25, color: lost ? "#ff9b92" : "#ffe680" }}>
            {lost ? "WHO HAS CODE #10 ??" : "U.S. TREASURY GOLD"}
          </div>
          <div style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 40, color: "#fff" }}>
            {lost ? "LOCKED OUT FOREVER" : "4,580 t · 147M troy oz"}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: fonts.hud, fontSize: 24, color: "#ffd23f" }}>CODES READY</div>
          <div style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 40, color: lost ? "#ff4238" : "#ffd23f" }}>
            {lost ? "9 / 10 ✗" : "10 / 10"}
          </div>
        </div>
      </div>
    </div>
  );
};
