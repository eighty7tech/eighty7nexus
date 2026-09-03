"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  ArrowLeft,
  LayoutDashboard,
  BarChart3,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Package,
  Printer,
  Loader2,
  Users,
  CreditCard,
  Banknote,
  RefreshCw,
  Clock,
  Sparkles,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useCurrency } from "@/providers/currency-provider";
import { useAppSettings } from "@/providers/app-settings-provider";
import { POSWorkstationDisabled } from "@/components/pos/pos-workstation-disabled";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface HourlyPoint {
  hour: number;
  label: string;
  revenue: number;
  orders: number;
}

interface TenderItem {
  method: string;
  amount: number;
  percentage: number;
}

interface CashierItem {
  name: string;
  revenue: number;
  orders: number;
}

interface ProductItem {
  name: string;
  quantity: number;
  revenue: number;
}

interface DailyReportData {
  totalSales: number;
  orderCount: number;
  avgBasket: number;
  itemsSoldCount: number;
  hourlyPulse: HourlyPoint[];
  tenderMix: TenderItem[];
  cashierLeaderboard: CashierItem[];
  topProducts: ProductItem[];
  timestamp: string;
}

export default function PosReportsWorkstationPage() {
  const t = useTranslations("posReports");
  const { formatPrice } = useCurrency();
  const { posReportsEnabled } = useAppSettings();

  const [data, setData] = useState<DailyReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPrinting, setIsPrinting] = useState(false);

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/pos/reports/daily");
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch {
      toast.error("Failed to load POS daily report");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handlePrintFlashReport = () => {
    setIsPrinting(true);
    window.print();
    setTimeout(() => {
      setIsPrinting(false);
      toast.success(t("reportPrinted"));
    }, 1000);
  };

  if (!posReportsEnabled) {
    return (
      <POSWorkstationDisabled
        title={t("workstationDisabled")}
        description={t("workstationDisabledDesc")}
      />
    );
  }

  const maxHourlyRevenue = data
    ? Math.max(...data.hourlyPulse.map((h) => h.revenue), 1)
    : 1;

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
            <BarChart3 className="w-5 h-5 text-primary" />
            <div>
              <h1 className="text-base font-bold text-foreground leading-none">{t("title")}</h1>
              <p className="text-[11px] text-muted-foreground hidden md:block">{t("subtitle")}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={fetchReports}
            disabled={isLoading}
            className="rounded-xl border-border/60 text-xs h-9 shadow-xs"
          >
            <RefreshCw className={cn("w-3.5 h-3.5 mr-1.5", isLoading && "animate-spin")} />
            Refresh
          </Button>

          <Button
            size="sm"
            onClick={handlePrintFlashReport}
            disabled={isPrinting || !data}
            className="rounded-xl text-xs font-bold h-9 shadow-xs"
          >
            {isPrinting ? (
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            ) : (
              <Printer className="w-3.5 h-3.5 mr-1.5" />
            )}
            {t("printFlashReport")}
          </Button>
        </div>
      </header>

      {/* Main Analytics Content */}
      <main className="flex-1 p-6 flex flex-col min-h-0 space-y-5 overflow-y-auto">
        {isLoading && !data ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : !data ? (
          <div className="h-64 flex flex-col items-center justify-center text-center text-muted-foreground space-y-2">
            <BarChart3 className="w-12 h-12 opacity-30" />
            <p className="font-bold text-foreground">{t("noDataToday")}</p>
          </div>
        ) : (
          <>
            {/* Top Metric Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0">
              <div className="p-4 bg-card border border-border/60 rounded-2xl flex items-center gap-3.5 shadow-xs">
                <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">{t("todaySales")}</p>
                  <h3 className="text-2xl font-black text-foreground">{formatPrice(data.totalSales)}</h3>
                </div>
              </div>

              <div className="p-4 bg-card border border-border/60 rounded-2xl flex items-center gap-3.5 shadow-xs">
                <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">{t("transactionsCount")}</p>
                  <h3 className="text-2xl font-black text-foreground">{data.orderCount}</h3>
                </div>
              </div>

              <div className="p-4 bg-card border border-border/60 rounded-2xl flex items-center gap-3.5 shadow-xs">
                <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">{t("avgBasket")}</p>
                  <h3 className="text-2xl font-black text-foreground">{formatPrice(data.avgBasket)}</h3>
                </div>
              </div>

              <div className="p-4 bg-card border border-border/60 rounded-2xl flex items-center gap-3.5 shadow-xs">
                <div className="w-11 h-11 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500 shrink-0">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">{t("itemsSold")}</p>
                  <h3 className="text-2xl font-black text-foreground">{data.itemsSoldCount}</h3>
                </div>
              </div>
            </div>

            {/* Middle Section: Hourly Sales Pulse */}
            <div className="p-6 bg-card border border-border/60 rounded-2xl shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    {t("hourlyPulse")}
                  </h3>
                  <p className="text-xs text-muted-foreground">{t("hourlyPulseSubtitle")}</p>
                </div>
              </div>

              {/* Visual Bar Graph */}
              <div className="h-44 flex items-end gap-1.5 pt-4 pb-2 border-b border-border/40 overflow-x-auto">
                {data.hourlyPulse
                  .filter((h) => h.hour >= 8 && h.hour <= 22) // Active retail hours
                  .map((point) => {
                    const heightPercent = Math.max(
                      6,
                      Math.round((point.revenue / maxHourlyRevenue) * 100),
                    );

                    return (
                      <div
                        key={point.hour}
                        className="flex-1 min-w-[28px] flex flex-col items-center gap-1 group relative cursor-pointer"
                      >
                        {/* Tooltip on hover */}
                        <div className="absolute -top-12 bg-background border border-border/60 px-2 py-1 rounded-lg text-[10px] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-md z-10 pointer-events-none">
                          <p className="font-bold text-foreground">{formatPrice(point.revenue)}</p>
                          <p className="text-muted-foreground">{point.orders} sales</p>
                        </div>

                        <div
                          style={{ height: `${heightPercent}%` }}
                          className={cn(
                            "w-full rounded-t-lg transition-all",
                            point.revenue > 0
                              ? "bg-primary group-hover:bg-primary/80"
                              : "bg-muted/40",
                          )}
                        />
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {point.hour}:00
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Bottom Row: Tender Mix, Cashier Leaderboard & Velocity Products */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Card 1: Tender Breakdown */}
              <div className="p-5 bg-card border border-border/60 rounded-2xl shadow-xs space-y-3">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-primary" />
                  {t("tenderMix")}
                </h3>

                <div className="space-y-2.5">
                  {data.tenderMix.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-6">No tender records</p>
                  ) : (
                    data.tenderMix.map((item) => (
                      <div key={item.method} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="capitalize font-medium text-foreground">{item.method}</span>
                          <span className="font-mono font-bold text-foreground">{formatPrice(item.amount)} ({item.percentage}%)</span>
                        </div>
                        <div className="w-full bg-muted/60 h-2 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${item.percentage}%` }}
                            className="bg-primary h-full rounded-full transition-all"
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Card 2: Cashier Performance Leaderboard */}
              <div className="p-5 bg-card border border-border/60 rounded-2xl shadow-xs space-y-3">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-500" />
                  {t("cashierLeaderboard")}
                </h3>

                <div className="space-y-2">
                  {data.cashierLeaderboard.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-6">No cashier activity recorded</p>
                  ) : (
                    data.cashierLeaderboard.map((cashier, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-background rounded-xl border border-border/60 flex items-center justify-between shadow-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                            {idx + 1}
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-foreground">{cashier.name}</p>
                            <p className="text-[10px] text-muted-foreground">{cashier.orders} orders</p>
                          </div>
                        </div>
                        <span className="font-mono font-bold text-xs text-foreground">
                          {formatPrice(cashier.revenue)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Card 3: Top Selling Products */}
              <div className="p-5 bg-card border border-border/60 rounded-2xl shadow-xs space-y-3">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  {t("topSellingProducts")}
                </h3>

                <div className="space-y-2">
                  {data.topProducts.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-6">No product sales today</p>
                  ) : (
                    data.topProducts.slice(0, 5).map((prod, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-background rounded-xl border border-border/60 flex items-center justify-between shadow-xs"
                      >
                        <div className="min-w-0 pr-2">
                          <p className="text-xs font-semibold text-foreground truncate">{prod.name}</p>
                          <p className="text-[10px] text-muted-foreground">{prod.quantity} units sold</p>
                        </div>
                        <span className="font-mono font-bold text-xs text-foreground shrink-0">
                          {formatPrice(prod.revenue)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
