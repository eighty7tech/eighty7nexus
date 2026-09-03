import { Cart, Order, Product } from "@/models";
import { ORDER_STATUS, PAYMENT_STATUS } from "@/config/app.config";
import { sendOrderConfirmationEmail } from "@/lib/order-emails";
import {
  decrementInventory,
  InsufficientStockError,
} from "@/lib/inventory";
import {
  markOrderInventoryReserved,
  orderInventoryOpts,
  restoreOrderInventory,
} from "@/lib/order-inventory";
import {
  getOrderPreorderLines,
  markOrderPreorderReserved,
  PreorderUnavailableError,
  PURCHASE_TYPE,
  releasePreorderQuantity,
  reservePreorderQuantity,
} from "@/lib/preorders";
import {
  createRefundTransaction,
  ensureChargeTransaction,
} from "@/lib/payment-transactions";
import { auditOrderPaid, systemActor } from "@/lib/audit-order";
import {
  applyCouponUsageForOrder,
  reverseCouponUsageForOrder,
} from "@/lib/coupons";
import { ConflictError, ValidationError } from "@/lib/api/errors";
import { markCheckoutRecovered } from "@/lib/abandoned-checkouts";
import { notifyOrderCreatedParticipants } from "@/lib/notifications";
import {
  getPesapalTransactionState,
  type PesapalTransactionStatus,
} from "@/lib/pesapal";
import { revalidateProductContent } from "@/lib/cache-invalidation";
import type { getSettings } from "@/models/settings.model";

type SettingsDocument = Awaited<ReturnType<typeof getSettings>>;

type FinalizePesapalOrderParams = {
  orderTrackingId: string;
  merchantReference?: string;
  transaction: PesapalTransactionStatus;
  settings: SettingsDocument;
  sessionUserId?: string;
  cartSessionId?: string;
  customerEmail?: string;
};

export async function finalizePesapalOrder(
  params: FinalizePesapalOrderParams,
) {
  const orderQuery: Record<string, unknown> = {
    pesapalOrderTrackingId: params.orderTrackingId,
    paymentMethod: "pesapal",
  };

  if (params.sessionUserId) {
    orderQuery.customerId = params.sessionUserId;
  }

  const order = await Order.findOne(orderQuery);
  if (!order) {
    throw new ValidationError("Order not found for Pesapal transaction");
  }

  if (
    order.paymentStatus === PAYMENT_STATUS.PAID ||
    order.paymentStatus === PAYMENT_STATUS.PARTIALLY_PAID
  ) {
    return {
      orderId: String(order._id),
      orderNumber: order.orderNumber,
      alreadyPaid: true,
    };
  }

  if (order.status === ORDER_STATUS.CANCELLED) {
    throw new ValidationError(
      "Order was cancelled before payment capture. Please contact support for a refund.",
    );
  }

  const transactionReference = String(
    params.transaction.merchant_reference || "",
  );
  if (
    transactionReference !== order.pesapalMerchantReference ||
    (params.merchantReference &&
      params.merchantReference !== order.pesapalMerchantReference)
  ) {
    throw new ValidationError("Pesapal merchant reference mismatch");
  }

  const transactionState = getPesapalTransactionState(params.transaction);
  if (transactionState !== "completed") {
    throw new ValidationError(
      `Pesapal transaction not completed: ${transactionState}`,
    );
  }

  // Compare against the currency snapshotted on the order at checkout, not the
  // store's current default — changing the default currency after checkout must
  // not strand in-flight payments with a "currency mismatch".
  const expectedCurrency = (
    order.currency ||
    params.settings.general?.defaultCurrency ||
    "UGX"
  ).toUpperCase();
  const transactionCurrency = String(
    params.transaction.currency || "",
  ).toUpperCase();
  if (transactionCurrency !== expectedCurrency) {
    throw new ValidationError("Pesapal currency mismatch");
  }

  const expectedAmount = Math.max(
    0,
    Number(order.total || 0) - Number(order.preorderOutstandingAmount || 0),
  );
  if (
    Math.round(Number(params.transaction.amount) * 100) !==
    Math.round(expectedAmount * 100)
  ) {
    throw new ValidationError("Pesapal amount mismatch");
  }

  const confirmationCode = String(
    params.transaction.confirmation_code || "",
  ).trim();
  const paymentIdentifier = confirmationCode || params.orderTrackingId;
  const nextStatus = order.hasPreorder
    ? ORDER_STATUS.PREORDERED
    : ORDER_STATUS.PROCESSING;

  const updatedOrder = await Order.findOneAndUpdate(
    {
      _id: order._id,
      paymentStatus: {
        $nin: [PAYMENT_STATUS.PAID, PAYMENT_STATUS.PARTIALLY_PAID],
      },
      status: { $ne: ORDER_STATUS.CANCELLED },
    },
    {
      $set: {
        paymentStatus:
          Number(order.preorderOutstandingAmount || 0) > 0
            ? PAYMENT_STATUS.PARTIALLY_PAID
            : PAYMENT_STATUS.PAID,
        status: nextStatus,
        ...(confirmationCode
          ? { pesapalConfirmationCode: confirmationCode }
          : {}),
        paymentId: paymentIdentifier,
      },
    },
    { returnDocument: 'after' },
  );

  if (!updatedOrder) {
    const freshOrder = await Order.findById(order._id).select(
      "paymentStatus status orderNumber",
    );
    if (
      freshOrder?.paymentStatus === PAYMENT_STATUS.PAID ||
      freshOrder?.paymentStatus === PAYMENT_STATUS.PARTIALLY_PAID
    ) {
      return {
        orderId: String(order._id),
        orderNumber: freshOrder.orderNumber,
        alreadyPaid: true,
      };
    }
    if (freshOrder?.status === ORDER_STATUS.CANCELLED) {
      throw new ValidationError(
        "Order was cancelled before payment capture. Please contact support for a refund.",
      );
    }
    throw new ConflictError("Order payment update failed");
  }

  await ensureChargeTransaction({
    _id: String(updatedOrder._id),
    orderNumber: updatedOrder.orderNumber,
    paymentMethod: updatedOrder.paymentMethod,
    paymentStatus: updatedOrder.paymentStatus,
    paymentId: updatedOrder.paymentId,
    stripePaymentIntentId: updatedOrder.stripePaymentIntentId,
    paypalCaptureId: updatedOrder.paypalCaptureId,
    razorpayPaymentId: updatedOrder.razorpayPaymentId,
    paystackTransactionId: updatedOrder.paystackTransactionId,
    pesapalConfirmationCode: updatedOrder.pesapalConfirmationCode,
    subtotal: updatedOrder.subtotal,
    shippingCost: updatedOrder.shippingCost,
    tax: updatedOrder.tax,
    discount: updatedOrder.discount,
    total: updatedOrder.total,
    preorderOutstandingAmount: updatedOrder.preorderOutstandingAmount,
    currency: updatedOrder.currency || params.settings.general?.defaultCurrency,
    channel: updatedOrder.channel || "online",
    createdAt: updatedOrder.createdAt,
  });

  // Only reached on the write that actually captured the money — the guarded
  // findOneAndUpdate above no-ops on a replayed IPN.
  await auditOrderPaid(systemActor(), updatedOrder, {
    gateway: "Pesapal",
    amount:
      Number(updatedOrder.total || 0) -
      Number(updatedOrder.preorderOutstandingAmount || 0),
    currency:
      updatedOrder.currency || params.settings.general?.defaultCurrency,
    transactionId: updatedOrder.pesapalConfirmationCode,
    partial: updatedOrder.paymentStatus === PAYMENT_STATUS.PARTIALLY_PAID,
  });

  const { awardOrderLoyaltyPoints, refreshCustomerStats } = await import(
    "@/lib/customer"
  );
  await awardOrderLoyaltyPoints(String(updatedOrder._id)).catch((err) =>
    console.error("Failed to award loyalty points:", err),
  );
  refreshCustomerStats(String(updatedOrder.customerId))
    .catch((err) => console.error("Failed to refresh customer stats:", err));

  await applyCouponUsageForOrder(String(updatedOrder._id)).catch((err) =>
    console.error("Failed to apply coupon usage on Pesapal capture:", err),
  );

  try {
    if (updatedOrder.hasPreorder) {
      await reservePreorderQuantity(getOrderPreorderLines(updatedOrder.items));
      await markOrderPreorderReserved(String(updatedOrder._id)).catch((err) =>
        console.error(
          "Failed to mark preorder reserved on Pesapal capture:",
          err,
        ),
      );
    } else {
      await decrementInventory(
        updatedOrder.items
          .filter(
            (item: { purchaseType?: string }) =>
              (item.purchaseType || PURCHASE_TYPE.STANDARD) ===
              PURCHASE_TYPE.STANDARD,
          )
          .map(
            (item: {
              productId: unknown;
              variantId?: unknown;
              quantity: number;
            }) => ({
              productId: String(item.productId),
              variantId: item.variantId ? String(item.variantId) : undefined,
              quantity: item.quantity,
            }),
          ),
        // A collection comes off the counter the shopper chose, not off
        // whichever branch happens to hold the most.
        orderInventoryOpts(updatedOrder),
      );
      await markOrderInventoryReserved(String(updatedOrder._id)).catch((err) =>
        console.error(
          "Failed to mark inventory reserved on Pesapal capture:",
          err,
        ),
      );

      const affectedProductIds = Array.from(
        new Set(
          updatedOrder.items
            .filter(
              (item: { purchaseType?: string }) =>
                (item.purchaseType || PURCHASE_TYPE.STANDARD) ===
                PURCHASE_TYPE.STANDARD,
            )
            .map((item: { productId: unknown }) =>
              String(item.productId || "").trim(),
            )
            .filter(Boolean),
        ),
      );
      const affectedSlugs = affectedProductIds.length
        ? (
            await Product.find({ _id: { $in: affectedProductIds } })
              .select("slug")
              .lean()
          ).map((product) => product.slug)
        : [];
      revalidateProductContent({
        slugs: affectedSlugs.filter(
          (slug): slug is string =>
            typeof slug === "string" && slug.length > 0,
        ),
      });
    }
  } catch (err) {
    if (
      err instanceof InsufficientStockError ||
      err instanceof PreorderUnavailableError
    ) {
      await Order.updateOne(
        { _id: updatedOrder._id },
        { $set: { status: ORDER_STATUS.CANCELLED } },
      );
      throw new ValidationError(
        "Payment captured but inventory is no longer available. Please contact support for a refund.",
      );
    }
    throw err;
  }

  if (params.sessionUserId || params.cartSessionId) {
    const cart = await Cart.findOne(
      params.sessionUserId
        ? { userId: params.sessionUserId }
        : { sessionId: params.cartSessionId },
    );
    if (cart) {
      await markCheckoutRecovered({
        cartId: cart._id,
        orderId: updatedOrder._id,
        paymentEvent: {
          gateway: "pesapal",
          status: "succeeded",
          paymentId: paymentIdentifier,
          message: "Pesapal payment captured",
        },
      }).catch((err) =>
        console.error("Failed to mark abandoned checkout recovered:", err),
      );
      cart.items = [];
      await cart.save();
    }
  } else {
    await Promise.all([
      Cart.findOneAndUpdate(
        { userId: updatedOrder.customerId },
        { $set: { items: [] } },
      ),
      Cart.findByIdAndUpdate(updatedOrder.customerId, { $set: { items: [] } }),
    ]);
  }

  if (params.customerEmail) {
    await sendOrderConfirmationEmail(
      {
        orderNumber: updatedOrder.orderNumber,
        customerName: updatedOrder.shippingAddress?.fullName || "Customer",
        customerEmail: params.customerEmail,
        items: updatedOrder.items.map(
          (item: {
            name: string;
            quantity: number;
            price: number;
            image?: string;
          }) => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            image: item.image,
          }),
        ),
        subtotal: updatedOrder.subtotal,
        discount: updatedOrder.discount,
        shipping: updatedOrder.shippingCost,
        tax: updatedOrder.tax,
        total: updatedOrder.total,
        shippingAddress: updatedOrder.shippingAddress,
        paymentMethod: updatedOrder.paymentMethod,
      },
      params.settings,
    );
  }

  await notifyOrderCreatedParticipants(updatedOrder).catch((err) =>
    console.error("Failed to create Pesapal order notifications:", err),
  );

  return {
    orderId: String(updatedOrder._id),
    orderNumber: updatedOrder.orderNumber,
    alreadyPaid: false,
  };
}

/**
 * Undoes a capture Pesapal has since reversed (chargeback or merchant reversal).
 * Without this an order stays PAID after the money is clawed back, so the
 * payment is written off, the order cancelled, stock handed back and the coupon
 * use released. Idempotent: the paid-status guard in the update means only the
 * first call for an order does any work.
 */
export async function reversePesapalOrder(params: {
  orderTrackingId: string;
  settings: SettingsDocument;
}) {
  const order = await Order.findOneAndUpdate(
    {
      pesapalOrderTrackingId: params.orderTrackingId,
      paymentMethod: "pesapal",
      paymentStatus: {
        $in: [PAYMENT_STATUS.PAID, PAYMENT_STATUS.PARTIALLY_PAID],
      },
    },
    {
      $set: {
        paymentStatus: PAYMENT_STATUS.REFUNDED,
        status: ORDER_STATUS.CANCELLED,
      },
    },
    { returnDocument: 'after' },
  );

  // Never captured, or already reversed — nothing to undo.
  if (!order) return { reversed: false };

  const capturedAmount = Math.max(
    0,
    Number(order.total || 0) - Number(order.preorderOutstandingAmount || 0),
  );

  // Consume the refund headroom the admin refund flow checks against, so the
  // reversed amount cannot be refunded a second time by hand.
  await Order.updateOne(
    { _id: order._id, refundedTotal: { $lt: capturedAmount } },
    { $set: { refundedTotal: capturedAmount } },
  ).catch((err) =>
    console.error("Failed to record refunded total on Pesapal reversal:", err),
  );

  if (order.hasPreorder) {
    await releasePreorderQuantity(getOrderPreorderLines(order.items)).catch(
      (err) =>
        console.error(
          "Failed to release preorder quantity on Pesapal reversal:",
          err,
        ),
    );
  } else {
    await restoreOrderInventory(String(order._id)).catch((err) =>
      console.error("Failed to restore inventory on Pesapal reversal:", err),
    );
  }

  await reverseCouponUsageForOrder(String(order._id)).catch((err) =>
    console.error("Failed to reverse coupon usage on Pesapal reversal:", err),
  );

  await createRefundTransaction({
    order: {
      _id: String(order._id),
      orderNumber: order.orderNumber,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      paymentId: order.paymentId,
      pesapalConfirmationCode: order.pesapalConfirmationCode,
      subtotal: order.subtotal,
      shippingCost: order.shippingCost,
      tax: order.tax,
      discount: order.discount,
      total: order.total,
      currency: order.currency || params.settings.general?.defaultCurrency,
      channel: order.channel || "online",
      createdAt: order.createdAt,
    },
    amount: capturedAmount,
    reason: "Pesapal transaction reversed",
    // Pesapal reversed it on their side; we are recording, not requesting.
    gatewayCalled: false,
  }).catch((err) =>
    console.error("Failed to record Pesapal reversal transaction:", err),
  );

  const { refreshCustomerStats, reverseOrderLoyaltyPoints } = await import(
    "@/lib/customer"
  );
  await reverseOrderLoyaltyPoints(String(order._id)).catch((err) =>
    console.error("Failed to reverse loyalty points:", err),
  );
  refreshCustomerStats(String(order.customerId))
    .catch((err) => console.error("Failed to refresh customer stats:", err));

  return {
    reversed: true,
    orderId: String(order._id),
    orderNumber: order.orderNumber,
  };
}
