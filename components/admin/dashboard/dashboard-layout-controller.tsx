"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { DashboardLayoutBar } from "./dashboard-layout-bar";
import { useAppSettings } from "@/providers/app-settings-provider";

import { DashboardDraggableContainer } from "./dashboard-draggable-container";
import {
  DASHBOARD_LAYOUT_OPTIONS,
  type AdminDashboardLayout,
  type HeaderButtonStyle,
  type DashboardWidgetId,
} from "./dashboard-layout-types";

const LOCAL_STORAGE_ORDER_KEY = "nexus_admin_dashboard_widget_order";

const DEFAULT_WIDGET_ORDER: DashboardWidgetId[] = [
  "stats",
  "ordersChart",
  "recentOrders",
  "latestProducts",
  "visitorsChart",
];

interface DashboardLayoutControllerProps {
  header: React.ReactNode;
  stats: React.ReactNode;
  ordersChart: React.ReactNode;
  recentOrders: React.ReactNode;
  latestProducts: React.ReactNode;
  visitorsChart: React.ReactNode;
}

export function DashboardLayoutController({
  header,
  stats,
  ordersChart,
  recentOrders,
  latestProducts,
  visitorsChart,
}: DashboardLayoutControllerProps) {
  const { dashboardTemplate, headerButtonStyle } = useAppSettings();
  const layout = (dashboardTemplate as AdminDashboardLayout) || "executive";
  const buttonStyle = (headerButtonStyle as HeaderButtonStyle) || "capsule";

  const [widgetOrder, setWidgetOrder] = React.useState<DashboardWidgetId[]>(DEFAULT_WIDGET_ORDER);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    try {

      const savedOrder = localStorage.getItem(LOCAL_STORAGE_ORDER_KEY);
      if (savedOrder) {
        const parsed = JSON.parse(savedOrder) as DashboardWidgetId[];
        if (
          Array.isArray(parsed) &&
          parsed.length === DEFAULT_WIDGET_ORDER.length &&
          DEFAULT_WIDGET_ORDER.every((id) => parsed.includes(id))
        ) {
          setWidgetOrder(parsed);
        }
      }
    } catch {
      // Ignore
    } finally {
      setMounted(true);
    }
  }, []);



  const handleReorder = React.useCallback((newOrder: DashboardWidgetId[]) => {
    setWidgetOrder(newOrder);
    try {
      localStorage.setItem(LOCAL_STORAGE_ORDER_KEY, JSON.stringify(newOrder));
    } catch {
      // Ignore
    }
  }, []);

  const handleResetOrder = React.useCallback(() => {
    setWidgetOrder(DEFAULT_WIDGET_ORDER);
    try {
      localStorage.removeItem(LOCAL_STORAGE_ORDER_KEY);
    } catch {
      // Ignore
    }
  }, []);

  const isCustomOrdered = React.useMemo(() => {
    return (
      widgetOrder.length === DEFAULT_WIDGET_ORDER.length &&
      widgetOrder.some((id, idx) => id !== DEFAULT_WIDGET_ORDER[idx])
    );
  }, [widgetOrder]);

  // Clone header to inject active buttonStyle
  const styledHeader = React.useMemo(() => {
    if (React.isValidElement(header)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return React.cloneElement(header as React.ReactElement<any>, {
        buttonStyle,
      });
    }
    return header;
  }, [header, buttonStyle]);

  const headerWithBar = (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="flex-1">{styledHeader}</div>
        <div className="shrink-0 w-full xl:w-auto">
          <DashboardLayoutBar
            isCustomOrdered={isCustomOrdered}
            onResetOrder={handleResetOrder}
          />
        </div>
      </div>
    </div>
  );

  // Full-page theme styling applied to outer canvas container
  const fullPageThemeClass = React.useMemo(() => {
    switch (layout) {
      case "cyber-hud":
        return "bg-[#000d24] text-emerald-100 selection:bg-[#77CDCC] selection:text-[#001a45] min-h-screen -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8 relative overflow-hidden transition-colors duration-500";
      case "glassmorphic":
        return "bg-gradient-to-br from-slate-100 via-sky-50 to-indigo-100/50 dark:from-[#000f26] dark:via-[#001a45] dark:to-[#040817] text-foreground min-h-screen -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8 relative overflow-hidden transition-colors duration-500";
      case "executive":
        return "bg-gradient-to-b from-[#001a45]/8 via-background to-background text-foreground min-h-screen -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8 transition-colors duration-500";
      case "minimal-luxe":
        return "bg-background text-foreground min-h-screen -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8 transition-colors duration-500";
      case "compact-dense":
        return "bg-muted/25 text-foreground min-h-screen -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8 transition-colors duration-500";
      case "editorial":
        return "bg-gradient-to-br from-amber-50/20 via-background to-background dark:from-[#080d1a] dark:to-background text-foreground min-h-screen -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8 transition-colors duration-500";
      case "analytical":
        return "bg-gradient-to-b from-blue-900/5 via-background to-background text-foreground min-h-screen -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8 transition-colors duration-500";
      case "bento":
      case "default":
      default:
        return "bg-background text-foreground min-h-screen -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8 transition-colors duration-500";
    }
  }, [layout]);

  // Widget item definitions for drag-and-drop
  const draggableItems = React.useMemo(() => {
    return [
      { id: "stats" as DashboardWidgetId, label: "KPI Metric Cards", node: stats },
      { id: "ordersChart" as DashboardWidgetId, label: "Orders Performance Chart", node: ordersChart },
      { id: "recentOrders" as DashboardWidgetId, label: "Recent Transactions Feed", node: recentOrders },
      { id: "latestProducts" as DashboardWidgetId, label: "Latest Products Showcase", node: latestProducts },
      { id: "visitorsChart" as DashboardWidgetId, label: "Visitors & Geography Analytics", node: visitorsChart },
    ];
  }, [stats, ordersChart, recentOrders, latestProducts, visitorsChart]);

  const renderContent = () => {
    return (
      <div className="space-y-4">
        {headerWithBar}
        <DashboardDraggableContainer
          items={draggableItems}
          currentOrder={widgetOrder}
          onReorder={handleReorder}
          onResetOrder={handleResetOrder}
          isReordered={isCustomOrdered}
        />
      </div>
    );
  };



  return (
    <div className={cn(fullPageThemeClass)}>
      {/* Background ambient accents for specialized themes */}
      {layout === "cyber-hud" && (
        <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-[#77CDCC]/10 blur-[120px]" />
      )}
      {layout === "glassmorphic" && (
        <>
          <div className="pointer-events-none absolute top-10 right-10 h-80 w-80 rounded-full bg-sky-400/10 blur-[100px]" />
          <div className="pointer-events-none absolute bottom-10 left-10 h-80 w-80 rounded-full bg-indigo-500/10 blur-[100px]" />
        </>
      )}

      <div className="relative z-10">{renderContent()}</div>
    </div>
  );
}
