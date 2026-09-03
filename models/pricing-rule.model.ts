import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IPricingRuleCondition {
  type: "inventory_level" | "time_range" | "customer_segment" | "bundle";
  // inventory_level
  minStock?: number;
  maxStock?: number;
  // time_range
  startTime?: string; // HH:mm format
  endTime?: string;
  daysOfWeek?: number[]; // 0 = Sunday, 1 = Monday, etc.
  // customer_segment
  customerTiers?: string[]; // IDs of customer tiers
  // bundle
  requiredProductIds?: string[]; // IDs of products that must be in cart
  minQuantity?: number;
}

export interface IPricingRule extends Document {
  name: string;
  description?: string;
  isActive: boolean;
  priority: number; // Higher number = higher priority
  
  // What does this apply to? If empty, applies to all items (store-wide discount)
  applicableProductIds?: string[];
  applicableCategoryIds?: string[];
  
  conditions: IPricingRuleCondition[];
  
  discountType: "percentage" | "fixed_amount";
  discountValue: number; // Percentage (e.g. 10 for 10%) or fixed amount
  
  startDate?: Date;
  endDate?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

const PricingRuleConditionSchema = new Schema<IPricingRuleCondition>({
  type: {
    type: String,
    enum: ["inventory_level", "time_range", "customer_segment", "bundle"],
    required: true,
  },
  minStock: { type: Number },
  maxStock: { type: Number },
  startTime: { type: String },
  endTime: { type: String },
  daysOfWeek: [{ type: Number }],
  customerTiers: [{ type: String }],
  requiredProductIds: [{ type: String }],
  minQuantity: { type: Number },
});

const PricingRuleSchema = new Schema<IPricingRule>(
  {
    name: { type: String, required: true },
    description: { type: String },
    isActive: { type: Boolean, default: true },
    priority: { type: Number, default: 0 },
    
    applicableProductIds: [{ type: String }],
    applicableCategoryIds: [{ type: String }],
    
    conditions: [PricingRuleConditionSchema],
    
    discountType: {
      type: String,
      enum: ["percentage", "fixed_amount"],
      required: true,
    },
    discountValue: { type: Number, required: true },
    
    startDate: { type: Date },
    endDate: { type: Date },
  },
  { timestamps: true }
);

// Indexes for fast lookup
PricingRuleSchema.index({ isActive: 1, priority: -1 });
PricingRuleSchema.index({ startDate: 1, endDate: 1 });

export const PricingRule = (mongoose.models.PricingRule ||
  mongoose.model<IPricingRule>("PricingRule", PricingRuleSchema)) as Model<IPricingRule>;
