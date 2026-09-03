import { DashboardHeader } from "@/components/admin/dashboard-header";
import { DashboardStatsSection } from "@/components/admin/dashboard-stats-section";
import {
  LatestProductsSkeleton,
  OrdersChartSkeleton,
  RecentOrdersSkeleton,
  VisitorsChartSkeleton,
} from "@/components/admin/dashboard-skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-4 pb-6 text-foreground">
      {/* We don't know the exact username or posEnabled state here, so we use fallbacks */}
      <DashboardHeader userName="" />

      <DashboardStatsSection stats={null} posEnabled={true} />

      <OrdersChartSkeleton />

      <RecentOrdersSkeleton />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <LatestProductsSkeleton />
        <VisitorsChartSkeleton />
      </div>
    </div>
  );
}
