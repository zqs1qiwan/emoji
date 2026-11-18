import https from 'node:https';
import fs from 'node:fs';
import crypto from 'node:crypto';

const presets = ['cldr', 'emojibase', 'github', 'iamcal'];
for (const preset of presets) {
  const url = `https://cdn.jsdelivr.net/npm/emojibase-data@18.0.0/en/shortcodes/${preset}.json`;
  const body = await new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'emoji-kit-data-builder/0.1' } }, (res) => {
      if (res.statusCode !== 200) { res.resume(); reject(new Error(`${preset}: HTTP ${res.statusCode}`)); return; }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', reject);
  });
  fs.writeFileSync(`data/cache/shortcodes-${preset}.json`, body);
  console.log(preset, body.length, crypto.createHash('sha256').update(body).digest('hex'));
}
