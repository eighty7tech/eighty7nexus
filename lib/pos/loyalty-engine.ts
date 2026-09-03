import { CustomerProfile } from "@/models/customer-profile.model";
import { LoyaltyTransaction } from "@/models/loyalty-transaction.model";
import { User } from "@/models/user.model";
import { POINTS_PER_DOLLAR, POINTS_REDEMPTION_VALUE, calculatePoints } from "./loyalty-constants";

export { POINTS_PER_DOLLAR, POINTS_REDEMPTION_VALUE, calculatePoints };

/**
 * Validates if a user has enough points for redemption.
 */
export async function validateRedemption(userId: string, pointsToRedeem: number): Promise<boolean> {
  const profile = await CustomerProfile.findOne({ userId });
  if (!profile) return false;
  
  return (profile.loyaltyPoints || 0) >= pointsToRedeem;
}

/**
 * Processes a loyalty point earn or redeem transaction.
 * Should be run in a database transaction if possible.
 */
export async function processLoyaltyTransaction(params: {
  userId: string;
  type: "earn" | "redeem" | "adjustment";
  points: number; // Positive for earn, negative for redeem
  orderId?: string;
  terminalId?: string;
  notes?: string;
}) {
  const { userId, type, points, orderId, terminalId, notes } = params;

  // 1. Verify user and profile
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  let profile = await CustomerProfile.findOne({ userId });
  if (!profile) {
    // Auto-create profile if missing
    profile = new CustomerProfile({
      userId,
      loyaltyPoints: 0,
      loyaltyTier: "bronze",
      lifetimePoints: 0,
    });
  }

  // 2. Validate redemption balance
  if (type === "redeem" && profile.loyaltyPoints + points < 0) {
    throw new Error("Insufficient loyalty points");
  }

  // 3. Update profile points
  profile.loyaltyPoints += points;
  if (points > 0 && type === "earn") {
    profile.lifetimePoints = (profile.lifetimePoints || 0) + points;
  }

  // 4. Update tiers based on lifetime points
  if (profile.lifetimePoints >= 10000) profile.loyaltyTier = "platinum";
  else if (profile.lifetimePoints >= 5000) profile.loyaltyTier = "gold";
  else if (profile.lifetimePoints >= 1000) profile.loyaltyTier = "silver";
  else profile.loyaltyTier = "bronze";

  await profile.save();

  // 5. Record transaction
  const transaction = new LoyaltyTransaction({
    userId,
    type,
    points,
    orderId,
    terminalId,
    syncStatus: "synced",
    notes,
  });
  
  await transaction.save();

  return { profile, transaction };
}
