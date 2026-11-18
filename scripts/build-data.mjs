import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = process.cwd();
const cacheDir = path.join(root, 'data/cache');
const outDir = path.join(root, 'data/generated');
const sources = JSON.parse(fs.readFileSync(path.join(root, 'data/sources/sources.json'), 'utf8'));

function readCached(id, file) {
  const source = sources.sources.find((s) => s.id === id);
  if (!source) throw new Error(`Missing source metadata: ${id}`);
  const buffer = fs.readFileSync(path.join(cacheDir, file));
  const digest = crypto.createHash('sha256').update(buffer).digest('hex');
  if (digest !== source.sha256) {
    throw new Error(`Checksum mismatch for ${id}: expected ${source.sha256}, got ${digest}`);
  }
  return buffer.toString('utf8');
}

function parseJson(text, label) {
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`Invalid JSON in ${label}: ${error.message}`);
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function normalizeKey(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[\s]+/g, '_')
    .replace(/[^a-z0-9+_-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function canonicalHex(hexcode) {
  return String(hexcode ?? '')
    .toUpperCase()
    .split('-')
    .filter((part) => part && part !== 'FE0F')
    .join('-');
}

function codepointsToChar(hexcode) {
  return String(hexcode)
    .split('-')
    .map((point) => String.fromCodePoint(Number.parseInt(point, 16)))
    .join('');
}

function jsonLine(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function versionNumber(value) {
  if (typeof value === 'number') return Math.floor(value) || null;
  const parsed = Number.parseFloat(String(value ?? ''));
  return Number.isFinite(parsed) ? Math.floor(parsed) : null;
}

const emojibase = parseJson(readCached('emojibase-data', 'emojibase-data.json'), 'emojibase-data');
const githubEmojis = parseJson(readCached('github-emojis', 'github-emojis.json'), 'github-emojis');
const gemoji = parseJson(readCached('gemoji', 'gemoji.json'), 'gemoji');
const iamcal = parseJson(readCached('iamcal', 'iamcal-emoji.json'), 'iamcal');
const cldrShortcodes = parseJson(readCached('emojibase-shortcodes-cldr', 'shortcodes-cldr.json'), 'cldr shortcodes');
const emojibaseShortcodes = parseJson(readCached('emojibase-shortcodes-emojibase', 'shortcodes-emojibase.json'), 'emojibase shortcodes');
const githubShortcodes = parseJson(readCached('emojibase-shortcodes-github', 'shortcodes-github.json'), 'github shortcodes');
const iamcalShortcodes = parseJson(readCached('emojibase-shortcodes-iamcal', 'shortcodes-iamcal.json'), 'iamcal shortcodes');
const appSource = parseJson(
  fs.readFileSync(path.join(root, 'data/sources/app-categories.json'), 'utf8'),
  'app-categories',
);

assert(Array.isArray(emojibase) && emojibase.length > 1000, 'Unexpected emojibase data shape');
assert(Array.isArray(gemoji) && gemoji.length > 1000, 'Unexpected gemoji data shape');
assert(Array.isArray(iamcal) && iamcal.length > 1000, 'Unexpected iamcal data shape');
assert(githubEmojis && !Array.isArray(githubEmojis), 'Unexpected GitHub emojis shape');
assert(Array.isArray(appSource.apps), 'Unexpected app category source shape');

function aliasesForHex(map, hexcode) {
  const keys = [String(hexcode).toUpperCase(), canonicalHex(hexcode)];
  for (const key of keys) {
    const value = map[key];
    if (Array.isArray(value)) return value.map(normalizeKey).filter(Boolean);
    if (typeof value === 'string') return [normalizeKey(value)].filter(Boolean);
  }
  return [];
}

const gemojiByChar = new Map(gemoji.map((item) => [item.emoji, item]));
const iamcalByHex = new Map(iamcal.map((item) => [canonicalHex(item.unified), item]));
const githubUrlByChar = new Map();

for (const [shortcode, url] of Object.entries(githubEmojis)) {
  const match = String(url).match(/\/unicode\/([0-9a-f-]+)\.png/i);
  if (!match) continue;
  try {
    githubUrlByChar.set(codepointsToChar(match[1]), String(url));
  } catch {
    // Ignore malformed upstream URLs.
  }
}

const seenIds = new Set();
const emojis = [];
const aliasRecords = [];
const assetRecords = [];

for (const item of emojibase) {
  const hexcode = String(item.hexcode ?? '').toUpperCase();
  if (!hexcode) continue;
  const id = canonicalHex(hexcode);
  if (seenIds.has(id)) continue;
  seenIds.add(id);

  const char = item.emoji || codepointsToChar(hexcode);
  const canonicalShortcodes = [
    ...aliasesForHex(cldrShortcodes, hexcode),
    ...aliasesForHex(emojibaseShortcodes, hexcode),
    ...aliasesForHex(githubShortcodes, hexcode),
    ...aliasesForHex(iamcalShortcodes, hexcode),
  ];
  const gemojiEntry = gemojiByChar.get(char);
  if (gemojiEntry) {
    canonicalShortcodes.push(...gemojiEntry.aliases.map(normalizeKey));
  }
  const iamcalEntry = iamcalByHex.get(id);
  if (iamcalEntry) {
    canonicalShortcodes.push(normalizeKey(iamcalEntry.short_name));
    canonicalShortcodes.push(...iamcalEntry.short_names.map(normalizeKey));
  }

  const shortcodes = [...new Set(canonicalShortcodes.filter(Boolean))].sort();
  const tags = [...new Set([
    ...(Array.isArray(item.tags) ? item.tags.map(normalizeKey) : []),
    ...(gemojiEntry?.tags ?? []).map(normalizeKey),
  ].filter(Boolean))].sort();

  const skins = (Array.isArray(item.skins) ? item.skins : [])
    .filter((skin) => skin?.hexcode)
    .map((skin) => ({
      id: canonicalHex(skin.hexcode),
      hexcode: String(skin.hexcode).toUpperCase(),
      char: skin.emoji || codepointsToChar(skin.hexcode),
      tone: skin.tone,
      label: skin.label,
    }));

  const platforms = {};
  const githubUrl = githubUrlByChar.get(char);
  if (githubUrl) platforms.github = githubUrl;

  const hasImg = {};
  if (iamcalEntry) {
    hasImg.apple = Boolean(iamcalEntry.has_img_apple);
    hasImg.google = Boolean(iamcalEntry.has_img_google);
    hasImg.twitter = Boolean(iamcalEntry.has_img_twitter);
    hasImg.facebook = Boolean(iamcalEntry.has_img_facebook);
  }

  const variants = [];
  for (const skin of skins) {
    variants.push({ id: skin.id, tone: skin.tone });
  }

  const entry = {
    id,
    hexcode,
    char,
    name: iamcalEntry ? normalizeKey(iamcalEntry.name) : normalizeKey(item.label),
    label: item.label,
    shortcodes,
    tags,
    group: item.group ?? null,
    subgroup: item.subgroup ?? null,
    legacyCategory: iamcalEntry?.category ?? gemojiEntry?.category ?? null,
    legacySubcategory: iamcalEntry?.subcategory ?? null,
    order: item.order ?? Number.MAX_SAFE_INTEGER,
    version: versionNumber(item.version ?? iamcalEntry?.added_in ?? gemojiEntry?.unicode_version),
    skins,
    platforms,
    hasImg,
    variants,
  };

  emojis.push(entry);
  for (const shortcode of shortcodes) {
    aliasRecords.push({ alias: shortcode, id });
  }
  if (Object.keys(platforms).length > 0) {
    assetRecords.push({ id, platforms });
  }
}

emojis.sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
aliasRecords.sort((a, b) => a.alias.localeCompare(b.alias));
assetRecords.sort((a, b) => a.id.localeCompare(b.id));

const byShortcode = new Map();
for (const alias of aliasRecords) {
  if (!byShortcode.has(alias.alias)) byShortcode.set(alias.alias, alias.id);
}

const appData = {};
for (const app of appSource.apps) {
  const aliases = {};
  const categories = {};
  for (const [alias, target] of Object.entries(app.aliases ?? {})) {
    const canonical = byShortcode.get(normalizeKey(target)) || byShortcode.get(String(target));
    if (canonical) aliases[normalizeKey(alias)] = canonical;
  }
  for (const [category, names] of Object.entries(app.categories ?? {})) {
    categories[category] = names.map((name) => byShortcode.get(normalizeKey(name))).filter(Boolean);
  }
  appData[app.id] = {
    id: app.id,
    label: app.label,
    note: app.note,
    source: app.source,
    canonicalCategory: app.canonicalCategory,
    categories,
    aliases,
  };
}

const aliasMap = {};
for (const alias of aliasRecords) {
  if (!(alias.alias in aliasMap)) aliasMap[alias.alias] = alias.id;
}

const assets = {};
for (const asset of assetRecords) assets[asset.id] = asset.platforms;

const groups = [...new Set(emojis.map((entry) => entry.group).filter((value) => typeof value === 'number'))].sort((a, b) => a - b);
const subgroups = [...new Set(emojis.map((entry) => entry.subgroup).filter((value) => typeof value === 'number'))].sort((a, b) => a - b);

const metadata = {
  schemaVersion: 1,
  unicodeVersion: sources.unicodeVersion,
  emojiVersion: sources.emojiVersion,
  cldrVersion: sources.cldrVersion,
  generatedFrom: 'pinned public datasets; no timestamps',
  counts: {
    emojis: emojis.length,
    skins: emojis.reduce((total, entry) => total + entry.skins.length, 0),
    aliases: aliasRecords.length,
    appTags: Object.values(appData).reduce(
      (total, app) => total + Object.keys(app.aliases).length + Object.values(app.categories).reduce((sum, list) => sum + list.length, 0),
      0,
    ),
  },
  groups,
  subgroups,
  sources: sources.sources,
};

const files = {
  'emojis.json': emojis,
  'aliases.json': aliasMap,
  'apps.json': appData,
  'assets.json': assets,
  'meta.json': metadata,
};

fs.mkdirSync(outDir, { recursive: true });
for (const [name, value] of Object.entries(files)) {
  fs.writeFileSync(path.join(outDir, name), jsonLine(value));
}

const checksums = {};
for (const name of Object.keys(files)) {
  checksums[name] = crypto.createHash('sha256').update(fs.readFileSync(path.join(outDir, name))).digest('hex');
}
fs.writeFileSync(path.join(outDir, 'checksums.json'), jsonLine(checksums));

console.log(`Generated ${emojis.length} emojis, ${aliasRecords.length} aliases, ${Object.keys(assets).length} asset records.`);
