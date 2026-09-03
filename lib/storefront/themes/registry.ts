import { normalizeSettings } from "@/lib/storefront/sections/normalize";
import {
  SLIDER_HEIGHTS,
  SLIDER_WIDTHS,
} from "@/lib/storefront/sections/slider-grids";
import type { Field } from "@/lib/storefront/sections/types";
import {
  ELECTRONICS_GROUP_PRESETS,
  ELECTRONICS_HOME_PRESET,
  ELECTRONICS_PRODUCT_PRESET,
  ESSENTIAL_GROUP_PRESETS,
  ESSENTIAL_HOME_PRESET,
  ESSENTIAL_PRODUCT_PRESET,
  LUXE_HOME_PRESET,
  LUXE_PRODUCT_PRESET,
  PHARMACY_GROUP_PRESETS,
  PHARMACY_HOME_PRESET,
  PHARMACY_PRODUCT_PRESET,
} from "./presets";
import type { ThemeManifest } from "./types";

/** The card/border roundness steps the visual styler offers ("theme" = the
 * theme's own token from globals.css). */
export const THEME_ROUNDNESS_OPTIONS = [
  "theme",
  "none",
  "small",
  "medium",
  "large",
  "extra",
] as const;

/** Action-button shapes ("theme" = whatever the radius token produces). */
export const THEME_BUTTON_STYLES = [
  "theme",
  "rounded",
  "pill",
  "square",
] as const;

/**
 * Every theme shares the same settings CONTRACT (values stay per theme).
 * Shared on purpose: it keeps settings portable across switches, the same
 * reasoning that keeps section contracts theme-agnostic. Only the DEFAULTS
 * differ per theme — that is how switching themes visibly changes these
 * settings until a merchant overrides them.
 */
function buildSettingsSchema(defaults?: {
  sliderWidth?: string;
  sliderHeight?: string;
}): Field[] {
  return [
    // How wide storefront sections run. "full" releases the `.container` cap
    // via a data attribute on the store surface (see globals.css).
    //
    // `productGalleryLayout` used to live here; it is a product-main SECTION
    // setting now (the product template owns its own arrangement). Stored
    // values are dropped by normalize-on-read and honoured once via
    // readLegacyGalleryLayout when the default product template renders.
    {
      key: "containerWidth",
      type: "select",
      options: ["fixed", "full"],
      default: "fixed",
    },
    // Global defaults for the hero/banner "Style" panels. Sections whose own
    // width/height is set to "theme" inherit these (see slider-grids.ts).
    {
      key: "sliderWidth",
      type: "select",
      options: SLIDER_WIDTHS.map((width) => width.key),
      default: defaults?.sliderWidth ?? "fixed",
    },
    {
      key: "sliderHeight",
      type: "select",
      options: SLIDER_HEIGHTS.map((height) => height.key),
      default: defaults?.sliderHeight ?? "half",
    },
    // Visual styler. Empty color = the theme/branding default stays in
    // effect; the surface helper skips blank or malformed values.
    { key: "backgroundColor", type: "color", default: "" },
    { key: "accentColor", type: "color", default: "" },
    {
      key: "cardRoundness",
      type: "select",
      options: [...THEME_ROUNDNESS_OPTIONS],
      default: "theme",
    },
    {
      key: "buttonStyle",
      type: "select",
      options: [...THEME_BUTTON_STYLES],
      default: "theme",
    },
  ];
}

const SHARED_SETTINGS_SCHEMA: Field[] = buildSettingsSchema();

/** Electronics ships a taller, edge-to-edge hero out of the box. */
const ELECTRONICS_SETTINGS_SCHEMA: Field[] = buildSettingsSchema({
  sliderWidth: "full",
  sliderHeight: "threeQuarters",
});

/**
 * The theme catalog. Themes differentiate through design tokens (globals.css
 * blocks keyed by data-store-theme), per-theme presets for fresh installs,
 * and targeted section overrides (themes/overrides.tsx) — never through
 * content, which survives every switch untouched.
 */
export const essentialTheme: ThemeManifest = {
  id: "essential",
  version: "2.0.0",
  status: "stable",
  name: "Classic Marketplace",
  description:
    "Balanced storefront for general retail catalogs and multi-category merchandising.",
  accent: "from-slate-600 to-slate-800",
  preview: {
    card: "/templates/essential/preview-card.jpg",
    mobile: "/templates/essential/preview-mobile.jpg",
  },
  settingsSchema: SHARED_SETTINGS_SCHEMA,
  presets: {
    templates: {
      home: ESSENTIAL_HOME_PRESET,
      product: ESSENTIAL_PRODUCT_PRESET,
    },
    groups: ESSENTIAL_GROUP_PRESETS,
  },
};

const electronicsTheme: ThemeManifest = {
  id: "electronics",
  version: "2.0.0",
  status: "stable",
  name: "Electronics",
  description:
    "High-spec product storytelling with comparison-friendly cards and performance callouts.",
  accent: "from-blue-600 to-cyan-600",
  preview: {
    card: "/templates/electronics/preview-card.jpg",
    mobile: "/templates/electronics/preview-mobile.jpg",
  },
  extends: "essential",
  settingsSchema: ELECTRONICS_SETTINGS_SCHEMA,
  // Essential and Fashion prefer the first (legacy) designs, so they omit
  // this — absent means the registry defaults apply.
  preferredVariants: {
    "category-list": "circles",
    // No entry for "featured-collection": its designs collapsed into the
    // single "Top Collections" row layout when it went variant-free.
    "countdown-offer": "deals-panel",
    "product-group": "centered",
    "brand-list": "strip",
    // No entry for "promotion-grid": its layout is a `grid` setting now, not
    // a variant, and the section picker's setup wizard asks for it directly.
    heading: "two-tone",
  },
  presets: {
    templates: {
      home: ELECTRONICS_HOME_PRESET,
      product: ELECTRONICS_PRODUCT_PRESET,
    },
    groups: ELECTRONICS_GROUP_PRESETS,
  },
};

/**
 * The Fashion bundle, parked. v2.0 ships TWO templates — Electronics
 * (default) and Classic — because this theme never got a design of its own:
 * two CSS declarations, one variant, one override, and Classic's chrome.
 * Shown in the gallery as coming-soon rather than deleted, so the work it
 * already has survives to v2.1, when it gets the design that makes it a
 * third template. It already sells under its v2.1 name — "Fashion" — but
 * keeps the internal id "luxe" (CSS blocks, preset instance keys, stored
 * themeSettings). No `preview`: there is nothing real to screenshot yet, so
 * the card renders its accent gradient instead of a capture of Classic.
 * `coming-soon` is load-bearing here — the activation route, the install
 * picker, the demo surface and the preset parity test all key off it, so
 * this one word is the whole scope gate.
 */
const luxeTheme: ThemeManifest = {
  id: "luxe",
  version: "2.0.0",
  status: "stable",
  name: "Fashion",
  description:
    "Editorial-style visual treatment for premium fashion, beauty, and lifestyle brands.",
  accent: "from-amber-600 to-rose-600",
  preview: {
    card: "/templates/luxe/preview-card.jpg",
    mobile: "/templates/luxe/preview-mobile.jpg",
  },
  extends: "essential",
  settingsSchema: SHARED_SETTINGS_SCHEMA,
  preferredVariants: {
    "category-list": "circles",
  },
  presets: {
    // Plain product page for the same reason as the plain bars below:
    // switching to Luxe must undo another theme's product layout too.
    templates: { home: LUXE_HOME_PRESET, product: LUXE_PRODUCT_PRESET },
    // Plain bars: switching to Luxe must undo another theme's chrome too.
    groups: ESSENTIAL_GROUP_PRESETS,
  },
};

const PHARMACY_SETTINGS_SCHEMA: Field[] = buildSettingsSchema();
// We'll update the defaults later if needed, but for now we'll just remove the invalid keys from preferredVariants.

const pharmacyTheme: ThemeManifest = {
  id: "pharmacy",
  version: "2.0.0",
  status: "stable",
  name: "Pharmacy",
  description:
    "Clean, trustworthy aesthetic tailored for health and wellness catalogs, with built-in trust signals and medical-grade layout precision.",
  accent: "from-teal-600 to-emerald-600",
  preview: {
    card: "/templates/pharmacy/preview-card.jpg",
    mobile: "/templates/pharmacy/preview-mobile.jpg",
  },
  extends: "essential",
  settingsSchema: PHARMACY_SETTINGS_SCHEMA,
  preferredVariants: {
    "category-list": "circles",
  },
  presets: {
    templates: {
      home: PHARMACY_HOME_PRESET,
      product: PHARMACY_PRODUCT_PRESET,
    },
    groups: PHARMACY_GROUP_PRESETS,
  },
};

/** Gallery order — the default template leads. */
export const THEME_MANIFESTS: ThemeManifest[] = [
  electronicsTheme,
  essentialTheme,
  luxeTheme,
  pharmacyTheme,
];

/**
 * Unknown, unset, or coming-soon ids resolve to ELECTRONICS — the product's
 * default template — so a fresh install stands up in it without a stored
 * choice. "essential" (Classic) stays a first-class, explicitly selectable
 * id; only the fallback moved.
 */
export function getActiveThemeManifest(activeTheme: unknown): ThemeManifest {
  const manifest = THEME_MANIFESTS.find(
    (candidate) => candidate.id === activeTheme,
  );
  return manifest && manifest.status === "stable" ? manifest : electronicsTheme;
}

export interface ResolvedTheme {
  id: string;
  /** Normalized against the manifest schema — every key present, clamped. */
  settings: Record<string, unknown>;
}

/**
 * Resolve `settings.onlineStore` into the active theme and its normalized
 * setting values. Values are stored PER THEME so switching away and back
 * loses nothing.
 */
export function resolveActiveTheme(onlineStore: unknown): ResolvedTheme {
  const source =
    typeof onlineStore === "object" && onlineStore !== null
      ? (onlineStore as {
          activeTheme?: unknown;
          themeSettings?: Record<string, unknown>;
        })
      : {};
  const manifest = getActiveThemeManifest(source.activeTheme);
  const rawValues =
    source.themeSettings &&
    typeof source.themeSettings === "object" &&
    !Array.isArray(source.themeSettings)
      ? source.themeSettings[manifest.id]
      : undefined;
  return {
    id: manifest.id,
    settings: normalizeSettings(manifest.settingsSchema, rawValues),
  };
}
