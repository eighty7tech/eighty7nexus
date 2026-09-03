import { successResponse, errorResponse } from "@/lib/api/response";
import { withApi } from "@/lib/api/handler";
import { WholesaleTier } from "@/models/wholesale-tier.model";

export const GET = withApi(
  { auth: "admin" },
  async () => {
    try {
      const tiers = await WholesaleTier.find().sort({ createdAt: -1 }).lean();
      return successResponse({ tiers }, "Wholesale tiers retrieved successfully");
    } catch (error: any) {
      console.error("Error fetching wholesale tiers:", error);
      return errorResponse("Failed to fetch wholesale tiers", 500);
    }
  }
);

export const POST = withApi(
  { auth: "admin" },
  async ({ request }) => {
    try {
      const data = await request.json();
      
      const existing = await WholesaleTier.findOne({ code: data.code });
      if (existing) {
        return errorResponse("A tier with this code already exists", 400);
      }

      const newTier = new WholesaleTier(data);
      await newTier.save();

      return successResponse({ tier: newTier }, "Wholesale tier created successfully");
    } catch (error: any) {
      console.error("Error creating wholesale tier:", error);
      return errorResponse("Failed to create wholesale tier", 500);
    }
  }
);

export const PUT = withApi(
  { auth: "admin" },
  async ({ request }) => {
    try {
      const data = await request.json();
      const { _id, ...updateData } = data;

      if (!_id) {
        return errorResponse("Tier ID is required", 400);
      }

      const updatedTier = await WholesaleTier.findByIdAndUpdate(_id, updateData, { returnDocument: 'after' });
      if (!updatedTier) {
        return errorResponse("Tier not found", 404);
      }

      return successResponse({ tier: updatedTier }, "Wholesale tier updated successfully");
    } catch (error: any) {
      console.error("Error updating wholesale tier:", error);
      return errorResponse("Failed to update wholesale tier", 500);
    }
  }
);

export const DELETE = withApi(
  { auth: "admin" },
  async ({ request }) => {
    try {
      const { id } = await request.json();
      
      if (!id) {
        return errorResponse("Tier ID is required", 400);
      }

      await WholesaleTier.findByIdAndDelete(id);
      return successResponse(null, "Wholesale tier deleted successfully");
    } catch (error: any) {
      console.error("Error deleting wholesale tier:", error);
      return errorResponse("Failed to delete wholesale tier", 500);
    }
  }
);
