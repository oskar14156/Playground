import words from "../../../public/php2shell/words.json";
import { makeCues } from "../../lib/timing";

export { words };
export const cue = makeCues(words, 30);
export const DURATION = cue.voiceEnd + 12;

// Every storyboard cue, resolved from the spoken words (storyboard.md → Beats).
export const c = {
  holes: cue.at("two holes"),
  php: cue.at("PHP runs"),
  seven: cue.at("7 in 10"),
  called: cue.at("The bugs are called"),
  name: cue.at("PHP2Shell"),
  rated: cue.at("rated"),
  one: cue.at("One fires"),
  memory: cue.at("out of memory"),
  other: cue.at("The other"),
  leftovers: cue.at("leftovers"),
  next: cue.at("into the next"),
  either: cue.at("Either way"),
  stranger: cue.at("a stranger"),
  code: cue.at("their own code"),
  nopass: cue.at("No password"),
  onereq: cue.at("One request"),
  worst: cue.at("But here's the worst"),
  planned: cue.at("planned for October"),
  leaked: cue.at("leaked early"),
  amazon: cue.at("Amazon's honeypots"),
  days4: cue.at("4 days"),
  run: cue.at("If you run"),
  update: cue.at("update PHP today"),
  restart: cue.at("restart it"),
  because: cue.at("Because until"),
  end: DURATION,
};
