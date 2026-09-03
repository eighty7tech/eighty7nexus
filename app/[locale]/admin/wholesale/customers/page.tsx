"use client";

import { useEffect, useState } from "react";
import { Loader2, Ban, Edit, User } from "lucide-react";
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

export default function B2BAccountsPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Dialog State
  const [isRepDialogOpen, setIsRepDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [repName, setRepName] = useState("");
  const [repEmail, setRepEmail] = useState("");

  const fetchCustomers = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/admin/wholesale/customers");
      if (!res.ok) throw new Error("Failed to fetch customers");
      const json = await res.json();
      if (json.success && json.data) {
        setCustomers(json.data.customers);
      }
    } catch (error) {
      toast.error("Failed to load B2B accounts");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleSuspend = async (id: string) => {
    if (!confirm("Are you sure you want to suspend this account?")) return;
    try {
      const payload = { id, action: "suspend" };
      const res = await fetch("/api/admin/wholesale/customers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to suspend");
      toast.success("Account suspended successfully");
      fetchCustomers();
    } catch (error) {
      toast.error("Failed to suspend account");
    }
  };

  const handleUpdateRep = async () => {
    if (!selectedCustomer) return;
    try {
      const payload = { 
        id: selectedCustomer._id, 
        action: "update_rep",
        accountRepName: repName,
        accountRepEmail: repEmail
      };
      const res = await fetch("/api/admin/wholesale/customers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to update rep");
      toast.success("Account Representative updated successfully");
      setIsRepDialogOpen(false);
      fetchCustomers();
    } catch (error) {
      toast.error("Failed to update rep");
    }
  };

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Active B2B Accounts</h1>
        <p className="text-muted-foreground mt-1">
          Manage approved corporate customers, assign tiers, and dedicated reps.
        </p>
      </div>

      <div className="border rounded-md bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead>Rep Name</TableHead>
              <TableHead>Tier</TableHead>
              <TableHead>Business Type</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : customers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                  No active B2B accounts.
                </TableCell>
              </TableRow>
            ) : (
              customers.map((customer) => (
                <TableRow key={customer._id}>
                  <TableCell className="font-medium">
                    {customer.companyName}
                    <div className="text-xs text-muted-foreground">
                      {customer.userId?.email}
                    </div>
                  </TableCell>
                  <TableCell>
                    {customer.accountRepName || <span className="text-muted-foreground italic">Unassigned</span>}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {customer.tierId?.name || "Standard"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {customer.businessType}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedCustomer(customer);
                        setRepName(customer.accountRepName || "");
                        setRepEmail(customer.accountRepEmail || "");
                        setIsRepDialogOpen(true);
                      }}
                    >
                      <User className="h-4 w-4 mr-1" /> Rep
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive border-destructive/30 hover:bg-destructive/10"
                      onClick={() => handleSuspend(customer._id)}
                    >
                      <Ban className="h-4 w-4 mr-1" /> Suspend
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Account Rep Dialog */}
      <Dialog open={isRepDialogOpen} onOpenChange={setIsRepDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Dedicated Representative</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="repName">Representative Name</Label>
              <Input
                id="repName"
                placeholder="e.g. John Doe"
                value={repName}
                onChange={(e) => setRepName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="repEmail">Representative Email</Label>
              <Input
                id="repEmail"
                type="email"
                placeholder="e.g. john@eighty7nexus.com"
                value={repEmail}
                onChange={(e) => setRepEmail(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRepDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateRep}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
