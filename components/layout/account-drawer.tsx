"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Shield, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { type Locale } from "@/config/i18n.config";

export interface AccountDrawerProps {
  locale: Locale;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  /** Server-resolved on the store layout, same flags the /login page gets. */
  oauthEnabled: OAuthEnabled;
  demoModeEnabled: boolean;
  emailVerificationRequired: boolean;
}

/**
 * The guest half of the bottom nav's Account tab: the real sign-in and sign-up
 * forms, in a sheet.
 *
 * The tab used to link to /login, which threw a shopper off the page they were
 * browsing just to reach a form. Here they fill it in place — same hooks the
 * /login and /register pages use, so OAuth, 2FA, email verification and the
 * demo quick-login all behave identically.
 *
 * No `redirectTo` is passed: a shopper tapping "Account" asked for their own
 * area, not for the page underneath, so `useLoginForm` sends each role to the
 * place it is actually allowed to land — admin and vendor to their dashboards,
 * staff to theirs, a customer to /account.
 *
 * Guests only. Signed-in shoppers have a real /account page, so their tab stays
 * a link and this never mounts for them.
 */
export function AccountDrawer({
  locale,
  isOpen,
  setIsOpen,
  oauthEnabled,
  demoModeEnabled,
  emailVerificationRequired,
}: AccountDrawerProps) {
  const t = useTranslations();
  const close = () => setIsOpen(false);

  const loginState = useLoginForm({ locale, onSuccess: close });
  const registerState = useRegisterForm({
    locale,
    emailVerificationRequired,
    onSuccess: close,
  });

  const showDemoCredentials = demoModeEnabled && demoCredentials.length > 0;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="w-[min(92vw,380px)] gap-0 overflow-y-auto p-0"
      >
        <div className="flex min-h-full flex-col pb-[env(safe-area-inset-bottom)]">
          {/* Same sticky bar as the menu drawer: the sheet's default close
              button floats over the content at 70% opacity, this one is a real
              36px target that stays put while a long form scrolls. */}
          <div className="sticky top-0 z-10 flex items-center gap-2 border-b bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80">
            <SheetTitle className="min-w-0 flex-1 truncate text-base font-bold">
              {loginState.requires2FA
                ? t("auth.twoFactorTitle")
                : t("common.account")}
            </SheetTitle>
            <SheetClose className="grid h-9 w-9 shrink-0 place-items-center rounded-full border bg-muted/60 text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-95">
              <X className="h-[18px] w-[18px]" />
              <span className="sr-only">{t("common.close")}</span>
            </SheetClose>
          </div>

          {loginState.requires2FA ? (
            /* Takes over the whole drawer — swapping tabs mid-challenge would
               lose the pending sign-in. */
            <div className="px-5 py-5">
              <div className="mb-4 flex flex-col items-center gap-2 text-center">
                <Shield className="h-10 w-10 text-primary" />
                <p className="text-sm text-muted-foreground">
                  {t("auth.twoFactorDescription")}
                </p>
              </div>
              <TwoFactorFields state={loginState} error={loginState.error} />
              <Button
                variant="link"
                className="mt-2 w-full"
                onClick={loginState.cancel2FA}
              >
                {t("auth.backToLogin")}
              </Button>
            </div>
          ) : (
            <Tabs defaultValue="signin" className="gap-0">
              <div className="px-5 pt-4">
                <TabsList className="w-full">
                  <TabsTrigger value="signin">{t("auth.signIn")}</TabsTrigger>
                  <TabsTrigger value="register">
                    {t("auth.signUp")}
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="signin" className="px-5 py-5">
                <LoginOAuthButtons
                  state={loginState}
                  oauthEnabled={oauthEnabled}
                  dividerClassName="bg-background"
                />
                <LoginFields state={loginState} error={loginState.error} />

                {showDemoCredentials && (
                  <>
                    <Separator className="my-5" />
                    <div className="mb-2">
                      <p className="text-sm font-semibold">
                        Demo account login credentials
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Select a role to fill the login form.
                      </p>
                    </div>
                    <DemoCredentialsList state={loginState} />
                  </>
                )}
              </TabsContent>

              {/* No "become a vendor" pitch here — that lives on the full
                  /register page, where there is room for it. */}
              <TabsContent value="register" className="px-5 py-5">
                <RegisterOAuthButtons
                  state={registerState}
                  oauthEnabled={oauthEnabled}
                  dividerClassName="bg-background"
                />
                <RegisterFields state={registerState} />
                <div className="pt-4">
                  <RegisterTermsNotice locale={locale} />
                </div>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
