"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import * as Icons from "lucide-react";
import Link from "next/link";
import { Bot, ArrowUp, LayoutGrid } from "lucide-react";
import { useBackToTopVisibility } from "@/hooks/use-back-to-top-visibility";

export function AliExpressFloatingTab({ group }: { group: any }) {
  const getPositionClasses = () => {
    switch (group.position) {
      case "left-center": return "left-4 top-1/2 -translate-y-1/2 rounded-full";
      case "left-bottom": return "left-4 bottom-16 rounded-full";
      case "right-center": return "right-4 top-1/2 -translate-y-1/2 rounded-full";
      case "right-bottom": return "right-4 bottom-16 rounded-full";
      default: return "right-4 bottom-16 rounded-full";
    }
  };

  const getExpandDirection = () => {
    if (group.position.includes("left")) return "absolute left-full ml-4 top-0";
    return "absolute right-full mr-4 top-0";
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
        "fixed z-50 flex flex-col items-center justify-center p-2 gap-2 cursor-pointer shadow-xl transition-all duration-300",
        "bg-background border border-border hover:shadow-2xl rounded-full",
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
        "flex flex-col items-center relative p-3 group transition-all hover:-translate-y-1 rounded-full hover:bg-muted/50",
        item.type === "back_to_top" && !backToTopVisible && "opacity-0 scale-75 pointer-events-none h-0 overflow-hidden p-0",
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      <IconComponent className="h-6 w-6 text-foreground group-hover:scale-110 transition-transform" />
      {item.type === "category_trigger" && isHovered && (
        <div className={cn("w-64 bg-background border shadow-2xl rounded-xl p-4 animate-in fade-in slide-in-from-right-4 z-50", expandDirection)}>
          <h3 className="font-semibold text-sm mb-2">Categories</h3>
          <p className="text-xs text-muted-foreground">Category dropdown content goes here.</p>
        </div>
      )}
      {item.type !== "category_trigger" && item.type !== "back_to_top" && isHovered && (
        <div className={cn("px-3 py-1.5 bg-foreground text-background text-xs whitespace-nowrap rounded pointer-events-none animate-in fade-in zoom-in-95 z-50", expandDirection.replace("top-0", "top-1/2 -translate-y-1/2"))}>
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
