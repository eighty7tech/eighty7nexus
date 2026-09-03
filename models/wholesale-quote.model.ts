import { mongoose } from "@/lib/db";

const { Schema, models, model } = mongoose;

export interface IWholesaleQuote {
  quoteNumber: string; // e.g. "RFQ-2026-0042"
  userId: string;
  companyName: string;
  contactEmail: string;
  contactPhone?: string;
  status:
    | "draft"
    | "submitted"
    | "under_review"
    | "quote_sent"
    | "accepted"
    | "rejected"
    | "expired"
    | "converted_to_order";
  items: Array<{
    productId: string;
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
  convertedOrderId?: string;
}

const WholesaleQuoteSchema = new Schema(
  {
    quoteNumber: { type: String, required: true, unique: true, uppercase: true, trim: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    companyName: { type: String, required: true, trim: true },
    contactEmail: { type: String, required: true, lowercase: true, trim: true },
    contactPhone: { type: String, trim: true },
    status: {
      type: String,
      enum: [
        "draft",
        "submitted",
        "under_review",
        "quote_sent",
        "accepted",
        "rejected",
        "expired",
        "converted_to_order",
      ],
      default: "submitted",
    },
    items: [
      {
        productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
        variantId: { type: String },
        productName: { type: String, required: true },
        sku: { type: String, required: true },
        requestedQuantity: { type: Number, required: true, min: 1 },
        targetPrice: { type: Number },
        quotedPrice: { type: Number },
        lineTotal: { type: Number },
        notes: { type: String },
      },
    ],
    subtotal: { type: Number, default: 0 },
    shippingQuoted: { type: Number, default: 0 },
    taxQuoted: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    notesToCustomer: { type: String },
    internalNotes: { type: String },
    expiresAt: { type: Date, required: true },
    convertedOrderId: { type: Schema.Types.ObjectId, ref: "Order" },
  },
  {
    timestamps: true,
  }
);

WholesaleQuoteSchema.index({ status: 1 });
WholesaleQuoteSchema.index({ userId: 1 });

export const WholesaleQuote =
  models.WholesaleQuote || model("WholesaleQuote", WholesaleQuoteSchema);
