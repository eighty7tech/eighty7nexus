import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { PickupStation } from "@/models/pickup-stations.model";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json(
        { success: false, message: "No CSV file uploaded" },
        { status: 400 }
      );
    }

    const text = await file.text();
    const lines = text.split("\n").map(l => l.trim()).filter(l => l);
    
    if (lines.length < 2) {
      return NextResponse.json(
        { success: false, message: "CSV file is empty or missing headers" },
        { status: 400 }
      );
    }

    const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/^\uFEFF/, ''));
    const expectedHeaders = ["name", "region", "district", "address", "lat", "lng", "phone", "capacity"];
    
    const missing = expectedHeaders.filter(h => !headers.includes(h));
    if (missing.length > 0) {
      return NextResponse.json(
        { success: false, message: `Missing required headers: ${missing.join(", ")}` },
        { status: 400 }
      );
    }

    const stationsToInsert = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map(v => v.trim());
      const row: any = {};
      
      headers.forEach((header, index) => {
        row[header] = values[index];
      });

      const lat = parseFloat(row.lat);
      const lng = parseFloat(row.lng);
      
      if (isNaN(lat) || isNaN(lng)) continue;

      stationsToInsert.push({
        name: row.name,
        region: row.region,
        district: row.district,
        address: row.address,
        location: {
          type: "Point",
          coordinates: [lng, lat] // GeoJSON expects [longitude, latitude]
        },
        phone: row.phone || "",
        capacity: parseInt(row.capacity, 10) || 100,
        isActive: true,
      });
    }

    await connectDB();
    
    let result;
    if (stationsToInsert.length > 0) {
      result = await PickupStation.insertMany(stationsToInsert);
    }
      
    return NextResponse.json({ 
      success: true, 
      message: `Successfully imported ${stationsToInsert.length} pickup stations`,
      count: stationsToInsert.length
    });
  } catch (error) {
    console.error("Error importing pickup stations:", error);
    return NextResponse.json(
      { success: false, message: "Failed to import CSV" },
      { status: 500 }
    );
  }
}
