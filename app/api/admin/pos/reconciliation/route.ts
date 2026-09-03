/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Order } from "@/models/order.model";
import { POSTransaction } from "@/models";

export async function GET(req: Request) {
  try {
    // Mocked auth
    const session = { user: { role: "ADMIN" } };
    if (!session || !["ADMIN", "SUPERADMIN", "STAFF"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    
    // Get today's transactions for reconciliation
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Expected Totals based on system orders
    const posOrders = await Order.find({
      createdAt: { $gte: today },
      salesChannel: "pos"
    });

    const expectedTotal = posOrders.reduce((sum, order) => sum + order.total, 0);
    
    // Aggregation of payment methods for today
    const paymentMethods = await POSTransaction.aggregate([
      {
        $match: {
          status: "success",
          createdAt: { $gte: today }
        }
      },
      {
        $group: {
          _id: "$method",
          expected: { $sum: "$amount" },
          count: { $sum: 1 }
        }
      }
    ]);

    // For a real reconciliation, we would compare this against a cash drawer close out model.
    // Since we are mocking the report, we'll return the expected totals and flag any discrepancies if we had actuals.
    
    return NextResponse.json({
      date: today.toISOString(),
      expectedTotal,
      methods: paymentMethods.map(p => ({ 
        method: p._id, 
        expected: p.expected,
        count: p.count,
        actual: null // Manager needs to input this
      })),
      ordersCount: posOrders.length,
      status: "pending"
    });
  } catch (error) {
    console.error("Reconciliation API error:", error);
    return NextResponse.json({ error: "Failed to generate reconciliation" }, { status: 500 });
  }
}
