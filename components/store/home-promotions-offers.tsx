import Link from "next/link";
import { AppImage } from "@/components/ui/app-image";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { type Locale } from "@/config/i18n.config";

export interface PromotionOfferCard {
  imageSrc: string;
  href: string;
}

interface HomePromotionsOffersProps {
  locale: Locale;
  className?: string;
  cards?: PromotionOfferCard[];
}

const FALLBACK_CARDS: PromotionOfferCard[] = [
  { imageSrc: "", href: "/products" },
  { imageSrc: "", href: "/products" },
  { imageSrc: "", href: "/products" },
  { imageSrc: "", href: "/products" },
  { imageSrc: "", href: "/products" },
];

// Three regimes, and `sizes` has to name all three or the browser guesses
// badly at both ends. Below 640px the grid is pinned to its 576px min-width
// and scrolls, so a column is a fixed 138px. Past 1360px the container stops
// growing and a column settles at (1360 - 32 padding - 60 gaps) / 4 = 317px,
// the width the banners were authored at — without that arm a 1920px viewport
// would fetch a 480px crop for a 317px slot. In between it really is a quarter
// of the viewport.
const COLUMN_SIZES =
  "(min-width: 1360px) 317px, (min-width: 640px) 25vw, 138px";
const WIDE_SIZES = "(min-width: 1360px) 654px, (min-width: 640px) 50vw, 284px";

function resolveCard(
  card: PromotionOfferCard | undefined,
  fallback: PromotionOfferCard,
): PromotionOfferCard {
  if (!card) return fallback;
  return {
    imageSrc: card.imageSrc || fallback.imageSrc,
    href: card.href || fallback.href,
  };
}

function buildHref(locale: Locale, href: string): string {
  if (!href) return `/${locale}`;
  if (href.startsWith("http://") || href.startsWith("https://")) return href;
  if (href.startsWith(`/${locale}/`) || href === `/${locale}`) return href;
  return `/${locale}${href.startsWith("/") ? href : `/${href}`}`;
}

export function HomePromotionsOffers({
  locale,
  className,
  cards,
}: HomePromotionsOffersProps) {
  const tall1 = resolveCard(cards?.[0], FALLBACK_CARDS[0]);
  const tall2 = resolveCard(cards?.[1], FALLBACK_CARDS[1]);
  const square1 = resolveCard(cards?.[2], FALLBACK_CARDS[2]);
  const square2 = resolveCard(cards?.[3], FALLBACK_CARDS[3]);
  const wide = resolveCard(cards?.[4], FALLBACK_CARDS[4]);

  return (
    <section className={cn("py-5 lg:py-8", className)}>
      <div className="container mx-auto">
        {/* Below sm the four columns can't be both legible and fit, so the
            grid holds a fixed 576px and this scrolls sideways rather than
            shrinking the banners to ~85px. From sm up the grid fits the
            container and there is nothing to scroll. The padding lives here,
            not on the parent, so the artwork can run past the gutter. */}
        <div className="overflow-x-auto scroll-smooth px-4 pb-1 sm:overflow-visible sm:pb-0 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {/* The same four-column bento at every width — only its scale and
              gap change. */}
          <div className="grid min-w-[576px] grid-cols-4 grid-rows-2 gap-2 sm:min-w-0 sm:gap-3 lg:gap-5">
            <BentoCard
              card={tall1}
              locale={locale}
              className="col-span-1 row-span-2 aspect-317/565"
              sizes={COLUMN_SIZES}
            />

            <BentoCard
              card={tall2}
              locale={locale}
              className="col-span-1 row-span-2 aspect-317/565"
              sizes={COLUMN_SIZES}
            />

            <BentoCard
              card={square1}
              locale={locale}
              className="col-span-1 row-span-1 aspect-317/272"
              sizes={COLUMN_SIZES}
            />

            <BentoCard
              card={square2}
              locale={locale}
              className="col-span-1 row-span-1 aspect-317/272"
              sizes={COLUMN_SIZES}
            />

            <BentoCard
              card={wide}
              locale={locale}
              className="col-span-2 row-span-1 aspect-654/272"
              sizes={WIDE_SIZES}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function BentoCard({
  card,
  locale,
  className,
  sizes,
}: {
  card: PromotionOfferCard;
  locale: Locale;
  className?: string;
  sizes: string;
}) {
  return (
    <Link
      href={buildHref(locale, card.href)}
      className={cn(
        "group relative isolate overflow-hidden rounded-sm bg-muted sm:rounded-md",
        className,
      )}
    >
      {card.imageSrc ? (
        <AppImage
          src={card.imageSrc}
          alt=""
          fill
          sizes={sizes}
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
          aria-hidden="true"
        />
      ) : (
        <div className="absolute inset-0 grid place-items-center">
          <ImageOff className="h-8 w-8 text-muted-foreground/40" />
        </div>
      )}
    </Link>
  );
}
