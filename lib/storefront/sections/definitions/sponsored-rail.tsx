import { HomeSponsoredProducts } from "@/components/store/home-sponsored-products";
import { NewArrivalsSkeleton } from "@/components/store/home-section-skeletons";
import {
  SPONSORED_PRODUCTS_LIMIT_MAX,
  SPONSORED_PRODUCTS_LIMIT_MIN,
} from "@/lib/home-page-config";
import { lt } from "../localized";
import type { LocalizedText, SectionDefinition } from "../types";

/**
 * Paid boost placements. Content comes from live campaigns, never from
 * merchant picks — only the title and slot count are editable, and the
 * section renders nothing while boosting is disabled.
 */
export const sponsoredRail: SectionDefinition = {
  type: "sponsored-rail",
  version: 1,
  category: "products",
  // One per page: strict-index rendering sells specific visual rungs, and a
  // second rail would double-sell them. Render enforces this cap even if a
  // hand-edited document says otherwise.
  maxPerPage: 1,
  fields: [
    // NOT "Sponsored". Strict-index rendering makes this a MIXED shelf: the
    // paid rungs sit at their own visual slots and every unsold rung shows an
    // ordinary product. A "Sponsored" heading over that row misdescribes the
    // organic cards as ads. The per-card pill is the disclosure; the rail
    // carries `common.includesSponsored` underneath.
    { key: "title", type: "text", translatable: true, default: "Recommended for you" },
    {
      key: "limit",
      type: "number",
      default: 8,
      min: SPONSORED_PRODUCTS_LIMIT_MIN,
      max: SPONSORED_PRODUCTS_LIMIT_MAX,
    },
  ],
  available: (ctx) => ctx.isMultiVendorEnabled,
  Render({ settings, ctx }) {
    return (
      <HomeSponsoredProducts
        locale={ctx.locale}
        title={lt(settings.title as LocalizedText, ctx.locale, ctx.defaultLanguage)}
        limit={settings.limit as number}
      />
    );
  },
  Skeleton: () => <NewArrivalsSkeleton desktopColumns={4} />,
};
