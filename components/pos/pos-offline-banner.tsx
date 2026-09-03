"use client";

import { formatDistanceToNow } from "date-fns";
import { CloudOff, Loader2, RefreshCw, TriangleAlert, Layers } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { OfflineSale } from "@/lib/pos/offline-db";

interface POSOfflineBannerProps {
  isOffline: boolean;
  snapshotAt: string | null;
  queued: OfflineSale[];
  isSyncing: boolean;
  onSync: () => void;
  onOpenReview?: () => void;
}

/**
 * Tells the cashier which mode they are selling in, and what is still owed to
 * the server.
 */
export function POSOfflineBanner({
  isOffline,
  snapshotAt,
  queued,
  isSyncing,
  onSync,
  onOpenReview,
}: POSOfflineBannerProps) {
  const t = useTranslations("offlineSync");
  const pending = queued.filter((sale) => sale.status !== "needs_review").length;
  const needsReview = queued.filter(
    (sale) => sale.status === "needs_review",
  ).length;

  if (!isOffline && pending === 0 && needsReview === 0) return null;

  const snapshotAge =
    snapshotAt && !Number.isNaN(new Date(snapshotAt).getTime())
      ? formatDistanceToNow(new Date(snapshotAt), { addSuffix: true })
      : null;

  return (
    <div
      role="status"
      className={cn(
        "flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-xl border px-3 py-2 text-sm",
        isOffline
          ? "border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-200"
          : needsReview > 0
            ? "border-red-500/40 bg-red-500/10 text-red-900 dark:text-red-200"
            : "border-border/60 bg-muted/60 text-foreground",
      )}
    >
      {isOffline ? (
        <>
          <CloudOff className="h-4 w-4 shrink-0" aria-hidden />
          <span className="font-medium">{t("offlineBannerTitle")}</span>
          {snapshotAge && (
            <span className="text-xs opacity-80">
              {t("stockFrom", { age: snapshotAge })}
            </span>
          )}
        </>
      ) : (
        <>
          <RefreshCw className="h-4 w-4 shrink-0" aria-hidden />
          <span className="font-medium">{t("backOnline")}</span>
        </>
      )}

      {pending > 0 && (
        <button
          type="button"
          onClick={onOpenReview}
          className="rounded-full bg-background/70 hover:bg-background/90 px-2.5 py-0.5 text-xs font-medium transition-colors cursor-pointer"
        >
          {pending === 1 ? t("salePending") : t("salesPending", { count: pending })}
        </button>
      )}

      {needsReview > 0 && (
        <button
          type="button"
          onClick={onOpenReview}
          className="inline-flex items-center gap-1 rounded-full bg-red-500/15 hover:bg-red-500/25 px-2.5 py-0.5 text-xs font-bold text-rose-400 transition-colors cursor-pointer"
        >
          <TriangleAlert className="h-3 w-3" aria-hidden />
          {needsReview === 1 ? t("needReview") : t("needsReview", { count: needsReview })}
        </button>
      )}

      <div className="ml-auto flex items-center gap-2">
        {onOpenReview && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-7 text-xs"
            onClick={onOpenReview}
          >
            <Layers className="h-3.5 w-3.5 mr-1" />
            {t("viewOutbox")}
          </Button>
        )}

        {!isOffline && (pending > 0 || needsReview > 0) && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 text-xs font-semibold"
            onClick={onSync}
            disabled={isSyncing}
          >
            {isSyncing && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />}
            {t("syncAllNow")}
          </Button>
        )}
      </div>
    </div>
  );
}
