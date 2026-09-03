/**
 * B2B Bulk EDI 850 & CSV Order Ingestion Engine
 * Ingests enterprise EDI 850 Purchase Orders (ANSI X12) and bulk CSV spreadsheets,
 * validates SKU inventory availability in real-time, and applies wholesale volume tier pricing.
 */

import { connectDB } from "@/lib/db";
import { Product } from "@/models/product.model";

export interface ParsedBulkLineItem {
  lineIndex: number;
  sku: string;
  quantity: number;
  expectedUnitPrice?: number;
  customerItemNote?: string;
}

export interface ValidatedBulkItem {
  lineIndex: number;
  sku: string;
  productId?: string;
  productName: string;
  requestedQuantity: number;
  availableStock: number;
  isAvailable: boolean;
  standardPrice: number;
  appliedWholesalePrice: number;
  discountPercentage: number;
  lineTotal: number;
  error?: string;
}

export interface BulkOrderProcessingResult {
  sourceType: "CSV" | "EDI_850";
  purchaseOrderNumber?: string;
  buyerName?: string;
  totalLines: number;
  validLinesCount: number;
  invalidLinesCount: number;
  allLinesAvailable: boolean;
  subtotal: number;
  discountTotal: number;
  grandTotal: number;
  validatedItems: ValidatedBulkItem[];
}

/**
 * Parses CSV spreadsheet text into structured line items.
 */
export function parseCsvBulkOrder(csvContent: string): ParsedBulkLineItem[] {
  const lines = csvContent
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) return [];

  const headers = lines[0].toLowerCase().split(",").map((h) => h.trim().replace(/^["']|["']$/g, ""));
  const skuIdx = headers.findIndex((h) => h === "sku" || h === "item" || h === "part_number" || h === "code");
  const qtyIdx = headers.findIndex((h) => h === "quantity" || h === "qty" || h === "units" || h === "count");
  const priceIdx = headers.findIndex((h) => h === "price" || h === "unit_price" || h === "expected_price");
  const noteIdx = headers.findIndex((h) => h === "note" || h === "notes" || h === "description");

  const items: ParsedBulkLineItem[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.trim().replace(/^["']|["']$/g, ""));
    const sku = skuIdx !== -1 ? cols[skuIdx] : cols[0];
    const qty = qtyIdx !== -1 ? parseInt(cols[qtyIdx], 10) : parseInt(cols[1], 10);
    const price = priceIdx !== -1 && cols[priceIdx] ? parseFloat(cols[priceIdx]) : undefined;
    const note = noteIdx !== -1 ? cols[noteIdx] : undefined;

    if (sku && !isNaN(qty) && qty > 0) {
      items.push({
        lineIndex: i,
        sku: sku.trim(),
        quantity: qty,
        expectedUnitPrice: price,
        customerItemNote: note,
      });
    }
  }

  return items;
}

/**
 * Parses ANSI X12 EDI 850 Purchase Order format.
 * Format examples:
 * BEG*00*SA*PO-2026-90422**20260902~
 * N1*BT*Acme Wholesale Corp*92*TAX99201~
 * PO1*1*100*EA*25.50**SK*PROD-SKU-001~
 */
export function parseEdi850PurchaseOrder(ediContent: string): {
  purchaseOrderNumber?: string;
  buyerName?: string;
  items: ParsedBulkLineItem[];
} {
  const segments = ediContent
    .split(/~|\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);

  let purchaseOrderNumber: string | undefined;
  let buyerName: string | undefined;
  const items: ParsedBulkLineItem[] = [];
  let lineIndex = 1;

  for (const segment of segments) {
    const elements = segment.split("*");
    const tag = elements[0].toUpperCase();

    if (tag === "BEG") {
      // BEG*00*SA*<PO_NUMBER>
      purchaseOrderNumber = elements[3];
    } else if (tag === "N1" && elements[1] === "BT") {
      // N1*BT*<BUYER_NAME>
      buyerName = elements[2];
    } else if (tag === "PO1") {
      // PO1*<LineNum>*<Qty>*<UOM>*<Price>**<Qualifier>*<SKU>
      const qty = parseInt(elements[2], 10);
      const price = parseFloat(elements[4]);
      
      // Look for SKU qualifier (SK, VN, BP, IN, VP)
      let sku = "";
      for (let j = 5; j < elements.length - 1; j++) {
        const qualifier = elements[j].toUpperCase();
        if (["SK", "VN", "BP", "IN", "VP"].includes(qualifier)) {
          sku = elements[j + 1];
          break;
        }
      }

      if (!sku && elements[6]) {
        sku = elements[6];
      }

      if (sku && !isNaN(qty) && qty > 0) {
        items.push({
          lineIndex: lineIndex++,
          sku: sku.trim(),
          quantity: qty,
          expectedUnitPrice: !isNaN(price) ? price : undefined,
        });
      }
    }
  }

  return { purchaseOrderNumber, buyerName, items };
}

/**
 * Validates parsed lines against database products, stock levels, and wholesale tiered pricing rules.
 */
export async function validateAndPriceBulkOrder(params: {
  sourceType: "CSV" | "EDI_850";
  purchaseOrderNumber?: string;
  buyerName?: string;
  items: ParsedBulkLineItem[];
}): Promise<BulkOrderProcessingResult> {
  await connectDB();

  const skus = params.items.map((it) => it.sku);
  const products = await Product.find({ sku: { $in: skus } })
    .select("_id name sku price compareAtPrice stock wholesaleTiers")
    .lean();

  const productMap = new Map<string, (typeof products)[0]>();
  products.forEach((p) => {
    if (p.sku) productMap.set(p.sku.toUpperCase(), p);
  });

  const validatedItems: ValidatedBulkItem[] = [];
  let subtotal = 0;
  let grandTotal = 0;

  for (const item of params.items) {
    const product = productMap.get(item.sku.toUpperCase());

    if (!product) {
      validatedItems.push({
        lineIndex: item.lineIndex,
        sku: item.sku,
        productName: "Unknown SKU",
        requestedQuantity: item.quantity,
        availableStock: 0,
        isAvailable: false,
        standardPrice: item.expectedUnitPrice || 0,
        appliedWholesalePrice: item.expectedUnitPrice || 0,
        discountPercentage: 0,
        lineTotal: 0,
        error: `Product SKU "${item.sku}" not found in platform catalog.`,
      });
      continue;
    }

    const currentStock = product.stock || 0;
    const isAvailable = currentStock >= item.quantity;
    const basePrice = product.price || 0;

    // Calculate Wholesale Volume Tier Pricing
    let discountPercent = 0;
    if (item.quantity >= 100) {
      discountPercent = 30;
    } else if (item.quantity >= 50) {
      discountPercent = 20;
    } else if (item.quantity >= 10) {
      discountPercent = 10;
    }

    const wholesaleUnitPrice =
      Math.round((basePrice * (1 - discountPercent / 100)) * 100) / 100;
    const lineTotal = Math.round(wholesaleUnitPrice * item.quantity * 100) / 100;

    subtotal += basePrice * item.quantity;
    grandTotal += lineTotal;

    validatedItems.push({
      lineIndex: item.lineIndex,
      sku: item.sku,
      productId: String(product._id),
      productName: product.name || item.sku,
      requestedQuantity: item.quantity,
      availableStock: currentStock,
      isAvailable,
      standardPrice: basePrice,
      appliedWholesalePrice: wholesaleUnitPrice,
      discountPercentage: discountPercent,
      lineTotal,
      error: !isAvailable ? `Requested ${item.quantity} units, but only ${currentStock} in stock.` : undefined,
    });
  }

  const validCount = validatedItems.filter((i) => !i.error).length;
  const allAvailable = validatedItems.every((i) => i.isAvailable && !i.error);

  return {
    sourceType: params.sourceType,
    purchaseOrderNumber: params.purchaseOrderNumber,
    buyerName: params.buyerName,
    totalLines: params.items.length,
    validLinesCount: validCount,
    invalidLinesCount: params.items.length - validCount,
    allLinesAvailable: allAvailable,
    subtotal: Math.round(subtotal * 100) / 100,
    discountTotal: Math.round((subtotal - grandTotal) * 100) / 100,
    grandTotal: Math.round(grandTotal * 100) / 100,
    validatedItems,
  };
}
