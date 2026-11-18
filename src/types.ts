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
