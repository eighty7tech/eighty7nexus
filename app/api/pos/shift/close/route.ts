import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { POSShift, ShiftStatus } from "@/models/pos-shift.model";
import { Order } from "@/models/order.model";
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
import { USER_ROLES } from "@/config/app.config";
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
    const { shiftId, declaredCash, declaredCard, notes } = body;

    if (!shiftId) {
      throw new ValidationError("Shift ID is required");
    }

    if (declaredCash === undefined || declaredCash < 0) {
      throw new ValidationError("Declared cash must be a valid non-negative amount");
    }

    const shift = await POSShift.findOne({
      _id: shiftId,
      cashierId: session.user.id,
      status: ShiftStatus.OPEN,
    });

    if (!shift) {
      throw new NotFoundError("Open shift not found or you do not have permission to close it.");
    }

    // Calculate expected amounts from orders during this shift
    const orders = await Order.find({
      userId: session.user.id,
      createdAt: { $gte: shift.openedAt, $lte: new Date() },
      channel: "pos"
    });

    let totalCashSales = 0;
    let totalCardSales = 0;
    
    // We should ideally use paymentTenders if split payments exist
    for (const order of orders) {
      if (order.paymentTenders && order.paymentTenders.length > 0) {
        for (const tender of order.paymentTenders) {
          if (tender.method === "cash") {
            totalCashSales += tender.amount;
          } else if (tender.method === "card") {
            totalCardSales += tender.amount;
          }
        }
      } else {
        if (order.paymentMethod === "cash") {
          totalCashSales += order.total;
        } else if (order.paymentMethod === "card") {
          totalCardSales += order.total;
        }
      }
    }

    shift.expectedCash = shift.startingCash + totalCashSales;
    shift.expectedCard = totalCardSales;

    shift.status = ShiftStatus.CLOSED;
    shift.closedAt = new Date();
    shift.declaredCash = declaredCash;
    shift.declaredCard = declaredCard || 0;
    
    // Discrepancy is positive if they have MORE than expected, negative if LESS
    shift.cashDiscrepancy = declaredCash - shift.expectedCash;
    shift.cardDiscrepancy = (declaredCard || 0) - shift.expectedCard;
    
    if (notes) {
      shift.notes = shift.notes ? `${shift.notes}\nClose Notes: ${notes}` : notes;
    }

    await shift.save();

    return successResponse(
      { shift },
      "Shift closed successfully",
    );
  } catch (error) {
    return handleApiError(error);
  }
}
