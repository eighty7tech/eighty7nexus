/**
 * Predictive Inventory & Demand Sensing Forecaster
 * Evaluates historical sales velocity across 30/60/90-day rolling windows,
 * calculates stockout depletion horizon, reorder recommendations, and dead-stock alerts.
 */

import { connectDB } from "@/lib/db";
import { Product } from "@/models/product.model";
import { Order } from "@/models/order.model";

export type ReorderUrgency = "CRITICAL" | "HIGH" | "MEDIUM" | "HEALTHY" | "DEAD_STOCK";

export interface SkuDemandForecast {
  productId: string;
  name: string;
  sku: string;
  currentStock: number;
  dailyVelocity: number; // units/day
  projectedDaysUntilStockout: number | null;
  urgency: ReorderUrgency;
  recommendedReorderQty: number;
  isDeadStock: boolean;
  suggestedLiquidationDiscount?: number;
  last30DaysSalesUnits: number;
  last30DaysRevenue: number;
}

export interface DemandForecastSummary {
  analyzedSkusCount: number;
  criticalSkusCount: number;
  highUrgencyCount: number;
  deadStockCount: number;
  totalAtRiskRevenue: number;
  forecasts: SkuDemandForecast[];
  generatedAt: Date;
}

/**
 * Computes demand forecasting and stockout depletion horizons for active store products.
 */
export async function calculateDemandForecast(params: {
  vendorId?: string;
  targetSafetyDays?: number; // Target days of inventory buffer (default 30 days)
  supplierLeadTimeDays?: number; // Days supplier takes to fulfill (default 7 days)
  limit?: number;
}): Promise<DemandForecastSummary> {
  await connectDB();

  const safetyDays = params.targetSafetyDays || 30;
  const leadTimeDays = params.supplierLeadTimeDays || 7;
  const maxLimit = params.limit || 50;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // 1. Fetch recent order item aggregations for 30 days
  const orderMatch: Record<string, unknown> = {
    createdAt: { $gte: thirtyDaysAgo },
    paymentStatus: "paid",
  };
  if (params.vendorId) {
    orderMatch.vendorId = params.vendorId;
  }

  const salesAggregation = await Order.aggregate([
    { $match: orderMatch },
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.productId",
        totalUnits: { $sum: "$items.quantity" },
        totalRevenue: { $sum: { $multiply: ["$items.quantity", "$items.price"] } },
      },
    },
  ]);

  const salesMap = new Map<string, { totalUnits: number; totalRevenue: number }>();
  salesAggregation.forEach((row) => {
    if (row._id) {
      salesMap.set(String(row._id), {
        totalUnits: row.totalUnits || 0,
        totalRevenue: row.totalRevenue || 0,
      });
    }
  });

  // 2. Fetch products
  const productFilter: Record<string, unknown> = { status: "active" };
  if (params.vendorId) {
    productFilter.vendorId = params.vendorId;
  }

  const products = await Product.find(productFilter)
    .select("_id name sku stock price costPrice")
    .limit(maxLimit)
    .lean();

  let criticalCount = 0;
  let highUrgencyCount = 0;
  let deadStockCount = 0;
  let totalAtRiskRevenue = 0;

  const forecasts: SkuDemandForecast[] = products.map((p) => {
    const pId = String(p._id);
    const salesData = salesMap.get(pId) || { totalUnits: 0, totalRevenue: 0 };
    const unitsSold = salesData.totalUnits;
    const dailyVelocity = Math.round((unitsSold / 30) * 100) / 100;
    const currentStock = p.stock || 0;

    let daysRemaining: number | null = null;
    let urgency: ReorderUrgency = "HEALTHY";
    let isDeadStock = false;
    let suggestedDiscount: number | undefined = undefined;

    if (dailyVelocity > 0) {
      daysRemaining = Math.round(currentStock / dailyVelocity);

      if (daysRemaining <= leadTimeDays) {
        urgency = "CRITICAL";
        criticalCount += 1;
        totalAtRiskRevenue += (p.price || 0) * (dailyVelocity * safetyDays);
      } else if (daysRemaining <= safetyDays) {
        urgency = "HIGH";
        highUrgencyCount += 1;
      } else if (daysRemaining <= safetyDays * 1.5) {
        urgency = "MEDIUM";
      } else {
        urgency = "HEALTHY";
      }
    } else {
      // 0 sales in 30 days with sitting stock = Dead Stock
      if (currentStock > 10) {
        urgency = "DEAD_STOCK";
        isDeadStock = true;
        deadStockCount += 1;
        suggestedDiscount = 25; // 25% recommended promotional discount to liberate capital
      }
    }

    // Recommended reorder quantity formula: (Safety Days + Lead Time) * Daily Velocity - Current Stock
    const idealStock = Math.ceil((safetyDays + leadTimeDays) * dailyVelocity);
    const recommendedReorderQty = Math.max(0, idealStock - currentStock);

    return {
      productId: pId,
      name: p.name || "Product",
      sku: p.sku || pId.substring(0, 8).toUpperCase(),
      currentStock,
      dailyVelocity,
      projectedDaysUntilStockout: daysRemaining,
      urgency,
      recommendedReorderQty,
      isDeadStock,
      suggestedLiquidationDiscount: suggestedDiscount,
      last30DaysSalesUnits: unitsSold,
      last30DaysRevenue: salesData.totalRevenue,
    };
  });

  // Sort forecasts by urgency priority (Critical -> High -> Dead Stock -> Medium -> Healthy)
  const urgencyWeight: Record<ReorderUrgency, number> = {
    CRITICAL: 1,
    HIGH: 2,
    DEAD_STOCK: 3,
    MEDIUM: 4,
    HEALTHY: 5,
  };
  forecasts.sort((a, b) => urgencyWeight[a.urgency] - urgencyWeight[b.urgency]);

  return {
    analyzedSkusCount: products.length,
    criticalSkusCount: criticalCount,
    highUrgencyCount,
    deadStockCount,
    totalAtRiskRevenue: Math.round(totalAtRiskRevenue * 100) / 100,
    forecasts,
    generatedAt: new Date(),
  };
}
