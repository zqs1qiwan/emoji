# React

`emoji-kit/react` is a thin adapter around the core. It has **no peer dependency** on React in this package and uses no React hooks internally — `useEmojiKit()` is a plain function that returns an isolated kit.

```js
import { useEmojiKit, emojiProps, createEmojiKit } from 'emoji-kit/react';
```

## `useEmojiKit()`

Returns a fresh `EmojiKit` instance with prebuilt indexes.

```tsx
import { useEmojiKit } from 'emoji-kit/react';

function Search({ query }: { query: string }) {
  const kit = useEmojiKit();
  const results = kit.search(query, { limit: 5 });
  return (
    <ul>
      {results.map((item) => (
        <li key={item.id}>{item.char} {item.label}</li>
      ))}
    </ul>
  );
}
```

Because a new kit is created per call, memoize the result in your component if you call it repeatedly in a hot path, or use the core `createEmojiKit()` from `emoji-kit` directly with your own memoization.

## `emojiProps(input)`

Resolves an emoji definition and returns accessible props, or `undefined` when the input cannot be resolved.

```tsx
import { emojiProps } from 'emoji-kit/react';

function Emoji({ name }: { name: string }) {
  const props = emojiProps({ name, tone: 2 });
  return props ? <span {...props} /> : null;
}
```

Returned props:

| Prop | Value |
| --- | --- |
| `role` | `'img'` |
| `aria-label` | The emoji's human-readable `label` |
| `children` | The Unicode character (`char`) |

This keeps emoji decorative-but-labelled: assistive technology reads the label, while the visible content is the native character. No HTML is injected; `children` is plain text.

## App-qualified emoji

```tsx
<span {...emojiProps({ name: 'fire', app: 'tiktok' })} />
```

Or render a token string with the core API:

```tsx
import { renderText } from 'emoji-kit';

<p>{renderText('Hi :thumbsup: :tiktok/fire:')}</p>
```

React escapes the returned string as text, and `renderText()` itself never emits HTML.

## TypeScript

The adapter ships declarations. `emojiProps` accepts the same `EmojiInput` type as the core `emoji()` call: a string, an `EmojiDefinition`, or a reference from `emoji.define()`. See [API reference](api.md) for the input fields.

See [examples/react.tsx](../examples/react.tsx) for a complete example.
