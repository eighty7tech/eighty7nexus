"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowRight, Building2, MapPin, Truck, RefreshCw, Users, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/ui/confirmation-dialog";
import type { Settings } from "@/components/admin/settings/types";
import { SettingsTabHeader } from "./settings-tab-header";
import { StickySaveFooter } from "./sticky-save-footer";
import { useTranslations } from "next-intl";

export function MultiBranchSettingsTab(props: {
  settings: Settings;
  isSaving: boolean;
  isDirty: boolean;
  updateField: (path: string, value: unknown) => void;
  onSave: () => void | Promise<unknown>;
}) {
  const t = useTranslations();
  const params = useParams();
  const locale = typeof params?.locale === "string" ? params.locale : "en";
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingValue, setPendingValue] = useState<boolean>(
    props.settings.multiBranch?.enabled ?? false,
  );

  const mb = props.settings.multiBranch || {
    enabled: false,
    allowBranchPickup: true,
    autoAssignOrderToNearestBranch: false,
    allowBranchInventoryTransfer: true,
    requireStaffBranchAssignment: false,
  };

  const isEnabled = mb.enabled;

  return (
    <div className="space-y-6">
      <SettingsTabHeader
        title="Multi-Branch & Location Settings"
        description="Manage multi-location inventory, store pickup fulfillment, branch routing, and staff assignments."
      />

      {/* Main Mode Switch Card */}
      <Card className="border-border/60 shadow-sm">
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                <p className="font-semibold text-base">Enable Multi-Branch Architecture</p>
              </div>
              <p className="text-sm text-muted-foreground">
                Activate separate branch inventories, POS terminals, and physical pickup depots.
              </p>
            </div>
            <Switch
              checked={isEnabled}
              onCheckedChange={(v) => {
                setPendingValue(v);
                setConfirmOpen(true);
              }}
            />
          </div>

          {isEnabled && (
            <div className="pt-3 border-t border-border/40 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Configured physical warehouses, retail stores, and pickup depots.
              </span>
              <Link
                href={`/${locale}/admin/locations`}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
              >
                Manage Store Locations &amp; Branches
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed Feature Settings */}
      <Card className={`border-border/60 shadow-sm transition-opacity ${!isEnabled ? "opacity-60 pointer-events-none" : ""}`}>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" /> Branch Fulfillment &amp; Operations
          </CardTitle>
          <CardDescription>
            Fine-tune order routing, customer pickup, inventory transfers, and staff branch scoping.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Branch Pickup */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5 max-w-[80%]">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                <Truck className="h-4 w-4 text-muted-foreground" /> Allow In-Store Customer Pickup
              </Label>
              <p className="text-xs text-muted-foreground">
                Customers can select their nearest branch as a collection point during checkout.
              </p>
            </div>
            <Switch
              checked={mb.allowBranchPickup ?? true}
              disabled={!isEnabled}
              onCheckedChange={(v) => props.updateField("multiBranch.allowBranchPickup", v)}
            />
          </div>

          <div className="h-px bg-border/40" />

          {/* Auto Assign Orders */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5 max-w-[80%]">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                <RefreshCw className="h-4 w-4 text-muted-foreground" /> Auto-Assign Orders to Nearest Branch
              </Label>
              <p className="text-xs text-muted-foreground">
                Uses GPS geocoding / Haversine distance to route shipping orders to the closest branch with stock.
              </p>
            </div>
            <Switch
              checked={mb.autoAssignOrderToNearestBranch ?? false}
              disabled={!isEnabled}
              onCheckedChange={(v) => props.updateField("multiBranch.autoAssignOrderToNearestBranch", v)}
            />
          </div>

          <div className="h-px bg-border/40" />

          {/* Inventory Transfers */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5 max-w-[80%]">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                <RefreshCw className="h-4 w-4 text-muted-foreground" /> Inter-Branch Inventory Transfers
              </Label>
              <p className="text-xs text-muted-foreground">
                Allow admins and branch managers to create stock transfer requests between locations.
              </p>
            </div>
            <Switch
              checked={mb.allowBranchInventoryTransfer ?? true}
              disabled={!isEnabled}
              onCheckedChange={(v) => props.updateField("multiBranch.allowBranchInventoryTransfer", v)}
            />
          </div>

          <div className="h-px bg-border/40" />

          {/* Staff Branch Scoping */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5 max-w-[80%]">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                <Users className="h-4 w-4 text-muted-foreground" /> Require Staff Branch Assignment
              </Label>
              <p className="text-xs text-muted-foreground">
                When active, non-admin staff members are strictly restricted to data and POS terminals for their assigned branch.
              </p>
            </div>
            <Switch
              checked={mb.requireStaffBranchAssignment ?? false}
              disabled={!isEnabled}
              onCheckedChange={(v) => props.updateField("multiBranch.requireStaffBranchAssignment", v)}
            />
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        onConfirm={() => {
          props.updateField("multiBranch.enabled", pendingValue);
          setConfirmOpen(false);
        }}
        title={pendingValue ? "Enable Multi-Branch Mode?" : "Disable Multi-Branch Mode?"}
        description={
          pendingValue
            ? "Enabling Multi-Branch will unlock multi-location inventory controls, branch-specific POS registers, and pickup options."
            : "Disabling Multi-Branch will consolidate inventory calculations and disable branch-specific restrictions."
        }
        confirmText={pendingValue ? "Enable Multi-Branch" : "Disable Multi-Branch"}
        cancelText="Cancel"
        type={pendingValue ? "question" : "warning"}
        confirmVariant={pendingValue ? "default" : "destructive"}
      />

      <StickySaveFooter
        label="Save Branch Settings"
        isSaving={props.isSaving}
        isDirty={props.isDirty}
        onSave={props.onSave}
      />
    </div>
  );
}
