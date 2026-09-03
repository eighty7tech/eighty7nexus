/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { CustomerProfile } from "@/models/customer-profile.model";
import { LoyaltyTransaction } from "@/models";
import { User } from "@/models/user.model";

export async function GET(req: Request) {
  try {
    // Mocked auth
    const session = { user: { role: "ADMIN" } };
    if (!session || !["ADMIN", "SUPERADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    
    // Dashboard Stats
    const totalMembers = await CustomerProfile.countDocuments({ loyaltyPoints: { $exists: true } });
    
    const pointsData = await CustomerProfile.aggregate([
      {
        $group: {
          _id: null,
          totalPointsIssued: { $sum: "$lifetimePoints" },
          totalPointsActive: { $sum: "$loyaltyPoints" }
        }
      }
    ]);
    
    const stats = {
      totalMembers,
      totalPointsIssued: pointsData[0]?.totalPointsIssued || 0,
      totalPointsActive: pointsData[0]?.totalPointsActive || 0,
      totalPointsRedeemed: (pointsData[0]?.totalPointsIssued || 0) - (pointsData[0]?.totalPointsActive || 0)
    };

    // Top Members
    const topMembers = await CustomerProfile.find()
      .sort({ loyaltyPoints: -1 })
      .limit(10)
      .populate("userId", "firstName lastName email");

    // Recent Transactions
    const recentTransactions = await LoyaltyTransaction.find()
      .sort({ createdAt: -1 })
      .limit(20)
      .populate("userId", "firstName lastName email");

    return NextResponse.json({ stats, topMembers, recentTransactions });
  } catch (error) {
    console.error("Loyalty API error:", error);
    return NextResponse.json({ error: "Failed to fetch loyalty data" }, { status: 500 });
  }
}
