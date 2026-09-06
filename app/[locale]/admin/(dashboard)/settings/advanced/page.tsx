import { setRequestLocale, getTranslations } from "next-intl/server";
import { requireAdminPageAccess } from "@/lib/admin-page-guard";
import { AdvancedSettingsContent } from "./advanced-settings-content";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function AdvancedSettingsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireAdminPageAccess(locale);
  const t = await getTranslations({ locale });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Advanced Settings</h1>
        <p className="text-muted-foreground">
          Backup, restore, and manage critical system configurations.
        </p>
      </div>

      <AdvancedSettingsContent />
    </div>
  );
}
