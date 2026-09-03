import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  parseCsvBulkOrder,
  parseEdi850PurchaseOrder,
  validateAndPriceBulkOrder,
} from "@/lib/wholesale/bulk-order-engine";

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { rawText, format, purchaseOrderNumber, buyerName } = body;

    if (!rawText || typeof rawText !== "string") {
      return NextResponse.json({ error: "rawText content is required." }, { status: 400 });
    }

    const detectedFormat = format || (rawText.includes("ISA*") || rawText.includes("BEG*") ? "EDI_850" : "CSV");

    if (detectedFormat === "EDI_850") {
      const ediResult = parseEdi850PurchaseOrder(rawText);
      const validation = await validateAndPriceBulkOrder({
        sourceType: "EDI_850",
        purchaseOrderNumber: ediResult.purchaseOrderNumber || purchaseOrderNumber,
        buyerName: ediResult.buyerName || buyerName,
        items: ediResult.items,
      });
      return NextResponse.json({ success: true, ...validation });
    }

    const csvItems = parseCsvBulkOrder(rawText);
    const validation = await validateAndPriceBulkOrder({
      sourceType: "CSV",
      purchaseOrderNumber,
      buyerName,
      items: csvItems,
    });

    return NextResponse.json({ success: true, ...validation });
  } catch (error: unknown) {
    console.error("Bulk order ingestion error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process bulk order" },
      { status: 500 },
    );
  }
}
