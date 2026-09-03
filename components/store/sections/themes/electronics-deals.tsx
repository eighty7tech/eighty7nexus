import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { type Locale } from "@/config/i18n.config";
import { getStorefrontProductCards } from "@/lib/products/storefront-product-cards";
import { CountdownTimer } from "@/components/store/sections/countdown-timer";
import { ElectronicsDealsProducts } from "@/components/store/sections/themes/electronics-deals-products";
import {
  isExternalSectionHref,
  resolveSectionHref,
} from "@/components/store/sections/section-shell";

const DEAL_CARDS = 5;

/**
 * Electronics' deadline strip: the design's full-bleed DEALS panel — the
 * two-tone heading, white countdown cards and a "view all" pill on a
 * violet field, with the products the deadline is about arranged
 * 2 + featured + 2 underneath (first deal = the large mini-PDP card).
 *
 * The field is the DESIGN's fixed indigo→violet gradient, not `--primary`:
 * like the hero side cards it reads as artwork, identical in both themes,
 * so every colour inside is chosen against it (white text, white cards).
 * The merchant's Branding still owns what it should — the sale prices on
 * the cards are `--primary`.
 */
export async function ElectronicsDeals({
  locale,
  heading,
  subheading,
  endsAt,
  ctaLabel,
  href,
  productIds = [],
  emptyState = null,
}: {
  locale: Locale;
  heading: string;
  subheading: string;
  endsAt: string;
  ctaLabel: string;
  href: string;
  /** Hand-picked deals; empty means "whatever is on sale". */
  productIds?: string[];
  /** Labelled outline for the admin preview; null on the live storefront. */
  emptyState?: React.ReactNode;
}) {
  const hasDeadline = Boolean(endsAt) && !Number.isNaN(Date.parse(endsAt));
  const chosen = productIds.filter(Boolean).slice(0, DEAL_CARDS);

  // A countdown with no deadline has nothing to say. Live storefronts stay
  // silent; the admin preview shows which field is missing.
  if (!hasDeadline) return emptyState;

  const t = await getTranslations({ locale, namespace: "home" });

  const products = await getStorefrontProductCards(
    chosen.length > 0
      ? { ids: chosen, limit: chosen.length }
      : { onSale: true, limit: DEAL_CARDS },
  ).catch(() => []);

  const target = href ? resolveSectionHref(locale, href) : "";
  const external = isExternalSectionHref(href);

  return (
    <section className="py-5 lg:py-8">
      <div className="container mx-auto px-4">
        <div
          className="overflow-hidden rounded-[14px] px-4 pb-[19px] pt-8 sm:px-5 lg:pt-[54px]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(0,0,0,0.54), rgba(0,0,0,0.54)), linear-gradient(180deg, #313BFF 0%, #B35DFF 100%)",
          }}
        >
          <div className="flex flex-col gap-6 pb-8 lg:flex-row lg:items-center lg:justify-between lg:gap-4 lg:px-[47px] lg:pb-[52px]">
            <div className="min-w-[139px]">
              {subheading ? (
                <p className="text-[15.5px] leading-[1.77] tracking-[-0.03em] text-white">
                  {subheading}
                </p>
              ) : null}
              {heading ? (
                <h2 className="-mt-1.5 bg-gradient-to-r from-white from-30% to-[#c665ff]/50 bg-clip-text text-[38px] font-bold uppercase leading-[1.2] tracking-[-0.03em] text-transparent sm:text-[46.6px]">
                  {heading}
                </h2>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-4 sm:gap-[31px]">
              <span className="text-[15.5px] font-bold tracking-[-0.03em] text-white/40">
                {t("countdownEndsIn")}
              </span>
              <CountdownTimer
                endsAt={endsAt}
                appearance="cards"
                labels={{
                  days: t("countdownDays"),
                  hours: t("countdownHours"),
                  minutes: t("countdownMinutes"),
                  seconds: t("countdownSeconds"),
                }}
              />
            </div>

            {ctaLabel && target ? (
              <Link
                href={target}
                {...(external
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
                className="flex h-[38px] w-fit min-w-[194px] items-center justify-center rounded-full bg-white/20 px-8 text-[12px] font-bold text-white transition-colors hover:bg-white/30"
              >
                {ctaLabel}
              </Link>
            ) : null}
          </div>

          {products.length > 0 ? (
            <ElectronicsDealsProducts products={products} locale={locale} />
          ) : null}
        </div>
      </div>
    </section>
  );
}
