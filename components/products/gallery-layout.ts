/**
 * Layout constants shared by ProductImageGallery and ProductDetailsSkeleton.
 *
 * The skeleton has to occupy exactly the box the gallery will, or the route
 * fallback resizes when the real content swaps in. Keeping the classes in one
 * plain module (not the "use client" gallery, whose exports become client
 * references when a server component imports them) is what guarantees that.
 */

/**
 * Main media box: viewport-height while the layout is stacked, square once the
 * buy box moves beside it at xl, and capped against the header height so the
 * thumbnail row stays above the fold on short viewports.
 *
 * Written as one literal — Tailwind scans source text, so an interpolated
 * class name would never be generated. `--storefront-header-height` is
 * published by store-header from a client effect and is therefore absent for
 * the server-rendered loading fallback; the 7rem fallback approximates the real
 * sticky header (~114px) instead of a token 4rem, which otherwise made the
 * skeleton's media box taller than the gallery on short viewports.
 */
export const MEDIA_FRAME_CLASS =
  "relative h-[45vh] w-full md:h-[50vh] xl:aspect-square xl:h-auto xl:max-h-[calc(100svh-var(--storefront-header-height,7rem)-14rem)]";

/**
 * Thumbnail row, capped below xl where the gallery spans the page. A centered
 * flex row (not a grid) so rows with fewer than 4 tiles stay centered under
 * the main image instead of clinging to the left edge.
 */
export const THUMBNAIL_ROW_CLASS =
  "mx-auto flex max-w-xl justify-center gap-4 sm:gap-5 xl:max-w-none";

/**
 * Tile width matching the old 4-up grid: a quarter of the row minus this
 * tile's share of the 3 gaps (gap-4 → 3rem/4, sm:gap-5 → 3.75rem/4).
 */
export const THUMBNAIL_TILE_WIDTH_CLASS =
  "w-[calc(25%-0.75rem)] sm:w-[calc(25%-0.9375rem)]";

/** A single thumbnail tile. */
export const THUMBNAIL_TILE_CLASS = `aspect-4/3 rounded-md ${THUMBNAIL_TILE_WIDTH_CLASS}`;

/** Vertical rhythm between the media box and the thumbnail row. */
export const GALLERY_STACK_CLASS = "space-y-4 sm:space-y-5";
