import { mongoose } from "@/lib/db";

const { Schema, models, model } = mongoose;

export interface IWholesaleProfile {
  userId: string;
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
  approvedBy?: string;
  rejectionReason?: string;
  
  // Tier & Pricing Assignments
  tierId?: string; // References WholesaleTier
  customDiscountPercentage?: number;
  assignedPriceListId?: string;
  
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
  
  // Dedicated Account Representative
  accountRepName?: string;
  accountRepEmail?: string;
}

const WholesaleProfileSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    companyName: { type: String, required: true, trim: true },
    companyRegistrationNumber: { type: String, required: true, trim: true },
    taxIdNumber: { type: String, required: true, trim: true },
    taxExemptStatus: {
      type: String,
      enum: ["none", "pending", "approved", "rejected"],
      default: "none",
    },
    taxExemptCertificateUrl: { type: String, trim: true },
    taxExemptExpiryDate: { type: Date },
    businessType: {
      type: String,
      enum: ["retailer", "distributor", "corporate", "institution", "other"],
      default: "retailer",
    },
    annualPurchasingVolume: { type: String, trim: true },
    websiteUrl: { type: String, trim: true },
    status: {
      type: String,
      enum: ["pending_review", "approved", "suspended", "rejected"],
      default: "pending_review",
    },
    approvedAt: { type: Date },
    approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
    rejectionReason: { type: String, trim: true },
    
    tierId: { type: Schema.Types.ObjectId, ref: "WholesaleTier" },
    customDiscountPercentage: { type: Number, min: 0, max: 100 },
    assignedPriceListId: { type: Schema.Types.ObjectId },
    
    paymentTerms: {
      type: String,
      enum: ["prepaid", "net15", "net30", "net60", "custom"],
      default: "prepaid",
    },
    creditLimit: { type: Number, default: 0 },
    availableCredit: { type: Number, default: 0 },
    outstandingBalance: { type: Number, default: 0 },
    poRequired: { type: Boolean, default: false },
    
    subAccounts: [
      {
        name: { type: String, required: true, trim: true },
        email: { type: String, required: true, lowercase: true, trim: true },
        role: {
          type: String,
          enum: ["buyer", "manager", "viewer"],
          default: "buyer",
        },
        spendingLimitPerOrder: { type: Number },
        monthlyBudget: { type: Number },
        isActive: { type: Boolean, default: true },
      },
    ],
    accountRepName: { type: String, trim: true },
    accountRepEmail: { type: String, trim: true, lowercase: true },
  },
  {
    timestamps: true,
  }
);

WholesaleProfileSchema.index({ status: 1 });
WholesaleProfileSchema.index({ companyName: 1 });
WholesaleProfileSchema.index({ taxIdNumber: 1 });

export const WholesaleProfile =
  models.WholesaleProfile || model("WholesaleProfile", WholesaleProfileSchema);
