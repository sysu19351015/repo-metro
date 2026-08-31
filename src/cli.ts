#!/usr/bin/env node

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, relative } from "node:path";
import { helpText, parseArgs, VERSION } from "./args.js";
import { loadRepositoryHistory } from "./git.js";
import { createMetroLayout } from "./layout.js";
import { renderMetroHtml } from "./render.js";

async function main(): Promise<void> {
  try {
    const options = parseArgs(process.argv.slice(2));
    if (options.help) {
      console.log(helpText());
      return;
    }
    if (options.version) {
      console.log(VERSION);
      return;
    }

    const history = await loadRepositoryHistory(options.repoPath, options.maxCommits);
    if (history.commits.length === 0) {
      throw new Error("This repository has no commits to map yet.");
    }
    const layout = createMetroLayout(history.commits);
    const html = renderMetroHtml(history, layout, {
      title: options.title ?? history.name,
      theme: options.theme,
      privacy: options.privacy,
    });
    await mkdir(dirname(options.outputPath), { recursive: true });
    await writeFile(options.outputPath, html, "utf8");

    const shownPath = relative(process.cwd(), options.outputPath) || options.outputPath;
    console.log(`Repo Metro generated ${shownPath}`);
    console.log(
      `${history.commits.length} commits · ${layout.laneCount} lanes${history.truncated ? " · history truncated" : ""}`,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`repo-metro: ${message}`);
    process.exitCode = 1;
  }
}

void main();
