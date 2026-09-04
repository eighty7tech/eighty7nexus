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
import { Input } from "@/components/ui/input";
import { Check, LayoutTemplate, MapPin, Truck, Wallet } from "lucide-react";
import type { Settings } from "@/components/admin/settings/types";
import { cn } from "@/lib/utils";

interface TrackOrderSettingsTabProps {
  settings: Settings;
  isSaving: boolean;
  isDirty: boolean;
  updateNestedField: (path: string, value: unknown) => void;
  onSave: () => Promise<unknown>;
}

const TRACKING_THEMES = [
  { id: "modern-glass", name: "Modern Glass (Premium)", desc: "Frosted backgrounds and sleek animations" },
  { id: "classic-minimal", name: "Classic Minimal", desc: "Clean, flat design with high contrast" },
  { id: "vibrant-gradient", name: "Vibrant Gradient", desc: "Bold colors and energetic transitions" },
  { id: "dark-luxury", name: "Dark Luxury", desc: "Deep dark mode with gold/accent highlights" },
  { id: "corporate-pro", name: "Corporate Pro", desc: "Structured, traditional enterprise look" },
] as const;

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
    ghanaPostGps: false,
    dispatchRiderInfo: false,
    momoCodTracking: false,
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
          <CardTitle className="flex items-center gap-2">
            <LayoutTemplate className="h-5 w-5" />
            Page Theme & Style
          </CardTitle>
          <CardDescription>
            Select a predefined visual layout for the tracking page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {TRACKING_THEMES.map((themeOption) => {
              const isActive = trackOrder.theme === themeOption.id;
              return (
                <div
                  key={themeOption.id}
                  onClick={() => handleChange("theme", themeOption.id)}
                  className={cn(
                    "relative cursor-pointer rounded-xl border p-4 transition-all duration-200 hover:shadow-md",
                    isActive 
                      ? "border-primary bg-primary/5 ring-1 ring-primary" 
                      : "border-border hover:border-primary/50"
                  )}
                >
                  {isActive && (
                    <div className="absolute right-3 top-3 h-5 w-5 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                      <Check className="h-3 w-3" />
                    </div>
                  )}
                  <div className="mb-2 h-16 w-full rounded-md bg-gradient-to-br from-muted to-muted/50 border flex items-center justify-center">
                    <LayoutTemplate className="h-6 w-6 text-muted-foreground/50" />
                  </div>
                  <h4 className="font-semibold text-sm">{themeOption.name}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{themeOption.desc}</p>
                </div>
              );
            })}
          </div>

          <div className="space-y-3 pt-4 border-t">
            <Label>Accent Color</Label>
            <p className="text-xs text-muted-foreground">Overrides the primary color for progress bars and badges on the tracking page.</p>
            <div className="flex flex-wrap gap-3 max-w-md">
              {/* Preset Colors */}
              {["#10b981", "#3b82f6", "#f43f5e", "#8b5cf6", "#f59e0b", "#0f172a"].map((presetHex) => (
                <button
                  key={presetHex}
                  type="button"
                  onClick={() => handleChange("accentColor", presetHex)}
                  className={cn(
                    "h-10 w-10 rounded-full border-2 transition-all duration-200 shadow-sm",
                    trackOrder.accentColor === presetHex 
                      ? "ring-2 ring-primary ring-offset-2 border-transparent scale-110" 
                      : "border-border/50 hover:scale-105"
                  )}
                  style={{ backgroundColor: presetHex }}
                  title={`Use ${presetHex}`}
                />
              ))}
              
              {/* Custom Color Input */}
              <div className="flex gap-2 items-center ml-2 border-l pl-4">
                <Input
                  type="color"
                  value={trackOrder.accentColor || "#10b981"}
                  onChange={(e) => handleChange("accentColor", e.target.value)}
                  className="h-10 w-10 p-1 cursor-pointer rounded-full"
                  title="Custom Color"
                />
                <Input
                  type="text"
                  value={trackOrder.accentColor || "#10b981"}
                  onChange={(e) => handleChange("accentColor", e.target.value)}
                  className="font-mono w-24 h-10 text-xs"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Ghana Delivery Integration
          </CardTitle>
          <CardDescription>
            Configure local fulfillment features specific to the Ghanaian market.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md border p-4 flex gap-4 items-start">
            <div className="mt-1 bg-muted p-2 rounded-md"><MapPin className="h-4 w-4 text-primary" /></div>
            <div className="flex-1">
              <SwitchRow
                label="GhanaPostGPS & Map Verification"
                checked={trackOrder.ghanaPostGps === true}
                onChange={(checked) => handleChange("ghanaPostGps", checked)}
              />
              <p className="text-sm text-muted-foreground mt-1">
                Prompt customers to verify their digital address and drop a GPS pin during the Processing stage.
              </p>
            </div>
          </div>
          
          <div className="rounded-md border p-4 flex gap-4 items-start">
            <div className="mt-1 bg-muted p-2 rounded-md"><Truck className="h-4 w-4 text-primary" /></div>
            <div className="flex-1">
              <SwitchRow
                label="Dispatch Rider Live Telemetry"
                checked={trackOrder.dispatchRiderInfo === true}
                onChange={(checked) => handleChange("dispatchRiderInfo", checked)}
              />
              <p className="text-sm text-muted-foreground mt-1">
                Expose dispatch rider contact details (WhatsApp/Call) and vehicle info when the status is "Out for Delivery".
              </p>
            </div>
          </div>

          <div className="rounded-md border p-4 flex gap-4 items-start">
            <div className="mt-1 bg-muted p-2 rounded-md"><Wallet className="h-4 w-4 text-primary" /></div>
            <div className="flex-1">
              <SwitchRow
                label="MoMo & COD Payment Status"
                checked={trackOrder.momoCodTracking === true}
                onChange={(checked) => handleChange("momoCodTracking", checked)}
              />
              <p className="text-sm text-muted-foreground mt-1">
                Display clear payment instructions for Cash on Delivery or generate an inline MoMo prompt for unpaid orders.
              </p>
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
