# API reference

emoji-kit is ESM-first and ships TypeScript declarations. The default export is the `emoji` callable with helper methods attached; named exports provide the same functionality in a tree-shakeable form.

```js
import emoji, {
  createEmojiKit,
  get,
  search,
  list,
  renderText,
} from 'emoji-kit';
```

`emoji-kit/core` re-exports the core API and adds `createKit`, an alias of `createEmojiKit`.

## `emoji(input)` and `get(input)`

Resolve an emoji from any supported input. Returns a `DefinedEmoji` object or `undefined` if nothing matches. `get` is the named-method form of the same lookup.

Supported string inputs:

```js
emoji('thumbsup'); // by name / shortcode
emoji('+1');       // alias
emoji('👍');       // Unicode character
emoji('1F44D');    // hex code
```

Resolved objects include `id`, `name`, `label`, `char`, `hexcode`, `shortcode`, `platform`, and `variants`, plus optional `app` and `assetUrl`.

### Definition calls

Pass an object to compose variants:

```js
emoji({ name: 'thumbsup', tone: 2 });
emoji({ name: 'technologist', gender: 'female', tone: 2 });
emoji({ name: 'fire', app: 'tiktok' });
```

`EmojiDefinition` fields:

| Field | Type | Meaning |
| --- | --- | --- |
| `name` | `string` | Canonical name or alias, optionally scoped by `app` |
| `id`, `hexcode`, `char` | `string` | Direct lookup keys (first matching key wins) |
| `app` | `string` | App overlay id whose aliases should be consulted |
| `platform` | `string` | Platform label for asset resolution (default `native`) |
| `tone` | `number \| number[]` | Skin-tone selector, 1–5; the first valid value is used |
| `gender` | `'female' \| 'male'` | Gender variant selector |
| `assetUrl` | `string` | Explicit HTTPS asset URL (subject to `allowRemoteAssets`) |
| `assetFallback` | `'base' \| 'none'` | Reserved fallback preference |
| `allowRemoteAssets` | `boolean` | Must be `true` for any remote `assetUrl` to be returned |

### Reusable definitions

`emoji.define()` captures a definition as a reference without resolving it immediately:

```js
const ref = emoji.define({ name: 'fire', app: 'tiktok' });
emoji(ref); // 🔥
```

References are plain objects tagged with `kind: 'emoji-definition'`; they can be stored and resolved later by either the default or an isolated kit.

### Direct lookup helpers

```js
emoji.getByName('thumbsup');
emoji.getByHexcode('1F44D');
emoji.getByChar('👍');
```

These are also available on a kit instance and as `get` from the package root.

## `createEmojiKit()` / `createKit()`

Creates an isolated kit with prebuilt indexes and the same methods as the default export. Use it when you need an independent instance or want to avoid sharing state in tests.

```js
import { createEmojiKit } from 'emoji-kit';
import { createKit } from 'emoji-kit/core';

const kit = createEmojiKit();
createKit() === createEmojiKit(); // false — each call builds its own kit
```

A `EmojiKit` exposes `emojis`, `apps`, `aliases`, `metadata`, `emoji`, `get`, `getByName`, `getByHexcode`, `getByChar`, `search`, `list`, `renderText` / `render`, and `resolveAsset`.

## `search(query, options?)`

Returns prepared emoji matching names, shortcodes, or tags. Exact matches rank before partial matches; results are ordered by dataset order and limited to 20 by default (maximum 500).

```js
search('thumbs up');
kit.search('fire', { app: 'tiktok', limit: 5 });
```

`SearchOptions`: `app` (filter to an app overlay), `group` (numeric Unicode group), `limit` (1–500).

## `list(options?)`

Lists prepared emoji in dataset order with optional filters. Default limit is 20, maximum 500.

```js
list({ app: 'github', limit: 10 });
kit.list({ group: 0, subgroup: 0 });
```

`ListOptions`: `app`, `group`, `subgroup`, `limit`.

## `renderText(text, options?)` / `render(text, options?)`

Replaces `:shortcode:` tokens with Unicode characters. App-qualified tokens use a slash:

```js
renderText('Hi :thumbsup: :tiktok/fire:'); // 'Hi 👍 🔥'
```

Unknown tokens are left untouched. `render` is an alias of `renderText`. With `options.format === 'shortcode'`, known tokens are normalized to `:key:` instead of being replaced by characters.

`renderText()` returns **plain text only** — it never emits HTML. Input text and all raw JSON are treated as untrusted; the implementation performs no dynamic evaluation.

## `resolveAsset(definition)`

Returns a remote asset URL only when one exists and `allowRemoteAssets: true` is set in the definition:

```js
emoji.resolveAsset({ name: 'thumbsup', platform: 'github' }); // undefined
emoji.resolveAsset({ name: 'thumbsup', platform: 'github', allowRemoteAssets: true });
```

## Raw resource catalog

The v0.2 catalog resolves metadata for raw, pinned artwork and license files without network or filesystem access at runtime.

```js
import {
  getResource,
  listResources,
  resolveResource,
  resources,
  resourceSources,
  resourceCatalog,
} from 'emoji-kit';

getResource('twemoji-svg:1f44d.svg');
resolveResource({ sourceId: 'weibo-community-png', format: 'png' });
listResources({ app: 'wechat', format: 'png', limit: 5 });
```

- `getResource(input)` requires an exact id, path, or URL (string or query with `id`, `path`, or `url`). Unknown input returns `undefined`.
- `resolveResource(input)` matches an exact identifier or, for an identifier-less filter query, returns the first path-sorted match. Unknown input returns `undefined`.
- `listResources(options?)` AND-combines `sourceId`, `app`, `category`, `format`, and `kind` filters. Results are path-sorted; default limit is 20 and maximum is 500. Unknown filters are ignored and unknown values produce `[]`.
- `resources` is the flat readonly, path-sorted record list; `resourceSources` is the readonly source list; `resourceCatalog` contains both plus deterministic counts.

The root and `emoji-kit/core` export all functions and catalog values. `emoji-kit/data` exports the three catalog values only, plus existing data values; it has no lookup functions:

```js
import { resources, resourceSources, resourceCatalog } from 'emoji-kit/data';

console.log(resourceCatalog.counts.files, resources.length);
```

Each `ResourceRecord` has `id`, `path`, `sourceId`, `app`, `category`, `kind`, `format`, `upstreamPath`, `url`, `sha256`, `bytes`, `ref`, `repository`, and `license`. The package never fetches the record URL or returns file bytes. Use the URL explicitly in caller-owned code and verify the downloaded bytes against SHA-256. The current catalog has 8 sources and 17,026 records (17,018 artwork assets and 8 license records). There is no `emoji-kit/resources` subpath in v0.2.

## Data exports

`emoji-kit/data` (and the `emoji-kit/apps` alias) expose generated JSON as typed values: `emojis`, `aliases`, `apps`, `assets`, `metadata`, `resources`, `resourceSources`, and `resourceCatalog`. These are read-only by convention; do not mutate them. See [data and pipeline](data-pipeline.md), [agent integration](agents.md), and [app categories](app-categories.md).

## React adapter

`emoji-kit/react` provides `useEmojiKit()` and `emojiProps(input)`. See the [React guide](react.md).

## CLI

The `emoji-kit` binary exposes the same data via `get`, `search`, `list`, `render`, `apps`, and `check`. See the [CLI reference](cli.md).
