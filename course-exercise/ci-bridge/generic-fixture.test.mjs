/**
 * PUBLIC CI Bridge portability tests for an authorized checkout.
 * Exactly 20 independent, generic checks. These are repository/runner
 * integrity checks, NOT application unit tests.
 *
 * No filenames, sources, paths, or remote URLs are logged.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, statSync, realpathSync } from "node:fs";
import { resolve, join, isAbsolute } from "node:path";

const root = resolve(process.env.BRIDGE_FIXTURE_PATH || ".");
const git = (...args) => execFileSync("git", ["-C", root, ...args], {
  encoding: "utf8", timeout: 6000, stdio: ["ignore", "pipe", "pipe"],
  env: { PATH: process.env.PATH || "", HOME: process.env.HOME || "" },
}).trim();
const head = () => git("rev-parse", "HEAD");
const files = () => git("ls-files", "-z").split("\0").filter(Boolean);

test("01: checkout exists", () => assert.ok(existsSync(root)));
test("02: checkout is a directory", () => assert.ok(statSync(root).isDirectory()));
test("03: checkout has a canonical path", () => assert.equal(realpathSync(root), root));
test("04: checkout includes Git metadata", () => assert.ok(existsSync(join(root, ".git"))));
test("05: checkout is inside a Git work tree", () => assert.equal(git("rev-parse", "--is-inside-work-tree"), "true"));
test("06: Git top level resolves to fixture root", () => assert.equal(realpathSync(git("rev-parse", "--show-toplevel")), root));
test("07: HEAD is a full commit hash", () => assert.match(head(), /^[0-9a-f]{40}$/));
test("08: HEAD has type commit", () => assert.equal(git("cat-file", "-t", "HEAD"), "commit"));
test("09: HEAD tree is a full hash", () => assert.match(git("rev-parse", "HEAD^{tree}"), /^[0-9a-f]{40}$/));
test("10: branch lookup is available", () => assert.equal(typeof git("branch", "--show-current"), "string"));
test("11: HEAD object exists", () => assert.equal(git("cat-file", "-e", "HEAD"), ""));
test("12: checkout includes at least one tracked file", () => assert.ok(files().length > 0));
test("13: tracked paths are relative", () => assert.ok(files().every((f) => !isAbsolute(f))));
test("14: tracked paths contain no parent traversal", () => assert.ok(files().every((f) => !f.split("/").includes(".."))));
test("15: tracked paths exclude .git metadata", () => assert.ok(files().every((f) => !f.startsWith(".git/"))));
test("16: tracked file names have no duplicates", () => assert.equal(new Set(files()).size, files().length));
test("17: checkout file inventory is deterministic", () => assert.deepEqual(files(), files()));
test("18: Git status command works", () => assert.equal(typeof git("status", "--porcelain"), "string"));
test("19: checkout contains at least one commit", () => assert.ok(Number(git("rev-list", "--count", "HEAD")) >= 1));
test("20: Git log agrees with HEAD", () => assert.equal(git("log", "-1", "--format=%H"), head()));
