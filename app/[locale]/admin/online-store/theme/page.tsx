import { getTranslations, setRequestLocale } from "next-intl/server";
import { requireAdminPageAccess } from "@/lib/admin-page-guard";
import { connectDB } from "@/lib/db";
import {
  resolveActiveTheme,
  THEME_MANIFESTS,
} from "@/lib/storefront/themes/registry";
import { getSettings } from "@/models/settings.model";
import { ThemeGallery } from "@/components/admin/store-pages/theme-gallery";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function OnlineStoreThemePage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });

  await requireAdminPageAccess(locale);

  await connectDB();
  const settings = await getSettings();
  const theme = resolveActiveTheme(settings.onlineStore);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          {t("admin.onlineStoreThemePage.title")}
        </h1>
        <p className="max-w-3xl text-sm text-muted-foreground md:text-base">
          {t("admin.onlineStoreThemePage.description")}
        </p>
      </div>

      <ThemeGallery
        // Presets are seed data for the activation API, not gallery UI —
        // strip them so the admin payload stays a card list, not templates.
        manifests={THEME_MANIFESTS.map(({ presets, ...manifest }) => ({
          ...manifest,
          // Presets themselves stay server-side; the gallery only needs to
          // know whether the activation dialog should offer the starter.
          hasStarter: Boolean(
            presets?.templates && Object.keys(presets.templates).length > 0,
          ),
        }))}
        activeThemeId={theme.id}
        initialValues={theme.settings}
      />
    </div>
  );
}
