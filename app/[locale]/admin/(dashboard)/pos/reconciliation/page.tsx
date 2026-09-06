"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, AlertTriangle, FileText, ArrowRight } from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

export default function ReconciliationPage() {
  const t = useTranslations("Admin");
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actuals, setActuals] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/pos/reconciliation");
      if (!res.ok) throw new Error("Failed to fetch data");
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load reconciliation report");
    } finally {
      setIsLoading(false);
    }
  };

  const handleActualChange = (method: string, value: string) => {
    setActuals(prev => ({ ...prev, [method]: value }));
  };

  const calculateDiscrepancy = (expected: number, actualStr: string) => {
    const actual = parseFloat(actualStr) || 0;
    return actual - expected;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    // Mocking submission
    setTimeout(() => {
      setIsSubmitting(false);
      toast.success("Reconciliation report approved and closed");
      setData((prev: any) => ({ ...prev, status: "completed" }));
    }, 1500);
  };

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <h2 className="text-3xl font-bold tracking-tight">End of Day Reconciliation</h2>
        <Card className="animate-pulse h-[400px] bg-muted/50" />
      </div>
    );
  }

  const isCompleted = data?.status === "completed";

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">End of Day Reconciliation</h2>
          <p className="text-muted-foreground">
            Compare expected system totals with actual drawer counts.
          </p>
        </div>
        {isCompleted && (
          <div className="flex items-center text-green-600 font-medium">
            <CheckCircle2 className="mr-2 h-5 w-5" />
            Report Closed
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Cash Drawer & Payments</CardTitle>
                <CardDescription>
                  Date: {data?.date ? format(new Date(data.date), 'MMMM d, yyyy') : "Today"}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50 text-left text-sm">
                    <th className="p-4 font-medium">Payment Method</th>
                    <th className="p-4 font-medium">Expected</th>
                    <th className="p-4 font-medium">Actual</th>
                    <th className="p-4 font-medium">Discrepancy</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.methods?.map((m: any) => {
                    const discrepancy = calculateDiscrepancy(m.expected, actuals[m.method] || "0");
                    const hasDiscrepancy = Math.abs(discrepancy) > 0.01 && actuals[m.method];
                    
                    return (
                      <tr key={m.method} className="border-b last:border-0">
                        <td className="p-4 font-medium capitalize">{m.method.replace('_', ' ')}</td>
                        <td className="p-4">${m.expected.toFixed(2)}</td>
                        <td className="p-4">
                          <Input 
                            type="number" 
                            step="0.01"
                            placeholder="0.00"
                            value={actuals[m.method] || ""}
                            onChange={(e) => handleActualChange(m.method, e.target.value)}
                            disabled={isCompleted}
                            className={`w-32 ${hasDiscrepancy ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                          />
                        </td>
                        <td className="p-4">
                          {actuals[m.method] ? (
                            <span className={`flex items-center font-medium ${
                              discrepancy === 0 ? 'text-green-600' : 
                              discrepancy > 0 ? 'text-blue-600' : 'text-red-600'
                            }`}>
                              {discrepancy !== 0 && (
                                <AlertTriangle className="mr-1.5 h-4 w-4" />
                              )}
                              ${Math.abs(discrepancy).toFixed(2)}
                              {discrepancy > 0 ? ' (Over)' : discrepancy < 0 ? ' (Short)' : ' (Match)'}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {(!data?.methods || data.methods.length === 0) && (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-muted-foreground">
                        No transactions recorded today.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end bg-muted/20 border-t p-4">
            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting || isCompleted || !data?.methods?.length}
            >
              {isSubmitting ? "Processing..." : "Approve & Close Drawer"}
              {!isSubmitting && <ArrowRight className="ml-2 h-4 w-4" />}
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Shift Summary</CardTitle>
            <CardDescription>System calculated totals</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center text-muted-foreground">
                <FileText className="mr-2 h-4 w-4" />
                Total Orders
              </div>
              <div className="font-bold">{data?.ordersCount || 0}</div>
            </div>
            <div className="flex items-center justify-between border-b pb-4">
              <div className="text-muted-foreground">
                Expected Revenue
              </div>
              <div className="text-2xl font-bold text-primary">
                ${data?.expectedTotal?.toFixed(2) || "0.00"}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
