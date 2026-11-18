# Changelog

All notable changes to this project are documented here. This project follows semantic versioning.

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
