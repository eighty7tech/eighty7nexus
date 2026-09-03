import { mongoose } from "@/lib/db";
import { InventoryLocation } from "@/models/inventory-location.model";
import { withApi } from "@/lib/api/handler";
import { successResponse, notFoundResponse } from "@/lib/api/response";

export const PATCH = withApi<{ id: string }>(
  {
    auth: "admin",
    rateLimit: { action: "admin:branches:update", preset: "moderate" },
  },
  async ({ request, params }) => {
    const { id } = params;
    const body = await request.json();
    
    // Only allow updating certain fields to prevent arbitrary overrides
    const { name, address, contactEmail, contactPhone, slug, isActive, pickupEnabled, fulfillsOnlineOrders, sellsAtCounter, fulfillmentPriority, pickupArea, instructions } = body;

    const branch = await InventoryLocation.findOneAndUpdate(
      { _id: id },
      { 
        $set: { 
          name, 
          address, 
          contactEmail, 
          contactPhone, 
          slug, 
          isActive, 
          pickupEnabled, 
          fulfillsOnlineOrders, 
          sellsAtCounter, 
          fulfillmentPriority, 
          pickupArea, 
          instructions 
        } 
      },
      { returnDocument: 'after', runValidators: true }
    );

    if (!branch) {
      return notFoundResponse("Branch");
    }

    return successResponse(branch);
  }
);

export const DELETE = withApi<{ id: string }>(
  {
    auth: "admin",
    rateLimit: { action: "admin:branches:delete", preset: "strict" },
  },
  async ({ params }) => {
    const { id } = params;

    // Note: Instead of hard deleting, we typically deactivate them to preserve order history.
    const branch = await InventoryLocation.findOneAndUpdate(
      { _id: id },
      { $set: { isActive: false } },
      { returnDocument: 'after' }
    );

    if (!branch) {
      return notFoundResponse("Branch");
    }

    return successResponse(branch);
  }
);
