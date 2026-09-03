import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { type Locale } from "@/config/i18n.config";
import { LocationPicker } from "@/components/layout/location-picker";
import { type ModernProduct } from "@/components/products/modern-product-card";
import { ProductGrid } from "@/components/products/product-grid";
import { ProductSkeleton } from "@/components/products/product-skeleton";
import { ProductsSort } from "@/components/products/products-sort";
import { StickySidebar } from "@/components/ui/sticky-sidebar";
import {
  ElectronicsCategoryScroller,
} from "@/components/store/sections/themes/electronics-category-scroller";
import {
  ElectronicsCategoryFilters,
  ElectronicsCategoryFiltersMobile,
  FilterSection,
} from "@/components/store/sections/themes/electronics-category-filters";
import { ElectronicsFeaturedProducts } from "@/components/store/sections/themes/electronics-featured-products";
import { ElectronicsListingShell } from "@/components/store/sections/themes/electronics-listing-shell";
import { readStoredShopperLocation } from "@/lib/locations/resolve-request-location";
import { normalizeRequestSortBy } from "@/lib/locations/shopper-location";
import { getStorefrontCategoryFacets } from "@/lib/products/storefront-product-filters";
import { getStorefrontProducts } from "@/lib/products/storefront-products";
import { getStorefrontSettings } from "@/lib/storefront-settings";
import type { CategoryTemplateResource } from "@/lib/storefront/sections/types";

/**
 * The Electronics theme's reading of the category template — same contract
 * as `CategoryDetailHeader`/`CategoryDetailMain` (resolved through the theme
 * override table), so the stored template document renders under every theme
 * and switching back to Classic restores the stock page untouched.
 */

export async function ElectronicsCategoryHeader({
  locale,
  resource,
}: {
  locale: Locale;
  resource: CategoryTemplateResource;
}) {
  const t = await getTranslations({ locale });
  const category = resource.category;
  const children = Array.isArray(category.children) ? category.children : [];

  return (
    <section className="container mx-auto mb-8 px-4 sm:mb-10">
      {/* "Shop by **Laptops**" — the message decides where the category name
          sits, so locales that lead with the noun stay grammatical while the
          gradient always lands on the name itself. */}
      <h1 className="text-center text-[26px] font-normal tracking-[-0.03em] text-foreground sm:text-[34px]">
        {t.rich("storeCategoryDetailPage.title", {
          name: category.name,
          em: (chunks) => (
            <span className="bg-linear-to-r from-foreground to-foreground/35 bg-clip-text font-bold text-transparent">
              {chunks}
            </span>
          ),
        })}
      </h1>

      {children.length > 0 ? (
        <div className="mt-8 sm:mt-10">
          <ElectronicsCategoryScroller
            locale={locale}
            categories={children.map((child) => ({
              id: child._id,
              slug: child.slug,
              name: child.name,
              image: (child.image || child.icon) as string | undefined,
            }))}
          />
        </div>
      ) : null}
    </section>
  );
}

/** Featured minis the sidebar shows below the facets. */
const FEATURED_LIMIT = 4;

export async function ElectronicsCategoryMain({
  locale,
  resource,
}: {
  locale: Locale;
  resource: CategoryTemplateResource;
}) {
  const t = await getTranslations({ locale });
  const category = resource.category;
  const search = resource.searchParams;
  const location = resource.location;

  const subcategories = (
    Array.isArray(category.children) ? category.children : []
  ).map((child) => ({ name: child.name, slug: child.slug }));
  const subcategorySlugs = new Set(subcategories.map((entry) => entry.slug));

  // Only this category's own children count as a selection — any other slug
  // in the param would quietly turn this page into a different listing.
  const selectedCategories =
    typeof search.category === "string"
      ? search.category
          .split(",")
          .filter((slug) => subcategorySlugs.has(slug))
          .join(",")
      : "";
  const stockParam =
    typeof search.stock === "string"
      ? search.stock
          .split(",")
          .filter((value) => value === "in" || value === "out")
          .join(",")
      : "";
  const stockSet = new Set(stockParam.split(","));
  const brand = typeof search.brand === "string" ? search.brand : "";
  const minPrice =
    typeof search.minPrice === "string" ? search.minPrice : undefined;
  const maxPrice =
    typeof search.maxPrice === "string" ? search.maxPrice : undefined;
  const sortBy =
    normalizeRequestSortBy(
      typeof search.sortBy === "string" ? search.sortBy : undefined,
      search,
    ) || "popular";
  const rawPage = typeof search.page === "string" ? parseInt(search.page, 10) : 1;
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;

  // No sub-category selection means the whole branch, exactly as before.
  const categoryFilter = selectedCategories || category.slug;

  const [{ priceRange, brands }, featured, { headerSettings }] =
    await Promise.all([
      getStorefrontCategoryFacets(category.slug),
      fetchFeaturedProducts(category.slug),
      getStorefrontSettings(),
    ]);

  // Same rule as the stock listing: the header carries no location control,
  // so the grid hosts the picker for the location that narrows it.
  const showLocation = Boolean(headerSettings.widgets?.showLocationPicker);
  const initialLocation = showLocation
    ? await readStoredShopperLocation()
    : null;

  const filterProps = {
    locale,
    subcategories,
    brands,
    priceRange,
    currentCategories: selectedCategories || undefined,
    currentStock: stockParam || undefined,
    currentBrands: brand || undefined,
    currentMinPrice: minPrice,
    currentMaxPrice: maxPrice,
  };

  return (
    <div className="container mx-auto px-4">
      {showLocation ? (
        <div className="-ms-2.5 mb-4">
          <LocationPicker initialLocation={initialLocation} />
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[260px_1fr]">
        <StickySidebar className="hidden lg:block">
          <ElectronicsCategoryFilters {...filterProps} />
          {featured.length > 0 ? (
            <div className="border-t border-border/70">
              <FilterSection title={t("storeCategoryDetailPage.featuredProducts")}>
                <ElectronicsFeaturedProducts
                  locale={locale}
                  products={featured}
                />
              </FilterSection>
            </div>
          ) : null}
        </StickySidebar>

        {/* `min-w-0` keeps a long product name from widening the grid column
            past its track and pushing the sidebar off. */}
        <div className="min-w-0">
          <ElectronicsCategoryFiltersMobile {...filterProps} />

          <ElectronicsListingShell
            viewLabel={t("common.view")}
            sort={
              <ProductsSort
                currentSort={sortBy}
                triggerClassName="rounded-[8px] px-4 data-[size=default]:h-9"
                labels={{
                  label: t("product.sortBy"),
                  mostPopular: t("productsPage.filters.sortOptions.mostPopular"),
                  bestRating: t("productsPage.filters.sortOptions.bestRating"),
                  newest: t("productsPage.filters.sortOptions.newest"),
                  priceLowHigh: t("productsPage.filters.sortOptions.priceLowHigh"),
                  priceHighLow: t("productsPage.filters.sortOptions.priceHighLow"),
                  nearest: t.has("location.nearestFirst")
                    ? t("location.nearestFirst")
                    : "Nearest",
                }}
              />
            }
          >
            <Suspense fallback={<ProductSkeleton count={12} />}>
              <ProductGrid
                locale={locale}
                category={categoryFilter}
                brand={brand || undefined}
                minPrice={minPrice}
                maxPrice={maxPrice}
                sortBy={sortBy}
                page={page}
                inStock={stockSet.has("in") || undefined}
                outOfStock={stockSet.has("out") || undefined}
                appearance="electronics"
                gridClassName="gap-y-10 lg:grid-cols-[repeat(var(--listing-cols,4),minmax(0,1fr))]"
                paginationParams={{ stock: stockParam || undefined }}
                emptyMessage={t("storeCategoryDetailPage.empty")}
                lat={location.lat}
                lng={location.lng}
                radius={location.radius}
                city={location.city}
                pickupNearby={location.pickupNearby}
              />
            </Suspense>
          </ElectronicsListingShell>
        </div>
      </div>
    </div>
  );
}

/** The sidebar strip must never take the page down with it. */
async function fetchFeaturedProducts(
  categorySlug: string,
): Promise<ModernProduct[]> {
  try {
    const result = await getStorefrontProducts<ModernProduct>({
      category: categorySlug,
      featured: true,
      limit: FEATURED_LIMIT,
      cardFieldsOnly: true,
    });
    return Array.isArray(result.data) ? result.data : [];
  } catch {
    return [];
  }
}
