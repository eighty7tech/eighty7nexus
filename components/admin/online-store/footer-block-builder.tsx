"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import type { FooterSettings, FooterRow, FooterColumn, FooterBlockType } from "@/lib/footer-config";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

interface FooterBlockBuilderProps {
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

export function FooterBlockBuilder({ footer, updateField }: FooterBlockBuilderProps) {
  const rows = footer.rows || [];

  const addRow = () => {
    const newRow: FooterRow = {
      id: crypto.randomUUID(),
      columns: [
        { id: crypto.randomUUID(), width: "auto", alignment: "left", blocks: [] }
      ]
    };
    updateField("rows", [...rows, newRow]);
  };

  const removeRow = (rowIndex: number) => {
    const newRows = [...rows];
    newRows.splice(rowIndex, 1);
    updateField("rows", newRows);
  };

  const addColumn = (rowIndex: number) => {
    const newRows = [...rows];
    newRows[rowIndex].columns.push({
      id: crypto.randomUUID(),
      width: "auto",
      alignment: "left",
      blocks: []
    });
    updateField("rows", newRows);
  };

  const removeColumn = (rowIndex: number, colIndex: number) => {
    const newRows = [...rows];
    newRows[rowIndex].columns.splice(colIndex, 1);
    updateField("rows", newRows);
  };

  const updateColumn = (rowIndex: number, colIndex: number, key: keyof FooterColumn, value: any) => {
    const newRows = [...rows];
    newRows[rowIndex].columns[colIndex] = { ...newRows[rowIndex].columns[colIndex], [key]: value };
    updateField("rows", newRows);
  };

  const setBlockType = (rowIndex: number, colIndex: number, type: FooterBlockType | "") => {
    const newRows = [...rows];
    if (!type) {
      newRows[rowIndex].columns[colIndex].blocks = [];
    } else {
      newRows[rowIndex].columns[colIndex].blocks = [{
        id: crypto.randomUUID(),
        type: type as FooterBlockType
      }];
    }
    updateField("rows", newRows);
  };

  return (
    <Card className="gap-4">
      <CardHeader>
        <CardTitle>Block Builder (Advanced)</CardTitle>
        <CardDescription>
          Design the exact layout of your footer by adding rows and columns.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {rows.length === 0 && (
          <div className="rounded-md bg-muted/50 p-4 text-center text-sm text-muted-foreground">
            Using Quick-Start Template layout. Add a row to override.
          </div>
        )}
        {rows.map((row, rowIndex) => (
          <div key={row.id} className="border rounded-lg p-4 space-y-4 bg-muted/10 relative">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm">Row {rowIndex + 1}</h4>
              <Button variant="ghost" size="icon" onClick={() => removeRow(rowIndex)} className="text-destructive h-8 w-8">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {row.columns.map((col, colIndex) => (
                <div key={col.id} className="border rounded bg-card p-3 space-y-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">Column {colIndex + 1}</span>
                    <Button variant="ghost" size="icon" onClick={() => removeColumn(rowIndex, colIndex)} className="h-6 w-6 text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Widget</Label>
                    <NativeSelect
                      value={col.blocks[0]?.type || ""}
                      onChange={(e) => setBlockType(rowIndex, colIndex, e.target.value as any)}
                    >
                      <option value="">(Empty)</option>
                      {AVAILABLE_BLOCKS.map(b => (
                        <option key={b.value} value={b.value}>{b.label}</option>
                      ))}
                    </NativeSelect>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Alignment</Label>
                    <NativeSelect
                      value={col.alignment}
                      onChange={(e) => updateColumn(rowIndex, colIndex, "alignment", e.target.value)}
                    >
                      <option value="left">Left</option>
                      <option value="center">Center</option>
                      <option value="right">Right</option>
                    </NativeSelect>
                  </div>
                </div>
              ))}
              
              {row.columns.length < 4 && (
                <div className="flex items-center justify-center border border-dashed rounded p-4 h-full">
                  <Button variant="outline" size="sm" onClick={() => addColumn(rowIndex)} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Column
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}

        <Button variant="outline" onClick={addRow} className="w-full border-dashed">
          <Plus className="h-4 w-4 mr-2" />
          Add Row
        </Button>
      </CardContent>
    </Card>
  );
}
