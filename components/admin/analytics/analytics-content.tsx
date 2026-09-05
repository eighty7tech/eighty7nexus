"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { useLocale, useTranslations } from "next-intl";
import { apiClient } from "@/lib/api/client";
import { Settings, AlertCircle, BarChart3, RefreshCcw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Script from "next/script";

// ─── Not Configured ───────────────────────────────────────────────────────────

function NotConfigured({
  locale,
  area,
  t,
}: {
  locale: string;
  area: "admin" | "staff";
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <Card className="!rounded-sm border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-16 text-center gap-4">
        <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center">
          <BarChart3 className="h-7 w-7 text-muted-foreground" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">
            {t("admin.analyticsPage.notConfigured.title")}
          </h3>
          <p className="text-sm text-muted-foreground mt-1.5 max-w-sm">
            {t("admin.analyticsPage.notConfigured.description")}
          </p>
        </div>
        {area === "admin" ? (
          <Link href={`/${locale}/admin/settings?section=analytics`}>
            <Button variant="outline" className="gap-2">
              <Settings className="h-4 w-4" />
              {t("admin.analyticsPage.notConfigured.cta")}
            </Button>
          </Link>
        ) : null}
      </CardContent>
    </Card>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function AdminAnalyticsContent({
  area = "admin",
}: {
  area?: "admin" | "staff";
}) {
  const t = useTranslations();
  const localeFromIntl = useLocale();
  const params = useParams<{ locale: string }>();
  const locale = params.locale || localeFromIntl || "en";

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchEmbedUrl = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const res = await apiClient.get<{
        configured?: boolean;
        data?: { embedUrl?: string };
      }>("/api/admin/analytics/plausible?metric=embed");

      const isConfigured = res?.configured !== false;
      setConfigured(isConfigured);

      if (isConfigured && res?.data?.embedUrl) {
        setEmbedUrl(res.data.embedUrl);
      }
    } catch {
      setError("loadFailed");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchEmbedUrl();
  }, [fetchEmbedUrl]);

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* ── Header ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t("admin.sidebar.analytics")}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {t("admin.analyticsPage.subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => fetchEmbedUrl(true)}
            disabled={refreshing || loading}
            className="h-8 w-8"
          >
            <RefreshCcw
              className={cn("h-3.5 w-3.5", refreshing && "animate-spin")}
            />
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 px-4 py-2.5 rounded-lg border border-destructive/20">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error === "loadFailed"
            ? t("admin.analyticsPage.errors.loadFailed")
            : error}
        </div>
      )}

      {/* ── Plausible Embed Section ── */}
      {loading && configured === null ? (
        <div className="flex flex-col gap-4">
          <div className="h-24 w-full rounded-sm bg-muted animate-pulse" />
          <div className="h-[400px] w-full rounded-sm bg-muted animate-pulse" />
        </div>
      ) : configured === false || !embedUrl ? (
        <NotConfigured locale={locale} area={area} t={t} />
      ) : (
        <Card className="!rounded-sm border-[#dfe5ee] dark:border-border overflow-hidden min-h-[1600px] flex-1">
          <iframe
            plausible-embed="true"
            src={embedUrl}
            scrolling="no"
            frameBorder="0"
            loading="lazy"
            className="w-full min-w-full h-full min-h-[1600px]"
            title="Plausible Analytics Dashboard"
          />
          <Script async src="https://plausible.io/js/embed.host.js" />
        </Card>
      )}
    </div>
  );
}
