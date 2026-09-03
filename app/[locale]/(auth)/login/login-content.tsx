"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Suspense, useState } from "react";
import { Loader2, Shield, Sparkles, KeyRound, ArrowRight, Store } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { sanitizeReturnPath } from "@/lib/return-path";
import { cn } from "@/lib/utils";
import { useParams, useSearchParams } from "next/navigation";
import {
  DemoCredentialsList,
  LoginFields,
  LoginOAuthButtons,
  TwoFactorFields,
  demoCredentials,
  useLoginForm,
  type OAuthEnabled,
} from "@/components/auth/login-form";
import {
  RegisterFields,
  RegisterOAuthButtons,
  RegisterTermsNotice,
  useRegisterForm,
} from "@/components/auth/register-form";
import { type LoginPageStyle } from "@/components/admin/online-store/login-page-builder";
import { toast } from "sonner";
import { useMultiVendorMode } from "@/providers/app-settings-provider";

export interface ILoginPageClientSettings {
  style?: LoginPageStyle;
  logoUrl?: string;
  backgroundImageUrl?: string;
  sideImageUrl?: string;
  primaryColor?: string;
  accentColor?: string;
  heading?: string;
  subheading?: string;
  socialLoginEnabled?: boolean;
  otpLoginEnabled?: boolean;
  cardPosition?: "center" | "left" | "right";
  formBorderRadius?: "none" | "sm" | "md" | "lg" | "xl" | "full" | string;
}

interface LoginPageProps {
  /** Resolved on the server so the buttons render in the initial HTML. */
  oauthEnabled: OAuthEnabled;
  demoModeEnabled: boolean;
  loginPageSettings?: ILoginPageClientSettings;
  storeName?: string;
}

function LoginContent({ 
  oauthEnabled, 
  demoModeEnabled, 
  loginPageSettings,
  storeName = "Eighty7Nexus" 
}: LoginPageProps) {
  const t = useTranslations();
  const params = useParams();
  const locale = params.locale as string;
  const searchParams = useSearchParams();
  const { isMultiVendor } = useMultiVendorMode();

  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [dismissedSearchErrorKey, setDismissedSearchErrorKey] = useState<string | null>(null);

  const showDemoCredentials = demoModeEnabled && demoCredentials.length > 0;

  const style: LoginPageStyle = loginPageSettings?.style || "classic-split";
  const logoUrl = loginPageSettings?.logoUrl || "";
  const bgImage = loginPageSettings?.backgroundImageUrl || "";
  const sideImage = loginPageSettings?.sideImageUrl || "";
  const heading = loginPageSettings?.heading || (activeTab === "login" ? t("auth.welcomeBack") : t("auth.createAccount"));
  const subheading = loginPageSettings?.subheading || (activeTab === "login" ? t("auth.signIn") : t("auth.createAccountDescription"));
  const socialEnabled = loginPageSettings?.socialLoginEnabled !== false;
  const otpEnabled = Boolean(loginPageSettings?.otpLoginEnabled);
  const cardRadius = loginPageSettings?.formBorderRadius || "md";

  const effectiveOAuth: OAuthEnabled = {
    google: socialEnabled && oauthEnabled.google,
    facebook: socialEnabled && oauthEnabled.facebook,
  };

  const formatRoleLabel = (role: string) => {
    const value = role.trim();
    if (!value) return "";
    return value.charAt(0).toUpperCase() + value.slice(1);
  };

  const searchErrorCode = searchParams.get("error");
  const searchErrorRole = searchParams.get("role") || "";
  const searchErrorEmail = searchParams.get("email") || "";
  const searchErrorKey = searchErrorCode
    ? `${searchErrorCode}:${searchErrorRole}:${searchErrorEmail}`
    : null;
  let searchErrorMessage: string | null = null;

  if (searchErrorCode === "oauth_account_role_conflict") {
    const role = formatRoleLabel(searchErrorRole);
    searchErrorMessage = t("auth.oauthRoleConflict", {
      email: searchErrorEmail || t("auth.thisEmail"),
      role: role || t("auth.vendorRole"),
    });
  } else if (
    searchErrorCode === "oauth_customer_only" ||
    searchErrorCode === "OAUTH_SIGNIN_IS_ONLY_AVAILABLE_FOR_CUSTOMERS"
  ) {
    searchErrorMessage = t("auth.oauthCustomerOnly");
  }

  const dismissSearchError = () => {
    if (searchErrorKey) {
      setDismissedSearchErrorKey(searchErrorKey);
    }
  };

  const redirectParam = sanitizeReturnPath(
    searchParams.get("redirect") || searchParams.get("callbackUrl"),
  );

  const loginState = useLoginForm({
    locale,
    redirectTo: redirectParam,
    onAttempt: dismissSearchError,
  });

  const registerState = useRegisterForm({
    locale,
    emailVerificationRequired: false,
    redirectTo: redirectParam,
  });

  const visibleLoginError =
    loginState.error ||
    (searchErrorKey !== dismissedSearchErrorKey ? searchErrorMessage : null);

  // Radius helper
  const radiusClass = {
    none: "rounded-none",
    sm: "rounded-sm",
    md: "rounded-xl",
    lg: "rounded-2xl",
    xl: "rounded-3xl",
    full: "rounded-[2rem]",
  }[cardRadius] || "rounded-xl";

  // 2FA Verification Screen
  if (loginState.requires2FA) {
    return (
      <Card className={cn("shadow-xl max-w-md mx-auto border-border/60", radiusClass)}>
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-2">
            <Shield className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">
            {t("auth.twoFactorTitle")}
          </CardTitle>
          <CardDescription>{t("auth.twoFactorDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <TwoFactorFields state={loginState} error={loginState.error} />
        </CardContent>
        <CardFooter>
          <Button variant="link" className="w-full" onClick={loginState.cancel2FA}>
            {t("auth.backToLogin")}
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // --- RENDER FORM CONTENT BLOCK WITH HOVER SWAP TABS ---
  const renderFormContent = (isGlass = false, isDark = false) => (
    <>
      <CardHeader className="space-y-2 text-center sm:text-left pb-4">
        {logoUrl && (
          <div className="flex justify-center sm:justify-start mb-1">
            <img src={logoUrl} alt={storeName} className="h-9 w-auto object-contain" />
          </div>
        )}

        {/* Hover / Click Tab Switcher (SignIn <-> Register) */}
        <div className="flex border-b border-border/80 w-full mb-3">
          <button
            type="button"
            className={cn(
              "flex-1 pb-2.5 text-sm font-semibold transition-all border-b-2 text-center",
              activeTab === "login"
                ? "border-primary text-primary"
                : isDark 
                  ? "border-transparent text-zinc-400 hover:text-white"
                  : isGlass 
                    ? "border-transparent text-slate-300 hover:text-white"
                    : "border-transparent text-muted-foreground hover:text-foreground"
            )}
            onMouseEnter={() => setActiveTab("login")}
            onClick={() => setActiveTab("login")}
          >
            {t("auth.signIn")}
          </button>
          <button
            type="button"
            className={cn(
              "flex-1 pb-2.5 text-sm font-semibold transition-all border-b-2 text-center",
              activeTab === "register"
                ? "border-primary text-primary"
                : isDark 
                  ? "border-transparent text-zinc-400 hover:text-white"
                  : isGlass 
                    ? "border-transparent text-slate-300 hover:text-white"
                    : "border-transparent text-muted-foreground hover:text-foreground"
            )}
            onMouseEnter={() => setActiveTab("register")}
            onClick={() => setActiveTab("register")}
          >
            {t("auth.createAccount")}
          </button>
        </div>

        <CardTitle className={cn("text-2xl sm:text-3xl font-extrabold tracking-tight", isDark && "text-white")}>
          {activeTab === "login" ? heading : t("auth.createAccount")}
        </CardTitle>
        <CardDescription className={cn(isDark && "text-zinc-400", isGlass && "text-slate-200")}>
          {activeTab === "login" ? subheading : t("auth.createAccountDescription")}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {activeTab === "login" ? (
          <>
            {socialEnabled && (effectiveOAuth.google || effectiveOAuth.facebook) && (
              <LoginOAuthButtons state={loginState} oauthEnabled={effectiveOAuth} />
            )}
            
            <LoginFields state={loginState} error={visibleLoginError} />
            
            {otpEnabled && (
              <div className="pt-1">
                <Button 
                  type="button" 
                  variant="outline" 
                  className={cn(
                    "w-full gap-2 border-dashed font-medium text-xs h-9",
                    isDark ? "bg-zinc-800/60 border-zinc-700 hover:bg-zinc-800 text-zinc-200" : "bg-muted/30"
                  )}
                  onClick={() => {
                    toast.info("Passwordless login code request is sent to your registered email or phone.");
                  }}
                >
                  <KeyRound className="h-3.5 w-3.5 text-primary" />
                  Sign in with One-Time Password (OTP)
                </Button>
              </div>
            )}
          </>
        ) : (
          <>
            {socialEnabled && (effectiveOAuth.google || effectiveOAuth.facebook) && (
              <RegisterOAuthButtons state={registerState} oauthEnabled={effectiveOAuth} />
            )}
            <RegisterFields state={registerState} />
            <div className="pt-2">
              <RegisterTermsNotice locale={locale} />
            </div>
          </>
        )}
      </CardContent>

      <CardFooter className="flex flex-col gap-3 border-t pt-4 bg-muted/10">
        {isMultiVendor && activeTab === "register" && (
          <div className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-primary/10 border border-primary/20 w-full text-xs">
            <Store className="h-4 w-4 text-primary shrink-0" />
            <span className={cn("text-muted-foreground", isDark && "text-zinc-300", isGlass && "text-slate-200")}>
              {t("auth.wantToSell")}{" "}
              <Link href={`/${locale}/become-vendor`} className="text-primary font-bold hover:underline">
                {t("auth.becomeVendor")}
              </Link>
            </span>
          </div>
        )}

        <div className="relative w-full">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border/60" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className={cn(
              "px-2 text-muted-foreground font-medium",
              isGlass ? "bg-transparent text-slate-300" : isDark ? "bg-zinc-900 text-zinc-400" : "bg-card"
            )}>
              {activeTab === "login" ? t("auth.noAccount") : t("auth.hasAccount")}
            </span>
          </div>
        </div>

        <Button 
          type="button"
          variant="outline" 
          className="w-full font-semibold shadow-xs"
          onClick={() => setActiveTab(activeTab === "login" ? "register" : "login")}
        >
          {activeTab === "login" ? (
            <>
              {t("auth.createAccount")}
              <ArrowRight className="h-4 w-4 ml-1.5" />
            </>
          ) : (
            <>
              {t("auth.signIn")}
              <ArrowRight className="h-4 w-4 ml-1.5" />
            </>
          )}
        </Button>
      </CardFooter>
    </>
  );

  // ─── 1. CLASSIC SPLIT THEME ──────────────────────────────────────────────────
  if (style === "classic-split") {
    return (
      <div className="auth-wide w-full max-w-5xl mx-auto">
        <div className={cn(
          "grid grid-cols-1 lg:grid-cols-12 overflow-hidden shadow-2xl border border-border/80 bg-card",
          radiusClass
        )}>
          {/* Left Hero Panel */}
          <div 
            className="lg:col-span-5 relative bg-slate-950 text-white p-8 sm:p-12 flex flex-col justify-between overflow-hidden min-h-[320px] lg:min-h-[580px]"
            style={sideImage ? { backgroundImage: `url(${sideImage})`, backgroundSize: "cover", backgroundPosition: "center" } : {}}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-900/40 backdrop-blur-xs" />
            <div className="relative z-10 space-y-6">
              {logoUrl ? (
                <div className="inline-block bg-white/10 backdrop-blur-md p-2.5 rounded-xl border border-white/20">
                  <img src={logoUrl} alt={storeName} className="h-8 w-auto object-contain" />
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 border border-primary/30 text-primary-foreground text-xs font-semibold">
                  <Sparkles className="h-3.5 w-3.5 text-primary" /> {storeName}
                </div>
              )}
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight text-white">
                Experience seamless shopping & instant access.
              </h2>
              <p className="text-slate-300 text-sm leading-relaxed max-w-sm">
                Track your active orders, redeem exclusive vouchers, and manage your account in real-time.
              </p>
            </div>

            <div className="relative z-10 pt-6 border-t border-white/10 text-xs text-slate-400 flex items-center gap-2">
              <Shield className="h-4 w-4 text-emerald-400" />
              <span>Secured by SSL 256-bit encrypted authentication</span>
            </div>
          </div>

          {/* Right Form Card */}
          <div className="lg:col-span-7 flex flex-col justify-center p-6 sm:p-10">
            {renderFormContent(false, false)}
          </div>
        </div>

        {showDemoCredentials && (
          <Card className="mt-6 shadow-lg border-dashed">
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm font-semibold">Demo account credentials</CardTitle>
            </CardHeader>
            <CardContent className="py-2 px-4">
              <DemoCredentialsList state={loginState} />
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // ─── 2. MODERN GLASSMORPHISM THEME ──────────────────────────────────────────
  if (style === "modern-glass") {
    return (
      <div 
        className="auth-wide w-full min-h-[80vh] flex items-center justify-center p-4 rounded-3xl relative overflow-hidden my-4"
        style={{
          background: bgImage 
            ? `url(${bgImage}) center/cover no-repeat` 
            : "linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #4c1d95 70%, #831843 100%)"
        }}
      >
        <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" />
        
        {/* Glow Spheres */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-500/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-pink-500/30 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 w-full max-w-md">
          <Card className={cn(
            "border border-white/30 shadow-2xl backdrop-blur-xl bg-white/20 dark:bg-zinc-900/50 text-white",
            radiusClass
          )}>
            {renderFormContent(true, false)}
          </Card>

          {showDemoCredentials && (
            <Card className="mt-4 border-white/20 bg-white/10 backdrop-blur-md text-white">
              <CardContent className="p-3">
                <DemoCredentialsList state={loginState} />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  // ─── 3. DARK LUXURY THEME ───────────────────────────────────────────────────
  if (style === "dark-luxury") {
    const accent = loginPageSettings?.accentColor || "#f59e0b";
    return (
      <div className="auth-wide w-full min-h-[80vh] flex items-center justify-center p-4 bg-zinc-950 rounded-3xl relative overflow-hidden my-4 border border-zinc-800">
        <div 
          className="absolute inset-0 opacity-40 pointer-events-none"
          style={{ background: `radial-gradient(circle at 50% 40%, ${accent}25 0%, transparent 65%)` }}
        />

        <div className="relative z-10 w-full max-w-md">
          <Card 
            className={cn("bg-zinc-900/90 text-white shadow-2xl border backdrop-blur-md", radiusClass)}
            style={{ borderColor: `${accent}40` }}
          >
            {renderFormContent(false, true)}
          </Card>

          {showDemoCredentials && (
            <Card className="mt-4 bg-zinc-900/80 border-zinc-800 text-zinc-300">
              <CardContent className="p-3">
                <DemoCredentialsList state={loginState} />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  // ─── 4. VIBRANT GRADIENT THEME ──────────────────────────────────────────────
  if (style === "vibrant-gradient") {
    return (
      <div 
        className="auth-wide w-full min-h-[80vh] flex items-center justify-center p-4 rounded-3xl relative overflow-hidden my-4"
        style={{
          background: "linear-gradient(135deg, #ec4899 0%, #8b5cf6 50%, #3b82f6 100%)"
        }}
      >
        <div className="relative z-10 w-full max-w-md">
          <Card className={cn("bg-card shadow-2xl border border-white/60", radiusClass)}>
            {renderFormContent(false, false)}
          </Card>

          {showDemoCredentials && (
            <Card className="mt-4 bg-white/90 backdrop-blur-sm">
              <CardContent className="p-3">
                <DemoCredentialsList state={loginState} />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  // ─── 5. PROFESSIONAL CORPORATE THEME ───────────────────────────────────────
  if (style === "professional-corporate") {
    return (
      <div className="auth-wide w-full max-w-5xl mx-auto my-4">
        <div className={cn(
          "grid grid-cols-1 lg:grid-cols-12 overflow-hidden shadow-xl border border-slate-200 bg-white",
          radiusClass
        )}>
          {/* Left Corporate Panel */}
          <div className="lg:col-span-4 bg-blue-800 text-white p-8 flex flex-col justify-between relative">
            <div className="space-y-6">
              {logoUrl ? (
                <img src={logoUrl} alt={storeName} className="h-8 w-auto object-contain brightness-0 invert" />
              ) : (
                <div className="font-bold text-xl tracking-wider uppercase text-blue-100">{storeName}</div>
              )}
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white">Enterprise Portal</h3>
                <p className="text-xs text-blue-200 leading-relaxed">
                  Single sign-on access to customer dashboard, verified orders, and real-time inventory.
                </p>
              </div>
            </div>
            <div className="text-[11px] text-blue-300 pt-6 border-t border-blue-700/60 flex items-center gap-2">
              <Shield className="h-3.5 w-3.5" />
              <span>SOC2 & PCI-DSS Compliant Infrastructure</span>
            </div>
          </div>

          {/* Right Form Card */}
          <div className="lg:col-span-8 p-6 sm:p-10">
            {renderFormContent(false, false)}
          </div>
        </div>

        {showDemoCredentials && (
          <Card className="mt-6 shadow-sm border-slate-200">
            <CardContent className="p-3">
              <DemoCredentialsList state={loginState} />
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // ─── 6. MINIMAL CLEAN THEME (DEFAULT FALLBACK) ──────────────────────────────
  return (
    <div
      className={cn(
        "auth-wide mx-auto grid w-full max-w-md items-center gap-6",
        showDemoCredentials
          ? "lg:max-w-none lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]"
          : "lg:grid-cols-[minmax(0,26rem)] lg:justify-center",
      )}
    >
      <Card className={cn("shadow-xl border-border/80", radiusClass)}>
        {renderFormContent(false, false)}
      </Card>

      {showDemoCredentials && (
        <Card className={cn("h-fit gap-3 px-2 py-4 shadow-lg", radiusClass)}>
          <CardHeader className="px-2 gap-1 text-center lg:text-left">
            <CardTitle className="text-base font-semibold">
              Demo account login credentials
            </CardTitle>
            <CardDescription>
              Select a role to fill the login form.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-2">
            <DemoCredentialsList state={loginState} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function LoginFallback() {
  return (
    <Card className="shadow-lg">
      <CardContent className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Loading...</p>
      </CardContent>
    </Card>
  );
}

export function LoginPageClient(props: LoginPageProps) {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginContent {...props} />
    </Suspense>
  );
}
