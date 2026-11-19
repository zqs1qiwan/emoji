#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT = process.cwd();
const CONFIG_PATH = path.join(ROOT, 'data', 'sources', 'resource-sources.json');
const MANIFEST_PATH = path.join(ROOT, 'resources', 'manifest.json');
const CHECK_ONLY = process.argv.includes('--check');
const SOURCE_FILTER = process.argv.includes('--source')
  ? process.argv[process.argv.indexOf('--source') + 1]
  : undefined;
const CONCURRENCY = Math.max(1, Math.min(64, Number(process.env.EMOJI_RESOURCE_CONCURRENCY || 16)));
const USER_AGENT = 'emoji-kit-resource-collector/1.0';

function fail(message) {
  throw new Error(message);
}

function assertHttpsUrl(value, label) {
  let url;
  try {
    url = new URL(value);
  } catch {
    fail(`${label} is not a valid URL: ${value}`);
  }
  if (url.protocol !== 'https:') fail(`${label} must use HTTPS: ${value}`);
  if (url.username || url.password) fail(`${label} must not contain credentials`);
  return url;
}

function assertRelativePath(value, label) {
  if (typeof value !== 'string' || !value || value.startsWith('/') || value.includes('\\') || value.includes('\0')) {
    fail(`${label} must be a relative POSIX path: ${value}`);
  }
  const segments = value.split('/');
  if (segments.some((segment) => segment === '' || segment === '.' || segment === '..')) {
    fail(`${label} contains an unsafe segment: ${value}`);
  }
  return value;
}

function encodeRepoPath(repoPath) {
  return repoPath.split('/').map(encodeURIComponent).join('/');
}

function rawUrl(repo, ref, sourcePath) {
  return `https://raw.githubusercontent.com/${repo}/${ref}/${encodeRepoPath(sourcePath)}`;
}

function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

async function fetchWithRetry(url, options = {}) {
  const headers = {
    'User-Agent': USER_AGENT,
    Accept: options.accept || '*/*',
    ...(options.headers || {}),
  };
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(url, { headers, signal: AbortSignal.timeout(60000) });
      if (!response.ok) {
        if (response.status >= 400 && response.status < 500 && response.status !== 429) {
          fail(`HTTP ${response.status} for ${new URL(url).pathname}`);
        }
        throw new Error(`HTTP ${response.status}`);
      }
      return response;
    } catch (error) {
      lastError = error;
      if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, attempt * 750));
    }
  }
  fail(`request failed after 3 attempts: ${new URL(url).pathname} (${lastError?.message || 'unknown error'})`);
}

function validateSources(config) {
  if (!config || config.version !== 1 || !Array.isArray(config.sources)) fail('invalid resource source config');
  const ids = new Set();
  const prefixes = new Set();
  for (const source of config.sources) {
    if (!/^[a-z0-9][a-z0-9-]*$/.test(source.id || '')) fail(`invalid source id: ${source.id}`);
    if (ids.has(source.id)) fail(`duplicate source id: ${source.id}`);
    ids.add(source.id);
    if (!['native', 'app'].includes(source.category)) fail(`invalid category for ${source.id}`);
    if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(source.repository || '')) fail(`invalid repository for ${source.id}`);
    if (!/^[0-9a-f]{40}$/.test(source.ref || '')) fail(`ref must be a 40-character commit sha for ${source.id}`);
    if (source.refType !== 'commit') fail(`refType must be commit for ${source.id}`);
    if (source.sourceType !== 'open-source-repository' && source.sourceType !== 'community-repository') {
      fail(`invalid sourceType for ${source.id}`);
    }
    assertHttpsUrl(source.repositoryUrl, `${source.id}.repositoryUrl`);
    assertHttpsUrl(source.licenseUrl, `${source.id}.licenseUrl`);
    assertHttpsUrl(source.licenseFileUrl, `${source.id}.licenseFileUrl`);
    for (const url of [source.repositoryUrl, source.licenseUrl, source.licenseFileUrl]) {
      if (new URL(url).hostname !== 'github.com' && new URL(url).hostname !== 'raw.githubusercontent.com') {
        fail(`${source.id} URLs must point at GitHub: ${url}`);
      }
    }
    if (!source.license || !source.ownershipNote) fail(`license and ownershipNote required for ${source.id}`);
    assertRelativePath(source.pathPrefix, `${source.id}.pathPrefix`);
    assertRelativePath(source.destinationPrefix, `${source.id}.destinationPrefix`);
    if (!source.destinationPrefix.startsWith('resources/')) {
      fail(`${source.id}.destinationPrefix must be inside resources/`);
    }
    if (prefixes.has(source.destinationPrefix)) fail(`duplicate destinationPrefix: ${source.destinationPrefix}`);
    prefixes.add(source.destinationPrefix);
    if (!source.filePattern || !new RegExp(source.filePattern).test('')) {
      // Empty-match patterns are allowed; this only validates that the regexp compiles.
    }
    new RegExp(source.filePattern);
    if (source.pathPattern) new RegExp(source.pathPattern);
    if (!Number.isInteger(source.expectedFiles) || source.expectedFiles < 1) fail(`invalid expectedFiles for ${source.id}`);
    assertRelativePath(source.licenseFile, `${source.id}.licenseFile`);
    if (!source.licenseFile.startsWith('resources/')) fail(`${source.id}.licenseFile must be inside resources/`);
  }
  return config.sources;
}

function upstreamPathMatches(source, sourcePath) {
  if (!sourcePath.startsWith(`${source.pathPrefix}/`)) return false;
  if (source.pathPattern && !sourcePath.includes(source.pathPattern)) return false;
  return new RegExp(source.filePattern).test(sourcePath);
}

function destinationFor(source, sourcePath) {
  const relativeSource = sourcePath.slice(source.pathPrefix.length + 1);
  assertRelativePath(relativeSource, `${source.id}.upstreamPath`);
  return `${source.destinationPrefix}/${relativeSource}`;
}

async function listUpstreamFiles(source, headers) {
  const url = `https://api.github.com/repos/${source.repository}/git/trees/${source.ref}?recursive=1`;
  const response = await fetchWithRetry(url, { accept: 'application/vnd.github+json', headers });
  const tree = await response.json();
  if (tree.truncated) fail(`${source.id}: GitHub tree response was truncated`);
  return tree.tree
    .filter((entry) => entry.type === 'blob' && upstreamPathMatches(source, entry.path))
    .map((entry) => ({ sourcePath: entry.path, size: entry.size }))
    .sort((a, b) => a.sourcePath.localeCompare(b.sourcePath));
}

async function readExisting(destination) {
  try {
    const data = await fs.readFile(destination);
    return { size: data.byteLength, sha256: sha256(data) };
  } catch (error) {
    if (error.code === 'ENOENT') return undefined;
    throw error;
  }
}

async function downloadFile(url, destination, expectedSize) {
  await fs.mkdir(path.dirname(destination), { recursive: true });
  const response = await fetchWithRetry(url);
  const data = Buffer.from(await response.arrayBuffer());
  if (expectedSize !== undefined && data.byteLength !== expectedSize) {
    fail(`size mismatch for ${new URL(url).pathname}: ${data.byteLength} !== ${expectedSize}`);
  }
  const digest = sha256(data);
  const temporary = `${destination}.${process.pid}.tmp`;
  await fs.writeFile(temporary, data);
  await fs.rename(temporary, destination);
  return { size: data.byteLength, sha256: digest };
}

async function processQueue(items, worker) {
  let cursor = 0;
  const results = new Array(items.length);
  const workers = Array.from({ length: Math.min(CONCURRENCY, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await worker(items[index], index);
    }
  });
  await Promise.all(workers);
  return results;
}

async function main() {
  const config = JSON.parse(await fs.readFile(CONFIG_PATH, 'utf8'));
  const sources = validateSources(config).filter((source) => !SOURCE_FILTER || source.id === SOURCE_FILTER);
  if (!sources.length) fail(`no resource source matches ${SOURCE_FILTER}`);
  const token = process.env.GITHUB_TOKEN;
  const apiHeaders = token
    ? { Authorization: `Bearer ${token}`, 'X-GitHub-Api-Version': '2022-11-28' }
    : { 'X-GitHub-Api-Version': '2022-11-28' };

  let previous = { sources: [], files: [] };
  if (!CHECK_ONLY) {
    try {
      previous = JSON.parse(await fs.readFile(MANIFEST_PATH, 'utf8'));
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  } else {
    previous = JSON.parse(await fs.readFile(MANIFEST_PATH, 'utf8'));
  }
  const previousByPath = new Map((previous.files || []).map((file) => [file.path, file]));

  const manifestSources = [];
  const manifestFiles = [];
  const seenPaths = new Set();

  for (const source of sources) {
    console.log(`${source.id}: listing pinned tree ${source.ref.slice(0, 12)}`);
    const upstream = await listUpstreamFiles(source, apiHeaders);
    if (upstream.length !== source.expectedFiles) {
      fail(`${source.id}: expected ${source.expectedFiles} files, found ${upstream.length}`);
    }

    const entries = upstream.map((item) => ({
      kind: 'asset',
      sourceId: source.id,
      sourcePath: item.sourcePath,
      expectedSize: item.size,
      destination: destinationFor(source, item.sourcePath),
      originalUrl: rawUrl(source.repository, source.ref, item.sourcePath),
    }));
    entries.push({
      kind: 'license',
      sourceId: source.id,
      sourcePath: new URL(source.licenseFileUrl).pathname.replace(`/${source.repository}/`, '').replace(/^\//, ''),
      expectedSize: undefined,
      destination: source.licenseFile,
      originalUrl: source.licenseFileUrl,
    });

    for (const entry of entries) {
      const normalized = entry.destination.split(path.sep).join('/');
      if (seenPaths.has(normalized)) fail(`duplicate resource path: ${normalized}`);
      seenPaths.add(normalized);
    }

    let downloaded = 0;
    let verified = 0;
    await processQueue(entries, async (entry) => {
      const normalized = entry.destination.split(path.sep).join('/');
      const prior = previousByPath.get(normalized);
      const existing = await readExisting(entry.destination);
      let result = existing;
      let sourcePath = entry.sourcePath;

      if (!CHECK_ONLY) {
        const needsDownload =
          !result ||
          (entry.expectedSize !== undefined && result.size !== entry.expectedSize) ||
          (prior && prior.sha256 !== result.sha256);
        if (needsDownload) {
          result = await downloadFile(entry.originalUrl, entry.destination, entry.expectedSize);
          downloaded += 1;
        } else {
          verified += 1;
        }
      } else if (!result) {
        fail(`missing resource: ${normalized}`);
      } else {
        verified += 1;
      }

      if (entry.expectedSize !== undefined && result.size !== entry.expectedSize) {
        fail(`size mismatch after verification: ${normalized}`);
      }
      if (prior && prior.sha256 !== result.sha256 && !CHECK_ONLY) {
        console.warn(`${normalized}: sha256 changed; record updated from pinned upstream bytes`);
      }

      manifestFiles.push({
        path: normalized,
        kind: entry.kind,
        sourceId: source.id,
        app: source.app,
        category: source.category,
        upstreamPath: sourcePath,
        originalUrl: entry.originalUrl,
        sha256: result.sha256,
        size: result.size,
      });
    });
    console.log(`${source.id}: ${entries.length} files (${downloaded} downloaded, ${verified} verified)`);

    manifestSources.push({
      ...source,
      fileCount: upstream.length,
      totalBytes: upstream.reduce((sum, item) => sum + item.size, 0),
    });
  }

  manifestFiles.sort((a, b) => a.path.localeCompare(b.path));
  if (CHECK_ONLY) {
    const priorMap = new Map((previous.files || []).map((file) => [file.path, file]));
    for (const file of manifestFiles) {
      const prior = priorMap.get(file.path);
      if (!prior || prior.sha256 !== file.sha256 || prior.size !== file.size) {
        fail(`manifest mismatch for ${file.path}`);
      }
    }
    console.log(`Resource check passed for ${manifestFiles.length} files.`);
    return;
  }

  if (SOURCE_FILTER) {
    const keepSources = previous.sources || [];
    const keepFiles = (previous.files || []).filter((file) => file.sourceId !== SOURCE_FILTER);
    manifestSources.unshift(...keepSources.filter((source) => source.id !== SOURCE_FILTER));
    manifestFiles.push(...keepFiles);
    manifestSources.sort((a, b) => a.id.localeCompare(b.id));
  }
  manifestSources.sort((a, b) => a.id.localeCompare(b.id));
  manifestFiles.sort((a, b) => a.path.localeCompare(b.path));
  const manifest = {
    version: 1,
    generatedBy: 'scripts/collect-resources.mjs',
    description: 'Raw resource files saved from pinned public sources. Not part of the npm package or runtime dataset.',
    verification: 'Every file is fetched over HTTPS from a pinned commit and recorded with its sha256 and byte size.',
    sourceCount: manifestSources.length,
    fileCount: manifestFiles.length,
    totalBytes: manifestFiles.reduce((sum, file) => sum + file.size, 0),
    sources: manifestSources,
    files: manifestFiles,
  };
  await fs.mkdir(path.dirname(MANIFEST_PATH), { recursive: true });
  await fs.writeFile(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`Wrote ${MANIFEST_PATH} with ${manifest.fileCount} resources (${(manifest.totalBytes / 1024 / 1024).toFixed(1)} MiB).`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
