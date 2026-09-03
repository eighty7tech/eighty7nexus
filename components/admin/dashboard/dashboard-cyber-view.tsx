"use client";

import * as React from "react";
import {
  Activity,
  Cpu,
  Globe,
  Radio,
  ShieldAlert,
  Terminal,
  Wifi,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface DashboardCyberViewProps {
  header: React.ReactNode;
  stats: React.ReactNode;
  ordersChart: React.ReactNode;
  recentOrders: React.ReactNode;
  latestProducts: React.ReactNode;
  visitorsChart: React.ReactNode;
}

export function DashboardCyberView({
  header,
  stats,
  ordersChart,
  recentOrders,
  latestProducts,
  visitorsChart,
}: DashboardCyberViewProps) {
  const [pulseTime, setPulseTime] = React.useState<string>("");

  React.useEffect(() => {
    const update = () => {
      setPulseTime(new Date().toISOString().slice(11, 19));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-5 animate-in fade-in-50 duration-500 font-sans">
      {header}

      {/* Cybernetic Telemetry Command Bar */}
      <div className="relative overflow-hidden rounded-xl border-2 border-[#77CDCC]/60 bg-[#00122e] p-3.5 text-white shadow-[0_0_30px_rgba(119,205,204,0.18)]">
        {/* Scanline pattern overlay */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,transparent_50%,rgba(0,0,0,0.4)_51%)] bg-[length:100%_4px] opacity-30" />

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-md border border-[#77CDCC]/50 bg-[#001a45] px-3 py-1 font-mono text-xs font-bold text-[#77CDCC] shadow-inner">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#77CDCC] opacity-90" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#77CDCC]" />
              </span>
              CYBER_HUD::STATION_ONLINE
            </div>

            <div className="flex items-center gap-1.5 font-mono text-[11px] text-[#77CDCC]/80">
              <Cpu className="h-3.5 w-3.5 text-[#77CDCC]" />
              <span>CORE_LATENCY:</span>
              <span className="text-white font-bold">14ms</span>
            </div>

            <div className="flex items-center gap-1.5 font-mono text-[11px] text-[#77CDCC]/80">
              <Wifi className="h-3.5 w-3.5 text-emerald-400" />
              <span>SOCKET_CHANNELS:</span>
              <span className="text-emerald-300 font-bold">SYNCHRONIZED</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-md border border-[#77CDCC]/30 bg-[#001a45]/90 px-2.5 py-1 font-mono text-xs text-[#77CDCC]">
              UTC_{pulseTime || "00:00:00"}
            </div>
            <Badge className="border border-[#77CDCC] bg-[#77CDCC]/20 text-[#77CDCC] font-mono text-[10px] tracking-wider">
              QUANTUM_V2
            </Badge>
          </div>
        </div>
      </div>

      {/* Cyber Frame for Stats */}
      <div className="rounded-xl border border-[#77CDCC]/30 bg-[#00122e]/60 p-1.5 shadow-[0_0_20px_rgba(119,205,204,0.1)]">
        {stats}
      </div>

      {/* Cyber Split: Orders Performance Chart & Transactions Stream */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        <div className="xl:col-span-8 rounded-xl border border-[#77CDCC]/40 bg-[#00122e]/80 p-1 shadow-[0_0_20px_rgba(119,205,204,0.12)]">
          {ordersChart}
        </div>
        <div className="xl:col-span-4 rounded-xl border border-[#77CDCC]/40 bg-[#00122e]/80 p-1 shadow-[0_0_20px_rgba(119,205,204,0.12)]">
          {recentOrders}
        </div>
      </div>

      {/* Secondary Cyber Grid */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <div className="rounded-xl border border-[#77CDCC]/40 bg-[#00122e]/80 p-1 shadow-[0_0_20px_rgba(119,205,204,0.1)]">
          {latestProducts}
        </div>
        <div className="rounded-xl border border-[#77CDCC]/40 bg-[#00122e]/80 p-1 shadow-[0_0_20px_rgba(119,205,204,0.1)]">
          {visitorsChart}
        </div>
      </div>
    </div>
  );
}
