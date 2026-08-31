import { execFile } from "node:child_process";
import { basename, resolve } from "node:path";
import { promisify } from "node:util";
import type { GitCommit, GitRef, RepositoryHistory } from "./types.js";

const execFileAsync = promisify(execFile);
const FIELD_SEPARATOR = "\u001f";
const RECORD_SEPARATOR = "\u001e";

export async function loadRepositoryHistory(
  inputPath: string,
  maxCommits: number,
): Promise<RepositoryHistory> {
  const requestedPath = resolve(inputPath);
  const root = (await runGit(requestedPath, ["rev-parse", "--show-toplevel"])).trim();
  if (!root) throw new Error(`Not a Git repository: ${requestedPath}`);

  const [head, headHash, refs, countText, logText] = await Promise.all([
    readHead(root),
    readHeadHash(root),
    readRefs(root),
    runGit(root, ["rev-list", "--all", "--count"]).then((value) => value.trim()),
    runGit(root, [
      "log",
      "--all",
      "--topo-order",
      `--max-count=${maxCommits}`,
      "--date=iso-strict",
      "--pretty=format:%H%x1f%P%x1f%an%x1f%ae%x1f%aI%x1f%s%x1e",
    ]),
  ]);

  const refsByHash = groupRefsByHash(refs);
  const commits = parseLog(logText).map((commit) => ({
    ...commit,
    refs: refsByHash.get(commit.hash) ?? [],
  }));
  const totalCommits = Number.parseInt(countText, 10);

  return {
    name: basename(root),
    root,
    head,
    headHash,
    commits,
    refs,
    truncated: Number.isFinite(totalCommits) && totalCommits > commits.length,
    maxCommits,
  };
}

export function parseLog(raw: string): GitCommit[] {
  return raw
    .split(RECORD_SEPARATOR)
    .map((record) => record.replace(/^\r?\n/, ""))
    .filter((record) => record.length > 0)
    .map((record) => {
      const fields = record.split(FIELD_SEPARATOR);
      if (fields.length < 6) {
        throw new Error("Git returned an unexpected log format.");
      }
      const [hash = "", parents = "", authorName = "", authorEmail = "", authoredAt = ""] = fields;
      const subject = fields.slice(5).join(FIELD_SEPARATOR).replace(/\r?\n$/, "");
      if (hash.length === 0) throw new Error("Git returned a commit without a hash.");
      return {
        hash,
        shortHash: hash.slice(0, 7),
        parents: parents.length === 0 ? [] : parents.split(" ").filter(Boolean),
        authorName,
        authorEmail,
        authoredAt,
        subject,
        refs: [],
      };
    });
}

export function parseRefs(raw: string): GitRef[] {
  return raw
    .split(/\r?\n/)
    .filter(Boolean)
    .flatMap((line) => {
      const [fullName, name, directTarget, peeledTarget = ""] = line.split(FIELD_SEPARATOR);
      const target = peeledTarget || directTarget;
      if (fullName === undefined || name === undefined || target === undefined) return [];
      if (fullName.endsWith("/HEAD")) return [];
      const kind = fullName.startsWith("refs/heads/")
        ? "branch"
        : fullName.startsWith("refs/remotes/")
          ? "remote"
          : fullName.startsWith("refs/tags/")
            ? "tag"
            : undefined;
      return kind === undefined ? [] : [{ fullName, name, target, kind }];
    });
}

async function readHead(root: string): Promise<string> {
  try {
    return (await runGit(root, ["symbolic-ref", "--quiet", "--short", "HEAD"])).trim();
  } catch {
    return "detached HEAD";
  }
}

async function readHeadHash(root: string): Promise<string> {
  try {
    return (await runGit(root, ["rev-parse", "HEAD"])).trim();
  } catch {
    return "";
  }
}

async function readRefs(root: string): Promise<GitRef[]> {
  const raw = await runGit(root, [
    "for-each-ref",
    "--format=%(refname)%1f%(refname:short)%1f%(objectname)%1f%(*objectname)",
    "refs/heads",
    "refs/remotes",
    "refs/tags",
  ]);
  return parseRefs(raw);
}

async function runGit(cwd: string, args: readonly string[]): Promise<string> {
  try {
    const { stdout } = await execFileAsync("git", ["-C", cwd, ...args], {
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
      windowsHide: true,
    });
    return stdout;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Git command failed in ${cwd}: ${message}`, { cause: error });
  }
}

function groupRefsByHash(refs: readonly GitRef[]): Map<string, GitRef[]> {
  const grouped = new Map<string, GitRef[]>();
  for (const ref of refs) {
    const existing = grouped.get(ref.target) ?? [];
    existing.push(ref);
    grouped.set(ref.target, existing);
  }
  return grouped;
}
