import words from "../../../public/zombie-outbreak/words.json";
import { makeCues } from "../../lib/timing";

export { words };
export const cue = makeCues(words, 30);
// no seamless loop: the episode ends on a question + "PART 2?" card
export const DURATION = cue.voiceEnd + 100;

// Every storyboard cue, resolved from the spoken words (storyboard.md → Beats).
export const c = {
  anchor: cue.at("when the anchor"),
  bread: cue.at("It started with bread"),
  flour: cue.at("bad batch"),
  hour: cue.at("Within an hour"),
  bite: cue.at("They bite"),
  min30: cue.at("about 30 minutes"),
  word: cue.at("won't say the word"),
  zombies: cue.at("Zombies"),
  movies: cue.at("seen the movies"),
  plan: cue.at("make a plan"),
  // 9:00 stay home
  stay: cue.at("Everybody else"),
  days3: cue.at("three days of food"),
  noon: cue.at("empty by noon"),
  crowd: cue.at("One bite in"),
  second: cue.at("a second one"),
  four: cue.at("Then four"),
  // 9:30 water
  water: cue.at("First, water"),
  pumps: cue.at("Pumps push"),
  workers: cue.at("stop coming to work"),
  dry: cue.at("tap goes dry"),
  fill: cue.at("fill the bathtub"),
  gal40: cue.at("40 gallons"),
  gal1: cue.at("One gallon"),
  days40: cue.at("forty days"),
  // 10:00 food
  food: cue.at("count your food"),
  rice: cue.at("Rice"),
  trash: cue.at("in the trash"),
  kcal: cue.at("30,000 calories"),
  perDay: cue.at("2,000 a day"),
  days15: cue.at("Fifteen days"),
  // 2:00 news update
  news2: cue.at("The TV says"),
  hospitals: cue.at("Hospitals are turning"),
  figured: cue.at("figured out"),
  slow: cue.at("They're slow"),
  mph: cue.at("one mile an hour"),
  walk3: cue.at("You walk three"),
  fight: cue.at("when people fight back"),
  eight: cue.at("eight times"),
  matter: cue.at("It doesn't matter"),
  win: cue.at("Every fight people win"),
  lose: cue.at("Every fight they lose"),
  hospital: cue.at("a hospital is"),
  hundreds: cue.at("Hundreds of bitten"),
  // 5:00 barricade
  door: cue.at("Your front door"),
  fridge: cue.at("The fridge goes"),
  windows: cue.at("Mattresses and bookshelves"),
  lights: cue.at("lights off"),
  empty: cue.at("look empty"),
  // 9:00 phone
  call: cue.at("You call your sister"),
  noGo: cue.at("won't go through"),
  text: cue.at("But a text"),
  slips: cue.at("slips through"),
  stayIn: cue.at("Stay inside"),
  answer: cue.at("Her answer"),
  tooLate: cue.at("Too late"),
  montana: cue.at("cabin in Montana"),
  // 11:00 highway
  highway: cue.at("On the news, the highway"),
  y2005: cue.at("in 2005"),
  miles: cue.at("a hundred miles long"),
  nobody: cue.at("Nobody is getting out"),
  // 3:12 knock
  street: cue.at("The streetlights"),
  knocks: cue.at("three slow knocks"),
  mark: cue.at("It's Mark"),
  notBitten: cue.at("I'm not bitten"),
  arms: cue.at("see his arms"),
  open: cue.at("open the door"),
  end: DURATION,
};
