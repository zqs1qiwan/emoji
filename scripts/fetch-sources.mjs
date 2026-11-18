import https from 'node:https';
import fs from 'node:fs';
import crypto from 'node:crypto';

const sources = [
  ['emojibase-data', 'https://cdn.jsdelivr.net/npm/emojibase-data@18.0.0/en/data.json', 'data/cache/emojibase-data.json'],
  ['github-emojis', 'https://api.github.com/emojis', 'data/cache/github-emojis.json'],
  ['gemoji', 'https://raw.githubusercontent.com/github/gemoji/master/db/emoji.json', 'data/cache/gemoji.json'],
  ['iamcal-license', 'https://raw.githubusercontent.com/iamcal/emoji-data/master/LICENSE', 'data/cache/iamcal-LICENSE.txt'],
  ['gemoji-license', 'https://raw.githubusercontent.com/github/gemoji/master/LICENSE', 'data/cache/gemoji-LICENSE.txt'],
  ['emojibase-license', 'https://raw.githubusercontent.com/milesj/emojibase/master/packages/data/LICENSE', 'data/cache/emojibase-LICENSE.txt'],
  ['unicode-license', 'https://www.unicode.org/license.txt', 'data/cache/unicode-LICENSE.txt'],
  ['emojibase-files', 'https://data.jsdelivr.com/v1/package/npm/emojibase-data@18.0.0/flat', 'data/cache/emojibase-files.json'],
];

fs.mkdirSync('data/cache', { recursive: true });

function get(url) {
  return new Promise((resolve, reject) => {
    const request = https.get(url, {
      headers: {
        'User-Agent': 'emoji-kit-data-builder/0.1',
        Accept: 'application/json,text/plain,*/*',
      },
    }, (res) => {
      if (res.statusCode !== 200) {
        res.resume();
        reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        return;
      }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    });
    request.on('error', reject);
  });
}

for (const [name, url, file] of sources) {
  try {
    const body = await get(url);
    fs.writeFileSync(file, body);
    console.log(name, body.length, crypto.createHash('sha256').update(body).digest('hex'));
  } catch (error) {
    console.error('FAILED', name, error.message);
    process.exitCode = 1;
  }
}
