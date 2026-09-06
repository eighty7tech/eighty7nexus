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
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4 relative overflow-hidden">
      {/* Dark Secure Background */}
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-red-900/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-zinc-800/40 rounded-full blur-3xl pointer-events-none" />

      <Card className="w-full max-w-md bg-zinc-900/90 border-zinc-800 text-zinc-100 shadow-2xl relative z-10 backdrop-blur-xl">
        <CardHeader className="space-y-3 pb-6 text-center">
          <div className="flex justify-center mb-2">
            {logoUrl ? (
              <img src={logoUrl} alt={storeName} className="h-10 w-auto object-contain brightness-0 invert" />
            ) : (
              <div className="h-12 w-12 rounded-xl bg-zinc-800 flex items-center justify-center border border-zinc-700 shadow-inner">
                <ShieldCheck className="h-6 w-6 text-zinc-300" />
              </div>
            )}
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Admin Portal</CardTitle>
          <CardDescription className="text-zinc-400">
            Sign in to access the secure administrative dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-6 p-3 rounded-md bg-red-950/50 border border-red-900/50 flex items-start gap-2 text-sm text-red-200">
              <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-red-400" />
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
                    <FormLabel className="text-zinc-300">Admin Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="admin@example.com"
                        className="bg-zinc-950/50 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-zinc-600"
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-zinc-300">Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        className="bg-zinc-950/50 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-zinc-600"
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full bg-zinc-100 text-zinc-900 hover:bg-white font-semibold"
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
        <CardFooter className="pt-2 pb-6 flex justify-center border-t border-zinc-800/50 mt-4">
          <p className="text-xs text-zinc-500 flex items-center gap-1.5 mt-4">
            <ShieldCheck className="h-3.5 w-3.5" /> Secured by 256-bit encryption
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
