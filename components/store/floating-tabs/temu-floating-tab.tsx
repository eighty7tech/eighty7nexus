"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import * as Icons from "lucide-react";
import Link from "next/link";
import { Bot, ArrowUp, LayoutGrid } from "lucide-react";
import { useBackToTopVisibility } from "@/hooks/use-back-to-top-visibility";

export function TemuFloatingTab({ group }: { group: any }) {
  const getPositionClasses = () => {
    switch (group.position) {
      case "left-center": return "left-0 top-1/2 -translate-y-1/2 rounded-r-xl";
      case "left-bottom": return "left-4 bottom-20 rounded-xl";
      case "right-center": return "right-0 top-1/2 -translate-y-1/2 rounded-l-xl";
      case "right-bottom": return "right-4 bottom-20 rounded-xl";
      default: return "right-4 bottom-20 rounded-xl";
    }
  };

  const backToTopVisible = useBackToTopVisibility();

  if (!group.items || group.items.length === 0) return null;

  // If all items are back_to_top and none should be visible, hide the whole group
  const visibleItems = group.items.filter(
    (item: any) => item.type !== "back_to_top" || backToTopVisible,
  );
  if (visibleItems.length === 0) return null;

  return (
    <div
      className={cn(
        "fixed z-50 flex flex-col items-center justify-center p-2 gap-4 cursor-pointer shadow-lg transition-all duration-300",
        "bg-background/90 backdrop-blur-md border border-border hover:shadow-xl",
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
  
  let IconComponent = (Icons as any)[item.icon] || Icons.Link;
  
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
        "flex flex-col items-center group/item transition-all",
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
        "p-2 rounded-full transition-colors",
        isHovered ? "bg-accent text-accent-foreground" : "text-foreground",
        item.type === "ai_assistant" && "text-primary animate-pulse"
      )}>
        <IconComponent className="h-6 w-6" />
      </div>
      {isHovered && item.type !== "back_to_top" && (
        <span className="absolute -left-full ml-[-20px] top-1/2 -translate-y-1/2 px-2 py-1 bg-popover text-popover-foreground text-[10px] font-bold rounded shadow-md animate-in fade-in whitespace-nowrap">
          {item.name}
        </span>
      )}
    </div>
  );

  if (item.type === "link" && item.url) {
    return <Link href={item.url}>{content}</Link>;
  }

  return content;
}
