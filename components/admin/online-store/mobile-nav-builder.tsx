"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, GripVertical } from "lucide-react";
import type { HeaderSettings, MobileNavItem } from "@/lib/header-config";

interface MobileNavBuilderProps {
  header: HeaderSettings;
  updateField: (path: string, value: any) => void;
}

const AVAILABLE_ICONS = [
  "Home", "Grid", "Heart", "ShoppingCart", "User", "Search", "Menu", "Settings", "List", "Star", "Tag"
];

const AVAILABLE_ACTIONS = [
  { value: "navigate", label: "Navigate to URL" },
  { value: "drawer_menu", label: "Open Mobile Menu" },
  { value: "drawer_account", label: "Open Account Drawer" }
];

export function MobileNavBuilder({ header, updateField }: MobileNavBuilderProps) {
  const nav = header.mobile.nav || { style: "standard", items: [] };

  const addItem = () => {
    const currentItems = nav.items || [];
    updateField("mobile.nav.items", [
      ...currentItems,
      { id: crypto.randomUUID(), label: "New Item", icon: "Home", action: "navigate", href: "/" }
    ]);
  };

  const removeItem = (index: number) => {
    const newItems = [...(nav.items || [])];
    newItems.splice(index, 1);
    updateField("mobile.nav.items", newItems);
  };

  const updateItem = (index: number, key: keyof MobileNavItem, value: any) => {
    const newItems = [...(nav.items || [])];
    newItems[index] = { ...newItems[index], [key]: value };
    updateField("mobile.nav.items", newItems);
  };

  return (
    <Card className="gap-4">
      <CardHeader>
        <CardTitle>Mobile Bottom Nav</CardTitle>
        <CardDescription>
          Customize the bottom navigation bar for mobile devices. Choose a visual style and configure the icons and actions.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2 max-w-sm">
          <Label>Navigation Style</Label>
          <NativeSelect
            value={nav.style}
            onChange={(e) => updateField("mobile.nav.style", e.target.value)}
          >
            <option value="standard">Standard (Classic Dock)</option>
            <option value="floating">Floating Pill</option>
            <option value="minimal">Minimal Translucent</option>
            <option value="icon-only">Icon Only (No Labels)</option>
            <option value="curved">Curved Top</option>
            <option value="glassmorphism">Glassmorphism</option>
          </NativeSelect>
        </div>

        <div className="space-y-4">
          <Label>Navigation Items</Label>
          <div className="space-y-3">
            {(nav.items || []).map((item, idx) => (
              <div key={item.id} className="flex gap-3 border rounded-lg p-3 bg-muted/20 items-start">
                <div className="mt-2 text-muted-foreground cursor-grab">
                  <GripVertical className="h-5 w-5" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1">
                  <div className="space-y-1">
                    <Label className="text-xs">Label</Label>
                    <Input 
                      value={item.label} 
                      onChange={(e) => updateItem(idx, "label", e.target.value)} 
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Icon</Label>
                    <NativeSelect
                      value={item.icon}
                      onChange={(e) => updateItem(idx, "icon", e.target.value)}
                    >
                      {AVAILABLE_ICONS.map(icon => (
                        <option key={icon} value={icon}>{icon}</option>
                      ))}
                    </NativeSelect>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Action</Label>
                    <NativeSelect
                      value={item.action}
                      onChange={(e) => updateItem(idx, "action", e.target.value)}
                    >
                      {AVAILABLE_ACTIONS.map(a => (
                        <option key={a.value} value={a.value}>{a.label}</option>
                      ))}
                    </NativeSelect>
                  </div>
                  {item.action === "navigate" && (
                    <div className="space-y-1">
                      <Label className="text-xs">URL / Path</Label>
                      <Input 
                        value={item.href || ""} 
                        onChange={(e) => updateItem(idx, "href", e.target.value)} 
                        className="h-8 text-sm"
                        placeholder="/products"
                      />
                    </div>
                  )}
                  <div className="space-y-1">
                    <Label className="text-xs">Badge Type</Label>
                    <NativeSelect
                      value={item.badgeType || "none"}
                      onChange={(e) => updateItem(idx, "badgeType", e.target.value === "none" ? undefined : e.target.value)}
                    >
                      <option value="none">No Badge</option>
                      <option value="cart">Cart Count</option>
                      <option value="wishlist">Wishlist Count</option>
                    </NativeSelect>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => removeItem(idx)} className="h-8 w-8 text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={addItem} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Nav Item
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
