"use client";

import * as React from "react";
import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface DashboardMinimalViewProps {
  header: React.ReactNode;
  stats: React.ReactNode;
  ordersChart: React.ReactNode;
  recentOrders: React.ReactNode;
  latestProducts: React.ReactNode;
  visitorsChart: React.ReactNode;
}

export function DashboardMinimalView({
  header,
  stats,
  ordersChart,
  recentOrders,
  latestProducts,
  visitorsChart,
}: DashboardMinimalViewProps) {
  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in-50 duration-500">
      {header}

      {/* Minimal Luxe Header Accent Banner */}
      <div className="flex items-center justify-between border-b border-border/50 pb-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-[#77CDCC]" />
          <span className="font-medium tracking-wide uppercase">
            Minimalist Executive Suite
          </span>
        </div>
        <Badge
          variant="outline"
          className="border-[#77CDCC]/30 bg-[#77CDCC]/5 text-[#77CDCC] text-[10px]"
        >
          Streamlined Focus
        </Badge>
      </div>

      {/* Metrics Strip */}
      <div className="transition-all">
        {stats}
      </div>

      {/* Primary Chart Canvas */}
      <div className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur-xs p-1 shadow-xs transition-all hover:border-[#77CDCC]/30 hover:shadow-md">
        {ordersChart}
      </div>

      {/* Split Stream: Recent Transactions & Analytics */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur-xs p-1 shadow-xs transition-all hover:border-[#77CDCC]/30 hover:shadow-md">
          {recentOrders}
        </div>
        <div className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur-xs p-1 shadow-xs transition-all hover:border-[#77CDCC]/30 hover:shadow-md">
          {visitorsChart}
        </div>
      </div>

      {/* Latest Catalog Showcase */}
      <div className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur-xs p-1 shadow-xs transition-all hover:border-[#77CDCC]/30 hover:shadow-md">
        {latestProducts}
      </div>
    </div>
  );
}
