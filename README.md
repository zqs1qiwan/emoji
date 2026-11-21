# emoji-kit

[![npm version](https://img.shields.io/npm/v/emoji-kit.svg)](https://www.npmjs.com/package/emoji-kit)
[![license: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

**中文 | [English](#english)**

面向 JavaScript / TypeScript 的快速、带类型、按 App 分类的 Emoji 工具包。一个小型 ESM 优先包提供 Unicode emoji 查询、shortcode 别名、肤色与性别变体、App 分类别名、纯文本渲染和命令行工具——**零运行时依赖**、**核心可在浏览器运行**、**运行时不联网**。

数据集由固定来源生成并带 sha256 校验，直接签入仓库；安装后开箱即用、离线可用。App 分类均为**社区非官方整理**，仅作为 Unicode 基础数据之上的便捷别名与分组，不代表官方数据集或官方渲染效果。

- [English](#english)
- [为什么选择 emoji-kit / Why emoji-kit](#为什么选择-emoji-kit--why-emoji-kit)
- [安装与快速开始 / Install and quick start](#安装与快速开始--install-and-quick-start)
- [定义式调用 / Definition calls](#定义式调用--definition-calls)
- [App 分类 / App categories](#app-分类--app-categories)
- [AI Agent 与资源访问 / AI agents and resource access](#ai-agent-与资源访问--ai-agents-and-resource-access)
- [CLI、React 与导出 / CLI, React and exports](#cli-react-与导出--cli-react-and-exports)
- [数据、隐私与安全 / Data, privacy and security](#数据隐私与安全--data-privacy-and-security)
- [开发 / Development](#开发--development)
- [致谢与许可 / Credits and license](#致谢与许可--credits-and-license)

## 为什么选择 emoji-kit / Why emoji-kit

**中文**

- **一个函数，多种输入**：`emoji('thumbsup')`、`emoji('+1')`、`emoji('👍')`、`emoji('1F44D')` 都返回 `👍`。
- **定义式变体调用**：通过普通对象组合肤色与性别，如 `emoji({ name: 'technologist', gender: 'female', tone: 2 })`。
- **28 个 App / 平台分类**：覆盖 TikTok / 抖音、红果短剧、微信、微博、小红书、哔哩哔哩、QQ、快手、淘宝、拼多多、美团、GitHub、Discord、Slack、WhatsApp、Telegram、X / Twitter、Facebook、Twitch、Snapchat、Reddit、LinkedIn、YouTube、Threads、Pinterest，以及原生平台分类。均为非官方便利分组。
- **安全渲染**：`renderText()` 把 `:shortcode:` 替换为 Unicode 字符，**绝不输出 HTML**；原始 JSON 按不可信输入处理，无 `eval`，URL 仅允许 HTTPS。
- **隐私优先**：原生平台 emoji 使用 Unicode 字符；远程资源 URL 必须通过 `allowRemoteAssets` 显式开启；不捆绑任何厂商美术资源。
- **类型完善、可 tree-shake**：完整 TypeScript 声明，`sideEffects: false`，提供 `core`、`data`、`apps`、`react`、`cli` 子路径导出。
- **额外原始资源库**：仓库中的 `resources/**` 单独保存 8 个固定公开来源的原始文件（Twemoji、OpenMoji、Noto Emoji、Fluent Emoji，以及社区整理的 TikTok / 抖音 / 微信 / 微博表情），共 17,026 个文件；按来源和 App 保留原始目录，并通过 `resources/manifest.json` 记录 commit、URL、许可证、sha256 和文件大小。该资源库不参与 npm 包，也不会混入运行时数据。
- **确定性数据**：Unicode / Emoji 18.0、CLDR 49，1,958 个 emoji、3,983 个唯一 shortcode（4,020 条别名记录）、1,431 条资源记录、28 个 App 分类和 612 个 App 标签；由固定来源和 sha256 校验确定性重建，无时间戳。

**English**

- **One callable, many inputs.** `emoji('thumbsup')`, `emoji('+1')`, `emoji('👍')`, and `emoji('1F44D')` all resolve to the same emoji.
- **Definition calls for variants.** Compose skin tone and gender with plain objects: `emoji({ name: 'technologist', gender: 'female', tone: 2 })`.
- **28 curated app/platform categories.** Covers TikTok/Douyin, Hongguo Short Drama, WeChat, Weibo, Xiaohongshu, Bilibili, QQ, Kuaishou, Taobao, Pinduoduo, Meituan, GitHub, Discord, Slack, WhatsApp, Telegram, X/Twitter, Facebook, Twitch, Snapchat, Reddit, LinkedIn, YouTube, Threads, Pinterest, and native platforms. All are unofficial convenience overlays.
- **Safe rendering.** `renderText()` replaces `:shortcode:` tokens with Unicode characters and **never emits HTML**. Raw JSON is treated as untrusted; no `eval`; all referenced URLs are HTTPS.
- **Privacy-friendly by default.** Native platform emoji uses Unicode characters. Remote asset URLs are opt-in only via `allowRemoteAssets`, and no proprietary artwork is bundled.
- **Typed and tree-shakeable.** Full TypeScript declarations, `sideEffects: false`, and focused subpath exports (`core`, `data`, `apps`, `react`, `cli`).
- **Extra raw resource library.** The repository preserves 17,026 original files from eight pinned public sources under `resources/**` (Twemoji, OpenMoji, Noto Emoji, Fluent Emoji, and community TikTok/Douyin/WeChat/Weibo collections). Original per-source/app structure is retained; `resources/manifest.json` records commits, URLs, licenses, sha256 hashes, and sizes. This library is excluded from the npm package and never merged into runtime data.
- **Deterministic data.** Unicode/Emoji 18.0 and CLDR 49 data, 1,958 emojis, 3,983 unique shortcode aliases (4,020 alias records), 1,431 asset records, 28 curated app categories and 612 app tags — rebuilt from pinned sources with sha256 checksums.

## 安装与快速开始 / Install and quick start

**中文**

需要 Node.js 18 或更新版本；核心也支持浏览器及其他标准 ESM 环境。

```sh
npm install emoji-kit
```

```js
import emoji, { createEmojiKit, get, search, list, renderText } from 'emoji-kit';

emoji('thumbsup');                 // 👍
emoji('+1');                       // 👍
emoji('👍');                       // 👍
emoji('1F44D');                    // 👍

get('thumbsup')?.char;             // '👍'
search('thumbs up', { limit: 5 }); // 已准备好的 emoji 数组
list({ app: 'github', limit: 5 }); // GitHub 分类下的 emoji 数组
renderText('Hi :thumbsup: :tiktok/fire:'); // 'Hi 👍 🔥'
```

每次调用返回准备好的对象（未知输入返回 `undefined`），包含 `id`、`name`、`label`、`char`、`hexcode`、`shortcode`、`platform`、`variants` 等字段，以及可选的 `app` / `assetUrl`。

需要隔离实例时使用 `createEmojiKit()` / `createKit()`：

```js
import { createEmojiKit } from 'emoji-kit';
// import { createKit } from 'emoji-kit/core'; // createEmojiKit 的别名

const kit = createEmojiKit();
kit.search('fire', { limit: 3 });
kit.list({ app: 'tiktok' });
```

完整方法与选项见 [API 参考](docs/api.md)。

**English**

Requires Node.js 18 or newer. The core also runs in browsers and other standard ESM environments.

```sh
npm install emoji-kit
```

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

## AI Agent 与资源访问 / AI agents and resource access

**中文**：AI 编码 Agent 应先读取仓库根目录的 [llms.txt](llms.txt)，再按需使用 [Agent 集成指南](docs/agents.md) 和 [v0.2 资源契约](docs/agent-resource-contract.md)。包内提供离线 Unicode API 与原始资源目录：字符、shortcode、搜索、纯文本渲染使用 `emoji` / `get` / `search` / `list` / `renderText`；需要固定来源的 SVG/PNG/许可证元数据时使用 `getResource` / `resolveResource` / `listResources`。打包器不会在 npm 包内提供文档或示例；仓库中的 `llms.txt`、`docs/`、`examples/` 应从固定 emoji-kit commit 的 GitHub raw URL 获取。`emoji-kit/resources` 子路径和 `resources` CLI 命令不存在于 v0.2。

```js
import { resolveResource, listResources } from 'emoji-kit';

const one = resolveResource({ sourceId: 'wechat-community-png', format: 'png' });
const many = listResources({ app: 'weibo', format: 'png', limit: 3 });
```

目录只有元数据；资源获取是调用方的显式操作。使用返回记录的 `url` 和 `sha256`，不得猜测或重构 URL，并遵守 `license`。当前目录含 8 个来源、17,026 条记录（17,018 个美术资源、8 个许可证），打包在包内。可运行示例：`node examples/agent-catalog.mjs`；可选网络校验示例：`node examples/fetch-resource.mjs`。

**English**: Coding agents should start with the repository [llms.txt](llms.txt), then use [Agent integration guide](docs/agents.md) and [the v0.2 resource contract](docs/agent-resource-contract.md). The package exposes an offline Unicode API and raw-resource catalog: use `emoji` / `get` / `search` / `list` / `renderText` for characters, shortcodes, search, and plain-text rendering; use `getResource` / `resolveResource` / `listResources` for pinned SVG/PNG/license metadata. The npm tarball does not ship repository docs or examples. Fetch `llms.txt`, `docs/`, and `examples/` from raw GitHub URLs pinned to an exact emoji-kit commit. There is no `emoji-kit/resources` subpath or `resources` CLI command in v0.2.

```js
import { resolveResource, listResources } from 'emoji-kit';

const one = resolveResource({ sourceId: 'wechat-community-png', format: 'png' });
const many = listResources({ app: 'weibo', format: 'png', limit: 3 });
```

The catalog is metadata only. Fetching a file is an explicit caller action. Use the returned record's `url` and `sha256`; never guess or reconstruct URLs, and respect `license`. The current catalog contains 8 sources and 17,026 records (17,018 artwork assets and 8 licenses) and is shipped inside the package. Runnable example: `node examples/agent-catalog.mjs`; opt-in network verification: `node examples/fetch-resource.mjs`.

**资源目录覆盖 / Resource catalog coverage**

| Source id | App | Format | Artwork records |
| --- | --- | --- | --- |
| twemoji-svg | native | svg | 4009 |
| openmoji-color-svg | native | svg | 4567 |
| noto-emoji-2d-png-128 | native | png | 3787 |
| fluent-emoji-color-svg | native | svg | 3145 |
| douyin-community-png | douyin | png | 415 |
| tiktok-community-svg | tiktok | svg | 46 |
| wechat-community-png | wechat | png | 106 |
| weibo-community-png | weibo | png | 943 |

Total: 17,026 files (17,018 artwork + 8 license records). The WeChat and Weibo collections are GPL-3.0 community collections, while the TikTok and Douyin collections are MIT-licensed community collections; all are unofficial and non-affiliated.

## 定义式调用 / Definition calls

**中文**

传入对象即可选择变体、App 别名或资源：

```js
emoji({ name: 'thumbsup', tone: 2 });
// char: '👍🏼', hexcode: '1F44D-1F3FC'

emoji({ name: 'technologist', gender: 'female', tone: 2 });
// char: '👩🏼‍💻', hexcode: '1F469-1F3FC-200D-1F4BB'
```

`emoji.define()` 会把定义保存为可复用引用，之后可再次解析：

```js
const ref = emoji.define({ name: 'fire', app: 'tiktok' });
emoji(ref); // 🔥（按 TikTok 非官方别名解析）
```

远程资源 URL 默认不返回，必须显式开启：

```js
emoji({ name: 'thumbsup', platform: 'github', allowRemoteAssets: true });
// 仅在存在匹配记录时返回远程 assetUrl
```

**English**

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

## App 分类 / App categories

**中文**

App 分类是建立在 Unicode 基础数据上的**非官方别名/分组层**，不是 App 官方数据集。它们提供便捷别名、分组和 `:app/alias:` 文本命名空间：

```js
renderText('Ship it :github/rocket: :tiktok/fire:');
emoji({ name: 'ship', app: 'github' }); // GitHub 别名 -> rocket
```

当前 28 个分类 id：

`tiktok`（TikTok / 抖音）、`douyin`、`hongguo`（红果短剧）、`kuaishou`、`xiaohongshu`、`wechat`、`weibo`、`bilibili`、`qq`、`taobao`、`pinduoduo`、`meituan`、`instagram`、`github`、`discord`、`slack`、`whatsapp`、`telegram`、`twitter`、`facebook`、`reddit`、`linkedin`、`youtube`、`threads`、`pinterest`、`twitch`、`snapchat`、`native`。

中文 App 分类基于公开用法和常见文案场景做保守整理，没有公开官方 shortcode 清单；红果短剧等分类仅表达观后感、弹幕、追剧等 Unicode emoji 便利分组，不是官方表情集合。原生平台分类按公开资料整理 Apple、Google、Samsung、Microsoft 等设计来源，不捆绑或承诺与其像素级一致。详见 [App 分类说明](docs/app-categories.md) 与 [平台与资源](docs/platforms-and-assets.md)。

**English**

App categories are **curated alias/variant overlays over Unicode base data**, not official app datasets. They provide convenient aliases, groupings, and a namespace for text shortcodes:

```js
renderText('Ship it :github/rocket: :tiktok/fire:');
emoji({ name: 'ship', app: 'github' }); // GitHub alias -> rocket
```

Current 28 app ids:

`tiktok` (TikTok/Douyin), `douyin`, `hongguo` (Hongguo Short Drama), `kuaishou`, `xiaohongshu`, `wechat`, `weibo`, `bilibili`, `qq`, `taobao`, `pinduoduo`, `meituan`, `instagram`, `github`, `discord`, `slack`, `whatsapp`, `telegram`, `twitter`, `facebook`, `reddit`, `linkedin`, `youtube`, `threads`, `pinterest`, `twitch`, `snapchat`, `native`.

Chinese app overlays are conservative community groupings based on public usage and common caption/comment scenarios; no official shortcode registry is claimed. Hongguo Short Drama, for example, groups Unicode emoji for short-drama reactions, danmaku and binge-watching captions only. Native platform groupings reference publicly documented design families without bundling artwork or promising pixel-identical rendering. See [app categories](docs/app-categories.md) and [platforms & assets](docs/platforms-and-assets.md) for details, including the GitHub API Terms notice.

## CLI、React 与导出 / CLI, React and exports

**中文**

```sh
emoji-kit get thumbsup
emoji-kit get '👍'
emoji-kit search fire --app tiktok --limit 5
emoji-kit list --app github --limit 10
emoji-kit render 'Hi :thumbsup: :tiktok/fire:'
emoji-kit apps --json
emoji-kit check --json
```

任意命令可加 `--json` 输出机器可读格式；`get` 接受名称、字符或十六进制码。详见 [CLI 参考](docs/cli.md)。

| 导入路径 | 内容 |
| --- | --- |
| `emoji-kit` | 默认可调用 `emoji`，以及 `createEmojiKit`、`get`、`search`、`list`、`renderText` |
| `emoji-kit/core` | 核心 API 及 `createKit`（`createEmojiKit` 的别名） |
| `emoji-kit/data` | 生成的 `emojis`、`aliases`、`apps`、`assets`、`metadata` |
| `emoji-kit/apps` | App 定义（与 `emoji-kit/data` 相同的数据视图） |
| `emoji-kit/react` | 轻量 React 适配：`useEmojiKit()`、`emojiProps(input)` |
| `emoji-kit/cli` | CLI 入口（也可通过 `emoji-kit` 命令使用） |

`emoji-kit/react` 是无 peer dependency、无 hook 内部实现的轻量适配层：

```tsx
import { emojiProps, useEmojiKit } from 'emoji-kit/react';

function Badge() {
  const kit = useEmojiKit();
  return <span {...emojiProps({ name: 'thumbsup', tone: 2 })} />;
}
```

`emojiProps(input)` 返回可访问属性（`role="img"`、`aria-label` 和 emoji 字符作为 children），未知输入返回 `undefined`。详见 [React 指南](docs/react.md)。

**English**

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

| Import | What you get |
| --- | --- |
| `emoji-kit` | Default callable `emoji`, plus `createEmojiKit`, `get`, `search`, `list`, `renderText` |
| `emoji-kit/core` | Core API and the `createKit` alias of `createEmojiKit` |
| `emoji-kit/data` | Generated `emojis`, `aliases`, `apps`, `assets`, `metadata` |
| `emoji-kit/apps` | App definitions (same data view as `emoji-kit/data`) |
| `emoji-kit/react` | Thin React adapter: `useEmojiKit()`, `emojiProps(input)` |
| `emoji-kit/cli` | CLI entry point (also available as the `emoji-kit` binary) |

`emoji-kit/react` is a thin adapter with no peer dependency and no hooks:

```tsx
import { emojiProps, useEmojiKit } from 'emoji-kit/react';

function Badge() {
  const kit = useEmojiKit();
  return <span {...emojiProps({ name: 'thumbsup', tone: 2 })} />;
}
```

`emojiProps(input)` returns accessible props (`role="img"`, `aria-label`, and the emoji character as children) or `undefined` for unknown input. See [React guide](docs/react.md).

## 数据、隐私与安全 / Data, privacy and security

**中文**

- 生成的 JSON 签入 `data/generated`，导入包时**不会访问网络或文件系统**。
- 来源在 `data/sources/sources.json` 中用 sha256 固定；生成文件另有校验和。可通过 `npm run data:build` 重建、通过 `npm run data:check` 校验。
- 所有原始 JSON 按不可信输入处理；URL 仅 HTTPS；无 `eval`；`renderText()` 只返回纯文本，绝不返回 HTML。
- 远程资源必须显式设置 `allowRemoteAssets: true`。详见 [数据管线](docs/data-pipeline.md) 与 [架构](docs/architecture.md)。
- 仓库另有一个**原始资源库** `resources/**`，从固定公开仓库收集并按来源/App 保留目录；`resources/manifest.json` 记录来源、commit、许可证、sha256 与文件大小，可用 `node scripts/collect-resources.mjs --check` 校验。它不是运行时依赖，也不在 npm 包内；单个文件的再使用需遵守其上游许可证。

**English**

- Generated JSON is checked in under `data/generated`, so importing the package performs **no network or filesystem access**.
- Sources are pinned with sha256 hashes in `data/sources/sources.json`; generated files have their own checksums. Rebuild with `npm run data:build` and verify with `npm run data:check`.
- All raw JSON is treated as untrusted input. URLs are HTTPS-only, there is no `eval`, and `renderText()` returns plain text — never HTML.
- Remote assets require an explicit `allowRemoteAssets: true`. See [data pipeline](docs/data-pipeline.md) and [architecture](docs/architecture.md).
- The repository also contains a **raw resource library** under `resources/**`, collected from pinned public repositories with original per-source/app structure preserved. `resources/manifest.json` records sources, commits, licenses, sha256 hashes, and sizes; verify it with `node scripts/collect-resources.mjs --check`. It is not a runtime dependency and is excluded from the npm package; reuse of individual files must follow the applicable upstream license.

## 开发 / Development

**中文**：运行 `npm run check` 执行类型检查、测试与构建，运行 `npm run check:public` 检查公开文档卫生。贡献前请阅读 [CONTRIBUTING.md](CONTRIBUTING.md) 与 [AGENTS.md](AGENTS.md)。

**English**: Run `npm run check` to typecheck, test, and build, and `npm run check:public` to enforce public-documentation hygiene. See [CONTRIBUTING.md](CONTRIBUTING.md) and [AGENTS.md](AGENTS.md) before opening a pull request.

## 致谢与许可 / Credits and license

**中文**：`emoji-kit` 本身使用 [MIT 许可证](LICENSE)，第三方数据声明见 [NOTICE](NOTICE)。数据来源包括 [Unicode emoji data](https://www.unicode.org/emoji/)（Unicode-3.0）、[CLDR annotations](https://cldr.unicode.org/)（Unicode-3.0）、[iamcal emoji-data](https://github.com/iamcal/emoji-data)（MIT）、[Emojibase](https://github.com/milesj/emojibase)（MIT）、[GitHub gemoji](https://github.com/github/gemoji)（MIT）和 [GitHub emojis API](https://api.github.com/emojis)（仅 URL 索引，受 GitHub API Terms 约束）。App 分类的公开参考包括 [Emojipedia 的 TikTok](https://emojipedia.org/tiktok)、[Snapchat](https://emojipedia.org/snapchat)、[Facebook](https://emojipedia.org/facebook)、[Discord](https://emojipedia.org/discord)、[Slack](https://emojipedia.org/slack)、[Telegram](https://emojipedia.org/telegram)、[Instagram](https://emojipedia.org/instagram)、[Twitch](https://emojipedia.org/twitch) 和 [Unicode 18.0 图表](https://www.unicode.org/emoji/charts-18.0/full-emoji-list.html)。本项目的非官方整理不隶属于任何列出的平台或 App，所有商标归各自所有者。

欢迎贡献——从 [CONTRIBUTING.md](CONTRIBUTING.md) 开始，设计动机见 [inspiration notes](docs/inspiration.md)。

**English**: `emoji-kit` itself is released under the [MIT License](LICENSE). Third-party data notices are in [NOTICE](NOTICE). Data sources include [Unicode emoji data](https://www.unicode.org/emoji/) (Unicode-3.0), [CLDR annotations](https://cldr.unicode.org/) (Unicode-3.0), [iamcal emoji-data](https://github.com/iamcal/emoji-data) (MIT), [Emojibase](https://github.com/milesj/emojibase) (MIT), [GitHub gemoji](https://github.com/github/gemoji) (MIT), and the [GitHub emojis API](https://api.github.com/emojis) (URL index only, subject to GitHub API Terms). Public references for curated overlays include Emojipedia pages for [TikTok](https://emojipedia.org/tiktok), [Snapchat](https://emojipedia.org/snapchat), [Facebook](https://emojipedia.org/facebook), [Discord](https://emojipedia.org/discord), [Slack](https://emojipedia.org/slack), [Telegram](https://emojipedia.org/telegram), [Instagram](https://emojipedia.org/instagram), [Twitch](https://emojipedia.org/twitch), and the [Unicode 18.0 charts](https://www.unicode.org/emoji/charts-18.0/full-emoji-list.html). These unofficial overlays are not affiliated with any listed service; all trademarks belong to their respective owners.

Contributions are welcome — start with [CONTRIBUTING.md](CONTRIBUTING.md), and see the [inspiration notes](docs/inspiration.md) for the project's design motivation.

<a id="english"></a>

## English

This README is bilingual throughout: every major section includes Chinese (**中文**) and English (**English**) text. The quick navigation above links to each section; all API, CLI, data, and license details are presented in both languages. The project itself uses the same implementation for both audiences: zero runtime dependencies, browser-safe core, no runtime network calls, deterministic checked-in data, 28 unofficial curated app/platform categories, and plain-text-only rendering.
