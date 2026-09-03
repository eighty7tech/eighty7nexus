"use client";

import {
  Moon,
  Contrast,
  AlignLeft,
  PanelLeftClose,
  Info,
  RefreshCw,
  ImageIcon,
  Palette,
  LayoutGrid,
  Maximize2,
  Layers,
  Minimize2,
  Terminal,
  Check,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MediaUploader, type UploadedMedia } from "@/components/ui/media-uploader";
import { ImageUploadField } from "@/components/admin/settings/fields/image-upload-field";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { TypographySettingsCard } from "./typography-settings-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Settings } from "@/components/admin/settings/types";
import { presetColors, type PresetColor } from "@/stores/app-settings";
import { normalizeColorToHex, colorsEqual } from "@/lib/appearance-colors";
import { normalizeThemeMode } from "@/config/branding.config";
import { useTheme, type Theme } from "@/providers/theme-provider";
import {
  NavColorCard,
  PresetColorCard,
  CustomPresetCard,
  AddCurrentPresetCard,
  ColorField,
  ColorSystemPreview,
  SectionContainer,
  SettingCard,
} from "@/components/admin/appearance-settings-ui";
import { BrandAssetFields } from "@/components/admin/settings/general/brand-asset-fields";
import { buttonClassFor } from "@/lib/admin-header-button-style";
import { DASHBOARD_LAYOUT_OPTIONS, type HeaderButtonStyle } from "@/components/admin/dashboard/dashboard-layout-types";
import { SettingsTabHeader } from "./settings-tab-header";
import { StickySaveFooter } from "./sticky-save-footer";

function generatePresetId(): string {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return `cp_${crypto.randomUUID()}`;
    }
  } catch {
    // fall through to the non-crypto id below
  }
  return `cp_${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;
}

export function AppearanceSettingsTab(props: {
  settings: Settings;
  isSaving: boolean;
  isDirty: boolean;
  updateNestedField: (path: string, value: unknown) => void;
  onSave: () => void | Promise<unknown>;
}) {
  const t = useTranslations();
  const { setTheme } = useTheme();

  // Optional chaining + fallbacks throughout: legacy documents (set up on an
  // older schema) may be missing sub-objects or fields entirely.
  const appearance = props.settings?.appearance;
  const general = props.settings?.general;

  const primaryColor = appearance?.primaryColor ?? "";
  const secondaryColor = appearance?.secondaryColor ?? "";
  const accentColor = appearance?.accentColor ?? "";
  const customPresets = appearance?.customPresets ?? [];

  const handleThemeChange = (nextTheme: Theme) => {
    props.updateNestedField("appearance.theme", nextTheme);
    setTheme(nextTheme);
  };

  const applyColors = (primary: string, secondary: string, accent: string) => {
    props.updateNestedField("appearance.primaryColor", primary);
    props.updateNestedField("appearance.secondaryColor", secondary);
    props.updateNestedField("appearance.accentColor", accent);
  };

  const applyBuiltInPreset = (key: PresetColor) => {
    const preset = presetColors[key];
    if (!preset) return;
    applyColors(preset.hex, preset.secondaryHex, preset.accentHex);
    props.updateNestedField("appearance.presetColor", key);
  };

  const handleColorChange = (path: string) => (raw: string) => {
    // Store raw keystrokes so half-typed values aren't fought by the controlled
    // input; the field only *applies* once it parses to a valid color.
    props.updateNestedField(path, raw);
  };

  const handleColorCommit = (path: string) => (raw: string) => {
    // On blur, fold rgb()/rgba() and shorthand hex down to a canonical hex so
    // the stored value is always something the color pipeline understands.
    const hex = normalizeColorToHex(raw);
    if (hex && hex !== raw) props.updateNestedField(path, hex);
  };

  const tripleMatches = (primary?: string, secondary?: string, accent?: string) =>
    colorsEqual(primaryColor, primary) &&
    colorsEqual(secondaryColor, secondary) &&
    colorsEqual(accentColor, accent);

  const activeBuiltInKey = (
    Object.keys(presetColors) as PresetColor[]
  ).find((key) => {
    const preset = presetColors[key];
    return tripleMatches(preset.hex, preset.secondaryHex, preset.accentHex);
  });

  const activeCustomId = customPresets.find((preset) =>
    tripleMatches(
      preset?.primaryColor,
      preset?.secondaryColor,
      preset?.accentColor,
    ),
  )?.id;

  const allColorsValid = Boolean(
    normalizeColorToHex(primaryColor) &&
      normalizeColorToHex(secondaryColor) &&
      normalizeColorToHex(accentColor),
  );
  const isCurrentUnsaved =
    allColorsValid && !activeBuiltInKey && !activeCustomId;

  const addCurrentAsPreset = () => {
    const primary = normalizeColorToHex(primaryColor);
    const secondary = normalizeColorToHex(secondaryColor);
    const accent = normalizeColorToHex(accentColor);
    if (!primary || !secondary || !accent) return;
    props.updateNestedField("appearance.customPresets", [
      ...customPresets,
      {
        id: generatePresetId(),
        name: `Custom ${customPresets.length + 1}`,
        primaryColor: primary,
        secondaryColor: secondary,
        accentColor: accent,
      },
    ]);
  };

  const removeCustomPreset = (id: string) => {
    props.updateNestedField(
      "appearance.customPresets",
      customPresets.filter((preset) => preset?.id !== id),
    );
  };



  return (
    <div className="space-y-4">
      <SettingsTabHeader
        title={t("admin.settings.appearance.title")}
        description={t("admin.settings.appearance.description")}
      />

      {/* Brand assets — logos + favicon (stored under general.* for backward
          compatibility with every storefront/admin consumer that reads them). */}
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <ImageIcon className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">Brand Assets</h3>
              <p className="text-xs text-muted-foreground">
                Logos, favicon and app icon used across your storefront and
                dashboard
              </p>
            </div>
          </div>
          <BrandAssetFields
            general={general}
            updateNestedField={props.updateNestedField}
          />

          <div className="pt-6 mt-6 border-t border-border">
            <div className="mb-4">
              <h4 className="text-sm font-semibold">Admin Header Button Style</h4>
              <p className="text-xs text-muted-foreground mt-1">
                Choose the visual style for action buttons (POS, Multi-Branch, Visit Website) in the admin header.
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-4">
              {(["default", "capsule", "cyber", "glass", "luxe"] as HeaderButtonStyle[]).map(
                (style) => {
                  const isActive = (appearance?.headerButtonStyle || "capsule") === style;
                  
                  return (
                    <button
                      key={style}
                      type="button"
                      onClick={() => props.updateNestedField("appearance.headerButtonStyle", style)}
                      className={cn(
                        "relative flex h-24 w-32 flex-col items-center justify-center gap-3 rounded-xl border-2 transition-all hover:bg-muted/50",
                        isActive
                          ? "border-[#77CDCC] bg-[#77CDCC]/5 shadow-sm"
                          : "border-border/60 bg-card hover:border-[#77CDCC]/40",
                        style === "cyber" && isActive && "bg-[#001a45] text-white border-[#77CDCC]",
                        style === "cyber" && !isActive && "bg-[#000d24] text-white border-border/60",
                        style === "glass" && "bg-slate-50 dark:bg-slate-900",
                      )}
                    >
                      {/* Live Preview of Button */}
                      <div className={cn("pointer-events-none px-3 py-1.5 text-[10px] font-semibold whitespace-nowrap", buttonClassFor(style, "secondary"))}>
                        Preview
                      </div>
                      <span className="text-[11px] font-medium capitalize mt-1">
                        {style}
                      </span>
                    </button>
                  );
                }
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Colors — inputs, theme and presets kept together so the palette that is
          active and the swatches that set it read as one control. */}
      <Card>
        <CardContent className="space-y-6 pt-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Palette className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">
                {t("admin.settings.appearance.color")}
              </h3>
              <p className="text-xs text-muted-foreground">
                Pick a preset or set your own with the color picker, hex or rgb()
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
            <ColorField
              id="primaryColor"
              label={t("admin.settings.appearance.primaryColor")}
              value={primaryColor}
              onChange={handleColorChange("appearance.primaryColor")}
              onCommit={handleColorCommit("appearance.primaryColor")}
            />
            <ColorField
              id="secondaryColor"
              label={t("admin.settings.appearance.secondaryColor")}
              value={secondaryColor}
              onChange={handleColorChange("appearance.secondaryColor")}
              onCommit={handleColorCommit("appearance.secondaryColor")}
            />
            <ColorField
              id="accentColor"
              label={t("admin.settings.appearance.accentColor")}
              value={accentColor}
              onChange={handleColorChange("appearance.accentColor")}
              onCommit={handleColorCommit("appearance.accentColor")}
            />
            <div className="space-y-2">
              <Label>{t("admin.settings.appearance.theme")}</Label>
              {/* Light/dark only. "Follow the OS" is intentionally not offered:
                  the store renders light by default regardless of the visitor's
                  `prefers-color-scheme`. Legacy documents holding "system" are
                  normalized to light here too. */}
              <Select
                value={normalizeThemeMode(appearance?.theme)}
                onValueChange={(value) => handleThemeChange(value as Theme)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">
                    {t("admin.settings.appearance.themes.light")}
                  </SelectItem>
                  <SelectItem value="dark">
                    {t("admin.settings.appearance.themes.dark")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <ColorSystemPreview
            primary={normalizeColorToHex(primaryColor) ?? undefined}
            secondary={normalizeColorToHex(secondaryColor) ?? undefined}
            accent={normalizeColorToHex(accentColor) ?? undefined}
          />

          <SectionContainer
            label={t("admin.settings.appearance.presets")}
            icon={<RefreshCw className="h-2.5 w-2.5" />}
          >
            <div className="grid grid-cols-3 gap-2.5 md:grid-cols-6">
              {(Object.keys(presetColors) as PresetColor[]).map((key) => {
                const preset = presetColors[key];
                return (
                  <PresetColorCard
                    key={key}
                    color={preset.primary}
                    isActive={activeBuiltInKey === key}
                    onClick={() => applyBuiltInPreset(key)}
                  />
                );
              })}

              {customPresets.map((preset) =>
                preset?.id ? (
                  <CustomPresetCard
                    key={preset.id}
                    color={preset.primaryColor || "#000000"}
                    name={preset.name}
                    isActive={activeCustomId === preset.id}
                    onClick={() =>
                      applyColors(
                        preset.primaryColor,
                        preset.secondaryColor,
                        preset.accentColor,
                      )
                    }
                    onRemove={() => removeCustomPreset(preset.id)}
                  />
                ) : null,
              )}

              {isCurrentUnsaved ? (
                <AddCurrentPresetCard
                  color={normalizeColorToHex(primaryColor) ?? "#000000"}
                  onSave={addCurrentAsPreset}
                />
              ) : null}
            </div>
          </SectionContainer>
        </CardContent>
      </Card>

      {/* Layout & navigation toggles */}
      <Card>
        <CardContent className="space-y-6 pt-6">
          <div className="grid grid-cols-2 gap-3">
            <SettingCard
              icon={<Moon className="h-5 w-5" strokeWidth={1.5} />}
              label={t("admin.settings.appearance.mode")}
              checked={appearance?.theme === "dark"}
              onCheckedChange={(checked) =>
                handleThemeChange(checked ? "dark" : "light")
              }
            />
            <SettingCard
              icon={<Contrast className="h-5 w-5" strokeWidth={1.5} />}
              label={t("admin.settings.appearance.contrast")}
              checked={Boolean(appearance?.contrast)}
              onCheckedChange={(checked) =>
                props.updateNestedField("appearance.contrast", checked)
              }
            />
            <SettingCard
              icon={<AlignLeft className="h-5 w-5" strokeWidth={1.5} />}
              label={t("admin.settings.appearance.rtl")}
              checked={Boolean(appearance?.rtl)}
              onCheckedChange={(checked) =>
                props.updateNestedField("appearance.rtl", checked)
              }
            />
            <SettingCard
              icon={<PanelLeftClose className="h-5 w-5" strokeWidth={1.5} />}
              label={t("admin.settings.appearance.collapsedSidebar")}
              checked={Boolean(appearance?.collapsedSidebar)}
              onCheckedChange={(checked) =>
                props.updateNestedField("appearance.collapsedSidebar", checked)
              }
              hasInfo
            />
          </div>

          <SectionContainer
            label={t("admin.settings.appearance.nav")}
            icon={<Info className="h-2.5 w-2.5" />}
          >
            <div className="space-y-3">
              <span className="text-xs font-medium text-muted-foreground">
                {t("admin.settings.appearance.color")}
              </span>
              <div className="grid grid-cols-2 gap-2.5">
                <NavColorCard
                  label={t("admin.settings.appearance.navColor.integrate")}
                  isActive={appearance?.navColor === "integrate"}
                  onClick={() =>
                    props.updateNestedField("appearance.navColor", "integrate")
                  }
                />
                <NavColorCard
                  label={t("admin.settings.appearance.navColor.apparent")}
                  isActive={appearance?.navColor === "apparent"}
                  onClick={() =>
                    props.updateNestedField("appearance.navColor", "apparent")
                  }
                />
              </div>
            </div>
          </SectionContainer>
        </CardContent>
        </Card>

        {/* Admin & Settings Layout Suite */}
        <Card className="border-border/80 shadow-md">
          <CardContent className="space-y-6 pt-6">
            <div className="flex items-center gap-3 border-b border-border/60 pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <LayoutGrid className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  Admin & Settings UI Layout Mode
                  <span className="rounded-full bg-primary/15 text-primary text-[10px] font-extrabold px-2 py-0.5">
                    5 Layout Stacks
                  </span>
                </h3>
                <p className="text-xs text-muted-foreground">
                  Choose the structural layout and workspace density for the administration dashboard and settings console.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
              {/* Cards Mode */}
              <div
                onClick={() => props.updateNestedField("appearance.adminLayout", "cards")}
                className={cn(
                  "cursor-pointer relative flex flex-col justify-between p-4 rounded-2xl border transition-all select-none hover:border-primary/60",
                  (appearance?.adminLayout || "cards") === "cards"
                    ? "bg-primary/5 border-primary shadow-md ring-1 ring-primary"
                    : "bg-card border-border hover:bg-muted/40"
                )}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Layers className="h-4 w-4" />
                  </div>
                  {(appearance?.adminLayout || "cards") === "cards" && (
                    <span className="rounded-full bg-primary text-primary-foreground p-0.5">
                      <Check className="h-3.5 w-3.5" />
                    </span>
                  )}
                </div>
                <div>
                  <span className="font-bold text-sm block text-foreground">Classic Cards</span>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Centered spaced card containers with sticky glassmorphic save footer.
                  </p>
                </div>
                <div className="mt-3 flex items-center gap-1.5 pt-2 border-t border-border/50 text-[10px] font-semibold text-primary">
                  <span>Standard Density</span>
                  <span>•</span>
                  <span>Default</span>
                </div>
              </div>

              {/* Dense Mode */}
              <div
                onClick={() => props.updateNestedField("appearance.adminLayout", "dense")}
                className={cn(
                  "cursor-pointer relative flex flex-col justify-between p-4 rounded-2xl border transition-all select-none hover:border-primary/60",
                  appearance?.adminLayout === "dense"
                    ? "bg-primary/5 border-primary shadow-md ring-1 ring-primary"
                    : "bg-card border-border hover:bg-muted/40"
                )}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <LayoutGrid className="h-4 w-4" />
                  </div>
                  {appearance?.adminLayout === "dense" && (
                    <span className="rounded-full bg-primary text-primary-foreground p-0.5">
                      <Check className="h-3.5 w-3.5" />
                    </span>
                  )}
                </div>
                <div>
                  <span className="font-bold text-sm block text-foreground">Enterprise Dense</span>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Expanded wide canvas with high-density compact forms and compact sidebar.
                  </p>
                </div>
                <div className="mt-3 flex items-center gap-1.5 pt-2 border-t border-border/50 text-[10px] font-semibold text-primary">
                  <span>High Density</span>
                  <span>•</span>
                  <span>Big Monitors</span>
                </div>
              </div>

              {/* Studio Mode */}
              <div
                onClick={() => props.updateNestedField("appearance.adminLayout", "studio")}
                className={cn(
                  "cursor-pointer relative flex flex-col justify-between p-4 rounded-2xl border transition-all select-none hover:border-primary/60",
                  appearance?.adminLayout === "studio"
                    ? "bg-primary/5 border-primary shadow-md ring-1 ring-primary"
                    : "bg-card border-border hover:bg-muted/40"
                )}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Maximize2 className="h-4 w-4" />
                  </div>
                  {appearance?.adminLayout === "studio" && (
                    <span className="rounded-full bg-primary text-primary-foreground p-0.5">
                      <Check className="h-3.5 w-3.5" />
                    </span>
                  )}
                </div>
                <div>
                  <span className="font-bold text-sm block text-foreground">Creative Studio</span>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Full-bleed luxury creative studio workspace with fluid glassmorphic backdrop.
                  </p>
                </div>
                <div className="mt-3 flex items-center gap-1.5 pt-2 border-t border-border/50 text-[10px] font-semibold text-primary">
                  <span>Fluid Canvas</span>
                  <span>•</span>
                  <span>Design First</span>
                </div>
              </div>

              {/* Minimal Mode */}
              <div
                onClick={() => props.updateNestedField("appearance.adminLayout", "minimal")}
                className={cn(
                  "cursor-pointer relative flex flex-col justify-between p-4 rounded-2xl border transition-all select-none hover:border-primary/60",
                  appearance?.adminLayout === "minimal"
                    ? "bg-primary/5 border-primary shadow-md ring-1 ring-primary"
                    : "bg-card border-border hover:bg-muted/40"
                )}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Minimize2 className="h-4 w-4" />
                  </div>
                  {appearance?.adminLayout === "minimal" && (
                    <span className="rounded-full bg-primary text-primary-foreground p-0.5">
                      <Check className="h-3.5 w-3.5" />
                    </span>
                  )}
                </div>
                <div>
                  <span className="font-bold text-sm block text-foreground">Minimal Flat</span>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Distraction-free borderless flat workspace with maximized whitespace and clean line accents.
                  </p>
                </div>
                <div className="mt-3 flex items-center gap-1.5 pt-2 border-t border-border/50 text-[10px] font-semibold text-primary">
                  <span>Distraction Free</span>
                  <span>•</span>
                  <span>Clean</span>
                </div>
              </div>

              {/* Command Mode */}
              <div
                onClick={() => props.updateNestedField("appearance.adminLayout", "command")}
                className={cn(
                  "cursor-pointer relative flex flex-col justify-between p-4 rounded-2xl border transition-all select-none hover:border-primary/60",
                  appearance?.adminLayout === "command"
                    ? "bg-primary/5 border-primary shadow-md ring-1 ring-primary"
                    : "bg-card border-border hover:bg-muted/40"
                )}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Terminal className="h-4 w-4" />
                  </div>
                  {appearance?.adminLayout === "command" && (
                    <span className="rounded-full bg-primary text-primary-foreground p-0.5">
                      <Check className="h-3.5 w-3.5" />
                    </span>
                  )}
                </div>
                <div>
                  <span className="font-bold text-sm block text-foreground">Command Center</span>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    High-efficiency power user HUD with glowing borders and monospaced metadata badges.
                  </p>
                </div>
                <div className="mt-3 flex items-center gap-1.5 pt-2 border-t border-border/50 text-[10px] font-semibold text-primary">
                  <span>Power User</span>
                  <span>•</span>
                  <span>Command HUD</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dashboard Template Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LayoutGrid className="h-5 w-5 text-primary" />
              Dashboard Theme & Template
            </CardTitle>
            <CardDescription>
              Select the visual theme and layout structure for the main dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {DASHBOARD_LAYOUT_OPTIONS.map((layout) => {
                const isActive = (appearance?.dashboardTemplate || "executive") === layout.id;
                return (
                  <button
                    key={layout.id}
                    type="button"
                    onClick={() => props.updateNestedField("appearance.dashboardTemplate", layout.id)}
                    className={cn(
                      "flex flex-col text-left rounded-xl border p-4 transition-all duration-200",
                      isActive
                        ? "border-primary bg-primary/5 ring-1 ring-primary shadow-sm"
                        : "border-border/60 hover:border-border hover:bg-muted/30"
                    )}
                  >
                    <div className="flex items-center justify-between mb-2 w-full">
                      <span className="font-semibold text-sm">{layout.title}</span>
                      {isActive && <Check className="h-4 w-4 text-primary shrink-0" />}
                    </div>
                    <span className="text-xs text-muted-foreground line-clamp-2">
                      {layout.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Typography Suite */}
        <TypographySettingsCard
          typography={appearance?.typography}
          onChange={(updated) => props.updateNestedField("appearance.typography", updated)}
        />

        {/* Auth UI Settings */}
        <Card>
          <CardContent className="space-y-6 pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <PanelLeftClose className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">Authentication UI</h3>
                <p className="text-xs text-muted-foreground">
                  Configure the appearance and behavior of the storefront login and registration popup.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Auth Theme</Label>
                <Select
                  value={appearance?.authUI?.theme || "split"}
                  onValueChange={(value) => props.updateNestedField("appearance.authUI.theme", value)}
                >
                  <SelectTrigger className="w-full h-10">
                    <SelectValue placeholder="Select a theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="classic">Classic (Centered Modal)</SelectItem>
                    <SelectItem value="split">Split (Side Image)</SelectItem>
                    <SelectItem value="minimal">Minimal (Clean & Simple)</SelectItem>
                    <SelectItem value="modern-glass">Modern Glass (Floating Backdrop)</SelectItem>
                    <SelectItem value="dark-luxury">Dark Luxury (Executive Aura)</SelectItem>
                    <SelectItem value="vibrant-gradient">Vibrant Gradient (High Energy)</SelectItem>
                    <SelectItem value="professional-corporate">Professional Corporate</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="pt-8">
                <SettingCard
                  icon={<PanelLeftClose className="h-5 w-5" strokeWidth={1.5} />}
                  label="Enable Auth Popup"
                  checked={appearance?.authUI?.popupEnabled ?? true}
                  onCheckedChange={(checked) =>
                    props.updateNestedField("appearance.authUI.popupEnabled", checked)
                  }
                />
              </div>

              {/* Logos & Background Graphics */}
              <div className="md:col-span-2 space-y-6 pt-6 border-t border-border/70">
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-primary" />
                  <div>
                    <h4 className="text-sm font-semibold">Logos & Background Graphics</h4>
                    <p className="text-xs text-muted-foreground">
                      Add custom branding, background wallpaper, or side promo banners for the login page.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Custom Logo URL & Upload */}
                  <div className="space-y-2 rounded-xl border border-border/70 bg-muted/20 p-4 shadow-2xs">
                    <ImageUploadField
                      id="appearance-auth-logo"
                      label="Custom Logo Image"
                      value={appearance?.authUI?.logoUrl || ""}
                      onChange={(val) => props.updateNestedField("appearance.authUI.logoUrl", val)}
                      previewClassName="h-20 w-20 object-contain"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      https://example.com/logo.png (Leave empty to use main store logo). Displayed prominently at the top of the auth card or split banner.
                    </p>
                  </div>

                  {/* Full Page Backdrop Wallpaper URL & Upload */}
                  <div className="space-y-2 rounded-xl border border-border/70 bg-muted/20 p-4 shadow-2xs">
                    <ImageUploadField
                      id="appearance-auth-bg"
                      label="Page Background Image (Wallpaper)"
                      value={appearance?.authUI?.backgroundImageUrl || ""}
                      onChange={(val) => props.updateNestedField("appearance.authUI.backgroundImageUrl", val)}
                      previewClassName="h-20 w-full object-cover rounded-lg"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      https://images.unsplash.com/... (Used on Modern Glass and centered cards). Full page backdrop image for Glassmorphic and centered designs.
                    </p>
                  </div>

                  {/* Side Hero Banner Graphic URL & Upload */}
                  <div className="space-y-2 rounded-xl border border-border/70 bg-muted/20 p-4 shadow-2xs">
                    <ImageUploadField
                      id="appearance-auth-side"
                      label="Side Hero Banner Image"
                      value={appearance?.authUI?.sideImageUrl || appearance?.authUI?.coverImage || ""}
                      onChange={(val) => {
                        props.updateNestedField("appearance.authUI.sideImageUrl", val);
                        props.updateNestedField("appearance.authUI.coverImage", val);
                      }}
                      previewClassName="h-20 w-full object-cover rounded-lg"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      https://images.unsplash.com/... (For Classic Split & Corporate styles). Appears in the left marketing panel for split view designs.
                    </p>
                  </div>
                </div>

                {/* Custom Heading & Subheading */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-2">
                    <Label htmlFor="appearance-auth-heading">Custom Greeting Heading</Label>
                    <Input
                      id="appearance-auth-heading"
                      placeholder="e.g. Welcome Back to Eighty7"
                      value={appearance?.authUI?.heading || ""}
                      onChange={(e) => props.updateNestedField("appearance.authUI.heading", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="appearance-auth-subheading">Custom Subheading</Label>
                    <Input
                      id="appearance-auth-subheading"
                      placeholder="e.g. Sign in to access your orders & account"
                      value={appearance?.authUI?.subheading || ""}
                      onChange={(e) => props.updateNestedField("appearance.authUI.subheading", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

      <StickySaveFooter
        label={t("admin.settings.appearance.save")}
        isSaving={props.isSaving}
        isDirty={props.isDirty}
        onSave={props.onSave}
      />
    </div>
  );
}
