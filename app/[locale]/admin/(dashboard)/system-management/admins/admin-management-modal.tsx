"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { ADMIN_PERMISSIONS } from "@/config/permissions.config";
import { upsertAdminAction } from "@/app/actions/admin-management-actions";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

const AdminFormSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email required"),
  password: z.string().optional(),
  department: z.string().default("Operations"),
  isSuperAdmin: z.boolean().default(false),
  permissions: z.array(z.string()).default([]),
});

type AdminFormValues = z.infer<typeof AdminFormSchema>;

interface AdminManagementModalProps {
  children: React.ReactNode;
  admin?: any;
  onSaved: () => void;
}

export function AdminManagementModal({ children, admin, onSaved }: AdminManagementModalProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const isEdit = !!admin;

  const form = useForm({
    resolver: zodResolver(AdminFormSchema),
    defaultValues: {
      name: admin?.name || "",
      email: admin?.email || "",
      password: "",
      department: admin?.department || "Operations",
      isSuperAdmin: admin?.isSuperAdmin || false,
      permissions: admin?.permissions || [],
    },
  });

  const onSubmit = (data: AdminFormValues) => {
    if (!isEdit && !data.password) {
      form.setError("password", { message: "Password is required for new admins" });
      return;
    }

    startTransition(async () => {
      try {
        const payload = {
          ...data,
          id: admin?.id,
        };
        const res = await upsertAdminAction(payload);
        if (res.success) {
          toast.success(res.message);
          setOpen(false);
          form.reset();
          onSaved();
        }
      } catch (err: any) {
        toast.error(err.message || "Failed to save admin");
      }
    });
  };

  const isSuperAdmin = form.watch("isSuperAdmin");
  const selectedPermissions = form.watch("permissions") || [];

  const togglePermission = (val: string) => {
    if (selectedPermissions.includes(val)) {
      form.setValue("permissions", selectedPermissions.filter((p) => p !== val), { shouldDirty: true });
    } else {
      form.setValue("permissions", [...selectedPermissions, val], { shouldDirty: true });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>{isEdit ? "Edit Administrator" : "Create Administrator"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update admin details and permissions." : "Create a new admin account and assign roles."}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6 py-4">
          <Form {...form}>
            <form id="admin-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" disabled={isPending} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="john@example.com" disabled={isPending || isEdit} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Finance, Support" disabled={isPending} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{isEdit ? "Reset Password (Optional)" : "Password"}</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" disabled={isPending} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="border rounded-md p-4 bg-muted/20">
                <FormField
                  control={form.control}
                  name="isSuperAdmin"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Super Administrator</FormLabel>
                        <FormDescription>
                          Grants unrestricted access to all system features and settings.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isPending}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              {!isSuperAdmin && (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-1">Specific Permissions</h4>
                    <p className="text-sm text-muted-foreground mb-3">Select the features this admin can manage.</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {Object.entries(ADMIN_PERMISSIONS).map(([key, val]) => {
                      const isSelected = selectedPermissions.includes(val);
                      return (
                        <div
                          key={key}
                          onClick={() => {
                            if (!isPending) togglePermission(val);
                          }}
                          className={`flex items-center gap-2 p-3 border rounded-md cursor-pointer transition-colors ${
                            isSelected ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                          }`}
                        >
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${isSelected ? "border-primary bg-primary" : "border-muted-foreground"}`}>
                            {isSelected && <div className="w-2 h-2 rounded-full bg-primary-foreground" />}
                          </div>
                          <span className="text-xs font-medium leading-tight">
                            {key.replace(/_/g, ' ')}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </form>
          </Form>
        </ScrollArea>

        <div className="border-t p-4 flex justify-end gap-2 bg-muted/20">
          <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" form="admin-form" disabled={isPending}>
            {isPending ? "Saving..." : isEdit ? "Save Changes" : "Create Admin"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
