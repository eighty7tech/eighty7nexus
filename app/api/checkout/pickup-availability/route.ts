import { successResponse } from "@/lib/api/response";
import { withApi } from "@/lib/api/handler";
import {
  pickupAvailabilityLocationDetails,
  pickupAvailabilityVendorDetails,
  pickupLocationAvailability,
  resolvePickupEligibility,
} from "@/lib/checkout-pickup";
import { pickupOpeningHoursSummary } from "@/lib/pickup-hours";

/**
 * The branches the caller's current cart can be collected from.
 *
 * Server-derived, and only ever for the caller's own cart — a shopper cannot
 * ask about somebody else's. The response carries no exact address and no
 * instructions: this endpoint is anonymous, so anything it returns is readable
 * by anyone who can put an item in a cart.
 */
export const GET = withApi(
  { auth: "optional", rateLimit: { action: "checkout:pickup-availability", preset: "lenient" } },
  async ({ request, session }) => {
    const sessionId = request.cookies.get("cart_session")?.value;
    const eligibility = await resolvePickupEligibility({
      userId: session?.user?.id,
      sessionId,
    });
    if (!eligibility.eligible) return successResponse(eligibility);

    return successResponse({
      eligible: true,
      vendor: pickupAvailabilityVendorDetails({
        vendorId: eligibility.vendorId,
        vendorName: eligibility.vendorName,
      }),
      locations: pickupLocationAvailability(eligibility).map((location) => ({
        ...pickupAvailabilityLocationDetails(location),
        openingHours: pickupOpeningHoursSummary(location),
        // Whether this branch holds the whole basket. A boolean and nothing
        // more: which items are short is a stock level, and this endpoint is
        // anonymous — anyone who can put something in a cart could otherwise
        // read a competitor's per-branch counts one probe at a time.
        available: location.available,
        // Kept for one release. A checkout tab loaded before this deploy runs
        // the previous bundle, whose submit guard reads a missing `scheduling`
        // as "this branch still owes a booked time" and would leave its Pay
        // button disabled forever. The current client ignores the key.
        scheduling: "open_hours",
      })),
    });
  },
);
