import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { auth } from "@/lib/auth";
import { USER_ROLES } from "@/config/app.config";
import { type Locale } from "@/config/i18n.config";
import { DraftPreviewPill } from "@/components/store/draft-preview-pill";
import { SectionPreviewBridge } from "@/components/store/section-preview-bridge";
import { StoreSections } from "@/components/store/store-sections";
import { getStorefrontProductBySlug } from "@/lib/products/storefront-product-detail";
import { getStorefrontProductCards } from "@/lib/products/storefront-product-cards";
import { getStorefrontProductFilters } from "@/lib/products/storefront-product-filters";
import { getStorefrontCategoryBySlug } from "@/lib/storefront-categories";
import { getStorefrontCollectionDetail } from "@/lib/storefront-collections";
import { getDraftHomeSections, getHomePageSections } from "@/lib/storefront/pages/get-home-page";
import { getDraftLandingPage } from "@/lib/storefront/pages/get-landing-page";
import {
  getDraftGroupSections,
  getDraftTemplateSections,
} from "@/lib/storefront/pages/get-template";
import type { RenderableTemplateType } from "@/lib/storefront/pages/default-templates";
import {
  isValidPageHandle,
  STORE_GROUP_TYPES,
  type StoreGroupType,
} from "@/lib/storefront/pages/handles";
import type {
  CollectionTemplateResource,
  SectionRenderContext,
  TemplateResource,
} from "@/lib/storefront/sections/types";
import { getStorefrontSettings } from "@/lib/storefront-settings";

interface PageProps {
  params: Promise<{ locale: string; handle?: string[] }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

const RENDERABLE_TEMPLATE_TYPES: RenderableTemplateType[] = [
  "product",
  "products",
  "category",
  "collection",
  "cart",
];

function isRenderableTemplateType(
  value: string,
): value is RenderableTemplateType {
  return (RENDERABLE_TEMPLATE_TYPES as string[]).includes(value);
}

/**
 * Resolve a SAMPLE resource for a template draft: an explicit pick from the
 * query (`?product=` / `?category=` / `?collection=`), else the first thing
 * the store has. A store with nothing to sample still previews — the core
 * sections simply render nothing.
 */
async function resolveSampleResource(
  type: RenderableTemplateType,
  query: { [key: string]: string | string[] | undefined },
): Promise<{ resource?: TemplateResource; livePath?: string }> {
  if (type === "cart") {
    return { resource: { type: "cart" }, livePath: "/cart" };
  }
  if (type === "products") {
    return {
      resource: { type: "products", searchParams: {}, location: {} },
      livePath: "/products",
    };
  }
  if (type === "product") {
    const requested =
      typeof query.product === "string" ? query.product : undefined;
    let product = requested
      ? await getStorefrontProductBySlug(requested)
      : null;
    if (!product) {
      const [card] = await getStorefrontProductCards({ limit: 1 });
      if (card?.slug) product = await getStorefrontProductBySlug(card.slug);
    }
    if (!product) return {};
    return {
      resource: { type: "product", product, location: {} },
      livePath: `/products/${product.slug}`,
    };
  }
  if (type === "category") {
    let slug = typeof query.category === "string" ? query.category : undefined;
    if (!slug) {
      const { categories } = await getStorefrontProductFilters();
      slug = categories[0]?.slug;
    }
    const category = slug ? await getStorefrontCategoryBySlug(slug) : null;
    if (!category) return {};
    return {
      resource: {
        type: "category",
        category,
        searchParams: {},
        location: {},
      },
      livePath: `/categories/${category.slug}`,
    };
  }
  // collection
  let slug =
    typeof query.collection === "string" ? query.collection : undefined;
  if (!slug) {
    const { collections } = await getStorefrontProductFilters();
    slug = collections[0]?.slug;
  }
  const data = slug
    ? await getStorefrontCollectionDetail({ slug, page: 1, limit: 24 })
    : null;
  if (!data) return {};
  const detail = data as unknown as Pick<
    CollectionTemplateResource,
    "collection" | "products" | "pagination"
  >;
  return {
    resource: {
      type: "collection",
      collection: detail.collection,
      products: detail.products,
      pagination: detail.pagination,
      searchParams: {},
      location: {},
    },
    livePath: `/collections/${detail.collection.slug}`,
  };
}

/**
 * Admin-only DRAFT rendering, on its own route so the real storefront pages
 * never touch a request API for it: `/draft` previews the home draft,
 * `/draft/<handle>` a landing page's, `/draft/template/<type>` a template's
 * — against a sample resource. Living inside the (store) layout keeps the
 * preview honest (real header, footer, theme tokens), and being a separate
 * URL — not a draft-mode cookie — means an admin's ordinary browsing is
 * never silently switched to drafts.
 */
export default async function DraftPreviewPage({
  params,
  searchParams,
}: PageProps) {
  const { locale, handle: handleParts } = await params;
  setRequestLocale(locale);

  const session = await auth.api.getSession({ headers: await headers() });
  if (session?.user?.role !== USER_ROLES.ADMIN) {
    notFound();
  }

  const settings = await getStorefrontSettings();
  const baseCtx = {
    locale: locale as Locale,
    defaultLanguage: settings.defaultLanguage,
    isMultiVendorEnabled: settings.isMultiVendorEnabled,
    themeId: settings.theme.id,
    themeSettings: settings.theme.settings,
    // This route, and only this route, shows placeholders for sections that
    // have nothing to render — so the merchant reviewing a freshly applied
    // theme sees the whole design and what still needs feeding. The live
    // storefront leaves them silent.
    preview: true,
  };

  let sections;
  let ctx: SectionRenderContext;
  let livePath = `/${locale}`;

  if (handleParts?.[0] === "group") {
    // Chrome-group preview: the layout's LIVE copy of this chrome piece is
    // hidden (via data-store-chrome) and the DRAFT group renders in its
    // place, with the published home body as context. Publishing is what
    // changes the real storefront — this page only looks like it.
    const group = handleParts[1];
    if (
      handleParts.length !== 2 ||
      !(STORE_GROUP_TYPES as readonly string[]).includes(group)
    ) {
      notFound();
    }
    const [draftGroup, home] = await Promise.all([
      getDraftGroupSections(group as StoreGroupType),
      getHomePageSections(),
    ]);
    const bodyCtx: SectionRenderContext = { ...baseCtx, templateType: "home" };

    return (
      <>
        <style>{`[data-store-chrome="${group}"]{display:none}`}</style>
        {group === "header" ? (
          <>
            <StoreSections sections={draftGroup} ctx={baseCtx} editable />
            <StoreSections sections={home.sections} ctx={bodyCtx} />
          </>
        ) : (
          <>
            <StoreSections sections={home.sections} ctx={bodyCtx} />
            <StoreSections sections={draftGroup} ctx={baseCtx} editable />
          </>
        )}
        <DraftPreviewPill locale={locale as Locale} livePath={`/${locale}`} />
        <SectionPreviewBridge />
      </>
    );
  }

  if (handleParts?.[0] === "template") {
    const type = handleParts[1];
    if (handleParts.length !== 2 || !isRenderableTemplateType(type)) {
      notFound();
    }

    const [drafted, sample] = await Promise.all([
      getDraftTemplateSections(type),
      resolveSampleResource(type, await searchParams),
    ]);
    sections = drafted;
    ctx = {
      ...baseCtx,
      templateType: type,
      ...(sample.resource ? { resource: sample.resource } : {}),
    };
    if (sample.livePath) livePath = `/${locale}${sample.livePath}`;
  } else if (handleParts?.length) {
    const handle = handleParts[0];
    if (handleParts.length > 1 || !isValidPageHandle(handle)) {
      notFound();
    }
    const landing = await getDraftLandingPage(handle);
    if (!landing) notFound();
    sections = landing.sections;
    ctx = baseCtx;
    livePath = `/${locale}/pages/${handle}`;
  } else {
    sections = await getDraftHomeSections();
    ctx = { ...baseCtx, templateType: "home" };
  }

  return (
    <>
      <StoreSections sections={sections} ctx={ctx} editable />
      <DraftPreviewPill locale={locale as Locale} livePath={livePath} />
      <SectionPreviewBridge />
    </>
  );
}
