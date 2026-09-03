"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type { POSQuickKey, POSProduct, POSVariant } from "@/components/pos/pos-types";
import { listQuickKeys } from "@/lib/pos/offline-db";
import { posDb } from "@/lib/pos/db";

export function POSQuickKeysGrid({ 
  locationId,
  addToCart
}: { 
  locationId: string;
  addToCart: (product: POSProduct, variant?: POSVariant) => void;
}) {
  const [quickKeys, setQuickKeys] = useState<POSQuickKey[]>([]);

  useEffect(() => {
    async function loadKeys() {
      try {
        const keys = await listQuickKeys();
        // Filter by current location
        setQuickKeys(keys.filter((k) => k.scope === locationId || k.scope === "default"));
      } catch (err) {
        console.error("Failed to load Quick Keys", err);
      }
    }
    loadKeys();
  }, [locationId]);

  const handleQuickKeyClick = async (key: POSQuickKey) => {
    if (key.productId) {
      // Find product in dexie local db
      const product = await posDb.products.get(key.productId);
      if (product) {
        // We cast to any because posDb.products uses a simplified type compared to POSProduct in types,
        // but it has enough for addToCart to work (name, price, id).
        addToCart(product as any, key.variantId as any);
      }
    } else if (key.customPrice) {
      // It's a custom line item
      addToCart(
        {
          _id: `custom_${key.id}`,
          name: key.label,
          price: key.customPrice,
          sku: `QK_${key.id}`,
          stock: 9999,
          vendorId: "custom",
          category: "custom",
          images: [],
          variants: [],
        } as any,
        undefined
      );
    }
  };

  if (quickKeys.length === 0) {
    return (
      <div className="flex h-16 items-center justify-center text-sm text-muted-foreground border border-dashed rounded-md m-4">
        No quick keys configured.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 p-4 border-b bg-muted/20">
      {quickKeys.map((qk) => (
        <Button
          key={qk.id}
          variant="outline"
          className="h-16 w-full flex-col p-2 items-center justify-center text-center shadow-sm"
          style={{ backgroundColor: qk.color ? qk.color : undefined }}
          onClick={() => handleQuickKeyClick(qk)}
        >
          <span className="text-sm font-semibold whitespace-normal leading-tight line-clamp-2">
            {qk.label}
          </span>
          {qk.customPrice ? (
            <span className="text-xs opacity-75 mt-1">${qk.customPrice.toFixed(2)}</span>
          ) : null}
        </Button>
      ))}
    </div>
  );
}
