"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  RotateCcw,
  Sparkles,
  Keyboard,
  Filter,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { KdsTicketStation } from "@/models/kitchen-ticket.model";

interface KdsBumpBarProps {
  selectedStation: KdsTicketStation;
  onSelectStation: (station: KdsTicketStation) => void;
  statusTab: "active" | "ready" | "completed";
  onSelectStatusTab: (tab: "active" | "ready" | "completed") => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onBumpFirst: () => void;
  onRecallLast: () => void;
  onRefresh: () => void;
  activeCount: number;
  readyCount: number;
  canRecall: boolean;
}

export function KdsBumpBar({
  selectedStation,
  onSelectStation,
  statusTab,
  onSelectStatusTab,
  soundEnabled,
  onToggleSound,
  onBumpFirst,
  onRecallLast,
  onRefresh,
  activeCount,
  readyCount,
  canRecall,
}: KdsBumpBarProps) {
  const t = useTranslations("kds");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showCheatsheet, setShowCheatsheet] = useState(false);

  const stations = [
    { id: "all" as const, label: t("stationAll") },
    { id: "kitchen" as const, label: t("stationKitchen") },
    { id: "bar" as const, label: t("stationBar") },
    { id: "bakery" as const, label: t("stationBakery") },
    { id: "assembly" as const, label: t("stationAssembly") },
    { id: "packing" as const, label: t("stationPacking") },
  ];

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-card/80 backdrop-blur-md px-4 py-2.5 shadow-xs select-none">
      {/* Station Filters */}
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
        <Filter className="h-4 w-4 text-muted-foreground mr-1 shrink-0" />
        {stations.map((station) => (
          <Button
            key={station.id}
            variant={selectedStation === station.id ? "default" : "ghost"}
            size="sm"
            onClick={() => onSelectStation(station.id)}
            className={cn(
              "h-8 rounded-lg px-2.5 text-xs font-semibold shrink-0 transition-all",
              selectedStation === station.id && "shadow-xs",
            )}
          >
            {station.label}
          </Button>
        ))}
      </div>

      {/* Status View Selector */}
      <div className="flex items-center gap-1 rounded-xl bg-muted/60 p-1 border">
        <Button
          variant={statusTab === "active" ? "default" : "ghost"}
          size="sm"
          onClick={() => onSelectStatusTab("active")}
          className="h-7 text-xs font-bold gap-1.5 px-3"
        >
          {t("active")}
          <Badge
            variant="secondary"
            className="h-4 px-1 text-[10px] font-mono leading-none bg-primary/20 text-primary-foreground"
          >
            {activeCount}
          </Badge>
        </Button>
        <Button
          variant={statusTab === "ready" ? "default" : "ghost"}
          size="sm"
          onClick={() => onSelectStatusTab("ready")}
          className="h-7 text-xs font-bold gap-1.5 px-3"
        >
          {t("ready")}
          <Badge
            variant="secondary"
            className="h-4 px-1 text-[10px] font-mono leading-none bg-emerald-500/20 text-emerald-700 dark:text-emerald-400"
          >
            {readyCount}
          </Badge>
        </Button>
        <Button
          variant={statusTab === "completed" ? "default" : "ghost"}
          size="sm"
          onClick={() => onSelectStatusTab("completed")}
          className="h-7 text-xs font-bold px-3"
        >
          {t("completed")}
        </Button>
      </div>

      {/* Hardware Bump Bar & Utilities */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onBumpFirst}
          disabled={activeCount === 0}
          className="h-8 gap-1.5 font-bold text-xs bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/25"
          title={t("bumpFirst")}
        >
          <Sparkles className="h-3.5 w-3.5" />
          {t("bumpFirst")}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onRecallLast}
          disabled={!canRecall}
          className="h-8 gap-1.5 font-bold text-xs"
          title={t("recall")}
        >
          <RotateCcw className="h-3.5 w-3.5" />
          {t("recall")}
        </Button>

        <div className="h-4 w-px bg-border mx-0.5" />

        {/* Audio Toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={onToggleSound}
          title={soundEnabled ? t("soundOff") : t("soundOn")}
        >
          {soundEnabled ? (
            <Volume2 className="h-4 w-4 text-primary" />
          ) : (
            <VolumeX className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>

        {/* Refresh */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={onRefresh}
          title="Refresh Queue"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>

        {/* Fullscreen Toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={toggleFullscreen}
          title="Toggle Fullscreen"
        >
          {isFullscreen ? (
            <Minimize2 className="h-4 w-4" />
          ) : (
            <Maximize2 className="h-4 w-4" />
          )}
        </Button>

        {/* Shortcuts Drawer Trigger */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={() => setShowCheatsheet((s) => !s)}
          title="Keyboard Shortcuts"
        >
          <Keyboard className="h-4 w-4" />
        </Button>
      </div>

      {/* Bump Bar Cheatsheet Drawer */}
      {showCheatsheet && (
        <div className="w-full border-t border-dashed pt-2 pb-1 text-xs text-muted-foreground flex flex-wrap items-center gap-4 animate-in fade-in">
          <span className="font-bold text-foreground">Bump Bar Shortcuts:</span>
          <span><kbd className="px-1.5 py-0.5 rounded bg-muted font-mono font-bold text-foreground">Space</kbd> or <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono font-bold text-foreground">Enter</kbd> : Advance / Bump Ticket</span>
          <span><kbd className="px-1.5 py-0.5 rounded bg-muted font-mono font-bold text-foreground">R</kbd> : Recall Last Ticket</span>
          <span><kbd className="px-1.5 py-0.5 rounded bg-muted font-mono font-bold text-foreground">1-9</kbd> : Select Ticket Column</span>
          <span><kbd className="px-1.5 py-0.5 rounded bg-muted font-mono font-bold text-foreground">S</kbd> : Cycle Station Filter</span>
          <span><kbd className="px-1.5 py-0.5 rounded bg-muted font-mono font-bold text-foreground">M</kbd> : Mute / Unmute Chime</span>
        </div>
      )}
    </div>
  );
}
