"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast-notification";

interface ShiftManagerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "open" | "close";
}

export function ShiftManagerModal({ open, onOpenChange, type }: ShiftManagerModalProps) {
  const [cashAmount, setCashAmount] = useState("");
  const [step, setStep] = useState<"input" | "report">("input");
  
  const safeParseFloat = (val: string) => parseFloat(val.replace(/,/g, "")) || 0;

  // Dummy data for prototype Z-report
  const reportData = {
    expectedCash: 350.50,
    actualCash: safeParseFloat(cashAmount),
    cardSales: 450.00,
    totalSales: 800.50,
  };
  
  const variance = reportData.actualCash - reportData.expectedCash;

  const handleAction = () => {
    if (type === "open") {
      // Open Shift Logic
      toast.success(`Shift opened with $${safeParseFloat(cashAmount).toFixed(2)} float.`);
      onOpenChange(false);
      setCashAmount("");
    } else {
      // Close Shift -> show Z-Report
      setStep("report");
    }
  };

  const handleFinishZReport = () => {
    toast.success("Shift closed successfully. Z-Report saved.");
    setStep("input");
    setCashAmount("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {type === "open" ? "Open Register" : "Close Register (Blind Count)"}
          </DialogTitle>
          <DialogDescription>
            {type === "open" 
              ? "Enter the starting cash float for this shift." 
              : "Count the physical cash in the drawer and enter it below."}
          </DialogDescription>
        </DialogHeader>

        {step === "input" ? (
          <div className="space-y-4 py-4">
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
              <Input
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                className="pl-7 text-lg h-12"
                value={cashAmount}
                onChange={(e) => setCashAmount(e.target.value)}
                autoFocus
              />
            </div>
            <Button 
              className="w-full h-12 text-lg"
              disabled={!cashAmount}
              onClick={handleAction}
            >
              {type === "open" ? "Start Shift" : "Generate Z-Report"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <h3 className="text-lg font-bold text-center border-b pb-2">Z-REPORT SUMMARY</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Expected Cash</span>
                <span>${reportData.expectedCash.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Actual Cash Counted</span>
                <span>${reportData.actualCash.toFixed(2)}</span>
              </div>
              <div className={`flex justify-between font-bold pt-2 border-t ${variance < 0 ? 'text-destructive' : variance > 0 ? 'text-green-500' : ''}`}>
                <span>Cash Variance</span>
                <span>${variance.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-4">
                <span className="text-muted-foreground">Card Sales</span>
                <span>${reportData.cardSales.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2 border-t">
                <span>Total Gross Sales</span>
                <span>${reportData.totalSales.toFixed(2)}</span>
              </div>
            </div>
            <Button className="w-full mt-6" onClick={handleFinishZReport}>
              Print & Close Shift
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
