import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { Order } from "@/models";
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
    const { orderId, amount, method, reference, note } = body;

    if (!orderId || !amount || amount <= 0 || !method) {
      throw new ValidationError("Missing required payment details");
    }

    const order = await Order.findById(orderId);
    if (!order) {
      throw new NotFoundError("Order not found");
    }

    if (order.status !== ORDER_STATUS.LAYAWAY) {
      throw new ValidationError("Order is not a layaway");
    }

    const currentPaid = (order.paymentTenders || []).reduce(
      (sum: number, t: any) => sum + (t.amount || 0),
      0
    );

    const remainingBalance = order.total - currentPaid;

    if (amount > remainingBalance) {
      throw new ValidationError(`Amount exceeds remaining balance of ${remainingBalance}`);
    }

    const newTender = {
      method,
      amount,
      reference,
      note,
      gatewayTransactionId: reference,
    };

    if (!order.paymentTenders) {
      order.paymentTenders = [];
    }
    order.paymentTenders.push(newTender);

    if (currentPaid + amount >= order.total) {
      order.paymentStatus = PAYMENT_STATUS.PAID;
      order.status = ORDER_STATUS.DELIVERED;
    }

    await order.save();

    return successResponse(
      { order },
      "Layaway payment processed successfully"
    );
  } catch (error) {
    return handleApiError(error);
  }
}
