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

The generated dataset includes 1,431 asset records mapping emoji ids to platform-specific **HTTPS URL references**. These are pointers to externally hosted artwork, not bundled files.

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
