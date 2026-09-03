"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import * as Icons from "lucide-react";
import Link from "next/link";
import { Bot, ArrowUp, LayoutGrid } from "lucide-react";
import { useBackToTopVisibility } from "@/hooks/use-back-to-top-visibility";

/**
 * Temu Gradient Bubble — Inspired by Temu.com's vivid floating action bar.
 *
 * - Bold orange-to-red gradient backdrop
 * - White icons and labels on colored background for max contrast
 * - Each item is a full circle with white icon + optional tiny label beneath
 * - Hover: scale 1.15× + white glow ring via box-shadow
 * - Staggered slide-up entrance animation when component mounts
 * - AI assistant item: continuous pulse ring (attention-grabbing)
 * - Back-to-top: same style, appears above the main cluster on scroll
 */
export function TemuGradientBubbleFloatingTab({ group }: { group: any }) {
  const [mounted, setMounted] = useState(false);
  const backToTopVisible = useBackToTopVisibility();

  useEffect(() => {
    // Small delay so the stagger animation plays on first render
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, []);

  if (!group.items || group.items.length === 0) return null;

  const visibleItems = group.items.filter(
    (item: any) => item.type !== "back_to_top" || backToTopVisible,
  );
  if (visibleItems.length === 0) return null;

  const positionClass = (() => {
    switch (group.position) {
      case "left-center":
        return "left-4 top-1/2 -translate-y-1/2";
      case "left-bottom":
        return "left-4 bottom-16";
      case "right-center":
        return "right-4 top-1/2 -translate-y-1/2";
      case "right-bottom":
      default:
        return "right-4 bottom-16";
    }
  })();

  return (
    <div
      className={cn(
        "fixed z-50 flex flex-col items-center gap-3",
        positionClass,
      )}
    >
      {group.items.map((item: any, idx: number) => (
        <TabItem
          key={item.id}
          item={item}
          mounted={mounted}
          staggerIndex={idx}
          backToTopVisible={backToTopVisible}
        />
      ))}
    </div>
  );
}

function TabItem({
  item,
  mounted,
  staggerIndex,
  backToTopVisible,
}: {
  item: any;
  mounted: boolean;
  staggerIndex: number;
  backToTopVisible: boolean;
}) {
  const [isHovered, setIsHovered] = useState(false);

  const iconKey = item.icon
    ? item.icon.charAt(0).toUpperCase() +
      item.icon.slice(1).replace(/-./g, (x: string) => x[1].toUpperCase())
    : "Link";

  let IconComponent = (Icons as Record<string, any>)[iconKey] ?? Icons.Link;
  if (item.type === "ai_assistant") IconComponent = Bot;
  if (item.type === "back_to_top") IconComponent = ArrowUp;
  if (item.type === "category_trigger") IconComponent = LayoutGrid;

  const handleClick = (e: React.MouseEvent) => {
    if (item.type === "back_to_top") {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    if (item.type === "ai_assistant") {
      e.preventDefault();
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      window.dispatchEvent(new CustomEvent("ai-sales-agent:open", { detail: { rect } }));
    }
  };

  const isBackToTopHidden = item.type === "back_to_top" && !backToTopVisible;

  const staggerDelay = staggerIndex * 60;

  const content = (
    <div
      className={cn(
        "flex flex-col items-center gap-1 select-none transition-all duration-300",
        // Staggered entrance: items rise from below
        mounted && !isBackToTopHidden
          ? "translate-y-0 opacity-100"
          : "translate-y-6 opacity-0",
        isBackToTopHidden && "pointer-events-none h-0 w-0 overflow-hidden gap-0",
      )}
      style={{
        transitionDelay: isBackToTopHidden ? "0ms" : `${staggerDelay}ms`,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      {/* Circle button */}
      <div
        className={cn(
          "relative flex items-center justify-center w-12 h-12 rounded-full cursor-pointer",
          "transition-all duration-200",
          // The vivid Temu gradient
          "bg-[linear-gradient(135deg,_#FF6A00_0%,_#EE0979_100%)]",
          isHovered
            ? "scale-[1.15] shadow-[0_0_0_4px_rgba(255,255,255,0.45),_0_6px_20px_rgba(238,9,121,0.45)]"
            : "shadow-[0_4px_14px_rgba(238,9,121,0.35)]",
          item.type === "ai_assistant" && !isHovered
            ? "shadow-[0_0_0_3px_rgba(255,106,0,0.4),_0_4px_14px_rgba(238,9,121,0.35)]"
            : "",
        )}
      >
        <IconComponent
          className={cn(
            "h-5 w-5 text-white transition-transform duration-200",
            isHovered && "scale-110",
          )}
        />

        {/* AI pulsing ring */}
        {item.type === "ai_assistant" && !isHovered && (
          <span className="absolute inset-0 rounded-full animate-ping bg-white/20 pointer-events-none" />
        )}
      </div>

      {/* Item label — always shown, small white text */}
      <span
        className={cn(
          "text-[10px] font-bold leading-none tracking-tight",
          "text-white/90 drop-shadow-sm text-center max-w-[52px] truncate",
          "transition-opacity duration-200",
          isHovered ? "opacity-100" : "opacity-80",
        )}
      >
        {item.name ||
          (item.type === "ai_assistant"
            ? "AI Chat"
            : item.type === "back_to_top"
              ? "Top"
              : item.type === "category_trigger"
                ? "Browse"
                : "Link")}
      </span>
    </div>
  );

  if (item.type === "link" && item.url) {
    return <Link href={item.url}>{content}</Link>;
  }

  return content;
}
