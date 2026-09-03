import Link from "next/link";
import { unstable_cache } from "next/cache";
import { AppImage } from "@/components/ui/app-image";
import { type Locale } from "@/config/i18n.config";
import { CACHE_TAGS } from "@/lib/cache-invalidation";
import { STOREFRONT_BRAND_FILTER } from "@/lib/brands";
import { connectDB } from "@/lib/db";
import { Brand } from "@/models";

interface BrandTile {
  key: string;
  href: string;
  image: string;
  name: string;
}

const fetchBrands = unstable_cache(
  async (featuredOnly: boolean, limit: number) => {
    try {
      await connectDB();
      const query: Record<string, unknown> = { isActive: true };
      if (featuredOnly) query.featured = true;
      const brands = await Brand.find(query)
        .select("name slug logo")
        .sort({ featured: -1, name: 1 })
        .limit(limit)
        .lean();
      return JSON.parse(JSON.stringify(brands)) as {
        _id: string;
        name: string;
        slug: string;
        logo?: string;
      }[];
    } catch {
      return [];
    }
  },
  ["section-brand-list"],
  {
    revalidate: 60,
    tags: [CACHE_TAGS.brands],
  },
);

/** Curated picks resolved by id, public-storefront brands only. */
const fetchBrandsByIds = unstable_cache(
  async (ids: string[]) => {
    try {
      await connectDB();
      const brands = await Brand.find({
        _id: { $in: ids },
        ...STOREFRONT_BRAND_FILTER,
      })
        .select("name slug logo")
        .lean();
      return JSON.parse(JSON.stringify(brands)) as {
        _id: string;
        name: string;
        slug: string;
        logo?: string;
      }[];
    } catch {
      return [];
    }
  },
  ["section-brand-list-picks"],
  {
    revalidate: 60,
    tags: [CACHE_TAGS.brands],
  },
);

/**
 * "cards" is the original bordered-tile row; "strip" is the plain logo run
 * from the Electronics design — no boxes, just evenly spaced marks. The
 * presentational half of the section's variants.
 */
export type BrandListAppearance = "cards" | "strip";

interface BrandListProps {
  locale: Locale;
  /** Picked Brand ids in row order; empty falls back to the Brands DB. */
  brandIds: string[];
  appearance?: BrandListAppearance;
  /** Shown instead of nothing when there are no brands at all (preview only). */
  emptyState?: React.ReactNode;
}

async function resolveTiles(
  locale: Locale,
  brandIds: string[],
): Promise<BrandTile[]> {
  if (brandIds.length > 0) {
    const brands = await fetchBrandsByIds(Array.from(new Set(brandIds)));
    const byId = new Map(brands.map((brand) => [brand._id, brand]));
    // Row order is the merchant's order; a brand that fell off the public
    // storefront (deactivated, archived) simply drops out of the strip.
    return brandIds
      .map((id) => byId.get(id))
      .filter((brand): brand is NonNullable<typeof brand> => Boolean(brand))
      .map((brand) => ({
        key: brand._id,
        image: brand.logo ?? "",
        name: brand.name,
        href: `/${locale}/brands/${brand.slug}`,
      }));
  }

  // Auto mode: sections without picks keep showing the store's Brands,
  // featured first — falling back to all active brands so the strip isn't
  // empty before anyone has starred one.
  let brands = await fetchBrands(true, 10);
  if (brands.length === 0) brands = await fetchBrands(false, 10);
  return brands.map((brand) => ({
    key: brand._id,
    image: brand.logo ?? "",
    name: brand.name,
    href: `/${locale}/products?brand=${encodeURIComponent(brand.slug)}`,
  }));
}

/** The brand logo strip; each logo links through to its brand page. */
export async function BrandList({
  locale,
  brandIds,
  appearance = "cards",
  emptyState = null,
}: BrandListProps) {
  const tiles = await resolveTiles(locale, brandIds);
  if (tiles.length === 0) return <>{emptyState}</>;

  const strip = appearance === "strip";
  const tileClassName = strip
    ? "flex h-12 shrink-0 items-center justify-center px-1"
    : "flex h-16 w-32 shrink-0 items-center justify-center rounded-md border border-border/70 bg-card px-4 transition-colors hover:border-border";

  return (
    <section className="py-5 lg:py-8">
      <div className="container mx-auto px-4">
        <div
          className={
            strip
              ? "flex items-center justify-between gap-6 overflow-x-auto pb-1 sm:gap-10 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              : "flex items-center gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          }
        >
          {tiles.map((tile) => (
            <Link
              key={tile.key}
              href={tile.href}
              className={tileClassName}
              title={tile.name}
            >
              {tile.image ? (
                <AppImage
                  src={tile.image}
                  alt={tile.name}
                  width={96}
                  height={40}
                  className="max-h-10 w-auto object-contain opacity-80 grayscale transition-all hover:opacity-100 hover:grayscale-0"
                  sizes="96px"
                />
              ) : (
                <span className="truncate text-sm font-semibold text-muted-foreground">
                  {tile.name}
                </span>
              )}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
