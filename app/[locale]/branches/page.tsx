import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { connectDB } from "@/lib/db";
import { InventoryLocation } from "@/models/inventory-location.model";
import Link from "next/link";
import { MapPin, Phone, Mail, Clock } from "lucide-react";

export const metadata = {
  title: "Our Branches | Storefront",
  description: "Find a branch near you.",
};

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function BranchesLocatorPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });

  await connectDB();

  // Find all active branches
  const branches = await InventoryLocation.find({ 
    isActive: true
  }).sort({ fulfillmentPriority: 1, name: 1 }).lean();

  return (
    <div className="container mx-auto max-w-6xl py-12 px-4 md:px-6">
      <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
          Our Branches
        </h1>
        <p className="max-w-[700px] text-lg text-muted-foreground">
          Find a store near you. Shop local inventory and pick up in store.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {branches.length === 0 ? (
          <div className="col-span-full py-12 text-center text-muted-foreground border rounded-xl bg-card">
            No branches available at the moment.
          </div>
        ) : (
          branches.map((branch: any) => (
            <div key={branch._id.toString()} className="group rounded-xl border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md hover:border-primary/50 overflow-hidden flex flex-col">
              <div className="p-6 flex-1 space-y-4">
                <div className="flex items-start justify-between">
                  <h3 className="text-xl font-bold">{branch.name}</h3>
                  {branch.pickupEnabled && (
                    <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-primary/10 text-primary">
                      Pickup Available
                    </span>
                  )}
                </div>
                
                <div className="space-y-2 text-sm text-muted-foreground">
                  {branch.address && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                      <span>{branch.address}</span>
                    </div>
                  )}
                  {branch.contactPhone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 shrink-0" />
                      <span>{branch.contactPhone}</span>
                    </div>
                  )}
                  {branch.contactEmail && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 shrink-0" />
                      <span>{branch.contactEmail}</span>
                    </div>
                  )}
                  {branch.weeklyHours && branch.weeklyHours.length > 0 && (
                    <div className="flex items-start gap-2">
                      <Clock className="h-4 w-4 mt-0.5 shrink-0" />
                      <span>See store hours</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="p-6 pt-0 mt-auto">
                <Link
                  href={`/${locale}/branches/${branch.slug || branch._id.toString()}`}
                  className="inline-flex w-full items-center justify-center rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground shadow-sm hover:bg-secondary/80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring transition-colors"
                >
                  View Store Details
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
