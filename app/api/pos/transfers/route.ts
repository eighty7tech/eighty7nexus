import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { PosTransfer } from "@/models/pos-transfer.model";
import { Product } from "@/models/product.model";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

/**
 * GET /api/pos/transfers
 * Lists active and past inter-branch stock transfer manifests.
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
    const status = searchParams.get("status") || "all";
    const q = searchParams.get("q")?.trim() || "";

    const query: Record<string, unknown> = {};

    if (status !== "all") {
      query.status = status;
    }

    if (q) {
      const regex = new RegExp(q, "i");
      query.$or = [
        { transferNumber: regex },
        { sourceBranchName: regex },
        { targetBranchName: regex },
        { "items.name": regex },
        { "items.sku": regex },
      ];
    }

    const transfers = await PosTransfer.find(query)
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return NextResponse.json({
      success: true,
      data: transfers,
    });
  } catch (error) {
    console.error("Failed to fetch POS transfers:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch transfers" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/pos/transfers
 * Creates a new outbound inter-branch transfer manifest.
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
    const {
      sourceBranchId,
      sourceBranchName = "Main Store",
      targetBranchId,
      targetBranchName,
      items,
      notes,
    } = body;

    if (!targetBranchName || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, message: "Destination branch and items are required" },
        { status: 400 },
      );
    }

    // Generate unique sequential transfer number: TRF-XXXXXX
    const count = await PosTransfer.countDocuments();
    const transferNumber = `TRF-${(count + 1).toString().padStart(6, "0")}`;

    const formattedItems = items.map((it: any) => ({
      productId: String(it.productId),
      variantId: it.variantId ? String(it.variantId) : undefined,
      sku: it.sku || "UNKNOWN",
      name: it.name || "Item",
      barcode: it.barcode,
      quantityExpected: Math.max(1, Number(it.quantity) || 1),
      quantityReceived: 0,
      discrepancy: 0,
    }));

    // Deduct stock from source branch
    for (const it of formattedItems) {
      if (it.productId) {
        try {
          await Product.findByIdAndUpdate(it.productId, {
            $inc: { stock: -it.quantityExpected },
          });
        } catch (err) {
          console.error("Failed to decrement source stock:", err);
        }
      }
    }

    const transfer = await PosTransfer.create({
      transferNumber,
      sourceBranchId,
      sourceBranchName,
      targetBranchId,
      targetBranchName,
      items: formattedItems,
      status: "in_transit",
      dispatchedBy: {
        cashierId: user.id || "staff",
        cashierName: user.name || "Staff",
        date: new Date(),
      },
      notes,
    });

    // Transfer manifest logged in database

    return NextResponse.json({
      success: true,
      message: `Transfer manifest ${transferNumber} created!`,
      data: transfer,
    });
  } catch (error) {
    console.error("Failed to create POS transfer:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create transfer manifest" },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/pos/transfers
 * Commits inbound stock receiving, calculates discrepancies, and restocks inventory.
 */
export async function PATCH(req: NextRequest) {
  try {
    await connectDB();
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    const user = session.user;

    const body = await req.json();
    const { transferId, receivedItems, notes } = body;

    if (!transferId || !Array.isArray(receivedItems)) {
      return NextResponse.json(
        { success: false, message: "transferId and receivedItems are required" },
        { status: 400 },
      );
    }

    const transfer = await PosTransfer.findById(transferId);
    if (!transfer) {
      return NextResponse.json(
        { success: false, message: "Transfer manifest not found" },
        { status: 404 },
      );
    }

    if (transfer.status === "received") {
      return NextResponse.json(
        { success: false, message: "This transfer has already been received." },
        { status: 400 },
      );
    }

    let hasDiscrepancy = false;

    // Map received items
    const receivedMap = new Map<string, number>();
    receivedItems.forEach((r: { sku: string; quantity: number }) => {
      receivedMap.set(r.sku, (receivedMap.get(r.sku) || 0) + (Number(r.quantity) || 0));
    });

    for (const item of transfer.items) {
      const rec = receivedMap.get(item.sku) ?? 0;
      item.quantityReceived = rec;
      item.discrepancy = item.quantityExpected - rec;

      if (item.discrepancy !== 0) {
        hasDiscrepancy = true;
      }

      // Restock inventory into destination branch
      if (item.productId && rec > 0) {
        try {
          await Product.findByIdAndUpdate(item.productId, {
            $inc: { stock: rec },
          });
        } catch (err) {
          console.error("Failed to restock destination product:", err);
        }
      }
    }

    transfer.status = hasDiscrepancy ? "discrepancy" : "received";
    transfer.receivedBy = {
      cashierId: user.id || "staff",
      cashierName: user.name || "Staff",
      date: new Date(),
      notes,
    };

    await transfer.save();

    // Receiving logged on transfer record

    return NextResponse.json({
      success: true,
      message: `Transfer ${transfer.transferNumber} received successfully!`,
      data: transfer,
    });
  } catch (error) {
    console.error("Failed to commit transfer receiving:", error);
    return NextResponse.json(
      { success: false, message: "Failed to receive transfer" },
      { status: 500 },
    );
  }
}
