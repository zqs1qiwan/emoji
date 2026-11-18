# App 分类 / App categories

**中文 | [English](#english)**

emoji-kit 当前包含 **28 个 App / 平台分类（非官方整理）**：

`tiktok`（TikTok / 抖音）、`douyin`、`hongguo`（红果短剧）、`kuaishou`、`xiaohongshu`、`wechat`、`weibo`、`bilibili`、`qq`、`taobao`、`pinduoduo`、`meituan`、`instagram`、`github`、`discord`、`slack`、`whatsapp`、`telegram`、`twitter`、`facebook`、`reddit`、`linkedin`、`youtube`、`threads`、`pinterest`、`twitch`、`snapchat`、`native`。

**重要说明**：这些分类是建立在 Unicode 基础数据之上的**非官方别名与分组覆盖层**。它们不是上述 App 发布的官方数据集，不保证完整、最新或获得官方认可。中文 App 分类尤其只是常见文案、弹幕、评论等场景的保守 Unicode 表情分组，没有公开官方 shortcode 表；`hongguo` 表示红果短剧观后感和追剧场景，不是官方表情包。详见 [NOTICE](../NOTICE)。

**English**

emoji-kit currently includes **28 curated, unofficial app/platform categories**:

`tiktok` (TikTok/Douyin), `douyin`, `hongguo` (Hongguo Short Drama), `kuaishou`, `xiaohongshu`, `wechat`, `weibo`, `bilibili`, `qq`, `taobao`, `pinduoduo`, `meituan`, `instagram`, `github`, `discord`, `slack`, `whatsapp`, `telegram`, `twitter`, `facebook`, `reddit`, `linkedin`, `youtube`, `threads`, `pinterest`, `twitch`, `snapchat`, `native`.

**Important:** these categories are **curated alias and grouping overlays over Unicode base data**. They are not official datasets published by the named services, and are not guaranteed complete, current, or endorsed. Chinese app categories in particular are conservative Unicode groupings for common captions, danmaku and comments; no official shortcode registry is claimed. `hongguo` covers short-drama reactions and binge-watching scenarios and is not an official sticker set. See [NOTICE](../NOTICE).

## 覆盖层提供什么 / What an overlay provides

**中文**：每个 App 定义包含 `id` 与 `label`（命名空间和显示名）、`note`（来源与免责声明）、`source`（`curated`、`curated-zh` 或 `github-api`）、`categories`（如 `trending`、`reactions`、`captions`）以及 `aliases`（App 内别名到 emoji id 的映射）。覆盖层不会替换 Unicode 数据集；查询时先查 App 别名表，再回退到全局别名索引。

**English**: Each app definition has `id` and `label` (namespace and display name), `note` (provenance/disclaimer), `source` (`curated`, `curated-zh`, or `github-api`), `categories` (for example `trending`, `reactions`, `captions`), and `aliases` (app-scoped alias-to-emoji-id mappings). The overlays never replace the Unicode dataset. A lookup first consults the app alias map, then falls back to the global alias index.

## 使用 / Using an overlay

```js
import emoji, { renderText } from 'emoji-kit';

emoji({ name: 'fire', app: 'tiktok' });        // 🔥 (TikTok alias map)
emoji({ name: 'loveface', app: 'tiktok' });    // heart-eyes emoji
emoji({ name: 'ship', app: 'github' });        // rocket emoji
emoji({ name: 'hongbao', app: 'wechat' });     // gift emoji
emoji({ name: 'danmaku', app: 'bilibili' });   // speech balloon emoji

const ref = emoji.define({ name: 'fire', app: 'tiktok' });
emoji(ref);

renderText('Hi :thumbsup: :tiktok/fire:');     // 'Hi 👍 🔥'
renderText('Ship :github/rocket: :github/bug:');
```

未知的 App 或 shortcode 会保留原 token。筛选与查看定义：

```js
emoji.search('love', { app: 'tiktok', limit: 5 });
emoji.list({ app: 'github', limit: 10 });

import { apps } from 'emoji-kit/data'; // 或 'emoji-kit/apps'
console.log(Object.keys(apps));
console.log(apps.tiktok.categories.trending);
console.log(apps.hongguo.categories.drama);
```

## 来源与免责声明 / Provenance and disclaimers

### 中文

| 分类 | 来源风格 | 说明 |
| --- | --- | --- |
| `tiktok` | curated | 公开资料中的方括号暗语与短视频文案表情；与 TikTok / 字节跳动无隶属关系。 |
| `douyin` / `kuaishou` / `hongguo` | curated-zh | 中文短视频/地方 App 常见文案场景的非官方 Unicode 分组；无公开官方 shortcode 表。 |
| `hongguo` | curated-zh | 红果短剧的观后感、弹幕、追剧文案分组；不是红果短剧官方表情包。 |
| `xiaohongshu` / `wechat` / `weibo` / `bilibili` / `qq` / `taobao` / `pinduoduo` / `meituan` | curated-zh | 生活、社交、购物、本地服务等场景的便利分组；不包含厂商原创贴图。 |
| `instagram` | curated | 文案 / 故事 / 审美分组；无公开官方 shortcode 表。 |
| `github` | github-api | 来自固定的 GitHub emojis API / gemoji 快照；只引用 URL，不捆绑图片，受 GitHub API Terms 约束。 |
| `discord` | curated | 通用冒号 shortcode 约定；不含服务器自定义 emoji。 |
| `slack` | curated | 基于 iamcal/emoji-data 的通用 shortcode 约定；不含工作区自定义 emoji。 |
| `whatsapp` | curated | Unicode 表情别名；标准表情来自设备键盘。 |
| `telegram` | curated | 别名与公开资料中的互动表情场景；动画与自定义贴纸未捆绑。 |
| `twitter` | curated | X / Twitter 别名；Twemoji 是开源设计集但本项目不捆绑美术资源。 |
| `facebook` | curated | 公开反应的近似 Unicode 表达，不含专有动画。 |
| `reddit` / `linkedin` / `youtube` / `threads` / `pinterest` | curated | 社区、职场、视频、轻社交、灵感收藏等常见场景的便利分组。 |
| `twitch` | curated | 频道/全局 emote 需要官方鉴权 API，未捆绑；仅分组 Unicode 近似表达。 |
| `snapchat` | curated | 好友状态与 Snapstreak 公开含义的便利分组，不代表官方表情集。 |
| `native` | curated | 按公开资料整理 Apple、Google、Samsung、Microsoft 等设计来源；不捆绑图片，不承诺像素级一致。 |

公开参考包括 [Emojipedia TikTok](https://emojipedia.org/tiktok)、[Snapchat](https://emojipedia.org/snapchat)、[Facebook](https://emojipedia.org/facebook)、[Discord](https://emojipedia.org/discord)、[Slack](https://emojipedia.org/slack)、[Telegram](https://emojipedia.org/telegram)、[Instagram](https://emojipedia.org/instagram)、[Twitch](https://emojipedia.org/twitch)、[Unicode 18.0](https://www.unicode.org/emoji/charts-18.0/full-emoji-list.html) 以及 [iamcal/emoji-data](https://github.com/iamcal/emoji-data)、[Emojibase](https://github.com/milesj/emojibase)、[gemoji](https://github.com/github/gemoji)。

### English

| App id | Source style | Notes |
| --- | --- | --- |
| `tiktok` | curated | Documented bracket codes and common caption emojis; not affiliated with TikTok or ByteDance. |
| `douyin` / `kuaishou` / `hongguo` | curated-zh | Unofficial Unicode groupings for Chinese short-video/local-app caption scenarios; no public official shortcode registry. |
| `hongguo` | curated-zh | Short-drama reactions, danmaku and binge-watching captions; not an official sticker set. |
| `xiaohongshu` / `wechat` / `weibo` / `bilibili` / `qq` / `taobao` / `pinduoduo` / `meituan` | curated-zh | Convenience groupings for lifestyle, social, shopping and local-service scenarios; vendor sticker packs excluded. |
| `instagram` | curated | Caption/story/aesthetic groupings; no public shortcode registry. |
| `github` | github-api | Shortcodes from a pinned GitHub emojis API / gemoji snapshot; URLs referenced only, never bundled. Subject to GitHub API Terms. |
| `discord` | curated | Common colon-shortcode convention; guild-specific custom emoji excluded. |
| `slack` | curated | Shared colon-shortcode convention derived from iamcal/emoji-data; workspace custom emoji excluded. |
| `whatsapp` | curated | Curated aliases over Unicode emoji; standard emoji come from the device keyboard. |
| `telegram` | curated | Aliases and interactive-emoji scenarios from public documentation; animations/stickers not bundled. |
| `twitter` | curated | Curated aliases for X / Twitter; Twemoji is open source but no artwork is bundled. |
| `facebook` | curated | Approximate Unicode reactions based on public documentation; proprietary animation excluded. |
| `reddit` / `linkedin` / `youtube` / `threads` / `pinterest` | curated | Convenience groupings for community, professional, video, casual-social and discovery scenarios. |
| `twitch` | curated | Channel/global emotes require the authenticated API and are not bundled; Unicode approximations only. |
| `snapchat` | curated | Friend-status and Snapstreak meanings from public documentation; not an official emoji set. |
| `native` | curated | Publicly documented design families such as Apple, Google, Samsung and Microsoft; no bundled artwork or pixel-identical promise. |

Public references include [Emojipedia TikTok](https://emojipedia.org/tiktok), [Snapchat](https://emojipedia.org/snapchat), [Facebook](https://emojipedia.org/facebook), [Discord](https://emojipedia.org/discord), [Slack](https://emojipedia.org/slack), [Telegram](https://emojipedia.org/telegram), [Instagram](https://emojipedia.org/instagram), [Twitch](https://emojipedia.org/twitch), [Unicode 18.0](https://www.unicode.org/emoji/charts-18.0/full-emoji-list.html), [iamcal/emoji-data](https://github.com/iamcal/emoji-data), [Emojibase](https://github.com/milesj/emojibase), and [gemoji](https://github.com/github/gemoji).

## 局限 / Limitations

**中文**：非官方整理带有主观性，可能滞后于 App 界面变化；工作区、服务器或频道自定义表情未包含；原生渲染由宿主平台提供，不承诺与某个 App 像素级一致；不捆绑专有美术资源，远程资源 URL 必须显式开启。

**English**: Curated overlays are opinionated and may lag behind UI changes. Custom workspace, guild, or channel emoji are not included. Native rendering uses the host platform's Unicode glyphs, and pixel-identical matching to any app is not promised. No proprietary artwork is bundled; remote asset URLs are opt-in only.

技术细节见 [平台与资源](platforms-and-assets.md) 与 [数据管线](data-pipeline.md)。For technical details about URLs and rendering, see [platforms and assets](platforms-and-assets.md). For the update process, see [data pipeline](data-pipeline.md).

<a id="english"></a>

## English summary

This document is bilingual. Each overlay is a curated, unofficial convenience layer over Unicode emoji base data. The full Chinese and English sections above share the same 28 app ids, the same disclaimers, and the same usage examples. Maintainers should edit only `data/sources/app-categories.json` for overlay definitions and regenerate data with `npm run data:build`; generated files under `data/generated/` must never be hand-edited.
