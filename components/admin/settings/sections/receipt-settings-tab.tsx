"use client";

import { useTranslations } from "next-intl";
import { Receipt, QrCode, FileText } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { FileUploadField } from "@/components/ui/file-upload-field";
import type { Settings } from "@/components/admin/settings/types";
import { SettingsTabHeader } from "./settings-tab-header";
import { StickySaveFooter } from "./sticky-save-footer";

interface ReceiptSettingsTabProps {
  settings: Settings;
  isSaving: boolean;
  isDirty: boolean;
  updateField: (path: string, value: unknown) => void;
  onSave: () => void | Promise<unknown>;
}

function SectionCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border bg-card text-card-foreground">
      <div className="flex items-center gap-3 border-b px-6 py-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="text-base font-semibold leading-none">{title}</h3>
          <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

export function ReceiptSettingsTab(props: ReceiptSettingsTabProps) {
  const t = useTranslations();
  const receipt = props.settings.pos?.receipt || { showQrCode: true };

  return (
    <div className="flex h-full flex-col">
      <SettingsTabHeader
        title="Receipt Settings"
        description="Configure printed and digital receipts."
      />

      <div className="flex-1 overflow-y-auto bg-muted/30 p-6">
        <div className="mx-auto max-w-4xl space-y-6 pb-24">
          <SectionCard
            icon={Receipt}
            title="Receipt Appearance"
            description="Customize the header and footer of your POS receipts."
          >
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="logoUrl">Logo URL</Label>
                <FileUploadField
                  id="logoUrl"
                  value={receipt.logoUrl || ""}
                  onChange={(val) => props.updateField("pos.receipt.logoUrl", val)}
                  accept="image/png,image/jpeg,image/webp"
                  maxSizeMb={5}
                />
                <p className="text-[13px] text-muted-foreground">
                  URL to a monochrome logo image optimized for thermal printers.
                </p>
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="headerText">Header Text</Label>
                <Textarea
                  id="headerText"
                  placeholder="Welcome to our store!"
                  value={receipt.headerText || ""}
                  onChange={(e) => props.updateField("pos.receipt.headerText", e.target.value)}
                  className="min-h-[80px]"
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="footerText">Footer Text</Label>
                <Textarea
                  id="footerText"
                  placeholder="Thank you for your purchase."
                  value={receipt.footerText || ""}
                  onChange={(e) => props.updateField("pos.receipt.footerText", e.target.value)}
                  className="min-h-[80px]"
                />
              </div>
            </div>
          </SectionCard>

          <SectionCard
            icon={FileText}
            title="Legal & Tax"
            description="Display tax IDs and return policies on your receipts."
          >
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="taxNumber">Tax ID / VAT Number</Label>
                <Input
                  id="taxNumber"
                  placeholder="e.g. VAT-12345678"
                  value={receipt.taxNumber || ""}
                  onChange={(e) => props.updateField("pos.receipt.taxNumber", e.target.value)}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="returnPolicyText">Return Policy Summary</Label>
                <Textarea
                  id="returnPolicyText"
                  placeholder="Items can be returned within 30 days with receipt."
                  value={receipt.returnPolicyText || ""}
                  onChange={(e) => props.updateField("pos.receipt.returnPolicyText", e.target.value)}
                  className="min-h-[80px]"
                />
              </div>
            </div>
          </SectionCard>

          <SectionCard
            icon={QrCode}
            title="Dynamic QR Codes"
            description="Embed scannable links at the bottom of the receipt."
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between rounded-lg border bg-card p-4">
                <div className="space-y-1">
                  <Label className="text-base">Print QR Code</Label>
                  <p className="text-sm text-muted-foreground">
                    Generate a scannable QR code on physical receipts.
                  </p>
                </div>
                <Switch
                  checked={receipt.showQrCode ?? true}
                  onCheckedChange={(v) => props.updateField("pos.receipt.showQrCode", v)}
                />
              </div>

              {receipt.showQrCode && (
                <div className="space-y-2 pl-2">
                  <Label htmlFor="qrCodeUrl">QR Code Destination URL</Label>
                  <Input
                    id="qrCodeUrl"
                    placeholder="https://example.com/return-policy"
                    value={receipt.qrCodeUrl || ""}
                    onChange={(e) => props.updateField("pos.receipt.qrCodeUrl", e.target.value)}
                  />
                  <p className="text-[13px] text-muted-foreground">
                    Link to your full digital return policy, feedback form, or store website.
                  </p>
                </div>
              )}
            </div>
          </SectionCard>
        </div>
      </div>

      <StickySaveFooter
        label="Save Receipt Settings"
        isDirty={props.isDirty}
        isSaving={props.isSaving}
        onSave={props.onSave}
      />
    </div>
  );
}
