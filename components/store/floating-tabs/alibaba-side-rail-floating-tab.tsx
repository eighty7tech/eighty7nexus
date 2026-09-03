"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import * as Icons from "lucide-react";
import Link from "next/link";
import { Bot, ArrowUp, LayoutGrid } from "lucide-react";
import { useBackToTopVisibility } from "@/hooks/use-back-to-top-visibility";

/**
 * Alibaba Side Rail — Inspired by Alibaba.com's right-edge sidebar.
 *
 * - Edge-attached: sticks to the right or left border, no gap/margin
 * - Hover expands: icon-only → label slides out horizontally
 * - Thin 1px dividers between items
 * - Light grey hover chip per item
 * - Optional orange accent for AI assistant item
 * - Back-to-top fades in from below after scroll
 */
export function AlibabaSideRailFloatingTab({ group }: { group: any }) {
  const isLeft = group.position?.includes("left");
  const isCenter = group.position?.includes("center");
  const backToTopVisible = useBackToTopVisibility();

  if (!group.items || group.items.length === 0) return null;

  const visibleItems = group.items.filter(
    (item: any) => item.type !== "back_to_top" || backToTopVisible,
  );
  if (visibleItems.length === 0) return null;

  const positionClass = (() => {
    switch (group.position) {
      case "left-center":
        return "left-0 top-1/2 -translate-y-1/2 rounded-r-xl border-l-0";
      case "left-bottom":
        return "left-0 bottom-24 rounded-r-xl border-l-0";
      case "right-center":
        return "right-0 top-1/2 -translate-y-1/2 rounded-l-xl border-r-0";
      case "right-bottom":
      default:
        return "right-0 bottom-24 rounded-l-xl border-r-0";
    }
  })();

  return (
    <div
      className={cn(
        "fixed z-50 flex flex-col items-stretch cursor-pointer",
        "bg-background border border-border shadow-[0_4px_24px_rgba(0,0,0,0.10)]",
        "divide-y divide-border overflow-hidden",
        positionClass,
      )}
    >
      {group.items.map((item: any) => (
        <TabItem
          key={item.id}
          item={item}
          isLeft={isLeft}
          backToTopVisible={backToTopVisible}
        />
      ))}
    </div>
  );
}

function TabItem({
  item,
  isLeft,
  backToTopVisible,
}: {
  item: any;
  isLeft: boolean;
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

  const content = (
    <div
      className={cn(
        "relative flex items-center gap-0 transition-all duration-250 overflow-hidden",
        "group/rail select-none",
        isBackToTopHidden
          ? "max-h-0 opacity-0 pointer-events-none py-0"
          : "max-h-24 opacity-100",
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      {/* Icon cell — always visible */}
      <div
        className={cn(
          "flex-shrink-0 flex items-center justify-center w-12 h-12 transition-colors duration-200",
          isHovered ? "bg-muted/60" : "bg-transparent",
        )}
      >
        <IconComponent
          className={cn(
            "h-5 w-5 transition-colors duration-200",
            item.type === "ai_assistant"
              ? "text-[#FF6A00]"
              : isHovered
                ? "text-foreground"
                : "text-foreground/70",
          )}
        />
      </div>

      {/* Label — slides out on hover */}
      <div
        className={cn(
          "flex items-center overflow-hidden transition-all duration-250 ease-in-out whitespace-nowrap",
          isLeft ? "pr-3" : "pl-0 pr-3",
          isHovered ? "max-w-[120px] opacity-100" : "max-w-0 opacity-0",
        )}
      >
        <span className="text-sm font-medium text-foreground leading-tight">
          {item.name ||
            (item.type === "ai_assistant"
              ? "AI Chat"
              : item.type === "back_to_top"
                ? "Top"
                : "Link")}
        </span>
      </div>

      {/* AI assistant accent dot */}
      {item.type === "ai_assistant" && !isHovered && (
        <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-[#FF6A00] animate-pulse" />
      )}
    </div>
  );

  if (item.type === "link" && item.url) {
    return <Link href={item.url}>{content}</Link>;
  }

  return content;
}
