import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/user.model";
import { successResponse, notFoundResponse } from "@/lib/api/response";
import { handleApiError } from "@/lib/api/errors";
import { rateLimitByIP } from "@/lib/api/rate-limit-middleware";
import { z } from "zod";

const ResolveIdentifierSchema = z.object({
  identifier: z.string().trim().min(1, "Identifier is required"),
});

/**
 * POST /api/auth/resolve-identifier
 * Resolves a username or name or email identifier into the user's primary email.
 * This allows customers/users to sign in with their name or their email interchangeably.
 */
export async function POST(request: NextRequest) {
  try {
    await rateLimitByIP(request, "lenient");
    await connectDB();

    const body = await request.json();
    const { identifier } = ResolveIdentifierSchema.parse(body);
    const trimmed = identifier.trim();

    // If it's already an email format, normalize and return directly
    if (trimmed.includes("@")) {
      return successResponse({ email: trimmed.toLowerCase() });
    }

    // Escape regex special characters for safe name matching
    const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    // Case-insensitive exact name lookup
    const user = await User.findOne({
      name: { $regex: new RegExp(`^${escaped}$`, "i") },
    })
      .select("email")
      .lean<{ email?: string }>();

    if (user?.email) {
      return successResponse({ email: user.email.toLowerCase() });
    }

    // If no exact match, return as-is (Better Auth will handle invalid credentials)
    return successResponse({ email: trimmed });
  } catch (error) {
    return handleApiError(error);
  }
}
