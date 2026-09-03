import { successResponse, errorResponse } from "@/lib/api/response";
import { withApi } from "@/lib/api/handler";
import { WholesaleProfile } from "@/models/wholesale-profile.model";

export const GET = withApi(
  { auth: "admin" },
  async () => {
    try {
      const applications = await WholesaleProfile.find({ status: "pending_review" })
        .populate("userId", "name email")
        .sort({ createdAt: -1 })
        .lean();
      
      return successResponse({ applications }, "Pending applications retrieved successfully");
    } catch (error: any) {
      console.error("Error fetching applications:", error);
      return errorResponse("Failed to fetch applications", 500);
    }
  }
);

export const PUT = withApi(
  { auth: "admin" },
  async ({ request }) => {
    try {
      const { id, action, rejectionReason } = await request.json();

      if (!id || !action) {
        return errorResponse("Missing required fields", 400);
      }

      if (action === "approve") {
        await WholesaleProfile.findByIdAndUpdate(id, { 
          status: "approved",
          approvedAt: new Date(),
        });
        return successResponse(null, "Application approved successfully");
      } else if (action === "reject") {
        await WholesaleProfile.findByIdAndUpdate(id, { 
          status: "rejected",
          rejectionReason,
        });
        return successResponse(null, "Application rejected successfully");
      } else {
        return errorResponse("Invalid action", 400);
      }
    } catch (error: any) {
      console.error("Error updating application:", error);
      return errorResponse("Failed to update application", 500);
    }
  }
);
