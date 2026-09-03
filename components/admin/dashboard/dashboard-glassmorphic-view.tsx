"use client";

import * as React from "react";
import { Sparkles, Layers, Wand2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface DashboardGlassmorphicViewProps {
  header: React.ReactNode;
  stats: React.ReactNode;
  ordersChart: React.ReactNode;
  recentOrders: React.ReactNode;
  latestProducts: React.ReactNode;
  visitorsChart: React.ReactNode;
}

export function DashboardGlassmorphicView({
  header,
  stats,
  ordersChart,
  recentOrders,
  latestProducts,
  visitorsChart,
}: DashboardGlassmorphicViewProps) {
  return (
    <div className="space-y-6 animate-in fade-in-50 duration-500">
      {header}

      {/* Floating Frosted Glass Banner */}
      <div className="relative overflow-hidden rounded-[26px] border border-white/40 bg-card/45 p-4 backdrop-blur-2xl shadow-xl dark:border-white/10">
        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#77CDCC]/20 blur-2xl" />
        <div className="absolute -left-10 -bottom-10 h-32 w-32 rounded-full bg-[#001a45]/20 blur-2xl dark:bg-[#77CDCC]/10" />

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#001a45] to-[#324071] text-[#77CDCC] shadow-md ring-1 ring-white/30">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <span className="font-bold text-foreground text-sm block">
                Glassmorphic Creative Studio
              </span>
              <p className="text-muted-foreground text-xs">
                Translucent spatial design with multi-layered depth and liquid glass acoustics
              </p>
            </div>
          </div>

          <Badge
            variant="outline"
            className="rounded-full border-[#77CDCC]/50 bg-[#77CDCC]/15 px-3 py-1 text-xs font-bold text-[#77CDCC] backdrop-blur-md"
          >
            AURA GLASS
          </Badge>
        </div>
      </div>

      {/* Glassmorphic Stats Strip */}
      <div className="rounded-[28px] border border-white/40 bg-card/40 p-2 backdrop-blur-xl shadow-lg dark:border-white/10">
        {stats}
      </div>

      {/* Glassmorphic Split: Orders Chart & Stream */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="xl:col-span-8 rounded-[28px] border border-white/40 bg-card/40 p-1.5 backdrop-blur-2xl shadow-xl dark:border-white/10">
          {ordersChart}
        </div>
        <div className="xl:col-span-4 rounded-[28px] border border-white/40 bg-card/40 p-1.5 backdrop-blur-2xl shadow-xl dark:border-white/10">
          {recentOrders}
        </div>
      </div>

      {/* Glassmorphic Dual Stream */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-[28px] border border-white/40 bg-card/40 p-1.5 backdrop-blur-2xl shadow-xl dark:border-white/10">
          {latestProducts}
        </div>
        <div className="rounded-[28px] border border-white/40 bg-card/40 p-1.5 backdrop-blur-2xl shadow-xl dark:border-white/10">
          {visitorsChart}
        </div>
      </div>
    </div>
  );
}
