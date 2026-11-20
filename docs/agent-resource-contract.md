# emoji-kit v0.2 — agent resource access contract

This document is the requirements contract for emoji-kit **v0.2**. It defines how a JavaScript/TypeScript
consumer or an AI coding agent can **discover, resolve, and fetch the correct raw emoji resource** while the
shipped package stays offline-first, dependency-free, provenance-tracked, and free of bundled artwork.

- **Status:** contract for the next minor release. Everything marked **v0.2 API** below is *proposed*: it does
  not exist in the published `0.1.0` package yet. Everything marked **existing** is current `0.1.0` behavior and
  must not change.
- **Scope of this document:** the public surface, the generated catalog shape, lookup semantics, error behavior,
  the agent entrypoints, the source-expansion rules, and the acceptance matrix downstream work is verified
  against.
- **Related documents:** [architecture](architecture.md), [data pipeline](data-pipeline.md),
  [platforms and assets](platforms-and-assets.md), [app categories](app-categories.md), [api](api.md),
  and [agents](agents.md) (v0.2 target, written by the DX work stream).

---

## 1. Goals and non-goals

### Goals

1. An agent can answer *"which image file corresponds to this emoji, from which upstream project, under which
   license, at which pinned commit?"* from machine-readable data — without guessing file names.
2. The lookup path never touches the network, the filesystem, or `process.env`. Shipped code stays
   browser-safe and works offline.
3. Every returned record is traceable: pinned commit, upstream HTTPS URL, sha256, byte size, and license.
4. The npm tarball stays small and clean: metadata only, **no binary artwork**, no caches, no developer paths.

### Non-goals

- Bundling, hosting, or mirroring emoji artwork.
- Downloading anything at runtime on the caller's behalf. `emoji-kit` resolves; **the caller** fetches.
- Changing existing Unicode/app-overlay behavior, the `emoji-kit/react` adapter, or the CLI command set.
- Claiming that any app, platform, or vendor endorses or ships these collections. See §9.4.

---

## 2. Non-negotiable constraints

| # | Constraint | Rule | Enforcement |
|---|---|---|---|
| C1 | Zero runtime dependencies | No new runtime `dependencies`; `typescript` stays the only dev dependency | `package.json` audit, `npm run check` |
| C2 | No filesystem or network in shipped code | `src/**` may not import `node:fs`, call `fetch`, or read `process.env` | §10 static scan |
| C3 | No binary artwork in the npm tarball | Only JSON metadata ships; `resources/**` stays out of `package.json` `files` | `npm pack --dry-run` (§10) |
| C4 | HTTPS-only URLs | Every catalog URL is `https:` and pinned to a 40-hex commit | §10 catalog scan |
| C5 | Deterministic generated data | Generated JSON contains no timestamps, no random ordering, no machine paths; repeated generation is byte-identical | §10 regeneration diff |
| C6 | Pinned provenance | Every record carries `ref` (40-hex commit), `sha256`, `bytes`, `url`, `license` | §10 catalog scan |
| C7 | Honest labeling | App collections are community collections; no official-affiliation claims; trademark names identify the subject only | `NOTICE`, [agents](agents.md), §9.4 |
| C8 | Static JSON imports | Shipped code imports checked-in JSON only (existing pattern: `import x from './data/generated/x.json' with { type: 'json' }`) | code review |

---

## 3. Public API (v0.2)

### 3.1 Entry point map

No new npm subpath is introduced in v0.2, and `package.json` stays unchanged: no new `exports` entry and no
`files` change. Package metadata may only change on an explicit human request (§11, D1/D2/D4).

| Entry point | Existing (0.1.0) | v0.2 addition |
|---|---|---|
| `emoji-kit` (`.`) | `emoji`, `get`, `getByName`, `getByHexcode`, `getByChar`, `search`, `list`, `renderText`, `render`, `resolveAsset`, `createEmojiKit`, `createKit`, `emojis`, `apps`, `aliases`, `metadata` | `getResource`, `listResources`, `resolveResource`, `resources`, `resourceSources`, `resourceCatalog` + the new types |
| `emoji-kit/core` | re-exports the root entry | inherits the v0.2 additions (still browser-safe: the catalog is static JSON) |
| `emoji-kit/data` | `emojis`, `emojiRecords`, `aliases`, `apps`, `assets`, `metadata` | `resources`, `resourceSources`, `resourceCatalog` (data only, no functions) |
| `emoji-kit/apps` | alias of `./data` | inherits the data additions |
| `emoji-kit/react` | `useEmojiKit`, `emojiProps`, `createEmojiKit` | unchanged |
| `emoji-kit/cli` | `get`, `search`, `list`, `render`, `apps`, `check` | unchanged — **no `resources` CLI command in v0.2** |

Existing exports keep their current names, signatures, and semantics. v0.2 is additive.

### 3.2 Types (v0.2 API)

Types live in `src/types.ts` and are exported from `emoji-kit` and `emoji-kit/core`.

```ts
/** One raw file in the pinned resource library, described by metadata only. */
export interface ResourceRecord {
  /** Stable id, `<sourceId>:<name-within-source>`. See §5.4. */
  readonly id: string;
  /** Repository-relative POSIX path of the saved file, e.g. `resources/native/twemoji/svg/1f44d.svg`. */
  readonly path: string;
  /** Id of the pinned upstream source this file came from. */
  readonly sourceId: string;
  /** App or platform the collection belongs to (`native`, `tiktok`, `douyin`, `wechat`, `weibo`, …). */
  readonly app: string;
  /** `native` for platform artwork, `app` for app-specific community collections. */
  readonly category: 'native' | 'app';
  /** `asset` for artwork, `license` for the saved upstream license text. */
  readonly kind: 'asset' | 'license';
  /** Lowercase file extension without the dot (`svg`, `png`, `txt`, `md`); empty string when there is none. */
  readonly format: string;
  /** Path of the file inside the upstream repository. */
  readonly upstreamPath: string;
  /** Canonical pinned HTTPS URL of the file. Never reconstructed: it is copied from the manifest. */
  readonly url: string;
  /** sha256 of the file bytes, lowercase hex. */
  readonly sha256: string;
  /** Size of the file in bytes. */
  readonly bytes: number;
  /** Pinned upstream commit (40 lowercase hex characters). */
  readonly ref: string;
  /** Upstream repository as `owner/name`. */
  readonly repository: string;
  /** SPDX-style license identifier of the upstream source. */
  readonly license: string;
}

/** One pinned upstream source in the raw resource library. */
export interface ResourceSource {
  readonly id: string;
  readonly category: 'native' | 'app';
  readonly app: string;
  readonly sourceType: 'open-source-repository' | 'community-repository';
  readonly provider: string;
  readonly repository: string;
  readonly repositoryUrl: string;
  readonly ref: string;
  readonly refType: 'commit';
  readonly pathPrefix: string;
  readonly destinationPrefix: string;
  readonly license: string;
  readonly licenseUrl: string;
  readonly licenseFile: string | null;
  readonly licenseFileUrl: string | null;
  readonly ownershipNote: string;
  readonly expectedFiles: number;
  readonly fileCount: number;
  readonly assetCount: number;
  readonly licenseCount: number;
  readonly totalBytes: number;
}

/** The whole generated catalog. */
export interface ResourceCatalog {
  readonly schemaVersion: number;
  /** Human-readable, timestamp-free provenance of the input. */
  readonly generatedFrom: string;
  readonly counts: {
    readonly sources: number;
    readonly files: number;
    readonly assets: number;
    readonly licenses: number;
    readonly totalBytes: number;
  };
  readonly sources: readonly ResourceSource[];
  readonly resources: readonly ResourceRecord[];
}

/** Filters accepted by the lookup functions. All provided filters are combined with AND. */
export interface ResourceQuery {
  /** Exact resource id, e.g. `twemoji-svg:1f44d.svg`. */
  readonly id?: string;
  /** Exact repository-relative path. Percent-encoded and decoded forms are both accepted. */
  readonly path?: string;
  /** Exact catalog URL. Percent-encoded and decoded forms are both accepted. */
  readonly url?: string;
  /** Source id, e.g. `twemoji-svg`. */
  readonly sourceId?: string;
  /** App or platform id, e.g. `weibo`. */
  readonly app?: string;
  readonly category?: 'native' | 'app';
  /** File extension without the dot, e.g. `svg`. */
  readonly format?: string;
  readonly kind?: 'asset' | 'license';
}

export interface ResourceListOptions extends ResourceQuery {
  /** Maximum number of records to return. Default `20`, hard maximum `500`. */
  readonly limit?: number;
}
```

### 3.3 Functions (v0.2 API)

```ts
/** Exact lookup. Requires an identifier (id, path, or url); unknown input returns `undefined`. */
export function getResource(input: string | ResourceQuery): ResourceRecord | undefined;

/** Filtered lookup. Returns every match ordered by `path`, truncated by `limit`. */
export function listResources(options?: ResourceListOptions): ResourceRecord[];

/** Resolution. Same matching rules as `getResource`, but identifier-less queries resolve from filters alone. */
export function resolveResource(input: string | ResourceQuery): ResourceRecord | undefined;
```

Semantics in detail:

- `getResource('twemoji-svg:1f44d.svg')` → the record with that exact id.
- `getResource('resources/native/twemoji/svg/1f44d.svg')` → the record with that exact path.
- `getResource({ sourceId: 'weibo-community-png', format: 'png' })` → `undefined`; `getResource` needs an
  identifier. Use `resolveResource` or `listResources` for filter-only lookups.
- `resolveResource({ sourceId: 'weibo-community-png', format: 'png' })` → the first match in catalog order.
- `listResources({ app: 'native', format: 'svg', limit: 5 })` → the first five matching records by `path`.

**All three functions are pure and synchronous.** They read only the checked-in catalog JSON. They never
`fetch`, never read files, never touch `process.env`, and never return file bytes.

### 3.4 Catalog exports (v0.2 API)

```ts
// emoji-kit and emoji-kit/core
export const resources: readonly ResourceRecord[];
export const resourceSources: readonly ResourceSource[];
export const resourceCatalog: ResourceCatalog;

// emoji-kit/data and emoji-kit/apps
export const resources: readonly ResourceRecord[];
export const resourceSources: readonly ResourceSource[];
export const resourceCatalog: ResourceCatalog;
```

`resources` is the flat, sorted record list. `resourceCatalog` is the whole generated object (records + sources +
counts) and is the same object the generator wrote, so `resourceCatalog.resources === resources` holds by
construction.

---

## 4. Catalog schema

### 4.1 File layout

| Stage | Path | Notes |
|---|---|---|
| Generated (checked in) | `data/generated/resources.json` | Deterministic output of the catalog generator |
| Staged for the build | `src/data/generated/resources.json` | Produced by `scripts/stage-data.mjs`, git-ignored |
| Shipped | `dist/data/generated/resources.json` | Copied by `scripts/build.mjs`, included in the npm tarball via `dist` |
| Checksums | `data/generated/checksums.json` | Gains a `resources.json` entry |

The generator reads **only** `resources/manifest.json`. It must not need `data/cache`, the network, or any
timestamp.

### 4.2 Root object

```jsonc
{
  "schemaVersion": 1,
  "generatedFrom": "resources/manifest.json",
  "counts": {
    "sources": 8,
    "files": 17026,
    "assets": 17018,
    "licenses": 8,
    "totalBytes": 190305000
  },
  "sources": [ /* ResourceSource[], sorted by id */ ],
  "resources": [ /* ResourceRecord[], sorted by path */ ]
}
```

The values above are **illustrative** (the shape after the §9 expansion: 8 sources, 8 license files, 17,018
artwork files). The generator computes the real numbers, and §10.1 asserts them against the manifest.

- `schemaVersion` is `1` for v0.2.
- `generatedFrom` names the input file. It never contains a date, host, or absolute path.
- `counts.files` equals `resources/manifest.json` `fileCount`; `counts.sources` equals its `sourceCount`;
  `counts.totalBytes` equals its `totalBytes`. `counts.assets` + `counts.licenses` = `counts.files`.

### 4.3 Record fields

| Field | Type | Rule | Example |
|---|---|---|---|
| `id` | string | Stable, unique, deterministic — see §5.4 | `twemoji-svg:1f44d.svg` |
| `path` | string | Repository-relative POSIX path of the saved file; never absolute | `resources/native/twemoji/svg/1f44d.svg` |
| `sourceId` | string | Join key to `sources[]`; equals `resources/manifest.json` `sourceId` | `twemoji-svg` |
| `app` | string | Copied from the manifest | `native` |
| `category` | `'native' \| 'app'` | Copied from the manifest | `native` |
| `kind` | `'asset' \| 'license'` | Copied from the manifest | `asset` |
| `format` | string | Lowercase extension of `path` without the dot | `svg` |
| `upstreamPath` | string | Copied from the manifest | `assets/svg/1f44d.svg` |
| `url` | string | Copied verbatim from the manifest `originalUrl`; never reconstructed | `https://raw.githubusercontent.com/jdecked/twemoji/b6b55fef…/assets/svg/1f44d.svg` |
| `sha256` | string | 64 lowercase hex characters | `0f2b2ef249afadcfcd3cd9e1dcc7ba612f595135cd70c6663267380ea4d3331e` |
| `bytes` | number | Integer byte size (manifest `size`) | `1663` |
| `ref` | string | 40-hex commit of the source | `b6b55fef1e8636b540a6d016a4729ca8cdf2e60b` |
| `repository` | string | `owner/name` | `jdecked/twemoji` |
| `license` | string | SPDX-style identifier of the source | `CC-BY-4.0` |

Rules that the generator must enforce:

1. Every `url` starts with `https://`. A non-HTTPS or credential-bearing URL is a hard failure.
2. Every `sha256` matches `/^[0-9a-f]{64}$/`; every `ref` matches `/^[0-9a-f]{40}$/`.
3. Every `path` is relative, POSIX-separated, and free of `..`, `.`, backslashes, and drive letters.
4. Every `id` is unique. The generator fails loudly on a duplicate id.
5. No record contains a timestamp, hostname, username, or absolute path.

### 4.4 Source fields

`sources[]` carries one entry per pinned upstream source and mirrors `resources/manifest.json` `sources[]`:
`id`, `category`, `app`, `sourceType`, `provider`, `repository`, `repositoryUrl`, `ref`, `refType`, `pathPrefix`,
`destinationPrefix`, `license`, `licenseUrl`, `licenseFile`, `licenseFileUrl`, `ownershipNote`, `expectedFiles`,
`fileCount`, `totalBytes`, plus the derived counters `assetCount` and `licenseCount`.

`ownershipNote` is written by humans and must keep the "community collection, not an official pack" wording for
app sources (§9.4).

### 4.5 Worked example

A record for the Twemoji thumbs-up SVG, exactly as the catalog describes it:

```json
{
  "id": "twemoji-svg:1f44d.svg",
  "path": "resources/native/twemoji/svg/1f44d.svg",
  "sourceId": "twemoji-svg",
  "app": "native",
  "category": "native",
  "kind": "asset",
  "format": "svg",
  "upstreamPath": "assets/svg/1f44d.svg",
  "url": "https://raw.githubusercontent.com/jdecked/twemoji/b6b55fef1e8636b540a6d016a4729ca8cdf2e60b/assets/svg/1f44d.svg",
  "sha256": "0f2b2ef249afadcfcd3cd9e1dcc7ba612f595135cd70c6663267380ea4d3331e",
  "bytes": 1663,
  "ref": "b6b55fef1e8636b540a6d016a4729ca8cdf2e60b",
  "repository": "jdecked/twemoji",
  "license": "CC-BY-4.0"
}
```

The matching source entry carries `licenseUrl`, `licenseFile: "resources/native/twemoji/LICENSE-GRAPHICS.txt"`, and
the ownership note: *Twitter Twemoji graphics, maintained by jdecked. Attribution required.*

---

## 5. Lookup and filter semantics

### 5.1 Matching rules

| Input | Matched against | Rule |
|---|---|---|
| `id` | `record.id` | Exact, case-sensitive string equality |
| `path` | `record.path` | Exact after normalizing percent-encoding and separators |
| `url` | `record.url` | Exact after normalizing percent-encoding of path segments |
| `sourceId` | `record.sourceId` | Exact equality |
| `app` | `record.app` | Exact equality |
| `category` | `record.category` | Exact equality |
| `format` | `record.format` | Exact equality, case-insensitive input (`SVG` matches `svg`) |
| `kind` | `record.kind` | Exact equality |

- All provided filters combine with **AND**.
- Filters are matched exactly. There is no fuzzy, prefix, or substring matching anywhere in the resource API.
- `format` accepts a leading dot (`".svg"` is treated as `"svg"`).

### 5.2 Percent-encoding tolerance

Upstream paths contain characters that must be encoded in URLs (for example Fluent Emoji's
`assets/1st%20place%20medal/Color/1st_place_medal_color.svg`). The catalog stores the URL exactly as the
collector produced it (already percent-encoded). For `path` and `url` lookups:

- The caller may pass the decoded form (`resources/native/fluentui-emoji/color/svg/1st place medal/Color/1st_place_medal_color.svg`)
  or the encoded form (`resources/native/fluentui-emoji/color/svg/1st%20place%20medal/Color/1st_place_medal_color.svg`).
- The implementation compares percent-decoded values, so both forms resolve to the same record.
- Backslashes are normalized to `/` before comparison.
- `id` values are opaque strings and are compared verbatim — never percent-decoded, never case-folded.

### 5.3 Ordering and limits

- Records are stored and returned sorted by `path`, ascending, using byte-wise comparison of the POSIX path.
- `listResources()` returns records in that order.
- `limit` defaults to `20` and is capped at `500`, matching the existing `search()` / `list()` behavior in
  `emoji-kit`. A non-numeric, `NaN`, or negative `limit` falls back to the default `20`; a fractional `limit` is
  floored; `0` returns an empty array.
- `resolveResource` returns the **first** match in `path` order — the same record `listResources` would return
  first for the same filters.

### 5.4 Stable id rule

```
id = `${sourceId}:${nameWithinSource}`

nameWithinSource =
  kind === 'asset'   → `path` with the source's `destinationPrefix + '/'` removed
                       (e.g. `resources/native/twemoji/svg/1f44d.svg` → `1f44d.svg`)
  kind === 'license' → `license/` + basename(`path`)
                       (e.g. `resources/douyin/LICENSE.txt` → `license/LICENSE.txt`)
```

Consequences:

- The rule needs only `path`, `kind`, and `sourceId`, so it is reproducible from the manifest alone.
- Ids are unique by construction; the generator asserts uniqueness and fails otherwise.
- Ids are opaque. They may contain spaces or slashes (Fluent Emoji nests files in directories). Never
  interpolate an id into a URL without encoding it; use `record.url` for fetching.

### 5.5 Error behavior

| Situation | Behavior |
|---|---|
| Unknown id / path / url | `getResource` and `resolveResource` return `undefined`; `listResources` returns `[]` |
| Filter that matches nothing | `listResources` returns `[]`; `resolveResource` returns `undefined` |
| Empty or whitespace-only string input | `undefined` / `[]` — never a throw |
| `limit` out of range | Clamped per §5.3 — never a throw |
| Unknown filter key | Ignored — never a throw |
| Catalog empty or partially loaded | Lookups degrade to `undefined` / `[]` |
| Invalid option types | Non-string filter values are ignored rather than throwing |

**Rule:** the resource API never throws for bad input. It returns `undefined` or an empty array. This keeps the
API safe to call directly from an agent loop.

### 5.6 What the resource API deliberately does not do

- It does not map an emoji to artwork automatically. Native sources name files after Unicode code points
  (`1f44d.svg`, `emoji_u1f44d.png`, `0023-FE0F-20E3.svg`), app collections use local names (`angel.svg`,
  `001.png`), and Fluent Emoji uses English names. A stable cross-source "emoji → file" mapping is out of scope
  for v0.2; use the record `id`/`path`/`url` directly, or filter by `sourceId` and `app`.
- It does not download, proxy, or cache anything.
- It does not expose the raw files themselves; `resources/**` is a repository-side reference library that is not
  published to npm (§1 non-goals, §11 decision D3).

---

## 6. Agent entrypoints

### 6.1 Files

| Path | Audience | Purpose |
|---|---|---|
| `llms.txt` (repository root) | AI agents, crawlers | Compact machine-readable summary: package name, install command, real exports, catalog usage, provenance rules, links to the deeper docs |
| `docs/agents.md` | AI agents, integrators | Integration patterns: offline Unicode API vs. raw resource catalog, explicit fetch flow, license obligations, worked snippets |
| `docs/agent-resource-contract.md` (this file) | maintainers, reviewers | The normative contract |
| `examples/agent-catalog.mjs` | developers, agents | Runnable catalog/query example against the built `dist` output |
| `examples/fetch-resource.mjs` | developers, agents | Opt-in example that fetches one record and verifies its sha256 |

`llms.txt` lives at the repository root and is fetched from the repository, not from the npm tarball. It must
list only exports that exist in the released package and only commands that exist in `package.json`.

### 6.1.1 Where an agent fetches each artifact

The npm tarball ships **only** `bin`, `dist`, `README.md`, `LICENSE`, and `NOTICE` — that is, the programmatic
API and the generated catalog. `llms.txt`, `docs/`, and `examples/` are **not** inside the installed package;
they are hosted in the GitHub repository and must be fetched from there, pinned to a commit. Agents must not
look for `llms.txt` inside `node_modules/emoji-kit`.

| Artifact | Channel | Location |
|---|---|---|
| Programmatic API + generated catalog | npm | `npm install emoji-kit` → `emoji-kit`, `emoji-kit/core`, `emoji-kit/data` |
| `llms.txt` | repository, raw URL pinned to a commit | `https://raw.githubusercontent.com/zqs1qiwan/emoji/<commit>/llms.txt` |
| `docs/agents.md` | repository, raw URL pinned to a commit | `https://raw.githubusercontent.com/zqs1qiwan/emoji/<commit>/docs/agents.md` |
| `docs/agent-resource-contract.md` | repository, raw URL pinned to a commit | `https://raw.githubusercontent.com/zqs1qiwan/emoji/<commit>/docs/agent-resource-contract.md` |
| `examples/agent-catalog.mjs`, `examples/fetch-resource.mjs` | repository, raw URL pinned to a commit | `https://raw.githubusercontent.com/zqs1qiwan/emoji/<commit>/examples/<file>` |
| Emoji artwork and license texts | upstream, pinned per record | `record.url` (HTTPS, pinned to the upstream commit) — never a `latest` URL |
| Full raw library for browsing | repository, not published to npm | `resources/**` in the repository tree |

`<commit>` is the emoji-kit commit that an agent pins its documentation fetches to; the same value must be
used in `llms.txt` and `docs/agents.md` so an agent can verify what it read.

### 6.2 Copy-paste patterns

**Package consumer (ESM) — offline metadata lookup:**

```js
import { listResources, resolveResource } from 'emoji-kit';

const record = resolveResource({ id: 'twemoji-svg:1f44d.svg' });
console.log(record?.url, record?.license, record?.bytes);
console.log(listResources({ app: 'weibo', format: 'png', limit: 3 }));
```

**Package consumer (CommonJS):**

```js
const { listResources } = require('emoji-kit');
console.log(listResources({ sourceId: 'douyin-community-png', limit: 5 }));
```

**Data-only consumer (no functions):**

```js
import { resources, resourceCatalog } from 'emoji-kit/data';
console.log(resourceCatalog.counts.sources, resources.length);
```

**Agent that fetches one file and verifies it (the fetch is the caller's explicit choice):**

```js
import { createHash } from 'node:crypto';
import { resolveResource } from 'emoji-kit';

const record = resolveResource({ sourceId: 'wechat-community-png', format: 'png' });
if (!record) throw new Error('no resource');

const response = await fetch(record.url);
if (!response.ok) throw new Error(`HTTP ${response.status}`);
const bytes = Buffer.from(await response.arrayBuffer());
const sha256 = createHash('sha256').update(bytes).digest('hex');
if (sha256 !== record.sha256) throw new Error('checksum mismatch');
```

**Shell equivalent (no package install required):**

```sh
curl -fsSL -o 1f44d.svg "https://raw.githubusercontent.com/jdecked/twemoji/b6b55fef1e8636b540a6d016a4729ca8cdf2e60b/assets/svg/1f44d.svg"
sha256sum 1f44d.svg   # expect 0f2b2ef249afadcfcd3cd9e1dcc7ba612f595135cd70c6663267380ea4d3331e
```

### 6.3 Agent decision guide

| The agent needs | Use | Network |
|---|---|---|
| A character, shortcode, search, plain-text rendering | the Unicode API (`emoji`, `get`, `search`, `list`, `renderText`) | none |
| The *file* behind an emoji (SVG/PNG) from a pinned upstream | the resource catalog → `resolveResource` → explicit fetch | only in the caller's fetch step |
| An app-specific community set (tiktok, douyin, wechat, weibo) | `listResources({ app: 'wechat' })` | only in the caller's fetch step |
| Provenance or license of a file | `record.ref`, `record.license`, `resourceSources` | none |

`emoji-kit` never performs the fetch for you. The catalog tells you *what* to fetch, *from where*, and *how to
verify it*.

---

## 7. Generated data rules

1. The catalog is generated by a dedicated script (for example `scripts/build-resource-catalog.mjs`) that reads
   `resources/manifest.json` only.
2. Output is sorted by `path`; `sources[]` is sorted by `id`.
3. No timestamps, no host names, no user names, no absolute paths, no random ordering.
4. Regenerating twice produces byte-identical output; `data/generated/checksums.json` gains a `resources.json`
   entry so `npm run data:check` detects drift.
5. `scripts/stage-data.mjs` and `scripts/build.mjs` include `resources.json` in the staged/shipped file list.
6. The generator never mutates `resources/manifest.json` or any raw file.
7. The generated file is committed; it is the runtime data source, exactly like the other `data/generated/*.json`
   files.

---

## 8. Provenance and license rules for consumers

1. Every record pins an upstream commit. Never resolve a "latest" URL; use `record.url`.
2. After downloading, verify `sha256` against `record.sha256` and `bytes` against `record.bytes`.
3. Honor the per-source license:
   - `CC-BY-4.0` (Twemoji): attribution required.
   - `CC-BY-SA-4.0` (OpenMoji): attribution and share-alike for adaptations.
   - `OFL-1.1` (Noto Emoji): SIL Open Font License terms.
   - `MIT` (Fluent Emoji, TikTok community set, Douyin community set): preserve the license notice.
   - `GPL-3.0` (WeChat and Weibo community sets): copyleft obligations apply to redistribution of the artwork
     itself. Keep the saved license text next to any redistributed copy.
4. Do not present a community collection as an official asset pack of the named app (§9.4).
5. The npm package ships metadata only. Do not add artwork to the package, and do not republish the upstream
   artwork under a different license.

---

## 9. Source expansion

### 9.1 Current pinned sources

| Source id | Repository | License | Commit | Files | App |
|---|---|---|---|---|---|
| `twemoji-svg` | `jdecked/twemoji` | CC-BY-4.0 | `b6b55fef1e8636b540a6d016a4729ca8cdf2e60b` | 4,009 | native |
| `openmoji-color-svg` | `hfg-gmuend/openmoji` | CC-BY-SA-4.0 | `3e01de523ddefe9c5e46a7765b15efef04bf9002` | 4,567 | native |
| `noto-emoji-2d-png-128` | `googlefonts/noto-emoji` | OFL-1.1 | `99701e07d3d1fe1bdbcdb14964547f0fd592966f` | 3,787 | native |
| `fluent-emoji-color-svg` | `microsoft/fluentui-emoji` | MIT | `1ffb34c752ecf5d402f04cfb4b392c77f57c54bc` | 3,145 | native |
| `tiktok-community-svg` | `boqingren/tiktok-emojis` | MIT (declared in README) | `e2e26d2866e4820d8a865b711540d998e1c2087b` | 46 | tiktok |
| `douyin-community-png` | `hnlyzxf/douyin-emoji` | MIT | `e1e0395662634c48c4073a6d8fba6138121a53d2` | 415 | douyin |

### 9.2 Additional app-specific sources (v0.2 candidates, to be collected)

Both are **community collections**, not official packs. The values below are the pinned refs and expected counts
used by the collector; the collector must re-verify them at the pinned commit before the sources are accepted.

**WeChat emoticons**

| Field | Value |
|---|---|
| Source id | `wechat-community-png` |
| Repository | `qiuyinghua/wechat-emoticons` |
| Repository URL | `https://github.com/qiuyinghua/wechat-emoticons` |
| License | GPL-3.0 (upstream `LICENSE`) |
| Pinned ref | `84dd89931784f0fab874994dbc7e6ed14964a04d` (commit) |
| Path prefix | `images` |
| File pattern | `\.png$` |
| Destination prefix | `resources/wechat/community-png/png` |
| Expected files | 106 PNG (≈0.33 MiB) |
| License file | `resources/wechat/LICENSE.txt` |
| Ownership note | Community-collected WeChat emoticon set. Not an official WeChat asset pack; review upstream licensing before redistribution. |

**Weibo emoji**

| Field | Value |
|---|---|
| Source id | `weibo-community-png` |
| Repository | `ArvinZJC/WeiboEmoji` |
| Repository URL | `https://github.com/ArvinZJC/WeiboEmoji` |
| License | GPL-3.0 (upstream `LICENCE`) |
| Pinned ref | `4bc29b5d175cbe972e7ab78f36db87538485b139` (commit) |
| Path prefix | `img` |
| File pattern | `\.png$` |
| Destination prefix | `resources/weibo/community-png/png` |
| Expected files | 943 PNG (≈8.09 MiB) |
| License file | `resources/weibo/LICENSE.txt` |
| Ownership note | Community-collected Weibo emoji set. Not an official Weibo asset pack; review upstream licensing before redistribution. |

Target manifest after the expansion: `sourceCount` 8, `fileCount` 17,026 (15,975 existing files + 1,049 new
artwork files + 2 new license files).

### 9.3 Acceptance and rejection criteria for any new source

A candidate source is **accepted** only when all of the following hold:

1. It is a public HTTPS repository with a **pinned 40-hex commit** — never a branch, tag-only, or "latest" URL.
2. It has an **explicit license** that permits redistribution of the artwork (file or clear repository
   declaration), and the license text is saved next to the collection.
3. The artwork is not proprietary/vendor material that the upstream project may not redistribute.
4. The file count matches the declared `expectedFiles`; drift beyond a handful of files must be investigated
   before the manifest is updated.
5. Every downloaded file is recorded with its sha256 and byte size, and the license/attribution note is written
   into the source metadata.
6. The collection is labeled as a community collection with an honest ownership note.

A candidate is **rejected** when:

- The repository has **no license** (for example `lrhtony/BiliEmoji`) — no license means no redistribution
  rights.
- The upstream states the artwork is development reference only, or otherwise withholds redistribution rights
  (for example `hellodigua/dsh-emoji`, whose `ASSETS.md` limits the Bilibili artwork to development reference).
- The files are proprietary, scraped, or vendor-owned artwork of an app, platform, or brand.
- The upstream URL is not HTTPS, or the upstream serves files only through an opaque API rather than a pinned
  commit.
- The collection cannot be pinned to an immutable commit or fails checksum verification.

### 9.4 App coverage honesty

The raw library covers five apps/collections: `native`, `tiktok`, `douyin`, `wechat`, `weibo`. The other
categories in `data/sources/app-categories.json` (for example `instagram`, `discord`, `slack`, `whatsapp`,
`telegram`, `twitter`, `facebook`, `twitch`) are **definition and alias overlays only** — they carry no artwork
files and must not be described as having saved packs.

App and platform names identify the subject of a community collection. `emoji-kit` is not affiliated with,
endorsed by, or sponsored by any of them, and no source in the catalog may be presented as an official pack.

---

## 10. Acceptance matrix

| ID | Requirement | Verified by | Command | Expected result |
|---|---|---|---|---|
| A1 | Typecheck, tests, build all pass | core | `npm run check` | exit 0 |
| A2 | Public hygiene (no local paths, no binary artwork, no caches) | core | `npm run check:public` | `Public hygiene check passed.` |
| A3 | Generated data is unmodified and checksummed | core | `npm run data:check` | `Verified N generated data files.` (includes `resources.json`) |
| A4 | Resource library matches the manifest (no drift) | verifier | `node scripts/collect-resources.mjs --check` | exit 0, manifest unchanged |
| A5 | Catalog exists, is complete, and is deterministic | verifier | `node -e "…"` (§10.1) | counts match the manifest, two runs produce identical bytes |
| A6 | Every catalog URL is HTTPS and pinned | verifier | `node -e "…"` (§10.2) | 0 violations |
| A7 | Shipped code has no fs / fetch / env access | verifier | `node -e "…"` (§10.3) | `no fs/fetch/env in src` |
| A8 | npm tarball ships the catalog and the runtime API, excludes binary artwork and caches, and does not claim to ship the repo-only agent docs | verifier | `npm pack --dry-run --json` + §10.4 | no `resources/**` or `data/cache/**` entries; `llms.txt`, `docs/`, and `examples/` are repo-hosted by design (D1), so their absence from the tarball is expected and is not a failure |
| A9 | The catalog example runs against the built output | core | `node examples/agent-catalog.mjs` | exit 0, printed counts match the catalog |
| A10 | Sampled upstream URLs download and match their sha256 | verifier | `node -e "…"` (§10.5) | ≥5 samples across native and app sources, all hashes match |
| A11 | Provenance and licensing are honest | reviewer | `NOTICE`, `llms.txt`, `docs/agents.md` review | WeChat/Weibo listed as GPL-3.0 community collections, no affiliation claims |
| A12 | Docs describe only real exports and runnable commands | reviewer | `npm run check` + doc review | no invented APIs, no stale command names |
| A13 | This contract is complete and self-consistent | requirements | `node -e "…"` (§10.6) | exit 0 |

### 10.1 Catalog ↔ manifest consistency

```sh
node -e "const fs=require('fs');const m=JSON.parse(fs.readFileSync('resources/manifest.json','utf8'));const c=JSON.parse(fs.readFileSync('data/generated/resources.json','utf8'));const files=c.resources.length;const assets=c.resources.filter(r=>r.kind==='asset').length;const licenses=c.resources.filter(r=>r.kind==='license').length;const bad=[];if(c.counts.sources!==m.sourceCount)bad.push('source count');if(c.counts.files!==m.fileCount)bad.push('file count');if(files!==m.fileCount)bad.push('record count');if(assets+licenses!==files)bad.push('kind split');if(c.counts.totalBytes!==m.totalBytes)bad.push('total bytes');const ids=new Set(c.resources.map(r=>r.id));if(ids.size!==files)bad.push('duplicate ids');if(bad.length){console.error('catalog mismatch: '+bad.join(', '));process.exit(1)}console.log('catalog matches manifest:',files,'records,',c.counts.sources,'sources');"
```

### 10.2 URL / provenance scan

```sh
node -e "const fs=require('fs');const c=JSON.parse(fs.readFileSync('data/generated/resources.json','utf8'));const bad=c.resources.filter(r=>!r.url.startsWith('https://')||!/^[0-9a-f]{64}$/.test(r.sha256)||!/^[0-9a-f]{40}$/.test(r.ref)||!Number.isInteger(r.bytes)||r.path.startsWith('/')||/[A-Za-z]:[\\/]/.test(r.path));if(bad.length){console.error(bad.length+' invalid records');process.exit(1)}console.log('all',c.resources.length,'records are https + pinned + relative');"
```

### 10.3 No filesystem / network / env in shipped code

```sh
node -e "const fs=require('fs'),path=require('path');const bad=[];(function walk(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);if(e.isDirectory())walk(p);else if(/\.(ts|tsx)$/.test(p)){const s=fs.readFileSync(p,'utf8');if(/node:fs|\bfetch\s*\(|\bprocess\.env|[\x27\x22]fs[\x27\x22]/.test(s))bad.push(p);}}})('src');if(bad.length){console.error(bad.join('\n'));process.exit(1)}console.log('no fs/fetch/env in src');"
```

The scan matches `node:fs`, a bare `fs` import, any `fetch(` call, and any `process.env` read inside `src/**`
TypeScript. The `\x27` / `\x22` escapes keep the one-liner copy-pasteable in shells that treat quotes
specially.

### 10.4 npm tarball hygiene

```sh
npm pack --dry-run --json | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const files=JSON.parse(s)[0].files.map(f=>f.path);const bad=files.filter(f=>f.startsWith('resources/')||f.startsWith('data/cache/')||/\.(png|jpe?g|gif|webp)$/i.test(f));if(bad.length){console.error(bad.join('\n'));process.exit(1)}console.log(files.length+' tarball entries, no artwork or caches');});"
```

### 10.5 Sampled download + checksum check

```sh
node -e "const fs=require('fs'),crypto=require('crypto');const c=JSON.parse(fs.readFileSync('data/generated/resources.json','utf8'));const pick=c.resources.filter(r=>r.kind==='asset');const samples=['twemoji-svg','openmoji-color-svg','noto-emoji-2d-png-128','tiktok-community-svg','douyin-community-png','wechat-community-png','weibo-community-png'].map(id=>pick.find(r=>r.sourceId===id)).filter(Boolean);(async()=>{for(const s of samples){const res=await fetch(s.url);if(!res.ok)throw new Error('HTTP '+res.status+' '+s.url);const buf=Buffer.from(await res.arrayBuffer());const sha=crypto.createHash('sha256').update(buf).digest('hex');if(sha!==s.sha256)throw new Error('checksum mismatch '+s.id);console.log('ok',s.id,s.bytes);}console.log(samples.length+' samples verified');})().catch(e=>{console.error(e.message);process.exit(1)});"
```

### 10.6 Contract self-check

```sh
node -e "const fs=require('fs');const p='docs/agent-resource-contract.md';if(!fs.existsSync(p))process.exit(1);const s=fs.readFileSync(p,'utf8');for(const k of ['Public API','Catalog schema','Agent entrypoints','Source expansion','Acceptance matrix'])if(!s.includes(k))process.exit(2);"
```

---

## 11. Decisions

| ID | Decision | Status |
|---|---|---|
| D1 | Does `llms.txt` and `docs/agents.md` ship inside the npm tarball? | **Decided: no, for v0.2.** `package.json` stays unchanged in v0.2 — package metadata needs an explicit human request, and there is none. The npm tarball ships the programmatic resource API and the generated catalog only; `llms.txt`, `docs/`, and `examples/` are hosted in the GitHub repository and referenced by raw URLs pinned to a commit (§6.1.1). The contract, `llms.txt`, and `docs/agents.md` must each state exactly where an agent fetches each artifact. Revisit this decision if `package.json` `files` may change under an explicit human request. |
| D2 | Should the catalog live behind a dedicated subpath (`emoji-kit/resources`)? | **Decided: no.** It would need a `package.json` `exports` change. The resource API is exported from the root, `/core`, and `/data` entry points. Revisit in a later release if catalog size becomes a problem for consumers. |
| D3 | Should the raw library ever ship in the package? | **Decided: no.** Artwork stays in the repository under `resources/**`, excluded from npm; the catalog is the published index. |
| D4 | Should the CLI expose the catalog? | **Decided: no.** No `resources` CLI command in v0.2; the CLI command set stays as it is today. |

### Known trade-off: catalog size

The catalog is metadata for the whole pinned corpus (about 17,000 records). It is shipped as static JSON so the
package stays dependency-free and offline-capable, which means the root entry imports it statically and browser
bundles that import `emoji-kit` pay for it. Keep the record fields minimal (no duplicated source metadata beyond
`sourceId`/`ref`), keep the JSON compressible, and report the measured size in the release notes so consumers can
make an informed choice. D2 is the escape hatch if this becomes a problem.

---

## 12. Change log for this contract

| Date | Change |
|---|---|
| v0.2 draft | Initial contract: resource catalog schema, resolver API, agent entrypoints, source-expansion rules, acceptance matrix |
