# emoji-kit

[![npm version](https://img.shields.io/npm/v/emoji-kit.svg)](https://www.npmjs.com/package/emoji-kit)
[![license: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

A fast, typed, app-aware emoji toolkit for JavaScript and TypeScript. One small ESM-first package gives you Unicode emoji lookup, shortcode aliases, skin-tone and gender variants, curated app overlays, text rendering, and a CLI — with **zero runtime dependencies**, a **browser-safe core**, and **no runtime network calls**.

The dataset is generated from pinned, checksummed public sources and checked into the repository. Install the package and it just works, offline.

## Why emoji-kit?

- **One callable, many inputs.** `emoji('thumbsup')`, `emoji('+1')`, `emoji('👍')`, and `emoji('1F44D')` all resolve to the same emoji.
- **Definition calls for variants.** Compose skin tone and gender with plain objects: `emoji({ name: 'technologist', gender: 'female', tone: 2 })`.
- **App-aware overlays.** Ten curated categories (TikTok, Instagram, GitHub, Discord, Slack, WhatsApp, Telegram, X / Twitter, Facebook, Twitch) add aliases and groupings on top of Unicode base data. Use `:tiktok/fire:` in text.
- **Safe rendering.** `renderText()` replaces `:shortcode:` tokens with Unicode characters and **never emits HTML**. Raw JSON is treated as untrusted; no `eval`; all referenced URLs are HTTPS.
- **Privacy-friendly by default.** Native platform emoji uses Unicode characters. Remote asset URLs are opt-in only via `allowRemoteAssets`, and no proprietary artwork is bundled.
- **Typed and tree-shakeable.** Full TypeScript declarations, `sideEffects: false`, and focused subpath exports (`core`, `data`, `apps`, `react`, `cli`).
- **Deterministic data.** Unicode / Emoji 18.0 and CLDR 49 data, 1,958 emojis, 3,983 unique shortcode aliases (4,020 alias records), and 1,431 asset records — rebuilt from pinned sources with sha256 checksums.

## Install

```sh
npm install emoji-kit
```

Requires Node.js 18 or newer. The core also runs in browsers and other standard ESM environments.

## Quick start

```js
import emoji, { createEmojiKit, get, search, list, renderText } from 'emoji-kit';

emoji('thumbsup');                 // 👍
emoji('+1');                       // 👍
emoji('👍');                       // 👍
emoji('1F44D');                    // 👍

get('thumbsup')?.char;             // '👍'
search('thumbs up', { limit: 5 }); // array of prepared emoji
list({ app: 'github', limit: 5 }); // array of prepared emoji
renderText('Hi :thumbsup: :tiktok/fire:'); // 'Hi 👍 🔥'
```

Each call returns a prepared object (or `undefined` for unknown input) with fields such as `id`, `name`, `label`, `char`, `hexcode`, `shortcode`, `platform`, `variants`, and optional `app` / `assetUrl`.

Use `createEmojiKit()` / `createKit()` when you want an isolated kit with its own prebuilt indexes:

```js
import { createEmojiKit } from 'emoji-kit';
// import { createKit } from 'emoji-kit/core'; // alias of createEmojiKit

const kit = createEmojiKit();
kit.search('fire', { limit: 3 });
kit.list({ app: 'tiktok' });
```

See [the API reference](docs/api.md) for all methods and options.

## Definition calls

Pass an object to select a variant, an app overlay, or an asset:

```js
emoji({ name: 'thumbsup', tone: 2 });
// char: '👍🏼', hexcode: '1F44D-1F3FC'

emoji({ name: 'technologist', gender: 'female', tone: 2 });
// char: '👩🏼‍💻', hexcode: '1F469-1F3FC-200D-1F4BB'
```

`emoji.define()` captures a definition as a reusable reference, so it can be resolved later:

```js
const ref = emoji.define({ name: 'fire', app: 'tiktok' });
emoji(ref); // 🔥 (resolved against TikTok's curated aliases)
```

Remote asset URLs are **never returned by default**. Opt in explicitly:

```js
emoji({ name: 'thumbsup', platform: 'github', allowRemoteAssets: true });
// assetUrl is a remote URL only when a matching record exists
```

## App categories

App categories are **curated alias/variant overlays over Unicode base data**, not official app datasets. They provide convenient aliases, groupings, and a namespace for text shortcodes:

```js
renderText('Ship it :github/rocket: :tiktok/fire:');
emoji({ name: 'ship', app: 'github' }); // GitHub alias -> rocket
```

Available app ids: `tiktok`, `instagram`, `github`, `discord`, `slack`, `whatsapp`, `telegram`, `twitter`, `facebook`, `twitch`.

Native platform emoji uses Unicode characters; we make no promise of pixel-identical rendering with any platform or app. No proprietary or vendor artwork is bundled, and we are not affiliated with TikTok, Instagram, GitHub, or any other listed service. See [app categories](docs/app-categories.md) and [platforms & assets](docs/platforms-and-assets.md) for details, including the GitHub API Terms notice.

## Subpath exports

| Import | What you get |
| --- | --- |
| `emoji-kit` | Default callable `emoji`, plus `createEmojiKit`, `get`, `search`, `list`, `renderText` |
| `emoji-kit/core` | Core API and the `createKit` alias of `createEmojiKit` |
| `emoji-kit/data` | Generated `emojis`, `aliases`, `apps`, `assets`, `metadata` |
| `emoji-kit/apps` | App definitions (same data view as `emoji-kit/data`) |
| `emoji-kit/react` | Thin React adapter: `useEmojiKit()`, `emojiProps(input)` |
| `emoji-kit/cli` | CLI entry point (also available as the `emoji-kit` binary) |

## CLI

```sh
emoji-kit get thumbsup
emoji-kit get '👍'
emoji-kit search 'fire' --app tiktok --limit 5
emoji-kit list --app github --limit 10
emoji-kit render 'Hi :thumbsup: :tiktok/fire:'
emoji-kit apps --json
emoji-kit check --json
```

Add `--json` to any command for machine-readable output. `get` accepts a name, character, or hex code. See [CLI reference](docs/cli.md).

## React

`emoji-kit/react` is a thin adapter with no peer dependency and no hooks:

```tsx
import { emojiProps, useEmojiKit } from 'emoji-kit/react';

function Badge() {
  const kit = useEmojiKit();
  return <span {...emojiProps({ name: 'thumbsup', tone: 2 })} />;
}
```

`emojiProps(input)` returns accessible props (`role="img"`, `aria-label`, and the emoji character as children) or `undefined` for unknown input. See [React guide](docs/react.md).

## Data, privacy, and security

- Generated JSON is checked in under `data/generated`, so importing the package performs **no network or filesystem access**.
- Sources are pinned with sha256 hashes in `data/sources/sources.json`; generated files have their own checksums. Rebuild with `npm run data:build` and verify with `npm run data:check`.
- All raw JSON is treated as untrusted input. URLs are HTTPS-only, there is no `eval`, and `renderText()` returns plain text — never HTML.
- Remote assets require an explicit `allowRemoteAssets: true`. See [data pipeline](docs/data-pipeline.md) and [architecture](docs/architecture.md).

## 中文说明 / 快速开始

`emoji-kit` 是一个零运行时依赖、可在浏览器中使用的 ESM 优先 emoji 工具包，内置确定的数据集，安装后无需联网即可使用。

```js
import emoji, { renderText } from 'emoji-kit';

emoji('thumbsup');   // 👍，也支持 '+1'、'👍'、'1F44D'
emoji({ name: 'technologist', gender: 'female', tone: 2 }); // 👩🏼‍💻
renderText('Hi :thumbsup: :tiktok/fire:'); // 'Hi 👍 🔥'
```

使用 `npm install emoji-kit` 安装，然后运行 `emoji-kit get thumbsup` 试试命令行。应用分类（如 TikTok、GitHub）是基于 Unicode 数据的社区整理别名，并非官方数据集；本文中的示例与商标归各自所有者所有。

## Development

Run `npm run check` to typecheck, test, and build, and `npm run check:public` to enforce public-documentation hygiene. See [CONTRIBUTING.md](CONTRIBUTING.md) and [AGENTS.md](AGENTS.md) before opening a pull request.

## Credits and license

emoji-kit itself is released under the [MIT License](LICENSE). Third-party data notices are in [NOTICE](NOTICE). Data sources include [Unicode emoji data](https://www.unicode.org/emoji/) (Unicode-3.0), [CLDR annotations](https://cldr.unicode.org/) (Unicode-3.0), [iamcal emoji-data](https://github.com/iamcal/emoji-data) (MIT), [Emojibase](https://github.com/milesj/emojibase) (MIT), [GitHub gemoji](https://github.com/github/gemoji) (MIT), and the [GitHub emojis API](https://api.github.com/emojis) (URL index only, subject to GitHub API Terms).

Contributions are welcome — start with [CONTRIBUTING.md](CONTRIBUTING.md), and see the [inspiration notes](docs/inspiration.md) for the project's design motivation.
