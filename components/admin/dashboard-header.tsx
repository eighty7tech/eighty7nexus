"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { ArrowUpRight, BarChart3, ShoppingBag } from "lucide-react";

import { cn } from "@/lib/utils";
import { buttonClassFor } from "@/lib/admin-header-button-style";
import type { HeaderButtonStyle } from "./dashboard/dashboard-layout-types";

type GreetingKey = "goodMorning" | "goodAfternoon" | "goodEvening";

function resolveGreetingKey(): GreetingKey {
  const hour = new Date().getHours();
  if (hour < 12) return "goodMorning";
  if (hour < 18) return "goodAfternoon";
  return "goodEvening";
}

export function DashboardHeader({
  userName,
  buttonStyle = "default",
}: {
  userName?: string;
  buttonStyle?: HeaderButtonStyle;
}) {
  const t = useTranslations();
  const intlLocale = useLocale();
  const params = useParams<{ locale: string }>();
  const locale = params?.locale || intlLocale || "en";

  const [greetingKey, setGreetingKey] = React.useState<GreetingKey>(
    resolveGreetingKey,
  );

  React.useEffect(() => {
    const update = () => setGreetingKey(resolveGreetingKey());
    update();
    const interval = setInterval(update, 60_000);
    return () => clearInterval(interval);
  }, []);

  const displayName =
    userName?.trim() || t("common.guest");

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-lg font-semibold tracking-tight text-foreground sm:text-2xl">
          {t(`admin.dashboardPage.${greetingKey}`, {
            name: displayName,
            defaultMessage:
              greetingKey === "goodMorning"
                ? `Good morning, ${displayName}.`
                : greetingKey === "goodAfternoon"
                  ? `Good afternoon, ${displayName}.`
                  : `Good evening, ${displayName}.`,
          })}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("admin.dashboardPage.subtitle")}
        </p>
      </div>
      <div className="flex w-full items-stretch gap-2 sm:w-auto">
        <Link
          href={`/${locale}/admin/analytics`}
          className={cn(
            "group inline-flex h-9 flex-1 items-center justify-center gap-2 px-3.5 text-sm font-semibold text-foreground sm:flex-none",
            buttonClassFor(buttonStyle, "secondary")
          )}
        >
          <BarChart3 className="size-4 text-muted-foreground transition-colors group-hover:text-foreground" />
          {t("admin.sidebar.analytics")}
          <ArrowUpRight className="size-3.5 text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground rtl:-scale-x-100" />
        </Link>
        <Link
          href={`/${locale}/admin/orders`}
          className={cn(
            "group inline-flex h-9 flex-1 items-center justify-center gap-2 px-3.5 text-sm font-semibold sm:flex-none",
            buttonClassFor(buttonStyle, "primary")
          )}
        >
          <ShoppingBag className="size-4" />
          {t("admin.sidebar.orders")}
          <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 rtl:-scale-x-100" />
        </Link>
      </div>
    </div>
  );
}
