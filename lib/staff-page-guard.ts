import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect, RedirectType } from "next/navigation";
import type { StaffPermission } from "@/config/permissions.config";
import { assertAdminOrStaffPermissions } from "@/lib/staff-authz";
import { buildLoginUrl, returnPathFromHeaders } from "@/lib/return-path";
import { AuthorizationError } from "@/lib/api/errors";

export async function requireAdminOrStaffPageAccess(options: {
  locale: string;
  required?: StaffPermission[];
  mode?: "any" | "all";
}) {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });
  if (!session) {
    redirect(
      buildLoginUrl(options.locale, returnPathFromHeaders(requestHeaders)),
    );
  }

  try {
    const { staffPermissions, staffScope } = await assertAdminOrStaffPermissions(
      session as unknown as { user: { id: string; role: string } },
      options.required,
      options.mode || "any",
    );
    return { session, staffPermissions, staffScope };
  } catch (err) {
    // Re-throw Next.js redirect/notFound errors so they propagate correctly
    if (err instanceof Error && err.message === "NEXT_REDIRECT") throw err;
    if (err instanceof AuthorizationError) {
      redirect(`/${options.locale}/forbidden`);
    }
    // For any other error, redirect to forbidden to avoid exposing internals
    redirect(`/${options.locale}/forbidden`);
  }
}
