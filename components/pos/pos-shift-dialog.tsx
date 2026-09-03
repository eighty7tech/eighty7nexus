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
import { useCurrency } from "@/providers/currency-provider";
import { Textarea } from "@/components/ui/textarea";

interface POSShiftDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locationId: string;
  shiftType: "open" | "close";
  shiftId?: string; // required if closing
}

export function POSShiftDialog({ open, onOpenChange, locationId, shiftType, shiftId }: POSShiftDialogProps) {
  const [cash, setCash] = useState<string>("");
  const [card, setCard] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { formatPrice: fp } = useCurrency();

  const handlePrintReport = async (type: "x-read" | "z-read") => {
    try {
      // If Z-Read, we print the summary for the closed shift
      // If X-Read, we print the summary for the currently open shift
      const url = type === "z-read" && shiftId 
        ? `/api/pos/reports/shift-report?shiftId=${shiftId}` 
        : `/api/pos/reports/shift-report`;
        
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch report");
      
      const { data } = await res.json();
      
      let text = `\x1B\x61\x01`; // Center
      text += `--- ${data.reportType} ---\n`;
      text += `Date: ${new Date().toLocaleString()}\n`;
      text += `Shift: ${data.shift.id.slice(-6)}\n`;
      text += `Cashier: ${data.shift.cashierId}\n`;
      text += `--------------------------------\n\n`;
      
      text += `\x1B\x61\x00`; // Left align
      text += `Transactions: ${data.transactionCount}\n`;
      text += `Total Sales: ${fp(data.totals.sales)}\n`;
      text += `Total Tax: ${fp(data.totals.tax)}\n`;
      text += `Total Refunds: ${fp(data.totals.refunds)}\n\n`;
      
      text += `--- TENDERS ---\n`;
      text += `Cash: ${fp(data.totals.cash)}\n`;
      text += `Card: ${fp(data.totals.card)}\n`;
      text += `Other: ${fp(data.totals.other)}\n\n`;
      
      if (data.reportType === "Z-Read") {
        text += `--- CASH DRAWER ---\n`;
        text += `Starting Float: ${fp(data.shift.startingCash)}\n`;
        text += `Expected Cash: ${fp(data.shift.expectedCash)}\n`;
        text += `Declared Cash: ${fp(data.shift.declaredCash || 0)}\n`;
        text += `Discrepancy: ${fp(data.shift.cashDiscrepancy || 0)}\n`;
      }
      
      const { ESCPOSPrinter } = await import("@/lib/pos/printer");
      const printer = new ESCPOSPrinter();
      const connected = await printer.connect();
      if (!connected) throw new Error("Printer connection failed");
      
      await printer.printReceipt(text, false);
      toast.success(`${data.reportType} printed`);
    } catch (err: any) {
      toast.error(err.message || "Failed to print report");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const endpoint = shiftType === "open" ? "/api/pos/shift/open" : "/api/pos/shift/close";
      const payload = shiftType === "open" 
        ? { locationId, startingCash: parseFloat(cash) || 0, notes }
        : { shiftId, declaredCash: parseFloat(cash) || 0, declaredCard: parseFloat(card) || 0, notes };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || `Failed to ${shiftType} shift`);
      }

      toast.success(`Shift ${shiftType === "open" ? "opened" : "closed"} successfully`);
      
      // Auto-print Z-Read if shift closed
      if (shiftType === "close") {
        handlePrintReport("z-read");
      }
      
      onOpenChange(false);
      setCash("");
      setCard("");
      setNotes("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : `Error ${shiftType}ing shift`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {shiftType === "open" ? "Open Register Shift" : "Close Register Shift"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {shiftType === "open" ? "Starting Cash Float" : "Declared Cash in Till"}
            </label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={cash}
              onChange={(e) => setCash(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>

          {shiftType === "close" && (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Declared Card Total (Optional)
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={card}
                onChange={(e) => setCard(e.target.value)}
                placeholder="0.00"
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Notes (Optional)</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any discrepancies or notes?"
              rows={3}
            />
          </div>

          <div className="flex justify-between gap-2 pt-4">
            <div>
              {shiftType === "close" && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => handlePrintReport("x-read")}
                >
                  Print X-Report
                </Button>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {shiftType === "open" ? "Open Shift" : "Close Shift"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
