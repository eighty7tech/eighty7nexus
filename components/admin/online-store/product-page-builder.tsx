"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  ExternalLink,
  Loader2,
  RotateCcw,
  Palette,
  LayoutTemplate
} from "lucide-react";
import { AdminFormStickyHeader } from "@/components/admin/admin-form-sticky-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "@/components/ui/toast-notification";
import { SwitchRow } from "@/components/admin/online-store/builder-fields";
import {
  getDefaultProductPageSettings,
  normalizeProductPageSettings,
  type ProductPageSettings,
  type ProductPageStyleVariant,
  PRODUCT_PAGE_STYLE_VARIANTS
} from "@/lib/product-page-config";
import { cn } from "@/lib/utils";

interface ProductPageBuilderProps {
  locale: string;
}

type SettingsPayload = {
  success?: boolean;
  data?: { productPages?: unknown };
};

function cloneSettings(value: ProductPageSettings): ProductPageSettings {
  return JSON.parse(JSON.stringify(value)) as ProductPageSettings;
}

export function ProductPageBuilder({ locale }: ProductPageBuilderProps) {
  const t = useTranslations("admin.productPages");
  const tf = (key: string, fallback: string) => (t.has(key) ? t(key) : fallback);

  const [settings, setSettings] = useState<ProductPageSettings>(() =>
    getDefaultProductPageSettings()
  );
  const [initialSettings, setInitialSettings] = useState<ProductPageSettings>(() =>
    getDefaultProductPageSettings()
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const isDirty = JSON.stringify(settings) !== JSON.stringify(initialSettings);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch("/api/admin/settings", { method: "GET" });
        const payload = (await response.json()) as SettingsPayload;
        if (cancelled) return;
        const loaded = normalizeProductPageSettings(payload.data?.productPages);
        setSettings(loaded);
        setInitialSettings(cloneSettings(loaded));
      } catch {
        // Defaults stay in place
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const update = (mutate: (draft: ProductPageSettings) => void) => {
    setSettings((current) => {
      const next = cloneSettings(current);
      mutate(next);
      return next;
    });
  };

  const save = async () => {
    try {
      setIsSaving(true);
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          section: "productPages",
          data: normalizeProductPageSettings(settings),
        }),
      });
      const payload = (await response.json()) as SettingsPayload;
      if (!response.ok || payload.success !== true) {
        throw new Error("save failed");
      }
      const saved = normalizeProductPageSettings(payload.data?.productPages);
      setSettings(saved);
      setInitialSettings(cloneSettings(saved));
      toast.success(tf("toast.saved", "Product page settings saved"));
    } catch {
      toast.error(tf("toast.saveFailed", "Could not save product page settings"));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <AdminFormStickyHeader
        className="!mx-0 -mt-2 border-b-0 px-0 shadow-none md:px-0"
        title={tf("title", "Product Pages")}
        status={
          <Badge variant={isDirty ? "secondary" : "default"}>
            {isDirty ? tf("status.unsaved", "Unsaved changes") : tf("status.live", "Live")}
          </Badge>
        }
        actions={
          <>
            <Button
              type="button"
              variant="outline"
              disabled={!isDirty || isSaving}
              onClick={() => setSettings(cloneSettings(initialSettings))}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              {tf("reset", "Reset")}
            </Button>
            <Button variant="outline" asChild>
              <a href={`/${locale}/products`} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                {tf("preview", "Preview Store")}
              </a>
            </Button>
            <Button type="button" disabled={!isDirty || isSaving} onClick={() => void save()}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {tf("save", "Save")}
            </Button>
          </>
        }
      />

      <p className="text-sm text-muted-foreground">
        {tf("subtitle", "Configure how individual product details are displayed across your store.")}
      </p>

      {/* Templates */}
      <Card>
        <CardHeader>
          <CardTitle>{tf("layout.title", "Templates")}</CardTitle>
          <CardDescription>
            {tf("layout.description", "Select a layout structure for your product pages.")}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          {PRODUCT_PAGE_STYLE_VARIANTS.map((style) => (
            <StyleOptionCard
              key={style}
              variant={style}
              active={settings.layout.style === style}
              onSelect={() =>
                update((draft) => {
                  draft.layout.style = style;
                })
              }
            />
          ))}
        </CardContent>
      </Card>

      {/* Product Card Style */}
      <Card>
        <CardHeader>
          <CardTitle>Product Card Styles</CardTitle>
          <CardDescription>
            Choose how products are displayed on storefront grids and collections.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { id: "nexus-showcase", label: "Showcase" },
            { id: "nexus-editorial", label: "Editorial" },
            { id: "nexus-glassmorphic", label: "Glassmorphic" },
            { id: "nexus-minimal-luxe", label: "Minimal Luxe" },
          ].map((style) => (
            <button
              key={style.id}
              type="button"
              onClick={() =>
                update((draft) => {
                  draft.layout.cardStyle = style.id;
                })
              }
              className={`flex flex-col text-left rounded-xl border p-4 transition-all duration-200 ${
                settings.layout.cardStyle === style.id
                  ? "border-primary bg-primary/5 ring-1 ring-primary shadow-sm"
                  : "border-border/60 hover:border-border hover:bg-muted/30"
              }`}
            >
              <div className="flex items-center justify-between mb-2 w-full">
                <span className="font-semibold text-sm">{style.label}</span>
                {settings.layout.cardStyle === style.id && <div className="h-4 w-4 rounded-full bg-primary" />}
              </div>
            </button>
          ))}
        </CardContent>
      </Card>

      {/* Layout Settings */}
      <Card>
        <CardHeader>
          <CardTitle>{tf("options.title", "Layout Options")}</CardTitle>
          <CardDescription>
            {tf("options.description", "Additional layout toggles for the product pages.")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <SwitchRow
            label={tf("options.showMenu", "Show Storefront Navigation")}
            checked={settings.layout.showMenu}
            onChange={(value) =>
              update((draft) => {
                draft.layout.showMenu = value;
              })
            }
          />
          <div className="space-y-0.5">
            <SwitchRow
              label={tf("options.showMobileStickyBar", "Mobile Sticky Action Bar")}
              checked={settings.layout.showMobileStickyBar ?? true}
              onChange={(value) =>
                update((draft) => {
                  draft.layout.showMobileStickyBar = value;
                })
              }
            />
            <p className="text-[13px] text-muted-foreground mt-1 ml-1">
              {tf("options.showMobileStickyBarDesc", "Show a floating Add to Cart button at the bottom of the screen on mobile devices.")}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Note about Branding */}
      <Card>
        <CardContent className="flex flex-col gap-3 pt-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2">
            <Palette className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              {tf("brandNote", "Product pages use your store's universal header, footer and color palette automatically.")}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/${locale}/admin/settings/appearance`}>
                {tf("brandingLink", "Branding")}
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/${locale}/admin/online-store/theme`}>
                {tf("themeLink", "Theme settings")}
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StyleOptionCard({
  variant,
  active,
  onSelect,
}: {
  variant: ProductPageStyleVariant;
  active: boolean;
  onSelect: () => void;
}) {
  const titles: Record<ProductPageStyleVariant, string> = {
    standard: "Standard",
    gallery: "Gallery Focus",
    "sticky-sidebar": "Sticky Sidebar",
    "full-width": "Full Width",
    minimal: "Minimalist",
    dynamic: "Dynamic Interactive",
  };

  const descriptions: Record<ProductPageStyleVariant, string> = {
    standard: "Classic split layout with images on the left and details on the right.",
    gallery: "Large full-width image gallery above the fold.",
    "sticky-sidebar": "Product details stick to the screen as you scroll images.",
    "full-width": "Expansive layout pushing content to the edges.",
    minimal: "Clean, distraction-free view focusing heavily on typography.",
    dynamic: "Interactive layout featuring animations, hover styles, and engaging visual effects.",
  };

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={cn(
        "flex flex-col gap-2 rounded-lg border p-3 text-left transition-colors",
        active
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary/50 hover:bg-accent/40"
      )}
    >
      <span className="flex items-center justify-center h-24 overflow-hidden rounded-md border border-border/70 bg-muted/40">
        <LayoutTemplate className="h-8 w-8 text-muted-foreground/60" />
      </span>
      <span className="text-sm font-semibold text-foreground capitalize">{titles[variant]}</span>
      <span className="text-xs leading-relaxed text-muted-foreground">{descriptions[variant]}</span>
    </button>
  );
}
