# App categories

emoji-kit includes ten app categories: `tiktok`, `instagram`, `github`, `discord`, `slack`, `whatsapp`, `telegram`, `twitter`, `facebook`, and `twitch`.

**Important:** these categories are **curated alias and grouping overlays over Unicode base data**. They are not official datasets published by the named services. They exist to make common shortcodes and groupings convenient; they are not guaranteed complete, current, or endorsed. See [NOTICE](../NOTICE).

## What an overlay provides

Each app definition has:

- `id` and `label` — the namespace and display name.
- `note` — a human-readable provenance / disclaimer note.
- `source` — how the aliases were obtained (`curated` or `github-api`).
- `categories` — named lists of emoji shortcodes (for example `trending`, `reactions`, `captions`).
- `aliases` — app-scoped alias-to-emoji-id mappings, e.g. TikTok's `loveface` → heart-eyes emoji.

The overlays never replace the Unicode dataset. A lookup first consults the app alias map, then falls back to the global alias index.

## Using an overlay

Definition call:

```js
import emoji from 'emoji-kit';

emoji({ name: 'fire', app: 'tiktok' });      // 🔥 (TikTok alias map)
emoji({ name: 'loveface', app: 'tiktok' });  // heart-eyes emoji
emoji({ name: 'ship', app: 'github' });      // rocket emoji
```

Reusable reference:

```js
const ref = emoji.define({ name: 'fire', app: 'tiktok' });
emoji(ref);
```

Text rendering uses a slash between app id and shortcode:

```js
renderText('Hi :thumbsup: :tiktok/fire:');     // 'Hi 👍 🔥'
renderText('Ship :github/rocket: :github/bug:');
```

Unknown apps or shortcodes leave the token unchanged. Filtering:

```js
emoji.search('love', { app: 'tiktok', limit: 5 });
emoji.list({ app: 'github', limit: 10 });
```

Inspecting definitions:

```js
import { apps } from 'emoji-kit/data'; // or 'emoji-kit/apps'
console.log(Object.keys(apps));
console.log(apps.tiktok.categories.trending);
```

## Provenance by app

| App id | Source style | Notes |
| --- | --- | --- |
| `tiktok` | curated | Documented bracket codes and common caption emojis; not affiliated with TikTok. |
| `instagram` | curated | Caption / story groupings; no public shortcode registry. |
| `github` | github-api | Shortcodes from a pinned GitHub emojis API / gemoji snapshot; image URLs referenced only, never bundled. Subject to GitHub API Terms. |
| `discord` | curated | Common colon-shortcode convention; guild-specific custom emoji excluded. |
| `slack` | curated | Shared colon-shortcode convention; workspace custom emoji excluded. |
| `whatsapp` | curated | Curated aliases over Unicode emoji; standard emoji come from the device keyboard. |
| `telegram` | curated | Curated aliases; no official public shortcode registry. |
| `twitter` | curated | Curated aliases for X / Twitter; no official public shortcode registry. |
| `facebook` | curated | Curated aliases over Unicode emoji. |
| `twitch` | curated | Channel/global emotes require the authenticated Twitch API and are not bundled. |

## Limitations

- Curated overlays are opinionated and may lag behind changes in any app's UI.
- Custom workspace, guild, or channel emoji are not included.
- Native rendering shows Unicode characters provided by the host platform; pixel-identical matching to an app is not promised.
- No proprietary artwork is bundled; remote asset URLs are opt-in only.

For technical details about URLs and rendering, see [platforms and assets](platforms-and-assets.md). For the update process, see [data pipeline](data-pipeline.md).
