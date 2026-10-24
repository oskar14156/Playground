import words from "../../../public/black-box/words.json";
import { makeCues } from "../../lib/timing";

export { words };
export const cue = makeCues(words, 30);
export const DURATION = cue.voiceEnd + 10;

// Every storyboard cue, resolved from the spoken words (storyboard.md → Beats).
export const c = {
  black2: cue.at("black", 2),
  orange: cue.at("bright orange"),
  search: cue.at("search teams"),
  wreckage: cue.at("wreckage"),
  tail: cue.at("And they ride"),
  tailWord: cue.at("tail"),
  survive: cue.at("most likely"),
  armor: cue.at("But the orange"),
  armorWord: cue.at("armor"),
  chip: cue.at("The real recorder"),
  tests: cue.at("three tests"),
  first: cue.at("First"),
  g3400: cue.at("3,400"),
  fighter: cue.at("A fighter"),
  blacks: cue.at("blacks out"),
  fire: cue.at("Then fire"),
  deg: cue.at("1,100"),
  hour: cue.at("full hour"),
  ocean: cue.at("Then the ocean"),
  feet: cue.at("20,000"),
  underwater: cue.at("Underwater"),
  pings: cue.at("pings"),
  days: cue.at("90 days"),
  silent: cue.at("Then it goes"),
  so: cue.at("So the one"),
  found: cue.at("not being found"),
  which: cue.at("Which is why"),
  end: DURATION,
};
