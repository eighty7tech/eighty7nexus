# Advanced POS System Architecture & Implementation Specification

> **Target Platform:** Eighty7Nexus Omnichannel E-Commerce & Retail Management Engine  
> **Document Version:** 3.0 (Enterprise Multi-Store, Spatial Inventory & Theme Matrix)  
> **Status:** Approved Engineering Master Blueprint  

---

## 1. Executive Summary & Vision

The **Eighty7Nexus Advanced POS (Point of Sale)** is an enterprise-grade, offline-resilient, multi-terminal, multi-store retail engine. It unifies physical retail branches with the digital storefront, delivering zero-latency checkout, spatial warehouse/storefront location intelligence (Aisle, Rack, Row, Shelf, Bin), integrated payment hardware, real-time multi-branch stock federation, till shift reconciliation, omnichannel fulfillment (BOPIS / returns), and **4 production-ready high-aesthetic POS UI Themes**.

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                     Eighty7Nexus POS ECOSYSTEM (v3.0)                                  │
├───────────────────────────────┬──────────────────────────────────┬─────────────────────────────────────┤
│     HARDWARE & PERIPHERALS    │       TERMINAL CORE ENGINE       │       SPATIAL & MULTI-STORE         │
│  • Raw ESC/POS Thermal Driver │  • Fast Staff PIN Switch (<1s)   │  • Multi-Store & Branch Switching   │
│  • RJ11 Cash Drawer Solenoid  │  • Multi-Tender & Split Payment  │  • Aisle / Rack / Row / Shelf / Bin │
│  • USB/BT Weight Scales (kg)  │  • Till Shifts (Floats & Drops)  │  • Cross-Branch Stock Lookup        │
│  • Secondary Customer Display │  • Offline IndexedDB + Auto-Sync │  • Inter-Branch Transfer Requests   │
│  • High-Speed Barcode / 2D    │  • 4 Production-Ready UI Themes  │  • Real-Time X & Z Shift Analytics  │
└───────────────────────────────┴──────────────────────────────────┴─────────────────────────────────────┘
```

---

## 2. Technology Stack & Design System Compliance

All components, layouts, modals, and drivers in the Advanced POS strictly adhere to the Eighty7Nexus tech stack and design architecture:

| Component / Layer | Technology & Pattern | Implementation Standard |
| :--- | :--- | :--- |
| **Styling & Design Tokens** | **Tailwind CSS v4 + Semantic CSS Variables** | Driven by `--primary`, `--secondary`, `--accent`, `--background`, `--foreground`, `--card`, `--border`, `--muted` generated via `lib/appearance-colors.ts` and `app/globals.css`. |
| **Component Primitives** | **Radix UI (shadcn/ui architecture)** | Headless, accessible primitives: `@radix-ui/react-dialog`, `@radix-ui/react-popover`, `@radix-ui/react-tabs`, `@radix-ui/react-select`, `@radix-ui/react-switch`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-progress`, `Card`, `Badge`, `Button`, `Input`, `Label`. |
| **Motion & Micro-interactions** | **Framer Motion (`framer-motion`)** | Smooth 60fps hardware-accelerated drawer transitions, tender sheet slide-overs, numpad key press feedback, and PIN pad lock screen reveals. |
| **Iconography & Dynamic Media** | **Lucide Icons (`lucide-react`)** | Standard vector icons and dynamic code-split loader (`DynamicIcon`) for category, payment, and status icons. |
| **Toast & Alerts** | **Sonner (`sonner`)** | High-performance toast notifications for sale confirmations, scan feedback, hardware connection alerts, and background sync signals. |
| **State & Local Persistence** | **Zustand + IndexedDB (`Dexie.js` / Native IDB)** | Reactive client state store with offline database caching for products, barcodes, spatial bin locations, and pending mutation queues. |
| **Internationalization & Currency** | **`next-intl` & Dynamic Currency Store** | Real-time multi-currency formatting (`formatPrice`, `useCurrency`), locale-aware receipt typography, and multilingual translations. |
| **Database & API Layer** | **MongoDB + Mongoose Singleton** | Structured subdocument schemas, indexed barcode queries, optimistic concurrency, and idempotent transaction deduplication. |

---

## 3. Core Pillars of the Advanced POS Engine

### Pillar 1: Till, Shift & Cash Drawer Management (Floats, Drops, X/Z Reports)
- **Shift Lifecycle:**
  - **Opening Shift**: Cashier inputs starting cash float with bill/coin denomination breakdown ($100, $50, $20, $10, $5, $1, coins).
  - **Mid-Shift Cash Movements**: Support for `Paid In` (adding change/petty cash) and `Paid Out` (safe drops, courier payments, store expenses) with mandatory reason codes.
  - **Blind Cash Count on Close**: Cashier enters physical cash counted without previewing expected totals to prevent shrinkage.
  - **Discrepancy Calculation**: System records `Expected Cash vs Actual Cash` variance.
- **Reporting:**
  - **X-Report (Mid-Shift Read)**: Non-resetting snapshot of sales, payment breakdown, refunds, discounts, and current cash balance.
  - **Z-Report (End-of-Day Close)**: Official shift closure report that finalizes the register session, increments the Z-counter, resets shift metrics, and automatically triggers an ESC/POS summary print.
- **Cash Drawer Solenoid Control**:
  - Direct pulse output via ESC/POS command (`ESC p 0 25 250`) triggered on Cash sales or manual manager override with audit log.

---

### Pillar 2: Multi-Store Operations & Spatial Inventory (Aisle, Rack, Row, Shelf, Bin)
- **Multi-Branch Operations:**
  - Multi-location binding: Each terminal binds to a specific Branch, Register ID, and Geo-Location.
  - Instant cross-branch inventory matrix: Cashiers can view live stock across all other physical stores and central warehouses directly from the product search card.
  - Inter-Branch Transfer (IBT) Initiation: Cashier can initiate a store-to-store stock transfer request for customer fulfillment directly at checkout.
- **Granular Spatial Store/Warehouse Mapping:**
  - Every SKU/Variant can be mapped to precise physical coordinates:
    `Branch → Zone (e.g. Sales Floor, Backroom A) → Aisle (e.g. 04) → Rack (e.g. B) → Row (e.g. 02) → Shelf (e.g. 03) → Bin (e.g. 15)`
  - Instant Location Display: Scanning or selecting an item displays its exact shelf/bin coordinates on the POS item card for rapid retrieval.
  - Bin Capacity & Stock Level: Real-time tracking of bin quantity versus maximum capacity with low-bin restock alerts.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              SPATIAL INVENTORY HIERARCHY                               │
│                                                                                        │
│  [ STORE / BRANCH ]  ──▶  Accra Central MegaStore                                      │
│    └─ [ ZONE ]       ──▶  Zone B: Consumer Electronics                                 │
│        └─ [ AISLE ]  ──▶  Aisle 07 (Smartphones & Audio)                               │
│            └─ [ RACK ] ──▶  Rack C (High-Security Glass Showcase)                      │
│                └─ [ ROW ]   ──▶  Row 02                                                │
│                    └─ [ SHELF ] ──▶  Shelf 04                                          │
│                        └─ [ BIN ]   ──▶  Bin #18 [SKU: IP16P-256-TI | QTY: 14 / MAX: 20]│
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### Pillar 3: 4 Production-Ready POS UI Themes

The Advanced POS features **4 distinct, fully-realized UI themes** crafted for different retail environments and hardware setups:

```
┌───────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                          4 POS UI THEMES                                              │
├──────────────────────────┬──────────────────────────┬──────────────────────────┬──────────────────────┤
│    pos-aurora-glass      │      pos-cyber-grid      │    pos-retail-express    │  pos-boutique-luxury │
│  • Neo-Glassmorphic      │  • Futuristic OLED HUD   │  • Supermarket Touch     │  • Editorial Luxury  │
│  • Ambient Mesh Glows    │  • Cyan/Neon Highlights  │  • Oversized Touch Grid  │  • Clienteling CRM   │
│  • Translucent Panels    │  • Terminal Telemetry    │  • Rapid Barcode Stream  │  • Large Art Gallery │
│  • Glow Status Rings     │  • Dark Contrast Matrix  │  • Integrated Scale Bar  │  • Serif Typography  │
└──────────────────────────┴──────────────────────────┴──────────────────────────┴──────────────────────┘
```

1. **`pos-aurora-glass` (Neo-Glassmorphism Retail Experience)**:
   - Translucent frosted glass panels (`backdrop-blur-2xl bg-card/65`).
   - Ambient purple/indigo/cyan lighting meshes.
   - Glowing active tender rings and floating quick-stats pills.
2. **`pos-cyber-grid` (Futuristic OLED High-Contrast HUD)**:
   - Pure black `#06080d` background with electric cyan/neon borders.
   - Dense telemetry readouts, terminal-style SKU identifiers, and socket sync indicators.
   - Engineered for dark mode environments and high-intensity tech/gaming retail.
3. **`pos-retail-express` (High-Volume Supermarket Touch)**:
   - Space-maximized touch layout with oversized buttons and big numpads.
   - Prominent scale weight HUD with live price-per-kg calculation.
   - Quick-cash tender bar ($10, $20, $50, $100, Exact) and high-speed receipt dispatch.
4. **`pos-boutique-luxury` (Minimalist Editorial Elegance)**:
   - High-end fashion & luxury boutique layout with large product photography.
   - Side clienteling CRM drawer displaying customer VIP tier, LTV, and historical wardrobe preferences.
   - Warm champagne/stone accents and refined typography.

---

### Pillar 4: Split Tender, Partial Payments & Integrated Terminals
- **Multi-Tender Transactions:**
  - Split bills across unlimited tenders (e.g., $150 total = $50 Cash + $50 Card + $30 Store Credit + $20 Loyalty Points).
  - Live tender balance remaining calculator and zero-rounding cash change computation.
- **Layaway & Milestone Invoicing:**
  - Accept deposits/down-payments with installment milestone invoices and barcode tickets.
- **Integrated Smart Terminals:**
  - Direct integration with **Stripe Terminal (WisePOS E / WisePad 3)** and **Paystack POS Terminal** with push-to-screen charging.

---

### Pillar 5: Hardware Peripheral Driver Suite (Raw Web Drivers)
- **Raw ESC/POS Thermal Printing (80mm & 58mm):**
  - Raw binary stream generator supporting WebUSB, Web Bluetooth, and Network TCP raw socket printing.
  - SVG store logo rasterization, Code128 barcodes, QR codes, and paper cutter pulses (`GS V 66 0`).
- **Electronic Weight Scale Driver:**
  - Web Serial API and USB HID connection to checkout scales (Mettler Toledo, CAS, Dibal, Avery Berkel).
  - Real-time gross/tare/net weight reading with live price-per-kg calculation.
- **Secondary Customer Facing Display (CFD):**
  - Dual-screen display route (`/pos/customer-display`) via `BroadcastChannel` and Server-Sent Events (SSE).
  - Shows line items, savings badges, idle promo loops, and digital receipt QR codes.

---

### Pillar 6: Omnichannel Fulfillment, BOPIS & Barcode Returns
- **BOPIS (Buy Online, Pick Up In Store):**
  - Dedicated Store Pickups tab with digital signature pad and instant fulfillment status update.
- **Receipt Barcode Returns & Intelligent Exchanges:**
  - Scan receipt barcode to retrieve order items, applied discounts, and original payment channels.
  - Supports partial refunds, full returns, and unified 1-click product exchanges.

---

### Pillar 7: Fast Staff PIN Switching, Governance & Offline Sync
- **Fast 4-Digit PIN Switcher (<1s):**
  - Number pad overlay with configurable auto-lock timer (e.g. 60 seconds).
- **Supervisor Elevation Overrides:**
  - Manager PIN prompt for line item voids, discounts exceeding limits, manual drawer kicks, and no-receipt returns.
- **Offline-First IndexedDB Engine:**
  - Local database storing catalog, barcodes, tax rules, and customer profiles.
  - Encrypted `pending_transactions` queue with background idempotent batch sync.

---

## 3. Database Schemas & Data Models

### 3.1 Spatial Location & Inventory Model (`models/pos-location.model.ts`)
```typescript
export interface ISpatialBinLocation {
  _id: string;
  branchId: string;
  branchName: string;
  zone: string; // e.g. "Sales Floor", "Warehouse A"
  aisle: string; // e.g. "04"
  rack: string; // e.g. "B"
  row: string; // e.g. "02"
  shelf: string; // e.g. "03"
  bin: string; // e.g. "15"
  barcode: string; // Unique bin barcode e.g. "LOC-ACC-A04-RB-0215"
  capacity: number;
  currentQuantity: number;
  isFull: boolean;
  notes?: string;
}

export interface IProductLocationMapping {
  productId: string;
  variantId?: string;
  sku: string;
  branchLocations: Array<{
    branchId: string;
    branchName: string;
    stock: number;
    locations: Array<{
      locationId: string;
      label: string; // "Zone A • Aisle 04 • Rack B • Bin 15"
      quantity: number;
    }>;
  }>;
}
```

### 3.2 POS Shift & Till Schema (`models/pos-shift.model.ts`)
```typescript
export interface IPOSShift {
  _id: string;
  terminalId: string;
  terminalName: string;
  branchId: string;
  openedBy: { userId: string; name: string };
  closedBy?: { userId: string; name: string };
  openedAt: Date;
  closedAt?: Date;
  status: "open" | "closed";
  openingFloat: number;
  openingDenominations?: Record<string, number>;
  cashDrops: Array<{
    amount: number;
    type: "paid_in" | "paid_out";
    reason: string;
    performedBy: string;
    timestamp: Date;
  }>;
  summary: {
    grossSales: number;
    netSales: number;
    taxTotal: number;
    discountTotal: number;
    refundTotal: number;
    transactionCount: number;
    paymentsByMethod: Record<string, number>;
  };
  closingCashCount?: number;
  closingDenominations?: Record<string, number>;
  expectedCashInDrawer?: number;
  cashVariance?: number;
  notes?: string;
  zReportNumber: number;
}
```

### 3.3 POS Transaction & Split Tender Schema (`models/pos-transaction.model.ts`)
```typescript
export interface IPOSTransaction {
  _id: string;
  receiptNumber: string; // e.g. "POS-2026-000492"
  shiftId: string;
  terminalId: string;
  branchId: string;
  cashierId: string;
  customerId?: string;
  items: Array<{
    productId: string;
    variantId?: string;
    name: string;
    sku: string;
    barcode?: string;
    price: number;
    costPrice?: number;
    quantity: number;
    locationLabel?: string; // e.g. "Aisle 04 • Bin 15"
    discount?: { type: "percent" | "amount"; value: number; amount: number; reason?: string; approvedBy?: string };
    lineTotal: number;
    isWeighed?: boolean;
    weightUnit?: "kg" | "lb" | "g" | "oz";
  }>;
  subtotal: number;
  cartDiscount?: { type: "percent" | "amount"; value: number; amount: number; approvedBy?: string };
  taxTotal: number;
  grandTotal: number;
  payments: Array<{
    id: string;
    method: "cash" | "card" | "stripe_terminal" | "paystack_pos" | "gift_card" | "store_credit" | "loyalty_points" | "custom";
    amount: number;
    tenderedAmount?: number;
    changeReturned?: number;
    reference?: string;
    status: "completed" | "refunded" | "failed";
  }>;
  status: "completed" | "refunded" | "partially_refunded" | "voided";
  idempotencyKey: string;
  offlineCreated: boolean;
  syncedAt?: Date;
  createdAt: Date;
}
```

---

## 4. API Endpoints Architecture

```
/api/pos/
├── /shifts/
│   ├── POST /open               → Open new register shift with cash float
│   ├── POST /close              → Blind close shift, calculate variance & generate Z-Report
│   ├── GET  /current            → Active shift details and live totals
│   ├── POST /cash-drop          → Record paid-in or paid-out cash drop
│   └── GET  /x-report           → Generate real-time X-Report snapshot
│
├── /locations/
│   ├── GET  /spatial            → Fetch Aisle/Rack/Row/Shelf/Bin locations by Branch
│   ├── POST /spatial            → Create/Update bin location coordinates
│   ├── GET  /cross-branch-stock → Query real-time inventory matrix across all branches
│   └── POST /transfer-request   → Initiate Inter-Branch Transfer (IBT) from terminal
│
├── /transactions/
│   ├── POST /checkout           → Process multi-tender transaction (online or sync)
│   ├── POST /sync-batch         → Process bulk offline queued transactions
│   ├── GET  /receipt/[id]       → Generate raw ESC/POS binary or thermal HTML receipt
│   └── POST /refund             → Process partial/full return & receipt validation
│
├── /terminals/
│   ├── POST /stripe/token       → Generate Stripe Terminal connection token
│   └── POST /stripe/charge      → Push transaction amount to smart card reader
│
├── /peripherals/
│   ├── POST /customer-display/push   → Broadcast live cart state to customer monitor
│   └── GET  /customer-display/stream → Server-Sent Events (SSE) feed for CFD screen
│
└── /staff/
    ├── POST /pin-verify         → Instant 4-digit PIN authorization & cashier switch
    └── POST /manager-override   → Request temporary supervisor elevation
```

---

## 5. Phased Implementation Roadmap

### Phase 1: Till, Shift & Cash Drawer Management
- [x] Implement `models/pos-shift.model.ts` schema and repository queries.
- [x] Build Open Shift modal with cash float and denomination counter.
- [x] Implement Mid-Shift Cash Drop modal (`Paid In` / `Paid Out`).
- [x] Build Blind Close Shift workflow with automatic variance calculation.
- [x] Implement X-Report and Z-Report thermal print layout generation.

### Phase 2: Multi-Store & Spatial Inventory Management (Aisle/Rack/Row/Bin)
- [x] Create `models/pos-location.model.ts` schema for spatial bin locations.
- [x] Build Cross-Branch Stock Lookup matrix modal inside POS item card.
- [x] Implement Inter-Branch Transfer (IBT) request workflow at checkout.
- [x] Add spatial coordinates badge (Aisle, Rack, Bin) to POS search items.

### Phase 3: 4 Production-Ready POS UI Themes
- [x] Build `pos-aurora-glass.tsx` (Neo-Glassmorphic Retail Terminal).
- [x] Build `pos-cyber-grid.tsx` (Futuristic OLED High-Contrast HUD).
- [x] Build `pos-retail-express.tsx` (High-Volume Supermarket Touch).
- [x] Build `pos-boutique-luxury.tsx` (Minimalist Editorial Elegance).
- [x] Add POS Theme Switcher in POS Header and Admin Settings.

### Phase 4: Split Tender & Multi-Payment Processing
- [x] Upgrade `take-payment-dialog.tsx` to support multiple tender line additions.
- [x] Add real-time tender balance remaining calculation and smart cash change buttons.
- [x] Integrate Stripe Terminal SDK (Reader connection, display prompt, payment capture).
- [x] Integrate Paystack POS & Store Credit / Loyalty Points tender options.

### Phase 5: Hardware Peripheral Integration
- [x] Create raw ESC/POS WebUSB, Web Bluetooth, and network printer driver (`lib/pos/escpos-driver.ts`).
- [x] Implement RJ11 cash drawer trigger pulse on cash sale completion.
- [x] Build Electronic Weight Scale driver via Web Serial API (`lib/pos/weight-scale.ts`).
- [x] Create Customer Facing Display (CFD) secondary monitor route (`/pos/customer-display`).

### Phase 6: Omnichannel Sync, BOPIS & Barcode Returns
- [x] Build Store Pickup / BOPIS fulfillment tab in POS shell with digital signature.
- [x] Implement Receipt Barcode Scanner Return & Exchange engine.
- [x] Add partial refund and line item exchange capabilities.

### Phase 7: Fast Staff PIN Switching & Security Governance
- [x] Build Quick 4-Digit Staff PIN Switcher component with auto-lock timeout.
- [x] Implement Manager Override prompt for voids, manual discounts, and price adjustments.
- [x] Create immutable POS terminal activity audit log.

### Phase 8: Offline-First IndexedDB Engine & Sync
- [x] Build IndexedDB database schema with Dexie.js / native IDB.
- [x] Cache complete product catalog, categories, pricing, and spatial locations.
- [x] Implement background sync engine with idempotency keys and retry backoff.
- [x] Add offline transaction status indicator badge on header.

---

## 6. Testing & Quality Assurance Plan

1. **Spatial Inventory Tests**:
   - Bin capacity validation, aisle/rack routing verification, and cross-branch stock federation.
2. **Simulated Hardware Tests**:
   - Virtual ESC/POS emulator tests validating binary command output.
   - Virtual scale serial stream tests with tare and unit conversions.
3. **Stress & Offline Load Tests**:
   - 500 consecutive offline transactions queued in IndexedDB and bulk-synced on reconnect.
   - Idempotency verification to ensure zero duplicate database orders.
4. **Cash Discrepancy Scenarios**:
   - Float reconciliation edge cases: Overages, shortages, mid-shift emergency drops.
5. **Theme Performance**:
   - Smooth 60fps animations, zero input latency on rapid scanning across all 4 themes.

---

*This specification serves as the master engineering guide for scaling Eighty7Nexus POS to world-class enterprise retail standards.*
