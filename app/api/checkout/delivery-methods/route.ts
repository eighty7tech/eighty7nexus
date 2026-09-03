import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { DeliveryMethod } from "@/models/delivery-methods.model";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const country = searchParams.get("country");
    const region = searchParams.get("region");

    await connectDB();
    
    const query: any = { isActive: true };
    
    if (country === "Ghana") {
      query.isInternational = false;
      
      // If a specific region is provided, find methods that are either
      // available everywhere (empty array) OR specifically include this region
      if (region) {
        query.$or = [
          { availableRegions: { $size: 0 } },
          { availableRegions: region }
        ];
      }
    } else if (country) {
      query.isInternational = true;
    }

    const methods = await DeliveryMethod.find(query).sort({ baseCost: 1 }).lean();
      
    return NextResponse.json({ success: true, data: methods });
  } catch (error) {
    console.error("Error fetching delivery methods:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch delivery methods" },
      { status: 500 }
    );
  }
}
