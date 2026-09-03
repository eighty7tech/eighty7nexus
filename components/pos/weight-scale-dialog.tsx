"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Scale,
  RotateCcw,
  Check,
  Usb,
  AlertCircle,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { weightScaleDriver, type ScaleReading } from "@/lib/pos/weight-scale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface WeightScaleDialogProps {
  open: boolean;
  onClose: () => void;
  productName: string;
  unitPrice: number;
  formatPrice: (price: number) => string;
  onConfirmWeight: (weight: number, calculatedPrice: number) => void;
}

export function WeightScaleDialog({
  open,
  onClose,
  productName,
  unitPrice,
  formatPrice,
  onConfirmWeight,
}: WeightScaleDialogProps) {
  const t = useTranslations("scale");
  const [reading, setReading] = useState<ScaleReading>(() => weightScaleDriver.getReading());
  const [manualWeight, setManualWeight] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    if (!open) return;

    const unsubscribe = weightScaleDriver.onReading((r) => {
      setReading(r);
      if (r.weight > 0) {
        setManualWeight(r.weight.toFixed(3));
      }
    });

    return () => unsubscribe();
  }, [open]);

  const handleConnect = async () => {
    if (!weightScaleDriver.isSupported()) {
      toast.error(t("unsupportedBrowser"));
      return;
    }

    setIsConnecting(true);
    try {
      const ok = await weightScaleDriver.connect();
      if (ok) {
        setIsConnected(true);
        toast.success(t("statusConnected"));
      } else {
        toast.error("Failed to connect to electronic scale");
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const handleTare = async () => {
    await weightScaleDriver.tare();
    toast.info("Tare command sent");
  };

  const handleZero = async () => {
    await weightScaleDriver.zero();
    toast.info("Zero command sent");
  };

  const effectiveWeight = parseFloat(manualWeight) || reading.weight || 0;
  const calculatedPrice = Math.max(0, effectiveWeight * unitPrice);

  const handleConfirm = () => {
    if (effectiveWeight <= 0) {
      toast.error("Please provide a valid weight greater than zero");
      return;
    }
    onConfirmWeight(effectiveWeight, calculatedPrice);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-card border-border/60 text-foreground max-w-md rounded-2xl shadow-xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-primary font-bold">
              <Scale className="w-5 h-5" />
              {t("title")}
            </DialogTitle>
            <Badge
              className={cn(
                "text-[10px] uppercase font-bold",
                isConnected
                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {isConnected ? t("statusConnected") : t("statusDisconnected")}
            </Badge>
          </div>
          <DialogDescription className="text-muted-foreground text-xs">
            Weigh <strong>{productName}</strong> ({formatPrice(unitPrice)} / kg)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Scale Live Digital Display */}
          <div className="p-6 bg-background rounded-2xl border border-border/60 text-center space-y-1 shadow-xs">
            <span className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
              {t("currentWeight")}
            </span>
            <div className="flex items-baseline justify-center gap-2 font-mono">
              <span className="text-4xl font-black text-foreground">
                {effectiveWeight.toFixed(3)}
              </span>
              <span className="text-lg font-bold text-muted-foreground">kg</span>
            </div>
            <div className="pt-2 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
              <span>Status: {reading.isStable ? "STABLE" : "MOTION"}</span>
              <span>Total: <strong className="text-primary font-mono text-sm">{formatPrice(calculatedPrice)}</strong></span>
            </div>
          </div>

          {/* Scale Action Controls */}
          <div className="flex gap-2">
            {!isConnected ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleConnect}
                disabled={isConnecting}
                className="flex-1 rounded-xl border-border/60 text-xs h-9 shadow-xs"
              >
                {isConnecting ? (
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                ) : (
                  <Usb className="w-3.5 h-3.5 mr-1.5 text-primary" />
                )}
                {t("connectScale")}
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTare}
                  className="flex-1 rounded-xl border-border/60 text-xs h-9 shadow-xs"
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                  {t("tare")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleZero}
                  className="flex-1 rounded-xl border-border/60 text-xs h-9 shadow-xs"
                >
                  Zero
                </Button>
              </>
            )}
          </div>

          {/* Manual Weight Entry Fallback */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">
              {t("manualWeight")} (kg)
            </label>
            <Input
              type="number"
              step="0.001"
              min="0"
              placeholder="0.000"
              value={manualWeight}
              onChange={(e) => setManualWeight(e.target.value)}
              className="bg-background border-border/60 text-center font-mono text-lg font-bold rounded-xl"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={onClose}
            className="rounded-xl border-border/60 text-xs"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={effectiveWeight <= 0}
            className="rounded-xl text-xs font-bold shadow-xs"
          >
            <Check className="w-3.5 h-3.5 mr-1.5" />
            {t("confirmWeight")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
