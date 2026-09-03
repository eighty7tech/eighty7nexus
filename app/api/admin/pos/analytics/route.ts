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
    
    // Default to last 7 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    
    // Aggregations for Analytics
    const posOrders = await Order.find({
      createdAt: { $gte: startDate, $lte: endDate },
      salesChannel: "pos"
    });

    const totalSales = posOrders.reduce((sum, order) => sum + order.total, 0);
    const totalTransactions = posOrders.length;
    const avgOrderValue = totalTransactions > 0 ? totalSales / totalTransactions : 0;
    
    // Group sales by day
    const salesByDay = await Order.aggregate([
      { 
        $match: { 
          salesChannel: "pos",
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          sales: { $sum: "$total" },
          transactions: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    // Group by payment method (from Transactions)
    const paymentMethods = await POSTransaction.aggregate([
      {
        $match: {
          status: "success",
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: "$method",
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 }
        }
      }
    ]);

    return NextResponse.json({
      summary: {
        totalSales,
        totalTransactions,
        avgOrderValue
      },
      salesByDay: salesByDay.map(d => ({ date: d._id, sales: d.sales, transactions: d.transactions })),
      paymentMethods: paymentMethods.map(p => ({ method: p._id, amount: p.totalAmount, count: p.count }))
    });
  } catch (error) {
    console.error("POS Analytics API error:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
