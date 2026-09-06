"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, ShieldAlert, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { authClient, getSession, signOut } from "@/lib/auth-client";
import { USER_ROLES } from "@/config/app.config";

const AdminLoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type AdminLoginInput = z.infer<typeof AdminLoginSchema>;

interface AdminLoginClientProps {
  storeName: string;
  logoUrl?: string;
}

export function AdminLoginClient({ storeName, logoUrl }: AdminLoginClientProps) {
  const t = useTranslations();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<AdminLoginInput>({
    resolver: zodResolver(AdminLoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: AdminLoginInput) => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await authClient.signIn.email({
        email: data.email,
        password: data.password,
      });

      if (res?.error) {
        setError(res.error.message || "Invalid credentials");
        setIsLoading(false);
        return;
      }

      // Strictly validate Admin Role
      const sessionResult = await getSession();
      const user = sessionResult.data?.user as any;
      const roles: string[] = user?.roles || [];
      const role: string = user?.role || "";

      if (!roles.includes(USER_ROLES.ADMIN) && role !== USER_ROLES.ADMIN) {
        // Not an admin. Sign them out forcefully.
        await signOut();
        setError("Unauthorized: This portal is strictly for administrators.");
        setIsLoading(false);
        return;
      }

      // Success
      toast.success("Welcome back, Admin");
      router.push("/en/admin/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-sm">
        <CardHeader className="space-y-3 pb-6 text-center">
          <div className="flex justify-center mb-2">
            {logoUrl ? (
              <img src={logoUrl} alt={storeName} className="h-10 w-auto object-contain" />
            ) : (
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <ShieldCheck className="h-6 w-6 text-primary" />
              </div>
            )}
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Admin Portal</CardTitle>
          <CardDescription>
            Sign in to access the secure administrative dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-6 p-3 rounded-md bg-destructive/15 border border-destructive/20 flex items-start gap-2 text-sm text-destructive">
              <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-destructive" />
              <p>{error}</p>
            </div>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Admin Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="admin@example.com"
                        disabled={isLoading}
                        {...field}
                      />
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
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full font-semibold"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying Identity...
                  </>
                ) : (
                  "Access Dashboard"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="pt-2 pb-6 flex justify-center border-t mt-4">
          <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-4">
            <ShieldCheck className="h-3.5 w-3.5" /> Secured by 256-bit encryption
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
