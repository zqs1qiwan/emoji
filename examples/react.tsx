import { emojiProps, useEmojiKit } from 'emoji-kit/react';
import { renderText } from 'emoji-kit';

/** A labelled emoji using accessible props from the thin React adapter. */
export function EmojiBadge({ name }: { name: string }) {
  const props = emojiProps({ name, tone: 2 });
  return props ? <span {...props} /> : null;
}

/** Search using an isolated kit; memoize in a real app if called frequently. */
export function EmojiSearch({ query }: { query: string }) {
  const kit = useEmojiKit();
  const results = kit.search(query, { limit: 5 });
  return (
    <ul>
      {results.map((item) => (
        <li key={item.id}>
          <span role="img" aria-label={item.label}>{item.char}</span>{' '}
          {item.shortcode}
        </li>
      ))}
    </ul>
  );
}

/** renderText returns plain text, which React escapes as usual. */
export function Message() {
  return <p>{renderText('Hi :thumbsup: :tiktok/fire:')}</p>;
}
