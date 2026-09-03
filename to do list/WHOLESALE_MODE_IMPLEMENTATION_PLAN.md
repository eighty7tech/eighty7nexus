# Enterprise Wholesale (B2B) Mode: Architecture & Production Implementation Blueprint

This specification defines the complete, production-ready **Wholesale / B2B Commerce Engine** for **Eighty7Nexus**. It covers data modeling, admin settings, dashboard management modules, pricing algorithms, tax/credit compliance, and storefront B2B user experiences.

---

## 1. Executive Summary & Architecture Modes

The Wholesale Engine transforms Eighty7Nexus into an enterprise-grade dual **B2C + B2B** omnichannel platform.

```
                               ┌──────────────────────────────────────────────┐
                               │            Eighty7Nexus Commerce             │
                               └──────────────────────┬───────────────────────┘
                                                      │
                       ┌──────────────────────────────┴──────────────────────────────┐
                       ▼                                                             ▼
         ┌───────────────────────────┐                                 ┌───────────────────────────┐
         │       Retail (B2C)        │                                 │      Wholesale (B2B)      │
         └─────────────┬─────────────┘                                 └─────────────┬─────────────┘
                       │                                                             │
        ┌──────────────┴──────────────┐                               ┌──────────────┴──────────────┐
        ▼                             ▼                               ▼                             ▼
  Standard MSRP               Promos & Flash Deals              Tiered Volume Pricing         Custom Price Lists
  Single Item Orders          Standard Checkout                 Case Packs & Master Cartons   Net 15/30/60 Terms
  Standard VAT/Tax            Public Pricing                    Tax Exemption / Reverse VAT   Quick Bulk Order Pad
```

### Operating Modes (Configurable in Admin Settings):
1. **Hybrid B2C / B2B Mode (Recommended)**: Retail customers browse standard pricing while logged-in verified Wholesale Buyers automatically see tiered volume pricing, wholesale badges, and B2B checkout options.
2. **Gated Wholesale-Only Mode**: Storefront catalog prices and checkout are restricted exclusively to approved B2B accounts. Public visitors see a landing page with a *"Apply for Wholesale Account"* CTA.
3. **Dual Price Display Mode**: Shows both **Retail MSRP** and **Your B2B Price (ex. Tax)** side-by-side on product cards to highlight buyer savings.

---

## 2. Database Schema & Data Models

### 2.1 Wholesale Profile Schema (`models/wholesale-profile.model.ts`)
Stores business verification data, credit limits, assigned price tiers, and terms:

```typescript
import { Schema, model, models } from "mongoose";

export interface IWholesaleProfile {
  userId: Schema.Types.ObjectId;
  companyName: string;
  companyRegistrationNumber: string;
  taxIdNumber: string; // VAT / EIN / TIN
  taxExemptStatus: "none" | "pending" | "approved" | "rejected";
  taxExemptCertificateUrl?: string;
  taxExemptExpiryDate?: Date;
  businessType: "retailer" | "distributor" | "corporate" | "institution" | "other";
  annualPurchasingVolume?: string;
  websiteUrl?: string;
  status: "pending_review" | "approved" | "suspended" | "rejected";
  approvedAt?: Date;
  approvedBy?: Schema.Types.ObjectId;
  rejectionReason?: string;
  
  // Tier & Pricing Assignments
  tierId: Schema.Types.ObjectId; // References WholesaleTier
  customDiscountPercentage?: number; // Optional flat discount override
  assignedPriceListId?: Schema.Types.ObjectId;
  
  // Payment Terms & Credit Line
  paymentTerms: "prepaid" | "net15" | "net30" | "net60" | "custom";
  creditLimit: number;
  availableCredit: number;
  outstandingBalance: number;
  poRequired: boolean;
  
  // Sub-Accounts & Purchasing Managers
  subAccounts: Array<{
    name: string;
    email: string;
    role: "buyer" | "manager" | "viewer";
    spendingLimitPerOrder?: number;
    monthlyBudget?: number;
    isActive: boolean;
  }>;
}
```

### 2.2 Customer Tier Schema (`models/wholesale-tier.model.ts`)
Configures buyer tiers (e.g., Bronze, Silver, Gold, Platinum, VIP Distributor):

```typescript
export interface IWholesaleTier {
  name: string; // e.g. "Gold Distributor"
  code: string; // e.g. "GOLD_DIST"
  description: string;
  discountType: "percentage" | "fixed_margin" | "custom_price_list";
  defaultDiscountPercentage: number; // e.g. 25% off MSRP
  minAnnualSpendRequirement: number;
  minOrderValue: number; // Tier-specific MOQ
  allowNetTerms: boolean;
  allowedPaymentTerms: string[];
  freeShippingThreshold?: number;
  prioritySupport: boolean;
  badgeColor: string;
  isActive: boolean;
}
```

### 2.3 Product Wholesale Extensions (`models/product.model.ts`)
Extended product schema to support volume tier breaks and case packs:

```typescript
export interface IProductWholesaleSettings {
  enabled: boolean;
  moq: number; // Minimum Order Quantity (e.g. 10 units)
  stepQuantity: number; // Buy in multiples of (e.g. 5, 10, 24)
  casePackQuantity: number; // Units per carton/box
  masterCartonQuantity: number;
  casePackPrice?: number;
  
  // Tiered Volume Pricing Table
  volumePricing: Array<{
    minQuantity: number; // e.g. 10, 50, 100, 500
    maxQuantity?: number;
    discountType: "fixed_price" | "percentage_off";
    value: number; // $35/unit or 20% off
  }>;
  
  // Tier Specific Overrides (Optional custom price per buyer tier)
  tierPricing: Array<{
    tierId: Schema.Types.ObjectId;
    price: number;
    moq?: number;
  }>;
  
  taxExemptEligible: boolean;
}
```

### 2.4 Request For Quote (RFQ) Schema (`models/wholesale-quote.model.ts`)
Enables custom B2B negotiations, volume bidding, and custom invoicing:

```typescript
export interface IWholesaleQuote {
  quoteNumber: string; // e.g. "RFQ-2026-0042"
  userId: Schema.Types.ObjectId;
  companyName: string;
  contactEmail: string;
  contactPhone: string;
  status: "draft" | "submitted" | "under_review" | "quote_sent" | "accepted" | "rejected" | "expired" | "converted_to_order";
  items: Array<{
    productId: Schema.Types.ObjectId;
    variantId?: string;
    productName: string;
    sku: string;
    requestedQuantity: number;
    targetPrice?: number;
    quotedPrice?: number;
    lineTotal?: number;
    notes?: string;
  }>;
  subtotal: number;
  shippingQuoted: number;
  taxQuoted: number;
  total: number;
  notesToCustomer?: string;
  internalNotes?: string;
  expiresAt: Date;
  convertedOrderId?: Schema.Types.ObjectId;
}
```

---

## 3. Settings Page Menu Architecture

A dedicated section under **Admin Settings -> Wholesale (B2B)** (`/admin/settings/wholesale`):

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ Admin Settings > Wholesale & B2B Engine                                                │
├───────────────────┬────────────────────────────────────────────────────────────────────┤
│ General & Mode    │ • Wholesale Mode (Hybrid, Gated Wholesale-Only, Disabled)          │
│                   │ • Guest Pricing (Show Retail, Hide Prices, "Login for B2B")       │
│                   │ • Minimum Order Value (MOV) (Global Minimum e.g. $500.00)          │
├───────────────────┼────────────────────────────────────────────────────────────────────┤
│ Onboarding & KYC  │ • Registration Form Configuration (Tax ID, Business Permit Upload) │
│                   │ • Auto-Approval vs Manual Review Workflow                         │
│                   │ • Welcome Email with Assigned Tier notification                   │
├───────────────────┼────────────────────────────────────────────────────────────────────┤
│ Pricing & Tiers   │ • Global Wholesale Markup / Discount Formula                       │
│                   │ • Default Tier for Newly Approved Buyers (e.g. Bronze)             │
│                   │ • Case Pack Multiplier Enforcement (Strict multiples vs warning)   │
├───────────────────┼────────────────────────────────────────────────────────────────────┤
│ Payment & Credit  │ • Net Terms Allowed (Net 15, Net 30, Net 60)                       │
│                   │ • Purchase Order (PO) Number Required at Checkout                  │
│                   │ • Default Credit Line for Approved Buyers ($5,000.00)              │
│                   │ • Overdue Invoice Grace Period & Account Lockout                   │
├───────────────────┼────────────────────────────────────────────────────────────────────┤
│ Tax & Compliance  │ • Automated Tax ID / VAT Number Validation Engine                  │
│                   │ • Tax Exemption Certificate Expiry Reminders (30 days prior)       │
│                   │ • Reverse-Charge VAT Handling for Cross-Border B2B Transactions    │
├───────────────────┼────────────────────────────────────────────────────────────────────┤
│ Quotes (RFQ)      │ • Enable "Request a Quote" Button on Product Pages                 │
│                   │ • Minimum Cart Value to Trigger RFQ                                │
│                   │ • Default Quote Validity Period (e.g. 14 Days)                     │
│                   │ • Automated Sales Rep Routing for Large Quotes                     │
└───────────────────┴────────────────────────────────────────────────────────────────────┘
```

---

## 4. Admin Dashboard Navigation & Management Modules

In the main sidebar, register **Wholesale (B2B)** as a top-level parent menu:

```
├── Dashboard
├── Products
├── Orders
├── Wholesale (B2B)          ◄─── NEW DEDICATED ADMIN MENU
│   ├── Overview             (/admin/wholesale)
│   ├── Applications (KYC)   (/admin/wholesale/applications) - [Badge with Pending count]
│   ├── B2B Customers        (/admin/wholesale/customers)
│   ├── Customer Tiers       (/admin/wholesale/tiers)
│   ├── Price Lists          (/admin/wholesale/price-lists)
│   ├── Quotes & RFQs        (/admin/wholesale/quotes) - [Badge with Open count]
│   ├── Credit & Invoices    (/admin/wholesale/credit)
│   └── Bulk Order Matrix    (/admin/wholesale/bulk-orders)
├── Branches & Stores
├── Finance & Payouts
└── Settings
```

### Module Breakdown:

1. **Wholesale Overview (`/admin/wholesale`)**:
   - High-level KPIs: Total B2B Gross Merchandise Value, Average Wholesale Order Value, Open Quotes, Pending Approvals, Total Credit Extended vs. Collected.
   - Top Wholesale Accounts and Most Re-ordered Case Packs.

2. **Applications & KYC Queue (`/admin/wholesale/applications`)**:
   - Split-screen document inspection for business registration certificates, tax licenses, and storefront photos.
   - 1-Click **Approve Account**: Assigns Initial Tier, Credit Limit, and Net Terms, automatically triggering an onboard notification.

3. **Customer Tiers Management (`/admin/wholesale/tiers`)**:
   - Visual tier matrix editor (Bronze: 15% off, Silver: 25% off, Gold: 35% off, Distributor: Custom Price Lists).
   - Automated tier progression rules based on trailing 12-month spend.

4. **Quotes & RFQ Management (`/admin/wholesale/quotes`)**:
   - Dynamic quotation builder with live cost vs. margin preview.
   - 1-Click Send Quote to Buyer with secure payment link and expiration timer.

5. **Credit Accounts & Aging Statements (`/admin/wholesale/credit`)**:
   - Tracks Net 30/60 open invoices, payment status (Current, 1-30 days overdue, 31-60 days overdue, 90+ days overdue).
   - Send automated PDF statements and payment reminders.

---

## 5. Storefront & Customer Experience (UI/UX)

### 5.1 Wholesale Registration Page (`/wholesale/register`)
- High-converting B2B onboarding form with company information, tax ID verification, certificate upload, and expected monthly volume.

### 5.2 Dynamic Product Page B2B Matrix
- **Volume Quantity Break Table**:
  | Quantity | Unit Price | Savings |
  | :--- | :--- | :--- |
  | **1 – 9 units** | $50.00 (MSRP) | — |
  | **10 – 49 units** | $42.00 | 16% Off |
  | **50 – 99 units** | $36.00 | 28% Off |
  | **100+ units** | $30.00 (Case Pack) | 40% Off |
- **MOQ & Step Counter**: Quantity input enforces `min="10"` and `step="5"`.
- **"Request Volume Quote"** modal trigger for orders exceeding 500+ units.

### 5.3 Quick Bulk Order Pad (`/wholesale/quick-order`)
- Power-buyer spreadsheet interface:
  - Add by typing SKU or Product Name with instant search suggestions.
  - Multi-variant quick-entry matrix (e.g. Size S: 10, M: 20, L: 20, XL: 10 in 1 screen).
  - Drag-and-drop CSV/Excel bulk upload: parses `SKU, Quantity` and adds hundreds of line items to cart in sub-second speed.

### 5.4 B2B Checkout Experience
- Payment options tailored to approved terms:
  - **Pay with Credit Line / Net 30 Terms** (Validates available credit limit).
  - **Purchase Order (PO) Number** field with optional PO PDF upload.
  - **Bank Wire / Proforma Invoice** (Generates formal invoice with SWIFT/IBAN details).
  - **Corporate Credit Card**.
- Automated Tax Exemption: Automatically zeros out sales tax if buyer has an approved tax certificate on file.

### 5.5 B2B Customer Account Portal (`/account/wholesale`)
- Invoices & Statements tab with downloadable PDF tax invoices.
- **1-Click Reorder**: Duplicate past purchase orders in 1 click.
- Team Management: Invite company purchasers with specific spend limits and approval requirements.

---

## 6. Implementation Roadmap & Milestones

```
┌────────────────────────────────────────────────────────────────────────┐
│ Phase 1: Core Data Models & Settings                                   │
│ • WholesaleProfile, WholesaleTier, WholesaleQuote Mongoose Models      │
│ • Admin Settings Sections (/admin/settings/wholesale)                  │
├────────────────────────────────────────────────────────────────────────┤
│ Phase 2: Pricing Engine & Product Tier Matrix                          │
│ • Calculate wholesale volume pricing in money/cart calculation engine  │
│ • Product form extension: MOQ, case packs, and volume pricing table    │
├────────────────────────────────────────────────────────────────────────┤
│ Phase 3: Admin Dashboard Modules & Applications Queue                  │
│ • Sidebar menu: Applications, Customers, Tiers, Quotes, Credit         │
│ • KYC Document viewer and tier assignment workflows                    │
├────────────────────────────────────────────────────────────────────────┤
│ Phase 4: Storefront B2B Pages & Quick Order Pad                        │
│ • Wholesale Registration (/wholesale/register)                         │
│ • Quick Order Grid & CSV Uploader (/wholesale/quick-order)             │
│ • Product page volume discount tables & MOQ counters                   │
├────────────────────────────────────────────────────────────────────────┤
│ Phase 5: B2B Checkout & Credit Management                              │
│ • Net 15/30 terms & PO number support in checkout                      │
│ • Invoices, Aging statements, and 1-click reorder in customer portal   │
└────────────────────────────────────────────────────────────────────────┘
```
