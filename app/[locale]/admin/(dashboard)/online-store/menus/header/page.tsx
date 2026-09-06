import { setRequestLocale } from "next-intl/server";
import { requireAdminPageAccess } from "@/lib/admin-page-guard";
import { HeaderBuilder } from "@/components/admin/online-store/header-builder";
import { getDraftGroupSections } from "@/lib/storefront/pages/get-template";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function OnlineStoreMenusHeaderPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  await requireAdminPageAccess(locale);

  // The announcement bar and top tags live as section instances on the
  // header group document; the builder edits them alongside the settings.
  const chromeSections = await getDraftGroupSections("header");

  return (
    <HeaderBuilder
      locale={locale}
      initialChromeSections={JSON.parse(JSON.stringify(chromeSections))}
    />
  );
}
