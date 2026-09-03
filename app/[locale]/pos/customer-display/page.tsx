"use client";

import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import Link from "next/link";
import {
  ShoppingBag,
  Sparkles,
  CheckCircle2,
  QrCode,
  CreditCard,
  Percent,
  Receipt,
  Gift,
  Clock,
  Crown,
  ArrowLeft,
  LayoutDashboard,
} from "lucide-react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { useAppSettings } from "@/providers/app-settings-provider";
import { POSWorkstationDisabled } from "@/components/pos/pos-workstation-disabled";
import {
  subscribeToCfd,
  sendCustomerTipToPos,
  type CfdPayload,
  type CfdCartItem,
} from "@/lib/pos/customer-display-bridge";
import { formatCurrency } from "@/lib/money";

export default function CustomerFacingDisplayPage() {
  const t = useTranslations("cfd");
  const [data, setData] = useState<CfdPayload | null>(null);
  const [selectedTipPercentage, setSelectedTipPercentage] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState<string>("");
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      );
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToCfd((payload) => {
      setData(payload);
      if (payload.state === "IDLE" || payload.state === "ORDER_COMPLETED") {
        setSelectedTipPercentage(null);
      }
    });
    return unsubscribe;
  }, []);

  // Generate dynamic QR code when order completes
  useEffect(() => {
    if (data?.state === "ORDER_COMPLETED") {
      const url =
        data.receiptUrl ||
        (typeof window !== "undefined"
          ? `${window.location.origin}/orders/${data.orderNumber || ""}`
          : "");
      if (url) {
        QRCode.toDataURL(url, {
          width: 240,
          margin: 1,
          color: { dark: "#0f172a", light: "#ffffff" },
        })
          .then(setQrCodeDataUrl)
          .catch(() => setQrCodeDataUrl(null));
      }
    } else {
      setQrCodeDataUrl(null);
    }
  }, [data?.state, data?.receiptUrl, data?.orderNumber]);

  const currency = data?.currency || "";
  const state = data?.state || "IDLE";
  const items: CfdCartItem[] = data?.items || [];
  const itemCount = useMemo(() => items.reduce((acc, it) => acc + it.quantity, 0), [items]);

  const handleSelectTip = (percentage: number) => {
    if (!data) return;
    setSelectedTipPercentage(percentage);
    const calculatedTip = Math.round(data.subtotal * (percentage / 100) * 100) / 100;
    sendCustomerTipToPos(calculatedTip, data.terminalId);
  };

  const handleCustomTip = () => {
    const entered = window.prompt(t("enterTipAmount"));
    if (entered) {
      const val = parseFloat(entered);
      if (!isNaN(val) && val >= 0) {
        setSelectedTipPercentage(-1);
        sendCustomerTipToPos(val, data?.terminalId);
      }
    }
  };

  const { posCustomerDisplayEnabled } = useAppSettings();

  if (!posCustomerDisplayEnabled) {
    return (
      <POSWorkstationDisabled
        title={t("workstationDisabled")}
        description={t("workstationDisabledDesc")}
      />
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col justify-between select-none overflow-hidden font-sans">
      {/* Top Banner */}
      <header className="h-16 px-6 sm:px-8 bg-card/85 backdrop-blur-md border-b border-border/60 flex items-center justify-between shrink-0 shadow-xs">
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

          <div className="h-4 w-px bg-border mx-1" />

          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shadow-xs">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-foreground">
              {data?.storeName || ""}
            </h1>
            <p className="text-xs text-muted-foreground">{t("terminalTitle")}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm">
          {data?.customer ? (
            <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-full text-primary font-medium text-xs">
              <Crown className="w-3.5 h-3.5" />
              <span>{data.customer.name}</span>
              {data.customer.loyaltyTier && (
                <span className="capitalize text-[10px] font-semibold px-2 py-0.5 rounded-md bg-primary/20">
                  {data.customer.loyaltyTier}
                </span>
              )}
              {data.customer.loyaltyPoints !== undefined && (
                <span className="bg-primary text-primary-foreground text-[10px] px-2 py-0.5 rounded-full font-bold">
                  {t("pointsBalance", { points: data.customer.loyaltyPoints })}
                </span>
              )}
            </div>
          ) : null}

          <div className="flex items-center gap-2 text-muted-foreground text-xs font-mono">
            <Clock className="w-3.5 h-3.5" />
            <span>{currentTime}</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 p-6 sm:p-8 grid grid-cols-12 gap-6 sm:gap-8 min-h-0">
        {!data || state === "IDLE" || items.length === 0 ? (
          /* Idle Welcome Screen */
          <div className="col-span-12 flex flex-col items-center justify-center text-center py-16 animate-in fade-in zoom-in-95 duration-500">
            <div className="w-24 h-24 rounded-3xl bg-primary/10 text-primary flex items-center justify-center shadow-xl shadow-primary/10 mb-6 ring-8 ring-primary/5 animate-pulse">
              <Sparkles className="w-12 h-12" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight mb-3">
              {t("welcome", { storeName: data?.storeName || "" })}
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground max-w-md mb-8">
              {t("welcomeSubtitle")}
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <div className="bg-card border border-border/60 rounded-2xl p-4 flex items-center gap-3 shadow-xs">
                <Receipt className="w-6 h-6 text-primary" />
                <div className="text-left">
                  <p className="text-xs text-muted-foreground">{t("digitalReceipts")}</p>
                  <p className="text-sm font-semibold text-foreground">{t("instantQrDownload")}</p>
                </div>
              </div>
              <div className="bg-card border border-border/60 rounded-2xl p-4 flex items-center gap-3 shadow-xs">
                <Gift className="w-6 h-6 text-primary" />
                <div className="text-left">
                  <p className="text-xs text-muted-foreground">{t("loyaltyRewards")}</p>
                  <p className="text-sm font-semibold text-foreground">{t("earnOnEveryPurchase")}</p>
                </div>
              </div>
            </div>
          </div>
        ) : state === "ORDER_COMPLETED" ? (
          /* Order Completed / Receipt QR Screen */
          <div className="col-span-12 flex flex-col items-center justify-center text-center py-8 animate-in fade-in zoom-in-95 duration-500">
            <div className="w-20 h-20 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mb-5 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-3xl font-extrabold text-foreground mb-2">{t("thankYou")}</h2>
            {data.orderNumber && (
              <p className="text-sm text-muted-foreground font-mono mb-6">
                {t("orderNumber", { number: data.orderNumber })}
              </p>
            )}

            <div className="bg-card border border-border/60 rounded-3xl p-8 flex flex-col items-center max-w-md w-full shadow-xl">
              <div className="w-52 h-52 bg-white rounded-2xl p-3 flex items-center justify-center mb-4 shadow-inner">
                {qrCodeDataUrl ? (
                  <div className="flex flex-col items-center justify-center">
                    <img
                      src={qrCodeDataUrl}
                      alt={t("scanForReceipt")}
                      className="w-44 h-44 object-contain"
                    />
                    <span className="text-[10px] font-mono font-bold text-slate-800 tracking-wider mt-1">
                      {t("scanForReceipt")}
                    </span>
                  </div>
                ) : (
                  <div className="w-full h-full border-2 border-dashed border-muted-foreground/30 rounded-xl flex flex-col items-center justify-center text-slate-800">
                    <QrCode className="w-20 h-20 mb-2" />
                    <span className="text-[10px] font-mono font-bold text-center">
                      {t("scanForReceipt")}
                    </span>
                  </div>
                )}
              </div>

              <div className="w-full space-y-2 text-sm pt-4 border-t border-border/60">
                <div className="flex justify-between text-muted-foreground">
                  <span>{t("totalPaid")}</span>
                  <span className="font-bold text-foreground text-base">
                    {formatCurrency(data.grandTotal, currency)}
                  </span>
                </div>
                {data.changeDue !== undefined && data.changeDue > 0 && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                    <span>{t("changeDue")}</span>
                    <span>{formatCurrency(data.changeDue, currency)}</span>
                  </div>
                )}
                {data.customer?.pointsEarnedThisOrder ? (
                  <div className="flex justify-between text-primary font-medium pt-2 border-t border-border/40">
                    <span>{t("pointsEarnedToday")}</span>
                    <span>+{data.customer.pointsEarnedThisOrder} pts</span>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ) : (
          /* Active Cart Display */
          <>
            {/* Left Column: Itemised List */}
            <div className="col-span-7 flex flex-col bg-card/80 border border-border/60 rounded-3xl p-6 min-h-0 shadow-xs">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-border/60">
                <div className="flex items-center gap-2 font-semibold text-base text-foreground">
                  <ShoppingBag className="w-5 h-5 text-primary" />
                  <span>{t("currentItems", { count: itemCount })}</span>
                </div>
                <span className="text-xs font-mono text-muted-foreground">{t("liveSync")}</span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-2 min-h-0">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 bg-background/80 hover:bg-background border border-border/60 rounded-2xl flex items-center justify-between gap-4 transition-all shadow-xs"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      {item.imageUrl ? (
                        <div className="w-14 h-14 rounded-xl overflow-hidden bg-muted shrink-0 relative border border-border/40">
                          <Image
                            src={item.imageUrl}
                            alt={item.name}
                            fill
                            className="object-cover"
                            sizes="56px"
                          />
                        </div>
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-muted/80 flex items-center justify-center shrink-0 border border-border/40">
                          <ShoppingBag className="w-6 h-6 text-muted-foreground" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <h4 className="font-semibold text-sm text-foreground truncate">{item.name}</h4>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <span className="bg-muted px-2 py-0.5 rounded font-mono font-medium text-foreground">
                            {t("qty")}: {item.quantity}
                          </span>
                          <span>@ {formatCurrency(item.price, currency)}</span>
                          {item.discountAmount ? (
                            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                              (-{formatCurrency(item.discountAmount, currency)})
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="font-bold text-base text-foreground">
                        {formatCurrency(item.total, currency)}
                      </p>
                      {item.originalPrice && item.originalPrice > item.total ? (
                        <p className="text-xs text-muted-foreground line-through">
                          {formatCurrency(item.originalPrice, currency)}
                        </p>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Order Summary & Tipping */}
            <div className="col-span-5 flex flex-col justify-between space-y-6">
              {/* Summary Card */}
              <div className="bg-card border border-border/60 rounded-3xl p-6 shadow-md space-y-4">
                <h3 className="font-bold text-lg text-foreground pb-3 border-b border-border/60">
                  {t("orderSummary")}
                </h3>

                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>{t("subtotal")}</span>
                    <span className="font-medium text-foreground">
                      {formatCurrency(data.subtotal, currency)}
                    </span>
                  </div>

                  {data.discountTotal > 0 && (
                    <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                      <span className="flex items-center gap-1">
                        <Percent className="w-4 h-4" /> {t("discountsApplied")}
                      </span>
                      <span>-{formatCurrency(data.discountTotal, currency)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-muted-foreground">
                    <span>{t("tax")}</span>
                    <span className="font-medium text-foreground">
                      {formatCurrency(data.taxTotal, currency)}
                    </span>
                  </div>

                  {data.tipAmount > 0 && (
                    <div className="flex justify-between text-primary font-medium">
                      <span>{t("tip")}</span>
                      <span>+{formatCurrency(data.tipAmount, currency)}</span>
                    </div>
                  )}

                  <div className="pt-4 border-t border-border/60 flex justify-between items-baseline">
                    <span className="text-lg font-bold text-foreground">{t("total")}</span>
                    <span className="text-3xl font-extrabold text-primary tracking-tight">
                      {formatCurrency(data.grandTotal, currency)}
                    </span>
                  </div>
                </div>

                {state === "PAYMENT_PENDING" && (
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 flex items-center gap-3 text-blue-600 dark:text-blue-400 animate-pulse">
                    <CreditCard className="w-5 h-5 shrink-0" />
                    <p className="text-xs font-medium">
                      {t("cardTerminalPrompt")}
                    </p>
                  </div>
                )}
              </div>

              {/* Tipping Selector */}
              <div className="bg-card/70 border border-border/60 rounded-3xl p-6 space-y-3 shadow-xs">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {t("addTipOptional")}
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {[10, 15, 20].map((pct) => (
                    <button
                      key={pct}
                      onClick={() => handleSelectTip(pct)}
                      className={`py-3 rounded-2xl text-sm font-bold border transition-all ${
                        selectedTipPercentage === pct
                          ? "bg-primary text-primary-foreground border-primary shadow-md scale-105"
                          : "bg-background text-foreground border-border/60 hover:bg-muted"
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                  <button
                    onClick={handleCustomTip}
                    className={`py-3 rounded-2xl text-xs font-bold border transition-all ${
                      selectedTipPercentage === -1
                        ? "bg-primary text-primary-foreground border-primary shadow-md scale-105"
                        : "bg-background text-foreground border-border/60 hover:bg-muted"
                    }`}
                  >
                    {t("customTip")}
                  </button>
                </div>
                {selectedTipPercentage !== null && (
                  <button
                    onClick={() => handleSelectTip(0)}
                    className="w-full py-1.5 text-xs text-muted-foreground hover:text-foreground font-medium transition-colors"
                  >
                    {t("noTip")}
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Footer Branding */}
      <footer className="h-10 px-8 bg-card/50 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground shrink-0">
        <span>{t("poweredBy")}</span>
        <span>{t("secureConnection")}</span>
      </footer>
    </main>
  );
}
