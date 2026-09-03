"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
import { useTranslations } from "next-intl";

export function OtpSettingsTab(props: {
  settings: Settings;
  isSaving: boolean;
  isDirty: boolean;
  updateField: (path: string, value: unknown) => void;
  updateNestedField: (path: string, value: unknown) => void;
  onSave: () => void | Promise<unknown>;
}) {
  const t = useTranslations();
  const otp = props.settings.otp;
  const sms = props.settings.sms;

  const handleMethodChange = (method: "email" | "sms", checked: boolean) => {
    const methods = new Set(otp.methods || ["email"]);
    if (checked) methods.add(method);
    else methods.delete(method);
    props.updateNestedField("otp.methods", Array.from(methods));
  };

  return (
    <div className="space-y-4">
      <SettingsTabHeader
        title="OTP & SMS Configuration"
        description="Configure One-Time Password verification and SMS providers."
      />

      {/* OTP Configuration */}
      <Card>
        <CardContent className="space-y-6 pt-6">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">Enable OTP Verification</Label>
              <p className="text-sm text-muted-foreground">Require one-time passwords during login.</p>
            </div>
            <Switch
              checked={Boolean(otp.enabled)}
              onCheckedChange={(v) => props.updateNestedField("otp.enabled", v)}
            />
          </div>

          <div className="space-y-4">
            <Label className="text-base">Allowed Methods</Label>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="method-email"
                  checked={otp.methods?.includes("email")}
                  onCheckedChange={(checked) => handleMethodChange("email", Boolean(checked))}
                  disabled={!otp.enabled}
                />
                <Label htmlFor="method-email">Email</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="method-sms"
                  checked={otp.methods?.includes("sms")}
                  onCheckedChange={(checked) => handleMethodChange("sms", Boolean(checked))}
                  disabled={!otp.enabled}
                />
                <Label htmlFor="method-sms">SMS</Label>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <Label className="text-base">Enforce OTP For</Label>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="enforce-admin"
                  checked={Boolean(otp.enforceForAdmin)}
                  onCheckedChange={(v) => props.updateNestedField("otp.enforceForAdmin", v)}
                  disabled={!otp.enabled}
                />
                <Label htmlFor="enforce-admin">Administrators</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="enforce-vendor"
                  checked={Boolean(otp.enforceForVendor)}
                  onCheckedChange={(v) => props.updateNestedField("otp.enforceForVendor", v)}
                  disabled={!otp.enabled}
                />
                <Label htmlFor="enforce-vendor">Vendors</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="enforce-customer"
                  checked={Boolean(otp.enforceForCustomer)}
                  onCheckedChange={(v) => props.updateNestedField("otp.enforceForCustomer", v)}
                  disabled={!otp.enabled}
                />
                <Label htmlFor="enforce-customer">Customers</Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SMS Provider Settings */}
      <Card>
        <CardContent className="space-y-6 pt-6">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">Enable SMS Sending</Label>
              <p className="text-sm text-muted-foreground">Required for SMS OTPs and text notifications.</p>
            </div>
            <Switch
              checked={Boolean(sms.enabled)}
              onCheckedChange={(v) => props.updateNestedField("sms.enabled", v)}
            />
          </div>

          <div className="space-y-4">
            <Label htmlFor="sms-provider">SMS Provider</Label>
            <Select
              value={sms.provider || "twilio"}
              onValueChange={(v) => props.updateNestedField("sms.provider", v)}
              disabled={!sms.enabled}
            >
              <SelectTrigger id="sms-provider">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="twilio">Twilio</SelectItem>
                <SelectItem value="messagebird">MessageBird</SelectItem>
                <SelectItem value="hubtel">Hubtel (Ghana)</SelectItem>
                <SelectItem value="arkesel">Arkesel (Ghana)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {sms.provider === "twilio" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Account SID</Label>
                <Input
                  value={sms.twilioAccountSid || ""}
                  onChange={(e) => props.updateNestedField("sms.twilioAccountSid", e.target.value)}
                  disabled={!sms.enabled}
                />
              </div>
              <div className="space-y-2">
                <Label>Auth Token</Label>
                <Input
                  type="password"
                  value={sms.twilioAuthToken || ""}
                  onChange={(e) => props.updateNestedField("sms.twilioAuthToken", e.target.value)}
                  disabled={!sms.enabled}
                />
              </div>
              <div className="space-y-2">
                <Label>From Number</Label>
                <Input
                  value={sms.twilioFromNumber || ""}
                  onChange={(e) => props.updateNestedField("sms.twilioFromNumber", e.target.value)}
                  disabled={!sms.enabled}
                />
              </div>
            </div>
          )}

          {sms.provider === "messagebird" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Access Key</Label>
                <Input
                  type="password"
                  value={sms.messagebirdAccessKey || ""}
                  onChange={(e) => props.updateNestedField("sms.messagebirdAccessKey", e.target.value)}
                  disabled={!sms.enabled}
                />
              </div>
              <div className="space-y-2">
                <Label>Originator</Label>
                <Input
                  value={sms.messagebirdOriginator || ""}
                  onChange={(e) => props.updateNestedField("sms.messagebirdOriginator", e.target.value)}
                  disabled={!sms.enabled}
                />
              </div>
            </div>
          )}

          {sms.provider === "hubtel" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Client ID</Label>
                <Input
                  value={sms.hubtelClientId || ""}
                  onChange={(e) => props.updateNestedField("sms.hubtelClientId", e.target.value)}
                  disabled={!sms.enabled}
                />
              </div>
              <div className="space-y-2">
                <Label>Client Secret</Label>
                <Input
                  type="password"
                  value={sms.hubtelClientSecret || ""}
                  onChange={(e) => props.updateNestedField("sms.hubtelClientSecret", e.target.value)}
                  disabled={!sms.enabled}
                />
              </div>
              <div className="space-y-2">
                <Label>Sender ID</Label>
                <Input
                  value={sms.hubtelSenderId || ""}
                  onChange={(e) => props.updateNestedField("sms.hubtelSenderId", e.target.value)}
                  disabled={!sms.enabled}
                />
              </div>
            </div>
          )}

          {sms.provider === "arkesel" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>API Key</Label>
                <Input
                  type="password"
                  value={sms.arkeselApiKey || ""}
                  onChange={(e) => props.updateNestedField("sms.arkeselApiKey", e.target.value)}
                  disabled={!sms.enabled}
                />
              </div>
              <div className="space-y-2">
                <Label>Sender ID</Label>
                <Input
                  value={sms.arkeselSenderId || ""}
                  onChange={(e) => props.updateNestedField("sms.arkeselSenderId", e.target.value)}
                  disabled={!sms.enabled}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <StickySaveFooter
        label={t("admin.settings.general.save")}
        isSaving={props.isSaving}
        isDirty={props.isDirty}
        onSave={props.onSave}
      />
    </div>
  );
}
