import words from "../../../public/meteors/words.json";
import { makeCues } from "../../lib/timing";

export { words };
export const cue = makeCues(words, 30);
export const DURATION = cue.voiceEnd + 12;

// Every storyboard cue, resolved from the spoken words (storyboard.md → Beats).
export const c = {
  grain: cue.at("grain of sand"),
  these: cue.at("These ones"),
  comet: cue.at("Tempel-Tuttle"),
  november: cue.at("Every November"),
  drives: cue.at("drives straight"),
  each: cue.at("Each grain"),
  k70: cue.at("70 kilometers"),
  times70: cue.at("70 times"),
  bullet: cue.at("rifle bullet"),
  but: cue.at("But it doesn't"),
  friction: cue.at("friction"),
  air: cue.at("The air in front"),
  squeezed: cue.at("squeezed"),
  deg: cue.at("1,600"),
  km100: cue.at("100 kilometers"),
  head: cue.at("your head"),
  most: cue.at("Most nights"),
  y1966: cue.at("1966"),
  thousands: cue.at("thousands per minute"),
  leonids: cue.at("That's the Leonids"),
  peak: cue.at("peak on the night"),
  nov17: cue.at("November 17th"),
  look: cue.at("So look up"),
  end: DURATION,
};
