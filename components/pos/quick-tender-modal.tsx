"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { usePOSStore } from "@/lib/pos/store";
import { posDb } from "@/lib/pos/db";
import { useState } from "react";
import { toast } from "@/components/ui/toast-notification";

interface QuickTenderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuickTenderModal({ open, onOpenChange }: QuickTenderModalProps) {
  const { total, cart, clearCart } = usePOSStore();
  const [isProcessing, setIsProcessing] = useState(false);

  const processPayment = async (method: string) => {
    setIsProcessing(true);
    try {
      // Create a pending transaction to sync later
      const transaction = {
        id: `pos-tx-${crypto.randomUUID()}`,
        timestamp: new Date(),
        cart: [...cart],
        total,
        tenderType: method,
        synced: false,
      };

      await posDb.transactions.add(transaction);
      
      toast.success(`Payment successful via ${method}`);
      clearCart();
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to process transaction locally");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Total: ${total.toFixed(2)}</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-4 py-6">
          <Button 
            className="h-24 flex-col gap-2 text-lg" 
            variant="outline"
            disabled={isProcessing}
            onClick={() => processPayment("Cash")}
          >
            <span>💵</span>
            Cash
          </Button>
          <Button 
            className="h-24 flex-col gap-2 text-lg" 
            variant="outline"
            disabled={isProcessing}
            onClick={() => processPayment("Card")}
          >
            <span>💳</span>
            Credit Card
          </Button>
          <Button 
            className="h-24 flex-col gap-2 text-lg" 
            variant="outline"
            disabled={isProcessing}
            onClick={() => processPayment("Store Credit")}
          >
            <span>🏷️</span>
            Store Credit
          </Button>
          <Button 
            className="h-24 flex-col gap-2 text-lg" 
            variant="outline"
            disabled={isProcessing}
            onClick={() => processPayment("Split")}
          >
            <span>✂️</span>
            Split Tender
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
