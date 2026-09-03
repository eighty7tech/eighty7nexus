import { CouponBanner } from "@/components/store/sections/coupon-banner";
import { lt } from "../localized";
import type { LocalizedText, SectionDefinition } from "../types";

export const couponBanner: SectionDefinition = {
  type: "coupon-banner",
  version: 1,
  category: "promotions",
  fields: [
    { key: "heading", type: "text", translatable: true, default: "Get 20% off" },
    { key: "subheading", type: "text", translatable: true, default: "" },
    // The coupon code itself — one code for every locale, matching Discounts.
    { key: "code", type: "text", default: "" },
    { key: "ctaLabel", type: "text", translatable: true, default: "" },
    { key: "link", type: "url", default: "" },
    { key: "image", type: "image" },
  ],
  Render({ settings, ctx }) {
    return (
      <CouponBanner
        locale={ctx.locale}
        heading={lt(settings.heading as LocalizedText, ctx.locale, ctx.defaultLanguage)}
        subheading={lt(settings.subheading as LocalizedText, ctx.locale, ctx.defaultLanguage)}
        code={lt(settings.code as LocalizedText, ctx.locale, ctx.defaultLanguage)}
        ctaLabel={lt(settings.ctaLabel as LocalizedText, ctx.locale, ctx.defaultLanguage)}
        href={settings.link as string}
        imageSrc={settings.image as string}
      />
    );
  },
};
