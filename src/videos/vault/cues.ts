import words from "../../../public/vault/words.json";
import { makeCues } from "../../lib/timing";

export { words };
export const cue = makeCues(words, 30);
export const DURATION = Math.min(2660, cue.voiceEnd + 46);

export const c = {
  hook: 0,
  stole: cue.at("finally stole"),
  safest: cue.at("safest vault"),

  yards4200: cue.at("4,200"),
  steel750: cue.at("750"),
  meterThick: cue.at("meter thick"),

  blastDoor: cue.at("blast proof"),
  tons20: cue.at("20 tons"),
  splitCode: cue.at("split the combination"),
  people10: cue.at("10 different"),

  cityPower: cue.at("city power"),
  ownPower: cue.at("emergency power"),
  armyBase: cue.at("army base"),

  gold4500: cue.at("4,500"),
  tinyFlaw: cue.at("tiny flaw"),
  forgotWho: cue.at("forgot who"),

  congrats: cue.at("Congratulations"),
  fortKnox: cue.at("Fort Knox"),
  follow: cue.at("Follow,"),
  because: cue.at("Because"),
  end: 0,
};
c.end = DURATION;
