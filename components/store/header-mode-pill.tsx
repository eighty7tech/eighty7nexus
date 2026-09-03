"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useStoreMode, type StoreMode } from "@/hooks/use-store-mode";
import { useLanguage } from "@/providers/language-provider";
import { ShoppingBag, Building2 } from "lucide-react";

export function HeaderModePill() {
  const router = useRouter();
  const pathname = usePathname();
  const { language } = useLanguage();
  const { mode, setMode, initFromCookies } = useStoreMode();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    initFromCookies();
    setMounted(true);
  }, [initFromCookies]);

  if (!mounted) return <div className="h-8 w-32 bg-muted/50 rounded-full animate-pulse" />;

  const handleModeChange = (newMode: StoreMode) => {
    setMode(newMode);
    
    // Redirect logic based on mode
    if (newMode === "wholesale") {
      router.push(`/${language.code}/wholesale`);
    } else {
      // If returning to retail from wholesale page, go home
      if (pathname.includes("/wholesale")) {
        router.push(`/${language.code}`);
      } else {
        router.refresh(); // Just refresh the current page to apply retail prices
      }
    }
  };

  return (
    <div className="flex items-center p-0.5 bg-muted/30 hover:bg-muted/50 transition-colors rounded-full border border-border/50">
      <button
        onClick={() => handleModeChange("retail")}
        className={cn(
          "flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200",
          mode === "retail"
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
        )}
      >
        <ShoppingBag className="w-3.5 h-3.5" />
        <span>Retail</span>
      </button>
      
      <button
        onClick={() => handleModeChange("wholesale")}
        className={cn(
          "flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200",
          mode === "wholesale"
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
        )}
      >
        <Building2 className="w-3.5 h-3.5" />
        <span>Wholesale</span>
      </button>
    </div>
  );
}
