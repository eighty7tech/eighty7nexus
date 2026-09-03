import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Order } from "@/models/order.model";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

/**
 * GET /api/pos/reports/daily
 * Aggregates real-time sales telemetry, hourly pulse, tender distribution,
 * cashier velocity, and top-moving products for the POS analytics station.
 */
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    const user = session.user;

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const orders = await Order.find({
      createdAt: { $gte: startOfDay },
      status: { $ne: "cancelled" },
    }).lean();

    let totalSales = 0;
    let itemsSoldCount = 0;
    const hourlyMap = new Map<number, { revenue: number; orders: number }>();
    const tenderMap = new Map<string, number>();
    const cashierMap = new Map<string, { revenue: number; orders: number }>();
    const productMap = new Map<string, { name: string; quantity: number; revenue: number }>();

    // Initialize 24 hours
    for (let h = 0; h < 24; h++) {
      hourlyMap.set(h, { revenue: 0, orders: 0 });
    }

    for (const order of orders) {
      const orderTotal = Number(order.total) || 0;
      totalSales += orderTotal;

      // Hourly
      const orderDate = new Date(order.createdAt);
      const hour = orderDate.getHours();
      const currentHourly = hourlyMap.get(hour) || { revenue: 0, orders: 0 };
      currentHourly.revenue += orderTotal;
      currentHourly.orders += 1;
      hourlyMap.set(hour, currentHourly);

      // Tender Method
      const method = (order as unknown as { paymentMethod?: string }).paymentMethod || "cash";
      tenderMap.set(method, (tenderMap.get(method) || 0) + orderTotal);

      // Cashier
      const cashierName =
        (order as unknown as { posMetadata?: { cashierName?: string } }).posMetadata?.cashierName ||
        "Staff Cashier";
      const currentCashier = cashierMap.get(cashierName) || { revenue: 0, orders: 0 };
      currentCashier.revenue += orderTotal;
      currentCashier.orders += 1;
      cashierMap.set(cashierName, currentCashier);

      // Items
      if (Array.isArray(order.items)) {
        for (const item of order.items) {
          const qty = Number(item.quantity) || 1;
          itemsSoldCount += qty;
          const prodKey = String(item.productId || item.name);
          const currentProd = productMap.get(prodKey) || {
            name: item.name,
            quantity: 0,
            revenue: 0,
          };
          currentProd.quantity += qty;
          currentProd.revenue += (Number(item.price) || 0) * qty;
          productMap.set(prodKey, currentProd);
        }
      }
    }

    const orderCount = orders.length;
    const avgBasket = orderCount > 0 ? totalSales / orderCount : 0;

    const hourlyPulse = Array.from(hourlyMap.entries()).map(([hour, data]) => ({
      hour,
      label: `${hour.toString().padStart(2, "0")}:00`,
      revenue: Math.round(data.revenue * 100) / 100,
      orders: data.orders,
    }));

    const tenderMix = Array.from(tenderMap.entries()).map(([method, amount]) => ({
      method,
      amount: Math.round(amount * 100) / 100,
      percentage: totalSales > 0 ? Math.round((amount / totalSales) * 100) : 0,
    }));

    const cashierLeaderboard = Array.from(cashierMap.entries())
      .map(([name, data]) => ({
        name,
        revenue: Math.round(data.revenue * 100) / 100,
        orders: data.orders,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    const topProducts = Array.from(productMap.values())
      .map((p) => ({
        ...p,
        revenue: Math.round(p.revenue * 100) / 100,
      }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    return NextResponse.json({
      success: true,
      data: {
        totalSales: Math.round(totalSales * 100) / 100,
        orderCount,
        avgBasket: Math.round(avgBasket * 100) / 100,
        itemsSoldCount,
        hourlyPulse,
        tenderMix,
        cashierLeaderboard,
        topProducts,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Failed to generate daily POS report:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load reports" },
      { status: 500 },
    );
  }
}
