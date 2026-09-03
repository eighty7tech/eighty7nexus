import { cache } from "react";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/rbac";
import { buildLoginUrl, returnPathFromHeaders } from "@/lib/return-path";

/**
 * `cache()` because the admin layout and the page it wraps both guard: without
 * it every admin render costs two session lookups for the same cookie. The memo
 * is per-request, so a revoked session still fails on the next navigation.
 */
export const requireAdminPageAccess = cache(async (locale: string) => {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });
  if (!session || !isAdmin(session.user)) {
    redirect(
      buildLoginUrl(
        locale,
        returnPathFromHeaders(requestHeaders) ?? `/${locale}/admin/dashboard`,
      ),
    );
  }

  return session;
});
