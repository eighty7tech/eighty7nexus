"use client";

import { useEffect, useState } from "react";
import { TemuFloatingTab } from "./temu-floating-tab";
import { AlibabaFloatingTab } from "./alibaba-floating-tab";
import { AliExpressFloatingTab } from "./aliexpress-floating-tab";
import { ModernGlowFloatingTab } from "./modern-glow-floating-tab";
import { GlassPanelFloatingTab } from "./glass-panel-floating-tab";
import { NeumorphicFloatingTab } from "./neumorphic-floating-tab";
import { AlibabaSideRailFloatingTab } from "./alibaba-side-rail-floating-tab";
import { AliExpressIconRailFloatingTab } from "./aliexpress-icon-rail-floating-tab";
import { TemuGradientBubbleFloatingTab } from "./temu-gradient-bubble-floating-tab";
import { cn } from "@/lib/utils";

export interface TabConfig {
  id: string;
  name: string;
  position: string;
  styleVariant?: string;
  displayOnMobile?: boolean;
  items: any[];
}

export function FloatingTabsOrchestrator({
  floatingTabs = [],
}: {
  floatingTabs?: TabConfig[];
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <>
      {floatingTabs.map((group) => (
        <TabGroupRenderer key={group.id} group={group} />
      ))}
    </>
  );
}

function TabGroupRenderer({ group }: { group: TabConfig }) {
  const styleVariant = group.styleVariant || "rounded-float";

  const renderTab = () => {
    switch (styleVariant) {
      case "block-edge":
      case "alibaba":
        return <AlibabaFloatingTab group={group} />;
      case "pill-minimal":
      case "aliexpress":
        return <AliExpressFloatingTab group={group} />;
      case "modern-glow":
        return <ModernGlowFloatingTab group={group} />;
      case "glass-panel":
        return <GlassPanelFloatingTab group={group} />;
      case "neumorphic":
        return <NeumorphicFloatingTab group={group} />;
      case "alibaba-side-rail":
      case "edge-reveal":
        return <AlibabaSideRailFloatingTab group={group} />;
      case "aliexpress-icon-rail":
      case "icon-dock":
        return <AliExpressIconRailFloatingTab group={group} />;
      case "temu-gradient-bubble":
      case "gradient-burst":
        return <TemuGradientBubbleFloatingTab group={group} />;
      case "rounded-float":
      case "temu":
      default:
        return <TemuFloatingTab group={group} />;
    }
  };

  return (
    <div className={cn(group.displayOnMobile === false && "max-md:hidden")}>
      {renderTab()}
    </div>
  );
}
