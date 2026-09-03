"use client";

import type { Dispatch, SetStateAction } from "react";
import { useTranslations } from "next-intl";
import {
  ArrowUp,
  Bot,
  Check,
  Eye,
  Layers,
  Palette,
  Plus,
  Sliders,
  Sparkles,
  Terminal,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { TabsContent } from "@/components/ui/tabs";
import { MediaUploader } from "@/components/ui/media-uploader";
import {
  AISalesAssistantAvatar,
  AISalesHeaderIcon,
} from "@/components/ai-sales-agent/ai-sales-message";
import type { IAISalesAgentSettings } from "@/models/settings.model";
import { cn } from "@/lib/utils";

interface WidgetTabProps {
  settings: IAISalesAgentSettings;
  setSettings: Dispatch<SetStateAction<IAISalesAgentSettings>>;
  faviconUrl: string;
}

export function WidgetTab({ settings, setSettings, faviconUrl }: WidgetTabProps) {
  const t = useTranslations("aiSalesAgentAdmin");
  const currentWidgetTheme = settings.widget.widgetTheme || "nexus-modern";

  return (
    <TabsContent value="widget" className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="gap-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Palette className="h-4 w-4" />
              {t("widget.appearance.title")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* 4 AI Sales Agent Chat Box Widget Themes */}
            <div className="space-y-3 rounded-2xl border border-border/80 bg-muted/20 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-bold flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-[#77CDCC]" />
                    AI Chat Box Widget Theme
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Select one of 4 tailored styles for the storefront customer chat box.
                  </p>
                </div>
                <Badge variant="outline" className="border-[#77CDCC]/40 bg-[#77CDCC]/10 text-[#77CDCC] text-[10px] font-bold">
                  4 Widget Styles
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* 1. Nexus Modern Pro */}
                <div
                  onClick={() =>
                    setSettings((prev) => ({
                      ...prev,
                      widget: { ...prev.widget, widgetTheme: "nexus-modern" },
                    }))
                  }
                  className={cn(
                    "cursor-pointer relative flex flex-col justify-between p-3.5 rounded-xl border transition-all select-none hover:border-[#77CDCC]/60",
                    currentWidgetTheme === "nexus-modern"
                      ? "bg-[#001a45]/5 dark:bg-[#77CDCC]/10 border-[#77CDCC] shadow-md ring-1 ring-[#77CDCC]"
                      : "bg-card border-border hover:bg-muted/40"
                  )}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#001a45] text-[#77CDCC]">
                      <Bot className="h-4 w-4" />
                    </div>
                    {currentWidgetTheme === "nexus-modern" && (
                      <span className="rounded-full bg-[#77CDCC] text-[#001a45] p-0.5">
                        <Check className="h-3 w-3 stroke-[3]" />
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="font-bold text-xs block text-foreground">Nexus Modern Pro</span>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                      Signature script gradient header, glowing online beacon, and polished rounded card contour.
                    </p>
                  </div>
                </div>

                {/* 2. Nexus Glassmorphic Studio */}
                <div
                  onClick={() =>
                    setSettings((prev) => ({
                      ...prev,
                      widget: { ...prev.widget, widgetTheme: "nexus-glass" },
                    }))
                  }
                  className={cn(
                    "cursor-pointer relative flex flex-col justify-between p-3.5 rounded-xl border transition-all select-none hover:border-[#77CDCC]/60",
                    currentWidgetTheme === "nexus-glass"
                      ? "bg-[#001a45]/5 dark:bg-[#77CDCC]/10 border-[#77CDCC] shadow-md ring-1 ring-[#77CDCC]"
                      : "bg-card border-border hover:bg-muted/40"
                  )}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500/15 text-sky-500">
                      <Layers className="h-4 w-4" />
                    </div>
                    {currentWidgetTheme === "nexus-glass" && (
                      <span className="rounded-full bg-[#77CDCC] text-[#001a45] p-0.5">
                        <Check className="h-3 w-3 stroke-[3]" />
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="font-bold text-xs block text-foreground">Glassmorphic Studio</span>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                      Translucent frosted glass panel with backdrop blur, holographic border accents, and glass input pill.
                    </p>
                  </div>
                </div>

                {/* 3. Nexus Cyber HUD */}
                <div
                  onClick={() =>
                    setSettings((prev) => ({
                      ...prev,
                      widget: { ...prev.widget, widgetTheme: "nexus-cyber-hud" },
                    }))
                  }
                  className={cn(
                    "cursor-pointer relative flex flex-col justify-between p-3.5 rounded-xl border transition-all select-none hover:border-[#77CDCC]/60",
                    currentWidgetTheme === "nexus-cyber-hud"
                      ? "bg-[#001a45]/5 dark:bg-[#77CDCC]/10 border-[#77CDCC] shadow-md ring-1 ring-[#77CDCC]"
                      : "bg-card border-border hover:bg-muted/40"
                  )}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-500">
                      <Terminal className="h-4 w-4" />
                    </div>
                    {currentWidgetTheme === "nexus-cyber-hud" && (
                      <span className="rounded-full bg-[#77CDCC] text-[#001a45] p-0.5">
                        <Check className="h-3 w-3 stroke-[3]" />
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="font-bold text-xs block text-foreground">Cyber HUD Terminal</span>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                      High-tech neon glowing border accents, dark midnight backdrop, pulsing beacon dot, and telemetry status.
                    </p>
                  </div>
                </div>

                {/* 4. Nexus Floating Capsule */}
                <div
                  onClick={() =>
                    setSettings((prev) => ({
                      ...prev,
                      widget: { ...prev.widget, widgetTheme: "nexus-capsule" },
                    }))
                  }
                  className={cn(
                    "cursor-pointer relative flex flex-col justify-between p-3.5 rounded-xl border transition-all select-none hover:border-[#77CDCC]/60",
                    currentWidgetTheme === "nexus-capsule"
                      ? "bg-[#001a45]/5 dark:bg-[#77CDCC]/10 border-[#77CDCC] shadow-md ring-1 ring-[#77CDCC]"
                      : "bg-card border-border hover:bg-muted/40"
                  )}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/15 text-purple-500">
                      <Zap className="h-4 w-4" />
                    </div>
                    {currentWidgetTheme === "nexus-capsule" && (
                      <span className="rounded-full bg-[#77CDCC] text-[#001a45] p-0.5">
                        <Check className="h-3 w-3 stroke-[3]" />
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="font-bold text-xs block text-foreground">Floating Capsule</span>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                      Organic pill capsule header, avatar halo with glowing ring, and modern bubble message styling.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t("widget.appearance.headerTitle")}</Label>
              <Input
                value={settings.widget.headerTitle || ""}
                onChange={(event) =>
                  setSettings((prev) => ({
                    ...prev,
                    widget: {
                      ...prev.widget,
                      headerTitle: event.target.value,
                    },
                  }))
                }
                placeholder={settings.agentName}
                maxLength={60}
              />
              <p className="text-xs text-muted-foreground">
                {t("widget.appearance.headerTitleDescription")}
              </p>
            </div>

            <div className="space-y-2">
              <Label>{t("widget.appearance.position")}</Label>
              <Select
                value={settings.widget.position}
                onValueChange={(value) =>
                  setSettings((prev) => ({
                    ...prev,
                    widget: {
                      ...prev.widget,
                      position:
                        value as IAISalesAgentSettings["widget"]["position"],
                    },
                  }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bottom-right">
                    {t("widget.appearance.positionBottomRight")}
                  </SelectItem>
                  <SelectItem value="bottom-left">
                    {t("widget.appearance.positionBottomLeft")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3 rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                  <Sliders className="h-3.5 w-3.5" />
                  {t("widget.appearance.expandedSize")}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {t("widget.appearance.expandedSizeDescription")}
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">
                    {t("widget.appearance.width")}
                  </Label>
                  <div className="relative">
                    <Input
                      type="number"
                      min={320}
                      max={640}
                      value={settings.widget.width}
                      onChange={(event) =>
                        setSettings((prev) => ({
                          ...prev,
                          widget: {
                            ...prev.widget,
                            width: Number(event.target.value),
                          },
                        }))
                      }
                      className="pr-10"
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      px
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {t("widget.appearance.widthRange")}
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">
                    {t("widget.appearance.height")}
                  </Label>
                  <div className="relative">
                    <Input
                      type="number"
                      min={420}
                      max={900}
                      value={settings.widget.height}
                      onChange={(event) =>
                        setSettings((prev) => ({
                          ...prev,
                          widget: {
                            ...prev.widget,
                            height: Number(event.target.value),
                          },
                        }))
                      }
                      className="pr-10"
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      px
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {t("widget.appearance.heightRange")}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label>{t("widget.appearance.primaryColor")}</Label>
                <div className="flex items-center gap-3">
                  <Input
                    type="color"
                    className="h-10 w-16 cursor-pointer p-1"
                    value={settings.widget.primaryColor}
                    onChange={(event) =>
                      setSettings((prev) => ({
                        ...prev,
                        widget: {
                          ...prev.widget,
                          primaryColor: event.target.value,
                        },
                      }))
                    }
                  />
                  <Input
                    value={settings.widget.primaryColor}
                    onChange={(event) =>
                      setSettings((prev) => ({
                        ...prev,
                        widget: {
                          ...prev.widget,
                          primaryColor: event.target.value,
                        },
                      }))
                    }
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t("widget.appearance.accentColor")}</Label>
                <div className="flex items-center gap-3">
                  <Input
                    type="color"
                    className="h-10 w-16 cursor-pointer p-1"
                    value={settings.widget.accentColor}
                    onChange={(event) =>
                      setSettings((prev) => ({
                        ...prev,
                        widget: {
                          ...prev.widget,
                          accentColor: event.target.value,
                        },
                      }))
                    }
                  />
                  <Input
                    value={settings.widget.accentColor}
                    onChange={(event) =>
                      setSettings((prev) => ({
                        ...prev,
                        widget: {
                          ...prev.widget,
                          accentColor: event.target.value,
                        },
                      }))
                    }
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t("widget.appearance.footerText")}</Label>
              <Input
                value={settings.widget.footerText || ""}
                onChange={(event) =>
                  setSettings((prev) => ({
                    ...prev,
                    widget: {
                      ...prev.widget,
                      footerText: event.target.value,
                    },
                  }))
                }
                placeholder={t("widget.appearance.footerTextPlaceholder")}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label>{t("widget.appearance.showFooterText")}</Label>
                <p className="text-sm text-muted-foreground">
                  {t("widget.appearance.showFooterTextDescription")}
                </p>
              </div>
              <Switch
                checked={settings.widget.showFooterText}
                onCheckedChange={(value) =>
                  setSettings((prev) => ({
                    ...prev,
                    widget: { ...prev.widget, showFooterText: value },
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label>{t("widget.appearance.headerAvatar")}</Label>
              <MediaUploader
                value={
                  settings.widget.avatarUrl
                    ? [
                        {
                          _id: "ai-sales-avatar",
                          url: settings.widget.avatarUrl,
                          type: "image",
                          mimeType: "image/*",
                          alt: t("widget.appearance.headerAvatarAlt", {
                            name: settings.agentName,
                          }),
                          position: 0,
                        },
                      ]
                    : []
                }
                onChange={(items) => {
                  const avatar = items.find(
                    (item) => item.type === "image",
                  );
                  setSettings((prev) => ({
                    ...prev,
                    widget: {
                      ...prev.widget,
                      avatarUrl: avatar?.url || "",
                    },
                  }));
                }}
                maxFiles={1}
                acceptTypes={["image"]}
                uploadTitle={t("widget.appearance.avatarUploadTitle")}
                uploadDescription={t(
                  "widget.appearance.avatarUploadDescription",
                )}
                sizeGuide={t("widget.appearance.avatarSizeGuide")}
                mediaGridClassName="grid-cols-1 md:grid-cols-1 max-w-40"
                previewAspectRatio="1 / 1"
                previewFit="cover"
                showCoverBadge={false}
                coverHint={false}
              />
              <p className="text-xs text-muted-foreground">
                {t("widget.appearance.headerAvatarDescription")}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Live Interactive Preview Pane */}
        <Card className="overflow-hidden gap-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Eye className="h-4 w-4" />
              {t("widget.preview.title")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center rounded-xl bg-muted/40 p-4">
              <div
                className={cn(
                  "flex flex-col overflow-hidden transition-all duration-300",
                  currentWidgetTheme === "nexus-glass" &&
                    "rounded-[32px] border border-white/30 bg-card/65 backdrop-blur-2xl text-foreground shadow-2xl",
                  currentWidgetTheme === "nexus-cyber-hud" &&
                    "rounded-2xl border-2 border-[#77CDCC] bg-[#000d24] text-emerald-100 shadow-[0_0_25px_rgba(119,205,204,0.3)]",
                  currentWidgetTheme === "nexus-capsule" &&
                    "rounded-[36px] border border-border bg-card text-foreground shadow-2xl",
                  currentWidgetTheme === "nexus-modern" &&
                    "rounded-[28px] border border-border bg-background text-foreground shadow-xl"
                )}
                style={{
                  width: `min(${settings.widget.width}px, 100%)`,
                  height: `${Math.max(settings.widget.height, 0)}px`,
                  maxHeight: "70vh",
                }}
              >
                <div className="relative px-4 pt-4">
                  <div
                    className={cn(
                      "flex h-12 items-center justify-between px-5 text-white transition-all",
                      currentWidgetTheme === "nexus-cyber-hud"
                        ? "rounded-xl border border-[#77CDCC]/40 bg-[#001a45] shadow-xs font-mono"
                        : currentWidgetTheme === "nexus-capsule"
                        ? "rounded-full shadow-md"
                        : currentWidgetTheme === "nexus-glass"
                        ? "rounded-full border border-white/20 bg-white/20 dark:bg-white/10 backdrop-blur-xl"
                        : "rounded-2xl shadow-sm"
                    )}
                    style={{
                      background:
                        currentWidgetTheme === "nexus-cyber-hud"
                          ? "#001a45"
                          : currentWidgetTheme === "nexus-glass"
                          ? undefined
                          : `linear-gradient(135deg, ${settings.widget.primaryColor}, ${settings.widget.accentColor})`,
                    }}
                  >
                    <div className="flex items-center gap-2">
                      {currentWidgetTheme === "nexus-cyber-hud" && (
                        <span className="h-2 w-2 rounded-full bg-[#77CDCC] animate-pulse" />
                      )}
                      <span className="text-sm font-semibold tracking-wide">
                        {settings.widget.headerTitle?.trim() || settings.agentName}
                      </span>
                    </div>
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20">
                      <Plus className="h-4 w-4 rotate-45" />
                    </span>
                  </div>
                  <div className="pointer-events-none absolute left-1/2 top-11 -translate-x-1/2">
                    <AISalesHeaderIcon
                      avatarUrl={settings.widget.avatarUrl}
                      faviconUrl={faviconUrl}
                      primaryColor={settings.widget.primaryColor}
                      accentColor={settings.widget.accentColor}
                      agentName={settings.agentName}
                    />
                  </div>
                </div>
                <div className="flex-1 space-y-3 overflow-y-auto px-4 pb-4 pt-10">
                  <div className="flex gap-2">
                    <AISalesAssistantAvatar
                      primaryColor={settings.widget.primaryColor}
                    />
                    <div
                      className={cn(
                        "w-fit max-w-[85%] px-4 py-2.5 text-sm leading-relaxed",
                        currentWidgetTheme === "nexus-cyber-hud"
                          ? "rounded-xl border border-[#77CDCC]/30 bg-[#001a45]/80 text-[#77CDCC] font-mono"
                          : currentWidgetTheme === "nexus-glass"
                          ? "rounded-3xl border border-white/20 bg-card/70 backdrop-blur-md text-foreground"
                          : "rounded-3xl bg-muted text-foreground"
                      )}
                    >
                      {settings.greeting}
                    </div>
                  </div>
                </div>
                <div className="px-4 pb-4">
                  <div
                    className={cn(
                      "flex items-center gap-2 py-1.5 pl-4 pr-1.5 text-foreground transition-all",
                      currentWidgetTheme === "nexus-cyber-hud"
                        ? "rounded-xl border border-[#77CDCC] bg-[#001a45]/90 font-mono text-xs"
                        : currentWidgetTheme === "nexus-glass"
                        ? "rounded-full border border-white/30 bg-card/60 backdrop-blur-xl"
                        : "rounded-full border-2 bg-card"
                    )}
                    style={{
                      borderColor:
                        currentWidgetTheme === "nexus-cyber-hud"
                          ? "#77CDCC"
                          : settings.widget.primaryColor,
                    }}
                  >
                    <span className="flex h-9 flex-1 items-center text-sm text-muted-foreground">
                      {currentWidgetTheme === "nexus-cyber-hud"
                        ? ">> Input command or prompt..."
                        : t("widget.preview.typeMessage")}
                    </span>
                    <span
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white",
                        currentWidgetTheme === "nexus-cyber-hud" && "rounded-lg text-[#001a45]"
                      )}
                      style={{
                        backgroundColor:
                          currentWidgetTheme === "nexus-cyber-hud"
                            ? "#77CDCC"
                            : settings.widget.primaryColor,
                      }}
                    >
                      <ArrowUp className="h-4 w-4 stroke-[2.5]" />
                    </span>
                  </div>
                  {settings.widget.showFooterText &&
                    settings.widget.footerText && (
                      <p
                        className={cn(
                          "mt-2 text-center text-[11px] text-muted-foreground",
                          currentWidgetTheme === "nexus-cyber-hud" && "font-mono text-[#77CDCC]/80"
                        )}
                      >
                        {settings.widget.footerText}
                      </p>
                    )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </TabsContent>
  );
}

