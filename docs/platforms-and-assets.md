# Platforms and assets

emoji-kit separates **Unicode emoji characters** from **remote platform artwork**. By default, everything resolves to native Unicode characters, which keeps the core browser-safe, offline, and free of bundled artwork.

## Native rendering

The default `platform` is `native`. Lookups return the Unicode `char` and `hexcode` for the requested emoji (and skin-tone / gender variant when specified):

```js
emoji('thumbsup').char; // '👍'
emoji({ name: 'thumbsup', tone: 2 }).char; // '👍🏼'
```

Native emoji are rendered by the operating system or browser font. emoji-kit does not ship fonts or images and makes **no promise of pixel-identical rendering** with any platform, app, or vendor set.

## Asset records

The generated dataset includes 1,431 asset records mapping emoji ids to platform-specific **HTTPS URL references**. These are v0.1 app-overlay asset URL references — **distinct from the v0.2 raw resource catalog** (documented below), which indexes saved files in the repository rather than remote pointers. These records are pointers to externally hosted artwork, not bundled files.

By design, **no remote asset URL is returned unless you opt in**:

```js
emoji.resolveAsset({ name: 'thumbsup', platform: 'github' });
// undefined — allowRemoteAssets was not set

emoji.resolveAsset({
  name: 'thumbsup',
  platform: 'github',
  allowRemoteAssets: true,
});
// HTTPS URL string when a matching record exists

emoji({ name: 'thumbsup', platform: 'github', allowRemoteAssets: true }).assetUrl;
```

An explicit `assetUrl` in a definition is also gated by `allowRemoteAssets`. `assetFallback` (`'base' | 'none'`) is a reserved preference for consumers; the core never fetches a fallback itself.

## Raw resource catalog (v0.2)

The repository also preserves a **raw resource library** under `resources/**`: 8 pinned public sources, 17,026 files (17,018 artwork files + 8 license records), totaling 190,371,148 bytes. It is generated deterministically from `resources/manifest.json`, and every catalog record captures the source commit, upstream HTTPS URL, license, sha256 and byte size.

Unlike the 1,431 app-overlay `assets` URL references above, this catalog indexes **saved files** in the repository, not remote asset pointers.

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

The catalog's public data exports are `resources`, `resourceSources` and `resourceCatalog` (from `emoji-kit`, `emoji-kit/core` and `emoji-kit/data`); the lookup helpers are `getResource`, `listResources` and `resolveResource`.

This raw library is **not shipped in the npm package** and is **not loaded by the core**; `resources/**` stays in the repository for reference. The Twemoji, OpenMoji, Noto and Fluent collections are under their own open licenses (see [NOTICE](../NOTICE)). The Douyin, TikTok, WeChat and Weibo collections are **unofficial GPL-3.0 community collections** and are not official or affiliated with those platforms.

## Safety rules

- Every referenced URL is HTTPS.
- Raw JSON is treated as untrusted and normalized by the build pipeline.
- No `eval` or dynamic code execution.
- No network or filesystem access from the core at runtime.
- No proprietary or vendor artwork is bundled in the npm package. The repository also contains a separate raw resource library under `resources/**` for research/reference; it is not shipped or loaded by the core.
- `renderText()` returns plain text and never emits HTML.

Because asset URLs are external, consumers are responsible for any network requests they choose to make, including respecting the terms of the remote host. The GitHub app overlay uses a pinned URL index subject to the GitHub API Terms; see [NOTICE](../NOTICE) and [app categories](app-categories.md).

## Choosing a strategy

| Goal | Recommended approach |
| --- | --- |
| Consistent API across web / Node, no network | Use native `char` values (default) |
| Show a platform-specific image | Enable `allowRemoteAssets`, handle loading and fallback yourself |
| Offline / privacy-sensitive UI | Stay native; generated JSON is already bundled |
| Accessible labels | Use `label` (`emojiProps` in React sets `aria-label`) |

See [API reference](api.md) for `resolveAsset` and definition fields, and [React](react.md) for accessible rendering helpers.
