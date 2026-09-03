"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight, Package } from "lucide-react";
import { AppImage } from "@/components/ui/app-image";
import { type Locale } from "@/config/i18n.config";
import { cn } from "@/lib/utils";

export interface ScrollerCategory {
  id: string;
  slug: string;
  name: string;
  image?: string;
}

/**
 * The design's department row: circular tiles between two round arrows.
 *
 * The arrows are the reason this is a client component — everything else
 * would render fine on the server, but a row that overflows without a way
 * to move it is the one thing the design does not do. They hide themselves
 * when the row already fits, so a store with four categories shows no
 * controls at all.
 */
export function ElectronicsCategoryScroller({
  locale,
  categories,
}: {
  locale: Locale;
  categories: ScrollerCategory[];
}) {
  const t = useTranslations();
  const trackRef = useRef<HTMLDivElement>(null);
  const [overflowing, setOverflowing] = useState(false);

  const measure = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    setOverflowing(track.scrollWidth - track.clientWidth > 8);
  }, []);

  useEffect(() => {
    measure();
    const track = trackRef.current;
    if (!track || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(track);
    return () => observer.disconnect();
  }, [measure, categories.length]);

  const scrollBy = useCallback((direction: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({
      left: direction * Math.max(track.clientWidth * 0.8, 200),
      behavior: "smooth",
    });
  }, []);

  return (
    <div className="flex items-center gap-2 sm:gap-4">
      <ScrollButton
        direction="left"
        hidden={!overflowing}
        label={t("common.previous")}
        onClick={() => scrollBy(-1)}
      />
      <div
        ref={trackRef}
        className="flex flex-1 justify-start gap-6 overflow-x-auto scroll-smooth pb-1 sm:gap-8 lg:gap-[38px] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {/* `justify-start` plus auto margins keeps a short row centred
            without breaking scrolling when it is long. */}
        <span className="m-auto flex gap-6 sm:gap-8 lg:gap-[38px]">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/${locale}/categories/${category.slug}`}
              className="group flex w-[112px] shrink-0 flex-col items-center gap-3 sm:w-[132px] lg:w-[152px] lg:gap-[15px]"
            >
              <span className="grid aspect-square w-full place-items-center overflow-hidden rounded-full bg-muted transition-colors group-hover:bg-muted/70">
                {category.image ? (
                  <AppImage
                    src={category.image}
                    alt=""
                    width={152}
                    height={152}
                    aria-hidden
                    className="h-[62%] w-[62%] object-contain transition-transform duration-300 group-hover:scale-[1.05]"
                    sizes="152px"
                  />
                ) : (
                  <Package
                    className="h-8 w-8 text-muted-foreground"
                    aria-hidden
                  />
                )}
              </span>
              <span className="line-clamp-2 text-center text-[13px] font-bold leading-[1.205] tracking-[-0.02em] text-foreground transition-colors group-hover:text-primary sm:text-[15.66px]">
                {category.name}
              </span>
            </Link>
          ))}
        </span>
      </div>
      <ScrollButton
        direction="right"
        hidden={!overflowing}
        label={t("common.next")}
        onClick={() => scrollBy(1)}
      />
    </div>
  );
}

function ScrollButton({
  direction,
  hidden,
  label,
  onClick,
}: {
  direction: "left" | "right";
  hidden: boolean;
  label: string;
  onClick: () => void;
}) {
  const Icon = direction === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      // Kept in the layout when it has nothing to do, so the row does not
      // shift sideways the moment a category is added.
      className={cn(
        "hidden size-10 shrink-0 place-items-center rounded-full bg-muted text-foreground/50 transition-colors hover:bg-muted/70 hover:text-foreground sm:grid",
        hidden && "invisible",
      )}
    >
      <Icon className="size-5" />
    </button>
  );
}
