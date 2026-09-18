# Appearance

Repo Metro has a painted collection (The Starry Night, Sunflowers, and Girl with a Pearl Earring) alongside the original Studio, Paper, and Dusk skins. Choose artwork directly from the top gallery or open **Appearance**. The **Theme** button independently cycles through system, light, and dark.

Starry Night pairs a blue painted sky with luminous gold tracks. Sunflowers uses canvas texture and ochre frames. Pearl combines dark green, fine borders, and pearlescent stations. New viewers start with Starry Night, while valid saved preferences are retained.

The artwork is AI-generated with the built-in image generation tool. See [assets and complete prompts](../assets/paintings/README.md) for provenance, museum references, and optimization details.

## References

- [Linear's interface refresh](https://linear.app/now/behind-the-latest-design-refresh): calmer borders, predictable controls, and a clear visual hierarchy.
- [Vercel Geist](https://vercel.com/geist/stack): restrained surfaces, typography, and compact developer-tool controls.
- [Catppuccin's palette](https://catppuccin.com/palette/): the soft violet/pastel direction for Dusk, adapted for this map's contrast requirements.

These are design references, not bundled UI libraries. The implementation uses local system fonts, inline SVG, CSS, and embedded WebP images; generated pages fetch no external assets, scripts, or fonts.

## Skin structure

`src/appearance.ts` owns surface, text, accent, and lane-color tokens. Each skin has a light and a dark palette. Paper also changes heading typography and corner treatments. `src/render.ts` owns the appearance control and interaction bindings.

The `data-skin` and `data-theme` attributes are independent. System mode uses the browser's color-scheme preference and follows changes immediately. Preferences are stored under `repo-metro-skin` and `repo-metro-theme`; invalid values fall back safely, and blocked storage does not stop the viewer.

`src/art.ts` defines the painting metadata and resolves packaged WebP assets relative to the compiled module, independent of the caller's working directory. Each painting is embedded once as a CSS variable; thumbnails, hero art, and detail cards reuse it. `src/painting-styles.ts` contains the art-specific visual treatments. The package includes `assets/paintings`.

Skin changes do not change the commit graph, filter state, or selected station. There is no new CLI option: existing `--theme` remains the initial color-mode setting, and previously saved browser preferences keep their existing precedence.

## Verification

Run `npm test` for rendering, injection safety, privacy, graph regressions, single asset embedding, and a 1 MB size budget for small snapshots. The optional `scripts/visual-check.mjs` checks all twelve skin/mode combinations at desktop and mobile widths, plus a narrow 320px viewport. It also decodes all embedded paintings offline and checks that gallery switching retains selection, search, and branch focus.

It verifies readable primary/secondary text and button contrast (at least 4.5:1), persistence, live system mode, unavailable storage, selection/deep links, search, branch focus, list keyboard navigation, and zero external network requests. Screenshot output is placed in ignored `.artifacts/`; `--update-docs` refreshes the README previews.

Playwright is optional development tooling, not a runtime dependency. See [CONTRIBUTING.md](../CONTRIBUTING.md) for setup. `REPO_METRO_PLAYWRIGHT` may point to an existing Playwright module and `REPO_METRO_BROWSER` to an existing Chromium-based browser executable.
