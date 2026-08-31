import { resolve } from "node:path";
import type { PrivacyMode, Theme } from "./types.js";

export const VERSION = "0.1.0";

export interface CliOptions {
  readonly repoPath: string;
  readonly outputPath: string;
  readonly maxCommits: number;
  readonly title?: string;
  readonly theme: Theme;
  readonly privacy: PrivacyMode;
  readonly help: boolean;
  readonly version: boolean;
}

const valueFlags = new Set([
  "--output",
  "-o",
  "--max-commits",
  "-n",
  "--title",
  "--theme",
  "--privacy",
]);

export function parseArgs(argv: readonly string[], cwd = process.cwd()): CliOptions {
  let repoPath = ".";
  let outputPath = "repo-metro.html";
  let maxCommits = 500;
  let title: string | undefined;
  let theme: Theme = "auto";
  let privacy: PrivacyMode = "standard";
  let help = false;
  let version = false;
  let positionalSeen = false;

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === undefined) continue;

    if (argument === "--help" || argument === "-h") {
      help = true;
      continue;
    }
    if (argument === "--version" || argument === "-v") {
      version = true;
      continue;
    }
    if (valueFlags.has(argument)) {
      const value = argv[index + 1];
      if (value === undefined || value.startsWith("-")) {
        throw new Error(`Missing value for ${argument}.`);
      }
      index += 1;
      switch (argument) {
        case "--output":
        case "-o":
          outputPath = value;
          break;
        case "--max-commits":
        case "-n":
          maxCommits = parseMaxCommits(value);
          break;
        case "--title":
          title = value.trim();
          if (title.length === 0) throw new Error("Title cannot be empty.");
          break;
        case "--theme":
          theme = parseChoice(value, ["auto", "light", "dark"], "theme");
          break;
        case "--privacy":
          privacy = parseChoice(value, ["standard", "strict"], "privacy mode");
          break;
      }
      continue;
    }
    if (argument.startsWith("-")) {
      throw new Error(`Unknown option: ${argument}`);
    }
    if (positionalSeen) {
      throw new Error(`Unexpected positional argument: ${argument}`);
    }
    repoPath = argument;
    positionalSeen = true;
  }

  return {
    repoPath: resolve(cwd, repoPath),
    outputPath: resolve(cwd, outputPath),
    maxCommits,
    ...(title === undefined ? {} : { title }),
    theme,
    privacy,
    help,
    version,
  };
}

function parseMaxCommits(value: string): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 10 || parsed > 5_000) {
    throw new Error("--max-commits must be an integer between 10 and 5000.");
  }
  return parsed;
}

function parseChoice<const T extends string>(
  value: string,
  choices: readonly T[],
  label: string,
): T {
  if (!choices.includes(value as T)) {
    throw new Error(`Invalid ${label} \"${value}\". Choose: ${choices.join(", ")}.`);
  }
  return value as T;
}

export function helpText(): string {
  return `Repo Metro ${VERSION}

Turn Git history into an explorable metro map.

Usage:
  repo-metro [repository] [options]

Arguments:
  repository                 Git repository to inspect (default: current directory)

Options:
  -o, --output <file>         Output HTML file (default: repo-metro.html)
  -n, --max-commits <count>  Include 10-5000 commits (default: 500)
      --title <text>          Override the map title
      --theme <mode>          auto, light, or dark (default: auto)
      --privacy <mode>        standard or strict (default: standard)
  -h, --help                  Show this help
  -v, --version               Show the version

Privacy:
  standard  Includes author display names but never email addresses.
  strict    Replaces author names with deterministic contributor aliases.
`;
}
