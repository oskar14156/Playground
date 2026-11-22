import React, { useMemo } from "react";
import * as THREE from "three";
import { V3 } from "../../lib/three/core";
import { seeded } from "../../lib/timing";

export const BILL_W = 1.56;
export const BILL_H = 0.663; // exact U.S. $100 aspect ratio (6.14 in × 2.61 in)
const BILL_THICK = 0.004;

// ───────────────────────── texture cache ─────────────────────────
const cache = new Map<string, THREE.CanvasTexture>();
const makeTex = (key: string, w: number, h: number, draw: (g: CanvasRenderingContext2D, r: () => number) => void, srgb = true) => {
  if (cache.has(key)) return cache.get(key)!;
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  const g = cv.getContext("2d")!;
  draw(g, seeded(key.split("").reduce((a, c) => a * 31 + c.charCodeAt(0), 7) % 99991));
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  tex.anisotropy = 8;
  cache.set(key, tex);
  return tex;
};

/** Draw the engraved Fox Fursuit Head inside a banknote portrait frame. */
const drawEngravedFox = (g: CanvasRenderingContext2D, cx: number, cy: number, s: number, ink = "#243b2a", orange = "#d97a36") => {
  g.save();
  g.translate(cx, cy);
  g.scale(s, s);
  // jacket + collar (where microprinting lives)
  g.fillStyle = "#314a37";
  g.beginPath();
  g.moveTo(-125, 118);
  g.quadraticCurveTo(-90, 56, -34, 50);
  g.lineTo(34, 50);
  g.quadraticCurveTo(90, 56, 125, 118);
  g.closePath();
  g.fill();
  g.strokeStyle = ink;
  g.lineWidth = 3;
  g.stroke();

  // shirt V + collar lapels
  g.fillStyle = "#e8ebd8";
  g.beginPath();
  g.moveTo(-36, 50);
  g.lineTo(0, 108);
  g.lineTo(36, 50);
  g.closePath();
  g.fill();
  g.stroke();

  // collar curve text
  g.fillStyle = "#e8ebd8";
  g.font = "bold 9px Arial, sans-serif";
  g.textAlign = "center";
  g.fillText("THE UNITED STATES OF POCKET PUH", 0, 74);

  // ears
  for (const dir of [-1, 1]) {
    g.save();
    g.scale(dir, 1);
    g.fillStyle = orange;
    g.beginPath();
    g.moveTo(22, -46);
    g.lineTo(74, -104);
    g.lineTo(68, -22);
    g.closePath();
    g.fill();
    g.strokeStyle = ink;
    g.lineWidth = 3;
    g.stroke();
    g.fillStyle = "#f2ead5";
    g.beginPath();
    g.moveTo(32, -46);
    g.lineTo(62, -84);
    g.lineTo(58, -32);
    g.closePath();
    g.fill();
    g.restore();
  }

  // head oval + cheek fluff
  g.fillStyle = orange;
  g.beginPath();
  g.ellipse(0, -4, 72, 62, 0, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = ink;
  g.lineWidth = 3;
  g.stroke();

  // muzzle cream
  g.fillStyle = "#f6f0de";
  g.beginPath();
  g.ellipse(0, 22, 46, 30, 0, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = ink;
  g.lineWidth = 2;
  g.stroke();

  // engraving hatching lines across forehead
  g.strokeStyle = "rgba(36,59,42,0.28)";
  g.lineWidth = 1.5;
  for (let y = -46; y <= -18; y += 6) {
    g.beginPath();
    g.moveTo(-48, y);
    g.quadraticCurveTo(0, y - 6, 48, y);
    g.stroke();
  }

  // aqua toon eyes
  for (const dir of [-1, 1]) {
    const ex = dir * 26;
    g.fillStyle = "#ffffff";
    g.beginPath();
    g.ellipse(ex, -14, 15, 17, 0, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = ink;
    g.lineWidth = 2.5;
    g.stroke();
    g.fillStyle = "#2ec4d6";
    g.beginPath();
    g.ellipse(ex, -13, 10, 12, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "#16201a";
    g.beginPath();
    g.ellipse(ex, -13, 5, 6.5, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "#fff";
    g.beginPath();
    g.arc(ex + 4, -18, 3, 0, Math.PI * 2);
    g.fill();
  }

  // brows
  g.fillStyle = "#c96828";
  g.strokeStyle = ink;
  g.lineWidth = 2;
  for (const dir of [-1, 1]) {
    g.beginPath();
    g.roundRect(dir * 26 - 16, -38, 32, 9, 4);
    g.fill();
    g.stroke();
  }

  // nose + tongue
  g.fillStyle = "#1e2420";
  g.beginPath();
  g.ellipse(0, 12, 10, 7, 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#f27a96";
  g.beginPath();
  g.moveTo(-14, 24);
  g.quadraticCurveTo(0, 44, 14, 24);
  g.closePath();
  g.fill();
  g.strokeStyle = ink;
  g.lineWidth = 2;
  g.stroke();
  g.restore();
};

// EURion 5-ring constellation offsets (relative normalized coordinates)
export const EURION_OFFSETS: [number, number][] = [
  [0, 0],
  [0.036, -0.028],
  [0.072, 0.012],
  [0.056, 0.064],
  [-0.008, 0.055],
];
const EURION_CLUSTERS: [number, number][] = [
  [0.24, 0.36],
  [0.74, 0.34],
];

const drawFrontTex = (g: CanvasRenderingContext2D, r: () => number) => {
  // sage cotton-linen background
  const bg = g.createLinearGradient(0, 0, 1024, 440);
  bg.addColorStop(0, "#cfd8be");
  bg.addColorStop(0.5, "#dfe3cd");
  bg.addColorStop(1, "#c9d4b8");
  g.fillStyle = bg;
  g.fillRect(0, 0, 1024, 440);

  // subtle paper grain + red & blue security fibers
  for (let i = 0; i < 420; i++) {
    const x = r() * 1024;
    const y = r() * 440;
    const ang = r() * Math.PI * 2;
    const len = 5 + r() * 8;
    g.strokeStyle = i % 2 === 0 ? "rgba(210, 45, 65, 0.48)" : "rgba(35, 85, 195, 0.48)";
    g.lineWidth = 1.4;
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len);
    g.stroke();
  }

  // subtle pale-gold watermark field tint on right
  const grad = g.createRadialGradient(775, 220, 10, 775, 220, 110);
  grad.addColorStop(0, "rgba(255, 245, 215, 0.45)");
  grad.addColorStop(1, "rgba(255, 245, 215, 0)");
  g.fillStyle = grad;
  g.fillRect(650, 100, 250, 240);

  // EURion subtle yellow "100" dot constellations
  for (const [cx, cy] of EURION_CLUSTERS) {
    for (const [dx, dy] of EURION_OFFSETS) {
      const px = (cx + dx) * 1024;
      const py = (cy + dy) * 440;
      g.strokeStyle = "rgba(214, 175, 42, 0.72)";
      g.lineWidth = 2.4;
      g.beginPath();
      g.arc(px, py, 5.5, 0, Math.PI * 2);
      g.stroke();
      g.fillStyle = "rgba(195, 155, 35, 0.42)";
      g.font = "bold 9px Arial, sans-serif";
      g.fillText("100", px + 8, py + 3);
    }
  }

  // double guilloché outer border
  g.strokeStyle = "#1c4129";
  g.lineWidth = 12;
  g.strokeRect(24, 22, 976, 396);
  g.strokeStyle = "#316343";
  g.lineWidth = 3;
  g.strokeRect(36, 34, 952, 372);
  g.setLineDash([8, 6]);
  g.strokeStyle = "#1c4129";
  g.lineWidth = 2;
  g.strokeRect(43, 41, 938, 358);
  g.setLineDash([]);

  // top engraved header
  g.fillStyle = "#163521";
  g.font = "900 26px Georgia, serif";
  g.textAlign = "center";
  g.fillText("THE UNITED STATES OF POCKET PUH", 512, 74);
  g.font = "bold 13px Arial, sans-serif";
  g.fillStyle = "#2b5239";
  g.fillText("THIS NOTE IS LEGAL TENDER FOR ALL POCKET PUHS, PUBLIC AND PRIVATE", 512, 93);

  // engraved portrait oval in center-left
  g.save();
  g.beginPath();
  g.ellipse(460, 232, 134, 134, 0, 0, Math.PI * 2);
  g.fillStyle = "#e2e6cf";
  g.fill();
  g.lineWidth = 5;
  g.strokeStyle = "#1c4129";
  g.stroke();
  g.clip();
  drawEngravedFox(g, 460, 238, 1.05);
  g.restore();

  // corner "100" numerals
  const draw100 = (x: number, y: number, col = "#193a24") => {
    g.font = "900 54px Georgia, serif";
    g.textAlign = "center";
    g.lineWidth = 6;
    g.strokeStyle = "#eef2df";
    g.strokeText("100", x, y);
    g.fillStyle = col;
    g.fillText("100", x, y);
  };
  draw100(118, 92);
  draw100(904, 92);
  draw100(118, 384);

  // left Federal Puh seal + serial
  g.strokeStyle = "#1d3d28";
  g.lineWidth = 4;
  g.beginPath();
  g.arc(178, 224, 48, 0, Math.PI * 2);
  g.stroke();
  g.font = "bold 12px Arial, sans-serif";
  g.fillStyle = "#1d3d28";
  g.textAlign = "center";
  g.fillText("POCKET PUH", 178, 218);
  g.fillText("TREASURY", 178, 234);

  g.font = "bold 22px 'Courier New', monospace";
  g.fillStyle = "#1b6b38";
  g.textAlign = "left";
  g.fillText("PP 10042069 A", 104, 146);
  g.fillText("PP 10042069 A", 708, 146);

  // right side microtext + Treasury seal
  g.strokeStyle = "#2b7a48";
  g.lineWidth = 3;
  g.beginPath();
  g.arc(715, 250, 34, 0, Math.PI * 2);
  g.stroke();
  g.font = "bold 11px Arial, sans-serif";
  g.fillStyle = "#1c4129";
  g.textAlign = "center";
  g.fillText("SERIES 2026", 715, 254);
  g.font = "bold 16px Georgia, serif";
  g.fillText("ONE HUNDRED PUH", 715, 396);
};

const drawFrontBump = (g: CanvasRenderingContext2D) => {
  g.fillStyle = "#404040";
  g.fillRect(0, 0, 1024, 440);
  g.strokeStyle = "#ffffff";
  g.lineWidth = 12;
  g.strokeRect(24, 22, 976, 396);
  g.fillStyle = "#ffffff";
  g.font = "900 26px Georgia, serif";
  g.textAlign = "center";
  g.fillText("THE UNITED STATES OF POCKET PUH", 512, 74);
  // raised shoulder intaglio hatching
  g.strokeStyle = "#e8e8e8";
  g.lineWidth = 4;
  for (let i = -8; i <= 8; i++) {
    g.beginPath();
    g.moveTo(460 + i * 11, 290);
    g.lineTo(460 + i * 14, 360);
    g.stroke();
  }
  g.font = "900 54px Georgia, serif";
  g.fillText("100", 118, 92);
  g.fillText("100", 904, 92);
  g.fillText("100", 118, 384);
};

const drawBackTex = (g: CanvasRenderingContext2D) => {
  g.fillStyle = "#cbd6bc";
  g.fillRect(0, 0, 1024, 440);
  g.strokeStyle = "#1c4129";
  g.lineWidth = 14;
  g.strokeRect(24, 22, 976, 396);
  g.strokeStyle = "#2b593c";
  g.lineWidth = 4;
  g.strokeRect(42, 40, 940, 360);

  // stylized cartoon Pocket Puh Hall
  g.fillStyle = "#486b51";
  g.fillRect(300, 195, 424, 130);
  g.fillStyle = "#234a31";
  g.fillRect(465, 110, 94, 85);
  g.beginPath();
  g.moveTo(455, 110);
  g.lineTo(512, 66);
  g.lineTo(569, 110);
  g.closePath();
  g.fill();
  g.fillStyle = "#d9e3ca";
  for (let i = 0; i < 6; i++) {
    g.fillRect(326 + i * 64, 220, 30, 50);
  }

  g.fillStyle = "#183b25";
  g.font = "900 28px Georgia, serif";
  g.textAlign = "center";
  g.fillText("THE UNITED STATES OF POCKET PUH", 512, 74);
  g.font = "bold 20px Georgia, serif";
  g.fillText("IN PUH WE TRUST", 512, 368);
  g.font = "900 66px Georgia, serif";
  g.fillText("100", 125, 102);
  g.fillText("100", 899, 102);
  g.fillText("100", 125, 382);
  g.fillText("100", 899, 382);
};

const drawFakeTex = (g: CanvasRenderingContext2D) => {
  // bright white printer paper with sloppy margins
  g.fillStyle = "#f9fafc";
  g.fillRect(0, 0, 512, 220);
  // crooked bright lime box
  g.save();
  g.translate(256, 110);
  g.rotate(0.03);
  g.fillStyle = "#d4f5b8";
  g.fillRect(-218, -86, 436, 172);
  g.strokeStyle = "#26a83a";
  g.lineWidth = 6;
  g.strokeRect(-218, -86, 436, 172);
  // inkjet cyan/magenta streak
  g.fillStyle = "rgba(0, 200, 255, 0.22)";
  g.fillRect(-218, -12, 436, 7);
  g.fillStyle = "rgba(255, 0, 140, 0.16)";
  g.fillRect(-218, 28, 436, 5);
  // crude Sharpie fox doodle
  g.fillStyle = "#ff8524";
  g.beginPath();
  g.arc(0, 6, 36, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = "#111";
  g.lineWidth = 4;
  g.stroke();
  g.beginPath();
  g.moveTo(-28, -18);
  g.lineTo(-38, -50);
  g.lineTo(-8, -26);
  g.moveTo(28, -18);
  g.lineTo(38, -50);
  g.lineTo(8, -26);
  g.stroke();
  g.fillStyle = "#111";
  g.beginPath();
  g.arc(-12, 0, 5, 0, Math.PI * 2);
  g.arc(12, 0, 5, 0, Math.PI * 2);
  g.fill();
  g.beginPath();
  g.arc(0, 14, 14, 0, Math.PI);
  g.stroke();

  g.fillStyle = "#136e22";
  g.font = "900 32px Arial, sans-serif";
  g.textAlign = "center";
  g.fillText("$100", -155, -36);
  g.fillText("$100", 155, 58);
  g.font = "900 18px 'Comic Sans MS', Arial, sans-serif";
  g.fillText("TOTALLY REAL POCKET CASH", 0, -56);
  g.restore();
};

const drawBleached5Tex = (g: CanvasRenderingContext2D, r: () => number) => {
  // slightly faded cotton sheet with faint bleached "$5" ghosts beneath crude "100" overprint
  g.fillStyle = "#e6e7dc";
  g.fillRect(0, 0, 1024, 440);
  for (let i = 0; i < 300; i++) {
    const x = r() * 1024;
    const y = r() * 440;
    g.strokeStyle = i % 2 ? "rgba(200,50,60,0.35)" : "rgba(40,80,180,0.35)";
    g.lineWidth = 1.2;
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x + 7, y + 3);
    g.stroke();
  }
  // ghost $5 hints
  g.fillStyle = "rgba(165, 130, 140, 0.25)";
  g.font = "900 84px Georgia, serif";
  g.fillText("5", 90, 110);
  g.fillText("5", 870, 390);
  // reprinted 100 overprint (slightly washed)
  g.strokeStyle = "#3b6b4b";
  g.lineWidth = 9;
  g.strokeRect(28, 26, 968, 388);
  g.fillStyle = "#2d593c";
  g.font = "900 24px Georgia, serif";
  g.textAlign = "center";
  g.fillText("THE UNITED STATES OF POCKET PUH", 512, 74);
  g.save();
  g.globalAlpha = 0.85;
  drawEngravedFox(g, 460, 238, 1.0, "#345940", "#cf854e");
  g.restore();
  g.font = "900 54px Georgia, serif";
  g.fillStyle = "#2d593c";
  g.fillText("100", 118, 92);
  g.fillText("100", 904, 92);
  g.fillText("100", 904, 384);
};

const drawColonialTex = (g: CanvasRenderingContext2D, fixed: boolean, r: () => number) => {
  g.fillStyle = "#dfd0ad";
  g.fillRect(0, 0, 768, 440);
  for (let i = 0; i < 450; i++) {
    g.fillStyle = r() < 0.5 ? "rgba(95,70,35,0.08)" : "rgba(255,245,220,0.09)";
    g.fillRect(r() * 768, r() * 440, 6 + r() * 24, 3 + r() * 12);
  }
  g.strokeStyle = "#2b2013";
  g.lineWidth = 10;
  g.strokeRect(22, 22, 724, 396);
  g.lineWidth = 3;
  g.strokeRect(38, 38, 692, 364);

  // Botanical nature-printed leaf on right side
  g.save();
  g.translate(605, 228);
  g.rotate(-0.22);
  g.fillStyle = "#3e4628";
  g.beginPath();
  g.moveTo(0, -110);
  g.quadraticCurveTo(68, -30, 50, 75);
  g.quadraticCurveTo(0, 105, 0, 105);
  g.quadraticCurveTo(-50, 75, -50, 75);
  g.quadraticCurveTo(-68, -30, 0, -110);
  g.fill();
  g.strokeStyle = "#dfd0ad";
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(0, -98);
  g.lineTo(0, 118);
  for (let k = -65; k <= 55; k += 26) {
    g.moveTo(0, k);
    g.lineTo(-34, k - 22);
    g.moveTo(0, k + 10);
    g.lineTo(34, k - 12);
  }
  g.stroke();
  g.restore();

  g.fillStyle = "#21170c";
  g.textAlign = "center";
  g.font = "900 30px Georgia, serif";
  g.fillText("TWENTY SHILLINGS · 1739", 295, 110);
  g.font = "bold 22px Georgia, serif";
  g.fillText("PROVINCE OF", 295, 170);
  g.font = "900 44px Georgia, serif";
  g.fillStyle = fixed ? "#7c1814" : "#1c3318";
  g.fillText(fixed ? "PENNSYLVANIA" : "PENNSILVANIA", 295, 232);
  g.fillStyle = "#21170c";
  g.font = "bold 20px Georgia, serif";
  g.fillText("To Counterfeit is DEATH", 295, 315);
  g.font = "bold 17px Georgia, serif";
  g.fillText("Printed by B. FRANKLIN", 295, 355);
};

const drawWatermarkTex = (kind: "fox" | "five") =>
  makeTex(`wm-${kind}`, 256, 256, (g) => {
    g.clearRect(0, 0, 256, 256);
    if (kind === "fox") {
      g.globalAlpha = 0.85;
      drawEngravedFox(g, 128, 134, 0.78, "#fff7df", "#ffdca8");
    } else {
      g.fillStyle = "rgba(190, 235, 255, 0.92)";
      g.font = "900 130px Georgia, serif";
      g.textAlign = "center";
      g.fillText("5", 128, 174);
      // stovepipe hat silhouette next to the 5
      g.fillRect(150, 56, 54, 48);
      g.fillRect(138, 102, 78, 9);
    }
  });

const drawThreadTex = (label: string, fg: string, bg: string) =>
  makeTex(`thread-${label}-${fg}`, 64, 512, (g) => {
    g.fillStyle = bg;
    g.fillRect(0, 0, 64, 512);
    g.save();
    g.fillStyle = fg;
    g.font = "900 22px Arial, sans-serif";
    g.textAlign = "center";
    for (let y = 48; y < 500; y += 92) {
      g.save();
      g.translate(32, y);
      g.rotate(-Math.PI / 2);
      g.fillText(label, 0, 8);
      g.restore();
    }
    g.restore();
  });

const drawRibbonSymbolTex = (kind: "bell" | "100") =>
  makeTex(`ribbon-sym-${kind}`, 64, 64, (g) => {
    g.clearRect(0, 0, 64, 64);
    if (kind === "bell") {
      g.fillStyle = "#a5e8ff";
      g.beginPath();
      g.moveTo(14, 48);
      g.lineTo(18, 22);
      g.arc(32, 22, 14, Math.PI, 0);
      g.lineTo(50, 48);
      g.closePath();
      g.fill();
      g.fillRect(10, 48, 44, 7);
      g.beginPath();
      g.arc(32, 57, 5, 0, Math.PI * 2);
      g.fill();
    } else {
      g.fillStyle = "#e8f8ff";
      g.font = "900 26px Arial, sans-serif";
      g.textAlign = "center";
      g.fillText("100", 32, 41);
    }
  });

const drawInkwellTex = () =>
  makeTex("inkwell-bell-v1", 128, 128, (g) => {
    g.clearRect(0, 0, 128, 128);
    // copper inkwell body silhouette
    g.fillStyle = "#c97a34";
    g.beginPath();
    g.roundRect(22, 34, 84, 78, 14);
    g.fill();
    g.fillStyle = "#9c561b";
    g.beginPath();
    g.roundRect(36, 18, 56, 20, 6);
    g.fill();
    g.strokeStyle = "#522b09";
    g.lineWidth = 4;
    g.strokeRect(24, 36, 80, 74);
  });

const drawColorShiftMask = (kind: "bell" | "100") =>
  makeTex(`cs-mask-${kind}`, 128, 96, (g) => {
    g.clearRect(0, 0, 128, 96);
    g.fillStyle = "#ffffff";
    if (kind === "bell") {
      g.beginPath();
      g.moveTo(34, 72);
      g.lineTo(42, 34);
      g.arc(64, 34, 22, Math.PI, 0);
      g.lineTo(94, 72);
      g.closePath();
      g.fill();
      g.fillRect(28, 72, 72, 10);
      g.beginPath();
      g.arc(64, 86, 7, 0, Math.PI * 2);
      g.fill();
    } else {
      g.font = "900 62px Georgia, serif";
      g.textAlign = "center";
      g.fillText("100", 64, 70);
    }
  });

// Half-bill plane geometries for crisp 3D folding along x=0
const halfGeoCache = new Map<number, THREE.PlaneGeometry>();
const halfBillGeo = (side: -1 | 1) => {
  if (halfGeoCache.has(side)) return halfGeoCache.get(side)!;
  const g = new THREE.PlaneGeometry(BILL_W / 2, BILL_H);
  g.translate(side * (BILL_W / 4), 0, 0);
  const uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) {
    const u = uv.getX(i);
    uv.setX(i, side < 0 ? u * 0.5 : 0.5 + u * 0.5);
  }
  halfGeoCache.set(side, g);
  return g;
};

// ───────────────────────── PuhBill (hero banknote) ─────────────────────────
export type PuhBillProps = {
  p?: V3;
  rot?: V3;
  scale?: number;
  tiltX?: number;
  tiltY?: number;
  uv?: number;
  watermark?: number;
  eurion?: number;
  ribbon?: boolean;
  ribbonPhase?: number;
  colorShift?: number;
  raised?: number;
  penMark?: "none" | "yellow" | "black";
  penProg?: number;
  fold?: number;
};

export const PuhBill: React.FC<PuhBillProps> = ({
  p = [0, 0, 0],
  rot = [0, 0, 0],
  scale = 1,
  tiltX = 0,
  tiltY = 0,
  uv = 0,
  watermark = 0,
  eurion = 0,
  ribbon = true,
  ribbonPhase = 0,
  colorShift = 0,
  raised = 0,
  penMark = "none",
  penProg = 1,
  fold = 0,
}) => {
  const frontTex = useMemo(() => makeTex("puh-front-v2", 1024, 440, drawFrontTex), []);
  const bumpTex = useMemo(() => makeTex("puh-bump-v1", 1024, 440, (g) => drawFrontBump(g), false), []);
  const backTex = useMemo(() => makeTex("puh-back-v1", 1024, 440, (g) => drawBackTex(g)), []);
  const wmTex = useMemo(() => drawWatermarkTex("fox"), []);
  const threadTex = useMemo(() => drawThreadTex("USA 100", "#ffd5ef", "#ff2ea6"), []);
  const bellSym = useMemo(() => drawRibbonSymbolTex("bell"), []);
  const hundredSym = useMemo(() => drawRibbonSymbolTex("100"), []);
  const inkwellTex = useMemo(() => drawInkwellTex(), []);
  const bellMaskTex = useMemo(() => drawColorShiftMask("bell"), []);
  const cs100Tex = useMemo(() => drawColorShiftMask("100"), []);

  // Color-shifting ink: warm copper (#c97a34) → emerald green (#24c46a)
  const inkColor = useMemo(() => {
    const c = new THREE.Color("#c97a34");
    c.lerp(new THREE.Color("#24c46a"), Math.min(1, Math.max(0, colorShift)));
    return `#${c.getHexString()}`;
  }, [colorShift]);

  const penColor = penMark === "black" ? "#1b1614" : "#e8c838";
  const showPen = penMark !== "none" && penProg > 0.01;
  const rx = rot[0] + tiltX;
  const ry = rot[1] + tiltY;

  if (fold > 0.002) {
    const a = fold * Math.PI * 0.48;
    return (
      <group position={p} rotation={[rx, ry, rot[2]]} scale={scale}>
        <group rotation={[0, a, 0]}>
          <mesh geometry={halfBillGeo(-1)} castShadow receiveShadow>
            <meshStandardMaterial map={frontTex} bumpMap={bumpTex} bumpScale={0.018} roughness={0.82} />
          </mesh>
          <mesh geometry={halfBillGeo(-1)} position={[0, 0, -0.004]} rotation={[0, Math.PI, 0]} scale={[-1, 1, 1]}>
            <meshStandardMaterial map={backTex} roughness={0.85} side={THREE.DoubleSide} />
          </mesh>
        </group>
        <group rotation={[0, -a, 0]}>
          <mesh geometry={halfBillGeo(1)} castShadow receiveShadow>
            <meshStandardMaterial map={frontTex} bumpMap={bumpTex} bumpScale={0.018} roughness={0.82} />
          </mesh>
          <mesh geometry={halfBillGeo(1)} position={[0, 0, -0.004]} rotation={[0, Math.PI, 0]} scale={[-1, 1, 1]}>
            <meshStandardMaterial map={backTex} roughness={0.85} side={THREE.DoubleSide} />
          </mesh>
        </group>
      </group>
    );
  }

  // Ribbon shifting coordinates driven smoothly by tilt + phase
  const shiftY = (ribbonPhase + tiltX * 0.6) % 1;
  const shiftX = Math.sin(ribbonPhase * 2 + tiltY * 2.5) * 0.018;

  return (
    <group position={p} rotation={[rx, ry, rot[2]]} scale={scale}>
      {/* Core cotton-linen card body */}
      <mesh position={[0, 0, BILL_THICK / 2]} castShadow receiveShadow>
        <planeGeometry args={[BILL_W, BILL_H]} />
        <meshStandardMaterial map={frontTex} bumpMap={bumpTex} bumpScale={0.018 + raised * 0.03} roughness={0.82} />
      </mesh>
      <mesh position={[0, 0, -BILL_THICK / 2]} rotation={[0, Math.PI, 0]} castShadow receiveShadow>
        <planeGeometry args={[BILL_W, BILL_H]} />
        <meshStandardMaterial map={backTex} roughness={0.85} />
      </mesh>

      {/* UV Pink Security Thread (embedded left of portrait) */}
      <mesh position={[-0.31, 0, BILL_THICK / 2 + 0.004]}>
        <planeGeometry args={[0.026, BILL_H * 0.92]} />
        <meshStandardMaterial
          map={threadTex}
          color="#ff6ac1"
          emissive="#ff2ea6"
          emissiveIntensity={3.2 * uv}
          transparent
          opacity={0.14 + 0.86 * uv}
          roughness={0.3}
        />
      </mesh>

      {/* Backlit Fox Watermark Oval on right side */}
      <mesh position={[0.42, 0.01, BILL_THICK / 2 + 0.0045]}>
        <planeGeometry args={[0.25, 0.25]} />
        <meshStandardMaterial
          map={wmTex}
          color="#fff4d6"
          emissive="#ffe7ad"
          emissiveIntensity={1.6 * watermark}
          transparent
          opacity={0.04 + 0.88 * watermark}
          depthWrite={false}
        />
      </mesh>

      {/* Woven Blue 3D Security Ribbon (clears the top title cleanly) */}
      {ribbon ? (
        <group position={[0.205, -0.025, BILL_THICK / 2 + 0.005]}>
          <mesh>
            <planeGeometry args={[0.068, BILL_H * 0.72]} />
            <meshStandardMaterial color="#1f58a8" metalness={0.35} roughness={0.28} />
          </mesh>
          {/* Moving micro-lens bells & 100s clipped inside ribbon segments */}
          {[-0.18, -0.09, 0, 0.09, 0.18].map((baseY, idx) => {
            const wy = ((((baseY + shiftY * 0.18 + 0.25) % 0.5) + 0.5) % 0.5) - 0.25;
            const visible = Math.abs(wy) < 0.21;
            if (!visible) return null;
            return (
              <mesh key={idx} position={[shiftX, wy, 0.002]}>
                <planeGeometry args={[0.038, 0.038]} />
                <meshStandardMaterial map={idx % 2 === 0 ? bellSym : hundredSym} transparent opacity={0.95} emissive="#9be7ff" emissiveIntensity={0.45} />
              </mesh>
            );
          })}
          {/* Paper weave bridges overlapping the ribbon */}
          {[-0.14, 0.05].map((y) => (
            <mesh key={y} position={[0, y, 0.004]}>
              <planeGeometry args={[0.078, 0.032]} />
              <meshStandardMaterial color="#cfd7bf" roughness={0.86} />
            </mesh>
          ))}
        </group>
      ) : null}

      {/* Color-shifting Copper → Green Bell in the Inkwell + Corner 100 */}
      <group position={[0.33, -0.085, BILL_THICK / 2 + 0.006]}>
        <mesh>
          <planeGeometry args={[0.13, 0.13]} />
          <meshStandardMaterial map={inkwellTex} transparent roughness={0.32} metalness={0.55} />
        </mesh>
        <mesh position={[0, -0.008, 0.003]}>
          <planeGeometry args={[0.076, 0.058]} />
          <meshStandardMaterial map={bellMaskTex} color={inkColor} transparent metalness={0.78} roughness={0.22} emissive={inkColor} emissiveIntensity={0.2 + 0.3 * colorShift} />
        </mesh>
      </group>
      <mesh position={[0.585, -0.215, BILL_THICK / 2 + 0.006]}>
        <planeGeometry args={[0.19, 0.13]} />
        <meshStandardMaterial map={cs100Tex} color={inkColor} transparent metalness={0.78} roughness={0.24} emissive={inkColor} emissiveIntensity={0.18 + 0.25 * colorShift} />
      </mesh>

      {/* Raised Intaglio tactile shoulder highlight ridges (subtle curved lapel hatching) */}
      {raised > 0.02 ? (
        <group position={[-0.08, -0.175, BILL_THICK / 2 + 0.0068]}>
          {[-1, 1].map((side) =>
            [0, 1, 2, 3].map((k) => (
              <mesh key={`${side}-${k}`} position={[side * (0.045 + k * 0.016), 0.005 - k * 0.008, 0]} rotation={[0, 0, side * 0.65]}>
                <boxGeometry args={[0.004, 0.055, 0.003 * raised]} />
                <meshStandardMaterial color="#2a593b" roughness={0.42} metalness={0.25} />
              </mesh>
            )),
          )}
        </group>
      ) : null}

      {/* EURion Scanner Ring Highlights */}
      {eurion > 0.02
        ? EURION_CLUSTERS.map(([cx, cy], ci) =>
            EURION_OFFSETS.map(([dx, dy], oi) => (
              <mesh key={`${ci}-${oi}`} position={[(cx + dx - 0.5) * BILL_W, (0.5 - (cy + dy)) * BILL_H, BILL_THICK / 2 + 0.008]}>
                <ringGeometry args={[0.015, 0.023, 24]} />
                <meshBasicMaterial color="#ffe135" transparent opacity={eurion} toneMapped={false} />
              </mesh>
            )),
          )
        : null}

      {/* Iodine Counterfeit Pen Mark (on left blank margin, clear of portrait face) */}
      {showPen ? (
        <mesh position={[-0.48 + 0.14 * penProg, -0.02 - 0.06 * penProg, BILL_THICK / 2 + 0.009]} rotation={[0, 0, -0.45]}>
          <planeGeometry args={[0.34 * penProg, 0.042]} />
          <meshStandardMaterial color={penColor} transparent opacity={0.88} roughness={0.65} />
        </mesh>
      ) : null}
    </group>
  );
};

// ───────────────────────── FakeBill (cheap home-printed paper) ─────────────────────────
export const FakeBill: React.FC<{
  p?: V3;
  rot?: V3;
  scale?: number;
  penMark?: "none" | "black";
  penProg?: number;
  mush?: number;
}> = ({ p = [0, 0, 0], rot = [0, 0, 0], scale = 1, penMark = "none", penProg = 1, mush = 0 }) => {
  const fakeTex = useMemo(() => makeTex("fake-puh-v1", 512, 220, (g) => drawFakeTex(g)), []);
  const s = Math.max(0.05, 1 - 0.75 * mush);
  if (mush > 0.78) {
    // Disintegrated wet wood-pulp mush blobs
    return (
      <group position={p} scale={scale}>
        {[
          [-0.14, 0.02, 0.05],
          [0.06, -0.04, -0.04],
          [0.16, 0.05, 0.03],
          [-0.04, 0.06, 0.02],
        ].map(([x, y, z], i) => (
          <mesh key={i} position={[x, y, z]} scale={[1.4, 0.8, 1.1]} castShadow>
            <dodecahedronGeometry args={[0.075, 0]} />
            <meshStandardMaterial color="#cfd4d6" roughness={0.95} />
          </mesh>
        ))}
      </group>
    );
  }
  return (
    <group position={p} rotation={[rot[0] + mush * 0.7, rot[1] + mush * 0.4, rot[2] - mush * 0.6]} scale={[scale * s, scale * (1 - 0.45 * mush), scale]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[BILL_W, BILL_H, 0.004]} />
        <meshStandardMaterial map={fakeTex} roughness={0.72} color={mush > 0.2 ? "#d5dad8" : "#ffffff"} />
      </mesh>
      {penMark === "black" && penProg > 0.01 ? (
        <mesh position={[-0.36 + 0.28 * penProg, 0.08 - 0.09 * penProg, 0.007]} rotation={[0, 0, -0.32]}>
          <planeGeometry args={[0.62 * penProg, 0.05]} />
          <meshStandardMaterial color="#181412" transparent opacity={0.92} roughness={0.7} />
        </mesh>
      ) : null}
    </group>
  );
};

// ───────────────────────── BleachedFiveBill ─────────────────────────
export const BleachedFiveBill: React.FC<{
  p?: V3;
  rot?: V3;
  scale?: number;
  uv?: number;
  watermark?: number;
  penMark?: "none" | "yellow";
  penProg?: number;
}> = ({ p = [0, 0, 0], rot = [0, 0, 0], scale = 1, uv = 0, watermark = 0, penMark = "none", penProg = 1 }) => {
  const tex5 = useMemo(() => makeTex("bleached-5-v1", 1024, 440, drawBleached5Tex), []);
  const thread5 = useMemo(() => drawThreadTex("USA 5", "#dbf4ff", "#1ea7ff"), []);
  const wm5 = useMemo(() => drawWatermarkTex("five"), []);

  return (
    <group position={p} rotation={rot} scale={scale}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[BILL_W, BILL_H, 0.004]} />
        <meshStandardMaterial map={tex5} roughness={0.82} />
      </mesh>
      {/* $5 Blue UV Thread (different spot than $100!) */}
      <mesh position={[0.28, 0, 0.0065]}>
        <planeGeometry args={[0.026, BILL_H * 0.92]} />
        <meshStandardMaterial
          map={thread5}
          color="#4cc4ff"
          emissive="#1ea7ff"
          emissiveIntensity={3.4 * uv}
          transparent
          opacity={0.14 + 0.86 * uv}
          roughness={0.3}
        />
      </mesh>
      {/* Hidden 5 + Lincoln hat watermark */}
      <mesh position={[0.45, 0.01, 0.007]}>
        <planeGeometry args={[0.25, 0.25]} />
        <meshStandardMaterial
          map={wm5}
          color="#a8e4ff"
          emissive="#45bfff"
          emissiveIntensity={1.6 * watermark}
          transparent
          opacity={0.04 + 0.9 * watermark}
          depthWrite={false}
        />
      </mesh>
      {/* Passes iodine pen (yellow mark on left margin) */}
      {penMark === "yellow" && penProg > 0.01 ? (
        <mesh position={[-0.48 + 0.14 * penProg, -0.02 - 0.06 * penProg, 0.0085]} rotation={[0, 0, -0.45]}>
          <planeGeometry args={[0.34 * penProg, 0.042]} />
          <meshStandardMaterial color="#e8c838" transparent opacity={0.88} roughness={0.65} />
        </mesh>
      ) : null}
    </group>
  );
};

// ───────────────────────── ColonialBill (1739 Franklin) ─────────────────────────
export const ColonialBill: React.FC<{ p?: V3; rot?: V3; scale?: number; fixed?: boolean; highlight?: number }> = ({
  p = [0, 0, 0],
  rot = [0, 0, 0],
  scale = 1,
  fixed = false,
  highlight = 0,
}) => {
  const tex = useMemo(() => makeTex(fixed ? "col-fixed" : "col-real", 768, 440, (g, r) => drawColonialTex(g, fixed, r)), [fixed]);
  return (
    <group position={p} rotation={rot} scale={scale}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.3, 0.74, 0.006]} />
        <meshStandardMaterial map={tex} roughness={0.92} />
      </mesh>
      {highlight > 0.02 ? (
        <mesh position={[-0.08, -0.02, 0.009]}>
          <ringGeometry args={[fixed ? 0.055 : 0.28, fixed ? 0.072 : 0.305, 32]} />
          <meshBasicMaterial color={fixed ? "#ff3b30" : "#34c759"} transparent opacity={highlight} toneMapped={false} />
        </mesh>
      ) : null}
    </group>
  );
};
