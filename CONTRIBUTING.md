# Contributing to Repo Metro

Thanks for helping improve the map.

## Local setup

```bash
npm install
npm test
npm run demo
```

Node.js 20+ and Git are required. Before opening a pull request, run `npm test` and `npm pack --dry-run`.

## Design constraints

- Keep runtime dependencies at zero unless there is a compelling, measured reason to change that promise.
- Generated HTML must remain self-contained and make no network requests.
- Never embed author emails, repository file contents, or diffs by default.
- Treat commit messages, author names, branch names, and tags as untrusted input.
- Preserve deterministic layout: identical normalized histories should produce identical geometry.
- Keep map interactions keyboard accessible and provide the list view as a complete alternative.
- Add tests for every topology bug, especially shared ancestors, multiple tips, octopus merges, and truncated histories.

## Pull requests

For appearance changes, see [the skin guide](docs/appearance.md). Optional browser checks:

~~~bash
npm install --no-save --package-lock=false playwright
npx playwright install chromium
npm run demo
node scripts/visual-check.mjs
~~~

Screenshots go to ignored `.artifacts/`. Add `--update-docs` to refresh README screenshots.

Keep changes focused. Explain the user-visible behavior, include tests, and regenerate `docs/index.html` with `npm run demo` when the UI changes. Screenshots are helpful for visual changes.
