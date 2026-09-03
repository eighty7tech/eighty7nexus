import type { ComponentProps } from "react";
import { ProductDetails } from "@/components/products/product-details";
import { ProductDetailsSkeleton } from "@/components/products/product-details-skeleton";
import { resolveProductCollectionOffer } from "@/lib/locations/product-collection";
import { getTemplateSections } from "@/lib/storefront/pages/get-template";
import {
  PRODUCT_GALLERY_LAYOUTS,
  type ProductGalleryLayout,
} from "@/lib/storefront/pages/default-templates";
import {
  DEFAULT_PRODUCT_DETAIL_ROWS_JSON,
  parseProductDetailGroups,
  visibleProductDetailGroups,
} from "@/lib/storefront/sections/product-detail-rows";
import { parseProductDetailConfig } from "@/lib/storefront/sections/product-detail-style";
import type { ProductBuyBoxAppearance } from "@/components/products/product-details";
import type { SectionDefinition } from "../types";

/**
 * The product template's CORE: gallery, buy box, description tabs — the
 * whole ProductDetails composition the hand-wired page rendered. Required,
 * locked, and singleton: "delete the product info from the product page" is
 * not a state the engine allows. `galleryLayout` here is the section-level
 * home of the retired `productGalleryLayout` theme setting, now with all
 * six arrangements the Figma spec calls for.
 *
 * The buy-box arrangement is NOT a merchant choice (no variants): the base
 * design is the Minimal composition (Figma 774:4992) and a theme that ships
 * its own buy box overrides it in `themes/overrides.tsx` — which is why
 * this factory is exported. Every appearance runs the exact same
 * ProductDetails: price, stock, preorder and variant rules are shared, only
 * the arrangement differs.
 */
export function renderProductMain(
  appearance: ProductBuyBoxAppearance,
): SectionDefinition["Render"] {
  return async function Render({ settings, ctx }) {
    const resource = ctx.resource;
    // Only absent in a draft preview of a store with no products yet.
    if (resource?.type !== "product") return null;
    const product = resource.product;

    // Resolved here rather than by the page: it depends on the shopper's
    // location, and the section is the only consumer.
    const collectionOffer = await resolveProductCollectionOffer({
      productId: String(product._id),
      vendorId: (product.vendorId as { _id?: string } | undefined)?._id,
      lat: resource.location.lat,
      lng: resource.location.lng,
      radius: resource.location.radius,
    });

    // Whether the template ALSO renders the standalone spec section (the
    // Electronics preset does): the buy box then stands its own inline
    // copy down — two spec tables on one page is the bug this prevents.
    // Cached read, so this costs nothing at render.
    const { sections: templateSections } = await getTemplateSections("product");
    const standaloneSpecs = templateSections.some(
      (section) => section.type === "product-specification" && section.visible,
    );

    return (
      <div className="container mx-auto px-4 pt-6 lg:pt-8">
        <ProductDetails
          product={
            product as unknown as ComponentProps<
              typeof ProductDetails
            >["product"]
          }
          locale={ctx.locale}
          collectionOffer={collectionOffer}
          galleryLayout={settings.galleryLayout as ProductGalleryLayout}
          appearance={appearance}
          rowGroups={visibleProductDetailGroups(
            parseProductDetailGroups(settings.rows),
          )}
          detail={parseProductDetailConfig(settings.detailStyle)}
          standaloneSpecs={standaloneSpecs}
        />
      </div>
    );
  };
}

export const productMain: SectionDefinition = {
  type: "product-main",
  version: 1,
  category: "products",
  templates: ["product"],
  required: true,
  locked: true,
  maxPerPage: 1,
  resourceType: "product",
  fields: [
    {
      key: "galleryLayout",
      type: "select",
      options: PRODUCT_GALLERY_LAYOUTS,
      default: "bottom",
    },
    // The Minimal design's row arrangement (groups, order, visibility) as a
    // JSON string — see product-detail-rows.ts. A text field so the config
    // rides the existing normalize/write machinery; the parser falls back
    // to the default arrangement on anything malformed.
    {
      key: "rows",
      type: "text",
      default: DEFAULT_PRODUCT_DETAIL_ROWS_JSON,
    },
    // Visibility + Style knobs (product-detail-style.ts), same JSON-in-text
    // arrangement as `rows`. Empty default: the parser fills every knob.
    { key: "detailStyle", type: "text", default: "" },
  ],
  // The Render awaits the location-scoped collection offer; the Skeleton
  // lets the rest of the template stream around it instead of blocking.
  Skeleton: () => (
    <div className="container mx-auto px-4 pt-6 lg:pt-8">
      <ProductDetailsSkeleton />
    </div>
  ),
  Render: renderProductMain("minimal"),
};
