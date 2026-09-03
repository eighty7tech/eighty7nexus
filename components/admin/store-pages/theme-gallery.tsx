"use client";

import Image from "next/image";
import { useState, type ReactNode } from "react";
import {
  CheckCircle2,
  Cpu,
  LayoutPanelTop,
  Loader2,
  Paintbrush,
  Palette,
  Save,
  ShoppingBag,
  SlidersHorizontal,
  X,
  type LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirmation-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import {
  UnderlineTabsList,
  UnderlineTabsTrigger,
} from "@/components/admin/underline-tabs";
import { toast } from "@/components/ui/toast-notification";
import { createTSafe, type TSafe } from "@/components/admin/online-store/t-safe";
import { apiClient, ApiClientError } from "@/lib/api/client";
import { toColorInputValue } from "@/lib/appearance-colors";
import {
  SLIDER_HEIGHTS,
  SLIDER_WIDTHS,
} from "@/lib/storefront/sections/slider-grids";
import {
  THEME_BUTTON_STYLES,
  THEME_ROUNDNESS_OPTIONS,
} from "@/lib/storefront/themes/registry";
import { cn } from "@/lib/utils";
import { themePreviewSrc } from "@/lib/storefront/themes/preview";
import type { ThemeManifest } from "@/lib/storefront/themes/types";

const THEME_ICONS: Record<string, LucideIcon> = {
  essential: ShoppingBag,
  electronics: Cpu,
  luxe: Palette,
};

/** Mirrors the activation API's `starter` modes — see its route doc. */
type StarterMode = "keep" | "draft" | "publish";

/**
 * The Themes page: two tabs — the manifest-driven theme gallery, and the
 * active theme's global settings (layout widths/heights plus the visual
 * styler). Settings are stored PER THEME, so activating another theme swaps
 * in that theme's own values and defaults. Content never lives here — these
 * are design options.
 */
export function ThemeGallery({
  manifests,
  activeThemeId,
  initialValues,
}: {
  manifests: (ThemeManifest & { hasStarter?: boolean })[];
  activeThemeId: string;
  initialValues: Record<string, unknown>;
}) {
  const t = useTranslations();
  const tSafe = createTSafe(t);
  const [activeId, setActiveId] = useState(activeThemeId);
  const [values, setValues] = useState(initialValues);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pendingTheme, setPendingTheme] = useState<string | null>(null);
  // Choosing a theme should visibly change the storefront — that is what the
  // act means to a merchant — so going live is the default. The layout it
  // replaces lands in version history, one restore away.
  const [starterMode, setStarterMode] = useState<StarterMode>("publish");
  const [activating, setActivating] = useState(false);

  const active = manifests.find((manifest) => manifest.id === activeId);

  const setValue = (key: string, value: unknown) => {
    setValues((current) => ({ ...current, [key]: value }));
    setDirty(true);
  };

  const activate = async (themeId: string, mode: StarterMode) => {
    setActivating(true);
    try {
      const result = await apiClient.post<{
        theme: string;
        values: Record<string, unknown>;
        seededTemplates: string[];
        draftedTemplates: string[];
        publishedTemplates: string[];
      }>("/api/admin/theme-settings/activate", {
        theme: themeId,
        starter: mode,
      });
      setActiveId(result.theme);
      // Each theme keeps its own settings — the panel now shows the new
      // theme's stored values (or its defaults on first activation).
      setValues(result.values);
      setDirty(false);
      toast.success(
        result.publishedTemplates.length > 0
          ? tSafe(
              "admin.themeSettings.activatedAndPublished",
              "Theme activated and its starter layout is live — open Customize to make it yours.",
            )
          : result.draftedTemplates.length > 0
            ? tSafe(
                "admin.themeSettings.activatedWithStarter",
                "Theme activated and its starter layout loaded into the home draft — review it in Customize, then publish.",
              )
            : tSafe(
                "admin.themeSettings.activated",
                "Theme activated — the storefront switched instantly and your pages are untouched.",
              ),
      );
    } catch (error) {
      toast.error(
        error instanceof ApiClientError
          ? error.message
          : tSafe("admin.themeSettings.saveFailed", "Saving failed"),
      );
    } finally {
      setActivating(false);
      setPendingTheme(null);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      const result = await apiClient.patch<{
        values: Record<string, unknown>;
      }>("/api/admin/theme-settings", { values });
      setValues(result.values);
      setDirty(false);
      toast.success(
        tSafe("admin.themeSettings.saved", "Theme settings saved"),
      );
    } catch (error) {
      toast.error(
        error instanceof ApiClientError
          ? error.message
          : tSafe("admin.themeSettings.saveFailed", "Saving failed"),
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="theme" className="gap-5">
        <UnderlineTabsList>
          <UnderlineTabsTrigger value="theme" icon={Palette}>
            {tSafe("admin.themeSettings.tabs.theme", "Select theme")}
          </UnderlineTabsTrigger>
          <UnderlineTabsTrigger value="settings" icon={SlidersHorizontal}>
            {tSafe("admin.themeSettings.tabs.settings", "Theme settings")}
          </UnderlineTabsTrigger>
        </UnderlineTabsList>

        <TabsContent value="theme">
          <div className="grid gap-4 lg:grid-cols-3">
            {manifests.map((manifest) => {
              const Icon = THEME_ICONS[manifest.id] ?? Palette;
              const isActive = manifest.id === activeId;
              const isActivatable = !isActive && manifest.status === "stable";
              return (
                <Card
                  key={manifest.id}
                  className={cn(
                    // h-full + the mt-auto footer below keep every card's action
                    // button on the same baseline, whatever the description runs to.
                    "h-full border-border/70 bg-card/95 transition-colors",
                    isActive && "border-primary/50 shadow-sm",
                  )}
                >
                  <CardHeader className="space-y-4">
                    <div
                      className={cn(
                        "relative aspect-[4/3] overflow-hidden rounded-xl bg-gradient-to-br p-4 text-white",
                        manifest.preview && "border border-border/60",
                        manifest.accent,
                      )}
                    >
                      {manifest.preview ? (
                        // Real storefront capture of the template's own starter.
                        <Image
                          src={themePreviewSrc(manifest, "card")!}
                          alt={manifest.name}
                          fill
                          unoptimized
                          sizes="(min-width: 1024px) 30vw, 100vw"
                          className="object-cover object-top"
                        />
                      ) : null}
                      <div className="relative flex items-start justify-between">
                        <div
                          className={cn(
                            "rounded-lg p-2 backdrop-blur-sm",
                            manifest.preview
                              ? "bg-black/45 text-white"
                              : "bg-white/20",
                          )}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <Badge
                          className={cn(
                            "text-white",
                            manifest.preview
                              ? "bg-black/45 backdrop-blur-sm hover:bg-black/45"
                              : "bg-white/20 hover:bg-white/20",
                          )}
                        >
                          {isActive
                            ? tSafe(
                                "admin.onlineStoreThemePage.currentTheme",
                                "Current Theme",
                              )
                            : manifest.status === "stable"
                              ? tSafe(
                                  "admin.onlineStoreThemePage.available",
                                  "Available",
                                )
                              : tSafe(
                                  "admin.onlineStoreThemePage.comingSoon",
                                  "Coming Soon",
                                )}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {tSafe(
                          `admin.onlineStoreThemePage.themes.${manifest.id}.name`,
                          manifest.name,
                        )}
                        {isActive && (
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                        )}
                      </CardTitle>
                      <CardDescription className="mt-1 text-sm">
                        {tSafe(
                          `admin.onlineStoreThemePage.themes.${manifest.id}.description`,
                          manifest.description,
                        )}
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="mt-auto">
                    {isActive ? (
                      <Button disabled className="w-full">
                        {tSafe("admin.onlineStoreThemePage.active", "Active")}
                      </Button>
                    ) : isActivatable ? (
                      <Button
                        variant="outline"
                        className="w-full"
                        disabled={activating}
                        onClick={() => setPendingTheme(manifest.id)}
                      >
                        {tSafe(
                          "admin.onlineStoreThemePage.activate",
                          "Use this theme",
                        )}
                      </Button>
                    ) : (
                      <Button variant="outline" disabled className="w-full">
                        {tSafe(
                          "admin.onlineStoreThemePage.comingSoon",
                          "Coming Soon",
                        )}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          {active ? (
            <ThemeSettingsPanel
              activeName={tSafe(
                `admin.onlineStoreThemePage.themes.${active.id}.name`,
                active.name,
              )}
              values={values}
              setValue={setValue}
              tSafe={tSafe}
            />
          ) : null}
          <Button
            type="button"
            onClick={() => void save()}
            disabled={!dirty || saving}
            className="gap-1.5"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {tSafe("admin.themeSettings.save", "Save settings")}
          </Button>
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={pendingTheme !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPendingTheme(null);
            setStarterMode("publish");
          }
        }}
        title={tSafe(
          "admin.themeSettings.activateTitle",
          "Switch the storefront theme?",
        )}
        description={tSafe(
          "admin.themeSettings.activateDescription",
          "Each theme keeps its own settings, so switching back later loses nothing. Choose below what happens to your page layouts.",
        )}
        confirmText={tSafe("admin.onlineStoreThemePage.activate", "Use this theme")}
        loading={activating}
        onConfirm={() => {
          if (pendingTheme) void activate(pendingTheme, starterMode);
        }}
      >
        {manifests.find((manifest) => manifest.id === pendingTheme)
          ?.hasStarter ? (
          <div className="space-y-2 rounded-md border border-border bg-muted/30 p-3">
            {(
              [
                {
                  value: "publish",
                  label: tSafe(
                    "admin.themeSettings.starterPublish",
                    "Use the theme's starter layout (recommended)",
                  ),
                  hint: tSafe(
                    "admin.themeSettings.starterPublishHint",
                    "Your storefront changes right away, with the theme's sections bound to your own collections and products. Your previous layout is kept in Version history.",
                  ),
                },
                {
                  value: "draft",
                  label: tSafe(
                    "admin.themeSettings.starterDraft",
                    "Load the starter into my home draft only",
                  ),
                  hint: tSafe(
                    "admin.themeSettings.starterDraftHint",
                    "Shoppers see nothing until you publish it from Customize.",
                  ),
                },
                {
                  value: "keep",
                  label: tSafe(
                    "admin.themeSettings.starterKeep",
                    "Keep my current layout",
                  ),
                  hint: tSafe(
                    "admin.themeSettings.starterKeepHint",
                    "Only the design changes. All pages stay as they are.",
                  ),
                },
              ] as const
            ).map((option) => (
              <label
                key={option.value}
                className="flex cursor-pointer items-start gap-2.5"
              >
                <input
                  type="radio"
                  name="theme-starter"
                  className="mt-1 accent-[var(--primary)]"
                  checked={starterMode === option.value}
                  onChange={() => setStarterMode(option.value)}
                />
                <span className="min-w-0">
                  <span className="block text-sm font-medium">
                    {option.label}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {option.hint}
                  </span>
                </span>
              </label>
            ))}
          </div>
        ) : null}
      </ConfirmDialog>
    </div>
  );
}

/**
 * The global theme settings: layout (container width, slider width/height
 * styles — the Figma sheet, as diagram cards) followed by the visual styler
 * (background, accent, roundness, button shape).
 */
function ThemeSettingsPanel({
  activeName,
  values,
  setValue,
  tSafe,
}: {
  activeName: string;
  values: Record<string, unknown>;
  setValue: (key: string, value: unknown) => void;
  tSafe: TSafe;
}) {
  const optionLabel = (key: string, fallback: string) =>
    tSafe(`admin.storeBuilder.options.${key}`, fallback);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {tSafe(
          "admin.themeSettings.perThemeHint",
          "Saved per theme — switching themes switches to that theme's own settings.",
        )}{" "}
        <span className="font-medium text-foreground">{activeName}</span>
      </p>

      <Card className="border-border/70">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <LayoutPanelTop className="h-4 w-4 text-primary" />
            {tSafe("admin.themeSettings.layoutTitle", "Layout")}
          </CardTitle>
          <CardDescription>
            {tSafe(
              "admin.themeSettings.layoutSubtitle",
              "Global widths and heights. Hero and banner sections set to “Theme default” follow these.",
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <OptionCardGroup
            label={tSafe("admin.storeBuilder.fields.containerWidth", "Container width")}
            value={String(values.containerWidth ?? "fixed")}
            onChange={(value) => setValue("containerWidth", value)}
            columns="grid-cols-2 sm:grid-cols-3 lg:grid-cols-5"
            options={[
              { key: "fixed", label: optionLabel("fixed", "Fixed") },
              { key: "full", label: optionLabel("full", "Full width") },
            ].map((option) => ({
              ...option,
              diagram: <ContainerDiagram kind={option.key} />,
            }))}
          />
          <OptionCardGroup
            label={tSafe("admin.themeSettings.sliderWidth", "Slider width style")}
            value={String(values.sliderWidth ?? "fixed")}
            onChange={(value) => setValue("sliderWidth", value)}
            columns="grid-cols-2 sm:grid-cols-3 lg:grid-cols-5"
            options={SLIDER_WIDTHS.map((width) => ({
              key: width.key,
              label: optionLabel(width.key, width.label),
              diagram: <SliderWidthDiagram kind={width.key} />,
            }))}
          />
          <OptionCardGroup
            label={tSafe("admin.themeSettings.sliderHeight", "Slider height")}
            value={String(values.sliderHeight ?? "half")}
            onChange={(value) => setValue("sliderHeight", value)}
            columns="grid-cols-2 sm:grid-cols-4 lg:grid-cols-5"
            options={SLIDER_HEIGHTS.map((height) => ({
              key: height.key,
              label: optionLabel(height.key, height.label),
              diagram: <SliderHeightDiagram kind={height.key} />,
            }))}
          />
        </CardContent>
      </Card>

      <Card className="border-border/70">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Paintbrush className="h-4 w-4 text-primary" />
            {tSafe("admin.themeSettings.visualTitle", "Visual style")}
          </CardTitle>
          <CardDescription>
            {tSafe(
              "admin.themeSettings.visualSubtitle",
              "Storefront colors and shapes. Empty colors keep the theme and branding defaults.",
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <ThemeColorField
              label={tSafe(
                "admin.themeSettings.backgroundColor",
                "Background color",
              )}
              hint={tSafe(
                "admin.themeSettings.backgroundColorHint",
                "The storefront's page background (light mode).",
              )}
              value={String(values.backgroundColor ?? "")}
              onChange={(value) => setValue("backgroundColor", value)}
              tSafe={tSafe}
            />
            <ThemeColorField
              label={tSafe("admin.themeSettings.accentColor", "Accent color")}
              hint={tSafe(
                "admin.themeSettings.accentColorHint",
                "Action buttons, links, and highlights on the storefront.",
              )}
              value={String(values.accentColor ?? "")}
              onChange={(value) => setValue("accentColor", value)}
              tSafe={tSafe}
            />
          </div>

          <OptionCardGroup
            label={tSafe("admin.themeSettings.cardRoundness", "Card and border roundness")}
            value={String(values.cardRoundness ?? "theme")}
            onChange={(value) => setValue("cardRoundness", value)}
            columns="grid-cols-3 sm:grid-cols-6"
            options={THEME_ROUNDNESS_OPTIONS.map((key) => ({
              key,
              label:
                key === "theme"
                  ? optionLabel("theme", "Theme default")
                  : tSafe(
                      `admin.themeSettings.roundness.${key}`,
                      { none: "None", small: "Small", medium: "Medium", large: "Large", extra: "Extra" }[key] ?? key,
                    ),
              diagram: <RoundnessDiagram kind={key} />,
            }))}
          />

          <OptionCardGroup
            label={tSafe("admin.themeSettings.buttonStyle", "Button style")}
            value={String(values.buttonStyle ?? "theme")}
            onChange={(value) => setValue("buttonStyle", value)}
            columns="grid-cols-2 sm:grid-cols-4 lg:grid-cols-6"
            options={THEME_BUTTON_STYLES.map((key) => ({
              key,
              label:
                key === "theme"
                  ? optionLabel("theme", "Theme default")
                  : tSafe(
                      `admin.themeSettings.buttons.${key}`,
                      { rounded: "Rounded", pill: "Pill", square: "Square" }[key] ?? key,
                    ),
              diagram: <ButtonStyleDiagram kind={key} />,
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function OptionCardGroup({
  label,
  value,
  onChange,
  options,
  columns,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { key: string; label: string; diagram: ReactNode }[];
  columns: string;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div role="radiogroup" className={cn("grid gap-2.5", columns)}>
        {options.map((option) => {
          const selected = option.key === value;
          return (
            <button
              key={option.key}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(option.key)}
              className={cn(
                "rounded-lg border p-2 text-left transition-colors",
                selected
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "border-border hover:border-foreground/30",
              )}
            >
              {option.diagram}
              <p className="mt-1.5 truncate text-xs font-medium">
                {option.label}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Wireframe diagrams (the Figma width/height sheets) ---------- */

/** Mini browser frame: a header strip plus whatever the variant places. */
function DiagramFrame({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-20 w-full flex-col overflow-hidden rounded-md border border-border/70 bg-muted/30">
      <div className="flex shrink-0 items-center gap-1 px-1.5 py-1">
        <span className="h-1 w-3 rounded-sm bg-foreground/60" />
        <span className="mx-auto flex gap-0.5">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className="h-0.5 w-2 rounded-sm bg-foreground/30" />
          ))}
        </span>
        <span className="h-1 w-2 rounded-sm bg-foreground/40" />
      </div>
      {children}
    </div>
  );
}

function ContainerDiagram({ kind }: { kind: string }) {
  const contained = kind === "fixed";
  return (
    <DiagramFrame>
      <div className={cn("flex-1", contained ? "px-3" : "px-0")}>
        <div
          className={cn(
            "h-8 bg-foreground/25",
            contained ? "rounded-sm" : "rounded-none",
          )}
        />
        <div className={cn("mt-1 flex gap-1", contained ? "" : "px-1")}>
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className="h-2.5 flex-1 rounded-[2px] bg-foreground/15" />
          ))}
        </div>
      </div>
    </DiagramFrame>
  );
}

function SliderWidthDiagram({ kind }: { kind: string }) {
  const padded = kind === "fixed" || kind === "fullPadding" || kind === "fullHeightPadding";
  const tall = kind === "fullHeight" || kind === "fullHeightPadding";
  const inset = kind === "fixed" ? "px-3" : padded ? "px-1" : "px-0";
  return (
    <DiagramFrame>
      <div className={cn("flex flex-1 flex-col", inset, tall ? "pb-0" : "pb-2")}>
        <div
          className={cn(
            "bg-foreground/25",
            padded ? "rounded-sm" : "rounded-none",
            tall ? "flex-1" : "h-8",
          )}
        />
      </div>
    </DiagramFrame>
  );
}

function SliderHeightDiagram({ kind }: { kind: string }) {
  const heights: Record<string, string> = {
    full: "h-full",
    fourFifths: "h-4/5",
    threeQuarters: "h-3/4",
    threeFifths: "h-3/5",
    half: "h-1/2",
    quarter: "h-1/4",
  };
  return (
    <DiagramFrame>
      <div className="flex-1">
        <div className={cn("w-full bg-foreground/25", heights[kind] ?? "h-1/2")} />
      </div>
    </DiagramFrame>
  );
}

function RoundnessDiagram({ kind }: { kind: string }) {
  const radii: Record<string, string> = {
    theme: "rounded-[var(--radius)] border-dashed",
    none: "rounded-none",
    small: "rounded",
    medium: "rounded-lg",
    large: "rounded-xl",
    extra: "rounded-3xl",
  };
  return (
    <div className="grid h-14 place-items-center rounded-md border border-border/70 bg-muted/30">
      <div
        className={cn(
          "h-9 w-12 border-2 border-foreground/40 bg-foreground/10",
          radii[kind] ?? "rounded",
        )}
      />
    </div>
  );
}

function ButtonStyleDiagram({ kind }: { kind: string }) {
  const radii: Record<string, string> = {
    theme: "rounded-md border border-dashed border-primary-foreground/40",
    rounded: "rounded-lg",
    pill: "rounded-full",
    square: "rounded-[3px]",
  };
  return (
    <div className="grid h-14 place-items-center rounded-md border border-border/70 bg-muted/30">
      <span
        className={cn(
          "flex h-6 w-14 items-center justify-center bg-primary",
          radii[kind] ?? "rounded-md",
        )}
      >
        <span className="h-1 w-7 rounded-sm bg-primary-foreground/85" />
      </span>
    </div>
  );
}

/** Hex color field that treats empty as "theme default" and can be cleared. */
function ThemeColorField({
  label,
  hint,
  value,
  onChange,
  tSafe,
}: {
  label: string;
  hint: string;
  value: string;
  onChange: (value: string) => void;
  tSafe: TSafe;
}) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Input
          value={value}
          placeholder={tSafe(
            "admin.themeSettings.colorPlaceholder",
            "Empty = theme default",
          )}
          onChange={(event) => onChange(event.target.value)}
        />
        <Input
          type="color"
          value={toColorInputValue(value, "#888888")}
          onChange={(event) => onChange(event.target.value)}
          className="h-9 w-12 shrink-0 p-1"
          aria-label={`${label} picker`}
        />
        {value ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => onChange("")}
            aria-label={tSafe("admin.themeSettings.clearColor", "Clear color")}
            className="shrink-0 text-muted-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        ) : null}
      </div>
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}
