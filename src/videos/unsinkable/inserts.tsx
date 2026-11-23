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

/** 1. HullSpecCard: 269.1 m / 883 ft · 3M Rivets */
export const HullSpecCard: React.FC<{ f: number; at: number; until: number }> = ({ f, at, until }) => {
  if (f < at || f >= until) return null;
  const k = pop(f, at, 8);
  return (
    <div style={{ position: "absolute", top: 195, width: "100%", display: "flex", justifyContent: "center" }}>
      <div
        style={{
          width: 900,
          padding: "20px 28px",
          borderRadius: 22,
          background: "rgba(8,14,24,0.9)",
          border: "4px solid #59c8ff",
          boxShadow: "0 18px 50px rgba(0,0,0,0.55)",
          transform: `scale(${0.86 + 0.14 * k})`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <div style={{ fontFamily: fonts.hud, fontSize: 28, letterSpacing: 3, color: "#90dcff" }}>RMS TITANIC · LENGTH</div>
          <div style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 48, color: "#fff" }}>269 m · 883 ft</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: fonts.hud, fontSize: 28, letterSpacing: 3, color: "#ffd23f" }}>STEEL HULL</div>
          <div style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 48, color: "#ffd23f" }}>3M RIVETS</div>
        </div>
      </div>
    </div>
  );
};

/** 2. IceCubeCard: 16 watertight compartments · E-deck open top @ 3 m / 10 ft */
export const IceCubeCard: React.FC<{ f: number; at: number; twistAt: number; until: number }> = ({ f, at, twistAt, until }) => {
  if (f < at || f >= until) return null;
  const k = pop(f, at, 8);
  const open = f >= twistAt;
  return (
    <div style={{ position: "absolute", top: 190, width: "100%", display: "flex", justifyContent: "center" }}>
      <div
        style={{
          width: 920,
          padding: "20px 26px",
          borderRadius: 22,
          background: "rgba(8,14,24,0.92)",
          border: `4px solid ${open ? "#ff4c3d" : "#28d4e6"}`,
          boxShadow: "0 18px 50px rgba(0,0,0,0.6)",
          transform: `scale(${0.86 + 0.14 * k})`,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span style={{ fontFamily: fonts.hud, fontSize: 30, letterSpacing: 3, color: open ? "#ff9f96" : "#80e8ff" }}>
            {open ? "UNSEALED TOPS · ICE CUBE TRAY" : "16 WATERTIGHT COMPARTMENTS"}
          </span>
          <span style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 44, color: open ? "#ff4c3d" : "#5dfc8d" }}>
            {open ? "3 m · 10 ft" : "4 FLOOD = SAFE"}
          </span>
        </div>
        <div style={{ fontFamily: fonts.hud, fontSize: 26, color: "#d5e2ee", marginTop: 6 }}>
          {open ? "WALLS STOP AT E-DECK · 3 m / 10 ft ABOVE WATERLINE" : "15 TRANSVERSE STEEL BULKHEADS"}
        </div>
      </div>
    </div>
  );
};

/** 3. FunnelCard: 29 Coal Boilers -> 3 Funnels (#4 = Dummy / Air Vent) */
export const FunnelCard: React.FC<{ f: number; at: number; fakeAt: number; until: number }> = ({ f, at, fakeAt, until }) => {
  if (f < at || f >= until) return null;
  const k = pop(f, at, 8);
  const isFake = f >= fakeAt;
  return (
    <div style={{ position: "absolute", top: 190, width: "100%", display: "flex", justifyContent: "center" }}>
      <div
        style={{
          width: 900,
          padding: "20px 28px",
          borderRadius: 22,
          background: "rgba(10,14,22,0.9)",
          border: `4px solid ${isFake ? "#ffd23f" : "#ff8c38"}`,
          boxShadow: "0 18px 50px rgba(0,0,0,0.58)",
          transform: `scale(${0.86 + 0.14 * k})`,
          display: "flex",
          gap: 18,
        }}
      >
        <div style={{ flex: 1, padding: "12px 16px", borderRadius: 14, background: "rgba(255,140,56,0.16)", border: "2px solid #ff8c38" }}>
          <div style={{ fontFamily: fonts.hud, fontSize: 26, color: "#ffb885" }}>29 COAL BOILERS</div>
          <div style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 38, color: "#fff" }}>3 FUNNELS</div>
        </div>
        <div
          style={{
            flex: 1.2,
            padding: "12px 16px",
            borderRadius: 14,
            background: isFake ? "rgba(255,210,63,0.18)" : "rgba(255,255,255,0.06)",
            border: `2px solid ${isFake ? "#ffd23f" : "#516075"}`,
          }}
        >
          <div style={{ fontFamily: fonts.hud, fontSize: 26, color: isFake ? "#ffd23f" : "#8996aa" }}>FUNNEL #4</div>
          <div style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 38, color: isFake ? "#67e4ff" : "#8996aa" }}>
            {isFake ? "AIR VENT ONLY" : "LOOKS COOLER"}
          </div>
        </div>
      </div>
    </div>
  );
};

/** 4. LifeboatCard: 1894 Law: 16 | Titanic: 20 (1,178 seats) | Aboard: 2,224 */
export const LifeboatCard: React.FC<{ f: number; at: number; lawAt: number; until: number }> = ({ f, at, lawAt, until }) => {
  if (f < at || f >= until) return null;
  const k = pop(f, at, 8);
  const showLaw = f >= lawAt;
  return (
    <div style={{ position: "absolute", top: 190, width: "100%", display: "flex", justifyContent: "center" }}>
      <div
        style={{
          width: 920,
          padding: "20px 26px",
          borderRadius: 22,
          background: "rgba(10,14,22,0.92)",
          border: "4px solid #ffd23f",
          boxShadow: "0 18px 50px rgba(0,0,0,0.6)",
          transform: `scale(${0.86 + 0.14 * k})`,
          display: "flex",
          gap: 14,
        }}
      >
        <div style={{ flex: 1, padding: "12px", borderRadius: 12, background: "rgba(255,210,63,0.14)", border: "2px solid #ffd23f" }}>
          <div style={{ fontFamily: fonts.hud, fontSize: 22, color: "#ffd23f" }}>1894 LEGAL MIN</div>
          <div style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 34, color: "#fff", whiteSpace: "nowrap" }}>{showLaw ? "16 BOATS ✓" : "48 PLANNED"}</div>
        </div>
        <div style={{ flex: 1.15, padding: "12px", borderRadius: 12, background: "rgba(76,238,255,0.14)", border: "2px solid #4ceeff" }}>
          <div style={{ fontFamily: fonts.hud, fontSize: 22, color: "#80e8ff" }}>TITANIC CARRIED</div>
          <div style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 34, color: "#fff", whiteSpace: "nowrap" }}>20 (1,178 SEATS)</div>
        </div>
        <div style={{ flex: 0.85, padding: "12px", borderRadius: 12, background: "rgba(255,66,56,0.18)", border: "2px solid #ff4238" }}>
          <div style={{ fontFamily: fonts.hud, fontSize: 22, color: "#ff9b92" }}>ABOARD</div>
          <div style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 34, color: "#ff6b5e", whiteSpace: "nowrap" }}>2,224</div>
        </div>
      </div>
    </div>
  );
};

/** 5. TurbineCard: Center turbine has no reverse -> stalls -> rudder wash lost */
export const TurbineCard: React.FC<{ f: number; at: number; until: number }> = ({ f, at, until }) => {
  if (f < at || f >= until) return null;
  const k = pop(f, at, 8);
  return (
    <div style={{ position: "absolute", top: 190, width: "100%", display: "flex", justifyContent: "center" }}>
      <div
        style={{
          width: 920,
          padding: "20px 28px",
          borderRadius: 22,
          background: "rgba(8,14,24,0.92)",
          border: "4px solid #ff4238",
          boxShadow: "0 18px 50px rgba(0,0,0,0.6)",
          transform: `scale(${0.86 + 0.14 * k})`,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span style={{ fontFamily: fonts.hud, fontSize: 28, letterSpacing: 3, color: "#ff9f96" }}>PARSONS CENTER TURBINE</span>
          <span style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 42, color: "#ff4238" }}>NO REVERSE GEAR</span>
        </div>
        <div style={{ fontFamily: fonts.hud, fontSize: 28, color: "#cfe5f5", marginTop: 6 }}>
          STOPPED DEAD → LOST WATER FLOW OVER RUDDER
        </div>
      </div>
    </div>
  );
};

/** 6. DepthCard: Animated descent counter to 3,800 m · 12,500 ft + 2h 40m */
export const DepthCard: React.FC<{ f: number; at: number; until: number }> = ({ f, at, until }) => {
  if (f < at || f >= until) return null;
  const k = pop(f, at, 8);
  const p = ramp(f, at, at + 38, easeOut);
  const meters = Math.round(p * 3800);
  const feet = Math.round(p * 12500);
  return (
    <div style={{ position: "absolute", top: 190, width: "100%", display: "flex", justifyContent: "center" }}>
      <div
        style={{
          width: 900,
          padding: "20px 28px",
          borderRadius: 22,
          background: "rgba(4,18,30,0.92)",
          border: "4px solid #3deeff",
          boxShadow: "0 18px 50px rgba(0,0,0,0.65)",
          transform: `scale(${0.86 + 0.14 * k})`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <div style={{ fontFamily: fonts.hud, fontSize: 28, letterSpacing: 3, color: "#7ce3ff" }}>WRECK DEPTH</div>
          <div style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 46, color: "#fff", fontVariantNumeric: "tabular-nums" }}>
            {meters.toLocaleString("en-US")} m · {feet.toLocaleString("en-US")} ft
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: fonts.hud, fontSize: 26, color: "#9dc6dc" }}>SANK IN</div>
          <div style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 44, color: "#ffd23f" }}>2h 40m</div>
        </div>
      </div>
    </div>
  );
};
