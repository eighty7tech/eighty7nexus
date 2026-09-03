import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { StockAudit, IStockAuditItem } from "@/models/stock-audit.model";
import { Product } from "@/models/product.model";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { canAccessPOS } from "@/lib/rbac";
import { successResponse } from "@/lib/api/response";
import {
  handleApiError,
  AuthenticationError,
  AuthorizationError,
  ValidationError,
} from "@/lib/api/errors";
import { getPOSLocationStock } from "@/lib/pos/product-stock";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) throw new AuthenticationError();
    if (!(await canAccessPOS(session.user))) throw new AuthorizationError();

    await connectDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const locationId = searchParams.get("locationId");
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 30));

    const filter: Record<string, unknown> = {};
    if (status && status !== "all") {
      filter.status = status;
    }
    if (locationId && locationId !== "all") {
      filter.locationId = locationId;
    }

    const audits = await StockAudit.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return successResponse(audits);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) throw new AuthenticationError();
    if (!(await canAccessPOS(session.user))) throw new AuthorizationError();

    await connectDB();

    const body = await request.json().catch(() => ({}));
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const locationId = typeof body.locationId === "string" ? body.locationId.trim() : undefined;
    const locationName = typeof body.locationName === "string" ? body.locationName.trim() : undefined;
    const categoryId = typeof body.categoryId === "string" ? body.categoryId.trim() : undefined;
    const vendorId = typeof body.vendorId === "string" ? body.vendorId.trim() : undefined;

    if (!name) {
      throw new ValidationError("Audit session name is required");
    }

    // Build product filter for this count session
    const productQuery: Record<string, unknown> = {
      isDeleted: { $ne: true },
      status: "active",
    };
    if (categoryId) productQuery.category = categoryId;
    if (vendorId) productQuery.vendorId = vendorId;

    const products = await Product.find(productQuery)
      .select("name sku barcode price costPrice stock locationInventory variants")
      .lean();

    const items: IStockAuditItem[] = [];

    for (const product of products) {
      if (Array.isArray(product.variants) && product.variants.length > 0) {
        for (const variant of product.variants) {
          const expectedQty = locationId
            ? getPOSLocationStock(variant.locationInventory, locationId, variant.stock)
            : Math.max(0, variant.stock || 0);

          items.push({
            productId: product._id,
            variantId: String(variant._id),
            name: `${product.name} - ${variant.name || variant.sku}`,
            sku: variant.sku || product.sku,
            barcode: variant.barcode || product.barcode,
            expectedQty,
            countedQty: 0,
            variance: -expectedQty,
            unitPrice: variant.price ?? product.price ?? 0,
            costPrice: variant.costPrice ?? product.costPrice,
          });
        }
      } else {
        const expectedQty = locationId
          ? getPOSLocationStock(product.locationInventory, locationId, product.stock)
          : Math.max(0, product.stock || 0);

        items.push({
          productId: product._id,
          name: product.name,
          sku: product.sku,
          barcode: product.barcode,
          expectedQty,
          countedQty: 0,
          variance: -expectedQty,
          unitPrice: product.price ?? 0,
          costPrice: product.costPrice,
        });
      }
    }

    const totalExpectedQty = items.reduce((sum, it) => sum + it.expectedQty, 0);
    const totalCountedQty = 0;
    const totalVarianceQty = -totalExpectedQty;
    const totalVarianceValue = items.reduce(
      (sum, it) => sum + it.variance * it.unitPrice,
      0,
    );

    const auditNumber = `AUD-${Date.now().toString().slice(-6)}`;

    const audit = await StockAudit.create({
      auditNumber,
      name,
      status: "draft",
      locationId,
      locationName,
      vendorId,
      items,
      totalExpectedQty,
      totalCountedQty,
      totalVarianceQty,
      totalVarianceValue,
      countedBy: {
        userId: session.user.id,
        name: session.user.name,
        email: session.user.email,
      },
    });

    return successResponse(audit, undefined, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
