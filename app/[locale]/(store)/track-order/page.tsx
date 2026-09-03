import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { getSettings } from "@/models";
import { TrackOrderContent } from "@/components/store/track-order-content";

interface TrackOrderPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ orderId?: string; orderNumber?: string }>;
}

export const metadata: Metadata = {
  title: "Track Order",
  description: "Track your order using your order number and checkout contact details.",
};

export default async function TrackOrderPage({
  params,
  searchParams,
}: TrackOrderPageProps) {
  const { locale } = await params;
  const { orderId, orderNumber } = await searchParams;
  setRequestLocale(locale);

  const settings = await getSettings();
  const trackOrderSettings = settings?.onlineStore?.trackOrder || {
    theme: "modern-glass",
    showMapIllustration: true,
    showItemList: true,
    accentColor: "#10b981",
    enableGlassmorphism: true,
  };

  return (
    <TrackOrderContent
      initialOrderNumber={orderNumber || orderId || ""}
      settings={trackOrderSettings}
    />
  );
}
