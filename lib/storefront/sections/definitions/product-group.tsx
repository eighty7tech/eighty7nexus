import {
  PRODUCT_GROUP_SOURCES,
  ProductGroup,
  type ProductGroupSource,
} from "@/components/store/sections/product-group";
import { NewArrivalsSkeleton } from "@/components/store/home-section-skeletons";
import { lt } from "../localized";
import type {
  LocalizedText,
  SectionDefinition,
  SectionRenderProps,
} from "../types";

function props({ settings, blocks, ctx }: SectionRenderProps) {
  return {
    locale: ctx.locale,
    title: lt(settings.title as LocalizedText, ctx.locale, ctx.defaultLanguage),
    tabs: blocks
      .filter((block) => block.visible)
      .map((block) => ({
        id: block.id,
        label: lt(block.settings.label as LocalizedText, ctx.locale, ctx.defaultLanguage),
        source: block.settings.source as ProductGroupSource,
        productIds: block.settings.productIds as string[],
      })),
  };
}

/** The original arrangement: heading left, tab rail right. */
const standard: SectionDefinition["Render"] = (renderProps) => (
  <ProductGroup {...props(renderProps)} appearance="standard" />
);

/** Centred two-tone heading over a centred pill rail — the Figma pattern. */
const centered: SectionDefinition["Render"] = (renderProps) => (
  <ProductGroup {...props(renderProps)} appearance="centered" />
);

const Skeleton = () => <NewArrivalsSkeleton desktopColumns={4} />;

/** Tabbed product shelves — the Figma "Best Selling" pattern. */
export const productGroup: SectionDefinition = {
  type: "product-group",
  version: 1,
  category: "products",
  // FIRST entry is the default every existing document falls back to — never
  // reorder this list, only append.
  variants: [
    { key: "standard", name: "Heading + side tabs", Render: standard, Skeleton },
    { key: "centered", name: "Centered tabs", Render: centered, Skeleton },
  ],
  fields: [
    { key: "title", type: "text", translatable: true, default: "Best Selling" },
  ],
  blocks: [
    {
      type: "tab",
      max: 5,
      fields: [
        { key: "label", type: "text", translatable: true, default: "" },
        {
          key: "source",
          type: "select",
          options: PRODUCT_GROUP_SOURCES,
          default: "latest",
        },
        {
          key: "productIds",
          type: "productList",
          hint: 'Used when this tab\'s Source is "Manual selection". Drag to set the order.',
        },
      ],
    },
  ],
  starter: {
    blocks: [
      { type: "tab", settings: { label: "New", source: "latest" } },
      { type: "tab", settings: { label: "On Sale", source: "discounted" } },
    ],
  },
  Render: standard,
  Skeleton,
};
