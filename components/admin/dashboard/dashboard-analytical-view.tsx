"use client";

import * as React from "react";
import {
  BarChart3,
  Calendar,
  Filter,
  Layers,
  LineChart,
  PieChart,
  SlidersHorizontal,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface DashboardAnalyticalViewProps {
  header: React.ReactNode;
  stats: React.ReactNode;
  ordersChart: React.ReactNode;
  recentOrders: React.ReactNode;
  latestProducts: React.ReactNode;
  visitorsChart: React.ReactNode;
}

const TIME_FILTERS = ["Today", "7 Days", "30 Days", "This Quarter", "Year to Date"];

export function DashboardAnalyticalView({
  header,
  stats,
  ordersChart,
  recentOrders,
  latestProducts,
  visitorsChart,
}: DashboardAnalyticalViewProps) {
  const [activeFilter, setActiveFilter] = React.useState("30 Days");

  return (
    <div className="space-y-5 animate-in fade-in-50 duration-500">
      {header}

      {/* Analytics Time-Range & Segmentation Filter Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border border-border/80 bg-card p-3 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#001a45] text-[#77CDCC]">
            <LineChart className="h-4 w-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-foreground">
              Analytics Timeframe
            </span>
            <p className="text-[11px] text-muted-foreground">
              Real-time aggregated metrics across all channels & branches
            </p>
          </div>
        </div>

        {/* Time Pills */}
        <div className="flex flex-wrap items-center gap-1.5 self-stretch sm:self-auto">
          {TIME_FILTERS.map((tf) => (
            <button
              key={tf}
              type="button"
              onClick={() => setActiveFilter(tf)}
              className={cn(
                "rounded-xl px-3 py-1.5 text-xs font-semibold transition-all select-none",
                activeFilter === tf
                  ? "bg-[#001a45] text-[#77CDCC] shadow-xs ring-1 ring-[#77CDCC]/40 dark:bg-[#77CDCC]/20"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="rounded-2xl transition-all">
        {stats}
      </div>

      {/* Dual Full-Width Chart Stage */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <div className="rounded-2xl border border-border/70 bg-card p-1 shadow-xs overflow-hidden">
          {ordersChart}
        </div>
        <div className="rounded-2xl border border-border/70 bg-card p-1 shadow-xs overflow-hidden">
          {visitorsChart}
        </div>
      </div>

      {/* Granular Transactions & Product Catalog Stream */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <div className="rounded-2xl border border-border/70 bg-card p-1 shadow-xs overflow-hidden">
          {recentOrders}
        </div>
        <div className="rounded-2xl border border-border/70 bg-card p-1 shadow-xs overflow-hidden">
          {latestProducts}
        </div>
      </div>
    </div>
  );
}
