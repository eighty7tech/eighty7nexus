import { setRequestLocale } from "next-intl/server";
import { requireVendorAreaAccess } from "@/lib/vendor-area-guard";
import { AISalesAgentAdmin } from "@/components/admin/ai-sales-agent-admin";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function VendorAISalesAgentPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const vendorContext = await requireVendorAreaAccess({ locale });
  
  // Here we use the admin component but render it in vendor mode.
  // The component will use /api/vendor/ai-sales-agent endpoints.
  return <AISalesAgentAdmin locale={locale} mode="vendor" />;
}
