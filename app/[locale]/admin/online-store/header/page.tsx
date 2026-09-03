import { setRequestLocale } from "next-intl/server";
import { requireAdminPageAccess } from "@/lib/admin-page-guard";
import { HeaderBuilder } from "@/components/admin/online-store/header-builder";
import { getDraftGroupSections } from "@/lib/storefront/pages/get-template";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function OnlineStoreHeaderPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  await requireAdminPageAccess(locale);
  const initialChromeSections = await getDraftGroupSections("header");

  return (
    <HeaderBuilder
      locale={locale}
      initialChromeSections={initialChromeSections}
    />
  );
}
