"use client";

import * as React from "react";
import { BookOpen, Compass, Crown, Feather } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface DashboardEditorialViewProps {
  header: React.ReactNode;
  stats: React.ReactNode;
  ordersChart: React.ReactNode;
  recentOrders: React.ReactNode;
  latestProducts: React.ReactNode;
  visitorsChart: React.ReactNode;
}

export function DashboardEditorialView({
  header,
  stats,
  ordersChart,
  recentOrders,
  latestProducts,
  visitorsChart,
}: DashboardEditorialViewProps) {
  return (
    <div className="space-y-7 max-w-7xl mx-auto animate-in fade-in-50 duration-500">
      {header}

      {/* Editorial Boutique Header Ribbon */}
      <div className="flex items-center justify-between border-y-2 border-border/80 py-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#001a45] text-[#77CDCC]">
            <Crown className="h-3.5 w-3.5" />
          </div>
          <div>
            <span className="font-serif italic text-sm font-bold text-foreground tracking-wide">
              The Nexus Editorial Ledger
            </span>
            <span className="text-muted-foreground ml-2 hidden sm:inline text-xs">
              Curated Commerce Performance & Analytics
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-serif text-muted-foreground text-xs hidden md:inline">
            Vol. IV — Issue 2026
          </span>
          <Badge
            variant="outline"
            className="border-primary/40 bg-primary/5 text-primary text-[10px] font-serif uppercase tracking-widest"
          >
            Haute Commerce
          </Badge>
        </div>
      </div>

      {/* Editorial Metrics */}
      <div className="rounded-2xl border border-border/60 bg-card/60 p-2 shadow-sm">
        {stats}
      </div>

      {/* Editorial Showcase Spread */}
      <div className="rounded-2xl border border-border/60 bg-card/60 p-2 shadow-sm">
        {ordersChart}
      </div>

      {/* Split Spread: Recent Transactions & Latest Curations */}
      <div className="grid grid-cols-1 gap-7 xl:grid-cols-2">
        <div className="rounded-2xl border border-border/60 bg-card/60 p-2 shadow-sm">
          {recentOrders}
        </div>
        <div className="rounded-2xl border border-border/60 bg-card/60 p-2 shadow-sm">
          {latestProducts}
        </div>
      </div>

      {/* Visitor Geography & Reach */}
      <div className="rounded-2xl border border-border/60 bg-card/60 p-2 shadow-sm">
        {visitorsChart}
      </div>
    </div>
  );
}
