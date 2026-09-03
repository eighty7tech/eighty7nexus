import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { PickupStation } from "@/models/pickup-stations.model";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const region = searchParams.get("region");
    const district = searchParams.get("district");
    
    await connectDB();
    
    const query: any = {};
    if (region) query.region = region;
    if (district) query.district = district;

    const stations = await PickupStation.find(query).sort({ name: 1 }).lean();
      
    return NextResponse.json({ success: true, data: stations });
  } catch (error) {
    console.error("Error fetching pickup stations:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch pickup stations" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    await connectDB();
    const station = await PickupStation.create(body);
      
    return NextResponse.json({ success: true, data: station }, { status: 201 });
  } catch (error) {
    console.error("Error creating pickup station:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create pickup station" },
      { status: 500 }
    );
  }
}
