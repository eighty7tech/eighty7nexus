"use client";

import { useEffect, useState } from "react";
import { Loader2, Check, X, FileText, Send } from "lucide-react";
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

export default function WholesaleQuotesPage() {
  const { formatPrice } = useCurrency();
  const [quotes, setQuotes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<any>(null);
  const [quotedPrice, setQuotedPrice] = useState(0);
  const [notesToCustomer, setNotesToCustomer] = useState("");

  const fetchQuotes = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/admin/wholesale/quotes");
      if (!res.ok) throw new Error("Failed to fetch quotes");
      const json = await res.json();
      if (json.success && json.data) {
        setQuotes(json.data.quotes);
      }
    } catch (error) {
      toast.error("Failed to load quotes");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotes();
  }, []);

  const handleAction = async (id: string, action: "accept" | "reject") => {
    try {
      const payload = { id, action };
      const res = await fetch("/api/admin/wholesale/quotes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`Failed to ${action}`);
      toast.success(action === "accept" ? "Quote accepted and Order generated!" : "Quote rejected");
      fetchQuotes();
    } catch (error) {
      toast.error(`Failed to ${action} quote`);
    }
  };

  const handleSendQuote = async () => {
    if (!selectedQuote) return;
    try {
      const payload = { 
        id: selectedQuote._id, 
        action: "send_quote",
        quotedPrice,
        notesToCustomer
      };
      const res = await fetch("/api/admin/wholesale/quotes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to send quote");
      toast.success("Quote sent to customer successfully");
      setIsDialogOpen(false);
      fetchQuotes();
    } catch (error) {
      toast.error("Failed to send quote");
    }
  };

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Quotes & RFQs</h1>
        <p className="text-muted-foreground mt-1">
          Review Requests for Quote (RFQs), submit pricing proposals, and convert to orders.
        </p>
      </div>

      <div className="border rounded-md bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Quote No.</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Requested Total</TableHead>
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
            ) : quotes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                  No quotes or RFQs found.
                </TableCell>
              </TableRow>
            ) : (
              quotes.map((quote) => (
                <TableRow key={quote._id}>
                  <TableCell className="font-medium">
                    {quote.quoteNumber}
                    <div className="text-xs text-muted-foreground">
                      {new Date(quote.createdAt).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    {quote.companyName}
                    <div className="text-xs text-muted-foreground">
                      {quote.contactEmail}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {quote.status.replace(/_/g, " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {formatPrice(quote.total || 0)}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    {quote.status === "submitted" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedQuote(quote);
                          setQuotedPrice(quote.items[0]?.targetPrice || 0);
                          setNotesToCustomer(quote.notesToCustomer || "");
                          setIsDialogOpen(true);
                        }}
                      >
                        <Send className="h-4 w-4 mr-1" /> Propose Price
                      </Button>
                    )}
                    {quote.status === "quote_sent" && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-emerald-600 border-emerald-600/30 hover:bg-emerald-50"
                          onClick={() => handleAction(quote._id, "accept")}
                        >
                          <Check className="h-4 w-4 mr-1" /> Accept (Order)
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive border-destructive/30 hover:bg-destructive/10"
                          onClick={() => handleAction(quote._id, "reject")}
                        >
                          <X className="h-4 w-4 mr-1" /> Reject
                        </Button>
                      </>
                    )}
                    {quote.status === "converted_to_order" && (
                      <Button variant="outline" size="sm" disabled>
                        <FileText className="h-4 w-4 mr-1" /> Order Created
                      </Button>
                    )}
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
            <DialogTitle>Propose Quote Price</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Unit Price Offer</Label>
              <Input
                type="number"
                value={quotedPrice}
                onChange={(e) => setQuotedPrice(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label>Notes to Customer</Label>
              <Input
                value={notesToCustomer}
                onChange={(e) => setNotesToCustomer(e.target.value)}
                placeholder="e.g. Volume discount applied"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSendQuote}>Send Proposal to Customer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
