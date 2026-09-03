import { NextResponse } from "next/server";
import { withApi } from "@/lib/api/handler";
import { isValidLocale, defaultLocale } from "@/config/i18n.config";
import { resolveAdminPageRef } from "@/lib/storefront/pages/handles";

/**
 * Friendly, admin-gated entry into the /draft preview routes (the builder's
 * Preview button and embedded panel both come through here). The /draft
 * pages check the admin session again themselves — this route only saves
 * them a 404 for anonymous hits and centralizes the URL construction. No
 * draft-mode cookie is involved: preview is a URL, not a browser state.
 */
export const GET = withApi(
  { auth: "admin", db: false },
  async ({ request }) => {
    const locale = request.nextUrl.searchParams.get("locale") ?? "";
    const handle = request.nextUrl.searchParams.get("handle") ?? "home";
    const localePrefix = `/${isValidLocale(locale) ? locale : defaultLocale}`;

    const ref = resolveAdminPageRef(handle);
    let target = `${localePrefix}/draft`;
    if (ref?.parsed.kind === "landing") {
      target = `${localePrefix}/draft/${ref.parsed.handle}`;
    } else if (
      ref?.parsed.kind === "template" &&
      ref.parsed.templateType !== "home"
    ) {
      target = `${localePrefix}/draft/template/${ref.parsed.templateType}`;
    } else if (ref?.parsed.kind === "group") {
      target = `${localePrefix}/draft/group/${ref.parsed.group}`;
    }

    return NextResponse.redirect(new URL(target, request.nextUrl.origin));
  },
);
