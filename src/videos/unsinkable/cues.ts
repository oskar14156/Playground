import words from "../../../public/unsinkable/words.json";
import { makeCues } from "../../lib/timing";

export { words };
export const cue = makeCues(words, 30);
export const DURATION = Math.min(2685, cue.voiceEnd + 46); // < 90 s: follow finale + 16-frame loop dissolve

export const c = {
  // 1. HOOK
  grandma: cue.at("Grandma"),
  sailed: cue.at("sailed"),
  unsinkable: cue.at("unsinkable"),
  chase: cue.at("chase"),
  hull269: cue.at("269"),
  rivets: cue.at("rivets"),

  // 2. BULKHEADS
  sinkBoat: cue.at("can sink"),
  slice: cue.at("16 watertight"),
  fourFlood: cue.at("4 flood"),
  plotTwist: cue.at("plot twist"),
  dontSeal: cue.at("don't seal"),
  threeMeters: cue.at("3 meters"),
  iceCube: cue.at("ice cube"),
  flood5: cue.at("Flood 5"),

  // 3. FOURTH FUNNEL
  boilers: cue.at("29 coal"),
  fourthQ: cue.at("bolt on"),
  auraFarming: cue.at("aura farming"),
  notHooked: cue.at("isn't even"),
  airVent: cue.at("air vent"),

  // 4. LIFEBOATS
  waitBoats: cue.at("20 lifeboats"),
  law1894: cue.at("1894"),
  legalMin: cue.at("legal minimum"),
  ruinView: cue.at("ruin the view"),

  // 5. BINOCULARS
  knots22: cue.at("22 knots"),
  binoculars: cue.at("binoculars"),
  locked: cue.at("locked"),
  pocketedKey: cue.at("pocketed"),

  // 6. TURBINE PARADOX
  iceberg400: cue.at("400 meters"),
  reverse: cue.at("full reverse"),
  hugeMistake: cue.at("Huge mistake"),
  centerProp: cue.at("center propeller"),
  stops: cue.at("just stops"),
  rudder: cue.at("rudder"),

  // 7. COLLISION & POOL
  rips6: cue.at("rips open"),
  sinks3800: cue.at("3,800"),
  pool: cue.at("swimming pool"),
  stillFull: cue.at("still full"),

  // 8. PAYOFF & FOLLOW LOOP
  congrats: cue.at("Congratulations"),
  roomForTwo: cue.at("room for two"),
  theTitanic: cue.at("the Titanic"),
  follow: cue.at("Follow"),
  because: cue.at("Because"),
  end: 0,
};
c.end = DURATION;
