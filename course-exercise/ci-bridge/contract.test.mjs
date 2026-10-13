import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { safeTestPath, selectTests, resultSummary } from "./contract.mjs";

function fixture(fn) {
  const root = mkdtempSync(join(tmpdir(), "public-ci-bridge-"));
  try {
    mkdirSync(join(root, "tests"));
    for (let i = 0; i < 20; i++) writeFileSync(join(root, "tests", "case" + i + ".test.ts"), "");
    const names = Array.from({ length: 20 }, (_, i) => "tests/case" + i + ".test.ts");
    return fn(root, names);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

test("select exactly twenty declared Node test files", () => fixture((root, names) => {
  writeFileSync(join(root, "manifest.txt"), names.join("\n") + "\n");
  assert.deepEqual(selectTests(root, "node", "manifest.txt"), names);
}));

test("reject duplicate test selectors", () => fixture((root, names) => {
  writeFileSync(join(root, "manifest.txt"), [...names.slice(0, 19), names[0]].join("\n"));
  assert.throws(() => selectTests(root, "node", "manifest.txt"), /20 unique/);
}));

test("auto discovery selects twenty deterministic tests", () => fixture((root) => {
  const first = selectTests(root, "node");
  assert.equal(first.length, 20);
  assert.deepEqual(first, selectTests(root, "node"));
}));

test("reject path traversal and missing fixture test", () => fixture((root) => {
  assert.throws(() => safeTestPath(root, "../stolen.test.ts"), /Invalid/);
  assert.throws(() => safeTestPath(root, "tests/absent.test.ts"));
}));

test("reject symlinks escaping fixture root", () => fixture((root) => {
  const other = mkdtempSync(join(tmpdir(), "outside-fixture-"));
  try {
    writeFileSync(join(other, "outside.test.ts"), "");
    symlinkSync(join(other, "outside.test.ts"), join(root, "tests", "escape.test.ts"));
    assert.throws(() => safeTestPath(root, "tests/escape.test.ts"), /escapes checkout/);
  } finally {
    rmSync(other, { recursive: true, force: true });
  }
}));

test("parse Node TAP summary without printing test details", () => {
  assert.deepEqual(resultSummary("# tests 161\n# suites 20\n# pass 161\n# fail 0\n# skipped 0\n", "node"),
    { tests: 161, suites: 20, pass: 161, fail: 0, skipped: 0 });
  assert.throws(() => resultSummary("stack trace leaked", "node"), /Missing test summary/);
});

test("parse pytest summary", () => {
  assert.deepEqual(resultSummary("================ 20 passed in 0.12s ================", "python"),
    { tests: 20, pass: 20, fail: 0 });
  assert.deepEqual(resultSummary("=== 19 passed, 1 failed in 1.1s ===", "python"),
    { tests: 20, pass: 19, fail: 1 });
});
