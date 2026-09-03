import { NextRequest, NextResponse } from "next/server";
import {
  getCourierTelemetry,
  recordCourierLocation,
  type CourierVehicleType,
} from "@/lib/shipping/courier-telemetry";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("orderId");
    const orderNumber = searchParams.get("orderNumber") || "ORD-1001";

    if (!orderId) {
      return NextResponse.json({ error: "orderId is required" }, { status: 400 });
    }

    const telemetry = getCourierTelemetry(orderId, orderNumber);
    return NextResponse.json({ success: true, telemetry });
  } catch (error: unknown) {
    console.error("Courier telemetry GET error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch telemetry" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      orderId,
      orderNumber,
      courierName,
      courierPhone,
      vehicleType,
      currentLatitude,
      currentLongitude,
      destinationLatitude,
      destinationLongitude,
      speedKmh,
      headingDegrees,
    } = body;

    if (!orderId || !currentLatitude || !currentLongitude || !destinationLatitude || !destinationLongitude) {
      return NextResponse.json(
        { error: "orderId and valid coordinates are required" },
        { status: 400 },
      );
    }

    const telemetry = recordCourierLocation({
      orderId,
      orderNumber: orderNumber || orderId,
      courierName: courierName || "Courier Rider",
      courierPhone,
      vehicleType: vehicleType as CourierVehicleType,
      currentLatitude,
      currentLongitude,
      destinationLatitude,
      destinationLongitude,
      speedKmh,
      headingDegrees,
    });

    return NextResponse.json({ success: true, telemetry });
  } catch (error: unknown) {
    console.error("Courier telemetry POST error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to record telemetry" },
      { status: 500 },
    );
  }
}
