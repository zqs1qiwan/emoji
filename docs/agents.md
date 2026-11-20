# Agent integration guide

This guide distinguishes package consumers from repository contributors and tells AI coding agents which emoji-kit API to use.

## Consumer choice

Use the offline Unicode API when you need a character, shortcode, emoji search, app overlay, or plain-text rendering:

```js
import emoji, { get, search, list, renderText } from 'emoji-kit';

emoji('thumbsup')?.char;
get('1F44D')?.label;
search('thumbs up', { limit: 5 });
list({ app: 'github', limit: 5 });
renderText('Hi :thumbsup:');
```

Use the raw-resource catalog when you need the file metadata behind saved artwork or license text: source, upstream commit, HTTPS URL, sha256, byte size, app/category, format, and license.

```js
import {
  getResource,
  listResources,
  resolveResource,
  resources,
  resourceSources,
  resourceCatalog,
} from 'emoji-kit';

const thumbs = resolveResource({ id: 'twemoji-svg:1f44d.svg' });
const wechat = listResources({ app: 'wechat', format: 'png', limit: 5 });
console.log(resourceCatalog.counts.sources, resources.length, resourceSources.length);
```

The data-only entry is `emoji-kit/data` (and the `emoji-kit/apps` alias):

```js
import { resources, resourceSources, resourceCatalog } from 'emoji-kit/data';
```

It exports data only. `emoji-kit/core` exports the same root Unicode/resource API. There is no `emoji-kit/resources` subpath and no `resources` CLI command in v0.2.

## Lookup rules

- `getResource(input)` accepts a string id, path, or URL, or an exact identifier query. It does not accept filter-only input.
- `resolveResource(input)` uses an identifier exactly like `getResource`; without an identifier it returns the first path-sorted match for combined filters.
- `listResources(options)` combines source, app, category, format, and kind filters with AND. It returns path-sorted matches; default limit is 20 and the maximum is 500.
- Unknown lookups return `undefined` or `[]` instead of throwing. All catalog operations are synchronous and offline.

## Fetch one resource explicitly

The package never fetches files. The caller makes the opt-in network request and verifies the result:

```js
import { createHash } from 'node:crypto';
import { resolveResource } from 'emoji-kit';

const record = resolveResource({ sourceId: 'wechat-community-png', format: 'png' });
if (!record) throw new Error('no matching resource');

const response = await fetch(record.url);
if (!response.ok) throw new Error(`HTTP ${response.status}`);
const bytes = Buffer.from(await response.arrayBuffer());
const sha256 = createHash('sha256').update(bytes).digest('hex');
if (sha256 !== record.sha256) throw new Error('checksum mismatch');
console.log(record.path, record.license, sha256);
```

Use `record.url` verbatim; do not reconstruct a URL or replace `record.ref` with a branch, tag, or `latest`. Reuse is subject to `record.license` and upstream terms.

## Provenance and coverage

The checked-in catalog currently contains 8 sources and 17,026 records: 17,018 artwork assets and 8 license records, totaling 190371148 bytes. Saved app/community artwork exists for `douyin`, `tiktok`, `wechat`, and `weibo`; native artwork also exists. Other app categories in emoji-kit are Unicode overlay aliases only unless a catalog record is listed for them. The WeChat and Weibo collections are GPL-3.0 community collections and are not official or affiliated with their respective platforms; never describe a community collection as official or affiliated.

Count semantics: `resourceCatalog.counts` totals cover every record — `counts.files` equals `counts.assets` + `counts.licenses`, and `counts.totalBytes` includes the license files. Per-source `resourceCatalog.sources[].fileCount` and `totalBytes` are artwork-only and exclude the separate license file reported in `licenseCount`; use `assetCount` + `licenseCount` (or `resourceCatalog.counts`) when you need totals across all files.

Licenses include both package/source licenses and saved upstream license text. Inspect `record.license`, `resourceSources`, and the corresponding license record before redistribution or integration.

## Repository-only documentation

The npm tarball ships the programmatic API and generated catalog only. It does not contain `llms.txt`, `docs/`, or `examples/`, and agents must not look for them under `node_modules/emoji-kit`.

Fetch repository documentation and examples from GitHub raw URLs pinned to one exact emoji-kit commit:

- `https://raw.githubusercontent.com/zqs1qiwan/emoji/ab1e6f4a458cc61708e3aac946c075c58f9206f7/llms.txt`
- `https://raw.githubusercontent.com/zqs1qiwan/emoji/ab1e6f4a458cc61708e3aac946c075c58f9206f7/docs/agents.md`
- `https://raw.githubusercontent.com/zqs1qiwan/emoji/ab1e6f4a458cc61708e3aac946c075c58f9206f7/docs/agent-resource-contract.md`
- `https://raw.githubusercontent.com/zqs1qiwan/emoji/ab1e6f4a458cc61708e3aac946c075c58f9206f7/examples/agent-catalog.mjs`
- `https://raw.githubusercontent.com/zqs1qiwan/emoji/ab1e6f4a458cc61708e3aac946c075c58f9206f7/examples/fetch-resource.mjs`

The pinned commit above is the exact emoji-kit commit that was inspected. Artwork URLs in catalog records are upstream URLs pinned to upstream commits; they are separate from the repository commit.

## Contributor rules

Contributors must edit behavior under `src/**` and tests under `tests/**`, human source definitions under `data/sources/**`, and docs/examples only in the listed public paths. Never hand-edit `data/generated/**` or `dist/**`; rebuild deterministically. Public checks:

```sh
npm run check
npm run check:public
```

See [llms.txt](../llms.txt), [the resource contract](agent-resource-contract.md), [the API reference](api.md), and [the data pipeline](data-pipeline.md).
