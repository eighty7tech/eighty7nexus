import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { PickupStation } from "@/models";
import {
  handleApiError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
} from "@/lib/api/errors";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { USER_ROLES } from "@/config/app.config";
import { rateLimitByUser } from "@/lib/api/rate-limit-middleware";
import { isValidObjectId } from "mongoose";

/**
 * GET /api/admin/pickup-stations/[id]
 * Get a single pickup station
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) throw new AuthenticationError();
    if (session.user.role !== USER_ROLES.ADMIN) throw new AuthorizationError();

    await rateLimitByUser(
      request,
      session.user.id,
      "admin:pickup-stations:read",
      "lenient",
      session.user.role
    );

    const { id } = await params;
    if (!isValidObjectId(id)) throw new NotFoundError("Pickup station not found");

    await connectDB();
    const pickupStation = await PickupStation.findById(id).lean();

    if (!pickupStation) throw new NotFoundError("Pickup station not found");

    return NextResponse.json(pickupStation);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PUT /api/admin/pickup-stations/[id]
 * Update a pickup station
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) throw new AuthenticationError();
    if (session.user.role !== USER_ROLES.ADMIN) throw new AuthorizationError();

    await rateLimitByUser(
      request,
      session.user.id,
      "admin:pickup-stations:update",
      "strict",
      session.user.role
    );

    const { id } = await params;
    if (!isValidObjectId(id)) throw new NotFoundError("Pickup station not found");

    const body = await request.json();
    await connectDB();

    const pickupStation = await PickupStation.findByIdAndUpdate(
      id,
      { $set: body },
      { returnDocument: 'after', runValidators: true }
    ).lean();

    if (!pickupStation) throw new NotFoundError("Pickup station not found");

    return NextResponse.json(pickupStation);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/admin/pickup-stations/[id]
 * Delete a pickup station
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) throw new AuthenticationError();
    if (session.user.role !== USER_ROLES.ADMIN) throw new AuthorizationError();

    await rateLimitByUser(
      request,
      session.user.id,
      "admin:pickup-stations:delete",
      "strict",
      session.user.role
    );

    const { id } = await params;
    if (!isValidObjectId(id)) throw new NotFoundError("Pickup station not found");

    await connectDB();
    const pickupStation = await PickupStation.findByIdAndDelete(id).lean();

    if (!pickupStation) throw new NotFoundError("Pickup station not found");

    return NextResponse.json({ message: "Pickup station deleted successfully" });
  } catch (error) {
    return handleApiError(error);
  }
}
