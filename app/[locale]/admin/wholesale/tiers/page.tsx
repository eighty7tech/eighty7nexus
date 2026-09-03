"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function WholesaleTiersPage() {
  const [tiers, setTiers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    _id: "",
    name: "",
    code: "",
    defaultDiscountPercentage: 0,
    minOrderValue: 0,
    allowNetTerms: false,
  });

  const fetchTiers = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/admin/wholesale/tiers");
      if (!res.ok) throw new Error("Failed to fetch tiers");
      const json = await res.json();
      if (json.success && json.data) {
        setTiers(json.data.tiers);
      }
    } catch (error) {
      toast.error("Failed to load tiers");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTiers();
  }, []);

  const handleOpenDialog = (tier: any = null) => {
    if (tier) {
      setIsEditing(true);
      setFormData({
        _id: tier._id,
        name: tier.name,
        code: tier.code,
        defaultDiscountPercentage: tier.defaultDiscountPercentage,
        minOrderValue: tier.minOrderValue,
        allowNetTerms: tier.allowNetTerms,
      });
    } else {
      setIsEditing(false);
      setFormData({
        _id: "",
        name: "",
        code: "",
        defaultDiscountPercentage: 0,
        minOrderValue: 0,
        allowNetTerms: false,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      const method = isEditing ? "PUT" : "POST";
      const res = await fetch("/api/admin/wholesale/tiers", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to save tier");
      }
      
      toast.success(`Tier ${isEditing ? "updated" : "created"} successfully`);
      setIsDialogOpen(false);
      fetchTiers();
    } catch (error: any) {
      toast.error(error.message || "Failed to save tier");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this tier?")) return;
    try {
      const res = await fetch("/api/admin/wholesale/tiers", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) throw new Error("Failed to delete tier");
      toast.success("Tier deleted successfully");
      fetchTiers();
    } catch (error) {
      toast.error("Failed to delete tier");
    }
  };

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customer Tiers</h1>
          <p className="text-muted-foreground mt-1">
            Manage wholesale pricing tiers and discounts.
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" /> Create Tier
        </Button>
      </div>

      <div className="border rounded-md bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tier Name</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Discount %</TableHead>
              <TableHead>Min Order</TableHead>
              <TableHead>Net Terms</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : tiers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  No tiers found.
                </TableCell>
              </TableRow>
            ) : (
              tiers.map((tier) => (
                <TableRow key={tier._id}>
                  <TableCell className="font-medium">{tier.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{tier.code}</Badge>
                  </TableCell>
                  <TableCell>{tier.defaultDiscountPercentage}%</TableCell>
                  <TableCell>${tier.minOrderValue}</TableCell>
                  <TableCell>
                    {tier.allowNetTerms ? (
                      <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600">Yes</Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-muted text-muted-foreground">No</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleOpenDialog(tier)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive border-destructive/30 hover:bg-destructive/10"
                      onClick={() => handleDelete(tier._id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit Tier" : "Create New Tier"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Tier Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Gold Partner"
              />
            </div>
            <div className="grid gap-2">
              <Label>Tier Code</Label>
              <Input
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="e.g. GOLD"
                disabled={isEditing}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Discount %</Label>
                <Input
                  type="number"
                  value={formData.defaultDiscountPercentage}
                  onChange={(e) => setFormData({ ...formData, defaultDiscountPercentage: Number(e.target.value) })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Min Order Value</Label>
                <Input
                  type="number"
                  value={formData.minOrderValue}
                  onChange={(e) => setFormData({ ...formData, minOrderValue: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <input
                type="checkbox"
                id="allowNetTerms"
                checked={formData.allowNetTerms}
                onChange={(e) => setFormData({ ...formData, allowNetTerms: e.target.checked })}
                className="rounded border-gray-300"
              />
              <Label htmlFor="allowNetTerms">Allow Net Terms Checkout</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{isEditing ? "Save Changes" : "Create Tier"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
