import { setRequestLocale } from "next-intl/server";
import { requireAdminPageAccess } from "@/lib/admin-page-guard";
import { ProductCardBuilder } from "@/components/admin/online-store/product-card-builder";

interface PageProps {
  params: Promise<{ locale: string }>;
}

/**
 * The product card configurator — reached from the Customize page switcher
 * (a `nav:` entry, like Checkout). One store-wide card design: element
 * order/grouping, visibility toggles, and style, seeded from fixed templates.
 */
export default async function OnlineStoreProductCardPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  await requireAdminPageAccess(locale);

  return <ProductCardBuilder locale={locale} />;
}
