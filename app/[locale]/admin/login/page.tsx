import { getAuthPageSettings } from "@/lib/auth-page-settings";
import { AdminLoginClient } from "./admin-login-client";

export default async function AdminLoginPage() {
  const settings = await getAuthPageSettings();

  return (
    <AdminLoginClient
      storeName={settings.storeName}
      logoUrl={settings.loginPage.logoUrl}
    />
  );
}
