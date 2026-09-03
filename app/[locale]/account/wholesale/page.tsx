"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Building2,
  CreditCard,
  FileText,
  Clock,
  RotateCcw,
  Download,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  Package,
  Layers,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { useCurrency } from "@/providers/currency-provider";

export default function CustomerWholesalePortalPage() {
  const params = useParams();
  const locale = typeof params?.locale === "string" ? params.locale : "en";
  const { formatPrice } = useCurrency();
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<{ profile: any; invoices: any[] } | null>(null);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const res = await fetch("/api/wholesale/dashboard");
        if (!res.ok) throw new Error("Failed to load dashboard data");
        const json = await res.json();
        if (json.success && json.data) {
          setData(json.data);
        }
      } catch (err) {
        toast.error("Failed to load wholesale dashboard data");
      } finally {
        setIsLoading(false);
      }
    };
    
    loadDashboard();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <p className="text-lg font-semibold">Failed to load portal data</p>
      </div>
    );
  }

  const { profile, invoices } = data;

  const creditUsedPercentage = profile.creditLimit > 0 ? Math.round(
    (profile.outstandingBalance / profile.creditLimit) * 100
  ) : 0;

  return (
    <div className="min-h-screen bg-muted/10 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/15">
                {profile.tierName} Tier ({profile.discountPercentage}% Off)
              </Badge>
              <Badge variant="outline" className="text-muted-foreground">
                Terms: {profile.paymentTerms}
              </Badge>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">{profile.companyName}</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Corporate Account Dashboard &amp; Trade Credit Management
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button asChild variant="outline">
              <Link href={`/${locale}/wholesale/quick-order`}>
                <Layers className="h-4 w-4 mr-2" />
                Quick Order Pad
              </Link>
            </Button>
            <Button asChild>
              <Link href={`/${locale}`}>
                Browse B2B Catalog
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Credit & Rep Hub */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2 border-border/60 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-primary" />
                  Trade Credit &amp; Net Term Balance
                </CardTitle>
                <span className="text-xs font-semibold text-muted-foreground">
                  {creditUsedPercentage}% Utilized
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Progress value={creditUsedPercentage} className="h-2.5" />
              <div className="grid grid-cols-3 gap-4 pt-1 text-sm">
                <div>
                  <span className="text-xs text-muted-foreground block">Available Credit</span>
                  <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                    {formatPrice(profile.availableCredit)}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Outstanding Balance</span>
                  <span className="text-xl font-bold text-primary">
                    {formatPrice(profile.outstandingBalance)}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Total Credit Line</span>
                  <span className="text-xl font-bold">
                    {formatPrice(profile.creditLimit)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                Dedicated Account Rep
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="font-semibold text-foreground">{profile.accountRep}</p>
              <p className="text-xs text-muted-foreground">{profile.accountRepEmail}</p>
              <div className="pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full text-xs"
                  onClick={() => toast.success("Support ticket opened with your dedicated rep.")}
                >
                  Contact Account Manager
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Invoices & Order History */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Open B2B Invoices &amp; Net Receivables
              </CardTitle>
            </div>
            <CardDescription>
              View pending Net 30 invoices, download official tax PDFs, or execute 1-click reorders.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border/60">
              {invoices.map((inv) => (
                <div
                  key={inv.id}
                  className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-foreground">
                        {inv.id}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        (Ref: {inv.orderId})
                      </span>
                      <Badge
                        variant={inv.status === "paid" ? "secondary" : "outline"}
                        className={
                          inv.status === "paid"
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                            : "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
                        }
                      >
                        {inv.status === "paid" ? "Paid" : "Due in 17 Days"}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-4">
                      <span>Units: {inv.items} items</span>
                      <span>Due: {inv.dueDate}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-xs text-muted-foreground block">Invoice Total</span>
                      <span className="font-bold text-base">
                        {formatPrice(inv.amount)}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toast.success(`Downloading PDF for ${inv.id}`)}
                    >
                      <Download className="h-4 w-4 mr-1.5" />
                      PDF
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        toast.success(`Items from ${inv.orderId} added to Quick Order Pad.`);
                        window.location.href = `/${locale}/wholesale/quick-order?reorder=${inv.orderId}`;
                      }}
                    >
                      <RotateCcw className="h-4 w-4 mr-1.5" />
                      1-Click Reorder
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
