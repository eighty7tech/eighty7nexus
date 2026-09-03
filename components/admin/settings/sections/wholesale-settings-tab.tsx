"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Briefcase,
  Layers,
  FileText,
  DollarSign,
  Percent,
  CheckCircle2,
  ShieldCheck,
  Building,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Settings } from "@/components/admin/settings/types";
import { SettingsTabHeader } from "./settings-tab-header";
import { StickySaveFooter } from "./sticky-save-footer";

export function WholesaleSettingsTab(props: {
  settings: Settings;
  isSaving: boolean;
  isDirty: boolean;
  updateField: (path: string, value: unknown) => void;
  onSave: () => void | Promise<unknown>;
}) {
  const params = useParams();
  const locale = typeof params?.locale === "string" ? params.locale : "en";

  const ws = props.settings.wholesale || {
    enabled: false,
    mode: "hybrid",
    guestPricing: "show_retail",
    minOrderValue: 0,
    autoApproveApplications: false,
    defaultTierId: "",
    allowNetTerms: true,
    allowedNetTerms: ["prepaid", "net15", "net30"],
    poRequired: false,
    defaultCreditLimit: 0,
    enableRfqs: true,
    minRfqCartValue: 500,
    defaultQuoteValidityDays: 14,
    taxExemptionEnabled: true,
    showDualPrice: true,
  };

  const isEnabled = ws.enabled;

  return (
    <div className="space-y-6">
      <SettingsTabHeader
        title="Wholesale (B2B) Commerce Settings"
        description="Configure dual B2B/B2C storefront modes, customer tier discounting, credit limits, Net payment terms, and RFQs."
      />

      {/* Main Mode Switch Card */}
      <Card className="border-border/60 shadow-sm">
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" />
                <p className="font-semibold text-base">Enable Wholesale &amp; B2B Engine</p>
              </div>
              <p className="text-sm text-muted-foreground">
                Activate volume pricing tables, corporate buyer accounts, Net payment terms, and B2B checkout.
              </p>
            </div>
            <Switch
              checked={isEnabled}
              onCheckedChange={(v) => props.updateField("wholesale.enabled", v)}
            />
          </div>

          {isEnabled && (
            <div className="pt-3 border-t border-border/40 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Manage B2B customer tiers, onboarding applications, and corporate accounts.
              </span>
              <Link
                href={`/${locale}/admin/wholesale`}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
              >
                Go to Wholesale Management Dashboard
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed Wholesale Settings */}
      <div
        className={`space-y-6 transition-opacity ${
          !isEnabled ? "opacity-60 pointer-events-none" : ""
        }`}
      >
        {/* Operating Mode & Storefront Access */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building className="h-4 w-4 text-primary" /> Operating Mode &amp; Catalog Access
            </CardTitle>
            <CardDescription>
              Choose how wholesale pricing and checkout interact with retail visitors.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="wholesaleMode">Storefront B2B Operating Mode</Label>
                <Select
                  value={ws.mode || "hybrid"}
                  onValueChange={(val) => props.updateField("wholesale.mode", val)}
                >
                  <SelectTrigger id="wholesaleMode">
                    <SelectValue placeholder="Select operating mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hybrid">
                      Hybrid B2C / B2B
                    </SelectItem>
                    <SelectItem value="gated">
                      Gated (B2B Only)
                    </SelectItem>
                    <SelectItem value="disabled">Disabled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="guestPricing">Guest &amp; Public Pricing Display</Label>
                <Select
                  value={ws.guestPricing || "show_retail"}
                  onValueChange={(val) => props.updateField("wholesale.guestPricing", val)}
                >
                  <SelectTrigger id="guestPricing">
                    <SelectValue placeholder="Select guest pricing behavior" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="show_retail">Show Standard Retail MSRP</SelectItem>
                    <SelectItem value="hide_prices">Hide All Prices (Call for Price)</SelectItem>
                    <SelectItem value="login_for_pricing">Show "Login for B2B Pricing"</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="space-y-0.5 max-w-[80%]">
                <p className="font-medium text-sm">Dual Price Display (MSRP vs. B2B)</p>
                <p className="text-xs text-muted-foreground">
                  Show retail MSRP and discounted wholesale price side-by-side on product cards to highlight buyer savings.
                </p>
              </div>
              <Switch
                checked={ws.showDualPrice ?? true}
                onCheckedChange={(v) => props.updateField("wholesale.showDualPrice", v)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Ordering Rules & Minimums */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" /> Ordering Rules &amp; Minimum Order Value (MOV)
            </CardTitle>
            <CardDescription>
              Enforce global basket minimums and case pack buying standards.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minOrderValue">Global Minimum Order Value (MOV)</Label>
                <Input
                  id="minOrderValue"
                  type="number"
                  min="0"
                  step="10"
                  value={ws.minOrderValue ?? 0}
                  onChange={(e) =>
                    props.updateField("wholesale.minOrderValue", parseFloat(e.target.value) || 0)
                  }
                  placeholder="0.00 (No minimum)"
                />
                <p className="text-xs text-muted-foreground">
                  Minimum cart subtotal required before a wholesale buyer can proceed to checkout.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="defaultCreditLimit">Default Buyer Credit Limit</Label>
                <Input
                  id="defaultCreditLimit"
                  type="number"
                  min="0"
                  step="100"
                  value={ws.defaultCreditLimit ?? 0}
                  onChange={(e) =>
                    props.updateField("wholesale.defaultCreditLimit", parseFloat(e.target.value) || 0)
                  }
                  placeholder="0.00"
                />
                <p className="text-xs text-muted-foreground">
                  Initial credit line extended to newly approved B2B accounts.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Terms & Invoicing */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" /> Payment Terms &amp; Purchase Orders (PO)
            </CardTitle>
            <CardDescription>
              Configure Net 15/30/60 terms and invoice purchasing options for B2B buyers.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5 max-w-[80%]">
                <p className="font-medium text-sm">Allow Net Terms Checkout</p>
                <p className="text-xs text-muted-foreground">
                  Allow approved buyers with sufficient credit limit to place orders on Net terms (Net 15/30/60).
                </p>
              </div>
              <Switch
                checked={ws.allowNetTerms ?? true}
                onCheckedChange={(v) => props.updateField("wholesale.allowNetTerms", v)}
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="space-y-0.5 max-w-[80%]">
                <p className="font-medium text-sm">Require Purchase Order (PO) Number</p>
                <p className="text-xs text-muted-foreground">
                  Mandate entry of a PO reference number during B2B checkout.
                </p>
              </div>
              <Switch
                checked={ws.poRequired ?? false}
                onCheckedChange={(v) => props.updateField("wholesale.poRequired", v)}
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="space-y-0.5 max-w-[80%]">
                <p className="font-medium text-sm">Automated Tax Exemption</p>
                <p className="text-xs text-muted-foreground">
                  Automatically zero out tax on checkout when customer holds an approved tax-exempt certificate.
                </p>
              </div>
              <Switch
                checked={ws.taxExemptionEnabled ?? true}
                onCheckedChange={(v) => props.updateField("wholesale.taxExemptionEnabled", v)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Request For Quote (RFQ) Engine */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" /> Request For Quote (RFQ) Engine
            </CardTitle>
            <CardDescription>
              Allow buyers to request custom volume pricing and negotiations directly on the storefront.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5 max-w-[80%]">
                <p className="font-medium text-sm">Enable "Request a Quote" Button</p>
                <p className="text-xs text-muted-foreground">
                  Display an RFQ button on high-quantity product views and in the shopping cart.
                </p>
              </div>
              <Switch
                checked={ws.enableRfqs ?? true}
                onCheckedChange={(v) => props.updateField("wholesale.enableRfqs", v)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="minRfqCartValue">Minimum Cart Value for RFQ</Label>
                <Input
                  id="minRfqCartValue"
                  type="number"
                  min="0"
                  step="50"
                  value={ws.minRfqCartValue ?? 500}
                  onChange={(e) =>
                    props.updateField("wholesale.minRfqCartValue", parseFloat(e.target.value) || 0)
                  }
                  placeholder="500.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="defaultQuoteValidityDays">Default Quote Validity (Days)</Label>
                <Input
                  id="defaultQuoteValidityDays"
                  type="number"
                  min="1"
                  max="90"
                  value={ws.defaultQuoteValidityDays ?? 14}
                  onChange={(e) =>
                    props.updateField("wholesale.defaultQuoteValidityDays", parseInt(e.target.value, 10) || 14)
                  }
                  placeholder="14"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <StickySaveFooter
        label="Save Wholesale Settings"
        isDirty={props.isDirty}
        isSaving={props.isSaving}
        onSave={props.onSave}
      />
    </div>
  );
}
