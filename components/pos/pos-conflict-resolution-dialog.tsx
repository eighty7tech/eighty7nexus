"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useCurrency } from "@/providers/currency-provider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  CloudOff,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Download,
  Trash2,
  KeyRound,
  Loader2,
  Package,
  Layers,
  Clock,
  Receipt,
  RotateCcw,
  Check,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";
import {
  listQueuedSales,
  removeQueuedSale,
  updateQueuedSale,
  recordPOSAuditLog,
  type OfflineSale,
} from "@/lib/pos/offline-db";
import { syncOutbox } from "@/lib/pos/offline-sync";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface POSConflictResolutionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scope: string;
  onQueueUpdated?: () => void;
}

export function POSConflictResolutionDialog({
  open,
  onOpenChange,
  scope,
  onQueueUpdated,
}: POSConflictResolutionDialogProps) {
  const t = useTranslations("offlineSync");
  const { formatPrice } = useCurrency();

  const [sales, setSales] = React.useState<OfflineSale[]>([]);
  const [activeTab, setActiveTab] = React.useState<"all" | "pending" | "conflicts">("all");
  const [isSyncingAll, setIsSyncingAll] = React.useState<boolean>(false);
  const [retryingId, setRetryingId] = React.useState<string | null>(null);

  // Manager Override Modal state
  const [selectedSaleForOverride, setSelectedSaleForOverride] = React.useState<OfflineSale | null>(null);
  const [managerPin, setManagerPin] = React.useState<string>("");
  const [isVerifyingPin, setIsVerifyingPin] = React.useState<boolean>(false);

  // Void confirmation state
  const [saleToVoid, setSaleToVoid] = React.useState<OfflineSale | null>(null);

  // Load queued sales
  const loadQueue = React.useCallback(async () => {
    try {
      const queued = await listQueuedSales(scope);
      setSales(queued);
    } catch {
      // IndexedDB read error
    }
  }, [scope]);

  React.useEffect(() => {
    if (open) {
      loadQueue();
    }
  }, [open, loadQueue]);

  // Tab filtering
  const pendingSales = React.useMemo(
    () => sales.filter((s) => s.status !== "needs_review"),
    [sales],
  );
  const conflictSales = React.useMemo(
    () => sales.filter((s) => s.status === "needs_review"),
    [sales],
  );

  const displayedSales = React.useMemo(() => {
    if (activeTab === "pending") return pendingSales;
    if (activeTab === "conflicts") return conflictSales;
    return sales;
  }, [activeTab, sales, pendingSales, conflictSales]);

  // Sync All Queue
  const handleSyncAll = async () => {
    setIsSyncingAll(true);
    try {
      const summary = await syncOutbox(scope);
      await loadQueue();
      onQueueUpdated?.();

      if (summary.committed > 0) {
        toast.success(t("allSyncedSuccess"));
      }
      if (summary.needsReview > 0) {
        toast.warning(t("needsReview", { count: summary.needsReview }));
      }
    } catch {
      toast.error(t("syncFailed"));
    } finally {
      setIsSyncingAll(false);
    }
  };

  // Single Sale Retry
  const handleRetrySale = async (sale: OfflineSale) => {
    setRetryingId(sale.clientRequestId);
    try {
      const res = await fetch("/api/pos/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sale.payload),
      });
      const body = await res.json().catch(() => null);

      if (res.ok && body?.success) {
        await removeQueuedSale(sale.clientRequestId);
        toast.success(t("receiptNumber", { number: sale.localReceiptNumber }));
      } else {
        await updateQueuedSale({
          ...sale,
          status: "needs_review",
          attempts: sale.attempts + 1,
          lastError: body?.message || `Server rejected (${res.status})`,
        });
        toast.error(body?.message || t("replayRejected"));
      }
      await loadQueue();
      onQueueUpdated?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("networkError"));
    } finally {
      setRetryingId(null);
    }
  };

  // Manager Override Force-Commit
  const handleForceCommitWithPin = async () => {
    if (!selectedSaleForOverride || !managerPin.trim()) return;
    setIsVerifyingPin(true);

    try {
      // 1. Verify PIN via /api/pos/override
      const verifyRes = await fetch("/api/pos/override", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pin: managerPin.trim(),
          action: "OVERRIDE_OFFLINE_SYNC",
        }),
      });
      const verifyJson = await verifyRes.json();

      if (!verifyJson.success) {
        toast.error(verifyJson.message || t("invalidPin"));
        return;
      }

      // 2. Submit order with manager override authorization
      const forcedPayload = {
        ...selectedSaleForOverride.payload,
        allowOversell: true,
        managerOverrideApprovedBy: verifyJson.data?.approvedBy,
        managerOverrideApprovedById: verifyJson.data?.approvedById,
      };

      const orderRes = await fetch("/api/pos/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(forcedPayload),
      });
      const orderJson = await orderRes.json();

      if (orderRes.ok && orderJson.success) {
        await removeQueuedSale(selectedSaleForOverride.clientRequestId);
        await recordPOSAuditLog(
          scope,
          "sale",
          {
            forcedSale: true,
            receiptNumber: selectedSaleForOverride.localReceiptNumber,
            total: selectedSaleForOverride.total,
          },
          verifyJson.data?.approvedBy,
        );

        toast.success(t("forceCommitSuccess"));
        setSelectedSaleForOverride(null);
        setManagerPin("");
        await loadQueue();
        onQueueUpdated?.();
      } else {
        toast.error(orderJson.message || t("forceCommitFailed"));
      }
    } catch {
      toast.error(t("invalidPin"));
    } finally {
      setIsVerifyingPin(false);
    }
  };

  // Void Sale from Queue
  const handleVoidSale = async (sale: OfflineSale) => {
    try {
      await removeQueuedSale(sale.clientRequestId);
      await recordPOSAuditLog(
        scope,
        "void",
        {
          clientRequestId: sale.clientRequestId,
          receiptNumber: sale.localReceiptNumber,
          total: sale.total,
        },
      );
      toast.success(t("saleVoidedSuccess"));
      setSaleToVoid(null);
      await loadQueue();
      onQueueUpdated?.();
    } catch {
      toast.error(t("voidFailed"));
    }
  };

  // Export Outbox Ledger
  const handleExportLedger = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(sales, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `pos-offline-outbox-${scope}-${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      toast.success(t("exportSuccess"));
    } catch {
      toast.error(t("exportFailed"));
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-3xl max-h-[85vh] flex flex-col p-6 overflow-hidden">
          <DialogHeader className="shrink-0 pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <CloudOff className="w-5 h-5" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-bold">{t("dialogTitle")}</DialogTitle>
                  <DialogDescription className="text-xs text-slate-400">
                    {t("dialogSubtitle")}
                  </DialogDescription>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleExportLedger}
                  disabled={sales.length === 0}
                  className="rounded-xl border-slate-700 bg-slate-800 text-white text-xs h-9"
                >
                  <Download className="w-3.5 h-3.5 mr-1.5" />
                  {t("exportLedger")}
                </Button>
                <Button
                  size="sm"
                  onClick={handleSyncAll}
                  disabled={isSyncingAll || sales.length === 0}
                  className="rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold h-9"
                >
                  {isSyncingAll ? (
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                  )}
                  {isSyncingAll ? t("syncing") : t("syncAllNow")}
                </Button>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 pt-3">
              <Button
                size="sm"
                variant={activeTab === "all" ? "default" : "ghost"}
                onClick={() => setActiveTab("all")}
                className={cn(
                  "rounded-xl text-xs font-semibold h-8",
                  activeTab === "all" ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white",
                )}
              >
                {t("tabAll", { count: sales.length })}
              </Button>
              <Button
                size="sm"
                variant={activeTab === "pending" ? "default" : "ghost"}
                onClick={() => setActiveTab("pending")}
                className={cn(
                  "rounded-xl text-xs font-semibold h-8",
                  activeTab === "pending" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white",
                )}
              >
                {t("tabPending", { count: pendingSales.length })}
              </Button>
              <Button
                size="sm"
                variant={activeTab === "conflicts" ? "default" : "ghost"}
                onClick={() => setActiveTab("conflicts")}
                className={cn(
                  "rounded-xl text-xs font-semibold h-8",
                  activeTab === "conflicts" ? "bg-rose-600 text-white" : "text-slate-400 hover:text-white",
                )}
              >
                {t("tabConflicts", { count: conflictSales.length })}
              </Button>
            </div>
          </DialogHeader>

          {/* Sales List */}
          <div className="flex-1 overflow-y-auto space-y-3 py-2 pr-1 custom-scrollbar min-h-0">
            {displayedSales.length === 0 ? (
              <div className="py-16 text-center text-slate-500 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto opacity-70" />
                <p className="text-sm font-semibold text-slate-300">{t("noQueuedSales")}</p>
              </div>
            ) : (
              displayedSales.map((sale) => {
                const isConflict = sale.status === "needs_review";
                const isRetrying = retryingId === sale.clientRequestId;

                return (
                  <div
                    key={sale.clientRequestId}
                    className={cn(
                      "p-4 rounded-2xl border transition-all space-y-3 bg-slate-950",
                      isConflict
                        ? "border-rose-500/40 bg-rose-950/10"
                        : "border-slate-800 hover:border-slate-700",
                    )}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-white">
                            {sale.localReceiptNumber}
                          </span>
                          <Badge
                            className={cn(
                              "text-[10px] uppercase font-bold tracking-wider",
                              isConflict
                                ? "bg-rose-500/20 text-rose-400 border-rose-500/30"
                                : "bg-blue-500/20 text-blue-400 border-blue-500/30",
                            )}
                          >
                            {isConflict
                              ? t("needReview")
                              : t("salePending")}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {new Date(sale.queuedAt).toLocaleTimeString()}
                          </span>
                          <span>•</span>
                          <span className="font-bold text-slate-200">
                            {formatPrice(sale.total)}
                          </span>
                          <span>•</span>
                          <span>{t("itemsSold", { count: sale.items?.length || 0 })}</span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRetrySale(sale)}
                          disabled={isRetrying}
                          className="h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs"
                        >
                          {isRetrying ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                          ) : (
                            <RotateCcw className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                          )}
                          {t("retrySync")}
                        </Button>

                        {isConflict && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedSaleForOverride(sale);
                              setManagerPin("");
                            }}
                            className="h-8 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs"
                          >
                            <KeyRound className="w-3.5 h-3.5 mr-1" />
                            {t("forceCommit")}
                          </Button>
                        )}

                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setSaleToVoid(sale)}
                          className="h-8 w-8 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* Conflict Explanation if any */}
                    {isConflict && sale.lastError && (
                      <div className="p-2.5 rounded-xl bg-rose-950/30 border border-rose-500/20 text-xs text-rose-300 flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                        <div>
                          <span className="font-semibold mr-1">{t("rejectionReason")}</span>
                          <span>{sale.lastError}</span>
                        </div>
                      </div>
                    )}

                    {/* Item lines breakdown */}
                    <div className="pt-2 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {sale.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="text-xs bg-slate-900/60 p-2 rounded-xl border border-slate-800/60 flex justify-between items-center"
                        >
                          <span className="truncate mr-2 text-slate-300 font-medium">
                            {item.quantity}x {item.name}
                          </span>
                          <span className="font-mono text-slate-400 shrink-0">
                            {formatPrice(item.price * item.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <DialogFooter className="pt-2 shrink-0 border-t border-slate-800">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl border-slate-700 bg-slate-800 text-white text-xs h-9"
            >
              {t("cancel")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manager Override PIN Dialog */}
      <Dialog
        open={Boolean(selectedSaleForOverride)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedSaleForOverride(null);
            setManagerPin("");
          }
        }}
      >
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-400">
              <ShieldAlert className="w-5 h-5" />
              {t("managerPinTitle")}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {t("managerPinDescription")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1">
              <div className="flex justify-between text-slate-400">
                <span>Receipt:</span>
                <span className="font-mono text-white font-bold">
                  {selectedSaleForOverride?.localReceiptNumber}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Total:</span>
                <span className="font-bold text-emerald-400">
                  {selectedSaleForOverride && formatPrice(selectedSaleForOverride.total)}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">{t("managerPinTitle")}</label>
              <Input
                type="password"
                maxLength={8}
                placeholder={t("managerPinPlaceholder")}
                value={managerPin}
                onChange={(e) => setManagerPin(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && managerPin.trim()) {
                    handleForceCommitWithPin();
                  }
                }}
                className="bg-slate-950 border-slate-800 text-white text-center font-mono text-lg tracking-widest"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedSaleForOverride(null);
                setManagerPin("");
              }}
              className="rounded-xl border-slate-700 bg-slate-800 text-white text-xs"
            >
              {t("cancel")}
            </Button>
            <Button
              onClick={handleForceCommitWithPin}
              disabled={!managerPin.trim() || isVerifyingPin}
              className="rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs"
            >
              {isVerifyingPin ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
              {t("authorizeAndCommit")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Void Sale Confirmation Dialog */}
      <Dialog
        open={Boolean(saleToVoid)}
        onOpenChange={(open) => {
          if (!open) setSaleToVoid(null);
        }}
      >
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-400">
              <AlertTriangle className="w-5 h-5" />
              {t("voidSale")}
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-xs">
              {t("confirmVoid")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSaleToVoid(null)}
              className="rounded-xl border-slate-700 bg-slate-800 text-white text-xs"
            >
              {t("cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => saleToVoid && handleVoidSale(saleToVoid)}
              className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold"
            >
              {t("voidSale")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
