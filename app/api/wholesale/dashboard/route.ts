import { successResponse, errorResponse } from "@/lib/api/response";
import { withApi } from "@/lib/api/handler";
import { WholesaleProfile } from "@/models/wholesale-profile.model";
import { WholesaleTier } from "@/models/wholesale-tier.model";
import { Order } from "@/models/order.model";

/**
 * GET /api/wholesale/dashboard
 *
 * Retrieves the comprehensive B2B portal dashboard data for an authenticated
 * wholesale buyer. This includes their profile, credit metrics, and any open
 * Net Terms invoices.
 */
export const GET = withApi(
  { auth: "user" },
  async ({ session }) => {
    // 1. Fetch the approved profile, populating the tier to get discount info
    const profile = await WholesaleProfile.findOne({
      userId: session.user.id,
      status: "approved",
    })
      .populate({ path: "tierId", model: WholesaleTier, select: "name defaultDiscountPercentage" })
      .lean();

    if (!profile) {
      return errorResponse("No approved wholesale profile found", 403);
    }

    // 2. Fetch pending invoices (Orders with net_terms that are not fully paid)
    // We assume paymentStatus "pending" or "partial" for open invoices
    const openOrders = await Order.find({
      customerId: session.user.id,
      paymentMethod: "net_terms",
      paymentStatus: { $ne: "paid" }, // or whatever the exact enum values are; checking for not paid
    })
      .sort({ createdAt: -1 })
      .select("orderNumber subtotal total createdAt items")
      .lean();

    // Transform orders into an invoices shape for the frontend
    const invoices = openOrders.map((order: any) => {
      // Net terms typically gives 15/30/60 days. Calculate a naive due date based on paymentTerms
      const daysToPay = profile.paymentTerms === "net60" ? 60 
                      : profile.paymentTerms === "net30" ? 30 
                      : profile.paymentTerms === "net15" ? 15 
                      : 0;
      
      const orderDate = new Date(order.createdAt);
      const dueDate = new Date(orderDate.getTime() + daysToPay * 24 * 60 * 60 * 1000);
      
      // Calculate total item count
      const itemsCount = (order.items || []).reduce((acc: number, item: any) => acc + (item.quantity || 1), 0);

      return {
        id: `INV-${order.orderNumber}`,
        orderId: order.orderNumber,
        amount: order.total || order.subtotal || 0,
        dueDate: dueDate.toISOString().split("T")[0],
        status: "pending", // Hardcoded to pending since we queried for not paid
        items: itemsCount,
        orderData: order, // Store raw order data for 1-Click Reorder
      };
    });

    // 3. Construct the profile representation for the UI
    const dashboardData = {
      profile: {
        companyName: profile.companyName,
        tierName: (profile.tierId as any)?.name || "Standard Wholesale",
        discountPercentage: profile.customDiscountPercentage || (profile.tierId as any)?.defaultDiscountPercentage || 0,
        creditLimit: profile.creditLimit || 0,
        availableCredit: profile.availableCredit || 0,
        outstandingBalance: profile.outstandingBalance || 0,
        paymentTerms: profile.paymentTerms,
        accountRep: profile.accountRepName || "General B2B Support",
        accountRepEmail: profile.accountRepEmail || "b2b@eighty7nexus.com",
      },
      invoices,
    };

    return successResponse(dashboardData, "Dashboard data loaded");
  },
);
