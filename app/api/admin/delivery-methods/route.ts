import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { DeliveryMethod } from "@/models";
import { paginatedResponse } from "@/lib/api/response";
import {
  handleApiError,
  AuthenticationError,
  AuthorizationError,
} from "@/lib/api/errors";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { USER_ROLES } from "@/config/app.config";
import { validateQuery } from "@/lib/api/validate";
import { AdminListQuerySchema } from "@/lib/validations";
import { rateLimitByUser } from "@/lib/api/rate-limit-middleware";

/**
 * GET /api/admin/delivery-methods
 * Get all delivery methods
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) throw new AuthenticationError();
    if (session.user.role !== USER_ROLES.ADMIN) throw new AuthorizationError();

    await rateLimitByUser(
      request,
      session.user.id,
      "admin:delivery-methods:list",
      "lenient",
      session.user.role
    );

    const { page, limit, search, sortOrder } = validateQuery(
      request,
      AdminListQuerySchema
    );

    await connectDB();

    const skip = (page - 1) * limit;
    const andConditions: Record<string, unknown>[] = [];

    if (search) {
      andConditions.push({
        $or: [
          { name: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
        ],
      });
    }

    const query = andConditions.length > 0 ? { $and: andConditions } : {};

    const [deliveryMethods, total] = await Promise.all([
      DeliveryMethod.find(query)
        .sort({ createdAt: sortOrder === "asc" ? 1 : -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      DeliveryMethod.countDocuments(query),
    ]);

    return paginatedResponse(deliveryMethods, page, limit, total);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/admin/delivery-methods
 * Create a new delivery method
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) throw new AuthenticationError();
    if (session.user.role !== USER_ROLES.ADMIN) throw new AuthorizationError();

    await rateLimitByUser(
      request,
      session.user.id,
      "admin:delivery-methods:create",
      "strict",
      session.user.role
    );

    const body = await request.json();

    await connectDB();

    const newDeliveryMethod = await DeliveryMethod.create({
      name: body.name,
      description: body.description,
      logoUrl: body.logoUrl,
      carrierCode: body.carrierCode,
      trackingUrlTemplate: body.trackingUrlTemplate,
      type: body.type,
      baseCost: body.baseCost,
      perKmCost: body.perKmCost,
      perKgCost: body.perKgCost,
      freeShippingThreshold: body.freeShippingThreshold,
      maxDistanceKm: body.maxDistanceKm,
      estimatedDaysMin: body.estimatedDaysMin,
      estimatedDaysMax: body.estimatedDaysMax,
      isActive: body.isActive ?? true,
      isInternational: body.isInternational ?? false,
      availableRegions: body.availableRegions ?? [],
    });

    return NextResponse.json(newDeliveryMethod, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
