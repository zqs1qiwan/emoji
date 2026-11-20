# Rules for AI coding agents

These rules apply to any agent contributing to `emoji-kit`. Keep changes small, public-facing, and reproducible.

## Consumer versus contributor usage

Coding agents and package consumers use the package API; they do not need the repository tree to resolve catalog metadata. Start with `llms.txt`, then read `docs/agents.md` and `docs/agent-resource-contract.md` from a pinned GitHub commit. The npm tarball does not ship those repository-only files or `examples/`; it ships the programmatic API and generated catalog. Contributor rules below apply to source and documentation changes, not consumers of the package.

## Where to change things

- **Behavior and API:** edit TypeScript under `src/**`. Add or update tests under `tests/**`.
- **Data source definitions:** edit only the human-maintained inputs under `data/sources/**` (for example `sources.json` and `app-categories.json`).
- **Generated data:** never hand-edit `data/generated/**` or any `dist/**` output. Regenerate with `npm run data:build` and build with `npm run build`.
- **Build tooling:** scripts live in `scripts/**`. Do not change package metadata (`package.json`, `tsconfig.json`) without an explicit human request.
- **Docs and examples:** `README.md`, `AGENTS.md`, `CONTRIBUTING.md`, `CHANGELOG.md`, `LICENSE`, `NOTICE`, `docs/**`, `.github/workflows/**`, `examples/**`.

## Non-negotiables

1. **No runtime dependencies and no network calls in shipped code.** The core must remain browser-safe and work offline; generated JSON is checked in for this reason.
2. **Treat all raw JSON as untrusted.** Validate and normalize inputs. Never use `eval` or equivalent dynamic code execution.
3. **HTTPS-only URLs** for any referenced assets; no proprietary or vendor artwork bundled. Remote assets are opt-in via `allowRemoteAssets`.
4. **`renderText()` must never emit HTML.** It returns plain text only.
5. **Respect generated-data checksums.** Change pinned sources deliberately, record sha256 hashes, and regenerate deterministically. Do not hand-patch generated files to make a test pass.
6. **Public hygiene:** no local absolute paths, developer machine paths, install logs, `.npm-cache` / `data/cache` artifacts, debug notes, or tool spill in public docs or committed sources. Never commit binary artwork to public docs.
7. **No invented API, commands, or CI status.** Document only exports and scripts that exist. Do not claim official affiliation with any app or platform named in a curated category.

## Checks to run before handing back

```sh
npm test
npm run typecheck
npm run build
npm run data:check
npm run check          # typecheck + test + build
npm run check:public   # public hygiene
```

Run `npm run check` and `npm run check:public` at minimum. If you change pinned data sources, run `npm run data:build` first and confirm the generated diffs are intentional. Do not run installs or network calls as part of documentation-only work.

## Review expectations

Explain what changed and why, list the checks you ran, and call out any generated files you intentionally regenerated. Keep PRs focused; see [CONTRIBUTING.md](CONTRIBUTING.md) for the full workflow.
