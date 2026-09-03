"use client";

import * as React from "react";
import { GripVertical, RotateCcw } from "lucide-react";

interface DashboardLayoutBarProps {
  isCustomOrdered: boolean;
  onResetOrder: () => void;
}

export function DashboardLayoutBar({
  isCustomOrdered,
  onResetOrder,
}: DashboardLayoutBarProps) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-2xl border border-border/80 bg-card/85 px-3 py-2 backdrop-blur-xl shadow-xs">
      <span className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
        <GripVertical className="h-3 w-3 text-[#77CDCC]" />
        Drag cards to rearrange
      </span>
      {isCustomOrdered && (
        <button
          type="button"
          onClick={onResetOrder}
          className="flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold text-[#77CDCC] hover:bg-[#77CDCC]/20 transition-colors"
        >
          <RotateCcw className="h-3 w-3" />
          Reset Order
        </button>
      )}
    </div>
  );
}
