"use client";

import { type CSSProperties, FormEvent, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { format } from "date-fns";
import {
  AlertCircle,
  Check,
  Download,
  ExternalLink,
  Loader2,
  MapPin,
  Package,
  Search,
  Sparkles,
  MessageSquare,
  Zap,
  Truck,
  ShieldCheck,
  Clock,
  ChevronUp,
  ChevronDown,
  PhoneCall,
} from "lucide-react";
import { AppImage } from "@/components/ui/app-image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/components/ui/toast-notification";
import { StoreBreadcrumb } from "@/components/store/store-breadcrumb";
import { TrackOrderTimeline } from "./track-order-timeline";
import { type ScanEvent } from "@/components/shipping/scan-history";
import {
  DeliveryException,
  type DeliveryException as DeliveryExceptionData,
} from "@/components/shipping/delivery-exception";
import { useCurrency } from "@/providers/currency-provider";
import { cn } from "@/lib/utils";
import { formatPickupWindow } from "@/lib/pickup-fulfillment-shared";
import { DEFAULT_ACCENT_COLOR } from "@/config/branding.config";

type TrackingEvent = {
  key: string;
  title: string;
  description: string;
  timestamp?: string;
  completed: boolean;
};

/** One seller's parcel on a split order. */
type TrackedShipment = {
  vendorName?: string;
  status: string;
  carrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  shippedAt?: string;
  deliveredAt?: string;
  itemIndexes: number[];
  events: ScanEvent[];
  exception?: DeliveryExceptionData;
};

type TrackedOrder = {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  carrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  trackingEvents?: ScanEvent[];
  /** A failed attempt or a return, which the order status never reflects. */
  trackingException?: DeliveryExceptionData;
  /** Empty on a single-seller order, where the fields above say it all. */
  shipments?: TrackedShipment[];
  placedAt: string;
  updatedAt: string;
  subtotal: number;
  shippingCost: number;
  tax: number;
  discount: number;
  total: number;
  itemCount: number;
  items: Array<{
    name: string;
    sku?: string;
    price: number;
    quantity: number;
    image?: string;
  }>;
  pickup?: {
    pickupAddress?: string;
    instructions?: string;
    timeZone?: string;
    startAt?: string;
    endAt?: string;
    status?: "scheduled" | "ready" | "collected";
  };
  timeline: TrackingEvent[];
};

type TrackOrderTheme =
  | "nexus-theme"
  | "modern-glass"
  | "classic-minimal"
  | "vibrant-gradient"
  | "dark-luxury"
  | "corporate-pro";

interface TrackOrderSettings {
  theme?: TrackOrderTheme;
  showMapIllustration?: boolean;
  showItemList?: boolean;
  accentColor?: string;
  enableGlassmorphism?: boolean;
  ghanaPostGps?: boolean;
  dispatchRiderInfo?: boolean;
  momoCodTracking?: boolean;
}

interface TrackOrderContentProps {
  initialOrderNumber?: string;
  settings?: TrackOrderSettings;
}

// ── Per-theme class maps ────────────────────────────────────────────────────
const THEME_CLASSES: Record<
  TrackOrderTheme,
  {
    page: string;
    header: string;
    form: string;
    formInput: string;
    sectionCard: string;
    timelineComplete: string;
    timelineActive: string;
    timelineConnector: string;
    badge: string;
  }
> = {
  "nexus-theme": {
    page: "bg-background min-h-screen text-foreground selection:bg-[#77CDCC]/30",
    header:
      "bg-card/90 border border-border/80 shadow-md rounded-2xl p-8 backdrop-blur-md relative overflow-hidden",
    form: "bg-card/90 border border-border/80 shadow-md rounded-2xl backdrop-blur-md",
    formInput:
      "bg-background/90 border-input focus-visible:ring-[#77CDCC]/40 focus-visible:border-[#77CDCC]",
    sectionCard:
      "bg-card/95 border border-border/80 shadow-sm rounded-2xl backdrop-blur-md",
    timelineComplete:
      "border-[#77CDCC] bg-[#77CDCC] text-[#001a45] shadow-[0_0_14px_0_rgba(119,205,204,0.5)]",
    timelineActive:
      "ring-4 ring-[#77CDCC]/30 border-[#77CDCC] bg-card text-[#77CDCC] shadow-[0_0_18px_0_rgba(119,205,204,0.4)]",
    timelineConnector: "bg-[#77CDCC]",
    badge: "bg-[#77CDCC]/15 text-[#77CDCC] border border-[#77CDCC]/30",
  },
  "modern-glass": {
    page: "bg-gradient-to-br from-slate-100 via-blue-50 to-slate-200 dark:from-slate-900 dark:via-blue-950 dark:to-slate-900 min-h-screen",
    header:
      "bg-white/70 dark:bg-white/5 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-xl rounded-2xl p-8",
    form: "bg-white/60 dark:bg-white/8 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-lg rounded-2xl",
    formInput: "bg-white/80 dark:bg-white/10 border-white/50",
    sectionCard:
      "bg-white/60 dark:bg-white/8 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-lg rounded-2xl",
    timelineComplete:
      "border-primary bg-primary text-primary-foreground shadow-[0_0_12px_0_rgba(var(--primary)/0.5)]",
    timelineActive:
      "ring-4 ring-primary/25 shadow-[0_0_16px_0_rgba(var(--primary)/0.4)]",
    timelineConnector: "bg-primary",
    badge: "bg-primary/10 text-primary border border-primary/20",
  },
  "classic-minimal": {
    page: "bg-neutral-50 dark:bg-neutral-950 min-h-screen",
    header:
      "bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-8",
    form: "bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg",
    formInput: "",
    sectionCard:
      "bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg",
    timelineComplete:
      "border-neutral-900 dark:border-neutral-100 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900",
    timelineActive: "ring-2 ring-neutral-400",
    timelineConnector: "bg-neutral-900 dark:bg-neutral-100",
    badge:
      "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700",
  },
  "vibrant-gradient": {
    page: "bg-gradient-to-br from-violet-600 via-purple-600 to-pink-600 min-h-screen",
    header:
      "bg-white/15 backdrop-blur-2xl border border-white/30 shadow-2xl rounded-2xl p-8 text-white",
    form: "bg-white/15 backdrop-blur-2xl border border-white/30 shadow-xl rounded-2xl",
    formInput:
      "bg-white/20 border-white/30 placeholder:text-white/50 text-white",
    sectionCard:
      "bg-white/15 backdrop-blur-2xl border border-white/25 shadow-xl rounded-2xl text-white",
    timelineComplete:
      "border-white bg-white text-purple-700 shadow-[0_0_20px_0_rgba(255,255,255,0.5)]",
    timelineActive: "ring-4 ring-white/40",
    timelineConnector: "bg-white",
    badge: "bg-white/20 text-white border border-white/30",
  },
  "dark-luxury": {
    page: "bg-gradient-to-br from-zinc-950 via-neutral-900 to-zinc-900 min-h-screen",
    header:
      "bg-zinc-900/80 border border-yellow-500/20 shadow-[0_8px_40px_0_rgba(234,179,8,0.08)] rounded-xl p-8 text-zinc-100",
    form: "bg-zinc-900/80 border border-yellow-500/20 rounded-xl",
    formInput:
      "bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500",
    sectionCard:
      "bg-zinc-900/80 border border-yellow-500/20 shadow-[0_4px_24px_0_rgba(234,179,8,0.06)] rounded-xl text-zinc-100",
    timelineComplete:
      "border-yellow-500 bg-yellow-500 text-zinc-900 shadow-[0_0_16px_0_rgba(234,179,8,0.6)]",
    timelineActive: "ring-4 ring-yellow-500/30",
    timelineConnector: "bg-yellow-500",
    badge: "bg-yellow-500/10 text-yellow-400 border border-yellow-500/30",
  },
  "corporate-pro": {
    page: "bg-slate-100 dark:bg-slate-900 min-h-screen",
    header:
      "bg-white dark:bg-slate-800 border-l-4 border-l-blue-700 shadow-sm rounded-md p-6",
    form: "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md shadow-sm",
    formInput: "",
    sectionCard:
      "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md shadow-sm",
    timelineComplete: "border-blue-700 bg-blue-700 text-white",
    timelineActive: "ring-4 ring-blue-700/20",
    timelineConnector: "bg-blue-700",
    badge:
      "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700",
  },
};

const statusLabels: Record<string, string> = {
  pending: "Order Placed",
  processing: "Processing & Packaging",
  shipped: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

function formatDate(value?: string) {
  if (!value) return "Pending";
  try {
    return format(new Date(value), "MMM d, yyyy");
  } catch {
    return value;
  }
}

function formatEventDate(event: TrackingEvent) {
  if (event.timestamp) return formatDate(event.timestamp);
  return event.completed ? "Completed" : "Pending";
}

function getActiveStepIndex(timeline: TrackingEvent[]) {
  const lastCompleted = timeline.reduce(
    (last, event, index) => (event.completed ? index : last),
    -1,
  );
  return Math.max(lastCompleted, 0);
}

function getDeliveredDate(order: TrackedOrder) {
  const delivered = order.timeline.find((event) => event.key === "delivered");
  return delivered ? formatEventDate(delivered) : "Pending";
}

function getCurrentTrackingStatus(order: TrackedOrder, activeIndex: number) {
  const activeEvent = order.timeline[activeIndex];
  if (activeEvent && activeEvent.key !== "placed") return activeEvent.title;
  return statusLabels[order.status] || order.status;
}

export function TrackOrderContent({
  initialOrderNumber = "",
  settings,
}: TrackOrderContentProps) {
  const t = useTranslations();
  const locale = useParams().locale as string;
  const { formatPrice } = useCurrency();
  const [orderNumber, setOrderNumber] = useState(initialOrderNumber);
  const [identifier, setIdentifier] = useState("");
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloadingInvoice, setIsDownloadingInvoice] = useState(false);
  const [whatsappOpted, setWhatsappOpted] = useState(false);
  const [isItemsExpanded, setIsItemsExpanded] = useState(true);

  const theme: TrackOrderTheme = settings?.theme ?? "nexus-theme";
  const tc = THEME_CLASSES[theme] || THEME_CLASSES["nexus-theme"];
  const accent = settings?.accentColor || DEFAULT_ACCENT_COLOR;

  const activeIndex = useMemo(
    () => (order ? getActiveStepIndex(order.timeline) : 0),
    [order],
  );
  const currentTrackingStatus = useMemo(
    () => (order ? getCurrentTrackingStatus(order, activeIndex) : ""),
    [activeIndex, order],
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setOrder(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/orders/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber, identifier }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(
          data.message ||
          data.error ||
          "We could not find an order with those details.",
        );
        return;
      }

      setOrder(data.data);
    } catch {
      setError("Tracking is temporarily unavailable. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadInvoice = async () => {
    if (!order) return;

    setIsDownloadingInvoice(true);
    try {
      const response = await fetch("/api/orders/track/invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber: order.orderNumber, identifier }),
      });

      if (!response.ok) {
        throw new Error("Unable to download invoice");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `invoice-${order.orderNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Invoice downloaded successfully");
    } catch {
      toast.error("Invoice download failed");
    } finally {
      setIsDownloadingInvoice(false);
    }
  };

  return (
    <div
      className={tc.page}
      style={
        accent
          ? ({ "--accent-override": accent } as CSSProperties)
          : undefined
      }
    >
      <div className="container mx-auto max-w-5xl px-4 pb-16 pt-8 lg:pb-20 lg:pt-12">
        <StoreBreadcrumb
          className="mb-8 opacity-80"
          locale={locale}
          items={[{ label: t("orders.trackOrder") }]}
        />

        {/* Hero Section */}
        <header
          className={cn(
            "mx-auto max-w-3xl text-center transition-all duration-500",
            tc.header,
          )}
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-[#77CDCC]/30 bg-[#77CDCC]/10 px-3 py-1 text-xs font-semibold text-[#77CDCC] mb-4">
            <Sparkles className="h-3.5 w-3.5" />
            <span>{t("orders.tracking.livePackageTracker")}</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl text-foreground">
            {t("orders.tracking.heroTitle")}
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {t("orders.tracking.heroDescription")}
          </p>
        </header>

        {/* Search Lookup Form */}
        <form
          onSubmit={handleSubmit}
          className={cn("mt-8 p-5 md:p-6 transition-all duration-300", tc.form)}
        >
          <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
            <div className="space-y-2">
              <Label htmlFor="order-number" className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                {t("orders.tracking.orderNumberLabel")}
              </Label>
              <Input
                id="order-number"
                value={orderNumber}
                onChange={(event) => setOrderNumber(event.target.value)}
                placeholder={t("orders.tracking.orderNumberPlaceholder")}
                required
                className={cn(
                  "h-12 rounded-xl transition-all duration-200 focus:scale-[1.005]",
                  tc.formInput,
                )}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="identifier" className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                {t("orders.tracking.identifierLabel")}
              </Label>
              <Input
                id="identifier"
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                placeholder={t("orders.tracking.identifierPlaceholder")}
                required
                className={cn(
                  "h-12 rounded-xl transition-all duration-200 focus:scale-[1.005]",
                  tc.formInput,
                )}
              />
            </div>
            <Button
              type="submit"
              size="lg"
              disabled={isLoading}
              className="h-12 rounded-xl px-6 font-semibold transition-all duration-200 hover:opacity-95 active:scale-95 shadow-md"
              style={{
                backgroundColor: accent,
                color: "#001a45",
                borderColor: accent,
              }}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Search className="mr-2 h-4 w-4" />
              )}
              {t("orders.tracking.trackButton")}
            </Button>
          </div>
          {error ? (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive animate-in fade-in slide-in-from-top-2 duration-300">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{error}</p>
            </div>
          ) : null}
        </form>

        {order ? (
          <main className="mt-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Top Order Overview Banner */}
            <section className={cn("p-6", tc.sectionCard)}>
              <div className="flex flex-col gap-4 border-b border-border/60 pb-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-xl font-bold tracking-tight text-foreground">
                      Order {order.orderNumber}
                    </h2>
                    <Badge
                      variant="outline"
                      className="border-[#77CDCC]/40 bg-[#77CDCC]/10 text-[#77CDCC] font-semibold text-xs px-2.5 py-0.5"
                    >
                      {currentTrackingStatus}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Placed on {formatDate(order.placedAt)} • {order.itemCount} {order.itemCount === 1 ? "item" : "items"}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 gap-1.5 rounded-xl border-border/80 text-xs font-semibold hover:bg-muted"
                    onClick={handleDownloadInvoice}
                    disabled={isDownloadingInvoice}
                  >
                    {isDownloadingInvoice ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Download className="h-3.5 w-3.5" />
                    )}
                    Download Invoice
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "h-9 gap-1.5 rounded-xl text-xs font-semibold transition-colors",
                      whatsappOpted
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "border-border/80 hover:bg-muted",
                    )}
                    onClick={() => {
                      setWhatsappOpted(!whatsappOpted);
                      toast.success(
                        !whatsappOpted
                          ? "WhatsApp delivery updates enabled!"
                          : "WhatsApp updates unsubscribed.",
                      );
                    }}
                  >
                    <MessageSquare className="h-3.5 w-3.5 text-emerald-500" />
                    {whatsappOpted ? "WhatsApp Updates: ON" : "Get WhatsApp Updates"}
                  </Button>
                </div>
              </div>

              {/* Order Key Meta Grid */}
              <div className="grid gap-4 py-5 grid-cols-2 sm:grid-cols-4">
                <Detail label="Order Placed" value={formatDate(order.placedAt)} />
                <Detail label="Payment Status" value={order.paymentStatus.toUpperCase()} />
                <Detail label="Est. Delivery" value={getDeliveredDate(order)} />
                <Detail label="Order Total" value={formatPrice(order.total)} className="text-base font-bold text-foreground" />
              </div>
            </section>

            {/* Courier & Driver Telemetry Card */}
            <section className={cn("p-6", tc.sectionCard)}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#77CDCC]/30 bg-[#77CDCC]/10 text-[#77CDCC] shadow-xs">
                    {order.carrier?.toLowerCase().includes("courier") || order.carrier?.toLowerCase().includes("motor") ? (
                      <Zap className="h-6 w-6" />
                    ) : (
                      <Truck className="h-6 w-6" />
                    )}
                  </div>
                  <div>
                    <span className="text-xs font-medium text-muted-foreground">{t("orders.tracking.carrierPartner")}</span>
                    <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                      {order.carrier || "Ghana Express Dispatch Network"}
                      <ShieldCheck className="h-4 w-4 text-[#77CDCC]" />
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {t("orders.tracking.trackingId")}: <span className="font-mono font-semibold text-foreground">{order.trackingNumber || order.orderNumber}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <Badge variant="outline" className="gap-1 px-3 py-1 text-xs border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    {t("orders.tracking.liveRouteActive")}
                  </Badge>
                  {order.trackingUrl ? (
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1 rounded-lg text-xs"
                    >
                      <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer">
                        {t("orders.tracking.carrierTracking")} <ExternalLink className="h-3 w-3" />
                      </a>
                    </Button>
                  ) : null}
                </div>
              </div>

              {/* Conditionally Rendered Ghana Deliveries features */}
              {settings?.ghanaPostGps && currentTrackingStatus === statusLabels["processing"] && (
                <div className="mt-5 border-t pt-5 animate-in fade-in slide-in-from-top-4 duration-300">
                  <div className="flex items-start gap-4">
                    <div className="bg-primary/10 p-2 rounded-xl text-primary"><MapPin className="h-5 w-5" /></div>
                    <div className="flex-1">
                      <h4 className="font-bold text-sm text-foreground">{t("orders.tracking.ghanaPostGpsTitle", { defaultMessage: "Digital Address Required" })}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{t("orders.tracking.ghanaPostGpsDesc", { defaultMessage: "Please verify your GhanaPostGPS address or drop a precise map pin for accurate last-mile delivery." })}</p>
                    </div>
                    <Button size="sm" variant="outline" className="rounded-xl border-primary text-primary hover:bg-primary/5">
                      {t("orders.tracking.ghanaPostGpsAction", { defaultMessage: "Update Address" })}
                    </Button>
                  </div>
                </div>
              )}

              {settings?.dispatchRiderInfo && currentTrackingStatus === statusLabels["shipped"] && (
                <div className="mt-5 border-t pt-5 animate-in fade-in slide-in-from-top-4 duration-300">
                  <div className="flex items-start gap-4">
                    <div className="relative h-10 w-10 overflow-hidden rounded-full border bg-muted">
                      <AppImage src="/placeholder-driver.png" alt="Driver" fill className="object-cover" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-sm text-foreground">{t("orders.tracking.riderName", { defaultMessage: "Your Dispatch Rider: Kwame" })}</h4>
                      <p className="text-xs text-muted-foreground font-mono">Honda Motorbike • GW-1234-23</p>
                    </div>
                    <Button size="sm" variant="outline" className="rounded-xl border-emerald-500/50 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 gap-1.5 dark:bg-emerald-950 dark:text-emerald-400">
                      <MessageSquare className="h-3.5 w-3.5" />
                      {t("orders.tracking.riderContact", { defaultMessage: "WhatsApp Rider" })}
                    </Button>
                  </div>
                </div>
              )}
              
              {settings?.momoCodTracking && order.paymentStatus !== "paid" && (
                <div className="mt-5 border-t pt-5 animate-in fade-in slide-in-from-top-4 duration-300">
                   <div className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-4 flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />
                    <div className="flex-1">
                      <h4 className="font-bold text-sm text-amber-700 dark:text-amber-400">{t("orders.tracking.momoCodTitle", { defaultMessage: "Payment Pending Upon Delivery" })}</h4>
                      <p className="text-xs text-amber-700/80 dark:text-amber-400/80 mt-1">{t("orders.tracking.momoCodDesc", { defaultMessage: "Please have exact cash or Mobile Money (MoMo) ready." })} Total: {formatPrice(order.total)}</p>
                    </div>
                    <Button size="sm" className="rounded-xl bg-amber-500 text-amber-950 hover:bg-amber-600">
                      {t("orders.tracking.momoCodAction", { defaultMessage: "Pay via MoMo Now" })}
                    </Button>
                  </div>
                </div>
              )}
            </section>

            {/* Interactive Timeline Stepper */}
            <section className={cn("p-6 sm:p-8", tc.sectionCard)}>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-lg font-bold text-foreground">{t("orders.tracking.deliveryMilestones")}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{t("orders.tracking.milestonesDescription")}</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                  <Clock className="h-3.5 w-3.5 text-[#77CDCC]" />
                  <span>{t("orders.tracking.realTimeStatus")}</span>
                </div>
              </div>

              {/* Replaced with Custom Animated Timeline */}
              <TrackOrderTimeline 
                timeline={order.timeline} 
                activeIndex={activeIndex} 
                scanEvents={order.trackingEvents}
                themeClasses={tc} 
              />

              {/* Exception alert if present */}
              {order.trackingException ? (
                <div className="mt-6">
                  <DeliveryException exception={order.trackingException} />
                </div>
              ) : null}
            </section>

            {/* Expandable Order Items Section */}
            {settings?.showItemList !== false ? (
              <section className={cn("overflow-hidden", tc.sectionCard)}>
                <button
                  type="button"
                  onClick={() => setIsItemsExpanded(!isItemsExpanded)}
                  className="flex w-full items-center justify-between p-6 text-left hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Package className="h-5 w-5 text-primary" />
                    <div>
                      <h3 className="text-base font-bold text-foreground">Items in this Parcel</h3>
                      <p className="text-xs text-muted-foreground">
                        {order.itemCount} item{order.itemCount === 1 ? "" : "s"} • {formatPrice(order.total)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-muted-foreground">
                      {isItemsExpanded ? "Collapse" : "Expand"}
                    </span>
                    {isItemsExpanded ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </button>

                {isItemsExpanded ? (
                  <div className="border-t border-border/60 p-6 pt-0">
                    <Table className="table-fixed">
                      <TableHeader className="bg-muted/30">
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead className="w-20 text-center">Qty</TableHead>
                          <TableHead className="w-28 text-right">Price</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {order.items.map((item, index) => (
                          <TableRow key={`${item.name}-${index}`}>
                            <TableCell>
                              <div className="flex min-w-0 items-center gap-3">
                                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border bg-muted">
                                  {item.image ? (
                                    <AppImage
                                      src={item.image}
                                      alt={item.name}
                                      fill
                                      className="object-cover"
                                    />
                                  ) : (
                                    <div className="flex h-full items-center justify-center">
                                      <Package className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <p className="truncate font-semibold text-sm text-foreground" title={item.name}>
                                    {item.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    SKU: {item.sku || "N/A"}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-center font-medium text-sm">
                              {item.quantity}
                            </TableCell>
                            <TableCell className="text-right font-bold text-sm text-foreground">
                              {formatPrice(item.price * item.quantity)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    {/* Financial Breakdown */}
                    <div className="mt-4 grid gap-2 border-t border-border/50 pt-4 text-xs">
                      <div className="flex justify-between text-muted-foreground">
                        <span>Subtotal</span>
                        <span>{formatPrice(order.subtotal)}</span>
                      </div>
                      {order.discount > 0 && (
                        <div className="flex justify-between text-emerald-600 font-medium">
                          <span>Discount Applied</span>
                          <span>-{formatPrice(order.discount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-muted-foreground">
                        <span>Delivery Fee</span>
                        <span>{order.shippingCost === 0 ? "Free" : formatPrice(order.shippingCost)}</span>
                      </div>
                      {order.tax > 0 && (
                        <div className="flex justify-between text-muted-foreground">
                          <span>Tax</span>
                          <span>{formatPrice(order.tax)}</span>
                        </div>
                      )}
                      <Separator className="my-1.5" />
                      <div className="flex justify-between font-bold text-sm text-foreground">
                        <span>Total Paid</span>
                        <span className="text-base text-[#77CDCC]">{formatPrice(order.total)}</span>
                      </div>
                    </div>
                  </div>
                ) : null}
              </section>
            ) : null}

            {/* Need Help Support Contact Bar */}
            <section className={cn("p-5 flex flex-col sm:flex-row items-center justify-between gap-4", tc.sectionCard)}>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <PhoneCall className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">Have questions about your delivery?</h4>
                  <p className="text-xs text-muted-foreground">Our support team is available 24/7 to assist you.</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl font-semibold text-xs border-border/80 hover:bg-muted"
                onClick={() => {
                  toast.info("Connecting to customer support dispatch...");
                }}
              >
                Contact Support
              </Button>
            </section>
          </main>
        ) : null}
      </div>
    </div>
  );
}

function Detail({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("mt-1.5 text-sm font-semibold text-foreground", className)}>
        {value}
      </p>
    </div>
  );
}
