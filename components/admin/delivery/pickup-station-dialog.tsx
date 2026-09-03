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
import { Textarea } from "@/components/ui/textarea";
import { IPickupStation } from "@/types";

const pickupStationSchema = z.object({
  name: z.string().min(2, "Name is required"),
  region: z.string().min(2, "Region is required"),
  district: z.string().min(2, "District is required"),
  address: z.string().min(5, "Full address is required"),
  phone: z.string().min(8, "Phone number is required"),
  operatingHours: z.string().optional(),
  capacity: z.coerce.number().min(1).optional(),
  specialInstructions: z.string().optional(),
  isActive: z.boolean(),
});

type PickupStationFormValues = z.infer<typeof pickupStationSchema>;

interface PickupStationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  station?: IPickupStation | null;
  onSaved: () => void;
}

export function PickupStationDialog({
  open,
  onOpenChange,
  station,
  onSaved,
}: PickupStationDialogProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<PickupStationFormValues>({
    resolver: zodResolver(pickupStationSchema) as any,
    defaultValues: {
      name: "",
      region: "",
      district: "",
      address: "",
      phone: "",
      operatingHours: "",
      capacity: 100,
      specialInstructions: "",
      isActive: true,
    },
  });

  useEffect(() => {
    if (open) {
      if (station) {
        form.reset({
          name: station.name,
          region: station.region,
          district: station.district || "",
          address: station.address,
          phone: station.phone,
          operatingHours: station.operatingHours || "",
          capacity: station.capacity || 100,
          specialInstructions: station.specialInstructions || "",
          isActive: station.isActive,
        });
      } else {
        form.reset({
          name: "",
          region: "",
          district: "",
          address: "",
          phone: "",
          operatingHours: "",
          capacity: 100,
          specialInstructions: "",
          isActive: true,
        });
      }
    }
  }, [open, station, form]);

  const onSubmit = async (data: PickupStationFormValues) => {
    setLoading(true);
    try {
      const url = station
        ? `/api/admin/pickup-stations/${station._id}`
        : "/api/admin/pickup-stations";
      const res = await fetch(url, {
        method: station ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error("Failed to save pickup station");

      onSaved();
      onOpenChange(false);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {station ? "Edit Pickup Station" : "Add Pickup Station"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Station Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Accra Central Hub" className="h-10" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="region"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Region</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Greater Accra" className="h-10" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="district"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>District/City</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Accra Metro" className="h-10" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Address</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter the complete street address"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. 0244123456" className="h-10" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="operatingHours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Operating Hours</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Mon-Sat: 8am-6pm" className="h-10" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="capacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Capacity (Parcels)</FormLabel>
                    <FormControl>
                      <Input type="number" className="h-10" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 h-[72px]">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Active Status</FormLabel>
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

            <FormField
              control={form.control}
              name="specialInstructions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Special Instructions</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Instructions on how to find the station or pickup protocol"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save Pickup Station"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
