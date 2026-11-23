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

/** 1. TunnelCard: 4 canyon tunnels · 17 m / 56 ft diameter */
export const TunnelCard: React.FC<{ f: number; at: number; until: number }> = ({ f, at, until }) => {
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
          border: "4px solid #4ceeff",
          boxShadow: "0 18px 50px rgba(0,0,0,0.6)",
          transform: `scale(${0.86 + 0.14 * k})`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <div style={{ fontFamily: fonts.hud, fontSize: 25, color: "#80e8ff" }}>DIVERSION TUNNELS</div>
          <div style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 42, color: "#fff" }}>4 BORES · 17 m / 56 ft</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: fonts.hud, fontSize: 24, color: "#ffd23f" }}>RIVERBED</div>
          <div style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 38, color: "#5dfc8d" }}>DRY SITE ✓</div>
        </div>
      </div>
    </div>
  );
};

/** 2. ArchCard: 221 m / 726 ft · 200 m -> 14 m arch-gravity wedge */
export const ArchCard: React.FC<{ f: number; at: number; archAt: number; until: number }> = ({ f, at, archAt, until }) => {
  if (f < at || f >= until) return null;
  const k = pop(f, at, 8);
  const arch = f >= archAt;
  return (
    <div style={{ position: "absolute", top: 190, width: "100%", display: "flex", justifyContent: "center" }}>
      <div
        style={{
          width: 920,
          padding: "20px 26px",
          borderRadius: 22,
          background: "rgba(8,14,24,0.92)",
          border: `4px solid ${arch ? "#5dfc8d" : "#ff4c3d"}`,
          boxShadow: "0 18px 50px rgba(0,0,0,0.6)",
          transform: `scale(${0.86 + 0.14 * k})`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <div style={{ fontFamily: fonts.hud, fontSize: 25, color: arch ? "#90ffc2" : "#ff9b92" }}>
            {arch ? "200 m / 660 ft BASE -> 14 m / 45 ft TOP" : "221 m / 726 ft WATER PRESSURE"}
          </div>
          <div style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 40, color: "#fff" }}>
            {arch ? "ARCH WEDGE HOLDS ✓" : "FLAT WALL CRACKS ✗"}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: fonts.hud, fontSize: 24, color: "#ffd23f" }}>HEIGHT</div>
          <div style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 38, color: "#ffd23f" }}>221 m · 726 ft</div>
        </div>
      </div>
    </div>
  );
};

/** 3. CoolCard: 125 yrs monolith trap vs 930 km / 582 mi ice cooling pipes */
export const CoolCard: React.FC<{ f: number; at: number; pipeAt: number; until: number }> = ({ f, at, pipeAt, until }) => {
  if (f < at || f >= until) return null;
  const k = pop(f, at, 8);
  const pipes = f >= pipeAt;
  return (
    <div style={{ position: "absolute", top: 190, width: "100%", display: "flex", justifyContent: "center" }}>
      <div
        style={{
          width: 920,
          padding: "20px 26px",
          borderRadius: 22,
          background: "rgba(8,14,24,0.92)",
          border: `4px solid ${pipes ? "#5ceeff" : "#ff5a1f"}`,
          boxShadow: "0 18px 50px rgba(0,0,0,0.6)",
          transform: `scale(${0.86 + 0.14 * k})`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <div style={{ fontFamily: fonts.hud, fontSize: 25, color: pipes ? "#82f6ff" : "#ffb088" }}>
            {pipes ? "INTERLOCKING BLOCKS + ICE WATER" : "3.25M CU YD · 2.5M m³"}
          </div>
          <div style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 40, color: "#fff" }}>
            {pipes ? "930 km · 582 mi PIPES" : "125 YEARS TO COOL"}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: fonts.hud, fontSize: 24, color: "#ffd23f" }}>RESULT</div>
          <div style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 36, color: pipes ? "#5dfc8d" : "#ff4c3d" }}>
            {pipes ? "GROUTED SOLID ✓" : "SHATTERS ✗"}
          </div>
        </div>
      </div>
    </div>
  );
};

/** 4. TurbineCard: 17 turbines · 2,080 MW */
export const TurbineCard: React.FC<{ f: number; at: number; until: number }> = ({ f, at, until }) => {
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
          border: "4px solid #ffd23f",
          boxShadow: "0 18px 50px rgba(0,0,0,0.6)",
          transform: `scale(${0.86 + 0.14 * k})`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <div style={{ fontFamily: fonts.hud, fontSize: 25, color: "#80e8ff" }}>HOOVER POWERPLANT</div>
          <div style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 42, color: "#fff" }}>17 GIANT TURBINES</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: fonts.hud, fontSize: 24, color: "#ffd23f" }}>OUTPUT</div>
          <div style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 40, color: "#ffd23f" }}>2,080 MW</div>
        </div>
      </div>
    </div>
  );
};
