import { setRequestLocale } from "next-intl/server";
import { requireAdminPageAccess } from "@/lib/admin-page-guard";
import { CheckoutBuilder } from "@/components/admin/online-store/checkout-builder";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function OnlineStoreCheckoutPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  await requireAdminPageAccess(locale);

  return <CheckoutBuilder locale={locale} />;
}
