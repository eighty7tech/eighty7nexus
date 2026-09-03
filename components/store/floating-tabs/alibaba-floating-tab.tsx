"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import * as Icons from "lucide-react";
import Link from "next/link";
import { Bot, ArrowUp, LayoutGrid } from "lucide-react";
import { useBackToTopVisibility } from "@/hooks/use-back-to-top-visibility";

export function AlibabaFloatingTab({ group }: { group: any }) {
  const getPositionClasses = () => {
    switch (group.position) {
      case "left-center": return "left-0 top-1/2 -translate-y-1/2 rounded-r-md border-l-0";
      case "left-bottom": return "left-4 bottom-24 rounded-md";
      case "right-center": return "right-0 top-1/2 -translate-y-1/2 rounded-l-md border-r-0";
      case "right-bottom": return "right-4 bottom-24 rounded-md";
      default: return "right-0 top-1/2 -translate-y-1/2 rounded-l-md border-r-0";
    }
  };

  const getExpandDirection = () => {
    if (group.position.includes("left")) return "translate-x-full left-0 ml-12";
    return "-translate-x-full right-0 mr-12";
  };

  const backToTopVisible = useBackToTopVisibility();

  if (!group.items || group.items.length === 0) return null;

  const visibleItems = group.items.filter(
    (item: any) => item.type !== "back_to_top" || backToTopVisible,
  );
  if (visibleItems.length === 0) return null;

  return (
    <div
      className={cn(
        "fixed z-50 flex flex-col items-center justify-center cursor-pointer shadow-md transition-all duration-200",
        "bg-background border border-border divide-y divide-border",
        getPositionClasses()
      )}
    >
      {group.items.map((item: any) => (
        <TabItem key={item.id} item={item} expandDirection={getExpandDirection()} backToTopVisible={backToTopVisible} />
      ))}
    </div>
  );
}

function TabItem({ item, expandDirection, backToTopVisible }: { item: any, expandDirection: string, backToTopVisible: boolean }) {
  const [isHovered, setIsHovered] = useState(false);
  
  const iconKey = item.icon 
    ? item.icon.charAt(0).toUpperCase() + item.icon.slice(1).replace(/-./g, (x: any) => x[1].toUpperCase())
    : "Link";
  
  let IconComponent = (Icons as any)[iconKey] || Icons.Link;
  
  if (item.type === "ai_assistant") IconComponent = Bot;
  if (item.type === "back_to_top") IconComponent = ArrowUp;
  if (item.type === "category_trigger") IconComponent = LayoutGrid;

  const handleClick = (e: any) => {
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

  const content = (
    <div 
      className={cn(
        "flex flex-col items-center relative p-3 hover:text-primary transition-all",
        item.type === "back_to_top" && !backToTopVisible && "opacity-0 scale-75 pointer-events-none h-0 overflow-hidden p-0",
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      <IconComponent className={cn("h-5 w-5", item.type === "ai_assistant" && "text-primary")} />
      {isHovered && item.type !== "back_to_top" && (
        <div className={cn("absolute px-3 py-1.5 bg-foreground text-background text-xs whitespace-nowrap rounded pointer-events-none animate-in fade-in zoom-in-95 z-50", expandDirection)}>
          {item.name}
        </div>
      )}
    </div>
  );

  if (item.type === "link" && item.url) {
    return <Link href={item.url}>{content}</Link>;
  }

  return content;
}
