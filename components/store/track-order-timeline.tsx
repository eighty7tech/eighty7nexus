"use client";

import { Check, CheckCircle2, CircleDashed } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import type { ScanEvent } from "@/components/shipping/scan-history";
import { useTranslations } from "next-intl";

type TrackingEvent = {
  key: string;
  title: string;
  description: string;
  timestamp?: string;
  completed: boolean;
};

interface TrackOrderTimelineProps {
  timeline: TrackingEvent[];
  activeIndex: number;
  scanEvents?: ScanEvent[];
  themeClasses: {
    timelineComplete: string;
    timelineActive: string;
    timelineConnector: string;
  };
}

function formatScanDate(value: string) {
  try {
    return format(new Date(value), "MMM d, h:mm a");
  } catch {
    return value;
  }
}

export function TrackOrderTimeline({
  timeline,
  activeIndex,
  scanEvents,
  themeClasses,
}: TrackOrderTimelineProps) {
  const t = useTranslations("orders.tracking");
  const hasScans = scanEvents && scanEvents.length > 0;

  return (
    <div className="relative mt-8 space-y-8 md:space-y-0 md:flex md:justify-between md:before:absolute md:before:top-5 md:before:left-8 md:before:right-8 md:before:h-1 md:before:bg-muted/50 md:before:-z-10">
      {timeline.map((event, index) => {
        const isActive = index === activeIndex;
        const isComplete = event.completed;
        const isLast = index === timeline.length - 1;

        // Determine if we should show detailed scans under this milestone
        // Typically, scans are shown under the "Processing" or "Shipped" step if active
        const showScansHere = isActive && hasScans && (event.key === "shipped" || event.key === "processing");

        return (
          <div key={event.key} className="relative flex items-start gap-4 md:flex-col md:items-center md:flex-1 md:text-center md:px-2">
            
            {/* Vertical Connector for Mobile */}
            {!isLast && (
              <div
                className={cn(
                  "absolute left-5 top-10 -ml-px h-[calc(100%+2rem)] w-0.5 md:hidden",
                  isComplete ? themeClasses.timelineConnector : "bg-muted/50"
                )}
                style={{
                  height: showScansHere ? `calc(100% + ${scanEvents.length * 3.5}rem + 2rem)` : "calc(100% + 2rem)"
                }}
              />
            )}

            {/* Desktop Progress Line Fill */}
            {isComplete && !isLast && (
              <div 
                className={cn(
                  "hidden md:block absolute top-5 left-1/2 w-full h-1 -z-10",
                  themeClasses.timelineConnector
                )}
              />
            )}

            {/* Milestone Icon */}
            <div
              className={cn(
                "relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-500",
                isComplete
                  ? themeClasses.timelineComplete
                  : isActive
                    ? themeClasses.timelineActive
                    : "border-muted bg-background text-muted-foreground"
              )}
            >
              {isComplete ? (
                <Check className="h-5 w-5" strokeWidth={3} />
              ) : isActive ? (
                <div className="h-2.5 w-2.5 rounded-full bg-current animate-pulse" />
              ) : (
                <span className="text-sm font-semibold">{index + 1}</span>
              )}
            </div>

            {/* Milestone Content */}
            <div className="pt-2 md:pt-4 w-full">
              <h4 className={cn("text-base font-bold", isActive || isComplete ? "text-foreground" : "text-muted-foreground")}>
                {event.title}
              </h4>
              <p className="mt-1 text-sm text-muted-foreground line-clamp-2 md:line-clamp-none">
                {event.description}
              </p>
              {event.timestamp && (
                <p className="mt-1.5 font-mono text-xs font-medium text-muted-foreground/80">
                  {format(new Date(event.timestamp), "MMM d, yyyy")}
                </p>
              )}

              {/* Nested Scan History */}
              {showScansHere && (
                <div className="mt-4 space-y-3 bg-muted/20 rounded-xl p-3 md:text-left text-sm animate-in fade-in slide-in-from-top-4 duration-500">
                  {scanEvents.map((scan, i) => (
                    <div key={i} className="flex gap-3 relative">
                      {i !== scanEvents.length - 1 && (
                        <div className="absolute left-2.5 top-5 w-px h-full bg-border -z-10" />
                      )}
                      <div className="mt-0.5 shrink-0">
                        {i === 0 ? (
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                        ) : (
                          <CircleDashed className="h-5 w-5 text-muted-foreground/50" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={cn("font-medium", i === 0 ? "text-foreground" : "text-muted-foreground")}>
                          {scan.status} {scan.location && `• ${scan.location}`}
                        </p>
                        <p className="text-xs text-muted-foreground/80 mt-0.5">{formatScanDate(scan.at)}</p>
                        {scan.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{scan.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
