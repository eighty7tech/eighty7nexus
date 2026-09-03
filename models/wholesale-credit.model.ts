import mongoose, { Schema, type Document, type Model } from "mongoose";

export type NetPaymentTerms = "net_15" | "net_30" | "net_60" | "net_90";
export type CreditAccountStatus = "pending" | "approved" | "suspended" | "revoked";
export type CreditInvoiceStatus = "unpaid" | "paid" | "overdue" | "cancelled";

export interface ICreditInvoice {
  invoiceNumber: string;
  orderId?: mongoose.Types.ObjectId;
  orderNumber?: string;
  amount: number;
  paidAmount: number;
  dueDate: Date;
  paidDate?: Date;
  status: CreditInvoiceStatus;
  dunningLevel: number; // 0 = Current, 1 = First reminder, 2 = Final notice, 3 = Frozen/Collections
  interestAccrued: number;
  issuedAt: Date;
}

export interface ICreditAuditLog {
  action: "LIMIT_SET" | "LIMIT_REQUEST" | "CHARGE" | "PAYMENT" | "INTEREST_APPLIED" | "STATUS_CHANGED";
  amount?: number;
  performedBy?: mongoose.Types.ObjectId;
  reason?: string;
  timestamp: Date;
}

export interface IWholesaleCredit extends Document {
  userId: mongoose.Types.ObjectId;
  companyName: string;
  businessRegistrationNumber?: string;
  taxId?: string;
  creditLimit: number;
  usedCredit: number;
  currency: string;
  terms: NetPaymentTerms;
  status: CreditAccountStatus;
  interestRateAnnualPercent: number;
  invoices: ICreditInvoice[];
  auditTrail: ICreditAuditLog[];
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CreditInvoiceSchema = new Schema<ICreditInvoice>(
  {
    invoiceNumber: { type: String, required: true, trim: true },
    orderId: { type: Schema.Types.ObjectId, ref: "Order" },
    orderNumber: { type: String, trim: true },
    amount: { type: Number, required: true, min: 0 },
    paidAmount: { type: Number, default: 0, min: 0 },
    dueDate: { type: Date, required: true },
    paidDate: { type: Date },
    status: {
      type: String,
      enum: ["unpaid", "paid", "overdue", "cancelled"],
      default: "unpaid",
    },
    dunningLevel: { type: Number, default: 0, min: 0, max: 3 },
    interestAccrued: { type: Number, default: 0, min: 0 },
    issuedAt: { type: Date, default: Date.now },
  },
  { _id: true },
);

const CreditAuditLogSchema = new Schema<ICreditAuditLog>(
  {
    action: {
      type: String,
      enum: ["LIMIT_SET", "LIMIT_REQUEST", "CHARGE", "PAYMENT", "INTEREST_APPLIED", "STATUS_CHANGED"],
      required: true,
    },
    amount: { type: Number },
    performedBy: { type: Schema.Types.ObjectId, ref: "User" },
    reason: { type: String },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false },
);

const WholesaleCreditSchema = new Schema<IWholesaleCredit>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    companyName: { type: String, required: true, trim: true },
    businessRegistrationNumber: { type: String, trim: true },
    taxId: { type: String, trim: true },
    creditLimit: { type: Number, default: 0, min: 0 },
    usedCredit: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: "USD", uppercase: true },
    terms: {
      type: String,
      enum: ["net_15", "net_30", "net_60", "net_90"],
      default: "net_30",
    },
    status: {
      type: String,
      enum: ["pending", "approved", "suspended", "revoked"],
      default: "pending",
    },
    interestRateAnnualPercent: { type: Number, default: 8.0, min: 0 },
    invoices: [CreditInvoiceSchema],
    auditTrail: [CreditAuditLogSchema],
    approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
    approvedAt: { type: Date },
    notes: { type: String },
  },
  { timestamps: true },
);

// Virtual for available credit
WholesaleCreditSchema.virtual("availableCredit").get(function (this: IWholesaleCredit) {
  return Math.max(0, this.creditLimit - this.usedCredit);
});

export const WholesaleCredit: Model<IWholesaleCredit> =
  mongoose.models.WholesaleCredit ||
  mongoose.model<IWholesaleCredit>("WholesaleCredit", WholesaleCreditSchema, "wholesale_credits");
