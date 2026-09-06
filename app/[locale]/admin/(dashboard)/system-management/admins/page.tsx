import { Suspense } from "react";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { requireAdminPageAccess } from "@/lib/admin-page-guard";
import { AdminListContent } from "./admin-list-content";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function SystemAdminsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireAdminPageAccess(locale);
  const t = await getTranslations({ locale });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Management</h1>
        <p className="text-muted-foreground">
          View, create, and manage system administrators and their roles.
        </p>
      </div>

      <Suspense fallback={<div>Loading admins...</div>}>
        <AdminListContent locale={locale} />
      </Suspense>
    </div>
  );
}
