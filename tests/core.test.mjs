import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import crypto from 'node:crypto';

import emoji, {
  createEmojiKit,
  createKit,
  get,
  getByName,
  getByHexcode,
  getByChar,
  search,
  list,
  renderText,
  render,
  resolveAsset,
  emojis,
  apps as rootApps,
  aliases,
  metadata,
} from '../dist/index.js';
import { apps as dataApps, assets, emojiRecords } from '../dist/data.js';
import { createEmojiKit as coreCreate, createKit as coreCreateKit } from '../dist/core.js';
import { emojiProps, useEmojiKit } from '../dist/react.js';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const require = createRequire(import.meta.url);
const tests = [];
const test = (name, fn) => tests.push([name, fn]);

test('look up by name, shortcode, char and hexcode', () => {
  assert.equal(typeof emoji, 'function');
  const ids = [
    emoji('thumbsup')?.id,
    emoji('+1')?.id,
    emoji('👍')?.id,
    emoji('1F44D')?.id,
    get('thumbsup')?.id,
    getByName('thumbsup')?.id,
    getByHexcode('1F44D')?.id,
    getByChar('👍')?.id ?? '',
  ];
  for (const id of ids.slice(0, -1)) assert.equal(id, ids[0]);
  assert.ok(ids.at(-1) === '' || ids.at(-1) === ids[0]);
});

test('definition calls compose skin tone', () => {
  const value = emoji({ name: 'thumbsup', tone: 2 });
  assert.equal(value?.char, '👍🏼');
  assert.equal(value?.hexcode, '1F44D-1F3FC');
  assert.equal(value?.variants?.some((v) => v.tone === 2), true);
});

test('gender and skin tone compose together', () => {
  const value = emoji({ name: 'technologist', gender: 'female', tone: 2 });
  assert.equal(value?.char, '👩🏼‍💻');
  assert.equal(value?.hexcode, '1F469-1F3FC-200D-1F4BB');
});

test('app-qualified definitions and aliases resolve', () => {
  assert.equal(emoji({ name: 'fire', app: 'tiktok' })?.char, '🔥');
  assert.equal(emoji({ name: 'haha', app: 'facebook' })?.char, '😂');
  const ref = emoji.define({ name: 'fire', app: 'tiktok' });
  assert.equal(emoji(ref)?.char, '🔥');
  assert.equal(get(ref)?.char, '🔥');
});

test('renderText is plain text and supports app shortcodes', () => {
  assert.equal(renderText('Hi :thumbsup: :tiktok/fire:'), 'Hi 👍 🔥');
  assert.equal(renderText('<script>:thumbsup:</script>'), '<script>👍</script>');
  assert.equal(renderText(':unknown:'), ':unknown:');
  assert.equal(renderText(':thumbsup:', { format: 'shortcode' }), ':thumbsup:');
  assert.equal(render('<b>:thumbsup:</b>'), '<b>👍</b>');
});

test('search and list support filters', () => {
  assert.ok(search('thumbs up').length > 0);
  assert.equal(search('', { limit: 1 }).length, 0);
  assert.ok(list({ app: 'github', limit: 5 }).length <= 5);
  for (const item of search('fire', { app: 'tiktok' })) {
    assert.equal(emoji({ name: item.name, app: 'tiktok' })?.char, item.char);
  }
});

test('remote assets are opt-in and HTTPS-only', () => {
  const def = { name: 'thumbsup', platform: 'github', allowRemoteAssets: true };
  const value = emoji(def);
  if (value?.assetUrl) assert.equal(value.assetUrl.startsWith('https://'), true);
  assert.equal(emoji({ name: 'thumbsup', platform: 'github' })?.assetUrl, undefined);
  const explicit = emoji({ name: 'thumbsup', assetUrl: 'http://example.com/a.png', allowRemoteAssets: true });
  assert.equal(explicit?.assetUrl, undefined);
  assert.equal(resolveAsset({ name: 'thumbsup' })?.assetUrl, undefined);
});

test('generated data is deterministic and complete', () => {
  assert.equal(emojis.length, 1958);
  assert.equal(Object.keys(aliases).length >= 3800, true);
  assert.equal(Object.keys(dataApps).length, 10);
  assert.equal(emojiRecords.length, emojis.length);
  assert.equal(dataApps, rootApps);
  assert.equal(metadata.unicodeVersion, '18.0');
});

test('assets are available from the data entry point', () => {
  assert.equal(Object.keys(assets).length >= 1000, true);
  for (const urls of Object.values(assets)) {
    assert.equal(Object.values(urls).every((url) => url.startsWith('https://')), true);
  }
});

test('isolated kit and aliases expose the same API', () => {
  const kit = createEmojiKit();
  assert.equal(kit.emoji('fire')?.char, '🔥');
  assert.equal(createKit().emoji('fire')?.char, '🔥');
  assert.equal(coreCreate().emoji('fire')?.char, '🔥');
  assert.equal(coreCreateKit().emoji('fire')?.char, '🔥');
});

test('React adapter returns accessible plain props', () => {
  const props = emojiProps({ name: 'thumbsup' });
  assert.equal(props?.role, 'img');
  assert.equal(props?.['aria-label'], 'thumbs up');
  assert.equal(props?.children, '👍');
  assert.equal(emojiProps('unknown-xyz'), undefined);
  assert.equal(typeof useEmojiKit().emoji, 'function');
});

test('CJS entry points load and expose the callable API', () => {
  const cjs = require('../dist/index.cjs');
  assert.equal(typeof cjs.default, 'function');
  assert.equal(cjs.default('fire').char, '🔥');
  assert.equal(require('../dist/core.cjs').createKit().emoji('fire').char, '🔥');
  assert.equal(require('../dist/data.cjs').emojis.length, emojis.length);
  assert.equal(typeof require('../dist/react.cjs').emojiProps, 'function');
});

test('package exports resolve to published files', () => {
  const pkg = require('../package.json');
  assert.equal(pkg.private, undefined);
  assert.equal(pkg.name, 'emoji-kit');
  assert.equal(pkg.type, 'module');
  for (const [key, value] of Object.entries(pkg.exports)) {
    if (key === './package.json') continue;
    const target = typeof value === 'string' ? value : value.import ?? value.types;
    assert.ok(fs.existsSync(path.join(root, target)), `Missing export target ${target}`);
  }
  assert.equal(fs.existsSync(path.join(root, 'dist/index.d.ts')), true);
  assert.equal(fs.existsSync(path.join(root, 'dist/react.d.ts')), true);
  assert.equal(fs.existsSync(path.join(root, 'README.md')), true);
  assert.equal(fs.existsSync(path.join(root, 'LICENSE')), true);
  assert.equal(fs.existsSync(path.join(root, 'NOTICE')), true);
});

test('checksums verify generated file contents', () => {
  const checksums = JSON.parse(fs.readFileSync(path.join(root, 'data/generated/checksums.json'), 'utf8'));
  assert.equal(Object.keys(checksums).length, 5);
  for (const [name, expected] of Object.entries(checksums)) {
    const content = fs.readFileSync(path.join(root, 'data/generated', name));
    assert.equal(crypto.createHash('sha256').update(content).digest('hex'), expected);
  }
});

let passed = 0;
for (const [name, fn] of tests) {
  try {
    fn();
    passed += 1;
    process.stdout.write(`PASS ${name}\n`);
  } catch (error) {
    process.stderr.write(`FAIL ${name}\n${error?.stack ?? error}\n`);
    process.exitCode = 1;
  }
}
process.stdout.write(`\n${passed}/${tests.length} passed.\n`);
