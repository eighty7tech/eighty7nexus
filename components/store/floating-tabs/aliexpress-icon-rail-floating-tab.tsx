"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import * as Icons from "lucide-react";
import Link from "next/link";
import { Bot, ArrowUp, LayoutGrid } from "lucide-react";
import { useBackToTopVisibility } from "@/hooks/use-back-to-top-visibility";

/**
 * AliExpress Icon Rail — Inspired by AliExpress.com's per-item circle buttons.
 *
 * - Each tab item is its own standalone rounded square (not grouped in one bar)
 * - White background, 1px border, subtle shadow per item
 * - Icon-only at rest, tooltip popover appears on hover
 * - Hover: slight red-orange tint background + icon scales 1.1×
 * - Badge: red numeric badge for cart/notification types
 * - Items are spaced apart (not touching), creating an airy cluster
 * - Back-to-top slides in with a spring-like entrance animation
 */
export function AliExpressIconRailFloatingTab({ group }: { group: any }) {
  const isLeft = group.position?.includes("left");
  const backToTopVisible = useBackToTopVisibility();

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
        "fixed z-50 flex flex-col items-center gap-2.5",
        positionClass,
      )}
    >
      {group.items.map((item: any, idx: number) => (
        <TabItem
          key={item.id}
          item={item}
          isLeft={isLeft}
          backToTopVisible={backToTopVisible}
          animationDelay={idx * 40}
        />
      ))}
    </div>
  );
}

function TabItem({
  item,
  isLeft,
  backToTopVisible,
  animationDelay,
}: {
  item: any;
  isLeft: boolean;
  backToTopVisible: boolean;
  animationDelay: number;
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

  const isBackToTop = item.type === "back_to_top";
  const isHiddenBackToTop = isBackToTop && !backToTopVisible;

  const content = (
    <div className="relative flex items-center" style={{ animationDelay: `${animationDelay}ms` }}>
      {/* Tooltip — appears to the side */}
      {isHovered && !isBackToTop && (
        <div
          className={cn(
            "absolute pointer-events-none z-50 whitespace-nowrap",
            "px-2.5 py-1 rounded-md text-xs font-semibold",
            "bg-foreground text-background shadow-lg",
            "animate-in fade-in zoom-in-95 duration-150",
            isLeft
              ? "left-full ml-3 top-1/2 -translate-y-1/2"
              : "right-full mr-3 top-1/2 -translate-y-1/2",
          )}
        >
          {item.name ||
            (item.type === "ai_assistant"
              ? "AI Chat"
              : item.type === "category_trigger"
                ? "Categories"
                : "Link")}
          {/* Arrow tip */}
          <span
            className={cn(
              "absolute top-1/2 -translate-y-1/2 border-4 border-transparent",
              isLeft
                ? "-left-2 border-r-foreground"
                : "-right-2 border-l-foreground",
            )}
          />
        </div>
      )}

      {/* Item circle */}
      <button
        type="button"
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          "relative flex flex-col items-center justify-center",
          "w-11 h-11 rounded-[10px] border transition-all duration-200 select-none",
          "shadow-[0_2px_8px_rgba(0,0,0,0.10)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)]",
          isHiddenBackToTop
            ? "opacity-0 scale-75 pointer-events-none h-0 w-0 overflow-hidden border-0 shadow-none"
            : isHovered
              ? "bg-[rgba(255,69,0,0.07)] border-[rgba(255,69,0,0.25)] scale-110"
              : "bg-background border-border scale-100",
          item.type === "ai_assistant" && !isHovered && "border-primary/30",
        )}
        aria-label={item.name || item.type}
      >
        <IconComponent
          className={cn(
            "h-5 w-5 transition-colors duration-200",
            isHovered
              ? "text-[#FF6A00]"
              : item.type === "ai_assistant"
                ? "text-primary"
                : "text-foreground/80",
          )}
        />

        {/* AI pulse dot */}
        {item.type === "ai_assistant" && !isHovered && (
          <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-primary border-2 border-background animate-pulse" />
        )}
      </button>
    </div>
  );

  if (item.type === "link" && item.url) {
    return (
      <Link
        href={item.url}
        className="block"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {content}
      </Link>
    );
  }

  return content;
}
