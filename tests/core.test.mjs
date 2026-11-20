import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import crypto from 'node:crypto';
import { execSync } from 'node:child_process';

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
  getResource,
  listResources,
  resolveResource,
  resources,
  resourceSources,
  resourceCatalog,
} from '../dist/index.js';
import {
  apps as dataApps,
  assets,
  emojiRecords,
  resources as dataResources,
  resourceSources as dataResourceSources,
  resourceCatalog as dataResourceCatalog,
} from '../dist/data.js';
import { createEmojiKit as coreCreate, createKit as coreCreateKit } from '../dist/core.js';
import { emojiProps, useEmojiKit } from '../dist/react.js';
import { buildResourceCatalog, serializeCatalog } from '../scripts/build-resource-catalog.mjs';

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
  assert.equal(Object.keys(dataApps).length, 28);
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
  assert.equal(
    require('../dist/core.cjs').getResource('twemoji-svg:1f44d.svg')?.path,
    'resources/native/twemoji/svg/1f44d.svg',
  );
  assert.equal(
    require('../dist/data.cjs').resources.length,
    require('../dist/data.cjs').resourceCatalog.resources.length,
  );
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
  assert.equal(Object.keys(checksums).length, 6);
  assert.ok('resources.json' in checksums);
  for (const [name, expected] of Object.entries(checksums)) {
    const content = fs.readFileSync(path.join(root, 'data/generated', name));
    assert.equal(crypto.createHash('sha256').update(content).digest('hex'), expected);
  }
});

const sampleId = 'twemoji-svg:1f44d.svg';
const samplePath = 'resources/native/twemoji/svg/1f44d.svg';
const spacedPath = 'resources/native/fluentui-emoji/color/svg/1st place medal/Color/1st_place_medal_color.svg';
const spacedId = 'fluent-emoji-color-svg:1st place medal/Color/1st_place_medal_color.svg';

test('resource catalog matches the pinned manifest', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'resources/manifest.json'), 'utf8'));
  assert.equal(resourceCatalog.schemaVersion, 1);
  assert.equal(resourceCatalog.generatedFrom, 'resources/manifest.json');
  assert.equal(resourceCatalog.counts.sources, manifest.sourceCount);
  assert.equal(resourceCatalog.counts.files, manifest.fileCount);
  assert.equal(resourceCatalog.counts.totalBytes, manifest.totalBytes);
  assert.equal(resourceCatalog.counts.assets + resourceCatalog.counts.licenses, resourceCatalog.counts.files);
  assert.equal(resourceCatalog.sources.length, manifest.sourceCount);
  assert.equal(resources.length, manifest.fileCount);
  assert.equal(resourceCatalog.resources, resources);
  assert.equal(dataResourceCatalog.resources, dataResources);
  assert.equal(dataResourceCatalog, resourceCatalog);
  assert.equal(dataResourceSources.length, resourceSources.length);
});

test('resource records are pinned, relative, and unique', () => {
  const ids = new Set();
  for (const record of resources) {
    assert.equal(ids.has(record.id), false, `duplicate resource id ${record.id}`);
    ids.add(record.id);
    assert.equal(record.url.startsWith('https://'), true);
    assert.equal(record.url.includes('@'), false);
    assert.match(record.ref, /^[0-9a-f]{40}$/);
    assert.match(record.sha256, /^[0-9a-f]{64}$/);
    assert.equal(Number.isInteger(record.bytes), true);
    assert.equal(record.path.startsWith('/'), false);
    assert.equal(record.path.includes('\\'), false);
    assert.equal(record.path.split('/').some((segment) => segment === '..' || segment === '.'), false);
    assert.equal(['asset', 'license'].includes(record.kind), true);
    assert.equal(['native', 'app'].includes(record.category), true);
  }
  const sources = new Set(resourceSources.map((source) => source.id));
  assert.equal(sources.size, resourceSources.length);
  for (const source of resourceSources) {
    assert.match(source.ref, /^[0-9a-f]{40}$/);
    assert.equal(source.repositoryUrl.startsWith('https://'), true);
    assert.equal(source.licenseUrl.startsWith('https://'), true);
    assert.equal(source.assetCount + source.licenseCount > 0, true);
  }
});

test('resource records are sorted by path and free of timestamps', () => {
  for (let index = 1; index < resources.length; index += 1) {
    assert.equal(resources[index - 1].path < resources[index].path, true);
  }
  const sourceIds = resourceSources.map((source) => source.id);
  for (let index = 1; index < sourceIds.length; index += 1) {
    assert.equal(sourceIds[index - 1] < sourceIds[index], true);
  }
  const serialized = JSON.stringify(resourceCatalog);
  assert.equal(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(serialized), false);
  assert.equal(/[A-Za-z]:\\Users\\/.test(serialized), false);
  assert.equal(/"[^"]*(?:localhost|@[^/"]*)"/.test(serialized), false);
});

test('getResource looks up by id, path, and url', () => {
  assert.equal(getResource(sampleId)?.path, samplePath);
  assert.equal(getResource(samplePath)?.id, sampleId);
  const url = getResource(sampleId)?.url;
  assert.equal(getResource(url)?.id, sampleId);
  assert.equal(getResource({ id: sampleId })?.path, samplePath);
  assert.equal(getResource({ path: samplePath })?.id, sampleId);
  assert.equal(getResource({ url })?.id, sampleId);
});

test('resource lookup accepts encoded and decoded paths', () => {
  const encodedPath = spacedPath.replace(/ /g, '%20');
  assert.equal(getResource(encodedPath)?.id, spacedId);
  assert.equal(getResource(spacedPath)?.id, spacedId);
  assert.equal(getResource({ path: encodedPath })?.id, spacedId);
  const url = getResource(spacedId)?.url;
  assert.equal(getResource(url)?.id, spacedId);
  assert.equal(getResource(url.replace(/%20/g, ' '))?.id, spacedId);
  assert.equal(getResource({ url: url.replace(/%20/g, ' ') })?.id, spacedId);
});

test('resource filters narrow the catalog', () => {
  const bySource = listResources({ sourceId: 'twemoji-svg', limit: 500 });
  assert.ok(bySource.length > 0);
  assert.equal(bySource.every((record) => record.sourceId === 'twemoji-svg'), true);

  const byApp = listResources({ app: 'weibo', limit: 500 });
  assert.ok(byApp.length > 0);
  assert.equal(byApp.every((record) => record.app === 'weibo'), true);

  const nativeAssets = listResources({ category: 'native', kind: 'asset', limit: 500 });
  assert.ok(nativeAssets.length > 0);
  assert.equal(nativeAssets.every((record) => record.category === 'native' && record.kind === 'asset'), true);

  const svgs = listResources({ format: 'svg', limit: 500 });
  assert.ok(svgs.length > 0);
  assert.equal(svgs.every((record) => record.format === 'svg'), true);
  assert.equal(listResources({ format: '.SVG', limit: 5 }).length, listResources({ format: 'svg', limit: 5 }).length);

  const licenses = listResources({ kind: 'license', limit: 500 });
  assert.ok(licenses.length > 0);
  assert.equal(licenses.every((record) => record.kind === 'license'), true);

  const combined = listResources({ sourceId: 'twemoji-svg', format: 'svg', limit: 500 });
  assert.ok(combined.length > 0);
  assert.equal(combined.every((record) => record.sourceId === 'twemoji-svg' && record.format === 'svg'), true);
  assert.equal(listResources({ sourceId: 'twemoji-svg', format: 'png' }).length, 0);
});

test('resource listing honors the limit', () => {
  assert.equal(listResources().length, 20);
  assert.equal(listResources({ limit: 0 }).length, 0);
  assert.equal(listResources({ limit: -1 }).length, 20);
  assert.equal(listResources({ limit: 2.9 }).length, 2);
  assert.equal(listResources({ limit: 1000 }).length, 500);
  assert.equal(listResources({ limit: Number.NaN }).length, 20);
  assert.equal(listResources({ limit: Number.POSITIVE_INFINITY }).length, 500);
  assert.equal(listResources({ limit: 5 }).length, 5);
});

test('resource lookups never throw on unknown input', () => {
  assert.equal(getResource('nope'), undefined);
  assert.equal(getResource(''), undefined);
  assert.equal(getResource('   '), undefined);
  assert.equal(getResource({}), undefined);
  assert.equal(getResource({ sourceId: 'twemoji-svg' }), undefined);
  assert.equal(getResource({ id: sampleId, app: 'weibo' }), undefined);
  assert.deepEqual(listResources({ sourceId: 'nope' }), []);
  assert.deepEqual(listResources({ id: 'nope' }), []);
  assert.equal(resolveResource('nope'), undefined);
  assert.equal(resolveResource({ path: 'resources/nope.svg' }), undefined);
  assert.equal(resolveResource({ id: sampleId })?.id, sampleId);
  assert.equal(resolveResource({ sourceId: 'twemoji-svg' })?.id.startsWith('twemoji-svg:'), true);
});

test('resource resolution returns metadata only', () => {
  const record = resolveResource(sampleId);
  assert.equal(record?.path, samplePath);
  assert.equal(typeof record?.url, 'string');
  assert.equal(Object.keys(record ?? {}).sort().join(','), 'app,bytes,category,format,id,kind,license,path,ref,repository,sha256,sourceId,upstreamPath,url');
});

test('resource catalog generation is deterministic', () => {
  const expected = serializeCatalog(buildResourceCatalog(root));
  const actual = fs.readFileSync(path.join(root, 'data/generated/resources.json'), 'utf8');
  assert.equal(actual, expected);
  assert.equal(serializeCatalog(buildResourceCatalog(root)), expected);
});

test('shipped core performs no network or filesystem access', () => {
  const banned = /node:fs|\bfetch\s*\(|\bprocess\.env|['"]fs['"]/;
  const files = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const target = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(target);
      else if (entry.name.endsWith('.ts')) files.push(target);
    }
  };
  walk(path.join(root, 'src'));
  assert.ok(files.length > 0);
  for (const file of files) {
    const source = fs.readFileSync(file, 'utf8');
    assert.equal(banned.test(source), false, `src file must stay browser-safe: ${path.relative(root, file)}`);
  }
});

test('npm tarball ships metadata only and never raw artwork', () => {
  const raw = execSync('npm pack --dry-run --json', {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
  const start = raw.indexOf('[');
  const end = raw.lastIndexOf(']');
  assert.ok(start >= 0 && end > start, 'npm pack did not report a file list');
  const files = JSON.parse(raw.slice(start, end + 1))[0].files.map((entry) => entry.path);
  assert.equal(files.some((file) => file.startsWith('resources/')), false);
  assert.equal(files.some((file) => file.startsWith('data/cache/')), false);
  assert.equal(files.some((file) => /\.(png|jpe?g|gif|webp|ico|bmp)$/i.test(file)), false);
  assert.equal(files.includes('dist/data/generated/resources.json'), true);
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
