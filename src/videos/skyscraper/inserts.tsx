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

/** 1. PileCard: 192 piles · 50 m / 164 ft deep · 3.7 m raft */
export const PileCard: React.FC<{ f: number; at: number; pileAt: number; until: number }> = ({ f, at, pileAt, until }) => {
  if (f < at || f >= until) return null;
  const k = pop(f, at, 8);
  const pilesOn = f >= pileAt;
  return (
    <div style={{ position: "absolute", top: 190, width: "100%", display: "flex", justifyContent: "center" }}>
      <div
        style={{
          width: 920,
          padding: "20px 26px",
          borderRadius: 22,
          background: "rgba(8,14,24,0.92)",
          border: `4px solid ${pilesOn ? "#ffd23f" : "#ff4c3d"}`,
          boxShadow: "0 18px 50px rgba(0,0,0,0.6)",
          transform: `scale(${0.86 + 0.14 * k})`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <div style={{ fontFamily: fonts.hud, fontSize: 26, letterSpacing: 2, color: pilesOn ? "#8be8ff" : "#ff9b92" }}>
            {pilesOn ? "192 CONCRETE FRICTION PILES" : "163 FLOORS · ZERO BEDROCK"}
          </div>
          <div style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 42, color: "#fff" }}>
            {pilesOn ? "50 m · 164 ft DEEP" : "450,000 t · 500k US t"}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: fonts.hud, fontSize: 24, color: "#ffd23f" }}>{pilesOn ? "RAFT SLAB" : "SUBSOIL"}</div>
          <div style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 38, color: "#ffd23f" }}>
            {pilesOn ? "3.7 m · 12 ft" : "DESERT SAND"}
          </div>
        </div>
      </div>
    </div>
  );
};

/** 2. HeatCard: 50°C · 122°F daytime heat vs Night Ice Pours */
export const HeatCard: React.FC<{ f: number; at: number; iceAt: number; until: number }> = ({ f, at, iceAt, until }) => {
  if (f < at || f >= until) return null;
  const k = pop(f, at, 8);
  const ice = f >= iceAt;
  return (
    <div style={{ position: "absolute", top: 190, width: "100%", display: "flex", justifyContent: "center" }}>
      <div
        style={{
          width: 900,
          padding: "20px 28px",
          borderRadius: 22,
          background: "rgba(8,14,24,0.92)",
          border: `4px solid ${ice ? "#4ceeff" : "#ff6b38"}`,
          boxShadow: "0 18px 50px rgba(0,0,0,0.6)",
          transform: `scale(${0.86 + 0.14 * k})`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <div style={{ fontFamily: fonts.hud, fontSize: 26, color: ice ? "#7cf5ff" : "#ffb088" }}>
            {ice ? "CRUSHED ICE MIX + PUMP" : "DUBAI DAYTIME HEAT"}
          </div>
          <div style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 44, color: "#fff" }}>
            {ice ? "NIGHT POURS ONLY" : "50°C · 122°F"}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: fonts.hud, fontSize: 24, color: "#a4b8cc" }}>STATUS</div>
          <div style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 36, color: ice ? "#5dfc8d" : "#ff4c3d" }}>
            {ice ? "CURES CLEAN ✓" : "CRACKS FAST ✗"}
          </div>
        </div>
      </div>
    </div>
  );
};

/** 3. VortexCard: 828 m · 2,717 ft | Y-SHAPE · 27 SETBACKS */
export const VortexCard: React.FC<{ f: number; at: number; yAt: number; until: number }> = ({ f, at, yAt, until }) => {
  if (f < at || f >= until) return null;
  const k = pop(f, at, 8);
  const ys = f >= yAt;
  return (
    <div style={{ position: "absolute", top: 190, width: "100%", display: "flex", justifyContent: "center" }}>
      <div
        style={{
          width: 920,
          padding: "20px 26px",
          borderRadius: 22,
          background: "rgba(8,14,24,0.92)",
          border: `4px solid ${ys ? "#5dfc8d" : "#ff4238"}`,
          boxShadow: "0 18px 50px rgba(0,0,0,0.6)",
          transform: `scale(${0.86 + 0.14 * k})`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <div style={{ fontFamily: fonts.hud, fontSize: 26, color: ys ? "#90ffc2" : "#ff9b92" }}>
            {ys ? "Y-SHAPE · 27 SPIRAL SETBACKS" : "828 m · 2,717 ft WIND LOAD"}
          </div>
          <div style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 40, color: "#fff" }}>
            {ys ? "VORTICES BROKEN ✓" : "RESONANT SHAKING"}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: fonts.hud, fontSize: 24, color: "#80e8ff" }}>HEIGHT</div>
          <div style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 38, color: "#ffd23f" }}>828 m · 2,717 ft</div>
        </div>
      </div>
    </div>
  );
};

/** 4. GlassCard: 24,348 glass panels · 3 months cycle */
export const GlassCard: React.FC<{ f: number; at: number; until: number }> = ({ f, at, until }) => {
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
          <div style={{ fontFamily: fonts.hud, fontSize: 26, color: "#80e8ff" }}>CURTAIN WALL FACADE</div>
          <div style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 44, color: "#fff" }}>24,348 PANELS</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: fonts.hud, fontSize: 24, color: "#ffd23f" }}>CLEANING CYCLE</div>
          <div style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 40, color: "#ffd23f" }}>3 MONTHS</div>
        </div>
      </div>
    </div>
  );
};

/** 5. SpeedCard: Double-deck express elevator 36 km/h · 22 mph · 10 m/s */
export const SpeedCard: React.FC<{ f: number; at: number; until: number }> = ({ f, at, until }) => {
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
          border: "4px solid #5ff0ff",
          boxShadow: "0 18px 50px rgba(0,0,0,0.6)",
          transform: `scale(${0.86 + 0.14 * k})`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <div style={{ fontFamily: fonts.hud, fontSize: 26, color: "#80e8ff" }}>DOUBLE-DECK EXPRESS</div>
          <div style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 44, color: "#fff" }}>36 km/h · 22 mph</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: fonts.hud, fontSize: 24, color: "#ffd23f" }}>TOP SPEED</div>
          <div style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 40, color: "#ffd23f" }}>10 m/s · 163 FL</div>
        </div>
      </div>
    </div>
  );
};
