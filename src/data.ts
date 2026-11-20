import records from './data/generated/emojis.json' with { type: 'json' };
import aliasesJson from './data/generated/aliases.json' with { type: 'json' };
import appsJson from './data/generated/apps.json' with { type: 'json' };
import assetsJson from './data/generated/assets.json' with { type: 'json' };
import metadataJson from './data/generated/meta.json' with { type: 'json' };
import resourcesJson from './data/generated/resources.json' with { type: 'json' };
import type { AppDefinition, EmojiRecord, ResourceCatalog } from './types';

export const emojis = records as unknown as EmojiRecord[];
export const emojiRecords = emojis;
export const aliases = aliasesJson as Record<string, string>;
export const apps = appsJson as unknown as Record<string, AppDefinition>;
export const assets = assetsJson as Record<string, Record<string, string>>;
export const metadata = metadataJson as {
  schemaVersion: number;
  unicodeVersion: string;
  emojiVersion: string;
  cldrVersion: string;
  [key: string]: unknown;
};

/** The whole generated resource catalog: records, sources, and counts. */
export const resourceCatalog = resourcesJson as unknown as ResourceCatalog;
/** Every pinned raw resource of the library, sorted by `path`. */
export const resources = resourceCatalog.resources;
/** Every pinned upstream source of the library, sorted by `id`. */
export const resourceSources = resourceCatalog.sources;
