/** A Unicode emoji record from the generated dataset. */
export interface EmojiVariant {
  id: string;
  tone?: number;
}
export interface EmojiSkin {
  id: string;
  hexcode: string;
  char: string;
  tone?: number;
  label: string;
}
export interface EmojiRecord {
  id: string;
  hexcode: string;
  char: string;
  name: string;
  label: string;
  shortcodes: string[];
  tags: string[];
  group: number | null;
  subgroup: number | null;
  legacyCategory: string | null;
  legacySubcategory: string | null;
  order: number;
  version: number | null;
  skins: EmojiSkin[];
  platforms: Record<string, string>;
  hasImg: Record<string, boolean>;
  variants: EmojiVariant[];
}
export interface AppDefinition {
  id: string;
  label: string;
  note: string;
  source: string;
  canonicalCategory: string;
  categories: Record<string, string[]>;
  aliases: Record<string, string>;
}

/** One raw file in the pinned resource library, described by metadata only. */
export interface ResourceRecord {
  /** Stable id, `<sourceId>:<name-within-source>`. */
  readonly id: string;
  /** Repository-relative POSIX path of the saved file, e.g. `resources/native/twemoji/svg/1f44d.svg`. */
  readonly path: string;
  /** Id of the pinned upstream source this file came from. */
  readonly sourceId: string;
  /** App or platform the collection belongs to (`native`, `tiktok`, `douyin`, `wechat`, `weibo`, …). */
  readonly app: string;
  /** `native` for platform artwork, `app` for app-specific community collections. */
  readonly category: 'native' | 'app';
  /** `asset` for artwork, `license` for the saved upstream license text. */
  readonly kind: 'asset' | 'license';
  /** Lowercase file extension without the dot (`svg`, `png`, `txt`); empty string when there is none. */
  readonly format: string;
  /** Path of the file inside the upstream repository. */
  readonly upstreamPath: string;
  /** Canonical pinned HTTPS URL of the file, copied verbatim from the manifest. */
  readonly url: string;
  /** sha256 of the file bytes, lowercase hex. */
  readonly sha256: string;
  /** Size of the file in bytes. */
  readonly bytes: number;
  /** Pinned upstream commit (40 lowercase hex characters). */
  readonly ref: string;
  /** Upstream repository as `owner/name`. */
  readonly repository: string;
  /** SPDX-style license identifier of the upstream source. */
  readonly license: string;
}

/** One pinned upstream source in the raw resource library. */
export interface ResourceSource {
  readonly id: string;
  readonly category: 'native' | 'app';
  readonly app: string;
  readonly sourceType: 'open-source-repository' | 'community-repository';
  readonly provider: string;
  readonly repository: string;
  readonly repositoryUrl: string;
  readonly ref: string;
  readonly refType: 'commit';
  readonly pathPrefix: string;
  readonly destinationPrefix: string;
  readonly license: string;
  readonly licenseUrl: string;
  readonly licenseFile: string | null;
  readonly licenseFileUrl: string | null;
  readonly ownershipNote: string;
  readonly expectedFiles: number;
  readonly fileCount: number;
  readonly assetCount: number;
  readonly licenseCount: number;
  readonly totalBytes: number;
}

/** The whole generated catalog. */
export interface ResourceCatalog {
  readonly schemaVersion: number;
  /** Human-readable, timestamp-free provenance of the input. */
  readonly generatedFrom: string;
  readonly counts: {
    readonly sources: number;
    readonly files: number;
    readonly assets: number;
    readonly licenses: number;
    readonly totalBytes: number;
  };
  readonly sources: readonly ResourceSource[];
  readonly resources: readonly ResourceRecord[];
}

/** Filters accepted by the lookup functions. All provided filters combine with AND. */
export interface ResourceQuery {
  /** Exact resource id, e.g. `twemoji-svg:1f44d.svg`. */
  readonly id?: string;
  /** Exact repository-relative path. Percent-encoded and decoded forms are both accepted. */
  readonly path?: string;
  /** Exact catalog URL. Percent-encoded and decoded forms are both accepted. */
  readonly url?: string;
  /** Source id, e.g. `twemoji-svg`. */
  readonly sourceId?: string;
  /** App or platform id, e.g. `weibo`. */
  readonly app?: string;
  readonly category?: 'native' | 'app';
  /** File extension without the dot, e.g. `svg`. */
  readonly format?: string;
  readonly kind?: 'asset' | 'license';
}

export interface ResourceListOptions extends ResourceQuery {
  /** Maximum number of records to return. Default `20`, hard maximum `500`. */
  readonly limit?: number;
}
