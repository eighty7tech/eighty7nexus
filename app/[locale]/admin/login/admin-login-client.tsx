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

const AdminLoginSchema = (t: any) => z.object({
  email: z.string().email(t("admin.login.invalidEmail")),
  password: z.string().min(1, t("admin.login.passwordRequired")),
});

type AdminLoginInput = z.infer<ReturnType<typeof AdminLoginSchema>>;

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
    resolver: zodResolver(AdminLoginSchema(t)),
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
        setError(res.error.message || t("admin.login.invalidCredentials"));
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
        setError(t("admin.login.unauthorized"));
        setIsLoading(false);
        return;
      }

      // Success
      toast.success(t("admin.login.welcomeBack"));
      router.push("/en/admin/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err?.message || t("admin.login.unexpectedError"));
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
          <CardTitle className="text-2xl font-bold tracking-tight">{t("admin.login.title")}</CardTitle>
          <CardDescription>
            {t("admin.login.description")}
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
                    <FormLabel>{t("admin.login.emailLabel")}</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder={t("admin.login.emailPlaceholder")}
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
                    <FormLabel>{t("admin.login.passwordLabel")}</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder={t("admin.login.passwordPlaceholder")}
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
                    {t("admin.login.verifying")}
                  </>
                ) : (
                  t("admin.login.submitButton")
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="pt-2 pb-6 flex justify-center border-t mt-4">
          <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-4">
            <ShieldCheck className="h-3.5 w-3.5" /> {t("admin.login.securedBy")}
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
