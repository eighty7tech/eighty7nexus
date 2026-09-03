"use client";

import { useEffect, useRef } from "react";
import { posDb } from "@/lib/pos/db";
import { usePOSStore } from "@/lib/pos/store";
import { parseWeightedBarcode } from "@/lib/pos/weighted-barcode";
import { toast } from "@/components/ui/toast-notification";

export function BarcodeScannerListener() {
  const bufferRef = useRef("");
  const lastKeyTimeRef = useRef(0);
  const addToCart = usePOSStore((state) => state.addToCart);

  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      // Ignore if user is actively typing in an input field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const currentTime = Date.now();
      
      // If time between keystrokes is too long (>50ms), reset buffer.
      // Humans type slower than 50ms, while barcode scanners inject keys at 10-20ms intervals.
      if (currentTime - lastKeyTimeRef.current > 50) {
        bufferRef.current = "";
      }
      
      lastKeyTimeRef.current = currentTime;

      // Scanners traditionally terminate the sequence with the "Enter" key
      if (e.key === "Enter" && bufferRef.current.length > 3) {
        e.preventDefault();
        const barcode = bufferRef.current;
        bufferRef.current = "";

        // Check if this is an in-store price/weight embedded barcode (e.g. 20XXXXX or 21XXXXX)
        const weighted = parseWeightedBarcode(barcode);
        if (weighted) {
          // Find product by SKU or barcode prefix/itemCode
          const product = await posDb.products
            .filter((p) => p.sku.includes(weighted.itemCode) || (p.barcode ? p.barcode.includes(weighted.itemCode) : false))
            .first();

          if (product) {
            if (weighted.embeddedType === "price") {
              addToCart(product, undefined, 1, weighted.value);
              toast.success(`Scanned: ${product.name} (Scale Price: $${weighted.value.toFixed(2)})`);
            } else {
              addToCart(product, undefined, weighted.value, product.price * weighted.value);
              toast.success(`Scanned: ${product.name} (Scale Weight: ${weighted.value.toFixed(3)}kg)`);
            }
            return;
          }
        }

        // Standard exact barcode match via Dexie IndexedDB
        const product = await posDb.products.where("barcode").equals(barcode).first();
        
        if (product) {
          addToCart(product);
          toast.success(`Scanned: ${product.name}`);
        } else {
          toast.error(`Unknown barcode: ${barcode}`);
        }
      } else if (e.key.length === 1) { // Accumulate normal characters
        bufferRef.current += e.key;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [addToCart]);

  return null; // Headless component
}
