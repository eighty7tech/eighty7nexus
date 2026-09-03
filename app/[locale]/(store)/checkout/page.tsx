import { Suspense } from "react";
import { CheckoutChrome } from "@/components/checkout/checkout-chrome";
import { CheckoutContent } from "@/components/checkout/checkout-content";
import { CheckoutSkeleton } from "@/components/checkout/checkout-skeleton";
import { getStorefrontSettings } from "@/lib/storefront-settings";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function CheckoutPage({ params }: PageProps) {
  const { locale } = await params;
  const { checkoutSettings, storeName, logoUrl, darkModeLogoUrl } =
    await getStorefrontSettings();

  return (
    <CheckoutChrome
      locale={locale}
      settings={checkoutSettings}
      brand={{ storeName, logoUrl, darkModeLogoUrl }}
    >
      <Suspense fallback={<CheckoutSkeleton />}>
        <CheckoutContent />
      </Suspense>
    </CheckoutChrome>
  );
}
