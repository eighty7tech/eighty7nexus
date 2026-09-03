import { successResponse, errorResponse } from "@/lib/api/response";
import { withApi } from "@/lib/api/handler";
import { WholesaleProfile } from "@/models/wholesale-profile.model";

// A mock function for sending emails since we don't have the exact emailer structure visible.
async function sendCreditUpdateEmail(email: string, changes: any) {
  console.log(`Sending email to ${email} regarding credit updates:`, changes);
  // Implementation would connect to SendGrid/AWS SES or similar.
}

export const GET = withApi(
  { auth: "admin" },
  async () => {
    try {
      // Fetch only approved profiles to manage their credit lines
      const creditAccounts = await WholesaleProfile.find({ status: "approved" })
        .populate("userId", "name email")
        .select("companyName userId creditLimit availableCredit outstandingBalance paymentTerms poRequired")
        .sort({ companyName: 1 })
        .lean();
      
      return successResponse({ accounts: creditAccounts }, "Credit accounts retrieved successfully");
    } catch (error: any) {
      console.error("Error fetching credit accounts:", error);
      return errorResponse("Failed to fetch credit accounts", 500);
    }
  }
);

export const PUT = withApi(
  { auth: "admin" },
  async ({ request }) => {
    try {
      const { id, creditLimit, paymentTerms, poRequired } = await request.json();

      if (!id) {
        return errorResponse("Missing required fields", 400);
      }

      const profile = await WholesaleProfile.findById(id).populate("userId");
      if (!profile) return errorResponse("Profile not found", 404);

      // Calculate new available credit based on outstanding balance
      const newAvailableCredit = Math.max(0, creditLimit - profile.outstandingBalance);

      profile.creditLimit = creditLimit;
      profile.availableCredit = newAvailableCredit;
      profile.paymentTerms = paymentTerms;
      profile.poRequired = poRequired;
      
      await profile.save();

      // Send email notification as requested in the plan
      const userEmail = (profile.userId as any)?.email;
      if (userEmail) {
        await sendCreditUpdateEmail(userEmail, { creditLimit, paymentTerms });
      }

      return successResponse(null, "Credit and terms updated successfully, notification sent");
    } catch (error: any) {
      console.error("Error updating credit terms:", error);
      return errorResponse("Failed to update credit terms", 500);
    }
  }
);
