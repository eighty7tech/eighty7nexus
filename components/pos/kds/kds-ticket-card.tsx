"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Play,
  Check,
  RotateCcw,
  Sparkles,
  ShoppingBag,
  Store,
  Truck,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  formatElapsedSeconds,
  getTicketUrgency,
  playKdsChime,
} from "@/lib/pos/kds-bridge";
import type { IKitchenTicket, KdsTicketStatus } from "@/models/kitchen-ticket.model";

interface KdsTicketCardProps {
  ticket: IKitchenTicket;
  index: number;
  isSelected?: boolean;
  onUpdateStatus: (ticketId: string, status: KdsTicketStatus) => Promise<void>;
  onToggleItem: (ticketId: string, itemIndex: number) => Promise<void>;
  onRecall?: (ticketId: string) => Promise<void>;
}

export function KdsTicketCard({
  ticket,
  index,
  isSelected,
  onUpdateStatus,
  onToggleItem,
  onRecall,
}: KdsTicketCardProps) {
  const t = useTranslations("kds");
  const [elapsed, setElapsed] = useState(() => {
    const start = ticket.createdAt ? new Date(ticket.createdAt).getTime() : Date.now();
    return Math.max(0, Math.floor((Date.now() - start) / 1000));
  });
  const [loading, setLoading] = useState(false);

  // Live timer tick every 1 second
  useEffect(() => {
    if (ticket.status === "completed" || ticket.status === "cancelled") return;

    const interval = setInterval(() => {
      const start = ticket.createdAt ? new Date(ticket.createdAt).getTime() : Date.now();
      setElapsed(Math.max(0, Math.floor((Date.now() - start) / 1000)));
    }, 1000);

    return () => clearInterval(interval);
  }, [ticket.createdAt, ticket.status]);

  const { urgency, badgeClass, colorClass } = getTicketUrgency({
    createdAt: ticket.createdAt,
    slaMinutes: ticket.slaMinutes || 15,
  });

  const handleAdvance = async () => {
    setLoading(true);
    try {
      if (ticket.status === "queued") {
        await onUpdateStatus(ticket._id as string, "in_progress");
        playKdsChime("bump");
      } else if (ticket.status === "in_progress") {
        await onUpdateStatus(ticket._id as string, "ready");
        playKdsChime("new_ticket");
      } else if (ticket.status === "ready") {
        await onUpdateStatus(ticket._id as string, "completed");
        playKdsChime("bump");
      }
    } finally {
      setLoading(false);
    }
  };

  const channelIcon = {
    pos: <Store className="h-3.5 w-3.5" />,
    storefront: <ShoppingBag className="h-3.5 w-3.5" />,
    bopis: <MapPin className="h-3.5 w-3.5" />,
    delivery: <Truck className="h-3.5 w-3.5" />,
  }[ticket.channel || "pos"];

  const allItemsReady =
    ticket.items &&
    ticket.items.length > 0 &&
    ticket.items.every((it) => it.isReady);

  return (
    <div
      className={cn(
        "flex flex-col rounded-xl border bg-card text-card-foreground shadow-md transition-all select-none overflow-hidden",
        colorClass,
        isSelected && "ring-4 ring-primary shadow-xl scale-[1.01]",
        ticket.status === "completed" && "opacity-75 grayscale-[20%]",
      )}
    >
      {/* Top Bar: Ticket #, Channel & Live Timer */}
      <div
        className={cn(
          "flex items-center justify-between border-b px-3.5 py-2.5",
          urgency === "overdue"
            ? "bg-rose-500/15 dark:bg-rose-950/40"
            : urgency === "warning"
              ? "bg-amber-500/10 dark:bg-amber-950/30"
              : "bg-muted/40",
        )}
      >
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary font-mono text-sm font-bold text-primary-foreground shadow-sm">
            #{ticket.ticketNumber}
          </span>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-xs tracking-tight">
                {ticket.orderNumber}
              </span>
              <Badge
                variant="outline"
                className="flex items-center gap-1 px-1.5 py-0 text-[10px] uppercase font-semibold tracking-wider"
              >
                {channelIcon}
                {ticket.channel}
              </Badge>
            </div>
            {ticket.customerName && (
              <span className="text-[11px] text-muted-foreground truncate max-w-[150px]">
                {ticket.customerName}
              </span>
            )}
          </div>
        </div>

        {/* Elapsed Timer & SLA */}
        <div className="flex items-center gap-1.5">
          <Badge
            variant="outline"
            className={cn(
              "font-mono text-xs font-bold px-2 py-0.5 border flex items-center gap-1 shadow-xs",
              badgeClass,
            )}
          >
            <Clock className="h-3 w-3" />
            {formatElapsedSeconds(elapsed)}
          </Badge>
        </div>
      </div>

      {/* Special Identifiers (Table / Pager / Pickup Code) */}
      {(ticket.tableNumber || ticket.pagerNumber || ticket.pickupCode) && (
        <div className="flex flex-wrap items-center gap-2 bg-muted/20 px-3.5 py-1 text-xs border-b">
          {ticket.tableNumber && (
            <span className="font-medium text-muted-foreground">
              {t("table")}: <strong className="text-foreground">{ticket.tableNumber}</strong>
            </span>
          )}
          {ticket.pagerNumber && (
            <span className="font-medium text-muted-foreground">
              {t("pager")}: <strong className="text-foreground">{ticket.pagerNumber}</strong>
            </span>
          )}
          {ticket.pickupCode && (
            <span className="font-medium text-muted-foreground">
              {t("pickup")}: <strong className="text-foreground">{ticket.pickupCode}</strong>
            </span>
          )}
        </div>
      )}

      {/* Order Items Checklist */}
      <div className="flex-1 space-y-2 p-3.5 overflow-y-auto max-h-[300px]">
        {ticket.items.map((item, itemIdx) => (
          <div
            key={itemIdx}
            onClick={() => onToggleItem(ticket._id as string, itemIdx)}
            className={cn(
              "group flex cursor-pointer items-start gap-2.5 rounded-lg p-2 transition-colors",
              item.isReady
                ? "bg-muted/40 text-muted-foreground line-through opacity-60"
                : "hover:bg-muted/60 bg-muted/20",
            )}
          >
            <span
              className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-md font-mono text-xs font-bold shadow-xs",
                item.isReady
                  ? "bg-muted text-muted-foreground"
                  : "bg-primary/15 text-primary border border-primary/20",
              )}
            >
              {item.quantity}×
            </span>
            <div className="flex-1">
              <div className="font-semibold text-xs leading-snug">
                {item.name}
                {item.variantName && (
                  <span className="ml-1 text-[11px] font-normal text-muted-foreground">
                    ({item.variantName})
                  </span>
                )}
              </div>
              {item.notes && (
                <div className="mt-1 inline-flex items-center gap-1 rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-400 border border-amber-500/30">
                  <AlertCircle className="h-2.5 w-2.5" />
                  {item.notes}
                </div>
              )}
            </div>
            <div
              className={cn(
                "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                item.isReady
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-muted-foreground/40 group-hover:border-primary",
              )}
            >
              {item.isReady && <Check className="h-3 w-3 stroke-[3]" />}
            </div>
          </div>
        ))}

        {ticket.notes && (
          <div className="mt-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2 text-xs text-amber-800 dark:text-amber-300">
            <span className="font-semibold">Note:</span> {ticket.notes}
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="border-t bg-muted/30 p-2.5">
        {ticket.status === "completed" ? (
          onRecall ? (
            <Button
              variant="outline"
              size="sm"
              className="w-full font-semibold text-xs gap-1.5"
              onClick={() => onRecall(ticket._id as string)}
              disabled={loading}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              {t("recall")}
            </Button>
          ) : (
            <div className="flex items-center justify-center gap-1 text-xs text-emerald-600 font-semibold py-1">
              <CheckCircle2 className="h-4 w-4" />
              {t("completed")}
            </div>
          )
        ) : (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className={cn(
                "flex-1 font-bold text-xs gap-1.5 shadow-sm transition-all",
                ticket.status === "queued" && "bg-blue-600 hover:bg-blue-700 text-white",
                ticket.status === "in_progress" && "bg-amber-600 hover:bg-amber-700 text-white",
                ticket.status === "ready" && "bg-emerald-600 hover:bg-emerald-700 text-white",
              )}
              onClick={handleAdvance}
              disabled={loading}
            >
              {ticket.status === "queued" && (
                <>
                  <Play className="h-3.5 w-3.5 fill-current" />
                  {t("startPrep")}
                </>
              )}
              {ticket.status === "in_progress" && (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {t("markReady")}
                </>
              )}
              {ticket.status === "ready" && (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  {t("bumpDone")}
                </>
              )}
            </Button>

            {ticket.status !== "ready" && allItemsReady && (
              <Button
                variant="secondary"
                size="sm"
                className="font-bold text-xs px-2.5 bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/30"
                onClick={() => onUpdateStatus(ticket._id as string, "ready")}
                disabled={loading}
              >
                {t("markReady")}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
