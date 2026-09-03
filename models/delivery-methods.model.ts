import { mongoose } from "@/lib/db";

const { Schema, models, model } = mongoose;

/**
 * @schema DeliveryMethodSchema
 * Defines shipping / delivery methods available. Can be constrained by regions for Ghana.
 */
const DeliveryMethodSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    logoUrl: { type: String, trim: true },
    carrierCode: { type: String, trim: true }, // e.g. "VIPX", "STC", "FEDEX", "DHL", "ZARA", "STANDARD", "CUSTOM"
    trackingUrlTemplate: { type: String, trim: true }, // e.g. "https://track.vipx.com/?ref={{trackingNumber}}"
    type: { 
      type: String, 
      enum: ["FLAT_RATE", "PER_KM", "PER_KG", "ZONE_BASED"], 
      default: "FLAT_RATE" 
    },
    baseCost: { type: Number, required: true, default: 0 },
    perKmCost: { type: Number, default: 0 },
    perKgCost: { type: Number, default: 0 },
    freeShippingThreshold: { type: Number },
    maxDistanceKm: { type: Number },
    estimatedDaysMin: { type: Number, default: 1 },
    estimatedDaysMax: { type: Number, default: 3 },
    isActive: { type: Boolean, default: true },
    isInternational: { type: Boolean, default: false }, // if false, it's Ghana-specific
    
    // For Ghana-specific methods, array of Region codes ("GR", "AR", etc.) where this is available.
    // Empty array means available in all regions.
    availableRegions: { type: [String], default: [] },
    
    // Array of cities where this is available. Empty means all cities in the available regions.
    availableCities: { type: [String], default: [] },
  },
  {
    timestamps: true,
  }
);

export const DeliveryMethod =
  models.DeliveryMethod || model("DeliveryMethod", DeliveryMethodSchema);
