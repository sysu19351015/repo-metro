# Appearance

Repo Metro combines a quiet developer workspace with transit-map details. Open **Appearance** to choose Studio, Paper, or Dusk; the **Theme** button independently cycles through system, light, and dark.

## References

- [Linear's interface refresh](https://linear.app/now/behind-the-latest-design-refresh): calmer borders, predictable controls, and a clear visual hierarchy.
- [Vercel Geist](https://vercel.com/geist/stack): restrained surfaces, typography, and compact developer-tool controls.
- [Catppuccin's palette](https://catppuccin.com/palette/): the soft violet/pastel direction for Dusk, adapted for this map's contrast requirements.

These are design references, not bundled UI libraries. The implementation uses local system fonts, inline SVG, and CSS; generated pages fetch no assets, scripts, or fonts.

## Skin structure

`src/appearance.ts` owns surface, text, accent, and lane-color tokens. Each skin has a light and a dark palette. Paper also changes heading typography and corner treatments. `src/render.ts` owns the appearance control and interaction bindings.

The `data-skin` and `data-theme` attributes are independent. System mode uses the browser's color-scheme preference and follows changes immediately. Preferences are stored under `repo-metro-skin` and `repo-metro-theme`; invalid values fall back safely, and blocked storage does not stop the viewer.

Skin changes do not change the commit graph, filter state, or selected station. There is no new CLI option: existing `--theme` remains the initial color-mode setting, and previously saved browser preferences keep their existing precedence.

## Verification

Run `npm test` for rendering, injection safety, privacy, and graph regression tests. The optional `scripts/visual-check.mjs` checks all six skin/mode combinations at desktop and mobile widths, plus a narrow 320px viewport.

It verifies readable primary/secondary text and button contrast (at least 4.5:1), persistence, live system mode, unavailable storage, selection/deep links, search, branch focus, list keyboard navigation, and zero external network requests. Screenshot output is placed in ignored `.artifacts/`; `--update-docs` refreshes the README previews.

Playwright is optional development tooling, not a runtime dependency. See [CONTRIBUTING.md](../CONTRIBUTING.md) for setup. `REPO_METRO_PLAYWRIGHT` may point to an existing Playwright module and `REPO_METRO_BROWSER` to an existing Chromium-based browser executable.
