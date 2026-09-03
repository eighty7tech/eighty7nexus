import { mongoose } from "@/lib/db";
import type { IGhanaRegion } from "@/types";

const { Schema, models, model } = mongoose;

const DistrictSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, trim: true }, // e.g., "Metropolitan", "Municipal", "District"
  },
  { _id: true }
);

/**
 * @schema GhanaRegionSchema
 * Represents a region in Ghana along with its associated districts.
 */
const GhanaRegionSchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    capital: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, trim: true }, // e.g., "GR" for Greater Accra
    districts: { type: [DistrictSchema], default: [] },
  },
  {
    timestamps: true,
  }
);

export const GhanaRegion =
  models.GhanaRegion || model("GhanaRegion", GhanaRegionSchema);
