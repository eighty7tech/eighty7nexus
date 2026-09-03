"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  ProductFilters,
  resolvePriceBounds,
  type ProductFiltersProps,
} from "@/components/products/product-filters";

function countActiveFilters({
  currentCategory,
  currentCollection,
  currentMinPrice,
  currentMaxPrice,
  priceRange,
  currentPickupNearby,
}: ProductFiltersProps): number {
  let count = 0;
  if (currentCategory) count += currentCategory.split(",").length;
  if (currentCollection) count += currentCollection.split(",").length;
  // Counted here or the facet is invisible on mobile: the sheet is closed, so
  // the badge is the only thing telling a shopper why the grid is narrow.
  if (currentPickupNearby) count += 1;

  // Compare against the same bounds the slider uses — against a hardcoded
  // $0–1000 a $2,400 store showed "1 filter active" with nothing filtered.
  const bounds = resolvePriceBounds(priceRange);
  const min = currentMinPrice ? parseInt(currentMinPrice) : bounds.min;
  const max = currentMaxPrice ? parseInt(currentMaxPrice) : bounds.max;
  if (min > bounds.min || max < bounds.max) count += 1;

  return count;
}

/**
 * Mobile-only filter entry point. Renders a "Filters" button that opens a
 * slide-in Sheet wrapping the shared <ProductFilters> panel, so products stay
 * at the top of the page on small screens. Hidden on lg+ where the desktop
 * sidebar is shown instead.
 */
export function ProductFiltersMobile(props: ProductFiltersProps) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const activeCount = countActiveFilters(props);

  return (
    <div className="mb-4 lg:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <Button
          variant="outline"
          onClick={() => setOpen(true)}
          className="w-full justify-center"
        >
          <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
          {t("common.filters")}
          {activeCount > 0 ? (
            <Badge variant="secondary" className="ml-1">
              {activeCount}
            </Badge>
          ) : null}
        </Button>

        <SheetContent
          side="left"
          className="w-[88%] gap-0 p-0 sm:max-w-sm"
        >
          <SheetHeader className="border-b">
            <SheetTitle>
              {t("common.filters")}
            </SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-4">
            <ProductFilters {...props} />
          </div>

          <SheetFooter className="border-t">
            <SheetClose asChild>
              <Button className="w-full">
                {t("productsPage.filters.showResults")}
              </Button>
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
