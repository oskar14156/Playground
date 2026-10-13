/**
 * One-off public CI orchestrator integration probe.
 *
 * The private repository is an ephemeral test fixture. The fixture is
 * never copied to the public Git history, cache, or GitHub artifacts.
 * Do not use this script as a general free runner for private projects.
 */
import { appendFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { selectTests, resultSummary } from "./contract.mjs";

const root = resolve(process.env.BRIDGE_FIXTURE_PATH || "private-fixture");
const kind = process.env.BRIDGE_LANGUAGE || "node";
const manifest = process.env.BRIDGE_MANIFEST || "";
try {
  const generic = kind === "generic";
  const files = generic ? [] : selectTests(root, kind, manifest);
  // Never pass the checkout credential into the test process.
  const sanitizedEnv = {
    PATH: process.env.PATH || "",
    HOME: process.env.HOME || "",
    CI: "true",
    LANG: process.env.LANG || "C.UTF-8",
    TZ: "UTC",
    BRIDGE_FIXTURE_PATH: root,
  };
  const executable = kind === "python" ? "python3" : process.execPath;
  const args = generic
    ? ["--test", "--test-reporter=tap", fileURLToPath(new URL("./generic-fixture.test.mjs", import.meta.url))]
    : kind === "node"
      ? ["--experimental-strip-types", "--test", "--test-reporter=tap", ...files]
      : ["-m", "pytest", "--quiet", "--tb=no", "--disable-warnings", ...files];
  // Deliberately capture (rather than print) confidential filenames,
  // stack traces, proprietary source references, and fixture stderr.
  const run = spawnSync(executable, args, {
    cwd: root,
    env: sanitizedEnv,
    encoding: "utf8",
    shell: false,
    timeout: 240000,
    maxBuffer: 8 * 1024 * 1024,
  });
  if (run.error || run.status !== 0) throw new Error("Private fixture test process failed");
  const result = resultSummary(run.stdout || "", generic ? "node" : kind);
  if (result.fail !== 0 || result.pass < 20 || result.tests !== result.pass || (generic && result.tests !== 20)) {
    throw new Error("Private fixture did not pass all tests");
  }
  const message = generic
    ? "Integration PASS: 20 generic checkout integrity checks passed; no fixture code or raw logs published."
    : "Integration PASS: 20 selected test files, " + result.pass +
      " assertions passed; no fixture code or raw logs published.";
  console.log(message);
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY,
      "### Public CI Bridge integration\n\n" + message +
      "\n\nThis is an isolated one-time integration check of the open-source CI Bridge.\n");
  }
} catch {
  console.error("Integration FAILED or blocked. Detailed diagnostics are intentionally withheld from public logs.");
  process.exitCode = 1;
}
