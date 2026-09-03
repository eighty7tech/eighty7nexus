"use client";

import * as React from "react";
import { Gauge, LayoutPanelTop, MonitorDot, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface DashboardCompactDenseViewProps {
  header: React.ReactNode;
  stats: React.ReactNode;
  ordersChart: React.ReactNode;
  recentOrders: React.ReactNode;
  latestProducts: React.ReactNode;
  visitorsChart: React.ReactNode;
}

export function DashboardCompactDenseView({
  header,
  stats,
  ordersChart,
  recentOrders,
  latestProducts,
  visitorsChart,
}: DashboardCompactDenseViewProps) {
  return (
    <div className="space-y-3 animate-in fade-in-50 duration-400">
      {header}

      {/* Enterprise Operations Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-xs shadow-2xs">
        <div className="flex items-center gap-2">
          <MonitorDot className="h-4 w-4 text-primary" />
          <span className="font-semibold text-foreground">
            HIGH-THROUGHPUT TRADING & COMMERCE FLOOR
          </span>
          <span className="text-muted-foreground">|</span>
          <span className="text-muted-foreground text-[11px] hidden sm:inline">
            Dense Viewport Mode Enabled
          </span>
        </div>
        <Badge variant="secondary" className="text-[10px] font-mono py-0">
          COMPACT_STREAM
        </Badge>
      </div>

      {/* Compact Stats */}
      <div className="rounded-lg border border-border bg-card p-1 shadow-2xs">
        {stats}
      </div>

      {/* Dense Split: Chart & Transactions */}
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-12">
        <div className="xl:col-span-8 rounded-lg border border-border bg-card p-1 shadow-2xs">
          {ordersChart}
        </div>
        <div className="xl:col-span-4 rounded-lg border border-border bg-card p-1 shadow-2xs">
          {recentOrders}
        </div>
      </div>

      {/* Dense Secondary Split */}
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-1 shadow-2xs">
          {latestProducts}
        </div>
        <div className="rounded-lg border border-border bg-card p-1 shadow-2xs">
          {visitorsChart}
        </div>
      </div>
    </div>
  );
}
