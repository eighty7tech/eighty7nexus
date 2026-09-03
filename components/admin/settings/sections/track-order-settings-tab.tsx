"use client";

import { useTranslations } from "next-intl";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { SettingsTabHeader } from "./settings-tab-header";
import { StickySaveFooter } from "./sticky-save-footer";
import { SwitchRow } from "@/components/admin/online-store/builder-fields";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import type { Settings } from "@/components/admin/settings/types";

interface TrackOrderSettingsTabProps {
  settings: Settings;
  isSaving: boolean;
  isDirty: boolean;
  updateNestedField: (path: string, value: unknown) => void;
  onSave: () => Promise<unknown>;
}

export function TrackOrderSettingsTab({
  settings,
  isSaving,
  isDirty,
  updateNestedField,
  onSave,
}: TrackOrderSettingsTabProps) {
  const t = useTranslations("admin.settings");
  const trackOrder = settings.onlineStore?.trackOrder || {
    theme: "modern-glass",
    showMapIllustration: true,
    showItemList: true,
    accentColor: "#10b981",
    enableGlassmorphism: true,
  };

  const handleChange = (key: string, value: unknown) => {
    updateNestedField(`onlineStore.trackOrder.${key}`, value);
  };

  return (
    <div className="space-y-6 pb-24">
      <SettingsTabHeader
        title={t("trackOrder.title")}
        description={t("trackOrder.description")}
      />

      <Card>
        <CardHeader>
          <CardTitle>Page Theme & Style</CardTitle>
          <CardDescription>
            Select a predefined layout template for the tracking page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>UI Template Theme</Label>
            <Select
              value={trackOrder.theme || "modern-glass"}
              onValueChange={(v) => handleChange("theme", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a theme..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="modern-glass">Modern Glass (Premium)</SelectItem>
                <SelectItem value="classic-minimal">Classic Minimal</SelectItem>
                <SelectItem value="vibrant-gradient">Vibrant Gradient</SelectItem>
                <SelectItem value="dark-luxury">Dark Luxury</SelectItem>
                <SelectItem value="corporate-pro">Corporate Pro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Accent Color</Label>
              <div className="flex gap-3">
                <Input
                  type="color"
                  value={trackOrder.accentColor || "#10b981"}
                  onChange={(e) => handleChange("accentColor", e.target.value)}
                  className="h-10 w-16 p-1 cursor-pointer"
                />
                <Input
                  type="text"
                  value={trackOrder.accentColor || "#10b981"}
                  onChange={(e) => handleChange("accentColor", e.target.value)}
                  className="font-mono flex-1"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Advanced Features</CardTitle>
          <CardDescription>
            Toggle interactive elements and data displays on the tracking page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md border p-4">
            <SwitchRow
              label="Map Route Illustration"
              checked={trackOrder.showMapIllustration !== false}
              onChange={(checked) => handleChange("showMapIllustration", checked)}
            />
            <p className="text-sm text-muted-foreground mt-1">
              Displays a dynamic, stylized transit map or timeline illustration above the order steps.
            </p>
          </div>
          <div className="rounded-md border p-4">
            <SwitchRow
              label="Itemized Product List"
              checked={trackOrder.showItemList !== false}
              onChange={(checked) => handleChange("showItemList", checked)}
            />
            <p className="text-sm text-muted-foreground mt-1">
              Shows the customer exactly which products are contained in this shipment.
            </p>
          </div>
          <div className="rounded-md border p-4">
            <SwitchRow
              label="Enable Glassmorphism"
              checked={trackOrder.enableGlassmorphism !== false}
              onChange={(checked) => handleChange("enableGlassmorphism", checked)}
            />
            <p className="text-sm text-muted-foreground mt-1">
              Applies frosted glass effects and blur to cards (best used with Modern Glass theme).
            </p>
          </div>
        </CardContent>
      </Card>

      <StickySaveFooter
        label="Save Tracking Settings"
        isDirty={isDirty}
        isSaving={isSaving}
        onSave={onSave}
      />
    </div>
  );
}
