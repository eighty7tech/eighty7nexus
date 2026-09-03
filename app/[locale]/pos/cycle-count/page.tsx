"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useCurrency } from "@/providers/currency-provider";
import {
  ClipboardCheck,
  Barcode,
  Camera,
  Search,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Save,
  Check,
  Layers,
  ArrowUpDown,
  Plus,
  Minus,
  Sparkles,
  Building2,
  TrendingDown,
  TrendingUp,
  History,
  X,
  Loader2,
  ArrowLeft,
  LayoutDashboard,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAppSettings } from "@/providers/app-settings-provider";
import { POSWorkstationDisabled } from "@/components/pos/pos-workstation-disabled";
import { BarcodeCameraDialog } from "@/components/pos/barcode-camera-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface AuditItem {
  productId: string;
  variantId?: string;
  name: string;
  sku: string;
  barcode?: string;
  expectedQty: number;
  countedQty: number;
  variance: number;
  unitPrice: number;
  costPrice?: number;
  countedAt?: string;
}

interface AuditSession {
  _id: string;
  auditNumber: string;
  name: string;
  status: "draft" | "in_progress" | "completed" | "cancelled";
  locationId?: string;
  locationName?: string;
  items: AuditItem[];
  totalExpectedQty: number;
  totalCountedQty: number;
  totalVarianceQty: number;
  totalVarianceValue: number;
  createdAt: string;
}

export default function CycleCountPage() {
  const t = useTranslations("stockAudit");
  const { formatPrice } = useCurrency();

  const [activeSession, setActiveSession] = React.useState<AuditSession | null>(null);
  const [pastSessions, setPastSessions] = React.useState<AuditSession[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isCommitting, setIsCommitting] = React.useState(false);

  // Search & Filter
  const [searchQuery, setSearchQuery] = React.useState("");
  const [filterTab, setFilterTab] = React.useState<"all" | "discrepancy" | "matched" | "uncounted">("all");

  // Camera Barcode Scanner
  const [cameraOpen, setCameraOpen] = React.useState(false);

  // Modals
  const [showNewAuditDialog, setShowNewAuditDialog] = React.useState(false);
  const [showCommitDialog, setShowCommitDialog] = React.useState(false);
  const [newAuditName, setNewAuditName] = React.useState("");

  // Play audio chime
  const playChime = React.useCallback((type: "success" | "warn") => {
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      if (type === "success") {
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08); // A5
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      } else {
        osc.frequency.setValueAtTime(320, ctx.currentTime);
        osc.frequency.setValueAtTime(240, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      }
    } catch {
      // AudioContext unavailable or blocked
    }
  }, []);

  // Fetch past & active sessions
  const fetchAudits = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/pos/stock-audits");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setPastSessions(json.data);
        const inProgress = json.data.find(
          (a: AuditSession) => a.status === "in_progress" || a.status === "draft",
        );
        if (inProgress && !activeSession) {
          setActiveSession(inProgress);
        }
      }
    } catch {
      toast.error(t("loadError"));
    } finally {
      setIsLoading(false);
    }
  }, [activeSession, t]);

  React.useEffect(() => {
    fetchAudits();
  }, [fetchAudits]);

  // Create new session
  const handleCreateAudit = async () => {
    if (!newAuditName.trim()) return;
    setIsSaving(true);
    try {
      const res = await fetch("/api/pos/stock-audits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newAuditName.trim() }),
      });
      const json = await res.json();
      if (json.success) {
        setActiveSession(json.data);
        setShowNewAuditDialog(false);
        setNewAuditName("");
        toast.success(t("sessionName"));
        fetchAudits();
      } else {
        toast.error(json.message || t("createError"));
      }
    } catch {
      toast.error(t("createError"));
    } finally {
      setIsSaving(false);
    }
  };

  // Adjust item count
  const handleAdjustCount = React.useCallback((productId: string, variantId: string | undefined, delta: number) => {
    if (!activeSession) return;
    setActiveSession((prev) => {
      if (!prev) return prev;
      const updated = prev.items.map((item) => {
        const matches =
          String(item.productId) === String(productId) &&
          (variantId ? item.variantId === variantId : !item.variantId);
        if (!matches) return item;
        const newCount = Math.max(0, item.countedQty + delta);
        return {
          ...item,
          countedQty: newCount,
          variance: newCount - item.expectedQty,
          countedAt: new Date().toISOString(),
        };
      });

      const totalCounted = updated.reduce((s, it) => s + it.countedQty, 0);
      const totalVar = updated.reduce((s, it) => s + it.variance, 0);
      const totalVarVal = updated.reduce((s, it) => s + it.variance * it.unitPrice, 0);

      return {
        ...prev,
        items: updated,
        totalCountedQty: totalCounted,
        totalVarianceQty: totalVar,
        totalVarianceValue: totalVarVal,
      };
    });
  }, [activeSession]);

  // Direct set count prompt
  const handleSetExactCount = (item: AuditItem) => {
    const input = window.prompt(t("enterExactCount", { name: item.name }), String(item.countedQty));
    if (input !== null) {
      const parsed = parseInt(input, 10);
      if (!isNaN(parsed) && parsed >= 0) {
        handleAdjustCount(item.productId, item.variantId, parsed - item.countedQty);
      }
    }
  };

  // Scan handler
  const handleScannedCode = React.useCallback(
    (code: string) => {
      if (!activeSession) return;
      const clean = code.trim().toLowerCase();
      const targetItem = activeSession.items.find(
        (it) =>
          (it.barcode && it.barcode.toLowerCase() === clean) ||
          it.sku.toLowerCase() === clean,
      );

      if (targetItem) {
        handleAdjustCount(targetItem.productId, targetItem.variantId, 1);
        playChime("success");
        toast.success(
          t("itemCountedSuccess", {
            name: targetItem.name,
            count: targetItem.countedQty + 1,
          }),
        );
      } else {
        playChime("warn");
        toast.error(t("unknownBarcode", { code }));
      }
    },
    [activeSession, handleAdjustCount, playChime, t],
  );

  // Save draft progress
  const handleSaveProgress = async () => {
    if (!activeSession) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/pos/stock-audits/${activeSession._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "in_progress",
          items: activeSession.items,
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(t("auditSavedSuccess"));
        fetchAudits();
      } else {
        toast.error(json.message || t("saveProgress"));
      }
    } catch {
      toast.error(t("saveProgress"));
    } finally {
      setIsSaving(false);
    }
  };

  // Commit audit to inventory
  const handleCommitAudit = async () => {
    if (!activeSession) return;
    setIsCommitting(true);
    try {
      // First save items
      await fetch(`/api/pos/stock-audits/${activeSession._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: activeSession.items }),
      });

      // Commit
      const res = await fetch(`/api/pos/stock-audits/${activeSession._id}/commit`, {
        method: "POST",
      });
      const json = await res.json();
      if (json.success) {
        toast.success(t("auditCommittedSuccess", { number: activeSession.auditNumber }));
        setShowCommitDialog(false);
        setActiveSession(null);
        fetchAudits();
      } else {
        toast.error(json.message || t("commitError"));
      }
    } catch {
      toast.error(t("commitError"));
    } finally {
      setIsCommitting(false);
    }
  };

  // Filtered items
  const filteredItems = React.useMemo(() => {
    if (!activeSession) return [];
    let list = activeSession.items;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (it) =>
          it.name.toLowerCase().includes(q) ||
          it.sku.toLowerCase().includes(q) ||
          (it.barcode && it.barcode.toLowerCase().includes(q)),
      );
    }

    if (filterTab === "discrepancy") {
      list = list.filter((it) => it.variance !== 0);
    } else if (filterTab === "matched") {
      list = list.filter((it) => it.variance === 0 && it.countedQty > 0);
    } else if (filterTab === "uncounted") {
      list = list.filter((it) => it.countedQty === 0);
    }

    return list;
  }, [activeSession, searchQuery, filterTab]);

  const countDiscrepancies = activeSession
    ? activeSession.items.filter((it) => it.variance !== 0).length
    : 0;
  const countMatched = activeSession
    ? activeSession.items.filter((it) => it.variance === 0 && it.countedQty > 0).length
    : 0;
  const countUncounted = activeSession
    ? activeSession.items.filter((it) => it.countedQty === 0).length
    : 0;

  const { posStockAuditEnabled } = useAppSettings();

  if (!posStockAuditEnabled) {
    return (
      <POSWorkstationDisabled
        title={t("workstationDisabled")}
        description={t("workstationDisabledDesc")}
      />
    );
  }

  return (
    <div className="flex h-full min-h-screen flex-col bg-background text-foreground font-sans select-none">
      {/* Top Header */}
      <header className="h-16 px-4 sm:px-6 bg-card/85 backdrop-blur-md border-b border-border/60 flex items-center justify-between shrink-0 shadow-xs">
        <div className="flex items-center gap-3">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 rounded-xl text-xs font-semibold border-border/60 bg-background/80 shadow-xs"
          >
            <Link href="/admin/pos">
              <ArrowLeft className="w-3.5 h-3.5" />
              {t("backToPos")}
            </Link>
          </Button>

          <Button
            asChild
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <Link href="/admin/dashboard">
              <LayoutDashboard className="w-3.5 h-3.5" />
              {t("backToDashboard")}
            </Link>
          </Button>

          <div className="h-4 w-px bg-border mx-1 hidden sm:block" />

          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shadow-xs">
            <ClipboardCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
              {t("title")}
              {activeSession && (
                <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">
                  {activeSession.auditNumber}
                </Badge>
              )}
            </h1>
            <p className="text-xs text-muted-foreground hidden sm:block">{t("subtitle")}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeSession ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveProgress}
                disabled={isSaving}
                className="rounded-xl border-border/60 bg-background hover:bg-muted text-xs shadow-xs"
              >
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Save className="w-3.5 h-3.5 mr-1.5" />}
                {t("saveProgress")}
              </Button>
              <Button
                size="sm"
                onClick={() => setShowCommitDialog(true)}
                className="rounded-xl bg-primary text-primary-foreground font-semibold text-xs shadow-xs"
              >
                <Check className="w-3.5 h-3.5 mr-1.5" />
                {t("commitAudit")}
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              onClick={() => setShowNewAuditDialog(true)}
              className="rounded-xl bg-primary text-primary-foreground font-semibold text-xs shadow-xs"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              {t("newAudit")}
            </Button>
          )}
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
        {!activeSession ? (
          /* Empty / Past Sessions Screen */
          <div className="max-w-4xl mx-auto space-y-6 py-6">
            <div className="bg-card border border-border/60 rounded-3xl p-8 text-center space-y-4 shadow-md">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto shadow-xs">
                <ClipboardCheck className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-foreground">{t("title")}</h2>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">{t("subtitle")}</p>
              </div>
              <Button
                onClick={() => setShowNewAuditDialog(true)}
                className="rounded-2xl px-6 py-2.5 font-semibold shadow-xs"
              >
                <Plus className="w-4 h-4 mr-2" />
                {t("newAudit")}
              </Button>
            </div>

            {pastSessions.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <History className="w-4 h-4" />
                  {t("pastAudits")}
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {pastSessions.map((session) => (
                    <div
                      key={session._id}
                      className="p-4 bg-card hover:bg-muted/40 border border-border/60 rounded-2xl flex items-center justify-between transition-colors shadow-xs"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-foreground truncate">{session.name}</span>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] capitalize",
                              session.status === "completed"
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                                : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
                            )}
                          >
                            {session.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 font-mono">{session.auditNumber}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setActiveSession(session)}
                        className="text-xs text-primary hover:text-primary hover:bg-primary/10 rounded-xl"
                      >
                        {session.status === "completed" ? t("viewAudit") : t("resumeAudit")}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Active Counting Session */
          <div className="space-y-4 max-w-7xl mx-auto">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-card border border-border/60 rounded-2xl p-4 shadow-xs">
                <p className="text-xs text-muted-foreground">{t("kpiTotalCounted")}</p>
                <p className="text-2xl font-extrabold text-foreground mt-1 tabular-nums">
                  {activeSession.totalCountedQty}
                </p>
              </div>

              <div className="bg-card border border-border/60 rounded-2xl p-4 shadow-xs">
                <p className="text-xs text-muted-foreground">{t("kpiExpected")}</p>
                <p className="text-2xl font-extrabold text-muted-foreground mt-1 tabular-nums">
                  {activeSession.totalExpectedQty}
                </p>
              </div>

              <div className="bg-card border border-border/60 rounded-2xl p-4 shadow-xs">
                <p className="text-xs text-muted-foreground">{t("kpiDiscrepancies")}</p>
                <p
                  className={cn(
                    "text-2xl font-extrabold mt-1 tabular-nums",
                    activeSession.totalVarianceQty === 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : activeSession.totalVarianceQty < 0
                        ? "text-destructive"
                        : "text-amber-600 dark:text-amber-400",
                  )}
                >
                  {activeSession.totalVarianceQty > 0 ? `+${activeSession.totalVarianceQty}` : activeSession.totalVarianceQty}
                </p>
              </div>

              <div className="bg-card border border-border/60 rounded-2xl p-4 shadow-xs">
                <p className="text-xs text-muted-foreground">{t("kpiNetVarianceValue")}</p>
                <p
                  className={cn(
                    "text-2xl font-extrabold mt-1 tabular-nums",
                    activeSession.totalVarianceValue === 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : activeSession.totalVarianceValue < 0
                        ? "text-destructive"
                        : "text-amber-600 dark:text-amber-400",
                  )}
                >
                  {formatPrice(activeSession.totalVarianceValue)}
                </p>
              </div>
            </div>

            {/* Scanning Toolbar */}
            <div className="bg-card border border-border/60 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-2 flex-1 min-w-[240px]">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    placeholder={t("scanPlaceholder")}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && searchQuery.trim()) {
                        handleScannedCode(searchQuery);
                        setSearchQuery("");
                      }
                    }}
                    className="pl-9 h-11 rounded-xl bg-background border-border/60 placeholder:text-muted-foreground"
                  />
                </div>
                <Button
                  onClick={() => setCameraOpen(true)}
                  variant="outline"
                  className="h-11 rounded-xl border-border/60 hover:bg-muted shrink-0"
                >
                  <Camera className="w-4 h-4 mr-2 text-primary" />
                  {t("scanCamera")}
                </Button>
              </div>

              {/* Filter Tabs */}
              <div className="flex gap-1.5 overflow-x-auto w-full sm:w-auto">
                <Button
                  size="sm"
                  variant={filterTab === "all" ? "default" : "ghost"}
                  onClick={() => setFilterTab("all")}
                  className={cn("rounded-xl text-xs", filterTab === "all" ? "bg-primary text-primary-foreground font-semibold" : "text-muted-foreground")}
                >
                  {t("tabAll", { count: activeSession.items.length })}
                </Button>
                <Button
                  size="sm"
                  variant={filterTab === "discrepancy" ? "default" : "ghost"}
                  onClick={() => setFilterTab("discrepancy")}
                  className={cn("rounded-xl text-xs", filterTab === "discrepancy" ? "bg-destructive text-destructive-foreground font-semibold" : "text-muted-foreground")}
                >
                  {t("tabDiscrepancies", { count: countDiscrepancies })}
                </Button>
                <Button
                  size="sm"
                  variant={filterTab === "matched" ? "default" : "ghost"}
                  onClick={() => setFilterTab("matched")}
                  className={cn("rounded-xl text-xs", filterTab === "matched" ? "bg-emerald-600 text-white font-semibold" : "text-muted-foreground")}
                >
                  {t("tabMatched", { count: countMatched })}
                </Button>
                <Button
                  size="sm"
                  variant={filterTab === "uncounted" ? "default" : "ghost"}
                  onClick={() => setFilterTab("uncounted")}
                  className={cn("rounded-xl text-xs", filterTab === "uncounted" ? "bg-muted text-foreground font-semibold" : "text-muted-foreground")}
                >
                  {t("tabUncounted", { count: countUncounted })}
                </Button>
              </div>
            </div>

            {/* Items List */}
            <div className="space-y-2">
              {filteredItems.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground bg-card/60 rounded-2xl border border-border/60">
                  {t("noItemsFound")}
                </div>
              ) : (
                filteredItems.map((item) => {
                  const isPerfect = item.variance === 0 && item.countedQty > 0;
                  const isShortage = item.variance < 0;
                  const isSurplus = item.variance > 0;

                  return (
                    <div
                      key={`${item.productId}-${item.variantId || "default"}`}
                      className={cn(
                        "p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card shadow-xs",
                        isPerfect
                          ? "border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/20"
                          : isShortage
                            ? "border-destructive/40 bg-destructive/5 dark:bg-destructive/15"
                            : isSurplus
                              ? "border-amber-500/40 bg-amber-500/5 dark:bg-amber-950/20"
                              : "border-border/60",
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-sm text-foreground truncate">{item.name}</h4>
                          {isPerfect ? (
                            <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px]">
                              {t("discrepancyNone")}
                            </Badge>
                          ) : isShortage ? (
                            <Badge className="bg-destructive/15 text-destructive border-destructive/30 text-[10px]">
                              {t("discrepancyShortage", { count: Math.abs(item.variance) })}
                            </Badge>
                          ) : isSurplus ? (
                            <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[10px]">
                              {t("discrepancySurplus", { count: item.variance })}
                            </Badge>
                          ) : null}
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-1 font-mono">
                          <span>SKU: {item.sku}</span>
                          {item.barcode && <span>BAR: {item.barcode}</span>}
                          <span>{t("unitPrice")}: {formatPrice(item.unitPrice)}</span>
                        </div>
                      </div>

                      {/* Counts & Controls */}
                      <div className="flex items-center gap-4 shrink-0">
                        <div className="text-right tabular-nums">
                          <div className="text-xs text-muted-foreground">
                            {t("expected")}: <span className="font-bold text-foreground">{item.expectedQty}</span>
                          </div>
                          <div className="text-sm font-extrabold text-foreground mt-0.5">
                            {t("counted")}: <span className="text-emerald-600 dark:text-emerald-400">{item.countedQty}</span>
                          </div>
                        </div>

                        {activeSession.status !== "completed" && (
                          <div className="flex items-center gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAdjustCount(item.productId, item.variantId, -1)}
                              disabled={item.countedQty <= 0}
                              className="w-8 h-8 p-0 rounded-xl border-border/60 bg-background hover:bg-muted"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAdjustCount(item.productId, item.variantId, 1)}
                              className="w-8 h-8 p-0 rounded-xl border-border/60 bg-background text-primary font-bold hover:bg-muted"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAdjustCount(item.productId, item.variantId, 5)}
                              className="h-8 px-2 rounded-xl border-border/60 bg-background text-xs font-semibold hover:bg-muted"
                            >
                              {t("quickAddFive")}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSetExactCount(item)}
                              className="h-8 px-2 rounded-xl text-xs text-muted-foreground hover:text-foreground"
                            >
                              {t("exactCount")}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </main>

      {/* New Audit Modal */}
      <Dialog open={showNewAuditDialog} onOpenChange={setShowNewAuditDialog}>
        <DialogContent className="bg-card border-border/60 text-foreground max-w-md rounded-2xl shadow-xl">
          <DialogHeader>
            <DialogTitle>{t("newAudit")}</DialogTitle>
            <DialogDescription className="text-muted-foreground">{t("subtitle")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">{t("sessionName")}</label>
              <Input
                placeholder={t("sessionNamePlaceholder")}
                value={newAuditName}
                onChange={(e) => setNewAuditName(e.target.value)}
                className="bg-background border-border/60 rounded-xl"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowNewAuditDialog(false)}
              className="rounded-xl border-border/60"
            >
              {t("cancel")}
            </Button>
            <Button
              onClick={handleCreateAudit}
              disabled={isSaving}
              className="rounded-xl"
            >
              {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
              {t("startCounting")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Commit Confirmation Modal */}
      <Dialog open={showCommitDialog} onOpenChange={setShowCommitDialog}>
        <DialogContent className="bg-card border-border/60 text-foreground max-w-md rounded-2xl shadow-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              {t("commitTitle")}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground leading-relaxed pt-1">
              {t("commitDescription")}
            </DialogDescription>
          </DialogHeader>

          {activeSession && (
            <div className="p-4 bg-muted/40 rounded-2xl border border-border/60 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("kpiTotalCounted")}</span>
                <span className="font-bold text-foreground">{activeSession.totalCountedQty} units</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("kpiDiscrepancies")}</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">
                  {activeSession.totalVarianceQty > 0 ? `+${activeSession.totalVarianceQty}` : activeSession.totalVarianceQty} units
                </span>
              </div>
              <div className="flex justify-between border-t border-border/50 pt-2 font-semibold">
                <span className="text-muted-foreground">{t("kpiNetVarianceValue")}</span>
                <span className="font-extrabold text-foreground">{formatPrice(activeSession.totalVarianceValue)}</span>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCommitDialog(false)}
              disabled={isCommitting}
              className="rounded-xl border-border/60"
            >
              {t("cancel")}
            </Button>
            <Button
              onClick={handleCommitAudit}
              disabled={isCommitting}
              className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs"
            >
              {isCommitting && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
              {t("commitConfirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Barcode Camera Modal */}
      <BarcodeCameraDialog
        open={cameraOpen}
        onOpenChange={setCameraOpen}
        onScan={(code) => {
          handleScannedCode(code);
          setCameraOpen(false);
        }}
      />
    </div>
  );
}
