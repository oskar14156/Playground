import words from "../../../public/skyscraper/words.json";
import { makeCues } from "../../lib/timing";

export { words };
export const cue = makeCues(words, 30);
export const DURATION = Math.min(2660, cue.voiceEnd + 46);

export const c = {
  // 1. HOOK
  hook: 0,
  titanic: cue.at("Titanic,"),
  clouds: cue.at("clouds"),
  taller: cue.at("taller"),
  nextDoor: cue.at("next door"),
  peek: cue.at("peek"),

  // 2. FOUNDATION
  floors163: cue.at("163"),
  tons450: cue.at("450,000"),
  sand: cue.at("desert sand"),
  oneProblem: cue.at("One problem."),
  noBedrock: cue.at("no solid"),
  piles192: cue.at("192"),
  m50: cue.at("50 meters"),
  raft4m: cue.at("concrete raft"),
  hangs: cue.at("hangs"),
  friction: cue.at("friction."),

  // 3. NIGHT ICE CONCRETE
  deg50: cue.at("50 degrees"),
  cooks: cue.at("cooks"),
  banDay: cue.at("ban daytime"),
  crushedIce: cue.at("crushed ice"),
  pumpNight: cue.at("pump it"),

  // 4. WIND VORTEX SHEDDING
  m828: cue.at("828"),
  whirlpools: cue.at("whirlpools"),
  straightTower: cue.at("straight tower"),
  guitar: cue.at("guitar"),
  snaps: cue.at("snaps."),
  gaslight: cue.at("gaslight"),
  giantY: cue.at("giant Y"),
  setbacks27: cue.at("27"),
  everyFew: cue.at("Every few"),
  confused: cue.at("confused"),

  // 5. SPIRE SWAY
  tipSways: cue.at("tip still sways"),

  // 6. ELEVATORS & WINDOWS
  stairs: cue.at("Stairs"),
  elevators: cue.at("double deck"),
  speed36: cue.at("36 kilometers"),
  glass24k: cue.at("24,000"),
  threeMonths: cue.at("3 full"),
  bottomClean: cue.at("bottom window"),
  topDirty: cue.at("top is dirty"),
  startOver: cue.at("start right"),

  // 7. PAYOFF & FOLLOW LOOP
  congrats: cue.at("Congratulations."),
  spyGrandma: cue.at("spy on"),
  burjKhalifa: cue.at("Burj Khalifa"),
  follow: cue.at("Follow,"),
  because: cue.at("Because"),
  end: 0,
};
c.end = DURATION;
