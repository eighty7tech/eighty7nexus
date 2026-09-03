import { connectDB } from "@/lib/db";
import { getSettings } from "@/models/settings.model";
import { resolveOAuthCredentials } from "@/lib/credentials";
import { isDemoModeEnabled } from "@/lib/demo-mode";
import { isCurrentSmtpConfigurationVerified } from "@/lib/smtp-verification";

/**
 * Server-side flags for the login/register pages, mirroring the same rules as
 * /api/settings/public: a provider shows only when the admin toggle is on AND
 * usable credentials resolve (DB wins, .env is the fallback — matches
 * lib/auth.ts). Rendering these on the server means the OAuth buttons and the
 * demo card appear in the initial HTML instead of popping in after a client
 * fetch. `getSettings` is request-deduped (React cache), so this shares the
 * auth layout's settings read instead of adding a query.
 */
export async function getAuthPageSettings() {
  await connectDB();
  const settings = await getSettings();
  const oauth = resolveOAuthCredentials(settings.security);

  return {
    googleOAuthEnabled:
      Boolean(settings.security?.googleOAuthEnabled) &&
      Boolean(oauth.google.clientId && oauth.google.clientSecret),
    facebookOAuthEnabled:
      Boolean(settings.security?.facebookOAuthEnabled) &&
      Boolean(oauth.facebook.appId && oauth.facebook.appSecret),
    emailVerificationRequired:
      Boolean(settings.security?.emailVerificationRequired) &&
      isCurrentSmtpConfigurationVerified(settings),
    demoMode: isDemoModeEnabled(),
    storeName: settings.general?.storeName || "Eighty7Nexus",
    logoUrl: settings.loginPage?.logoUrl || settings.general?.logoUrl || "",
    loginPage: {
      style: settings.loginPage?.style || "classic-split",
      logoUrl: settings.loginPage?.logoUrl || settings.general?.logoUrl || "",
      backgroundImageUrl: settings.loginPage?.backgroundImageUrl || "",
      sideImageUrl: settings.loginPage?.sideImageUrl || "",
      primaryColor: settings.loginPage?.primaryColor || settings.appearance?.primaryColor || "",
      accentColor: settings.loginPage?.accentColor || settings.appearance?.accentColor || "",
      heading: settings.loginPage?.heading || "",
      subheading: settings.loginPage?.subheading || "",
      socialLoginEnabled: settings.loginPage?.socialLoginEnabled ?? true,
      otpLoginEnabled: settings.loginPage?.otpLoginEnabled ?? false,
      cardPosition: settings.loginPage?.cardPosition || "center",
      formBorderRadius: (settings.loginPage?.formBorderRadius as any) || "md",
    },
  };
}
