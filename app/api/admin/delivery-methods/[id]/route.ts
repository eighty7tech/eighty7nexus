import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { DeliveryMethod } from "@/models";
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
 * GET /api/admin/delivery-methods/[id]
 * Get a single delivery method
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
      "admin:delivery-methods:read",
      "lenient",
      session.user.role
    );

    const { id } = await params;
    if (!isValidObjectId(id)) throw new NotFoundError("Delivery method not found");

    await connectDB();
    const deliveryMethod = await DeliveryMethod.findById(id).lean();

    if (!deliveryMethod) throw new NotFoundError("Delivery method not found");

    return NextResponse.json(deliveryMethod);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PUT /api/admin/delivery-methods/[id]
 * Update a delivery method
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
      "admin:delivery-methods:update",
      "strict",
      session.user.role
    );

    const { id } = await params;
    if (!isValidObjectId(id)) throw new NotFoundError("Delivery method not found");

    const body = await request.json();
    await connectDB();

    const deliveryMethod = await DeliveryMethod.findByIdAndUpdate(
      id,
      { $set: body },
      { returnDocument: 'after', runValidators: true }
    ).lean();

    if (!deliveryMethod) throw new NotFoundError("Delivery method not found");

    return NextResponse.json(deliveryMethod);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/admin/delivery-methods/[id]
 * Delete a delivery method
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
      "admin:delivery-methods:delete",
      "strict",
      session.user.role
    );

    const { id } = await params;
    if (!isValidObjectId(id)) throw new NotFoundError("Delivery method not found");

    await connectDB();
    const deliveryMethod = await DeliveryMethod.findByIdAndDelete(id).lean();

    if (!deliveryMethod) throw new NotFoundError("Delivery method not found");

    return NextResponse.json({ message: "Delivery method deleted successfully" });
  } catch (error) {
    return handleApiError(error);
  }
}
