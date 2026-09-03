import { ValidationError } from "@/lib/api/errors";
import { withApi } from "@/lib/api/handler";
import { successResponse } from "@/lib/api/response";
import { audit, createAuditContext } from "@/lib/audit";
import { revalidateSettingsContent } from "@/lib/cache-invalidation";
import { normalizeSettings } from "@/lib/storefront/sections/normalize";
import { getActiveThemeManifest } from "@/lib/storefront/themes/registry";
import { getSettings, Settings } from "@/models/settings.model";

/**
 * Save the ACTIVE theme's setting values. Values are normalized against the
 * manifest's schema — the same field discipline sections use — so the
 * document only ever stores what the schema describes. Written here and
 * nowhere else; the big settings PUT does not accept `onlineStore`.
 *
 * Values are stored per theme id, so a future theme switch (P4) keeps every
 * theme's configuration intact.
 */
export const PATCH = withApi(
  {
    auth: "admin",
    // Settings write: a demo visitor must not restyle the shared storefront.
    demo: "block-mutations",
    rateLimit: { action: "admin:theme-settings:save" },
  },
  async ({ request, session }) => {
    const body = (await request.json().catch(() => null)) as {
      values?: unknown;
    } | null;
    if (!body || typeof body !== "object") {
      throw new ValidationError("Invalid request body");
    }

    const settings = await getSettings();
    const manifest = getActiveThemeManifest(settings.onlineStore?.activeTheme);
    const values = normalizeSettings(manifest.settingsSchema, body.values);

    await Settings.updateOne(
      {},
      {
        $set: {
          [`onlineStore.themeSettings.${manifest.id}`]: values,
          "onlineStore.activeTheme": manifest.id,
        },
      },
    );

    revalidateSettingsContent();

    await audit(createAuditContext(request, session), {
      action: "UPDATE",
      resource: "settings",
      resourceId: "theme-settings",
      resourceName: manifest.id,
      changes: { summary: `Updated ${manifest.id} theme settings` },
    });

    return successResponse({ theme: manifest.id, values });
  },
);
