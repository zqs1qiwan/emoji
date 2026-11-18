import emoji, { createEmojiKit, renderText } from 'emoji-kit';

// Skin tone: the first valid tone (1-5) is used.
console.log(emoji({ name: 'thumbsup', tone: 2 }));
// { char: '👍🏼', hexcode: '1F44D-1F3FC', ... }

// Gender and skin tone compose.
console.log(emoji({ name: 'technologist', gender: 'female', tone: 2 }));
// { char: '👩🏼‍💻', hexcode: '1F469-1F3FC-200D-1F4BB', ... }

// Direct keys: id, hexcode, and char also work inside definitions.
console.log(emoji({ hexcode: '1F44D' })?.char); // 👍
console.log(emoji({ char: '👍' })?.id);         // 1F44D

// App-qualified definition calls consult the curated overlay first.
console.log(emoji({ name: 'fire', app: 'tiktok' })?.char);     // 🔥
console.log(emoji({ name: 'loveface', app: 'tiktok' })?.char); // heart-eyes emoji
console.log(emoji({ name: 'ship', app: 'github' })?.char);     // 🚀

// Define once, resolve later. The reference is reusable across kits.
const ref = emoji.define({ name: 'fire', app: 'tiktok' });
console.log(emoji(ref)?.char); // 🔥

const kit = createEmojiKit();
console.log(kit.emoji(ref)?.char); // 🔥

// Remote assets are opt-in only.
console.log(emoji.resolveAsset({ name: 'thumbsup', platform: 'github' })); // undefined
console.log(
  emoji.resolveAsset({
    name: 'thumbsup',
    platform: 'github',
    allowRemoteAssets: true,
  }),
); // HTTPS URL when a record exists

// App-qualified shortcodes in text.
console.log(renderText('Ship it :github/rocket: :tiktok/fire:'));
