/**
 * Public CI Bridge contract validator for the teaching exercise.
 * Each integration run selects exactly 20 test files from a caller-owned fixture.
 * No source code or raw test logs are uploaded to the public repository.
 */
import { existsSync, readFileSync, realpathSync, statSync, readdirSync } from "node:fs";
import { isAbsolute, join, relative, sep } from "node:path";

const VALID = /^[A-Za-z0-9_./-]+\.(?:test\.[cm]?[jt]s|spec\.[cm]?[jt]s|py)$/;

export function safeTestPath(root, entry) {
  if (typeof entry !== "string" || !VALID.test(entry) || isAbsolute(entry) ||
      entry.split("/").some((part) => part === ".." || part === "." || part === "")) {
    throw new Error("Invalid test path");
  }
  const base = realpathSync(root);
  const full = realpathSync(join(base, entry));
  const rel = relative(base, full);
  if (rel === ".." || rel.startsWith(".." + sep) || isAbsolute(rel) || !statSync(full).isFile()) {
    throw new Error("Test path escapes checkout");
  }
  return entry;
}

export function selectTests(root, kind, manifest = "") {
  if (!["node", "python"].includes(kind)) throw new Error("Only node or python are supported");
  let entries;
  if (manifest) {
    const file = join(root, manifest);
    safeRelativeManifest(root, manifest);
    if (!existsSync(file)) throw new Error("Fixture manifest not found");
    entries = readFileSync(file, "utf8").split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
  } else {
    const matches = [];
    const walk = (dir, prefix = "", depth = 0) => {
      if (depth > 10 || matches.length > 2500) return;
      for (const item of readdirSync(dir, { withFileTypes: true })) {
        if ([".git", "node_modules", ".venv", "venv", "dist", "build", "vendor"].includes(item.name)) continue;
        const path = prefix ? prefix + "/" + item.name : item.name;
        if (item.isDirectory()) walk(join(dir, item.name), path, depth + 1);
        else if (item.isFile() && ((kind === "python" && /(?:^|\/)(?:test_[\w-]+|[\w-]+_test)\.py$/.test(path)) ||
          (kind === "node" && /\.(?:test|spec)\.[cm]?[jt]s$/.test(path)))) matches.push(path);
      }
    };
    walk(root);
    entries = matches.sort();
  }
  if (entries.length === 0) {
    throw new Error("At least one test file is required");
  }
  if (new Set(entries).size !== entries.length) {
    throw new Error("Duplicate test files are not allowed");
  }
  for (const entry of entries) {
    if ((kind === "python" && !entry.endsWith(".py")) ||
        (kind === "node" && entry.endsWith(".py"))) throw new Error("Wrong language for test");
    safeTestPath(root, entry);
  }
  return entries;
}

function safeRelativeManifest(root, entry) {
  if (!/^[A-Za-z0-9_./-]+\.txt$/.test(entry) ||
      entry.split("/").some((p) => p === ".." || p === "." || p === "") ||
      isAbsolute(entry)) throw new Error("Unsafe manifest path");
  const resolved = realpathSync(join(root, entry));
  const rel = relative(realpathSync(root), resolved);
  if (rel === ".." || rel.startsWith(".." + sep) || isAbsolute(rel)) throw new Error("Manifest escaped checkout");
}

export function resultSummary(output, kind) {
  if (kind === "node") {
    const counts = {};
    for (const line of output.split(/\r?\n/)) {
      const m = /^# (tests|suites|pass|fail|skipped) (\d+)$/.exec(line);
      if (m) counts[m[1]] = Number(m[2]);
    }
    if (!Number.isSafeInteger(counts.tests) || !Number.isSafeInteger(counts.pass) ||
        !Number.isSafeInteger(counts.fail)) throw new Error("Missing test summary");
    return counts;
  }
  const m = /(?:^|\n)(?:={1,}\s*)?(\d+) passed(?:, (\d+) failed)?/m.exec(output);
  if (!m) throw new Error("Missing pytest summary");
  return { tests: Number(m[1]) + Number(m[2] || 0), pass: Number(m[1]), fail: Number(m[2] || 0) };
}
