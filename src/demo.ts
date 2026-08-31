import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createMetroLayout } from "./layout.js";
import { renderMetroHtml } from "./render.js";
import type { GitCommit, GitRef, RepositoryHistory } from "./types.js";

const hash = (value: number): string => createHash("sha1")
  .update(`repo-metro-demo-${value}`)
  .digest("hex");

const ref = (
  name: string,
  target: number,
  kind: GitRef["kind"] = "branch",
): GitRef => ({
  fullName: kind === "tag" ? `refs/tags/${name}` : `refs/heads/${name}`,
  name,
  kind,
  target: hash(target),
});

const refs: GitRef[] = [
  ref("main", 14),
  ref("feature/dark-theme", 12),
  ref("experiment/parser", 7),
  ref("v0.1.0", 14, "tag"),
];

const subjects = new Map<number, string>([
  [14, "Release the first Repo Metro preview"],
  [13, "Polish search result navigation"],
  [12, "Add a dark theme for late-night journeys"],
  [11, "Document the offline privacy model"],
  [10, "Extract reusable theme tokens"],
  [9, "Merge the parser experiment"],
  [8, "Make every station keyboard accessible"],
  [7, "Handle Windows paths and Unicode refs"],
  [6, "Draw curved tracks between active lanes"],
  [5, "Merge the first interactive CLI"],
  [4, "Improve friendly command-line errors"],
  [3, "Create the portable demo page"],
  [2, "Parse Git history without dependencies"],
  [1, "Open the station"],
]);

const parents = new Map<number, number[]>([
  [14, [13, 12]],
  [13, [11]],
  [12, [10]],
  [11, [9]],
  [10, [8]],
  [9, [8, 7]],
  [8, [6]],
  [7, [5]],
  [6, [5]],
  [5, [4, 3]],
  [4, [2]],
  [3, [2]],
  [2, [1]],
  [1, []],
]);

const authors = ["Mina", "Noah", "Sora", "Kai"];
const commits: GitCommit[] = [...subjects.keys()].map((value, index) => ({
  hash: hash(value),
  shortHash: hash(value).slice(0, 7),
  parents: (parents.get(value) ?? []).map(hash),
  authorName: authors[index % authors.length] ?? "Contributor",
  authorEmail: `contributor-${index % authors.length}@example.invalid`,
  authoredAt: new Date(Date.UTC(2026, 7, 31 - index, 9 + (index % 5), 30)).toISOString(),
  subject: subjects.get(value) ?? "Commit",
  refs: refs.filter((item) => item.target === hash(value)),
}));

const history: RepositoryHistory = {
  name: "repo-metro",
  root: "",
  head: "main",
  headHash: hash(14),
  commits,
  refs,
  truncated: false,
  maxCommits: 500,
};

const outputPath = resolve(process.cwd(), "docs", "index.html");
const layout = createMetroLayout(history.commits);
const html = renderMetroHtml(history, layout, {
  title: "Repo Metro · Demo line",
  theme: "auto",
  privacy: "standard",
});

await mkdir(resolve(process.cwd(), "docs"), { recursive: true });
await writeFile(outputPath, html, "utf8");
console.log(`Demo generated at ${outputPath}`);
