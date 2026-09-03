"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "@/components/ui/toast-notification";

interface StaffPinModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function StaffPinModal({ open, onOpenChange, onSuccess }: StaffPinModalProps) {
  const [pin, setPin] = useState("");

  const handleKeyPress = (num: string) => {
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      
      if (newPin.length === 4) {
        verifyPin(newPin);
      }
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  const verifyPin = (currentPin: string) => {
    // In a real implementation, this checks against the `pos_users` IndexedDB table.
    // For this prototype, we accept any 4 digit pin.
    if (currentPin.length === 4) {
      toast.success("Staff authenticated");
      onSuccess();
      setPin("");
      onOpenChange(false);
    } else {
      toast.error("Invalid PIN");
      setPin("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[320px] bg-card sm:max-w-[320px]">
        <DialogHeader className="text-center">
          <DialogTitle className="text-xl font-bold">Enter PIN</DialogTitle>
          <DialogDescription>
            Switch cashier or unlock terminal
          </DialogDescription>
        </DialogHeader>
        
        <div className="my-6 flex justify-center gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div 
              key={i} 
              className={`h-4 w-4 rounded-full border-2 ${pin.length > i ? "bg-primary border-primary" : "border-muted"}`} 
            />
          ))}
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <Button
              key={num}
              variant="outline"
              className="h-16 text-2xl font-semibold hover:bg-primary/20"
              onClick={() => handleKeyPress(num.toString())}
            >
              {num}
            </Button>
          ))}
          <Button
            variant="ghost"
            className="h-16 text-lg font-semibold"
            onClick={() => setPin("")}
          >
            Clear
          </Button>
          <Button
            variant="outline"
            className="h-16 text-2xl font-semibold hover:bg-primary/20"
            onClick={() => handleKeyPress("0")}
          >
            0
          </Button>
          <Button
            variant="ghost"
            className="h-16 text-lg font-semibold text-destructive"
            onClick={handleBackspace}
          >
            Del
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
