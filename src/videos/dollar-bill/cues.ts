import words from "../../../public/dollar-bill/words.json";
import { makeCues } from "../../lib/timing";

export { words };
export const cue = makeCues(words, 30);
export const DURATION = Math.min(2685, cue.voiceEnd + 46); // < 90 s: friend dances in bill rain under FOLLOW pill, then loop dissolve

// Every storyboard cue, resolved directly from public/dollar-bill/words.json.
export const c = {
  hook: cue.at("Your friend wants"),
  usedPuh: cue.at("used pocket puh"),
  say100: cue.at("You say 100 dollars"),
  broke: cue.at("He's broke"),
  printsHome: cue.at("prints one at home"),
  cantFake: cue.at("a bill he can't fake"),

  paper: cue.at("Paper turns to mush"),
  mush: cue.at("mush in the wash"),
  cotton: cue.at("75 percent cotton"),
  linen: cue.at("25 percent linen"),
  jeans: cue.at("Basically jeans"),
  folds: cue.at("4,000 double folds"),

  cashiers: cue.at("Cashiers test it"),
  fakeBlack: cue.at("Fake paper turns black"),
  cottonYellow: cue.at("Cotton stays yellow"),
  bleaches: cue.at("So your friend bleaches"),
  prints100: cue.at("prints 100 on top"),
  passes: cue.at("It passes"),

  thread: cue.at("So you hide a thread"),
  watermark: cue.at("and a watermark"),
  uvLight: cue.at("Under UV light"),
  realPink: cue.at("glows pink"),
  hisBlue: cue.at("His bleached 5"),
  busted: cue.at("Busted"),

  scans: cue.at("So he scans one"),
  blocked: cue.at("Blocked"),
  dots: cue.at("secret dots"),
  copiers: cue.at("Copiers and Photoshop"),
  patched: cue.at("Infinite money glitch"),

  press: cue.at("So he buys a real press"),
  raised: cue.at("raised ink"),
  colorShift: cue.at("color shifting ink"),
  micro: cue.at("microprinting on the collar"),
  oursSays: cue.at("Ours says"),
  franklin: cue.at("Ben Franklin even"),
  fakersFixed: cue.at("Fakers fixed them"),

  ribbon: cue.at("Then you weave in"),
  lenses: cue.at("hundreds of thousands of lenses"),
  tilt: cue.at("Tilt it"),
  bells: cue.at("bells turn into hundreds"),

  wontStop: cue.at("He still won't stop"),
  police: cue.at("secret police force"),
  joke: cue.at("Sounds like a joke"),
  isnt: cue.at("It isn't"),
  y1865: cue.at("In 1865"),
  lincoln: cue.at("Lincoln approved"),
  y1901: cue.at("until 1901"),

  costs: cue.at("Costs 11 cents"),
  lasts24: cue.at("Lasts 24 years"),
  outside: cue.at("And 80 percent live"),

  grandma: cue.at("He finally borrows"),
  congrats: cue.at("Congratulations"),
  callIt: cue.at("You call it"),
  hundredDollar: cue.at("the hundred dollar bill"),
  follow: cue.at("Follow or I'll report"),
  secretEnd: cue.at("to the Secret Service"),
  end: 0,
};
c.end = DURATION;
