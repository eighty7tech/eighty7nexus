"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useLocale } from "next-intl";
import {
  ArrowRight,
  Bot,
  Box,
  CreditCard,
  Flame,
  LayoutGrid,
  ShoppingBag,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface DashboardBentoViewProps {
  header: React.ReactNode;
  stats: React.ReactNode;
  ordersChart: React.ReactNode;
  recentOrders: React.ReactNode;
  latestProducts: React.ReactNode;
  visitorsChart: React.ReactNode;
}

export function DashboardBentoView({
  header,
  stats,
  ordersChart,
  recentOrders,
  latestProducts,
  visitorsChart,
}: DashboardBentoViewProps) {
  const intlLocale = useLocale();
  const params = useParams<{ locale: string }>();
  const locale = params?.locale || intlLocale || "en";

  return (
    <div className="space-y-5 animate-in fade-in-50 duration-500">
      {header}

      {/* Bento Hero Strip: Quick Launch Modular Tiles */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Bento Tile 1: AI Sales Agent Spotlight */}
        <Link
          href={`/${locale}/admin/ai-sales-agent`}
          className="group relative overflow-hidden rounded-[22px] border border-border/70 bg-gradient-to-br from-card via-card to-[#001a45]/5 p-4.5 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-[#77CDCC]/60 hover:shadow-lg dark:to-[#77CDCC]/5"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#001a45] text-[#77CDCC] shadow-md transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
              <Bot className="h-5 w-5" />
            </div>
            <Badge
              variant="outline"
              className="border-[#77CDCC]/40 bg-[#77CDCC]/10 text-[#77CDCC] text-[10px] font-bold"
            >
              AI AGENT
            </Badge>
          </div>
          <h3 className="text-sm font-bold text-foreground group-hover:text-[#77CDCC] transition-colors">
            AI Sales Copilot
          </h3>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
            Automated recommendations, customer assistance & handoffs.
          </p>
          <div className="mt-3 flex items-center text-xs font-semibold text-[#77CDCC]">
            <span>Manage AI Agent</span>
            <ArrowRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </div>
        </Link>

        {/* Bento Tile 2: POS Live Register */}
        <Link
          href={`/${locale}/admin/pos`}
          className="group relative overflow-hidden rounded-[22px] border border-border/70 bg-gradient-to-br from-card via-card to-[#001a45]/5 p-4.5 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-[#77CDCC]/60 hover:shadow-lg dark:to-[#77CDCC]/5"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#324071] text-white shadow-md transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <Badge
              variant="outline"
              className="border-primary/30 bg-primary/10 text-primary text-[10px] font-bold"
            >
              IN-STORE
            </Badge>
          </div>
          <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
            Point of Sale Register
          </h3>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
            High-speed barcode scanning, hardware scale & multi-tender checkout.
          </p>
          <div className="mt-3 flex items-center text-xs font-semibold text-primary">
            <span>Launch POS Terminal</span>
            <ArrowRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </div>
        </Link>

        {/* Bento Tile 3: Live Velocity & Inventory */}
        <Link
          href={`/${locale}/admin/inventory`}
          className="group relative overflow-hidden rounded-[22px] border border-border/70 bg-gradient-to-br from-card via-card to-[#001a45]/5 p-4.5 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-[#77CDCC]/60 hover:shadow-lg dark:to-[#77CDCC]/5 sm:col-span-2 lg:col-span-1"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
              <Box className="h-5 w-5" />
            </div>
            <Badge
              variant="outline"
              className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 text-[10px] font-bold"
            >
              STOCK FLOW
            </Badge>
          </div>
          <h3 className="text-sm font-bold text-foreground group-hover:text-emerald-500 transition-colors">
            Inventory & Multi-Branch
          </h3>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
            Stock alert warnings, warehouse transfers & branch distribution.
          </p>
          <div className="mt-3 flex items-center text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <span>Audit Inventory Levels</span>
            <ArrowRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </div>
        </Link>
      </div>

      {/* Bento Metric Cards */}
      <div className="rounded-[24px] overflow-hidden">
        {stats}
      </div>

      {/* Bento Main Canvas: Asymmetrical Split */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="lg:col-span-8 flex flex-col gap-5">
          <div className="rounded-[24px] border border-border/70 bg-card p-1 shadow-xs overflow-hidden">
            {ordersChart}
          </div>
          <div className="rounded-[24px] border border-border/70 bg-card p-1 shadow-xs overflow-hidden">
            {latestProducts}
          </div>
        </div>

        <div className="lg:col-span-4 flex flex-col gap-5">
          <div className="rounded-[24px] border border-border/70 bg-card p-1 shadow-xs overflow-hidden">
            {recentOrders}
          </div>
          <div className="rounded-[24px] border border-border/70 bg-card p-1 shadow-xs overflow-hidden">
            {visitorsChart}
          </div>
        </div>
      </div>
    </div>
  );
}
