"use client";

/**
 * The whole shopping-bag experience — lines, per-seller grouping, summary,
 * estimator, coupon — extracted verbatim from the old /cart page so the
 * cart TEMPLATE's `cart-main` core can render it as a section. All state
 * lives in the client cart store; the section needs no server resource.
 */

import Link from "next/link";
import { useCart } from "@/hooks/use-cart";
import { groupCartItemsBySeller } from "@/lib/cart/cart-sellers";
import type { CartItem } from "@/types";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useMemo, useState } from "react";
import { AppImage } from "@/components/ui/app-image";
import { useParams, useRouter } from "next/navigation";
import { toast } from "@/components/ui/toast-notification";
import { useCurrency } from "@/providers/currency-provider";
import { CouponInput } from "@/components/checkout/coupon-input";
import { FreeShippingProgress } from "@/components/cart/free-shipping-progress";
import { CartShippingEstimator } from "@/components/cart/cart-shipping-estimator";
import { StoreBreadcrumb } from "@/components/store/store-breadcrumb";
import { WishlistButton } from "@/components/products/wishlist-button";
import { ChevronDown, Clock3, Loader2, ShoppingBag } from "lucide-react";
import {
  calculateCheckoutTotals,
  isFreeShippingCouponType,
} from "@/lib/discounts";
import {
  analyticsItemsFromCart,
  trackCartView,
} from "@/lib/analytics/events";

type VariantDetails = {
  color: string | null;
  size: string | null;
};

type CartLineMetadata = {
  availableStock?: number | null;
  categoryId?: string | null;
  comparePrice?: number | null;
  stock?: number | null;
};

type AppliedCoupon = {
  code: string;
  discount: number;
  type: string;
  discountTarget?: "subtotal" | "shipping";
  maxDiscount?: number;
};

type OrderConfig = {
  taxRate: number;
  /**
   * `orders.freeShippingThreshold`, plus the flag that decides whether it means
   * anything. The threshold only reaches the bill on the legacy flat-rate path;
   * see `FreeShippingProgress`.
   */
  freeShippingThreshold: number;
  zoneShippingEnabled: boolean;
};

const CART_SUMMARY_SHIPPING_COST = 0;

function stripZeroDecimals(price: string) {
  return price.replace(/([.,]00)(?!\d)/, "");
}

function formatPreorderDate(value?: unknown) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function getPreorderPaymentLabel(item: {
  preorderDepositAmount?: number;
  preorderOutstandingAmount?: number;
}) {
  const dueNow = Number(item.preorderDepositAmount || 0);
  const dueLater = Number(item.preorderOutstandingAmount || 0);
  if (dueLater <= 0) return "";
  return { dueNow, dueLater };
}

function getQuantityOptions(quantity: number) {
  const maxQuantity = Math.max(10, quantity);

  return Array.from({ length: maxQuantity }, (_, index) => index + 1);
}

function parseVariantDetails(variantName?: string): VariantDetails {
  if (!variantName) {
    return { color: null, size: null };
  }

  const parts = variantName
    .split(/\s*(?:\/|,|\||;)\s*/)
    .map((part) => part.trim())
    .filter(Boolean);

  const details: VariantDetails = { color: null, size: null };

  for (const part of parts) {
    const [rawLabel, ...rawValue] = part.split(":");
    const value = rawValue.join(":").trim();

    if (!value) {
      continue;
    }

    const label = rawLabel.trim().toLowerCase();

    if (label.includes("color") || label.includes("colour")) {
      details.color = value;
    }

    if (label.includes("size")) {
      details.size = value;
    }
  }

  if (!details.color && !details.size) {
    return {
      color: parts[0] || variantName,
      size: parts[1] || null,
    };
  }

  return details;
}

function CartAttribute({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="truncate text-[13px] leading-5 text-muted-foreground sm:text-[14px]">
        {label}
      </p>
      <span className="mt-[7px] flex min-h-8 min-w-0 max-w-full items-center rounded-[8px] border border-input bg-background px-[10px] py-[6px] text-[12px] leading-none text-foreground sm:inline-flex">
        <span className="truncate" title={value}>
          {value}
        </span>
      </span>
    </div>
  );
}

function SummaryRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-6 text-[14px] leading-5">
      <span className="text-foreground">{label}</span>
      <span className="text-right text-muted-foreground">{children}</span>
    </div>
  );
}

export function CartPageContent() {
  const t = useTranslations();
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;

  const {
    items,
    isLoading,
    subtotal,
    sellerCount,
    anySellerOffersPickup,
    hasShippableItems,
    updateItem,
    removeItem,
  } = useCart();
  const { currency, formatPrice } = useCurrency();

  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());

  // Named only when it matters. On a single-seller cart a "Sold by" header on
  // every line is noise; on a mixed one it is the reason the order behaves the
  // way it does further down the funnel.
  //
  // Two different numbers live here on purpose, and it matters which is used
  // where. `sellerCount` counts PHYSICAL lines only, because that is the rule
  // `resolvePickupEligibility` uses to refuse collection — so it, and only it,
  // decides whether the explanation appears. `sellerGroups.length` counts every
  // seller with a line in the bag, including one selling only a download, so it
  // is what the shopper can actually count on screen — and therefore the number
  // the sentence has to say. Using `sellerCount` in the copy printed "items
  // from 2 sellers" directly above three group headers.
  const unknownSellerLabel = t.has("cart.unknownSeller")
    ? t("cart.unknownSeller")
    : "Another seller";
  const sellerGroups = useMemo(
    () => groupCartItemsBySeller(items, unknownSellerLabel),
    [items, unknownSellerLabel],
  );
  const soldByLabel = (name: string) =>
    t.has("cart.soldBy") ? t("cart.soldBy", { seller: name }) : `Sold by ${name}`;

  const [orderConfig, setOrderConfig] = useState<OrderConfig>({
    taxRate: 0,
    freeShippingThreshold: 0,
    zoneShippingEnabled: false,
  });
  const [isCouponOpen, setIsCouponOpen] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(
    null,
  );
  const [taxRequested, setTaxRequested] = useState(false);
  // Shipping estimate from the summary's estimator, once the shopper asks for
  // one. Null until then — the total keeps the "calculated at checkout"
  // convention rather than assuming zero is a price.
  const [estimatedShipping, setEstimatedShipping] = useState<number | null>(
    null,
  );
  const cartViewSignature = useMemo(
    () =>
      items
        .map(
          (item) =>
            `${String(item.productId)}:${String(item.variantId || "")}:${
              item.quantity
            }`,
        )
        .join("|"),
    [items],
  );

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const res = await fetch("/api/settings/public");
        const json = await res.json().catch(() => null);
        if (!active) return;

        if (res.ok && json?.success) {
          setOrderConfig({
            taxRate: Number(json.data?.orders?.taxRate || 0),
            freeShippingThreshold: Number(
              json.data?.orders?.freeShippingThreshold || 0,
            ),
            zoneShippingEnabled: Boolean(json.data?.shipping?.enabled),
          });
        }
      } catch {
        if (active) {
          // Falling back to a zero threshold hides the free-shipping nudge
          // rather than showing one built from a subtotal we cannot price.
          setOrderConfig({
            taxRate: 0,
            freeShippingThreshold: 0,
            zoneShippingEnabled: false,
          });
        }
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const formatCartPrice = (amount: number) =>
    stripZeroDecimals(formatPrice(amount));

  const handleUpdateQuantity = async (
    productId: string,
    quantity: number,
    variantId?: string,
  ) => {
    const key = variantId ? `${productId}-${variantId}` : productId;
    setUpdatingItems((prev) => new Set(prev).add(key));

    try {
      await updateItem(productId, quantity, variantId);
    } catch {
      toast.error(t("common.error"));
    } finally {
      setUpdatingItems((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  };

  const handleRemoveItem = async (productId: string, variantId?: string) => {
    try {
      await removeItem(productId, variantId);
      toast.success(t("cart.itemRemoved"));
    } catch {
      toast.error(t("common.error"));
    }
  };

  const handleCheckout = () => {
    const couponQuery = appliedCoupon?.code
      ? `?coupon=${encodeURIComponent(appliedCoupon.code)}`
      : "";
    router.push(`/${locale}/checkout${couponQuery}`);
  };

  const saleSavings = items.reduce((sum, item) => {
    const comparePrice = (item as CartLineMetadata).comparePrice;

    if (!comparePrice || comparePrice <= item.price) {
      return sum;
    }

    return sum + (comparePrice - item.price) * item.quantity;
  }, 0);
  const couponCartItems = useMemo(
    () =>
      items.map((item) => {
        const metadata = item as CartLineMetadata;

        return {
          productId: String(item.productId),
          price: item.price,
          quantity: item.quantity,
          categoryId: metadata.categoryId
            ? String(metadata.categoryId)
            : undefined,
        };
      }),
    [items],
  );
  // Both numbers have to agree before the notice appears, and they come from
  // different places: `sellerCount` is the server's last answer, `sellerGroups`
  // is derived from the lines on screen right now. `updateItem` drops a line
  // optimistically and only then refreshes, so dropping a seller's last unit
  // leaves a window where the server still says 2 while one group remains —
  // which rendered "items from 1 sellers". Requiring both keeps the notice off
  // until the two views of the bag agree.
  //
  // `anySellerOffersPickup` is the last gate, and the one that keeps the
  // sentence honest: `resolvePickupEligibility` short-circuits on
  // `multi_vendor` before it looks at a single branch, so "more than one
  // seller" says nothing about whether either of them runs a counter. Without
  // this the cart would blame the mix for collection that was never on offer.
  const showMixedCartNotice =
    sellerCount > 1 && sellerGroups.length > 1 && anySellerOffersPickup;

  const taxRate = Math.max(0, Number(orderConfig.taxRate || 0));
  const isTaxConfigured = taxRate > 0;
  // Once the shopper has estimated shipping, the total includes it — a row
  // showing 70 above a total that ignores it would contradict itself.
  const summaryShippingCost = estimatedShipping ?? CART_SUMMARY_SHIPPING_COST;
  const totals = calculateCheckoutTotals({
    subtotal,
    shippingCost: summaryShippingCost,
    taxRate: taxRequested && isTaxConfigured ? taxRate : 0,
    coupon: appliedCoupon,
  });
  const discount = totals.subtotalDiscount;
  const shippingDiscount = totals.shippingDiscount;
  const tax = totals.tax;
  const total = totals.total;
  const calculateTaxLabel = t.has("checkout.calculate")
    ? t("checkout.calculate")
    : "Calculate";
  const taxNotApplicableLabel = t.has("cart.taxNotApplicable")
    ? t("cart.taxNotApplicable")
    : "Tax is not applicable";
  const appliedCouponForDisplay = appliedCoupon
    ? {
        ...appliedCoupon,
        discount: isFreeShippingCouponType(appliedCoupon.type)
          ? shippingDiscount
          : discount,
      }
    : null;

  useEffect(() => {
    if (!items.length || !cartViewSignature) return;

    trackCartView({
      currency: currency.code,
      value: subtotal,
      items: analyticsItemsFromCart(items),
    });
  }, [cartViewSignature, currency.code, items, subtotal]);

  if (isLoading) {
    return <CartSkeleton />;
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-md text-center">
          <ShoppingBag className="mx-auto mb-6 h-24 w-24 text-muted-foreground/30" />
          <h1 className="mb-2 text-2xl font-bold">{t("cart.emptyCart")}</h1>
          <p className="mb-6 text-muted-foreground">
            {t("cart.emptyCartDescription")}
          </p>
          <Button asChild>
            <Link href={`/${locale}/products`}>{t("common.shopNow")}</Link>
          </Button>
        </div>
      </div>
    );
  }

  /**
   * One cart line. Extracted so the list can be rendered either flat or
   * under per-seller headers without the markup existing twice.
   */
  const renderCartLine = (item: CartItem) => {
    // A product name sits one level below whatever introduces it: directly
    // under the page's <h1> on a single-seller bag, under the seller's <h2>
    // once the list is grouped. Hard-coding <h2> put the group and the things
    // it groups at the same level.
    const NameHeading = sellerGroups.length > 1 ? "h3" : "h2";
    const productId = String(item.productId);
    const variantId = item.variantId?.toString();
    const itemKey = variantId ? `${productId}-${variantId}` : productId;
    const isUpdating = updatingItems.has(itemKey);
    const details = parseVariantDetails(item.variantName);
    const metadata = item as CartLineMetadata;
    const comparePrice = metadata.comparePrice;
    const hasComparePrice =
      typeof comparePrice === "number" && comparePrice > item.price;
    const stock =
      typeof metadata.stock === "number"
        ? metadata.stock
        : metadata.availableStock;
    const isLowStock = typeof stock === "number" && stock > 0 && stock <= 5;
    const preorderPayment = getPreorderPaymentLabel(item);

    return (
      <article
        key={itemKey}
        // Phones keep the thumbnail beside the title/price and drop the
        // attribute row to full width underneath; from `sm` the thumbnail
        // spans both rows as the original two-column layout.
        className="grid grid-cols-[96px_minmax(0,1fr)] gap-x-4 gap-y-4 py-6 first:pt-0 sm:grid-cols-[128px_minmax(0,1fr)] sm:gap-x-5 sm:gap-y-0"
      >
        <div className="relative h-32 w-24 overflow-hidden rounded-[10px] bg-muted sm:row-span-2 sm:h-40 sm:w-32">
          {item.image ? (
            <AppImage
              src={item.image}
              alt={item.name}
              fill
              className="object-cover"
              sizes="(min-width: 640px) 128px, 96px"
            />
          ) : (
            <div className="flex h-full items-center justify-center px-3 text-center text-xs text-muted-foreground">
              No Image
            </div>
          )}
          <WishlistButton
            productId={productId}
            size="sm"
            className="absolute right-2 top-2 h-7 w-7 border-white/80 bg-background text-foreground shadow-none hover:bg-accent"
          />
        </div>

        <div className="min-w-0 pt-1">
          <div>
            <NameHeading
              className="line-clamp-2 text-[15px] font-normal leading-5 text-foreground sm:text-[16px]"
              title={item.name}
            >
              {item.name}
            </NameHeading>
            {item.purchaseType === "preorder" && (
              <div className="mt-2 space-y-1 text-[13px] font-semibold leading-5 text-blue-600 dark:text-blue-300">
                <p>
                  {formatPreorderDate(item.preorderReleaseDate)
                    ? `Pre-order - ships around ${formatPreorderDate(
                        item.preorderReleaseDate,
                      )}`
                    : "Pre-order"}
                </p>
                {preorderPayment ? (
                  <p className="font-medium text-muted-foreground">
                    Due now {formatCartPrice(preorderPayment.dueNow)} / later{" "}
                    {formatCartPrice(preorderPayment.dueLater)}
                  </p>
                ) : null}
              </div>
            )}
            <div className="mt-[9px] flex items-center gap-1.5 text-[14px] font-semibold leading-5">
              {hasComparePrice && (
                <span className="text-muted-foreground line-through">
                  {formatCartPrice(comparePrice)}
                </span>
              )}
              <span
                className={
                  hasComparePrice ? "text-destructive" : "text-foreground"
                }
              >
                {formatCartPrice(item.price)}
              </span>
            </div>
            {isLowStock && (
              <p className="mt-1 flex items-center gap-1 text-[14px] leading-5 text-[#ff5c00]">
                <Clock3 className="h-3.5 w-3.5" />
                Low in stock
              </p>
            )}
          </div>
        </div>

        <div className="col-span-2 min-w-0 sm:col-span-1 sm:mt-[14px]">
          <div className="grid grid-cols-3 gap-3 sm:gap-[42px]">
            {details.color && (
              <CartAttribute
                label={t("products.color")}
                value={details.color}
              />
            )}
            {details.size && (
              <CartAttribute label={t("products.size")} value={details.size} />
            )}
            <div className="min-w-0">
              <p className="truncate text-[13px] leading-5 text-muted-foreground sm:text-[14px]">
                {t("common.quantity")}
              </p>
              <div className="relative mt-[7px] inline-flex">
                <select
                  aria-label={t("common.quantity")}
                  value={String(item.quantity)}
                  disabled={isUpdating}
                  onChange={(event) =>
                    handleUpdateQuantity(
                      productId,
                      Number(event.target.value),
                      variantId,
                    )
                  }
                  className="h-8 w-[56px] appearance-none rounded-[8px] border border-input bg-background py-0 pl-[10px] pr-7 text-[12px] leading-none text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {getQuantityOptions(item.quantity).map((quantity) => (
                    <option key={quantity} value={quantity}>
                      {quantity}
                    </option>
                  ))}
                </select>
                {isUpdating ? (
                  <Loader2 className="pointer-events-none absolute right-[9px] top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-muted-foreground" />
                ) : (
                  <ChevronDown className="pointer-events-none absolute right-[9px] top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleRemoveItem(productId, variantId)}
            className="mt-4 text-[14px] leading-5 text-foreground underline underline-offset-2 transition-colors hover:text-destructive sm:mt-[17px]"
          >
            {t("common.remove")}
          </button>
        </div>
      </article>
    );
  };

  return (
    <div className="mx-auto max-w-[1298px] px-4 pb-16 pt-6 sm:px-6 sm:pt-10 lg:px-8 lg:pt-[42px] xl:px-0">
      {/* No structured data: the bag is never indexed, and a BreadcrumbList
          pointing at it would only confuse the crawler. */}
      <StoreBreadcrumb
        className="mb-4 sm:mb-6"
        locale={locale}
        jsonLd={false}
        items={[{ label: t("common.cart") }]}
      />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,837px)_minmax(320px,378px)] lg:justify-between lg:gap-12">
        <section aria-labelledby="shopping-bag-heading" className="min-w-0">
          <h1
            id="shopping-bag-heading"
            className="mb-4 text-[20px] font-semibold leading-6 text-foreground sm:mb-[26px]"
          >
            Shopping bag
          </h1>

          {/* Stated where the shopper can still act on it — moving an item to
              a wishlist here is cheap, discovering the same fact after filling
              in an address is not. Only when collection was genuinely on the
              table: with COD off the store has no pickup option at all, so
              nothing was lost by the mix. */}
          {showMixedCartNotice ? (
            <p className="mb-6 rounded-lg border bg-muted/40 p-3 text-[13px] leading-5 text-muted-foreground">
              {t.has("cart.mixedCartDeliveryOnly")
                ? t("cart.mixedCartDeliveryOnly", { count: sellerGroups.length })
                : `Your bag has items from ${sellerGroups.length} sellers, so this order will be delivered. In-store collection is only offered when everything comes from one seller.`}
            </p>
          ) : null}

          <div className="divide-y divide-[var(--border)]">
            {sellerGroups.length > 1
              ? sellerGroups.map((group) => (
                  <section key={group.vendorId ?? "unknown-seller"} className="py-6 first:pt-0">
                    <h2 className="mb-4 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {soldByLabel(group.vendorName)}
                    </h2>
                    <div className="divide-y divide-[var(--border)]">
                      {group.items.map(renderCartLine)}
                    </div>
                  </section>
                ))
              : items.map(renderCartLine)}
          </div>
        </section>

        <aside
          aria-labelledby="order-summary-heading"
          // Stacked under the bag on phones, so it needs its own rule to read
          // as a separate block rather than a continuation of the last line.
          className="border-t border-border pt-6 lg:sticky lg:top-24 lg:border-0 lg:pt-0"
        >
          <h2
            id="order-summary-heading"
            className="text-[16px] font-semibold leading-6 text-foreground"
          >
            {t("checkout.orderSummary")}
          </h2>

          <div className="mt-[22px] space-y-[12px]">
            <SummaryRow label={t("common.subtotal")}>
              <span className="font-semibold text-foreground">
                {formatCartPrice(subtotal)}
              </span>
            </SummaryRow>
            <CartShippingEstimator
              hasShippableItems={hasShippableItems}
              cartSignature={cartViewSignature}
              formatPrice={formatCartPrice}
              onEstimate={setEstimatedShipping}
              renderRow={(value) => (
                <SummaryRow label={t("common.shipping")}>{value}</SummaryRow>
              )}
            />
            <FreeShippingProgress
              subtotal={subtotal}
              threshold={orderConfig.freeShippingThreshold}
              zoneShippingEnabled={orderConfig.zoneShippingEnabled}
              hasShippableItems={hasShippableItems}
              formatPrice={formatCartPrice}
              className="pt-1"
            />
            <SummaryRow label={t("checkout.estimatedTax")}>
              {taxRequested ? (
                isTaxConfigured ? (
                  <span>{formatCartPrice(tax)}</span>
                ) : (
                  <span>{taxNotApplicableLabel}</span>
                )
              ) : (
                <button
                  type="button"
                  onClick={() => setTaxRequested(true)}
                  className="text-muted-foreground underline underline-offset-2 transition-colors hover:text-foreground"
                >
                  {calculateTaxLabel}
                </button>
              )}
            </SummaryRow>
            <SummaryRow label={t("checkout.promoCode")}>
              {appliedCoupon ? (
                <span className="font-medium uppercase text-foreground">
                  {appliedCoupon.code}
                </span>
              ) : isCouponOpen ? (
                <span />
              ) : (
                <button
                  type="button"
                  onClick={() => setIsCouponOpen(true)}
                  className="text-muted-foreground underline underline-offset-2 transition-colors hover:text-foreground"
                >
                  {t("checkout.enterCode")}
                </button>
              )}
            </SummaryRow>
            {isCouponOpen || appliedCoupon ? (
              <CouponInput
                cartItems={couponCartItems}
                subtotal={subtotal}
                shippingCost={summaryShippingCost}
                appliedCoupon={appliedCouponForDisplay}
                onApply={(coupon) => {
                  setAppliedCoupon(coupon);
                  setIsCouponOpen(true);
                }}
                onRemove={() => {
                  setAppliedCoupon(null);
                  setIsCouponOpen(false);
                }}
              />
            ) : null}
            {discount > 0 ? (
              <SummaryRow
                label={`${t("common.discount")}${
                  appliedCoupon ? ` (${appliedCoupon.code})` : ""
                }`}
              >
                <span className="text-green-700 dark:text-green-400">
                  -{formatCartPrice(discount)}
                </span>
              </SummaryRow>
            ) : null}
            <SummaryRow label={t("common.sale")}>
              {saleSavings > 0 ? (
                <span>-{formatCartPrice(saleSavings)}</span>
              ) : (
                <span>&mdash;</span>
              )}
            </SummaryRow>
          </div>

          <div className="mt-[16px] flex items-baseline justify-between gap-6">
            <span className="text-[14px] font-semibold leading-5 text-foreground">
              {t("common.total")}
            </span>
            <div className="text-right">
              <span className="mr-2 text-[11px] font-medium uppercase leading-none text-muted-foreground">
                {currency.code}
              </span>
              <span className="text-[18px] font-semibold leading-none text-foreground">
                {formatCartPrice(total)}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCheckout}
            className="mt-[22px] h-[46px] w-full rounded-[7px] bg-primary px-4 text-[14px] font-semibold leading-none text-primary-foreground transition-colors hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            {t("checkout.checkout")}
          </button>

          <Link
            href={`/${locale}/products`}
            className="mt-3 flex h-[46px] w-full items-center justify-center rounded-[7px] border border-input bg-background px-4 text-center text-[14px] font-semibold leading-none text-foreground shadow-[0_1px_2px_rgba(16,24,40,0.05)] transition-colors hover:bg-accent focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            {t("cart.continueShopping")}
          </Link>
        </aside>
      </div>
    </div>
  );
}

function CartSkeleton() {
  return (
    <div className="mx-auto max-w-[1298px] px-4 pb-16 pt-6 sm:px-6 sm:pt-10 lg:px-8 lg:pt-[42px] xl:px-0">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,837px)_minmax(320px,378px)] lg:justify-between lg:gap-12">
        <section>
          <Skeleton className="mb-4 h-6 w-32 sm:mb-[26px]" />
          <div className="divide-y divide-[var(--border)]">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="grid grid-cols-[96px_minmax(0,1fr)] gap-x-4 gap-y-4 py-6 first:pt-0 sm:grid-cols-[128px_minmax(0,1fr)] sm:gap-x-5 sm:gap-y-0"
              >
                <Skeleton className="h-32 w-24 rounded-[10px] sm:row-span-2 sm:h-40 sm:w-32" />
                <div className="min-w-0 pt-1">
                  <Skeleton className="h-5 w-full max-w-48" />
                  <Skeleton className="mt-[9px] h-5 w-16" />
                </div>
                <div className="col-span-2 min-w-0 sm:col-span-1 sm:mt-[14px]">
                  <div className="grid grid-cols-3 gap-3 sm:gap-[42px]">
                    <div>
                      <Skeleton className="h-5 w-12" />
                      <Skeleton className="mt-[7px] h-8 w-14 rounded-[8px]" />
                    </div>
                    <div>
                      <Skeleton className="h-5 w-10" />
                      <Skeleton className="mt-[7px] h-8 w-14 rounded-[8px]" />
                    </div>
                    <div>
                      <Skeleton className="h-5 w-20" />
                      <Skeleton className="mt-[7px] h-8 w-14 rounded-[8px]" />
                    </div>
                  </div>
                  <Skeleton className="mt-4 h-5 w-16 sm:mt-[17px]" />
                </div>
              </div>
            ))}
          </div>
        </section>

        <aside className="border-t border-border pt-6 lg:border-0 lg:pt-0">
          <Skeleton className="h-6 w-32" />
          <div className="mt-[22px] space-y-[12px]">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
          </div>
          <Skeleton className="mt-[16px] h-6 w-full" />
          <Skeleton className="mt-[22px] h-[46px] w-full rounded-[7px]" />
          <Skeleton className="mt-3 h-[46px] w-full rounded-[7px]" />
        </aside>
      </div>
    </div>
  );
}
