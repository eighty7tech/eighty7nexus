import { successResponse, errorResponse } from "@/lib/api/response";
import { withApi } from "@/lib/api/handler";
import { WholesaleProfile } from "@/models/wholesale-profile.model";

export const GET = withApi(
  { auth: "admin" },
  async () => {
    try {
      const customers = await WholesaleProfile.find({ status: "approved" })
        .populate("userId", "name email")
        .populate("tierId", "name")
        .sort({ createdAt: -1 })
        .lean();
      
      return successResponse({ customers }, "B2B accounts retrieved successfully");
    } catch (error: any) {
      console.error("Error fetching B2B accounts:", error);
      return errorResponse("Failed to fetch B2B accounts", 500);
    }
  }
);

export const PUT = withApi(
  { auth: "admin" },
  async ({ request }) => {
    try {
      const { id, action, accountRepName, accountRepEmail } = await request.json();

      if (!id || !action) {
        return errorResponse("Missing required fields", 400);
      }

      if (action === "suspend") {
        await WholesaleProfile.findByIdAndUpdate(id, { 
          status: "suspended",
        });
        return successResponse(null, "Account suspended successfully");
      } else if (action === "update_rep") {
        await WholesaleProfile.findByIdAndUpdate(id, { 
          accountRepName,
          accountRepEmail,
        });
        return successResponse(null, "Account Representative updated successfully");
      } else {
        return errorResponse("Invalid action", 400);
      }
    } catch (error: any) {
      console.error("Error updating B2B account:", error);
      return errorResponse("Failed to update B2B account", 500);
    }
  }
);
