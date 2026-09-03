import type {
  IKitchenTicket,
  KdsTicketStatus,
  KdsTicketStation,
} from "@/models/kitchen-ticket.model";

export const KDS_BROADCAST_CHANNEL = "eighty7_kds_channel";

export type KdsEvent =
  | { type: "TICKET_CREATED"; ticket: IKitchenTicket }
  | { type: "TICKET_UPDATED"; ticket: IKitchenTicket }
  | { type: "TICKET_BUMPED"; ticketId: string; status: KdsTicketStatus }
  | { type: "REFRESH_ALL" };

/**
 * Broadcasts a KDS event across open browser windows / tabs.
 */
export function broadcastKdsEvent(event: KdsEvent): void {
  if (typeof window === "undefined" || !("BroadcastChannel" in window)) return;
  try {
    const channel = new BroadcastChannel(KDS_BROADCAST_CHANNEL);
    channel.postMessage(event);
    channel.close();
  } catch (err) {
    console.error("Failed to broadcast KDS event:", err);
  }
}

/**
 * Subscribes to KDS events across open browser windows / tabs.
 */
export function subscribeToKds(onEvent: (event: KdsEvent) => void): () => void {
  if (typeof window === "undefined" || !("BroadcastChannel" in window)) {
    return () => {};
  }
  try {
    const channel = new BroadcastChannel(KDS_BROADCAST_CHANNEL);
    const handler = (e: MessageEvent<KdsEvent>) => {
      if (e.data && e.data.type) {
        onEvent(e.data);
      }
    };
    channel.addEventListener("message", handler);
    return () => {
      channel.removeEventListener("message", handler);
      channel.close();
    };
  } catch (err) {
    console.error("Failed to subscribe to KDS channel:", err);
    return () => {};
  }
}

/**
 * Plays an acoustic chime using Web Audio API without needing external MP3/WAV files.
 */
export function playKdsChime(type: "new_ticket" | "alert" | "bump" = "new_ticket"): void {
  if (typeof window === "undefined") return;
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    if (type === "new_ticket") {
      // Pleasant dual-tone chime (ding-dong: 587Hz D5 -> 880Hz A5)
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = "sine";
      osc1.frequency.setValueAtTime(587.33, now); // D5
      osc1.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5

      osc2.type = "triangle";
      osc2.frequency.setValueAtTime(880, now + 0.15);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.6);
      osc2.start(now + 0.15);
      osc2.stop(now + 0.6);
    } else if (type === "alert") {
      // High-priority urgent ping (overdue ticket)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(700, now);
      osc.frequency.setValueAtTime(900, now + 0.1);
      osc.frequency.setValueAtTime(700, now + 0.2);

      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    } else if (type === "bump") {
      // Soft tactile feedback pop on bump/complete
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.12);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.12);
    }
  } catch (err) {
    // Audio contexts can fail silently if user hasn't interacted with page yet
    console.warn("KDS audio playback suppressed:", err);
  }
}

/**
 * Calculates preparation urgency and SLA color metrics.
 */
export function getTicketUrgency(ticket: {
  createdAt?: string | Date;
  startedAt?: string | Date;
  slaMinutes: number;
}): {
  elapsedSeconds: number;
  progressPercent: number;
  urgency: "normal" | "warning" | "overdue";
  colorClass: string;
  badgeClass: string;
} {
  const start = ticket.createdAt ? new Date(ticket.createdAt).getTime() : Date.now();
  const elapsedSeconds = Math.max(0, Math.floor((Date.now() - start) / 1000));
  const slaSeconds = (ticket.slaMinutes || 15) * 60;
  const progressPercent = Math.min(200, Math.round((elapsedSeconds / slaSeconds) * 100));

  if (progressPercent < 65) {
    return {
      elapsedSeconds,
      progressPercent,
      urgency: "normal",
      colorClass: "border-emerald-500/40 dark:border-emerald-500/30",
      badgeClass: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    };
  }

  if (progressPercent <= 100) {
    return {
      elapsedSeconds,
      progressPercent,
      urgency: "warning",
      colorClass: "border-amber-500/50 dark:border-amber-500/40",
      badgeClass: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
    };
  }

  return {
    elapsedSeconds,
    progressPercent,
    urgency: "overdue",
    colorClass: "border-rose-500/70 dark:border-rose-500/60 ring-2 ring-rose-500/30",
    badgeClass: "bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/40 animate-pulse",
  };
}

/**
 * Formats seconds into MM:SS or HH:MM:SS.
 */
export function formatElapsedSeconds(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins >= 60) {
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    return `${hrs}h ${remMins.toString().padStart(2, "0")}m`;
  }
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}
