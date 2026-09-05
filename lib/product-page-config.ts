export const PRODUCT_PAGE_STYLE_VARIANTS = [
  "standard",
  "gallery",
  "sticky-sidebar",
  "full-width",
  "minimal",
  "dynamic",
] as const;
export type ProductPageStyleVariant = (typeof PRODUCT_PAGE_STYLE_VARIANTS)[number];

export interface ProductPageSettings {
  layout: {
    style: ProductPageStyleVariant;
    showMenu: boolean;
    cardStyle: string;
    showMobileStickyBar: boolean;
  };
  visibility: {
    itemSold: boolean;
    variantCount: boolean;
    ratingCount: boolean;
  };
}

const DEFAULT_PRODUCT_PAGE_SETTINGS: ProductPageSettings = {
  layout: {
    style: "standard",
    showMenu: true,
    cardStyle: "nexus-glassmorphic",
    showMobileStickyBar: true,
  },
  visibility: {
    itemSold: true,
    variantCount: true,
    ratingCount: true,
  },
};

function cloneDefaults(): ProductPageSettings {
  return JSON.parse(JSON.stringify(DEFAULT_PRODUCT_PAGE_SETTINGS)) as ProductPageSettings;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function normalizeStyleVariant(
  value: unknown,
  fallback: ProductPageStyleVariant,
): ProductPageStyleVariant {
  if (
    typeof value === "string" &&
    (PRODUCT_PAGE_STYLE_VARIANTS as readonly string[]).includes(value)
  ) {
    return value as ProductPageStyleVariant;
  }
  return fallback;
}

export function getDefaultProductPageSettings(): ProductPageSettings {
  return cloneDefaults();
}

export function normalizeProductPageSettings(value: unknown): ProductPageSettings {
  const defaults = cloneDefaults();
  const source = isRecord(value) ? value : {};
  const layout = isRecord(source.layout) ? source.layout : {};
  const visibility = isRecord(source.visibility) ? source.visibility : {};

  return {
    layout: {
      style: normalizeStyleVariant(layout.style, defaults.layout.style),
      showMenu: typeof layout.showMenu === "boolean" ? layout.showMenu : defaults.layout.showMenu,
      cardStyle: typeof layout.cardStyle === "string" ? layout.cardStyle : defaults.layout.cardStyle,
      showMobileStickyBar: typeof layout.showMobileStickyBar === "boolean" ? layout.showMobileStickyBar : defaults.layout.showMobileStickyBar,
    },
    visibility: {
      itemSold: normalizeBoolean(visibility.itemSold, defaults.visibility.itemSold),
      variantCount: normalizeBoolean(visibility.variantCount, defaults.visibility.variantCount),
      ratingCount: normalizeBoolean(visibility.ratingCount, defaults.visibility.ratingCount),
    },
  };
}
