import { createEmojiKit } from './index.js';

/** Thin React adapter with no peer dependency and no hooks. */
export function useEmojiKit() {
  return createEmojiKit();
}

export function emojiProps(input: Parameters<ReturnType<typeof createEmojiKit>['emoji']>[0]) {
  const emoji = createEmojiKit().emoji(input);
  return emoji
    ? {
        role: 'img' as const,
        'aria-label': emoji.label,
        children: emoji.char,
      }
    : undefined;
}

export { createEmojiKit } from './index.js';
