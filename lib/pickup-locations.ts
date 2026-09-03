import "server-only";

/**
 * The branches a vendor's orders can be collected from.
 *
 * A pickup branch is an `InventoryLocation` with `pickupEnabled` set — the same
 * record the POS sells from and the same one stock is counted against. It used
 * to be a separate list embedded on the vendor document, which described the
 * same physical address twice: the two copies drifted, and neither knew about
 * the other, so "collect it from where the stock actually is" could not be
 * expressed at all.
 */

import { InventoryLocation } from "@/models/inventory-location.model";
import { PickupStation } from "@/models/pickup-stations.model";
import type { PickupHoursSettings } from "@/lib/pickup-hours";

export type PickupLocationSettings = PickupHoursSettings & {
  id: string;
  name: string;
};

type LocationRow = {
  _id: unknown;
  name?: string;
  address?: string;
  district?: string;
  region?: string;
  pickupArea?: string;
  instructions?: string;
  specialInstructions?: string;
  operatingHours?: string;
  weeklyHours?: Array<{
    weekday: number;
    enabled: boolean;
    start: string;
    end: string;
  }>;
};

/** The shape the checkout and availability paths read a branch through. */
function toPickupSettings(row: LocationRow): PickupLocationSettings {
  const fullAddress = (row.address || "").trim() ||
    [row.district, row.region].filter(Boolean).join(", ");

  return {
    id: String(row._id),
    name: (row.name || "").trim(),
    enabled: true,
    // A location's own address IS the pickup address — there is only one place.
    pickupAddress: fullAddress,
    pickupArea: row.pickupArea?.trim() || [row.district, row.region].filter(Boolean).join(", ") || undefined,
    instructions: (row.instructions || row.specialInstructions || "").trim() || undefined,
    weeklyHours: row.weeklyHours || [],
  };
}

/**
 * A vendor's collectable branches and platform pickup stations, ready for checkout.
 *
 * Only active, pickup-enabled locations that actually have an address: a branch
 * with nowhere to go is not somewhere a shopper can be sent, and offering it
 * would put an empty address on their order.
 */
export async function pickupLocationsForVendor(input: {
  vendorId: string;
}): Promise<PickupLocationSettings[]> {
  const locationQuery: Record<string, unknown> = {
    pickupEnabled: true,
    isActive: { $ne: false },
  };

  if (input.vendorId) {
    locationQuery.$or = [{ vendorId: input.vendorId }, { vendorId: { $exists: false } }, { vendorId: null }];
  }

  const [inventoryRows, stationRows] = await Promise.all([
    InventoryLocation.find(locationQuery)
      .select("_id name address pickupArea instructions weeklyHours")
      .sort({ isDefault: -1, name: 1 })
      .lean<LocationRow[]>(),
    PickupStation.find({ isActive: true })
      .select("_id name address district region phone operatingHours specialInstructions")
      .sort({ name: 1 })
      .lean<LocationRow[]>(),
  ]);

  const allSettings = [
    ...inventoryRows.map(toPickupSettings),
    ...stationRows.map(toPickupSettings),
  ];

  return allSettings.filter((location) => location.name && location.pickupAddress);
}
