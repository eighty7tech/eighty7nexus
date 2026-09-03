import { InventoryLocation } from "@/models/inventory-location.model";
import { withApi } from "@/lib/api/handler";
import { successResponse } from "@/lib/api/response";

export const GET = withApi(
  { auth: "optional" },
  async () => {
    // Return all active branches (locations) for the public storefront branch selector
    const branches = await InventoryLocation.find({ isActive: true })
      .select("name slug _id")
      .sort({ name: 1 })
      .lean();
      
    return successResponse(branches);
  }
);
