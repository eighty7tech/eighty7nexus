import { successResponse, errorResponse } from "@/lib/api/response";
import { withApi } from "@/lib/api/handler";
import { WholesaleProfile } from "@/models/wholesale-profile.model";
import { Order } from "@/models/order.model";

/**
 * GET /api/admin/wholesale/dashboard
 *
 * Retrieves the comprehensive B2B portal dashboard data for the admin.
 * Includes metrics for the current month vs the previous month.
 */
export const GET = withApi(
  { auth: "admin" },
  async () => {
    try {
      const now = new Date();
      
      const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      
      // 1. Fetch Gross Volume (Orders with net_terms or from wholesale buyers)
      // For simplicity, we define B2B volume as orders with paymentMethod "net_terms".
      const currentMonthOrders = await Order.find({
        paymentMethod: "net_terms",
        createdAt: { $gte: startOfCurrentMonth },
      }).select("total");
      
      const lastMonthOrders = await Order.find({
        paymentMethod: "net_terms",
        createdAt: { $gte: startOfLastMonth, $lt: startOfCurrentMonth },
      }).select("total");

      const currentGrossVolume = currentMonthOrders.reduce((sum, order) => sum + (order.total || 0), 0);
      const lastGrossVolume = lastMonthOrders.reduce((sum, order) => sum + (order.total || 0), 0);
      
      let volumeTrend = 0;
      if (lastGrossVolume > 0) {
        volumeTrend = ((currentGrossVolume - lastGrossVolume) / lastGrossVolume) * 100;
      } else if (currentGrossVolume > 0) {
        volumeTrend = 100; // 100% increase if last month was 0 and this month > 0
      }

      // 2. Active Accounts
      const activeAccountsCount = await WholesaleProfile.countDocuments({ status: "approved" });

      // 3. Pending Applications
      const pendingApplicationsCount = await WholesaleProfile.countDocuments({ status: "pending_review" });

      // 4. Credit Extended
      // Sum of outstandingBalance for all approved profiles
      const creditExtendedAgg = await WholesaleProfile.aggregate([
        { $match: { status: "approved" } },
        { $group: { _id: null, total: { $sum: "$outstandingBalance" } } }
      ]);
      const creditExtended = creditExtendedAgg.length > 0 ? creditExtendedAgg[0].total : 0;

      const dashboardData = {
        metrics: {
          grossVolume: currentGrossVolume,
          grossVolumeTrend: volumeTrend,
          activeAccounts: activeAccountsCount,
          pendingApplications: pendingApplicationsCount,
          creditExtended: creditExtended,
        }
      };

      return successResponse(dashboardData, "Admin Wholesale Dashboard data loaded");
    } catch (error) {
      console.error("Admin Wholesale Dashboard Error:", error);
      return errorResponse("Failed to load dashboard data", 500);
    }
  }
);
