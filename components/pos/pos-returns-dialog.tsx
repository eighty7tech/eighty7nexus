"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Search, RotateCcw } from "lucide-react";
import { useCurrency } from "@/providers/currency-provider";
import { OrderItem } from "@/types";

interface POSReturnsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function POSReturnsDialog({ open, onOpenChange }: POSReturnsDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [order, setOrder] = useState<any | null>(null);
  const [returnQuantities, setReturnQuantities] = useState<Record<string, number>>({});
  const [issueStoreCredit, setIssueStoreCredit] = useState(false);
  const { formatPrice: fp } = useCurrency();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      // In a real implementation, we would search by posLocalReceiptNumber or orderNumber
      // For now, we will just simulate a fetch or use an API endpoint you build later
      toast.info(`Searching for receipt ${searchQuery}...`);
      // Simulated response
      setTimeout(() => {
        setOrder({
          _id: "fake_id",
          orderNumber: searchQuery,
          status: "delivered",
          items: [
            {
              productId: "prod_1",
              name: "Sample Product",
              price: 15.0,
              quantity: 2,
              returnedQuantity: 0,
            }
          ]
        });
        setIsSearching(false);
      }, 500);
    } catch (err) {
      toast.error("Receipt not found");
      setIsSearching(false);
    }
  };

  const handleProcessReturn = async () => {
    // Collect items to return
    const itemsToReturn = Object.entries(returnQuantities)
      .filter(([_, qty]) => qty > 0)
      .map(([id, qty]) => ({
        productId: id.split('_')[0], // Simplified extraction
        returnQuantity: qty,
      }));

    if (itemsToReturn.length === 0) {
      toast.error("Please select items to return");
      return;
    }

    try {
      const res = await fetch("/api/pos/returns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order._id,
          items: itemsToReturn,
          restock: true,
          refundAmount: 15.0, // Calculated dynamically in real UI
          issueStoreCredit,
        }),
      });

      if (!res.ok) throw new Error("Failed to process return");
      
      const data = await res.json();
      if (data.data?.storeCreditCode) {
        toast.success(`Return processed! Store Credit Code: ${data.data.storeCreditCode}`, { duration: 10000 });
      } else {
        toast.success("Return processed successfully");
      }
      
      onOpenChange(false);
      setOrder(null);
      setReturnQuantities({});
      setIssueStoreCredit(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error processing return");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="w-5 h-5" />
            Process Return
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            placeholder="Scan or enter receipt number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
          <Button type="submit" disabled={isSearching || !searchQuery.trim()}>
            <Search className="w-4 h-4 mr-2" />
            Find
          </Button>
        </form>

        {order && (
          <div className="mt-4 space-y-4">
            <div className="rounded-md border">
              {order.items.map((item: OrderItem, idx: number) => {
                const available = item.quantity - (item.returnedQuantity || 0);
                const returning = returnQuantities[`${item.productId}`] || 0;
                
                return (
                  <div key={idx} className="flex items-center justify-between p-3 border-b last:border-0">
                    <div>
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {fp(item.price)} each · {available} available for return
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setReturnQuantities(prev => ({
                          ...prev,
                          [`${item.productId}`]: Math.max(0, returning - 1)
                        }))}
                        disabled={returning === 0}
                      >
                        -
                      </Button>
                      <span className="w-4 text-center text-sm">{returning}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setReturnQuantities(prev => ({
                          ...prev,
                          [`${item.productId}`]: Math.min(available, returning + 1)
                        }))}
                        disabled={returning >= available}
                      >
                        +
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center space-x-2 pl-2">
                <input
                  type="checkbox"
                  id="storeCredit"
                  className="rounded border-gray-300"
                  checked={issueStoreCredit}
                  onChange={(e) => setIssueStoreCredit(e.target.checked)}
                />
                <label htmlFor="storeCredit" className="text-sm font-medium leading-none">
                  Issue Store Credit
                </label>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button onClick={handleProcessReturn}>
                  Process Return
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
