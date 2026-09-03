import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { GhanaRegion } from "@/models/ghana-regions.model";

// Cache for 1 hour (3600 seconds)
export const revalidate = 3600;

export async function GET() {
  try {
    await connectDB();
    
    // Fetch regions but exclude the verbose districts array for the regions list endpoint
    // to keep the payload small. 
    const regions = await GhanaRegion.find({})
      .select("name capital code updatedAt")
      .sort({ name: 1 })
      .lean();
      
    return NextResponse.json({ success: true, data: regions });
  } catch (error) {
    console.error("Error fetching Ghana regions:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch regions" },
      { status: 500 }
    );
  }
}
