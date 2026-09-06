import { getAuthPageSettings } from "@/lib/auth-page-settings";
import { AdminLoginClient } from "./admin-login-client";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { isAdmin } from "@/lib/rbac";
import { redirect } from "next/navigation";

export default async function AdminLoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });
  
  if (session && isAdmin(session.user)) {
    redirect(`/${locale}/admin/dashboard`);
  }

  const settings = await getAuthPageSettings();

  return (
    <AdminLoginClient
      storeName={settings.storeName}
      logoUrl={settings.loginPage.logoUrl}
    />
  );
}
