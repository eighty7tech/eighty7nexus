import { connectDB, mongoose } from "@/lib/db";
import { CustomerProfile, Order, Review, Wishlist } from "@/models";
import type { CustomerStats } from "@/types";
import {
  LOYALTY_TIER_SWITCH,
  computePointsFromOrder,
  computeRefundPointDelta,
} from "@/lib/loyalty";
import { type ClientSession, Types } from "mongoose";

// The rules themselves live in `lib/loyalty.ts`, which the admin customer form
// also imports — a client component cannot pull in this module's Mongoose
// dependencies. Re-exported so existing server-side importers are unaffected.
export {
  LOYALTY_THRESHOLDS,
  LOYALTY_TIER_SWITCH,
  computeLoyaltyTier,
  computePointsFromOrder,
  computeRefundPointDelta,
} from "@/lib/loyalty";

function isTransactionUnsupported(error: unknown): boolean {
  return (
    error instanceof Error &&
    /Transaction numbers are only allowed on a replica set member or mongos/i.test(
      error.message,
    )
  );
}

async function withLoyaltyTransaction<T>(
  work: (session: ClientSession | null) => Promise<T>,
): Promise<T> {
  await connectDB();
  const session = await mongoose.startSession();

  try {
    let result!: T;
    try {
      await session.withTransaction(async () => {
        result = await work(session);
      });
      return result;
    } catch (error) {
      // Local MongoDB instances commonly run without a replica set. The
      // guarded Order.updateOne claim below remains idempotent in that mode;
      // use it rather than dropping points for an otherwise successful payment.
      //
      // What this mode gives up is atomicity, and only in one direction: the
      // claim is written BEFORE the profile, so a failure between the two
      // leaves an order marked as awarded whose points never reached the
      // customer. That is the safe half of the trade — the reverse ordering
      // would double-credit on retry, which no later run could detect. The
      // stranded credit is recoverable: `scripts/backfill-loyalty-points.ts`
      // rebuilds profiles from the orders and restores it. On a replica set
      // (any production deployment) neither case arises.
      if (!isTransactionUnsupported(error)) throw error;
      return work(null);
    }
  } finally {
    await session.endSession();
  }
}

/**
 * Apply a balance change and derive its tier in one MongoDB write. This keeps
 * concurrent successful payments from leaving a stale loyalty tier behind.
 */
async function applyLoyaltyProfileDelta(
  userId: string,
  delta: number,
  session: ClientSession | null,
) {
  const userObjectId = new Types.ObjectId(userId);

  // Create any missing profile through a PLAIN upsert first. Mongoose applies
  // neither schema defaults nor timestamps to an aggregation-pipeline update,
  // so letting the pipeline below do the inserting produced a profile with no
  // `createdAt` — which the account page shows as "member since" and the admin
  // customer list sorts by — and none of the stats/notification defaults.
  // A no-op for the profile every registered customer already has.
  await CustomerProfile.updateOne(
    { userId: userObjectId },
    { $setOnInsert: { loyaltyPoints: 0, lifetimePoints: 0, loyaltyTier: "bronze" } },
    { upsert: true, session: session ?? undefined },
  );

  await CustomerProfile.updateOne(
    { userId: userObjectId },
    [
      {
        $set: {
          loyaltyPoints: {
            $max: [
              0,
              { $add: [{ $ifNull: ["$loyaltyPoints", 0] }, delta] },
            ],
          },
          lifetimePoints: {
            $max: [
              0,
              { $add: [{ $ifNull: ["$lifetimePoints", 0] }, delta] },
            ],
          },
          lastActiveAt: "$$NOW",
        },
      },
      { $set: { loyaltyTier: LOYALTY_TIER_SWITCH } },
    ],
    { session: session ?? undefined },
  );
}

/**
 * Award an order's whole-number points exactly once after its full payment has
 * been committed. The order's loyalty subdocument is the durable retry claim.
 */
export async function awardOrderLoyaltyPoints(orderId: string): Promise<number> {
  return withLoyaltyTransaction(async (session) => {
    const order = await Order.findById(orderId).session(session).lean();
    if (!order?.customerId || order.paymentStatus !== "paid") return 0;
    if (order.loyalty?.pointsAwarded !== undefined) return 0;

    const points = computePointsFromOrder(order.total);
    const claim = await Order.updateOne(
      {
        _id: order._id,
        paymentStatus: "paid",
        "loyalty.pointsAwarded": { $exists: false },
      },
      {
        $set: {
          "loyalty.pointsAwarded": points,
          "loyalty.pointsReversed": 0,
          "loyalty.awardedAt": new Date(),
        },
      },
      { session: session ?? undefined },
    );
    if (claim.matchedCount !== 1) return 0;

    if (points > 0) {
      await applyLoyaltyProfileDelta(String(order.customerId), points, session);
    }

    return points;
  });
}

/**
 * Reverse only the additional point amount implied by the order's cumulative
 * successful refunds. Re-running after the same refund is a no-op.
 */
export async function reverseOrderLoyaltyPoints(orderId: string): Promise<number> {
  return withLoyaltyTransaction(async (session) => {
    const order = await Order.findById(orderId).session(session).lean();
    if (!order?.customerId || order.loyalty?.pointsAwarded === undefined) {
      return 0;
    }

    const pointsReversed = order.loyalty.pointsReversed ?? 0;
    const delta = computeRefundPointDelta(
      order.loyalty.pointsAwarded,
      pointsReversed,
      order.refundedTotal ?? 0,
    );
    if (delta === 0) return 0;

    const claim = await Order.updateOne(
      {
        _id: order._id,
        "loyalty.pointsAwarded": order.loyalty.pointsAwarded,
        "loyalty.pointsReversed": pointsReversed,
      },
      {
        $set: {
          "loyalty.pointsReversed": pointsReversed + delta,
          "loyalty.lastReversedAt": new Date(),
        },
      },
      { session: session ?? undefined },
    );
    if (claim.matchedCount !== 1) return 0;

    await applyLoyaltyProfileDelta(String(order.customerId), -delta, session);
    return delta;
  });
}

/**
 * Ensure a customer profile exists for the given userId.
 * Creates one with defaults if it doesn't exist, then runs an initial stats refresh.
 */
export async function ensureCustomerProfile(userId: string) {
  await connectDB();

  let profile = await CustomerProfile.findOne({ userId }).lean();
  if (!profile) {
    profile = (
      await CustomerProfile.create({ userId: new Types.ObjectId(userId) })
    ).toObject();
    // Backfill stats for users who may already have orders/reviews/wishlists
    await refreshCustomerStats(userId);
    profile = await CustomerProfile.findOne({ userId }).lean();
  }
  return profile;
}

/**
 * Recompute and update cached stats from source collections (Order, Review, Wishlist).
 * Called after order completion, review creation, wishlist changes, etc.
 * Uses aggregation pipelines for efficiency.
 */
export async function refreshCustomerStats(userId: string) {
  await connectDB();

  const userObjectId = new Types.ObjectId(userId);

  const [orderStats, reviewStats, wishlist] = await Promise.all([
    Order.aggregate([
      {
        // Count money actually collected: unpaid pending orders inflated
        // totalSpent (10 abandoned COD checkouts looked like real revenue),
        // while paid gateway orders were the ones that mattered. COD orders
        // count once delivered even if payment is still marked pending.
        $match: {
          customerId: userObjectId,
          status: { $ne: "cancelled" },
          $or: [
            {
              paymentStatus: {
                $in: ["paid", "partially_paid", "partially_refunded", "refunded"],
              },
            },
            { status: "delivered" },
          ],
        },
      },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: "$total" },
          averageOrderValue: { $avg: "$total" },
          lastOrderDate: { $max: "$createdAt" },
        },
      },
    ]),
    Review.aggregate([
      { $match: { userId: userObjectId } },
      {
        $group: {
          _id: null,
          totalReviews: { $sum: 1 },
          averageRating: { $avg: "$rating" },
        },
      },
    ]),
    Wishlist.findOne({ userId }),
  ]);

  const orderData = orderStats[0] || {
    totalOrders: 0,
    totalSpent: 0,
    averageOrderValue: 0,
    lastOrderDate: null,
  };
  const reviewData = reviewStats[0] || {
    totalReviews: 0,
    averageRating: null,
  };

  const stats: CustomerStats = {
    totalOrders: orderData.totalOrders,
    totalSpent: Math.round(orderData.totalSpent * 100) / 100,
    averageOrderValue: Math.round(orderData.averageOrderValue * 100) / 100,
    lastOrderDate: orderData.lastOrderDate,
    totalReviews: reviewData.totalReviews,
    averageRating: reviewData.averageRating
      ? Math.round(reviewData.averageRating * 10) / 10
      : undefined,
    totalWishlistItems: wishlist?.items?.length || 0,
  };

  await CustomerProfile.findOneAndUpdate(
    { userId },
    { $set: { stats, lastActiveAt: new Date() } },
    { upsert: true },
  );

  return stats;
}
