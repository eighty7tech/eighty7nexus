import { setRequestLocale } from "next-intl/server";
import { requireAdminPageAccess } from "@/lib/admin-page-guard";
import { DeliveryAdminContent } from "@/components/admin/delivery/delivery-admin-content";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function DeliveryAdminPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireAdminPageAccess(locale);

  return <DeliveryAdminContent />;
}
