import words from "../../../public/volcano/words.json";
import { makeCues } from "../../lib/timing";

export { words };
export const cue = makeCues(words, 30);
export const DURATION = cue.voiceEnd + 12;

// Every storyboard cue, resolved from the spoken words (storyboard.md → Beats).
export const c = {
  slowest: cue.at("slowest lava"),
  hawaii: cue.at("In Hawaii"),
  deg: cue.at("1,100"),
  creep: cue.at("Some flows"),
  m50: cue.at("50 meters"),
  walk: cue.at("You could walk"),
  so: cue.at("So why did"),
  apart: cue.at("itself apart"),
  every: cue.at("Every magma"),
  soda: cue.at("shaken soda"),
  runny: cue.at("In runny magma"),
  slip: cue.at("slip out"),
  sticky: cue.at("In sticky magma"),
  trapped: cue.at("trapped"),
  pressure: cue.at("The pressure keeps"),
  y1980: cue.at("In 1980"),
  north: cue.at("north side"),
  slid: cue.at("slid away"),
  burst: cue.at("burst out"),
  blast: cue.at("The blast flattened"),
  km30: cue.at("30 kilometers"),
  lost: cue.at("The mountain lost"),
  m400: cue.at("400 meters"),
  eiffel: cue.at("Eiffel Tower"),
  danger: cue.at("So the danger"),
  which: cue.at("Which is why"),
  end: DURATION,
};
