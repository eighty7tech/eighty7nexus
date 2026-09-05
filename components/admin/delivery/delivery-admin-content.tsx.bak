"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { IDeliveryMethod } from "@/types";
import { DeliveryMethodDialog } from "@/components/admin/delivery/delivery-method-dialog";
import {
  Trash2,
  Edit,
  Plus,
  Loader2,
  Download,
  Zap,
  Package,
  Truck,
  Bus,
  ExternalLink,
  Search,
  Filter,
  CheckCircle2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

// ─── Ghana Delivery & Carrier Presets ──────────────────────────────────────────

const GHANA_STANDARD_PRESET: Partial<IDeliveryMethod>[] = [
  {
    name: "Accra Metro Express",
    carrierCode: "STANDARD",
    description: "Same-day or next-day delivery within the Accra Metropolitan Area.",
    type: "FLAT_RATE",
    baseCost: 15,
    estimatedDaysMin: 1,
    estimatedDaysMax: 1,
    isActive: true,
    isInternational: false,
    availableRegions: ["Greater Accra"],
  },
  {
    name: "Kumasi Metro Standard",
    carrierCode: "STANDARD",
    description: "Next-day delivery within Kumasi and surrounding districts.",
    type: "FLAT_RATE",
    baseCost: 18,
    estimatedDaysMin: 1,
    estimatedDaysMax: 2,
    isActive: true,
    isInternational: false,
    availableRegions: ["Ashanti"],
  },
  {
    name: "Regional Delivery (South)",
    carrierCode: "STANDARD",
    description: "Standard delivery to Central, Western, Eastern, and Volta Regions.",
    type: "FLAT_RATE",
    baseCost: 25,
    estimatedDaysMin: 2,
    estimatedDaysMax: 3,
    isActive: true,
    isInternational: false,
    availableRegions: ["Central", "Western", "Eastern", "Volta"],
  },
  {
    name: "Regional Delivery (North)",
    carrierCode: "STANDARD",
    description: "Standard delivery to Northern, Upper East, Upper West, and Savannah Regions.",
    type: "FLAT_RATE",
    baseCost: 35,
    estimatedDaysMin: 3,
    estimatedDaysMax: 5,
    isActive: true,
    isInternational: false,
    availableRegions: ["Northern", "Upper East", "Upper West", "Savannah", "North East"],
  },
  {
    name: "Nationwide Economy",
    carrierCode: "STANDARD",
    description: "Economy delivery covering all 16 regions of Ghana.",
    type: "FLAT_RATE",
    baseCost: 30,
    estimatedDaysMin: 3,
    estimatedDaysMax: 7,
    isActive: true,
    isInternational: false,
    availableRegions: [],
  },
];

const VIPX_PARCEL_PRESET: Partial<IDeliveryMethod>[] = [
  {
    name: "VIPX Express (Accra ↔ Kumasi)",
    carrierCode: "VIPX",
    logoUrl: "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=100&auto=format&fit=crop&q=60",
    description: "VIP Jeoun station-to-station express freight between Circle VIP Terminal and Asafo VIP Terminal.",
    trackingUrlTemplate: "https://track.vipx.com.gh/?no={{trackingNumber}}",
    type: "FLAT_RATE",
    baseCost: 20,
    estimatedDaysMin: 1,
    estimatedDaysMax: 1,
    isActive: true,
    isInternational: false,
    availableRegions: ["Greater Accra", "Ashanti"],
  },
  {
    name: "VIPX Regional Station Bus Freight",
    carrierCode: "VIPX",
    logoUrl: "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=100&auto=format&fit=crop&q=60",
    description: "VIP Jeoun parcel service to Sunyani, Tamale, Takoradi, Bolgatanga, and Cape Coast stations.",
    trackingUrlTemplate: "https://track.vipx.com.gh/?no={{trackingNumber}}",
    type: "ZONE_BASED",
    baseCost: 30,
    perKgCost: 1.5,
    estimatedDaysMin: 1,
    estimatedDaysMax: 2,
    isActive: true,
    isInternational: false,
    availableRegions: ["Bono", "Northern", "Western", "Upper East", "Central"],
  },
];

const STC_LOGISTICS_PRESET: Partial<IDeliveryMethod>[] = [
  {
    name: "STC Intercity Cargo & Parcel",
    carrierCode: "STC",
    logoUrl: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=100&auto=format&fit=crop&q=60",
    description: "State Transport Corporation secure nationwide bus cargo to all major STC terminals across Ghana.",
    trackingUrlTemplate: "https://stc.gov.gh/track?waybill={{trackingNumber}}",
    type: "FLAT_RATE",
    baseCost: 25,
    perKgCost: 1.0,
    estimatedDaysMin: 1,
    estimatedDaysMax: 2,
    isActive: true,
    isInternational: false,
    availableRegions: [],
  },
  {
    name: "STC International Parcel (West Africa)",
    carrierCode: "STC",
    logoUrl: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=100&auto=format&fit=crop&q=60",
    description: "Cross-border coach parcel delivery to Abidjan, Lome, Cotonou, and Ouagadougou.",
    trackingUrlTemplate: "https://stc.gov.gh/track-intl?ref={{trackingNumber}}",
    type: "FLAT_RATE",
    baseCost: 120,
    perKgCost: 8.0,
    estimatedDaysMin: 2,
    estimatedDaysMax: 5,
    isActive: true,
    isInternational: true,
    availableRegions: [],
  },
];

const ZARA_EXPRESS_PRESET: Partial<IDeliveryMethod>[] = [
  {
    name: "Zara Express – Zone A (Accra Metro)",
    carrierCode: "ZARA",
    logoUrl: "https://images.unsplash.com/photo-1616401784845-180882ba9ba8?w=100&auto=format&fit=crop&q=60",
    description: "Zara Express ultra-fast delivery for Accra Metro. Guaranteed same-day dispatch before 2 PM.",
    trackingUrlTemplate: "https://zaraexpress.com/track?ref={{trackingNumber}}",
    type: "PER_KM",
    baseCost: 12,
    perKmCost: 1.5,
    maxDistanceKm: 30,
    estimatedDaysMin: 1,
    estimatedDaysMax: 1,
    isActive: true,
    isInternational: false,
    availableRegions: ["Greater Accra"],
  },
  {
    name: "Zara Express – Zone B (South Ghana)",
    carrierCode: "ZARA",
    logoUrl: "https://images.unsplash.com/photo-1616401784845-180882ba9ba8?w=100&auto=format&fit=crop&q=60",
    description: "Zara Express tiered delivery for Central, Ashanti, Eastern, Western Regions.",
    trackingUrlTemplate: "https://zaraexpress.com/track?ref={{trackingNumber}}",
    type: "FLAT_RATE",
    baseCost: 22,
    estimatedDaysMin: 1,
    estimatedDaysMax: 2,
    isActive: true,
    isInternational: false,
    availableRegions: ["Ashanti", "Central", "Eastern", "Western"],
  },
  {
    name: "Zara Express – Zone C (North Ghana)",
    carrierCode: "ZARA",
    logoUrl: "https://images.unsplash.com/photo-1616401784845-180882ba9ba8?w=100&auto=format&fit=crop&q=60",
    description: "Zara Express northern route covering all upper and northern regions.",
    trackingUrlTemplate: "https://zaraexpress.com/track?ref={{trackingNumber}}",
    type: "FLAT_RATE",
    baseCost: 38,
    estimatedDaysMin: 2,
    estimatedDaysMax: 4,
    isActive: true,
    isInternational: false,
    availableRegions: ["Northern", "Upper East", "Upper West", "Savannah", "North East", "Oti", "Bono East", "Ahafo"],
  },
];

// ─── Component ─────────────────────────────────────────────────────────────────

export function DeliveryAdminContent() {
  const [methods, setMethods] = useState<IDeliveryMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<IDeliveryMethod | null>(null);
  const [importing, setImporting] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [carrierFilter, setCarrierFilter] = useState("ALL");

  const loadMethods = () => {
    setLoading(true);
    fetch("/api/admin/delivery-methods?limit=100")
      .then((res) => res.json())
      .then((data) => {
        // paginatedResponse returns { success, data: { data: [], pagination: {} } }
        if (data?.data?.data && Array.isArray(data.data.data)) {
          setMethods(data.data.data);
        } else if (data?.data && Array.isArray(data.data)) {
          setMethods(data.data);
        } else if (Array.isArray(data)) {
          setMethods(data);
        } else {
          setMethods([]);
        }
      })
      .catch((err) => {
        console.error("Failed to load delivery methods:", err);
        toast.error("Failed to load delivery methods");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadMethods();
  }, []);

  const handleAdd = () => {
    setSelectedMethod(null);
    setDialogOpen(true);
  };

  const handleEdit = (method: IDeliveryMethod) => {
    setSelectedMethod(method);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this delivery method?")) return;
    try {
      const res = await fetch(`/api/admin/delivery-methods/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Delivery method deleted");
      loadMethods();
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete delivery method");
    }
  };

  const handleImport = async (
    presetKey: string,
    presets: Partial<IDeliveryMethod>[]
  ) => {
    setImporting(presetKey);
    try {
      const res = await fetch("/api/admin/delivery-methods/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preset: presetKey, methods: presets }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to import");

      if (result.imported > 0) {
        toast.success(`Imported ${result.imported} delivery method${result.imported > 1 ? "s" : ""} successfully!`);
      } else {
        toast.info(result.message || "All methods in this preset are already imported.");
      }
      loadMethods();
    } catch (error: unknown) {
      console.error(error);
      const msg = error instanceof Error ? error.message : "Failed to import delivery methods.";
      toast.error(msg);
    } finally {
      setImporting(null);
    }
  };

  const filteredMethods = methods.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.description && m.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (m.carrierCode && m.carrierCode.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCarrier =
      carrierFilter === "ALL" || (m.carrierCode || "STANDARD") === carrierFilter;

    return matchesSearch && matchesCarrier;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Delivery Methods</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage Ghana parcel couriers (VIPX, STC, Zara, EMS), rate calculation models, and carrier logos.
          </p>
        </div>
        <Button onClick={handleAdd} className="gap-2 shrink-0">
          <Plus className="h-4 w-4" /> Add Delivery Method
        </Button>
      </div>

      {/* Preset Import Cards */}
      <Card className="border-primary/20 bg-primary/5 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Download className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base">Popular Ghana Logistics & Bus Parcel Presets</CardTitle>
              <CardDescription className="text-xs">
                One-click import of pre-configured rates, logos, and tracking for Ghanaian bus parcel networks & express carriers.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {/* VIPX Preset */}
            <div className="rounded-lg border bg-card p-3.5 space-y-2.5 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold text-xs">
                    VIP
                  </div>
                  <p className="font-semibold text-sm leading-none">VIPX Bus Parcel</p>
                </div>
                <p className="text-[11px] text-muted-foreground leading-tight">
                  VIP Jeoun station-to-station express bus freight (Circle, Asafo, Tamale).
                </p>
                <div className="flex flex-wrap gap-1 pt-1">
                  <Badge variant="secondary" className="text-[10px] px-1 py-0">Accra↔Kumasi</Badge>
                  <Badge variant="secondary" className="text-[10px] px-1 py-0">Terminals</Badge>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="w-full h-8 text-xs gap-1.5 border-amber-500/40 text-amber-700 hover:bg-amber-50"
                disabled={importing === "vipx-parcel"}
                onClick={() => handleImport("vipx-parcel", VIPX_PARCEL_PRESET)}
              >
                {importing === "vipx-parcel" ? (
                  <><Loader2 className="h-3 w-3 animate-spin" /> Importing…</>
                ) : (
                  <><Download className="h-3 w-3" /> Import VIPX</>
                )}
              </Button>
            </div>

            {/* STC Preset */}
            <div className="rounded-lg border bg-card p-3.5 space-y-2.5 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold text-xs">
                    STC
                  </div>
                  <p className="font-semibold text-sm leading-none">STC Intercity Cargo</p>
                </div>
                <p className="text-[11px] text-muted-foreground leading-tight">
                  State Transport Corp nationwide bus parcel & West Africa cross-border.
                </p>
                <div className="flex flex-wrap gap-1 pt-1">
                  <Badge variant="secondary" className="text-[10px] px-1 py-0">Nationwide</Badge>
                  <Badge variant="secondary" className="text-[10px] px-1 py-0">ECOWAS Route</Badge>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="w-full h-8 text-xs gap-1.5 border-blue-500/40 text-blue-700 hover:bg-blue-50"
                disabled={importing === "stc-logistics"}
                onClick={() => handleImport("stc-logistics", STC_LOGISTICS_PRESET)}
              >
                {importing === "stc-logistics" ? (
                  <><Loader2 className="h-3 w-3 animate-spin" /> Importing…</>
                ) : (
                  <><Download className="h-3 w-3" /> Import STC</>
                )}
              </Button>
            </div>

            {/* Standard Ghana Preset */}
            <div className="rounded-lg border bg-card p-3.5 space-y-2.5 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-emerald-500" />
                  <p className="font-semibold text-sm leading-none">Standard Ghana Dispatch</p>
                </div>
                <p className="text-[11px] text-muted-foreground leading-tight">
                  Flat-rate regional shipping for Accra Metro, Kumasi, and 16 regions.
                </p>
                <div className="flex flex-wrap gap-1 pt-1">
                  <Badge variant="secondary" className="text-[10px] px-1 py-0">Accra Metro</Badge>
                  <Badge variant="secondary" className="text-[10px] px-1 py-0">Regional</Badge>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="w-full h-8 text-xs gap-1.5 border-emerald-500/40 text-emerald-700 hover:bg-emerald-50"
                disabled={importing === "ghana-standard"}
                onClick={() => handleImport("ghana-standard", GHANA_STANDARD_PRESET)}
              >
                {importing === "ghana-standard" ? (
                  <><Loader2 className="h-3 w-3 animate-spin" /> Importing…</>
                ) : (
                  <><Download className="h-3 w-3" /> Import Standard</>
                )}
              </Button>
            </div>

            {/* Zara Express Preset */}
            <div className="rounded-lg border bg-card p-3.5 space-y-2.5 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-violet-500" />
                  <p className="font-semibold text-sm leading-none">Zara Express Couriers</p>
                </div>
                <p className="text-[11px] text-muted-foreground leading-tight">
                  Tiered zone couriers (Zone A Accra distance-based, Zone B & C).
                </p>
                <div className="flex flex-wrap gap-1 pt-1">
                  <Badge variant="secondary" className="text-[10px] px-1 py-0">Zones A-C</Badge>
                  <Badge variant="secondary" className="text-[10px] px-1 py-0">Per KM Rate</Badge>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="w-full h-8 text-xs gap-1.5 border-violet-500/40 text-violet-700 hover:bg-violet-50"
                disabled={importing === "zara-express"}
                onClick={() => handleImport("zara-express", ZARA_EXPRESS_PRESET)}
              >
                {importing === "zara-express" ? (
                  <><Loader2 className="h-3 w-3 animate-spin" /> Importing…</>
                ) : (
                  <><Zap className="h-3 w-3" /> Import Zara</>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Methods Table Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle>Configured Delivery Methods ({filteredMethods.length})</CardTitle>
              <CardDescription className="text-xs">
                Active shipping services shown to customers during checkout.
              </CardDescription>
            </div>

            {/* Search and Filters */}
            <div className="flex items-center gap-2">
              <div className="relative w-48 sm:w-60">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search methods..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 pl-8 text-xs"
                />
              </div>

              <select
                value={carrierFilter}
                onChange={(e) => setCarrierFilter(e.target.value)}
                aria-label="Filter by carrier"
                className="h-8 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="ALL">All Carriers</option>
                <option value="VIPX">VIPX</option>
                <option value="STC">STC</option>
                <option value="ZARA">Zara Express</option>
                <option value="STANDARD">Standard</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="w-[280px]">Service & Carrier</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Pricing & Rates</TableHead>
                    <TableHead>Timeframe</TableHead>
                    <TableHead>Coverage</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMethods.map((method) => (
                    <TableRow key={method._id as string} className="hover:bg-muted/30">
                      {/* Carrier & Service */}
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {method.logoUrl ? (
                            <div className="relative h-9 w-9 rounded-md border bg-card p-1 shrink-0 overflow-hidden">
                              <Image
                                src={method.logoUrl}
                                alt={method.name}
                                fill
                                className="object-contain"
                                unoptimized
                              />
                            </div>
                          ) : (
                            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary shrink-0">
                              {method.carrierCode === "VIPX" || method.carrierCode === "STC" ? (
                                <Bus className="h-4 w-4" />
                              ) : (
                                <Truck className="h-4 w-4" />
                              )}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="font-semibold text-sm flex items-center gap-1.5">
                              <span className="truncate">{method.name}</span>
                              {method.carrierCode && method.carrierCode !== "STANDARD" && (
                                <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 uppercase shrink-0">
                                  {method.carrierCode}
                                </Badge>
                              )}
                            </div>
                            {method.description && (
                              <p className="text-xs text-muted-foreground truncate max-w-[220px]">
                                {method.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      {/* Type */}
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] capitalize">
                          {method.type.toLowerCase().replace("_", " ")}
                        </Badge>
                      </TableCell>

                      {/* Cost */}
                      <TableCell>
                        <div className="text-sm font-semibold">
                          GH₵ {method.baseCost?.toFixed(2) || "0.00"}
                        </div>
                        <div className="text-[11px] text-muted-foreground space-x-1">
                          {method.perKmCost ? <span>+GH₵{method.perKmCost.toFixed(2)}/km</span> : null}
                          {method.perKgCost ? <span>+GH₵{method.perKgCost.toFixed(2)}/kg</span> : null}
                          {method.freeShippingThreshold ? (
                            <span className="text-emerald-600 font-medium">Free &gt; GH₵{method.freeShippingThreshold}</span>
                          ) : null}
                        </div>
                      </TableCell>

                      {/* Timeframe */}
                      <TableCell className="text-xs text-muted-foreground">
                        {method.estimatedDaysMin === method.estimatedDaysMax ? (
                          <span>{method.estimatedDaysMin} {method.estimatedDaysMin === 1 ? "day" : "days"}</span>
                        ) : (
                          <span>{method.estimatedDaysMin}–{method.estimatedDaysMax} days</span>
                        )}
                      </TableCell>

                      {/* Coverage */}
                      <TableCell>
                        {method.isInternational ? (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[10px]">
                            International
                          </Badge>
                        ) : method.availableRegions?.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-[160px]">
                            {method.availableRegions.slice(0, 2).map((region: string) => (
                              <Badge key={region} variant="secondary" className="text-[10px] px-1 py-0">
                                {region}
                              </Badge>
                            ))}
                            {method.availableRegions.length > 2 && (
                              <Badge variant="secondary" className="text-[10px] px-1 py-0">
                                +{method.availableRegions.length - 2} more
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 text-[10px]">
                            Nationwide
                          </Badge>
                        )}
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        {method.isActive ? (
                          <Badge className="bg-emerald-500 hover:bg-emerald-600 text-[10px]">Active</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px]">Inactive</Badge>
                        )}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleEdit(method)}
                            title="Edit"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDelete(method._id as string)}
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}

                  {filteredMethods.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                        <div className="flex flex-col items-center gap-2">
                          <Truck className="h-8 w-8 text-muted-foreground/50" />
                          <p className="font-medium text-sm">No delivery methods match your criteria</p>
                          <p className="text-xs text-muted-foreground">Import one of the Ghana logistics presets above or create a custom method.</p>
                          <Button size="sm" variant="outline" onClick={handleAdd} className="mt-2">
                            Add Delivery Method
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <DeliveryMethodDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        method={selectedMethod}
        onSaved={() => {
          toast.success(`Delivery method ${selectedMethod ? "updated" : "created"}`);
          loadMethods();
        }}
      />
    </div>
  );
}
