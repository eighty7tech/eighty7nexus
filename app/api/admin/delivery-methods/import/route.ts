import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { DeliveryMethod } from "@/models";
import { handleApiError, AuthenticationError, AuthorizationError } from "@/lib/api/errors";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { USER_ROLES } from "@/config/app.config";
import { rateLimitByUser } from "@/lib/api/rate-limit-middleware";

/**
 * POST /api/admin/delivery-methods/import
 * Bulk-import preset delivery methods (Ghana standard or Zara Express).
 * Skips methods that already exist by name to avoid duplicates.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) throw new AuthenticationError();
    if (session.user.role !== USER_ROLES.ADMIN) throw new AuthorizationError();

    await rateLimitByUser(
      request,
      session.user.id,
      "admin:delivery-methods:import",
      "strict",
      session.user.role
    );

    const body = await request.json();
    const { preset, methods } = body as {
      preset: string;
      methods: Array<{
        name: string;
        description?: string;
        logoUrl?: string;
        carrierCode?: string;
        trackingUrlTemplate?: string;
        type: string;
        baseCost: number;
        perKmCost?: number;
        perKgCost?: number;
        freeShippingThreshold?: number;
        maxDistanceKm?: number;
        estimatedDaysMin: number;
        estimatedDaysMax: number;
        isActive: boolean;
        isInternational: boolean;
        availableRegions: string[];
      }>;
    };

    if (!Array.isArray(methods) || methods.length === 0) {
      return NextResponse.json({ error: "No methods provided" }, { status: 400 });
    }

    await connectDB();

    // Fetch existing method names to avoid duplicates
    const existingNames = await DeliveryMethod.distinct("name");
    const existingNameSet = new Set(existingNames.map((n: string) => n.toLowerCase()));

    const toInsert = methods.filter(
      (m) => !existingNameSet.has(m.name.toLowerCase())
    );

    if (toInsert.length === 0) {
      return NextResponse.json({
        imported: 0,
        skipped: methods.length,
        message: "All methods already exist — nothing was imported.",
      });
    }

    const inserted = await DeliveryMethod.insertMany(
      toInsert.map((m) => ({
        name: m.name,
        description: m.description,
        logoUrl: m.logoUrl,
        carrierCode: m.carrierCode,
        trackingUrlTemplate: m.trackingUrlTemplate,
        type: m.type || "FLAT_RATE",
        baseCost: m.baseCost ?? 0,
        perKmCost: m.perKmCost ?? 0,
        perKgCost: m.perKgCost ?? 0,
        freeShippingThreshold: m.freeShippingThreshold,
        maxDistanceKm: m.maxDistanceKm,
        estimatedDaysMin: m.estimatedDaysMin ?? 1,
        estimatedDaysMax: m.estimatedDaysMax ?? 3,
        isActive: m.isActive ?? true,
        isInternational: m.isInternational ?? false,
        availableRegions: m.availableRegions ?? [],
        _importPreset: preset,
      }))
    );

    return NextResponse.json({
      imported: inserted.length,
      skipped: methods.length - inserted.length,
      preset,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
