import words from "../../../public/titanic/words.json";
import { makeCues } from "../../lib/timing";

export { words };
export const cue = makeCues(words, 30);
export const DURATION = cue.voiceEnd + 12;

// Every storyboard cue, resolved from the spoken words (storyboard.md → Beats).
export const c = {
  piece: cue.at("one piece"),
  then: cue.at("Then in 1985"),
  y1985: cue.at("1985"),
  found: cue.at("found her"),
  depth: cue.at("3,800"),
  two: cue.at("two pieces"),
  apart: cue.at("600 meters apart"),
  so: cue.at("So what tears"),
  half: cue.at("in half"),
  iceberg: cue.at("The iceberg"),
  five: cue.at("5 of her"),
  sixteen: cue.at("16"),
  built: cue.at("She was built"),
  four: cue.at("4"),
  bow: cue.at("As the bow"),
  spilled: cue.at("spilled over"),
  next: cue.at("into the next"),
  stern: cue.at("The stern rose"),
  tons: cue.at("Thousands of tons"),
  hanging: cue.at("hanging in the air"),
  hull: cue.at("The hull bent"),
  ruler: cue.at("ruler"),
  snapped: cue.at("snapped"),
  not: cue.at("Not at the steep"),
  n45: cue.at("45"),
  wreck: cue.at("Wreck studies"),
  n15: cue.at("about 15"),
  survivors: cue.at("Survivors said"),
  sawBreak: cue.at("saw her break"),
  official: cue.at("The official inquiries"),
  them: cue.at("believe them"),
  truth: cue.at("So the truth"),
  which: cue.at("Which is why"),
  end: DURATION,
};
