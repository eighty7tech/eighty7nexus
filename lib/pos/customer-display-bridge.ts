/**
 * Customer-Facing Display (CFD) Real-Time Synchronization Bridge
 * Provides zero-latency state synchronization between the POS Cashier Terminal
 * and the Customer-Facing Display using BroadcastChannel API with localStorage fallback.
 */

export type CfdState = "IDLE" | "ACTIVE_TRANSACTION" | "PAYMENT_PENDING" | "ORDER_COMPLETED";

export interface CfdCartItem {
  id: string;
  name: string;
  sku?: string;
  barcode?: string;
  price: number;
  originalPrice?: number;
  quantity: number;
  discountAmount?: number;
  total: number;
  imageUrl?: string;
  selectedVariants?: Record<string, string>;
}

export interface CfdCustomerInfo {
  name: string;
  email?: string;
  phone?: string;
  loyaltyPoints?: number;
  loyaltyTier?: string;
  pointsEarnedThisOrder?: number;
}

export interface CfdPayload {
  terminalId?: string;
  storeName?: string;
  currency: string;
  state: CfdState;
  items: CfdCartItem[];
  subtotal: number;
  taxTotal: number;
  discountTotal: number;
  tipAmount: number;
  grandTotal: number;
  amountTendered?: number;
  changeDue?: number;
  customer?: CfdCustomerInfo;
  receiptUrl?: string;
  orderNumber?: string;
  customMessage?: string;
  timestamp: number;
}

const CFD_CHANNEL_NAME = "eighty7_pos_cfd_channel";
const CFD_STORAGE_KEY = "eighty7_pos_cfd_payload";

let broadcastChannel: BroadcastChannel | null = null;

function getBroadcastChannel(): BroadcastChannel | null {
  if (typeof window === "undefined") return null;
  if (!broadcastChannel && typeof BroadcastChannel !== "undefined") {
    try {
      broadcastChannel = new BroadcastChannel(CFD_CHANNEL_NAME);
    } catch {
      broadcastChannel = null;
    }
  }
  return broadcastChannel;
}

/**
 * Broadcasts the current POS transaction state to all connected customer-facing displays.
 */
export function broadcastCfdState(payload: CfdPayload): void {
  if (typeof window === "undefined") return;

  const enrichedPayload: CfdPayload = {
    ...payload,
    timestamp: Date.now(),
  };

  // 1. Primary: BroadcastChannel API (Instant across tabs/monitors)
  const channel = getBroadcastChannel();
  if (channel) {
    try {
      channel.postMessage(enrichedPayload);
    } catch {
      // BroadcastChannel failed, fallback to storage
    }
  }

  // 2. Secondary fallback: LocalStorage event for cross-window sync
  try {
    localStorage.setItem(CFD_STORAGE_KEY, JSON.stringify(enrichedPayload));
  } catch {
    // Storage quota or disabled, ignore
  }
}

/**
 * Subscribes to CFD state broadcasts. Returns an unsubscribe function.
 */
export function subscribeToCfd(callback: (payload: CfdPayload) => void): () => void {
  if (typeof window === "undefined") return () => {};

  const handleMessage = (event: MessageEvent<CfdPayload>) => {
    if (event.data && typeof event.data === "object") {
      callback(event.data);
    }
  };

  const handleStorage = (event: StorageEvent) => {
    if (event.key === CFD_STORAGE_KEY && event.newValue) {
      try {
        const parsed = JSON.parse(event.newValue) as CfdPayload;
        callback(parsed);
      } catch {
        // Ignore parse error
      }
    }
  };

  const channel = getBroadcastChannel();
  if (channel) {
    channel.addEventListener("message", handleMessage);
  }

  window.addEventListener("storage", handleStorage);

  // Read initial stored state if available
  try {
    const initial = localStorage.getItem(CFD_STORAGE_KEY);
    if (initial) {
      callback(JSON.parse(initial) as CfdPayload);
    }
  } catch {
    // Ignore
  }

  return () => {
    if (channel) {
      channel.removeEventListener("message", handleMessage);
    }
    window.removeEventListener("storage", handleStorage);
  };
}

const CFD_TIP_STORAGE_KEY = "eighty7_pos_cfd_tip_event";

export interface CfdTipEvent {
  type: "CUSTOMER_TIP_SELECTED";
  tipAmount: number;
  terminalId?: string;
  timestamp: number;
}

/**
 * Sends a tip selection from the customer display back to the POS register.
 */
export function sendCustomerTipToPos(tipAmount: number, terminalId?: string): void {
  if (typeof window === "undefined") return;
  const channel = getBroadcastChannel();
  const event: CfdTipEvent = {
    type: "CUSTOMER_TIP_SELECTED",
    tipAmount,
    terminalId,
    timestamp: Date.now(),
  };

  if (channel) {
    channel.postMessage(event);
  }

  try {
    localStorage.setItem(CFD_TIP_STORAGE_KEY, JSON.stringify(event));
  } catch {
    // Ignore
  }
}

/**
 * Subscribes the POS register to tip selections chosen by the customer on the CFD.
 */
export function subscribeToCustomerTips(
  callback: (tipAmount: number, terminalId?: string) => void,
): () => void {
  if (typeof window === "undefined") return () => {};

  const handleMessage = (event: MessageEvent<any>) => {
    if (
      event.data &&
      event.data.type === "CUSTOMER_TIP_SELECTED" &&
      typeof event.data.tipAmount === "number"
    ) {
      callback(event.data.tipAmount, event.data.terminalId);
    }
  };

  const handleStorage = (event: StorageEvent) => {
    if (event.key === CFD_TIP_STORAGE_KEY && event.newValue) {
      try {
        const parsed = JSON.parse(event.newValue) as CfdTipEvent;
        if (parsed && parsed.type === "CUSTOMER_TIP_SELECTED" && typeof parsed.tipAmount === "number") {
          callback(parsed.tipAmount, parsed.terminalId);
        }
      } catch {
        // Ignore
      }
    }
  };

  const channel = getBroadcastChannel();
  if (channel) {
    channel.addEventListener("message", handleMessage);
  }

  window.addEventListener("storage", handleStorage);

  return () => {
    if (channel) {
      channel.removeEventListener("message", handleMessage);
    }
    window.removeEventListener("storage", handleStorage);
  };
}

