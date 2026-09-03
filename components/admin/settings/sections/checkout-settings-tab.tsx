"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Truck, MapPin } from "lucide-react";
import Link from "next/link";
import { SettingsTabHeader } from "./settings-tab-header";
import { StickySaveFooter } from "./sticky-save-footer";
import type { Settings } from "@/components/admin/settings/types";

export function CheckoutSettingsTab(props: {
  settings: Settings;
  isSaving: boolean;
  isDirty: boolean;
  updateField: (path: string, value: unknown) => void;
  onSave: () => void | Promise<unknown>;
}) {
  const t = useTranslations();

  return (
    <div className="space-y-6">
      <SettingsTabHeader
        title="Checkout Settings"
        description="Manage checkout and delivery configurations."
      />
      
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><Truck className="w-5 h-5 mr-2" /> Delivery Methods</CardTitle>
            <CardDescription>Configure shipping options and rates.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Manage the available delivery services and pricing options.
            </p>
            <Button variant="outline" asChild className="w-full">
              <Link href="/admin/delivery">Manage Delivery Methods</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><MapPin className="w-5 h-5 mr-2" /> Pickup Stations</CardTitle>
            <CardDescription>Manage local pickup locations.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Configure physical locations where customers can collect their orders.
            </p>
            <Button variant="outline" asChild className="w-full">
              <Link href="/admin/pickup-stations">Manage Pickup Stations</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <StickySaveFooter 
        label="Save"
        isDirty={props.isDirty} 
        isSaving={props.isSaving} 
        onSave={props.onSave} 
      />
    </div>
  );
}
