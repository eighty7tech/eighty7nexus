import { ConflictError, ValidationError } from "@/lib/api/errors";
import { withApi } from "@/lib/api/handler";
import { createdResponse, successResponse } from "@/lib/api/response";
import { auditCreate, createAuditContext } from "@/lib/audit";
import { normalizeContentPagesSettings } from "@/lib/content-pages-config";
import {
  buildLandingKey,
  isReservedPageHandle,
  isValidPageHandle,
  slugifyPageHandle,
} from "@/lib/storefront/pages/handles";
import { getSettings } from "@/models/settings.model";
import { buildStorePageIdentity, StorePage } from "@/models/store-page.model";

/** Landing + home page summaries for the admin Pages screen. */
export const GET = withApi(
  {
    auth: "admin",
    rateLimit: { action: "admin:store-pages:list", preset: "lenient" },
  },
  async () => {
    const pages = await StorePage.find({})
      .select("kind key templateType handle title published updatedAt")
      .sort({ kind: 1, updatedAt: -1 })
      .limit(200)
      .lean();

    return successResponse(
      pages.map((page) => ({
        key: page.key,
        kind: page.kind,
        templateType: page.templateType,
        handle: page.handle,
        title: page.title,
        isPublished: Boolean(page.published),
        updatedAt: page.updatedAt,
      })),
    );
  },
);

/**
 * Create a landing page (draft only — it goes live on first publish).
 * The /pages/<handle> namespace is shared with the legacy custom content
 * pages, so collisions with those are refused too.
 */
export const POST = withApi(
  {
    auth: "admin",
    rateLimit: { action: "admin:store-pages:create" },
  },
  async ({ request, session }) => {
    const body = (await request.json().catch(() => null)) as {
      title?: unknown;
      handle?: unknown;
    } | null;
    const title = typeof body?.title === "string" ? body.title.trim() : "";
    if (!title || title.length > 120) {
      throw new ValidationError("A page title (max 120 characters) is required");
    }

    const handle = slugifyPageHandle(
      typeof body?.handle === "string" && body.handle.trim()
        ? body.handle
        : title,
    );
    if (!isValidPageHandle(handle)) {
      throw new ValidationError(
        "The handle must contain letters, numbers, or dashes",
      );
    }
    if (isReservedPageHandle(handle)) {
      throw new ValidationError("This handle is reserved");
    }

    const [existing, settings] = await Promise.all([
      StorePage.findOne({ key: buildLandingKey(handle) }).select("_id").lean(),
      getSettings(),
    ]);
    if (existing) {
      throw new ConflictError("A page with this handle already exists");
    }
    const contentPages = normalizeContentPagesSettings(settings.contentPages);
    if (contentPages.customPages.some((page) => page.handle === handle)) {
      throw new ConflictError(
        "A custom content page already uses this handle",
      );
    }

    const now = new Date();
    const page = await StorePage.create({
      ...buildStorePageIdentity(buildLandingKey(handle)),
      title,
      draft: { sections: [], updatedAt: now, updatedBy: session.user.id },
      published: null,
      history: [],
    });

    await auditCreate(
      createAuditContext(request, session),
      "storePage",
      String(page._id),
      { handle, title },
      handle,
    );

    return createdResponse({ handle, title, isPublished: false });
  },
);
