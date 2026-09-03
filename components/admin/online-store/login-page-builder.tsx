"use client";

import { useEffect, useState } from "react";
import { 
  Check, 
  Loader2, 
  Save, 
  Monitor, 
  Smartphone, 
  Image as ImageIcon, 
  Sparkles, 
  ShieldCheck, 
  Palette, 
  Sliders, 
  Lock, 
  KeyRound, 
  Share2,
  Layout,
  Type
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import Image from "next/image";
import { ImageUploadField } from "@/components/admin/settings/fields/image-upload-field";

// ─── Login Theme Definitions ───────────────────────────────────────────────────

export type LoginPageStyle =
  | "classic-split"
  | "modern-glass"
  | "dark-luxury"
  | "minimal-clean"
  | "vibrant-gradient"
  | "professional-corporate";

export interface ILoginPageConfig {
  style: LoginPageStyle;
  logoUrl?: string;
  backgroundImageUrl?: string;
  sideImageUrl?: string;
  primaryColor?: string;
  accentColor?: string;
  heading?: string;
  subheading?: string;
  socialLoginEnabled: boolean;
  otpLoginEnabled: boolean;
  cardPosition: "center" | "left" | "right";
  formBorderRadius: "none" | "sm" | "md" | "lg" | "xl" | "full";
}

interface LoginTheme {
  id: LoginPageStyle;
  name: string;
  description: string;
  tags: string[];
  preview: React.ReactNode;
}

// ─── Mini Previews (styled divs representing the page layout) ─────────────────

function ClassicSplitPreview({ logoUrl, sideImageUrl }: { logoUrl?: string; sideImageUrl?: string }) {
  return (
    <div className="w-full h-full flex rounded-lg overflow-hidden border border-slate-200 shadow-xs">
      <div 
        className="w-[45%] bg-slate-900 flex flex-col items-center justify-center p-3 gap-2 relative overflow-hidden"
        style={sideImageUrl ? { backgroundImage: `url(${sideImageUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : {}}
      >
        <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs" />
        <div className="relative z-10 flex flex-col items-center gap-1.5 text-center">
          {logoUrl ? (
            <div className="w-8 h-8 relative rounded overflow-hidden bg-white/10 p-0.5">
              <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
            </div>
          ) : (
            <div className="w-6 h-6 rounded-full bg-primary/80 flex items-center justify-center text-white text-[9px] font-bold">87</div>
          )}
          <div className="w-12 h-1.5 rounded bg-white/80" />
          <div className="w-16 h-1 rounded bg-white/40" />
        </div>
      </div>
      <div className="flex-1 bg-white flex flex-col items-center justify-center p-3 gap-1.5">
        <div className="w-14 h-2 rounded bg-slate-800" />
        <div className="w-10 h-1 rounded bg-slate-300" />
        <div className="w-full h-4 rounded bg-slate-100 border border-slate-200 mt-1" />
        <div className="w-full h-4 rounded bg-slate-100 border border-slate-200" />
        <div className="w-full h-5 rounded-md bg-primary text-[8px] text-white flex items-center justify-center font-medium">Sign In</div>
        <div className="w-12 h-1 rounded bg-slate-200 mt-0.5" />
      </div>
    </div>
  );
}

function ModernGlassPreview({ bgUrl, logoUrl }: { bgUrl?: string; logoUrl?: string }) {
  return (
    <div
      className="w-full h-full rounded-lg flex items-center justify-center p-2 relative overflow-hidden border border-white/20 shadow-xs"
      style={{ 
        background: bgUrl ? `url(${bgUrl}) center/cover no-repeat` : "linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #ec4899 100%)" 
      }}
    >
      <div className="absolute inset-0 bg-black/20 backdrop-blur-xs" />
      <div 
        className="w-[70%] h-[85%] rounded-xl p-2.5 flex flex-col gap-1.5 items-center justify-center relative z-10 shadow-xl border border-white/40"
        style={{ background: "rgba(255,255,255,0.22)", backdropFilter: "blur(14px)" }}
      >
        {logoUrl ? (
          <img src={logoUrl} alt="Logo" className="h-4 object-contain" />
        ) : (
          <div className="w-5 h-5 rounded-full bg-white/50" />
        )}
        <div className="w-14 h-1.5 rounded bg-white font-bold" />
        <div className="w-full h-3 rounded bg-white/30 border border-white/40" />
        <div className="w-full h-3 rounded bg-white/30 border border-white/40" />
        <div className="w-full h-4 rounded-md bg-white text-slate-900 text-[8px] flex items-center justify-center font-bold">Sign In</div>
      </div>
    </div>
  );
}

function DarkLuxuryPreview({ logoUrl, accentColor }: { logoUrl?: string; accentColor?: string }) {
  const accent = accentColor || "#f59e0b";
  return (
    <div className="w-full h-full rounded-lg flex items-center justify-center bg-zinc-950 p-2 relative overflow-hidden border border-zinc-800">
      <div className="absolute inset-0" style={{ background: `radial-gradient(circle at center, ${accent}22 0%, transparent 70%)` }} />
      <div 
        className="w-[68%] h-[85%] rounded-xl p-2.5 flex flex-col gap-1.5 items-center justify-center relative z-10 bg-zinc-900/90 shadow-2xl border"
        style={{ borderColor: `${accent}44` }}
      >
        <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${accent}, #d97706)` }}>
          <Lock className="w-2.5 h-2.5 text-zinc-950" />
        </div>
        <div className="w-12 h-1.5 rounded" style={{ backgroundColor: accent }} />
        <div className="w-full h-3.5 rounded bg-zinc-800/80 border border-zinc-700" />
        <div className="w-full h-3.5 rounded bg-zinc-800/80 border border-zinc-700" />
        <div className="w-full h-4 rounded-md font-semibold text-[8px] text-zinc-950 flex items-center justify-center shadow-md" style={{ background: `linear-gradient(90deg, ${accent}, #d97706)` }}>
          Sign In
        </div>
      </div>
    </div>
  );
}

function MinimalCleanPreview({ logoUrl }: { logoUrl?: string }) {
  return (
    <div className="w-full h-full rounded-lg flex items-center justify-center bg-slate-50 p-2 border border-slate-200">
      <div className="w-[62%] h-[85%] bg-white rounded-xl p-2.5 flex flex-col gap-1.5 items-center justify-center shadow-md border border-slate-100">
        <div className="w-10 h-2 rounded bg-slate-900" />
        <div className="w-14 h-1 rounded bg-slate-300" />
        <div className="w-full h-3.5 rounded bg-slate-50 border border-slate-200 mt-1" />
        <div className="w-full h-3.5 rounded bg-slate-50 border border-slate-200" />
        <div className="w-full h-4 rounded-md bg-slate-900 text-white text-[8px] flex items-center justify-center">Sign In</div>
        <div className="w-10 h-0.5 rounded bg-slate-200" />
      </div>
    </div>
  );
}

function VibrantGradientPreview({ primaryColor }: { primaryColor?: string }) {
  return (
    <div
      className="w-full h-full rounded-lg flex items-center justify-center relative overflow-hidden p-2 border"
      style={{ background: "linear-gradient(135deg, #ec4899 0%, #8b5cf6 50%, #3b82f6 100%)" }}
    >
      <div className="w-[62%] bg-white/95 backdrop-blur-md rounded-xl p-2.5 flex flex-col gap-1.5 items-center shadow-2xl border border-white/60">
        <div className="w-12 h-2 rounded bg-indigo-600" />
        <div className="w-full h-3.5 rounded bg-slate-50 border border-slate-200" />
        <div className="w-full h-3.5 rounded bg-slate-50 border border-slate-200" />
        <div className="w-full h-4 rounded-md bg-gradient-to-r from-pink-500 to-indigo-600 text-white text-[8px] flex items-center justify-center font-bold">Sign In</div>
      </div>
    </div>
  );
}

function ProfessionalCorporatePreview({ logoUrl }: { logoUrl?: string }) {
  return (
    <div className="w-full h-full flex rounded-lg overflow-hidden bg-slate-50 border border-slate-200 shadow-xs">
      <div className="w-[42%] flex flex-col items-start justify-between p-2.5 bg-blue-700 text-white">
        <div className="w-8 h-2 rounded bg-white/90" />
        <div className="space-y-1">
          <div className="w-12 h-1 rounded bg-white/70" />
          <div className="w-10 h-0.5 rounded bg-white/40" />
          <div className="w-8 h-0.5 rounded bg-white/40" />
        </div>
        <div className="w-6 h-1 rounded bg-blue-300/60" />
      </div>
      <div className="flex-1 bg-white flex flex-col justify-center items-center p-2.5 gap-1.5">
        <div className="w-12 h-2 rounded bg-slate-900" />
        <div className="w-14 h-1 rounded bg-slate-300" />
        <div className="w-full h-3.5 rounded bg-slate-50 border border-slate-200 mt-1" />
        <div className="w-full h-3.5 rounded bg-slate-50 border border-slate-200" />
        <div className="w-full h-4 rounded-md bg-blue-700 text-white text-[8px] flex items-center justify-center font-semibold">Sign In</div>
      </div>
    </div>
  );
}

// ─── Theme Config Array ────────────────────────────────────────────────────────

const LOGIN_THEMES: LoginTheme[] = [
  {
    id: "classic-split",
    name: "Classic Split",
    description: "Prominent side branding / showcase panel with a modern form side. Ideal for high conversions.",
    tags: ["Split Layout", "Side Banner", "High Contrast"],
    preview: <ClassicSplitPreview />,
  },
  {
    id: "modern-glass",
    name: "Modern Glassmorphism",
    description: "Frosted ultra-modern glass card floating over custom background images or mesh gradients.",
    tags: ["Glassmorphism", "Blur", "Centered"],
    preview: <ModernGlassPreview />,
  },
  {
    id: "dark-luxury",
    name: "Dark Luxury",
    description: "Deep obsidian backdrop with gold/amber glowing accents and metallic badges.",
    tags: ["Dark Mode", "Gold Accent", "Luxury"],
    preview: <DarkLuxuryPreview />,
  },
  {
    id: "minimal-clean",
    name: "Minimal Clean",
    description: "Clean typography, subtle card elevations, and zero visual clutter.",
    tags: ["Minimal", "Carded", "Accessible"],
    preview: <MinimalCleanPreview />,
  },
  {
    id: "vibrant-gradient",
    name: "Vibrant Gradient",
    description: "Dynamic vivid multi-stop gradients with crisp white floating card container.",
    tags: ["Colorful", "Floating Card", "Modern"],
    preview: <VibrantGradientPreview />,
  },
  {
    id: "professional-corporate",
    name: "Corporate Enterprise",
    description: "Structured brand bar with clean credentials area and enterprise compliance badges.",
    tags: ["Enterprise", "Split", "Blue / Indigo"],
    preview: <ProfessionalCorporatePreview />,
  },
];

// ─── Main Component ────────────────────────────────────────────────────────────

interface LoginPageBuilderProps {
  initialSettings?: Record<string, unknown>;
}

export function LoginPageBuilder({ initialSettings }: LoginPageBuilderProps) {
  const [config, setConfig] = useState<ILoginPageConfig>({
    style: (initialSettings?.style as LoginPageStyle) || "classic-split",
    logoUrl: (initialSettings?.logoUrl as string) || "",
    backgroundImageUrl: (initialSettings?.backgroundImageUrl as string) || "",
    sideImageUrl: (initialSettings?.sideImageUrl as string) || "",
    primaryColor: (initialSettings?.primaryColor as string) || "",
    accentColor: (initialSettings?.accentColor as string) || "",
    heading: (initialSettings?.heading as string) || "",
    subheading: (initialSettings?.subheading as string) || "",
    socialLoginEnabled: initialSettings?.socialLoginEnabled !== false,
    otpLoginEnabled: Boolean(initialSettings?.otpLoginEnabled),
    cardPosition: (initialSettings?.cardPosition as "center" | "left" | "right") || "center",
    formBorderRadius: (initialSettings?.formBorderRadius as any) || "md",
  });

  const [savedConfig, setSavedConfig] = useState<ILoginPageConfig>(config);
  const [saving, setSaving] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");
  const [activeTab, setActiveTab] = useState("themes");

  const isDirty = JSON.stringify(config) !== JSON.stringify(savedConfig);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          section: "loginPage", 
          data: config 
        }),
      });

      if (!res.ok) throw new Error("Failed to save");
      setSavedConfig(config);
      toast.success("Login page settings saved successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save login page settings.");
    } finally {
      setSaving(false);
    }
  };

  const activeTheme = LOGIN_THEMES.find((t) => t.id === config.style) || LOGIN_THEMES[0];

  return (
    <div className="space-y-8 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Login Page & Auth UI Builder</h1>
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">6 Styles</Badge>
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            Customize layout, logos, background images, social logins, OTP auth, colors, and styling for storefront sign-in.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={handleSave}
            disabled={!isDirty || saving}
            className="gap-2 shrink-0"
          >
            {saving ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
            ) : (
              <><Save className="h-4 w-4" /> Save Changes</>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_390px] gap-8">
        {/* Main Settings Section */}
        <div className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-4 w-full h-11 p-1 bg-muted/60">
              <TabsTrigger value="themes" className="gap-1.5 text-xs sm:text-sm">
                <Layout className="h-4 w-4" /> Themes (6)
              </TabsTrigger>
              <TabsTrigger value="branding" className="gap-1.5 text-xs sm:text-sm">
                <ImageIcon className="h-4 w-4" /> Logo & Images
              </TabsTrigger>
              <TabsTrigger value="auth-features" className="gap-1.5 text-xs sm:text-sm">
                <ShieldCheck className="h-4 w-4" /> Social & OTP
              </TabsTrigger>
              <TabsTrigger value="styling" className="gap-1.5 text-xs sm:text-sm">
                <Palette className="h-4 w-4" /> Colors & Layout
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: 6 THEMES SELECTION */}
            <TabsContent value="themes" className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-base">Select Page Layout Theme</h3>
                  <p className="text-xs text-muted-foreground">Pick one of 6 handcrafted login & register UI designs.</p>
                </div>
                <Badge variant="secondary">{LOGIN_THEMES.length} Presets Available</Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {LOGIN_THEMES.map((theme) => {
                  const isActive = config.style === theme.id;
                  return (
                    <button
                      key={theme.id}
                      id={`login-theme-${theme.id}`}
                      onClick={() => setConfig((prev) => ({ ...prev, style: theme.id }))}
                      className={cn(
                        "group relative rounded-xl border-2 text-left transition-all duration-200 bg-card",
                        "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                        isActive
                          ? "border-primary shadow-md shadow-primary/20 ring-1 ring-primary"
                          : "border-border hover:border-primary/50 hover:shadow-sm"
                      )}
                    >
                      {isActive && (
                        <div className="absolute -top-2.5 -right-2.5 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
                          <Check className="h-3.5 w-3.5" />
                        </div>
                      )}

                      <div className="relative h-36 w-full overflow-hidden rounded-t-[10px] bg-muted/40">
                        {theme.preview}
                      </div>

                      <div className="p-3.5 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-sm">{theme.name}</p>
                          {isActive && (
                            <Badge className="text-[10px] h-4 px-1.5 bg-primary">Selected</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                          {theme.description}
                        </p>
                        <div className="flex flex-wrap gap-1 pt-1">
                          {theme.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </TabsContent>

            {/* TAB 2: BRANDING & IMAGES */}
            <TabsContent value="branding" className="space-y-5 pt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ImageIcon className="h-5 w-5 text-primary" />
                    Logos & Background Graphics
                  </CardTitle>
                  <CardDescription>
                    Add custom branding, background wallpaper, or side promo banners for the login page.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Custom Logo URL & Upload */}
                  <div className="space-y-2 rounded-xl border border-border/70 bg-card p-4 shadow-2xs">
                    <ImageUploadField
                      id="login-logo-upload"
                      label="Custom Logo Image"
                      value={config.logoUrl || ""}
                      onChange={(val) => setConfig((prev) => ({ ...prev, logoUrl: val }))}
                      previewClassName="h-20 w-20 object-contain"
                    />
                    <p className="text-xs text-muted-foreground">
                      https://example.com/logo.png (Leave empty to use main store logo). Displayed prominently at the top of the auth card or split banner.
                    </p>
                  </div>

                  {/* Background Image URL & Upload */}
                  <div className="space-y-2 rounded-xl border border-border/70 bg-card p-4 shadow-2xs">
                    <ImageUploadField
                      id="login-bg-upload"
                      label="Page Background Image (Wallpaper)"
                      value={config.backgroundImageUrl || ""}
                      onChange={(val) => setConfig((prev) => ({ ...prev, backgroundImageUrl: val }))}
                      previewClassName="h-28 w-full object-cover rounded-lg"
                    />
                    <p className="text-xs text-muted-foreground">
                      https://images.unsplash.com/... (Used on Modern Glass and centered cards). Full page backdrop image for Glassmorphic and centered designs.
                    </p>
                  </div>

                  {/* Side Banner / Promo Image URL & Upload */}
                  <div className="space-y-2 rounded-xl border border-border/70 bg-card p-4 shadow-2xs">
                    <ImageUploadField
                      id="login-side-upload"
                      label="Side Hero Banner Image (Split Layouts)"
                      value={config.sideImageUrl || ""}
                      onChange={(val) => setConfig((prev) => ({ ...prev, sideImageUrl: val }))}
                      previewClassName="h-28 w-full object-cover rounded-lg"
                    />
                    <p className="text-xs text-muted-foreground">
                      https://images.unsplash.com/... (For Classic Split & Corporate styles). Appears in the left marketing panel for split view designs.
                    </p>
                  </div>

                  {/* Custom Heading & Subheading */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div className="space-y-2">
                      <Label htmlFor="customHeading">Custom Heading</Label>
                      <Input
                        id="customHeading"
                        placeholder="e.g. Welcome Back to Eighty7"
                        value={config.heading || ""}
                        onChange={(e) => setConfig((prev) => ({ ...prev, heading: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="customSubheading">Custom Subheading</Label>
                      <Input
                        id="customSubheading"
                        placeholder="e.g. Sign in to access your orders & account"
                        value={config.subheading || ""}
                        onChange={(e) => setConfig((prev) => ({ ...prev, subheading: e.target.value }))}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 3: SOCIAL & OTP AUTH */}
            <TabsContent value="auth-features" className="space-y-5 pt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Share2 className="h-5 w-5 text-primary" />
                    Authentication Methods & Providers
                  </CardTitle>
                  <CardDescription>
                    Enable or disable one-click social logins and SMS / Email OTP passwordless login.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Social Login Toggle */}
                  <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/20">
                    <div className="space-y-0.5">
                      <Label className="text-base font-semibold">Social Media Login (Google & Facebook)</Label>
                      <p className="text-xs text-muted-foreground">
                        Show OAuth buttons allowing users to sign in instantly with Google or Facebook.
                      </p>
                    </div>
                    <Switch
                      checked={config.socialLoginEnabled}
                      onCheckedChange={(checked) => setConfig((prev) => ({ ...prev, socialLoginEnabled: checked }))}
                    />
                  </div>

                  {/* OTP Login Toggle */}
                  <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/20">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <Label className="text-base font-semibold">One-Time Password (OTP) Login</Label>
                        <Badge variant="outline" className="text-[10px] text-emerald-600 bg-emerald-50 border-emerald-200">Passwordless</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Allow customers to log in using a 6-digit verification code sent via SMS or Email.
                      </p>
                    </div>
                    <Switch
                      checked={config.otpLoginEnabled}
                      onCheckedChange={(checked) => setConfig((prev) => ({ ...prev, otpLoginEnabled: checked }))}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 4: STYLING & COLORS */}
            <TabsContent value="styling" className="space-y-5 pt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Palette className="h-5 w-5 text-primary" />
                    Colors & Layout Alignment
                  </CardTitle>
                  <CardDescription>
                    Fine-tune primary buttons, glow highlights, form alignment, and corner radius.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Primary Color */}
                    <div className="space-y-2">
                      <Label htmlFor="primaryColor">Primary Button & Highlight Color</Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={config.primaryColor || "#4f46e5"}
                          onChange={(e) => setConfig((prev) => ({ ...prev, primaryColor: e.target.value }))}
                          className="h-10 w-12 rounded cursor-pointer border border-input p-1"
                        />
                        <Input
                          id="primaryColor"
                          placeholder="#4f46e5"
                          value={config.primaryColor || ""}
                          onChange={(e) => setConfig((prev) => ({ ...prev, primaryColor: e.target.value }))}
                          className="font-mono uppercase"
                        />
                      </div>
                    </div>

                    {/* Accent Color */}
                    <div className="space-y-2">
                      <Label htmlFor="accentColor">Accent / Glow Color</Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={config.accentColor || "#ec4899"}
                          onChange={(e) => setConfig((prev) => ({ ...prev, accentColor: e.target.value }))}
                          className="h-10 w-12 rounded cursor-pointer border border-input p-1"
                        />
                        <Input
                          id="accentColor"
                          placeholder="#ec4899"
                          value={config.accentColor || ""}
                          onChange={(e) => setConfig((prev) => ({ ...prev, accentColor: e.target.value }))}
                          className="font-mono uppercase"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    {/* Form Card Alignment */}
                    <div className="space-y-2">
                      <Label>Form Position (Centered Themes)</Label>
                      <Select
                        value={config.cardPosition}
                        onValueChange={(val: "center" | "left" | "right") => 
                          setConfig((prev) => ({ ...prev, cardPosition: val }))
                        }
                      >
                        <SelectTrigger className="h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="center">Centered Form</SelectItem>
                          <SelectItem value="left">Left Aligned</SelectItem>
                          <SelectItem value="right">Right Aligned</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Form Border Radius */}
                    <div className="space-y-2">
                      <Label>Form Card Corner Radius</Label>
                      <Select
                        value={config.formBorderRadius}
                        onValueChange={(val: any) => 
                          setConfig((prev) => ({ ...prev, formBorderRadius: val }))
                        }
                      >
                        <SelectTrigger className="h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Square (0px)</SelectItem>
                          <SelectItem value="sm">Small (rounded-sm)</SelectItem>
                          <SelectItem value="md">Standard (rounded-md)</SelectItem>
                          <SelectItem value="lg">Large (rounded-lg)</SelectItem>
                          <SelectItem value="xl">Extra Large (rounded-2xl)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right: Live Interactive Preview Panel */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Live Preview
            </p>
            {/* Desktop / Mobile toggle */}
            <div className="flex items-center gap-1 rounded-lg border p-1 bg-muted/50">
              <Button
                variant={previewDevice === "desktop" ? "secondary" : "ghost"}
                size="icon"
                className="h-6 w-6"
                onClick={() => setPreviewDevice("desktop")}
                title="Desktop preview"
              >
                <Monitor className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant={previewDevice === "mobile" ? "secondary" : "ghost"}
                size="icon"
                className="h-6 w-6"
                onClick={() => setPreviewDevice("mobile")}
                title="Mobile preview"
              >
                <Smartphone className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Preview Frame */}
          <Card className="overflow-hidden border-2 border-border/50 shadow-md">
            <div
              className={cn(
                "mx-auto transition-all duration-300",
                previewDevice === "desktop" ? "w-full" : "w-[200px]"
              )}
            >
              <div
                className={cn(
                  "relative overflow-hidden transition-all duration-300",
                  previewDevice === "desktop" ? "h-[300px]" : "h-[340px] rounded-3xl mx-auto my-2"
                )}
              >
                {config.style === "classic-split" && <ClassicSplitPreview logoUrl={config.logoUrl} sideImageUrl={config.sideImageUrl} />}
                {config.style === "modern-glass" && <ModernGlassPreview bgUrl={config.backgroundImageUrl} logoUrl={config.logoUrl} />}
                {config.style === "dark-luxury" && <DarkLuxuryPreview logoUrl={config.logoUrl} accentColor={config.accentColor} />}
                {config.style === "minimal-clean" && <MinimalCleanPreview logoUrl={config.logoUrl} />}
                {config.style === "vibrant-gradient" && <VibrantGradientPreview primaryColor={config.primaryColor} />}
                {config.style === "professional-corporate" && <ProfessionalCorporatePreview logoUrl={config.logoUrl} />}
              </div>
            </div>
            <CardContent className="py-3.5 px-4 border-t bg-muted/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm">{activeTheme.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                    {activeTheme.description}
                  </p>
                </div>
                {JSON.stringify(config) === JSON.stringify(savedConfig) && (
                  <Badge variant="secondary" className="shrink-0 ml-2 bg-emerald-50 text-emerald-700 border-emerald-200">
                    <Check className="h-3 w-3 mr-1" />
                    Saved
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Active Configuration Summary */}
          <div className="rounded-lg border bg-card p-4 space-y-2.5 text-sm">
            <p className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Active Configuration</p>
            <div className="space-y-1.5 text-xs text-muted-foreground">
              <div className="flex justify-between py-1 border-b border-border/50">
                <span>Theme Layout:</span>
                <span className="font-medium text-foreground">{activeTheme.name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span>Social Logins:</span>
                <span className="font-medium text-foreground">{config.socialLoginEnabled ? "Enabled" : "Disabled"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span>Passwordless OTP:</span>
                <span className="font-medium text-foreground">{config.otpLoginEnabled ? "Enabled" : "Disabled"}</span>
              </div>
              <div className="flex justify-between py-1">
                <span>Form Radius:</span>
                <span className="font-medium text-foreground">{config.formBorderRadius}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
