import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { KitchenTicket } from "@/models/kitchen-ticket.model";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { canAccessPOS } from "@/lib/rbac";
import { successResponse } from "@/lib/api/response";
import {
  handleApiError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ValidationError,
} from "@/lib/api/errors";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) throw new AuthenticationError();
    if (!(await canAccessPOS(session.user))) throw new AuthorizationError();

    await connectDB();

    const { id } = await context.params;
    const body = await request.json();
    const { status, toggleItemIndex, recall } = body;

    const ticket = await KitchenTicket.findById(id);
    if (!ticket) {
      throw new NotFoundError("Kitchen ticket not found");
    }

    const now = new Date();

    if (typeof recall === "boolean" && recall) {
      // Recalls a bumped/completed ticket back to ready
      ticket.status = "ready";
      ticket.completedAt = undefined;
    } else if (status) {
      const validStatuses = [
        "queued",
        "in_progress",
        "ready",
        "completed",
        "cancelled",
      ];
      if (!validStatuses.includes(status)) {
        throw new ValidationError(`Invalid ticket status: ${status}`);
      }

      ticket.status = status;
      if (status === "in_progress" && !ticket.startedAt) {
        ticket.startedAt = now;
      } else if (status === "ready" && !ticket.readyAt) {
        ticket.readyAt = now;
      } else if (status === "completed") {
        ticket.completedAt = now;
      }
    }

    if (typeof toggleItemIndex === "number") {
      if (ticket.items && ticket.items[toggleItemIndex]) {
        ticket.items[toggleItemIndex].isReady = !ticket.items[toggleItemIndex].isReady;
        ticket.markModified("items");
      }
    }

    await ticket.save();

    return successResponse({ ticket });
  } catch (error) {
    return handleApiError(error);
  }
}
