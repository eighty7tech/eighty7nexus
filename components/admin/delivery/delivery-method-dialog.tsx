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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFieldArray } from "react-hook-form";
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
import { Image as ImageIcon, Truck, Link as LinkIcon, MapPin, Clock, PlusCircle, Trash, PackageOpen, Download, DollarSign } from "lucide-react";
import Image from "next/image";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
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

const CARRIER_PRESETS: Record<string, Partial<DeliveryMethodFormValues>> = {
  VIPX: {
    name: "VIP Jeoun (VIPX Parcel)",
    carrierCode: "VIPX",
    logoUrl: "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=100&auto=format&fit=crop&q=60",
    description: "Premium intercity bus parcel delivery.",
    type: "FLAT_RATE",
    baseCost: 50,
    estimatedDaysMin: 1,
    estimatedDaysMax: 2,
    operatingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    dispatchTimes: ["06:00 AM", "12:00 PM", "06:00 PM"],
    terminalLocations: [
      { name: "Circle VIP Station", address: "Kwame Nkrumah Circle, Accra" },
      { name: "Asafo VIP Station", address: "Asafo Market, Kumasi" }
    ]
  },
  STC: {
    name: "STC Intercity Logistics",
    carrierCode: "STC",
    logoUrl: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=100&auto=format&fit=crop&q=60",
    description: "State Transport Company Parcels",
    type: "FLAT_RATE",
    baseCost: 40,
    estimatedDaysMin: 1,
    estimatedDaysMax: 3,
    operatingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    dispatchTimes: ["08:00 AM", "03:00 PM"],
    terminalLocations: [
      { name: "Tudu STC Station", address: "Tudu, Accra" },
      { name: "Adum STC Station", address: "Adum, Kumasi" }
    ]
  }
};

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
  operatingDays: z.array(z.string()).default([]),
  dispatchTimes: z.array(z.string()).default([]),
  terminalLocations: z.array(
    z.object({
      name: z.string().min(1, "Terminal name is required"),
      address: z.string().optional(),
      coordinates: z.object({
        lat: z.coerce.number(),
        lng: z.coerce.number()
      }).optional()
    })
  ).default([]),
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
      operatingDays: [],
      dispatchTimes: [],
      terminalLocations: [],
    },
  });

  const { fields: terminalFields, append: appendTerminal, remove: removeTerminal } = useFieldArray({
    control: form.control,
    name: "terminalLocations"
  });

  const applyPreset = (code: string) => {
    const preset = CARRIER_PRESETS[code];
    if (preset) {
      Object.entries(preset).forEach(([key, value]) => {
        form.setValue(key as keyof DeliveryMethodFormValues, value as any, { shouldValidate: true, shouldDirty: true });
      });
      if (preset.logoUrl) {
        setMediaList([{
          _id: "preset-logo",
          url: preset.logoUrl,
          type: "image",
          mimeType: "image/png",
          filename: "Preset Logo",
        }]);
      }
      toast.success(`${preset.name} preset applied!`);
    }
  };

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
          operatingDays: (method as any).operatingDays || [],
          dispatchTimes: (method as any).dispatchTimes || [],
          terminalLocations: (method as any).terminalLocations || [],
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
      <DialogContent className="max-w-[95vw] w-full md:max-w-7xl max-h-[95vh] h-full md:h-auto overflow-hidden flex flex-col p-0 border-none bg-background/95 backdrop-blur-xl shadow-2xl rounded-2xl">
        
        {/* Header Gradient & Info */}
        <div className="relative bg-gradient-to-r from-primary/10 via-background to-background p-6 border-b">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-primary shadow-sm border border-primary/20">
                <Truck className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold tracking-tight">
                  {method ? "Edit Delivery Method" : "Add Delivery Method"}
                </DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Configure advanced logistics: bus parcels, custom couriers, schedules, and map routing.
                </p>
              </div>
            </div>
            
            {!method && (
              <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="bg-background">
                      <Download className="mr-2 h-4 w-4 text-primary" />
                      Import Preset
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-80 p-0">
                    <div className="p-3 border-b bg-muted/50">
                      <h4 className="font-semibold text-sm">Quick Fill Presets</h4>
                      <p className="text-xs text-muted-foreground">Instantly load logistics data for popular Ghanaian carriers.</p>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto p-2 space-y-1">
                      {Object.keys(CARRIER_PRESETS).map(code => (
                        <button
                          key={code}
                          type="button"
                          onClick={() => applyPreset(code)}
                          className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
                        >
                          <div className="font-medium">{CARRIER_PRESETS[code].name}</div>
                          <div className="text-xs text-muted-foreground truncate">{CARRIER_PRESETS[code].description}</div>
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col overflow-hidden">
            <Tabs defaultValue="general" className="flex-1 flex flex-col">
              <div className="px-6 border-b bg-muted/20">
                <TabsList className="h-12 bg-transparent space-x-2">
                  <TabsTrigger value="general" className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md px-4">
                    <PackageOpen className="mr-2 h-4 w-4" /> General & Branding
                  </TabsTrigger>
                  <TabsTrigger value="routes" className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md px-4">
                    <MapPin className="mr-2 h-4 w-4" /> Routes & Maps
                  </TabsTrigger>
                  <TabsTrigger value="schedule" className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md px-4">
                    <Clock className="mr-2 h-4 w-4" /> Schedule & Time
                  </TabsTrigger>
                  <TabsTrigger value="pricing" className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md px-4">
                    <DollarSign className="mr-2 h-4 w-4" /> Pricing & Rules
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="flex-1 overflow-y-auto p-6 bg-muted/10">
                {/* TAB 1: GENERAL */}
                <TabsContent value="general" className="m-0 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="carrierCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-foreground font-semibold">Carrier / Logistics Provider</FormLabel>
                            <Select onValueChange={(val) => { field.onChange(val); handleCarrierSelect(val); }} value={field.value}>
                              <FormControl>
                                <SelectTrigger className="h-12 bg-background">
                                  <SelectValue placeholder="Select Carrier" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {CARRIER_PROVIDERS.map((provider) => (
                                  <SelectItem key={provider.code} value={provider.code}>{provider.name}</SelectItem>
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
                            <FormLabel className="text-foreground font-semibold">Display Name</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. VIPX Station-to-Station Parcel" className="h-12 bg-background" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-foreground font-semibold">Short Description</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Customers will see this at checkout..." className="resize-none h-24 bg-background" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="space-y-4">
                      <div className="p-5 border rounded-xl bg-background shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <FormLabel className="text-foreground font-semibold flex items-center gap-2">
                              <ImageIcon className="h-4 w-4 text-primary" /> Carrier Logo
                            </FormLabel>
                            <FormDescription className="text-xs mt-1">Upload a high-quality logo for the carrier.</FormDescription>
                          </div>
                          {form.watch("logoUrl") && (
                            <div className="relative h-14 w-20 rounded-md border bg-card p-1 shrink-0 overflow-hidden shadow-sm">
                              <Image src={form.watch("logoUrl")!} alt="Logo preview" fill className="object-contain" unoptimized />
                            </div>
                          )}
                        </div>
                        
                        <MediaUploader
                          value={
                            form.watch("logoUrl")
                              ? [
                                  {
                                    _id: "logo-current",
                                    url: form.watch("logoUrl")!,
                                    type: "image",
                                    mimeType: "image/png",
                                    filename: "Carrier Logo",
                                  } as UploadedMedia,
                                ]
                              : []
                          }
                          onChange={(mediaList) => {
                            if (mediaList && mediaList.length > 0) {
                              form.setValue("logoUrl", mediaList[0].url, { shouldValidate: true, shouldDirty: true });
                            } else {
                              form.setValue("logoUrl", "", { shouldValidate: true, shouldDirty: true });
                            }
                          }}
                          maxFiles={1}
                        />
                        
                        <div className="pt-2 border-t">
                          <FormField
                            control={form.control}
                            name="logoUrl"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs text-muted-foreground">Or paste an external URL:</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <Input placeholder="https://..." className="h-9 pr-8 text-xs font-mono bg-muted/50" {...field} />
                                    <LinkIcon className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* TAB 2: ROUTES & MAPS */}
                <TabsContent value="routes" className="m-0 space-y-6">
                  <div className="p-6 border rounded-xl bg-background shadow-sm space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold flex items-center gap-2"><MapPin className="h-5 w-5 text-primary" /> Terminal Locations</h3>
                      <p className="text-sm text-muted-foreground">Define specific pick-up and drop-off stations (e.g., VIP stations).</p>
                    </div>

                    <div className="space-y-4">
                      {terminalFields.map((field, index) => (
                        <div key={field.id} className="grid grid-cols-12 gap-4 items-start p-4 rounded-lg border bg-muted/30">
                          <div className="col-span-12 md:col-span-4">
                            <FormField
                              control={form.control}
                              name={`terminalLocations.${index}.name`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs">Terminal Name</FormLabel>
                                  <FormControl><Input placeholder="e.g. Circle Station" {...field} /></FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <div className="col-span-12 md:col-span-5">
                            <FormField
                              control={form.control}
                              name={`terminalLocations.${index}.address`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs">Physical Address</FormLabel>
                                  <FormControl><Input placeholder="Street name, landmark..." {...field} /></FormControl>
                                </FormItem>
                              )}
                            />
                          </div>
                          <div className="col-span-12 md:col-span-2">
                            <FormField
                              control={form.control}
                              name={`terminalLocations.${index}.coordinates.lat`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs">Latitude</FormLabel>
                                  <FormControl><Input type="number" step="any" placeholder="5.6037" {...field} /></FormControl>
                                </FormItem>
                              )}
                            />
                          </div>
                          <div className="col-span-12 md:col-span-1 flex items-end justify-end h-[68px]">
                            <Button type="button" variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => removeTerminal(index)}>
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      
                      <Button type="button" variant="outline" className="w-full border-dashed py-8" onClick={() => appendTerminal({ name: "", address: "" })}>
                        <PlusCircle className="mr-2 h-5 w-5 text-muted-foreground" /> Add Terminal Location
                      </Button>
                    </div>

                    <Separator />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                      <FormField
                        control={form.control}
                        name="availableRegions"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-foreground font-semibold">Available Regions</FormLabel>
                            <FormControl>
                              <MultiSelectDropdown options={regionOptions} selected={field.value || []} onChange={field.onChange} placeholder="Select Regions..." />
                            </FormControl>
                            <FormDescription>Leave empty to allow all regions.</FormDescription>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="availableCities"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-foreground font-semibold">Available Cities</FormLabel>
                            <FormControl>
                              <MultiSelectDropdown options={cityOptions} selected={field.value || []} onChange={field.onChange} placeholder="Select Cities..." />
                            </FormControl>
                            <FormDescription>Filter further by specific cities/districts.</FormDescription>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </TabsContent>

                {/* TAB 3: SCHEDULE & TIME */}
                <TabsContent value="schedule" className="m-0 space-y-6">
                  <div className="p-6 border rounded-xl bg-background shadow-sm space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-lg font-semibold flex items-center gap-2"><Clock className="h-5 w-5 text-primary" /> Operating Days</h3>
                          <p className="text-sm text-muted-foreground">Which days does this carrier operate?</p>
                        </div>
                        <FormField
                          control={form.control}
                          name="operatingDays"
                          render={({ field }) => (
                            <FormItem>
                              <div className="grid grid-cols-2 gap-2 mt-2">
                                {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => (
                                  <label key={day} className="flex items-center space-x-2 border rounded-md p-3 cursor-pointer hover:bg-muted/50">
                                    <Checkbox
                                      checked={field.value?.includes(day)}
                                      onCheckedChange={(checked) => {
                                        const val = field.value || [];
                                        field.onChange(checked ? [...val, day] : val.filter(d => d !== day));
                                      }}
                                    />
                                    <span className="text-sm font-medium">{day}</span>
                                  </label>
                                ))}
                              </div>
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="space-y-6">
                        <div className="space-y-4">
                          <div>
                            <h3 className="text-lg font-semibold flex items-center gap-2">Estimated Transit Time</h3>
                            <p className="text-sm text-muted-foreground">How many days does it take to arrive?</p>
                          </div>
                          <div className="flex items-center gap-4">
                            <FormField
                              control={form.control}
                              name="estimatedDaysMin"
                              render={({ field }) => (
                                <FormItem className="flex-1">
                                  <FormLabel>Min Days</FormLabel>
                                  <FormControl><Input type="number" min={1} className="h-10" {...field} /></FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <div className="pt-8 text-muted-foreground">—</div>
                            <FormField
                              control={form.control}
                              name="estimatedDaysMax"
                              render={({ field }) => (
                                <FormItem className="flex-1">
                                  <FormLabel>Max Days</FormLabel>
                                  <FormControl><Input type="number" min={1} className="h-10" {...field} /></FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* TAB 4: PRICING */}
                <TabsContent value="pricing" className="m-0 space-y-6">
                  <div className="p-6 border rounded-xl bg-background shadow-sm space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold flex items-center gap-2"><DollarSign className="h-5 w-5 text-primary" /> Pricing Model</h3>
                      <p className="text-sm text-muted-foreground">Configure the base costs and dynamic pricing rules.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-semibold">Calculation Method</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger className="h-12"><SelectValue placeholder="Select Method" /></SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="FLAT_RATE">Flat Rate (Fixed Cost)</SelectItem>
                                <SelectItem value="PER_KM">Per Kilometer (Distance based)</SelectItem>
                                <SelectItem value="PER_KG">Per Kilogram (Weight based)</SelectItem>
                                <SelectItem value="ZONE_BASED">Zone Based</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="baseCost"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-semibold">Base Cost (GHS)</FormLabel>
                            <FormControl><Input type="number" min={0} step="0.01" className="h-12 text-lg" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </TabsContent>
              </div>

              {/* FOOTER ACTIONS */}
              <div className="p-4 border-t bg-muted/20 flex items-center justify-between mt-auto">
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2 space-y-0">
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <FormLabel className="font-medium cursor-pointer">Activate Delivery Method</FormLabel>
                    </FormItem>
                  )}
                />
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                  <Button type="submit" disabled={loading} className="px-8">{loading ? "Saving..." : method ? "Update Delivery Method" : "Create Delivery Method"}</Button>
                </div>
              </div>
            </Tabs>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
