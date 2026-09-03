"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  ArrowLeft,
  LayoutDashboard,
  ArrowLeftRight,
  Truck,
  Plus,
  Search,
  Barcode,
  Camera,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Loader2,
  Check,
  Building2,
  Package,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAppSettings } from "@/providers/app-settings-provider";
import { POSWorkstationDisabled } from "@/components/pos/pos-workstation-disabled";
import { BarcodeCameraDialog } from "@/components/pos/barcode-camera-dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface TransferItem {
  productId: string;
  sku: string;
  name: string;
  barcode?: string;
  quantityExpected: number;
  quantityReceived?: number;
  discrepancy?: number;
}

interface TransferManifest {
  _id: string;
  transferNumber: string;
  sourceBranchName: string;
  targetBranchName: string;
  items: TransferItem[];
  status: "draft" | "in_transit" | "received" | "discrepancy" | "cancelled";
  dispatchedBy?: {
    cashierName?: string;
    date: string;
  };
  receivedBy?: {
    cashierName?: string;
    date?: string;
    notes?: string;
  };
  notes?: string;
  createdAt: string;
}

export default function TransfersWorkstationPage() {
  const t = useTranslations("transfers");
  const { posTransfersEnabled } = useAppSettings();

  const [activeTab, setActiveTab] = useState<"inbound" | "outbound" | "history">("inbound");
  const [transfers, setTransfers] = useState<TransferManifest[]>([]);
  const [selectedTransfer, setSelectedTransfer] = useState<TransferManifest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  // Inbound Receiving scan counts: Map of SKU -> Scanned Quantity
  const [scannedCounts, setScannedCounts] = useState<Record<string, number>>({});
  const [isCommitting, setIsCommitting] = useState(false);
  const [receivingNotes, setReceivingNotes] = useState("");

  // Outbound Manifest builder
  const [destinationBranch, setDestinationBranch] = useState("Downtown Store");
  const [manifestItems, setManifestItems] = useState<
    Array<{ productId: string; sku: string; name: string; quantity: number }>
  >([]);
  const [productSearchQuery, setProductSearchQuery] = useState("");
  const [isCreatingManifest, setIsCreatingManifest] = useState(false);
  const [manifestNotes, setManifestNotes] = useState("");

  const fetchTransfers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/pos/transfers?q=${encodeURIComponent(searchQuery)}`);
      const json = await res.json();
      if (json.success) {
        setTransfers(json.data);
        if (json.data.length > 0 && !selectedTransfer) {
          const first = json.data[0];
          setSelectedTransfer(first);
          initScannedCounts(first);
        }
      }
    } catch {
      toast.error("Failed to load transfers");
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedTransfer]);

  useEffect(() => {
    fetchTransfers();
  }, [fetchTransfers]);

  const initScannedCounts = (transfer: TransferManifest) => {
    const counts: Record<string, number> = {};
    transfer.items.forEach((item) => {
      counts[item.sku] = item.quantityReceived || 0;
    });
    setScannedCounts(counts);
  };

  // Hardware barcode listener for receiving
  useEffect(() => {
    let buffer = "";
    let lastKeyTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const now = Date.now();
      if (now - lastKeyTime > 100) buffer = "";
      lastKeyTime = now;

      if (e.key === "Enter") {
        if (buffer.trim().length > 2) {
          handleBarcodeScanned(buffer.trim());
        }
        buffer = "";
      } else if (e.key.length === 1) {
        buffer += e.key;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedTransfer, activeTab]);

  const handleBarcodeScanned = (code: string) => {
    if (activeTab === "inbound" && selectedTransfer) {
      // Find item matching barcode or SKU
      const found = selectedTransfer.items.find(
        (it) => (it.barcode && it.barcode === code) || it.sku.toLowerCase() === code.toLowerCase(),
      );

      if (found) {
        setScannedCounts((prev) => ({
          ...prev,
          [found.sku]: (prev[found.sku] || 0) + 1,
        }));
        toast.success(`Scanned: ${found.name} (+1)`);
      } else {
        toast.warning(`Item with code ${code} not in this manifest!`);
      }
    }
  };

  // Commit Inbound Receiving
  const handleCommitReceiving = async () => {
    if (!selectedTransfer) return;

    const receivedItems = selectedTransfer.items.map((item) => ({
      sku: item.sku,
      quantity: scannedCounts[item.sku] || 0,
    }));

    setIsCommitting(true);
    try {
      const res = await fetch("/api/pos/transfers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transferId: selectedTransfer._id,
          receivedItems,
          notes: receivingNotes,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json.message || "Failed to commit transfer receiving");
        return;
      }

      toast.success(t("receivingSuccess", { number: selectedTransfer.transferNumber }));
      await fetchTransfers();
    } catch {
      toast.error("Receiving commit failed");
    } finally {
      setIsCommitting(false);
    }
  };

  // Outbound: Add item to manifest
  const handleAddItemToManifest = () => {
    if (!productSearchQuery.trim()) return;
    const sku = `SKU-${Date.now().toString().slice(-4)}`;
    setManifestItems((prev) => [
      ...prev,
      {
        productId: "prod-" + Date.now(),
        sku,
        name: productSearchQuery.trim(),
        quantity: 1,
      },
    ]);
    setProductSearchQuery("");
  };

  // Outbound: Create Transfer Manifest
  const handleCreateManifest = async () => {
    if (manifestItems.length === 0) {
      toast.error(t("noItemsInManifest"));
      return;
    }

    setIsCreatingManifest(true);
    try {
      const res = await fetch("/api/pos/transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceBranchName: "Main Flagship",
          targetBranchName: destinationBranch,
          items: manifestItems,
          notes: manifestNotes,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json.message || "Failed to create manifest");
        return;
      }

      toast.success(t("manifestCreated", { number: json.data.transferNumber }));
      setManifestItems([]);
      setManifestNotes("");
      setActiveTab("inbound");
      await fetchTransfers();
    } catch {
      toast.error("Manifest creation failed");
    } finally {
      setIsCreatingManifest(false);
    }
  };

  if (!posTransfersEnabled) {
    return (
      <POSWorkstationDisabled
        title={t("workstationDisabled")}
        description={t("workstationDisabledDesc")}
      />
    );
  }

  const inboundTransfers = transfers.filter(
    (tr) => tr.status === "in_transit" || tr.status === "discrepancy",
  );

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
            <ArrowLeftRight className="w-5 h-5 text-primary" />
            <div>
              <h1 className="text-base font-bold text-foreground leading-none">{t("title")}</h1>
              <p className="text-[11px] text-muted-foreground hidden md:block">{t("subtitle")}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Tab Selector */}
          <div className="flex items-center bg-muted/60 p-1 rounded-xl border border-border/60">
            <Button
              size="sm"
              variant={activeTab === "inbound" ? "default" : "ghost"}
              onClick={() => setActiveTab("inbound")}
              className={cn("h-8 text-xs font-semibold rounded-lg px-3", activeTab === "inbound" && "shadow-xs")}
            >
              <Truck className="w-3.5 h-3.5 mr-1.5" />
              {t("tabInbound")} ({inboundTransfers.length})
            </Button>
            <Button
              size="sm"
              variant={activeTab === "outbound" ? "default" : "ghost"}
              onClick={() => setActiveTab("outbound")}
              className={cn("h-8 text-xs font-semibold rounded-lg px-3", activeTab === "outbound" && "shadow-xs")}
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              {t("tabOutbound")}
            </Button>
            <Button
              size="sm"
              variant={activeTab === "history" ? "default" : "ghost"}
              onClick={() => setActiveTab("history")}
              className={cn("h-8 text-xs font-semibold rounded-lg px-3", activeTab === "history" && "shadow-xs")}
            >
              <Clock className="w-3.5 h-3.5 mr-1.5" />
              {t("tabHistory")}
            </Button>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsCameraOpen(true)}
            className="rounded-xl border-border/60 text-xs h-9 shadow-xs"
          >
            <Camera className="w-4 h-4 mr-1.5 text-primary" />
            <span className="hidden sm:inline">Scanner</span>
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-6 flex gap-6 min-h-0 overflow-hidden">
        {/* Tab 1: Inbound Receiving */}
        {activeTab === "inbound" && (
          <>
            {/* Inbound Manifests Queue */}
            <div className="w-80 md:w-96 flex flex-col space-y-3 shrink-0">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search manifests, SKU, branch..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-card border-border/60 rounded-xl text-xs h-10 shadow-xs"
                />
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-0">
                {isLoading ? (
                  <div className="h-48 flex items-center justify-center text-muted-foreground">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : inboundTransfers.length === 0 ? (
                  <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-card rounded-2xl border border-border/60 space-y-2 shadow-xs">
                    <Truck className="w-10 h-10 opacity-30" />
                    <p className="font-semibold text-sm text-foreground">No inbound shipments</p>
                    <p className="text-xs text-muted-foreground">All transfers for this branch are up to date</p>
                  </div>
                ) : (
                  inboundTransfers.map((tr) => {
                    const isSelected = selectedTransfer?._id === tr._id;
                    const totalItems = tr.items.reduce((sum, it) => sum + it.quantityExpected, 0);

                    return (
                      <div
                        key={tr._id}
                        onClick={() => {
                          setSelectedTransfer(tr);
                          initScannedCounts(tr);
                        }}
                        className={cn(
                          "p-4 rounded-2xl border transition-all cursor-pointer space-y-2 shadow-xs",
                          isSelected
                            ? "bg-primary/10 border-primary shadow-sm"
                            : "bg-card border-border/60 hover:border-border",
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-sm text-foreground">
                            #{tr.transferNumber}
                          </span>
                          <Badge
                            className={cn(
                              "text-[10px] uppercase font-bold",
                              tr.status === "discrepancy"
                                ? "bg-destructive/15 text-destructive border-destructive/30"
                                : "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
                            )}
                          >
                            {tr.status === "discrepancy" ? t("statusDiscrepancy") : t("statusInTransit")}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground truncate">
                          <Building2 className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span className="truncate">{tr.sourceBranchName} → {tr.targetBranchName}</span>
                        </div>

                        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/50">
                          <span>{totalItems} units expected</span>
                          <span className="font-mono">{new Date(tr.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Receiving Workstation & Discrepancy Verification */}
            <div className="flex-1 flex flex-col bg-card rounded-2xl border border-border/60 p-6 min-h-0 overflow-y-auto shadow-xs space-y-5">
              {selectedTransfer ? (
                <>
                  <div className="flex items-start justify-between pb-4 border-b border-border/60">
                    <div>
                      <div className="flex items-center gap-3">
                        <h2 className="text-xl font-black font-mono text-foreground">
                          {selectedTransfer.transferNumber}
                        </h2>
                        <Badge className="bg-primary/15 text-primary border-primary/20 text-xs">
                          {selectedTransfer.sourceBranchName} → {selectedTransfer.targetBranchName}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Dispatched by <strong>{selectedTransfer.dispatchedBy?.cashierName || "Staff"}</strong> •{" "}
                        {new Date(selectedTransfer.createdAt).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={handleCommitReceiving}
                        disabled={isCommitting}
                        className="rounded-xl h-10 text-xs font-bold shadow-xs px-5"
                      >
                        {isCommitting ? (
                          <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4 mr-1.5" />
                        )}
                        {t("commitReceiving")}
                      </Button>
                    </div>
                  </div>

                  {/* Scan items instruction banner */}
                  <div className="p-3 bg-primary/10 rounded-xl border border-primary/20 flex items-center justify-between text-xs text-foreground">
                    <div className="flex items-center gap-2">
                      <Barcode className="w-4 h-4 text-primary" />
                      <span>{t("scanToVerify")}</span>
                    </div>
                    <Badge variant="outline" className="font-mono bg-background text-[10px]">
                      Scanner Active
                    </Badge>
                  </div>

                  {/* Physical Scan Checklist */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      {t("transferItems")} ({selectedTransfer.items.length})
                    </h4>

                    <div className="space-y-2">
                      {selectedTransfer.items.map((item) => {
                        const count = scannedCounts[item.sku] || 0;
                        const hasVariance = count !== item.quantityExpected;
                        const isComplete = count >= item.quantityExpected;

                        return (
                          <div
                            key={item.sku}
                            className={cn(
                              "p-4 rounded-xl border transition-all flex items-center justify-between shadow-xs",
                              isComplete
                                ? "bg-emerald-500/5 border-emerald-500/30"
                                : hasVariance && count > 0
                                  ? "bg-destructive/5 border-destructive/30"
                                  : "bg-background border-border/60",
                            )}
                          >
                            <div className="space-y-0.5">
                              <p className="text-sm font-semibold text-foreground">{item.name}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                                <span>{item.sku}</span>
                                {item.barcode && <span>• {item.barcode}</span>}
                              </div>
                            </div>

                            <div className="flex items-center gap-4">
                              <div className="text-right font-mono text-xs">
                                <span className="text-muted-foreground">{t("expectedQty", { qty: item.quantityExpected })}</span>
                                <div className="text-sm font-bold text-foreground">
                                  {t("receivedQty", { qty: count })}
                                </div>
                              </div>

                              <div className="flex items-center gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    setScannedCounts((prev) => ({
                                      ...prev,
                                      [item.sku]: Math.max(0, (prev[item.sku] || 0) - 1),
                                    }))
                                  }
                                  className="h-8 w-8 rounded-lg p-0 font-bold"
                                >
                                  -
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    setScannedCounts((prev) => ({
                                      ...prev,
                                      [item.sku]: (prev[item.sku] || 0) + 1,
                                    }))
                                  }
                                  className="h-8 w-8 rounded-lg p-0 font-bold text-primary"
                                >
                                  +
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Notes Field */}
                  <div className="space-y-1.5 pt-3 border-t border-border/60">
                    <label className="text-xs font-medium text-foreground">{t("notes")}</label>
                    <Input
                      placeholder={t("notesPlaceholder")}
                      value={receivingNotes}
                      onChange={(e) => setReceivingNotes(e.target.value)}
                      className="bg-background border-border/60 rounded-xl text-xs h-10"
                    />
                  </div>
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground space-y-2">
                  <Package className="w-12 h-12 opacity-30" />
                  <p className="font-bold text-foreground">Select an inbound transfer to verify</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* Tab 2: Outbound Manifest Builder */}
        {activeTab === "outbound" && (
          <div className="flex-1 flex flex-col space-y-5 bg-card rounded-2xl border border-border/60 p-6 min-h-0 overflow-y-auto shadow-xs">
            <div>
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary" />
                {t("tabOutbound")}
              </h2>
              <p className="text-xs text-muted-foreground">{t("subtitle")}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">{t("sourceBranch")}</label>
                <Input
                  disabled
                  value="Main Flagship Store"
                  className="bg-muted border-border/60 rounded-xl text-xs h-10"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">{t("destinationBranch")}</label>
                <Input
                  value={destinationBranch}
                  onChange={(e) => setDestinationBranch(e.target.value)}
                  placeholder={t("selectBranch")}
                  className="bg-background border-border/60 rounded-xl text-xs h-10"
                />
              </div>
            </div>

            {/* Add Line Items Form */}
            <div className="space-y-3 pt-3 border-t border-border/60 max-w-2xl">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                {t("scanOrSearchProduct")}
              </label>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter product title, SKU, or scan barcode..."
                  value={productSearchQuery}
                  onChange={(e) => setProductSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddItemToManifest()}
                  className="bg-background border-border/60 rounded-xl text-xs h-10"
                />
                <Button onClick={handleAddItemToManifest} className="rounded-xl text-xs h-10 px-5 shadow-xs">
                  Add Item
                </Button>
              </div>
            </div>

            {/* Line Items List */}
            <div className="space-y-2 max-w-2xl">
              {manifestItems.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground border border-dashed border-border/80 rounded-2xl space-y-1">
                  <Package className="w-8 h-8 opacity-30 mx-auto" />
                  <p className="text-xs">{t("noItemsInManifest")}</p>
                </div>
              ) : (
                manifestItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-background rounded-xl border border-border/60 flex items-center justify-between shadow-xs"
                  >
                    <div>
                      <p className="text-sm font-semibold text-foreground">{item.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{item.sku}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            setManifestItems((prev) =>
                              prev.map((it, i) =>
                                i === idx ? { ...it, quantity: Math.max(1, it.quantity - 1) } : it,
                              ),
                            )
                          }
                          className="h-7 w-7 rounded-lg p-0 font-bold"
                        >
                          -
                        </Button>
                        <span className="font-mono text-sm font-bold w-8 text-center">
                          {item.quantity}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            setManifestItems((prev) =>
                              prev.map((it, i) => (i === idx ? { ...it, quantity: it.quantity + 1 } : it)),
                            )
                          }
                          className="h-7 w-7 rounded-lg p-0 font-bold text-primary"
                        >
                          +
                        </Button>
                      </div>

                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setManifestItems((prev) => prev.filter((_, i) => i !== idx))}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Manifest Notes & Submit */}
            <div className="space-y-4 pt-3 border-t border-border/60 max-w-2xl">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">{t("notes")}</label>
                <Input
                  placeholder={t("notesPlaceholder")}
                  value={manifestNotes}
                  onChange={(e) => setManifestNotes(e.target.value)}
                  className="bg-background border-border/60 rounded-xl text-xs h-10"
                />
              </div>

              <Button
                onClick={handleCreateManifest}
                disabled={isCreatingManifest || manifestItems.length === 0}
                className="w-full rounded-xl h-11 text-xs font-bold shadow-xs"
              >
                {isCreatingManifest && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {t("createManifest")}
              </Button>
            </div>
          </div>
        )}

        {/* Tab 3: History */}
        {activeTab === "history" && (
          <div className="flex-1 bg-card rounded-2xl border border-border/60 p-6 min-h-0 overflow-y-auto shadow-xs space-y-4">
            <h2 className="text-lg font-bold text-foreground">{t("tabHistory")}</h2>

            {transfers.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center text-muted-foreground space-y-2">
                <CheckCircle2 className="w-10 h-10 opacity-30" />
                <p className="font-semibold text-sm text-foreground">No transfer records found</p>
              </div>
            ) : (
              <div className="space-y-2">
                {transfers.map((tr) => (
                  <div
                    key={tr._id}
                    className="p-4 bg-background rounded-xl border border-border/60 flex items-center justify-between shadow-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-foreground">
                          {tr.transferNumber}
                        </span>
                        <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px]">
                          {tr.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {tr.sourceBranchName} → {tr.targetBranchName} •{" "}
                        {tr.items.reduce((s, it) => s + it.quantityExpected, 0)} units
                      </p>
                    </div>
                    <span className="font-mono text-xs text-muted-foreground">
                      {new Date(tr.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Barcode Camera Scanner Dialog */}
      <BarcodeCameraDialog
        open={isCameraOpen}
        onOpenChange={setIsCameraOpen}
        onScan={(code: string) => {
          setIsCameraOpen(false);
          handleBarcodeScanned(code);
        }}
      />
    </div>
  );
}
