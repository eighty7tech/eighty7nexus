import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { DeliveryMethod } from "@/models/delivery-methods.model";
import { calculateDistanceKm } from "@/lib/haversine";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { deliveryMethodId, origin, destination, weightKg = 0 } = body;

    if (!deliveryMethodId) {
      return NextResponse.json(
        { success: false, message: "Delivery method ID is required" },
        { status: 400 }
      );
    }

    await connectDB();
    const method = await DeliveryMethod.findById(deliveryMethodId).lean();

    if (!method) {
      return NextResponse.json(
        { success: false, message: "Delivery method not found" },
        { status: 404 }
      );
    }

    let finalCost = method.baseCost;
    let distanceKm = 0;

    // For PER_KM, we need origin and destination
    if (method.type === "PER_KM") {
      if (!origin || !destination) {
        return NextResponse.json(
          { success: false, message: "Origin and destination coordinates required for PER_KM pricing" },
          { status: 400 }
        );
      }
      
      distanceKm = calculateDistanceKm(
        origin.lat, origin.lng,
        destination.lat, destination.lng
      );
      
      if (method.maxDistanceKm && distanceKm > method.maxDistanceKm) {
        return NextResponse.json(
          { 
            success: false, 
            message: `Destination exceeds maximum delivery distance of ${method.maxDistanceKm}km`,
            distanceKm
          },
          { status: 400 }
        );
      }
      
      finalCost += distanceKm * (method.perKmCost || 0);
    }

    // For PER_KG, we need weight
    if (method.type === "PER_KG") {
      finalCost += weightKg * (method.perKgCost || 0);
    }
    
    // NOTE: ZONE_BASED is handled on the client or during the initial method fetch
    // by restricting available methods. If you choose this method, its baseCost is the zone cost.

    return NextResponse.json({ 
      success: true, 
      cost: Math.round(finalCost * 100) / 100, // round to 2 decimal places
      distanceKm: Math.round(distanceKm * 10) / 10
    });
  } catch (error) {
    console.error("Error calculating delivery cost:", error);
    return NextResponse.json(
      { success: false, message: "Failed to calculate delivery cost" },
      { status: 500 }
    );
  }
}
