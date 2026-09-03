import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { StockAudit, IStockAuditItem } from "@/models/stock-audit.model";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { canAccessPOS } from "@/lib/rbac";
import { successResponse } from "@/lib/api/response";
import {
  handleApiError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ValidationError,
} from "@/lib/api/errors";

export async function GET(
  _request: NextRequest,
  props: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) throw new AuthenticationError();
    if (!(await canAccessPOS(session.user))) throw new AuthorizationError();

    await connectDB();
    const { id } = await props.params;

    const audit = await StockAudit.findById(id).lean();
    if (!audit) throw new NotFoundError("Stock audit not found");

    return successResponse(audit);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  props: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) throw new AuthenticationError();
    if (!(await canAccessPOS(session.user))) throw new AuthorizationError();

    await connectDB();
    const { id } = await props.params;

    const audit = await StockAudit.findById(id);
    if (!audit) throw new NotFoundError("Stock audit not found");

    if (audit.status === "completed") {
      throw new ValidationError("Cannot edit an already completed audit session");
    }

    const body = await request.json().catch(() => ({}));

    if (body.status && ["draft", "in_progress", "cancelled"].includes(body.status)) {
      audit.status = body.status;
    }

    if (typeof body.notes === "string") {
      audit.notes = body.notes;
    }

    if (Array.isArray(body.items)) {
      // Re-map items and recompute variances
      const updatedItems: IStockAuditItem[] = body.items.map((item: any) => {
        const expectedQty = Number(item.expectedQty) || 0;
        const countedQty = Math.max(0, Number(item.countedQty) || 0);
        const variance = countedQty - expectedQty;
        return {
          productId: item.productId,
          variantId: item.variantId,
          name: item.name,
          sku: item.sku,
          barcode: item.barcode,
          expectedQty,
          countedQty,
          variance,
          unitPrice: Number(item.unitPrice) || 0,
          costPrice: item.costPrice !== undefined ? Number(item.costPrice) : undefined,
          countedAt: item.countedAt ? new Date(item.countedAt) : undefined,
        };
      });

      audit.items = updatedItems;
      audit.totalCountedQty = updatedItems.reduce((sum, it) => sum + it.countedQty, 0);
      audit.totalExpectedQty = updatedItems.reduce((sum, it) => sum + it.expectedQty, 0);
      audit.totalVarianceQty = updatedItems.reduce((sum, it) => sum + it.variance, 0);
      audit.totalVarianceValue = updatedItems.reduce(
        (sum, it) => sum + it.variance * it.unitPrice,
        0,
      );
    }

    await audit.save();

    return successResponse(audit);
  } catch (error) {
    return handleApiError(error);
  }
}
