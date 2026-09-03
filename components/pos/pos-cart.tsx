"use client";

import { usePOSStore } from "@/lib/pos/store";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Minus, Plus, Trash2 } from "lucide-react";
import { QuickTenderModal } from "./quick-tender-modal";
import { useState } from "react";

export function POSCart() {
  const { cart, subtotal, tax, total, removeFromCart, updateQuantity } = usePOSStore();
  const [tenderModalOpen, setTenderModalOpen] = useState(false);

  return (
    <div className="flex h-full flex-col border-r bg-card text-card-foreground">
      {/* Header */}
      <div className="flex items-center justify-between border-b p-4">
        <h2 className="text-xl font-bold">Current Order</h2>
        <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
          {cart.length} items
        </span>
      </div>

      {/* Cart Items */}
      <ScrollArea className="flex-1 p-4">
        {cart.length === 0 ? (
          <div className="flex h-40 items-center justify-center text-muted-foreground">
            No items in cart
          </div>
        ) : (
          <div className="space-y-4">
            {cart.map((item) => (
              <div key={item.cartItemId} className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex-1">
                  <p className="font-semibold">{item.product.name}</p>
                  <div className="flex items-center gap-2">
                    <p className={`text-sm ${item.discountedPrice !== undefined && item.discountedPrice < item.price ? 'text-muted-foreground line-through text-xs' : 'text-muted-foreground'}`}>
                      ${item.price.toFixed(2)} {item.variantId ? "(Variant)" : ""}
                    </p>
                    {item.discountedPrice !== undefined && item.discountedPrice < item.price && (
                      <p className="text-sm font-bold text-green-600">
                        ${item.discountedPrice.toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>
                
                {/* Quantity Controls */}
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-6 text-center font-medium">{item.quantity}</span>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-destructive"
                    onClick={() => removeFromCart(item.cartItemId)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Totals */}
      <div className="border-t bg-muted/30 p-4">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tax (10%)</span>
            <span>${tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between border-t pt-2 text-lg font-bold">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>

        <Button 
          className="mt-4 w-full text-lg font-bold" 
          size="lg"
          disabled={cart.length === 0}
          onClick={() => setTenderModalOpen(true)}
        >
          Pay ${total.toFixed(2)}
        </Button>
      </div>

      <QuickTenderModal 
        open={tenderModalOpen} 
        onOpenChange={setTenderModalOpen} 
      />
    </div>
  );
}
