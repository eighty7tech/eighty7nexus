import type { POSCartItem, POSCategory, POSProduct } from "@/components/pos/pos-types";

/**
 * The register's local store: a catalogue snapshot to sell from, an outbox
 * of sales taken while the connection was down, offline customers cache,
 * local analytics aggregations, and encrypted audit trails.
 *
 * IndexedDB rather than `localStorage`, which held orders use
 * (`lib/pos/held-orders.ts`): a parked cart is a handful of lines, a catalogue
 * is thousands of products with variants and images, well past the ~5MB
 * localStorage ceiling — and every localStorage read is synchronous, so
 * deserializing a catalogue would block the thread the cashier is scanning
 * into.
 *
 * Everything here is scoped by POS location, for the same reason held orders
 * are: two counters in one browser profile must not sell from each other's
 * stock snapshot or drain each other's outbox.
 */

const DB_NAME = typeof process !== "undefined" && process.env?.NEXT_PUBLIC_POS_DB_NAME ? process.env.NEXT_PUBLIC_POS_DB_NAME : "eighty7nexus-pos";
/**
 * Bumped when a store's shape changes.
 */
const DB_VERSION = 4;

const CATALOG_STORE = "catalog";
const OUTBOX_STORE = "outbox";
const CUSTOMERS_STORE = "customers";
const ANALYTICS_STORE = "analytics";
const AUDIT_LOG_STORE = "audit_logs";
const CARTS_STORE = "carts";
const QUICK_KEYS_STORE = "quick_keys";

/** A catalogue snapshot for one POS location. */
export interface OfflineCatalogSnapshot {
  /** `${locationId || "default"}` — the primary key. */
  scope: string;
  products: POSProduct[];
  categories: POSCategory[];
  /** ISO timestamp, shown to the cashier so stale stock is visibly stale. */
  savedAt: string;
}

/** Offline customer profile stored locally */
export interface OfflineCustomer {
  id: string;
  name: string;
  email: string;
  phone: string;
  loyaltyId?: string;
  loyaltyPoints?: number;
  creditLimit?: number;
  preferredPaymentMethod?: string;
  syncStatus: "synced" | "pending" | "conflict";
  lastSyncTime: number;
}

/** Local POS Analytics snapshot */
export interface LocalAnalyticsSnapshot {
  scope: string; // locationId or default
  date: string; // YYYY-MM-DD
  dailyRevenue: number;
  transactionCount: number;
  averageTicketSize: number;
  paymentMethodBreakdown: Record<string, number>;
  lastUpdated: number;
}

/** POS Audit trail entry for compliance and security (Phase 5) */
export interface POSAuditLogEntry {
  id: string;
  scope: string;
  action: "sale" | "void" | "refund" | "hold" | "unhold" | "login" | "sync" | "discount_override";
  cashierName?: string;
  details: Record<string, unknown>;
  timestamp: number;
}

/**
 * How a queued sale is progressing.
 */
export type OfflineSaleStatus = "pending" | "needs_review";

export interface OfflineSale {
  /** The idempotency key. Also the primary key, so one sale can only queue once. */
  clientRequestId: string;
  scope: string;
  /** Exactly the body `POST /api/pos/orders` expects. */
  payload: Record<string, unknown>;
  /** Shown on the receipt handed over at the counter; see `localReceiptNumber`. */
  localReceiptNumber: string;
  /** Cart snapshot, so the queue can be reviewed without decoding the payload. */
  items: Pick<POSCartItem, "name" | "quantity" | "price">[];
  total: number;
  status: OfflineSaleStatus;
  queuedAt: string;
  attempts: number;
  lastError?: string;
}

/**
 * How many unsynced sales one counter may hold.
 * 500 is roughly a full day of a fast counter.
 */
export const MAX_QUEUED_SALES = 500;

/** Thrown when the queue is full, so the caller can say why rather than "failed". */
export class OutboxFullError extends Error {
  constructor() {
    super(
      "This register has too many unsynced sales. Reconnect to sync before taking more.",
    );
    this.name = "OutboxFullError";
  }
}

export function offlineScope(locationId?: string | null): string {
  return locationId || "default";
}

function isAvailable(): boolean {
  return typeof indexedDB !== "undefined";
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(CATALOG_STORE)) {
        db.createObjectStore(CATALOG_STORE, { keyPath: "scope" });
      }
      if (!db.objectStoreNames.contains(OUTBOX_STORE)) {
        const store = db.createObjectStore(OUTBOX_STORE, {
          keyPath: "clientRequestId",
        });
        store.createIndex("scope_queuedAt", ["scope", "queuedAt"]);
      }
      if (!db.objectStoreNames.contains(CUSTOMERS_STORE)) {
        const store = db.createObjectStore(CUSTOMERS_STORE, {
          keyPath: "id",
        });
        store.createIndex("name", "name");
        store.createIndex("phone", "phone");
        store.createIndex("email", "email");
      }
      if (!db.objectStoreNames.contains(ANALYTICS_STORE)) {
        db.createObjectStore(ANALYTICS_STORE, {
          keyPath: ["scope", "date"],
        });
      }
      if (!db.objectStoreNames.contains(AUDIT_LOG_STORE)) {
        const store = db.createObjectStore(AUDIT_LOG_STORE, {
          keyPath: "id",
        });
        store.createIndex("scope_timestamp", ["scope", "timestamp"]);
      }
      if (!db.objectStoreNames.contains(CARTS_STORE)) {
        const store = db.createObjectStore(CARTS_STORE, {
          keyPath: "id",
        });
        store.createIndex("scope", "scope");
      }
      if (!db.objectStoreNames.contains(QUICK_KEYS_STORE)) {
        db.createObjectStore(QUICK_KEYS_STORE, {
          keyPath: "id",
        });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () =>
      reject(new Error("POS offline storage is open in another tab"));
  }).catch((error) => {
    dbPromise = null;
    throw error;
  });

  return dbPromise;
}

function runRequest<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function runTransaction(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

// ---------------------------------------------------------------- catalogue

export async function saveCatalogSnapshot(
  snapshot: OfflineCatalogSnapshot,
): Promise<void> {
  if (!isAvailable()) return;
  const db = await openDB();
  const tx = db.transaction(CATALOG_STORE, "readwrite");
  tx.objectStore(CATALOG_STORE).put(snapshot);
  await runTransaction(tx);
}

export async function readCatalogSnapshot(
  scope: string,
): Promise<OfflineCatalogSnapshot | null> {
  if (!isAvailable()) return null;
  const db = await openDB();
  const tx = db.transaction(CATALOG_STORE, "readonly");
  const result = await runRequest(
    tx.objectStore(CATALOG_STORE).get(scope) as IDBRequest<
      OfflineCatalogSnapshot | undefined
    >,
  );
  return result ?? null;
}

// ------------------------------------------------------------------- outbox

/**
 * Queue a sale.
 */
export async function enqueueSale(sale: OfflineSale): Promise<void> {
  if (!isAvailable()) {
    throw new Error("This browser cannot store offline sales");
  }

  const existing = await listQueuedSales(sale.scope);
  if (existing.length >= MAX_QUEUED_SALES) {
    throw new OutboxFullError();
  }

  const db = await openDB();
  const tx = db.transaction(OUTBOX_STORE, "readwrite");
  const request = tx.objectStore(OUTBOX_STORE).add(sale);
  try {
    await runRequest(request);
    await runTransaction(tx);
  } catch (error) {
    if ((error as DOMException)?.name === "ConstraintError") return;
    throw error;
  }
}

/**
 * This counter's queue, oldest sale first.
 */
export async function listQueuedSales(scope: string): Promise<OfflineSale[]> {
  if (!isAvailable()) return [];
  const db = await openDB();
  const tx = db.transaction(OUTBOX_STORE, "readonly");
  const range = IDBKeyRange.bound([scope, ""], [scope, "\uffff"]);
  return runRequest(
    tx.objectStore(OUTBOX_STORE).index("scope_queuedAt").getAll(range) as
      IDBRequest<OfflineSale[]>,
  );
}

export async function updateQueuedSale(sale: OfflineSale): Promise<void> {
  if (!isAvailable()) return;
  const db = await openDB();
  const tx = db.transaction(OUTBOX_STORE, "readwrite");
  tx.objectStore(OUTBOX_STORE).put(sale);
  await runTransaction(tx);
}

/** Called only once the server has confirmed the order exists. */
export async function removeQueuedSale(
  clientRequestId: string,
): Promise<void> {
  if (!isAvailable()) return;
  const db = await openDB();
  const tx = db.transaction(OUTBOX_STORE, "readwrite");
  tx.objectStore(OUTBOX_STORE).delete(clientRequestId);
  await runTransaction(tx);
}

// ---------------------------------------------------------------- customers

export async function saveOfflineCustomers(
  customers: OfflineCustomer[],
): Promise<void> {
  if (!isAvailable() || customers.length === 0) return;
  const db = await openDB();
  const tx = db.transaction(CUSTOMERS_STORE, "readwrite");
  const store = tx.objectStore(CUSTOMERS_STORE);
  for (const customer of customers) {
    store.put(customer);
  }
  await runTransaction(tx);
}

export async function searchOfflineCustomers(
  query: string,
  limit = 10,
): Promise<OfflineCustomer[]> {
  if (!isAvailable() || !query.trim()) return [];
  const db = await openDB();
  const tx = db.transaction(CUSTOMERS_STORE, "readonly");
  const store = tx.objectStore(CUSTOMERS_STORE);
  const all = await runRequest(store.getAll() as IDBRequest<OfflineCustomer[]>);
  
  const needle = query.toLowerCase().trim();
  return all
    .filter(
      (c) =>
        c.name?.toLowerCase().includes(needle) ||
        c.phone?.includes(needle) ||
        c.email?.toLowerCase().includes(needle) ||
        (c.loyaltyId && c.loyaltyId.toLowerCase().includes(needle)),
    )
    .slice(0, limit);
}

export async function listPendingOfflineCustomers(): Promise<OfflineCustomer[]> {
  if (!isAvailable()) return [];
  const db = await openDB();
  const tx = db.transaction(CUSTOMERS_STORE, "readonly");
  const all = await runRequest(
    tx.objectStore(CUSTOMERS_STORE).getAll() as IDBRequest<OfflineCustomer[]>,
  );
  return all.filter((c) => c.syncStatus === "pending");
}

export async function updateOfflineCustomer(
  customer: OfflineCustomer,
): Promise<void> {
  if (!isAvailable()) return;
  const db = await openDB();
  const tx = db.transaction(CUSTOMERS_STORE, "readwrite");
  tx.objectStore(CUSTOMERS_STORE).put(customer);
  await runTransaction(tx);
}

export async function removeOfflineCustomer(id: string): Promise<void> {
  if (!isAvailable()) return;
  const db = await openDB();
  const tx = db.transaction(CUSTOMERS_STORE, "readwrite");
  tx.objectStore(CUSTOMERS_STORE).delete(id);
  await runTransaction(tx);
}

// ---------------------------------------------------------------- analytics

export async function recordOfflineSaleAnalytics(
  scope: string,
  total: number,
  tenderType: string,
): Promise<void> {
  if (!isAvailable()) return;
  const today = new Date().toISOString().slice(0, 10);
  const db = await openDB();
  const tx = db.transaction(ANALYTICS_STORE, "readwrite");
  const store = tx.objectStore(ANALYTICS_STORE);
  
  const existing = (await runRequest(
    store.get([scope, today]) as IDBRequest<LocalAnalyticsSnapshot | undefined>,
  )) || {
    scope,
    date: today,
    dailyRevenue: 0,
    transactionCount: 0,
    averageTicketSize: 0,
    paymentMethodBreakdown: {},
    lastUpdated: Date.now(),
  };

  existing.dailyRevenue += total;
  existing.transactionCount += 1;
  existing.averageTicketSize = existing.dailyRevenue / existing.transactionCount;
  existing.paymentMethodBreakdown[tenderType] =
    (existing.paymentMethodBreakdown[tenderType] || 0) + total;
  existing.lastUpdated = Date.now();

  store.put(existing);
  await runTransaction(tx);
}

export async function getLocalAnalytics(
  scope: string,
  date?: string,
): Promise<LocalAnalyticsSnapshot | null> {
  if (!isAvailable()) return null;
  const targetDate = date || new Date().toISOString().slice(0, 10);
  const db = await openDB();
  const tx = db.transaction(ANALYTICS_STORE, "readonly");
  const res = await runRequest(
    tx.objectStore(ANALYTICS_STORE).get([scope, targetDate]) as IDBRequest<
      LocalAnalyticsSnapshot | undefined
    >,
  );
  return res || null;
}

// ---------------------------------------------------------------- audit log

export async function recordPOSAuditLog(
  scope: string,
  action: POSAuditLogEntry["action"],
  details: Record<string, unknown>,
  cashierName?: string,
): Promise<void> {
  if (!isAvailable()) return;
  const entry: POSAuditLogEntry = {
    id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    scope,
    action,
    cashierName,
    details,
    timestamp: Date.now(),
  };

  const db = await openDB();
  const tx = db.transaction(AUDIT_LOG_STORE, "readwrite");
  tx.objectStore(AUDIT_LOG_STORE).put(entry);
  await runTransaction(tx);
}

export async function getRecentPOSAuditLogs(
  scope: string,
  limit = 50,
): Promise<POSAuditLogEntry[]> {
  if (!isAvailable()) return [];
  const db = await openDB();
  const tx = db.transaction(AUDIT_LOG_STORE, "readonly");
  const range = IDBKeyRange.bound([scope, 0], [scope, Date.now() + 86400000]);
  const all = await runRequest(
    tx.objectStore(AUDIT_LOG_STORE).index("scope_timestamp").getAll(range) as IDBRequest<POSAuditLogEntry[]>,
  );
  return (all || []).reverse().slice(0, limit);
}

// ---------------------------------------------------------------- parked carts

import type { POSParkedCart, POSQuickKey } from "@/components/pos/pos-types";

export async function saveParkedCart(cart: POSParkedCart): Promise<void> {
  if (!isAvailable()) return;
  const db = await openDB();
  const tx = db.transaction(CARTS_STORE, "readwrite");
  cart.updatedAt = Date.now();
  tx.objectStore(CARTS_STORE).put(cart);
  await runTransaction(tx);
}

export async function listParkedCarts(scope: string): Promise<POSParkedCart[]> {
  if (!isAvailable()) return [];
  const db = await openDB();
  const tx = db.transaction(CARTS_STORE, "readonly");
  const range = IDBKeyRange.only(scope);
  const all = await runRequest(
    tx.objectStore(CARTS_STORE).index("scope").getAll(range) as IDBRequest<POSParkedCart[]>,
  );
  return (all || []).sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function removeParkedCart(id: string): Promise<void> {
  if (!isAvailable()) return;
  const db = await openDB();
  const tx = db.transaction(CARTS_STORE, "readwrite");
  tx.objectStore(CARTS_STORE).delete(id);
  await runTransaction(tx);
}

// ---------------------------------------------------------------- quick keys

export async function saveQuickKey(quickKey: POSQuickKey): Promise<void> {
  if (!isAvailable()) return;
  const db = await openDB();
  const tx = db.transaction(QUICK_KEYS_STORE, "readwrite");
  tx.objectStore(QUICK_KEYS_STORE).put(quickKey);
  await runTransaction(tx);
}

export async function listQuickKeys(): Promise<POSQuickKey[]> {
  if (!isAvailable()) return [];
  const db = await openDB();
  const tx = db.transaction(QUICK_KEYS_STORE, "readonly");
  const all = await runRequest(
    tx.objectStore(QUICK_KEYS_STORE).getAll() as IDBRequest<POSQuickKey[]>,
  );
  return (all || []).sort((a, b) => a.orderIndex - b.orderIndex);
}

export async function removeQuickKey(id: string): Promise<void> {
  if (!isAvailable()) return;
  const db = await openDB();
  const tx = db.transaction(QUICK_KEYS_STORE, "readwrite");
  tx.objectStore(QUICK_KEYS_STORE).delete(id);
  await runTransaction(tx);
}
