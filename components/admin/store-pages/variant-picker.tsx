"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { createTSafe } from "@/components/admin/online-store/t-safe";
import { SectionThumbnail } from "./section-thumbnails";

/**
 * The "pick a different design for this block" control.
 *
 * Sections ship pre-developed designs (`SectionDefinition.variants`); this is
 * where a merchant chooses between them. It reads as a row of pictures rather
 * than a dropdown because the choice IS visual — a select listing "Carousel /
 * Promo row / Grid" tells you nothing you can act on.
 *
 * The chosen key is an ordinary section setting, so it is stored on the page,
 * survives a theme switch, and travels with a saved-section copy. A theme
 * only decides which variant its starter arrives with.
 */
export function VariantPicker({
  sectionType,
  variants,
  value,
  onChange,
  tSafe,
}: {
  sectionType: string;
  variants: { key: string; name: string }[];
  value: string;
  onChange: (key: string) => void;
  tSafe: ReturnType<typeof createTSafe>;
}) {
  if (variants.length < 2) return null;
  // An instance written before this section gained variants has no stored
  // key; the registry's default is the first one, so highlight that.
  const active = variants.some((variant) => variant.key === value)
    ? value
    : variants[0].key;

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {tSafe("admin.storeBuilder.variantLabel", "Design")}
      </p>
      <div
        role="radiogroup"
        aria-label={tSafe("admin.storeBuilder.variantLabel", "Design")}
        className="grid grid-cols-2 gap-2 sm:grid-cols-3"
      >
        {variants.map((variant) => {
          const selected = variant.key === active;
          return (
            <button
              key={variant.key}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(variant.key)}
              className={cn(
                "group relative overflow-hidden rounded-md border p-1.5 text-left transition-colors",
                selected
                  ? "border-primary ring-1 ring-primary"
                  : "border-border hover:border-primary/50",
              )}
            >
              <span className="block overflow-hidden rounded-sm">
                <SectionThumbnail type={`${sectionType}:${variant.key}`} />
              </span>
              <span className="mt-1.5 flex items-center gap-1 px-0.5">
                {selected ? (
                  <Check className="h-3 w-3 shrink-0 text-primary" />
                ) : null}
                <span className="truncate text-[11px] font-medium">
                  {tSafe(
                    `admin.storeBuilder.sections.${sectionType}.variants.${variant.key}`,
                    variant.name,
                  )}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
