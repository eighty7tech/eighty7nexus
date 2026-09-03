"use client";

import { useEffect, useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormControl, FormMessage, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { IGhanaRegion } from "@/types";
import { CheckoutFormData } from "./checkout-helpers";
import { GHANA_REGIONS_STATIC } from "@/lib/data/ghana-locations";
import { useTranslations } from "next-intl";

/**
 * Strict Ghana Post GPS Masking & Formatting.
 * Strictly adheres to format: XX-123-1234 or XX-1234-1234 (e.g. AS-123-1234, GA-123-1234)
 */
export function formatGhanaPostGps(raw: string): string {
  if (!raw) return "";
  const cleaned = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const letters = cleaned.slice(0, 2).replace(/[^A-Z]/g, "");
  const numbers = cleaned.slice(2, 10).replace(/[^0-9]/g, "");

  let result = letters;
  if (letters.length === 2) {
    result += "-";
  }

  if (numbers.length > 0) {
    if (numbers.length <= 3) {
      result += numbers;
      if (numbers.length === 3) {
        result += "-";
      }
    } else if (numbers.length <= 7) {
      result += numbers.slice(0, 3) + "-" + numbers.slice(3, 7);
    } else {
      result += numbers.slice(0, 4) + "-" + numbers.slice(4, 8);
    }
  }

  return result;
}

export function GhanaAddressForm({ form }: { form: UseFormReturn<CheckoutFormData> }) {
  const t = useTranslations();
  const [regions, setRegions] = useState<IGhanaRegion[]>(GHANA_REGIONS_STATIC);
  const [loadingRegions, setLoadingRegions] = useState(false);

  const watchedRegion = form.watch("state");

  useEffect(() => {
    fetch("/api/checkout/ghana/regions")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          setRegions(data.data);
        }
      })
      .catch((err) => {
        console.error("Failed to load regions from API, using static locations:", err);
      });
  }, []);

  useEffect(() => {
    // We no longer need to load districts to build a city dropdown.
    // However, if we need districts for other purposes, we could keep it.
    // For now, since city is a text input, we omit district fetching to save overhead.
  }, [watchedRegion, regions]);

  return (
    <div className="space-y-4">
      {/* 1. Country & Region */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Country */}
        <FormItem>
          <FormLabel>Country</FormLabel>
          <FormControl>
            <Input value="Ghana" readOnly disabled className="h-10 bg-muted/40 font-medium" />
          </FormControl>
        </FormItem>

        {/* Region */}
        <FormField
          control={form.control}
          name="state"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Region</FormLabel>
              <FormControl>
                <Select
                  value={field.value}
                  onValueChange={(val) => {
                    field.onChange(val);
                    form.setValue("city", ""); // Reset city dropdown when region changes
                    form.setValue("billingCity", "");
                  }}
                  disabled={loadingRegions}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select Region" />
                  </SelectTrigger>
                  <SelectContent>
                    {regions.map((region) => (
                      <SelectItem key={region.code} value={region.code}>
                        {region.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* 2. City (Dropdown) & Town (Text Field) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* City - TEXT FIELD */}
        <FormField
          control={form.control}
          name="city"
          render={({ field }) => (
            <FormItem>
              <FormLabel>City</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value || ""}
                  onChange={(e) => {
                    field.onChange(e.target.value);
                    form.setValue("billingCity", e.target.value);
                  }}
                  className="h-10"
                  placeholder="e.g. Accra, Kumasi"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Town - TEXT FIELD */}
        <FormField
          control={form.control}
          name="town"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Town / Suburb / Area</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value || ""}
                  onChange={(e) => {
                    field.onChange(e.target.value);
                  }}
                  className="h-10"
                  placeholder="e.g. Osu, East Legon, Bantama, Spintex"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* 3. Ghana Post GPS & Street Address */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Ghana Post GPS - STRICT FORMATTING (e.g. AS-123-1234, GA-123-1234) */}
        <FormField
          control={form.control}
          name="postalCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ghana Post GPS</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  className="h-10 font-mono tracking-wide uppercase"
                  placeholder="e.g. AS-123-1234, GA-123-1234"
                  maxLength={13}
                  value={field.value || ""}
                  onChange={(e) => {
                    const formatted = formatGhanaPostGps(e.target.value);
                    field.onChange(formatted);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Street Name / House Number */}
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Street Address / House No.</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  className="h-10"
                  placeholder="e.g. Oxford Street, Hse No. 12"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* 4. Additional Information Box (Optional) */}
      <FormField
        control={form.control}
        name="apartment"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Additional Information / Landmark (Optional)</FormLabel>
            <FormControl>
              <Input
                {...field}
                className="h-10"
                placeholder="e.g. Near Shell Filling Station, behind Papaye, red gate"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* 5. Neighbourhood and Special Request */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FormField
          control={form.control}
          name="neighbourhood"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Neighbourhood (Optional)</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value || ""}
                  className="h-10"
                  placeholder="e.g. Dzorwulu, Cantonments"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="specialRequest"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Special Request for Delivery (Optional)</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value || ""}
                  className="h-10"
                  placeholder="e.g. Call upon arrival, leave at reception"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
