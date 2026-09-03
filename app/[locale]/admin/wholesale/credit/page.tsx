"use client";

import { useEffect, useState } from "react";
import { Loader2, Settings, Mail } from "lucide-react";
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
import { useCurrency } from "@/providers/currency-provider";

export default function CreditAndTermsPage() {
  const { formatPrice } = useCurrency();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [creditLimit, setCreditLimit] = useState(0);
  const [paymentTerms, setPaymentTerms] = useState("prepaid");
  const [poRequired, setPoRequired] = useState(false);

  const fetchAccounts = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/admin/wholesale/credit");
      if (!res.ok) throw new Error("Failed to fetch credit accounts");
      const json = await res.json();
      if (json.success && json.data) {
        setAccounts(json.data.accounts);
      }
    } catch (error) {
      toast.error("Failed to load credit accounts");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleUpdate = async () => {
    if (!selectedAccount) return;
    try {
      const payload = {
        id: selectedAccount._id,
        creditLimit,
        paymentTerms,
        poRequired
      };
      const res = await fetch("/api/admin/wholesale/credit", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to update terms");
      toast.success("Credit & Terms updated! A notification email has been sent to the customer.");
      setIsDialogOpen(false);
      fetchAccounts();
    } catch (error) {
      toast.error("Failed to update credit terms");
    }
  };

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Credit & Net Terms</h1>
        <p className="text-muted-foreground mt-1">
          Manage corporate credit limits, monitor outstanding balances, and adjust payment terms.
        </p>
      </div>

      <div className="border rounded-md bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead>Payment Terms</TableHead>
              <TableHead>Credit Limit</TableHead>
              <TableHead>Available</TableHead>
              <TableHead>Outstanding</TableHead>
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
            ) : accounts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  No approved B2B accounts found.
                </TableCell>
              </TableRow>
            ) : (
              accounts.map((acc) => {
                const util = acc.creditLimit > 0 ? (acc.outstandingBalance / acc.creditLimit) * 100 : 0;
                
                return (
                  <TableRow key={acc._id}>
                    <TableCell className="font-medium">
                      {acc.companyName}
                      <div className="text-xs text-muted-foreground">
                        {acc.userId?.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="uppercase">
                        {acc.paymentTerms}
                      </Badge>
                      {acc.poRequired && <span className="text-xs text-muted-foreground ml-2">(PO Req)</span>}
                    </TableCell>
                    <TableCell>{formatPrice(acc.creditLimit)}</TableCell>
                    <TableCell className="text-emerald-600 font-medium">
                      {formatPrice(acc.availableCredit)}
                    </TableCell>
                    <TableCell>
                      <span className={util > 80 ? "text-destructive font-medium" : ""}>
                        {formatPrice(acc.outstandingBalance)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedAccount(acc);
                          setCreditLimit(acc.creditLimit || 0);
                          setPaymentTerms(acc.paymentTerms || "prepaid");
                          setPoRequired(acc.poRequired || false);
                          setIsDialogOpen(true);
                        }}
                      >
                        <Settings className="h-4 w-4 mr-1" /> Adjust Limits
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Credit & Terms</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Payment Terms</Label>
              <select
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
              >
                <option value="prepaid">Prepaid</option>
                <option value="net15">Net 15</option>
                <option value="net30">Net 30</option>
                <option value="net60">Net 60</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Credit Limit</Label>
              <Input
                type="number"
                value={creditLimit}
                onChange={(e) => setCreditLimit(Number(e.target.value))}
              />
            </div>
            <div className="flex items-center gap-2 mt-2">
              <input
                type="checkbox"
                id="poRequired"
                checked={poRequired}
                onChange={(e) => setPoRequired(e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="poRequired">Require Purchase Order (PO) at checkout</Label>
            </div>
            
            <div className="mt-4 flex items-start gap-2 bg-muted/50 p-3 rounded text-sm text-muted-foreground">
              <Mail className="h-4 w-4 mt-0.5 text-primary" />
              <p>Saving these changes will automatically email the customer ({selectedAccount?.userId?.email}) a notification of their new terms.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdate}>Update & Notify Customer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
