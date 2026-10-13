import { realpathSync, statSync } from "node:fs";
import { isAbsolute, join, relative, sep } from "node:path";

const TEST_PATH = /^[a-zA-Z0-9_./-]+\.test\.ts$/;

export function validateFixtureManifest(text, root, expectedFiles = 20) {
  const entries = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (entries.length !== expectedFiles || new Set(entries).size !== expectedFiles) {
    throw new Error("The private fixture must declare exactly " + expectedFiles + " distinct test files");
  }
  const base = realpathSync(root);
  for (const path of entries) {
    if (!TEST_PATH.test(path) || isAbsolute(path) || path.split("/").some((part) => part === "." || part === "..")) {
      throw new Error("Unsafe fixture test path");
    }
    const actual = realpathSync(join(base, path));
    if (relative(base, actual).startsWith(".." + sep) || relative(base, actual) === ".." || isAbsolute(relative(base, actual)) || !statSync(actual).isFile()) {
      throw new Error("Test path escapes the private fixture checkout");
    }
  }
  return entries;
}

export function parsePrivateTapSummary(stdout) {
  const fields = {};
  for (const line of stdout.split(/\r?\n/)) {
    const match = /^# (tests|suites|pass|fail|skipped) ([0-9]+)$/.exec(line);
    if (match) fields[match[1]] = Number(match[2]);
  }
  if (![fields.tests, fields.pass, fields.fail].every(Number.isSafeInteger)) {
    throw new Error("Private test runner did not produce a complete TAP summary");
  }
  return fields;
}
