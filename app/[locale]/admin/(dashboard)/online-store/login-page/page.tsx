import { setRequestLocale } from "next-intl/server";
import { requireAdminPageAccess } from "@/lib/admin-page-guard";
import { getSanitizedSettings } from "@/lib/settings/sanitize-settings";
import { LoginPageBuilder, type LoginPageStyle } from "@/components/admin/online-store/login-page-builder";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function LoginPageSettingsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireAdminPageAccess(locale);

  const settings = await getSanitizedSettings();
  const loginPageSettings = (settings as Record<string, unknown>)?.loginPage as Record<string, unknown> | undefined;

  return <LoginPageBuilder initialSettings={loginPageSettings} />;
}
