import words from "../../../public/casino/words.json";
import { makeCues } from "../../lib/timing";

export { words };
export const cue = makeCues(words, 30);
export const DURATION = Math.min(2685, cue.voiceEnd + 46); // < 90 s: follow + green zero finale then 16-frame loop dissolve

export const c = {
  hook: cue.at("Your friend owes"),
  betsIt: cue.at("bets it at your table"),
  wins: cue.at("He wins"),
  door: cue.at("heads for the door"),
  neverLeaves: cue.at("he never leaves"),

  checksTime: cue.at("He checks the time"),
  ripOut: cue.at("rip out every clock"),
  mazes: cue.at("confusing mazes"),
  plotTwist: cue.at("Plot twist"),
  bellagio: cue.at("In 1998"),
  highCeilings: cue.at("High ceilings"),
  relaxed: cue.at("Relaxed players"),

  cashHurts: cue.at("losing real cash hurts"),
  swapChips: cue.at("swap his 100 dollar bill"),
  stopsFeeling: cue.at("stops feeling the loss"),
  freeDrinks: cue.at("drinks are free"),

  fairBet: cue.at("on a fair bet"),
  roulette: cue.at("on roulette"),
  edge27: cue.at("2.7 percent"),
  doubleZero: cue.at("double zero"),
  tripleZero: cue.at("Triple zero"),
  houseWins: cue.at("The house always wins"),

  slots: cue.at("add slot machines"),
  stops22: cue.at("22 stops"),
  patent1984: cue.at("1984 patent"),
  oneNotch: cue.at("one notch off"),
  nearMiss: cue.at("near miss"),

  betOne: cue.at("Bet 1 dollar"),
  bellsCrazy: cue.at("bells go crazy"),
  ldw: cue.at("loss disguised as a win"),
  walletShrinks: cue.at("wallet shrinks"),

  oxygen: cue.at("pump oxygen"),
  totalMyth: cue.at("Total myth"),
  oneSpark: cue.at("One spark"),
  coolAir: cue.at("cool air"),

  wait: cue.at("Wait"),
  counting: cue.at("counting cards"),
  legal: cue.at("completely legal"),
  banHim: cue.at("ban him anyway"),
  ceilingDomes: cue.at("Ceiling domes"),
  rfid: cue.at("RFID chips"),

  billion72: cue.at("72 billion"),
  allIn: cue.at("goes all in"),
  grandma: cue.at("loses it to his grandma"),
  congrats: cue.at("Congratulations"),
  moneyTrap: cue.at("money trap"),
  callIt: cue.at("You call it"),
  theCasino: cue.at("the casino"),
  follow: cue.at("Follow or I'll put"),
  greenZeroEnd: cue.at("on green zero"),
  end: 0,
};
c.end = DURATION;
