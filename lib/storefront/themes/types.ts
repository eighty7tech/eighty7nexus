import type {
  StoreGroupType,
  StoreTemplateType,
} from "@/lib/storefront/pages/handles";
import type {
  Field,
  SectionInstance,
} from "@/lib/storefront/sections/types";

/**
 * A theme, as data. P2 ships the manifest shape with Essential's settings
 * schema; P4 adds component overrides and per-theme presets on top of it.
 *
 * Deliberately pure (no components, no server imports): the admin theme
 * gallery renders these on the client, and the settings form is generated
 * from `settingsSchema` by the same FieldRenderer the section editor uses.
 */
export interface ThemeManifest {
  id: string;
  version: string;
  status: "stable" | "coming-soon";
  /** English fallbacks; admin UI overlays i18n keys derived from id. */
  name: string;
  description: string;
  /** Gallery card gradient (the existing Themes page visual language). */
  accent: string;
  /**
   * Real storefront screenshots bundled under /public/templates/<id>/ —
   * the gallery card and install-wizard picker render `card`; `mobile`
   * feeds the public template gallery. Absent (an in-development theme)
   * the UIs fall back to the accent gradient.
   */
  preview?: { card: string; mobile: string };
  /**
   * Component fallback chain: a section type without an override here
   * resolves through the parent, ending at the base library. Overrides
   * themselves live in the server-only `overrides.tsx`, keyed by theme id —
   * this field documents the chain, resolution walks it.
   */
  extends?: string;
  /**
   * Global design options, same Field vocabulary as sections. Content NEVER
   * lives here — theme settings restyle the store, they don't populate it.
   */
  settingsSchema: Field[];
  /**
   * The design each section type should wear under this theme, applied when
   * the admin INSERTS one from the picker — so a new block arrives in the
   * template's look instead of the first (legacy) variant. Starter presets
   * name their variants explicitly; this covers what gets added afterwards.
   * Keys are section types, values variant keys; the catalog ignores
   * entries it cannot resolve. Stored documents are never rewritten by it.
   */
  preferredVariants?: Record<string, string>;
  /**
   * Starter section lists, seeded as a DRAFT on activation and only for
   * pages that don't exist yet (a fresh install). Existing pages are never
   * touched — content survives every switch, publish stays an explicit act.
   * Keyed by template type (and, from P8, by section group).
   */
  presets?: {
    templates?: Partial<Record<StoreTemplateType, SectionInstance[]>>;
    groups?: Partial<Record<StoreGroupType, SectionInstance[]>>;
  };
}
