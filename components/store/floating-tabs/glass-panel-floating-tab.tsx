"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import * as Icons from "lucide-react";
import Link from "next/link";
import { Bot, ArrowUp, LayoutGrid } from "lucide-react";
import { useBackToTopVisibility } from "@/hooks/use-back-to-top-visibility";

export function GlassPanelFloatingTab({ group }: { group: any }) {
  const getPositionClasses = () => {
    switch (group.position) {
      case "left-center": return "left-2 top-1/2 -translate-y-1/2 rounded-full";
      case "left-bottom": return "left-4 bottom-20 rounded-full";
      case "right-center": return "right-2 top-1/2 -translate-y-1/2 rounded-full";
      case "right-bottom": return "right-4 bottom-20 rounded-full";
      default: return "right-4 bottom-20 rounded-full";
    }
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
        "fixed z-50 flex flex-col items-center justify-center p-2.5 gap-4 cursor-pointer shadow-2xl transition-all duration-300",
        "bg-background/40 backdrop-blur-2xl border border-white/20 dark:border-white/10",
        getPositionClasses()
      )}
    >
      {group.items.map((item: any) => (
        <TabItem key={item.id} item={item} backToTopVisible={backToTopVisible} />
      ))}
    </div>
  );
}

function TabItem({ item, backToTopVisible }: { item: any; backToTopVisible: boolean }) {
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
        "flex flex-col items-center group/item transition-all duration-200",
        item.type === "back_to_top"
          ? backToTopVisible
            ? "opacity-100 scale-100 pointer-events-auto"
            : "opacity-0 scale-75 pointer-events-none h-0 overflow-hidden"
          : "hover:scale-110",
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      <div className={cn(
        "flex flex-col items-center p-3 rounded-full transition-all duration-300 backdrop-blur-md border min-w-[68px]",
        isHovered ? "bg-white/40 dark:bg-black/40 border-white/50 dark:border-white/30 text-foreground scale-110 shadow-lg" : "bg-white/10 dark:bg-black/10 border-transparent text-foreground/80",
        item.type === "ai_assistant" && !isHovered && "text-primary ring-2 ring-primary/20"
      )}>
        <IconComponent className="h-6 w-6 mb-1.5" />
        <span className="text-[11px] font-semibold text-center leading-tight">
          {item.name || (item.type === 'ai_assistant' ? 'AI Chat' : item.type === 'back_to_top' ? 'Top' : 'Link')}
        </span>
      </div>
    </div>
  );

  if (item.type === "link" && item.url) {
    return <Link href={item.url}>{content}</Link>;
  }

  return content;
}
