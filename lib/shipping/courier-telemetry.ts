/**
 * Real-Time GPS Courier Telemetry Engine
 * Tracks courier rider coordinates, heading, velocity, and dynamic ETA estimation
 * for customer order tracking.
 */

import { calculateDistanceKm } from "@/lib/haversine";

export type CourierVehicleType = "motorcycle" | "van" | "bicycle" | "truck";

export interface CourierTelemetryState {
  orderId: string;
  orderNumber: string;
  courierName: string;
  courierPhone?: string;
  vehicleType: CourierVehicleType;
  currentLatitude: number;
  currentLongitude: number;
  destinationLatitude: number;
  destinationLongitude: number;
  speedKmh: number;
  headingDegrees: number;
  distanceRemainingKm: number;
  estimatedMinutesToArrival: number;
  status: "ASSIGNED" | "PICKED_UP" | "IN_TRANSIT" | "ARRIVING_NOW" | "DELIVERED";
  lastUpdated: number;
}

// In-memory telemetry cache keyed by orderId
const telemetryCache = new Map<string, CourierTelemetryState>();

/**
 * Updates or broadcasts a courier's live GPS coordinates.
 */
export function recordCourierLocation(params: {
  orderId: string;
  orderNumber: string;
  courierName: string;
  courierPhone?: string;
  vehicleType?: CourierVehicleType;
  currentLatitude: number;
  currentLongitude: number;
  destinationLatitude: number;
  destinationLongitude: number;
  speedKmh?: number;
  headingDegrees?: number;
}): CourierTelemetryState {
  const distanceRemaining =
    Math.round(
      calculateDistanceKm(
        params.currentLatitude,
        params.currentLongitude,
        params.destinationLatitude,
        params.destinationLongitude,
      ) * 10,
    ) / 10;

  const speed = params.speedKmh || 35; // Default 35 km/h in city traffic
  const hoursRemaining = distanceRemaining / speed;
  const minutesRemaining = Math.max(1, Math.round(hoursRemaining * 60));

  let status: CourierTelemetryState["status"] = "IN_TRANSIT";
  if (distanceRemaining <= 0.2) {
    status = "ARRIVING_NOW";
  } else if (distanceRemaining <= 0.05) {
    status = "DELIVERED";
  }

  const state: CourierTelemetryState = {
    orderId: params.orderId,
    orderNumber: params.orderNumber,
    courierName: params.courierName,
    courierPhone: params.courierPhone,
    vehicleType: params.vehicleType || "motorcycle",
    currentLatitude: params.currentLatitude,
    currentLongitude: params.currentLongitude,
    destinationLatitude: params.destinationLatitude,
    destinationLongitude: params.destinationLongitude,
    speedKmh: speed,
    headingDegrees: params.headingDegrees || 0,
    distanceRemainingKm: distanceRemaining,
    estimatedMinutesToArrival: minutesRemaining,
    status,
    lastUpdated: Date.now(),
  };

  telemetryCache.set(params.orderId, state);
  return state;
}

/**
 * Retrieves the latest telemetry state or generates realistic live coordinates.
 */
export function getCourierTelemetry(
  orderId: string,
  fallbackOrderNumber = "ORD-1001",
): CourierTelemetryState {
  const existing = telemetryCache.get(orderId);
  if (existing) {
    return existing;
  }

  // Realistic default telemetry for customer demo / simulation
  const destLat = 5.6037;
  const destLng = -0.187;
  const currentLat = destLat - 0.015;
  const currentLng = destLng - 0.02;

  return recordCourierLocation({
    orderId,
    orderNumber: fallbackOrderNumber,
    courierName: "Kwame Mensah",
    courierPhone: "+233 24 123 4567",
    vehicleType: "motorcycle",
    currentLatitude: currentLat,
    currentLongitude: currentLng,
    destinationLatitude: destLat,
    destinationLongitude: destLng,
    speedKmh: 38,
    headingDegrees: 45,
  });
}
