import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { promisify } from "node:util";
import { loadRepositoryHistory, parseLog, parseRefs } from "../src/git.js";

const execFileAsync = promisify(execFile);
const field = "\u001f";
const record = "\u001e";

test("parseLog reads parent order, Unicode, and record separators", () => {
  const raw = [
    ["abcdef123456", "parent1 parent2", "李雷", "li@example.test", "2026-08-31T10:00:00+08:00", "修复解析器"].join(field),
    record,
    "\n",
    ["parent1", "", "Alice", "alice@example.test", "2026-08-30T10:00:00Z", "Initial station"].join(field),
    record,
  ].join("");
  const commits = parseLog(raw);
  assert.equal(commits.length, 2);
  assert.deepEqual(commits[0]?.parents, ["parent1", "parent2"]);
  assert.equal(commits[0]?.authorName, "李雷");
  assert.equal(commits[0]?.subject, "修复解析器");
  assert.deepEqual(commits[1]?.parents, []);
});

test("parseRefs peels annotated tags and skips symbolic remote HEAD", () => {
  const raw = [
    ["refs/heads/main", "main", "a", ""].join(field),
    ["refs/remotes/origin/HEAD", "origin/HEAD", "a", ""].join(field),
    ["refs/tags/v1", "v1", "tag-object", "commit-object"].join(field),
  ].join("\n");
  const refs = parseRefs(raw);
  assert.deepEqual(refs.map((ref) => [ref.kind, ref.name, ref.target]), [
    ["branch", "main", "a"],
    ["tag", "v1", "commit-object"],
  ]);
});

test("loadRepositoryHistory reads a real repository with a merge and tag", async () => {
  const root = await mkdtemp(join(tmpdir(), "repo-metro-test-"));
  try {
    await git(root, ["init", "-b", "main"]);
    await git(root, ["config", "user.name", "Repo Metro Test"]);
    await git(root, ["config", "user.email", "repo-metro@example.test"]);
    await writeFile(join(root, "README.md"), "# Test\n", "utf8");
    await git(root, ["add", "README.md"]);
    await git(root, ["commit", "-m", "Open station"]);
    await git(root, ["switch", "-c", "feature/map"]);
    await writeFile(join(root, "map.txt"), "line\n", "utf8");
    await git(root, ["add", "map.txt"]);
    await git(root, ["commit", "-m", "Add map"]);
    await git(root, ["switch", "main"]);
    await writeFile(join(root, "README.md"), "# Test\nMain line\n", "utf8");
    await git(root, ["add", "README.md"]);
    await git(root, ["commit", "-m", "Update main line"]);
    await git(root, ["merge", "--no-ff", "feature/map", "-m", "Merge map line"]);
    await git(root, ["tag", "-a", "v0.1.0", "-m", "First stop"]);

    const result = await loadRepositoryHistory(root, 100);
    assert.equal(result.name, root.split(/[\\/]/).at(-1));
    assert.equal(result.head, "main");
    assert.equal(result.truncated, false);
    assert.equal(result.commits.length, 4);
    assert.ok(result.commits.some((commit) => commit.parents.length === 2));
    assert.ok(result.refs.some((ref) => ref.kind === "tag" && ref.name === "v0.1.0"));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("loadRepositoryHistory handles an unborn repository", async () => {
  const root = await mkdtemp(join(tmpdir(), "repo-metro-empty-"));
  try {
    await git(root, ["init", "-b", "main"]);
    const result = await loadRepositoryHistory(root, 100);
    assert.equal(result.head, "main");
    assert.equal(result.headHash, "");
    assert.deepEqual(result.commits, []);
    assert.equal(result.truncated, false);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

async function git(cwd: string, args: readonly string[]): Promise<void> {
  await execFileAsync("git", ["-C", cwd, ...args], { windowsHide: true });
}
