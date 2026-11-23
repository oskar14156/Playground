import words from "../../../public/carrier/words.json";
import { makeCues } from "../../lib/timing";

export { words };
export const cue = makeCues(words, 30);
export const DURATION = Math.min(2660, cue.voiceEnd + 46);

export const c = {
  hook: 0,
  floating: cue.at("floating steel"),
  t100k: cue.at("100,000"),
  m333: cue.at("333"),
  bigProb: cue.at("Big problem"),
  electromagnetic: cue.at("electromagnetic"),
  kph240: cue.at("240"),

  threeCables: cue.at("three thick"),
  turbines: cue.at("water turbines"),
  m90: cue.at("90 meters"),
  plotTwist: cue.at("Plot twist"),
  fullThrottle: cue.at("full throttle"),
  missAll: cue.at("miss all"),

  reactors: cue.at("two nuclear"),
  years25: cue.at("25 years"),

  congrats: cue.at("Congratulations"),
  carrier: cue.at("aircraft carrier"),
  follow: cue.at("Follow,"),
  because: cue.at("Because"),
  end: 0,
};
c.end = DURATION;
