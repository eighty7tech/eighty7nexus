import { connectDB } from "@/lib/db";
import { getSettings, Payout } from "@/models";
import type { IUser } from "@/types";
import { VENDOR_PERMISSIONS } from "@/config/permissions.config";
import { hasVendorPermission, isAdmin } from "@/lib/rbac";
import { requireApprovedVendorByUserId } from "@/lib/vendor-guard";
import { AuthorizationError, NotFoundError } from "@/lib/api/errors";
import { paginatedResponse } from "@/lib/api/response";
import { rateLimitByUser } from "@/lib/api/rate-limit-middleware";
import { withApi } from "@/lib/api/handler";
import { fetchPayoutList } from "@/lib/payout-list";

export const GET = withApi(
  { auth: "user" },
  async ({ request, session }) => {
    const user = session.user as unknown as IUser;
    const hasPermission = await hasVendorPermission(
      user,
      VENDOR_PERMISSIONS.VIEW_PAYOUTS,
    );
    if (!hasPermission && !isAdmin(user)) {
      throw new AuthorizationError("You do not have permission to view payouts");
    }

    await rateLimitByUser(
      request,
      session.user.id,
      "vendor:payouts:list",
      "lenient",
      session.user.role,
    );

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") || 20)));
    const status = (searchParams.get("status") || "all").trim().toLowerCase();
    const search = (searchParams.get("search") || "").trim();
    const sortBy = (searchParams.get("sortBy") || "createdAt").trim();
    const sortOrder = (searchParams.get("sortOrder") || "desc").trim();

    await connectDB();
    const settings = await getSettings();
    if (!settings.multiVendorMode?.enabled) throw new NotFoundError("Vendor");
    const vendor = await requireApprovedVendorByUserId(session.user.id);

    const list = await fetchPayoutList(
      {
        page,
        limit,
        search,
        status,
        sortBy,
        sortOrder: sortOrder === "asc" ? "asc" : "desc",
      },
      { vendorId: vendor._id },
    );

    return paginatedResponse(list.items, list.page, list.limit, list.total);
  },
);
