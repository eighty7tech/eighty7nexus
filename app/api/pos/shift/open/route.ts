import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { POSShift, ShiftStatus } from "@/models/pos-shift.model";
import { successResponse } from "@/lib/api/response";
import {
  handleApiError,
  AuthenticationError,
  AuthorizationError,
  ValidationError,
} from "@/lib/api/errors";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { USER_ROLES } from "@/config/app.config";
import { isStaffRole } from "@/lib/staff-role";
import { canAccessPOS } from "@/lib/rbac";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) throw new AuthenticationError();
    const role = session.user.role;
    if (
      role !== USER_ROLES.ADMIN &&
      role !== USER_ROLES.VENDOR &&
      !isStaffRole(role)
    ) {
      throw new AuthorizationError();
    }

    await connectDB();
    if (!(await canAccessPOS(session.user))) {
      throw new AuthorizationError();
    }

    const body = await request.json();
    const { locationId, startingCash, notes } = body;

    if (!locationId) {
      throw new ValidationError("Location ID is required");
    }

    if (startingCash === undefined || startingCash < 0) {
      throw new ValidationError("Starting cash must be a valid positive amount");
    }

    // Check if there's already an open shift for this user and location
    const existingShift = await POSShift.findOne({
      cashierId: session.user.id,
      locationId,
      status: ShiftStatus.OPEN,
    });

    if (existingShift) {
      throw new ValidationError("You already have an open shift at this location. Close it first.");
    }

    const shift = await POSShift.create({
      cashierId: session.user.id,
      locationId,
      status: ShiftStatus.OPEN,
      startingCash,
      expectedCash: startingCash, // Initially, expected cash is starting cash
      expectedCard: 0,
      notes,
    });

    return successResponse(
      { shift },
      "Shift opened successfully",
    );
  } catch (error) {
    return handleApiError(error);
  }
}
