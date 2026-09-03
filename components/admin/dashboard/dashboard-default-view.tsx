"use client";

import * as React from "react";

interface DashboardDefaultViewProps {
  header: React.ReactNode;
  stats: React.ReactNode;
  ordersChart: React.ReactNode;
  recentOrders: React.ReactNode;
  latestProducts: React.ReactNode;
  visitorsChart: React.ReactNode;
}

export function DashboardDefaultView({
  header,
  stats,
  ordersChart,
  recentOrders,
  latestProducts,
  visitorsChart,
}: DashboardDefaultViewProps) {
  return (
    <div className="space-y-4 pb-6 text-foreground animate-in fade-in-50 duration-300">
      {header}
      {stats}
      {ordersChart}
      {recentOrders}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {latestProducts}
        {visitorsChart}
      </div>
    </div>
  );
}
