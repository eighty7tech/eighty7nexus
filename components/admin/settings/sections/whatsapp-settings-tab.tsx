"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Settings } from "@/components/admin/settings/types";
import { SettingsTabHeader } from "./settings-tab-header";
import { StickySaveFooter } from "./sticky-save-footer";

export function WhatsAppSettingsTab(props: {
  settings: Settings;
  isSaving: boolean;
  isDirty: boolean;
  updateNestedField: (path: string, value: unknown) => void;
  onSave: () => void | Promise<unknown>;
}) {
  const { settings, isSaving, isDirty, updateNestedField, onSave } = props;
  const whatsapp = settings.whatsapp;

  return (
    <div className="space-y-4">
      <SettingsTabHeader
        title="WhatsApp Integration"
        description="Configure automated WhatsApp notifications for your customers."
      />

      <Card>
        <CardContent className="space-y-6 pt-6">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label className="text-base">Enable WhatsApp Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Send order updates automatically via WhatsApp.
              </p>
            </div>
            <Switch
              checked={whatsapp?.enabled || false}
              onCheckedChange={(checked) =>
                updateNestedField("whatsapp.enabled", checked)
              }
            />
          </div>

          <div className="space-y-2">
            <Label>API Provider</Label>
            <Select
              value={whatsapp?.provider || "meta"}
              onValueChange={(val) => updateNestedField("whatsapp.provider", val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="meta">Meta Official API</SelectItem>
                <SelectItem value="twilio">Twilio</SelectItem>
                <SelectItem value="messagebird">MessageBird</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {whatsapp?.provider === "meta" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Phone Number ID</Label>
                <Input
                  value={whatsapp.metaPhoneNumberId || ""}
                  onChange={(e) => updateNestedField("whatsapp.metaPhoneNumberId", e.target.value)}
                  placeholder="e.g. 1023456789"
                />
              </div>
              <div className="space-y-2">
                <Label>Access Token</Label>
                <Input
                  value={whatsapp.metaAccessToken || ""}
                  type="password"
                  onChange={(e) => updateNestedField("whatsapp.metaAccessToken", e.target.value)}
                  placeholder="EAA..."
                />
              </div>
            </div>
          )}

          {whatsapp?.provider === "twilio" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Account SID</Label>
                <Input
                  value={whatsapp.twilioAccountSid || ""}
                  onChange={(e) => updateNestedField("whatsapp.twilioAccountSid", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Auth Token</Label>
                <Input
                  value={whatsapp.twilioAuthToken || ""}
                  type="password"
                  onChange={(e) => updateNestedField("whatsapp.twilioAuthToken", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>WhatsApp Phone Number</Label>
                <Input
                  value={whatsapp.twilioFromNumber || ""}
                  onChange={(e) => updateNestedField("whatsapp.twilioFromNumber", e.target.value)}
                  placeholder="+1234567890"
                />
              </div>
            </div>
          )}

          {whatsapp?.provider === "messagebird" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Access Key</Label>
                <Input
                  value={whatsapp.messagebirdAccessKey || ""}
                  type="password"
                  onChange={(e) => updateNestedField("whatsapp.messagebirdAccessKey", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Channel ID</Label>
                <Input
                  value={whatsapp.messagebirdChannelId || ""}
                  onChange={(e) => updateNestedField("whatsapp.messagebirdChannelId", e.target.value)}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-6 pt-6">
          <div>
            <h3 className="text-lg font-medium">Message Templates</h3>
            <p className="text-sm text-muted-foreground">
              Define the messages to send for each event. Available variables: {"{{orderNumber}}"}, {"{{customerName}}"}, {"{{status}}"}
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Order Confirmation</Label>
              <Textarea
                value={whatsapp?.templates?.orderConfirmation || ""}
                onChange={(e) => updateNestedField("whatsapp.templates.orderConfirmation", e.target.value)}
                placeholder="Hi {{customerName}}, your order {{orderNumber}} has been placed!"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Shipping Update</Label>
              <Textarea
                value={whatsapp?.templates?.shippingUpdate || ""}
                onChange={(e) => updateNestedField("whatsapp.templates.shippingUpdate", e.target.value)}
                placeholder="Hi {{customerName}}, your order {{orderNumber}} has shipped!"
              />
            </div>

            <div className="space-y-2">
              <Label>Delivery Confirmation</Label>
              <Textarea
                value={props.settings.whatsapp.templates?.deliveryUpdate || ""}
                onChange={(e) =>
                  props.updateNestedField(
                    "whatsapp.templates.deliveryUpdate", e.target.value)}
                placeholder="Hi {{customerName}}, your order {{orderNumber}} has been delivered."
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <StickySaveFooter
        label="Save Changes"
        isSaving={isSaving}
        isDirty={isDirty}
        onSave={onSave}
      />
    </div>
  );
}
