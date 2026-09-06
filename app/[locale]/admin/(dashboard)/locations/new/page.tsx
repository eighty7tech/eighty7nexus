import { setRequestLocale } from "next-intl/server";
import { requireAdminOrStaffPageAccess } from "@/lib/staff-page-guard";
import { STAFF_PERMISSIONS } from "@/config/permissions.config";
import { BranchDetailShell } from "@/components/admin/locations/branch-detail-shell";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function NewBranchPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  await requireAdminOrStaffPageAccess({
    locale,
    required: [STAFF_PERMISSIONS.MANAGE_INVENTORY],
  });

  return <BranchDetailShell locale={locale} isNew />;
}
