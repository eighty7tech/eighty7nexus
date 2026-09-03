"use client";

import * as React from "react";
import {
  Activity,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Radio,
  Server,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface DashboardExecutiveViewProps {
  header: React.ReactNode;
  stats: React.ReactNode;
  ordersChart: React.ReactNode;
  recentOrders: React.ReactNode;
  latestProducts: React.ReactNode;
  visitorsChart: React.ReactNode;
}

export function DashboardExecutiveView({
  header,
  stats,
  ordersChart,
  recentOrders,
  latestProducts,
  visitorsChart,
}: DashboardExecutiveViewProps) {
  const [time, setTime] = React.useState<string>("");

  React.useEffect(() => {
    const update = () => {
      setTime(
        new Date().toLocaleTimeString(undefined, {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-5 animate-in fade-in-50 duration-500">
      {header}

      {/* Real-time Executive Telemetry Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#77CDCC]/30 bg-gradient-to-r from-[#001a45] via-[#002868] to-[#001a45] p-3.5 text-white shadow-lg">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-1.5 backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#77CDCC] opacity-80" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#77CDCC]" />
            </span>
            <span className="font-semibold tracking-wide text-[#77CDCC]">
              SYSTEM ONLINE
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-white/80">
            <Server className="h-3.5 w-3.5 text-[#77CDCC]" />
            <span className="hidden sm:inline">Node Cluster:</span>
            <span className="font-mono text-white font-medium">Edge-Active</span>
          </div>

          <div className="flex items-center gap-1.5 text-white/80">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Checkout API:</span>
            <span className="font-medium text-emerald-300">Healthy (99.99%)</span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1 text-white/90 font-mono">
            <Clock className="h-3.5 w-3.5 text-[#77CDCC]" />
            <span>{time || "00:00:00"}</span>
          </div>
          <Badge
            variant="outline"
            className="border-[#77CDCC]/50 bg-[#77CDCC]/20 text-[#77CDCC] text-[10px] font-bold"
          >
            EXEC HUD
          </Badge>
        </div>
      </div>

      {/* Stats KPI Section with Brand Accent Highlight */}
      <div className="relative rounded-2xl transition-all">
        {stats}
      </div>

      {/* Main Operational Split: Orders Chart (7 cols) + Recent Orders (5 cols) */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-4">
          <div className="rounded-2xl border border-border/70 bg-card/60 backdrop-blur-xs p-1 shadow-xs">
            {ordersChart}
          </div>
        </div>

        <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-4">
          <div className="rounded-2xl border border-border/70 bg-card/60 backdrop-blur-xs p-1 shadow-xs">
            {recentOrders}
          </div>
        </div>
      </div>

      {/* Secondary Split: Latest Products & Visitors Analytics */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <div className="rounded-2xl border border-border/70 bg-card/60 backdrop-blur-xs p-1 shadow-xs">
          {latestProducts}
        </div>
        <div className="rounded-2xl border border-border/70 bg-card/60 backdrop-blur-xs p-1 shadow-xs">
          {visitorsChart}
        </div>
      </div>
    </div>
  );
}
