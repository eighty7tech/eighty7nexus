"use client";

import { useCurrency } from "@/providers/currency-provider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function CurrencySwitcher({ className }: { className?: string }) {
  const { currency, currencies, setCurrency } = useCurrency();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn("flex items-center gap-1 px-2 h-8", className)}
          aria-label={`Select currency, current currency: ${currency.code}`}
        >
          <span className="font-medium text-sm">{currency.code}</span>
          <span className="opacity-70 text-xs hidden sm:inline">{currency.symbol}</span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[130px]">
        {currencies.map((c) => (
          <DropdownMenuItem
            key={c.code}
            className={cn(
              "flex items-center justify-between cursor-pointer",
              c.code === currency.code && "bg-accent/60 font-semibold",
            )}
            onClick={() => setCurrency(c.code)}
          >
            <span className="font-medium">{c.code}</span>
            <span className="text-muted-foreground text-xs">{c.symbol}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
