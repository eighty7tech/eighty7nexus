import type { CSSProperties } from "react";

/**
 * The storefront product card's configurator vocabulary — shared by the
 * card renderer (`components/products/modern-product-card.tsx`) and the
 * admin "Product card" editor, so both always agree on what a key means.
 *
 * Mirrors the product page's `product-detail-rows.ts`/`product-detail-style.ts`
 * pair, but for the CARD: elements are arranged in groups (the admin editor
 * drags elements between groups), plus a Visibility panel and a Style panel.
 * Stored as one object under `settings.productCard` and normalized per-field
 * at every read, so an absent or stale document changes nothing.
 *
 * This module must stay CLIENT-SAFE and pure (no server imports).
 */

// ---- Elements (the draggable "Order" rows) --------------------------------

export const PRODUCT_CARD_ELEMENTS = [
  "preview",
  "swatch",
  "brand",
  "name",
  "category",
  "price",
  "delivery",
  "rating",
  "stock",
  "cart",
] as const;

export type ProductCardElement = (typeof PRODUCT_CARD_ELEMENTS)[number];

/** English fallbacks; the admin overlays `admin.productCardStudio.elements.<key>`. */
export const PRODUCT_CARD_ELEMENT_LABELS: Record<ProductCardElement, string> = {
  preview: "Preview Image",
  swatch: "Swatch",
  brand: "Brand",
  name: "Product Name",
  category: "Category",
  price: "Price",
  delivery: "Delivery info",
  rating: "Rating",
  stock: "Out of stock",
  cart: "Add to Cart",
};

export interface ProductCardItem {
  key: ProductCardElement;
  on: boolean;
}

export interface ProductCardGroup {
  /** Stable id for drag-and-drop identity; persisted with the config. */
  id: string;
  items: ProductCardItem[];
}

// ---- Visibility -----------------------------------------------------------

export interface ProductCardVisibility {
  /** Persistent Add to Cart row (vs the hover/touch-only controls). */
  cartButtonAlways: boolean;
  /** "N% OFF" chip beside the price. */
  discountChip: boolean;
  /** "-N%" badge on the preview image. */
  discountChipOnImage: boolean;
  /** "N sold" beside the rating (renders only when the product carries it). */
  itemSold: boolean;
  /** "(N)" review count beside the stars. */
  ratingCount: boolean;
  /** One star + the numeric rating, docked into the price row. */
  ratingMinimized: boolean;
  /** "+N" extra-variant count beside the swatches. */
  variantCount: boolean;
}

// ---- Style ----------------------------------------------------------------

export interface ProductCardTypography {
  /** CSS font-weight keyword/number; empty = theme default. */
  weight: string;
  /** "normal" | "italic"; empty = theme default. */
  style: string;
  /** px; 0 = theme default. */
  size: number;
  /** CSS color; empty = theme default. */
  color: string;
}

export type ProductCardTypographyKey =
  | "brand"
  | "product"
  | "category"
  | "price"
  | "discounted"
  | "cart"
  | "stock";

export const PRODUCT_CARD_HOVER_EFFECTS = [
  "zoom",
  "second-image",
  "none",
] as const;
export type ProductCardHoverEffect =
  (typeof PRODUCT_CARD_HOVER_EFFECTS)[number];

export interface ProductCardStyle {
  /** The card wrapper. Chrome renders only where a value is actually set. */
  cardRadius: number;
  cardPadding: number;
  cardBackground: string;
  cardBorder: string;
  cardBorderWidth: number;
  /** Drop shadow softness (px blur); 0 = none. */
  cardShadow: number;
  /** The preview media stage. */
  previewBackground: string;
  previewRadius: number;
  /** px; 0 = square aspect. */
  previewHeight: number;
  previewHover: ProductCardHoverEffect;
  /** Vertical space between groups / between elements inside a group (px). */
  groupGap: number;
  itemGap: number;
  typography: Partial<Record<ProductCardTypographyKey, ProductCardTypography>>;
  /** The persistent Add to Cart button. */
  cartBackground: string;
  cartBorder: string;
  cartBorderWidth: number;
  cartRadius: number;
  /** Star fill; empty = the amber default. */
  ratingColor: string;
  /** The Out of stock badge; empty colors = the red status default. */
  stockBackground: string;
  stockBorder: string;
  stockBorderWidth: number;
  stockRadius: number;
}

export interface ProductCardConfig {
  /** The template the config was last seeded from (display only). */
  template: ProductCardTemplateId;
  groups: ProductCardGroup[];
  visibility: ProductCardVisibility;
  style: ProductCardStyle;
}

// ---- Defaults (reproduce the card as shipped — an untouched store must
// not change when this feature lands) ---------------------------------------

// The card as shipped: image alone, then one body block (swatches, name,
// price+rating, delivery) — groupGap/itemGap reproduce its 12px/6px rhythm.
export const DEFAULT_PRODUCT_CARD_GROUPS: ProductCardGroup[] = [
  { id: "g1", items: [{ key: "preview", on: true }] },
  {
    id: "g2",
    items: [
      { key: "swatch", on: true },
      { key: "name", on: true },
      { key: "price", on: true },
      { key: "rating", on: true },
      { key: "delivery", on: true },
      { key: "cart", on: true },
    ],
  },
];

export const DEFAULT_PRODUCT_CARD_VISIBILITY: ProductCardVisibility = {
  cartButtonAlways: false,
  discountChip: false,
  discountChipOnImage: true,
  itemSold: false,
  ratingCount: false,
  ratingMinimized: true,
  variantCount: false,
};

export const EMPTY_CARD_TYPOGRAPHY: ProductCardTypography = {
  weight: "",
  style: "",
  size: 0,
  color: "",
};

export const DEFAULT_PRODUCT_CARD_STYLE: ProductCardStyle = {
  cardRadius: 12,
  cardPadding: 0,
  cardBackground: "",
  cardBorder: "",
  cardBorderWidth: 0,
  cardShadow: 0,
  previewBackground: "",
  previewRadius: 6,
  previewHeight: 0,
  previewHover: "zoom",
  // The card as shipped: space-y-3 image→body, space-y-1.5 inside the body.
  groupGap: 12,
  itemGap: 6,
  typography: {},
  cartBackground: "",
  cartBorder: "",
  cartBorderWidth: 0,
  cartRadius: 6,
  ratingColor: "",
  stockBackground: "",
  stockBorder: "",
  stockBorderWidth: 0,
  // The badge as shipped uses rounded-md (6px).
  stockRadius: 6,
};

export const DEFAULT_PRODUCT_CARD_CONFIG: ProductCardConfig = {
  template: "minimal",
  groups: DEFAULT_PRODUCT_CARD_GROUPS,
  visibility: DEFAULT_PRODUCT_CARD_VISIBILITY,
  style: DEFAULT_PRODUCT_CARD_STYLE,
};

export function getDefaultProductCardConfig(): ProductCardConfig {
  return JSON.parse(
    JSON.stringify(DEFAULT_PRODUCT_CARD_CONFIG),
  ) as ProductCardConfig;
}

// ---- Templates (the "Card Templates" modal's fixed presets) ---------------

export const PRODUCT_CARD_TEMPLATE_IDS = [
  "minimal",
  "full",
  "drop-shadow",
  "sharp-border",
  "temu-style",
  "alibaba-style",
  "elegant-luxury",
  "dense-compact",
  "nexus-showcase",
  "nexus-editorial",
  "nexus-glassmorphic",
  "nexus-minimal-luxe",
] as const;
export type ProductCardTemplateId = (typeof PRODUCT_CARD_TEMPLATE_IDS)[number];

export const PRODUCT_CARD_TEMPLATE_LABELS: Record<ProductCardTemplateId, string> =
  {
    minimal: "Minimal",
    full: "Full",
    "drop-shadow": "Drop Shadow",
    "sharp-border": "Sharp Border",
    "temu-style": "Temu Style",
    "alibaba-style": "Alibaba Style",
    "elegant-luxury": "Elegant Luxury",
    "dense-compact": "Dense Compact",
    "nexus-showcase": "Nexus Showcase (Theme)",
    "nexus-editorial": "Nexus Editorial (Theme)",
    "nexus-glassmorphic": "Nexus Glassmorphic (Theme)",
    "nexus-minimal-luxe": "Nexus Minimal Luxe (Theme)",
  };

const group = (id: string, ...keys: ProductCardElement[]): ProductCardGroup => ({
  id,
  items: keys.map((key) => ({ key, on: true })),
});

/**
 * Selecting a template REPLACES the whole config (the merchant then tweaks
 * from there). Each is a complete, self-consistent arrangement matching its
 * Figma tile.
 */
export const PRODUCT_CARD_TEMPLATES: Record<
  ProductCardTemplateId,
  ProductCardConfig
> = {
  minimal: {
    template: "minimal",
    groups: [
      group("g1", "preview", "swatch"),
      group("g2", "brand", "name", "category"),
      group("g3", "price", "delivery"),
      group("g4", "rating"),
      group("g5", "stock"),
      group("g6", "cart"),
    ],
    visibility: {
      cartButtonAlways: false,
      discountChip: true,
      discountChipOnImage: true,
      itemSold: true,
      ratingCount: true,
      ratingMinimized: false,
      variantCount: true,
    },
    style: {
      ...DEFAULT_PRODUCT_CARD_STYLE,
      previewRadius: 10,
    },
  },
  full: {
    template: "full",
    groups: [
      group("g1", "name", "category"),
      group("g2", "preview", "swatch"),
      group("g3", "price", "delivery"),
      group("g4", "rating"),
      group("g5", "stock"),
      group("g6", "cart"),
    ],
    visibility: {
      cartButtonAlways: false,
      discountChip: true,
      discountChipOnImage: false,
      itemSold: true,
      ratingCount: true,
      ratingMinimized: false,
      variantCount: true,
    },
    style: {
      ...DEFAULT_PRODUCT_CARD_STYLE,
      cardRadius: 16,
      cardPadding: 16,
      cardBackground: "#f4f4f5",
      previewBackground: "#f4f4f5",
      previewRadius: 0,
    },
  },
  "drop-shadow": {
    template: "drop-shadow",
    groups: [
      group("g1", "preview", "swatch"),
      group("g2", "brand", "name", "category"),
      group("g3", "price", "delivery"),
      group("g4", "rating"),
      group("g5", "stock"),
      group("g6", "cart"),
    ],
    visibility: {
      cartButtonAlways: false,
      discountChip: true,
      discountChipOnImage: false,
      itemSold: true,
      ratingCount: true,
      ratingMinimized: false,
      variantCount: true,
    },
    style: {
      ...DEFAULT_PRODUCT_CARD_STYLE,
      cardRadius: 16,
      cardPadding: 16,
      cardBackground: "#ffffff",
      cardShadow: 24,
      previewBackground: "#ffffff",
      previewRadius: 0,
    },
  },
  "sharp-border": {
    template: "sharp-border",
    groups: [
      group("g1", "name", "category"),
      group("g2", "preview", "swatch"),
      group("g3", "price", "delivery"),
      group("g4", "rating"),
      group("g5", "stock"),
      group("g6", "cart"),
    ],
    visibility: {
      cartButtonAlways: true,
      discountChip: true,
      discountChipOnImage: false,
      itemSold: true,
      ratingCount: true,
      ratingMinimized: false,
      variantCount: true,
    },
    style: {
      ...DEFAULT_PRODUCT_CARD_STYLE,
      cardRadius: 0,
      cardPadding: 16,
      cardBorder: "#18181b",
      cardBorderWidth: 1.5,
      previewBackground: "#ffffff",
      previewRadius: 0,
      cartBackground: "#18181b",
      cartRadius: 0,
    },
  },
  "temu-style": {
    template: "temu-style",
    groups: [
      group("g1", "preview", "swatch"),
      group("g2", "price"),
      group("g3", "name", "brand"),
      group("g4", "rating", "stock"),
      group("g5", "cart"),
    ],
    visibility: {
      cartButtonAlways: true,
      discountChip: true,
      discountChipOnImage: true,
      itemSold: true,
      ratingCount: true,
      ratingMinimized: true,
      variantCount: true,
    },
    style: {
      ...DEFAULT_PRODUCT_CARD_STYLE,
      cardRadius: 12,
      cardPadding: 8,
      cardBackground: "#ffffff",
      cardBorder: "#f97316",
      cardBorderWidth: 1,
      previewRadius: 8,
      cartBackground: "#f97316",
      cartRadius: 24,
      typography: {
        price: { weight: "bold", style: "normal", size: 18, color: "#f97316" }
      }
    },
  },
  "alibaba-style": {
    template: "alibaba-style",
    groups: [
      group("g1", "preview"),
      group("g2", "name"),
      group("g3", "price", "delivery"),
      group("g4", "rating"),
      group("g5", "cart"),
    ],
    visibility: {
      cartButtonAlways: false,
      discountChip: false,
      discountChipOnImage: false,
      itemSold: true,
      ratingCount: true,
      ratingMinimized: true,
      variantCount: false,
    },
    style: {
      ...DEFAULT_PRODUCT_CARD_STYLE,
      cardRadius: 8,
      cardPadding: 12,
      cardBackground: "#ffffff",
      cardBorder: "#e5e7eb",
      cardBorderWidth: 1,
      previewRadius: 4,
    },
  },
  "elegant-luxury": {
    template: "elegant-luxury",
    groups: [
      group("g1", "preview"),
      group("g2", "brand", "name"),
      group("g3", "price"),
    ],
    visibility: {
      cartButtonAlways: false,
      discountChip: false,
      discountChipOnImage: false,
      itemSold: false,
      ratingCount: false,
      ratingMinimized: true,
      variantCount: false,
    },
    style: {
      ...DEFAULT_PRODUCT_CARD_STYLE,
      cardRadius: 0,
      cardPadding: 0,
      cardBackground: "transparent",
      cardBorderWidth: 0,
      previewRadius: 0,
      typography: {
        brand: { weight: "bold", style: "normal", size: 12, color: "#000000" },
        product: { weight: "normal", style: "normal", size: 14, color: "#000000" },
        price: { weight: "normal", style: "normal", size: 14, color: "#000000" }
      }
    },
  },
  "dense-compact": {
    template: "dense-compact",
    groups: [
      group("g1", "preview", "price"),
      group("g2", "name"),
    ],
    visibility: {
      cartButtonAlways: false,
      discountChip: true,
      discountChipOnImage: true,
      itemSold: false,
      ratingCount: false,
      ratingMinimized: true,
      variantCount: false,
    },
    style: {
      ...DEFAULT_PRODUCT_CARD_STYLE,
      cardRadius: 4,
      cardPadding: 4,
      cardBackground: "#ffffff",
      cardBorderWidth: 0,
      previewRadius: 4,
      groupGap: 4,
      itemGap: 4,
      typography: {
        product: { weight: "normal", style: "normal", size: 12, color: "#374151" },
        price: { weight: "bold", style: "normal", size: 14, color: "#111827" }
      }
    },
  },
  "nexus-showcase": {
    template: "nexus-showcase",
    groups: [
      group("g1", "preview", "swatch"),
      group("g2", "brand", "name"),
      group("g3", "price", "rating"),
      group("g4", "delivery"),
      group("g5", "cart"),
    ],
    visibility: {
      cartButtonAlways: true,
      discountChip: true,
      discountChipOnImage: true,
      itemSold: true,
      ratingCount: true,
      ratingMinimized: true,
      variantCount: true,
    },
    style: {
      ...DEFAULT_PRODUCT_CARD_STYLE,
      cardRadius: 16,
      cardPadding: 14,
      cardBackground: "",
      cardBorder: "#77CDCC55",
      cardBorderWidth: 1,
      cardShadow: 2,
      previewRadius: 12,
      previewHover: "zoom",
      cartBackground: "#001a45",
      cartRadius: 10,
      ratingColor: "#77CDCC",
    },
  },
  "nexus-editorial": {
    template: "nexus-editorial",
    groups: [
      group("g1", "brand", "category"),
      group("g2", "preview"),
      group("g3", "name", "price"),
      group("g4", "swatch", "cart"),
    ],
    visibility: {
      cartButtonAlways: false,
      discountChip: false,
      discountChipOnImage: true,
      itemSold: false,
      ratingCount: false,
      ratingMinimized: true,
      variantCount: true,
    },
    style: {
      ...DEFAULT_PRODUCT_CARD_STYLE,
      cardRadius: 8,
      cardPadding: 16,
      cardBackground: "",
      cardBorder: "",
      cardBorderWidth: 1,
      cardShadow: 1,
      previewRadius: 6,
      previewHover: "second-image",
      cartBackground: "#324071",
      cartRadius: 6,
      typography: {
        brand: { weight: "600", style: "normal", size: 12, color: "#77CDCC" },
        product: { weight: "500", style: "normal", size: 15, color: "" },
        price: { weight: "700", style: "normal", size: 16, color: "" },
      },
    },
  },
  "nexus-glassmorphic": {
    template: "nexus-glassmorphic",
    groups: [
      group("g1", "preview"),
      group("g2", "name", "brand"),
      group("g3", "price", "stock"),
      group("g4", "rating", "delivery"),
      group("g5", "cart"),
    ],
    visibility: {
      cartButtonAlways: true,
      discountChip: true,
      discountChipOnImage: true,
      itemSold: true,
      ratingCount: true,
      ratingMinimized: false,
      variantCount: true,
    },
    style: {
      ...DEFAULT_PRODUCT_CARD_STYLE,
      cardRadius: 4,
      cardPadding: 10,
      cardBackground: "",
      cardBorder: "#77CDCC",
      cardBorderWidth: 1,
      cardShadow: 3,
      previewRadius: 8,
      previewHover: "zoom",
      cartBackground: "#ffffff33",
      cartRadius: 8,
      ratingColor: "#77CDCC",
      typography: {
        brand: { weight: "500", style: "normal", size: 12, color: "#94a3b8" },
        product: { weight: "600", style: "normal", size: 14, color: "" },
        price: { weight: "700", style: "normal", size: 16, color: "" },
      },
    },
  },
  "nexus-minimal-luxe": {
    template: "nexus-minimal-luxe",
    groups: [
      group("g1", "preview"),
      group("g2", "swatch", "name"),
      group("g3", "price"),
      group("g4", "cart"),
    ],
    visibility: {
      cartButtonAlways: false,
      discountChip: false,
      discountChipOnImage: false,
      itemSold: false,
      ratingCount: false,
      ratingMinimized: true,
      variantCount: false,
    },
    style: {
      ...DEFAULT_PRODUCT_CARD_STYLE,
      cardRadius: 14,
      cardPadding: 12,
      cardBackground: "transparent",
      cardBorder: "transparent",
      cardBorderWidth: 0,
      cardShadow: 1,
      previewRadius: 10,
      previewHover: "zoom",
      cartBackground: "#001a45",
      cartRadius: 10,
    },
  },
};

// ---- Normalization --------------------------------------------------------

const bool = (value: unknown, fallback: boolean) =>
  typeof value === "boolean" ? value : fallback;
const num = (value: unknown, fallback: number) =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;
const str = (value: unknown, fallback: string) =>
  typeof value === "string" ? value : fallback;

const ELEMENT_SET = new Set<string>(PRODUCT_CARD_ELEMENTS);

/**
 * Raw groups → validated groups. Unknown or duplicate element keys are
 * dropped; an arrangement with no elements at all is a corrupt document,
 * not a choice, and falls back to the default.
 */
export function normalizeProductCardGroups(raw: unknown): ProductCardGroup[] {
  if (!Array.isArray(raw)) return DEFAULT_PRODUCT_CARD_GROUPS;

  const seen = new Set<string>();
  const groups: ProductCardGroup[] = [];
  for (const [index, entry] of raw.entries()) {
    if (typeof entry !== "object" || entry === null) continue;
    const rawItems = (entry as { items?: unknown }).items;
    if (!Array.isArray(rawItems)) continue;
    const items: ProductCardItem[] = [];
    for (const item of rawItems) {
      if (typeof item !== "object" || item === null) continue;
      const key = (item as { key?: unknown }).key;
      if (typeof key !== "string" || !ELEMENT_SET.has(key) || seen.has(key)) {
        continue;
      }
      seen.add(key);
      items.push({
        key: key as ProductCardElement,
        on: (item as { on?: unknown }).on !== false,
      });
    }
    const id = (entry as { id?: unknown }).id;
    groups.push({
      id: typeof id === "string" && id ? id : `g${index + 1}`,
      items,
    });
  }
  return groups.some((entry) => entry.items.length > 0)
    ? groups
    : DEFAULT_PRODUCT_CARD_GROUPS;
}

function parseTypography(raw: unknown): ProductCardTypography | undefined {
  if (typeof raw !== "object" || raw === null) return undefined;
  const source = raw as Record<string, unknown>;
  const value: ProductCardTypography = {
    weight: str(source.weight, ""),
    style: str(source.style, ""),
    size: num(source.size, 0),
    color: str(source.color, ""),
  };
  return value.weight || value.style || value.size || value.color
    ? value
    : undefined;
}

const TYPOGRAPHY_KEYS: ProductCardTypographyKey[] = [
  "brand",
  "product",
  "category",
  "price",
  "discounted",
  "cart",
  "stock",
];

/** Stored value → validated config; anything malformed falls back per-field. */
export function normalizeProductCardConfig(raw: unknown): ProductCardConfig {
  if (typeof raw !== "object" || raw === null) {
    return getDefaultProductCardConfig();
  }
  const source = raw as Record<string, unknown>;
  const v = (
    typeof source.visibility === "object" && source.visibility !== null
      ? source.visibility
      : {}
  ) as Record<string, unknown>;
  const s = (
    typeof source.style === "object" && source.style !== null
      ? source.style
      : {}
  ) as Record<string, unknown>;
  const dv = DEFAULT_PRODUCT_CARD_VISIBILITY;
  const ds = DEFAULT_PRODUCT_CARD_STYLE;

  const typographyRaw =
    typeof s.typography === "object" && s.typography !== null
      ? (s.typography as Record<string, unknown>)
      : {};
  const typography: ProductCardStyle["typography"] = {};
  for (const key of TYPOGRAPHY_KEYS) {
    const value = parseTypography(typographyRaw[key]);
    if (value) typography[key] = value;
  }

  const template = str(source.template, "");

  return {
    template: (PRODUCT_CARD_TEMPLATE_IDS as readonly string[]).includes(
      template,
    )
      ? (template as ProductCardTemplateId)
      : "minimal",
    groups: normalizeProductCardGroups(source.groups),
    visibility: {
      cartButtonAlways: bool(v.cartButtonAlways, dv.cartButtonAlways),
      discountChip: bool(v.discountChip, dv.discountChip),
      discountChipOnImage: bool(v.discountChipOnImage, dv.discountChipOnImage),
      itemSold: bool(v.itemSold, dv.itemSold),
      ratingCount: bool(v.ratingCount, dv.ratingCount),
      ratingMinimized: bool(v.ratingMinimized, dv.ratingMinimized),
      variantCount: bool(v.variantCount, dv.variantCount),
    },
    style: {
      cardRadius: num(s.cardRadius, ds.cardRadius),
      cardPadding: num(s.cardPadding, ds.cardPadding),
      cardBackground: str(s.cardBackground, ds.cardBackground),
      cardBorder: str(s.cardBorder, ds.cardBorder),
      cardBorderWidth: num(s.cardBorderWidth, ds.cardBorderWidth),
      cardShadow: num(s.cardShadow, ds.cardShadow),
      previewBackground: str(s.previewBackground, ds.previewBackground),
      previewRadius: num(s.previewRadius, ds.previewRadius),
      previewHeight: num(s.previewHeight, ds.previewHeight),
      previewHover: (
        PRODUCT_CARD_HOVER_EFFECTS as readonly string[]
      ).includes(str(s.previewHover, ""))
        ? (s.previewHover as ProductCardHoverEffect)
        : ds.previewHover,
      groupGap: num(s.groupGap, ds.groupGap),
      itemGap: num(s.itemGap, ds.itemGap),
      typography,
      cartBackground: str(s.cartBackground, ds.cartBackground),
      cartBorder: str(s.cartBorder, ds.cartBorder),
      cartBorderWidth: num(s.cartBorderWidth, ds.cartBorderWidth),
      cartRadius: num(s.cartRadius, ds.cartRadius),
      ratingColor: str(s.ratingColor, ds.ratingColor),
      stockBackground: str(s.stockBackground, ds.stockBackground),
      stockBorder: str(s.stockBorder, ds.stockBorder),
      stockBorderWidth: num(s.stockBorderWidth, ds.stockBorderWidth),
      stockRadius: num(s.stockRadius, ds.stockRadius),
    },
  };
}

// ---- Render helpers (shared by the card and the admin preview) ------------

/** Typography → inline style, only the properties the merchant actually set. */
export function cardTypographyCss(
  value: ProductCardTypography | undefined,
): CSSProperties {
  if (!value) return {};
  const css: CSSProperties = {};
  if (value.weight) css.fontWeight = value.weight as CSSProperties["fontWeight"];
  if (value.style) css.fontStyle = value.style;
  if (value.size > 0) css.fontSize = `${value.size}px`;
  if (value.color) css.color = value.color;
  return css;
}

/** True when the wrapper draws any chrome of its own. */
export function cardHasChrome(style: ProductCardStyle): boolean {
  return Boolean(
    style.cardBackground ||
      (style.cardBorder && style.cardBorderWidth > 0) ||
      style.cardShadow > 0 ||
      style.cardPadding > 0,
  );
}

/** The card wrapper's inline chrome; empty when nothing is customized. */
export function cardChromeCss(style: ProductCardStyle): CSSProperties {
  if (!cardHasChrome(style)) return {};
  const css: CSSProperties = { borderRadius: style.cardRadius };
  if (style.cardPadding > 0) css.padding = style.cardPadding;
  if (style.cardBackground) css.backgroundColor = style.cardBackground;
  if (style.cardBorder && style.cardBorderWidth > 0) {
    css.border = `${style.cardBorderWidth}px solid ${style.cardBorder}`;
  }
  if (style.cardShadow > 0) {
    css.boxShadow = `0 8px ${style.cardShadow}px rgba(0,0,0,0.12)`;
  }
  return css;
}

/** Groups → the visible element keys per group, empty groups dropped. */
export function visibleProductCardGroups(
  groups: ProductCardGroup[],
): ProductCardElement[][] {
  return groups
    .map((entry) => entry.items.filter((item) => item.on).map((item) => item.key))
    .filter((keys) => keys.length > 0);
}

/** Whether an element is present AND switched on anywhere in the groups. */
export function productCardElementOn(
  groups: ProductCardGroup[],
  key: ProductCardElement,
): boolean {
  return groups.some((entry) =>
    entry.items.some((item) => item.key === key && item.on),
  );
}
