import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { type Locale } from "@/config/i18n.config";
import { ImageOff, Activity } from "lucide-react";
import { AppImage } from "@/components/ui/app-image";
import type { CategoryTemplateResource } from "@/lib/storefront/sections/types";
import { LocationPicker } from "@/components/layout/location-picker";
import { ProductGrid } from "@/components/products/product-grid";
import { ProductSkeleton } from "@/components/products/product-skeleton";
import { readStoredShopperLocation } from "@/lib/locations/resolve-request-location";
import { normalizeRequestSortBy } from "@/lib/locations/shopper-location";
import { getStorefrontSettings } from "@/lib/storefront-settings";

export async function PharmacyCategoryHeader({
  locale,
  resource,
}: {
  locale: Locale;
  resource: CategoryTemplateResource;
}) {
  const t = await getTranslations({ locale });
  const category = resource.category;
  const image = (category.image || category.icon) as string | undefined;

  return (
    <section className="container mx-auto mb-8 px-4">
      <div className="relative overflow-hidden rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 px-6 py-10 sm:px-10 sm:py-14 text-center border border-emerald-100 dark:border-emerald-900/50">
        {/* Subtle background decoration */}
        <div className="absolute -left-10 -top-10 opacity-5 dark:opacity-10 pointer-events-none">
          <Activity className="w-48 h-48 text-emerald-600" />
        </div>
        <div className="absolute -right-10 -bottom-10 opacity-5 dark:opacity-10 pointer-events-none">
          <Activity className="w-64 h-64 text-emerald-600" />
        </div>
        
        <div className="relative z-10 flex flex-col items-center max-w-2xl mx-auto">
          {image ? (
            <div className="relative w-24 h-24 mb-6 rounded-full bg-white dark:bg-card shadow-sm flex items-center justify-center p-4">
              <AppImage
                src={image}
                alt={category.name}
                fill
                sizes="96px"
                className="object-contain p-2"
              />
            </div>
          ) : (
            <div className="w-20 h-20 mb-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <ImageOff className="h-8 w-8" />
            </div>
          )}
          
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            {category.name}
          </h1>
          
          {typeof category.description === "string" && category.description ? (
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              {category.description}
            </p>
          ) : null}
          
          <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-emerald-100/50 dark:bg-emerald-900/30 px-4 py-1.5 text-sm font-medium text-emerald-700 dark:text-emerald-300">
            {t("storeCategoryDetailPage.productsCount", {
              count: Number(category.productCount ?? 0),
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

export async function PharmacyCategoryMain({
  locale,
  resource,
}: {
  locale: Locale;
  resource: CategoryTemplateResource;
}) {
  const t = await getTranslations({ locale });
  const search = resource.searchParams;
  const location = resource.location;

  const page = typeof search.page === "string" ? parseInt(search.page, 10) : 1;
  const sortBy =
    normalizeRequestSortBy(
      typeof search.sortBy === "string" ? search.sortBy : undefined,
      search,
    ) || "popular";

  const { headerSettings } = await getStorefrontSettings();
  const showLocation = Boolean(headerSettings.widgets?.showLocationPicker);
  const initialLocation = showLocation
    ? await readStoredShopperLocation()
    : null;

  return (
    <div className="container mx-auto px-4">
      {showLocation ? (
        <div className="-ms-2.5 mb-6 flex justify-center">
          <LocationPicker initialLocation={initialLocation} />
        </div>
      ) : null}

      <Suspense fallback={<ProductSkeleton count={12} />}>
        <ProductGrid
          locale={locale}
          category={resource.category.slug}
          sortBy={sortBy}
          page={Number.isNaN(page) ? 1 : page}
          emptyMessage={t("storeCategoryDetailPage.empty")}
          lat={location.lat}
          lng={location.lng}
          radius={location.radius}
          city={location.city}
          pickupNearby={location.pickupNearby}
        />
      </Suspense>
    </div>
  );
}
