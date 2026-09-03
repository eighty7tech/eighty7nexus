"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { IDeliveryMethod } from "@/types";
import { MediaUploader, type UploadedMedia } from "@/components/ui/media-uploader";
import { Image as ImageIcon, Truck, Link as LinkIcon } from "lucide-react";
import Image from "next/image";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { GHANA_REGIONS_STATIC, GHANA_CITIES_BY_REGION } from "@/lib/data/ghana-locations";
import { toast } from "sonner";

const CARRIER_PROVIDERS = [
  { code: "VIPX", name: "VIP Jeoun (VIPX Parcel)", defaultLogo: "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=100&auto=format&fit=crop&q=60" },
  { code: "STC", name: "STC Intercity Logistics", defaultLogo: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=100&auto=format&fit=crop&q=60" },
  { code: "FEDEX", name: "FedEx Express Ghana", defaultLogo: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=100&auto=format&fit=crop&q=60" },
  { code: "DHL", name: "DHL Express Ghana", defaultLogo: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=100&auto=format&fit=crop&q=60" },
  { code: "ZARA", name: "Zara Express Couriers", defaultLogo: "https://images.unsplash.com/photo-1616401784845-180882ba9ba8?w=100&auto=format&fit=crop&q=60" },
  { code: "OA_TRAVEL", name: "O.A. Travel & Tour Parcel", defaultLogo: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=100&auto=format&fit=crop&q=60" },
  { code: "SPEEDAF", name: "Speedaf Logistics Ghana", defaultLogo: "https://images.unsplash.com/photo-1580674684081-7617fbf3d745?w=100&auto=format&fit=crop&q=60" },
  { code: "GHANA_POST", name: "Ghana Post EMS", defaultLogo: "https://images.unsplash.com/photo-1580674684081-7617fbf3d745?w=100&auto=format&fit=crop&q=60" },
  { code: "STANDARD", name: "In-House / Standard Dispatch", defaultLogo: "" },
  { code: "CUSTOM", name: "Custom Courier Partner", defaultLogo: "" },
];

const deliveryMethodSchema = z.object({
  name: z.string().min(2, "Name is required"),
  carrierCode: z.string().optional(),
  logoUrl: z.string().optional(),
  trackingUrlTemplate: z.string().optional(),
  description: z.string().optional(),
  type: z.enum(["FLAT_RATE", "PER_KM", "PER_KG", "ZONE_BASED"]),
  baseCost: z.coerce.number().min(0),
  perKmCost: z.coerce.number().min(0).optional(),
  perKgCost: z.coerce.number().min(0).optional(),
  freeShippingThreshold: z.coerce.number().min(0).optional(),
  maxDistanceKm: z.coerce.number().min(0).optional(),
  estimatedDaysMin: z.coerce.number().min(1),
  estimatedDaysMax: z.coerce.number().min(1),
  isActive: z.boolean(),
  isInternational: z.boolean(),
  availableRegions: z.array(z.string()).default([]),
  availableCities: z.array(z.string()).default([]),
});

type DeliveryMethodFormValues = z.infer<typeof deliveryMethodSchema>;

interface DeliveryMethodDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  method?: IDeliveryMethod | null;
  onSaved: () => void;
}

function MultiSelectDropdown({ 
  options, 
  selected, 
  onChange, 
  placeholder 
}: { 
  options: { label: string; value: string }[]; 
  selected: string[]; 
  onChange: (val: string[]) => void; 
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);

  const handleSelectAll = () => {
    if (selected.length === options.length) {
      onChange([]);
    } else {
      onChange(options.map(o => o.value));
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between font-normal h-auto min-h-10 px-3 py-2 text-left">
          {selected.length > 0 ? (
            <div className="flex flex-wrap gap-1 items-center">
              {selected.map((val) => (
                <span key={val} className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-medium flex items-center">
                  {options.find(o => o.value === val)?.label || val}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <div className="max-h-[300px] overflow-y-auto p-1 space-y-1">
          {options.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">No options available.</div>
          ) : (
            <>
              <div className="flex items-center justify-between px-2 py-1.5 border-b mb-1">
                <span className="text-xs font-medium text-muted-foreground">
                  {selected.length} selected
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={handleSelectAll}
                >
                  {selected.length === options.length ? "Deselect All" : "Select All"}
                </Button>
              </div>
              {options.map((option) => {
                const isSelected = selected.includes(option.value);
                return (
                  <label
                    key={option.value}
                    className="flex items-center space-x-2 rounded px-2 py-1.5 hover:bg-muted cursor-pointer"
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          onChange([...selected, option.value]);
                        } else {
                          onChange(selected.filter(v => v !== option.value));
                        }
                      }}
                    />
                    <span className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      {option.label}
                    </span>
                  </label>
                );
              })}
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function DeliveryMethodDialog({
  open,
  onOpenChange,
  method,
  onSaved,
}: DeliveryMethodDialogProps) {
  const [loading, setLoading] = useState(false);
  const [mediaList, setMediaList] = useState<UploadedMedia[]>([]);

  const form = useForm<DeliveryMethodFormValues>({
    resolver: zodResolver(deliveryMethodSchema) as any,
    defaultValues: {
      name: "",
      carrierCode: "STANDARD",
      logoUrl: "",
      trackingUrlTemplate: "",
      description: "",
      type: "FLAT_RATE",
      baseCost: 0,
      perKmCost: 0,
      perKgCost: 0,
      freeShippingThreshold: 0,
      maxDistanceKm: 0,
      estimatedDaysMin: 1,
      estimatedDaysMax: 3,
      isActive: true,
      isInternational: false,
      availableRegions: [],
      availableCities: [],
    },
  });

  useEffect(() => {
    if (open) {
      if (method) {
        form.reset({
          name: method.name,
          carrierCode: method.carrierCode || "STANDARD",
          logoUrl: method.logoUrl || "",
          trackingUrlTemplate: method.trackingUrlTemplate || "",
          description: method.description || "",
          type: method.type as any,
          baseCost: method.baseCost,
          perKmCost: method.perKmCost || 0,
          perKgCost: method.perKgCost || 0,
          freeShippingThreshold: method.freeShippingThreshold || 0,
          maxDistanceKm: method.maxDistanceKm || 0,
          estimatedDaysMin: method.estimatedDaysMin || 1,
          estimatedDaysMax: method.estimatedDaysMax || 3,
          isActive: method.isActive,
          isInternational: method.isInternational || false,
          availableRegions: method.availableRegions || [],
          availableCities: (method as any).availableCities || [],
        });

        if (method.logoUrl) {
          setMediaList([
            {
              _id: "logo-current",
              url: method.logoUrl,
              type: "image",
              mimeType: "image/png",
              filename: "Carrier Logo",
            },
          ]);
        } else {
          setMediaList([]);
        }
      } else {
        form.reset({
          name: "",
          carrierCode: "VIPX",
          logoUrl: "",
          trackingUrlTemplate: "",
          description: "",
          type: "FLAT_RATE",
          baseCost: 0,
          perKmCost: 0,
          perKgCost: 0,
          freeShippingThreshold: 0,
          maxDistanceKm: 0,
          estimatedDaysMin: 1,
          estimatedDaysMax: 3,
          isActive: true,
          isInternational: false,
          availableRegions: [],
          availableCities: [],
        });
        setMediaList([]);
      }
    }
  }, [open, method, form]);

  const handleMediaChange = (files: UploadedMedia[]) => {
    setMediaList(files);
    if (files.length > 0 && files[0].url) {
      form.setValue("logoUrl", files[0].url);
    } else {
      form.setValue("logoUrl", "");
    }
  };

  const handleCarrierSelect = (code: string) => {
    form.setValue("carrierCode", code);
    const provider = CARRIER_PROVIDERS.find((p) => p.code === code);
    if (provider && provider.name && !form.getValues("name")) {
      form.setValue("name", provider.name);
    }
  };

  const onSubmit = async (data: DeliveryMethodFormValues) => {
    setLoading(true);
    try {
      const payload = {
        ...data,
      };

      const url = method
        ? `/api/admin/delivery-methods/${method._id}`
        : "/api/admin/delivery-methods";
      const res = await fetch(url, {
        method: method ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || errJson.message || "Failed to save delivery method");
      }

      toast.success(method ? "Delivery method updated successfully" : "Delivery method created successfully");
      onSaved();
      onOpenChange(false);
    } catch (error: unknown) {
      console.error(error);
      const msg = error instanceof Error ? error.message : "Failed to save delivery method";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const selectedRegions = form.watch("availableRegions");
  
  const cityOptions = (() => {
    const regionsToUse = selectedRegions && selectedRegions.length > 0 ? selectedRegions : GHANA_REGIONS_STATIC.map(r => r.code);
    const cities: string[] = [];
    regionsToUse.forEach((rCode: string) => {
      if (GHANA_CITIES_BY_REGION[rCode]) {
        cities.push(...GHANA_CITIES_BY_REGION[rCode]);
      }
    });
    return Array.from(new Set(cities)).sort().map(c => ({ label: c, value: c }));
  })();

  const regionOptions = GHANA_REGIONS_STATIC.map(r => ({ label: r.name, value: r.code }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-xl">
                {method ? "Edit Delivery Method" : "Add Delivery Method"}
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Configure parcel delivery carriers like VIPX, STC, FedEx, local couriers, and pricing rules.
              </p>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {/* Carrier Provider & Method Name */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="carrierCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Carrier / Logistics Provider</FormLabel>
                    <Select
                      onValueChange={(val) => {
                        field.onChange(val);
                        handleCarrierSelect(val);
                      }}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Select Carrier" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CARRIER_PROVIDERS.map((provider) => (
                          <SelectItem key={provider.code} value={provider.code}>
                            {provider.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. VIPX Station-to-Station Parcel" className="h-10" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Carrier Logo: Upload or Direct URL */}
            <div className="space-y-3 rounded-lg border p-4 bg-muted/20">
              <div className="flex items-center justify-between">
                <div>
                  <FormLabel className="text-sm font-semibold flex items-center gap-1.5">
                    <ImageIcon className="h-4 w-4 text-primary" /> Carrier Logo / Icon
                  </FormLabel>
                  <FormDescription className="text-xs">
                    Upload an image or paste an external URL for this delivery service.
                  </FormDescription>
                </div>
                {form.watch("logoUrl") && (
                  <div className="relative h-10 w-16 rounded border bg-card p-1 shrink-0 overflow-hidden">
                    <Image
                      src={form.watch("logoUrl")!}
                      alt="Logo preview"
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start">
                <div>
                  <FormField
                    control={form.control}
                    name="logoUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="relative">
                            <Input
                              placeholder="https://... image URL"
                              className="h-9 pr-8 text-xs font-mono"
                              {...field}
                            />
                            <LinkIcon className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div>
                  <MediaUploader
                    value={mediaList}
                    onChange={handleMediaChange}
                    maxFiles={1}
                    acceptTypes={["image"]}
                    previewAspectRatio="video"
                    className="min-h-[90px]"
                  />
                </div>
              </div>
            </div>

            {/* Pricing Type & Description */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pricing Model</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="FLAT_RATE">Flat Rate (Fixed Fee)</SelectItem>
                        <SelectItem value="PER_KM">Distance Based (Per KM)</SelectItem>
                        <SelectItem value="PER_KG">Weight Based (Per KG)</SelectItem>
                        <SelectItem value="ZONE_BASED">Zone Based (Regional Tier)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="trackingUrlTemplate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Live Tracking URL Template</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://track.vipx.com/?no={{trackingNumber}}"
                        className="h-10 text-xs font-mono"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-[11px]">
                      Use {"{{trackingNumber}}"} placeholder for auto-generated tracking links.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer Delivery Instructions & Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g. Dispatched via VIP Jeoun Terminal. Customer will receive SMS with parcel waybill code for station pickup."
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Rates Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3.5 rounded-lg border bg-card">
              <FormField
                control={form.control}
                name="baseCost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium">Base Fee (GH₵)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.5" className="h-9" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="perKmCost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium">+ Per KM (GH₵)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" className="h-9" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="perKgCost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium">+ Per KG (GH₵)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" className="h-9" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="freeShippingThreshold"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium">Free Over (GH₵)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0 = None" className="h-9" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Delivery Time & Distance */}
            <div className="grid grid-cols-3 gap-3">
              <FormField
                control={form.control}
                name="estimatedDaysMin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium">Min Est. Days</FormLabel>
                    <FormControl>
                      <Input type="number" className="h-9" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="estimatedDaysMax"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium">Max Est. Days</FormLabel>
                    <FormControl>
                      <Input type="number" className="h-9" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="maxDistanceKm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium">Max Radius (KM)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Optional" className="h-9" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Regional Coverage */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="availableRegions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ghana Regions Coverage</FormLabel>
                    <FormControl>
                      <MultiSelectDropdown
                        options={regionOptions}
                        selected={field.value}
                        onChange={(val) => {
                          field.onChange(val);
                          // Option to clear cities if region gets unselected and city doesn't exist anymore
                          // but simplified: let's just allow the user to manage it.
                        }}
                        placeholder="Select Regions..."
                      />
                    </FormControl>
                    <FormDescription className="text-[11px]">
                      Leave empty for nationwide availability.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="availableCities"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City / Town Coverage</FormLabel>
                    <FormControl>
                      <MultiSelectDropdown
                        options={cityOptions}
                        selected={field.value}
                        onChange={field.onChange}
                        placeholder="Select Cities..."
                      />
                    </FormControl>
                    <FormDescription className="text-[11px]">
                      Leave empty to cover all cities in selected regions.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Switches */}
            <div className="grid grid-cols-2 gap-4 pt-1">
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3.5 bg-card">
                    <div className="space-y-0.5">
                      <FormLabel className="text-sm font-medium">Active Status</FormLabel>
                      <FormDescription className="text-xs">
                        Enable or disable for checkout
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isInternational"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3.5 bg-card">
                    <div className="space-y-0.5">
                      <FormLabel className="text-sm font-medium">International</FormLabel>
                      <FormDescription className="text-xs">
                        Cross-border international route
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-end gap-2 pt-3 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="gap-2">
                {loading ? "Saving..." : method ? "Update Delivery Method" : "Create Delivery Method"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
