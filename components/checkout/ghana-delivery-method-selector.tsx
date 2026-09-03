"use client";

import { cn } from "@/lib/utils";
import type { IGhanaDeliveryMethod } from "@/types";
import {
  Truck,
  Zap,
  Clock,
  Sparkles,
  MapPin,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

type GhanaDeliveryMethodSelectorProps = {
  methods: IGhanaDeliveryMethod[];
  selectedMethodId?: string;
  onMethodSelect: (method: IGhanaDeliveryMethod) => void;
  currency?: string;
  loading?: boolean;
  layout?: "grid" | "list";
};

export function GhanaDeliveryMethodSelector({
  methods,
  selectedMethodId,
  onMethodSelect,
  currency = "GHS",
  loading = false,
  layout = "grid",
}: GhanaDeliveryMethodSelectorProps) {
  const getMethodIcon = (method: IGhanaDeliveryMethod) => {
    const name = method.name?.toLowerCase() || "";

    if (name.includes("vip") || name.includes("same") || name.includes("instant")) {
      return <Sparkles className="h-5 w-5 text-amber-500" />;
    }
    if (name.includes("courier") || name.includes("express") || name.includes("motor")) {
      return <Zap className="h-5 w-5 text-emerald-500" />;
    }
    return <Truck className="h-5 w-5 text-primary" />;
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="h-4 w-32 animate-pulse rounded bg-muted" />
          <div className="h-4 w-20 animate-pulse rounded bg-muted" />
        </div>
        <div className={cn("grid gap-3", layout === "list" ? "grid-cols-1" : "sm:grid-cols-2")}>
          <div className="h-24 animate-pulse rounded-xl border bg-muted/40" />
          <div className="h-24 animate-pulse rounded-xl border bg-muted/40" />
        </div>
      </div>
    );
  }

  if (!methods || methods.length === 0) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Truck className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold tracking-tight text-foreground">
            Ghana Delivery Options
          </h3>
        </div>
        <div className="rounded-xl border border-dashed border-border/80 bg-muted/20 p-5 text-center text-sm text-muted-foreground">
          <MapPin className="mx-auto mb-2 h-6 w-6 text-muted-foreground/50" />
          No specific delivery methods found for this region. Standard nationwide rates will apply.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Truck className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold tracking-tight text-foreground">
            Ghana Delivery Options
          </h3>
        </div>
        <span className="text-xs text-muted-foreground font-medium">
          {methods.length} service{methods.length === 1 ? "" : "s"} available
        </span>
      </div>

      <div className={cn("grid gap-3", layout === "list" ? "grid-cols-1" : "sm:grid-cols-2")} role="radiogroup" aria-label="Select delivery method">
        {methods.map((method, idx) => {
          const isActive =
            selectedMethodId === method.id ||
            (!selectedMethodId && idx === 0);

          const estimatedTime =
            method.minDays && method.maxDays
              ? method.minDays === method.maxDays
                ? `${method.minDays} business day`
                : `${method.minDays} - ${method.maxDays} business days`
              : "1 - 3 business days";

          const isNationwide =
            !method.coverageRegions || method.coverageRegions.length === 0;

          return (
            <label
              key={method.id}
              onClick={() => onMethodSelect(method)}
              className={cn(
                "group relative flex cursor-pointer flex-col justify-between rounded-xl border p-4 transition-all duration-200",
                "focus-within:ring-2 focus-within:ring-primary/40 focus-within:outline-hidden",
                isActive
                  ? "border-primary bg-primary/5 shadow-xs ring-1 ring-primary/20 dark:bg-primary/10"
                  : "border-border/80 bg-card hover:border-primary/40 hover:bg-muted/30",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-colors",
                      isActive
                        ? "border-primary/30 bg-primary/10 shadow-xs"
                        : "border-border/70 bg-muted/40 group-hover:border-primary/20",
                    )}
                  >
                    {getMethodIcon(method)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-foreground leading-tight">
                        {method.name}
                      </span>
                    </div>
                    {isNationwide ? (
                      <Badge variant="outline" className="mt-1 h-4 text-[10px] font-normal text-muted-foreground px-1.5 border-border/60">
                        Nationwide Delivery
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="mt-1 h-4 text-[10px] font-normal text-primary/80 px-1.5 border-primary/20 bg-primary/5">
                        {method.coverageRegions?.slice(0, 2).join(", ") || "Regional"}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-base font-bold text-foreground">
                    {new Intl.NumberFormat("en-GH", {
                      style: "currency",
                      currency,
                      maximumFractionDigits: 2,
                    }).format(method.basePrice)}
                  </div>
                </div>
              </div>

              {method.description && (
                <p className="mt-2.5 text-xs text-muted-foreground/90 line-clamp-2">
                  {method.description}
                </p>
              )}

              <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-2 text-xs">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground/70" />
                  <span>Est: {estimatedTime}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {isActive ? (
                    <span className="flex items-center gap-1 font-medium text-primary text-[11px]">
                      <CheckCircle2 className="h-3.5 w-3.5 fill-primary text-primary-foreground" />
                      Selected
                    </span>
                  ) : (
                    <span className="text-[11px] text-muted-foreground group-hover:text-foreground">
                      Select
                    </span>
                  )}
                  <input
                    type="radio"
                    name="ghana-delivery-method"
                    value={method.id}
                    checked={isActive}
                    onChange={() => onMethodSelect(method)}
                    className="sr-only"
                  />
                </div>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}
