import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadMontserrat } from "@remotion/google-fonts/Montserrat";
import { loadFont as loadBarlow } from "@remotion/google-fonts/BarlowCondensed";

const inter = loadInter("normal", { weights: ["400", "600", "800"], subsets: ["latin"] });
const montserrat = loadMontserrat("normal", { weights: ["700", "800", "900"], subsets: ["latin"] });
const barlow = loadBarlow("normal", { weights: ["600", "700"], subsets: ["latin"] });

export const fonts = {
  ui: inter.fontFamily, // karaoke captions, small labels
  punch: montserrat.fontFamily, // center punch captions, big numbers
  hud: barlow.fontFamily, // bracket readouts, technical labels
};

// Palettes lifted from the reference reels. Pick one per video and stay in it.
export const palettes = {
  // FedEx-style night explainer: navy, warm city glow, gold numbers, pink for "too many"
  night: {
    bgTop: "#0b1030",
    bgBottom: "#04050c",
    horizon: "#5a3d6e",
    text: "#ffffff",
    dim: "rgba(255,255,255,0.62)",
    accent: "#ffc65c",
    accent2: "#ff4f8b",
    glow: "#ffd9a0",
    line: "rgba(130,160,255,0.35)",
  },
  // Submarine / military explainer: deep blue-grey, orange hero, yellow keyword
  deep: {
    bgTop: "#0f1d2c",
    bgBottom: "#050a10",
    horizon: "#1d3346",
    text: "#ffffff",
    dim: "rgba(255,255,255,0.7)",
    accent: "#ffc531",
    accent2: "#ff6a2b",
    glow: "#ffe2a6",
    line: "rgba(255,255,255,0.25)",
  },
} as const;

export type Palette = (typeof palettes)[keyof typeof palettes];

export const VIDEO = { width: 1080, height: 1920, fps: 30 } as const;
