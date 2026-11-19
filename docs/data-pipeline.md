# Data pipeline

emoji-kit ships a deterministic dataset so that importing the package never requires a network request or filesystem access. This document explains where the data comes from and how it is generated.

## Inputs

All human-maintained inputs are under `data/sources`:

- `sources.json` — pinned upstream sources with exact versions, sha256 hashes, and license labels.
- `app-categories.json` — curated app overlays: categories and alias maps for the 28 supported app ids.
- `resource-sources.json` — separate pinned public repositories for the raw resource library under `resources/**` (files are not normalized into runtime data).

Pinned sources (Unicode / Emoji 18.0, CLDR 49):

| Source | Use | License |
| --- | --- | --- |
| [Emojibase English dataset](https://cdn.jsdelivr.net/npm/emojibase-data@18.0.0/en/data.json) | Core emoji records, labels, groups | MIT |
| [Emojibase CLDR shortcodes](https://cdn.jsdelivr.net/npm/emojibase-data@18.0.0/en/shortcodes/cldr.json) | CLDR shortcode aliases | MIT |
| [Emojibase native shortcodes](https://cdn.jsdelivr.net/npm/emojibase-data@18.0.0/en/shortcodes/emojibase.json) | Emojibase shortcode aliases | MIT |
| [Emojibase GitHub shortcodes](https://cdn.jsdelivr.net/npm/emojibase-data@18.0.0/en/shortcodes/github.json) | GitHub-style shortcodes | MIT |
| [Emojibase iamcal shortcodes](https://cdn.jsdelivr.net/npm/emojibase-data@18.0.0/en/shortcodes/iamcal.json) | iamcal-style shortcodes | MIT |
| [GitHub emojis API snapshot](https://api.github.com/emojis) | GitHub URL index only | GitHub API Terms |
| [GitHub gemoji database](https://raw.githubusercontent.com/github/gemoji/master/db/emoji.json) | GitHub aliases / metadata | MIT |
| [iamcal emoji-data](https://raw.githubusercontent.com/iamcal/emoji-data/master/emoji.json) | Skin tones and asset references | MIT |

Exact versions and checksums are in `data/sources/sources.json`. The GitHub API snapshot is subject to the GitHub API Terms; see [NOTICE](../NOTICE).

## Generated outputs

`npm run data:build` reads pinned cached inputs, verifies each sha256, normalizes and merges records, and writes deterministic JSON to `data/generated`:

- `emojis.json` — 1,958 emoji records with labels, shortcodes, tags, groups, skins, and variants.
- `aliases.json` — 3,983 unique canonical alias mappings (4,020 alias records before deduplication).
- `apps.json` — compiled app overlays.
- `assets.json` — 1,431 asset records (HTTPS URL references, not bundled artwork).
- `meta.json` — versions, counts, and pinned source list.
- `checksums.json` — sha256 for each generated data file.

Generated output contains no timestamps, so identical inputs always produce identical files. `data/generated` is committed to the repository; never edit it by hand.

## Commands

```sh
npm run data:build   # regenerate from pinned inputs
npm run data:check   # verify checksums and dataset invariants
npm run build        # sync generated data into dist and build outputs
npm run check        # typecheck + test + build
```

`npm run data:check` verifies that generated files still match their checksums and that expected counts / versions hold. The `emoji-kit check` CLI command performs a related runtime integrity check over published data; use `emoji-kit check --json` for machine-readable output.

## Security and privacy posture

- Raw JSON is treated as untrusted: build tooling validates and normalizes it; runtime lookups never execute it.
- All URLs are HTTPS. No `eval` or equivalent dynamic execution is used.
- No network calls at runtime — the core imports checked-in JSON only.
- Remote asset URLs are opt-in via `allowRemoteAssets`; native rendering uses Unicode characters.

## Updating sources

1. Change the pinned version and sha256 in `data/sources/sources.json` deliberately.
2. Run `npm run data:build`, review the generated diff, and run `npm run data:check`.
3. Update [NOTICE](../NOTICE) if licenses or source URLs change, and add a CHANGELOG entry for notable data changes.

The manual `data-refresh` GitHub Actions workflow can rebuild data in CI and fails if checksums drift without a commit; it does not auto-commit changes.
