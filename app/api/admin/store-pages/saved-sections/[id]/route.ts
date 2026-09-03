import { NotFoundError, ValidationError } from "@/lib/api/errors";
import { withApi } from "@/lib/api/handler";
import { successResponse } from "@/lib/api/response";
import { auditDelete, createAuditContext } from "@/lib/audit";
import { SavedSection } from "@/models/saved-section.model";

/** Remove a library entry. Pages are copies, so nothing else is touched. */
export const DELETE = withApi<{ id: string }>(
  {
    auth: "admin",
    rateLimit: { action: "admin:saved-sections:delete" },
  },
  async ({ request, session, params }) => {
    if (!/^[0-9a-f]{24}$/i.test(params.id)) {
      throw new ValidationError("Invalid id");
    }
    const deleted = await SavedSection.findByIdAndDelete(params.id).lean();
    if (!deleted) {
      throw new NotFoundError("Saved section not found");
    }

    await auditDelete(
      createAuditContext(request, session),
      "storePage",
      params.id,
      { name: deleted.name },
      `saved-section:${deleted.name}`,
    );

    return successResponse({ deleted: true });
  },
);
