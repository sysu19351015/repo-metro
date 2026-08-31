import type { GitCommit, GitRef, RepositoryHistory } from "../src/types.js";

export function commit(
  hash: string,
  parents: readonly string[] = [],
  overrides: Partial<GitCommit> = {},
): GitCommit {
  return {
    hash,
    shortHash: hash.slice(0, 7),
    parents,
    authorName: "Alice",
    authorEmail: "alice@example.test",
    authoredAt: "2026-08-31T10:00:00.000Z",
    subject: `Commit ${hash}`,
    refs: [],
    ...overrides,
  };
}

export function branch(name: string, target: string): GitRef {
  return {
    fullName: `refs/heads/${name}`,
    name,
    kind: "branch",
    target,
  };
}

export function history(
  commits: readonly GitCommit[],
  refs: readonly GitRef[] = [],
): RepositoryHistory {
  return {
    name: "sample-repo",
    root: "C:/sample-repo",
    head: "main",
    headHash: commits[0]?.hash ?? "",
    commits,
    refs,
    truncated: false,
    maxCommits: 500,
  };
}
