"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import * as Icons from "lucide-react";
import Link from "next/link";
import { Bot, ArrowUp, LayoutGrid } from "lucide-react";
import { useBackToTopVisibility } from "@/hooks/use-back-to-top-visibility";

export function NeumorphicFloatingTab({ group }: { group: any }) {
  const getPositionClasses = () => {
    switch (group.position) {
      case "left-center": return "left-6 top-1/2 -translate-y-1/2 rounded-[2rem]";
      case "left-bottom": return "left-6 bottom-24 rounded-[2rem]";
      case "right-center": return "right-6 top-1/2 -translate-y-1/2 rounded-[2rem]";
      case "right-bottom": return "right-6 bottom-24 rounded-[2rem]";
      default: return "right-6 bottom-24 rounded-[2rem]";
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
        "fixed z-50 flex flex-col items-center justify-center p-3 gap-5 cursor-pointer transition-all duration-300",
        "bg-background",
        "shadow-[5px_5px_15px_rgba(0,0,0,0.1),-5px_-5px_15px_rgba(255,255,255,0.8)]",
        "dark:shadow-[5px_5px_15px_rgba(0,0,0,0.4),-5px_-5px_15px_rgba(255,255,255,0.05)]",
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
            : "opacity-0 scale-50 pointer-events-none h-0 overflow-hidden"
          : "",
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      <div className={cn(
        "flex flex-col items-center p-3 rounded-2xl transition-all duration-300 min-w-[64px]",
        isHovered 
          ? "shadow-[inset_4px_4px_8px_rgba(0,0,0,0.1),inset_-4px_-4px_8px_rgba(255,255,255,0.8)] dark:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.4),inset_-4px_-4px_8px_rgba(255,255,255,0.05)] text-primary scale-110" 
          : "text-muted-foreground",
        item.type === "ai_assistant" && !isHovered && "text-primary shadow-[2px_2px_5px_rgba(0,0,0,0.1),-2px_-2px_5px_rgba(255,255,255,0.8)] dark:shadow-[2px_2px_5px_rgba(0,0,0,0.4),-2px_-2px_5px_rgba(255,255,255,0.05)]"
      )}>
        <IconComponent className={cn("h-6 w-6 mb-1.5 transition-transform", isHovered && "scale-90")} />
        <span className="text-[11px] font-bold text-center leading-tight">
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
