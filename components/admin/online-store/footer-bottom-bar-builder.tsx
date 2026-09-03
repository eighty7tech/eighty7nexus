"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import type { FooterSettings, FooterColumn, FooterBlockType } from "@/lib/footer-config";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SwitchRow } from "@/components/admin/online-store/builder-fields";

interface FooterBottomBarBuilderProps {
  footer: FooterSettings;
  updateField: (path: string, value: any) => void;
}

const AVAILABLE_BLOCKS: { value: FooterBlockType; label: string }[] = [
  { value: "copyright", label: "Copyright" },
  { value: "developer_credit", label: "Developer Credit" },
  { value: "payment_methods", label: "Payment Methods" },
  { value: "social_icons", label: "Social Icons" },
  { value: "brand_info", label: "Brand Info" },
  { value: "link_column", label: "Link Column" },
  { value: "custom_text", label: "Custom Text" },
];

export function FooterBottomBarBuilder({ footer, updateField }: FooterBottomBarBuilderProps) {
  const bottomBar = footer.bottomBar || { enabled: true, columns: [] };
  const columns = bottomBar.columns;

  const setColumnCount = (count: number) => {
    const newColumns = [...columns];
    if (count > newColumns.length) {
      while (newColumns.length < count) {
        newColumns.push({
          id: crypto.randomUUID(),
          width: "auto",
          alignment: "center",
          blocks: [],
        });
      }
    } else {
      newColumns.splice(count);
    }
    updateField("bottomBar.columns", newColumns);
  };

  const updateColumn = (colIndex: number, key: keyof FooterColumn, value: any) => {
    const newColumns = [...columns];
    newColumns[colIndex] = { ...newColumns[colIndex], [key]: value };
    updateField("bottomBar.columns", newColumns);
  };

  const setBlockType = (colIndex: number, type: FooterBlockType | "") => {
    const newColumns = [...columns];
    if (!type) {
      newColumns[colIndex].blocks = [];
    } else {
      newColumns[colIndex].blocks = [{
        id: crypto.randomUUID(),
        type: type as FooterBlockType
      }];
    }
    updateField("bottomBar.columns", newColumns);
  };

  return (
    <Card className="gap-4">
      <CardHeader>
        <CardTitle>Bottom Bar Layout (Copyright Area)</CardTitle>
        <CardDescription>
          Design the bottom strip of your footer. Select how many columns to display, and what content goes into each.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <SwitchRow
          label="Enable Bottom Bar"
          checked={bottomBar.enabled}
          onChange={(val) => updateField("bottomBar.enabled", val)}
        />
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium">Number of Columns:</label>
          <NativeSelect 
            className="w-32"
            value={columns.length.toString()} 
            onChange={(e) => setColumnCount(parseInt(e.target.value, 10))}
          >
            <option value="1">1 Column</option>
            <option value="2">2 Columns</option>
            <option value="3">3 Columns</option>
            <option value="4">4 Columns</option>
            <option value="5">5 Columns</option>
          </NativeSelect>
        </div>

        {columns.length > 0 && (
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}>
            {columns.map((col, colIndex) => (
              <div key={col.id} className="border rounded-md p-3 bg-muted/20 space-y-3">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center border-b pb-2">
                  Column {colIndex + 1}
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">Block Type</label>
                  <NativeSelect
                    value={col.blocks[0]?.type || ""}
                    onChange={(e) => setBlockType(colIndex, e.target.value as any)}
                    className="w-full text-sm h-8"
                  >
                    <option value="">None</option>
                    {AVAILABLE_BLOCKS.map(b => (
                      <option key={b.value} value={b.value}>{b.label}</option>
                    ))}
                  </NativeSelect>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">Alignment</label>
                  <NativeSelect
                    value={col.alignment || "center"}
                    onChange={(e) => updateColumn(colIndex, "alignment", e.target.value)}
                    className="w-full text-sm h-8"
                  >
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                    <option value="right">Right</option>
                  </NativeSelect>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
