"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  ChefHat,
  Clock,
  Volume2,
  RefreshCw,
  Store,
  ArrowLeft,
  LayoutDashboard,
  AlertCircle,
  Inbox,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { KdsTicketCard } from "@/components/pos/kds/kds-ticket-card";
import { KdsBumpBar } from "@/components/pos/kds/kds-bump-bar";
import { useAppSettings } from "@/providers/app-settings-provider";
import { POSWorkstationDisabled } from "@/components/pos/pos-workstation-disabled";
import {
  subscribeToKds,
  broadcastKdsEvent,
  playKdsChime,
} from "@/lib/pos/kds-bridge";
import type {
  IKitchenTicket,
  KdsTicketStatus,
  KdsTicketStation,
} from "@/models/kitchen-ticket.model";

export default function KitchenDisplaySystemPage() {
  const t = useTranslations("kds");
  const [tickets, setTickets] = useState<IKitchenTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStation, setSelectedStation] = useState<KdsTicketStation>("all");
  const [statusTab, setStatusTab] = useState<"active" | "ready" | "completed">("active");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [lastBumpedId, setLastBumpedId] = useState<string | null>(null);

  const prevTicketCountRef = useRef<number>(0);

  const fetchTickets = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      params.set("status", statusTab);
      if (selectedStation !== "all") {
        params.set("station", selectedStation);
      }

      const res = await fetch(`/api/pos/kds/tickets?${params.toString()}`);
      if (!res.ok) return;

      const data = await res.json();
      if (data?.data?.tickets) {
        const fetched: IKitchenTicket[] = data.data.tickets;

        // Play chime if new tickets arrived in active view
        if (
          statusTab === "active" &&
          prevTicketCountRef.current > 0 &&
          fetched.length > prevTicketCountRef.current &&
          soundEnabled
        ) {
          playKdsChime("new_ticket");
        }

        prevTicketCountRef.current = fetched.length;
        setTickets(fetched);
      }
    } catch (err) {
      console.error("Failed to load KDS tickets:", err);
    } finally {
      setLoading(false);
    }
  }, [statusTab, selectedStation, soundEnabled]);

  // Initial load and periodic polling fallback (10s)
  useEffect(() => {
    fetchTickets();
    const interval = setInterval(fetchTickets, 10_000);
    return () => clearInterval(interval);
  }, [fetchTickets]);

  // Real-time multi-window sync via BroadcastChannel
  useEffect(() => {
    const unsubscribe = subscribeToKds((event) => {
      if (event.type === "TICKET_CREATED") {
        if (soundEnabled) playKdsChime("new_ticket");
        fetchTickets();
      } else if (event.type === "TICKET_UPDATED" || event.type === "TICKET_BUMPED") {
        fetchTickets();
      } else if (event.type === "REFRESH_ALL") {
        fetchTickets();
      }
    });
    return unsubscribe;
  }, [fetchTickets, soundEnabled]);

  // Update status handler
  const handleUpdateStatus = async (ticketId: string, status: KdsTicketStatus) => {
    try {
      const res = await fetch(`/api/pos/kds/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) return;

      if (status === "completed") {
        setLastBumpedId(ticketId);
      }

      broadcastKdsEvent({ type: "TICKET_BUMPED", ticketId, status });
      await fetchTickets();
    } catch (err) {
      console.error("Failed to advance ticket status:", err);
    }
  };

  // Toggle single item ready state
  const handleToggleItem = async (ticketId: string, itemIndex: number) => {
    try {
      const res = await fetch(`/api/pos/kds/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toggleItemIndex: itemIndex }),
      });
      if (!res.ok) return;

      const json = await res.json();
      if (json?.data?.ticket) {
        broadcastKdsEvent({ type: "TICKET_UPDATED", ticket: json.data.ticket });
        await fetchTickets();
      }
    } catch (err) {
      console.error("Failed to toggle item ready status:", err);
    }
  };

  // Recall last bumped ticket
  const handleRecall = async (ticketId: string) => {
    try {
      const res = await fetch(`/api/pos/kds/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recall: true }),
      });
      if (!res.ok) return;

      if (soundEnabled) playKdsChime("bump");
      setLastBumpedId(null);
      broadcastKdsEvent({ type: "REFRESH_ALL" });
      setStatusTab("active");
      await fetchTickets();
    } catch (err) {
      console.error("Failed to recall ticket:", err);
    }
  };

  // Bump Bar shortcut handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.code === "Space" || e.code === "Enter") {
        e.preventDefault();
        if (tickets.length > 0) {
          const targetTicket = tickets[selectedIndex] || tickets[0];
          if (targetTicket) {
            const nextStatus: KdsTicketStatus =
              targetTicket.status === "queued"
                ? "in_progress"
                : targetTicket.status === "in_progress"
                  ? "ready"
                  : "completed";
            handleUpdateStatus(targetTicket._id as string, nextStatus);
          }
        }
      } else if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        if (lastBumpedId) {
          handleRecall(lastBumpedId);
        }
      } else if (e.key === "m" || e.key === "M") {
        e.preventDefault();
        setSoundEnabled((s) => !s);
      } else if (e.key >= "1" && e.key <= "9") {
        const idx = Number(e.key) - 1;
        if (idx < tickets.length) {
          setSelectedIndex(idx);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [tickets, selectedIndex, lastBumpedId]);

  const { posKdsEnabled } = useAppSettings();

  if (!posKdsEnabled) {
    return (
      <POSWorkstationDisabled
        title={t("workstationDisabled")}
        description={t("workstationDisabledDesc")}
      />
    );
  }

  const activeTickets = tickets.filter(
    (t) => t.status === "queued" || t.status === "in_progress",
  );
  const readyTickets = tickets.filter((t) => t.status === "ready");

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-background text-foreground select-none font-sans">
      {/* Top Application Header */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-border/60 bg-card/85 backdrop-blur-md px-6 shadow-xs">
        <div className="flex items-center gap-3">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 rounded-xl text-xs font-semibold border-border/60 bg-background/80 hover:bg-muted shadow-xs"
          >
            <Link href="/admin/pos">
              <ArrowLeft className="h-3.5 w-3.5" />
              {t("backToPos")}
            </Link>
          </Button>

          <Button
            asChild
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <Link href="/admin/dashboard">
              <LayoutDashboard className="h-3.5 w-3.5" />
              {t("backToDashboard")}
            </Link>
          </Button>

          <div className="h-4 w-px bg-border mx-1 hidden sm:block" />

          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ChefHat className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight flex items-center gap-1.5">
                {t("title")}
                <span className="rounded bg-primary/15 text-primary text-[10px] font-mono px-1.5 py-0.5">
                  LIVE
                </span>
              </h1>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-xs text-muted-foreground font-mono">
            <Clock className="h-3.5 w-3.5" />
            {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </div>
        </div>
      </header>

      {/* Bump Bar / Control Strip */}
      <KdsBumpBar
        selectedStation={selectedStation}
        onSelectStation={setSelectedStation}
        statusTab={statusTab}
        onSelectStatusTab={setStatusTab}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled((s) => !s)}
        onBumpFirst={() => {
          if (tickets.length > 0) {
            const first = tickets[0];
            const nextStatus: KdsTicketStatus =
              first.status === "queued"
                ? "in_progress"
                : first.status === "in_progress"
                  ? "ready"
                  : "completed";
            handleUpdateStatus(first._id as string, nextStatus);
          }
        }}
        onRecallLast={() => {
          if (lastBumpedId) handleRecall(lastBumpedId);
        }}
        onRefresh={fetchTickets}
        activeCount={activeTickets.length}
        readyCount={readyTickets.length}
        canRecall={Boolean(lastBumpedId)}
      />

      {/* Main Ticket Grid */}
      <main className="flex-1 overflow-y-auto p-4 bg-muted/20">
        {loading && tickets.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm font-medium">Connecting to station queue…</p>
            </div>
          </div>
        ) : tickets.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="flex max-w-sm flex-col items-center text-center p-6 rounded-2xl border bg-card/60 shadow-xs">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3 text-muted-foreground">
                <Inbox className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-base">{t("noTickets")}</h3>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3.5 items-start">
            {tickets.map((ticket, idx) => (
              <KdsTicketCard
                key={ticket._id || idx}
                ticket={ticket}
                index={idx}
                isSelected={idx === selectedIndex}
                onUpdateStatus={handleUpdateStatus}
                onToggleItem={handleToggleItem}
                onRecall={statusTab === "completed" ? handleRecall : undefined}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
