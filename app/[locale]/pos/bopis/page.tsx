"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  ArrowLeft,
  LayoutDashboard,
  ShoppingBag,
  RotateCcw,
  Search,
  CheckCircle2,
  Clock,
  User,
  Phone,
  Package,
  KeyRound,
  PenTool,
  Trash2,
  Barcode,
  Camera,
  Loader2,
  AlertTriangle,
  Receipt,
  Tag,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useCurrency } from "@/providers/currency-provider";
import { useAppSettings } from "@/providers/app-settings-provider";
import { POSWorkstationDisabled } from "@/components/pos/pos-workstation-disabled";
import { BarcodeCameraDialog } from "@/components/pos/barcode-camera-dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface BopisOrder {
  _id: string;
  orderNumber: string;
  createdAt: string;
  status: string;
  total: number;
  pickupPin?: string;
  shippingAddress?: {
    fullName?: string;
    phone?: string;
    city?: string;
  };
  customer?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  items: Array<{
    _id?: string;
    productId: string;
    name: string;
    price: number;
    quantity: number;
    returnedQuantity?: number;
    image?: string;
  }>;
  bopisHandoff?: {
    recipientName?: string;
    handedOverAt?: string;
    handedOverBy?: string;
    signatureData?: string;
  };
}

export default function BopisWorkstationPage() {
  const t = useTranslations("bopis");
  const { formatPrice } = useCurrency();
  const { posBopisEnabled } = useAppSettings();

  const [activeTab, setActiveTab] = useState<"pickup" | "returns" | "completed">("pickup");
  const [orders, setOrders] = useState<BopisOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<BopisOrder | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Handover state
  const [pinInput, setPinInput] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [isHandingOver, setIsHandingOver] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  // Signature canvas
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hasSignature, setHasSignature] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);

  // Returns state
  const [receiptQuery, setReceiptQuery] = useState("");
  const [returnOrder, setReturnOrder] = useState<BopisOrder | null>(null);
  const [selectedReturnItems, setSelectedReturnItems] = useState<
    Record<string, { quantity: number; reason: string }>
  >({});
  const [refundMethod, setRefundMethod] = useState<"original" | "store_credit">("original");
  const [restockInventory, setRestockInventory] = useState(true);
  const [isProcessingReturn, setIsProcessingReturn] = useState(false);

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/pos/bopis?status=${activeTab}&q=${encodeURIComponent(searchQuery)}`);
      const json = await res.json();
      if (json.success) {
        setOrders(json.data);
        if (json.data.length > 0 && !selectedOrder) {
          setSelectedOrder(json.data[0]);
          setRecipientName(json.data[0].shippingAddress?.fullName || json.data[0].customer?.name || "");
        }
      }
    } catch {
      toast.error("Failed to load BOPIS orders");
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, searchQuery, selectedOrder]);

  useEffect(() => {
    fetchOrders();
  }, [activeTab, fetchOrders]);

  // Hardware barcode scanner listener
  useEffect(() => {
    let buffer = "";
    let lastKeyTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const now = Date.now();
      if (now - lastKeyTime > 100) {
        buffer = "";
      }
      lastKeyTime = now;

      if (e.key === "Enter") {
        if (buffer.trim().length > 3) {
          handleBarcodeScanned(buffer.trim());
        }
        buffer = "";
      } else if (e.key.length === 1) {
        buffer += e.key;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [orders]);

  const handleBarcodeScanned = (code: string) => {
    // Try matching order by PIN, orderNumber, or tracking
    const found = orders.find(
      (o) =>
        o.orderNumber.toLowerCase() === code.toLowerCase() ||
        o.pickupPin === code ||
        o._id === code,
    );

    if (found) {
      setSelectedOrder(found);
      setRecipientName(found.shippingAddress?.fullName || found.customer?.name || "");
      toast.success(t("receiptFound", { number: found.orderNumber }));
    } else {
      // In return tab, try searching receipt
      setReceiptQuery(code);
      handleLookupReceipt(code);
    }
  };

  // Canvas drawing handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setIsDrawing(true);
    setHasSignature(true);
    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#3b82f6";
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  // Confirm Handover
  const handleConfirmHandover = async () => {
    if (!selectedOrder) return;

    if (!hasSignature) {
      toast.error(t("signatureRequired"));
      return;
    }

    const canvas = canvasRef.current;
    const signatureData = canvas ? canvas.toDataURL("image/png") : null;

    setIsHandingOver(true);
    try {
      const res = await fetch("/api/pos/bopis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: selectedOrder._id,
          pin: pinInput.trim() || undefined,
          recipientName: recipientName.trim() || undefined,
          signatureData,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json.message || t("pinInvalid"));
        return;
      }

      toast.success(t("handoverSuccess", { number: selectedOrder.orderNumber }));
      clearSignature();
      setPinInput("");
      setSelectedOrder(null);
      await fetchOrders();
    } catch {
      toast.error("Handover request failed");
    } finally {
      setIsHandingOver(false);
    }
  };

  // Return & Exchange handlers
  const handleLookupReceipt = async (codeToLookup?: string) => {
    const code = codeToLookup || receiptQuery.trim();
    if (!code) return;

    try {
      const res = await fetch(`/api/pos/bopis?q=${encodeURIComponent(code)}`);
      const json = await res.json();
      if (json.success && json.data.length > 0) {
        setReturnOrder(json.data[0]);
        setSelectedReturnItems({});
        toast.success(t("receiptFound", { number: json.data[0].orderNumber }));
      } else {
        toast.error("Receipt or order not found");
      }
    } catch {
      toast.error("Failed to lookup receipt");
    }
  };

  const handleToggleReturnItem = (itemId: string, maxQty: number) => {
    setSelectedReturnItems((prev) => {
      const current = prev[itemId];
      if (current) {
        const next = { ...prev };
        delete next[itemId];
        return next;
      }
      return {
        ...prev,
        [itemId]: { quantity: maxQty, reason: t("reasonCustomerRegret") },
      };
    });
  };

  const calculateReturnTotal = () => {
    if (!returnOrder) return 0;
    return returnOrder.items.reduce((sum, item) => {
      const selection = selectedReturnItems[item._id || item.productId];
      if (selection) {
        return sum + item.price * selection.quantity;
      }
      return sum;
    }, 0);
  };

  const handleProcessReturn = async () => {
    if (!returnOrder) return;
    const itemsToReturn = Object.entries(selectedReturnItems).map(([itemId, data]) => ({
      itemId,
      quantity: data.quantity,
      reason: data.reason,
    }));

    if (itemsToReturn.length === 0) {
      toast.error("Please select at least one item to return");
      return;
    }

    setIsProcessingReturn(true);
    try {
      const res = await fetch("/api/pos/bopis", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: returnOrder._id,
          itemsToReturn,
          refundMethod,
          restockInventory,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json.message || "Failed to process return");
        return;
      }

      toast.success(t("returnSuccess", { amount: formatPrice(json.data.refundAmount) }));
      setReturnOrder(null);
      setSelectedReturnItems({});
      setReceiptQuery("");
    } catch {
      toast.error("Return processing failed");
    } finally {
      setIsProcessingReturn(false);
    }
  };

  if (!posBopisEnabled) {
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
            <ShoppingBag className="w-5 h-5 text-primary" />
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
              variant={activeTab === "pickup" ? "default" : "ghost"}
              onClick={() => setActiveTab("pickup")}
              className={cn("h-8 text-xs font-semibold rounded-lg px-3", activeTab === "pickup" && "shadow-xs")}
            >
              <Package className="w-3.5 h-3.5 mr-1.5" />
              {t("tabPickup")}
            </Button>
            <Button
              size="sm"
              variant={activeTab === "returns" ? "default" : "ghost"}
              onClick={() => setActiveTab("returns")}
              className={cn("h-8 text-xs font-semibold rounded-lg px-3", activeTab === "returns" && "shadow-xs")}
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
              {t("tabReturns")}
            </Button>
            <Button
              size="sm"
              variant={activeTab === "completed" ? "default" : "ghost"}
              onClick={() => setActiveTab("completed")}
              className={cn("h-8 text-xs font-semibold rounded-lg px-3", activeTab === "completed" && "shadow-xs")}
            >
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
              {t("tabCompleted")}
            </Button>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsCameraOpen(true)}
            className="rounded-xl border-border/60 text-xs h-9 shadow-xs"
          >
            <Camera className="w-4 h-4 mr-1.5 text-primary" />
            <span className="hidden sm:inline">Camera</span>
          </Button>
        </div>
      </header>

      {/* Main Workspace Area */}
      <main className="flex-1 p-6 flex gap-6 min-h-0 overflow-hidden">
        {activeTab === "pickup" && (
          <>
            {/* Left Queue: Pending Pickup Orders */}
            <div className="w-80 md:w-96 flex flex-col space-y-3 shrink-0">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={t("searchPlaceholder")}
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
                ) : orders.length === 0 ? (
                  <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-card rounded-2xl border border-border/60 space-y-2 shadow-xs">
                    <Package className="w-10 h-10 opacity-30" />
                    <p className="font-semibold text-sm text-foreground">{t("noOrdersFound")}</p>
                    <p className="text-xs text-muted-foreground">{t("noOrdersDesc")}</p>
                  </div>
                ) : (
                  orders.map((order) => {
                    const isSelected = selectedOrder?._id === order._id;
                    const custName = order.shippingAddress?.fullName || order.customer?.name || "Customer";

                    return (
                      <div
                        key={order._id}
                        onClick={() => {
                          setSelectedOrder(order);
                          setRecipientName(custName);
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
                            #{order.orderNumber}
                          </span>
                          <Badge className="bg-primary/15 text-primary border-primary/20 text-[10px] font-bold">
                            {t("readyForPickup")}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-foreground font-medium truncate">
                          <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <span className="truncate">{custName}</span>
                        </div>

                        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/50">
                          <span>{t("itemsCount", { count: order.items.length })}</span>
                          <span className="font-bold text-foreground">{formatPrice(order.total)}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Workstation: Order Verification & Handover Sign-Off */}
            <div className="flex-1 flex flex-col bg-card rounded-2xl border border-border/60 p-6 min-h-0 overflow-y-auto shadow-xs space-y-5">
              {selectedOrder ? (
                <>
                  <div className="flex items-start justify-between pb-4 border-b border-border/60">
                    <div>
                      <div className="flex items-center gap-3">
                        <h2 className="text-xl font-extrabold text-foreground font-mono">
                          #{selectedOrder.orderNumber}
                        </h2>
                        <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-xs">
                          {selectedOrder.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(selectedOrder.createdAt).toLocaleString()}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-muted-foreground">Order Total</span>
                      <h3 className="text-2xl font-black text-primary">
                        {formatPrice(selectedOrder.total)}
                      </h3>
                    </div>
                  </div>

                  {/* Customer Information Card */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-background rounded-xl border border-border/60 space-y-2 shadow-xs">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground font-semibold">
                        <User className="w-4 h-4 text-primary" />
                        {t("customer")}
                      </div>
                      <p className="font-bold text-sm text-foreground">
                        {selectedOrder.shippingAddress?.fullName || selectedOrder.customer?.name || "N/A"}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {selectedOrder.customer?.email || "No email"}
                      </p>
                    </div>

                    <div className="p-4 bg-background rounded-xl border border-border/60 space-y-2 shadow-xs">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground font-semibold">
                        <Phone className="w-4 h-4 text-primary" />
                        {t("phone")}
                      </div>
                      <p className="font-bold text-sm text-foreground font-mono">
                        {selectedOrder.shippingAddress?.phone || selectedOrder.customer?.phone || "N/A"}
                      </p>
                      {selectedOrder.pickupPin && (
                        <div className="flex items-center gap-1.5 text-xs text-primary font-mono">
                          <KeyRound className="w-3.5 h-3.5" />
                          <span>Expected PIN: <strong>{selectedOrder.pickupPin}</strong></span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Ordered Items Checklist */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      {t("itemsOrdered")} ({selectedOrder.items.length})
                    </h4>
                    <div className="space-y-2">
                      {selectedOrder.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-3 bg-background rounded-xl border border-border/60 flex items-center justify-between shadow-xs"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center font-bold text-xs text-foreground shrink-0">
                              {item.quantity}x
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-foreground">{item.name}</p>
                              <p className="text-xs text-muted-foreground">{formatPrice(item.price)} each</p>
                            </div>
                          </div>
                          <span className="font-mono font-bold text-foreground">
                            {formatPrice(item.price * item.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Handover Sign-Off Form */}
                  <div className="p-5 bg-background rounded-2xl border border-border/60 space-y-4 shadow-xs">
                    <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                      <PenTool className="w-4 h-4 text-primary" />
                      {t("handedOverTo")}
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-foreground">Recipient Name</label>
                        <Input
                          value={recipientName}
                          onChange={(e) => setRecipientName(e.target.value)}
                          placeholder="Full name of person collecting..."
                          className="bg-card border-border/60 rounded-xl text-xs h-10"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-foreground">{t("pinPrompt")}</label>
                        <Input
                          type="password"
                          maxLength={6}
                          value={pinInput}
                          onChange={(e) => setPinInput(e.target.value)}
                          placeholder="6-digit PIN..."
                          className="bg-card border-border/60 rounded-xl text-xs h-10 font-mono tracking-widest text-center"
                        />
                      </div>
                    </div>

                    {/* Canvas Signature Pad */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-foreground">Digital Signature</label>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={clearSignature}
                          disabled={!hasSignature}
                          className="h-7 text-xs text-muted-foreground hover:text-foreground"
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          {t("clearSignature")}
                        </Button>
                      </div>

                      <div className="relative rounded-xl border border-dashed border-border/80 bg-card/60 overflow-hidden touch-none">
                        <canvas
                          ref={canvasRef}
                          width={600}
                          height={120}
                          onMouseDown={startDrawing}
                          onMouseMove={draw}
                          onMouseUp={stopDrawing}
                          onMouseLeave={stopDrawing}
                          onTouchStart={startDrawing}
                          onTouchMove={draw}
                          onTouchEnd={stopDrawing}
                          className="w-full h-[120px] cursor-crosshair"
                        />
                        {!hasSignature && (
                          <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-xs text-muted-foreground/60">
                            Sign on the line above with finger, stylus, or mouse
                          </div>
                        )}
                      </div>
                    </div>

                    <Button
                      onClick={handleConfirmHandover}
                      disabled={isHandingOver || !hasSignature}
                      className="w-full rounded-xl h-11 text-xs font-bold shadow-xs"
                    >
                      {isHandingOver ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4 mr-2" />
                      )}
                      {t("completeHandover")}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground space-y-2">
                  <ShoppingBag className="w-12 h-12 opacity-30" />
                  <p className="font-bold text-foreground">Select an order from the queue</p>
                  <p className="text-xs text-muted-foreground">Scan customer pickup QR code or tap an order</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* Tab 2: Barcode Returns & Exchanges */}
        {activeTab === "returns" && (
          <div className="flex-1 flex flex-col space-y-5 bg-card rounded-2xl border border-border/60 p-6 min-h-0 overflow-y-auto shadow-xs">
            <div>
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-primary" />
                {t("returnTitle")}
              </h2>
              <p className="text-xs text-muted-foreground">{t("returnSubtitle")}</p>
            </div>

            <div className="flex gap-3 max-w-xl">
              <div className="relative flex-1">
                <Barcode className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={t("scanReceiptPlaceholder")}
                  value={receiptQuery}
                  onChange={(e) => setReceiptQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLookupReceipt()}
                  className="pl-9 bg-background border-border/60 rounded-xl text-xs h-10 shadow-xs"
                />
              </div>
              <Button onClick={() => handleLookupReceipt()} className="rounded-xl text-xs h-10 px-5 shadow-xs">
                {t("lookupReceipt")}
              </Button>
            </div>

            {returnOrder && (
              <div className="space-y-5 pt-2 border-t border-border/60">
                <div className="p-4 bg-background rounded-xl border border-border/60 flex items-center justify-between shadow-xs">
                  <div>
                    <span className="font-mono font-bold text-base text-foreground">
                      #{returnOrder.orderNumber}
                    </span>
                    <p className="text-xs text-muted-foreground">
                      {returnOrder.shippingAddress?.fullName || returnOrder.customer?.name} •{" "}
                      {new Date(returnOrder.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="text-lg font-extrabold text-primary">
                    {formatPrice(returnOrder.total)}
                  </span>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    {t("selectReturnItems")}
                  </h4>

                  <div className="space-y-2">
                    {returnOrder.items.map((item) => {
                      const itemId = item._id || item.productId;
                      const maxQty = item.quantity - (item.returnedQuantity || 0);
                      const isSelected = Boolean(selectedReturnItems[itemId]);

                      return (
                        <div
                          key={itemId}
                          className={cn(
                            "p-4 rounded-xl border transition-all flex items-center justify-between gap-4 shadow-xs",
                            isSelected
                              ? "bg-primary/10 border-primary shadow-xs"
                              : "bg-background border-border/60",
                          )}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <Checkbox
                              checked={isSelected}
                              disabled={maxQty <= 0}
                              onCheckedChange={() => handleToggleReturnItem(itemId, maxQty)}
                            />
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-foreground truncate">{item.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatPrice(item.price)} each • Max returnable: {maxQty}
                              </p>
                            </div>
                          </div>

                          {isSelected && (
                            <div className="flex items-center gap-3">
                              <select
                                value={selectedReturnItems[itemId]?.reason}
                                onChange={(e) =>
                                  setSelectedReturnItems((prev) => ({
                                    ...prev,
                                    [itemId]: { ...prev[itemId], reason: e.target.value },
                                  }))
                                }
                                className="h-8 rounded-lg bg-card border border-border/60 text-xs px-2"
                              >
                                <option value={t("reasonCustomerRegret")}>{t("reasonCustomerRegret")}</option>
                                <option value={t("reasonDefective")}>{t("reasonDefective")}</option>
                                <option value={t("reasonWrongSize")}>{t("reasonWrongSize")}</option>
                                <option value={t("reasonNotAsDescribed")}>{t("reasonNotAsDescribed")}</option>
                              </select>
                              <span className="font-mono font-bold text-foreground">
                                {formatPrice(item.price * (selectedReturnItems[itemId]?.quantity || 1))}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Refund Method & Restock Options */}
                <div className="p-4 bg-background rounded-xl border border-border/60 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground">Refund Method</span>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={refundMethod === "original" ? "default" : "outline"}
                        onClick={() => setRefundMethod("original")}
                        className="rounded-lg text-xs h-8"
                      >
                        {t("returnActionRefund")}
                      </Button>
                      <Button
                        size="sm"
                        variant={refundMethod === "store_credit" ? "default" : "outline"}
                        onClick={() => setRefundMethod("store_credit")}
                        className="rounded-lg text-xs h-8"
                      >
                        {t("returnActionStoreCredit")}
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-border/60">
                    <Checkbox
                      id="restock"
                      checked={restockInventory}
                      onCheckedChange={(c) => setRestockInventory(Boolean(c))}
                    />
                    <label htmlFor="restock" className="text-xs text-muted-foreground cursor-pointer">
                      Restock returned items back into store inventory
                    </label>
                  </div>
                </div>

                <Button
                  onClick={handleProcessReturn}
                  disabled={isProcessingReturn || calculateReturnTotal() <= 0}
                  className="w-full rounded-xl h-11 text-xs font-bold shadow-xs"
                >
                  {isProcessingReturn && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {t("processReturn", { amount: formatPrice(calculateReturnTotal()) })}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Fulfilled Today */}
        {activeTab === "completed" && (
          <div className="flex-1 bg-card rounded-2xl border border-border/60 p-6 min-h-0 overflow-y-auto shadow-xs space-y-4">
            <h2 className="text-lg font-bold text-foreground">{t("tabCompleted")}</h2>

            {orders.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center text-muted-foreground space-y-2">
                <CheckCircle2 className="w-10 h-10 opacity-30" />
                <p className="font-semibold text-sm text-foreground">No orders completed today yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {orders.map((o) => (
                  <div
                    key={o._id}
                    className="p-4 bg-background rounded-xl border border-border/60 flex items-center justify-between shadow-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-foreground">#{o.orderNumber}</span>
                        <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px]">
                          {t("pickedUp")}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Recipient: <strong>{o.bopisHandoff?.recipientName || "Customer"}</strong> • By{" "}
                        {o.bopisHandoff?.handedOverBy || "Staff"}
                      </p>
                    </div>
                    <span className="font-mono font-bold text-foreground">{formatPrice(o.total)}</span>
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
