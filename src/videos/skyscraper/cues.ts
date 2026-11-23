import words from "../../../public/skyscraper/words.json";
import { makeCues } from "../../lib/timing";

export { words };
export const cue = makeCues(words, 30);
export const DURATION = Math.min(2660, cue.voiceEnd + 46);

export const c = {
  // 1. HOOK
  hook: 0,
  taller: cue.at("taller"),
  peek: cue.at("peek"),

  // 2. FOUNDATION
  floors163: cue.at("163"),
  noBedrock: cue.at("no solid"),
  piles192: cue.at("192"),
  friction: cue.at("friction."),

  // 3. NIGHT ICE CONCRETE
  deg50: cue.at("50 degrees"),
  banDay: cue.at("ban daytime"),
  crushedIce: cue.at("crushed ice"),

  // 4. WIND VORTEX SHEDDING
  m828: cue.at("828"),
  guitar: cue.at("guitar"),
  gaslight: cue.at("gaslight"),
  giantY: cue.at("giant Y"),

  // 5. SPIRE SWAY
  tipSways: cue.at("tip still sways"),

  // 6. ELEVATORS & WINDOWS
  elevators: cue.at("double deck"),
  speed36: cue.at("36 kilometers"),
  glass24k: cue.at("24,000"),
  threeMonths: cue.at("3 full"),
  topDirty: cue.at("top is dirty"),

  // 7. PAYOFF & FOLLOW LOOP
  congrats: cue.at("Congratulations."),
  burjKhalifa: cue.at("Burj Khalifa"),
  follow: cue.at("Follow,"),
  because: cue.at("Because"),
  end: 0,
};
c.end = DURATION;
