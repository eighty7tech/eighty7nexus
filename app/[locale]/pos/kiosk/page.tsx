"use client";

import * as React from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useCurrency } from "@/providers/currency-provider";
import {
  ShoppingBag,
  Barcode,
  Camera,
  Search,
  CheckCircle2,
  CreditCard,
  QrCode,
  Receipt,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Plus,
  Minus,
  Trash2,
  AlertTriangle,
  X,
  Store,
  Layers,
  Clock,
  Printer,
  ChevronRight,
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
import QRCode from "qrcode";
import { cn } from "@/lib/utils";

interface KioskProduct {
  _id: string;
  name: string;
  sku: string;
  barcode?: string;
  price: number;
  image?: string;
  category?: { _id: string; name: string };
  stock: number;
  variants?: Array<{
    _id: string;
    name: string;
    sku: string;
    price: number;
    stock: number;
  }>;
}

interface KioskCategory {
  _id: string;
  name: string;
}

interface KioskCartItem {
  id: string;
  productId: string;
  variantId?: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  image?: string;
}

export default function KioskPage() {
  const t = useTranslations("kiosk");
  const { formatPrice, currency } = useCurrency();

  // Kiosk Flow States: "attract" | "shopping" | "payment" | "completed"
  const [kioskState, setKioskState] = React.useState<"attract" | "shopping" | "payment" | "completed">("attract");

  // Store Configuration
  const [storeName, setStoreName] = React.useState<string>("");
  const [taxRate, setTaxRate] = React.useState<number>(0);
  const [locationId, setLocationId] = React.useState<string>("");

  // Catalog Data
  const [products, setProducts] = React.useState<KioskProduct[]>([]);
  const [categories, setCategories] = React.useState<KioskCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = React.useState<string>("");
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [isLoading, setIsLoading] = React.useState<boolean>(true);

  // Active Cart
  const [cart, setCart] = React.useState<KioskCartItem[]>([]);

  // Modals & Scanners
  const [cameraOpen, setCameraOpen] = React.useState<boolean>(false);
  const [showCancelDialog, setShowCancelDialog] = React.useState<boolean>(false);
  const [showInactivityModal, setShowInactivityModal] = React.useState<boolean>(false);
  const [inactivityCountdown, setInactivityCountdown] = React.useState<number>(15);

  // Selected Payment Method: "card" | "qr" | "cashier"
  const [paymentMethod, setPaymentMethod] = React.useState<"card" | "qr" | "cashier">("card");
  const [isProcessingPayment, setIsProcessingPayment] = React.useState<boolean>(false);
  const [completedOrderNumber, setCompletedOrderNumber] = React.useState<string>("");
  const [qrCodeDataUrl, setQrCodeDataUrl] = React.useState<string | null>(null);
  const [cashierSlipCode, setCashierSlipCode] = React.useState<string | null>(null);
  const [autoResetSeconds, setAutoResetSeconds] = React.useState<number>(20);

  // Audio Chime Feedback
  const playKioskSound = React.useCallback((type: "scan" | "success" | "error") => {
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === "scan") {
        osc.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      } else if (type === "success") {
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08); // E5
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.16); // G5
        gain.gain.setValueAtTime(0.18, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      } else {
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      }
    } catch {
      // AudioContext unavailable or restricted
    }
  }, []);

  // Fetch store settings & catalog
  React.useEffect(() => {
    async function loadKioskData() {
      setIsLoading(true);
      try {
        const [settingsRes, productsRes] = await Promise.all([
          fetch("/api/pos/settings"),
          fetch("/api/pos/products"),
        ]);
        const settingsJson = await settingsRes.json();
        const productsJson = await productsRes.json();

        if (settingsJson?.success && settingsJson.data) {
          setStoreName(settingsJson.data.storeName || "");
          setTaxRate(Number(settingsJson.data.taxRate) || 0);
          setLocationId(settingsJson.data.posLocationId || "");
        }

        if (productsJson?.success && Array.isArray(productsJson.data)) {
          setProducts(productsJson.data);

          // Extract unique categories
          const catMap = new Map<string, KioskCategory>();
          productsJson.data.forEach((p: KioskProduct) => {
            if (p.category?._id && p.category?.name) {
              catMap.set(p.category._id, { _id: p.category._id, name: p.category.name });
            }
          });
          setCategories(Array.from(catMap.values()));
        }
      } catch {
        // Silent catalog load failure
      } finally {
        setIsLoading(false);
      }
    }
    loadKioskData();
  }, []);

  // Inactivity Detection
  const lastActivityRef = React.useRef<number>(0);

  const resetActivity = React.useCallback(() => {
    lastActivityRef.current = Date.now();
    if (showInactivityModal) {
      setShowInactivityModal(false);
      setInactivityCountdown(15);
    }
  }, [showInactivityModal]);

  React.useEffect(() => {
    lastActivityRef.current = Date.now();
    const handleUserInteraction = () => resetActivity();
    window.addEventListener("pointerdown", handleUserInteraction);
    window.addEventListener("keydown", handleUserInteraction);
    return () => {
      window.removeEventListener("pointerdown", handleUserInteraction);
      window.removeEventListener("keydown", handleUserInteraction);
    };
  }, [resetActivity]);

  React.useEffect(() => {
    if (kioskState === "attract" || kioskState === "completed") return;

    const interval = setInterval(() => {
      if (lastActivityRef.current === 0) return;
      const elapsed = Date.now() - lastActivityRef.current;
      if (elapsed > 45000 && !showInactivityModal) {
        setShowInactivityModal(true);
        setInactivityCountdown(15);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [kioskState, showInactivityModal]);

  // Inactivity Countdown Timer
  React.useEffect(() => {
    if (!showInactivityModal) return;

    const timer = setInterval(() => {
      setInactivityCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setShowInactivityModal(false);
          setCart([]);
          setKioskState("attract");
          return 15;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [showInactivityModal]);

  // Completed Auto-Reset Countdown
  React.useEffect(() => {
    if (kioskState !== "completed") return;

    const timer = setInterval(() => {
      setAutoResetSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setCart([]);
          setCompletedOrderNumber("");
          setQrCodeDataUrl(null);
          setCashierSlipCode(null);
          setKioskState("attract");
          return 20;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [kioskState]);

  // Add Item to Cart
  const handleAddToCart = React.useCallback((product: KioskProduct) => {
    setCart((prev) => {
      const existing = prev.find((it) => it.productId === product._id && !it.variantId);
      if (existing) {
        return prev.map((it) =>
          it.id === existing.id ? { ...it, quantity: it.quantity + 1 } : it,
        );
      }
      return [
        ...prev,
        {
          id: `${product._id}-${Date.now()}`,
          productId: product._id,
          name: product.name,
          sku: product.sku,
          price: product.price,
          quantity: 1,
          image: product.image,
        },
      ];
    });
    playKioskSound("scan");
    toast.success(t("itemAdded", { name: product.name }));
  }, [playKioskSound, t]);

  // Barcode Handler (Hardware and Camera)
  const handleBarcodeScan = React.useCallback((code: string) => {
    const clean = code.trim().toLowerCase();
    const matched = products.find(
      (p) =>
        (p.barcode && p.barcode.toLowerCase() === clean) ||
        p.sku.toLowerCase() === clean,
    );

    if (matched) {
      if (kioskState === "attract") {
        setKioskState("shopping");
      }
      handleAddToCart(matched);
    } else {
      playKioskSound("error");
      toast.error(t("unknownBarcode", { code }));
    }
  }, [products, kioskState, handleAddToCart, playKioskSound, t]);

  // Update Item Quantity
  const handleUpdateQuantity = (itemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((it) => {
          if (it.id !== itemId) return it;
          const newQty = it.quantity + delta;
          return newQty > 0 ? { ...it, quantity: newQty } : null;
        })
        .filter(Boolean) as KioskCartItem[],
    );
    playKioskSound("scan");
  };

  // Remove Item
  const handleRemoveItem = (itemId: string) => {
    const target = cart.find((it) => it.id === itemId);
    setCart((prev) => prev.filter((it) => it.id !== itemId));
    if (target) {
      toast.info(t("itemRemoved", { name: target.name }));
    }
  };

  // Financial Calculations
  const subtotal = React.useMemo(() => {
    return cart.reduce((sum, it) => sum + it.price * it.quantity, 0);
  }, [cart]);

  const tax = React.useMemo(() => {
    return Math.round(subtotal * taxRate * 100) / 100;
  }, [subtotal, taxRate]);

  const total = React.useMemo(() => {
    return subtotal + tax;
  }, [subtotal, tax]);

  const totalItemCount = React.useMemo(() => {
    return cart.reduce((sum, it) => sum + it.quantity, 0);
  }, [cart]);

  // Filtered Products
  const filteredProducts = React.useMemo(() => {
    let list = products;
    if (selectedCategory) {
      list = list.filter((p) => p.category?._id === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          (p.barcode && p.barcode.toLowerCase().includes(q)),
      );
    }
    return list;
  }, [products, selectedCategory, searchQuery]);

  // Execute Payment
  const handleProcessKioskPayment = async () => {
    if (cart.length === 0) return;
    setIsProcessingPayment(true);

    try {
      if (paymentMethod === "cashier") {
        // Generate held slip for cashier desk payment
        const slipCode = `SLIP-${Date.now().toString().slice(-6)}`;
        setCashierSlipCode(slipCode);
        setCompletedOrderNumber(slipCode);
        setKioskState("completed");
        playKioskSound("success");
        toast.success(t("cashierSlipPrinted"));
        return;
      }

      // POS Order Submission
      const payload = {
        channel: "pos",
        posLocationId: locationId || undefined,
        paymentMethod: paymentMethod === "card" ? "credit_card" : "qr_code",
        items: cart.map((it) => ({
          productId: it.productId,
          variantId: it.variantId,
          name: it.name,
          sku: it.sku,
          price: it.price,
          quantity: it.quantity,
          image: it.image,
        })),
        total,
        subtotal,
        tax,
        discount: 0,
      };

      const res = await fetch("/api/pos/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success && json.data) {
        const orderNum = json.data.orderNumber || `ORD-${Date.now().toString().slice(-6)}`;
        setCompletedOrderNumber(orderNum);

        // Generate Digital Receipt QR Code
        const receiptUrl = `${window.location.origin}/orders/${orderNum}`;
        const qrUrl = await QRCode.toDataURL(receiptUrl, {
          width: 280,
          margin: 1,
          color: { dark: "#0f172a", light: "#ffffff" },
        });
        setQrCodeDataUrl(qrUrl);

        playKioskSound("success");
        setKioskState("completed");
      } else {
        playKioskSound("error");
        toast.error(json.message || t("orderFailed"));
      }
    } catch {
      playKioskSound("error");
      toast.error(t("orderFailed"));
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const { posKioskEnabled } = useAppSettings();

  if (!posKioskEnabled) {
    return (
      <POSWorkstationDisabled
        title={t("workstationDisabled")}
        description={t("workstationDisabledDesc")}
      />
    );
  }

  return (
    <div className="relative h-screen w-screen bg-background text-foreground font-sans select-none overflow-hidden flex flex-col">
      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* 1. ATTRACT SCREEN (SCREENSAVER) */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {kioskState === "attract" && (
        <div
          onClick={() => {
            playKioskSound("scan");
            setKioskState("shopping");
          }}
          className="absolute inset-0 z-50 flex flex-col items-center justify-between p-12 bg-gradient-to-b from-background via-card to-background cursor-pointer animate-in fade-in duration-500"
        >
          {/* Staff Exit Controls (Discreet) */}
          <div
            className="absolute top-6 right-8 flex items-center gap-2 z-60"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-9 px-3 gap-1.5 rounded-xl text-xs font-medium border-border/60 bg-background/80 shadow-xs"
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
              className="h-9 px-3 gap-1.5 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              <Link href="/admin/dashboard">
                <LayoutDashboard className="w-3.5 h-3.5" />
                {t("backToDashboard")}
              </Link>
            </Button>
          </div>

          {/* Top Brand Header */}
          <div className="flex items-center gap-3 pt-6 animate-pulse">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-lg shadow-primary/10">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm uppercase tracking-widest text-muted-foreground font-semibold">
                {t("welcomeTo")}
              </p>
              <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
                {storeName}
              </h1>
            </div>
          </div>

          {/* Center Call to Action */}
          <div className="flex flex-col items-center text-center max-w-xl space-y-6">
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center shadow-2xl shadow-primary/20 text-primary animate-bounce duration-1000">
                <Barcode className="w-16 h-16" />
              </div>
              <div className="absolute -inset-4 rounded-full border-2 border-primary/20 animate-ping" />
            </div>

            <div className="space-y-2">
              <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground">
                {t("touchToStart")}
              </h2>
              <p className="text-lg text-muted-foreground">
                {t("scanToStart")}
              </p>
            </div>

            <Button
              size="lg"
              className="h-16 px-10 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20 scale-105"
            >
              <span>{t("touchToStart")}</span>
              <ArrowRight className="w-6 h-6 ml-3" />
            </Button>
          </div>

          {/* Footer Branding */}
          <footer className="text-center text-xs text-muted-foreground space-y-1">
            <p>{t("poweredBy")}</p>
            <p>{t("secureCheckout")}</p>
          </footer>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* 2. MAIN SELF-SCANNING & SHOPPING INTERFACE */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      <header className="h-18 px-6 bg-card/85 backdrop-blur-md border-b border-border/60 flex items-center justify-between shrink-0 shadow-xs">
        <div className="flex items-center gap-3">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="h-9 gap-1.5 rounded-xl text-xs font-semibold border-border/60 bg-background/80 shadow-xs"
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
            className="h-9 gap-1.5 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <Link href="/admin/dashboard">
              <LayoutDashboard className="w-3.5 h-3.5" />
              {t("backToDashboard")}
            </Link>
          </Button>

          <div className="h-5 w-px bg-border mx-1 hidden sm:block" />

          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shadow-xs">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground leading-tight">{storeName}</h2>
            <p className="text-xs text-muted-foreground">{t("title")}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setCameraOpen(true)}
            className="h-11 rounded-xl border-border/60 bg-background hover:bg-muted font-medium text-xs shadow-xs"
          >
            <Camera className="w-4 h-4 mr-2 text-primary" />
            {t("scanWithCamera")}
          </Button>

          {cart.length > 0 && (
            <Button
              variant="ghost"
              onClick={() => setShowCancelDialog(true)}
              className="h-11 rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10 text-xs"
            >
              <RotateCcw className="w-4 h-4 mr-1.5" />
              {t("cancelOrder")}
            </Button>
          )}
        </div>
      </header>

      {/* Workspace Area */}
      <div className="flex-1 grid grid-cols-12 min-h-0">
        {/* Left Column: Product Catalogue (7 Cols) */}
        <div className="col-span-7 flex flex-col border-r border-border/60 bg-background/50 p-6 min-h-0 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="w-5 h-5 text-muted-foreground absolute left-4 top-1/2 -translate-y-1/2" />
            <Input
              placeholder={t("searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && searchQuery.trim()) {
                  handleBarcodeScan(searchQuery);
                  setSearchQuery("");
                }
              }}
              className="pl-12 h-13 rounded-2xl bg-card border-border/60 placeholder:text-muted-foreground text-base shadow-xs"
            />
          </div>

          {/* Category Pills */}
          {categories.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              <Button
                size="sm"
                variant={selectedCategory === "" ? "default" : "ghost"}
                onClick={() => setSelectedCategory("")}
                className={cn(
                  "rounded-xl text-xs font-semibold shrink-0 px-4",
                  selectedCategory === ""
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-card border border-border/60 text-muted-foreground hover:text-foreground",
                )}
              >
                {t("allProducts")}
              </Button>
              {categories.map((cat) => (
                <Button
                  key={cat._id}
                  size="sm"
                  variant={selectedCategory === cat._id ? "default" : "ghost"}
                  onClick={() => setSelectedCategory(selectedCategory === cat._id ? "" : cat._id)}
                  className={cn(
                    "rounded-xl text-xs font-semibold shrink-0 px-4",
                    selectedCategory === cat._id
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "bg-card border border-border/60 text-muted-foreground hover:text-foreground",
                  )}
                >
                  {cat.name}
                </Button>
              ))}
            </div>
          )}

          {/* Product Cards Grid */}
          <div className="flex-1 overflow-y-auto min-h-0 pr-1">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {filteredProducts.map((product) => (
                <button
                  key={product._id}
                  type="button"
                  onClick={() => handleAddToCart(product)}
                  className="group p-3 bg-card border border-border/60 rounded-2xl flex flex-col items-center text-center hover:border-primary/50 hover:bg-card/90 transition-all shadow-xs hover:shadow-md active:scale-[0.98]"
                >
                  <div className="w-24 h-24 rounded-xl bg-muted relative overflow-hidden mb-2 flex items-center justify-center border border-border/40">
                    {product.image ? (
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform"
                        sizes="96px"
                      />
                    ) : (
                      <ShoppingBag className="w-8 h-8 text-muted-foreground" />
                    )}
                  </div>
                  <h4 className="font-semibold text-xs text-foreground line-clamp-2 leading-snug">
                    {product.name}
                  </h4>
                  <p className="text-sm font-extrabold text-primary mt-1 tabular-nums">
                    {formatPrice(product.price)}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Active Cart (5 Cols) */}
        <div className="col-span-5 flex flex-col bg-card/70 border-l border-border/60 p-6 min-h-0 justify-between shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-border/60 shrink-0">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-primary" />
              <h3 className="font-bold text-base text-foreground">{t("cartTitle")}</h3>
            </div>
            <span className="text-xs font-mono text-muted-foreground">
              {totalItemCount === 1 ? t("itemCount") : t("itemsCount", { count: totalItemCount })}
            </span>
          </div>

          {/* Cart Item Stream */}
          <div className="flex-1 overflow-y-auto space-y-3 py-4 min-h-0 pr-1">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground p-8 space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-muted/60 border border-border/60 flex items-center justify-center shadow-xs">
                  <Barcode className="w-8 h-8 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-base text-foreground">{t("emptyCart")}</p>
                  <p className="text-xs text-muted-foreground max-w-xs">{t("emptyCartHint")}</p>
                </div>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.id}
                  className="p-3 bg-background hover:bg-background/90 border border-border/60 rounded-2xl flex items-center justify-between gap-3 shadow-xs animate-in fade-in slide-in-from-right-4 duration-300"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-muted relative overflow-hidden shrink-0 flex items-center justify-center border border-border/40">
                      {item.image ? (
                        <Image src={item.image} alt={item.name} fill className="object-cover" sizes="48px" />
                      ) : (
                        <ShoppingBag className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h5 className="font-semibold text-xs text-foreground truncate">{item.name}</h5>
                      <p className="text-xs text-muted-foreground font-mono mt-0.5">
                        {formatPrice(item.price)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="flex items-center gap-1 bg-muted rounded-xl p-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleUpdateQuantity(item.id, -1)}
                        className="w-7 h-7 rounded-lg text-muted-foreground hover:text-foreground"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </Button>
                      <span className="w-6 text-center text-xs font-bold text-foreground tabular-nums">
                        {item.quantity}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleUpdateQuantity(item.id, 1)}
                        className="w-7 h-7 rounded-lg text-muted-foreground hover:text-foreground"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </Button>
                    </div>

                    <p className="font-bold text-sm text-foreground w-18 text-right tabular-nums">
                      {formatPrice(item.price * item.quantity)}
                    </p>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveItem(item.id)}
                      className="w-7 h-7 rounded-lg text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Cart Footer Summary */}
          <div className="pt-4 border-t border-border/60 space-y-4 shrink-0">
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>{t("subtotal")}</span>
                <span className="font-medium text-foreground tabular-nums">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>{t("tax")}</span>
                <span className="font-medium text-foreground tabular-nums">{formatPrice(tax)}</span>
              </div>
              <div className="flex justify-between items-baseline pt-2 border-t border-border/60">
                <span className="text-base font-bold text-foreground">{t("total")}</span>
                <span className="text-2xl font-extrabold text-primary tabular-nums">
                  {formatPrice(total)}
                </span>
              </div>
            </div>

            <Button
              size="lg"
              onClick={() => setKioskState("payment")}
              disabled={cart.length === 0}
              className="w-full h-14 rounded-2xl text-base font-bold shadow-lg shadow-primary/20 disabled:opacity-50"
            >
              <span>{t("payNow")}</span>
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* 3. PAYMENT SELECTION MODAL */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      <Dialog open={kioskState === "payment"} onOpenChange={(open) => { if (!open) setKioskState("shopping"); }}>
        <DialogContent className="bg-card border-border/60 text-foreground max-w-lg rounded-2xl shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-xl">{t("paymentMethod")}</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {t("total")}: <span className="font-bold text-foreground text-base">{formatPrice(total)}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            {/* Contactless Card */}
            <button
              type="button"
              onClick={() => setPaymentMethod("card")}
              className={cn(
                "w-full p-4 rounded-2xl border text-left flex items-center justify-between transition-all",
                paymentMethod === "card"
                  ? "border-primary bg-primary/10 shadow-md shadow-primary/10"
                  : "border-border/60 bg-background hover:bg-muted/40",
              )}
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-foreground">{t("payCard")}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">{t("payCardDesc")}</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>

            {/* Mobile QR Pay */}
            <button
              type="button"
              onClick={() => setPaymentMethod("qr")}
              className={cn(
                "w-full p-4 rounded-2xl border text-left flex items-center justify-between transition-all",
                paymentMethod === "qr"
                  ? "border-primary bg-primary/10 shadow-md shadow-primary/10"
                  : "border-border/60 bg-background hover:bg-muted/40",
              )}
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <QrCode className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-foreground">{t("payQr")}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">{t("payQrDesc")}</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>

            {/* Cash at Service Counter */}
            <button
              type="button"
              onClick={() => setPaymentMethod("cashier")}
              className={cn(
                "w-full p-4 rounded-2xl border text-left flex items-center justify-between transition-all",
                paymentMethod === "cashier"
                  ? "border-primary bg-primary/10 shadow-md shadow-primary/10"
                  : "border-border/60 bg-background hover:bg-muted/40",
              )}
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <Printer className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-foreground">{t("payCashier")}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">{t("payCashierDesc")}</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          <DialogFooter className="pt-2">
            <Button
              variant="outline"
              onClick={() => setKioskState("shopping")}
              className="rounded-xl border-border/60"
            >
              {t("continueShopping")}
            </Button>
            <Button
              onClick={handleProcessKioskPayment}
              disabled={isProcessingPayment}
              className="rounded-xl font-bold"
            >
              {isProcessingPayment ? t("processingPayment") : t("payNow")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* 4. ORDER COMPLETE & DIGITAL RECEIPT SCREEN */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {kioskState === "completed" && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-between p-12 bg-background text-foreground animate-in zoom-in-95 duration-500">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-foreground">{t("paymentSuccess")}</h2>
              <p className="text-sm text-muted-foreground">{t("thankYouOrder")}</p>
            </div>
          </div>

          {/* QR Receipt Card */}
          <div className="bg-card border border-border/60 rounded-3xl p-8 max-w-md w-full flex flex-col items-center text-center shadow-2xl space-y-4">
            {completedOrderNumber && (
              <Badge className="bg-primary/10 text-primary border-primary/30 text-xs px-3 py-1 font-mono">
                {t("orderNumber", { number: completedOrderNumber })}
              </Badge>
            )}

            {cashierSlipCode ? (
              /* Cashier Service Slip */
              <div className="p-6 bg-muted/40 rounded-2xl border border-dashed border-primary/40 space-y-3 w-full">
                <Printer className="w-12 h-12 text-primary mx-auto" />
                <h4 className="font-bold text-sm text-foreground">{t("cashierSlipTitle")}</h4>
                <p className="text-xs text-muted-foreground">{t("scanSlipAtCounter")}</p>
                <div className="p-3 bg-background border border-border/60 rounded-xl text-foreground font-mono font-bold tracking-wider text-sm shadow-xs">
                  {cashierSlipCode}
                </div>
              </div>
            ) : qrCodeDataUrl ? (
              /* Digital Receipt QR Code */
              <div className="w-56 h-56 bg-white rounded-2xl p-3 flex flex-col items-center justify-center shadow-inner">
                <img src={qrCodeDataUrl} alt={t("scanForReceipt")} className="w-48 h-48 object-contain" />
                <span className="text-[9px] font-mono font-bold text-slate-800 tracking-wider mt-1">
                  {t("scanForReceipt")}
                </span>
              </div>
            ) : null}

            <div className="w-full pt-2 border-t border-border/60 flex justify-between text-sm">
              <span className="text-muted-foreground">{t("total")}</span>
              <span className="font-extrabold text-foreground text-base tabular-nums">
                {formatPrice(total)}
              </span>
            </div>
          </div>

          {/* Auto-Reset Footer */}
          <div className="flex flex-col items-center space-y-3">
            <p className="text-xs text-muted-foreground font-mono">
              {t("autoResetCountdown", { seconds: autoResetSeconds })}
            </p>
            <Button
              size="lg"
              onClick={() => {
                setCart([]);
                setCompletedOrderNumber("");
                setQrCodeDataUrl(null);
                setCashierSlipCode(null);
                setKioskState("attract");
              }}
              className="h-14 px-8 rounded-2xl font-bold shadow-md"
            >
              {t("finishAndExit")}
            </Button>
          </div>
        </div>
      )}

      {/* Cancel Order Modal */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="bg-card border-border/60 text-foreground max-w-sm rounded-2xl shadow-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              {t("cancelOrder")}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {t("cancelConfirm")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCancelDialog(false)}
              className="rounded-xl border-border/60"
            >
              {t("continueShopping")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setCart([]);
                setShowCancelDialog(false);
                setKioskState("attract");
              }}
              className="rounded-xl font-semibold"
            >
              {t("yesCancel")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Inactivity Warning Modal */}
      <Dialog open={showInactivityModal} onOpenChange={setShowInactivityModal}>
        <DialogContent className="bg-card border-border/60 text-foreground max-w-sm text-center rounded-2xl shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center justify-center gap-2 text-amber-500">
              <Clock className="w-6 h-6 animate-pulse" />
              {t("inactivityTitle")}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground pt-2">
              {t("inactivityDesc", { seconds: inactivityCountdown })}
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <div className="text-4xl font-extrabold text-amber-500 font-mono animate-pulse">
              {inactivityCountdown}
            </div>
          </div>
          <DialogFooter className="sm:justify-center">
            <Button
              onClick={resetActivity}
              className="w-full h-12 rounded-xl font-bold"
            >
              {t("imStillHere")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Barcode Camera Scanner Dialog */}
      <BarcodeCameraDialog
        open={cameraOpen}
        onOpenChange={setCameraOpen}
        onScan={(code) => {
          handleBarcodeScan(code);
          setCameraOpen(false);
        }}
      />
    </div>
  );
}
