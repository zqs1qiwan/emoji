#!/usr/bin/env node
/**
 * Deterministic generator for the pinned raw emoji resource catalog.
 *
 * Reads exactly one input: `resources/manifest.json` (the manifest written by
 * `scripts/collect-resources.mjs`). It never touches the network, never needs
 * `data/cache`, and never reads the clock, so the output is byte-stable.
 *
 * Outputs:
 *   - `data/generated/resources.json`  the catalog (records + sources + counts)
 *   - `data/generated/checksums.json`  gains/refreshes the `resources.json` entry
 *
 * Usage:
 *   node scripts/build-resource-catalog.mjs           # write the catalog
 *   node scripts/build-resource-catalog.mjs --check   # fail if the file drifted
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

export const CATALOG_SCHEMA_VERSION = 1;
export const CATALOG_FILE_NAME = 'resources.json';
export const MANIFEST_RELATIVE_PATH = 'resources/manifest.json';
export const CHECKSUM_FILE_NAME = 'checksums.json';

const HEX_40 = /^[0-9a-f]{40}$/;
const HEX_64 = /^[0-9a-f]{64}$/;
const SOURCE_TYPES = new Set(['open-source-repository', 'community-repository']);
const CATEGORIES = new Set(['native', 'app']);
const KINDS = new Set(['asset', 'license']);

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
export const packageRoot = path.resolve(scriptDir, '..');

function fail(message) {
  throw new Error(`build-resource-catalog: ${message}`);
}

function assert(condition, message) {
  if (!condition) fail(message);
}

/** Byte-wise ascending comparison of two POSIX paths. */
export function comparePaths(left, right) {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

function assertRelativePosixPath(value, label) {
  assert(typeof value === 'string' && value.length > 0, `${label} must be a non-empty string`);
  assert(!value.startsWith('/'), `${label} must be relative: ${value}`);
  assert(!value.includes('\\'), `${label} must use POSIX separators: ${value}`);
  assert(!/[A-Za-z]:/.test(value), `${label} must not contain a drive letter: ${value}`);
  for (const segment of value.split('/')) {
    assert(segment && segment !== '.' && segment !== '..', `${label} has an unsafe segment: ${value}`);
  }
  return value;
}

function assertHttpsUrl(value, label) {
  assert(typeof value === 'string' && value.length > 0, `${label} must be a non-empty string`);
  let url;
  try {
    url = new URL(value);
  } catch {
    return fail(`${label} is not a valid URL: ${value}`);
  }
  assert(url.protocol === 'https:', `${label} must use HTTPS: ${value}`);
  assert(!url.username && !url.password, `${label} must not embed credentials`);
  return value;
}

/** Lowercase extension without the dot; empty string when the file has none. */
export function formatOfFilePath(filePath) {
  const base = filePath.slice(filePath.lastIndexOf('/') + 1);
  const dot = base.lastIndexOf('.');
  if (dot <= 0) return '';
  return base.slice(dot + 1).toLowerCase();
}

/**
 * Stable id: `<sourceId>:<name-within-source>`.
 * Assets use the path relative to the source destination prefix, license files
 * use `license/<basename>`.
 */
export function resourceIdFor(source, file) {
  if (file.kind === 'license') {
    const base = file.path.slice(file.path.lastIndexOf('/') + 1);
    return `${source.id}:license/${base}`;
  }
  const prefix = `${source.destinationPrefix}/`;
  assert(file.path.startsWith(prefix), `asset ${file.path} is not inside ${source.destinationPrefix}`);
  return `${source.id}:${file.path.slice(prefix.length)}`;
}

function readManifest(root) {
  const manifestPath = path.join(root, ...MANIFEST_RELATIVE_PATH.split('/'));
  let raw;
  try {
    raw = fs.readFileSync(manifestPath, 'utf8');
  } catch (error) {
    return fail(`cannot read ${MANIFEST_RELATIVE_PATH}: ${error.message}`);
  }
  let manifest;
  try {
    manifest = JSON.parse(raw);
  } catch (error) {
    return fail(`${MANIFEST_RELATIVE_PATH} is not valid JSON: ${error.message}`);
  }
  assert(manifest && typeof manifest === 'object', `${MANIFEST_RELATIVE_PATH} must contain an object`);
  assert(manifest.version === 1, `unsupported manifest version: ${manifest.version}`);
  assert(Array.isArray(manifest.sources), `${MANIFEST_RELATIVE_PATH} must contain a sources array`);
  assert(Array.isArray(manifest.files), `${MANIFEST_RELATIVE_PATH} must contain a files array`);
  return manifest;
}

function buildSources(manifest) {
  const sources = new Map();
  for (const source of manifest.sources) {
    assert(source && typeof source === 'object', 'every source must be an object');
    assert(typeof source.id === 'string' && source.id.length > 0, 'every source needs an id');
    assert(!sources.has(source.id), `duplicate source id: ${source.id}`);
    assert(CATEGORIES.has(source.category), `invalid category for ${source.id}: ${source.category}`);
    assert(SOURCE_TYPES.has(source.sourceType), `invalid sourceType for ${source.id}: ${source.sourceType}`);
    assert(typeof source.app === 'string' && source.app.length > 0, `source ${source.id} needs an app`);
    assert(typeof source.repository === 'string' && source.repository.length > 0, `source ${source.id} needs a repository`);
    assert(HEX_40.test(source.ref), `source ${source.id} must pin a 40-hex commit: ${source.ref}`);
    assert(typeof source.license === 'string' && source.license.length > 0, `source ${source.id} needs a license`);
    assert(typeof source.ownershipNote === 'string' && source.ownershipNote.length > 0, `source ${source.id} needs an ownershipNote`);
    assert(typeof source.destinationPrefix === 'string' && source.destinationPrefix.length > 0, `source ${source.id} needs a destinationPrefix`);
    assertRelativePosixPath(source.destinationPrefix, `${source.id}.destinationPrefix`);
    assert(
      source.destinationPrefix.startsWith('resources/'),
      `source ${source.id} destinationPrefix must live inside resources/`,
    );
    assertHttpsUrl(source.repositoryUrl, `${source.id}.repositoryUrl`);
    assertHttpsUrl(source.licenseUrl, `${source.id}.licenseUrl`);
    if (source.licenseFileUrl !== null && source.licenseFileUrl !== undefined) {
      assertHttpsUrl(source.licenseFileUrl, `${source.id}.licenseFileUrl`);
    }
    if (source.licenseFile !== null && source.licenseFile !== undefined) {
      assertRelativePosixPath(source.licenseFile, `${source.id}.licenseFile`);
    }
    assert(Number.isInteger(source.expectedFiles) && source.expectedFiles >= 0, `invalid expectedFiles for ${source.id}`);
    assert(Number.isInteger(source.fileCount) && source.fileCount >= 0, `invalid fileCount for ${source.id}`);
    assert(Number.isInteger(source.totalBytes) && source.totalBytes >= 0, `invalid totalBytes for ${source.id}`);
    sources.set(source.id, source);
  }
  return sources;
}

/**
 * Builds the catalog object from the pinned manifest. Pure: no clock, no
 * network, no filesystem access beyond the manifest itself.
 */
export function buildResourceCatalog(root = packageRoot) {
  const manifest = readManifest(root);
  const sources = buildSources(manifest);

  const records = [];
  const ids = new Set();
  const paths = new Set();
  const assetCounts = new Map();
  const licenseCounts = new Map();

  for (const file of manifest.files) {
    assert(file && typeof file === 'object', 'every manifest file must be an object');
    assert(typeof file.path === 'string' && file.path.length > 0, 'every manifest file needs a path');
    assertRelativePosixPath(file.path, `file ${file.path}`);
    assert(!paths.has(file.path), `duplicate file path in manifest: ${file.path}`);
    paths.add(file.path);
    assert(KINDS.has(file.kind), `invalid kind for ${file.path}: ${file.kind}`);
    const source = sources.get(file.sourceId);
    assert(source, `file ${file.path} references an unknown source: ${file.sourceId}`);
    assert(file.app === source.app, `file ${file.path} app does not match its source`);
    assert(file.category === source.category, `file ${file.path} category does not match its source`);
    assert(typeof file.upstreamPath === 'string' && file.upstreamPath.length > 0, `file ${file.path} needs an upstreamPath`);
    assertHttpsUrl(file.originalUrl, `file ${file.path} originalUrl`);
    assert(HEX_64.test(file.sha256), `file ${file.path} must carry a 64-hex sha256`);
    assert(Number.isInteger(file.size) && file.size >= 0, `file ${file.path} must carry an integer size`);

    const id = resourceIdFor(source, file);
    assert(!ids.has(id), `duplicate resource id: ${id}`);
    ids.add(id);

    records.push({
      id,
      path: file.path,
      sourceId: source.id,
      app: source.app,
      category: source.category,
      kind: file.kind,
      format: formatOfFilePath(file.path),
      upstreamPath: file.upstreamPath,
      url: file.originalUrl,
      sha256: file.sha256,
      bytes: file.size,
      ref: source.ref,
      repository: source.repository,
      license: source.license,
    });

    const counter = file.kind === 'license' ? licenseCounts : assetCounts;
    counter.set(source.id, (counter.get(source.id) ?? 0) + 1);
  }

  records.sort((left, right) => comparePaths(left.path, right.path));

  const catalogSources = [...sources.values()]
    .sort((left, right) => comparePaths(left.id, right.id))
    .map((source) => ({
      id: source.id,
      category: source.category,
      app: source.app,
      sourceType: source.sourceType,
      provider: source.provider,
      repository: source.repository,
      repositoryUrl: source.repositoryUrl,
      ref: source.ref,
      refType: source.refType,
      pathPrefix: source.pathPrefix,
      destinationPrefix: source.destinationPrefix,
      license: source.license,
      licenseUrl: source.licenseUrl,
      licenseFile: source.licenseFile ?? null,
      licenseFileUrl: source.licenseFileUrl ?? null,
      ownershipNote: source.ownershipNote,
      expectedFiles: source.expectedFiles,
      fileCount: source.fileCount,
      assetCount: assetCounts.get(source.id) ?? 0,
      licenseCount: licenseCounts.get(source.id) ?? 0,
      totalBytes: source.totalBytes,
    }));

  const assets = records.filter((record) => record.kind === 'asset').length;
  const licenses = records.length - assets;
  const totalBytes = records.reduce((sum, record) => sum + record.bytes, 0);

  assert(records.length === manifest.fileCount, `record count ${records.length} does not match manifest fileCount ${manifest.fileCount}`);
  assert(catalogSources.length === manifest.sourceCount, `source count ${catalogSources.length} does not match manifest sourceCount ${manifest.sourceCount}`);
  assert(totalBytes === manifest.totalBytes, `total bytes ${totalBytes} do not match manifest totalBytes ${manifest.totalBytes}`);

  return {
    schemaVersion: CATALOG_SCHEMA_VERSION,
    generatedFrom: MANIFEST_RELATIVE_PATH,
    counts: {
      sources: catalogSources.length,
      files: records.length,
      assets,
      licenses,
      totalBytes,
    },
    sources: catalogSources,
    resources: records,
  };
}

/** Stable JSON text for the catalog. Two-space indent, trailing newline. */
export function serializeCatalog(catalog) {
  return `${JSON.stringify(catalog, null, 2)}\n`;
}

function sha256Of(text) {
  return crypto.createHash('sha256').update(text, 'utf8').digest('hex');
}

/** Writes `data/generated/resources.json` and refreshes its checksum entry. */
export function writeResourceCatalog(root = packageRoot) {
  const catalog = buildResourceCatalog(root);
  const text = serializeCatalog(catalog);
  const generatedDir = path.join(root, 'data', 'generated');
  fs.mkdirSync(generatedDir, { recursive: true });
  fs.writeFileSync(path.join(generatedDir, CATALOG_FILE_NAME), text, 'utf8');

  const checksumPath = path.join(generatedDir, CHECKSUM_FILE_NAME);
  let checksums = {};
  if (fs.existsSync(checksumPath)) {
    checksums = JSON.parse(fs.readFileSync(checksumPath, 'utf8'));
  }
  checksums[CATALOG_FILE_NAME] = sha256Of(text);
  fs.writeFileSync(checksumPath, `${JSON.stringify(checksums, null, 2)}\n`, 'utf8');

  return { catalog, bytes: Buffer.byteLength(text, 'utf8') };
}

/** True when the checked-in catalog matches a fresh regeneration byte for byte. */
export function checkResourceCatalog(root = packageRoot) {
  const catalogPath = path.join(root, 'data', 'generated', CATALOG_FILE_NAME);
  if (!fs.existsSync(catalogPath)) {
    return { ok: false, reason: `${CATALOG_FILE_NAME} is missing; run node scripts/build-resource-catalog.mjs` };
  }
  const expected = serializeCatalog(buildResourceCatalog(root));
  const actual = fs.readFileSync(catalogPath, 'utf8');
  if (actual !== expected) {
    return { ok: false, reason: `${CATALOG_FILE_NAME} is out of date; regenerate it` };
  }
  const checksumPath = path.join(root, 'data', 'generated', CHECKSUM_FILE_NAME);
  if (fs.existsSync(checksumPath)) {
    const checksums = JSON.parse(fs.readFileSync(checksumPath, 'utf8'));
    if (checksums[CATALOG_FILE_NAME] !== sha256Of(expected)) {
      return { ok: false, reason: `${CHECKSUM_FILE_NAME} has no matching ${CATALOG_FILE_NAME} entry` };
    }
  }
  return { ok: true, reason: '' };
}

function main(argv) {
  const root = packageRoot;
  if (argv.includes('--check')) {
    const result = checkResourceCatalog(root);
    if (!result.ok) {
      console.error(result.reason);
      process.exitCode = 1;
      return;
    }
    const catalog = JSON.parse(fs.readFileSync(path.join(root, 'data', 'generated', CATALOG_FILE_NAME), 'utf8'));
    console.log(`Resource catalog is up to date: ${catalog.counts.files} records, ${catalog.counts.sources} sources.`);
    return;
  }
  const { catalog, bytes } = writeResourceCatalog(root);
  console.log(
    `Wrote data/generated/${CATALOG_FILE_NAME}: ${catalog.counts.files} records, ` +
      `${catalog.counts.sources} sources, ${bytes} bytes.`,
  );
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  main(process.argv.slice(2));
}
