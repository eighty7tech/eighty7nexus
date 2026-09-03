import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { InventoryLocation } from "@/models/inventory-location.model";
import { 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Store, 
  Calendar, 
  Navigation,
  PackageCheck,
  Wifi,
  Accessibility,
  CreditCard,
  Coffee,
  MessageCircle,
  Truck
} from "lucide-react";
import { connectDB } from "@/lib/db";
import Link from "next/link";
import { cn } from "@/lib/utils";
import Image from "next/image";

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday"
];

function getTodayWeekday() {
  return new Date().getDay();
}

export default async function BranchFrontPage({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}) {
  const { slug, locale } = await params;
  const t = await getTranslations();

  await connectDB();

  // Find the branch by slug
  const branch = await InventoryLocation.findOne({
    slug,
    isActive: true,
  }).lean();

  if (!branch) {
    notFound();
  }

  const todayIndex = getTodayWeekday();
  
  // Format weekly hours
  const hoursMap = new Map();
  branch.weeklyHours?.forEach((h: any) => {
    hoursMap.set(h.weekday, h);
  });

  // Determine if open today
  const todayHours = hoursMap.get(todayIndex);
  const isOpenToday = todayHours?.enabled;

  // Generate safe embed URL for Google Maps
  const mapQuery = branch.address || branch.name;
  const safeMapEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&t=&z=14&ie=UTF8&iwloc=&output=embed`;

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-background/95 pb-16">
      {/* Dynamic Hero Section */}
      <div className="relative h-[350px] md:h-[450px] w-full overflow-hidden bg-primary/5">
        {branch.images && branch.images.length > 0 ? (
          <Image 
            src={branch.images[0]} 
            alt={branch.name} 
            fill 
            className="object-cover opacity-30" 
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        )}
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-primary/20 opacity-20 blur-[100px]"></div>
        <div className="absolute inset-0 bg-linear-to-t from-background via-background/80 to-transparent" />
        
        <div className="absolute bottom-0 w-full">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 md:pb-12">
            <div className="flex flex-col md:flex-row md:items-end gap-6 justify-between">
              <div className="flex items-end gap-5">
                <div className="p-5 bg-background/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 dark:border-white/10 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-linear-to-tr from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <Store className="w-10 h-10 text-primary relative z-10" />
                </div>
                <div className="mb-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold border border-primary/20">
                      <MapPin className="w-3.5 h-3.5" />
                      Branch Location
                    </span>
                    {isOpenToday ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-semibold border border-emerald-500/20">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        Open Today
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 text-rose-600 text-xs font-semibold border border-rose-500/20">
                        Closed Today
                      </span>
                    )}
                  </div>
                  <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">{branch.name}</h1>
                </div>
              </div>
              
              <div className="hidden md:flex gap-3">
                <Link
                  href={`/${locale}/products`}
                  className="inline-flex h-12 items-center justify-center rounded-xl bg-primary px-8 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 hover:scale-105"
                >
                  Shop this Branch
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Details & Map */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Quick Contacts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-card p-6 rounded-3xl border shadow-sm flex items-center gap-4 group hover:border-primary/50 transition-colors">
                <div className="p-3 bg-primary/5 rounded-2xl group-hover:bg-primary/10 transition-colors flex-shrink-0">
                  <Phone className="w-6 h-6 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-muted-foreground">Call Us</p>
                  <p className="text-base font-semibold text-foreground mt-0.5 truncate">
                    {branch.contactPhone || "Not provided"}
                  </p>
                </div>
              </div>
              <div className="bg-card p-6 rounded-3xl border shadow-sm flex items-center gap-4 group hover:border-primary/50 transition-colors">
                <div className="p-3 bg-primary/5 rounded-2xl group-hover:bg-primary/10 transition-colors flex-shrink-0">
                  <Mail className="w-6 h-6 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p className="text-base font-semibold text-foreground mt-0.5 truncate">
                    {branch.contactEmail || "Not provided"}
                  </p>
                </div>
              </div>
              <a href={branch.mapsUrl || safeMapEmbedUrl} target="_blank" rel="noreferrer" className="bg-card p-6 rounded-3xl border shadow-sm flex items-center gap-4 group hover:border-primary/50 transition-colors cursor-pointer">
                <div className="p-3 bg-primary/5 rounded-2xl group-hover:bg-primary/10 transition-colors flex-shrink-0">
                  <Navigation className="w-6 h-6 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-muted-foreground">Directions</p>
                  <p className="text-base font-semibold text-foreground mt-0.5 truncate text-primary group-hover:underline">
                    Get Route
                  </p>
                </div>
              </a>
            </div>

            {/* Branch Amenities */}
            <div className="bg-card rounded-3xl border shadow-sm p-6 sm:p-8">
              <h3 className="text-xl font-bold mb-6">Branch Amenities</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {branch.pickupEnabled && (
                  <div className="flex flex-col items-center text-center p-4 rounded-2xl bg-muted/30">
                    <PackageCheck className="w-6 h-6 text-emerald-600 mb-2" />
                    <span className="text-sm font-medium">In-Store Pickup</span>
                  </div>
                )}
                <div className="flex flex-col items-center text-center p-4 rounded-2xl bg-muted/30">
                  <Wifi className="w-6 h-6 text-blue-600 mb-2" />
                  <span className="text-sm font-medium">Free Wi-Fi</span>
                </div>
                <div className="flex flex-col items-center text-center p-4 rounded-2xl bg-muted/30">
                  <Accessibility className="w-6 h-6 text-amber-600 mb-2" />
                  <span className="text-sm font-medium">Wheelchair Accessible</span>
                </div>
                <div className="flex flex-col items-center text-center p-4 rounded-2xl bg-muted/30">
                  <CreditCard className="w-6 h-6 text-indigo-600 mb-2" />
                  <span className="text-sm font-medium">Card Payments</span>
                </div>
              </div>
            </div>

            {/* Image Gallery */}
            {branch.images && branch.images.length > 0 && (
              <div className="grid grid-cols-2 gap-4">
                {branch.images.slice(0, 4).map((imgUrl: string, i: number) => (
                  <div key={i} className={`relative rounded-3xl overflow-hidden ${i === 0 ? "col-span-2 h-[300px]" : "h-[200px]"}`}>
                    <Image src={imgUrl} alt={`Branch image ${i+1}`} fill className="object-cover hover:scale-105 transition-transform duration-500" />
                  </div>
                ))}
              </div>
            )}

            {/* Interactive Map Section */}
            <div className="bg-card rounded-3xl border shadow-sm overflow-hidden flex flex-col">
              <div className="p-6 border-b bg-muted/20 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <Navigation className="w-5 h-5 text-primary" />
                    Location Map
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {branch.address || "No address provided."}
                  </p>
                </div>
                {branch.mapsUrl && (
                  <a 
                    href={branch.mapsUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hidden sm:inline-flex px-4 py-2 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium hover:bg-secondary/80 transition-colors"
                  >
                    View Larger Map
                  </a>
                )}
              </div>
              <div className="w-full h-[350px] bg-muted relative">
                <iframe 
                  src={safeMapEmbedUrl}
                  width="100%" 
                  height="100%" 
                  style={{ border: 0 }} 
                  allowFullScreen 
                  loading="lazy" 
                  referrerPolicy="no-referrer-when-downgrade"
                  className="absolute inset-0"
                />
              </div>
            </div>

            {/* Pickup Information (If enabled) */}
            {branch.pickupEnabled && (
              <div className="bg-card rounded-3xl border shadow-sm p-6 sm:p-8 relative overflow-hidden">
                <div className="absolute -right-6 -top-6 text-primary/5">
                  <PackageCheck className="w-32 h-32" />
                </div>
                <h3 className="text-lg font-bold flex items-center gap-2 mb-4 relative z-10">
                  <PackageCheck className="w-5 h-5 text-primary" />
                  In-Store Pickup Available
                </h3>
                <div className="grid sm:grid-cols-2 gap-6 relative z-10">
                  {branch.pickupArea && (
                    <div>
                      <p className="text-sm font-semibold text-foreground mb-1">Pickup Area</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {branch.pickupArea}
                      </p>
                    </div>
                  )}
                  {branch.instructions && (
                    <div>
                      <p className="text-sm font-semibold text-foreground mb-1">Instructions</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {branch.instructions}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
            
          </div>

          {/* Right Column: Working Hours (Sticky) */}
          <div className="space-y-6 relative">
            <div className="sticky top-24">
              <div className="bg-card rounded-3xl border shadow-sm overflow-hidden mb-6">
                <div className="p-6 border-b bg-primary/5">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    Working Hours
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Our weekly schedule for this branch.
                  </p>
                </div>
                <div className="p-2">
                  <div className="space-y-1">
                    {WEEKDAYS.map((dayName, index) => {
                      const isToday = index === todayIndex;
                      const hours = hoursMap.get(index);
                      const isOpen = hours?.enabled;
                      
                      return (
                        <div 
                          key={index}
                          className={cn(
                            "flex items-center justify-between p-4 rounded-2xl transition-colors",
                            isToday ? "bg-primary text-primary-foreground shadow-md" : "hover:bg-muted/50 text-foreground"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            {isToday && <Calendar className="w-4 h-4 opacity-80" />}
                            <span className={cn("font-medium", isToday ? "font-bold" : "")}>
                              {dayName} {isToday && "(Today)"}
                            </span>
                          </div>
                          <div className="text-sm font-medium">
                            {isOpen ? (
                              <span>{hours.start || "09:00"} - {hours.end || "17:00"}</span>
                            ) : (
                              <span className={cn(isToday ? "text-primary-foreground/80" : "text-muted-foreground")}>
                                Closed
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Support Card */}
              <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-3xl border border-primary/10 p-6 shadow-sm">
                <h3 className="font-bold text-lg mb-2">Need Help?</h3>
                <p className="text-sm text-muted-foreground mb-4">Our branch staff is ready to assist you during working hours.</p>
                <Link href={`/${locale}/contact`} className="inline-flex items-center justify-center w-full gap-2 px-4 py-3 bg-background text-foreground rounded-xl border shadow-sm font-medium hover:bg-muted transition-colors">
                  <MessageCircle className="w-4 h-4" />
                  Contact Support
                </Link>
              </div>

              {/* Mobile Shop Button */}
              <div className="md:hidden pt-4">
                <Link
                  href={`/${locale}/products`}
                  className="flex w-full h-14 items-center justify-center rounded-2xl bg-primary px-8 text-base font-bold text-primary-foreground shadow-xl shadow-primary/20 transition-all active:scale-95"
                >
                  Shop this Branch
                </Link>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
