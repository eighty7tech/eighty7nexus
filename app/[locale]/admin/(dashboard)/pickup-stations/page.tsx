import { setRequestLocale } from "next-intl/server";
import { requireAdminPageAccess } from "@/lib/admin-page-guard";
import { PickupStationsContent } from "@/components/admin/delivery/pickup-stations-content";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function PickupStationsAdminPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireAdminPageAccess(locale);

  return <PickupStationsContent />;
}
