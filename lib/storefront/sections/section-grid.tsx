import "server-only";

import Link from "next/link";
import { AppImage } from "@/components/ui/app-image";
import { SavedSlider } from "@/components/store/saved-slider";
import { CategoryRailCard } from "@/components/store/sections/category-rail-card";
import {
  isExternalSectionHref,
  resolveSectionHref,
} from "@/components/store/sections/section-shell";
import {
  buildRenderSlides,
  collectSlideProductIds,
  type SlideProductInfo,
} from "@/lib/sliders/render";
import { getStorefrontSlider } from "@/lib/storefront/sliders";
import {
  getProductCompareAtRange,
  getProductPriceRange,
} from "@/lib/products/price-display";
import { getStorefrontProductCards } from "@/lib/products/storefront-product-cards";
import { cn } from "@/lib/utils";
import type { Locale } from "@/config/i18n.config";
import type { SliderCellContent, SliderGrid } from "./slider-grids";

/**
 * The grid-of-cells renderer, shared by every section built that way — the
 * Hero Slider and the Promotion Grid today.
 *
 * A cell holds either a saved Slider or a static linked image, and the two
 * sections differ only in the frame they hang the grid in (their own width
 * and height rules). Keeping ONE implementation here is what stops them
 * drifting: the slider/product resolution, the empty-cell plate, the external
 * link handling and the category rail are all decided once.
 */

export interface SectionGridProps {
  grid: SliderGrid;
  /** Cell content in slot order; `null` for a slot with no block. */
  cells: (SliderCellContent | null)[];
  locale: Locale;
  /** Height utility for the grid box (the section owns the vocabulary). */
  heightClass?: string;
  /** Corner treatment, which the section's width setting decides. */
  roundedClass?: string;
  className?: string;
}

/** Resolve every bound slider, and every product across them, in one pass.
 * Exported for the collection rows, whose feature slot is a slider cell. */
export async function resolveCellData(cells: (SliderCellContent | null)[]) {
  const handles = Array.from(
    new Set(
      cells.flatMap((cell) =>
        cell && cell.kind === "slider" && cell.slider ? [cell.slider] : [],
      ),
    ),
  );
  const sliders = new Map(
    (
      await Promise.all(
        handles.map(
          async (handle) => [handle, await getStorefrontSlider(handle)] as const,
        ),
      )
    ).filter(([, slider]) => slider !== null),
  );

  const productIds = Array.from(
    new Set(
      Array.from(sliders.values()).flatMap((slider) =>
        slider ? collectSlideProductIds(slider.slides) : [],
      ),
    ),
  );
  const products = new Map<string, SlideProductInfo>();
  if (productIds.length > 0) {
    try {
      const cards = await getStorefrontProductCards({
        ids: productIds,
        limit: productIds.length,
      });
      for (const card of cards) {
        if (!card.slug) continue;
        const priceMin = getProductPriceRange(card).min;
        const compareAtMax = getProductCompareAtRange(card)?.max;
        products.set(String(card._id), {
          slug: card.slug,
          priceMin,
          ...(compareAtMax !== undefined ? { compareAtMax } : {}),
        });
      }
    } catch {
      // Price is decoration on a promo cell; a failed lookup must not take
      // the cell — or the page — down with it.
    }
  }
  return { sliders, products };
}

export async function SectionGrid({
  grid,
  cells,
  locale,
  heightClass,
  roundedClass = "rounded-[10px]",
  className,
}: SectionGridProps) {
  const { sliders, products } = await resolveCellData(cells);

  const cellFrame = cn(
    "relative overflow-hidden aspect-[16/7] lg:aspect-auto",
    roundedClass,
  );

  const cellNode = (area: string, index: number) => {
    const cell = cells[index];

    if (cell && cell.kind === "image" && cell.image) {
      const body = (
        <AppImage
          src={cell.image}
          alt={cell.alt}
          fill
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 50vw"
        />
      );
      if (!cell.link) {
        return (
          <div key={area} data-hs-area={area} className={cellFrame}>
            {body}
          </div>
        );
      }
      const href = resolveSectionHref(locale, cell.link);
      return isExternalSectionHref(cell.link) ? (
        <a
          key={area}
          data-hs-area={area}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={cellFrame}
        >
          {body}
        </a>
      ) : (
        <Link key={area} data-hs-area={area} href={href} className={cellFrame}>
          {body}
        </Link>
      );
    }

    const slider =
      cell && cell.kind === "slider" && cell.slider
        ? sliders.get(cell.slider)
        : undefined;
    if (slider) {
      return (
        <div key={area} data-hs-area={area} className={cellFrame}>
          <SavedSlider
            slides={buildRenderSlides(slider.slides, products)}
            className={cn("h-full w-full aspect-auto", roundedClass)}
            transition={slider.transition}
            autoplayDelayMs={slider.autoplaySeconds * 1000}
          />
        </div>
      );
    }

    // Unassigned (or unresolvable) cell: a quiet plate, never a hole — the
    // grid's proportions hold whatever is missing.
    return (
      <div key={area} data-hs-area={area} className={cn(cellFrame, "bg-muted")} />
    );
  };

  return (
    <div
      className={cn(
        "hs-grid gap-3 lg:gap-3.5",
        `hs-grid--${grid.key}`,
        heightClass,
        className,
      )}
    >
      {grid.category ? (
        <div data-hs-area={grid.category.area} className="hidden lg:block">
          <CategoryRailCard locale={locale} />
        </div>
      ) : null}
      {grid.slots.map((area, index) => cellNode(area, index))}
    </div>
  );
}

/** The matching loading frame — same shape, no content. */
export function SectionGridSkeleton({
  grid,
  heightClass,
  roundedClass = "rounded-[10px]",
}: {
  grid: SliderGrid;
  heightClass?: string;
  roundedClass?: string;
}) {
  return (
    <div
      className={cn("hs-grid gap-3 lg:gap-3.5", `hs-grid--${grid.key}`, heightClass)}
    >
      {grid.category ? (
        <div
          data-hs-area={grid.category.area}
          className={cn("hidden animate-pulse bg-accent lg:block", roundedClass)}
        />
      ) : null}
      {grid.slots.map((area) => (
        <div
          key={area}
          data-hs-area={area}
          className={cn(
            "animate-pulse bg-accent aspect-[16/7] lg:aspect-auto",
            roundedClass,
          )}
        />
      ))}
    </div>
  );
}
