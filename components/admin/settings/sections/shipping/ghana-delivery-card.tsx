"use client";

import { Plus, Trash2, Edit2 } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import type { IGhanaDeliveryMethod } from "@/types";
import { RegionMultiSelect } from "@/components/common/region-multi-select";

type GhanaDeliveryCardProps = {
  methods: IGhanaDeliveryMethod[];
  onChange: (methods: IGhanaDeliveryMethod[]) => void;
};

function newId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function GhanaDeliveryCard({ methods, onChange }: GhanaDeliveryCardProps) {
  const t = useTranslations();
  
  const addMethod = () => {
    onChange([
      ...methods,
      {
        id: newId(),
        name: "New Method",
        active: true,
        basePrice: 0,
        coverageRegions: [],
        minDays: 1,
        maxDays: 3,
      },
    ]);
  };

  const updateMethod = (id: string, updates: Partial<IGhanaDeliveryMethod>) => {
    onChange(methods.map((m) => (m.id === id ? { ...m, ...updates } : m)));
  };

  const removeMethod = (id: string) => {
    onChange(methods.filter((m) => m.id !== id));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Ghana Delivery Methods</CardTitle>
            <CardDescription>
              Configure local delivery options for Ghana checkout. Assign specific regions or leave blank for nationwide coverage.
            </CardDescription>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addMethod}>
            <Plus className="mr-2 h-4 w-4" />
            Add Method
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {methods.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            No Ghana delivery methods configured. Click Add Method to create one.
          </div>
        ) : (
          <div className="space-y-4">
            {methods.map((method, index) => (
              <div key={method.id} className="rounded-lg border p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={method.active}
                      onCheckedChange={(checked) => updateMethod(method.id, { active: checked })}
                    />
                    <Label className="font-semibold text-base">{method.name}</Label>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => removeMethod(method.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Method Name</Label>
                    <Input
                      value={method.name}
                      onChange={(e) => updateMethod(method.id, { name: e.target.value })}
                      placeholder="e.g. VIP Transport, Motorbike Dispatch"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Base Price (GHS)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={method.basePrice}
                      onChange={(e) => updateMethod(method.id, { basePrice: Number(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Coverage Regions</Label>
                    <RegionMultiSelect
                      countries={["GH"]}
                      value={method.coverageRegions || []}
                      onChange={(regions) => updateMethod(method.id, { coverageRegions: regions })}
                    />
                    <p className="text-xs text-muted-foreground mt-1">Leave empty for nationwide coverage.</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Min Days</Label>
                    <Input
                      type="number"
                      min={0}
                      value={method.minDays}
                      onChange={(e) => updateMethod(method.id, { minDays: Number(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Max Days</Label>
                    <Input
                      type="number"
                      min={0}
                      value={method.maxDays}
                      onChange={(e) => updateMethod(method.id, { maxDays: Number(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Tracking URL Template (Optional)</Label>
                    <Input
                      value={method.trackingUrlTemplate || ""}
                      onChange={(e) => updateMethod(method.id, { trackingUrlTemplate: e.target.value })}
                      placeholder="e.g. https://track.example.com?id={tracking}"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
