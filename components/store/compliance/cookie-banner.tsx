"use client";

import { useEffect, useState } from "react";
import { X, Cookie } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { IComplianceSettings } from "@/models/settings.model";
import Link from "next/link";

export function CookieBanner({
  settings,
}: {
  settings?: IComplianceSettings["cookieConsent"];
}) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!settings?.enabled) return;

    // Check if user has already made a choice
    const consent = localStorage.getItem("cookie_consent");
    if (!consent) {
      // Small delay for better UX
      const timer = setTimeout(() => setShow(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [settings]);

  if (!show || !settings?.enabled) return null;

  const handleAccept = () => {
    localStorage.setItem("cookie_consent", "accepted");
    setShow(false);
  };

  const handleDecline = () => {
    localStorage.setItem("cookie_consent", "declined");
    setShow(false);
  };

  const isModal = settings.layout === "center-modal";
  const themeClass =
    settings.theme === "dark"
      ? "dark bg-background text-foreground"
      : settings.theme === "light"
      ? "bg-white text-black"
      : "bg-background text-foreground";

  return (
    <div
      className={cn(
        "fixed z-50 animate-in fade-in slide-in-from-bottom-4 duration-500",
        isModal
          ? "inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
          : "bottom-0 left-0 right-0 sm:bottom-4 sm:left-4 sm:right-auto sm:max-w-md p-4 sm:p-0"
      )}
    >
      <div
        className={cn(
          "relative rounded-xl border shadow-xl p-6",
          themeClass,
          isModal ? "w-full max-w-lg" : "w-full"
        )}
      >
        <button
          onClick={handleDecline}
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close cookie banner"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex gap-4 mb-4">
          <div className="p-3 bg-primary/10 text-primary rounded-full shrink-0 h-fit">
            <Cookie className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-semibold mb-2">{settings.text.title}</h2>
            <p className="text-sm text-muted-foreground/90 leading-relaxed">
              {settings.text.message}
              {settings.privacyPolicyUrl && (
                <>
                  {" "}
                  <Link
                    href={settings.privacyPolicyUrl}
                    className="text-primary hover:underline font-medium"
                  >
                    Learn more
                  </Link>
                </>
              )}
            </p>
          </div>
        </div>

        <div
          className={cn(
            "flex gap-3",
            isModal ? "justify-end mt-6" : "flex-col sm:flex-row mt-4"
          )}
        >
          <Button
            variant="outline"
            onClick={handleDecline}
            className={cn(isModal ? "" : "w-full sm:w-auto flex-1")}
          >
            {settings.text.declineButton}
          </Button>
          <Button
            onClick={handleAccept}
            className={cn(isModal ? "" : "w-full sm:w-auto flex-1")}
          >
            {settings.text.acceptButton}
          </Button>
        </div>
      </div>
    </div>
  );
}
