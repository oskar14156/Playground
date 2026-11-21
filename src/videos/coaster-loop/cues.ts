import words from "../../../public/coaster-loop/words.json";
import { makeCues } from "../../lib/timing";

export { words };
export const cue = makeCues(words, 30);
export const DURATION = cue.voiceEnd + 12;

// Every storyboard cue, resolved from the spoken words (storyboard.md → Beats).
export const c = {
  y1895: cue.at("In 1895"),
  round: cue.at("round one"),
  riders: cue.at("Riders came off"),
  injuries: cue.at("neck and back"),
  why: cue.at("Here's why"),
  top: cue.at("At the top"),
  fall: cue.at("not to fall"),
  bottom: cue.at("by the bottom"),
  more: cue.at("a lot more"),
  circle: cue.at("In a circle"),
  g6: cue.at("6 g"),
  six: cue.at("Six times"),
  matter: cue.at("No matter"),
  engineers: cue.at("So engineers"),
  teardrop: cue.at("teardrop"),
  wide: cue.at("Wide at the bottom"),
  tight: cue.at("Tight at the top"),
  y1976: cue.at("In 1976"),
  revolution: cue.at("the Revolution"),
  under5: cue.at("under 5"),
  look: cue.at("So look closely"),
  end: DURATION,
};
