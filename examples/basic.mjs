import emoji, { createEmojiKit, get, search, list, renderText } from 'emoji-kit';

// Look up by name, alias, Unicode character, or hex code.
console.log(emoji('thumbsup')?.char); // 👍
console.log(emoji('+1')?.char);       // 👍
console.log(emoji('👍')?.id);         // 1F44D
console.log(emoji('1F44D')?.id);      // 1F44D

// Named helpers.
console.log(get('thumbsup')?.label);
console.log(search('thumbs up', { limit: 3 }).map((item) => item.char));
console.log(list({ app: 'github', limit: 5 }).map((item) => item.shortcode));

// Text rendering never emits HTML; app tokens use a slash.
console.log(renderText('Hi :thumbsup: :tiktok/fire:'));

// An isolated kit has the same API.
const kit = createEmojiKit();
console.log(kit.search('fire', { limit: 2 }).map((item) => item.char));
