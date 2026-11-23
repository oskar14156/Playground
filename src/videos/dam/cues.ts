import words from "../../../public/dam/words.json";
import { makeCues } from "../../lib/timing";

export { words };
export const cue = makeCues(words, 30);
export const DURATION = Math.min(2660, cue.voiceEnd + 46);

export const c = {
  hook: 0,
  backyardPool: cue.at("backyard pool"),
  flooded: cue.at("flooded"),

  wetConcrete: cue.at("wet concrete"),
  fourTunnels: cue.at("four giant"),
  m17: cue.at("17 meters"),
  reroute: cue.at("reroute"),

  tall221: cue.at("221 meters"),
  snapLike: cue.at("snap like"),
  giantArch: cue.at("giant arch"),
  base200: cue.at("200 meters"),

  yrs125: cue.at("125 years"),
  legoBlocks: cue.at("Lego blocks"),
  pipes930: cue.at("930 kilometers"),
  iceWater: cue.at("ice cold water"),
  grout: cue.at("cement grout"),

  turbines17: cue.at("17 giant"),
  mw2000: cue.at("2,000"),
  congrats: cue.at("Congratulations"),
  hooverDam: cue.at("Hoover Dam"),
  follow: cue.at("Follow,"),
  because: cue.at("Because"),
  end: 0,
};
c.end = DURATION;
