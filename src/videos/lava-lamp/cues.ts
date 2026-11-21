import words from "../../../public/lava-lamp/words.json";
import { makeCues } from "../../lib/timing";

export { words };
export const cue = makeCues(words, 30);
export const DURATION = cue.voiceEnd + 14;

// Every storyboard cue, resolved from the spoken words (storyboard.md).
export const c = {
  wall: 0,
  lobby: cue.at("It's in Cloudflare's"),
  camera: cue.at("a camera films"),
  every: cue.at("Every blob"),
  random: cue.at("becomes random numbers"),
  andRandom: cue.at("And random numbers"),
  guess: cue.at("to guess"),
  why: cue.at("But why"),
  inside: cue.at("Inside is"),
  weigh: cue.at("weigh almost"),
  bulb: cue.at("A bulb"),
  expands: cue.at("It expands"),
  lighter: cue.at("gets lighter"),
  rises: cue.at("and rises"),
  top: cue.at("At the top"),
  sinks: cue.at("sinks again"),
  trick: cue.at("Here's the trick"),
  floats: cue.at("floats on water"),
  recipe: cue.at("So the first recipe"),
  heavier: cue.at("heavier on purpose"),
  coil: cue.at("And a metal coil"),
  melt: cue.at("melt back together"),
  want: cue.at("Want one"),
  linked: cue.at("linked below"),
  hour: cue.at("Give it an hour"),
  because: cue.at("Because no two"),
  which: cue.at("Which is why"),
  end: DURATION,
};
