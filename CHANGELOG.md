# Changelog

All notable changes to Repo Metro will be documented here. The project follows [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- Painted collection: The Starry Night, Sunflowers, and Girl with a Pearl Earring, with generated art, gallery selection, and individual map/frame/typography treatments.
- Portable embedded WebP artwork and asset packaging; all six skins support light and dark modes.
- Offline image-decoding, theme-state preservation, and single-embedding/size-budget checks.

- Studio, Paper, and Dusk skins with independent system/light/dark modes and browser-local preferences.
- Redesigned workspace header, repository summary, map legend, and ticket-style commit inspector.
- Compact mobile map labels, scroll hints, full-row selection, and optional six-palette browser QA.

### Fixed

- Search Enter now visits the first matching commit instead of skipping it.
- List keyboard navigation and search jumps focus the visible list instead of the hidden map.

### Initial release

- Local Git history and ref parsing without runtime dependencies.
- Deterministic active-lane layout for linear histories, shared ancestors, merges, and octopus merges.
- Self-contained interactive HTML with search, branch focus, commit details, list view, keyboard navigation, and themes.
- Standard and strict privacy modes; email addresses are never embedded.
- English and Simplified Chinese documentation, generated demo, and cross-platform tests.
