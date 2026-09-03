import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { StockAudit } from "@/models/stock-audit.model";
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
import { applyStockChangeAtomic } from "@/lib/inventory";

export async function POST(
  _request: NextRequest,
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
      throw new ValidationError("Audit session has already been committed");
    }

    const adjustmentResults: Array<{
      productId: string;
      sku: string;
      expected: number;
      counted: number;
      variance: number;
      success: boolean;
      error?: string;
    }> = [];

    // Atomically commit variances for every item that has a non-zero variance
    for (const item of audit.items) {
      if (item.variance !== 0) {
        const changeResult = await applyStockChangeAtomic({
          productId: String(item.productId),
          variantId: item.variantId,
          locationId: audit.locationId,
          quantity: item.countedQty,
          adjustment: false, // Set exact counted quantity
        });

        adjustmentResults.push({
          productId: String(item.productId),
          sku: item.sku,
          expected: item.expectedQty,
          counted: item.countedQty,
          variance: item.variance,
          success: changeResult.success,
          error: changeResult.error,
        });
      }
    }

    audit.status = "completed";
    audit.completedAt = new Date();
    await audit.save();

    return successResponse({
      audit,
      adjustmentsCommitted: adjustmentResults.length,
      details: adjustmentResults,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
