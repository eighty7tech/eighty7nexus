"use client";

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { posDb, type POSProduct } from "@/lib/pos/db";
import { usePOSStore } from "@/lib/pos/store";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { AppImage } from "@/components/ui/app-image";
import { Button } from "@/components/ui/button";

export function POSProductGrid() {
  const [searchQuery, setSearchQuery] = useState("");
  const addToCart = usePOSStore((state) => state.addToCart);

  // Query local IndexedDB for products (fast, offline)
  const products = useLiveQuery(async () => {
    if (!searchQuery) {
      return posDb.products.limit(50).toArray(); // Show first 50 by default
    }
    
    // Simple fast local search on name, sku, barcode
    const q = searchQuery.toLowerCase();
    return posDb.products
      .filter((p) => 
        p.name.toLowerCase().includes(q) || 
        p.sku.toLowerCase().includes(q) || 
        p.barcode.toLowerCase().includes(q)
      )
      .limit(50)
      .toArray();
  }, [searchQuery]);

  const handleProductClick = (product: POSProduct) => {
    // If product has variants, we ideally show a variant selector modal.
    // For this implementation, we pick the first variant or the base product.
    if (product.variants && product.variants.length > 0) {
      addToCart(product, product.variants[0].id);
    } else {
      addToCart(product);
    }
  };

  return (
    <div className="flex h-full flex-col bg-background p-4">
      <div className="relative mb-4">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input 
          className="pl-9 h-10 text-lg bg-card" 
          placeholder="Scan barcode or search name/SKU..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          autoFocus
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {!products ? (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            Loading Catalog...
          </div>
        ) : products.length === 0 ? (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            No products found locally.
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {products.map((product) => (
              <Button
                key={product._id}
                variant="outline"
                className="h-auto flex-col items-center justify-start gap-2 border bg-card p-3 shadow-sm hover:border-primary hover:bg-card hover:ring-1 hover:ring-primary"
                onClick={() => handleProductClick(product)}
              >
                <div className="flex h-16 w-full items-center justify-center overflow-hidden rounded-md bg-muted">
                  {product.image ? (
                    <AppImage src={product.image} alt={product.name} width={100} height={100} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-2xl font-bold text-muted-foreground/30">
                      {product.name.charAt(0)}
                    </span>
                  )}
                </div>
                <div className="w-full text-left">
                  <p className="line-clamp-2 text-sm font-semibold leading-tight">{product.name}</p>
                  <p className="mt-1 text-sm font-bold text-primary">${product.price.toFixed(2)}</p>
                  {product.variants && product.variants.length > 0 && (
                    <p className="text-xs text-muted-foreground">{product.variants.length} Variants</p>
                  )}
                </div>
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
