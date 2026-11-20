import catalogJson from './data/generated/resources.json' with { type: 'json' };
import type {
  ResourceCatalog,
  ResourceListOptions,
  ResourceQuery,
  ResourceRecord,
  ResourceSource,
} from './types.js';

/** Default number of records returned by {@link listResources}. */
const DEFAULT_LIMIT = 20;
/** Hard maximum number of records returned by {@link listResources}. */
const MAX_LIMIT = 500;

const catalog = catalogJson as unknown as ResourceCatalog;

/** Every pinned raw resource of the library, sorted by `path`. */
export const resources: readonly ResourceRecord[] = catalog.resources;

/** Every pinned upstream source of the library, sorted by `id`. */
export const resourceSources: readonly ResourceSource[] = catalog.sources;

/** The whole generated catalog: records, sources, and counts. */
export const resourceCatalog: ResourceCatalog = catalog;

/** Decodes percent-encoded input, keeping the original text when it is malformed. */
function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/**
 * Normalizes a path or URL so that encoded and decoded spellings of the same
 * location compare equal. Separators are POSIX and every segment is decoded.
 */
function normalizeKey(value: string): string {
  return value.replace(/\\/g, '/').split('/').map(safeDecode).join('/');
}

interface ResourceIndexes {
  byId: Map<string, ResourceRecord>;
  byPath: Map<string, ResourceRecord>;
  byUrl: Map<string, ResourceRecord>;
}

let indexes: ResourceIndexes | undefined;

/**
 * Builds the lookup indexes on first use. Consumers that only use the emoji
 * API never pay for indexing the catalog.
 */
function lookupIndexes(): ResourceIndexes {
  if (indexes) return indexes;
  const byId = new Map<string, ResourceRecord>();
  const byPath = new Map<string, ResourceRecord>();
  const byUrl = new Map<string, ResourceRecord>();
  for (const record of resources) {
    byId.set(record.id, record);
    const pathKey = normalizeKey(record.path);
    if (!byPath.has(pathKey)) byPath.set(pathKey, record);
    const urlKey = normalizeKey(record.url);
    if (!byUrl.has(urlKey)) byUrl.set(urlKey, record);
  }
  indexes = { byId, byPath, byUrl };
  return indexes;
}

/** Normalizes a limit: default 20, hard maximum 500, fractional values floored. */
function normalizeLimit(value: unknown): number {
  if (typeof value !== 'number' || Number.isNaN(value)) return DEFAULT_LIMIT;
  const floored = Math.floor(value);
  if (floored < 0) return DEFAULT_LIMIT;
  return Math.min(floored, MAX_LIMIT);
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

/** True when the query carries at least one usable identifier. */
function hasIdentifier(query: ResourceQuery): boolean {
  return Boolean(text(query.id) || text(query.path) || text(query.url));
}

/** True when every provided filter matches the record. Filters combine with AND. */
function matches(record: ResourceRecord, query: ResourceQuery): boolean {
  const id = text(query.id);
  if (id && record.id !== id) return false;

  const path = text(query.path);
  if (path && normalizeKey(path) !== normalizeKey(record.path)) return false;

  const url = text(query.url);
  if (url && normalizeKey(url) !== normalizeKey(record.url)) return false;

  const sourceId = text(query.sourceId);
  if (sourceId && record.sourceId !== sourceId) return false;

  const app = text(query.app);
  if (app && record.app !== app) return false;

  const category = text(query.category);
  if (category && record.category !== category) return false;

  const format = text(query.format).replace(/^\./, '').toLowerCase();
  if (format && record.format !== format) return false;

  const kind = text(query.kind);
  if (kind && record.kind !== kind) return false;

  return true;
}

/**
 * Returns the record a query pins down through an exact identifier, `null`
 * when the identifier is unknown, and `undefined` when the query carries no
 * identifier at all.
 */
function candidateFor(query: ResourceQuery): ResourceRecord | null | undefined {
  const { byId, byPath, byUrl } = lookupIndexes();
  const id = text(query.id);
  if (id) return byId.get(id) ?? null;
  const path = text(query.path);
  if (path) return byPath.get(normalizeKey(path)) ?? null;
  const url = text(query.url);
  if (url) return byUrl.get(normalizeKey(url)) ?? null;
  return undefined;
}

/** Finds the record a query points at, using the id, path, or url identifier. */
function findByIdentifier(query: ResourceQuery): ResourceRecord | undefined {
  const candidate = candidateFor(query);
  return candidate ?? undefined;
}

/**
 * Exact lookup by id, path, or url. Unknown input returns `undefined`; the
 * function never throws and never touches the network or the filesystem.
 */
export function getResource(input: string | ResourceQuery): ResourceRecord | undefined {
  if (typeof input === 'string') {
    const key = input.trim();
    if (!key) return undefined;
    const { byId, byPath, byUrl } = lookupIndexes();
    return byId.get(key) ?? byPath.get(normalizeKey(key)) ?? byUrl.get(normalizeKey(key));
  }
  if (!input || typeof input !== 'object') return undefined;
  const query = input as ResourceQuery;
  if (!hasIdentifier(query)) return undefined;
  const record = findByIdentifier(query);
  if (!record) return undefined;
  return matches(record, query) ? record : undefined;
}

/**
 * Filtered lookup. Returns every match ordered by `path`, truncated by
 * `limit` (default 20, maximum 500).
 */
export function listResources(options?: ResourceListOptions): ResourceRecord[] {
  const query: ResourceListOptions = options ?? {};
  if (!query || typeof query !== 'object') return [];
  const limit = normalizeLimit(query.limit);
  if (limit === 0) return [];
  // An exact id, path, or url pins down at most one record.
  const candidate = candidateFor(query);
  if (candidate === null) return [];
  if (candidate) return matches(candidate, query) ? [candidate] : [];
  const results: ResourceRecord[] = [];
  for (const record of resources) {
    if (!matches(record, query)) continue;
    results.push(record);
    if (results.length >= limit) break;
  }
  return results;
}

/**
 * Resolution. Uses the same matching rules as {@link getResource}, but
 * identifier-less queries resolve from filters alone. Returns metadata only.
 */
export function resolveResource(input: string | ResourceQuery): ResourceRecord | undefined {
  if (typeof input === 'string') return getResource(input);
  if (!input || typeof input !== 'object') return undefined;
  const query = input as ResourceQuery;
  if (hasIdentifier(query)) return getResource(query);
  for (const record of resources) {
    if (matches(record, query)) return record;
  }
  return undefined;
}
