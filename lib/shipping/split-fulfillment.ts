/**
 * Intelligent Split-Fulfillment Routing Hub
 * Optimizes multi-warehouse fulfillment allocation based on stock availability,
 * haversine geographical distance, and carrier cost minimization.
 */

import { calculateDistanceKm } from "@/lib/haversine";

export interface WarehouseLocation {
  id: string;
  name: string;
  code: string;
  latitude?: number;
  longitude?: number;
  isFulfillmentHub: boolean;
  stockBySku: Record<string, number>; // sku -> available quantity
}

export interface SplitOrderItem {
  id: string;
  sku: string;
  name: string;
  quantity: number;
  weightKg?: number;
  unitPrice: number;
}

export interface SplitPackage {
  packageIndex: number;
  assignedLocationId: string;
  assignedLocationName: string;
  distanceKm?: number;
  items: SplitOrderItem[];
  totalWeightKg: number;
  estimatedFulfillmentDays: number;
}

export interface SplitRoutingResult {
  isSplit: boolean;
  packageCount: number;
  packages: SplitPackage[];
  unfulfilledItems: SplitOrderItem[];
  recommendation: "SINGLE_WAREHOUSE" | "MULTI_WAREHOUSE_SPLIT" | "INTER_BRANCH_TRANSFER_CONSOLIDATION";
}

/**
 * Calculates optimal split-fulfillment allocation for multi-item customer orders.
 */
export function calculateSplitFulfillment(params: {
  items: SplitOrderItem[];
  warehouses: WarehouseLocation[];
  customerCoordinates?: { latitude: number; longitude: number };
}): SplitRoutingResult {
  const { items, warehouses, customerCoordinates } = params;

  // 1. Sort warehouses by proximity to customer (if coordinates available)
  const sortedWarehouses = [...warehouses].sort((a, b) => {
    if (!customerCoordinates || !a.latitude || !b.latitude || !a.longitude || !b.longitude) {
      return 0;
    }
    const distA = calculateDistanceKm(
      customerCoordinates.latitude,
      customerCoordinates.longitude,
      a.latitude,
      a.longitude,
    );
    const distB = calculateDistanceKm(
      customerCoordinates.latitude,
      customerCoordinates.longitude,
      b.latitude,
      b.longitude,
    );
    return distA - distB;
  });

  // 2. Check if a single warehouse has 100% of the requested stock
  for (const wh of sortedWarehouses) {
    const hasAll = items.every((it) => (wh.stockBySku[it.sku] || 0) >= it.quantity);
    if (hasAll) {
      const distance =
        customerCoordinates && wh.latitude && wh.longitude
          ? Math.round(
              calculateDistanceKm(
                customerCoordinates.latitude,
                customerCoordinates.longitude,
                wh.latitude,
                wh.longitude,
              ) * 10,
            ) / 10
          : undefined;

      return {
        isSplit: false,
        packageCount: 1,
        packages: [
          {
            packageIndex: 1,
            assignedLocationId: wh.id,
            assignedLocationName: wh.name,
            distanceKm: distance,
            items: [...items],
            totalWeightKg: items.reduce((sum, it) => sum + (it.weightKg || 0.5) * it.quantity, 0),
            estimatedFulfillmentDays: distance && distance > 500 ? 3 : 1,
          },
        ],
        unfulfilledItems: [],
        recommendation: "SINGLE_WAREHOUSE",
      };
    }
  }

  // 3. Multi-warehouse greedy split allocation
  const remainingDemands: Record<string, number> = {};
  items.forEach((it) => {
    remainingDemands[it.sku] = it.quantity;
  });

  const packages: SplitPackage[] = [];
  let packageCounter = 1;

  for (const wh of sortedWarehouses) {
    const packageItems: SplitOrderItem[] = [];

    for (const item of items) {
      const needed = remainingDemands[item.sku] || 0;
      if (needed <= 0) continue;

      const availableInWh = wh.stockBySku[item.sku] || 0;
      if (availableInWh > 0) {
        const allocated = Math.min(needed, availableInWh);
        packageItems.push({
          ...item,
          quantity: allocated,
        });
        remainingDemands[item.sku] = needed - allocated;
      }
    }

    if (packageItems.length > 0) {
      const distance =
        customerCoordinates && wh.latitude && wh.longitude
          ? Math.round(
              calculateDistanceKm(
                customerCoordinates.latitude,
                customerCoordinates.longitude,
                wh.latitude,
                wh.longitude,
              ) * 10,
            ) / 10
          : undefined;

      packages.push({
        packageIndex: packageCounter++,
        assignedLocationId: wh.id,
        assignedLocationName: wh.name,
        distanceKm: distance,
        items: packageItems,
        totalWeightKg: packageItems.reduce(
          (sum, it) => sum + (it.weightKg || 0.5) * it.quantity,
          0,
        ),
        estimatedFulfillmentDays: distance && distance > 500 ? 4 : 2,
      });
    }

    const allFulfilled = Object.values(remainingDemands).every((qty) => qty === 0);
    if (allFulfilled) break;
  }

  // 4. Identify any unfulfillable items
  const unfulfilledItems: SplitOrderItem[] = [];
  for (const item of items) {
    const unfulfilledQty = remainingDemands[item.sku] || 0;
    if (unfulfilledQty > 0) {
      unfulfilledItems.push({
        ...item,
        quantity: unfulfilledQty,
      });
    }
  }

  const isSplit = packages.length > 1;

  return {
    isSplit,
    packageCount: packages.length,
    packages,
    unfulfilledItems,
    recommendation: isSplit
      ? "MULTI_WAREHOUSE_SPLIT"
      : "SINGLE_WAREHOUSE",
  };
}
