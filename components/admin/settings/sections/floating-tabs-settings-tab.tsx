"use client";

import { useTranslations } from "next-intl";
import { Plus, GripVertical, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SettingsTabHeader } from "./settings-tab-header";
import { StickySaveFooter } from "./sticky-save-footer";
import { SwitchRow } from "@/components/admin/online-store/builder-fields";
import type { Settings } from "@/components/admin/settings/types";

interface FloatingTabsSettingsTabProps {
  settings: Settings;
  isSaving: boolean;
  isDirty: boolean;
  updateNestedField: (path: string, value: unknown) => void;
  onSave: () => Promise<unknown>;
}

export function FloatingTabsSettingsTab({
  settings,
  isSaving,
  isDirty,
  updateNestedField,
  onSave,
}: FloatingTabsSettingsTabProps) {
  const t = useTranslations("admin.settings.floatingTabs");
  
  const floatingTabs = Array.isArray(settings.onlineStore?.floatingTabs) 
    ? settings.onlineStore.floatingTabs 
    : [];

  const handleAddGroup = () => {
    const newGroup = {
      id: crypto.randomUUID(),
      name: "New Tab Group",
      position: "right-bottom",
      styleVariant: "rounded-float",
      mobileOnly: false,
      items: [],
    };
    updateNestedField("onlineStore.floatingTabs", [...floatingTabs, newGroup]);
  };

  const handleUpdateGroup = (groupIndex: number, updates: any) => {
    const newTabs = [...floatingTabs];
    newTabs[groupIndex] = { ...newTabs[groupIndex], ...updates };
    updateNestedField("onlineStore.floatingTabs", newTabs);
  };

  const handleRemoveGroup = (groupIndex: number) => {
    const newTabs = floatingTabs.filter((_: any, i: number) => i !== groupIndex);
    updateNestedField("onlineStore.floatingTabs", newTabs);
  };

  const handleAddItem = (groupIndex: number) => {
    const newTabs = [...floatingTabs];
    const items = [...(newTabs[groupIndex].items || [])];
    items.push({
      id: crypto.randomUUID(),
      name: "New Item",
      icon: "link",
      url: "",
      type: "link",
    });
    newTabs[groupIndex] = { ...newTabs[groupIndex], items };
    updateNestedField("onlineStore.floatingTabs", newTabs);
  };

  const handleUpdateItem = (groupIndex: number, itemIndex: number, updates: any) => {
    const newTabs = [...floatingTabs];
    const items = [...(newTabs[groupIndex].items || [])];
    items[itemIndex] = { ...items[itemIndex], ...updates };
    newTabs[groupIndex] = { ...newTabs[groupIndex], items };
    updateNestedField("onlineStore.floatingTabs", newTabs);
  };

  const handleRemoveItem = (groupIndex: number, itemIndex: number) => {
    const newTabs = [...floatingTabs];
    const items = (newTabs[groupIndex].items || []).filter((_: any, i: number) => i !== itemIndex);
    newTabs[groupIndex] = { ...newTabs[groupIndex], items };
    updateNestedField("onlineStore.floatingTabs", newTabs);
  };

  const handleMoveItem = (groupIndex: number, itemIndex: number, direction: 'up' | 'down') => {
    const newTabs = [...floatingTabs];
    const items = [...(newTabs[groupIndex].items || [])];
    
    if (direction === 'up' && itemIndex > 0) {
      const temp = items[itemIndex];
      items[itemIndex] = items[itemIndex - 1];
      items[itemIndex - 1] = temp;
    } else if (direction === 'down' && itemIndex < items.length - 1) {
      const temp = items[itemIndex];
      items[itemIndex] = items[itemIndex + 1];
      items[itemIndex + 1] = temp;
    } else {
      return; // Can't move further
    }
    
    newTabs[groupIndex] = { ...newTabs[groupIndex], items };
    updateNestedField("onlineStore.floatingTabs", newTabs);
  };

  return (
    <div className="space-y-6 pb-24">
      <SettingsTabHeader
        title={t("floatingTabs.title")}
        description={t("floatingTabs.description")}
      />

      <Card>
        <CardHeader>
          <CardTitle>Tab Groups</CardTitle>
          <CardDescription>
            Create floating containers that group multiple quick links and actions together.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {floatingTabs.map((group: any, groupIndex: number) => (
            <div key={group.id} className="p-4 border rounded-lg bg-muted/20 space-y-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-lg">{group.name || "Unnamed Group"}</h3>
                <Button variant="ghost" size="icon" onClick={() => handleRemoveGroup(groupIndex)} className="text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Group Name (Internal)</Label>
                  <Input 
                    value={group.name || ""} 
                    onChange={(e) => handleUpdateGroup(groupIndex, { name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Style Variant</Label>
                  <Select
                    value={group.styleVariant || "rounded-float"}
                    onValueChange={(value) => handleUpdateGroup(groupIndex, { styleVariant: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rounded-float">Floating Bubbles (Default)</SelectItem>
                      <SelectItem value="block-edge">Edge Attached</SelectItem>
                      <SelectItem value="pill-minimal">Floating Pill</SelectItem>
                      <SelectItem value="modern-glow">Modern Glow</SelectItem>
                      <SelectItem value="glass-panel">Glassmorphism Panel</SelectItem>
                      <SelectItem value="neumorphic">Neumorphic</SelectItem>
                      <SelectItem value="edge-reveal">Edge Reveal Rail</SelectItem>
                      <SelectItem value="icon-dock">Floating Icon Dock</SelectItem>
                      <SelectItem value="gradient-burst">Gradient Burst Bubbles</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Position</Label>
                  <Select
                    value={group.position || "right-bottom"}
                    onValueChange={(value) => handleUpdateGroup(groupIndex, { position: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="left-center">Left Center</SelectItem>
                      <SelectItem value="right-center">Right Center</SelectItem>
                      <SelectItem value="left-bottom">Left Bottom</SelectItem>
                      <SelectItem value="right-bottom">Right Bottom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex items-center justify-between border rounded-md p-4 bg-background">
                <div className="space-y-0.5">
                  <Label>Display on Mobile</Label>
                  <p className="text-sm text-muted-foreground">
                    If disabled, this floating tab group will be hidden on mobile screens.
                  </p>
                </div>
                <SwitchRow
                  label=""
                  checked={group.displayOnMobile !== false}
                  onChange={(checked) => handleUpdateGroup(groupIndex, { displayOnMobile: checked })}
                />
              </div>

              {/* Items List */}
              <div className="mt-6 space-y-4">
                <Label className="text-sm font-medium">Tab Items</Label>
                {(group.items || []).map((item: any, itemIndex: number) => (
                  <div key={item.id} className="flex gap-4 p-3 border rounded bg-background items-start">
                    <div className="pt-2 flex flex-col gap-1 text-muted-foreground">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleMoveItem(groupIndex, itemIndex, 'up')}
                        disabled={itemIndex === 0}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleMoveItem(groupIndex, itemIndex, 'down')}
                        disabled={itemIndex === (group.items?.length || 0) - 1}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs">Label</Label>
                        <Input 
                          value={item.name || ""} 
                          onChange={(e) => handleUpdateItem(groupIndex, itemIndex, { name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Icon (Lucide)</Label>
                        <Input 
                          value={item.icon || ""} 
                          onChange={(e) => handleUpdateItem(groupIndex, itemIndex, { icon: e.target.value })}
                          placeholder="e.g. link, shopping-cart"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Action Type</Label>
                        <Select
                          value={item.type || "link"}
                          onValueChange={(value) => handleUpdateItem(groupIndex, itemIndex, { type: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="link">Custom Link</SelectItem>
                            <SelectItem value="ai_assistant">AI Assistant</SelectItem>
                            <SelectItem value="back_to_top">Back to Top</SelectItem>
                            <SelectItem value="category_trigger">Categories Menu</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">URL (if Link)</Label>
                        <Input 
                          value={item.url || ""} 
                          onChange={(e) => handleUpdateItem(groupIndex, itemIndex, { url: e.target.value })}
                          placeholder="https://..."
                          disabled={item.type !== "link"}
                        />
                      </div>
                    </div>
                    <div className="pt-6">
                      <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(groupIndex, itemIndex)} className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                
                <Button variant="outline" size="sm" className="mt-2" onClick={() => handleAddItem(groupIndex)}>
                  <Plus className="mr-2 h-3 w-3" />
                  Add Item
                </Button>
              </div>

            </div>
          ))}
          <Button variant="default" className="w-full" onClick={handleAddGroup}>
            <Plus className="mr-2 h-4 w-4" />
            Create New Tab Group
          </Button>
        </CardContent>
      </Card>

      <StickySaveFooter
        label="Save Tab Groups"
        isDirty={isDirty}
        isSaving={isSaving}
        onSave={onSave}
      />
    </div>
  );
}
