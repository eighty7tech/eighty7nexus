"use client";

import * as React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useCurrency } from "@/providers/currency-provider";
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
  ArrowLeft,
  Users,
  ShieldCheck,
  Database,
  RotateCcw,
  ShieldAlert,
  HardDrive,
  FileSpreadsheet,
  LayoutDashboard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAppSettings } from "@/providers/app-settings-provider";
import { POSWorkstationDisabled } from "@/components/pos/pos-workstation-disabled";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  listQueuedSales,
  removeQueuedSale,
  updateQueuedSale,
  recordPOSAuditLog,
  getRecentPOSAuditLogs,
  listPendingOfflineCustomers,
  readCatalogSnapshot,
  saveCatalogSnapshot,
  offlineScope,
  type OfflineSale,
  type POSAuditLogEntry,
  type OfflineCustomer,
  type OfflineCatalogSnapshot,
} from "@/lib/pos/offline-db";
import { syncOutbox } from "@/lib/pos/offline-sync";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function OfflineSyncWorkstationPage() {
  const t = useTranslations("offlineSync");
  const { formatPrice } = useCurrency();

  const [scope, setScope] = React.useState<string>("default");
  const [sales, setSales] = React.useState<OfflineSale[]>([]);
  const [customers, setCustomers] = React.useState<OfflineCustomer[]>([]);
  const [auditLogs, setAuditLogs] = React.useState<POSAuditLogEntry[]>([]);
  const [catalogSnapshot, setCatalogSnapshot] = React.useState<OfflineCatalogSnapshot | null>(null);

  const [activeTab, setActiveTab] = React.useState<"outbox" | "customers" | "audit" | "catalog">("outbox");
  const [isSyncingAll, setIsSyncingAll] = React.useState<boolean>(false);
  const [retryingId, setRetryingId] = React.useState<string | null>(null);
  const [isRefreshingCatalog, setIsRefreshingCatalog] = React.useState<boolean>(false);
  const [isOnline, setIsOnline] = React.useState<boolean>(true);

  // Manager Override state
  const [selectedSaleForOverride, setSelectedSaleForOverride] = React.useState<OfflineSale | null>(null);
  const [managerPin, setManagerPin] = React.useState<string>("");
  const [isVerifyingPin, setIsVerifyingPin] = React.useState<boolean>(false);

  // Void confirmation state
  const [saleToVoid, setSaleToVoid] = React.useState<OfflineSale | null>(null);

  // Network monitor
  React.useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Load workstation data
  const loadData = React.useCallback(async () => {
    try {
      const [queued, custs, logs, cat] = await Promise.all([
        listQueuedSales(scope),
        listPendingOfflineCustomers(),
        getRecentPOSAuditLogs(scope, 40),
        readCatalogSnapshot(scope),
      ]);
      setSales(queued);
      setCustomers(custs);
      setAuditLogs(logs);
      setCatalogSnapshot(cat);
    } catch {
      // IndexedDB query error
    }
  }, [scope]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const pendingSales = React.useMemo(
    () => sales.filter((s) => s.status !== "needs_review"),
    [sales],
  );
  const conflictSales = React.useMemo(
    () => sales.filter((s) => s.status === "needs_review"),
    [sales],
  );

  // Sync Outbox
  const handleSyncAll = async () => {
    setIsSyncingAll(true);
    try {
      const summary = await syncOutbox(scope);
      await loadData();
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

  // Replay Single Sale
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
          lastError: body?.message || t("replayRejected"),
        });
        toast.error(body?.message || t("replayRejected"));
      }
      await loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("networkError"));
    } finally {
      setRetryingId(null);
    }
  };

  // Force-Commit with Manager PIN
  const handleForceCommitWithPin = async () => {
    if (!selectedSaleForOverride || !managerPin.trim()) return;
    setIsVerifyingPin(true);

    try {
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
        await loadData();
      } else {
        toast.error(orderJson.message || t("forceCommitFailed"));
      }
    } catch {
      toast.error(t("invalidPin"));
    } finally {
      setIsVerifyingPin(false);
    }
  };

  // Void Sale
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
      await loadData();
    } catch {
      toast.error(t("voidFailed"));
    }
  };

  // Force Refresh Catalog Snapshot
  const handleRefreshCatalog = async () => {
    setIsRefreshingCatalog(true);
    try {
      const res = await fetch("/api/pos/offline-catalog");
      const json = await res.json();
      if (json.success && json.data) {
        await saveCatalogSnapshot({
          scope,
          products: json.data.products || [],
          categories: json.data.categories || [],
          savedAt: new Date().toISOString(),
        });
        toast.success(t("refreshCatalogSuccess"));
        await loadData();
      } else {
        toast.error(t("refreshCatalogFailed"));
      }
    } catch {
      toast.error(t("refreshCatalogFailed"));
    } finally {
      setIsRefreshingCatalog(false);
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

  const { posOfflineSyncEnabled } = useAppSettings();

  if (!posOfflineSyncEnabled) {
    return (
      <POSWorkstationDisabled
        title={t("workstationDisabled")}
        description={t("workstationDisabledDesc")}
      />
    );
  }

  return (
    <div className="h-screen w-screen bg-background text-foreground font-sans select-none overflow-hidden flex flex-col">
      {/* Workstation Header */}
      <header className="h-16 px-6 bg-card/85 backdrop-blur-md border-b border-border/60 flex items-center justify-between shrink-0 shadow-xs">
        <div className="flex items-center gap-3">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="rounded-xl border-border/60 bg-background/80 hover:bg-muted text-xs h-9 font-semibold shadow-xs"
          >
            <Link href="/admin/pos">
              <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
              {t("backToPos")}
            </Link>
          </Button>

          <Button
            asChild
            variant="ghost"
            size="sm"
            className="rounded-xl text-muted-foreground hover:text-foreground text-xs h-9 font-medium"
          >
            <Link href="/admin/dashboard">
              <LayoutDashboard className="w-3.5 h-3.5 mr-1.5" />
              {t("backToDashboard")}
            </Link>
          </Button>

          <div className="h-4 w-px bg-border mx-1 hidden sm:block" />

          <div className="flex items-center gap-2">
            <CloudOff className="w-5 h-5 text-amber-500" />
            <h1 className="text-base font-bold text-foreground">{t("pageTitle")}</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Badge
            className={cn(
              "px-3 py-1 font-bold text-xs uppercase tracking-wider",
              isOnline
                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                : "bg-destructive/15 text-destructive border-destructive/30",
            )}
          >
            {isOnline ? t("statusOnline") : t("statusOffline")}
          </Badge>

          <Button
            size="sm"
            variant="outline"
            onClick={handleExportLedger}
            disabled={sales.length === 0}
            className="rounded-xl border-border/60 bg-background hover:bg-muted text-xs h-9 shadow-xs"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            {t("exportLedger")}
          </Button>

          <Button
            size="sm"
            onClick={handleSyncAll}
            disabled={isSyncingAll || sales.length === 0}
            className="rounded-xl text-xs font-semibold h-9 shadow-xs"
          >
            {isSyncingAll ? (
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            )}
            {isSyncingAll ? t("syncing") : t("syncAllNow")}
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-6 flex flex-col min-h-0 space-y-4 overflow-hidden">
        {/* KPI Dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0">
          <div className="p-4 bg-card border border-border/60 rounded-2xl flex items-center gap-3 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("kpiQueuedSales")}</p>
              <h3 className="text-xl font-extrabold text-foreground">{pendingSales.length}</h3>
            </div>
          </div>

          <div className="p-4 bg-card border border-border/60 rounded-2xl flex items-center gap-3 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("kpiSyncConflicts")}</p>
              <h3 className="text-xl font-extrabold text-destructive">{conflictSales.length}</h3>
            </div>
          </div>

          <div className="p-4 bg-card border border-border/60 rounded-2xl flex items-center gap-3 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("kpiOfflineCustomers")}</p>
              <h3 className="text-xl font-extrabold text-foreground">{customers.length}</h3>
            </div>
          </div>

          <div className="p-4 bg-card border border-border/60 rounded-2xl flex items-center gap-3 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("kpiCatalogStatus")}</p>
              <h3 className="text-xl font-extrabold text-foreground">
                {catalogSnapshot?.products?.length || 0}
              </h3>
            </div>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex gap-2 shrink-0 border-b border-border/60 pb-2">
          <Button
            size="sm"
            variant={activeTab === "outbox" ? "default" : "ghost"}
            onClick={() => setActiveTab("outbox")}
            className={cn(
              "rounded-xl text-xs font-semibold px-4",
              activeTab === "outbox" ? "bg-primary text-primary-foreground shadow-xs" : "text-muted-foreground",
            )}
          >
            <Clock className="w-3.5 h-3.5 mr-1.5" />
            {t("tabOutbox")} ({sales.length})
          </Button>
          <Button
            size="sm"
            variant={activeTab === "customers" ? "default" : "ghost"}
            onClick={() => setActiveTab("customers")}
            className={cn(
              "rounded-xl text-xs font-semibold px-4",
              activeTab === "customers" ? "bg-primary text-primary-foreground shadow-xs" : "text-muted-foreground",
            )}
          >
            <Users className="w-3.5 h-3.5 mr-1.5" />
            {t("tabCustomers")} ({customers.length})
          </Button>
          <Button
            size="sm"
            variant={activeTab === "audit" ? "default" : "ghost"}
            onClick={() => setActiveTab("audit")}
            className={cn(
              "rounded-xl text-xs font-semibold px-4",
              activeTab === "audit" ? "bg-primary text-primary-foreground shadow-xs" : "text-muted-foreground",
            )}
          >
            <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />
            {t("tabAuditLog")} ({auditLogs.length})
          </Button>
          <Button
            size="sm"
            variant={activeTab === "catalog" ? "default" : "ghost"}
            onClick={() => setActiveTab("catalog")}
            className={cn(
              "rounded-xl text-xs font-semibold px-4",
              activeTab === "catalog" ? "bg-primary text-primary-foreground shadow-xs" : "text-muted-foreground",
            )}
          >
            <Database className="w-3.5 h-3.5 mr-1.5" />
            {t("tabCatalog")}
          </Button>
        </div>

        {/* Tab 1: Sales Outbox */}
        {activeTab === "outbox" && (
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-0">
            {sales.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center text-muted-foreground bg-card/60 rounded-3xl border border-border/60 space-y-2 shadow-xs">
                <CheckCircle2 className="w-12 h-12 text-emerald-500/80 mb-1" />
                <p className="font-bold text-base text-foreground">{t("noQueuedSales")}</p>
                <p className="text-xs text-muted-foreground">{t("allSyncedSuccess")}</p>
              </div>
            ) : (
              sales.map((sale) => {
                const isConflict = sale.status === "needs_review";
                const isRetrying = retryingId === sale.clientRequestId;

                return (
                  <div
                    key={sale.clientRequestId}
                    className={cn(
                      "p-4 rounded-2xl border transition-all space-y-3 bg-card shadow-xs",
                      isConflict ? "border-destructive/40 bg-destructive/5 dark:bg-destructive/15" : "border-border/60",
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-foreground">
                            {sale.localReceiptNumber}
                          </span>
                          <Badge
                            className={cn(
                              "text-[10px] uppercase font-bold",
                              isConflict
                                ? "bg-destructive/15 text-destructive border-destructive/30"
                                : "bg-primary/10 text-primary border-primary/20",
                            )}
                          >
                            {isConflict ? t("needReview") : t("salePending")}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                          <span>{new Date(sale.queuedAt).toLocaleString()}</span>
                          <span>•</span>
                          <span className="font-bold text-foreground">{formatPrice(sale.total)}</span>
                          <span>•</span>
                          <span>{t("itemsSold", { count: sale.items?.length || 0 })}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRetrySale(sale)}
                          disabled={isRetrying}
                          className="h-8 rounded-xl bg-muted/60 hover:bg-muted text-foreground text-xs"
                        >
                          {isRetrying ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                          ) : (
                            <RotateCcw className="w-3.5 h-3.5 mr-1 text-primary" />
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
                            className="h-8 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs"
                          >
                            <KeyRound className="w-3.5 h-3.5 mr-1" />
                            {t("forceCommit")}
                          </Button>
                        )}

                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setSaleToVoid(sale)}
                          className="h-8 w-8 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>

                    {isConflict && sale.lastError && (
                      <div className="p-2.5 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold mr-1">{t("rejectionReason")}</span>
                          <span>{sale.lastError}</span>
                        </div>
                      </div>
                    )}

                    <div className="pt-2 border-t border-border/60 grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {sale.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="text-xs bg-background p-2 rounded-xl border border-border/50 flex justify-between items-center"
                        >
                          <span className="truncate mr-2 text-foreground font-medium">
                            {item.quantity}x {item.name}
                          </span>
                          <span className="font-mono text-muted-foreground shrink-0">
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
        )}

        {/* Tab 2: Offline Customers */}
        {activeTab === "customers" && (
          <div className="flex-1 overflow-y-auto pr-1 min-h-0 bg-card rounded-2xl border border-border/60 p-4 shadow-xs">
            {customers.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground space-y-2">
                <Users className="w-10 h-10 mx-auto opacity-50" />
                <p className="text-sm font-semibold text-foreground">{t("noOfflineCustomers")}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {customers.map((c) => (
                  <div
                    key={c.id}
                    className="p-3 bg-background rounded-xl border border-border/60 flex items-center justify-between shadow-xs"
                  >
                    <div>
                      <h4 className="font-semibold text-sm text-foreground">{c.name}</h4>
                      <p className="text-xs text-muted-foreground font-mono">{c.email || c.phone}</p>
                    </div>
                    <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 text-xs">
                      {c.syncStatus}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Audit Trail */}
        {activeTab === "audit" && (
          <div className="flex-1 overflow-y-auto pr-1 min-h-0 bg-card rounded-2xl border border-border/60 p-4 space-y-2 shadow-xs">
            {auditLogs.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground space-y-2">
                <ShieldCheck className="w-10 h-10 mx-auto opacity-50" />
                <p className="text-sm font-semibold text-foreground">{t("noAuditLogs")}</p>
              </div>
            ) : (
              auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 bg-background rounded-xl border border-border/60 flex items-center justify-between text-xs shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <Badge className="uppercase font-mono text-[10px] bg-muted text-foreground">
                      {log.action}
                    </Badge>
                    <span className="text-foreground font-medium">
                      {log.cashierName ? `By ${log.cashierName}` : "System"}
                    </span>
                    <span className="text-muted-foreground">
                      {JSON.stringify(log.details)}
                    </span>
                  </div>
                  <span className="text-muted-foreground font-mono">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 4: Catalog Cache */}
        {activeTab === "catalog" && (
          <div className="flex-1 bg-card rounded-2xl border border-border/60 p-6 flex flex-col justify-between shadow-xs">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-border/60">
                <div>
                  <h3 className="text-lg font-bold text-foreground">{t("tabCatalog")}</h3>
                  <p className="text-xs text-muted-foreground">
                    {t("catalogSnapshotDate")}:{" "}
                    {catalogSnapshot?.savedAt
                      ? new Date(catalogSnapshot.savedAt).toLocaleString()
                      : "None"}
                  </p>
                </div>
                <Button
                  onClick={handleRefreshCatalog}
                  disabled={isRefreshingCatalog || !isOnline}
                  className="rounded-xl text-xs font-semibold shadow-xs"
                >
                  {isRefreshingCatalog ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-1.5" />
                  )}
                  {t("refreshCatalog")}
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-background rounded-xl border border-border/60 space-y-1 shadow-xs">
                  <p className="text-xs text-muted-foreground">{t("catalogCachedProducts")}</p>
                  <p className="text-2xl font-extrabold text-foreground">
                    {catalogSnapshot?.products?.length || 0}
                  </p>
                </div>
                <div className="p-4 bg-background rounded-xl border border-border/60 space-y-1 shadow-xs">
                  <p className="text-xs text-muted-foreground">{t("catalogCachedCategories")}</p>
                  <p className="text-2xl font-extrabold text-foreground">
                    {catalogSnapshot?.categories?.length || 0}
                  </p>
                </div>
              </div>
            </div>

            <footer className="text-xs text-muted-foreground text-center">
              {t("pageSubtitle")}
            </footer>
          </div>
        )}
      </main>

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
        <DialogContent className="bg-card border-border/60 text-foreground max-w-md rounded-2xl shadow-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-500">
              <ShieldAlert className="w-5 h-5" />
              {t("managerPinTitle")}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {t("managerPinDescription")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="p-3 bg-muted/40 rounded-xl border border-border/60 text-xs space-y-1">
              <div className="flex justify-between text-muted-foreground">
                <span>Receipt:</span>
                <span className="font-mono text-foreground font-bold">
                  {selectedSaleForOverride?.localReceiptNumber}
                </span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Total:</span>
                <span className="font-bold text-primary">
                  {selectedSaleForOverride && formatPrice(selectedSaleForOverride.total)}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">{t("managerPinTitle")}</label>
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
                className="bg-background border-border/60 text-center font-mono text-lg tracking-widest rounded-xl"
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
              className="rounded-xl border-border/60 text-xs"
            >
              {t("cancel")}
            </Button>
            <Button
              onClick={handleForceCommitWithPin}
              disabled={!managerPin.trim() || isVerifyingPin}
              className="rounded-xl font-bold text-xs"
            >
              {isVerifyingPin && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />}
              {t("authorizeAndCommit")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Void Confirmation Dialog */}
      <Dialog
        open={Boolean(saleToVoid)}
        onOpenChange={(open) => {
          if (!open) setSaleToVoid(null);
        }}
      >
        <DialogContent className="bg-card border-border/60 text-foreground max-w-sm rounded-2xl shadow-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              {t("voidSale")}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs">
              {t("confirmVoid")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSaleToVoid(null)}
              className="rounded-xl border-border/60 text-xs"
            >
              {t("cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => saleToVoid && handleVoidSale(saleToVoid)}
              className="rounded-xl font-semibold text-xs"
            >
              {t("voidSale")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
