import words from "../../../public/elevator/words.json";
import { makeCues } from "../../lib/timing";

export { words };
export const cue = makeCues(words, 30);
export const DURATION = cue.voiceEnd + 45; // hold the payoff shot

// Every storyboard cue, resolved from the spoken words (storyboard.md).
export const c = {
  friend: 0,
  stairs: cue.at("So you take the stairs"),
  corner: cue.at("doesn't fit"),
  box: cue.at("So you build a wooden box"),
  climb: cue.at("climb in"),
  heavy: cue.at("are heavy"),
  counter: cue.at("So on the other end"),
  diff: cue.at("only pull the difference"),
  snaps: cue.at("But if the rope snaps"),
  fall: cue.at("you fall ten floors"),
  survive: cue.at("would survive"),
  wouldnt: cue.at("You wouldn't"),
  rails: cue.at("So you add rails"),
  slack: cue.at("goes slack"),
  y1854: cue.at("In 1854"),
  cut: cue.at("had the rope cut"),
  dropped: cue.at("It dropped"),
  stopped: cue.at("and stopped"),
  faster: cue.at("But going down"),
  wheel: cue.at("So you add a wheel"),
  spinsBox: cue.at("spins with the box"),
  swing: cue.at("weights swing out"),
  fire: cue.at("fire the same brakes"),
  several: cue.at("And instead of one rope"),
  eachOne: cue.at("Each one could hold"),
  door: cue.at("But your friend opens"),
  empty: cue.at("an empty shaft"),
  locked: cue.at("So every door stays locked"),
  there: cue.at("right there"),
  cantMove: cue.at("can't move"),
  shut: cue.at("every door is shut"),
  bottom: cue.at("And at the very bottom"),
  springs: cue.at("springs catch it"),
  safe: cue.at("Now it's safe"),
  hand: cue.at("by hand"),
  reactor: cue.at("So you add a nuclear reactor"),
  power: cue.at("to power the whole thing"),
  congrats: cue.at("Congratulations"),
  built: cue.at("You've built a box"),
  callIt: cue.at("You call it"),
  elevator: cue.at("the elevator", 1),
  end: DURATION,
};
