import { after, NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Cart, Product, Order, Vendor } from "@/models";
import {
  getStripeForSecretKey,
  isStripeSecretKeyConfigured,
  toStripeAmount,
} from "@/lib/stripe";
import { getSettings } from "@/models/settings.model";
import {
  resolveIotecCredentials,
  resolvePayPalCredentials,
  resolvePesapalCredentials,
  resolveStripeCredentials,
} from "@/lib/credentials";
import { createPayPalOrder } from "@/lib/paypal";
import {
  createRazorpayOrder,
  getRazorpayCredentials,
} from "@/lib/razorpay";
import {
  getPaystackCredentials,
  initializePaystackTransaction,
} from "@/lib/paystack";
import {
  getPesapalCredentials,
  isPesapalCurrency,
  normalizePesapalCountryCode,
  PESAPAL_CURRENCIES,
  submitPesapalOrder,
} from "@/lib/pesapal";
import {
  getIotecCredentials,
  IOTEC_CURRENCY,
  IOTEC_MIN_AMOUNT,
  normalizeUgandaMsisdn,
  submitIotecCardCollection,
  submitIotecCollection,
  type IotecCollectionResponse,
} from "@/lib/iotec";
import { sendOrderConfirmationEmail } from "@/lib/order-emails";
import {
  decrementInventory,
  InsufficientStockError,
  restoreInventory,
} from "@/lib/inventory";
import { markOrderInventoryReserved } from "@/lib/order-inventory";
import {
  getOrderPreorderLines,
  getPreorderReleaseDateForOrder,
  markOrderPreorderReserved,
  PREORDER_ITEM_STATUS,
  PURCHASE_TYPE,
  releasePreorderQuantity,
  reservePreorderQuantity,
  resolvePurchaseType,
  type PreorderSettingsShape,
} from "@/lib/preorders";
import { getNextOnlineOrderNumber } from "@/lib/order-number";
import {
  DEFAULT_FREE_SHIPPING_THRESHOLD,
  DEFAULT_ORDER_SHIPPING_COST,
  DEFAULT_ORDER_TAX_RATE,
} from "@/lib/order-settings";
import {
  applyCouponUsageForOrder,
  validateAndCalculateCoupon,
} from "@/lib/coupons";
import {
  CANONICAL_CART_WEIGHT_UNIT,
  SHIPPING_UNAVAILABLE_MESSAGE,
  type ShippingSettings,
} from "@/lib/shipping";
import {
  resolveCheckoutShipping,
  allocateSubOrderShipping,
  buildShippingMetadata,
} from "@/lib/checkout-shipping";
import { calculateCheckoutTotals } from "@/lib/discounts";
import {
  handleApiError,
  ValidationError,
} from "@/lib/api/errors";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { ORDER_STATUS, PAYMENT_STATUS, VENDOR_STATUS } from "@/config/app.config";
import {
  rateLimitByIP,
  rateLimitBySession,
  rateLimitByUser,
} from "@/lib/api/rate-limit-middleware";
import { validateBody } from "@/lib/api/validate";
import { CheckoutSchema } from "@/lib/validations";
import { isStorefrontProductSourceAllowed } from "@/lib/product-visibility";
import {
  buildVendorSubOrders,
  getOrderItemVendorId,
  groupItemsByOrderVendor,
  resolveOrderVendorContext,
} from "@/lib/order-vendors";
import { ensurePendingChargeTransaction } from "@/lib/payment-transactions";
import {
  markCheckoutRecovered,
  updateCheckoutSnapshot,
} from "@/lib/abandoned-checkouts";
import { notifyOrderCreatedParticipants } from "@/lib/notifications";
import { assertStorefrontWriteAllowed } from "@/lib/maintenance";
import { resolveOrderItemCost } from "@/lib/products/item-cost";
import {
  buildOrderItemCustomsSnapshot,
  resolveItemShipping,
  type ProductShippingData,
  type VariantShippingData,
} from "@/lib/product-shipping";
import { revalidateProductContent } from "@/lib/cache-invalidation";
import {
  pickupCheckoutCharges,
  resolvePickupCheckoutFulfillment,
  type PickupFulfillmentSnapshot,
} from "@/lib/checkout-pickup";
import { isCountryAllowed } from "@/lib/country-availability";

interface CartItem {
  productId: {
    _id: string;
    name: string;
    price: number;
    images?: string[];
    vendorId: string | { _id: string };
    sku?: string;
    slug?: string;
    shipping?: ProductShippingData;
    variants?: Array<VariantShippingData & { _id: { toString: () => string } }>;
  };
  variantId?: string;
  quantity: number;
  price: number;
  purchaseType?: string;
  preorderReleaseDate?: Date;
  preorderMessage?: string;
  preorderPaymentMode?: "full" | "deposit" | "pay_later";
  preorderDepositAmount?: number;
  preorderOutstandingAmount?: number;
  preorderSupplierEta?: Date;
  preorderBatchName?: string;
}

type StockCheckVariant = {
  _id: { toString: () => string };
  stock?: number;
  sku?: string;
  weight?: number;
  weightUnit?: "g" | "kg" | "lb" | "oz";
  requiresShipping?: boolean;
  preorder?: PreorderSettingsShape;
};

type StockCheckProduct = {
  stock?: number;
  sku?: string;
  status?: string;
  productSource?: unknown;
  category?: string | { toString: () => string };
  variants?: StockCheckVariant[];
  preorder?: PreorderSettingsShape;
  shipping?: ProductShippingData;
};

type CheckoutShippingAddress = {
  fullName: string;
  firstName?: string;
  lastName?: string;
  street: string;
  apartment?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
};

/**
 * POST /api/payments/checkout
 * Create checkout payment session/order
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const cartSessionId = request.cookies?.get("cart_session")?.value;

    if (session?.user?.id) {
      await rateLimitByUser(
        request,
        session.user.id,
        "payments:checkout",
        "strict",
        session.user.role
      );
    } else if (cartSessionId) {
      await rateLimitBySession(
        request,
        cartSessionId,
        "payments:checkout",
        "strict",
      );
    } else {
      await rateLimitByIP(request, "strict");
    }

    await connectDB();

    const {
      shippingAddress,
      billingAddress,
      paymentMethod,
      locale,
      email,
      couponCode,
      preorderAcknowledged,
      selectedShippingOptionId,
      vendorShippingSelections,
      fulfillmentMethod,
      pickupLocationId,
      iotecChannel,
      iotecPhone,
    } = await validateBody(
      request,
      CheckoutSchema,
    );
    const customerEmail =
      typeof email === "string" && email.trim().length > 0
        ? email.trim()
        : session?.user?.email;

    if (!session?.user?.id && !customerEmail) {
      throw new ValidationError({
        email: ["Email is required for guest checkout"],
      });
    }

    // shippingAddress is optional at the schema level: digital-only carts
    // send billing only. Whether it is actually required is decided below,
    // after the items are inspected for shippability.
    const shippingAddressInput = shippingAddress
      ? {
          ...shippingAddress,
          state: shippingAddress.state?.trim() || "N/A",
        }
      : undefined;
    const billingAddressInput = billingAddress
      ? {
          ...billingAddress,
          state: billingAddress.state?.trim() || "N/A",
        }
      : shippingAddressInput;

    const settings = await getSettings();
    assertStorefrontWriteAllowed(settings.maintenance, settings.general?.storeName);
    if (
      shippingAddressInput?.country &&
      !isCountryAllowed(
        shippingAddressInput.country,
        settings.general?.countryAvailability,
      )
    ) {
      throw new ValidationError({
        "shippingAddress.country": ["Selected country is not available"],
      });
    }
    if (
      billingAddressInput?.country &&
      !isCountryAllowed(
        billingAddressInput.country,
        settings.general?.countryAvailability,
      )
    ) {
      throw new ValidationError({
        "billingAddress.country": ["Selected country is not available"],
      });
    }
    const isMultiVendorEnabled = Boolean(settings.multiVendorMode?.enabled);

    const paymentSettings = settings.payment || {};
    const stripeSettings = paymentSettings.stripe;
    const paypalSettings = paymentSettings.paypal;
    const razorpaySettings = paymentSettings.razorpay;
    const paystackSettings = paymentSettings.paystack;
    const pesapalSettings = paymentSettings.pesapal;
    const iotecSettings = paymentSettings.iotec;
    const codSettings = paymentSettings.cod;

    const cartQuery = session?.user?.id
      ? { userId: session.user.id }
      : cartSessionId
        ? { sessionId: cartSessionId }
        : null;

    if (!cartQuery) {
      throw new ValidationError({ cart: ["Cart is empty"] });
    }

    // Get current cart (customer or guest)
    const cart = await Cart.findOne(cartQuery)
      .populate({
        path: "items.productId",
        // `shipping` + `inventory` decide whether `stock` is a limit at all
        // (lib/products/stock-policy.ts) — resolvePurchaseType() reads them.
        select:
          "name price images vendorId stock inventory sku slug shipping variants",
        populate: { path: "vendorId", select: "_id" },
      })
      .lean();

    if (!cart || !cart.items || cart.items.length === 0) {
      throw new ValidationError({ cart: ["Cart is empty"] });
    }

    const items = cart.items as unknown as CartItem[];
    const customerId = session?.user?.id || String(cart._id);
    const purchaseTypes = new Set(
      items.map((item) => item.purchaseType || PURCHASE_TYPE.STANDARD),
    );
    if (purchaseTypes.size > 1) {
      throw new ValidationError({
        cart: [
          "Pre-order items must be checked out separately from regular items",
        ],
      });
    }
    const hasPreorder = purchaseTypes.has(PURCHASE_TYPE.PREORDER);
    if (hasPreorder && preorderAcknowledged !== true) {
      throw new ValidationError({
        preorderAcknowledged: ["Please confirm the pre-order shipping terms"],
      });
    }

    if (isMultiVendorEnabled) {
      const vendorIds = Array.from(
        new Set(
          items
            .map((item) => String((item.productId.vendorId as { _id?: string })?._id || item.productId.vendorId || ""))
            .filter(Boolean),
        ),
      );
      // Every vendor in the cart must be approved AND have an active store.
      // A deactivated store (lapsed paid plan) takes no new orders, so its
      // products fail this count and the checkout is rejected.
      const sellableVendorCount = await Vendor.countDocuments({
        _id: { $in: vendorIds },
        status: VENDOR_STATUS.APPROVED,
        storeActive: { $ne: false },
      });
      if (sellableVendorCount !== vendorIds.length) {
        throw new ValidationError({
          cart: ["One or more products are no longer available"],
        });
      }
    }

    const couponCartItems: Array<{
      productId: string;
      price: number;
      quantity: number;
      categoryId?: string;
    }> = [];

    // Accumulate shippable weight (in the store's weight unit) overall and per
    // vendor, so the rate engine can price weight-based and per-vendor shipping.
    let totalWeight = 0;
    let hasShippableItems = false;
    const vendorAgg = new Map<
      string,
      {
        subtotal: number;
        shippableSubtotal: number;
        weight: number;
        shippableItemCount: number;
      }
    >();
    const itemVendorId = (item: CartItem) =>
      String(
        (item.productId.vendorId as { _id?: string })?._id ||
          item.productId.vendorId ||
          "",
      );

    // Validate stock against selected variant (when present) to match inventory decrement rules.
    // Fetch every cart product in one query instead of one round-trip per item.
    const stockCheckProducts = await Product.find({
      _id: { $in: items.map((item) => item.productId._id) },
    }).lean<Array<StockCheckProduct & { _id: { toString: () => string } }>>();
    const stockCheckProductById = new Map(
      stockCheckProducts.map((product) => [product._id.toString(), product]),
    );
    for (const item of items) {
      const product = stockCheckProductById.get(String(item.productId._id));
      if (!product) {
        throw new ValidationError({
          stock: [
            `${item.productId.name} is out of stock or has insufficient quantity`,
          ],
        });
      }
      const hasExplicitStatus = typeof product.status === "string";
      const hasExplicitProductSource =
        product.productSource !== undefined && product.productSource !== null;
      const isUnavailableByStatus =
        hasExplicitStatus && product.status !== "active";
      const isUnavailableByProductSource =
        hasExplicitProductSource &&
        !isStorefrontProductSourceAllowed(
          product.productSource,
          isMultiVendorEnabled,
        );

      // Keep compatibility with legacy products that may not have status/source fields.
      if (isUnavailableByStatus || isUnavailableByProductSource) {
        throw new ValidationError({
          stock: [
            `${item.productId.name} is out of stock or has insufficient quantity`,
          ],
        });
      }

      const purchase = resolvePurchaseType({
        product,
        variantId: item.variantId,
        requestedQuantity: item.quantity,
      });
      const expectedPurchaseType = item.purchaseType || PURCHASE_TYPE.STANDARD;
      if (!purchase || purchase.purchaseType !== expectedPurchaseType) {
        throw new ValidationError({
          stock: [
            `${item.productId.name} is out of stock or has insufficient quantity`,
          ],
        });
      }

      const variantSku = item.variantId
        ? product.variants?.find(
            (variant) => variant._id.toString() === String(item.variantId),
          )?.sku
        : undefined;
      if (!item.productId.sku && !variantSku) {
        throw new ValidationError({
          sku: [`Missing SKU for product "${item.productId.name}"`],
        });
      }

      // Re-price standard lines from the LIVE product so a stale cart snapshot
      // (carts live up to 30 days) can't lock an old price in either direction.
      // Variant-aware: product.price is only the cheapest-variant mirror.
      // Pre-order lines are left untouched — their deposit/outstanding amounts
      // were computed against the price quoted at reservation time.
      if ((item.purchaseType || PURCHASE_TYPE.STANDARD) !== PURCHASE_TYPE.PREORDER) {
        const liveVariant = item.variantId
          ? (
              product.variants as
                | Array<{ _id: { toString(): string }; price?: number }>
                | undefined
            )?.find((v) => v._id.toString() === String(item.variantId))
          : undefined;
        const livePrice =
          liveVariant && typeof liveVariant.price === "number"
            ? liveVariant.price
            : typeof (product as { price?: number }).price === "number"
              ? (product as { price?: number }).price
              : item.price;
        if (typeof livePrice === "number") item.price = livePrice;
      }

      couponCartItems.push({
        productId: String(item.productId._id),
        price: item.price,
        quantity: item.quantity,
        categoryId: product.category ? String(product.category) : undefined,
      });

      const selectedVariant = item.variantId
        ? product.variants?.find(
            (variant) => variant._id.toString() === String(item.variantId),
          )
        : undefined;
      const itemShipping = resolveItemShipping({
        productShipping: product.shipping,
        variantShipping: selectedVariant,
        quantity: item.quantity,
        targetWeightUnit: CANONICAL_CART_WEIGHT_UNIT,
      });
      const lineWeight = itemShipping.totalWeight;
      totalWeight += lineWeight;
      if (itemShipping.requiresShipping) hasShippableItems = true;

      const vId = itemVendorId(item);
      const agg = vendorAgg.get(vId) || {
        subtotal: 0,
        shippableSubtotal: 0,
        weight: 0,
        shippableItemCount: 0,
      };
      agg.subtotal += item.price * item.quantity;
      agg.weight += lineWeight;
      if (itemShipping.requiresShipping) {
        agg.shippableItemCount += item.quantity;
        agg.shippableSubtotal += item.price * item.quantity;
      }
      vendorAgg.set(vId, agg);
    }

    // Address rules, now that shippability is known: physical carts need a
    // shipping address; digital-only carts need billing only, which is also
    // snapshotted as the order address so every downstream consumer (emails,
    // invoices, admin views) still has an address to render.
    if (hasShippableItems && !shippingAddressInput) {
      throw new ValidationError({
        shippingAddress: ["Shipping address is required"],
      });
    }
    if (!shippingAddressInput && !billingAddressInput) {
      throw new ValidationError({
        billingAddress: ["Billing address is required"],
      });
    }
    const normalizedShippingAddress = (shippingAddressInput ??
      billingAddressInput)!;
    const normalizedBillingAddress =
      billingAddressInput ?? normalizedShippingAddress;
    const digitalOnly = !hasShippableItems;

    // Persist any re-priced values back to the cart so consumers that re-read
    // the cart (notably the Stripe Checkout Session finalizer) charge and
    // record the same price, and the cart-tampering guard doesn't reject a
    // legitimately re-priced order. Idempotent when nothing changed.
    const repriceOps = items
      .filter((item) => (item as unknown as { _id?: unknown })._id)
      .map((item) => ({
        updateOne: {
          filter: { _id: cart._id },
          update: { $set: { "items.$[el].price": item.price } },
          arrayFilters: [
            { "el._id": (item as unknown as { _id: unknown })._id },
          ],
        },
      }));
    if (repriceOps.length > 0) {
      await Cart.bulkWrite(repriceOps).catch((err) =>
        console.error("Failed to persist re-priced cart items:", err),
      );
    }

    // Calculate totals
    const subtotal = items.reduce(
      (sum: number, item: CartItem) => sum + item.price * item.quantity,
      0,
    );
    const orderSettings = settings.orders || {};
    const freeShippingThreshold =
      orderSettings.freeShippingThreshold ?? DEFAULT_FREE_SHIPPING_THRESHOLD;
    const defaultShippingCost =
      orderSettings.defaultShippingCost ?? DEFAULT_ORDER_SHIPPING_COST;
    const taxRate = orderSettings.taxRate ?? DEFAULT_ORDER_TAX_RATE;

    let appliedCoupon:
      | {
          couponId: string;
          code: string;
          type: string;
          value: number;
          discount: number;
          maxDiscount?: number;
        }
      | undefined;
    const destination = {
      country: normalizedShippingAddress.country,
      state: normalizedShippingAddress.state,
    };
    const platformShipping = settings.shipping as ShippingSettings | undefined;
    const legacyOrders = { freeShippingThreshold, defaultShippingCost };

    // Single source of truth for cost, selected method, per-vendor allocation,
    // and duties — shared with the Stripe paths so they cannot diverge.
    // A branch is identified by itself — there is no hold to quote back. The
    // resolver re-reads the branch server-side, so the only thing a client
    // decides here is *which* of the merchant's collection points, and a
    // tampered payload cannot put a different address on the order.
    const pickupFulfillment: PickupFulfillmentSnapshot | undefined =
      fulfillmentMethod === "pickup"
        ? pickupLocationId
          ? await resolvePickupCheckoutFulfillment({
              owner: { userId: session?.user?.id, sessionId: cartSessionId },
              pickupLocationId,
            })
          : (() => {
              throw new ValidationError("A pickup location is required");
            })()
        : undefined;
    const shippingResolution = pickupFulfillment
      ? null
      : await resolveCheckoutShipping({
          subtotal,
          totalWeight,
          vendorAgg,
          destination,
          platformShipping,
          orders: legacyOrders,
          isMultiVendorEnabled,
          selectedShippingOptionId,
          vendorShippingSelections,
        });
    if (shippingResolution && !shippingResolution.available) {
      throw new ValidationError(SHIPPING_UNAVAILABLE_MESSAGE);
    }
    const pickupCharges = pickupFulfillment
      ? pickupCheckoutCharges({ shippingCost: 0, dutyAmount: 0 })
      : null;
    const shippingCost = pickupCharges?.shippingCost ?? shippingResolution!.shippingCost;
    const selectedShippingMethod = pickupFulfillment
      ? { name: "Local pickup", optionId: "pickup" }
      : shippingResolution!.selectedShippingMethod;
    const vendorShippingCosts = pickupFulfillment
      ? new Map()
      : shippingResolution!.vendorShippingCosts;
    const customsEstimate = pickupFulfillment
      ? {
          dutyAmount: 0,
          dutyMode: "DDU" as const,
          international: false,
          collectedAtCheckout: false,
        }
      : shippingResolution!.customs;
    const dutyAmount = pickupCharges?.dutyAmount ?? customsEstimate.dutyAmount;

    if (couponCode) {
      appliedCoupon = await validateAndCalculateCoupon({
        code: couponCode,
        subtotal,
        shippingCost,
        cartItems: couponCartItems,
        userId: session?.user?.id,
      });
    }

    const totals = calculateCheckoutTotals({
      subtotal,
      shippingCost,
      taxRate,
      coupon: appliedCoupon,
    });
    const discount = totals.discount;
    const tax = totals.tax;
    const total = totals.total + dutyAmount;
    const preorderOutstandingAmount = items.reduce(
      (sum, item) => sum + Number(item.preorderOutstandingAmount || 0),
      0,
    );
    const paymentDueNow = Math.max(0, total - preorderOutstandingAmount);

    if (!paymentMethod) {
      throw new ValidationError({
        paymentMethod: ["Payment method is required"],
      });
    }

    // Collection takes every configured payment method, exactly as delivery
    // does. It was restricted to COD because a pickup booking used to consume a
    // capacity hold the moment the order was created, and a hosted redirect
    // abandoned after that point would strand a slot nobody could rebook. Slot
    // booking is gone — a branch takes no reservations, only opening hours — so
    // the hold this protected no longer exists, while the restriction went on
    // hiding collection entirely from every prepaid-only store.
    //
    // A prepaid collection is in fact the safer of the two orders: the money is
    // settled before anything leaves the counter.

    const activeLocale =
      typeof locale === "string" && locale.length > 0 ? locale : "en";

    const origin =
      request.headers.get("origin") ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000";

    const cartDoc = await Cart.findById(cart._id);
    if (cartDoc) {
      await updateCheckoutSnapshot(cartDoc, {
        origin,
        locale: activeLocale,
        email: customerEmail,
        phone: normalizedShippingAddress.phone,
        customerName: normalizedShippingAddress.fullName,
        customerLocale: activeLocale,
        shippingAddress: normalizedShippingAddress,
        billingAddress: normalizedBillingAddress,
        gateway: paymentMethod,
        subtotalPrice: subtotal,
        shippingPrice: shippingCost,
        totalTax: tax,
        totalDiscounts: discount,
        totalPrice: total,
        presentmentCurrency: settings.general?.defaultCurrency || "USD",
        paymentEvent: {
          gateway: paymentMethod,
          status: "created",
          message: "Checkout payment started",
        },
      });
    }

    // Handle COD (Cash on Delivery)
    if (paymentMethod === "cod") {
      if (codSettings?.enabled === false) {
        throw new ValidationError("Cash on Delivery is disabled");
      }
      // Nothing ships and nothing is collected in person on a downloads-only
      // order, so cash has no moment to change hands — the order would sit
      // unpaid forever with its files already handed over. Checkout keeps COD
      // off the screen for these carts; this is the backstop.
      if (digitalOnly) {
        throw new ValidationError(
          "Cash on Delivery is not available for digital-only orders",
        );
      }
      if (
        typeof codSettings?.minOrderAmount === "number" &&
        total < codSettings.minOrderAmount
      ) {
        throw new ValidationError(
          `Minimum order amount for Cash on Delivery is ${codSettings.minOrderAmount}`,
        );
      }
      if (
        typeof codSettings?.maxOrderAmount === "number" &&
        codSettings.maxOrderAmount > 0 &&
        total > codSettings.maxOrderAmount
      ) {
        throw new ValidationError(
          `Maximum order amount for Cash on Delivery is ${codSettings.maxOrderAmount}`,
        );
      }

      const inventoryLines = items
        .filter(
          (item) =>
            (item.purchaseType || PURCHASE_TYPE.STANDARD) ===
            PURCHASE_TYPE.STANDARD,
        )
        .map((item) => ({
          productId: String(item.productId._id),
          variantId: item.variantId,
          quantity: item.quantity,
        }));
      const preorderLines = getOrderPreorderLines(items);

      try {
        if (hasPreorder) {
          await reservePreorderQuantity(preorderLines);
        } else {
          // A collection comes off the counter the shopper chose, not off
          // whichever branch happens to hold the most. The order does not exist
          // yet on this path, so the snapshot is read directly rather than
          // through `orderInventoryOpts`.
          await decrementInventory(
            inventoryLines,
            pickupFulfillment
              ? { locationId: pickupFulfillment.pickup.pickupLocationId }
              : {},
          );
        }
      } catch (err) {
        if (err instanceof InsufficientStockError) {
          const failedItem = items.find(
            (item) => String(item.productId._id) === String(err.line.productId),
          );
          const failedName = failedItem?.productId.name || "Product";
          throw new ValidationError({
            stock: [
              `${failedName} is out of stock or has insufficient quantity`,
            ],
          });
        }
        throw err;
      }
      revalidateProductContent({
        slugs: items
          .map((item) => item.productId?.slug)
          .filter(
            (slug): slug is string =>
              typeof slug === "string" && slug.length > 0,
          ),
      });

      let order: Awaited<ReturnType<typeof createOrder>>;
      try {
        order = await createOrder({
          customerId,
          items,
          shippingAddress: normalizedShippingAddress,
        digitalOnly,
          billingAddress: normalizedBillingAddress,
          paymentMethod: "cod",
          shippingMethod: selectedShippingMethod,
          customs: customsEstimate,
          vendorShippingCosts,
          fulfillment: pickupFulfillment,
          paymentStatus: PAYMENT_STATUS.PENDING,
          subtotal,
          discount,
          shippingCost,
          tax,
          total,
          coupon: appliedCoupon
            ? {
                code: appliedCoupon.code,
                type: appliedCoupon.type,
                value: appliedCoupon.value,
                couponId: appliedCoupon.couponId,
              }
            : undefined,
          isMultiVendorEnabled,
          orderPrefix: orderSettings.prefix,
          currency: settings.general?.defaultCurrency || "USD",
        });
      } catch (err) {
        if (hasPreorder) {
          await releasePreorderQuantity(preorderLines).catch(() => undefined);
        } else {
          // Back to the branch the decrement just took them from — the same
          // options object, or the units migrate between shops on every failed
          // order creation.
          await restoreInventory(
            inventoryLines,
            pickupFulfillment
              ? { locationId: pickupFulfillment.pickup.pickupLocationId }
              : {},
          ).catch(() => undefined);
        }
        throw err;
      }

      if (hasPreorder) {
        await markOrderPreorderReserved(String(order._id)).catch((err) =>
          console.error("Failed to mark preorder reserved on COD order:", err),
        );
      } else {
        // Mark sub-orders as having inventory reserved so cancel/refund paths
        // know which lines to restore.
        await markOrderInventoryReserved(String(order._id)).catch((err) =>
          console.error("Failed to mark inventory reserved on COD order:", err),
        );
      }

      // Clear cart only after order + inventory succeed.
      await Cart.findByIdAndUpdate(cart._id, { $set: { items: [] } });

      // Bookkeeping, confirmation email (PDF invoice + SMTP), and
      // notifications run after the response streams so the customer
      // isn't held on the success redirect while they complete.
      after(async () => {
        await ensurePendingChargeTransaction({
          _id: String(order._id),
          orderNumber: order.orderNumber,
          paymentMethod: order.paymentMethod,
          paymentStatus: order.paymentStatus,
          paymentId: order.paymentId,
          stripePaymentIntentId: order.stripePaymentIntentId,
          paypalCaptureId: order.paypalCaptureId,
          subtotal: order.subtotal,
          shippingCost: order.shippingCost,
          tax: order.tax,
          discount: order.discount,
          total: order.total,
          currency: settings.general?.defaultCurrency,
          channel: "online",
          createdAt: order.createdAt,
        }).catch((err) => {
          console.error("Failed to sync pending COD payment transaction:", err);
        });

        await markCheckoutRecovered({
          cartId: cart._id,
          orderId: order._id,
          paymentEvent: {
            gateway: "cod",
            status: "succeeded",
            message: "Cash on delivery order placed",
          },
        }).catch((err) =>
          console.error("Failed to mark abandoned checkout recovered:", err),
        );

        if (customerEmail) {
          await sendOrderConfirmationEmail(
            {
              orderNumber: order.orderNumber,
              customerName: normalizedShippingAddress.fullName,
              customerEmail,
              items: order.items.map(
                (i: {
                  name: string;
                  quantity: number;
                  price: number;
                  image?: string;
                }) => ({
                  name: i.name,
                  quantity: i.quantity,
                  price: i.price,
                  image: i.image,
                }),
              ),
              subtotal: order.subtotal,
              discount: order.discount,
              shipping: order.shippingCost,
              tax: order.tax,
              total: order.total,
              shippingAddress: order.shippingAddress,
              paymentMethod: order.paymentMethod,
            },
            settings,
          ).catch((err) =>
            console.error("Failed to send COD order confirmation email:", err),
          );
        }

        await notifyOrderCreatedParticipants(order).catch((err) =>
          console.error("Failed to create COD order notifications:", err),
        );
      });

      return NextResponse.json({
        success: true,
        data: {
          orderId: order._id,
          orderNumber: order.orderNumber,
          paymentMethod: "cod",
          redirectUrl: `${origin}/${activeLocale}/checkout/success?order=${order.orderNumber}`,
        },
      });
    }

    if (hasPreorder && paymentDueNow <= 0) {
      const preorderLines = getOrderPreorderLines(items);
      await reservePreorderQuantity(preorderLines);
      let order: Awaited<ReturnType<typeof createOrder>>;
      try {
        order = await createOrder({
          customerId,
          items,
          shippingAddress: normalizedShippingAddress,
        digitalOnly,
          billingAddress: normalizedBillingAddress,
          paymentMethod: "pay_later",
          shippingMethod: selectedShippingMethod,
          customs: customsEstimate,
          vendorShippingCosts,
          fulfillment: pickupFulfillment,
          paymentStatus: PAYMENT_STATUS.PENDING,
          subtotal,
          discount,
          shippingCost,
          tax,
          total,
          coupon: appliedCoupon
            ? {
                code: appliedCoupon.code,
                type: appliedCoupon.type,
                value: appliedCoupon.value,
                couponId: appliedCoupon.couponId,
              }
            : undefined,
          isMultiVendorEnabled,
          orderPrefix: orderSettings.prefix,
          currency: settings.general?.defaultCurrency || "USD",
        });
      } catch (err) {
        await releasePreorderQuantity(preorderLines).catch(() => undefined);
        throw err;
      }
      await markOrderPreorderReserved(String(order._id)).catch((err) =>
        console.error("Failed to mark pay-later preorder reserved:", err),
      );
      await Cart.findByIdAndUpdate(cart._id, { $set: { items: [] } });
      after(async () => {
        await notifyOrderCreatedParticipants(order).catch((err) =>
          console.error(
            "Failed to create pay-later preorder notifications:",
            err,
          ),
        );
      });
      return NextResponse.json({
        success: true,
        data: {
          orderId: order._id,
          orderNumber: order.orderNumber,
          paymentMethod: "pay_later",
          redirectUrl: `${origin}/${activeLocale}/checkout/success?order=${order.orderNumber}`,
        },
      });
    }

    if (paymentMethod === "paypal") {
      if (!paypalSettings?.enabled)
        throw new ValidationError("PayPal is disabled");
      const paypalCreds = resolvePayPalCredentials(paypalSettings);
      if (!paypalCreds.clientId || !paypalCreds.clientSecret) {
        throw new ValidationError("PayPal is not configured");
      }

      const { orderId: paypalOrderId, approvalUrl } = await createPayPalOrder({
        creds: {
          clientId: paypalCreds.clientId,
          clientSecret: paypalCreds.clientSecret,
          mode: paypalCreds.mode,
        },
        currency: (settings.general?.defaultCurrency || "USD").toUpperCase(),
        total: paymentDueNow,
        returnUrl: `${origin}/${activeLocale}/checkout/success`,
        cancelUrl: `${origin}/${activeLocale}/checkout?canceled=true`,
        referenceId: String(cart._id),
      });

      const order = await createOrder({
        customerId,
        items,
        shippingAddress: normalizedShippingAddress,
        digitalOnly,
        billingAddress: normalizedBillingAddress,
        paymentMethod: "paypal",
        shippingMethod: selectedShippingMethod,
        customs: customsEstimate,
        vendorShippingCosts,
        fulfillment: pickupFulfillment,
        paymentStatus: PAYMENT_STATUS.PENDING,
        subtotal,
        discount,
        shippingCost,
        tax,
        total,
        coupon: appliedCoupon
          ? {
              code: appliedCoupon.code,
              type: appliedCoupon.type,
              value: appliedCoupon.value,
              couponId: appliedCoupon.couponId,
            }
          : undefined,
        paypalOrderId,
        isMultiVendorEnabled,
        orderPrefix: orderSettings.prefix,
        currency: settings.general?.defaultCurrency || "USD",
      });

      return NextResponse.json({
        success: true,
        data: {
          orderId: order._id,
          orderNumber: order.orderNumber,
          paymentMethod: "paypal",
          paypalOrderId,
          url: approvalUrl,
        },
      });
    }

    if (paymentMethod === "razorpay") {
      if (!razorpaySettings?.enabled) {
        throw new ValidationError("Razorpay is disabled");
      }

      const razorpayCreds = getRazorpayCredentials({
        keyId: razorpaySettings.keyId,
        keySecret: razorpaySettings.keySecret,
      });
      const currency = (settings.general?.defaultCurrency || "INR").toUpperCase();

      const razorpayOrder = await createRazorpayOrder({
        creds: razorpayCreds,
        amount: paymentDueNow,
        currency,
        receipt: `cart_${String(cart._id).slice(-18)}_${Date.now().toString(36)}`,
        notes: {
          cartId: String(cart._id),
          customerId,
          locale: activeLocale,
        },
      });

      const order = await createOrder({
        customerId,
        items,
        shippingAddress: normalizedShippingAddress,
        digitalOnly,
        billingAddress: normalizedBillingAddress,
        paymentMethod: "razorpay",
        shippingMethod: selectedShippingMethod,
        customs: customsEstimate,
        vendorShippingCosts,
        fulfillment: pickupFulfillment,
        paymentStatus: PAYMENT_STATUS.PENDING,
        subtotal,
        discount,
        shippingCost,
        tax,
        total,
        coupon: appliedCoupon
          ? {
              code: appliedCoupon.code,
              type: appliedCoupon.type,
              value: appliedCoupon.value,
              couponId: appliedCoupon.couponId,
            }
          : undefined,
        razorpayOrderId: razorpayOrder.id,
        isMultiVendorEnabled,
        orderPrefix: orderSettings.prefix,
        currency: settings.general?.defaultCurrency || "USD",
      });

      return NextResponse.json({
        success: true,
        data: {
          orderId: order._id,
          orderNumber: order.orderNumber,
          paymentMethod: "razorpay",
          keyId: razorpayCreds.keyId,
          razorpayOrderId: razorpayOrder.id,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
          name: settings.general?.storeName || "Store",
          description: `Order ${order.orderNumber}`,
        },
      });
    }

    if (paymentMethod === "paystack") {
      if (!paystackSettings?.enabled) {
        throw new ValidationError("Paystack is disabled");
      }
      if (!customerEmail) {
        throw new ValidationError({
          email: ["Email is required for Paystack checkout"],
        });
      }

      const paystackCreds = getPaystackCredentials({
        publicKey: paystackSettings.publicKey,
        secretKey: paystackSettings.secretKey,
      });
      const currency = (settings.general?.defaultCurrency || "NGN").toUpperCase();
      const paystackReference = `ps-${String(cart._id)}-${Date.now().toString(36)}`;
      const callbackUrl = `${origin}/${activeLocale}/checkout/success?paystack_reference=${encodeURIComponent(paystackReference)}`;

      // If passChargesToCustomer is enabled, add 1.95% + 0 fee (or standard Paystack fee formula: amount / (1 - 0.0195))
      const passFees = Boolean(paystackSettings.passChargesToCustomer);
      const effectiveAmount = passFees
        ? Math.round((paymentDueNow / (1 - 0.0195)) * 100) / 100
        : paymentDueNow;

      const transaction = await initializePaystackTransaction({
        creds: paystackCreds,
        email: customerEmail,
        amount: effectiveAmount,
        currency,
        reference: paystackReference,
        callbackUrl,
        metadata: {
          cartId: String(cart._id),
          customerId,
          locale: activeLocale,
          passFees,
          originalAmount: paymentDueNow,
        },
      });

      const order = await createOrder({
        customerId,
        items,
        shippingAddress: normalizedShippingAddress,
        digitalOnly,
        billingAddress: normalizedBillingAddress,
        paymentMethod: "paystack",
        shippingMethod: selectedShippingMethod,
        customs: customsEstimate,
        vendorShippingCosts,
        fulfillment: pickupFulfillment,
        paymentStatus: PAYMENT_STATUS.PENDING,
        subtotal,
        discount,
        shippingCost,
        tax,
        total,
        coupon: appliedCoupon
          ? {
              code: appliedCoupon.code,
              type: appliedCoupon.type,
              value: appliedCoupon.value,
              couponId: appliedCoupon.couponId,
            }
          : undefined,
        paystackReference,
        isMultiVendorEnabled,
        orderPrefix: orderSettings.prefix,
        currency: settings.general?.defaultCurrency || "USD",
      });

      return NextResponse.json({
        success: true,
        data: {
          orderId: order._id,
          orderNumber: order.orderNumber,
          paymentMethod: "paystack",
          paystackReference,
          accessCode: transaction.access_code,
          url: transaction.authorization_url,
        },
      });
    }

    if (paymentMethod === "pesapal") {
      if (!pesapalSettings?.enabled) {
        throw new ValidationError("Pesapal is disabled");
      }
      if (!customerEmail) {
        throw new ValidationError({
          email: ["Email is required for Pesapal checkout"],
        });
      }

      const resolvedPesapal = resolvePesapalCredentials(pesapalSettings);
      const pesapalCreds = getPesapalCredentials(resolvedPesapal);
      if (!pesapalCreds.ipnId) {
        throw new ValidationError(
          "Pesapal is not configured. Register the IPN URL and add its IPN ID.",
        );
      }

      const currency = (settings.general?.defaultCurrency || "UGX").toUpperCase();
      // Pesapal is an East African acquirer and refuses anything it cannot
      // settle. Said here, before the order is written, rather than letting the
      // shopper meet a raw gateway error at the end of a built cart.
      if (!isPesapalCurrency(currency)) {
        throw new ValidationError(
          `Pesapal cannot settle ${currency}. Set the store default currency to one of ${[...PESAPAL_CURRENCIES].join(", ")} in Admin → Settings → General.`,
        );
      }
      const merchantReference = `psp-${String(cart._id).slice(-18)}-${Date.now().toString(36)}`;
      const callbackUrl = `${origin}/${activeLocale}/checkout/success?pesapal_reference=${encodeURIComponent(merchantReference)}`;
      const fullNameParts = normalizedBillingAddress.fullName
        .trim()
        .split(/\s+/)
        .filter(Boolean);
      const firstName =
        normalizedBillingAddress.firstName || fullNameParts[0] || "Customer";
      const lastName =
        normalizedBillingAddress.lastName ||
        fullNameParts.slice(1).join(" ") ||
        firstName;

      const pesapalOrder = await submitPesapalOrder({
        creds: pesapalCreds,
        merchantReference,
        currency,
        amount: paymentDueNow,
        description: `Store checkout ${merchantReference}`,
        callbackUrl,
        cancellationUrl: `${origin}/${activeLocale}/checkout?canceled=true`,
        notificationId: pesapalCreds.ipnId,
        billingAddress: {
          email_address: customerEmail,
          phone_number: normalizedBillingAddress.phone,
          country_code: normalizePesapalCountryCode(
            normalizedBillingAddress.country,
          ),
          first_name: firstName,
          last_name: lastName,
          line_1: normalizedBillingAddress.street,
          line_2: normalizedBillingAddress.apartment,
          city: normalizedBillingAddress.city,
          state: normalizedBillingAddress.state,
          postal_code: normalizedBillingAddress.postalCode,
          zip_code: normalizedBillingAddress.postalCode,
        },
      });

      if (
        !pesapalOrder.order_tracking_id ||
        !pesapalOrder.redirect_url ||
        pesapalOrder.merchant_reference !== merchantReference
      ) {
        throw new ValidationError("Pesapal returned an invalid order response");
      }

      const order = await createOrder({
        customerId,
        items,
        shippingAddress: normalizedShippingAddress,
        digitalOnly,
        billingAddress: normalizedBillingAddress,
        paymentMethod: "pesapal",
        shippingMethod: selectedShippingMethod,
        customs: customsEstimate,
        vendorShippingCosts,
        fulfillment: pickupFulfillment,
        paymentStatus: PAYMENT_STATUS.PENDING,
        subtotal,
        discount,
        shippingCost,
        tax,
        total,
        coupon: appliedCoupon
          ? {
              code: appliedCoupon.code,
              type: appliedCoupon.type,
              value: appliedCoupon.value,
              couponId: appliedCoupon.couponId,
            }
          : undefined,
        pesapalOrderTrackingId: pesapalOrder.order_tracking_id,
        pesapalMerchantReference: merchantReference,
        isMultiVendorEnabled,
        orderPrefix: orderSettings.prefix,
        // Must match the currency the charge was submitted in — the finalizer
        // compares the gateway's currency against the order's.
        currency,
      });

      return NextResponse.json({
        success: true,
        data: {
          orderId: order._id,
          orderNumber: order.orderNumber,
          paymentMethod: "pesapal",
          pesapalOrderTrackingId: pesapalOrder.order_tracking_id,
          pesapalMerchantReference: merchantReference,
          url: pesapalOrder.redirect_url,
        },
      });
    }

    if (paymentMethod === "iotec") {
      if (!iotecSettings?.enabled) {
        throw new ValidationError("ioTec Pay is disabled");
      }

      const resolvedIotec = resolveIotecCredentials(iotecSettings);
      const iotecCreds = getIotecCredentials(resolvedIotec);
      if (!iotecCreds.walletId) {
        throw new ValidationError(
          "ioTec Pay is not configured. Add the wallet ID in Admin → Settings → Payments.",
        );
      }

      const currency = (
        settings.general?.defaultCurrency || "UGX"
      ).toUpperCase();
      // ioTec Pay settles Ugandan mobile money and cards in UGX only, and the
      // minimum below is denominated in shillings — charging any other currency
      // would silently mis-denominate both.
      if (currency !== IOTEC_CURRENCY) {
        throw new ValidationError(
          `ioTec Pay only accepts ${IOTEC_CURRENCY}. Set the store default currency to ${IOTEC_CURRENCY} in Admin → Settings → General.`,
        );
      }
      // ioTec collections take whole currency units (UGX is zero-decimal).
      const amount = Math.round(paymentDueNow);
      if (amount < IOTEC_MIN_AMOUNT) {
        throw new ValidationError(
          `ioTec Pay requires a minimum amount of ${IOTEC_MIN_AMOUNT} ${currency}.`,
        );
      }

      const externalId = `iot-${String(cart._id).slice(-18)}-${Date.now().toString(36)}`;
      const isCard = iotecChannel === "card";
      // Card collections are billed to the customer's email; mobile money is
      // billed to the MSISDN the payer approves the PIN prompt on.
      const payer = isCard
        ? String(customerEmail || "")
        : normalizeUgandaMsisdn(iotecPhone || normalizedBillingAddress.phone);
      if (!payer) {
        throw new ValidationError(
          isCard
            ? { email: ["Email is required for ioTec card payments"] }
            : {
                iotecPhone: [
                  "A valid Ugandan mobile money number is required for ioTec Pay",
                ],
              },
        );
      }

      // Submitting a mobile-money collection puts a PIN prompt on the payer's
      // phone straight away, and ioTec has no programmatic refund API. So the
      // order is persisted first and cancelled if the collection never starts —
      // the reverse order could take a payment with no order behind it.
      const order = await createOrder({
        customerId,
        items,
        shippingAddress: normalizedShippingAddress,
        digitalOnly,
        billingAddress: normalizedBillingAddress,
        paymentMethod: "iotec",
        shippingMethod: selectedShippingMethod,
        customs: customsEstimate,
        vendorShippingCosts,
        fulfillment: pickupFulfillment,
        paymentStatus: PAYMENT_STATUS.PENDING,
        subtotal,
        discount,
        shippingCost,
        tax,
        total,
        coupon: appliedCoupon
          ? {
              code: appliedCoupon.code,
              type: appliedCoupon.type,
              value: appliedCoupon.value,
              couponId: appliedCoupon.couponId,
            }
          : undefined,
        iotecExternalId: externalId,
        isMultiVendorEnabled,
        orderPrefix: orderSettings.prefix,
        currency,
      });

      let collection: IotecCollectionResponse;
      try {
        collection = isCard
          ? await submitIotecCardCollection({
              creds: iotecCreds,
              externalId,
              currency,
              amount,
              payer,
              redirectUrl: `${origin}/${activeLocale}/checkout/success?iotec_external_id=${encodeURIComponent(externalId)}`,
              payerName: normalizedBillingAddress.fullName,
              payerNote: `Store checkout ${externalId}`,
            })
          : await submitIotecCollection({
              creds: iotecCreds,
              externalId,
              currency,
              amount,
              payer,
              payerName: normalizedBillingAddress.fullName,
              payerNote: `Store checkout ${externalId}`,
            });

        if (!collection.id || (isCard && !collection.cardRedirectUrl)) {
          throw new ValidationError(
            isCard
              ? "ioTec returned an invalid card response"
              : "ioTec returned an invalid collection response",
          );
        }
      } catch (err) {
        await Order.updateOne(
          { _id: order._id },
          { $set: { status: ORDER_STATUS.CANCELLED } },
        ).catch((cancelErr) =>
          console.error(
            "Failed to cancel order after ioTec collection failure:",
            cancelErr,
          ),
        );
        throw err;
      }

      // The finalizer looks orders up by transaction id; until this lands it
      // falls back to the external id the callback also carries.
      await Order.updateOne(
        { _id: order._id },
        { $set: { iotecTransactionId: collection.id } },
      );

      return NextResponse.json({
        success: true,
        data: {
          orderId: order._id,
          orderNumber: order.orderNumber,
          paymentMethod: "iotec",
          iotecTransactionId: collection.id,
          iotecExternalId: externalId,
          ...(isCard
            ? { url: collection.cardRedirectUrl }
            : // No redirect: the payer approves the charge on their phone; the
              // client polls /api/payments/iotec/verify until it resolves.
              { requiresPolling: true }),
        },
      });
    }

    if (paymentMethod !== "card") {
      throw new ValidationError("Unsupported payment method");
    }

    if (discount > 0) {
      throw new ValidationError(
        "Discounted card checkout is handled via Payment Intent flow",
      );
    }

    if (!stripeSettings?.enabled)
      throw new ValidationError("Stripe is disabled");
    const stripeSecretKey = resolveStripeCredentials(stripeSettings).secretKey;
    if (!isStripeSecretKeyConfigured(stripeSecretKey)) {
      throw new ValidationError(
        "Stripe is enabled but not configured. Please add Stripe Secret Key in Admin → Settings → Payments.",
      );
    }

    // Create Stripe line items
    const checkoutCurrency = (
      settings.general?.defaultCurrency || "USD"
    ).toLowerCase();
    const lineItems = items
      .map((item: CartItem) => {
        const lineDueNow =
          item.purchaseType === PURCHASE_TYPE.PREORDER &&
          typeof item.preorderDepositAmount === "number"
            ? item.preorderDepositAmount
            : item.price * item.quantity;
        if (lineDueNow <= 0) return null;
        return {
          price_data: {
            currency: checkoutCurrency,
            product_data: {
              name: item.productId.name,
              images: item.productId.images?.slice(0, 1) || [],
            },
            unit_amount: toStripeAmount(
              lineDueNow / item.quantity,
              checkoutCurrency,
            ),
          },
          quantity: item.quantity,
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item));

    // Add shipping if applicable
    if (shippingCost > 0) {
      lineItems.push({
        price_data: {
          currency: checkoutCurrency,
          product_data: {
            name: "Shipping",
            images: [],
          },
          unit_amount: toStripeAmount(shippingCost, checkoutCurrency),
        },
        quantity: 1,
      });
    }

    // Add tax
    if (tax > 0) {
      lineItems.push({
        price_data: {
          currency: checkoutCurrency,
          product_data: {
            name: "Tax",
            images: [],
          },
          unit_amount: toStripeAmount(tax, checkoutCurrency),
        },
        quantity: 1,
      });
    }

    // Add estimated import duties (DDP) so the charged amount matches `total`.
    if (dutyAmount > 0) {
      lineItems.push({
        price_data: {
          currency: checkoutCurrency,
          product_data: {
            name: "Estimated duties",
            images: [],
          },
          unit_amount: toStripeAmount(dutyAmount, checkoutCurrency),
        },
        quantity: 1,
      });
    }

    // Create Stripe checkout session
    const checkoutSession = await getStripeForSecretKey(
      stripeSecretKey,
    ).checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: lineItems,
      metadata: {
        userId: customerId,
        cartId: String(cart._id),
        shippingAddress: JSON.stringify(normalizedShippingAddress),
        billingAddress: JSON.stringify(normalizedBillingAddress),
        customerEmail: customerEmail || "",
        subtotal: String(subtotal),
        tax: String(tax),
        discount: String(discount),
        total: String(total),
        couponCode: appliedCoupon?.code || "",
        couponType: appliedCoupon?.type || "",
        couponValue: appliedCoupon ? String(appliedCoupon.value) : "",
        couponId: appliedCoupon?.couponId || "",
        ...(shippingResolution
          ? buildShippingMetadata(shippingResolution)
          : {
              shipping: "0",
              shippingMethod: JSON.stringify(selectedShippingMethod),
              customsDuty: "0",
              customs: JSON.stringify(customsEstimate),
              vendorShipping: "",
            }),
        pickupFulfillment: pickupFulfillment
          ? JSON.stringify(pickupFulfillment)
          : "",
      },
      customer_email: customerEmail,
      success_url: `${origin}/${activeLocale}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/${activeLocale}/checkout?canceled=true`,
    });

    return NextResponse.json({
      success: true,
      data: {
        sessionId: checkoutSession.id,
        url: checkoutSession.url,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Helper to create order
 */
async function createOrder(params: {
  customerId: string;
  items: CartItem[];
  shippingAddress: CheckoutShippingAddress;
  billingAddress: CheckoutShippingAddress;
  paymentMethod: string;
  paymentStatus: string;
  subtotal: number;
  discount: number;
  shippingCost: number;
  tax: number;
  total: number;
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
  paypalOrderId?: string;
  razorpayOrderId?: string;
  paystackReference?: string;
  pesapalOrderTrackingId?: string;
  pesapalMerchantReference?: string;
  iotecTransactionId?: string;
  iotecExternalId?: string;
  coupon?: {
    code: string;
    type: string;
    value: number;
    couponId: string;
  };
  isMultiVendorEnabled: boolean;
  orderPrefix?: string;
  currency?: string;
  /** True when no item on the order needs physical shipping. */
  digitalOnly?: boolean;
  shippingMethod?: {
    name?: string;
    optionId?: string;
    minDays?: number;
    maxDays?: number;
  };
  customs?: {
    dutyAmount: number;
    dutyMode?: "DDP" | "DDU";
    international?: boolean;
    collectedAtCheckout?: boolean;
  };
  vendorShippingCosts?: Map<
    string,
    {
      cost: number;
      method: { name?: string; optionId?: string; minDays?: number; maxDays?: number };
    }
  >;
  fulfillment?: PickupFulfillmentSnapshot;
}) {
  const {
    customerId,
    items,
    shippingAddress,
    billingAddress,
    paymentMethod,
    paymentStatus,
    subtotal,
    discount,
    shippingCost,
    tax,
    total,
    stripeSessionId,
    stripePaymentIntentId,
    paypalOrderId,
    razorpayOrderId,
    paystackReference,
    pesapalOrderTrackingId,
    pesapalMerchantReference,
    iotecTransactionId,
    iotecExternalId,
    coupon,
    isMultiVendorEnabled,
    orderPrefix,
    currency,
    digitalOnly,
    shippingMethod,
    customs,
    vendorShippingCosts,
    fulfillment,
  } = params;

  // Generate order number atomically (seeds from max(existing) on first call)
  const orderNumber = await getNextOnlineOrderNumber(orderPrefix);

  const vendorContext = await resolveOrderVendorContext({
    isMultiVendorEnabled,
  });
  const vendorGroups = groupItemsByOrderVendor(
    items,
    vendorContext,
    (item) => item.productId.vendorId,
  );
  const hasPreorder = items.some(
    (item) => item.purchaseType === PURCHASE_TYPE.PREORDER,
  );
  const initialOrderStatus = hasPreorder
    ? ORDER_STATUS.PREORDERED
    : ORDER_STATUS.PENDING;
  // `getSettings` is React-cached, so this rides the same read the request has
  // already done rather than threading one more param through every caller.
  const orderSettings = await getSettings();
  const subOrders = await buildVendorSubOrders(vendorGroups, {
    codCollectedByDefault: orderSettings.shipping?.codCollectedBy,
    getProductId: (item) => item.productId._id,
    getVariantId: (item) => item.variantId,
    getName: (item) => item.productId.name,
    getSku: (item) => item.productId.sku,
    getQuantity: (item) => item.quantity,
    getPrice: (item) => item.price,
    getCost: (item) =>
      resolveOrderItemCost({
        product: item.productId,
        variantId: item.variantId,
      }),
    getImage: (item) => item.productId.images?.[0],
    getPurchaseType: (item) => item.purchaseType || PURCHASE_TYPE.STANDARD,
    getPreorderReleaseDate: (item) => item.preorderReleaseDate,
    getPreorderMessage: (item) => item.preorderMessage,
    getPreorderStatus: (item) =>
      item.purchaseType === PURCHASE_TYPE.PREORDER
        ? PREORDER_ITEM_STATUS.RESERVED
        : undefined,
    getPreorderPaymentMode: (item) => item.preorderPaymentMode,
    getPreorderDepositAmount: (item) => item.preorderDepositAmount,
    getPreorderOutstandingAmount: (item) => item.preorderOutstandingAmount,
    getPreorderSupplierEta: (item) => item.preorderSupplierEta,
    getPreorderBatchName: (item) => item.preorderBatchName,
    getCustoms: (item) => {
      const variant = item.variantId
        ? item.productId.variants?.find(
            (candidate) =>
              candidate._id.toString() === String(item.variantId),
          )
        : undefined;
      return buildOrderItemCustomsSnapshot({
        productShipping: item.productId.shipping,
        variantShipping: variant,
      });
    },
    status: initialOrderStatus,
  });

  // Allocate shipping to each sub-order (per-vendor map, or the whole cost to
  // the sole sub-order for single shipments). Shared with the Stripe paths.
  allocateSubOrderShipping(
    subOrders as Array<{
      vendorId: { toString: () => string };
      shippingCost?: number;
      shippingMethod?: unknown;
    }>,
    {
      vendorShippingCosts: vendorShippingCosts ?? new Map(),
      orderShippingCost: shippingCost,
      orderShippingMethod: shippingMethod,
    },
  );
  if (fulfillment?.method === "pickup") {
    const pickupSubOrder = subOrders.find(
      (subOrder) =>
        subOrder.vendorId.toString() === fulfillment.pickup.vendorId,
    ) as (typeof subOrders)[number] & { fulfillment?: PickupFulfillmentSnapshot };
    if (pickupSubOrder) pickupSubOrder.fulfillment = fulfillment;
  }

  const preorderReleaseDate = getPreorderReleaseDateForOrder(items);
  const preorderItems = items.filter(
    (item) => item.purchaseType === PURCHASE_TYPE.PREORDER,
  );
  const preorderPaymentModes = new Set(
    preorderItems.map((item) => item.preorderPaymentMode || "full"),
  );
  const preorderPaymentMode =
    preorderPaymentModes.size === 1
      ? Array.from(preorderPaymentModes)[0]
      : hasPreorder
        ? "full"
        : undefined;
  const preorderDepositAmount = preorderItems.reduce(
    (sum, item) => sum + Number(item.preorderDepositAmount || 0),
    0,
  );
  const preorderOutstandingAmount = preorderItems.reduce(
    (sum, item) => sum + Number(item.preorderOutstandingAmount || 0),
    0,
  );

  // Create order. The coupon's usedCount is intentionally NOT incremented
  // here — that is deferred to the capture/verify path so an abandoned
  // payment doesn't burn a coupon use. The exception is COD, where the order
  // itself is the commitment and there is no separate capture step; that
  // increment happens just below.
  const order = await Order.create({
    customerId,
    orderNumber,
    currency: currency || "USD",
    branchId: fulfillment?.method === "pickup" ? fulfillment.pickup?.pickupLocationId : undefined,
    items: items.map((item: CartItem) => ({
      productId: item.productId._id,
      variantId: item.variantId,
      vendorId: getOrderItemVendorId(item.productId.vendorId, vendorContext),
      name: item.productId.name,
      sku: item.productId.sku || "",
      quantity: item.quantity,
      price: item.price,
        cost: resolveOrderItemCost({
          product: item.productId,
          variantId: item.variantId,
        }),
        image: item.productId.images?.[0],
        purchaseType: item.purchaseType || PURCHASE_TYPE.STANDARD,
        preorderReleaseDate: item.preorderReleaseDate,
        preorderMessage: item.preorderMessage,
        preorderStatus:
          item.purchaseType === PURCHASE_TYPE.PREORDER
            ? PREORDER_ITEM_STATUS.RESERVED
            : undefined,
        preorderPaymentMode: item.preorderPaymentMode,
        preorderDepositAmount: item.preorderDepositAmount,
        preorderOutstandingAmount: item.preorderOutstandingAmount,
        preorderSupplierEta: item.preorderSupplierEta,
        preorderBatchName: item.preorderBatchName,
        customs: buildOrderItemCustomsSnapshot({
          productShipping: item.productId.shipping,
          variantShipping: item.variantId
            ? item.productId.variants?.find(
                (candidate) =>
                  candidate._id.toString() === String(item.variantId),
              )
            : undefined,
        }),
      })),
    subOrders,
    shippingAddress,
    billingAddress,
    digitalOnly: Boolean(digitalOnly),
    paymentMethod,
    paymentStatus,
    stripeSessionId,
    stripePaymentIntentId,
    paypalOrderId,
    razorpayOrderId,
    paystackReference,
    pesapalOrderTrackingId,
    pesapalMerchantReference,
    iotecTransactionId,
    iotecExternalId,
    subtotal,
    shippingCost,
    shippingMethod,
    fulfillment,
    customs: customs
      ? {
          dutyAmount: customs.dutyAmount,
          dutyMode: customs.dutyMode,
          international: customs.international,
          collectedAtCheckout: customs.collectedAtCheckout,
        }
      : undefined,
    tax,
    discount,
    coupon: coupon
      ? {
          code: coupon.code,
          type: coupon.type,
          value: coupon.value,
          couponId: coupon.couponId,
          usageIncremented: false,
        }
      : undefined,
    total,
    hasPreorder,
    preorderStatus: hasPreorder ? PREORDER_ITEM_STATUS.RESERVED : undefined,
    preorderReleaseDate,
    preorderAcknowledgedAt: hasPreorder ? new Date() : undefined,
    preorderPaymentMode,
    preorderDepositAmount,
    preorderOutstandingAmount,
    // Pickup orders used to be created CANCELLED and activated only once slot
    // capacity was confirmed. With no capacity to claim there is nothing to
    // wait for — and the old dance was fragile besides, since every non-Stripe
    // finalizer refuses to touch a CANCELLED order, so a failed activation
    // stranded a paid-for order permanently.
    status: initialOrderStatus,
  });


  if (coupon?.couponId && paymentMethod === "cod") {
    await applyCouponUsageForOrder(String(order._id)).catch((err) =>
      console.error("Failed to apply coupon usage for COD order:", err),
    );
  }

  return order;
}
