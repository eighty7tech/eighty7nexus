import { mongoose } from "@/lib/db";

const { Schema, models, model } = mongoose;

export interface IWholesaleTier {
  name: string; // e.g. "Gold Distributor", "Silver Retailer"
  code: string; // e.g. "GOLD_DIST", "SILVER_RET"
  description?: string;
  discountType: "percentage" | "fixed_margin" | "custom_price_list";
  defaultDiscountPercentage: number; // e.g. 25% off MSRP
  minAnnualSpendRequirement: number;
  minOrderValue: number; // Tier-specific minimum order value
  allowNetTerms: boolean;
  allowedPaymentTerms: string[]; // ["prepaid", "net15", "net30", "net60"]
  freeShippingThreshold?: number;
  prioritySupport: boolean;
  badgeColor: string;
  isActive: boolean;
}

const WholesaleTierSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    description: { type: String, trim: true },
    discountType: {
      type: String,
      enum: ["percentage", "fixed_margin", "custom_price_list"],
      default: "percentage",
    },
    defaultDiscountPercentage: { type: Number, default: 15, min: 0, max: 100 },
    minAnnualSpendRequirement: { type: Number, default: 0 },
    minOrderValue: { type: Number, default: 0 },
    allowNetTerms: { type: Boolean, default: false },
    allowedPaymentTerms: {
      type: [String],
      default: ["prepaid"],
    },
    freeShippingThreshold: { type: Number },
    prioritySupport: { type: Boolean, default: false },
    badgeColor: { type: String, default: "#2563eb" },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

export const WholesaleTier =
  models.WholesaleTier || model("WholesaleTier", WholesaleTierSchema);
