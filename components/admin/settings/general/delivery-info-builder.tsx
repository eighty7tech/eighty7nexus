"use client";

import { useState } from "react";
import { Plus, Trash2, GripVertical, Truck, ShieldCheck, Clock, Package, Globe, RotateCcw, CreditCard, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RichTextEditor } from "@/components/ui/rich-text-editor";

const AVAILABLE_ICONS = [
  { id: "truck", label: "Truck", icon: Truck },
  { id: "shield", label: "Shield", icon: ShieldCheck },
  { id: "clock", label: "Clock", icon: Clock },
  { id: "package", label: "Package", icon: Package },
  { id: "globe", label: "Globe", icon: Globe },
  { id: "rotate", label: "Returns", icon: RotateCcw },
  { id: "credit-card", label: "Payment", icon: CreditCard },
  { id: "check", label: "Check", icon: CheckCircle },
];

export interface DeliveryInfoItem {
  icon: string;
  text: string;
  subtext?: string;
}

export function DeliveryInfoBuilder({
  value,
  onChange,
}: {
  value: DeliveryInfoItem[] | string;
  onChange: (value: DeliveryInfoItem[] | string) => void;
}) {
  // If it's a legacy string, we still allow them to edit it in RichTextEditor
  // OR they can click a button to migrate to the new UI.
  const isLegacy = typeof value === "string";

  const [items, setItems] = useState<DeliveryInfoItem[]>(Array.isArray(value) ? value : []);

  const handleAddItem = () => {
    const next = [...items, { icon: "truck", text: "New Delivery Info" }];
    setItems(next);
    onChange(next);
  };

  const handleUpdateItem = (index: number, field: keyof DeliveryInfoItem, val: string) => {
    const next = [...items];
    next[index] = { ...next[index], [field]: val };
    setItems(next);
    onChange(next);
  };

  const handleRemoveItem = (index: number) => {
    const next = items.filter((_, i) => i !== index);
    setItems(next);
    onChange(next);
  };

  const handleMigrate = () => {
    onChange([]);
  };

  if (isLegacy) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between bg-muted/50 p-3 rounded-lg border border-border">
          <div className="space-y-1">
            <h4 className="text-sm font-medium">Legacy Delivery Information</h4>
            <p className="text-xs text-muted-foreground">You are using the old rich-text format. Upgrade to the new icon-based layout for a better storefront experience.</p>
          </div>
          <Button type="button" size="sm" onClick={handleMigrate}>Upgrade UI</Button>
        </div>
        <RichTextEditor value={value} onChange={onChange} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item, index) => {
        const SelectedIcon = AVAILABLE_ICONS.find(i => i.id === item.icon)?.icon || Truck;
        return (
          <div key={index} className="flex items-start gap-3 p-3 border border-border rounded-lg bg-card group relative">
            <div className="flex-1 grid gap-4 sm:grid-cols-12">
              <div className="sm:col-span-3 space-y-1.5">
                <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Icon</Label>
                <Select
                  value={item.icon}
                  onValueChange={(val) => handleUpdateItem(index, "icon", val)}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue>
                      <div className="flex items-center gap-2">
                        <SelectedIcon className="h-4 w-4" />
                        <span className="truncate">{AVAILABLE_ICONS.find(i => i.id === item.icon)?.label}</span>
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_ICONS.map((opt) => (
                      <SelectItem key={opt.id} value={opt.id}>
                        <div className="flex items-center gap-2">
                          <opt.icon className="h-4 w-4" />
                          <span>{opt.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-9 space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Main Text</Label>
                  <Input
                    value={item.text}
                    onChange={(e) => handleUpdateItem(index, "text", e.target.value)}
                    placeholder="e.g. Free Shipping"
                    className="h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Subtext (Optional)</Label>
                  <Input
                    value={item.subtext || ""}
                    onChange={(e) => handleUpdateItem(index, "subtext", e.target.value)}
                    placeholder="e.g. On all orders over $50"
                    className="h-9"
                  />
                </div>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
              onClick={() => handleRemoveItem(index)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      })}

      <Button
        type="button"
        variant="outline"
        className="w-full h-10 border-dashed"
        onClick={handleAddItem}
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Feature
      </Button>
    </div>
  );
}
