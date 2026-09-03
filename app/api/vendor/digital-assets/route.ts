/**
 * POST /api/vendor/digital-assets
 *
 * Vendor upload of digital product deliverables to PRIVATE storage. Keys are
 * scoped under digital/v-<vendorId>/ — the vendor product save routes verify
 * every attached storageKey carries the caller's own scope, so one vendor
 * can never attach (and resell) another vendor's file.
 */

import { NextResponse } from "next/server";
import { withApi } from "@/lib/api/handler";
import { AuthorizationError, NotFoundError } from "@/lib/api/errors";
import { hasVendorPermission, isAdmin } from "@/lib/rbac";
import { VENDOR_PERMISSIONS } from "@/config/permissions.config";
import type { IUser } from "@/types";
import { requireApprovedVendorByUserId } from "@/lib/vendor-guard";
import { getSettings } from "@/models/settings.model";
import { digitalAssetKeyPrefix } from "@/lib/products/digital-assets";
import { uploadDigitalAssetFiles } from "@/lib/products/digital-asset-upload";

export const POST = withApi(
  {
    auth: "user",
    rateLimit: { action: "vendor:digital-assets:upload", preset: "moderate" },
  },
  async ({ request, session }) => {
    const user = session.user as unknown as IUser;
    const hasPermission = await hasVendorPermission(
      user,
      VENDOR_PERMISSIONS.CREATE_PRODUCTS,
    );
    if (!hasPermission && !isAdmin(user)) {
      throw new AuthorizationError(
        "You do not have permission to upload product files",
      );
    }

    const settings = await getSettings();
    if (!settings.multiVendorMode?.enabled) throw new NotFoundError("Vendor");

    const vendor = await requireApprovedVendorByUserId(session.user.id, {
      allowPaymentRequiredSetup: true,
    });
    if (!vendor) throw new AuthorizationError("Vendor profile not found");

    const formData = await request.formData();
    const files = [
      ...formData.getAll("files"),
      formData.get("file"),
    ].filter((f): f is File => f instanceof File);

    if (files.length === 0) {
      return NextResponse.json(
        { success: false, message: "No files provided" },
        { status: 400 },
      );
    }

    const { uploaded, errors } = await uploadDigitalAssetFiles(
      files,
      digitalAssetKeyPrefix(String(vendor._id)),
    );

    if (uploaded.length === 0) {
      return NextResponse.json(
        { success: false, message: "No valid files were uploaded", errors },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      data: uploaded,
      errors: errors.length > 0 ? errors : undefined,
    });
  },
);
