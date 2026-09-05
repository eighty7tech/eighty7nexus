import { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { Store, CheckCircle, PackageSearch, Navigation } from "lucide-react";
import { LocationsContent } from "@/components/pos/locations-content";
import { requireAdminOrStaffPageAccess } from "@/lib/staff-page-guard";
import { STAFF_PERMISSIONS } from "@/config/permissions.config";
import { connectDB } from "@/lib/db";
import { InventoryLocation } from "@/models/inventory-location.model";
import { Settings } from "@/models/settings.model";
import { resolveLocationScope, locationOwnerFilter } from "@/lib/inventory-location-scope";
import {
  AdminStatsStrip,
  AdminStatsStripSkeleton,
  type AdminStatsStripItem,
} from "@/components/admin/admin-stats-strip";
import { AdminListSkeleton } from "@/components/admin/admin-list-skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function AdminLocationsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const { session } = await requireAdminOrStaffPageAccess({
    locale,
    required: [STAFF_PERMISSIONS.MANAGE_INVENTORY],
  });

  return (
    <div className="space-y-4">
      <Suspense fallback={<div className="h-24 animate-pulse rounded-xl bg-muted" />}>
        <StoreHeader locale={locale} />
      </Suspense>

      <Suspense fallback={<AdminStatsStripSkeleton items={4} />}>
        <LocationsStats locale={locale} user={session.user} />
      </Suspense>

      <Suspense fallback={<AdminListSkeleton stats={0} columns={5} tabs={2} />}>
        <LocationsContent locale={locale} basePath="/admin/locations" />
      </Suspense>
    </div>
  );
}

async function StoreHeader({ locale }: { locale: string }) {
  await connectDB();
  const settings = await Settings.findOne().select("general").lean();
  const general: any = settings?.general || {};

  return (
    <Card className="bg-muted/30">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Store className="h-5 w-5 text-primary" />
          {general.storeName || "Primary Store"}
        </CardTitle>
        <CardDescription>
          Master branch and global locations configuration
        </CardDescription>
      </CardHeader>
      {(general.storeEmail || general.storePhone || general.storeAddress) && (
        <CardContent className="grid gap-4 sm:grid-cols-3">
          {general.storeEmail && (
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground">Master Email</span>
              <span className="text-sm">{general.storeEmail}</span>
            </div>
          )}
          {general.storePhone && (
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground">Master Phone</span>
              <span className="text-sm">{general.storePhone}</span>
            </div>
          )}
          {general.storeAddress && (
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground">Base Address</span>
              <span className="text-sm line-clamp-1">{general.storeAddress}</span>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

async function LocationsStats({ locale, user }: { locale: string, user: any }) {
  const t = await getTranslations({ locale });
  await connectDB();

  const scope = await resolveLocationScope(user, "read");
  const baseFilter = locationOwnerFilter(scope);

  const [
    totalBranches,
    activeBranches,
    pickupStations,
    fulfillmentCenters,
  ] = await Promise.all([
    InventoryLocation.countDocuments(baseFilter),
    InventoryLocation.countDocuments({ ...baseFilter, isActive: true }),
    InventoryLocation.countDocuments({ ...baseFilter, pickupEnabled: true }),
    InventoryLocation.countDocuments({ ...baseFilter, fulfillsOnlineOrders: true }),
  ]);

  const statItems: AdminStatsStripItem[] = [
    {
      title: "Total Branches",
      value: totalBranches,
      description: "Total physical locations",
      icon: <Store className="h-5 w-5" />,
      iconClassName: "text-blue-700 bg-blue-100",
    },
    {
      title: "Active Branches",
      value: activeBranches,
      description: "Currently open and active",
      icon: <CheckCircle className="h-5 w-5" />,
      iconClassName: "text-green-700 bg-green-100",
    },
    {
      title: "Pickup Stations",
      value: pickupStations,
      description: "Branches accepting pickups",
      icon: <Navigation className="h-5 w-5" />,
      iconClassName: "text-amber-700 bg-amber-100",
    },
    {
      title: "Fulfillment Centers",
      value: fulfillmentCenters,
      description: "Branches fulfilling orders",
      icon: <PackageSearch className="h-5 w-5" />,
      iconClassName: "text-indigo-700 bg-indigo-100",
    },
  ];

  return <AdminStatsStrip items={statItems} />;
}
