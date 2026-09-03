"use client";

import { useState, useMemo, useRef } from "react";
import {
  Type,
  Upload,
  Search,
  Check,
  Trash2,
  Sliders,
  Palette,
  Eye,
  FileUp,
  Sparkles,
  ChevronDown,
  Info,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  POPULAR_GOOGLE_FONTS,
  type FontCategory,
  type GoogleFontMeta,
} from "@/lib/typography/google-fonts-catalog";
import type {
  ITypographySettings,
  ICustomFontItem,
} from "@/models/settings.model";
import { uploadFile } from "@/lib/media-upload/direct-upload";
import { useAppSettings as useAppSettingsStore } from "@/stores/app-settings";

interface TypographySettingsCardProps {
  typography?: ITypographySettings;
  onChange: (updated: ITypographySettings) => void;
}

const CATEGORY_TABS: { id: FontCategory; label: string }[] = [
  { id: "all", label: "All Fonts (500+)" },
  { id: "sans-serif", label: "Sans-Serif" },
  { id: "serif", label: "Serif" },
  { id: "display", label: "Display" },
  { id: "monospace", label: "Monospace" },
  { id: "handwriting", label: "Handwriting" },
];

const WEIGHT_OPTIONS = [
  { value: 300, label: "300 - Light" },
  { value: 400, label: "400 - Regular" },
  { value: 500, label: "500 - Medium" },
  { value: 600, label: "600 - Semi-Bold" },
  { value: 700, label: "700 - Bold" },
  { value: 800, label: "800 - Extra-Bold" },
  { value: 900, label: "900 - Black" },
];

const LETTER_SPACING_OPTIONS = [
  { value: "-0.05em", label: "Tightest (-0.05em)" },
  { value: "-0.03em", label: "Tight (-0.03em)" },
  { value: "-0.02em", label: "Snug (-0.02em)" },
  { value: "0em", label: "Normal (0em)" },
  { value: "0.02em", label: "Wide (+0.02em)" },
  { value: "0.05em", label: "Wider (+0.05em)" },
  { value: "0.1em", label: "Expanded (+0.10em)" },
];

const LINE_HEIGHT_OPTIONS = [
  { value: "1.1", label: "1.1 - Tight" },
  { value: "1.25", label: "1.25 - Snug" },
  { value: "1.4", label: "1.4 - Normal" },
  { value: "1.5", label: "1.5 - Relaxed" },
  { value: "1.65", label: "1.65 - Loose" },
  { value: "1.8", label: "1.8 - Airy" },
];

const TRANSFORM_OPTIONS = [
  { value: "none", label: "Normal (none)" },
  { value: "uppercase", label: "UPPERCASE" },
  { value: "capitalize", label: "Capitalize Each Word" },
  { value: "lowercase", label: "lowercase" },
];

/**
 * Single Font Picker Dropdown with Category Tabs & Search
 */
function FontPickerCombobox({
  label,
  value,
  onSelect,
  customFonts = [],
}: {
  label: string;
  value?: string;
  onSelect: (font: string) => void;
  customFonts?: ICustomFontItem[];
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<FontCategory>("all");

  const filteredFonts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return POPULAR_GOOGLE_FONTS.filter((font) => {
      if (category !== "all" && font.category !== category) return false;
      if (!q) return true;
      return font.family.toLowerCase().includes(q);
    });
  }, [search, category]);

  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold text-foreground/90">{label}</Label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex h-10 w-full items-center justify-between rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <span className="flex items-center gap-2 truncate">
            <Type className="h-4 w-4 text-primary shrink-0" />
            <span className="font-semibold text-foreground">{value || "Inter"}</span>
            {customFonts.some((cf) => cf.name === value) && (
              <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                Custom
              </span>
            )}
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform" />
        </button>

        {open && (
          <div className="absolute left-0 top-full z-50 mt-1 w-full min-w-[340px] max-w-[420px] rounded-xl border border-border bg-card p-3 shadow-2xl animate-in fade-in-50 zoom-in-95">
            {/* Search input */}
            <div className="relative mb-2.5">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search 500+ fonts (e.g. Poppins, Playfair)..."
                className="h-8 pl-8 text-xs"
                autoFocus
              />
            </div>

            {/* Category tabs */}
            <div className="mb-2 flex flex-wrap gap-1 border-b border-border pb-2">
              {CATEGORY_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setCategory(tab.id)}
                  className={cn(
                    "rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors",
                    category === tab.id
                      ? "bg-primary text-primary-foreground font-semibold"
                      : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Font list */}
            <div className="max-h-60 overflow-y-auto space-y-0.5 pr-1">
              {/* Custom Uploaded fonts */}
              {customFonts.length > 0 && (
                <div className="mb-2 border-b border-border/50 pb-2">
                  <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                    Your Custom Fonts
                  </span>
                  {customFonts.map((cf) => (
                    <button
                      key={cf.id}
                      type="button"
                      onClick={() => {
                        onSelect(cf.name);
                        setOpen(false);
                      }}
                      className={cn(
                        "flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-xs text-left transition-colors",
                        value === cf.name
                          ? "bg-primary/15 text-primary font-semibold"
                          : "hover:bg-muted text-foreground",
                      )}
                    >
                      <span className="flex items-center gap-2 truncate">
                        <span>{cf.name}</span>
                        <span className="rounded bg-primary/20 px-1 text-[9px] text-primary uppercase font-mono">
                          {cf.format}
                        </span>
                      </span>
                      {value === cf.name && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                    </button>
                  ))}
                </div>
              )}

              <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Google Catalog ({filteredFonts.length})
              </span>

              {filteredFonts.slice(0, 80).map((font) => (
                <button
                  key={font.family}
                  type="button"
                  onClick={() => {
                    onSelect(font.family);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-xs text-left transition-colors group",
                    value === font.family
                      ? "bg-primary/15 text-primary font-semibold"
                      : "hover:bg-muted text-foreground",
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate">{font.family}</span>
                      <span className="rounded bg-muted px-1.5 py-0.2 text-[9px] text-muted-foreground capitalize">
                        {font.category}
                      </span>
                    </div>
                  </div>
                  {value === font.family && (
                    <Check className="h-3.5 w-3.5 text-primary shrink-0 ml-2" />
                  )}
                </button>
              ))}

              {filteredFonts.length === 0 && (
                <div className="p-4 text-center text-xs text-muted-foreground">
                  No matching fonts found for &ldquo;{search}&rdquo;.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function TypographySettingsCard({
  typography = {},
  onChange,
}: TypographySettingsCardProps) {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [customFontName, setCustomFontName] = useState("");
  const [customFontWeight, setCustomFontWeight] = useState(400);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const headingFont = typography.headingFont || "Inter";
  const headingWeight = typography.headingWeight ?? 700;
  const headingLetterSpacing = typography.headingLetterSpacing || "-0.02em";
  const headingTransform = typography.headingTransform || "none";
  const headingColor = typography.headingColor || "";

  const bodyFont = typography.bodyFont || "Inter";
  const bodyWeight = typography.bodyWeight ?? 400;
  const bodyLineHeight = typography.bodyLineHeight || "1.5";
  const bodyColor = typography.bodyColor || "";

  const monoFont = typography.monoFont || "Geist Mono";
  const monoColor = typography.monoColor || "";

  const customFonts = typography.customFonts || [];

  const handleUpdate = (patch: Partial<ITypographySettings>) => {
    const updated = {
      ...typography,
      ...patch,
    };
    onChange(updated);
    useAppSettingsStore.setState({ typography: updated });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["woff2", "woff", "ttf", "otf"].includes(ext || "")) {
      setUploadError("Only .woff2, .woff, .ttf, and .otf font files are supported.");
      return;
    }

    try {
      setIsUploading(true);
      const res = await uploadFile(file, { customPath: "fonts/" });
      const fontName =
        customFontName.trim() ||
        file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");

      const newFont: ICustomFontItem = {
        id: `cf_${Date.now()}`,
        name: fontName,
        fileUrl: res.url,
        format: ext as "woff2" | "woff" | "ttf" | "otf",
        weight: customFontWeight,
      };

      const nextCustomFonts = [...customFonts, newFont];
      handleUpdate({ customFonts: nextCustomFonts });
      setCustomFontName("");
      setUploadDialogOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Font upload failed";
      setUploadError(msg);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeleteCustomFont = (id: string) => {
    const nextCustomFonts = customFonts.filter((f) => f.id !== id);
    handleUpdate({ customFonts: nextCustomFonts });
  };

  return (
    <Card className="overflow-hidden border-border/80 shadow-md">
      <CardContent className="space-y-7 pt-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Type className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                Typography & Font Studio
                <span className="rounded-full bg-primary/15 text-primary text-[10px] font-extrabold px-2 py-0.5">
                  500+ Fonts
                </span>
              </h3>
              <p className="text-xs text-muted-foreground">
                Configure brand typography, Google Font library, text hierarchy, and upload custom fonts.
              </p>
            </div>
          </div>

          {/* Upload Custom Font Dialog Trigger */}
          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 h-9 rounded-lg font-medium">
                <FileUp className="h-4 w-4 text-primary" />
                <span>Upload Custom Font</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[440px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileUp className="h-5 w-5 text-primary" />
                  Upload Custom Font
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Upload web fonts (.woff2, .woff, .ttf, .otf) to host locally on your store.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Font Family Name</Label>
                  <Input
                    placeholder="e.g. Satoshi, Cabinet Grotesk"
                    value={customFontName}
                    onChange={(e) => setCustomFontName(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Default Weight</Label>
                  <Select
                    value={String(customFontWeight)}
                    onValueChange={(val) => setCustomFontWeight(Number(val))}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {WEIGHT_OPTIONS.map((w) => (
                        <SelectItem key={w.value} value={String(w.value)} className="text-xs">
                          {w.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Font File (.woff2, .woff, .ttf, .otf)</Label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".woff2,.woff,.ttf,.otf"
                    onChange={handleFileUpload}
                    className="block w-full text-xs text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                  />
                </div>

                {uploadError && (
                  <p className="text-xs text-destructive font-medium">{uploadError}</p>
                )}
              </div>

              <DialogFooter>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setUploadDialogOpen(false)}
                  disabled={isUploading}
                >
                  Cancel
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Custom Uploaded Fonts Strip if any */}
        {customFonts.length > 0 && (
          <div className="rounded-xl border border-border/60 bg-muted/20 p-3.5">
            <span className="text-xs font-bold text-foreground block mb-2">
              Uploaded Brand Fonts ({customFonts.length})
            </span>
            <div className="flex flex-wrap gap-2">
              {customFonts.map((font) => (
                <div
                  key={font.id}
                  className="flex items-center gap-2 rounded-lg border border-border bg-card px-2.5 py-1 text-xs shadow-sm"
                >
                  <span className="font-semibold text-foreground">{font.name}</span>
                  <span className="rounded bg-primary/10 px-1 text-[9px] font-mono font-bold text-primary uppercase">
                    {font.format}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteCustomFont(font.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors ml-1"
                    title="Remove font"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 1. Heading Typography Section */}
        <div className="space-y-4 rounded-xl border border-border/70 bg-card/60 p-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-border/40 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded bg-primary/10 text-primary text-xs font-bold">
                H
              </span>
              <h4 className="text-sm font-bold text-foreground">Heading Typography</h4>
            </div>
            <span className="text-[11px] text-muted-foreground">Used for H1–H6, titles, banners</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Font Picker */}
            <div className="md:col-span-2">
              <FontPickerCombobox
                label="Heading Font Family"
                value={headingFont}
                onSelect={(val) => handleUpdate({ headingFont: val })}
                customFonts={customFonts}
              />
            </div>

            {/* Heading Weight */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Heading Weight</Label>
              <Select
                value={String(headingWeight)}
                onValueChange={(v) => handleUpdate({ headingWeight: Number(v) })}
              >
                <SelectTrigger className="h-10 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WEIGHT_OPTIONS.map((w) => (
                    <SelectItem key={w.value} value={String(w.value)} className="text-xs">
                      {w.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Heading Letter Spacing */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Letter Spacing</Label>
              <Select
                value={headingLetterSpacing}
                onValueChange={(v) => handleUpdate({ headingLetterSpacing: v })}
              >
                <SelectTrigger className="h-10 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LETTER_SPACING_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value} className="text-xs">
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Heading Text Transform */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Text Case Transform</Label>
              <Select
                value={headingTransform}
                onValueChange={(v) =>
                  handleUpdate({
                    headingTransform: v as "none" | "uppercase" | "capitalize" | "lowercase",
                  })
                }
              >
                <SelectTrigger className="h-10 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TRANSFORM_OPTIONS.map((t) => (
                    <SelectItem key={t.value} value={t.value} className="text-xs">
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Heading Color */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Heading Color (Optional)</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={headingColor || "#111827"}
                  onChange={(e) => handleUpdate({ headingColor: e.target.value })}
                  className="h-10 w-10 cursor-pointer rounded-lg border border-input p-0.5"
                />
                <Input
                  value={headingColor}
                  onChange={(e) => handleUpdate({ headingColor: e.target.value })}
                  placeholder="Inherit / Theme default"
                  className="h-10 text-xs font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 2. Body Typography Section */}
        <div className="space-y-4 rounded-xl border border-border/70 bg-card/60 p-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-border/40 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded bg-primary/10 text-primary text-xs font-bold">
                B
              </span>
              <h4 className="text-sm font-bold text-foreground">Body & Reading Typography</h4>
            </div>
            <span className="text-[11px] text-muted-foreground">Used for product copy, articles, UI</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Body Font Picker */}
            <div className="md:col-span-2">
              <FontPickerCombobox
                label="Body Font Family"
                value={bodyFont}
                onSelect={(val) => handleUpdate({ bodyFont: val })}
                customFonts={customFonts}
              />
            </div>

            {/* Body Weight */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Body Regular Weight</Label>
              <Select
                value={String(bodyWeight)}
                onValueChange={(v) => handleUpdate({ bodyWeight: Number(v) })}
              >
                <SelectTrigger className="h-10 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WEIGHT_OPTIONS.slice(0, 5).map((w) => (
                    <SelectItem key={w.value} value={String(w.value)} className="text-xs">
                      {w.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Body Line Height */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Reading Line Height</Label>
              <Select
                value={bodyLineHeight}
                onValueChange={(v) => handleUpdate({ bodyLineHeight: v })}
              >
                <SelectTrigger className="h-10 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LINE_HEIGHT_OPTIONS.map((lh) => (
                    <SelectItem key={lh.value} value={lh.value} className="text-xs">
                      {lh.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Body Text Color */}
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs font-semibold">Body Text Color (Optional)</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={bodyColor || "#374151"}
                  onChange={(e) => handleUpdate({ bodyColor: e.target.value })}
                  className="h-10 w-10 cursor-pointer rounded-lg border border-input p-0.5"
                />
                <Input
                  value={bodyColor}
                  onChange={(e) => handleUpdate({ bodyColor: e.target.value })}
                  placeholder="Inherit / Theme default"
                  className="h-10 text-xs font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 3. Monospace & Code Section */}
        <div className="space-y-4 rounded-xl border border-border/70 bg-card/60 p-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-border/40 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded bg-primary/10 text-primary text-xs font-bold font-mono">
                {"</>"}
              </span>
              <h4 className="text-sm font-bold text-foreground">Code & Data Monospace Font</h4>
            </div>
            <span className="text-[11px] text-muted-foreground">Used for barcodes, SKU, tracking codes</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <FontPickerCombobox
              label="Monospace Font Family"
              value={monoFont}
              onSelect={(val) => handleUpdate({ monoFont: val })}
              customFonts={customFonts}
            />

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Monospace Text Color (Optional)</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={monoColor || "#4b5563"}
                  onChange={(e) => handleUpdate({ monoColor: e.target.value })}
                  className="h-10 w-10 cursor-pointer rounded-lg border border-input p-0.5"
                />
                <Input
                  value={monoColor}
                  onChange={(e) => handleUpdate({ monoColor: e.target.value })}
                  placeholder="Inherit / Theme default"
                  className="h-10 text-xs font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 4. Live Interactive Typography Sandbox / Preview Card */}
        <div className="rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-card via-background to-primary/5 p-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-border/60 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-primary" />
              <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                Live Interactive Typography Sandbox
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <span className="rounded bg-muted px-2 py-0.5 font-medium">
                Heading: {headingFont} ({headingWeight})
              </span>
              <span className="rounded bg-muted px-2 py-0.5 font-medium">
                Body: {bodyFont} ({bodyWeight})
              </span>
            </div>
          </div>

          {/* Sandbox Canvas */}
          <div className="space-y-4">
            <div
              style={{
                fontFamily: `'${headingFont}', sans-serif`,
                fontWeight: headingWeight,
                letterSpacing: headingLetterSpacing,
                textTransform: headingTransform,
                color: headingColor || undefined,
              }}
              className="text-2xl sm:text-3xl font-bold tracking-tight transition-all"
            >
              The Next Evolution of Modern Commerce
            </div>

            <p
              style={{
                fontFamily: `'${bodyFont}', sans-serif`,
                fontWeight: bodyWeight,
                lineHeight: bodyLineHeight,
                color: bodyColor || undefined,
              }}
              className="text-sm text-muted-foreground transition-all max-w-2xl"
            >
              Antigravity Commerce delivers blistering omnichannel retail, self-checkout kiosks, and
              real-time kitchen display pipelines powered by ultra-crisp custom typography. Every line
              of type scales cleanly across high-density retina screens and thermal receipt printers.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                style={{
                  fontFamily: `'${headingFont}', sans-serif`,
                  fontWeight: 600,
                  letterSpacing: headingLetterSpacing,
                  textTransform: headingTransform === "uppercase" ? "uppercase" : "none",
                }}
                className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-md transition-all hover:bg-primary/90"
              >
                Instant Checkout
              </button>

              <code
                style={{
                  fontFamily: `'${monoFont}', monospace`,
                  color: monoColor || undefined,
                }}
                className="rounded-md border border-border bg-muted/60 px-2.5 py-1.5 text-xs font-mono"
              >
                ORDER_ID: #87X-2026-GH921
              </code>

              <span className="rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold">
                Live Preview Active
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
