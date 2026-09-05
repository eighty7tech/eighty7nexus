"use client";

import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  useDroppable,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  Globe2,
  GripVertical,
  Heart,
  Loader2,
  Menu,
  Moon,
  Palette,
  Package,
  Plus,
  RotateCcw,
  Search,
  Settings,
  ShoppingCart,
  Smartphone,
  Trash2,
  User,
  MapPin,
  Store,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MobileNavBuilder } from "@/components/admin/online-store/mobile-nav-builder";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import {
  UnderlineTabsList,
  UnderlineTabsTrigger,
} from "@/components/admin/underline-tabs";
import { toast } from "@/components/ui/toast-notification";
import { AppImage } from "@/components/ui/app-image";
import { LANGUAGE_OPTIONS } from "@/components/admin/settings/general/constants";
import {
  getDefaultHeaderSettings,
  normalizeHeaderSettings,
  HEADER_COLOR_MODES,
  HEADER_LOGO_VARIANTS,
  HEADER_UTILITY_PLACEMENTS,
  resolveHeaderLogoUrl,
  type CategoryTriggerColorScheme,
  type CategoryTriggerIcon,
  type CategoryTriggerOpenOn,
  type CategoryTriggerStyle,
  type HeaderColorMode,
  type HeaderColorScheme,
  type HeaderLogoVariant,
  type HeaderNavPosition,
  type HeaderSettings,
  type HeaderUtilityPlacement,
  type HeaderStyleVariant,
} from "@/lib/header-config";
import type { SectionInstance } from "@/lib/storefront/sections/types";
import {
  readAnnouncement,
  readTopTags,
  writeAnnouncement,
  writeTopTags,
  newTopTag,
  MAX_TOP_TAGS,
  type AnnouncementDraft,
  type TopTagsDraft,
} from "@/components/admin/online-store/header-chrome-state";
import {
  HeaderMenuLinksEditor,
  toMenuLinkDrafts,
  toMenuItems,
  type MenuLinkDraft,
} from "@/components/admin/online-store/header-menu-links-editor";
import {
  CategoryTriggerGlyph,
  categoryTriggerUsesBackground,
  getCategoryTriggerStyle,
} from "@/lib/header-trigger-style";
import {
  CONTENT_PAGE_KEYS,
  CONTENT_PAGE_META,
  HEADER_APP_PAGE_OPTIONS,
  normalizeContentPagesSettings,
  type ContentPagesSettings,
  type CustomPageData,
} from "@/lib/content-pages-config";
import { cn } from "@/lib/utils";
import { ColorField, FieldRow, SwitchRow } from "@/components/admin/online-store/builder-fields";
import { setNestedValue } from "@/components/admin/online-store/set-nested-value";

interface HeaderBuilderProps {
  locale: string;
  /**
   * The header group's draft sections, loaded server-side. The announcement
   * bar and top tags are edited here as instances on that document.
   */
  initialChromeSections: SectionInstance[];
}

type SettingsPayload = {
  success?: boolean;
  data?: {
    header?: unknown;
    contentPages?: unknown;
    general?: {
      storeName?: unknown;
      logoUrl?: unknown;
      darkModeLogoUrl?: unknown;
      defaultLanguage?: unknown;
      defaultCurrency?: unknown;
    };
  };
};

type GeneralBrandSettings = {
  storeName: string;
  logoUrl: string;
  darkModeLogoUrl: string;
};

const DESKTOP_QUICK_CATEGORY_FULL_LIMIT = 5;
const DESKTOP_QUICK_CATEGORY_PARTIAL_LIMIT = 7;
const DESKTOP_QUICK_CATEGORY_ONLY_LIMIT = 11;

function getDesktopQuickCategoryLimit(visibleNavGroupCount: number) {
  if (visibleNavGroupCount <= 0) return DESKTOP_QUICK_CATEGORY_ONLY_LIMIT;
  if (visibleNavGroupCount >= 3) return DESKTOP_QUICK_CATEGORY_FULL_LIMIT;
  return DESKTOP_QUICK_CATEGORY_PARTIAL_LIMIT;
}

type HeaderPageOption = {
  id: string;
  label: string;
  href: string;
  kind: "app" | "standard" | "custom";
  description?: string;
  searchText: string;
  visible: boolean;
};

type HeaderPageZone = HeaderNavPosition;

/**
 * Utility links surfaced as first-class rows in the pages panel (the Figma
 * "Track Order · Blog · Contact Us · Become a Vendor" run). They ride the
 * same pagesMenu storage as searched-in pages — these rows are just the
 * discoverable fast path.
 */
const FEATURED_HEADER_LINKS: { kind: "app" | "standard"; id: string }[] = [
  { kind: "app", id: "/track-order" },
  { kind: "app", id: "/blog" },
  { kind: "standard", id: "contact" },
  { kind: "app", id: "/become-vendor" },
];

const HEADER_PAGE_DROP_ZONE_IDS: Record<HeaderPageZone, string> = {
  left: "header-pages-left-zone",
  right: "header-pages-right-zone",
};

function normalizeInitialHeader(payload: SettingsPayload): HeaderSettings {
  const header = normalizeHeaderSettings(payload.data?.header);
  const defaultLanguage = payload.data?.general?.defaultLanguage;
  const defaultCurrency = payload.data?.general?.defaultCurrency;

  if (typeof defaultLanguage === "string" && defaultLanguage.trim()) {
    header.market.defaultLanguage = defaultLanguage.trim().toLowerCase();
  }

  if (typeof defaultCurrency === "string" && defaultCurrency.trim()) {
    header.market.defaultCurrency = defaultCurrency.trim().toUpperCase();
  }

  return header;
}

export function HeaderBuilder({
  locale,
  initialChromeSections,
}: HeaderBuilderProps) {
  const t = useTranslations("admin.headerStudio");
  const [header, setHeader] = useState<HeaderSettings>(getDefaultHeaderSettings());
  const [contentPages, setContentPages] = useState<ContentPagesSettings>(
    normalizeContentPagesSettings(undefined),
  );
  const [initialHeader, setInitialHeader] = useState<HeaderSettings>(
    getDefaultHeaderSettings(),
  );
  const [generalBrand, setGeneralBrand] = useState<GeneralBrandSettings>({
    storeName: "",
    logoUrl: "",
    darkModeLogoUrl: "",
  });
  const [defaultLanguage, setDefaultLanguage] = useState("en");
  // Announcement bar + top tags live on the header group document, not in
  // settings — the whole draft sections array is kept so a save writes back
  // everything the document held, with only these two instances changed.
  const [chromeSections, setChromeSections] =
    useState<SectionInstance[]>(initialChromeSections);
  const [initialChrome, setInitialChrome] =
    useState<SectionInstance[]>(initialChromeSections);
  // The header's custom links (the `main-header` menu). `null` until loaded.
  const [menuLinks, setMenuLinks] = useState<MenuLinkDraft[] | null>(null);
  const [initialMenuLinks, setInitialMenuLinks] = useState<MenuLinkDraft[]>([]);
  const [menuExists, setMenuExists] = useState(false);

  // The mobile drawer's custom links (the `mobile-drawer` menu). `null` until loaded.
  const [mobileMenuLinks, setMobileMenuLinks] = useState<MenuLinkDraft[] | null>(null);
  const [initialMobileMenuLinks, setInitialMobileMenuLinks] = useState<MenuLinkDraft[]>([]);
  const [mobileMenuExists, setMobileMenuExists] = useState(false);

  const [styleDialogOpen, setStyleDialogOpen] = useState(false);
  const [pageSearchQuery, setPageSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const headerPageDragSensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
  );

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch("/api/admin/settings", { method: "GET" });
        const payload = (await response.json()) as SettingsPayload;

        if (!response.ok || payload.success !== true) {
          throw new Error(t("toast.loadSettingsFailed"));
        }

        const parsed = normalizeInitialHeader(payload);
        const general = payload.data?.general;
        setContentPages(normalizeContentPagesSettings(payload.data?.contentPages));
        setGeneralBrand({
          storeName:
            typeof general?.storeName === "string" ? general.storeName.trim() : "",
          logoUrl:
            typeof general?.logoUrl === "string" ? general.logoUrl.trim() : "",
          darkModeLogoUrl:
            typeof general?.darkModeLogoUrl === "string"
              ? general.darkModeLogoUrl.trim()
              : "",
        });
        if (
          typeof general?.defaultLanguage === "string" &&
          general.defaultLanguage.trim()
        ) {
          setDefaultLanguage(general.defaultLanguage.trim().toLowerCase());
        }
        setHeader(parsed);
        setInitialHeader(parsed);
      } catch {
        toast.error(t("toast.loadFailed"));
      } finally {
        setIsLoading(false);
      }
    };

    void fetchSettings();
  }, []);

  useEffect(() => {
    // The admin list route seeds the default menus, so a store that has
    // never opened the menu screens still gets its `main-header` here.
    const fetchMenu = async () => {
      try {
        const [mainResponse, mobileResponse] = await Promise.all([
          fetch("/api/menus?handle=main-header"),
          fetch("/api/menus?handle=mobile-drawer")
        ]);

        // Main Menu
        const mainPayload = (await mainResponse.json()) as { success?: boolean; data?: unknown; };
        if (!mainResponse.ok || mainPayload.success !== true) throw new Error("menu load failed");
        const mainMenu = Array.isArray(mainPayload.data) ? mainPayload.data[0] : null;
        const mainDrafts = toMenuLinkDrafts((mainMenu as { items?: unknown } | null)?.items);
        setMenuExists(Boolean(mainMenu));
        setMenuLinks(mainDrafts);
        setInitialMenuLinks(mainDrafts);

        // Mobile Menu
        const mobilePayload = (await mobileResponse.json()) as { success?: boolean; data?: unknown; };
        if (!mobileResponse.ok || mobilePayload.success !== true) throw new Error("mobile menu load failed");
        const mobileMenu = Array.isArray(mobilePayload.data) ? mobilePayload.data[0] : null;
        const mobileDrafts = toMenuLinkDrafts((mobileMenu as { items?: unknown } | null)?.items);
        setMobileMenuExists(Boolean(mobileMenu));
        setMobileMenuLinks(mobileDrafts);
        setInitialMobileMenuLinks(mobileDrafts);
      } catch {
        // Leave links editable from empty; a save will create the menu.
        setMenuExists(false);
        setMenuLinks([]);
        setInitialMenuLinks([]);

        setMobileMenuExists(false);
        setMobileMenuLinks([]);
        setInitialMobileMenuLinks([]);
      }
    };

    void fetchMenu();
  }, []);

  const isSettingsDirty = useMemo(
    () => JSON.stringify(header) !== JSON.stringify(initialHeader),
    [header, initialHeader],
  );
  const isChromeDirty = useMemo(
    () => JSON.stringify(chromeSections) !== JSON.stringify(initialChrome),
    [chromeSections, initialChrome],
  );
  const isMenuDirty = useMemo(
    () => {
      const mainDirty = menuLinks !== null &&
        JSON.stringify(toMenuItems(menuLinks)) !== JSON.stringify(toMenuItems(initialMenuLinks));
      const mobileDirty = mobileMenuLinks !== null &&
        JSON.stringify(toMenuItems(mobileMenuLinks)) !== JSON.stringify(toMenuItems(initialMobileMenuLinks));
      return mainDirty || mobileDirty;
    },
    [menuLinks, initialMenuLinks, mobileMenuLinks, initialMobileMenuLinks],
  );
  const isDirty = isSettingsDirty || isChromeDirty || isMenuDirty;

  const updateField = (path: string, value: unknown) => {
    setHeader((prev) => setNestedValue(prev, path, value));
  };

  // New-key guard: these labels post-date several locale files, so they fall
  // back to the English literal instead of a MISSING_MESSAGE error.
  const tf = (key: string, fallback: string) =>
    t.has(key) ? t(key) : fallback;

  const announcement = useMemo(
    () => readAnnouncement(chromeSections, defaultLanguage),
    [chromeSections, defaultLanguage],
  );
  const topTags = useMemo(
    () => readTopTags(chromeSections, defaultLanguage),
    [chromeSections, defaultLanguage],
  );
  const updateAnnouncement = (patch: Partial<AnnouncementDraft>) => {
    setChromeSections((prev) =>
      writeAnnouncement(
        prev,
        { ...readAnnouncement(prev, defaultLanguage), ...patch },
        defaultLanguage,
      ),
    );
  };
  const updateTopTags = (patch: Partial<TopTagsDraft>) => {
    setChromeSections((prev) =>
      writeTopTags(
        prev,
        { ...readTopTags(prev, defaultLanguage), ...patch },
        defaultLanguage,
      ),
    );
  };

  const pageOptions = useMemo(
    () => buildHeaderPageOptions(contentPages, t),
    [contentPages, t],
  );

  const filteredPageOptions = useMemo(() => {
    const query = pageSearchQuery.trim().toLowerCase();

    if (!query) return [];

    return pageOptions
      .filter((page) => page.searchText.includes(query))
      .slice(0, 8);
  }, [pageOptions, pageSearchQuery]);
  const hasPageSearchQuery = pageSearchQuery.trim().length > 0;

  const selectedPageOptions = useMemo(() => {
    const selectedPageMap = new Map(
      pageOptions
        .filter((page) => isHeaderPageSelected(header, page))
        .map((page) => [getHeaderPageKey(page), page]),
    );

    return [
      ...header.pagesMenu.order.flatMap((key) => {
        const page = selectedPageMap.get(key);
        return page ? [page] : [];
      }),
      ...Array.from(selectedPageMap.entries())
        .filter(([key]) => !header.pagesMenu.order.includes(key))
        .map(([, page]) => page),
    ];
  }, [header, pageOptions]);
  const selectedPageKeys = useMemo(
    () => selectedPageOptions.map(getHeaderPageKey),
    [selectedPageOptions],
  );
  const selectedPageGroups = useMemo(() => {
    const groups: Record<HeaderPageZone, HeaderPageOption[]> = {
      left: [],
      right: [],
    };

    selectedPageOptions.forEach((page) => {
      const key = getHeaderPageKey(page);
      const position = header.pagesMenu.positions[key] || "right";
      groups[position].push(page);
    });

    return groups;
  }, [header.pagesMenu.positions, selectedPageOptions]);
  const selectedPageGroupKeys = useMemo(
    () => ({
      left: selectedPageGroups.left.map(getHeaderPageKey),
      right: selectedPageGroups.right.map(getHeaderPageKey),
    }),
    [selectedPageGroups],
  );
  const hasHeaderPageNav =
    header.utilityMenu.enabled &&
    header.pagesMenu.enabled &&
    selectedPageOptions.length > 0;
  const quickCategoryDesktopLimit = getDesktopQuickCategoryLimit(
    [
      header.categoryMenu.enabled,
      header.collectionsMenu.enabled,
      hasHeaderPageNav,
    ].filter(Boolean).length,
  );

  useEffect(() => {
    if (header.categoryMenu.quickLimit <= quickCategoryDesktopLimit) return;

    setHeader((prev) => ({
      ...prev,
      categoryMenu: {
        ...prev.categoryMenu,
        quickLimit: quickCategoryDesktopLimit,
      },
    }));
  }, [header.categoryMenu.quickLimit, quickCategoryDesktopLimit]);

  const addHeaderPage = (
    page: HeaderPageOption,
    position: HeaderNavPosition = "right",
  ) => {
    setHeader((prev) => {
      const collection = getHeaderPageCollection(page);
      const key = getHeaderPageKey(page);
      const current = prev.pagesMenu[collection];

      return {
        ...prev,
        pagesMenu: {
          ...prev.pagesMenu,
          [collection]: Array.from(new Set([...current, page.id])),
          order: prev.pagesMenu.order.includes(key)
            ? prev.pagesMenu.order
            : [...prev.pagesMenu.order, key],
          positions: {
            ...prev.pagesMenu.positions,
            [key]: position,
          },
        },
      };
    });
    setPageSearchQuery("");
  };

  const removeHeaderPage = (page: HeaderPageOption) => {
    setHeader((prev) => {
      const collection = getHeaderPageCollection(page);
      const key = getHeaderPageKey(page);
      const positions = { ...prev.pagesMenu.positions };
      delete positions[key];

      return {
        ...prev,
        pagesMenu: {
          ...prev.pagesMenu,
          [collection]: prev.pagesMenu[collection].filter(
            (item) => item !== page.id,
          ),
          order: prev.pagesMenu.order.filter((item) => item !== key),
          positions,
        },
      };
    });
  };

  const updateHeaderPagePosition = (
    page: HeaderPageOption,
    position: HeaderNavPosition,
  ) => {
    const key = getHeaderPageKey(page);
    setHeader((prev) => ({
      ...prev,
      pagesMenu: {
        ...prev.pagesMenu,
        positions: {
          ...prev.pagesMenu.positions,
          [key]: position,
        },
      },
    }));
  };

  const reorderHeaderPages = (activeKey: string, overId: string) => {
    if (activeKey === overId) return;
    setHeader((prev) => {
      const visibleOrder = [
        ...prev.pagesMenu.order.filter((key) => selectedPageKeys.includes(key)),
        ...selectedPageKeys.filter((key) => !prev.pagesMenu.order.includes(key)),
      ];
      const activeIndex = visibleOrder.indexOf(activeKey);

      if (activeIndex < 0) return prev;

      const dropZone = getHeaderPageDropZonePosition(overId);
      const overPosition =
        dropZone || prev.pagesMenu.positions[overId] || "right";
      const positions = {
        ...prev.pagesMenu.positions,
        [activeKey]: overPosition,
      };
      const visibleWithoutActive = visibleOrder.filter((key) => key !== activeKey);
      const targetZoneKeys = dropZone
        ? visibleWithoutActive.filter(
            (key) => (positions[key] || "right") === dropZone,
          )
        : [];
      const insertAfterKey = dropZone
        ? targetZoneKeys[targetZoneKeys.length - 1]
        : undefined;
      const overIndex = dropZone
        ? insertAfterKey
          ? visibleWithoutActive.indexOf(insertAfterKey) + 1
          : visibleWithoutActive.length
        : visibleWithoutActive.indexOf(overId);

      if (overIndex < 0) return prev;
      const nextVisibleOrder = [
        ...visibleWithoutActive.slice(0, overIndex),
        activeKey,
        ...visibleWithoutActive.slice(overIndex),
      ];

      return {
        ...prev,
        pagesMenu: {
          ...prev.pagesMenu,
          positions,
          order: [
            ...nextVisibleOrder,
            ...prev.pagesMenu.order.filter(
              (key) => !selectedPageKeys.includes(key),
            ),
          ],
        },
      };
    });
  };

  const handleHeaderPageDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;
    reorderHeaderPages(String(active.id), String(over.id));
  };

  const handleHeaderPageDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    reorderHeaderPages(String(active.id), String(over.id));
  };

  const save = async () => {
    try {
      setIsSaving(true);

      if (isSettingsDirty) {
        const normalized = normalizeHeaderSettings(header);

        const headerResponse = await fetch("/api/admin/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ section: "header", data: normalized }),
        });
        const headerPayload = (await headerResponse.json()) as SettingsPayload;

        if (!headerResponse.ok || headerPayload.success !== true) {
          throw new Error(t("toast.saveFailed"));
        }

        const saved = normalizeInitialHeader(headerPayload);
        setHeader(saved);
        setInitialHeader(saved);
      }

      if (isChromeDirty) {
        // Draft save, then publish — the announcement bar and top tags are
        // instances on the header group document, which goes live through
        // the same draft → publish gate Customize uses.
        const draftResponse = await fetch(
          "/api/admin/store-pages/group:header",
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sections: chromeSections }),
          },
        );
        if (!draftResponse.ok) {
          throw new Error(t("toast.saveFailed"));
        }
        const publishResponse = await fetch(
          "/api/admin/store-pages/group:header/publish",
          { method: "POST" },
        );
        if (!publishResponse.ok) {
          throw new Error(t("toast.saveFailed"));
        }
        setInitialChrome(chromeSections);
      }

      if (isMenuDirty) {
        if (menuLinks !== null && JSON.stringify(toMenuItems(menuLinks)) !== JSON.stringify(toMenuItems(initialMenuLinks))) {
          const items = toMenuItems(menuLinks);
          const menuResponse = menuExists
            ? await fetch("/api/menus/main-header", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ items }),
              })
            : await fetch("/api/menus", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: "Main menu", handle: "main-header", location: "header", items }),
              });
          if (!menuResponse.ok) throw new Error(t("toast.saveFailed"));
          setMenuExists(true);
          setInitialMenuLinks(menuLinks);
        }

        if (mobileMenuLinks !== null && JSON.stringify(toMenuItems(mobileMenuLinks)) !== JSON.stringify(toMenuItems(initialMobileMenuLinks))) {
          const mobileItems = toMenuItems(mobileMenuLinks);
          const mobileMenuResponse = mobileMenuExists
            ? await fetch("/api/menus/mobile-drawer", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ items: mobileItems }),
              })
            : await fetch("/api/menus", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: "Mobile Drawer Menu", handle: "mobile-drawer", location: "header", items: mobileItems }),
              });
          if (!mobileMenuResponse.ok) throw new Error(t("toast.saveFailed"));
          setMobileMenuExists(true);
          setInitialMobileMenuLinks(mobileMenuLinks);
        }
      }

      toast.success(t("toast.published"));
    } catch {
      toast.error(t("toast.saveFailed"));
    } finally {
      setIsSaving(false);
    }
  };

  const discardChanges = () => {
    setHeader(initialHeader);
    setChromeSections(initialChrome);
    setMenuLinks(menuLinks === null ? null : initialMenuLinks);
    setMobileMenuLinks(mobileMenuLinks === null ? null : initialMobileMenuLinks);
  };

  const restoreDefaults = () => setHeader(getDefaultHeaderSettings());

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5">
      <AdminFormStickyHeader
        className="!mx-0 -mt-2 border-b-0 px-0 shadow-none md:px-0"
        title={t("title")}
        status={
          <Badge variant={isDirty ? "secondary" : "default"}>
            {isDirty ? t("status.draft") : t("status.published")}
          </Badge>
        }
        actions={
          <>
            <Button
              variant="outline"
              onClick={discardChanges}
              disabled={!isDirty || isSaving}
              size="sm"
            >
              {t("actions.discard")}
            </Button>
            <Button
              variant="outline"
              onClick={restoreDefaults}
              disabled={isSaving}
              size="sm"
            >
              <RotateCcw className="h-4 w-4" />
              {t("actions.defaults")}
            </Button>
            <Button onClick={save} disabled={isSaving || !isDirty} size="sm">
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {t("actions.publish")}
            </Button>
          </>
        }
      />

      {/* Current header style + the template picker modal (Figma: "Header
          Style" heading with a Change button above the live preview). */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-base font-semibold">
            {tf("style.title", "Header style")}
          </p>
          <p className="text-xs text-muted-foreground">
            {tf(
              `style.templates.${header.layout.variant}`,
              HEADER_TEMPLATES.find(
                (template) => template.key === header.layout.variant,
              )?.label ?? header.layout.variant,
            )}
          </p>
        </div>
        <Button size="sm" onClick={() => setStyleDialogOpen(true)}>
          {tf("style.change", "Choose Template")}
        </Button>
      </div>

      <HeaderStyleDialog
        open={styleDialogOpen}
        onOpenChange={setStyleDialogOpen}
        value={header.layout.variant}
        generalBrand={generalBrand}
        onSelect={(variant) => {
          updateField("layout.variant", variant);
          setStyleDialogOpen(false);
        }}
        tf={tf}
      />

      <HeaderPreview
        header={header}
        generalBrand={generalBrand}
        announcement={announcement}
        topTags={topTags}
      />

      <Tabs defaultValue="brand" className="gap-4">
        <UnderlineTabsList>
          <UnderlineTabsTrigger value="brand" icon={Palette}>
            {t("tabs.brand")}
          </UnderlineTabsTrigger>
          <UnderlineTabsTrigger value="navigation" icon={Menu}>
            {t("tabs.navigation")}
          </UnderlineTabsTrigger>
          <UnderlineTabsTrigger value="search" icon={Search}>
            {t("tabs.search")}
          </UnderlineTabsTrigger>
          <UnderlineTabsTrigger value="market" icon={Settings}>
            {t("tabs.widgets")}
          </UnderlineTabsTrigger>
          <UnderlineTabsTrigger value="mobile" icon={Smartphone}>
            {t("tabs.mobile")}
          </UnderlineTabsTrigger>
        </UnderlineTabsList>

        <TabsContent value="brand" className="space-y-4">
          <Card className="gap-4">
            <CardHeader>
              <CardTitle>{t("brand.title")}</CardTitle>
              <CardDescription>
                {t("brand.description")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <FieldRow label={t("fields.logoAlt")}>
                <Input
                  value={header.brand.logoAlt}
                  placeholder={generalBrand.storeName}
                  onChange={(event) =>
                    updateField("brand.logoAlt", event.target.value)
                  }
                />
              </FieldRow>
              {/* The two paint modes whose contrast the logo cannot infer.
                  Both are always editable — a merchant setting up a color bar
                  should not have to switch modes to pre-pick the artwork. */}
              <div className="grid gap-4 md:grid-cols-2">
                <HeaderLogoVariantField
                  label={tf("fields.colorModeLogo", "Logo on color header")}
                  hint={tf(
                    "fields.colorModeLogoHint",
                    "Which artwork the bar shows when Header color is “Color”.",
                  )}
                  value={header.brand.colorModeLogo}
                  onChange={(value) => updateField("brand.colorModeLogo", value)}
                  tf={tf}
                />
                <HeaderLogoVariantField
                  label={tf(
                    "fields.transparentModeLogo",
                    "Logo on transparent header",
                  )}
                  hint={tf(
                    "fields.transparentModeLogoHint",
                    "Which artwork the bar shows when Header color is “Transparent”. Auto follows the shopper’s theme.",
                  )}
                  value={header.brand.transparentModeLogo}
                  onChange={(value) =>
                    updateField("brand.transparentModeLogo", value)
                  }
                  tf={tf}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <NumberField
                  label={t("fields.desktopLogoWidth")}
                  value={header.brand.desktopLogoWidth}
                  min={80}
                  max={260}
                  onChange={(value) => updateField("brand.desktopLogoWidth", value)}
                />
                <NumberField
                  label={t("fields.mobileLogoWidth")}
                  value={header.brand.mobileLogoWidth}
                  min={72}
                  max={180}
                  onChange={(value) => updateField("brand.mobileLogoWidth", value)}
                />
                <SwitchRow
                  label={t("fields.fullWidthHeader")}
                  checked={header.layout.fullWidth}
                  onChange={(value) => updateField("layout.fullWidth", value)}
                />
                <SwitchRow
                  label={t("fields.stickyHeader")}
                  checked={header.layout.sticky}
                  onChange={(value) => updateField("layout.sticky", value)}
                />
              </div>
              <HeaderColorModeField
                label={tf("fields.headerColor", "Header color")}
                value={header.layout.color}
                onChange={(value) => updateField("layout.color", value)}
                tf={tf}
              />
              <Separator />
              <ColorSchemeFields
                title={t("colors.light")}
                scheme={header.colors.light}
                pathPrefix="colors.light"
                onChange={updateField}
              />
              <ColorSchemeFields
                title={t("colors.dark")}
                scheme={header.colors.dark}
                pathPrefix="colors.dark"
                onChange={updateField}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="search" className="space-y-4">
          <Card className="gap-4">
            <CardHeader>
              <CardTitle>{t("search.title")}</CardTitle>
              <CardDescription>
                {t("search.description")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-3 md:grid-cols-2">
                <SwitchRow
                  label={t("fields.showSearchBar")}
                  checked={header.search.enabled}
                  onChange={(value) => updateField("search.enabled", value)}
                />
                <SwitchRow
                  label={t("fields.showAiSearchButton")}
                  checked={header.search.showAiButton}
                  disabled={!header.search.enabled}
                  onChange={(value) => updateField("search.showAiButton", value)}
                />
                <SwitchRow
                  label={tf(
                    "fields.searchCategoryDropdown",
                    "Category dropdown in search",
                  )}
                  checked={header.search.showCategoryDropdown}
                  disabled={!header.search.enabled}
                  onChange={(value) =>
                    updateField("search.showCategoryDropdown", value)
                  }
                />
              </div>
              <FieldRow label={t("fields.searchPlaceholder")}>
                <Input
                  value={header.search.placeholder}
                  onChange={(event) =>
                    updateField("search.placeholder", event.target.value)
                  }
                  disabled={!header.search.enabled}
                />
              </FieldRow>
              <div className="grid gap-4 md:grid-cols-2">
                <NumberField
                  label={t("fields.desktopSearchWidth")}
                  value={header.search.desktopWidth}
                  min={360}
                  max={900}
                  disabled={!header.search.enabled}
                  onChange={(value) => updateField("search.desktopWidth", value)}
                />
                <NumberField
                  label={t("fields.searchHeight")}
                  value={header.search.height}
                  min={34}
                  max={52}
                  disabled={!header.search.enabled}
                  onChange={(value) => updateField("search.height", value)}
                />
                <NumberField
                  label={t("fields.searchCornerRadius")}
                  value={header.search.borderRadius}
                  min={0}
                  max={999}
                  disabled={!header.search.enabled}
                  onChange={(value) => updateField("search.borderRadius", value)}
                />
                <ColorField
                  label={t("fields.searchBorderColor")}
                  value={header.search.borderColor}
                  disabled={!header.search.enabled}
                  onChange={(value) => updateField("search.borderColor", value)}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {t("search.colorHint")}
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="navigation" className="space-y-4">
          <Card className="gap-4">
            <CardHeader>
              <CardTitle>
                {tf("announcement.title", "Announcement bar")}
              </CardTitle>
              <CardDescription>
                {tf(
                  "announcement.description",
                  "A slim notice strip above the header — sales, shipping offers, store news.",
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <SwitchRow
                label={tf("announcement.enabled", "Show announcement bar")}
                checked={announcement.enabled}
                onChange={(value) => updateAnnouncement({ enabled: value })}
              />
              <div
                className={cn(
                  "grid gap-4 md:grid-cols-2",
                  !announcement.enabled && "opacity-55",
                )}
              >
                <FieldRow label={tf("announcement.text", "Text")}>
                  <Input
                    value={announcement.text}
                    disabled={!announcement.enabled}
                    placeholder={tf(
                      "announcement.textPlaceholder",
                      "Today deal — sale up to 70% off",
                    )}
                    onChange={(event) =>
                      updateAnnouncement({ text: event.target.value })
                    }
                  />
                </FieldRow>
                <FieldRow label={tf("announcement.link", "Link (optional)")}>
                  <Input
                    value={announcement.url}
                    disabled={!announcement.enabled}
                    placeholder="/products"
                    onChange={(event) =>
                      updateAnnouncement({ url: event.target.value })
                    }
                  />
                </FieldRow>
                <FieldRow
                  label={tf("announcement.backgroundColor", "Background color")}
                >
                  <Input
                    value={announcement.backgroundColor}
                    disabled={!announcement.enabled}
                    placeholder={tf(
                      "announcement.colorPlaceholder",
                      "Empty = theme color",
                    )}
                    onChange={(event) =>
                      updateAnnouncement({
                        backgroundColor: event.target.value,
                      })
                    }
                  />
                </FieldRow>
                <FieldRow label={tf("announcement.textColor", "Text color")}>
                  <Input
                    value={announcement.textColor}
                    disabled={!announcement.enabled}
                    placeholder={tf(
                      "announcement.colorPlaceholder",
                      "Empty = theme color",
                    )}
                    onChange={(event) =>
                      updateAnnouncement({ textColor: event.target.value })
                    }
                  />
                </FieldRow>
              </div>
            </CardContent>
          </Card>

          <Card className="gap-4">
            <CardHeader>
              <CardTitle>{tf("topTags.title", "Top tags")}</CardTitle>
              <CardDescription>
                {tf(
                  "topTags.description",
                  "The trending-links row under the header — quick jumps into searches, categories, or campaigns.",
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <SwitchRow
                label={tf("topTags.enabled", "Show top tags")}
                checked={topTags.enabled}
                onChange={(value) => updateTopTags({ enabled: value })}
              />
              <div
                className={cn(
                  "space-y-2",
                  !topTags.enabled && "pointer-events-none opacity-55",
                )}
              >
                {topTags.tags.map((tag, index) => (
                  <div
                    key={tag.id}
                    className="flex flex-col gap-2 sm:flex-row sm:items-center"
                  >
                    <Input
                      value={tag.label}
                      placeholder={tf("topTags.labelPlaceholder", "Label")}
                      onChange={(event) =>
                        updateTopTags({
                          tags: topTags.tags.map((entry, i) =>
                            i === index
                              ? { ...entry, label: event.target.value }
                              : entry,
                          ),
                        })
                      }
                      className="sm:max-w-52"
                    />
                    <Input
                      value={tag.url}
                      placeholder="/products?search=phone"
                      onChange={(event) =>
                        updateTopTags({
                          tags: topTags.tags.map((entry, i) =>
                            i === index
                              ? { ...entry, url: event.target.value }
                              : entry,
                          ),
                        })
                      }
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() =>
                        updateTopTags({
                          tags: topTags.tags.filter((_, i) => i !== index),
                        })
                      }
                      aria-label={tf("topTags.remove", "Remove tag")}
                      className="shrink-0 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={topTags.tags.length >= MAX_TOP_TAGS}
                  onClick={() =>
                    updateTopTags({ tags: [...topTags.tags, newTopTag()] })
                  }
                >
                  <Plus className="h-4 w-4" />
                  {tf("topTags.add", "Add tag")}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="gap-4">
            <CardHeader>
              <CardTitle>{tf("menuLinks.title", "Custom menu links")}</CardTitle>
              <CardDescription>
                {tf(
                  "menuLinks.description",
                  "The header's own nav links. A link with sub-links renders as a dropdown. Pages you add under “Selected pages” below appear alongside these.",
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {menuLinks === null ? (
                <div className="flex h-24 items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <HeaderMenuLinksEditor links={menuLinks} onChange={setMenuLinks} />
              )}
              <Separator />
              <Button asChild variant="outline" size="sm">
                <Link
                  href={`/${locale}/admin/online-store/menus/main-mega-menu/edit`}
                >
                  {tf("menuLinks.openMegaMenu", "Edit mega menu")}
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="gap-4">
            <CardHeader>
              <CardTitle>{t("navigation.categoryTitle")}</CardTitle>
              <CardDescription>
                {t("navigation.categoryDescription")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-3 md:grid-cols-2">
                <SwitchRow
                  label={t("fields.showCategoryMenuButton")}
                  checked={header.categoryMenu.enabled}
                  onChange={(value) => updateField("categoryMenu.enabled", value)}
                />
                <SwitchRow
                  label={t("fields.showMegaMenu")}
                  checked={header.categoryMenu.showMegaMenu}
                  onChange={(value) =>
                    updateField("categoryMenu.showMegaMenu", value)
                  }
                />
                <SwitchRow
                  label={t("fields.showCollectionsMenu")}
                  checked={header.collectionsMenu.enabled}
                  onChange={(value) => updateField("collectionsMenu.enabled", value)}
                />
                <SwitchRow
                  label={t("fields.showQuickCategory")}
                  checked={header.categoryMenu.showQuickLinks}
                  onChange={(value) =>
                    updateField("categoryMenu.showQuickLinks", value)
                  }
                />
              </div>
              {!header.categoryMenu.enabled ? (
                <p className="text-xs text-muted-foreground">
                  {t("navigation.megaHiddenHint")}
                </p>
              ) : null}
              <div className="grid gap-4 md:grid-cols-2">
                <PositionField
                  label={t("fields.categoryMenuSide")}
                  value={header.categoryMenu.position}
                  disabled={!header.categoryMenu.enabled}
                  onChange={(value) => updateField("categoryMenu.position", value)}
                />
                <PositionField
                  label={t("fields.collectionsMenuSide")}
                  value={header.collectionsMenu.position}
                  disabled={!header.collectionsMenu.enabled}
                  onChange={(value) =>
                    updateField("collectionsMenu.position", value)
                  }
                />
                <FieldRow label={t("fields.categoryMenuLabel")}>
                  <Input
                    value={header.categoryMenu.label}
                    disabled={!header.categoryMenu.enabled}
                    onChange={(event) =>
                      updateField("categoryMenu.label", event.target.value)
                    }
                  />
                </FieldRow>
                <FieldRow label={t("fields.collectionsLabel")}>
                  <Input
                    value={header.collectionsMenu.label}
                    disabled={!header.collectionsMenu.enabled}
                    onChange={(event) =>
                      updateField("collectionsMenu.label", event.target.value)
                    }
                  />
                </FieldRow>
                <NumberField
                  label={t("fields.quickCategoryMaxLimit")}
                  value={header.categoryMenu.quickLimit}
                  min={0}
                  max={quickCategoryDesktopLimit}
                  disabled={!header.categoryMenu.showQuickLinks}
                  onChange={(value) => updateField("categoryMenu.quickLimit", value)}
                />
                <NumberField
                  label={t("fields.collectionsLimit")}
                  value={header.collectionsMenu.limit}
                  min={0}
                  max={24}
                  disabled={!header.collectionsMenu.enabled}
                  onChange={(value) => updateField("collectionsMenu.limit", value)}
                />
              </div>
              <Separator />
              <SwitchRow
                label={t("fields.showCategoryPromoCard")}
                checked={header.categoryMenu.showPromoCard}
                disabled={!header.categoryMenu.enabled}
                onChange={(value) => updateField("categoryMenu.showPromoCard", value)}
              />
              <div className="grid gap-4 md:grid-cols-2">
                <FieldRow label={t("fields.promoTitle")}>
                  <Input
                    value={header.categoryMenu.promoTitle}
                    disabled={
                      !header.categoryMenu.enabled ||
                      !header.categoryMenu.showPromoCard
                    }
                    onChange={(event) =>
                      updateField("categoryMenu.promoTitle", event.target.value)
                    }
                  />
                </FieldRow>
                <FieldRow label={t("fields.promoSubtitle")}>
                  <Input
                    value={header.categoryMenu.promoSubtitle}
                    disabled={
                      !header.categoryMenu.enabled ||
                      !header.categoryMenu.showPromoCard
                    }
                    onChange={(event) =>
                      updateField("categoryMenu.promoSubtitle", event.target.value)
                    }
                  />
                </FieldRow>
                <FieldRow label={t("fields.promoLink")}>
                  <Input
                    value={header.categoryMenu.promoHref}
                    disabled={
                      !header.categoryMenu.enabled ||
                      !header.categoryMenu.showPromoCard
                    }
                    onChange={(event) =>
                      updateField("categoryMenu.promoHref", event.target.value)
                    }
                  />
                </FieldRow>
                <FieldRow label={t("fields.promoImage")}>
                  <Input
                    value={header.categoryMenu.promoImageSrc}
                    disabled={
                      !header.categoryMenu.enabled ||
                      !header.categoryMenu.showPromoCard
                    }
                    onChange={(event) =>
                      updateField("categoryMenu.promoImageSrc", event.target.value)
                    }
                  />
                </FieldRow>
              </div>
            </CardContent>
          </Card>

          <Card className="gap-4">
            <CardHeader>
              <CardTitle>{t("trigger.title")}</CardTitle>
              <CardDescription>{t("trigger.description")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <TriggerStyleField
                label={t("fields.categoryButtonStyle")}
                value={header.categoryMenu.trigger.style}
                disabled={!header.categoryMenu.enabled}
                onChange={(value) =>
                  updateField("categoryMenu.trigger.style", value)
                }
              />
              <div className="grid gap-4 md:grid-cols-2">
                <NumberField
                  label={t("fields.categoryButtonRadius")}
                  value={header.categoryMenu.trigger.borderRadius}
                  min={0}
                  max={999}
                  disabled={!header.categoryMenu.enabled}
                  onChange={(value) =>
                    updateField("categoryMenu.trigger.borderRadius", value)
                  }
                />
                <NumberField
                  label={t("fields.categoryButtonBorderWidth")}
                  value={header.categoryMenu.trigger.borderWidth}
                  min={0}
                  max={4}
                  disabled={!header.categoryMenu.enabled}
                  onChange={(value) =>
                    updateField("categoryMenu.trigger.borderWidth", value)
                  }
                />
                <NumberField
                  label={t("fields.categoryButtonWidth")}
                  value={header.categoryMenu.trigger.width}
                  min={180}
                  max={340}
                  disabled={!header.categoryMenu.enabled}
                  onChange={(value) =>
                    updateField("categoryMenu.trigger.width", value)
                  }
                />
                <NumberField
                  label={t("fields.categoryButtonHeight")}
                  value={header.categoryMenu.trigger.height}
                  min={34}
                  max={56}
                  disabled={!header.categoryMenu.enabled}
                  onChange={(value) =>
                    updateField("categoryMenu.trigger.height", value)
                  }
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {t("trigger.widthHint")}
              </p>
              <Separator />
              <div className="grid gap-3 md:grid-cols-2">
                <SwitchRow
                  label={t("fields.categoryButtonShowIcon")}
                  checked={header.categoryMenu.trigger.showIcon}
                  disabled={!header.categoryMenu.enabled}
                  onChange={(value) =>
                    updateField("categoryMenu.trigger.showIcon", value)
                  }
                />
                <SwitchRow
                  label={t("fields.categoryButtonShowChevron")}
                  checked={header.categoryMenu.trigger.showChevron}
                  disabled={!header.categoryMenu.enabled}
                  onChange={(value) =>
                    updateField("categoryMenu.trigger.showChevron", value)
                  }
                />
              </div>
              <TriggerIconField
                label={t("fields.categoryButtonIcon")}
                value={header.categoryMenu.trigger.icon}
                disabled={
                  !header.categoryMenu.enabled ||
                  !header.categoryMenu.trigger.showIcon
                }
                onChange={(value) =>
                  updateField("categoryMenu.trigger.icon", value)
                }
              />
              <Separator />
              <TriggerOpenOnField
                label={t("fields.categoryButtonOpenOn")}
                value={header.categoryMenu.trigger.openOn}
                disabled={!header.categoryMenu.enabled}
                onChange={(value) =>
                  updateField("categoryMenu.trigger.openOn", value)
                }
              />
              <SwitchRow
                label={t("fields.categoryButtonOpenOnHome")}
                checked={header.categoryMenu.trigger.openOnHome}
                // Mega menu only — with it off there is no rail to drop open,
                // so the switch would be a control that does nothing.
                disabled={
                  !header.categoryMenu.enabled ||
                  !header.categoryMenu.showMegaMenu
                }
                onChange={(value) =>
                  updateField("categoryMenu.trigger.openOnHome", value)
                }
              />
              <p className="text-xs text-muted-foreground">
                {header.categoryMenu.showMegaMenu
                  ? t("trigger.openOnHomeHint")
                  : t("trigger.openOnHomeDisabledHint")}
              </p>
              <Separator />
              <SwitchRow
                label={t("fields.categoryButtonCustomColors")}
                checked={header.categoryMenu.trigger.useCustomColors}
                disabled={!header.categoryMenu.enabled}
                onChange={(value) =>
                  updateField("categoryMenu.trigger.useCustomColors", value)
                }
              />
              <p className="text-xs text-muted-foreground">
                {t("trigger.colorHint")}
              </p>
              <TriggerColorFields
                title={t("colors.light")}
                scheme={header.categoryMenu.trigger.colors.light}
                pathPrefix="categoryMenu.trigger.colors.light"
                style={header.categoryMenu.trigger.style}
                disabled={
                  !header.categoryMenu.enabled ||
                  !header.categoryMenu.trigger.useCustomColors
                }
                onChange={updateField}
              />
              <TriggerColorFields
                title={t("colors.dark")}
                scheme={header.categoryMenu.trigger.colors.dark}
                pathPrefix="categoryMenu.trigger.colors.dark"
                style={header.categoryMenu.trigger.style}
                disabled={
                  !header.categoryMenu.enabled ||
                  !header.categoryMenu.trigger.useCustomColors
                }
                onChange={updateField}
              />
            </CardContent>
          </Card>

          <Card className="gap-4">
            <CardHeader>
              <CardTitle>{t("pages.title")}</CardTitle>
              <CardDescription>
                {t("pages.description")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <SwitchRow
                label={t("fields.showSelectedPages")}
                checked={header.pagesMenu.enabled}
                onChange={(value) => updateField("pagesMenu.enabled", value)}
              />
              {!header.pagesMenu.enabled && selectedPageOptions.length > 0 ? (
                <p className="text-xs text-muted-foreground">
                  {t("pages.hiddenHint")}
                </p>
              ) : null}
              <div
                className={cn(
                  "space-y-3",
                  !header.pagesMenu.enabled && "opacity-55",
                )}
              >
                {/* The utility links every store reaches for (Track Order,
                    Blog, Contact Us, Become a Vendor) as first-class rows —
                    the search below still finds every other page. */}
                <div className="space-y-2">
                  <div>
                    <p className="text-xs font-medium uppercase text-muted-foreground">
                      {tf("pages.quickLinksTitle", "Utility links")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {tf(
                        "pages.quickLinksHint",
                        "Toggle a link to show it in the header, then pick which side it sits on.",
                      )}
                    </p>
                  </div>
                  <UtilityPlacementField
                    value={header.utilityMenu.placement}
                    disabled={!header.pagesMenu.enabled}
                    onChange={(value) =>
                      updateField("utilityMenu.placement", value)
                    }
                    tf={tf}
                  />
                  {FEATURED_HEADER_LINKS.flatMap(({ kind, id }) => {
                    const page = pageOptions.find(
                      (option) => option.kind === kind && option.id === id,
                    );
                    if (!page) return [];
                    const pageKey = getHeaderPageKey(page);
                    const selected = isHeaderPageSelected(header, page);
                    const position =
                      header.pagesMenu.positions[pageKey] || "right";
                    // The per-link side only means anything while the group
                    // flows with the menu row; the other placements move the
                    // whole group to one slot.
                    const controlsDisabled =
                      !header.pagesMenu.enabled ||
                      !selected ||
                      header.utilityMenu.placement !== "menu";
                    return [
                      <div
                        key={pageKey}
                        className="flex flex-col gap-2 rounded-md border px-3 py-2.5 sm:flex-row sm:items-center"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">{page.label}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {page.href}
                          </p>
                        </div>
                        <div
                          className={cn(
                            "inline-flex shrink-0 rounded-md border bg-background p-0.5",
                            controlsDisabled && "opacity-55",
                          )}
                        >
                          <Button
                            type="button"
                            variant={position === "left" ? "secondary" : "ghost"}
                            size="sm"
                            className="h-7 px-2.5 text-xs"
                            disabled={controlsDisabled}
                            onClick={() =>
                              updateHeaderPagePosition(page, "left")
                            }
                          >
                            <ArrowLeft className="h-3.5 w-3.5" />
                            {t("position.left")}
                          </Button>
                          <Button
                            type="button"
                            variant={
                              position === "right" ? "secondary" : "ghost"
                            }
                            size="sm"
                            className="h-7 px-2.5 text-xs"
                            disabled={controlsDisabled}
                            onClick={() =>
                              updateHeaderPagePosition(page, "right")
                            }
                          >
                            {t("position.right")}
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        <Switch
                          checked={selected}
                          disabled={!header.pagesMenu.enabled}
                          onCheckedChange={(value) =>
                            value
                              ? addHeaderPage(page, position)
                              : removeHeaderPage(page)
                          }
                          aria-label={page.label}
                          className="shrink-0"
                        />
                      </div>,
                    ];
                  })}
                </div>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={pageSearchQuery}
                    disabled={!header.pagesMenu.enabled}
                    placeholder={t("pages.searchPlaceholder")}
                    onChange={(event) => setPageSearchQuery(event.target.value)}
                    className="pl-9"
                  />
                </div>
                {hasPageSearchQuery ? (
                  <div className="space-y-2 rounded-md border p-2">
                    {filteredPageOptions.length > 0 ? (
                      filteredPageOptions.map((page) => {
                        const isSelected = isHeaderPageSelected(header, page);
                        return (
                          <div
                            key={`${page.kind}-${page.id}`}
                            className={cn(
                              "flex w-full flex-col gap-3 rounded-sm px-2 py-2 text-left transition-colors hover:bg-muted sm:flex-row sm:items-center",
                              isSelected && "opacity-70",
                            )}
                          >
                            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-sm bg-muted text-muted-foreground">
                              <Plus className="h-4 w-4" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="flex min-w-0 items-center gap-2">
                                <span className="truncate text-sm font-medium">
                                  {page.label}
                                </span>
                                {isSelected ? (
                                  <Badge
                                    variant="outline"
                                    className="shrink-0 rounded-md"
                                  >
                                    {t("pages.added")}
                                  </Badge>
                                ) : null}
                                {!page.visible ? (
                                  <Badge
                                    variant="outline"
                                    className="shrink-0 rounded-md text-muted-foreground"
                                  >
                                    {t("pages.hidden")}
                                  </Badge>
                                ) : null}
                              </span>
                              <span className="block truncate text-xs text-muted-foreground">
                                {page.href}
                              </span>
                            </span>
                            <span className="flex shrink-0 flex-wrap items-center gap-2">
                              {isSelected ? null : (
                                <>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    disabled={!header.pagesMenu.enabled}
                                    onClick={() => addHeaderPage(page, "left")}
                                  >
                                    {t("pages.addLeft")}
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    disabled={!header.pagesMenu.enabled}
                                    onClick={() => addHeaderPage(page, "right")}
                                  >
                                    {t("pages.addRight")}
                                  </Button>
                                </>
                              )}
                            </span>
                          </div>
                        );
                      })
                    ) : (
                      <p className="px-2 py-3 text-sm text-muted-foreground">
                        {t("pages.noMatches")}
                      </p>
                    )}
                  </div>
                ) : null}
                <div className="space-y-2">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-xs font-medium uppercase text-muted-foreground">
                        {t("pages.assignedLinks")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t("pages.assignedHint")}
                      </p>
                    </div>
                    <Badge variant="outline" className="rounded-md">
                      {t("pages.selected", { count: selectedPageOptions.length })}
                    </Badge>
                  </div>
                  {selectedPageOptions.length > 0 ? (
                    <DndContext
                      sensors={headerPageDragSensors}
                      collisionDetection={closestCenter}
                      onDragOver={handleHeaderPageDragOver}
                      onDragEnd={handleHeaderPageDragEnd}
                    >
                      <div className="grid gap-3 lg:grid-cols-2">
                        <HeaderPageDropZone
                          id={HEADER_PAGE_DROP_ZONE_IDS.left}
                          title={t("pages.leftSide")}
                          description={t("pages.leftSideDescription")}
                          count={selectedPageGroups.left.length}
                          disabled={!header.pagesMenu.enabled}
                          emptyMessage={t("pages.leftEmpty")}
                          pageKeys={selectedPageGroupKeys.left}
                        >
                          {selectedPageGroups.left.map((page) => {
                            const pageKey = getHeaderPageKey(page);

                            return (
                              <SortableHeaderPageRow
                                key={`selected-left-${page.kind}-${page.id}`}
                                id={pageKey}
                                page={page}
                                disabled={!header.pagesMenu.enabled}
                                position="left"
                                onMoveSide={() =>
                                  updateHeaderPagePosition(page, "right")
                                }
                                onRemove={() => removeHeaderPage(page)}
                              />
                            );
                          })}
                        </HeaderPageDropZone>
                        <HeaderPageDropZone
                          id={HEADER_PAGE_DROP_ZONE_IDS.right}
                          title={t("pages.rightSide")}
                          description={t("pages.rightSideDescription")}
                          count={selectedPageGroups.right.length}
                          disabled={!header.pagesMenu.enabled}
                          emptyMessage={t("pages.rightEmpty")}
                          pageKeys={selectedPageGroupKeys.right}
                        >
                          {selectedPageGroups.right.map((page) => {
                            const pageKey = getHeaderPageKey(page);

                            return (
                              <SortableHeaderPageRow
                                key={`selected-right-${page.kind}-${page.id}`}
                                id={pageKey}
                                page={page}
                                disabled={!header.pagesMenu.enabled}
                                position="right"
                                onMoveSide={() =>
                                  updateHeaderPagePosition(page, "left")
                                }
                                onRemove={() => removeHeaderPage(page)}
                              />
                            );
                          })}
                        </HeaderPageDropZone>
                      </div>
                    </DndContext>
                  ) : (
                    <p className="rounded-md border border-dashed px-3 py-4 text-sm text-muted-foreground">
                      {t("pages.emptyAssigned")}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

        </TabsContent>

        <TabsContent value="market" className="space-y-4">
          <Card className="gap-4">
            <CardHeader>
              <CardTitle>{t("market.title")}</CardTitle>
              <CardDescription>
                {t("market.description")}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              <SwitchRow
                label={t("fields.showLanguageSelector")}
                checked={header.market.showLanguageSelector}
                onChange={(value) =>
                  updateField("market.showLanguageSelector", value)
                }
              />
              <SwitchRow
                label={t("fields.showCurrencySelector")}
                checked={header.market.showCurrencySelector}
                onChange={(value) =>
                  updateField("market.showCurrencySelector", value)
                }
              />
            </CardContent>
          </Card>

          <Card className="gap-4">
            <CardHeader>
              <CardTitle>{t("widgets.title")}</CardTitle>
              <CardDescription>
                {t("widgets.description")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <SwitchRow
                label={t("fields.showThemeToggle")}
                checked={header.widgets.showThemeToggle}
                onChange={(value) => updateField("widgets.showThemeToggle", value)}
              />
              <SwitchRow
                label={t("fields.showAccountMenu")}
                checked={header.widgets.showAccountMenu}
                onChange={(value) => updateField("widgets.showAccountMenu", value)}
              />
              <SwitchRow
                label={t("fields.showWishlist")}
                checked={header.widgets.showWishlist}
                onChange={(value) => updateField("widgets.showWishlist", value)}
              />
              <SwitchRow
                label={t("fields.showCart")}
                checked={header.widgets.showCart}
                onChange={(value) => updateField("widgets.showCart", value)}
              />
              <SwitchRow
                label={tf("fields.showLocationPicker", "Show Branch Selector")}
                checked={header.widgets.showLocationPicker}
                onChange={(value) =>
                  updateField("widgets.showLocationPicker", value)
                }
              />
              <SwitchRow
                label={tf("fields.showWholesaleToggle", "Show Wholesale Toggle")}
                checked={header.widgets.showWholesaleToggle}
                onChange={(value) =>
                  updateField("widgets.showWholesaleToggle", value)
                }
              />
              <SwitchRow
                label={t("fields.showUtilityLinks")}
                checked={header.utilityMenu.enabled}
                onChange={(value) => updateField("utilityMenu.enabled", value)}
              />
              <SwitchRow
                label={tf("fields.showContact", "Contact button")}
                checked={header.widgets.showContact}
                onChange={(value) => updateField("widgets.showContact", value)}
              />
              <SwitchRow
                label={tf("fields.showCompare", "Compare button")}
                checked={header.widgets.showCompare}
                onChange={(value) => updateField("widgets.showCompare", value)}
              />
              <SwitchRow
                label={tf("fields.showLabels", "Show button labels")}
                checked={header.widgets.showLabels}
                onChange={(value) => updateField("widgets.showLabels", value)}
              />
              <NumberField
                label={tf("fields.actionsGap", "Button gap (px)")}
                value={header.widgets.gap}
                min={12}
                max={40}
                onChange={(value) => updateField("widgets.gap", value)}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mobile" className="space-y-4">
          <Card className="gap-4">
            <CardHeader>
              <CardTitle>{t("mobile.title")}</CardTitle>
              <CardDescription>
                {t("mobile.description")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-3 md:grid-cols-2">
                <SwitchRow
                  label={t("fields.showMobileSearch")}
                  checked={header.mobile.showSearch}
                  disabled={!header.search.enabled}
                  onChange={(value) => updateField("mobile.showSearch", value)}
                />
                <SwitchRow
                  label={t("fields.showAccountSummary")}
                  checked={header.mobile.showAccountSummary}
                  disabled={!header.widgets.showAccountMenu}
                  onChange={(value) =>
                    updateField("mobile.showAccountSummary", value)
                  }
                />
                <SwitchRow
                  label={t("fields.showCategoryShortcuts")}
                  checked={header.mobile.showCategoryShortcuts}
                  disabled={!header.categoryMenu.enabled}
                  onChange={(value) =>
                    updateField("mobile.showCategoryShortcuts", value)
                  }
                />
                <SwitchRow
                  label={t("fields.showCollections")}
                  checked={header.mobile.showCollections}
                  disabled={!header.collectionsMenu.enabled}
                  onChange={(value) =>
                    updateField("mobile.showCollections", value)
                  }
                />
                <SwitchRow
                  label={t("fields.showMarketSelectors")}
                  checked={header.mobile.showMarketSelectors}
                  disabled={
                    !header.market.showLanguageSelector &&
                    !header.market.showCurrencySelector
                  }
                  onChange={(value) =>
                    updateField("mobile.showMarketSelectors", value)
                  }
                />
                <SwitchRow
                  label={t("fields.showThemeSelector")}
                  checked={header.mobile.showThemeSelector}
                  disabled={!header.widgets.showThemeToggle}
                  onChange={(value) =>
                    updateField("mobile.showThemeSelector", value)
                  }
                />
              </div>
              <NumberField
                label={t("fields.mobileCategoryLimit")}
                value={header.categoryMenu.mobileLimit}
                min={0}
                max={16}
                disabled={!header.categoryMenu.enabled}
                onChange={(value) => updateField("categoryMenu.mobileLimit", value)}
              />
            </CardContent>
          </Card>
          <Card className="gap-4">
            <CardHeader>
              <CardTitle>Mobile Drawer Menu</CardTitle>
              <CardDescription>
                Customize the exact links and nested categories shown in the mobile slide-out drawer.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {mobileMenuLinks === null ? (
                <div className="flex h-32 items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <HeaderMenuLinksEditor
                  links={mobileMenuLinks}
                  onChange={setMobileMenuLinks}
                />
              )}
            </CardContent>
          </Card>
          <MobileNavBuilder header={header} updateField={updateField} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function HeaderPageDropZone({
  id,
  title,
  description,
  count,
  disabled,
  emptyMessage,
  pageKeys,
  children,
}: {
  id: string;
  title: string;
  description: string;
  count: number;
  disabled: boolean;
  emptyMessage: string;
  pageKeys: string[];
  children: ReactNode;
}) {
  const t = useTranslations("admin.headerStudio");
  const { setNodeRef, isOver } = useDroppable({
    id,
    disabled,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex min-h-72 flex-col rounded-md border bg-muted/20 p-3 transition-colors",
        isOver && "border-primary bg-primary/5",
        disabled && "opacity-60",
      )}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <Badge variant="outline" className="rounded-md">
          {t("pages.linkCount", { count })}
        </Badge>
      </div>
      <SortableContext items={pageKeys} strategy={verticalListSortingStrategy}>
        <div className="flex flex-1 flex-col gap-2">
          {count > 0 ? (
            children
          ) : (
            <div className="grid flex-1 place-items-center rounded-md border border-dashed bg-background/60 px-3 py-8 text-center text-sm text-muted-foreground">
              {emptyMessage}
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

function SortableHeaderPageRow({
  id,
  page,
  disabled,
  position,
  onMoveSide,
  onRemove,
}: {
  id: string;
  page: HeaderPageOption;
  disabled: boolean;
  position: HeaderNavPosition;
  onMoveSide: () => void;
  onRemove: () => void;
}) {
  const t = useTranslations("admin.headerStudio");
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    disabled,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 rounded-md border bg-background px-3 py-2",
        disabled && "opacity-60",
        isDragging && "relative z-10 opacity-70 shadow-sm",
      )}
    >
      <button
        type="button"
        disabled={disabled}
        {...attributes}
        {...listeners}
        className="grid h-8 w-6 shrink-0 cursor-grab place-items-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
        aria-label={t("pages.dragAria", { title: page.label })}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <p className="truncate text-sm font-medium">{page.label}</p>
          {!page.visible ? (
            <Badge
              variant="outline"
              className="rounded-md text-muted-foreground"
            >
              {t("pages.hidden")}
            </Badge>
          ) : null}
        </div>
        <p className="truncate text-xs text-muted-foreground">{page.href}</p>
      </div>

      <div className="flex shrink-0 flex-wrap items-center justify-end gap-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={disabled}
          onClick={onMoveSide}
          aria-label={t("pages.moveAria", {
            title: page.label,
            side:
              position === "left"
                ? t("pages.sideRight")
                : t("pages.sideLeft"),
          })}
          className="h-8 px-2 text-xs"
        >
          {position === "left" ? t("pages.moveRight") : t("pages.moveLeft")}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onRemove}
          aria-label={t("pages.deleteAria", { title: page.label })}
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

/**
 * The live preview: just the header itself, rendered over a muted backdrop —
 * no chrome, toggles, or device switches. Light scheme (or the pinned dark /
 * primary paint when the color mode says so), desktop arrangement.
 */
function HeaderPreview({
  header,
  generalBrand,
  announcement,
  topTags,
}: {
  header: HeaderSettings;
  generalBrand: GeneralBrandSettings;
  announcement: AnnouncementDraft;
  topTags: TopTagsDraft;
}) {
  const t = useTranslations("admin.headerStudio");
  const tf = (key: string, fallback: string) =>
    t.has(key) ? t(key) : fallback;

  const variant = header.layout.variant;
  const colorMode = header.layout.color;
  // "dark" pins the dark scheme; "color" ignores the schemes for primary.
  const colors =
    colorMode === "dark" ? header.colors.dark : header.colors.light;
  const isColorMode = colorMode === "color";
  const isTransparentMode = colorMode === "transparent";
  // The SAME rule the storefront header calls, so what the merchant picks
  // here is what ships. The preview canvas is always the light theme, hence
  // `isDark: false` — "auto" therefore previews the light artwork.
  const logoSrc = resolveHeaderLogoUrl({
    colorMode,
    brand: header.brand,
    isDark: false,
    lightLogoUrl: generalBrand.logoUrl,
    darkLogoUrl: generalBrand.darkModeLogoUrl,
  });
  const logoAlt =
    header.brand.logoAlt || generalBrand.storeName || "Header logo";
  // No hardcoded brand here: until the settings fetch lands, the preview shows
  // nothing rather than this app's name in place of the store's.
  const fallbackBrandName = generalBrand.storeName || "";
  const languageLabel =
    LANGUAGE_OPTIONS.find((language) => language.code === header.market.defaultLanguage)
      ?.code.toUpperCase() || header.market.defaultLanguage.toUpperCase();
  const currencyLabel = header.market.defaultCurrency.toUpperCase();
  const previewItems = [
    t("preview.categories.accessories"),
    t("preview.categories.bags"),
    t("preview.categories.cameras"),
    t("preview.categories.clothes"),
    t("preview.categories.shoes"),
    t("preview.categories.watches"),
    t("preview.categories.beauty"),
    t("preview.categories.home"),
    t("preview.categories.sports"),
    t("preview.categories.books"),
    t("preview.categories.gaming"),
  ];
  const totalPageCount = header.pagesMenu.enabled
    ? header.pagesMenu.appPagePaths.length +
      header.pagesMenu.pageKeys.length +
      header.pagesMenu.customPageIds.length
    : 0;
  const hasPreviewUtilityNav =
    header.utilityMenu.enabled && totalPageCount > 0;
  const desktopQuickCategoryLimit = getDesktopQuickCategoryLimit(
    [
      header.categoryMenu.enabled,
      header.collectionsMenu.enabled,
      hasPreviewUtilityNav,
    ].filter(Boolean).length,
  );
  const quickPreviewItems = header.categoryMenu.showQuickLinks
    ? previewItems.slice(
        0,
        Math.min(header.categoryMenu.quickLimit, desktopQuickCategoryLimit),
      )
    : [];
  const showMarket =
    header.market.showLanguageSelector || header.market.showCurrencySelector;
  // Same resolver the storefront runs, so the preview cannot drift from the
  // button it is previewing.
  const triggerLook = getCategoryTriggerStyle(header.categoryMenu.trigger, {
    isDark: colorMode === "dark",
  });
  const categoryMenuPreview = header.categoryMenu.enabled ? (
    <div
      style={triggerLook.style}
      className={cn(
        "flex shrink-0 items-center justify-between gap-2 px-3",
        triggerLook.className,
      )}
    >
      <span className="inline-flex min-w-0 items-center gap-2">
        {header.categoryMenu.trigger.showIcon ? (
          <CategoryTriggerGlyph
            icon={header.categoryMenu.trigger.icon}
            className="h-4 w-4 shrink-0"
          />
        ) : null}
        <span className="truncate">
          {header.categoryMenu.label || t("preview.allCategories")}
        </span>
      </span>
      {header.categoryMenu.trigger.showChevron ? (
        <ChevronDown className="h-3.5 w-3.5 shrink-0" />
      ) : null}
    </div>
  ) : null;
  const collectionsMenuPreview = header.collectionsMenu.enabled ? (
    <button type="button" className="shrink-0 font-semibold">
      {header.collectionsMenu.label || t("preview.collections")}
    </button>
  ) : null;
  const quickCategoryPreview = (
    <>
      {quickPreviewItems.map((item) => (
        <span key={item} className="shrink-0 opacity-80">
          {item}
        </span>
      ))}
    </>
  );

  // The bar's paint. "color" uses utility classes so it tracks the admin's
  // theme primary; the rest come from the configured schemes.
  const barClassName = cn(
    isColorMode && "bg-primary text-primary-foreground",
    isTransparentMode && "backdrop-blur",
  );
  const barStyle: CSSProperties | undefined = isColorMode
    ? undefined
    : {
        backgroundColor: isTransparentMode
          ? `color-mix(in srgb, ${colors.backgroundColor} 72%, transparent)`
          : colors.backgroundColor,
        color: colors.textColor,
      };
  const searchStyle: CSSProperties = isColorMode
    ? {
        backgroundColor: "color-mix(in srgb, currentColor 12%, transparent)",
        borderColor: "color-mix(in srgb, currentColor 25%, transparent)",
        height: header.search.height,
        borderRadius: header.search.borderRadius,
      }
    : {
        backgroundColor: colors.searchBackgroundColor,
        color: colors.searchTextColor,
        borderColor: header.search.borderColor,
        height: header.search.height,
        borderRadius: header.search.borderRadius,
      };

  const searchBox = (size: "wide" | "compact") =>
    header.search.enabled ? (
      <div
        className={cn(
          "flex items-center gap-3 border px-4",
          size === "wide" ? "min-w-0 flex-1" : "w-44 shrink-0",
        )}
        style={
          size === "wide"
            ? {
                ...searchStyle,
                flexBasis: header.search.desktopWidth,
                maxWidth: header.search.desktopWidth,
              }
            : searchStyle
        }
      >
        <Search className="h-4 w-4 shrink-0 opacity-70" />
        <span className="truncate text-sm opacity-75">
          {header.search.placeholder || t("preview.searchProducts")}
        </span>
        {size === "wide" && header.search.showAiButton ? (
          <span className="ml-auto grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
            <Search className="h-3.5 w-3.5" />
          </span>
        ) : null}
      </div>
    ) : null;

  /** The compact icon-search pill (minimal / centered / nav-top rows). */
  const searchIconPill = header.search.enabled ? (
    <span className="flex h-9 w-20 shrink-0 items-center justify-end rounded-full border border-black/10 p-0.5">
      <span className="grid h-7 w-9 place-items-center rounded-md bg-zinc-900 text-white">
        <Search className="h-4 w-4" />
      </span>
    </span>
  ) : null;

  const actionsCluster = (
    <div className="ml-auto flex shrink-0 items-center gap-3">
      {header.widgets.showThemeToggle ? (
        <Moon className="h-5 w-5 opacity-80" />
      ) : null}
      {showMarket ? (
        <div className="hidden items-center gap-2 text-xs font-medium lg:flex">
          <Globe2 className="h-4 w-4" />
          <span>
            {header.market.showLanguageSelector ? languageLabel : null}
            {header.market.showLanguageSelector &&
            header.market.showCurrencySelector
              ? " / "
              : null}
            {header.market.showCurrencySelector ? currencyLabel : null}
          </span>
        </div>
      ) : null}
      {header.widgets.showAccountMenu ? (
        <User className="h-5 w-5 opacity-80" />
      ) : null}
      {header.widgets.showLocationPicker ? (
        <MapPin className="h-5 w-5 opacity-80" />
      ) : null}
      {header.widgets.showWholesaleToggle ? (
        <Store className="h-5 w-5 opacity-80" />
      ) : null}
      {header.widgets.showWishlist ? (
        <Heart className="hidden h-5 w-5 opacity-80 sm:block" />
      ) : null}
      {header.widgets.showCart ? (
        <ShoppingCart className="h-5 w-5 opacity-80" />
      ) : null}
    </div>
  );

  const logoElement = (
    <div
      className="flex shrink-0 items-center gap-2"
      style={{ width: header.brand.desktopLogoWidth }}
    >
      {logoSrc ? (
        <AppImage
          src={logoSrc}
          alt={logoAlt}
          width={header.brand.desktopLogoWidth}
          height={32}
          className="h-8 w-full object-contain object-left"
        />
      ) : (
        <div className="flex items-center gap-2 font-semibold">
          <Package className="h-5 w-5" />
          {fallbackBrandName}
        </div>
      )}
    </div>
  );

  const utilityPlacement = header.utilityMenu.placement;
  /** The links chip, shown in whichever row the placement puts it. */
  const utilityChip = hasPreviewUtilityNav ? (
    <Badge variant="outline" className="shrink-0">
      {t("preview.pagesRight", { count: totalPageCount })}
    </Badge>
  ) : null;

  const inlineNavChips = (
    <div className="flex min-w-0 flex-1 items-center gap-4 overflow-hidden text-sm">
      {collectionsMenuPreview}
      {quickCategoryPreview}
      {utilityPlacement === "menu" ? utilityChip : null}
    </div>
  );

  const previewTags = topTags.tags.filter((tag) => tag.label.trim());

  return (
    <div className="rounded-xl bg-muted/40 p-4 sm:p-6">
      <div
        className={cn(
          "mx-auto overflow-hidden rounded-md border shadow-sm",
          header.layout.fullWidth ? "w-full" : "max-w-6xl",
        )}
      >
        {/* Announcement bar (from the header group document) */}
        {announcement.enabled && announcement.text.trim() ? (
          <div
            className={cn(
              "px-4 py-1.5 text-center text-xs font-medium",
              !announcement.backgroundColor &&
                "bg-primary text-primary-foreground",
            )}
            style={{
              ...(announcement.backgroundColor
                ? { backgroundColor: announcement.backgroundColor }
                : {}),
              ...(announcement.textColor
                ? { color: announcement.textColor }
                : {}),
            }}
          >
            <span className="block truncate">{announcement.text}</span>
          </div>
        ) : null}

        <div className={barClassName} style={barStyle}>
          {/* Top row, per template */}
          <div className="flex items-center gap-4 border-b border-black/5 px-4 py-3 last:border-b-0">
            {variant === "centered" ? (
              <>
                {inlineNavChips}
                {logoElement}
                <div className="flex min-w-0 flex-1 items-center justify-end gap-3">
                  {utilityPlacement === "search" ? utilityChip : null}
                  {searchIconPill}
                  {actionsCluster}
                </div>
              </>
            ) : variant === "logo-center" ? (
              <>
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  {searchBox("compact")}
                  {utilityPlacement === "search" ? utilityChip : null}
                </div>
                {logoElement}
                <div className="flex min-w-0 flex-1 items-center justify-end">
                  {actionsCluster}
                </div>
              </>
            ) : variant === "minimal" ? (
              <>
                {logoElement}
                {inlineNavChips}
                {searchIconPill}
                {utilityPlacement === "search" ? utilityChip : null}
                {actionsCluster}
              </>
            ) : variant === "nav-top" ? (
              <>
                {logoElement}
                {inlineNavChips}
                {actionsCluster}
              </>
            ) : (
              <>
                {logoElement}
                {searchBox("wide")}
                {utilityPlacement === "search" ? utilityChip : null}
                {actionsCluster}
              </>
            )}
          </div>

          {/* Second row, per template */}
          {variant === "nav-top" ? (
            <div className="flex items-center gap-3 px-4 py-2.5">
              {header.categoryMenu.position === "left"
                ? categoryMenuPreview
                : null}
              {searchBox("wide")}
              {utilityPlacement === "search" ? utilityChip : null}
              {header.categoryMenu.position === "right"
                ? categoryMenuPreview
                : null}
            </div>
          ) : variant === "classic" ? (
            <div className="flex items-center gap-5 overflow-hidden px-4 py-2.5 text-sm">
              {header.categoryMenu.position === "left"
                ? categoryMenuPreview
                : null}
              {header.categoryMenu.enabled &&
              header.categoryMenu.showMegaMenu ? (
                <Badge variant="outline" className="shrink-0">
                  {t("preview.megaMenu")}
                </Badge>
              ) : null}
              {inlineNavChips}
              {header.categoryMenu.position === "right"
                ? categoryMenuPreview
                : null}
            </div>
          ) : variant === "banner-nav" ? (
            <div className="flex items-center gap-5 overflow-hidden bg-primary px-4 py-2 text-sm text-primary-foreground">
              {categoryMenuPreview}
              {collectionsMenuPreview}
              {quickCategoryPreview}
              {utilityPlacement === "menu" && hasPreviewUtilityNav ? (
                <span className="shrink-0 opacity-90">
                  {t("preview.pagesRight", { count: totalPageCount })}
                </span>
              ) : null}
            </div>
          ) : variant === "logo-center" ? (
            <div className="flex items-center justify-center gap-5 overflow-hidden px-4 py-2.5 text-sm">
              {collectionsMenuPreview}
              {quickCategoryPreview}
              {utilityPlacement === "menu" ? utilityChip : null}
            </div>
          ) : null}
        </div>

        {/* Top tags strip (from the header group document) */}
        {(topTags.enabled && previewTags.length > 0) ||
        (utilityPlacement === "tags" && utilityChip) ? (
          <div
            className={cn("border-t border-black/5", barClassName)}
            style={barStyle}
          >
            <div className="flex items-center gap-4 overflow-hidden px-4 pb-2.5 pt-1.5 text-xs font-medium">
              {topTags.enabled && previewTags.length > 0 ? (
                <span className="shrink-0 font-semibold">
                  {tf("preview.topTags", "Top Tags")}
                </span>
              ) : null}
              {previewTags.slice(0, 10).map((tag) => (
                <span key={tag.id} className="shrink-0 opacity-75">
                  {tag.label}
                </span>
              ))}
              {utilityPlacement === "tags" ? (
                <span className="ms-auto shrink-0">{utilityChip}</span>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}


function buildHeaderPageOptions(
  contentPages: ContentPagesSettings,
  t: (key: string) => string,
): HeaderPageOption[] {
  const createSearchText = (...parts: Array<string | undefined>) =>
    parts.filter(Boolean).join(" ").toLowerCase();

  const appPages = HEADER_APP_PAGE_OPTIONS.map((page) => ({
    id: page.publicPath,
    label: getHeaderAppPageLabel(page.publicPath, page.label, t),
    href: page.publicPath,
    kind: "app" as const,
    description: page.keywords.join(", "),
    searchText: createSearchText(
      getHeaderAppPageLabel(page.publicPath, page.label, t),
      page.publicPath,
      ...page.keywords,
    ),
    visible: true,
  }));

  const standardPages = CONTENT_PAGE_KEYS.map((key) => {
    const page = contentPages[key];
    const meta = CONTENT_PAGE_META[key];
    const label = page.title || meta.adminTitle;

    return {
      id: key,
      label,
      href: meta.publicPath,
      kind: "standard" as const,
      description: meta.description,
      searchText: createSearchText(
        label,
        meta.adminTitle,
        meta.publicPath,
        meta.description,
      ),
      visible: page.visible,
    };
  });

  const customPages = contentPages.customPages
    .filter((page: CustomPageData) => page.handle.trim())
    .map((page: CustomPageData) => ({
      id: page.id,
      label: page.title,
      href: `/pages/${page.handle}`,
      kind: "custom" as const,
      description: page.metaDescription,
      searchText: createSearchText(
        page.title,
        page.handle,
        `/pages/${page.handle}`,
        page.metaTitle,
        page.metaDescription,
      ),
      visible: page.visible,
    }));

  return [...appPages, ...standardPages, ...customPages];
}

function getHeaderAppPageLabel(
  publicPath: string,
  fallback: string,
  t: (key: string) => string,
) {
  const key = HEADER_APP_PAGE_LABEL_KEYS[publicPath];
  return key ? t(`appPages.${key}`) : fallback;
}

const HEADER_APP_PAGE_LABEL_KEYS: Record<string, string> = {
  "/": "home",
  "/products": "products",
  "/collections": "collections",
  "/categories": "categories",
  "/brands": "brands",
  "/blog": "blog",
  "/track-order": "trackOrder",
  "/returns": "returns",
  "/become-vendor": "becomeVendor",
  "/pre-order": "preorder",
  "/cart": "cart",
  "/checkout": "checkout",
  "/account": "account",
  "/account/orders": "orders",
  "/account/orders/pre-orders": "preorders",
  "/account/inbox": "inbox",
  "/account/notifications": "notifications",
  "/account/wishlist": "wishlist",
  "/account/profile": "profile",
  "/account/addresses": "addresses",
  "/account/preferences": "preferences",
  "/account/security": "security",
};

function getHeaderPageCollection(
  page: HeaderPageOption,
): "appPagePaths" | "pageKeys" | "customPageIds" {
  if (page.kind === "app") return "appPagePaths";
  if (page.kind === "standard") return "pageKeys";
  return "customPageIds";
}

function getHeaderPageKey(page: HeaderPageOption) {
  return `${page.kind}:${page.id}`;
}

function getHeaderPageDropZonePosition(id: string): HeaderPageZone | null {
  if (id === HEADER_PAGE_DROP_ZONE_IDS.left) return "left";
  if (id === HEADER_PAGE_DROP_ZONE_IDS.right) return "right";
  return null;
}

function isHeaderPageSelected(
  header: HeaderSettings,
  page: HeaderPageOption,
) {
  return header.pagesMenu[getHeaderPageCollection(page)].includes(page.id);
}

function PositionField({
  label,
  value,
  disabled,
  onChange,
}: {
  label: string;
  value: HeaderNavPosition;
  disabled?: boolean;
  onChange: (value: HeaderNavPosition) => void;
}) {
  const t = useTranslations("admin.headerStudio");
  return (
    <FieldRow label={label}>
      <div
        className={cn(
          "inline-flex w-full rounded-md border bg-background p-1",
          disabled && "opacity-55",
        )}
      >
        <Button
          type="button"
          variant={value === "left" ? "secondary" : "ghost"}
          size="sm"
          className="flex-1"
          disabled={disabled}
          onClick={() => onChange("left")}
        >
          <ArrowLeft className="h-4 w-4" />
          {t("position.left")}
        </Button>
        <Button
          type="button"
          variant={value === "right" ? "secondary" : "ghost"}
          size="sm"
          className="flex-1"
          disabled={disabled}
          onClick={() => onChange("right")}
        >
          {t("position.right")}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </FieldRow>
  );
}

const TRIGGER_STYLE_OPTIONS: CategoryTriggerStyle[] = [
  "filled",
  "outline",
  "soft",
  "ghost",
];

function TriggerStyleField({
  label,
  value,
  disabled,
  onChange,
}: {
  label: string;
  value: CategoryTriggerStyle;
  disabled?: boolean;
  onChange: (value: CategoryTriggerStyle) => void;
}) {
  const t = useTranslations("admin.headerStudio");
  return (
    <FieldRow label={label}>
      <div
        className={cn(
          "inline-flex w-full rounded-md border bg-background p-1",
          disabled && "opacity-55",
        )}
      >
        {TRIGGER_STYLE_OPTIONS.map((option) => (
          <Button
            key={option}
            type="button"
            variant={value === option ? "secondary" : "ghost"}
            size="sm"
            className="flex-1"
            disabled={disabled}
            onClick={() => onChange(option)}
          >
            {t(`trigger.style.${option}`)}
          </Button>
        ))}
      </div>
    </FieldRow>
  );
}

const TRIGGER_OPEN_ON_OPTIONS: CategoryTriggerOpenOn[] = ["hover", "click"];

function TriggerOpenOnField({
  label,
  value,
  disabled,
  onChange,
}: {
  label: string;
  value: CategoryTriggerOpenOn;
  disabled?: boolean;
  onChange: (value: CategoryTriggerOpenOn) => void;
}) {
  const t = useTranslations("admin.headerStudio");
  return (
    <FieldRow label={label}>
      <div
        className={cn(
          "inline-flex w-full rounded-md border bg-background p-1",
          disabled && "opacity-55",
        )}
      >
        {TRIGGER_OPEN_ON_OPTIONS.map((option) => (
          <Button
            key={option}
            type="button"
            variant={value === option ? "secondary" : "ghost"}
            size="sm"
            className="flex-1"
            disabled={disabled}
            onClick={() => onChange(option)}
          >
            {t(`trigger.openOn.${option}`)}
          </Button>
        ))}
      </div>
    </FieldRow>
  );
}

const TRIGGER_ICON_OPTIONS: CategoryTriggerIcon[] = ["menu", "grid", "list"];

function TriggerIconField({
  label,
  value,
  disabled,
  onChange,
}: {
  label: string;
  value: CategoryTriggerIcon;
  disabled?: boolean;
  onChange: (value: CategoryTriggerIcon) => void;
}) {
  const t = useTranslations("admin.headerStudio");
  return (
    <FieldRow label={label}>
      <div
        className={cn(
          "inline-flex w-full rounded-md border bg-background p-1",
          disabled && "opacity-55",
        )}
      >
        {TRIGGER_ICON_OPTIONS.map((option) => (
          <Button
            key={option}
            type="button"
            variant={value === option ? "secondary" : "ghost"}
            size="sm"
            className="flex-1"
            disabled={disabled}
            onClick={() => onChange(option)}
          >
            <CategoryTriggerGlyph icon={option} className="h-4 w-4" />
            {t(`trigger.icon.${option}`)}
          </Button>
        ))}
      </div>
    </FieldRow>
  );
}

function TriggerColorFields({
  title,
  scheme,
  pathPrefix,
  style,
  disabled,
  onChange,
}: {
  title: string;
  scheme: CategoryTriggerColorScheme;
  pathPrefix: string;
  style: CategoryTriggerStyle;
  disabled?: boolean;
  onChange: (path: string, value: string) => void;
}) {
  const t = useTranslations("admin.headerStudio");
  // Outline and ghost paint no fill, so leaving the background picker live
  // there would offer a control that silently does nothing.
  const backgroundDisabled = disabled || !categoryTriggerUsesBackground(style);

  return (
    <div className={cn("space-y-3 rounded-md border p-3", disabled && "opacity-55")}>
      <p className="text-sm font-semibold">{title}</p>
      <div className="grid gap-4 md:grid-cols-3">
        <ColorField
          label={t("fields.triggerBackgroundColor")}
          value={scheme.backgroundColor}
          disabled={backgroundDisabled}
          onChange={(value) => onChange(`${pathPrefix}.backgroundColor`, value)}
        />
        <ColorField
          label={t("fields.triggerTextColor")}
          value={scheme.textColor}
          disabled={disabled}
          onChange={(value) => onChange(`${pathPrefix}.textColor`, value)}
        />
        <ColorField
          label={t("fields.triggerBorderColor")}
          value={scheme.borderColor}
          disabled={disabled}
          onChange={(value) => onChange(`${pathPrefix}.borderColor`, value)}
        />
      </div>
    </div>
  );
}

function ColorSchemeFields({
  title,
  scheme,
  pathPrefix,
  onChange,
}: {
  title: string;
  scheme: HeaderColorScheme;
  pathPrefix: string;
  onChange: (path: string, value: string) => void;
}) {
  const t = useTranslations("admin.headerStudio");
  return (
    <div className="space-y-3 rounded-md border p-3">
      <p className="text-sm font-semibold">{title}</p>
      <div className="grid gap-4 md:grid-cols-2">
        <ColorField
          label={t("fields.headerBackgroundColor")}
          value={scheme.backgroundColor}
          onChange={(value) => onChange(`${pathPrefix}.backgroundColor`, value)}
        />
        <ColorField
          label={t("fields.headerTextColor")}
          value={scheme.textColor}
          onChange={(value) => onChange(`${pathPrefix}.textColor`, value)}
        />
        <ColorField
          label={t("fields.searchBackgroundColor")}
          value={scheme.searchBackgroundColor}
          onChange={(value) =>
            onChange(`${pathPrefix}.searchBackgroundColor`, value)
          }
        />
        <ColorField
          label={t("fields.searchTextColor")}
          value={scheme.searchTextColor}
          onChange={(value) => onChange(`${pathPrefix}.searchTextColor`, value)}
        />
      </div>
    </div>
  );
}

function NumberField({
  label,
  value,
  min,
  max,
  disabled,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  disabled?: boolean;
  onChange: (value: number) => void;
}) {
  const clampValue = (nextValue: number) => {
    if (!Number.isFinite(nextValue)) return min;
    return Math.min(max, Math.max(min, Math.floor(nextValue)));
  };
  const normalizedValue = clampValue(value);
  const [draftValue, setDraftValue] = useState(String(normalizedValue));

  useEffect(() => {
    setDraftValue(String(normalizedValue));
  }, [normalizedValue]);

  const commitValue = () => {
    const nextValue = clampValue(Number(draftValue));
    setDraftValue(String(nextValue));
    onChange(nextValue);
  };

  return (
    <FieldRow label={label}>
      <Input
        type="number"
        min={min}
        max={max}
        value={draftValue}
        disabled={disabled}
        onChange={(event) => {
          const nextDraftValue = event.target.value;
          const numericValue = Number(nextDraftValue);

          setDraftValue(nextDraftValue);

          if (nextDraftValue === "" || !Number.isFinite(numericValue)) return;
          if (numericValue < min) return;

          const nextValue = clampValue(numericValue);
          if (numericValue > max) {
            setDraftValue(String(nextValue));
          }
          onChange(nextValue);
        }}
        onBlur={commitValue}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.currentTarget.blur();
          }
        }}
      />
    </FieldRow>
  );
}

/**
 * The six Figma header templates, in the order the design sheet lists them.
 * Each key is a real `layout.variant`; picking one is the only change a
 * template makes — everything else stays as configured.
 */
const HEADER_TEMPLATES: { key: HeaderStyleVariant; label: string }[] = [
  { key: "minimal", label: "Minimal" },
  { key: "nav-top", label: "Menu first" },
  { key: "classic", label: "Classic" },
  { key: "banner-nav", label: "Color nav bar" },
  { key: "centered", label: "Centered logo" },
  { key: "logo-center", label: "Logo center" },
  { key: "minimal-center", label: "Minimal Center" },
  { key: "modern-split", label: "Modern Split" },
];

/**
 * A faithful, full-width recreation of one Figma header-style card, drawn
 * with the store's own logo and theme primary so the picker previews what
 * the merchant will actually get. Element positions mirror the storefront's
 * template layouts exactly.
 */
function HeaderStylePreview({
  variant,
  generalBrand,
}: {
  variant: HeaderStyleVariant;
  generalBrand: GeneralBrandSettings;
}) {
  const logo = generalBrand.logoUrl ? (
    <AppImage
      src={generalBrand.logoUrl}
      alt={generalBrand.storeName || "Logo"}
      width={120}
      height={28}
      className="h-7 w-auto shrink-0 object-contain"
    />
  ) : (
    <span className="flex shrink-0 items-center gap-1.5 text-base font-extrabold tracking-tight">
      <Package className="h-5 w-5 text-primary" />
      {generalBrand.storeName || "Store"}
    </span>
  );

  const navLinks = (labels: string[], light = false) => (
    <span
      className={cn(
        "flex items-center gap-6 whitespace-nowrap text-[13px] font-semibold",
        light ? "text-primary-foreground" : "text-foreground",
      )}
    >
      <span className="inline-flex items-center gap-1">
        Collections
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5",
            light ? "text-primary-foreground/70" : "text-foreground/60",
          )}
        />
      </span>
      {labels.map((label) => (
        <span key={label}>{label}</span>
      ))}
    </span>
  );

  const iconSearch = (
    <span className="flex h-8 w-16 shrink-0 items-center justify-end rounded-full border border-border p-0.5">
      <span className="grid h-6 w-8 place-items-center rounded-md bg-foreground text-background">
        <Search className="h-3.5 w-3.5" />
      </span>
    </span>
  );

  const wideSearch = (
    <span className="flex h-9 min-w-0 flex-1 items-center rounded-lg bg-muted px-3 text-[12px] text-muted-foreground">
      <span className="truncate">Search products...</span>
      <Search className="ml-auto h-4 w-4 shrink-0" />
    </span>
  );

  const compactSearch = (
    <span className="flex h-8 w-44 shrink-0 items-center rounded-lg bg-muted px-3 text-[12px] text-muted-foreground">
      <span className="truncate">Search products...</span>
      <Search className="ml-auto h-3.5 w-3.5 shrink-0" />
    </span>
  );

  const account = (withWelcome: boolean) =>
    withWelcome ? (
      <span className="flex shrink-0 items-center gap-1.5">
        <User className="h-5 w-5 text-foreground/80" />
        <span className="flex flex-col gap-0.5 leading-none">
          <span className="text-[9px] text-muted-foreground">Welcome</span>
          <span className="text-[11px] font-semibold">Sign in / Register</span>
        </span>
      </span>
    ) : (
      <User className="h-5 w-5 shrink-0 text-foreground/80" />
    );

  const cart = (
    <span className="relative shrink-0">
      <ShoppingCart className="h-5 w-5 text-foreground/85" />
      <span className="absolute -right-1.5 -top-1.5 grid h-3.5 min-w-3.5 place-items-center rounded-full bg-primary px-0.5 text-[8px] font-bold text-primary-foreground">
        5
      </span>
    </span>
  );

  const allCategories = (
    <span className="flex h-9 shrink-0 items-center gap-2 rounded-md bg-primary px-3.5 text-[12px] font-semibold text-primary-foreground">
      <Menu className="h-4 w-4" />
      All Categories
    </span>
  );

  return (
    <div className="min-w-[38rem] bg-background px-5">
      {variant === "minimal" ? (
        <div className="flex items-center gap-5 py-4">
          {logo}
          <div className="flex min-w-0 flex-1 justify-center overflow-hidden">
            {navLinks(["Phone", "Camera", "Shoe", "Bags", "Cosmetics"])}
          </div>
          {iconSearch}
          {account(true)}
          {cart}
        </div>
      ) : variant === "nav-top" ? (
        <>
          <div className="flex items-center gap-5 pt-4">
            {logo}
            <div className="flex min-w-0 flex-1 justify-center overflow-hidden">
              {navLinks(["Phone", "Camera", "Shoe", "Bags", "Cosmetics"])}
            </div>
            {account(false)}
            {cart}
          </div>
          <div className="flex items-center gap-3 py-4">
            {allCategories}
            {wideSearch}
          </div>
        </>
      ) : variant === "classic" ? (
        <>
          <div className="flex items-center gap-5 pt-4">
            {logo}
            {wideSearch}
            {account(false)}
            {cart}
          </div>
          <div className="flex items-center gap-6 overflow-hidden py-4">
            {allCategories}
            {navLinks(["Phone", "Camera", "Shoe", "Bags", "Cosmetics"])}
          </div>
        </>
      ) : variant === "banner-nav" ? (
        <>
          <div className="flex items-center gap-5 py-4">
            {logo}
            {wideSearch}
            {account(false)}
            {cart}
          </div>
          <div className="-mx-5 flex items-center gap-6 overflow-hidden bg-primary px-5 py-3">
            {navLinks(["Phone", "Camera", "Shoe", "Bags", "Cosmetics"], true)}
          </div>
        </>
      ) : variant === "centered" ? (
        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-5 py-4">
          <div className="flex min-w-0 justify-start overflow-hidden">
            {navLinks(["Phone", "Camera", "Shoe"])}
          </div>
          {logo}
          <div className="flex items-center justify-end gap-4">
            {iconSearch}
            {account(false)}
            {cart}
          </div>
        </div>
      ) : variant === "minimal-center" ? (
        <div className="flex flex-col items-center gap-4 py-4">
          {logo}
          <div className="flex w-full items-center justify-between">
            <div className="flex justify-start">{compactSearch}</div>
            <div className="flex justify-center overflow-hidden">
              {navLinks(["Phone", "Camera", "Shoe", "Bags"])}
            </div>
            <div className="flex items-center justify-end gap-4">
              {account(false)}
              {cart}
            </div>
          </div>
        </div>
      ) : variant === "modern-split" ? (
        <div className="flex flex-col">
          <div className="flex items-center justify-between border-b pb-4 pt-4">
            <div className="flex justify-start">{compactSearch}</div>
            {logo}
            <div className="flex items-center justify-end gap-4">
              {account(false)}
              {cart}
            </div>
          </div>
          <div className="flex items-center justify-between overflow-hidden py-3">
            {allCategories}
            {navLinks(["Phone", "Camera", "Shoe", "Bags", "Cosmetics"])}
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-5 pt-4">
            <div className="flex justify-start">{compactSearch}</div>
            {logo}
            <div className="flex items-center justify-end gap-4">
              {account(false)}
              {cart}
            </div>
          </div>
          <div className="flex justify-center overflow-hidden py-4">
            {navLinks(["Phone", "Camera", "Shoe", "Bags", "Cosmetics"])}
          </div>
        </>
      )}
    </div>
  );
}

/** The large template picker (Figma's "Header Style" modal), one card per
 * style, stacked in a single column so each preview reads at full width. */
function HeaderStyleDialog({
  open,
  onOpenChange,
  value,
  generalBrand,
  onSelect,
  tf,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: HeaderStyleVariant;
  generalBrand: GeneralBrandSettings;
  onSelect: (variant: HeaderStyleVariant) => void;
  tf: (key: string, fallback: string) => string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{tf("style.dialogTitle", "Header style")}</DialogTitle>
          <DialogDescription>
            {tf(
              "style.dialogDescription",
              "Pick a header arrangement. Your logo, menu links, search, and action settings carry over.",
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {HEADER_TEMPLATES.map((template) => {
            const selected = template.key === value;
            return (
              <button
                key={template.key}
                type="button"
                onClick={() => onSelect(template.key)}
                aria-pressed={selected}
                className={cn(
                  "block w-full overflow-hidden rounded-xl border text-left shadow-sm transition-colors",
                  selected
                    ? "border-primary ring-1 ring-primary"
                    : "border-border hover:border-foreground/30",
                )}
              >
                <div className="overflow-x-hidden">
                  <HeaderStylePreview
                    variant={template.key}
                    generalBrand={generalBrand}
                  />
                </div>
                <div className="flex items-center justify-between border-t bg-muted/40 px-4 py-2">
                  <p className="text-xs font-medium">
                    {tf(`style.templates.${template.key}`, template.label)}
                  </p>
                  {selected ? (
                    <Badge className="h-5 px-2 text-[10px]">
                      {tf("style.current", "Current")}
                    </Badge>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}


/**
 * Which row the utility links sit in. The group always lands at the end of
 * its row's content but ahead of the cart and the other action icons —
 * those stay the header's last word on every template.
 */
function UtilityPlacementField({
  value,
  disabled,
  onChange,
  tf,
}: {
  value: HeaderUtilityPlacement;
  disabled?: boolean;
  onChange: (value: HeaderUtilityPlacement) => void;
  tf: (key: string, fallback: string) => string;
}) {
  const labels: Record<HeaderUtilityPlacement, string> = {
    menu: "With the menu links",
    search: "After the search bar",
    tags: "Bottom row, after top tags",
  };

  return (
    <FieldRow label={tf("pages.placementLabel", "Show these links in")}>
      <div
        className={cn(
          "grid gap-2 sm:grid-cols-3",
          disabled && "pointer-events-none opacity-55",
        )}
      >
        {HEADER_UTILITY_PLACEMENTS.map((placement) => {
          const selected = placement === value;
          return (
            <button
              key={placement}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(placement)}
              className={cn(
                "rounded-lg border p-2.5 text-left transition-colors",
                selected
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "border-border hover:border-foreground/30",
              )}
            >
              <UtilityPlacementDiagram placement={placement} />
              <p className="mt-2 text-xs font-medium">
                {tf(`pages.placement.${placement}`, labels[placement])}
              </p>
            </button>
          );
        })}
      </div>
    </FieldRow>
  );
}

/** Wireframe of which header row carries the links (shown highlighted). */
function UtilityPlacementDiagram({
  placement,
}: {
  placement: HeaderUtilityPlacement;
}) {
  const links = (active: boolean) => (
    <span className="flex shrink-0 gap-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={cn(
            "h-1.5 w-4 rounded-sm",
            active ? "bg-primary" : "bg-foreground/15",
          )}
        />
      ))}
    </span>
  );
  const logo = <span className="h-2 w-6 shrink-0 rounded-sm bg-foreground/70" />;
  const bar = <span className="h-2.5 flex-1 rounded-sm bg-foreground/10" />;
  const icons = (
    <span className="flex shrink-0 gap-0.5">
      {[0, 1].map((i) => (
        <span key={i} className="h-1.5 w-1.5 rounded-full bg-foreground/45" />
      ))}
    </span>
  );

  return (
    <div className="space-y-1.5 rounded-md border border-border/70 bg-background p-2">
      <div className="flex items-center gap-1.5">
        {logo}
        {placement === "menu" ? links(true) : null}
        {bar}
        {placement === "search" ? links(true) : null}
        {icons}
      </div>
      <div className="flex items-center gap-1.5">
        <span className="h-1.5 w-8 shrink-0 rounded-sm bg-foreground/25" />
        <span className="h-1.5 flex-1 rounded-sm bg-foreground/10" />
        {placement === "tags" ? links(true) : null}
      </div>
    </div>
  );
}

/** The Figma "Header Color" chips: Light / Dark / Color / Transparent. */
/**
 * Which logo artwork a paint mode shows. Only "color" and "transparent" need
 * it — a light bar always wants the primary logo and a dark bar the inverse
 * one, but those two take their contrast from the store's primary colour or
 * from whatever sits behind the glass, which no rule can infer.
 */
function HeaderLogoVariantField({
  label,
  hint,
  value,
  onChange,
  tf,
}: {
  label: string;
  hint: string;
  value: HeaderLogoVariant;
  onChange: (value: HeaderLogoVariant) => void;
  tf: (key: string, fallback: string) => string;
}) {
  const fallbacks: Record<HeaderLogoVariant, string> = {
    auto: "Auto",
    light: "Light logo",
    dark: "Dark logo",
  };
  return (
    <FieldRow label={label}>
      <div className="inline-flex w-full rounded-md border bg-background p-1">
        {HEADER_LOGO_VARIANTS.map((variant) => (
          <Button
            key={variant}
            type="button"
            variant={value === variant ? "secondary" : "ghost"}
            size="sm"
            className="flex-1"
            onClick={() => onChange(variant)}
          >
            {tf(`brand.logoVariant.${variant}`, fallbacks[variant])}
          </Button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">{hint}</p>
    </FieldRow>
  );
}

function HeaderColorModeField({
  label,
  value,
  onChange,
  tf,
}: {
  label: string;
  value: HeaderColorMode;
  onChange: (value: HeaderColorMode) => void;
  tf: (key: string, fallback: string) => string;
}) {
  const fallbacks: Record<HeaderColorMode, string> = {
    light: "Light",
    dark: "Dark",
    color: "Color",
    transparent: "Transparent",
  };
  return (
    <FieldRow label={label}>
      <div className="inline-flex w-full rounded-md border bg-background p-1">
        {HEADER_COLOR_MODES.map((mode) => (
          <Button
            key={mode}
            type="button"
            variant={value === mode ? "secondary" : "ghost"}
            size="sm"
            className="flex-1"
            onClick={() => onChange(mode)}
          >
            {tf(`colors.mode.${mode}`, fallbacks[mode])}
          </Button>
        ))}
      </div>
    </FieldRow>
  );
}
