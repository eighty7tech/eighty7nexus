/**
 * BOPIS (Buy Online, Pick Up In Store) Click-and-Collect Handover Engine
 * Generates secure, tamper-proof pickup verification tokens and provides
 * rapid cashier barcode/QR scanning verification at retail store registers.
 */

import crypto from "crypto";
import { connectDB } from "@/lib/db";
import { Order } from "@/models/order.model";

const BOPIS_SECRET = process.env.BETTER_AUTH_SECRET || "eighty7-bopis-secret-key-default-2026";

export interface BopisPickupTokenData {
  orderId: string;
  orderNumber: string;
  pin: string; // 6-digit verification code
  qrData: string;
  stationName: string;
  expiresAt: Date;
}

/**
 * Generates a signed 6-digit pickup PIN and QR payload for customer pickup.
 */
export function generateBopisPickupToken(params: {
  orderId: string;
  orderNumber: string;
  stationName: string;
}): BopisPickupTokenData {
  // Generate deterministic but secure 6-digit PIN from orderId + secret
  const hmac = crypto.createHmac("sha256", BOPIS_SECRET);
  hmac.update(`${params.orderId}:${params.orderNumber}`);
  const hash = hmac.digest("hex");
  const pin = (parseInt(hash.substring(0, 6), 16) % 900000 + 100000).toString();

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 14); // Valid for 14 days

  const qrData = JSON.stringify({
    app: "Eighty7Nexus_BOPIS",
    orderId: params.orderId,
    orderNumber: params.orderNumber,
    pin,
    v: 1,
  });

  return {
    orderId: params.orderId,
    orderNumber: params.orderNumber,
    pin,
    qrData,
    stationName: params.stationName,
    expiresAt,
  };
}

/**
 * Validates a customer's pickup PIN or scanned QR payload at the store register.
 */
export async function verifyBopisPickup(params: {
  orderIdOrNumber: string;
  enteredPin: string;
  cashierUserId?: string;
}): Promise<{
  success: boolean;
  error?: string;
  order?: {
    id: string;
    orderNumber: string;
    customerName: string;
    itemCount: number;
    pickupStatus: string;
  };
}> {
  await connectDB();

  const query = params.orderIdOrNumber.match(/^[0-9a-fA-F]{24}$/)
    ? { _id: params.orderIdOrNumber }
    : { orderNumber: params.orderIdOrNumber };

  const order = await Order.findOne(query);
  if (!order) {
    return { success: false, error: "Order not found." };
  }

  // Generate expected PIN
  const expectedToken = generateBopisPickupToken({
    orderId: String(order._id),
    orderNumber: order.orderNumber || String(order._id),
    stationName: order.pickupStation?.name || "Store",
  });

  if (params.enteredPin.trim() !== expectedToken.pin) {
    return { success: false, error: "Invalid pickup PIN." };
  }

  // Mark order as fulfilled / picked up
  order.status = "delivered";
  order.fulfillmentStatus = "fulfilled";
  if (order.pickupStation) {
    order.pickupStation.pickedUpAt = new Date();
    order.pickupStation.verifiedBy = params.cashierUserId;
  }

  await order.save();

  return {
    success: true,
    order: {
      id: String(order._id),
      orderNumber: order.orderNumber || String(order._id),
      customerName: order.customer?.name || order.shippingAddress?.fullName || "Valued Customer",
      itemCount: order.items?.length || 0,
      pickupStatus: "COMPLETED",
    },
  };
}
