# Inspiration and design goals

emoji-kit started from a simple frustration: emoji support in JavaScript projects is usually either a tiny alias map that misses variants, or a large package that fetches data and artwork at runtime. We wanted a middle ground that is pleasant for application developers and safe to embed anywhere.

## Goals

- **One predictable API.** A single callable accepts names, aliases, characters, hex codes, and structured definitions. The same resolution rules apply everywhere.
- **Offline by default.** Generated JSON is checked in, so installing the package is enough. No CDN, no API key, no surprise requests.
- **Small and dependency-free.** Zero runtime dependencies, a browser-safe core, and no bundling of vendor artwork.
- **Data you can audit.** Pinned sources with sha256 hashes, deterministic builds, and checksums for generated files. See [data pipeline](data-pipeline.md).
- **Convenient app conventions without false authority.** Curated overlays make common shortcodes work across familiar services, while clear disclaimers make it explicit that they are not official datasets. See [app categories](app-categories.md).
- **Safe output.** Untrusted JSON is normalized, there is no `eval`, URLs are HTTPS-only, and text rendering produces plain text rather than HTML.

## Non-goals

- Pixel-perfect reproduction of any platform's or app's emoji artwork.
- Bundling proprietary images, fonts, or private/authenticated emoji sets (workspace, guild, or channel emotes).
- Acting as an authoritative registry of every app's current shortcodes.
- Providing a React state-management system; the React entry is intentionally a thin adapter.

## Thanks

The dataset is only possible because of the public projects and standards listed in [NOTICE](../NOTICE): Unicode and CLDR, iamcal emoji-data, Emojibase, and gemoji, with the GitHub emojis API used only as a pinned URL index. emoji-kit is not affiliated with any of the services named in its curated categories.
