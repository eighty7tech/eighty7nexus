import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { PickupStation } from "@/models";
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
 * GET /api/admin/pickup-stations
 * Get all pickup stations
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) throw new AuthenticationError();
    if (session.user.role !== USER_ROLES.ADMIN) throw new AuthorizationError();

    await rateLimitByUser(
      request,
      session.user.id,
      "admin:pickup-stations:list",
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
          { region: { $regex: search, $options: "i" } },
          { district: { $regex: search, $options: "i" } },
        ],
      });
    }

    const query = andConditions.length > 0 ? { $and: andConditions } : {};

    const [pickupStations, total] = await Promise.all([
      PickupStation.find(query)
        .sort({ createdAt: sortOrder === "asc" ? 1 : -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      PickupStation.countDocuments(query),
    ]);

    return paginatedResponse(pickupStations, page, limit, total);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/admin/pickup-stations
 * Create a new pickup station
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) throw new AuthenticationError();
    if (session.user.role !== USER_ROLES.ADMIN) throw new AuthorizationError();

    await rateLimitByUser(
      request,
      session.user.id,
      "admin:pickup-stations:create",
      "strict",
      session.user.role
    );

    const body = await request.json();
    await connectDB();

    const newPickupStation = await PickupStation.create({
      name: body.name,
      region: body.region,
      district: body.district,
      address: body.address,
      location: body.location ?? { type: "Point", coordinates: [0, 0] },
      phone: body.phone,
      operatingHours: body.operatingHours,
      capacity: body.capacity ?? 100,
      specialInstructions: body.specialInstructions,
      isActive: body.isActive ?? true,
    });

    return NextResponse.json(newPickupStation, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
