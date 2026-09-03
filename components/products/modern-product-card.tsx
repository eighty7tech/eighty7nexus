"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Heart,
  Scale,
  Star,
  ShoppingBag,
  Maximize2,
  Loader2,
  Plus,
  ChevronRight,
  MapPin,
  Store,
} from "lucide-react";
import { memo, useRef, useState, useCallback } from "react";
import { useSponsoredTracking } from "@/components/store/sponsored-tracker";
import { Skeleton } from "@/components/ui/skeleton";
import { AppImage } from "@/components/ui/app-image";
import { ModelViewer } from "@/components/ui/model-viewer";
import { useCurrency } from "@/providers/currency-provider";
import { useCart } from "@/hooks/use-cart";
import { useWishlist } from "@/hooks/use-wishlist";
import { useCompare } from "@/hooks/use-compare";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/components/ui/toast-notification";
import { type Locale } from "@/config/i18n.config";
import { cn } from "@/lib/utils";
import { buildLoginUrl, currentBrowserPath } from "@/lib/return-path";
import {
  formatProductCompareAtPrice,
  formatProductPrice,
  getProductDiscountPercentage,
  getProductPriceRange,
  productRequiresVariantSelection,
  type MoneyRangeLike,
} from "@/lib/products/price-display";
import { findColorOption, getSwatchColor } from "@/lib/products/color-swatch";
import {
  getPurchasableQuantity,
  isProductAvailable,
} from "@/lib/products/stock-policy";
import { trackAddToCart } from "@/lib/analytics/events";
import { useProductCardConfig } from "@/components/products/product-card-config-context";
import {
  cardChromeCss,
  cardTypographyCss,
  visibleProductCardGroups,
  productCardElementOn,
  type ProductCardElement,
} from "@/lib/products/product-card-config";

// ============================================
// Types
// ============================================

type ProductOptionValue = {
  _id: string;
  value: string;
  colorCode?: string;
};

type ProductOption = {
  name: string;
  values: ProductOptionValue[];
};

type ProductVariant = {
  _id: string;
  name: string;
  price?: number;
  comparePrice?: number;
  images?: string[];
  options?: Record<string, string>;
  stock?: number;
  preorder?: ProductPreorder;
};

type ProductMediaKind = "image" | "video" | "model" | "external_video";

type ProductMedia = {
  _id: string;
  type?: ProductMediaKind;
  url: string;
  alt?: string;
  position?: number;
  mimeType?: string;
  thumbnailUrl?: string;
};

type ProductPreorder = {
  enabled?: boolean;
  releaseDate?: string | Date | null;
  message?: string | null;
  limit?: number | null;
  reservedQuantity?: number | null;
  preorderOnly?: boolean;
  autoConvert?: boolean;
  paymentMode?: "full" | "deposit" | "pay_later";
  depositType?: "percentage" | "fixed";
  depositValue?: number | null;
  batchName?: string | null;
};

export interface ModernProduct {
  _id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice?: number;
  priceRange?: MoneyRangeLike;
  compareAtPriceRange?: MoneyRangeLike;
  images: string[];
  media?: ProductMedia[];
  rating: number;
  reviewCount: number;
  stock: number;
  /** Stock policy — read via lib/products/stock-policy.ts, never directly. */
  shipping?: { isPhysicalProduct?: boolean };
  inventory?: { tracked?: boolean; continueSellingWhenOutOfStock?: boolean };
  preorder?: ProductPreorder;
  featured?: boolean;
  status?: string;
  options?: ProductOption[];
  variants?: ProductVariant[];
  createdAt?: string | Date;
  vendorId?: {
    storeName: string;
    slug: string;
    address?: {
      city?: string;
    };
  };
  /**
   * Populated `{name, slug}` on storefront card queries; a bare id string on
   * older payloads, which the card cannot print and ignores. Rendered only
   * when the merchant adds the Category element in the card configurator.
   */
  category?: string | { _id?: string; name?: string; slug?: string };
  /** Units sold, when the surface carries it; powers the "N sold" tag. */
  soldCount?: number;
  /**
   * Kilometres from the shopper to this product's vendor, set by the grid when
   * a location with real coordinates is active. Absent for a city-name match or
   * an un-geocoded vendor, where the card shows the city instead of a number it
   * cannot honestly compute.
   */
  distanceKm?: number;
  /**
   * There is a shop inside the shopper's radius where this can be collected.
   *
   * Set by the query layer from the vendor's own collection points, and kept
   * separate from `distanceKm` on purpose: a vendor who hides their address
   * gets no distance but does still have a counter nearby, and it is never set
   * for a digital product, which cannot be collected at all.
   */
  collectNearby?: boolean;
  /**
   * Paid placement. Set only by the sponsored-pool query layer — organic
   * queries never emit it. Renders the always-visible "Sponsored" pill
   * (FTC/DSA disclosure) and rel="sponsored" on the card links, and carries
   * the campaign id for impression/click tracking.
   */
  sponsored?: boolean;
  sponsoredCampaignId?: string;
  /**
   * True only for an ad SPLICED INTO the grid, not for an organic result that
   * merely happens to be sponsored. The listing count is derived from the
   * organic set, so injected cards must be excludable from it.
   */
  sponsoredInjected?: boolean;
}

export interface ModernProductCardProps {
  product: ModernProduct;
  locale: Locale;
  variant?: "default" | "compact";
  showQuickView?: boolean;
  /** The compare toggle. Off on surfaces where a second pill is noise. */
  showCompare?: boolean;
  showAddToCart?: boolean;
  showWishlist?: boolean;
  showColorSwatches?: boolean;
  showRating?: boolean;
  showBadges?: boolean;
  /**
   * The Electronics listing design (Figma 759:179): swatch dots with a "+N"
   * overflow lead the copy, the category name rides under the title, price
   * runs bold with no rating row. Same tile, same actions, same data — an
   * arrangement, not a fork, so every buy path behaves identically. The
   * classic appearance is the configurator-driven layout below.
   */
  appearance?: "classic" | "electronics";
  onQuickView?: (product: ModernProduct) => void;
  className?: string;
}

function inferMediaType(media: {
  type?: ProductMediaKind;
  url: string;
  mimeType?: string;
}): ProductMediaKind {
  if (media.type) return media.type;
  const mimeType = media.mimeType?.toLowerCase() || "";
  const url = media.url.toLowerCase();

  if (mimeType.startsWith("video/")) return "video";
  if (
    mimeType.includes("gltf") ||
    mimeType === "application/octet-stream" ||
    url.endsWith(".glb") ||
    url.endsWith(".gltf")
  ) {
    return "model";
  }

  return "image";
}

function getPrimaryProductMedia(product: ModernProduct): ProductMedia | null {
  if (Array.isArray(product.media) && product.media.length > 0) {
    const media = [...product.media]
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
      // An external video is only renderable on the card via its thumbnail.
      .find((item) =>
        item.type === "external_video"
          ? Boolean(item.thumbnailUrl)
          : Boolean(item.url),
      );

    if (media) {
      return {
        ...media,
        type: inferMediaType(media),
        alt: media.alt || product.name,
      };
    }
  }

  const image = product.images?.find(Boolean);
  return image
    ? {
        _id: "primary-image",
        type: "image",
        url: image,
        alt: product.name,
      }
    : null;
}

function getPreorderRemaining(preorder?: ProductPreorder) {
  const limit = Number(preorder?.limit || 0);
  if (!Number.isFinite(limit) || limit <= 0) return Number.POSITIVE_INFINITY;
  return Math.max(0, limit - Number(preorder?.reservedQuantity || 0));
}

function isPreorderOpen(preorder?: ProductPreorder) {
  if (!preorder?.enabled) return false;
  const releaseDate = preorder.releaseDate
    ? new Date(preorder.releaseDate)
    : null;

  if (
    preorder.autoConvert !== false &&
    releaseDate &&
    !Number.isNaN(releaseDate.getTime()) &&
    releaseDate.getTime() < Date.now()
  ) {
    return false;
  }

  return getPreorderRemaining(preorder) > 0;
}

function hasActivePreorder(product: ModernProduct) {
  if (isPreorderOpen(product.preorder)) return true;
  return (product.variants || []).some((variant) =>
    isPreorderOpen(variant.preorder),
  );
}

function getPrimaryPreorder(product: ModernProduct) {
  if (isPreorderOpen(product.preorder)) return product.preorder;
  return (product.variants || []).find((variant) =>
    isPreorderOpen(variant.preorder),
  )?.preorder;
}

function formatPreorderDate(value?: ProductPreorder["releaseDate"]) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(date);
}

function getPreorderReserveLabel(preorder?: ProductPreorder) {
  const limit = Number(preorder?.limit || 0);
  if (!Number.isFinite(limit) || limit <= 0) return "";
  const reserved = Math.max(0, Number(preorder?.reservedQuantity || 0));
  const remaining = Math.max(0, limit - reserved);
  return `${remaining} left`;
}

function ProductCardMedia({
  media,
  productName,
  hoverZoom = true,
}: {
  media: ProductMedia | null;
  productName: string;
  /** Off when the configurator's preview hover effect is not "zoom". */
  hoverZoom?: boolean;
}) {
  const [isModelInteractive, setIsModelInteractive] = useState(false);

  if (!media) {
    return null;
  }

  const alt = media.alt || productName;

  if (media.type === "model") {
    return (
      <div
        className="h-full w-full"
        onMouseEnter={() => setIsModelInteractive(true)}
        onMouseLeave={() => setIsModelInteractive(false)}
        onFocus={() => setIsModelInteractive(true)}
        onBlur={() => setIsModelInteractive(false)}
      >
        <ModelViewer
          src={media.url}
          alt={alt}
          autoRotate={!isModelInteractive}
          cameraControls={isModelInteractive}
          loading="lazy"
          preferProxy
          poster={media.thumbnailUrl}
        />
      </div>
    );
  }

  if (media.type === "video") {
    return (
      <video
        src={media.url}
        poster={media.thumbnailUrl}
        muted
        playsInline
        preload="metadata"
        className="h-full w-full object-cover"
      />
    );
  }

  return (
    <AppImage
      // External videos point at a YouTube/Vimeo page, not an image — the
      // card shows their thumbnail instead (playback lives on the PDP).
      src={media.type === "external_video" ? media.thumbnailUrl : media.url}
      alt={alt}
      fill
      sizes="(max-width: 640px) 46vw, (max-width: 1024px) 32vw, 25vw"
      className={cn(
        "object-cover",
        hoverZoom && "transition-transform duration-500 group-hover:scale-105",
      )}
    />
  );
}

// ============================================
// Main Component
// ============================================

// Memoized: grids re-render on cart/filter state changes; cards with
// unchanged product props skip reconciliation.
export const ModernProductCard = memo(function ModernProductCard({
  product,
  locale,
  showQuickView = true,
  showCompare = true,
  showAddToCart = true,
  showWishlist = true,
  showColorSwatches = true,
  showRating = true,
  showBadges = true,
  appearance = "classic",
  onQuickView,
  className,
}: ModernProductCardProps) {
  const t = useTranslations();
  const router = useRouter();
  const { currency, formatPrice } = useCurrency();
  const { addItem } = useCart();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const {
    isComparing,
    toggle: toggleCompare,
    isFull: compareIsFull,
  } = useCompare();
  const { isAuthenticated } = useAuth();

  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isTogglingWishlist, setIsTogglingWishlist] = useState(false);

  // Paid placements report impressions (≥50% visible for 1s, deduped per
  // session) and clicks. A no-op for organic cards.
  const cardRef = useRef<HTMLAnchorElement>(null);
  useSponsoredTracking(
    cardRef,
    product.sponsored ? product.sponsoredCampaignId : undefined,
  );

  const inWishlist = isInWishlist(product._id);
  const inCompare = isComparing(product.slug);
  const isOutOfStock = !isProductAvailable(product, product.stock);
  const primaryPreorder = getPrimaryPreorder(product);
  const preorderAvailable = hasActivePreorder(product);
  const isUnavailable = isOutOfStock && !preorderAvailable;
  const priceLabel = formatProductPrice(product, formatPrice);
  const compareAtLabel = formatProductCompareAtPrice(product, formatPrice);
  const priceRange = getProductPriceRange(product);
  const needsVariantSelection = productRequiresVariantSelection(product);
  const primaryMedia = getPrimaryProductMedia(product);
  const cartImage =
    primaryMedia?.type === "image"
      ? primaryMedia.url
      : primaryMedia?.thumbnailUrl || product.images[0];
  const onlyVariant =
    Array.isArray(product.variants) && product.variants.length === 1
      ? product.variants[0]
      : null;
  const clickPreorderSettings = onlyVariant?.preorder?.enabled
    ? onlyVariant.preorder
    : product.preorder;
  const clickStock = getPurchasableQuantity(
    product,
    onlyVariant?.stock ?? product.stock,
  );
  const preorderPurchaseAvailable =
    isPreorderOpen(clickPreorderSettings) &&
    (clickPreorderSettings?.preorderOnly || clickStock <= 0);
  const preorderDateLabel = formatPreorderDate(primaryPreorder?.releaseDate);
  const preorderReserveLabel = getPreorderReserveLabel(primaryPreorder);
  const discountPercentage = getProductDiscountPercentage(product);
  // Distance when the shopper gave a real point. No city fallback: the grid
  // only sets `distanceKm` under a location filter, and printing a city on
  // every card of an unfiltered grid would be noise on results nobody asked to
  // place.
  //
  // The number is the distance to the merchant's nearest collection point, not
  // to their registered address — see `lib/locations/vendor-distance.ts`.
  //
  // Three bands, because one rounding rule cannot serve the whole range:
  // under 1 km rounds to "0 km away", which reads as a bug rather than as
  // "very close"; and above 10 km a decimal ("12.4 km away") implies a
  // precision that a geocoded shop address does not have.
  const originLabel = (() => {
    if (typeof product.distanceKm !== "number") return "";
    if (product.distanceKm < 1) return t("location.veryClose");

    return t("location.kmAway", {
      km:
        product.distanceKm < 10
          ? Math.round(product.distanceKm * 10) / 10
          : Math.round(product.distanceKm),
    });
  })();
  const collectNearbyLabel = t.has("location.collectNearby")
    ? t("location.collectNearby")
    : "Collect nearby";
  // Drives the price treatment: only a real markdown earns the accent pill.
  const hasDiscount = discountPercentage > 0 && Boolean(compareAtLabel);
  const chooseOptionsLabel = t.has("product.chooseOptions")
    ? t("product.chooseOptions")
    : "Choose options";
  const preorderLabel = t.has("product.preorder")
    ? t("product.preorder")
    : "Pre-order";
  const preorderNowLabel = t.has("product.preorderNow")
    ? t("product.preorderNow")
    : "Pre-order now";

  const isElectronics = appearance === "electronics";

  // Get color options for swatches
  const colorOption = findColorOption(product.options);
  const allColorValues = showColorSwatches ? colorOption?.values || [] : [];
  // Electronics runs a tight four-dot strip and says how many more ("+8");
  // the classic card simply caps at five and stays quiet about the rest.
  const swatchCap = isElectronics ? 4 : 5;
  const colorValues = allColorValues.slice(0, swatchCap);
  const colorOverflow = Math.max(0, allColorValues.length - colorValues.length);

  // Get the first selected color name (for display under product name)
  const selectedColorName = colorValues[0]?.value;

  // ---- Configurator-driven layout (admin → Online store → Product card).
  // Element presence/order comes from the config groups; the legacy show*
  // props still gate on top so surfaces can suppress pieces contextually.
  const cardConfig = useProductCardConfig();
  const vis = cardConfig.visibility;
  const cardStyle = cardConfig.style;
  const typography = cardStyle.typography;
  const orderedGroups = visibleProductCardGroups(cardConfig.groups);
  const cartOn =
    showAddToCart && productCardElementOn(cardConfig.groups, "cart");
  const priceOn = productCardElementOn(cardConfig.groups, "price");
  const ratingOn =
    showRating &&
    productCardElementOn(cardConfig.groups, "rating") &&
    product.reviewCount > 0;
  const categoryName =
    typeof product.category === "object" ? product.category?.name : undefined;
  const brandName = product.vendorId?.storeName;
  const soldCount = product.soldCount ?? 0;
  const variantTotal = product.variants?.length ?? 0;
  // The hover-revealed cart controls stay only while no persistent button
  // exists — with one, they would be a duplicate control on the same card.
  // Electronics never renders the persistent row, so its overlay always stays.
  const overlayCart = cartOn && (isElectronics || !vis.cartButtonAlways);
  const secondImageUrl =
    !isElectronics && cardStyle.previewHover === "second-image"
      ? (product.images ?? []).filter(Boolean)[1]
      : undefined;

  const handleAddToCart = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (isUnavailable || isAddingToCart) return;

      if (needsVariantSelection) {
        if (onQuickView) {
          onQuickView(product);
        } else {
          router.push(`/${locale}/products/${product.slug}`);
        }
        return;
      }

      setIsAddingToCart(true);
      try {
        await addItem({
          productId: product._id,
          variantId: onlyVariant?._id,
          name: onlyVariant
            ? `${product.name} - ${onlyVariant.name}`
            : product.name,
          price: onlyVariant?.price ?? priceRange.min,
          image: cartImage,
          quantity: 1,
        });
        trackAddToCart({
          currency: currency.code,
          value: onlyVariant?.price ?? priceRange.min,
          items: [
            {
              item_id: String(product._id),
              item_name: product.name,
              item_variant: onlyVariant?._id,
              price: onlyVariant?.price ?? priceRange.min,
              quantity: 1,
            },
          ],
        });
        toast.success(t("cart.itemAdded"));
      } catch (error) {
        const message =
          error instanceof Error && error.message
            ? error.message
            : t("common.error");
        toast.error(message);
      } finally {
        setIsAddingToCart(false);
      }
    },
    [
      addItem,
      cartImage,
      currency.code,
      isAddingToCart,
      isUnavailable,
      locale,
      needsVariantSelection,
      onQuickView,
      onlyVariant,
      priceRange.min,
      product,
      router,
      t,
    ],
  );

  const handleWishlistToggle = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (isTogglingWishlist) return;

      // Sign in and come back to this listing — the tap didn't save the item,
      // so an empty wishlist page would be a dead end.
      if (!isAuthenticated) {
        router.push(buildLoginUrl(locale, currentBrowserPath()));
        return;
      }

      setIsTogglingWishlist(true);
      try {
        if (inWishlist) {
          const success = await removeFromWishlist(product._id);
          if (success) {
            toast.success(t("wishlist.removed"));
          }
        } else {
          const success = await addToWishlist(product._id);
          if (success) {
            toast.success(t("wishlist.added"));
          }
        }
      } catch {
        toast.error(t("common.error"));
      } finally {
        setIsTogglingWishlist(false);
      }
    },
    [
      product._id,
      inWishlist,
      isAuthenticated,
      addToWishlist,
      removeFromWishlist,
      t,
      isTogglingWishlist,
      router,
      locale,
    ],
  );

  const handleQuickView = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onQuickView?.(product);
    },
    [product, onQuickView],
  );

  // ---- Element renderers (order and grouping come from the configurator).
  // Docked rating: one star + score riding the price row (the card's shipped
  // look). The standalone flavor renders when price is absent; the full
  // five-star row when the merchant switched minimized off.
  const minimizedRating = (docked: boolean) =>
    ratingOn ? (
      <div
        className={cn(
          "shrink-0 items-center gap-1 text-sm text-muted-foreground",
          docked ? "hidden @min-[215px]:flex" : "flex px-0.5",
        )}
        title={`${product.rating.toFixed(1)} (${product.reviewCount} ${t("common.reviews").toLowerCase()})`}
      >
        <Star
          className={cn(
            "h-3.5 w-3.5",
            cardStyle.ratingColor
              ? "fill-current"
              : "fill-amber-400 text-amber-400",
          )}
          style={
            cardStyle.ratingColor ? { color: cardStyle.ratingColor } : undefined
          }
        />
        <span className="font-medium text-foreground">
          {product.rating.toFixed(1)}
        </span>
      </div>
    ) : null;

  // Where this ships from / preorder facts — appearance-independent
  // information, shared by the configurator's "delivery" element and the
  // electronics arrangement below.
  const hasOriginLine = Boolean(originLabel || product.collectNearby);
  const hasPreorderLine =
    preorderAvailable && Boolean(preorderDateLabel || preorderReserveLabel);
  const metaNodes = (
    <>
      {/* Where this ships from. Only rendered once the shopper has set a
          location — on an unfiltered grid it is noise on every card, but
          inside a location filter it is the reason the product is here. */}
      {hasOriginLine ? (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground sm:text-xs">
          {originLabel ? (
            <span className="flex min-w-0 items-center gap-1">
              <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
              <span className="truncate">{originLabel}</span>
            </span>
          ) : null}
          {/* Deliberately a text line beside the distance rather than a fifth
              image pill: that stack already reaches four on hover and would
              collide with the action row on a phone-width card. It also reads
              as what it is — a fact about this seller, not a promotion. */}
          {product.collectNearby ? (
            <span className="flex items-center gap-1 font-medium text-emerald-700 dark:text-emerald-400">
              <Store className="h-3 w-3 shrink-0" aria-hidden="true" />
              {collectNearbyLabel}
            </span>
          ) : null}
        </div>
      ) : null}
      {/* Preorder Line */}
      {hasPreorderLine ? (
        <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-medium text-blue-700 dark:text-blue-300 sm:text-xs">
          {preorderDateLabel ? <span>Ships {preorderDateLabel}</span> : null}
          {preorderDateLabel && preorderReserveLabel ? (
            <span className="text-muted-foreground">/</span>
          ) : null}
          {preorderReserveLabel ? <span>{preorderReserveLabel}</span> : null}
        </div>
      ) : null}
    </>
  );

  const renderElement = (key: ProductCardElement): React.ReactNode => {
    switch (key) {
      case "preview":
        return (
          <div
            key={key}
            className={cn(
              "relative overflow-hidden ring-1 ring-black/5 dark:ring-white/10",
              (isElectronics || cardStyle.previewHeight <= 0) &&
                "aspect-square",
              (isElectronics || !cardStyle.previewBackground) &&
                "bg-[#f3f4f6] dark:bg-zinc-800/50",
            )}
            style={{
              // The Electronics tile is Figma-fixed (7px radius, square,
              // default stage); the classic tile takes whatever the
              // configurator stored.
              borderRadius: isElectronics ? 7 : cardStyle.previewRadius,
              backgroundColor: isElectronics
                ? undefined
                : cardStyle.previewBackground || undefined,
              height:
                !isElectronics && cardStyle.previewHeight > 0
                  ? cardStyle.previewHeight
                  : undefined,
            }}
          >
            {primaryMedia ? (
              <ProductCardMedia
                media={primaryMedia}
                productName={product.name}
                hoverZoom={isElectronics || cardStyle.previewHover === "zoom"}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                {t("common.noImage")}
              </div>
            )}

            {/* "Second image" hover effect: cross-fade to the next gallery shot. */}
            {secondImageUrl ? (
              <AppImage
                src={secondImageUrl}
                alt={product.name}
                fill
                sizes="(max-width: 640px) 46vw, (max-width: 1024px) 32vw, 25vw"
                className="object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              />
            ) : null}

            {/* Top Left Badges */}
            {showBadges && (
              <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
                {/* Paid-placement disclosure (FTC/DSA): always visible, never
                hover-gated, and it outranks the featured pill — a card can't
                be both an ad and an editorial pick. */}
                {product.sponsored && (
                  <span className="inline-flex items-center rounded-full bg-black/70 px-2.5 py-1 text-xs font-medium text-white shadow-sm backdrop-blur-sm">
                    {t.has("common.sponsored")
                      ? t("common.sponsored")
                      : "Sponsored"}
                  </span>
                )}
                {(isElectronics || vis.discountChipOnImage) &&
                  discountPercentage > 0 && (
                    <span className="inline-flex items-center rounded-full bg-white px-2 py-1 text-xs font-semibold text-destructive shadow-sm ring-1 ring-black/5 dark:bg-muted dark:font-bold dark:text-red-400 dark:ring-white/10">
                      -{discountPercentage}%
                    </span>
                  )}
                {preorderAvailable ? (
                  <span className="inline-flex items-center rounded-full bg-blue-600 px-2.5 py-1 text-xs font-medium text-white shadow-sm">
                    {preorderLabel}
                  </span>
                ) : null}
                {/* Always shown on touch — "out of stock" in particular is
                information a shopper needs before tapping, not a hover
                reveal. A discounted card already leads with its -N% mark, so
                the featured pill is reserved for full-price cards; stacking
                both was pure noise. */}
                {((product.featured &&
                  !product.sponsored &&
                  discountPercentage <= 0) ||
                  isUnavailable) && (
                  <div className="flex flex-col items-start gap-1.5 transition-opacity duration-300 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:group-focus-within:opacity-100">
                    {product.featured &&
                      !product.sponsored &&
                      discountPercentage <= 0 && (
                        <span className="inline-flex items-center rounded-full bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground shadow-sm">
                          {t("common.featured")}
                        </span>
                      )}
                    {isUnavailable && (
                      <span className="inline-flex items-center rounded-full bg-black/80 px-2.5 py-1 text-xs font-medium text-white">
                        {t("common.outOfStock")}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Wishlist Button - Top Right */}
            {showWishlist && (
              <button
                onClick={handleWishlistToggle}
                disabled={isTogglingWishlist}
                className={cn(
                  "absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full shadow-sm transition-all duration-300 active:scale-90 sm:right-3 sm:top-3 sm:h-10 sm:w-10",
                  // Revealed on hover only where a pointer can actually hover.
                  // Touch devices never fire `group-hover`, so gating it there left
                  // the control permanently unreachable.
                  "[@media(hover:hover)]:pointer-events-none [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:pointer-events-auto [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:group-focus-within:pointer-events-auto [@media(hover:hover)]:group-focus-within:opacity-100",
                  inWishlist
                    ? "bg-red-50 text-red-500 dark:bg-red-500/20 dark:text-red-300"
                    : "bg-background/80 text-muted-foreground hover:bg-background hover:text-foreground backdrop-blur border border-border/60",
                )}
                aria-label={
                  inWishlist
                    ? t("wishlist.removeFromWishlist")
                    : t("wishlist.addToWishlist")
                }
              >
                {isTogglingWishlist ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin sm:h-5 sm:w-5" />
                ) : (
                  <Heart
                    className={cn(
                      "h-3.5 w-3.5 transition-all sm:h-5 sm:w-5",
                      inWishlist && "fill-red-500 text-red-500",
                    )}
                  />
                )}
              </button>
            )}

            {/* Compare toggle, stacked under the heart. Same reveal rules: a
            hover-only control is unreachable on touch, so it is always
            present where the pointer cannot hover. */}
            {showCompare && (
              <button
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  if (!inCompare && compareIsFull) {
                    toast.error(t("compare.full"));
                    return;
                  }
                  toggleCompare(product.slug);
                }}
                className={cn(
                  "absolute right-2 top-11 flex h-7 w-7 items-center justify-center rounded-full shadow-sm transition-all duration-300 active:scale-90 sm:right-3 sm:top-16 sm:h-10 sm:w-10",
                  "[@media(hover:hover)]:pointer-events-none [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:pointer-events-auto [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:group-focus-within:pointer-events-auto [@media(hover:hover)]:group-focus-within:opacity-100",
                  inCompare
                    ? "bg-foreground text-background"
                    : "border border-border/60 bg-background/80 text-muted-foreground backdrop-blur hover:bg-background hover:text-foreground",
                )}
                aria-pressed={inCompare}
                aria-label={inCompare ? t("compare.remove") : t("compare.add")}
              >
                <Scale className="h-3.5 w-3.5 sm:h-5 sm:w-5" />
              </button>
            )}

            {/* Compact add-to-cart for touch. The labelled row below is hover-only,
            so without this a phone shopper cannot add to cart from a card at
            all. Shown only where the pointer cannot hover. */}
            {overlayCart && !isUnavailable && (
              <button
                onClick={handleAddToCart}
                disabled={isAddingToCart}
                aria-label={
                  needsVariantSelection
                    ? chooseOptionsLabel
                    : preorderPurchaseAvailable
                      ? preorderNowLabel
                      : t("common.addToCart")
                }
                className="absolute bottom-2 right-2 grid h-7 w-7 place-items-center rounded-full bg-foreground text-background shadow-md transition-transform active:scale-90 [@media(hover:hover)]:hidden"
              >
                {isAddingToCart ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : needsVariantSelection ? (
                  <ChevronRight className="h-3.5 w-3.5" />
                ) : (
                  <Plus className="h-3.5 w-3.5" />
                )}
              </button>
            )}

            {/* Hover Actions - Bottom */}
            {(overlayCart || showQuickView) && !isUnavailable && (
              <div
                className={cn(
                  "absolute inset-x-2 bottom-2 hidden gap-1.5 opacity-0 transition-all duration-300 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 sm:inset-x-3 sm:bottom-3 sm:gap-2 [@media(hover:hover)]:grid",
                  overlayCart && showQuickView && onQuickView
                    ? "grid-cols-2"
                    : "grid-cols-1",
                )}
              >
                {overlayCart && (
                  <button
                    onClick={handleAddToCart}
                    disabled={isAddingToCart}
                    className="flex h-9 min-w-0 items-center justify-center gap-1.5 rounded-full bg-foreground px-2 text-[11px] font-semibold leading-none text-background shadow-lg transition-colors hover:bg-foreground/90 sm:h-10 sm:px-3 sm:text-xs"
                  >
                    {isAddingToCart ? (
                      <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin sm:h-4 sm:w-4" />
                    ) : (
                      <ShoppingBag className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                    )}
                    <span className="min-w-0 truncate whitespace-nowrap">
                      {needsVariantSelection
                        ? chooseOptionsLabel
                        : preorderPurchaseAvailable
                          ? preorderNowLabel
                          : t("common.addToCart")}
                    </span>
                  </button>
                )}
                {showQuickView && onQuickView && (
                  <button
                    onClick={handleQuickView}
                    className="flex h-9 min-w-0 items-center justify-center gap-1.5 rounded-full border border-border/60 bg-background/95 px-2 text-[11px] font-semibold leading-none text-foreground shadow-lg transition-colors hover:bg-background sm:h-10 sm:px-3 sm:text-xs"
                  >
                    <Maximize2 className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                    <span className="min-w-0 truncate whitespace-nowrap">
                      {t("product.quickView")}
                    </span>
                  </button>
                )}
              </div>
            )}
          </div>
        );

      case "swatch": {
        if (colorValues.length === 0) return null;
        return (
          <div key={key} className="flex items-center gap-1 px-0.5">
            {colorValues.map((v) => {
              const color = getSwatchColor(v.value, v.colorCode) || "#e5e7eb";
              const isLight =
                color === "#ffffff" ||
                color === "#fffdd0" ||
                color === "#fef3c7";
              return (
                <span
                  key={v._id}
                  className={cn(
                    "h-4 w-4 rounded-full transition-transform hover:scale-110",
                    isLight ? "border border-border" : "border-0",
                  )}
                  style={{ backgroundColor: color }}
                  title={v.value}
                />
              );
            })}
            {vis.variantCount && variantTotal > 1 && (
              <span className="ps-0.5 text-xs font-semibold text-sky-600">
                +{variantTotal}
              </span>
            )}
          </div>
        );
      }

      case "brand":
        if (!brandName) return null;
        return (
          <p
            key={key}
            className="truncate px-0.5 text-xs font-semibold text-foreground"
            style={cardTypographyCss(typography.brand)}
          >
            {brandName}
          </p>
        );

      case "name":
        return (
          <div key={key} className="space-y-1 px-0.5">
            {/* Product Name. Two lines max so long model names keep their
                useful distinguishing text without making the card overly
                tall. */}
            <h3
              className="line-clamp-2 text-[13px] font-semibold leading-tight text-foreground transition-colors group-hover:text-primary group-focus-within:text-primary sm:text-sm"
              style={cardTypographyCss(typography.product)}
            >
              {product.name}
            </h3>
            {selectedColorName && (
              <p className="text-xs leading-snug text-muted-foreground capitalize sm:text-[13px]">
                {selectedColorName}
              </p>
            )}
          </div>
        );

      case "category":
        if (!categoryName) return null;
        return (
          <p
            key={key}
            className="truncate px-0.5 text-xs leading-snug text-muted-foreground"
            style={cardTypographyCss(typography.category)}
          >
            {categoryName}
          </p>
        );

      case "price":
        /* Price & Rating Row. Carries the @container so the docked rating can
           size off the real card width — grids and carousels give the card
           anywhere from ~170px to ~310px, which no viewport breakpoint tracks
           reliably. */
        return (
          <div
            key={key}
            className="@container flex items-center justify-between gap-2 px-0.5 pt-1"
          >
            {/* Price. Plain bold by default — price is primary information,
                and a bordered green pill on every card reads as "on sale",
                which left a genuine markdown with no way to stand out. The
                pill is reserved for exactly that case. */}
            <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
              <span
                className={cn(
                  "whitespace-nowrap text-xs font-bold leading-snug tabular-nums sm:text-sm",
                  hasDiscount
                    ? "inline-flex items-center rounded-[6px] border border-emerald-500 px-1.5 py-0.5 font-semibold text-emerald-600 dark:border-emerald-500 dark:text-emerald-400 sm:border-2 sm:px-2.5"
                    : "text-foreground",
                )}
                style={cardTypographyCss(typography.price)}
              >
                {priceLabel}
              </span>
              {hasDiscount && compareAtLabel && (
                <span
                  className="whitespace-nowrap text-[11px] text-muted-foreground line-through sm:text-sm"
                  style={cardTypographyCss(typography.discounted)}
                >
                  {compareAtLabel}
                </span>
              )}
              {vis.discountChip && discountPercentage > 0 && (
                <span className="whitespace-nowrap rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-600 dark:bg-rose-500/15 dark:text-rose-300">
                  {discountPercentage}% OFF
                </span>
              )}
            </div>
            {vis.ratingMinimized ? minimizedRating(true) : null}
          </div>
        );

      case "rating": {
        if (!ratingOn) return null;
        if (vis.ratingMinimized) {
          // Docked into the price row; standalone only when price is absent.
          return priceOn ? null : <div key={key}>{minimizedRating(false)}</div>;
        }
        const ratio = Math.max(0, Math.min(1, product.rating / 5));
        return (
          <div
            key={key}
            className="flex items-center gap-1.5 px-0.5 text-xs text-muted-foreground"
            title={`${product.rating.toFixed(1)} (${product.reviewCount} ${t("common.reviews").toLowerCase()})`}
          >
            <span className="relative inline-flex" aria-hidden="true">
              <span className="flex">
                {Array.from({ length: 5 }, (_, index) => (
                  <Star
                    key={index}
                    className="h-3.5 w-3.5 fill-muted text-muted-foreground/40"
                  />
                ))}
              </span>
              {/* Fractional fill: a clipped filled copy over the gray row. */}
              <span
                className="absolute inset-y-0 left-0 flex overflow-hidden"
                style={{ width: `${ratio * 100}%` }}
              >
                {Array.from({ length: 5 }, (_, index) => (
                  <Star
                    key={index}
                    className={cn(
                      "h-3.5 w-3.5 shrink-0",
                      cardStyle.ratingColor
                        ? "fill-current"
                        : "fill-amber-400 text-amber-400",
                    )}
                    style={
                      cardStyle.ratingColor
                        ? { color: cardStyle.ratingColor }
                        : undefined
                    }
                  />
                ))}
              </span>
            </span>
            {vis.ratingCount && <span>({product.reviewCount})</span>}
            {vis.itemSold && soldCount > 0 && (
              <span className="border-s border-border ps-2">
                {t.has("product.itemsSold")
                  ? t("product.itemsSold", { count: soldCount })
                  : `${soldCount} sold`}
              </span>
            )}
          </div>
        );
      }

      case "delivery": {
        if (!hasOriginLine && !hasPreorderLine) return null;
        return (
          <div key={key} className="space-y-1 px-0.5">
            {metaNodes}
          </div>
        );
      }

      case "stock":
        if (!isUnavailable) return null;
        return (
          <div
            key={key}
            className={cn(
              "flex items-center justify-center px-3 py-2 text-xs font-semibold",
              !cardStyle.stockBackground &&
                "bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400",
            )}
            style={{
              backgroundColor: cardStyle.stockBackground || undefined,
              borderRadius: cardStyle.stockRadius,
              border:
                cardStyle.stockBorderWidth > 0 && cardStyle.stockBorder
                  ? `${cardStyle.stockBorderWidth}px solid ${cardStyle.stockBorder}`
                  : undefined,
              ...cardTypographyCss(typography.stock),
            }}
          >
            {t("common.outOfStock")}
          </div>
        );

      case "cart":
        // The persistent button row; the hover/touch controls on the preview
        // stage cover the default (cartButtonAlways off) arrangement.
        if (!cartOn || !vis.cartButtonAlways) return null;
        return (
          <button
            key={key}
            onClick={handleAddToCart}
            disabled={isAddingToCart || isUnavailable}
            className={cn(
              "flex h-10 w-full items-center justify-center gap-1.5 text-xs font-semibold transition-colors",
              !cardStyle.cartBackground &&
                "bg-foreground text-background hover:bg-foreground/90",
              cardStyle.cartBackground && "text-white",
              isUnavailable && "cursor-not-allowed opacity-50",
            )}
            style={{
              backgroundColor: cardStyle.cartBackground || undefined,
              borderRadius: cardStyle.cartRadius,
              border:
                cardStyle.cartBorderWidth > 0 && cardStyle.cartBorder
                  ? `${cardStyle.cartBorderWidth}px solid ${cardStyle.cartBorder}`
                  : undefined,
              ...cardTypographyCss(typography.cart),
            }}
          >
            {isAddingToCart ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : null}
            <span className="min-w-0 truncate whitespace-nowrap">
              {needsVariantSelection
                ? chooseOptionsLabel
                : preorderPurchaseAvailable
                  ? preorderNowLabel
                  : t("common.addToCart")}
            </span>
          </button>
        );

      default:
        return null;
    }
  };

  // The Electronics listing arrangement is Figma-fixed: the configurator's
  // groups/visibility/style do not apply here (only the shared preview stage
  // and delivery facts are reused), so a merchant's card tweaks cannot drift
  // the themed listing off its design.
  if (isElectronics) {
    return (
      <Link
        ref={cardRef}
        href={`/${locale}/products/${product.slug}`}
        // Paid placements are marked for crawlers, per Google's guidance on
        // sponsored links.
        rel={product.sponsored ? "sponsored" : undefined}
        className={cn(
          "group block self-start space-y-3 transition-transform active:scale-[0.98] [@media(hover:hover)]:active:scale-100",
          className,
        )}
      >
        {renderElement("preview")}

        <div className="space-y-2 px-0.5">
          {/* Swatch dots lead the copy — the design's reading order — with a
              "+N" note for the colours the four-dot strip cannot fit. */}
          {colorValues.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.25">
                {colorValues.map((v) => {
                  const color =
                    getSwatchColor(v.value, v.colorCode) || "#e5e7eb";
                  const isLight =
                    color === "#ffffff" ||
                    color === "#fffdd0" ||
                    color === "#fef3c7";
                  return (
                    <span
                      key={v._id}
                      className={cn(
                        "size-2.75 rounded-full",
                        isLight && "ring-1 ring-inset ring-border",
                      )}
                      style={{ backgroundColor: color }}
                      title={v.value}
                    />
                  );
                })}
              </div>
              {colorOverflow > 0 && (
                <span className="text-[11px] font-medium leading-none text-[#389fff]">
                  +{colorOverflow}
                </span>
              )}
            </div>
          )}

          <div className="space-y-0.75">
            <h3 className="line-clamp-2 text-[13px] font-semibold leading-tight tracking-[-0.01em] text-foreground transition-colors group-hover:text-primary group-focus-within:text-primary sm:text-sm">
              {product.name}
            </h3>
            {categoryName ? (
              <p className="truncate text-[11px] leading-snug text-muted-foreground">
                {categoryName}
              </p>
            ) : null}
          </div>

          {/* Price runs bold and alone — the design keeps the rating off the
              listing card; a genuine markdown still shows its old price. */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 pt-px">
            <span className="whitespace-nowrap text-[15px] font-bold leading-snug tracking-[-0.01em] tabular-nums text-foreground">
              {priceLabel}
            </span>
            {hasDiscount && compareAtLabel && (
              <span className="whitespace-nowrap text-xs text-muted-foreground line-through">
                {compareAtLabel}
              </span>
            )}
          </div>

          {metaNodes}
        </div>
      </Link>
    );
  }

  return (
    <Link
      ref={cardRef}
      href={`/${locale}/products/${product.slug}`}
      // Paid placements are marked for crawlers, per Google's guidance on
      // sponsored links.
      rel={product.sponsored ? "sponsored" : undefined}
      className={cn(
        "group flex flex-col self-start transition-transform active:scale-[0.98] [@media(hover:hover)]:active:scale-100",
        className,
      )}
      style={{ gap: cardStyle.groupGap, ...cardChromeCss(cardStyle) }}
    >
      {orderedGroups.map((keys, index) => {
        const children = keys
          .map((elementKey) => renderElement(elementKey))
          .filter(Boolean);
        // A group whose elements all declined to render (e.g. only "stock"
        // while in stock) must not leave an empty box adding a double gap.
        if (children.length === 0) return null;
        return (
          <div
            key={index}
            className="flex flex-col"
            style={{ gap: cardStyle.itemGap }}
          >
            {children}
          </div>
        );
      })}
    </Link>
  );
});

// ============================================
// Skeleton Loader
// ============================================

export function ModernProductCardSkeleton({
  className,
}: {
  className?: string;
}) {
  return (
    <div className={cn("self-start space-y-3", className)}>
      <Skeleton className="aspect-square rounded-2xl" />
      <div className="space-y-1.5 px-0.5">
        <div className="flex gap-1">
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 w-4 rounded-full" />
        </div>
        <div className="space-y-1">
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-3/5" />
        </div>
        <Skeleton className="h-3 w-1/3" />
        <div className="flex items-center justify-between pt-1">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
    </div>
  );
}
