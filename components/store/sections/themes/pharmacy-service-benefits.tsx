import {
  BadgePercent,
  Gift,
  Headphones,
  RotateCcw,
  ShieldCheck,
  Truck,
  Wallet,
  Activity,
  HeartPulse,
  Stethoscope,
  type LucideIcon,
} from "lucide-react";
import type { ServiceBenefitItem } from "@/components/store/sections/service-benefits";

const PHARMACY_ICONS: Record<string, LucideIcon> = {
  truck: Truck,
  shield: ShieldCheck,
  returns: RotateCcw,
  support: Headphones,
  wallet: Wallet,
  discount: BadgePercent,
  gift: Gift,
  health: HeartPulse,
  medical: Stethoscope,
  activity: Activity,
};

export function PharmacyServiceBenefits({ items }: { items: ServiceBenefitItem[] }) {
  const visible = items.filter((item) => item.title || item.text);
  if (visible.length === 0) return null;

  return (
    <section className="py-6 lg:py-10 bg-emerald-50 dark:bg-emerald-950/20">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {visible.map((item) => {
            const Icon = PHARMACY_ICONS[item.icon] ?? HeartPulse;
            return (
              <div key={item.id} className="flex flex-col items-center gap-3 p-6 text-center rounded-2xl bg-card border border-emerald-100 dark:border-emerald-900/50 shadow-sm transition-transform hover:-translate-y-1">
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                  <Icon className="h-7 w-7" aria-hidden />
                </div>
                <div className="min-w-0 space-y-1.5">
                  {item.title ? (
                    <p className="text-base font-semibold text-foreground">
                      {item.title}
                    </p>
                  ) : null}
                  {item.text ? (
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {item.text}
                    </p>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
