import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { POSTransaction, Product } from "@/models";

export async function POST(req: Request) {
  try {
    await connectDB();
    const { transactions } = await req.json();

    if (!Array.isArray(transactions) || transactions.length === 0) {
      return NextResponse.json({ success: false, error: "No transactions provided" }, { status: 400 });
    }

    const results = {
      processed: 0,
      skipped: 0,
      errors: 0,
    };

    for (const tx of transactions) {
      try {
        // 1. Check Idempotency (prevent duplicate syncs if network drops mid-request)
        const existingTx = await POSTransaction.findOne({ idempotencyKey: tx.id });
        if (existingTx) {
          results.skipped++;
          continue;
        }

        // 2. Format Items
        const formattedItems = tx.cart.map((item: any) => ({
          productId: item.product._id,
          variantId: item.variantId || undefined,
          name: item.product.name,
          sku: item.product.sku,
          barcode: item.product.barcode,
          price: item.price,
          quantity: item.quantity,
          lineTotal: item.price * item.quantity,
        }));

        const subtotal = formattedItems.reduce((acc: number, item: any) => acc + item.lineTotal, 0);
        const taxTotal = subtotal * 0.1; // Using the hardcoded 10% from the frontend for now
        const grandTotal = subtotal + taxTotal;

        // 3. Create POS Transaction Record
        await POSTransaction.create({
          idempotencyKey: tx.id,
          items: formattedItems,
          subtotal,
          taxTotal,
          grandTotal,
          tenderType: tx.tenderType,
          status: "completed",
          offlineCreated: true,
          syncedAt: new Date(),
        });

        // 4. Decrement Inventory Live
        for (const item of formattedItems) {
          if (item.variantId) {
             await Product.updateOne(
               { _id: item.productId, "variants._id": item.variantId },
               { $inc: { "variants.$.inventory": -item.quantity, "inventory": -item.quantity } }
             );
          } else {
             await Product.updateOne(
               { _id: item.productId },
               { $inc: { inventory: -item.quantity } }
             );
          }
        }

        results.processed++;
      } catch (err) {
        console.error(`Failed to process TX ${tx.id}:`, err);
        results.errors++;
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    console.error("POS Batch Sync Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process batch sync" },
      { status: 500 }
    );
  }
}
