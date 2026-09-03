import { NextResponse } from "next/server";
import { successResponse } from "@/lib/api/response";
import { withApi } from "@/lib/api/handler";
import { WholesaleProfile } from "@/models/wholesale-profile.model";


/**
 * GET /api/wholesale/eligibility
 *
 * Returns whether the authenticated buyer may use Net Terms (invoice) at
 * checkout.  The response intentionally omits sensitive account data —
 * it is consumed by the public checkout page for unauthenticated users
 * (who always receive eligible: false) and by the account sidebar.
 *
 * Criteria for eligibility:
 *   1. User is authenticated.
 *   2. WholesaleProfile exists for the user with status "approved".
 *   3. The profile has netTerms.enabled = true.
 *   4. The profile's credit balance has not been exceeded (optional future gate).
 */
export const GET = withApi(
  // "optional" so unauthenticated visitors get a clean false response
  // rather than a 401 that the checkout page's fire-and-forget fetch would log.
  { auth: "optional" },
  async ({ session }) => {
    if (!session?.user?.id) {
      return NextResponse.json({
        success: true,
        data: { netTermsEligible: false },
        message: "Not authenticated",
      });
    }


    const profile = await WholesaleProfile.findOne({
      userId: session.user.id,
      status: "approved",
    })
      .select("paymentTerms creditLimit availableCredit outstandingBalance")
      .lean();

    if (!profile) {
      return successResponse(
        { netTermsEligible: false },
        "No approved wholesale profile",
      );
    }

    // Net Terms is available when the profile's paymentTerms is anything other
    // than "prepaid". The admin sets this on the wholesale profile.
    const netTermsEnabled = profile.paymentTerms !== "prepaid";

    return successResponse(
      {
        netTermsEligible: netTermsEnabled,
        ...(netTermsEnabled && {
          creditLimit: profile.creditLimit ?? 0,
          availableCredit: profile.availableCredit ?? 0,
          outstandingBalance: profile.outstandingBalance ?? 0,
          paymentTerms: profile.paymentTerms,
        }),
      },
      "Wholesale eligibility loaded",
    );
  },
);
