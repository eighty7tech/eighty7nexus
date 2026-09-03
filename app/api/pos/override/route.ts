import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { StaffProfile } from "@/models/staff-profile.model";
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
import { STAFF_PERMISSIONS } from "@/config/permissions.config";

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
    const { pin, action } = body;

    if (!pin) {
      throw new ValidationError("Manager PIN is required for override");
    }

    // Find a staff member with this PIN who has manager permissions
    const manager = await StaffProfile.findOne({
      managerPin: pin,
      isActive: true,
      permissions: { $in: [STAFF_PERMISSIONS.MANAGE_POS] }
    }).populate("userId", "name email");

    if (!manager) {
      throw new ValidationError("Invalid Manager PIN or insufficient permissions");
    }

    return successResponse(
      { 
        approvedBy: manager.userId.name,
        approvedById: manager.userId._id,
        action
      },
      "Manager override approved",
    );
  } catch (error) {
    return handleApiError(error);
  }
}
