# Contributing to emoji-kit

Thanks for helping improve emoji-kit. This project is small on purpose: a browser-safe core, a deterministic data pipeline, and documentation that stays clean for a public audience.

## Development workflow

1. Fork or clone the repository at https://github.com/zqs1qiwan/emoji and create a focused branch.
2. Install dependencies once with `npm install` (Node.js 18+). For documentation-only changes you do not need installs or network access.
3. Make your change in the right place:
   - API behavior and types: `src/**`, with tests in `tests/**`.
   - Pinned source definitions and curated app overlays: `data/sources/**`.
   - Docs, examples, and workflows: `README.md`, `AGENTS.md`, `CONTRIBUTING.md`, `CHANGELOG.md`, `LICENSE`, `NOTICE`, `docs/**`, `.github/workflows/**`, `examples/**`.
   - Never hand-edit `data/generated/**` or `dist/**`.
4. Run the checks below, then open a pull request describing the change and the checks you ran.

## Checks

```sh
npm test             # core behavior tests
npm run typecheck    # TypeScript declarations and source
npm run build        # sync generated data + build dist
npm run check        # typecheck + test + build
npm run check:public # public documentation hygiene
```

Run `npm run check` and `npm run check:public` before requesting review. CI performs `npm ci`, `npm run check`, and `npm run check:public` on Node 20 and Node 22.

## Data pipeline

Generated data lives in `data/generated` and is committed so the published package never fetches anything at runtime. Source definitions are pinned with sha256 hashes in `data/sources/sources.json`; curated app overlays live in `data/sources/app-categories.json`.

```sh
npm run data:build   # regenerate data/generated from pinned inputs
npm run data:check   # verify checksums and invariants
```

When updating data:

- Pin the new source version and its sha256 explicitly. Do not silently accept changing upstream content.
- Regenerate rather than editing generated JSON by hand. `data/generated/checksums.json` must match the generated files.
- Review the resulting diff for unintended churn; generated output must be deterministic (no timestamps).
- Remember that app categories are curated overlays, not official app datasets. Keep disclaimer notes accurate in `data/sources/app-categories.json` and `NOTICE`.

The manual `data-refresh` workflow can regenerate data in CI and fails if checksums change without a corresponding commit; it never auto-commits.

## Public documentation hygiene

`npm run check:public` scans public files for local machine paths, install logs, cache directories, tool spill, debug notes, and binary artwork. When writing docs:

- Use Markdown links to external source URLs; never paste local absolute paths.
- Do not reference local caches, logs, or temporary files.
- Do not invent CI badges, package exports, scripts, or official app affiliations.
- Keep security claims accurate: raw JSON is untrusted, URLs are HTTPS-only, there is no `eval`, `renderText()` emits plain text only, and remote assets require `allowRemoteAssets`.

## Pull request expectations

- Keep the change focused and explain the motivation.
- Include tests for behavior changes and docs updates for user-facing changes.
- Add a CHANGELOG entry for notable user-visible changes.
- Confirm that no generated or forbidden files were modified accidentally.
- Respect the [MIT license](LICENSE) and third-party notices in [NOTICE](NOTICE).

See [AGENTS.md](AGENTS.md) for the concise rules AI coding agents should follow, and [architecture](docs/architecture.md) for how the pieces fit together.
