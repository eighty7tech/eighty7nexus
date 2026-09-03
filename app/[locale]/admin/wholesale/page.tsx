"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Briefcase,
  Users,
  FileText,
  CreditCard,
  Layers,
  ArrowUpRight,
  TrendingUp,
  Clock,
  ShieldCheck,
  Building2,
  Package,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCurrency } from "@/providers/currency-provider";
import { toast } from "sonner";

export default function WholesaleOverviewPage() {
  const params = useParams();
  const locale = typeof params?.locale === "string" ? params.locale : "en";
  const { formatPrice } = useCurrency();
  const [isLoading, setIsLoading] = useState(true);
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await fetch("/api/admin/wholesale/dashboard");
        if (!res.ok) throw new Error("Failed to fetch");
        const json = await res.json();
        if (json.success && json.data) {
          setMetrics(json.data.metrics);
        }
      } catch (err) {
        toast.error("Failed to load wholesale metrics");
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Wholesale &amp; B2B Commerce</h1>
          <p className="text-muted-foreground mt-1">
            Enterprise wholesale management, B2B buyer accounts, tier pricing, and corporate quotes.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild variant="outline">
            <Link href={`/${locale}/admin/settings/wholesale`}>
              Wholesale Settings
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/${locale}/admin/wholesale/applications`}>
              Review Applications
            </Link>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">B2B Gross Volume</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-8 w-24 bg-muted animate-pulse rounded" />
            ) : (
              <>
                <div className="text-2xl font-bold">{formatPrice(metrics?.grossVolume || 0)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {metrics?.grossVolumeTrend > 0 ? "+" : ""}
                  {metrics?.grossVolumeTrend?.toFixed(1) || 0}% from last month
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Active B2B Accounts</CardTitle>
            <Building2 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-8 w-16 bg-muted animate-pulse rounded" />
            ) : (
              <div className="text-2xl font-bold">{metrics?.activeAccounts || 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Across all tiers</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Pending KYC Applications</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-8 w-16 bg-muted animate-pulse rounded" />
            ) : (
              <div className="text-2xl font-bold">{metrics?.pendingApplications || 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Awaiting document review</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Credit Extended</CardTitle>
            <CreditCard className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-8 w-24 bg-muted animate-pulse rounded" />
            ) : (
              <div className="text-2xl font-bold">{formatPrice(metrics?.creditExtended || 0)}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Outstanding balance</p>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Quick-Action Hub */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-border/60 hover:border-primary/50 transition-colors shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              KYC &amp; Onboarding Queue
            </CardTitle>
            <CardDescription>
              Verify company registration numbers, tax certificates, and approve buyer accounts.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Button asChild variant="secondary" className="w-full justify-between">
              <Link href={`/${locale}/admin/wholesale/applications`}>
                Inspect Applications
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border/60 hover:border-primary/50 transition-colors shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              Customer Tiers &amp; Discounts
            </CardTitle>
            <CardDescription>
              Configure Bronze, Silver, Gold, and Distributor tier discounts and MOQ thresholds.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Button asChild variant="secondary" className="w-full justify-between">
              <Link href={`/${locale}/admin/wholesale/tiers`}>
                Manage Tiers
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border/60 hover:border-primary/50 transition-colors shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Quotes &amp; RFQs
            </CardTitle>
            <CardDescription>
              Handle custom price negotiations, generate formal B2B quotes, and convert to orders.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Button asChild variant="secondary" className="w-full justify-between">
              <Link href={`/${locale}/admin/wholesale/quotes`}>
                View Open Quotes
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
