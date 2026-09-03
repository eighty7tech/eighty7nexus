/**
 * In-Store Price & Weight Embedded Barcode Decoder
 * Supports GS1 / EAN-13 standard variable-measure retail barcodes:
 * Prefixes:
 *  - 02, 20: Price-embedded (e.g. 20AAAAABBBBBC -> PLU AAAAA, Price BBB.BB)
 *  - 21, 22: Weight-embedded (e.g. 21AAAAABBBBBC -> PLU AAAAA, Weight BBB.BB in grams or kg)
 */

export interface ParsedWeightedBarcode {
  isWeightedBarcode: boolean;
  prefix: string;
  itemCode: string; // 4 to 5 digit PLU / SKU
  embeddedType: "price" | "weight";
  value: number; // calculated price in currency or weight in kg
  raw: string;
}

export function parseWeightedBarcode(barcode: string): ParsedWeightedBarcode | null {
  if (!barcode || typeof barcode !== "string") return null;
  const clean = barcode.replace(/\D/g, "");

  // Must be 12 or 13 digits (UPC-A or EAN-13)
  if (clean.length !== 12 && clean.length !== 13) {
    return null;
  }

  const prefix2 = clean.substring(0, 2);

  // In-store variable measurement prefixes
  if (!["02", "20", "21", "22", "23"].includes(prefix2)) {
    return null;
  }

  const isPriceEmbedded = ["02", "20"].includes(prefix2);
  const isWeightEmbedded = ["21", "22", "23"].includes(prefix2);

  // EAN-13 structure: PP AAAAA BBBBB C
  // PP = prefix (2 digits)
  // AAAAA = product identifier / PLU (5 digits)
  // BBBBB = 5 digits value
  // C = check digit (1 digit)
  const itemCode = clean.substring(2, 7);
  const valueDigits = clean.substring(7, 12);
  const rawNum = parseInt(valueDigits, 10);

  if (isNaN(rawNum)) return null;

  if (isPriceEmbedded) {
    // BBBBB is price with 2 decimal places (e.g. 00450 = 4.50)
    const price = rawNum / 100;
    return {
      isWeightedBarcode: true,
      prefix: prefix2,
      itemCode,
      embeddedType: "price",
      value: price,
      raw: clean,
    };
  }

  if (isWeightEmbedded) {
    // BBBBB is weight in 3 decimal places (e.g. 01250 = 1.250 kg)
    const weightKg = rawNum / 1000;
    return {
      isWeightedBarcode: true,
      prefix: prefix2,
      itemCode,
      embeddedType: "weight",
      value: weightKg,
      raw: clean,
    };
  }

  return null;
}
