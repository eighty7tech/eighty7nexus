import { CountdownOffer } from "@/components/store/sections/countdown-offer";
import { sectionEmptyState } from "@/components/store/sections/section-empty-state";
import { ElectronicsDeals } from "@/components/store/sections/themes/electronics-deals";
import { lt } from "../localized";
import type {
  LocalizedText,
  SectionDefinition,
  SectionRenderProps,
} from "../types";

function props({ settings, ctx }: SectionRenderProps) {
  return {
    locale: ctx.locale,
    heading: lt(settings.heading as LocalizedText, ctx.locale, ctx.defaultLanguage),
    subheading: lt(settings.subheading as LocalizedText, ctx.locale, ctx.defaultLanguage),
    endsAt: settings.endsAt as string,
    ctaLabel: lt(settings.ctaLabel as LocalizedText, ctx.locale, ctx.defaultLanguage),
    href: settings.link as string,
  };
}

/** The original image-backed strip — what every stored instance renders. */
const banner: SectionDefinition["Render"] = (renderProps) => (
  <CountdownOffer
    {...props(renderProps)}
    imageSrc={renderProps.settings.image as string}
    emptyState={sectionEmptyState(renderProps.ctx, {
      title: "Countdown offer",
      hint: "Set when the offer ends — the strip counts down to that moment, so without it there is nothing to show.",
    })}
  />
);

/**
 * Panel that also lays out the products the deadline is about. It ignores
 * `image` — the panel is a designed field, not artwork — which is a
 * presentation choice, not a content one: the stored image is untouched and
 * comes back with the banner design.
 */
const dealsPanel: SectionDefinition["Render"] = (renderProps) => (
  <ElectronicsDeals
    {...props(renderProps)}
    productIds={(renderProps.settings.productIds as string[]) ?? []}
    emptyState={sectionEmptyState(renderProps.ctx, {
      title: "Deals panel",
      hint: "Set when the offer ends — the panel counts down to that moment, so without it there is nothing to show.",
    })}
  />
);

export const countdownOffer: SectionDefinition = {
  type: "countdown-offer",
  version: 1,
  category: "promotions",
  // FIRST entry is the default every existing document falls back to — never
  // reorder this list, only append.
  variants: [
    { key: "banner", name: "Image banner", Render: banner },
    { key: "deals-panel", name: "Deals panel", Render: dealsPanel },
  ],
  fields: [
    { key: "heading", type: "text", translatable: true, default: "Deal of the week" },
    { key: "subheading", type: "text", translatable: true, default: "" },
    { key: "endsAt", type: "datetime", default: "" },
    { key: "ctaLabel", type: "text", translatable: true, default: "" },
    { key: "link", type: "url", default: "" },
    // Artwork is the banner's whole design; the deals panel paints its own
    // field, so the control only appears for the design that reads it.
    { key: "image", type: "image", variants: ["banner"] },
    // Which deals to feature, IN SLOT ORDER — the panel lays its picks into
    // fixed places, so the list is the layout. Empty means "whatever is on
    // sale", the behaviour the panel shipped with, so it works uncurated.
    {
      key: "productIds",
      type: "productList",
      variants: ["deals-panel"],
      max: 5,
      hint: "Drag to order: the 1st pick fills the large card, 2nd–3rd the left column, 4th–5th the right. Leave empty to show whatever is on sale.",
    },
  ],
  Render: banner,
};
