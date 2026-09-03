import { HomeProductsSection } from "@/components/store/home-products-section";
import { FeaturedProductsSkeleton } from "@/components/store/home-section-skeletons";
import {
  FEATURED_PRODUCTS_LIMIT_MAX,
  FEATURED_PRODUCTS_LIMIT_MIN,
  FEATURED_PRODUCTS_SOURCES,
  type FeaturedProductsSource,
} from "@/lib/home-page-config";
import { lt } from "../localized";
import type { LocalizedText, SectionDefinition } from "../types";

/**
 * The catalogue browser (legacy "Featured Products"): in its default "all"
 * source it renders the category-chip grid with infinite scroll; curated
 * sources render a plain shelf. A distinct type from product-grid because
 * the components — and the merchandising job — are different.
 */
export const productBrowser: SectionDefinition = {
  type: "product-browser",
  version: 1,
  category: "products",
  fields: [
    { key: "title", type: "text", translatable: true, default: "" },
    { key: "source", type: "select", options: FEATURED_PRODUCTS_SOURCES, default: "all" },
    {
      key: "limit",
      type: "number",
      default: 8,
      min: FEATURED_PRODUCTS_LIMIT_MIN,
      max: FEATURED_PRODUCTS_LIMIT_MAX,
    },
    {
      key: "productIds",
      type: "productList",
      hint: 'Used when Source is "Manual selection". Drag to set the order they appear in.',
    },
  ],
  Render({ settings, ctx }) {
    const title = lt(
      settings.title as LocalizedText,
      ctx.locale,
      ctx.defaultLanguage,
    );
    return (
      <HomeProductsSection
        locale={ctx.locale}
        title={title || undefined}
        source={settings.source as FeaturedProductsSource}
        limit={settings.limit as number}
        productIds={settings.productIds as string[]}
      />
    );
  },
  Skeleton: FeaturedProductsSkeleton,
};
