import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Order } from "@/models/order.model";
import { Product } from "@/models/product.model";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { ORDER_STATUS } from "@/config/app.config";
import { generateBopisPickupToken } from "@/lib/shipping/bopis-handover";

/**
 * GET /api/pos/bopis
 * Retrieves click-and-collect orders for in-store pickup or receipt return inspection.
 */
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    const user = session.user;

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim() || "";
    const statusTab = searchParams.get("status") || "pickup"; // "pickup" | "completed" | "returns"

    const query: Record<string, unknown> = {};

    if (q) {
      const regex = new RegExp(q, "i");
      query.$or = [
        { orderNumber: regex },
        { "shippingAddress.fullName": regex },
        { "shippingAddress.phone": regex },
        { "customer.name": regex },
        { "customer.phone": regex },
        { "customer.email": regex },
      ];
    } else if (statusTab === "pickup") {
      // Orders awaiting store pickup
      query.status = {
        $in: [
          ORDER_STATUS.PENDING,
          ORDER_STATUS.PROCESSING,
          "ready_for_pickup",
        ],
      };
    } else if (statusTab === "completed") {
      // Handed over today or delivered
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      query.$or = [
        { "bopisHandoff.handedOverAt": { $gte: startOfDay } },
        { status: ORDER_STATUS.DELIVERED, updatedAt: { $gte: startOfDay } },
      ];
    }

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    // Map and enrich with verification PIN data
    const enrichedOrders = orders.map((order) => {
      let pin = "";
      try {
        const token = generateBopisPickupToken({
          orderId: String(order._id),
          orderNumber: order.orderNumber,
          stationName: (order as unknown as { pickupStationName?: string }).pickupStationName || "Store Pickup",
        });
        pin = token.pin;
      } catch {
        // fallback pin
        pin = String(order.orderNumber).replace(/\D/g, "").slice(-6) || "123456";
      }

      return {
        ...order,
        pickupPin: pin,
      };
    });

    return NextResponse.json({
      success: true,
      data: enrichedOrders,
    });
  } catch (error) {
    console.error("Failed to fetch BOPIS orders:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch orders" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/pos/bopis
 * Completes customer pickup handover with digital signature and optional verification PIN.
 */
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    const user = session.user;

    const body = await req.json();
    const { orderId, pin, recipientName, signatureData, staffNotes } = body;

    if (!orderId) {
      return NextResponse.json(
        { success: false, message: "orderId is required" },
        { status: 400 },
      );
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json(
        { success: false, message: "Order not found" },
        { status: 404 },
      );
    }

    // Verify PIN if provided
    if (pin) {
      let expectedPin = "";
      try {
        const token = generateBopisPickupToken({
          orderId: String(order._id),
          orderNumber: order.orderNumber,
          stationName: (order as unknown as { pickupStationName?: string }).pickupStationName || "Store Pickup",
        });
        expectedPin = token.pin;
      } catch {
        expectedPin = String(order.orderNumber).replace(/\D/g, "").slice(-6) || "123456";
      }

      if (pin.trim() !== expectedPin.trim()) {
        return NextResponse.json(
          { success: false, message: "Invalid pickup PIN" },
          { status: 400 },
        );
      }
    }

    // Record handover details
    const now = new Date();
    (order as unknown as { bopisHandoff: Record<string, unknown> }).bopisHandoff = {
      recipientName: recipientName || order.shippingAddress?.fullName || "Customer",
      signatureData: signatureData || null,
      handedOverAt: now,
      handedOverBy: user.name || "Staff",
      staffNotes: staffNotes || null,
    };

    order.status = ORDER_STATUS.DELIVERED;
    if (order.fulfillment) {
      order.fulfillment.status = "delivered";
      order.fulfillment.deliveredAt = now;
    }

    await order.save();

    // Handover logged in order metadata

    return NextResponse.json({
      success: true,
      message: `Order #${order.orderNumber} successfully handed over!`,
      data: order,
    });
  } catch (error) {
    console.error("Failed to complete BOPIS handover:", error);
    return NextResponse.json(
      { success: false, message: "Failed to process pickup handover" },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/pos/bopis
 * Processes in-store receipt barcode returns and line item exchanges.
 */
export async function PUT(req: NextRequest) {
  try {
    await connectDB();
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    const user = session.user;

    const body = await req.json();
    const { orderId, itemsToReturn, refundMethod, restockInventory = true, notes } = body;

    if (!orderId || !Array.isArray(itemsToReturn) || itemsToReturn.length === 0) {
      return NextResponse.json(
        { success: false, message: "orderId and return items are required" },
        { status: 400 },
      );
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json(
        { success: false, message: "Order not found" },
        { status: 404 },
      );
    }

    let totalRefundAmount = 0;

    for (const returnItem of itemsToReturn) {
      const lineItem = (order.items as any[]).find(
        (it: any) => String(it._id || it.productId) === String(returnItem.itemId || returnItem.productId),
      );

      if (!lineItem) continue;

      const qtyAvailableToReturn = lineItem.quantity - (lineItem.returnedQuantity || 0);
      const qtyToReturn = Math.min(Number(returnItem.quantity) || 1, qtyAvailableToReturn);

      if (qtyToReturn <= 0) continue;

      lineItem.returnedQuantity = (lineItem.returnedQuantity || 0) + qtyToReturn;
      const lineRefund = lineItem.price * qtyToReturn;
      totalRefundAmount += lineRefund;

      // Restock inventory if requested
      if (restockInventory && lineItem.productId) {
        try {
          await Product.findByIdAndUpdate(lineItem.productId, {
            $inc: { stock: qtyToReturn },
          });
        } catch (restockErr) {
          console.error("Failed to restock returned item:", restockErr);
        }
      }
    }

    // Determine order status
    const allItemsReturned = (order.items as any[]).every(
      (it: any) => (it.returnedQuantity || 0) >= it.quantity,
    );
    order.status = allItemsReturned
      ? ORDER_STATUS.RETURNED
      : ORDER_STATUS.PARTIALLY_RETURNED;

    await order.save();

    // Return logged on order record

    return NextResponse.json({
      success: true,
      message: "Return processed successfully",
      data: {
        orderId: String(order._id),
        orderNumber: order.orderNumber,
        refundAmount: totalRefundAmount,
        refundMethod: refundMethod || "original",
        status: order.status,
      },
    });
  } catch (error) {
    console.error("Failed to process return:", error);
    return NextResponse.json(
      { success: false, message: "Failed to process return" },
      { status: 500 },
    );
  }
}
