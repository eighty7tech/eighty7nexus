"use client";

import { useEffect, useState } from "react";
import {
  Navigation,
  MapPin,
  Phone,
  Bike,
  Truck,
  Clock,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import type { CourierTelemetryState } from "@/lib/shipping/courier-telemetry";

export function LiveCourierTrackingMap(props: {
  orderId: string;
  orderNumber?: string;
}) {
  const [telemetry, setTelemetry] = useState<CourierTelemetryState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function fetchTelemetry() {
      try {
        const res = await fetch(
          `/api/shipping/courier-telemetry?orderId=${encodeURIComponent(
            props.orderId,
          )}&orderNumber=${encodeURIComponent(props.orderNumber || "")}`,
        );
        if (res.ok) {
          const data = await res.json();
          if (mounted && data.telemetry) {
            setTelemetry(data.telemetry);
          }
        }
      } catch (err) {
        console.warn("Failed to fetch courier telemetry:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 10000); // Polling every 10s

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [props.orderId, props.orderNumber]);

  if (loading && !telemetry) {
    return (
      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm animate-pulse space-y-4">
        <div className="h-6 w-48 bg-muted rounded-full" />
        <div className="h-64 bg-muted rounded-2xl" />
      </div>
    );
  }

  if (!telemetry) return null;

  const isDelivered = telemetry.status === "DELIVERED";

  return (
    <div className="rounded-3xl border border-border bg-card overflow-hidden shadow-xl text-card-foreground">
      {/* Header */}
      <div className="p-6 bg-gradient-to-r from-slate-900 to-slate-950 text-white flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Navigation className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="font-bold text-base">Live Courier GPS Telemetry</h3>
            <p className="text-xs text-slate-400 font-mono">
              Order #{telemetry.orderNumber}
            </p>
          </div>
        </div>

        <div className="text-right">
          {isDelivered ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold text-xs border border-emerald-500/30">
              <CheckCircle2 className="w-3.5 h-3.5" /> Delivered
            </span>
          ) : (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-extrabold text-amber-400">
                ETA ~{telemetry.estimatedMinutesToArrival} min
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Simulated Live Vector Map Canvas */}
      <div className="relative h-64 bg-slate-950 overflow-hidden flex items-center justify-center border-b border-border">
        {/* Radar grid backdrop */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:24px_24px] opacity-40" />

        {/* Route Line */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <line
            x1="25%"
            y1="60%"
            x2="75%"
            y2="35%"
            stroke="#f59e0b"
            strokeWidth="3"
            strokeDasharray="6 6"
            className="animate-pulse"
          />
        </svg>

        {/* Courier Position Marker */}
        <div className="absolute left-[25%] top-[60%] -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center">
          <div className="relative flex items-center justify-center">
            <span className="absolute w-12 h-12 rounded-full bg-amber-400/20 animate-ping" />
            <div className="w-9 h-9 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/50">
              {telemetry.vehicleType === "motorcycle" ? (
                <Bike className="w-5 h-5" />
              ) : (
                <Truck className="w-5 h-5" />
              )}
            </div>
          </div>
          <span className="mt-1 text-[10px] font-bold bg-slate-900/90 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/30 font-mono shadow">
            {telemetry.courierName} ({telemetry.speedKmh} km/h)
          </span>
        </div>

        {/* Destination Pin Marker */}
        <div className="absolute left-[75%] top-[35%] -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center">
          <div className="w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/50">
            <MapPin className="w-5 h-5" />
          </div>
          <span className="mt-1 text-[10px] font-bold bg-slate-900/90 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30 font-mono shadow">
            Delivery Address
          </span>
        </div>

        {/* Distance Remaining Overlay */}
        <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 font-mono flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span>{telemetry.distanceRemainingKm} km remaining</span>
        </div>
      </div>

      {/* Courier Driver Card */}
      <div className="p-6 flex flex-wrap items-center justify-between gap-4 bg-muted/30">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 font-bold text-lg">
            {telemetry.courierName.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-sm text-foreground">
                {telemetry.courierName}
              </h4>
              <span className="flex items-center gap-0.5 text-[10px] font-medium text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">
                <ShieldCheck className="w-3 h-3" /> Verified Rider
              </span>
            </div>
            <p className="text-xs text-muted-foreground capitalize">
              {telemetry.vehicleType} Courier · Express Dispatch
            </p>
          </div>
        </div>

        {telemetry.courierPhone && (
          <a
            href={`tel:${telemetry.courierPhone}`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 transition-all shadow-sm"
          >
            <Phone className="w-3.5 h-3.5" /> Call Rider
          </a>
        )}
      </div>
    </div>
  );
}
