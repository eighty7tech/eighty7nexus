import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { POSShift } from "@/models/pos-shift.model";
import { Order } from "@/models";
import { successResponse } from "@/lib/api/response";
import {
  handleApiError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
} from "@/lib/api/errors";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { USER_ROLES } from "@/config/app.config";
import { isStaffRole } from "@/lib/staff-role";
import { canAccessPOS } from "@/lib/rbac";

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const shiftId = searchParams.get("shiftId");

    let shift;
    if (shiftId) {
      shift = await POSShift.findById(shiftId);
    } else {
      shift = await POSShift.findOne({
        cashierId: session.user.id,
        status: "open",
      });
    }

    if (!shift) {
      throw new NotFoundError("Shift not found");
    }

    const endTime = shift.closedAt || new Date();

    const orders = await Order.find({
      branchId: shift.locationId.toString(),
      createdAt: { $gte: shift.openedAt, $lte: endTime },
    });

    let totalCash = 0;
    let totalCard = 0;
    let totalOther = 0;
    let totalRefunds = 0;
    let totalTax = 0;
    let totalSales = 0;

    for (const order of orders) {
      totalSales += order.total;
      totalRefunds += order.refundedTotal || 0;
      totalTax += order.tax || 0;

      if (order.paymentTenders && order.paymentTenders.length > 0) {
        for (const tender of order.paymentTenders) {
          if (tender.method === "cash") {
            totalCash += tender.amount;
          } else if (tender.method === "card") {
            totalCard += tender.amount;
          } else {
            totalOther += tender.amount;
          }
        }
      } else {
        // Fallback for orders without split tenders
        if (order.paymentMethod === "cash") {
          totalCash += order.total;
        } else if (order.paymentMethod === "card") {
          totalCard += order.total;
        } else {
          totalOther += order.total;
        }
      }
    }

    // Expected cash in drawer is starting cash + total cash sales
    const expectedCash = shift.startingCash + totalCash;
    const isClosed = shift.status === "closed";

    return successResponse(
      {
        reportType: isClosed ? "Z-Read" : "X-Read",
        shift: {
          id: shift._id,
          cashierId: shift.cashierId,
          openedAt: shift.openedAt,
          closedAt: shift.closedAt,
          status: shift.status,
          startingCash: shift.startingCash,
          expectedCash,
          expectedCard: totalCard,
          declaredCash: shift.declaredCash,
          declaredCard: shift.declaredCard,
          cashDiscrepancy: shift.cashDiscrepancy,
          cardDiscrepancy: shift.cardDiscrepancy,
        },
        totals: {
          sales: totalSales,
          cash: totalCash,
          card: totalCard,
          other: totalOther,
          refunds: totalRefunds,
          tax: totalTax,
        },
        transactionCount: orders.length,
        generatedAt: new Date(),
      },
      "Report generated successfully"
    );
  } catch (error) {
    return handleApiError(error);
  }
}
