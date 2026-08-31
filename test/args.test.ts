import assert from "node:assert/strict";
import { resolve } from "node:path";
import test from "node:test";
import { helpText, parseArgs } from "../src/args.js";

test("parseArgs uses safe, useful defaults", () => {
  const cwd = resolve("fixture");
  const options = parseArgs([], cwd);
  assert.equal(options.repoPath, cwd);
  assert.equal(options.outputPath, resolve(cwd, "repo-metro.html"));
  assert.equal(options.maxCommits, 500);
  assert.equal(options.theme, "auto");
  assert.equal(options.privacy, "standard");
  assert.equal(options.title, undefined);
});

test("parseArgs handles the documented options", () => {
  const cwd = resolve("fixture");
  const options = parseArgs([
    "../project",
    "-o",
    "out/map.html",
    "-n",
    "1200",
    "--title",
    "Night line",
    "--theme",
    "dark",
    "--privacy",
    "strict",
  ], cwd);
  assert.equal(options.repoPath, resolve(cwd, "../project"));
  assert.equal(options.outputPath, resolve(cwd, "out/map.html"));
  assert.equal(options.maxCommits, 1200);
  assert.equal(options.title, "Night line");
  assert.equal(options.theme, "dark");
  assert.equal(options.privacy, "strict");
});

test("parseArgs rejects ambiguous or unsafe values", () => {
  assert.throws(() => parseArgs(["--max-commits", "9"]), /between 10 and 5000/);
  assert.throws(() => parseArgs(["--theme", "neon"]), /Invalid theme/);
  assert.throws(() => parseArgs(["--unknown"]), /Unknown option/);
  assert.throws(() => parseArgs(["one", "two"]), /Unexpected positional/);
});

test("help text includes core usage and privacy behavior", () => {
  const text = helpText();
  assert.match(text, /repo-metro \[repository\]/);
  assert.match(text, /--max-commits/);
  assert.match(text, /never email addresses/);
});
