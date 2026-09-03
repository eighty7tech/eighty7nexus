"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Check, ChevronLeft, ChevronRight, ShoppingCart, Star } from "lucide-react";
import { AppImage } from "@/components/ui/app-image";
import { toast } from "@/components/ui/toast-notification";
import { type Locale } from "@/config/i18n.config";
import { useCart } from "@/hooks/use-cart";
import { useCurrency } from "@/providers/currency-provider";
import { trackAddToCart } from "@/lib/analytics/events";
import { findColorOption, getSwatchColor } from "@/lib/products/color-swatch";
import {
  formatProductCompareAtPrice,
  formatProductPrice,
  getProductPriceRange,
  productRequiresVariantSelection,
} from "@/lib/products/price-display";
import type { StorefrontProductCard } from "@/lib/products/storefront-product-cards";
import { cn } from "@/lib/utils";

/**
 * The product plane of the Electronics DEALS panel — the design's
 * 2 + featured + 2 arrangement. The cards are fixed WHITE like the panel's
 * countdown cards: the host paints its own dark ground in both themes, so
 * every colour in here is chosen against white, not against tokens — except
 * the sale price, which is the merchant's `--primary` on purpose.
 */
export function ElectronicsDealsProducts({
  products,
  locale,
}: {
  products: StorefrontProductCard[];
  locale: Locale;
}) {
  const featured = products[0];
  const left = products.slice(1, 3);
  const right = products.slice(3, 5);
  if (!featured) return null;

  // A merchant who picked fewer deals than the design has slots gets a
  // narrower row, not empty columns holding their width open. The left
  // column fills first, so there are only three shapes to describe.
  const columnsClass =
    right.length > 0
      ? "lg:grid-cols-[minmax(0,1fr)_minmax(0,1.52fr)_minmax(0,1fr)]"
      : left.length > 0
        ? "lg:grid-cols-[minmax(0,1fr)_minmax(0,1.52fr)]"
        : "lg:grid-cols-1";

  return (
    <div className={cn("grid gap-3 lg:items-center", columnsClass)}>
      {left.length > 0 ? (
        <div className="order-2 grid gap-3 sm:grid-cols-2 lg:order-1 lg:grid-cols-1 lg:gap-[17px]">
          {left.map((product) => (
            <SmallDealCard key={product._id} product={product} locale={locale} />
          ))}
        </div>
      ) : null}
      <div className="order-1 lg:order-2">
        <FeaturedDealCard product={featured} locale={locale} />
      </div>
      {right.length > 0 ? (
        <div className="order-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 lg:gap-[17px]">
          {right.map((product) => (
            <SmallDealCard key={product._id} product={product} locale={locale} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function productImage(product: StorefrontProductCard): string | undefined {
  if (product.images?.[0]) return product.images[0];
  // Video-only products: fall back to the first media entry's poster.
  const media = (product as { media?: { url?: string; thumbnailUrl?: string; type?: string }[] }).media?.[0];
  return media?.type === "image" ? media.url : media?.thumbnailUrl;
}

function SmallDealCard({
  product,
  locale,
}: {
  product: StorefrontProductCard;
  locale: Locale;
}) {
  const t = useTranslations();
  const { formatPrice } = useCurrency();
  const href = `/${locale}/products/${product.slug}`;
  const image = productImage(product);

  return (
    <div className="flex h-40 items-center gap-[7.5px] rounded-[9.264px] bg-white ps-[3.5px] pt-[3.5px] pb-[5.8px]">
      <Link
        href={href}
        className="relative h-[130.6px] w-[45.7%] shrink-0 overflow-hidden rounded-[10px] bg-white"
      >
        {image ? (
          <AppImage
            src={image}
            alt={product.name}
            fill
            sizes="160px"
            className="object-contain p-1"
          />
        ) : null}
      </Link>
      <div className="flex min-w-0 flex-1 flex-col gap-[8.7px] px-[4.5px] pt-[5.8px] pe-3">
        <Link
          href={href}
          className="block truncate text-[16.3px] font-semibold leading-[1.25] tracking-[-0.05em] text-black"
        >
          {product.name}
        </Link>
        <p className="flex items-baseline gap-1.5 whitespace-nowrap">
          <span className="text-[21.8px] font-bold leading-[1.25] tracking-[-0.01em] text-primary">
            {formatProductPrice(product, formatPrice)}
          </span>
          {formatProductCompareAtPrice(product, formatPrice) ? (
            <span className="text-[10.4px] leading-[1.25] tracking-[-0.01em] text-[#282828]/30 line-through">
              {formatProductCompareAtPrice(product, formatPrice)}
            </span>
          ) : null}
        </p>
        <Link
          href={href}
          className="flex h-[30px] w-full max-w-[140px] items-center justify-center rounded-[3px] border-[0.713px] border-[#e0e0e0] text-[10px] font-bold text-[#636363] transition-colors hover:border-primary/50 hover:text-zinc-900"
        >
          {t("common.view")}
        </Link>
      </div>
    </div>
  );
}

function FeaturedDealCard({
  product,
  locale,
}: {
  product: StorefrontProductCard;
  locale: Locale;
}) {
  const t = useTranslations();
  const router = useRouter();
  const { currency, formatPrice } = useCurrency();
  const { addItem } = useCart();
  const [activeImage, setActiveImage] = useState(0);
  const [activeColor, setActiveColor] = useState(0);
  const [adding, setAdding] = useState(false);

  const href = `/${locale}/products/${product.slug}`;
  const images = (product.images ?? []).slice(0, 4);
  const image = images[activeImage] ?? productImage(product);
  const rating = Math.round(product.rating ?? 0);
  const colorOption = findColorOption(product.options);
  const colors = (colorOption?.values ?? []).slice(0, 4);
  const priceRange = getProductPriceRange(product);
  const onlyVariant =
    Array.isArray(product.variants) && product.variants.length === 1
      ? product.variants[0]
      : null;

  const step = useCallback(
    (delta: number) => {
      if (images.length < 2) return;
      setActiveImage(
        (index) => (index + delta + images.length) % images.length,
      );
    },
    [images.length],
  );

  const handleAddToCart = useCallback(async () => {
    if (adding) return;
    // Same rule as the product card: a product whose price depends on a
    // choice cannot be added blind — hand over to the product page.
    if (productRequiresVariantSelection(product)) {
      router.push(href);
      return;
    }
    setAdding(true);
    try {
      await addItem({
        productId: product._id,
        variantId: onlyVariant?._id,
        name: onlyVariant
          ? `${product.name} - ${onlyVariant.name}`
          : product.name,
        price: onlyVariant?.price ?? priceRange.min,
        image: productImage(product),
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
    } catch {
      toast.error(t("common.error"));
    } finally {
      setAdding(false);
    }
  }, [
    adding,
    addItem,
    currency.code,
    href,
    onlyVariant,
    priceRange.min,
    product,
    router,
    t,
  ]);

  return (
    <div className="rounded-[10.7px] border-[0.5px] border-[#d9d9d9] bg-white p-4 shadow-[0px_41.78px_13.88px_rgba(0,0,0,0.06)] sm:px-6 sm:pb-4 sm:pt-[22px]">
      <div className="grid gap-5 sm:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] sm:items-start sm:gap-[25.6px]">
        <div className="space-y-2.5">
          <div className="relative flex h-56 items-center justify-center overflow-hidden rounded-[6.4px] bg-[#f5f5f5] sm:h-[236px]">
            {image ? (
              <AppImage
                src={image}
                alt={product.name}
                fill
                sizes="(min-width: 640px) 280px, 100vw"
                className="object-contain p-4"
              />
            ) : null}
            {images.length > 1 ? (
              <>
                <button
                  type="button"
                  onClick={() => step(-1)}
                  aria-label={t("common.previous")}
                  className="absolute start-[6.4px] top-1/2 grid size-4 -translate-y-1/2 place-items-center rounded-full bg-white/80 text-zinc-700 shadow-sm transition-colors before:absolute before:-inset-2 before:content-[''] hover:bg-white"
                >
                  <ChevronLeft className="size-2 rtl:rotate-180" />
                </button>
                <button
                  type="button"
                  onClick={() => step(1)}
                  aria-label={t("common.next")}
                  className="absolute end-[6.4px] top-1/2 grid size-4 -translate-y-1/2 place-items-center rounded-full bg-white/80 text-zinc-700 shadow-sm transition-colors before:absolute before:-inset-2 before:content-[''] hover:bg-white"
                >
                  <ChevronRight className="size-2 rtl:rotate-180" />
                </button>
              </>
            ) : null}
          </div>
          {images.length > 1 ? (
            <div className="flex justify-center gap-1.5">
              {images.map((thumb, index) => (
                <button
                  key={thumb}
                  type="button"
                  onClick={() => setActiveImage(index)}
                  aria-label={`${product.name} ${index + 1}`}
                  className={cn(
                    "relative size-[54px] overflow-hidden rounded-[7.36px] border",
                    index === activeImage
                      ? "border-[1.226px] border-[#e3e3e3] bg-[#f5f5f5]"
                      : "border-[0.5px] border-[#ebebeb] bg-white",
                  )}
                >
                  <AppImage
                    src={thumb}
                    alt=""
                    fill
                    sizes="54px"
                    className="object-contain p-1"
                  />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex h-full flex-col gap-4 sm:gap-[16.5px] sm:pt-[49px]">
          <div className="space-y-[4.8px]">
            <Link
              href={href}
              className="block text-[20.4px] font-semibold leading-tight tracking-[-0.02em] text-[#111827]"
            >
              {product.name}
            </Link>
            <span className="flex items-center gap-[7.3px]">
              <span className="flex gap-[1.2px]" aria-hidden>
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star
                    key={index}
                    className={cn(
                      "size-[9.8px]",
                      index < rating
                        ? "fill-amber-400 text-amber-400"
                        : "fill-zinc-200 text-zinc-200",
                    )}
                  />
                ))}
              </span>
              <span className="text-[8.6px] font-medium text-[#9e9e9e]">
                ({product.reviewCount ?? 0} {t("product.reviews")})
              </span>
            </span>
          </div>

          <p className="flex items-baseline gap-1.5 whitespace-nowrap">
            <span className="text-[25.2px] font-bold leading-[1.25] tracking-[-0.01em] text-primary">
              {formatProductPrice(product, formatPrice)}
            </span>
            {formatProductCompareAtPrice(product, formatPrice) ? (
              <span className="text-[13.6px] leading-[1.25] tracking-[-0.01em] text-[#282828]/30 line-through">
                {formatProductCompareAtPrice(product, formatPrice)}
              </span>
            ) : null}
          </p>

          {colors.length > 0 ? (
            <div className="space-y-[8.1px]">
              <p className="text-[9.4px] leading-normal">
                <span className="font-bold text-[#111827]">
                  {t("product.color")}:
                </span>{" "}
                <span className="font-medium text-[#4b5563]">
                  {colors[activeColor]?.value}
                </span>
              </p>
              <div className="flex gap-[8.1px]">
                {colors.map((value, index) => {
                  const swatch =
                    getSwatchColor(value.value, value.colorCode) || "#e5e7eb";
                  const selected = index === activeColor;
                  return (
                    <button
                      key={value._id ?? value.value}
                      type="button"
                      onClick={() => setActiveColor(index)}
                      aria-label={value.value}
                      aria-pressed={selected}
                      className={cn(
                        "grid size-[24.3px] place-items-center rounded-full border",
                        selected
                          ? "border-[1.349px] border-[#111827]"
                          : "border-[0.675px] border-[#e5e7eb]",
                      )}
                    >
                      <span
                        className="grid size-[18.9px] place-items-center rounded-full"
                        style={{ backgroundColor: swatch }}
                      >
                        {selected ? (
                          // Difference blend keeps the tick visible on any
                          // swatch colour — dark on light, light on dark.
                          <Check className="size-[9.4px] text-white mix-blend-difference" />
                        ) : null}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={adding}
            className="mt-auto flex h-[39.8px] w-full items-center justify-center gap-[4.65px] rounded-[4.65px] bg-[#303030] text-[8.7px] font-bold text-white transition-colors hover:bg-black disabled:opacity-60"
          >
            <ShoppingCart className="size-[10.5px]" />
            {t("common.addToCart")}
          </button>
        </div>
      </div>
    </div>
  );
}
