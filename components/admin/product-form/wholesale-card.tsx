import { useFormContext } from "react-hook-form";
import { useTranslations } from "next-intl";
import { PackageOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import type { ProductFormData } from "@/components/admin/product-form/schema";

export function WholesaleCard() {
  const t = useTranslations();
  const form = useFormContext<ProductFormData>();

  const isWholesaleEnabled = form.watch("wholesale.enabled");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PackageOpen className="h-5 w-5" />
          Wholesale & B2B Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <FormField
          control={form.control}
          name="wholesale.enabled"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Enable Wholesale</FormLabel>
                <FormDescription>
                  Allow B2B customers to purchase this product in bulk.
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

        {isWholesaleEnabled && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
            <FormField
              control={form.control}
              name="wholesale.moq"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Minimum Order Quantity (MOQ)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                    />
                  </FormControl>
                  <FormDescription>
                    The minimum amount a wholesale buyer must purchase.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="wholesale.stepQuantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Step Quantity</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                    />
                  </FormControl>
                  <FormDescription>
                    Must be purchased in multiples of this amount.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="wholesale.casePackQuantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Case Pack Quantity</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      value={field.value || ""}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                      placeholder="e.g., 12"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="wholesale.masterCartonQuantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Master Carton Quantity</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      value={field.value || ""}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                      placeholder="e.g., 144"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="wholesale.taxExemptEligible"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 md:col-span-2">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Tax Exempt Eligible</FormLabel>
                    <FormDescription>
                      If disabled, taxes will always be charged even if the buyer has a tax exemption certificate.
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
        )}
      </CardContent>
    </Card>
  );
}
