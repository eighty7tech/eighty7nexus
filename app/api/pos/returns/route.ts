import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { Order, Product, Coupon } from "@/models";
import { CouponType, CouponStatus } from "@/models/coupon.model";
import { successResponse } from "@/lib/api/response";
import {
  handleApiError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ValidationError,
} from "@/lib/api/errors";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { USER_ROLES, ORDER_STATUS, PAYMENT_STATUS } from "@/config/app.config";
import { isStaffRole } from "@/lib/staff-role";
import { canAccessPOS } from "@/lib/rbac";
import { restoreInventory } from "@/lib/inventory";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) throw new AuthenticationError();
    const role = session.user.role;
    if (
      role !== USER_ROLES.ADMIN &&
      role !== USER_ROLES.VENDOR &&
      !isStaffRole(role)
    ) {
      throw new AuthorizationError();
    }

    await connectDB();
    if (!(await canAccessPOS(session.user))) {
      throw new AuthorizationError();
    }

    const body = await request.json();
    const { orderId, items, refundAmount, restock, note } = body;

    if (!orderId || !items || !Array.isArray(items)) {
      throw new ValidationError("Missing required fields");
    }

    const order = await Order.findById(orderId);
    if (!order) {
      throw new NotFoundError("Order not found");
    }

    let allFullyReturned = true;
    let anyReturned = false;

    for (const item of items) {
      const orderItem = order.items.find(
        (i: any) =>
          i.productId.toString() === item.productId &&
          (i.variantId?.toString() || null) === (item.variantId || null)
      );

      if (!orderItem) continue;

      const currentReturned = orderItem.returnedQuantity || 0;
      const availableToReturn = orderItem.quantity - currentReturned;

      if (item.returnQuantity > availableToReturn) {
        throw new ValidationError(`Cannot return more than purchased for ${orderItem.name}`);
      }

      orderItem.returnedQuantity = currentReturned + item.returnQuantity;
      
      if (orderItem.returnedQuantity < orderItem.quantity) {
        allFullyReturned = false;
      }
      if (item.returnQuantity > 0) {
        anyReturned = true;

        if (restock) {
          // Find the fulfillment location if this was a delivery, or the posLocation
          // We'll restock at the default fallback for now
          await restoreInventory(
            [{
              productId: orderItem.productId,
              variantId: orderItem.variantId,
              quantity: item.returnQuantity
            }],
            { channel: "pos" }
          );
        }
      }
    }

    if (!anyReturned) {
      throw new ValidationError("No valid items to return");
    }

    order.refundedTotal = (order.refundedTotal || 0) + (refundAmount || 0);

    let storeCreditCode = null;

    if (allFullyReturned) {
      order.status = ORDER_STATUS.RETURNED;
      order.paymentStatus = PAYMENT_STATUS.REFUNDED;
    } else {
      order.status = ORDER_STATUS.PARTIALLY_RETURNED;
      order.paymentStatus = PAYMENT_STATUS.PARTIALLY_REFUNDED;
    }

    if (refundAmount > 0 && body.issueStoreCredit) {
      const randomCode = crypto.randomBytes(4).toString("hex").toUpperCase();
      storeCreditCode = `SC-${randomCode}`;
      
      await Coupon.create({
        code: storeCreditCode,
        label: "Store Credit from Return",
        description: `Issued for order ${order.orderNumber}`,
        type: CouponType.FIXED,
        value: refundAmount,
        usageLimit: 1,
        usedCount: 0,
        perUserLimit: 1,
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year expiry
        status: CouponStatus.ACTIVE,
        createdBy: session.user.id,
      });
    }

    await order.save();

    return successResponse(
      { order, storeCreditCode },
      "Return processed successfully",
    );
  } catch (error) {
    return handleApiError(error);
  }
}
