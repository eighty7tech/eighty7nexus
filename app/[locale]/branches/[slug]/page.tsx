import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { connectDB } from "@/lib/db";
import { InventoryLocation } from "@/models/inventory-location.model";
import { Product } from "@/models/product.model";
import { notFound } from "next/navigation";
import { MapPin, Phone, Mail, Store, Clock, ExternalLink } from "lucide-react";
import Link from "next/link";
import { Types } from "mongoose";
import { ModernProductCard } from "@/components/products/modern-product-card";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await connectDB();
  
  const query = Types.ObjectId.isValid(slug) ? { _id: slug } : { slug };
  const branch = await InventoryLocation.findOne({ ...query, isActive: true }).lean();
  
  if (!branch) {
    return { title: "Branch Not Found" };
  }
  
  return {
    title: `${branch.name} | Our Branches`,
    description: `Shop local inventory at our ${branch.name} location.`,
  };
}

export default async function BranchDetailsPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });

  await connectDB();

  // 1. Find the branch
  const query = Types.ObjectId.isValid(slug) ? { _id: slug } : { slug };
  const branch = await InventoryLocation.findOne({ 
    ...query, 
    isActive: true
  }).lean();

  if (!branch) {
    notFound();
  }

  // 2. Find products that are in stock at this specific branch
  // We look for products where locations array contains an entry for this branch with quantity > 0
  const localProducts = await Product.find({
    status: "active",
    "locations": {
      $elemMatch: {
        locationId: branch._id,
        quantity: { $gt: 0 }
      }
    }
  }).sort({ createdAt: -1 }).limit(12).lean();

  return (
    <div className="container mx-auto max-w-7xl py-12 px-4 md:px-6 space-y-16">
      
      {/* Branch Header Hero */}
      <div className="relative rounded-2xl overflow-hidden bg-muted/30 border">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent pointer-events-none" />
        <div className="relative p-8 md:p-12 lg:p-16 flex flex-col md:flex-row gap-8 items-start md:items-center justify-between">
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center rounded-full border px-3 py-1 text-sm font-semibold bg-background shadow-sm">
              <Store className="h-4 w-4 mr-2 text-primary" />
              Local Branch
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
              {branch.name}
            </h1>
            {branch.pickupArea && (
              <p className="text-xl text-muted-foreground">{branch.pickupArea}</p>
            )}
          </div>

          <div className="bg-background border rounded-xl p-6 shadow-sm min-w-[300px] space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">Contact & Location</h3>
            <div className="space-y-3 text-sm">
              {branch.address && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                  <span>{branch.address}</span>
                </div>
              )}
              {branch.contactPhone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                  <a href={`tel:${branch.contactPhone}`} className="hover:text-primary hover:underline">{branch.contactPhone}</a>
                </div>
              )}
              {branch.contactEmail && (
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                  <a href={`mailto:${branch.contactEmail}`} className="hover:text-primary hover:underline">{branch.contactEmail}</a>
                </div>
              )}
              {branch.mapsUrl && (
                <div className="flex items-center gap-3 pt-2">
                  <ExternalLink className="h-4 w-4 text-primary shrink-0" />
                  <a href={branch.mapsUrl} target="_blank" rel="noreferrer" className="text-primary font-medium hover:underline">
                    Get Directions
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Local Products Section */}
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Available in Store</h2>
            <p className="text-muted-foreground mt-2">Products currently in stock at {branch.name}</p>
          </div>
          {branch.pickupEnabled && (
            <div className="hidden sm:inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-semibold bg-primary/5 text-primary">
              Order Online, Pick Up Here
            </div>
          )}
        </div>

        {localProducts.length === 0 ? (
          <div className="py-24 text-center text-muted-foreground border rounded-2xl bg-card border-dashed">
            <Store className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-1">No local inventory found</h3>
            <p>This branch doesn't have any products currently listed in stock.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {localProducts.map((product) => (
              <ModernProductCard key={product._id.toString()} product={product as any} locale={locale as any} />
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
