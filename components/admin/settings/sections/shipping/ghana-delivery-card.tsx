"use client";

import { Plus, Trash2, Edit2, CheckSquare } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Download } from "lucide-react";
import type { IGhanaDeliveryMethod } from "@/types";
import { RegionMultiSelect } from "@/components/common/region-multi-select";

const GHANA_DELIVERY_PRESETS = [
  { name: "VIP Transport (Intercity)", basePrice: 50, minDays: 1, maxDays: 2 },
  { name: "STC Package Express", basePrice: 40, minDays: 1, maxDays: 3 },
  { name: "Motorbike Delivery (Accra/Kumasi)", basePrice: 20, minDays: 0, maxDays: 1 },
  { name: "Bolt Send", basePrice: 30, minDays: 0, maxDays: 1 },
  { name: "Yango Delivery", basePrice: 25, minDays: 0, maxDays: 1 },
  { name: "Uber Connect", basePrice: 35, minDays: 0, maxDays: 1 },
  { name: "GIG Logistics", basePrice: 45, minDays: 1, maxDays: 3 },
  { name: "FedEx Ghana", basePrice: 80, minDays: 1, maxDays: 4 },
];

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
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [selectedPresets, setSelectedPresets] = useState<number[]>([]);
  
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
    setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
  };

  const removeSelected = () => {
    onChange(methods.filter((m) => !selectedIds.includes(m.id)));
    setSelectedIds([]);
  };

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(methods.map(m => m.id));
    } else {
      setSelectedIds([]);
    }
  };

  const toggleSelect = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
    }
  };

  const handleImport = () => {
    const methodsToAdd = selectedPresets.map(index => {
      const preset = GHANA_DELIVERY_PRESETS[index];
      return {
        id: newId(),
        name: preset.name,
        active: true,
        basePrice: preset.basePrice,
        coverageRegions: [],
        minDays: preset.minDays,
        maxDays: preset.maxDays,
      };
    });
    
    onChange([...methods, ...methodsToAdd]);
    setImportDialogOpen(false);
    setSelectedPresets([]);
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
          <div className="flex items-center gap-2">
            <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
              <DialogTrigger asChild>
                <Button type="button" variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Import
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Import Delivery Methods</DialogTitle>
                  <DialogDescription>
                    Select predefined Ghana delivery methods to import into your store.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4 max-h-[300px] overflow-y-auto space-y-3">
                  {GHANA_DELIVERY_PRESETS.map((preset, i) => (
                    <div key={preset.name} className="flex items-center space-x-3 rounded-md border p-3">
                      <Checkbox
                        id={`preset-${i}`}
                        checked={selectedPresets.includes(i)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedPresets(prev => [...prev, i]);
                          } else {
                            setSelectedPresets(prev => prev.filter(idx => idx !== i));
                          }
                        }}
                      />
                      <Label htmlFor={`preset-${i}`} className="flex-1 cursor-pointer flex justify-between">
                        <span className="font-medium">{preset.name}</span>
                        <span className="text-muted-foreground">GHS {preset.basePrice}</span>
                      </Label>
                    </div>
                  ))}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setImportDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleImport} disabled={selectedPresets.length === 0}>
                    Import Selected ({selectedPresets.length})
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button type="button" variant="default" size="sm" onClick={addMethod}>
              <Plus className="mr-2 h-4 w-4" />
              Add Method
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {methods.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            No Ghana delivery methods configured. Click Add Method to create one.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2">
              <div className="flex items-center gap-2">
                <Checkbox 
                  checked={methods.length > 0 && selectedIds.length === methods.length}
                  onCheckedChange={toggleSelectAll}
                  id="select-all-methods"
                />
                <Label htmlFor="select-all-methods" className="text-sm font-medium cursor-pointer">Select All</Label>
              </div>
              {selectedIds.length > 0 && (
                <Button variant="destructive" size="sm" onClick={removeSelected} className="h-8">
                  <Trash2 className="mr-2 h-3.5 w-3.5" />
                  Delete Selected ({selectedIds.length})
                </Button>
              )}
            </div>
            
            {methods.map((method, index) => (
              <div key={method.id} className="rounded-lg border p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <Checkbox 
                      checked={selectedIds.includes(method.id)}
                      onCheckedChange={(checked) => toggleSelect(method.id, checked as boolean)}
                    />
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={method.active}
                        onCheckedChange={(checked) => updateMethod(method.id, { active: checked })}
                      />
                      <Label className="font-semibold text-base">{method.name}</Label>
                    </div>
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
