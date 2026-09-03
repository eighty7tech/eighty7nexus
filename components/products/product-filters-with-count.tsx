import {
  ProductFilters,
  type ProductFiltersProps,
} from "@/components/products/product-filters";
import { getStorefrontProducts } from "@/lib/products/storefront-products";

/**
 * The filter panel, with the current result total resolved for it.
 *
 * Split out as its own server component so the count can be awaited inside a
 * Suspense boundary: the panel is rendered in the page shell, above and beside
 * the grid, and awaiting a query there would hold back the whole page for a
 * number that only annotates one group in the sidebar.
 *
 * The query is deliberately the grid's own query with `limit` left alone — the
 * storefront cache is keyed on the normalized arguments, so passing exactly what
 * the grid passes reads its cache entry instead of running a second count.
 */
export interface ProductFiltersWithCountProps extends ProductFiltersProps {
  /**
   * The grid's query, verbatim. Any divergence from what `<ProductGrid>`
   * receives both misses the cache and reports a total for a different set of
   * products than the shopper is looking at.
   */
  gridQuery: {
    category?: string;
    collection?: string;
    brand?: string;
    vendor?: string;
    search?: string;
    minPrice?: string;
    maxPrice?: string;
    sortBy?: string;
    sortOrder?: string;
    page?: number;
    preorder?: boolean;
    lat?: string;
    lng?: string;
    radius?: string;
    city?: string;
    pickupNearby?: string;
  };
}

export async function ProductFiltersWithCount({
  gridQuery,
  ...filterProps
}: ProductFiltersWithCountProps) {
  let resultCount: number | undefined;

  try {
    const result = await getStorefrontProducts({
      ...gridQuery,
      cardFieldsOnly: true,
    });
    resultCount = result.pagination?.total;
  } catch {
    // The grid renders its own failure; the sidebar simply omits the count
    // rather than taking the page down for an annotation.
  }

  return <ProductFilters {...filterProps} resultCount={resultCount} />;
}
