import type { Types } from "mongoose";
import { User, StaffProfile } from "@/models";
import { connectDB } from "@/lib/db";
import { STAFF_USER_ROLES } from "@/lib/staff-role";
import { getVendorScopedStaffUserIds } from "@/lib/admin-staff-scope";
import {
  countForQuery,
  listResult,
  type ListResult,
} from "@/lib/api/list-query";

/**
 * Staff list query.
 *
 * Shared by `GET /api/admin/staff`, `GET /api/vendor/staff` and the staff
 * pages' server components so every caller reads a query string the same way.
 *
 * The two dashboards see disjoint sets: a vendor sees the staff assigned to
 * its own store, the admin sees platform staff — explicitly *excluding*
 * vendor-owned staff, so a seller's employees never surface in the platform
 * list. That is the only difference; pass `vendorId` to get the vendor view.
 */

export interface StaffListParams {
  page: number;
  limit: number;
  search?: string;
  status?: string;
}

export interface StaffListContext {
  /** Present for the vendor dashboard; absent lists platform staff. */
  vendorId?: Types.ObjectId | string;
}

function applyStatusFilter(
  query: Record<string, unknown>,
  status: string | undefined,
) {
  if (status === "active") {
    // Accounts predating the status field behave as active.
    query.status = { $in: ["active", null] };
  } else if (status === "inactive") {
    query.status = "inactive";
  } else if (status === "banned") {
    query.status = "banned";
  }
}

export async function fetchStaffList(
  params: StaffListParams,
  { vendorId }: StaffListContext = {},
): Promise<ListResult<unknown>> {
  await connectDB();

  const { page, limit, search, status } = params;
  const query: Record<string, unknown> = { role: { $in: STAFF_USER_ROLES } };

  // Vendor-owned staff are identified by their profile, so that lookup has to
  // happen before the user query in both directions.
  let scopedProfiles: Awaited<ReturnType<typeof StaffProfile.find>> | null = null;
  if (vendorId) {
    scopedProfiles = await StaffProfile.find({ vendorIds: vendorId }).lean();
    query._id = { $in: scopedProfiles.map((profile) => profile.userId) };
  } else {
    query._id = { $nin: await getVendorScopedStaffUserIds() };
  }

  // `search` arrives regex-escaped from SafeSearchSchema.
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }
  applyStatusFilter(query, status);

  const [users, total] = await Promise.all([
    User.find(query)
      .select("name email image phone status createdAt")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    countForQuery(User, query),
  ]);

  // Profiles carry the permissions/scope shown per row. The vendor path
  // already loaded them; the admin path resolves only the page being returned.
  const profiles =
    scopedProfiles ??
    (await StaffProfile.find({
      userId: { $in: users.map((user) => user._id) },
    }).lean());

  const profileByUserId = new Map(
    profiles.map((profile) => [String(profile.userId), profile]),
  );

  const items = users.map((user) => ({
    ...user,
    staffProfile: profileByUserId.get(String(user._id)) || null,
  }));

  return listResult(items as unknown[], page, limit, total);
}
