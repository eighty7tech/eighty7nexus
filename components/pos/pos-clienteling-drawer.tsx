"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Crown,
  Award,
  Sparkles,
  ShoppingBag,
  Clock,
  Tag,
  DollarSign,
  TrendingUp,
  RotateCcw,
  CheckCircle2,
  Plus,
  X,
  FileText,
  Phone,
  Mail,
  Calendar,
  AlertCircle,
  Save,
  Gift,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/money";
import { useTranslations } from "next-intl";
import { POINTS_REDEMPTION_VALUE } from "@/lib/pos/loyalty-constants";

interface ClientelingData {
  customer: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    image?: string;
    createdAt?: string;
  };
  loyalty: {
    points: number;
    tier: "bronze" | "silver" | "gold" | "platinum" | string;
    lifetimePoints: number;
    redeemableValue: number;
  };
  metrics: {
    totalSpent: number;
    orderCount: number;
    avgOrderValue: number;
    lastOrderDate: string | null;
  };
  clienteling: {
    tags: string[];
    notes: string;
    preferredPaymentMethod?: string;
  };
  recentOrders: Array<{
    _id: string;
    orderNumber: string;
    total: number;
    status: string;
    paymentMethod: string;
    createdAt: string;
    items: Array<{
      productId: string;
      name: string;
      variantId?: string;
      quantity: number;
      price: number;
      image?: string;
    }>;
  }>;
  topItems: Array<{
    productId: string;
    name: string;
    variantId?: string;
    count: number;
    price: number;
    image?: string;
  }>;
}

interface POSClientelingDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string | null;
  currentCartTotal: number;
  currency?: string;
  presetTags?: string[];
  onApplyLoyaltyDiscount: (pointsToRedeem: number, discountAmount: number) => void;
  onQuickAddToCart: (item: {
    productId: string;
    variantId?: string;
    name: string;
    price: number;
    image?: string;
  }) => void;
}

const PRESET_TAGS = [
  "VIP",
  "Regular",
  "Wholesale",
  "Tax-Exempt",
  "Prefers Paper Bag",
  "Special Fragrance",
  "Gift Packaging",
  "Staff Friend",
];

const TIER_COLORS = {
  bronze: "bg-amber-700/15 text-amber-800 dark:text-amber-300 border-amber-700/30",
  silver: "bg-slate-400/20 text-slate-700 dark:text-slate-300 border-slate-400/40",
  gold: "bg-amber-400/25 text-amber-700 dark:text-amber-300 border-amber-400/50 shadow-xs",
  platinum: "bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/40 shadow-xs",
};

export function POSClientelingDrawer({
  open,
  onOpenChange,
  customerId,
  currentCartTotal,
  currency = "USD",
  presetTags = PRESET_TAGS,
  onApplyLoyaltyDiscount,
  onQuickAddToCart,
}: POSClientelingDrawerProps) {
  const t = useTranslations("clienteling");
  const [data, setData] = useState<ClientelingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Fetch clienteling profile
  const fetchClienteling = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/pos/customers/${id}/clienteling`);
      if (!res.ok) return;
      const json = await res.json();
      if (json?.data) {
        setData(json.data);
        setNotes(json.data.clienteling?.notes || "");
        setTags(json.data.clienteling?.tags || []);
      }
    } catch (err) {
      console.error("Failed to load customer clienteling:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open && customerId) {
      fetchClienteling(customerId);
    } else {
      setData(null);
    }
  }, [open, customerId, fetchClienteling]);

  // Save notes & tags
  const handleSaveClienteling = async () => {
    if (!customerId) return;
    setSavingNotes(true);
    try {
      const res = await fetch(`/api/pos/customers/${customerId}/clienteling`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes, tags }),
      });
      if (res.ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 2000);
      }
    } catch (err) {
      console.error("Failed to save notes:", err);
    } finally {
      setSavingNotes(false);
    }
  };

  const toggleTag = (tag: string) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const handleAddCustomTag = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && newTagInput.trim()) {
      e.preventDefault();
      const val = newTagInput.trim();
      if (!tags.includes(val)) {
        setTags((prev) => [...prev, val]);
      }
      setNewTagInput("");
    }
  };

  if (!open) return null;

  const tier = (data?.loyalty?.tier?.toLowerCase() || "bronze") as keyof typeof TIER_COLORS;
  const tierColor = TIER_COLORS[tier] || TIER_COLORS.bronze;
  const availablePoints = data?.loyalty?.points || 0;
  const redeemableValue = data?.loyalty?.redeemableValue || 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl p-0 flex flex-col h-full bg-card overflow-hidden"
      >
        {/* Header with VIP styling */}
        <SheetHeader className="border-b px-5 py-4 bg-muted/30 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-base shadow-xs shrink-0">
                {data?.customer?.name
                  ? data.customer.name.slice(0, 2).toUpperCase()
                  : "VIP"}
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <SheetTitle className="text-base font-bold tracking-tight">
                    {data?.customer?.name || t("title")}
                  </SheetTitle>
                  <Badge
                    variant="outline"
                    className={cn(
                      "capitalize font-bold text-[10px] px-2 py-0.5 border flex items-center gap-1",
                      tierColor,
                    )}
                  >
                    <Crown className="h-3 w-3" />
                    {tier} {t("member")}
                  </Badge>
                </div>
                <SheetDescription className="text-xs text-muted-foreground flex items-center gap-3 mt-0.5">
                  {data?.customer?.email && (
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {data.customer.email}
                    </span>
                  )}
                  {data?.customer?.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {data.customer.phone}
                    </span>
                  )}
                </SheetDescription>
              </div>
            </div>
          </div>
        </SheetHeader>

        {loading ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Sparkles className="h-6 w-6 animate-spin text-primary" />
              <p className="text-xs font-semibold">{t("title")}…</p>
            </div>
          </div>
        ) : !data ? (
          <div className="flex-1 flex items-center justify-center p-8 text-center text-muted-foreground">
            <AlertCircle className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">{t("noHistory")}</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto flex flex-col">
            {/* Quick Metrics KPI Bar */}
            <div className="grid grid-cols-3 gap-2.5 p-4 border-b bg-muted/15 shrink-0">
              <div className="rounded-xl border bg-card p-3 shadow-xs">
                <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                  <DollarSign className="h-3 w-3 text-emerald-500" />
                  {t("lifetimeSpend")}
                </span>
                <p className="text-base font-bold tracking-tight mt-1 text-foreground">
                  {formatCurrency(data.metrics.totalSpent, currency)}
                </p>
              </div>
              <div className="rounded-xl border bg-card p-3 shadow-xs">
                <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                  <ShoppingBag className="h-3 w-3 text-blue-500" />
                  {t("ordersPlaced")}
                </span>
                <p className="text-base font-bold tracking-tight mt-1 text-foreground">
                  {data.metrics.orderCount}
                </p>
              </div>
              <div className="rounded-xl border bg-card p-3 shadow-xs">
                <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-amber-500" />
                  {t("avgOrder")}
                </span>
                <p className="text-base font-bold tracking-tight mt-1 text-foreground">
                  {formatCurrency(data.metrics.avgOrderValue, currency)}
                </p>
              </div>
            </div>

            {/* 1-Tap Loyalty Points Redemption Banner */}
            <div className="m-4 rounded-xl border border-primary/30 bg-primary/5 p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
                    <Gift className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-foreground">
                      {t("loyaltyPoints")}
                    </h4>
                    <p className="text-sm font-black text-primary font-mono">
                      {availablePoints} pts{" "}
                      <span className="text-xs font-normal text-muted-foreground">
                        ({formatCurrency(redeemableValue, currency)} {t("discountValue")})
                      </span>
                    </p>
                  </div>
                </div>

                {availablePoints > 0 && currentCartTotal > 0 && (
                  <Button
                    size="sm"
                    className="font-bold text-xs gap-1.5 shadow-xs bg-primary hover:bg-primary/90 text-primary-foreground"
                    onClick={() => {
                      const maxRedeemablePoints = Math.min(
                        availablePoints,
                        POINTS_REDEMPTION_VALUE > 0
                          ? Math.floor(currentCartTotal / POINTS_REDEMPTION_VALUE)
                          : availablePoints,
                      );
                      const maxDiscount =
                        Math.round(
                          maxRedeemablePoints * POINTS_REDEMPTION_VALUE * 100,
                        ) / 100;
                      onApplyLoyaltyDiscount(maxRedeemablePoints, maxDiscount);
                      onOpenChange(false);
                    }}
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    {t("applyMaxPoints")}
                  </Button>
                )}
              </div>
            </div>

            {/* Clienteling Tabs */}
            <Tabs defaultValue="history" className="flex-1 flex flex-col px-4 pb-4">
              <TabsList className="grid grid-cols-3 h-9 bg-muted/60 p-1 mb-3">
                <TabsTrigger value="history" className="text-xs font-bold">
                  {t("pastOrders")}
                </TabsTrigger>
                <TabsTrigger value="frequent" className="text-xs font-bold">
                  {t("topItems")}
                </TabsTrigger>
                <TabsTrigger value="notes" className="text-xs font-bold">
                  {t("vipNotesAndTags")}
                </TabsTrigger>
              </TabsList>

              {/* Tab 1: Past Orders with 1-Tap Re-Order */}
              <TabsContent value="history" className="flex-1 space-y-3 m-0">
                {data.recentOrders.length === 0 ? (
                  <div className="text-center py-8 text-xs text-muted-foreground">
                    {t("noHistory")}
                  </div>
                ) : (
                  data.recentOrders.map((order) => (
                    <div
                      key={order._id}
                      className="rounded-xl border bg-card p-3 shadow-xs space-y-2"
                    >
                      <div className="flex items-center justify-between border-b pb-2 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{order.orderNumber}</span>
                          <Badge variant="outline" className="text-[10px] uppercase">
                            {order.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <span className="font-mono text-[11px]">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </span>
                          <span className="font-bold text-foreground">
                            {formatCurrency(order.total, currency)}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1.5 pt-1">
                        {order.items.map((it, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between text-xs py-1"
                          >
                            <span className="truncate max-w-[280px]">
                              <strong>{it.quantity}×</strong> {it.name}
                            </span>
                            <Button
                              variant="secondary"
                              size="sm"
                              className="h-6 text-[10px] font-bold gap-1 px-2 hover:bg-primary/20 hover:text-primary"
                              onClick={() => {
                                onQuickAddToCart({
                                  productId: it.productId,
                                  variantId: it.variantId,
                                  name: it.name,
                                  price: it.price,
                                  image: it.image,
                                });
                              }}
                            >
                              <Plus className="h-3 w-3" />
                              {t("reorder")}
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </TabsContent>

              {/* Tab 2: Top / Frequently Purchased Items */}
              <TabsContent value="frequent" className="flex-1 space-y-2.5 m-0">
                {data.topItems.length === 0 ? (
                  <div className="text-center py-8 text-xs text-muted-foreground">
                    {t("noTopItems")}
                  </div>
                ) : (
                  data.topItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-xl border bg-card p-3 shadow-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 font-bold text-xs text-primary font-mono">
                          #{idx + 1}
                        </div>
                        <div>
                          <p className="text-xs font-semibold leading-tight">
                            {item.name}
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            Purchased <strong>{item.count}×</strong> times ·{" "}
                            {formatCurrency(item.price, currency)}
                          </p>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        className="h-7 text-xs font-bold gap-1 px-3 shadow-xs"
                        onClick={() => {
                          onQuickAddToCart({
                            productId: item.productId,
                            variantId: item.variantId,
                            name: item.name,
                            price: item.price,
                            image: item.image,
                          });
                        }}
                      >
                        <Plus className="h-3 w-3" />
                        {t("addToCart")}
                      </Button>
                    </div>
                  ))
                )}
              </TabsContent>

              {/* Tab 3: VIP Notes & Tags */}
              <TabsContent value="notes" className="flex-1 space-y-4 m-0">
                {/* Preset Tag Chips */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-foreground">
                    {t("vipTags")}
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {presetTags.map((tag) => {
                      const isSelected = tags.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleTag(tag)}
                          className={cn(
                            "rounded-lg px-2.5 py-1 text-xs font-semibold border transition-all cursor-pointer",
                            isSelected
                              ? "bg-primary text-primary-foreground border-primary shadow-xs"
                              : "bg-card text-muted-foreground border-border hover:border-primary/50",
                          )}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>

                  {/* Add Custom Tag Input */}
                  <div className="flex gap-2 pt-1">
                    <Input
                      placeholder={t("addCustomTag")}
                      value={newTagInput}
                      onChange={(e) => setNewTagInput(e.target.value)}
                      onKeyDown={handleAddCustomTag}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>

                {/* Cashier Notes Textarea */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-foreground flex items-center justify-between">
                    <span>{t("cashierNotes")}</span>
                    {savedSuccess && (
                      <span className="text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> {t("saved")}
                      </span>
                    )}
                  </label>
                  <Textarea
                    placeholder={t("notesPlaceholder")}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                    className="text-xs resize-none"
                  />
                  <Button
                    size="sm"
                    className="w-full font-bold text-xs gap-1.5"
                    onClick={handleSaveClienteling}
                    disabled={savingNotes}
                  >
                    <Save className="h-3.5 w-3.5" />
                    {savingNotes ? "Saving…" : t("saveNotes")}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
