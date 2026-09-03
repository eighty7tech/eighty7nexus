import { NextRequest } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { User, Order, Product } from "@/models";
import { CustomerProfile } from "@/models/customer-profile.model";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { canAccessPOS } from "@/lib/rbac";
import { successResponse } from "@/lib/api/response";
import {
  handleApiError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
} from "@/lib/api/errors";
import { POINTS_REDEMPTION_VALUE } from "@/lib/pos/loyalty-engine";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) throw new AuthenticationError();
    if (!(await canAccessPOS(session.user))) throw new AuthorizationError();

    await connectDB();

    const { id } = await context.params;

    const user = await User.findById(id).select("name email phone image createdAt").lean();
    if (!user) {
      throw new NotFoundError("Customer not found");
    }

    let profile = await CustomerProfile.findOne({ userId: user._id }).lean();
    if (!profile) {
      // Auto-initialize profile if missing
      profile = await CustomerProfile.create({
        userId: user._id,
        loyaltyPoints: 0,
        loyaltyTier: "bronze",
        lifetimePoints: 0,
        tags: [],
        notes: "",
      });
    }

    // Fetch past orders for this customer (matched by customerId or userId)
    const recentOrders = await Order.find({
      $or: [{ customerId: user._id }, { userId: user._id }],
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .select("orderNumber total status paymentMethod createdAt items")
      .lean();

    // Calculate lifetime metrics
    const orderCount = recentOrders.length;
    const totalSpent = recentOrders.reduce((acc, o) => acc + (o.total || 0), 0);
    const avgOrderValue = orderCount > 0 ? totalSpent / orderCount : 0;
    const lastOrderDate = recentOrders[0]?.createdAt || null;

    // Aggregate frequently purchased items
    const itemFrequencyMap = new Map<
      string,
      { productId: string; name: string; variantId?: string; count: number; price: number; image?: string }
    >();

    for (const ord of recentOrders) {
      if (Array.isArray(ord.items)) {
        for (const it of ord.items) {
          const key = `${it.productId}_${it.variantId || ""}`;
          const existing = itemFrequencyMap.get(key);
          if (existing) {
            existing.count += it.quantity || 1;
          } else {
            itemFrequencyMap.set(key, {
              productId: String(it.productId),
              name: it.name,
              variantId: it.variantId ? String(it.variantId) : undefined,
              count: it.quantity || 1,
              price: it.price,
              image: it.image,
            });
          }
        }
      }
    }

    const topItems = Array.from(itemFrequencyMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    const loyaltyPoints = profile.loyaltyPoints || 0;
    const redeemableValue = Math.round(loyaltyPoints * POINTS_REDEMPTION_VALUE * 100) / 100;

    return successResponse({
      customer: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        image: user.image,
        createdAt: user.createdAt,
      },
      loyalty: {
        points: loyaltyPoints,
        tier: profile.loyaltyTier || "bronze",
        lifetimePoints: profile.lifetimePoints || 0,
        redeemableValue,
      },
      metrics: {
        totalSpent,
        orderCount,
        avgOrderValue,
        lastOrderDate,
      },
      clienteling: {
        tags: profile.tags || [],
        notes: profile.notes || "",
        preferredPaymentMethod: profile.preferredPaymentMethod,
      },
      recentOrders: recentOrders.map((o) => ({
        _id: o._id,
        orderNumber: o.orderNumber,
        total: o.total,
        status: o.status,
        paymentMethod: o.paymentMethod,
        createdAt: o.createdAt,
        items: (
          (o.items as Array<{
            productId: unknown;
            name: string;
            variantId?: unknown;
            quantity: number;
            price: number;
            image?: string;
          }>) || []
        ).map((it) => ({
          productId: String(it.productId),
          name: it.name,
          variantId: it.variantId ? String(it.variantId) : undefined,
          quantity: it.quantity,
          price: it.price,
          image: it.image,
        })),
      })),
      topItems,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) throw new AuthenticationError();
    if (!(await canAccessPOS(session.user))) throw new AuthorizationError();

    await connectDB();

    const { id } = await context.params;
    const body = await request.json();
    const { tags, notes, phone } = body;

    let profile = await CustomerProfile.findOne({ userId: id });
    if (!profile) {
      profile = new CustomerProfile({
        userId: id,
        loyaltyPoints: 0,
        loyaltyTier: "bronze",
      });
    }

    if (Array.isArray(tags)) {
      profile.tags = tags.filter((t): t is string => typeof t === "string" && t.trim().length > 0);
    }

    if (typeof notes === "string") {
      profile.notes = notes.trim();
    }

    await profile.save();

    if (typeof phone === "string") {
      await User.findByIdAndUpdate(id, { phone: phone.trim() });
    }

    return successResponse({
      tags: profile.tags,
      notes: profile.notes,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
