import emojisJson from './data/generated/emojis.json' with { type: 'json' };
import aliasesJson from './data/generated/aliases.json' with { type: 'json' };
import appsJson from './data/generated/apps.json' with { type: 'json' };
import assetsJson from './data/generated/assets.json' with { type: 'json' };
import meta from './data/generated/meta.json' with { type: 'json' };
import type { AppDefinition, EmojiRecord } from './types.js';

/** A prepared emoji with all variant metadata. */
export interface DefinedEmoji {
  id: string;
  name: string;
  label: string;
  char: string;
  hexcode: string;
  shortcode: string;
  app?: string;
  platform: string;
  assetUrl?: string;
  variants: EmojiRecord['variants'];
}

/** A reusable definition reference returned by `emoji.define`. */
export interface EmojiDefinitionRef {
  readonly kind: 'emoji-definition';
  readonly definition: EmojiDefinition;
}

export interface EmojiDefinition {
  name?: string;
  id?: string;
  hexcode?: string;
  char?: string;
  app?: string;
  platform?: string;
  tone?: number | number[];
  gender?: 'female' | 'male';
  assetUrl?: string;
  assetFallback?: 'base' | 'none';
  allowRemoteAssets?: boolean;
}

export interface SearchOptions {
  app?: string;
  group?: number;
  limit?: number;
}

export interface ListOptions {
  app?: string;
  group?: number;
  subgroup?: number;
  limit?: number;
}

export interface RenderOptions {
  format?: 'char' | 'shortcode';
}

export type EmojiInput = string | EmojiDefinition | EmojiDefinitionRef;
export type EmojiCallable = ((input: EmojiInput) => DefinedEmoji | undefined) & {
  define: (definition: EmojiDefinition) => EmojiDefinitionRef;
};

export interface EmojiKit {
  readonly emojis: readonly EmojiRecord[];
  readonly apps: Readonly<Record<string, AppDefinition>>;
  readonly aliases: Readonly<Record<string, string>>;
  readonly metadata: {
    readonly schemaVersion: number;
    readonly generatedAt?: string;
    readonly unicodeVersion: string;
    readonly emojiVersion: string;
    readonly cldrVersion: string;
    [key: string]: unknown;
  };
  get(key: EmojiInput): DefinedEmoji | undefined;
  getByName(name: string): DefinedEmoji | undefined;
  getByHexcode(hexcode: string): DefinedEmoji | undefined;
  getByChar(char: string): DefinedEmoji | undefined;
  emoji: EmojiCallable;
  search(query: string, options?: SearchOptions): DefinedEmoji[];
  list(options?: ListOptions): DefinedEmoji[];
  renderText(text: string, options?: RenderOptions): string;
  render(text: string, options?: RenderOptions): string;
  resolveAsset(definition: EmojiDefinition): string | undefined;
}

const typedEmojis = emojisJson as unknown as EmojiRecord[];
const typedApps = appsJson as unknown as Record<string, AppDefinition>;
const typedAliases = aliasesJson as unknown as Record<string, string>;
const typedAssets = assetsJson as unknown as Record<string, Record<string, string>>;

function canonicalKey(value: unknown): string {
  return String(value ?? '')
    .trim()
    .replace(/^:+|:+$/g, '')
    .toLowerCase()
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[\s]+/g, '_')
    .replace(/[^a-z0-9+_-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function stripVariation(value: string): string {
  return value.replace(/\uFE0F/g, '');
}

function defined(record: EmojiRecord, overrides: Partial<DefinedEmoji> = {}): DefinedEmoji {
  return {
    id: record.id,
    name: record.shortcodes[0] ?? canonicalKey(record.name),
    label: record.label,
    char: record.char,
    hexcode: record.hexcode,
    shortcode: record.shortcodes[0] ?? canonicalKey(record.name),
    platform: 'native',
    variants: record.variants,
    ...overrides,
  };
}

/**
 * Creates an isolated emoji kit. All indexes are prebuilt once and the core
 * performs no network access and no filesystem access.
 */
export function createEmojiKit(): EmojiKit {
  const byId = new Map(typedEmojis.map((record) => [record.id, record]));
  const byChar = new Map(typedEmojis.map((record) => [stripVariation(record.char), record]));
  const byHex = new Map(typedEmojis.map((record) => [record.hexcode, record]));
  const byShortcode = new Map(typedEmojis.flatMap((record) => record.shortcodes.map((code) => [canonicalKey(code), record.id])));

  function findRecord(input: unknown): EmojiRecord | undefined {
    if (typeof input === 'object' && input !== null) {
      const ref = input as EmojiDefinitionRef;
      if (ref.kind === 'emoji-definition' && ref.definition) {
        return findRecord(ref.definition);
      }
      return resolveDefinition(input as EmojiDefinition).record;
    }

    const raw = String(input ?? '');
    const key = canonicalKey(raw);

    if (/\p{Extended_Pictographic}/u.test(raw)) return byChar.get(raw) ?? byChar.get(stripVariation(raw));
    if (/^[\dA-Fa-f-]+$/.test(raw)) {
      return byHex.get(raw.toUpperCase().replace(/\uFE0F/g, '')) ?? byHex.get(key.toUpperCase());
    }
    if (!key) return undefined;

    const id = typedAliases[key] ?? byShortcode.get(key) ?? key.toUpperCase();
    return byId.get(id) ?? byChar.get(key);
  }

  function resolveDefinition(input: EmojiDefinition | EmojiDefinitionRef): { record?: EmojiRecord; tone?: number; app?: AppDefinition; platform: string; assetUrl?: string } {
    if ('kind' in input && input.kind === 'emoji-definition' && input.definition) {
      return resolveDefinition(input.definition);
    }
    const definition: EmojiDefinition = 'definition' in input ? input.definition : input;
    const app = definition.app ? typedApps[canonicalKey(definition.app)] : undefined;
    let record: EmojiRecord | undefined;

    if (definition.id) record = byId.get(String(definition.id).toUpperCase());
    else if (definition.hexcode) record = byHex.get(String(definition.hexcode).toUpperCase());
    else if (definition.char) record = findRecord(definition.char);
    else if (definition.name) {
      const key = canonicalKey(definition.name);
      const alias = app?.aliases[key] ?? typedAliases[key] ?? byShortcode.get(key);
      const gender = definition.gender;
      if (gender) {
        const genderAlias = typedAliases[`${gender}-${key}`]
          ?? typedAliases[`${key}-${gender}`]
          ?? typedAliases[`${gender}_${key}`]
          ?? typedAliases[`${key}_${gender}`];
        record = byId.get(genderAlias) ?? byId.get(alias) ?? byId.get(key.toUpperCase());
      } else {
        record = byId.get(alias) ?? byId.get(key.toUpperCase());
      }
    }
    if (!record) return { platform: canonicalKey(definition.platform || 'native') };

    const tones = Array.isArray(definition.tone)
      ? definition.tone
      : definition.tone == null ? [] : [definition.tone];
    const tone = tones.find((value: number) => Number.isInteger(value) && value >= 1 && value <= 5);
    const platform = canonicalKey(definition.platform || 'native');
    const remoteAsset = typedAssets[record.id]?.[platform];
    const explicitAsset = definition.assetUrl?.startsWith('https://') ? definition.assetUrl : undefined;
    const assetUrl = definition.allowRemoteAssets ? explicitAsset ?? remoteAsset : undefined;

    return {
      record,
      tone,
      app,
      platform,
      ...(assetUrl ? { assetUrl } : {}),
    };
  }

  function fromResolution(resolution: ReturnType<typeof resolveDefinition>, requestedName?: string): DefinedEmoji | undefined {
    if (!resolution.record) return undefined;
    const record = resolution.record;
    const skin = record.skins.find((item) => item.tone === resolution.tone);
    const name = canonicalKey(requestedName ?? record.shortcodes[0] ?? record.name);
    return defined(record, {
      name,
      shortcode: name,
      char: skin?.char ?? record.char,
      hexcode: skin?.hexcode ?? record.hexcode,
      app: resolution.app?.id,
      platform: resolution.platform,
      ...(resolution.assetUrl ? { assetUrl: resolution.assetUrl } : {}),
    });
  }

  const kit: EmojiKit = {
    emojis: typedEmojis,
    apps: typedApps,
    aliases: typedAliases,
    metadata: meta,

    emoji: Object.assign(
      (input: EmojiInput) => {
        if (typeof input === 'string') {
          const trimmed = input.trim();
          if (/^\{/.test(trimmed)) {
            try {
              return fromResolution(resolveDefinition(JSON.parse(trimmed) as EmojiDefinition));
            } catch {
              return undefined;
            }
          }
          return kit.get(trimmed);
        }
        if (typeof input === 'object' && input !== null && 'kind' in input) {
          return fromResolution(resolveDefinition((input as EmojiDefinitionRef).definition));
        }
        return fromResolution(resolveDefinition(input as EmojiDefinition), (input as EmojiDefinition).name);
      },
      {
        define: (definition: EmojiDefinition): EmojiDefinitionRef => ({
          kind: 'emoji-definition',
          definition,
        }),
      },
    ) satisfies EmojiCallable,

    get(key) {
      if (typeof key === 'object' && key !== null && 'definition' in key) {
        return fromResolution(resolveDefinition((key as EmojiDefinitionRef).definition));
      }
      return findRecord(key) ? defined(findRecord(key)!) : undefined;
    },

    getByName(name) {
      return kit.get(name);
    },

    getByHexcode(hexcode) {
      const record = byHex.get(String(hexcode).toUpperCase());
      return record ? defined(record) : undefined;
    },

    getByChar(char) {
      const record = byChar.get(stripVariation(char));
      return record ? defined(record) : undefined;
    },

    search(query, options = {}) {
      const q = canonicalKey(query);
      if (!q) return [];
      const scopedIds = options.app ? new Set(Object.values(typedApps[canonicalKey(options.app)]?.aliases ?? {})) : undefined;
      const results: Array<{ item: EmojiRecord; score: number }> = [];
      for (const item of typedEmojis) {
        if (options.group != null && item.group !== options.group) continue;
        if (scopedIds && !scopedIds.has(item.id)) continue;
        const names = [item.name, ...item.shortcodes, ...item.tags].map(canonicalKey);
        const exact = names.includes(q);
        if (!exact && !names.some((name) => name.includes(q))) continue;
        results.push({ item, score: exact ? 0 : 1 });
      }
      results.sort((a, b) => a.score - b.score || a.item.order - b.item.order || a.item.id.localeCompare(b.item.id));
      return results.slice(0, Math.max(1, Math.min(options.limit ?? 20, 500))).map(({ item }) => defined(item));
    },

    list(options = {}) {
      let items = typedEmojis;
      if (options.group != null) items = items.filter((item) => item.group === options.group);
      if (options.subgroup != null) items = items.filter((item) => item.subgroup === options.subgroup);
      if (options.app) {
        const ids = new Set(Object.values(typedApps[canonicalKey(options.app)]?.aliases ?? {}));
        items = items.filter((item) => ids.has(item.id));
      }
      return items.slice(0, Math.max(1, Math.min(options.limit ?? 20, 500))).map((item) => defined(item));
    },

    renderText(text, options = {}) {
      return String(text).replace(/:([a-z0-9+_-]+(?:\/[a-z0-9+_-]+)?):/gi, (match, token: string) => {
        const [maybeApp, maybeName] = token.includes('/') ? token.split('/') : [undefined, token];
        const app = maybeApp ? typedApps[canonicalKey(maybeApp)] : undefined;
        const key = canonicalKey(maybeName);
            const id = (app && app.aliases[key]) || typedAliases[key] || byShortcode.get(key);
        const record = id ? byId.get(id) : undefined;
        if (!record) return match;
        if (options.format === 'shortcode') return `:${key}:`;
        return record.char;
      });
    },

    render(text, options) {
      return kit.renderText(text, options);
    },

    resolveAsset(definition) {
      return resolveDefinition(definition).assetUrl;
    },
  };

  return kit;
}

export const createKit = createEmojiKit;
const defaultKit = createEmojiKit();
export const emoji = Object.assign(
  (input: EmojiInput) => defaultKit.emoji(input),
  {
    define: (definition: EmojiDefinition) => defaultKit.emoji.define(definition),
    get: defaultKit.get.bind(defaultKit),
    getByName: defaultKit.getByName.bind(defaultKit),
    getByHexcode: defaultKit.getByHexcode.bind(defaultKit),
    getByChar: defaultKit.getByChar.bind(defaultKit),
    search: defaultKit.search.bind(defaultKit),
    list: defaultKit.list.bind(defaultKit),
    renderText: defaultKit.renderText.bind(defaultKit),
    render: defaultKit.render.bind(defaultKit),
    resolveAsset: defaultKit.resolveAsset.bind(defaultKit),
    emojis: defaultKit.emojis,
    apps: defaultKit.apps,
    aliases: defaultKit.aliases,
    metadata: defaultKit.metadata,
  },
);
export const get = emoji.get.bind(emoji);
export const getByName = emoji.getByName.bind(emoji);
export const getByHexcode = emoji.getByHexcode.bind(emoji);
export const getByChar = emoji.getByChar.bind(emoji);
export const search = emoji.search.bind(emoji);
export const list = emoji.list.bind(emoji);
export const renderText = emoji.renderText.bind(emoji);
export const render = emoji.render.bind(emoji);
export const resolveAsset = emoji.resolveAsset.bind(emoji);
export const { emojis: datasetEmojis, apps: datasetApps, aliases, metadata } = emoji;
export const emojis = datasetEmojis;
export const apps = datasetApps;

export default emoji;
