"use client";

import { useEffect, useState } from "react";
import { Plus, Tag, Trash2, Power, Percent, DollarSign, Clock, Package } from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface Rule {
  _id: string;
  name: string;
  description: string;
  isActive: boolean;
  priority: number;
  discountType: "percentage" | "fixed_amount";
  discountValue: number;
  conditions: any[];
  startDate?: string;
  endDate?: string;
}

export default function PricingRulesPage() {
  const t = useTranslations("Admin");
  const [rules, setRules] = useState<Rule[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/pos/pricing-rules");
      if (!res.ok) throw new Error("Failed to fetch rules");
      const data = await res.json();
      setRules(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load pricing rules");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleRule = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/admin/pos/pricing-rules/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      if (!res.ok) throw new Error("Failed to update");
      toast.success("Rule status updated");
      fetchRules();
    } catch (err) {
      toast.error("Failed to update rule status");
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dynamic Pricing Rules</h2>
          <p className="text-muted-foreground">
            Manage POS automated discounts, time-based sales, and bulk pricing.
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Rule
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="h-[100px] bg-muted/50 rounded-t-xl" />
              <CardContent className="h-[150px]" />
            </Card>
          ))}
        </div>
      ) : rules.length === 0 ? (
        <Card className="flex flex-col items-center justify-center h-[400px] text-center border-dashed">
          <div className="rounded-full bg-primary/10 p-4 mb-4">
            <Tag className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-medium">No Pricing Rules</h3>
          <p className="text-sm text-muted-foreground max-w-sm mt-1 mb-4">
            Create automated rules to apply discounts based on time of day, inventory levels, or customer segments.
          </p>
          <Button variant="outline">Create Your First Rule</Button>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {rules.map((rule) => (
            <Card key={rule._id} className={`transition-all ${!rule.isActive ? 'opacity-60' : ''}`}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="text-xl flex items-center gap-2">
                      {rule.name}
                      {!rule.isActive && (
                        <Badge variant="secondary" className="text-xs">Disabled</Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="line-clamp-2 min-h-[40px]">
                      {rule.description || "No description provided."}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className={rule.isActive ? "text-green-600" : "text-muted-foreground"}
                      onClick={() => toggleRule(rule._id, rule.isActive)}
                    >
                      <Power className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b pb-4 mt-2">
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Discount</span>
                      <span className="text-2xl font-bold flex items-center text-primary mt-1">
                        {rule.discountType === "percentage" ? (
                          <><Percent className="h-5 w-5 mr-1 opacity-70" /> {rule.discountValue}%</>
                        ) : (
                          <><DollarSign className="h-5 w-5 mr-1 opacity-70" /> {rule.discountValue}</>
                        )}
                      </span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Priority</span>
                      <span className="text-xl font-semibold mt-1">#{rule.priority}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Conditions ({rule.conditions?.length || 0})</h4>
                    <div className="flex flex-wrap gap-2">
                      {rule.conditions?.map((c, i) => (
                        <Badge key={i} variant="outline" className="bg-muted/50 flex items-center gap-1 text-xs py-1">
                          {c.type === "time_range" && <Clock className="h-3 w-3" />}
                          {c.type === "inventory_level" && <Package className="h-3 w-3" />}
                          {c.type.replace('_', ' ')}
                        </Badge>
                      ))}
                      {(!rule.conditions || rule.conditions.length === 0) && (
                        <span className="text-xs text-muted-foreground italic">Always applies</span>
                      )}
                    </div>
                  </div>

                  {(rule.startDate || rule.endDate) && (
                    <div className="pt-2 text-xs text-muted-foreground flex justify-between">
                      {rule.startDate && <span>Starts: {format(new Date(rule.startDate), 'MMM d, yyyy')}</span>}
                      {rule.endDate && <span>Ends: {format(new Date(rule.endDate), 'MMM d, yyyy')}</span>}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
