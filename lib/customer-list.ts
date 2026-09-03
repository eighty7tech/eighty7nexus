import type { PipelineStage } from "mongoose";
import { CustomerProfile, Order } from "@/models";
import { connectDB } from "@/lib/db";
import { USER_ACCOUNT_STATUS } from "@/config/app.config";
import { listResult, type ListResult } from "@/lib/api/list-query";
import {
  buildStaffOrderScopeFilter,
  hasStaffScope,
  type StaffAccessScope,
} from "@/lib/staff-scope";

/**
 * Admin/staff customer list query.
 *
 * Shared by `GET /api/admin/customers` and the customers page's server
 * component so the endpoint and the rendered page always agree on what a
 * given query string means.
 */

export interface AdminCustomerListParams {
  page: number;
  limit: number;
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  loyaltyTier?: string;
  tag?: string;
  minSpent?: number;
  maxSpent?: number;
}

/** User fields the customer list can sort by; they live behind the join. */
const USER_SORT_FIELDS = new Set(["name", "email", "status"]);

const USER_LOOKUP: PipelineStage = {
  $lookup: {
    from: "user",
    localField: "userId",
    foreignField: "_id",
    as: "user",
    pipeline: [
      {
        $project: {
          name: 1,
          email: 1,
          image: 1,
          phone: 1,
          role: 1,
          status: 1,
          createdAt: 1,
        },
      },
    ],
  },
};

function matchStage(
  conditions: Record<string, unknown>[],
): PipelineStage | null {
  if (conditions.length === 1) return { $match: conditions[0] };
  if (conditions.length > 1) return { $match: { $and: conditions } };
  return null;
}

export interface AdminCustomerStats {
  totalCustomers: number;
  activeCustomers: number;
  vipCustomers: number;
  totalSpend: number;
  avgSpendPerCustomer: number;
}

/**
 * Counters for the customers stats strip.
 *
 * One pass instead of the four-branch `$facet` this replaced (whose
 * sub-pipelines cannot use an index, and which re-ran the user `$lookup`
 * inside one branch). The staff page carried its own copy that matched
 * `status` and summed `totalSpend` — neither field exists on CustomerProfile,
 * so it reported 0 active customers and 0 spend; sharing this one fixes that.
 */
export async function fetchAdminCustomerStats(): Promise<AdminCustomerStats> {
  await connectDB();

  const [result] = await CustomerProfile.aggregate([
    {
      $lookup: {
        from: "user",
        localField: "userId",
        foreignField: "_id",
        as: "user",
        pipeline: [{ $project: { status: 1 } }],
      },
    },
    { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: null,
        totalCustomers: { $sum: 1 },
        activeCustomers: {
          $sum: {
            $cond: [
              {
                $in: [
                  { $ifNull: ["$user.status", USER_ACCOUNT_STATUS.ACTIVE] },
                  [USER_ACCOUNT_STATUS.ACTIVE],
                ],
              },
              1,
              0,
            ],
          },
        },
        vipCustomers: {
          $sum: {
            $cond: [{ $in: ["$loyaltyTier", ["gold", "platinum"]] }, 1, 0],
          },
        },
        totalSpend: { $sum: { $ifNull: ["$stats.totalSpent", 0] } },
      },
    },
  ]);

  const totalCustomers = result?.totalCustomers ?? 0;
  const totalSpend = result?.totalSpend ?? 0;

  return {
    totalCustomers,
    activeCustomers: result?.activeCustomers ?? 0,
    vipCustomers: result?.vipCustomers ?? 0,
    totalSpend,
    avgSpendPerCustomer: totalCustomers > 0 ? totalSpend / totalCustomers : 0,
  };
}

export async function fetchAdminCustomerList(
  params: AdminCustomerListParams,
  staffScope?: StaffAccessScope | null,
): Promise<ListResult<unknown>> {
  await connectDB();

  const {
    page,
    limit,
    search,
    status,
    sortBy,
    sortOrder,
    loyaltyTier,
    tag,
    minSpent,
    maxSpent,
  } = params;

  const profileConditions: Record<string, unknown>[] = [];
  const userConditions: Record<string, unknown>[] = [];

  if (hasStaffScope(staffScope)) {
    const customerIds = await Order.distinct(
      "customerId",
      buildStaffOrderScopeFilter(staffScope),
    );
    profileConditions.push({ userId: { $in: customerIds } });
  }
  if (loyaltyTier) profileConditions.push({ loyaltyTier });
  if (tag) profileConditions.push({ tags: tag });
  if (minSpent !== undefined || maxSpent !== undefined) {
    const totalSpentFilter: Record<string, number> = {};
    if (minSpent !== undefined) totalSpentFilter.$gte = minSpent;
    if (maxSpent !== undefined) totalSpentFilter.$lte = maxSpent;
    profileConditions.push({ "stats.totalSpent": totalSpentFilter });
  }

  if (search) {
    userConditions.push({
      $or: [
        { "user.name": { $regex: search, $options: "i" } },
        { "user.email": { $regex: search, $options: "i" } },
      ],
    });
  }
  if (
    status &&
    status !== "all" &&
    Object.values(USER_ACCOUNT_STATUS).includes(
      status as (typeof USER_ACCOUNT_STATUS)[keyof typeof USER_ACCOUNT_STATUS],
    )
  ) {
    if (status === USER_ACCOUNT_STATUS.ACTIVE) {
      // Legacy users without status should behave like active accounts.
      userConditions.push({
        $or: [
          { "user.status": USER_ACCOUNT_STATUS.ACTIVE },
          { "user.status": { $exists: false } },
          { "user.status": null },
        ],
      });
    } else {
      userConditions.push({ "user.status": status });
    }
  }

  const sortField = sortBy || "createdAt";
  const sortDir = sortOrder === "asc" ? 1 : -1;
  // The user join is expensive, so partition the work: anything on the
  // CustomerProfile itself is matched/sorted/paginated BEFORE the $lookup so
  // only the page of rows we return gets joined. Only a user-field filter or
  // sort forces the join first.
  const needsUserBeforePage =
    userConditions.length > 0 || USER_SORT_FIELDS.has(sortField);

  const pipeline: PipelineStage[] = [];
  const countPipeline: PipelineStage[] = [];
  const profileMatch = matchStage(profileConditions);
  if (profileMatch) {
    pipeline.push(profileMatch);
    countPipeline.push(profileMatch);
  }

  if (needsUserBeforePage) {
    const userMatch = matchStage(userConditions);
    pipeline.push(USER_LOOKUP, { $unwind: "$user" });
    countPipeline.push(USER_LOOKUP, { $unwind: "$user" });
    if (userMatch) {
      pipeline.push(userMatch);
      countPipeline.push(userMatch);
    }
    // User fields live under the unwound `user` subdocument here — sorting on
    // the bare field name would match nothing (all docs missing → no-op).
    const effectiveSortField = USER_SORT_FIELDS.has(sortField)
      ? `user.${sortField}`
      : sortField;
    pipeline.push({ $sort: { [effectiveSortField]: sortDir, _id: sortDir } });
    pipeline.push({ $skip: (page - 1) * limit }, { $limit: limit });
  } else {
    pipeline.push({ $sort: { [sortField]: sortDir, _id: sortDir } });
    pipeline.push({ $skip: (page - 1) * limit }, { $limit: limit });
    pipeline.push(USER_LOOKUP, { $unwind: "$user" });
  }
  countPipeline.push({ $count: "total" });

  const [customers, countResult] = await Promise.all([
    CustomerProfile.aggregate(pipeline),
    CustomerProfile.aggregate(countPipeline),
  ]);

  return listResult(
    customers as unknown[],
    page,
    limit,
    countResult[0]?.total || 0,
  );
}
