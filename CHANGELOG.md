# Changelog

All notable changes to this project are documented here. This project follows semantic versioning.

## Unreleased — agent resource platform (v0.2)

_Not yet published; `package.json` remains at 0.1.0 and no v0.2 release has been made._

- Offline raw-resource catalog: 8 pinned sources, 17,026 files (17,018 artwork + 8 license records), 190,371,148 bytes, generated deterministically from `resources/manifest.json` with each record's source commit, HTTPS URL, license, sha256 and byte size.
- New resource API: `getResource`, `listResources` and `resolveResource`, plus the `resources`, `resourceSources` and `resourceCatalog` data exports, available on the root, `emoji-kit/core` and `emoji-kit/data` entries (no new subpath).
- Agent integration docs and runnable examples: `llms.txt`, `docs/agent-resource-contract.md`, `docs/agents.md` and `examples/`. These are repository-hosted and fetched from a pinned commit; they are not shipped in the npm tarball.
- The npm tarball ships only the runtime API and the generated catalog — no artwork, docs or examples.
- WeChat and Weibo artwork are unofficial GPL-3.0 community collections, while TikTok and Douyin artwork are MIT-licensed community collections; none are official or affiliated with those platforms.

## 0.1.0

Initial release.

- ESM-first, zero-runtime-dependency emoji toolkit with a browser-safe core and no runtime network calls.
- Default `emoji` callable plus `createEmojiKit` / `createKit`, `get`, `search`, `list`, and `renderText` exports.
- Lookup by name, shortcode, Unicode character, or hex code (for example `thumbsup`, `+1`, `👍`, `1F44D`).
- Definition calls for skin tone and gender variants, plus reusable references via `emoji.define()`.
- Ten curated app-category overlays with namespaced shortcodes such as `:tiktok/fire:`.
- Plain-text `renderText()` that never emits HTML.
- Subpath exports: `emoji-kit/core`, `emoji-kit/data`, `emoji-kit/apps`, `emoji-kit/react`, `emoji-kit/cli`.
- CLI with `get`, `search`, `list`, `render`, `apps`, and `check` commands and `--json` output.
- Thin React adapter with `useEmojiKit()` and `emojiProps(input)`.
- Deterministic generated dataset: Unicode / Emoji 18.0, CLDR 49, 1,958 emojis, 3,983 unique shortcode aliases, 1,431 asset records; pinned sources with sha256 checksums.
- MIT license and third-party data notices in `NOTICE`.
