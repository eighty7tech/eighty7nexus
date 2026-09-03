"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, LayoutDashboard, Settings, PowerOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslations } from "next-intl";

interface POSWorkstationDisabledProps {
  title?: string;
  description?: string;
}

export function POSWorkstationDisabled({
  title,
  description,
}: POSWorkstationDisabledProps) {
  const t = useTranslations("admin.settings.pos");

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-background/95 p-4 select-none">
      <Card className="max-w-md w-full border-border/60 shadow-xl bg-card/80 backdrop-blur-md text-center p-6 sm:p-8">
        <CardContent className="flex flex-col items-center space-y-5 p-0">
          <div className="h-16 w-16 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center ring-8 ring-destructive/5">
            <PowerOff className="h-8 w-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              {title || t("workstationDisabled")}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {description || t("workstationDisabledDesc")}
            </p>
          </div>

          <div className="w-full flex flex-col gap-2 pt-3">
            <Button
              asChild
              className="w-full gap-2 rounded-xl h-11 font-medium shadow-xs"
            >
              <Link href="/admin/pos">
                <ArrowLeft className="h-4 w-4" />
                {t("backToPos")}
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              className="w-full gap-2 rounded-xl h-11 font-medium"
            >
              <Link href="/admin/dashboard">
                <LayoutDashboard className="h-4 w-4" />
                {t("backToDashboard")}
              </Link>
            </Button>

            <Button
              asChild
              variant="ghost"
              className="w-full gap-2 rounded-xl h-9 text-xs text-muted-foreground hover:text-foreground"
            >
              <Link href="/admin/settings/pos">
                <Settings className="h-3.5 w-3.5" />
                {t("title")}
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
