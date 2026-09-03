import { mongoose } from "@/lib/db";

const { Schema, models, model } = mongoose;

/**
 * @schema PickupStationSchema
 * Represents a physical location where customers can pick up their orders.
 */
const PickupStationSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    region: { type: String, required: true, trim: true }, // e.g., "Greater Accra"
    district: { type: String, required: true, trim: true }, // e.g., "Accra Metropolitan"
    address: { type: String, required: true, trim: true },
    
    // GeoJSON point for Google Maps integration / distance calculations
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [0, 0],
      },
    },
    
    phone: { type: String, trim: true },
    operatingHours: { type: String, trim: true },
    capacity: { type: Number, default: 100 },
    specialInstructions: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

// 2dsphere index for geo-queries (finding nearest station)
PickupStationSchema.index({ location: "2dsphere" });
PickupStationSchema.index({ region: 1, district: 1 });

export const PickupStation =
  models.PickupStation || model("PickupStation", PickupStationSchema);
