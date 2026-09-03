import mongoose from "mongoose";
import { DeliveryMethod } from "../models/delivery-methods.model.js";

const methods = [
  {
    name: "VIPX Express Parcel (Accra ↔ Kumasi)",
    carrierCode: "VIPX",
    logoUrl: "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=120&auto=format&fit=crop&q=80",
    description: "VIP Jeoun station-to-station express freight between Circle VIP Terminal and Asafo VIP Terminal.",
    trackingUrlTemplate: "https://track.vipx.com.gh/?no={{trackingNumber}}",
    type: "FLAT_RATE",
    baseCost: 20.0,
    freeShippingThreshold: 500,
    estimatedDaysMin: 1,
    estimatedDaysMax: 1,
    isActive: true,
    isInternational: false,
    availableRegions: ["Greater Accra", "Ashanti"],
  },
  {
    name: "VIPX Regional Bus Freight",
    carrierCode: "VIPX",
    logoUrl: "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=120&auto=format&fit=crop&q=80",
    description: "VIP Jeoun bus parcel delivery to Sunyani, Tamale, Takoradi, Bolgatanga, and Cape Coast bus terminals.",
    trackingUrlTemplate: "https://track.vipx.com.gh/?no={{trackingNumber}}",
    type: "ZONE_BASED",
    baseCost: 30.0,
    perKgCost: 1.5,
    freeShippingThreshold: 600,
    estimatedDaysMin: 1,
    estimatedDaysMax: 2,
    isActive: true,
    isInternational: false,
    availableRegions: ["Bono", "Northern", "Western", "Upper East", "Central", "Ahafo", "Savannah"],
  },
  {
    name: "STC Intercity Cargo & Bus Parcel",
    carrierCode: "STC",
    logoUrl: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=120&auto=format&fit=crop&q=80",
    description: "State Transport Corporation secure nationwide bus cargo to all major STC terminals across Ghana.",
    trackingUrlTemplate: "https://stc.gov.gh/track?waybill={{trackingNumber}}",
    type: "FLAT_RATE",
    baseCost: 25.0,
    perKgCost: 1.0,
    freeShippingThreshold: 450,
    estimatedDaysMin: 1,
    estimatedDaysMax: 2,
    isActive: true,
    isInternational: false,
    availableRegions: [], // All 16 regions
  },
  {
    name: "STC International Parcel (West Africa)",
    carrierCode: "STC",
    logoUrl: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=120&auto=format&fit=crop&q=80",
    description: "Cross-border coach parcel delivery to Abidjan (Ivory Coast), Lome (Togo), Cotonou (Benin), and Ouagadougou.",
    trackingUrlTemplate: "https://stc.gov.gh/track-intl?ref={{trackingNumber}}",
    type: "FLAT_RATE",
    baseCost: 120.0,
    perKgCost: 8.0,
    estimatedDaysMin: 2,
    estimatedDaysMax: 5,
    isActive: true,
    isInternational: true,
    availableRegions: [],
  },
  {
    name: "Accra Metro Express (Same-Day / Next-Day)",
    carrierCode: "STANDARD",
    description: "Dedicated dispatch motorbike or van delivery within Greater Accra (Accra, Tema, Madina, Kasoa, Spintex).",
    type: "FLAT_RATE",
    baseCost: 15.0,
    freeShippingThreshold: 250,
    estimatedDaysMin: 1,
    estimatedDaysMax: 1,
    isActive: true,
    isInternational: false,
    availableRegions: ["Greater Accra"],
  },
  {
    name: "Kumasi Metro Standard Dispatch",
    carrierCode: "STANDARD",
    description: "Next-day local delivery across Kumasi, Adum, Bantama, KNUST, and surrounding districts.",
    type: "FLAT_RATE",
    baseCost: 18.0,
    freeShippingThreshold: 300,
    estimatedDaysMin: 1,
    estimatedDaysMax: 2,
    isActive: true,
    isInternational: false,
    availableRegions: ["Ashanti"],
  },
  {
    name: "Zara Express – Zone A (Accra Metro Per-KM)",
    carrierCode: "ZARA",
    logoUrl: "https://images.unsplash.com/photo-1616401784845-180882ba9ba8?w=120&auto=format&fit=crop&q=80",
    description: "Zara Express ultra-fast delivery for Accra Metro. Guaranteed same-day dispatch before 2 PM.",
    trackingUrlTemplate: "https://zaraexpress.com/track?ref={{trackingNumber}}",
    type: "PER_KM",
    baseCost: 12.0,
    perKmCost: 1.5,
    maxDistanceKm: 35,
    freeShippingThreshold: 350,
    estimatedDaysMin: 1,
    estimatedDaysMax: 1,
    isActive: true,
    isInternational: false,
    availableRegions: ["Greater Accra"],
  },
  {
    name: "Ghana Nationwide Economy Delivery",
    carrierCode: "STANDARD",
    description: "Standard door-to-door or regional station delivery covering all 16 Ghanaian regions.",
    type: "FLAT_RATE",
    baseCost: 30.0,
    freeShippingThreshold: 450,
    estimatedDaysMin: 2,
    estimatedDaysMax: 5,
    isActive: true,
    isInternational: false,
    availableRegions: [],
  },
  {
    name: "Ghana Post EMS (Express Mail Service)",
    carrierCode: "GHANA_POST",
    logoUrl: "https://images.unsplash.com/photo-1580674684081-7617fbf3d745?w=120&auto=format&fit=crop&q=80",
    description: "Official Ghana Post EMS tracked domestic and expedited delivery to every district post office in Ghana.",
    trackingUrlTemplate: "https://ghanapost.com.gh/tracking?trackid={{trackingNumber}}",
    type: "PER_KG",
    baseCost: 22.0,
    perKgCost: 2.0,
    estimatedDaysMin: 2,
    estimatedDaysMax: 4,
    isActive: true,
    isInternational: false,
    availableRegions: [],
  },
];

async function seedDeliveryMethods() {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    console.error("Missing MONGODB_URI");
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB.");

    await DeliveryMethod.deleteMany({});
    console.log("Cleared existing delivery methods.");

    await DeliveryMethod.insertMany(methods);
    console.log(`Successfully seeded ${methods.length} Ghana top delivery methods (VIPX, STC, Zara, EMS, Standard).`);

    process.exit(0);
  } catch (error) {
    console.error("Error seeding delivery methods:", error);
    process.exit(1);
  }
}

seedDeliveryMethods();
