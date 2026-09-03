import { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { connectDB } from "@/lib/db";
import { InventoryLocation } from "@/models/inventory-location.model";
import { notFound } from "next/navigation";
import { requireAdminPageAccess } from "@/lib/admin-page-guard";

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

export default async function AdminBranchSettingsPage({ params }: PageProps) {
  const { locale, id } = await params;
  const t = await getTranslations({ locale });
  setRequestLocale(locale);

  await requireAdminPageAccess(locale);
  await connectDB();

  let branch = null;
  if (id !== "new") {
    branch = await InventoryLocation.findById(id).lean();
    if (!branch) {
      notFound();
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          {id === "new" ? "Create Branch" : "Branch Settings"}
        </h1>
        <p className="text-muted-foreground">
          {id === "new" 
            ? "Add a new physical location to your operations." 
            : `Manage configuration for ${branch?.name}`}
        </p>
      </div>

      <div className="p-8 text-center text-muted-foreground bg-card border rounded-lg">
        {/* TODO: Add Branch Settings Form */}
        Branch Settings Form Implementation Pending
      </div>
    </div>
  );
}
