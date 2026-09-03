import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { KitchenTicket, IKitchenTicket } from "@/models/kitchen-ticket.model";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { canAccessPOS } from "@/lib/rbac";
import { successResponse } from "@/lib/api/response";
import {
  handleApiError,
  AuthenticationError,
  AuthorizationError,
  ValidationError,
} from "@/lib/api/errors";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) throw new AuthenticationError();
    if (!(await canAccessPOS(session.user))) throw new AuthorizationError();

    await connectDB();

    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status") || "active";
    const station = searchParams.get("station");
    const locationId = searchParams.get("locationId");
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 50));

    const filter: Record<string, unknown> = {};

    if (statusParam === "active") {
      filter.status = { $in: ["queued", "in_progress", "ready"] };
    } else if (statusParam === "completed") {
      filter.status = "completed";
    } else if (statusParam === "recalled") {
      // Recent completed tickets for recall capability
      filter.status = "completed";
    } else if (statusParam !== "all") {
      filter.status = statusParam;
    }

    if (station && station !== "all") {
      filter.station = station;
    }

    if (locationId) {
      filter.locationId = locationId;
    }

    // Active orders show oldest first (FIFO - First In, First Out).
    // Completed/history orders show newest first.
    const sortOrder = statusParam === "completed" || statusParam === "recalled" ? -1 : 1;

    const tickets = await KitchenTicket.find(filter)
      .sort({ createdAt: sortOrder })
      .limit(limit)
      .lean();

    return successResponse({ tickets });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) throw new AuthenticationError();
    if (!(await canAccessPOS(session.user))) throw new AuthorizationError();

    await connectDB();

    const body = await request.json();
    const {
      orderId,
      orderNumber,
      channel = "pos",
      station = "kitchen",
      customerName,
      tableNumber,
      pagerNumber,
      pickupCode,
      locationId,
      items,
      notes,
      slaMinutes = 15,
    } = body;

    if (!orderId || !orderNumber) {
      throw new ValidationError("orderId and orderNumber are required");
    }

    if (!Array.isArray(items) || items.length === 0) {
      throw new ValidationError("At least one ticket item is required");
    }

    // Determine today's sequential ticket number
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const todayCount = await KitchenTicket.countDocuments({
      createdAt: { $gte: startOfDay },
      ...(locationId ? { locationId } : {}),
    });

    const ticketNumber = todayCount + 1;

    const ticket = await KitchenTicket.create({
      ticketNumber,
      orderId,
      orderNumber,
      channel,
      status: "queued",
      station,
      customerName,
      tableNumber,
      pagerNumber,
      pickupCode,
      locationId,
      items: items.map((it) => ({
        name: it.name,
        quantity: Number(it.quantity) || 1,
        sku: it.sku,
        variantName: it.variantName,
        notes: it.notes,
        isReady: false,
      })),
      notes,
      slaMinutes: Number(slaMinutes) || 15,
    });

    return successResponse({ ticket }, "Ticket created", 201);
  } catch (error) {
    return handleApiError(error);
  }
}
