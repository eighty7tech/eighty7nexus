import { NextRequest } from "next/server";
import type { PipelineStage } from "mongoose";
import { connectDB } from "@/lib/db";
import { Product } from "@/models";
import { InventoryLocation } from "@/models/inventory-location.model";
import { successResponse } from "@/lib/api/response";
import {
  handleApiError,
  AuthenticationError,
  ValidationError,
} from "@/lib/api/errors";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { STAFF_PERMISSIONS } from "@/config/permissions.config";
import { rateLimitByUser } from "@/lib/api/rate-limit-middleware";
import { assertAdminOrStaffPermissions } from "@/lib/staff-authz";
import {
  buildStaffLocationScopeFilter,
  buildStaffProductScopeFilter,
  mergeScopeFilter,
} from "@/lib/staff-scope";
import { withApi } from "@/lib/api/handler";
import { fetchInventoryList } from "@/lib/inventory-list";
import { applyStockChangeAtomic } from "@/lib/inventory";
import { revalidateProductContent } from "@/lib/cache-invalidation";
import type { BarcodeFormat, BarcodeSource } from "@/lib/barcode/standards";
import {
  allowedLocationIds,
  resolveLocationScope,
} from "@/lib/inventory-location-scope";

export const GET = withApi(
  { auth: "user" },
  async ({ request, session }) => {
    const access = await assertAdminOrStaffPermissions(
      session as unknown as { user: { id: string; role: string } },
      [STAFF_PERMISSIONS.VIEW_INVENTORY],
    );

    await rateLimitByUser(
      request,
      session.user.id,
      "admin:inventory:list",
      "lenient",
      session.user.role
    );

    const list = await fetchInventoryList(
      new URL(request.url).searchParams,
      access.staffScope,
    );

    return successResponse({
      items: list.items,
      locations: list.locations,
      pagination: {
        page: list.page,
        limit: list.limit,
        total: list.total,
        totalPages: list.totalPages,
        hasNext: list.page < list.totalPages,
        hasPrev: list.page > 1,
      },
    });
  },
);

/**
 * PATCH /api/admin/inventory
 * Bulk update inventory quantities
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) throw new AuthenticationError();
    const access = await assertAdminOrStaffPermissions(
      session as unknown as { user: { id: string; role: string } },
      [
        STAFF_PERMISSIONS.EDIT_INVENTORY,
        STAFF_PERMISSIONS.MANAGE_INVENTORY,
      ],
    );

    await rateLimitByUser(
      request,
      session.user.id,
      "admin:inventory:update",
      "moderate",
      session.user.role
    );

    const body = await request.json();
    const { updates } = body;

    if (!Array.isArray(updates) || updates.length === 0) {
      throw new ValidationError("Updates array is required");
    }

    await connectDB();

    // Stock may only be adjusted at a location this store owns. The staff
    // restriction below narrows further, but on its own it let an unrestricted
    // admin or staff session name any location id at all — including another
    // merchant's — and write a quantity into it.
    const scope = await resolveLocationScope(session.user, "write");
    const ownLocationIds = await allowedLocationIds(scope);

    const results: Array<{
      success: boolean;
      productId: string;
      variantId?: string;
      error?: string;
    }> = [];

    for (const update of updates) {
      const { productId, variantId, quantity, locationId, adjustment } = update;

      if (!productId) {
        results.push({
          success: false,
          productId: "",
          error: "productId is required",
        });
        continue;
      }
      if (locationId && !ownLocationIds.has(String(locationId))) {
        results.push({
          success: false,
          productId,
          variantId,
          error: "Location does not belong to this store",
        });
        continue;
      }
      if (
        locationId &&
        access.staffScope?.locationIds.length &&
        !access.staffScope.locationIds.includes(String(locationId))
      ) {
        results.push({
          success: false,
          productId,
          variantId,
          error: "Location is outside this staff member's assigned scope",
        });
        continue;
      }

      try {
        // Guarded compare-and-swap update: never read-modify-write the product
        // document here — a document save() would clobber any sale that lands
        // concurrently (its $inc would be overwritten by the stale array $set).
        const outcome = await applyStockChangeAtomic({
          productId: String(productId),
          variantId: variantId ? String(variantId) : undefined,
          locationId: locationId ? String(locationId) : undefined,
          quantity: Number(quantity),
          adjustment: Boolean(adjustment),
          scopeFilter: mergeScopeFilter(
            {},
            buildStaffProductScopeFilter(access.staffScope),
          ),
        });
        results.push({
          success: outcome.success,
          productId,
          variantId,
          ...(outcome.error ? { error: outcome.error } : {}),
        });
      } catch (err) {
        results.push({
          success: false,
          productId,
          variantId,
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    // applyStockChangeAtomic (unlike the order decrement/restore paths) does not
    // self-invalidate, so a manual stock edit would otherwise leave the
    // storefront out-of-stock / availability badges stale for up to the 60s
    // cache window (oversell risk). Bust the products tag once per bulk request.
    if (successCount > 0) {
      revalidateProductContent();
    }

    return successResponse({
      results,
      summary: {
        total: results.length,
        success: successCount,
        failed: failCount,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
