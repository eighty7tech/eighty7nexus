import { getTranslations } from "next-intl/server";
import { type Locale } from "@/config/i18n.config";
import { HomeNewArrivalsCarousel } from "@/components/store/home-new-arrivals-carousel";
import {
  buildSponsoredLane,
  getSponsoredLadderPool,
  getSponsoredPlacementDepths,
  getStorefrontBoostingSettings,
  laneHasSponsored,
  resolveLadderAt,
} from "@/lib/sponsored-products";
import { getStorefrontProductCards } from "@/lib/products/storefront-product-cards";
import {
  SPONSORED_PRODUCTS_LIMIT_MAX,
  SPONSORED_PRODUCTS_LIMIT_MIN,
} from "@/lib/home-page-config";

/**
 * Home rail — a MIXED shelf under strict-index rendering: the product holding
 * position N sits at slot N, and an unsold rung shows a regular product rather
 * than collapsing the row.
 *
 * That is why the heading is not "Sponsored" any more. A "Sponsored" title over
 * a rail whose slots 2 and 3 are organic misdescribes those cards as ads — a
 * disclosure defect in the opposite direction. The per-card pill is the legal
 * disclosure and stays exactly where it was; the section says only that it
 * *includes* paid placements, and only when it actually does.
 */
export async function HomeSponsoredProducts({
  locale,
  title,
  limit = 8,
}: {
  locale: Locale;
  title?: string;
  limit?: number;
}) {
  const boosting = await getStorefrontBoostingSettings();
  if (!boosting.enabled || !boosting.placements.home) return null;

  const depths = await getSponsoredPlacementDepths();
  const depth = Math.min(
    SPONSORED_PRODUCTS_LIMIT_MAX,
    Math.max(
      SPONSORED_PRODUCTS_LIMIT_MIN,
      Math.floor(limit) || depths.home || 8,
    ),
  );

  const [pool, fillers] = await Promise.all([
    getSponsoredLadderPool({ hideOutOfStock: boosting.hideOutOfStock }),
    // A constant limit, not depth + ladder.length: getStorefrontProductCards is
    // cached on its serialized argument, and a ladder-dependent limit would mint
    // a fresh cache entry every time a booking starts or ends.
    getStorefrontProductCards({
      limit: SPONSORED_PRODUCTS_LIMIT_MAX * 2,
      hideOutOfStock: boosting.hideOutOfStock,
    }),
  ]);

  const lane = buildSponsoredLane(resolveLadderAt(pool), fillers, depth);

  // Nothing sold WITHIN THIS RAIL'S OWN DEPTH renders nothing. A booking at
  // position 9 with a home depth of 4 reaches this rail not at all, and printing
  // "includes paid placements" over four organic cards would be an affirmatively
  // false disclosure. An install with boosting configured but unsold shows no
  // trace of the feature, exactly as before.
  if (!laneHasSponsored(lane)) return null;

  const t = await getTranslations({ locale });
  const includesSponsored = t.has("common.includesSponsored")
    ? t("common.includesSponsored")
    : "Includes paid placements";

  return (
    <HomeNewArrivalsCarousel
      locale={locale}
      products={lane}
      title={title || (t.has("home.recommended") ? t("home.recommended") : "Recommended for you")}
      subtitle={includesSponsored}
      desktopColumns={4}
    />
  );
}
