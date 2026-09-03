import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { GhanaRegion } from "@/models/ghana-regions.model";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const regionId = searchParams.get("regionId");
    const regionCode = searchParams.get("regionCode");

    if (!regionId && !regionCode) {
      return NextResponse.json(
        { success: false, message: "regionId or regionCode is required" },
        { status: 400 }
      );
    }

    await connectDB();
    
    let query = {};
    if (regionId && mongoose.Types.ObjectId.isValid(regionId)) {
      query = { _id: regionId };
    } else if (regionCode) {
      query = { code: regionCode.toUpperCase() };
    } else {
       return NextResponse.json(
        { success: false, message: "Invalid region parameter" },
        { status: 400 }
      );
    }

    const region = await GhanaRegion.findOne(query)
      .select("districts")
      .lean();
      
    if (!region) {
      return NextResponse.json(
        { success: false, message: "Region not found" },
        { status: 404 }
      );
    }
      
    return NextResponse.json({ 
      success: true, 
      data: region.districts.sort((a: any, b: any) => a.name.localeCompare(b.name)) 
    });
  } catch (error) {
    console.error("Error fetching Ghana districts:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch districts" },
      { status: 500 }
    );
  }
}
