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

/** 1. LaunchCard: 333 m / 1,092 ft · EMALS 0->240 km/h (150 mph) in 2s */
export const LaunchCard: React.FC<{ f: number; at: number; emalsAt: number; until: number }> = ({ f, at, emalsAt, until }) => {
  if (f < at || f >= until) return null;
  const k = pop(f, at, 8);
  const em = f >= emalsAt;
  return (
    <div style={{ position: "absolute", top: 190, width: "100%", display: "flex", justifyContent: "center" }}>
      <div
        style={{
          width: 920,
          padding: "20px 26px",
          borderRadius: 22,
          background: "rgba(8,14,24,0.92)",
          border: `4px solid ${em ? "#4ceeff" : "#ffd23f"}`,
          boxShadow: "0 18px 50px rgba(0,0,0,0.6)",
          transform: `scale(${0.86 + 0.14 * k})`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <div style={{ fontFamily: fonts.hud, fontSize: 25, color: em ? "#7cf5ff" : "#ffe680" }}>
            {em ? "EMALS MAGNETIC CATAPULT" : "100,000 t · 75 JETS · 4,500 CREW"}
          </div>
          <div style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 40, color: "#fff" }}>
            {em ? "240 km/h · 150 mph (2s)" : "333 m · 1,092 ft DECK"}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: fonts.hud, fontSize: 24, color: "#ffd23f" }}>{em ? "0 -> TAKEOFF" : "AIRPORT RUNWAY"}</div>
          <div style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 38, color: em ? "#5dfc8d" : "#ffd23f" }}>
            {em ? "2.0 SECONDS" : "2,000 m · 1.2 mi"}
          </div>
        </div>
      </div>
    </div>
  );
};

/** 2. CatchCard: 3 AAG steel cables · 90 m / 300 ft dead stop */
export const CatchCard: React.FC<{ f: number; at: number; bolterAt: number; until: number }> = ({ f, at, bolterAt, until }) => {
  if (f < at || f >= until) return null;
  const k = pop(f, at, 8);
  const bolt = f >= bolterAt;
  return (
    <div style={{ position: "absolute", top: 190, width: "100%", display: "flex", justifyContent: "center" }}>
      <div
        style={{
          width: 920,
          padding: "20px 26px",
          borderRadius: 22,
          background: "rgba(8,14,24,0.92)",
          border: `4px solid ${bolt ? "#ff6b38" : "#ffd23f"}`,
          boxShadow: "0 18px 50px rgba(0,0,0,0.6)",
          transform: `scale(${0.86 + 0.14 * k})`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <div style={{ fontFamily: fonts.hud, fontSize: 25, color: bolt ? "#ffb088" : "#80e8ff" }}>
            {bolt ? "IF YOU MISS ALL 3 WIRES" : "WATER-TURBINE ARRESTING GEAR"}
          </div>
          <div style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 40, color: "#fff" }}>
            {bolt ? "FULL THROTTLE TOUCHDOWN" : "3 CABLES · 90 m / 300 ft"}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: fonts.hud, fontSize: 24, color: "#ffd23f" }}>MODE</div>
          <div style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 38, color: bolt ? "#ff9b42" : "#42f58a" }}>
            {bolt ? "GO AROUND ↑" : "DEAD STOP ✓"}
          </div>
        </div>
      </div>
    </div>
  );
};

/** 3. ReactorCard: 2x A1B nuclear reactors · 25 years no refueling */
export const ReactorCard: React.FC<{ f: number; at: number; until: number }> = ({ f, at, until }) => {
  if (f < at || f >= until) return null;
  const k = pop(f, at, 8);
  return (
    <div style={{ position: "absolute", top: 190, width: "100%", display: "flex", justifyContent: "center" }}>
      <div
        style={{
          width: 900,
          padding: "20px 28px",
          borderRadius: 22,
          background: "rgba(8,14,24,0.92)",
          border: "4px solid #44eeff",
          boxShadow: "0 18px 50px rgba(0,0,0,0.6)",
          transform: `scale(${0.86 + 0.14 * k})`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <div style={{ fontFamily: fonts.hud, fontSize: 25, color: "#80e8ff" }}>TWIN A1B NUCLEAR CORES</div>
          <div style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 42, color: "#fff" }}>2 REACTORS · NO FUEL</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: fonts.hud, fontSize: 24, color: "#ffd23f" }}>ENDURANCE</div>
          <div style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 40, color: "#5dfc8d" }}>25 YEARS</div>
        </div>
      </div>
    </div>
  );
};
