import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AppImage } from "@/components/ui/app-image";
import { type Locale } from "@/config/i18n.config";
import { cn } from "@/lib/utils";
import {
  isExternalSectionHref,
  resolveSectionHref,
} from "./section-shell";

export interface PromoSplitCard {
  imageSrc: string;
  href: string;
  label: string;
}

/**
 * The Electronics design's promo arrangement: four columns — a tall tile on
 * each end, two squares between them, and a wide strip under the squares —
 * with the caption rendered LIVE over a bottom scrim, so promo copy stays
 * translatable content instead of being baked into artwork.
 *
 * Slots are positional like the classic bento: blocks map by index
 * [tall, square, square, tall, wide]. Missing images render a quiet
 * placeholder tile, never a hole in the grid.
 */
export function PromoSplitGrid({
  locale,
  cards,
}: {
  locale: Locale;
  cards: PromoSplitCard[];
}) {
  const slots = Array.from({ length: 5 }, (_, index) => cards[index]).map(
    (card) => ({
      imageSrc: card?.imageSrc ?? "",
      href: card?.href ?? "",
      label: card?.label ?? "",
    }),
  );
  if (slots.every((slot) => !slot.imageSrc)) return null;

  // Natural grid flow places [tall, sq, sq, tall] across the four columns
  // (the row-spans pin the talls to rows 1–2), leaving the wide strip to
  // fill columns 2–3 of the second row.
  const spans = [
    "row-span-2",
    "",
    "",
    "row-span-2",
    "col-span-2",
  ];

  return (
    <section className="py-4 lg:py-6">
      <div className="container mx-auto px-4">
        <div className="grid auto-rows-[150px] grid-cols-2 gap-2.5 sm:auto-rows-[180px] lg:auto-rows-[236px] lg:grid-cols-4 lg:gap-3.5">
          {slots.map((slot, index) => {
            const body = (
              <>
                {slot.imageSrc ? (
                  <AppImage
                    src={slot.imageSrc}
                    alt={slot.label || ""}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    sizes="(min-width: 1024px) 25vw, 50vw"
                  />
                ) : (
                  <span className="absolute inset-0 bg-accent/50" aria-hidden />
                )}
                {slot.label ? (
                  <span className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 bg-gradient-to-t from-black/80 via-black/35 to-transparent p-4 pt-10 sm:p-5 sm:pt-12">
                    <span className="text-base font-bold tracking-tight text-white sm:text-lg">
                      {slot.label}
                    </span>
                    <ArrowRight
                      className="h-5 w-5 shrink-0 text-white rtl:rotate-180"
                      aria-hidden
                    />
                  </span>
                ) : null}
              </>
            );
            const className = cn(
              "group relative block overflow-hidden rounded-lg",
              spans[index],
            );
            return slot.href ? (
              <Link
                key={index}
                href={resolveSectionHref(locale, slot.href)}
                className={className}
                {...(isExternalSectionHref(slot.href)
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
              >
                {body}
              </Link>
            ) : (
              <span key={index} className={className}>
                {body}
              </span>
            );
          })}
        </div>
      </div>
    </section>
  );
}
