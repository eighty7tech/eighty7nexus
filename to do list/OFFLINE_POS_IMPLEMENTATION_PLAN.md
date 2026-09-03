# Offline POS System & Advanced Features Implementation Plan

> **Target Platform:** Eighty7Nexus Omnichannel E-Commerce & Retail Management Engine
> **Status:** Implementation Blueprint

This document outlines the architectural roadmap and step-by-step implementation for integrating a **Progressive Web App (PWA) Offline-First Point of Sale (POS)** into the existing Eighty7Nexus Next.js 16 architecture. 

The goal is to build a POS that can continue ringing up sales, applying taxes, printing receipts, and opening the cash drawer even during complete internet outages, automatically syncing with MongoDB when the connection is restored.

---

## 1. System Architecture & Offline Sync Engine

### 1.1 Technologies & Libraries
- **PWA Service Worker:** `@serwist/next` (Modern replacement for `next-pwa` supporting Next.js 16/Turbopack).
- **Offline Local Database:** `dexie` & `dexie-react-hooks` (Wrapper for IndexedDB) to store products, barcodes, configurations, and the offline transaction queue.
- **Hardware Integration:** WebUSB, Web Bluetooth, and Web Serial APIs for raw thermal receipt printing and barcode scanning.
- **State Management:** Zustand (with persisted store) for POS cart and terminal state.

### 1.2 Data Synchronization Flow
1. **Initial Boot (Online):** 
   - POS terminal authenticates via PIN.
   - Triggers a bulk download of the catalog, price lists, tax rules, and employee permissions.
   - Caches data in IndexedDB (`pos_catalog`, `pos_taxes`, `pos_users`).
2. **Transaction Processing (Offline/Online):**
   - Items scanned are queried against IndexedDB, ensuring zero latency.
   - On checkout, the transaction is written to the `pending_transactions` table in IndexedDB.
   - An Idempotency Key (e.g., `pos-tx-<uuid>`) is attached.
3. **Background Sync (Restored Connection):**
   - Service worker detects `online` event.
   - A background queue runner processes `pending_transactions` and POSTs them to `/api/pos/sync-batch`.
   - On success, the transactions are removed from the local IndexedDB queue and marked as `synced` in the historical table.

---

## 2. Phased Implementation Steps

### Phase 1: Foundation & PWA Configuration
- [x] Install `@serwist/next` and configure `next.config.js` to enable service worker generation.
- [x] Create `app/manifest.json` tailored for the POS (standalone display, full screen, theme colors).
- [x] Build a dedicated Next.js Route Group `app/(pos)` with a `layout.tsx` that bypasses the standard storefront navigation and enforces a locked-down, full-screen kiosk UI.
- [x] Implement network status detector hook (`useNetworkStatus`) to display a global "Online/Offline" indicator on the POS header.

### Phase 2: IndexedDB Local Database Setup (Dexie.js / Native IndexedDB)
- [x] Define the `POSDatabase` schema extending IndexedDB:
  - `products`: Product ID, SKU, Barcode, Name, Price, Stock.
  - `pending_transactions`: Cart data, tender methods, timestamp, idempotency key.
  - `shift_events`: Cash float, paid-in/paid-out drops, shift open/close timestamps.
  - `settings`: Terminal config, receipt headers, default tax rate.
- [x] Create the Admin API endpoint `/api/pos/catalog-sync` that streams the entire MongoDB catalog to the POS in compressed chunks upon terminal initialization.

### Phase 3: The Core POS Interface
- [x] Implement the **POS Shell**: Left pane for Cart & Totals, Right pane for Product Grid & Search.
- [x] Implement **Fast Product Search**: Use IndexedDB text indexing to search by SKU, Barcode, or Name locally in `< 50ms`.
- [x] Build the **Numpad & Quick Tender Sheet**: Modals for inputting custom amounts, split payments (Cash + Card), and exact change calculation.
- [x] Build the **Staff PIN Switcher**: Local validation against the `pos_users` IndexedDB table to allow cashiers to switch sessions while offline.

### Phase 4: Advanced Hardware Integration (Web APIs)
- [x] **WebUSB ESC/POS Printer Driver**: Build a local driver (`lib/pos/printer.ts`) that converts receipt data into binary ESC/POS commands (Hex) and sends them directly to a connected USB thermal printer.
- [x] **Cash Drawer Solenoid**: Inject the standard `ESC p 0 25 250` hex code into the print stream when a cash transaction is finalized to kick the drawer open.
- [x] **Barcode Scanner**: Global keydown event listener that captures rapid HID keyboard inputs (scanners usually terminate with an `Enter` key) to instantly add items to the cart.

### Phase 5: Transaction Batching & Backend Resolution
- [x] Build the MongoDB schema `models/pos-transaction.model.ts` inside Eighty7Nexus.
- [x] Create the `/api/pos/sync-batch` endpoint:
  - Accepts an array of transactions.
  - Uses `idempotencyKey` to prevent duplicate insertions if a network drop causes a double-sync.
  - Decrements live MongoDB inventory.
  - Generates unified Mongoose `Order` records tagged with `source: 'pos'`.
- [x] Implement the reconciliation UI in the Admin Dashboard (`/admin/pos/transactions`) to view synced offline orders.

### Phase 6: Shift Management & End of Day (Z-Reports)
- [x] Create UI for **Opening Shift**: Input starting cash amount.
- [x] Create UI for **Closing Shift**: Blind cash count (user enters physical cash before seeing expected totals).
- [x] Generate **Z-Report**: Calculate expected cash (Float + Cash Sales - Refunds - Cash Drops) vs Actual Cash.
- [x] Save shift data locally in IndexedDB if offline, and queue it for syncing along with the transactions.

---

## 3. Advanced Feature Additions

- [x] **Split Tenders:** Allow a single transaction to be paid partially in cash and partially by card.
- [x] **Customer Association (CRM):** Download a lightweight version of the customer database to attach loyalty accounts to offline sales.
- [x] **Suspend/Resume Sale:** Allow a cashier to "Park" a cart locally in IndexedDB if a customer forgets their wallet, serving the next customer and resuming later.
- [x] **Custom Line-Item Discounts:** Allow manual % or flat overrides on specific items (requires manager PIN override locally).

---

## 4. Status: All Phases Implemented & Verified

All core and advanced offline POS capabilities are fully integrated into the Eighty7Nexus application. The system operates in offline-first mode, queues mutations locally with zero network latency, and replays operations with audit trails upon reconnection.
