"use client";

import * as React from "react";
import { ArrowDown, ArrowUp, GripVertical, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DashboardWidgetId } from "./dashboard-layout-types";

interface WidgetItem {
  id: DashboardWidgetId;
  label: string;
  node: React.ReactNode;
}

interface DashboardDraggableContainerProps {
  items: WidgetItem[];
  currentOrder: DashboardWidgetId[];
  onReorder: (newOrder: DashboardWidgetId[]) => void;
  onResetOrder: () => void;
  isReordered: boolean;
}

export function DashboardDraggableContainer({
  items,
  currentOrder,
  onReorder,
  onResetOrder,
  isReordered,
}: DashboardDraggableContainerProps) {
  const [draggedId, setDraggedId] = React.useState<DashboardWidgetId | null>(null);
  const [dragOverId, setDragOverId] = React.useState<DashboardWidgetId | null>(null);

  // Map items by id
  const itemMap = React.useMemo(() => {
    const map = new Map<DashboardWidgetId, WidgetItem>();
    items.forEach((item) => map.set(item.id, item));
    return map;
  }, [items]);

  const handleDragStart = (id: DashboardWidgetId, e: React.DragEvent) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
  };

  const handleDragOver = (id: DashboardWidgetId, e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverId !== id) {
      setDragOverId(id);
    }
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
  };

  const handleDrop = (targetId: DashboardWidgetId, e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) {
      handleDragEnd();
      return;
    }

    const current = [...currentOrder];
    const sourceIndex = current.indexOf(draggedId);
    const targetIndex = current.indexOf(targetId);

    if (sourceIndex !== -1 && targetIndex !== -1) {
      current.splice(sourceIndex, 1);
      current.splice(targetIndex, 0, draggedId);
      onReorder(current);
    }

    handleDragEnd();
  };

  const moveItem = (id: DashboardWidgetId, direction: "up" | "down") => {
    const current = [...currentOrder];
    const index = current.indexOf(id);
    if (index === -1) return;

    if (direction === "up" && index > 0) {
      const temp = current[index - 1];
      current[index - 1] = current[index];
      current[index] = temp;
      onReorder(current);
    } else if (direction === "down" && index < current.length - 1) {
      const temp = current[index + 1];
      current[index + 1] = current[index];
      current[index] = temp;
      onReorder(current);
    }
  };

  return (
    <div className="space-y-4">
      {/* Optional Reorder Notification Strip if customized */}
      {isReordered && (
        <div className="flex items-center justify-between rounded-xl border border-[#77CDCC]/30 bg-[#001a45]/5 px-4 py-2 text-xs text-muted-foreground dark:bg-[#77CDCC]/10">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#77CDCC]" />
            <span>Custom widget arrangement active. Drag handles or use arrows to reposition.</span>
          </div>
          <button
            type="button"
            onClick={onResetOrder}
            className="flex items-center gap-1 rounded-lg px-2 py-1 font-semibold text-[#77CDCC] hover:bg-[#77CDCC]/20 transition-colors"
          >
            <RotateCcw className="h-3 w-3" />
            Reset Default Positions
          </button>
        </div>
      )}

      {/* Render widgets in currentOrder */}
      <div className="space-y-4">
        {currentOrder.map((id, index) => {
          const item = itemMap.get(id);
          if (!item) return null;

          const isDragging = draggedId === id;
          const isOver = dragOverId === id && draggedId !== id;

          return (
            <div
              key={id}
              draggable
              onDragStart={(e) => handleDragStart(id, e)}
              onDragOver={(e) => handleDragOver(id, e)}
              onDrop={(e) => handleDrop(id, e)}
              onDragEnd={handleDragEnd}
              className={cn(
                "group/widget relative transition-all duration-300 rounded-2xl",
                isDragging && "opacity-40 scale-[0.99]",
                isOver && "ring-2 ring-[#77CDCC] shadow-lg translate-y-1"
              )}
            >
              {/* Drag Handle Floating Bar */}
              <div className="absolute right-3 top-3 z-20 flex items-center gap-1 rounded-full border border-border/80 bg-card/85 px-2 py-1 opacity-0 backdrop-blur-md shadow-xs transition-opacity duration-200 group-hover/widget:opacity-100">
                <span className="text-[10px] font-semibold text-muted-foreground mr-1 hidden sm:inline">
                  {item.label}
                </span>

                <button
                  type="button"
                  onClick={() => moveItem(id, "up")}
                  disabled={index === 0}
                  className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30"
                  title="Move Up"
                  aria-label="Move Up"
                >
                  <ArrowUp className="h-3 w-3" />
                </button>

                <button
                  type="button"
                  onClick={() => moveItem(id, "down")}
                  disabled={index === currentOrder.length - 1}
                  className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30"
                  title="Move Down"
                  aria-label="Move Down"
                >
                  <ArrowDown className="h-3 w-3" />
                </button>

                <div
                  className="cursor-grab active:cursor-grabbing p-0.5 text-muted-foreground hover:text-[#77CDCC]"
                  title="Drag to reposition widget"
                >
                  <GripVertical className="h-3.5 w-3.5" />
                </div>
              </div>

              {/* The Actual Widget Component */}
              <div>{item.node}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
