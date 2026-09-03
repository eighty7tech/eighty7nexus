"use client";

import { Suspense } from "react";
import { LoginPageClient, type ILoginPageClientSettings } from "../login/login-content";
import type { OAuthEnabled } from "@/components/auth/login-form";

interface RegisterPageProps {
  oauthEnabled: OAuthEnabled;
  emailVerificationRequired: boolean;
  loginPageSettings?: ILoginPageClientSettings;
  storeName?: string;
}

export function RegisterPageClient({
  oauthEnabled,
  loginPageSettings,
  storeName,
}: RegisterPageProps) {
  return (
    <LoginPageClient
      oauthEnabled={oauthEnabled}
      demoModeEnabled={false}
      loginPageSettings={loginPageSettings}
      storeName={storeName}
    />
  );
}
