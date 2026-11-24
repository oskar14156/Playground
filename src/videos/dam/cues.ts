import words from "../../../public/dam/words.json";
import { makeCues } from "../../lib/timing";

export { words };
export const cue = makeCues(words, 30);
export const DURATION = Math.min(2660, cue.voiceEnd + 46);

export const c = {
  hook: 0,
  pool: cue.at("backyard pool"),
  puh: cue.at("pocket puh,"),
  accidentally: cue.at("and accidentally"),
  flooded: cue.at("flooded"),
  entire: cue.at("entire desert"),
  soBuild: cue.at("So you build a concrete"),
  stop: cue.at("stop the river"),

  first: cue.at("First problem"),
  wetConcrete: cue.at("wet concrete"),
  raging: cue.at("raging river sweeps"),
  sweeps: cue.at("sweeps your"),
  dynamite: cue.at("dynamite"),
  fourTunnels: cue.at("four giant"),
  m17: cue.at("17 meters"),
  straight: cue.at("straight through"),
  plug: cue.at("plug the river"),
  reroute: cue.at("reroute"),
  site: cue.at("construction site"),

  next: cue.at("Next,"),
  tall221: cue.at("221 meters"),
  but: cue.at("But a flat"),
  snapLike: cue.at("snap like"),
  cracker: cue.at("cracker"),
  soCurve: cue.at("So you curve"),
  giantArch: cue.at("giant arch"),
  base200: cue.at("200 meters"),
  top14: cue.at("14 meters"),
  harder: cue.at("The harder"),
  tighter: cue.at("the tighter"),
  wedges: cue.at("wedges"),
  cliffs: cue.at("canyon cliffs"),

  wait: cue.at("Wait."),
  pouring: cue.at("Pouring three"),
  lump: cue.at("one lump"),
  traps: cue.at("traps insane"),
  yrs125: cue.at("125 years"),
  shatter: cue.at("shatter"),
  soPour: cue.at("So you pour"),
  lego: cue.at("Lego blocks"),
  pipes930: cue.at("930 kilometers"),
  pump: cue.at("You pump"),
  fridge: cue.at("refrigeration plant"),
  everyPipe: cue.at("every pipe"),
  grout: cue.at("cement grout"),
  solid: cue.at("fuse it solid"),

  finally: cue.at("Finally,"),
  turbines17: cue.at("17 giant"),
  turning: cue.at("turning river"),
  mw2000: cue.at("2,000"),
  vegas: cue.at("Las Vegas"),
  congrats: cue.at("Congratulations"),
  justTo: cue.at("just to fix"),
  callIt: cue.at("You call it"),
  hooverDam: cue.at("Hoover Dam"),
  follow: cue.at("Follow,"),
  because: cue.at("Because"),
  end: 0,
};
c.end = DURATION;
