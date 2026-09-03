import { Cart, Order, Product } from "@/models";
import { ORDER_STATUS, PAYMENT_STATUS } from "@/config/app.config";
import { sendOrderConfirmationEmail } from "@/lib/order-emails";
import { decrementInventory, InsufficientStockError } from "@/lib/inventory";
import {
  markOrderInventoryReserved,
  orderInventoryOpts,
} from "@/lib/order-inventory";
import {
  getOrderPreorderLines,
  markOrderPreorderReserved,
  PreorderUnavailableError,
  PURCHASE_TYPE,
  reservePreorderQuantity,
} from "@/lib/preorders";
import { ensureChargeTransaction } from "@/lib/payment-transactions";
import { auditOrderPaid, systemActor } from "@/lib/audit-order";
import { applyCouponUsageForOrder } from "@/lib/coupons";
import { ConflictError, ValidationError } from "@/lib/api/errors";
import { markCheckoutRecovered } from "@/lib/abandoned-checkouts";
import { notifyOrderCreatedParticipants } from "@/lib/notifications";
import {
  getIotecTransactionState,
  type IotecTransactionStatus,
} from "@/lib/iotec";
import { revalidateProductContent } from "@/lib/cache-invalidation";
import type { getSettings } from "@/models/settings.model";

type SettingsDocument = Awaited<ReturnType<typeof getSettings>>;

type FinalizeIotecOrderParams = {
  transactionId: string;
  externalId?: string;
  transaction: IotecTransactionStatus;
  settings: SettingsDocument;
  sessionUserId?: string;
  cartSessionId?: string;
  customerEmail?: string;
};

export async function finalizeIotecOrder(params: FinalizeIotecOrderParams) {
  const scope: Record<string, unknown> = { paymentMethod: "iotec" };
  if (params.sessionUserId) {
    scope.customerId = params.sessionUserId;
  }

  // Checkout writes the transaction id right after the collection is accepted,
  // so a callback can land in the gap between the two. The external id is
  // stored before the collection is submitted and covers that window.
  let order = await Order.findOne({
    ...scope,
    iotecTransactionId: params.transactionId,
  });
  if (!order && params.externalId) {
    order = await Order.findOne({
      ...scope,
      iotecExternalId: params.externalId,
    });
  }
  if (!order) {
    throw new ValidationError("Order not found for ioTec transaction");
  }

  if (
    order.iotecTransactionId &&
    order.iotecTransactionId !== params.transactionId
  ) {
    throw new ValidationError("ioTec reference mismatch");
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

  if (
    params.externalId &&
    order.iotecExternalId &&
    params.externalId !== order.iotecExternalId
  ) {
    throw new ValidationError("ioTec reference mismatch");
  }

  const transactionState = getIotecTransactionState(params.transaction);
  if (transactionState !== "completed") {
    throw new ValidationError(
      `ioTec transaction not completed: ${transactionState}`,
    );
  }

  // Prefer the currency snapshotted on the order at checkout; a missing
  // currency on the ioTec status response is rejected, mirroring the other
  // gateway finalizers (a silent skip would accept a mis-denominated charge).
  const expectedCurrency = (
    order.currency ||
    params.settings.general?.defaultCurrency ||
    "UGX"
  ).toUpperCase();
  const transactionCurrency = String(
    params.transaction.currency || "",
  ).toUpperCase();
  if (transactionCurrency !== expectedCurrency) {
    throw new ValidationError("ioTec currency mismatch");
  }

  const expectedAmount = Math.max(
    0,
    Number(order.total || 0) - Number(order.preorderOutstandingAmount || 0),
  );
  // UGX is a zero-decimal currency; compare rounded whole units. A missing
  // amount casts to NaN and fails the comparison, so it is rejected too.
  if (
    Math.round(Number(params.transaction.amount)) !== Math.round(expectedAmount)
  ) {
    throw new ValidationError("ioTec amount mismatch");
  }

  const paymentIdentifier = params.transactionId;
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
        paymentId: paymentIdentifier,
        // Backfill when the order was matched on its external id alone.
        iotecTransactionId: params.transactionId,
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
    iotecTransactionId: updatedOrder.iotecTransactionId,
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
  // findOneAndUpdate above no-ops on a replayed callback.
  await auditOrderPaid(systemActor(), updatedOrder, {
    gateway: "ioTec",
    amount:
      Number(updatedOrder.total || 0) -
      Number(updatedOrder.preorderOutstandingAmount || 0),
    currency:
      updatedOrder.currency || params.settings.general?.defaultCurrency,
    transactionId: updatedOrder.iotecTransactionId,
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
    console.error("Failed to apply coupon usage on ioTec capture:", err),
  );

  try {
    if (updatedOrder.hasPreorder) {
      await reservePreorderQuantity(getOrderPreorderLines(updatedOrder.items));
      await markOrderPreorderReserved(String(updatedOrder._id)).catch((err) =>
        console.error(
          "Failed to mark preorder reserved on ioTec capture:",
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
          "Failed to mark inventory reserved on ioTec capture:",
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
          gateway: "iotec",
          status: "succeeded",
          paymentId: paymentIdentifier,
          message: "ioTec payment captured",
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
    console.error("Failed to create ioTec order notifications:", err),
  );

  return {
    orderId: String(updatedOrder._id),
    orderNumber: updatedOrder.orderNumber,
    alreadyPaid: false,
  };
}
