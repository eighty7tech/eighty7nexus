import { isValidObjectId } from "mongoose";
import { connectDB } from "@/lib/db";
import { getSettings } from "@/models/settings.model";
import { NotFoundError, ValidationError } from "@/lib/api/errors";
import { notFoundResponse, successResponse } from "@/lib/api/response";
import { withApi } from "@/lib/api/handler";
import { createAuditContext } from "@/lib/audit";
import { decideAccessRequest } from "@/lib/vendor-access-requests";

/**
 * PATCH /api/admin/access-requests/[id]
 *
 * Approve or decline one request. Approving writes grant overrides for the
 * pack's permissions with the vendor's reason and requested expiry; it never
 * edits the plan, so a later upgrade or downgrade leaves the decision standing.
 */
export const PATCH = withApi<{ id: string }>(
  {
    auth: "admin",
    rateLimit: { action: "admin:accessRequests:decide", preset: "moderate" },
  },
  async ({ request, params, session }) => {
    const { id } = params;
    if (!isValidObjectId(id)) return notFoundResponse("Access request");

    await connectDB();
    const settings = await getSettings();
    if (!settings.multiVendorMode?.enabled) throw new NotFoundError("Vendor");

    const body = (await request.json().catch(() => null)) as {
      decision?: unknown;
      note?: unknown;
    } | null;

    const decision = String(body?.decision ?? "");
    if (decision !== "approved" && decision !== "declined") {
      throw new ValidationError("Decision must be approved or declined");
    }

    const note = body?.note === undefined ? undefined : String(body.note);
    if (note && note.length > 1000) {
      throw new ValidationError("Note cannot exceed 1000 characters");
    }

    const updated = await decideAccessRequest({
      requestId: id,
      decision,
      note,
      actor: { userId: session!.user.id },
      auditContext: createAuditContext(request, session!),
    });

    return successResponse(
      updated.toObject(),
      decision === "approved"
        ? "Access granted and recorded as an override"
        : "Request declined",
    );
  },
);
