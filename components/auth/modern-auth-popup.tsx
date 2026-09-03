"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Sparkles, Shield, Lock } from "lucide-react";

import {
  useLoginForm,
  LoginFields,
  TwoFactorFields,
  LoginOAuthButtons,
  type OAuthEnabled,
} from "@/components/auth/login-form";

import {
  useRegisterForm,
  RegisterFields,
  RegisterOAuthButtons,
  RegisterTermsNotice,
} from "@/components/auth/register-form";
import { type LoginPageStyle } from "@/components/admin/online-store/login-page-builder";

export type AuthTheme = 
  | "classic" 
  | "split" 
  | "minimal" 
  | "classic-split" 
  | "modern-glass" 
  | "dark-luxury" 
  | "minimal-clean" 
  | "vibrant-gradient" 
  | "professional-corporate";

interface ModernAuthPopupProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  locale: string;
  theme?: AuthTheme;
  oauthEnabled?: OAuthEnabled;
  defaultView?: "login" | "register";
  storeName?: string;
  logoUrl?: string;
  backgroundImageUrl?: string;
  sideImageUrl?: string;
  heading?: string;
  subheading?: string;
}

export function ModernAuthPopup({
  isOpen,
  onOpenChange,
  locale,
  theme = "classic-split",
  oauthEnabled = { google: false, facebook: false },
  defaultView = "login",
  storeName = "Eighty7Nexus",
  logoUrl,
  backgroundImageUrl,
  sideImageUrl,
  heading,
  subheading,
}: ModernAuthPopupProps) {
  const t = useTranslations();
  const [view, setView] = useState<"login" | "register">(defaultView);

  const loginState = useLoginForm({
    locale,
    onSuccess: () => onOpenChange(false),
  });

  const registerState = useRegisterForm({
    locale,
    emailVerificationRequired: false,
    onSuccess: () => onOpenChange(false),
  });

  const isSplit = theme === "split" || theme === "classic-split" || theme === "professional-corporate";
  const isDark = theme === "dark-luxury";
  const isGlass = theme === "modern-glass";
  const isGradient = theme === "vibrant-gradient";

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent 
        className={cn(
          "p-0 overflow-hidden sm:max-w-md border",
          isSplit && "sm:max-w-4xl",
          isDark && "bg-zinc-950 text-white border-zinc-800",
          isGlass && "bg-slate-900/90 text-white backdrop-blur-xl border-white/20",
          isGradient && "bg-card text-foreground"
        )}
        style={
          backgroundImageUrl && !isSplit
            ? {
                backgroundImage: `linear-gradient(rgba(0,0,0,0.65), rgba(0,0,0,0.65)), url(${backgroundImageUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : undefined
        }
      >
        <DialogTitle className="sr-only">Authentication</DialogTitle>
        <DialogDescription className="sr-only">Login or register for an account</DialogDescription>
        
        <div className={cn("flex w-full", isSplit ? "flex-row min-h-[560px]" : "flex-col")}>
          {/* Left Hero Panel for Split Themes */}
          {isSplit && (
            <div
              className={cn(
                "hidden sm:flex flex-1 relative flex-col justify-between p-10 overflow-hidden",
                theme === "professional-corporate" 
                  ? "bg-blue-800 text-white" 
                  : "bg-slate-950 text-white"
              )}
              style={
                sideImageUrl
                  ? {
                      backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.4), rgba(0,0,0,0.7)), url(${sideImageUrl})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }
                  : undefined
              }
            >
              <div className="relative z-10 space-y-6">
                {logoUrl ? (
                  <div className="inline-block bg-white/10 backdrop-blur-md p-2 rounded-lg border border-white/20">
                    <img src={logoUrl} alt={storeName} className="h-8 w-auto object-contain" />
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 border border-primary/30 text-primary-foreground text-xs font-semibold">
                    <Sparkles className="h-3.5 w-3.5 text-primary" /> {storeName}
                  </div>
                )}
                <div className="space-y-2">
                  <h3 className="text-3xl font-extrabold tracking-tight text-white leading-tight">
                    {heading || (view === "login" ? "Welcome back!" : "Join us today!")}
                  </h3>
                  <p className="text-slate-300 text-sm leading-relaxed max-w-sm">
                    {subheading || (view === "login" 
                      ? "Log in to access your orders, track shipments, and unlock member savings."
                      : "Create your account in seconds and unlock exclusive deals and faster checkout."
                    )}
                  </p>
                </div>
              </div>
              
              <div className="relative z-10 text-xs text-slate-400 pt-6 border-t border-white/10 flex items-center gap-2">
                <Shield className="h-4 w-4 text-emerald-400" />
                <span>SSL 256-bit encrypted authentication</span>
              </div>
            </div>
          )}

          {/* Form Container */}
          <div className={cn(
            "flex-1 flex flex-col p-6 sm:p-8 overflow-y-auto max-h-[90vh]",
            isSplit && "sm:max-w-md",
            isDark && "bg-zinc-900/90 text-white"
          )}>
            {!isSplit && logoUrl && (
              <div className="flex justify-center mb-6">
                <img src={logoUrl} alt={storeName} className="h-9 w-auto object-contain" />
              </div>
            )}

            {/* Hover to swap tabs */}
            <div className="flex border-b border-border/80 mb-6">
              <button
                className={cn(
                  "flex-1 pb-3 text-sm font-semibold transition-colors border-b-2",
                  view === "login" 
                    ? "border-primary text-foreground" 
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setView("login")}
              >
                {t("auth.signIn")}
              </button>
              <button
                className={cn(
                  "flex-1 pb-3 text-sm font-semibold transition-colors border-b-2",
                  view === "register" 
                    ? "border-primary text-foreground" 
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setView("register")}
              >
                {t("auth.createAccount")}
              </button>
            </div>

            <div className="flex-1 space-y-6">
              {view === "login" ? (
                <>
                  <div className="space-y-4">
                    {loginState.error && (
                      <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                        {loginState.error}
                      </div>
                    )}
                    
                    {loginState.requires2FA ? (
                      <TwoFactorFields state={loginState} error={loginState.error} />
                    ) : (
                      <>
                        {(oauthEnabled.google || oauthEnabled.facebook) && (
                          <LoginOAuthButtons state={loginState} oauthEnabled={oauthEnabled} />
                        )}
                        <LoginFields state={loginState} />
                      </>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-4">
                    {registerState.error && (
                      <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                        {registerState.error}
                      </div>
                    )}
                    {(oauthEnabled.google || oauthEnabled.facebook) && (
                      <RegisterOAuthButtons state={registerState} oauthEnabled={oauthEnabled} />
                    )}
                    <RegisterFields state={registerState} />
                    <div className="mt-4">
                      <RegisterTermsNotice locale={locale} />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
