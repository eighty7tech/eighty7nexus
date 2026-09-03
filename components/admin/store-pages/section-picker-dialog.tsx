"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  BadgePercent,
  Bookmark,
  FolderTree,
  GalleryHorizontalEnd,
  Grid3X3,
  HelpCircle,
  Image as ImageIcon,
  Images,
  LayoutGrid,
  LayoutPanelLeft,
  Layers,
  ListTree,
  Megaphone,
  MessageSquareQuote,
  Newspaper,
  Search,
  ShoppingBag,
  Sparkles,
  Star,
  Store,
  Tags,
  TextCursorInput,
  TicketPercent,
  Timer,
  Trash2,
  Truck,
  Heading2,
  UnfoldVertical,
  type LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "@/components/ui/toast-notification";
import { createTSafe } from "@/components/admin/online-store/t-safe";
import { SectionThumbnail } from "@/components/admin/store-pages/section-thumbnails";
import {
  SliderSetupPanel,
  sliderSetupTitle,
  type SliderSetupKind,
} from "@/components/admin/store-pages/slider-setup-panels";
import { apiClient } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import {
  DEFAULT_PROMO_GRID,
  PROMO_GRIDS,
  SLIDER_GRIDS,
  DEFAULT_SLIDER_GRID,
  DEFAULT_SLIDER_HEIGHT,
  DEFAULT_SLIDER_WIDTH,
} from "@/lib/storefront/sections/slider-grids";
import type {
  SectionCatalogEntry,
  SectionCategory,
  SectionInstance,
} from "@/lib/storefront/sections/types";

interface SavedSectionSummary {
  _id: string;
  name: string;
  section: SectionInstance;
}

const SECTION_ICONS: Record<string, LucideIcon> = {
  slideshow: GalleryHorizontalEnd,
  "promotion-banner": Megaphone,
  "promotion-grid": LayoutGrid,
  "countdown-offer": Timer,
  "coupon-banner": TicketPercent,
  "product-grid": ShoppingBag,
  "product-browser": Grid3X3,
  "product-group": Tags,
  "featured-collection": Layers,
  "sponsored-rail": BadgePercent,
  "category-list": ListTree,
  "category-mosaic": LayoutPanelLeft,
  "collection-list": FolderTree,
  "brand-list": Star,
  "image-text": ImageIcon,
  "rich-text": TextCursorInput,
  heading: Heading2,
  gap: UnfoldVertical,
  "image-gallery": Images,
  "blog-posts": Newspaper,
  testimonials: MessageSquareQuote,
  "service-benefits": Truck,
  faq: HelpCircle,
  "vendor-list": Store,
  "become-vendor": Store,
};

const TABS: {
  key: "suggested" | "saved" | SectionCategory;
  fallback: string;
}[] = [
  { key: "suggested", fallback: "Suggested" },
  { key: "promotions", fallback: "Promotions" },
  { key: "products", fallback: "Products" },
  { key: "categories", fallback: "Categories" },
  { key: "content", fallback: "Content" },
  { key: "more", fallback: "More" },
  { key: "saved", fallback: "Saved" },
];

const SLIDER_SETUP_STEPS: SliderSetupKind[] = ["grid", "width", "height"];

const SLIDER_SETUP_DEFAULTS: Record<SliderSetupKind, string> = {
  grid: DEFAULT_SLIDER_GRID,
  width: DEFAULT_SLIDER_WIDTH,
  height: DEFAULT_SLIDER_HEIGHT,
};

/** The promotion grid starts from a multi-cell shape and a shorter band. */
const PROMO_SETUP_DEFAULTS: Record<SliderSetupKind, string> = {
  grid: DEFAULT_PROMO_GRID,
  width: "fixed",
  height: "half",
};

/**
 * The "Add section" picker: catalog tiles grouped by category, with a
 * Suggested tab for the flagged ones. Singleton sections that already exist
 * on the page render disabled, as do sections whose feature gate is off.
 *
 * Picking the Hero Slider does not insert immediately: the same dialog
 * walks the Figma setup wizard first — grid, then width style, then height
 * style — and only the last choice inserts the section with all three.
 */
export function SectionPickerDialog({
  open,
  onOpenChange,
  catalog,
  existingTypes,
  onPick,
  onPickSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  catalog: SectionCatalogEntry[];
  existingTypes: string[];
  onPick: (
    entry: SectionCatalogEntry,
    settingsOverride?: Record<string, unknown>,
  ) => void;
  /** Inserts a saved-library entry (the caller clones it with fresh ids). */
  onPickSaved: (section: SectionInstance) => void;
}) {
  const t = useTranslations();
  const tSafe = createTSafe(t);
  const [tab, setTab] = useState<string>("suggested");
  const [query, setQuery] = useState("");
  const [saved, setSaved] = useState<SavedSectionSummary[] | null>(null);
  const [sliderSetup, setSliderSetup] = useState<{
    entry: SectionCatalogEntry;
    step: number;
    choices: Partial<Record<SliderSetupKind, string>>;
  } | null>(null);

  // Reopening the picker always starts back at the catalog.
  const handleOpenChange = (next: boolean) => {
    if (!next) setSliderSetup(null);
    onOpenChange(next);
  };

  // The library is tiny; refresh it whenever the picker opens. Reopening
  // also starts from a clean search.
  useEffect(() => {
    if (!open) return;
    setQuery("");
    let cancelled = false;
    apiClient
      .get<SavedSectionSummary[]>("/api/admin/store-pages/saved-sections")
      .then((items) => {
        if (!cancelled) setSaved(Array.isArray(items) ? items : []);
      })
      .catch(() => {
        if (!cancelled) setSaved([]);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  const entriesFor = (key: string) =>
    key === "suggested"
      ? catalog.filter((entry) => entry.suggested)
      : catalog.filter((entry) => entry.category === key);

  const catalogName = (type: string) => {
    const entry = catalog.find((candidate) => candidate.type === type);
    return entry
      ? tSafe(`admin.storeBuilder.sections.${entry.type}.name`, entry.name)
      : type;
  };

  // Search matches the same strings the tiles show (localized name and
  // description, with their English fallbacks) plus the raw type key, so
  // whatever the merchant can read on a tile, they can type to find it.
  const normalizedQuery = query.trim().toLowerCase();
  const searchResults = normalizedQuery
    ? catalog.filter((entry) =>
        [
          tSafe(`admin.storeBuilder.sections.${entry.type}.name`, entry.name),
          tSafe(
            `admin.storeBuilder.sections.${entry.type}.description`,
            entry.description,
          ),
          entry.type,
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery),
      )
    : null;

  const sectionTile = (entry: SectionCatalogEntry) => {
    const Icon = SECTION_ICONS[entry.type] ?? LayoutGrid;
    const blocked =
      !entry.available ||
      (entry.singleton && existingTypes.includes(entry.type));
    return (
      <button
        key={entry.type}
        type="button"
        disabled={blocked}
        onClick={() => {
          // The grid-of-cells sections run their setup wizard
          // inside this dialog before inserting anything.
          if (entry.type === "slideshow" || entry.type === "promotion-grid") {
            setSliderSetup({ entry, step: 0, choices: {} });
            return;
          }
          onPick(entry);
          onOpenChange(false);
        }}
        className={cn(
          "group flex flex-col items-stretch gap-2 rounded-lg border border-border bg-card p-3 text-left transition-colors",
          blocked
            ? "cursor-not-allowed opacity-50"
            : "hover:border-primary/60 hover:bg-accent/40",
        )}
      >
        <SectionThumbnail type={entry.type} fallbackIcon={Icon} />
        <span className="text-sm font-semibold">
          {tSafe(`admin.storeBuilder.sections.${entry.type}.name`, entry.name)}
        </span>
        <span className="text-xs leading-relaxed text-muted-foreground">
          {tSafe(
            `admin.storeBuilder.sections.${entry.type}.description`,
            entry.description,
          )}
        </span>
      </button>
    );
  };

  if (sliderSetup) {
    const kind = SLIDER_SETUP_STEPS[sliderSetup.step] as SliderSetupKind;
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <button
                type="button"
                aria-label={tSafe(
                  "admin.storeBuilder.sliderBlock.back",
                  "Back",
                )}
                onClick={() =>
                  setSliderSetup((current) =>
                    !current || current.step === 0
                      ? null
                      : { ...current, step: current.step - 1 },
                  )
                }
                className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              {sliderSetupTitle(kind, tSafe)}
            </DialogTitle>
          </DialogHeader>
          <SliderSetupPanel
            kind={kind}
            grids={
              sliderSetup.entry.type === "promotion-grid"
                ? PROMO_GRIDS
                : SLIDER_GRIDS
            }
            value={
              sliderSetup.choices[kind] ??
              (sliderSetup.entry.type === "promotion-grid"
                ? PROMO_SETUP_DEFAULTS[kind]
                : SLIDER_SETUP_DEFAULTS[kind])
            }
            onSelect={(key) => {
              const choices = { ...sliderSetup.choices, [kind]: key };
              if (sliderSetup.step < SLIDER_SETUP_STEPS.length - 1) {
                setSliderSetup({
                  ...sliderSetup,
                  choices,
                  step: sliderSetup.step + 1,
                });
                return;
              }
              const fallback =
                sliderSetup.entry.type === "promotion-grid"
                  ? PROMO_SETUP_DEFAULTS
                  : SLIDER_SETUP_DEFAULTS;
              onPick(sliderSetup.entry, {
                grid: choices.grid ?? fallback.grid,
                width: choices.width ?? fallback.width,
                height: choices.height ?? fallback.height,
              });
              handleOpenChange(false);
            }}
            tSafe={tSafe}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            {tSafe("admin.storeBuilder.addSection", "Add section")}
          </DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={tSafe(
              "admin.storeBuilder.searchSections",
              "Search blocks…",
            )}
            className="pl-9"
          />
        </div>

        {searchResults ? (
          searchResults.length === 0 ? (
            <p className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              {tSafe(
                "admin.storeBuilder.searchSectionsEmpty",
                "No blocks match your search.",
              )}
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {searchResults.map(sectionTile)}
            </div>
          )
        ) : (
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="flex w-full flex-wrap justify-start">
              {TABS.map((tabDef) => (
                <TabsTrigger key={tabDef.key} value={tabDef.key}>
                  {tSafe(
                    `admin.storeBuilder.categories.${tabDef.key}`,
                    tabDef.fallback,
                  )}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="saved" className="mt-4">
              {saved === null ? null : saved.length === 0 ? (
                <p className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                  {tSafe(
                    "admin.storeBuilder.savedEmpty",
                    "Nothing saved yet. Use the bookmark on any section row to keep a configured section here.",
                  )}
                </p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {saved.map((item) => (
                    <div
                      key={item._id}
                      className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          onPickSaved(item.section);
                          onOpenChange(false);
                        }}
                        className="flex min-w-0 flex-1 items-center gap-3 text-left"
                      >
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-accent text-foreground">
                          <Bookmark className="h-4 w-4" />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold">
                            {item.name}
                          </span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {catalogName(item.section.type)}
                          </span>
                        </span>
                      </button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={tSafe(
                          "admin.storeBuilder.deleteSaved",
                          "Delete saved section",
                        )}
                        className="h-7 w-7 shrink-0 text-muted-foreground hover:text-red-600 dark:hover:text-red-400"
                        onClick={() => {
                          void apiClient
                            .delete(
                              `/api/admin/store-pages/saved-sections/${item._id}`,
                            )
                            .then(() =>
                              setSaved(
                                (current) =>
                                  current?.filter(
                                    (candidate) => candidate._id !== item._id,
                                  ) ?? null,
                              ),
                            )
                            .catch(() =>
                              toast.error(
                                tSafe(
                                  "admin.storeBuilder.actionFailed",
                                  "The action failed",
                                ),
                              ),
                            );
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {TABS.filter((tabDef) => tabDef.key !== "saved").map((tabDef) => (
              <TabsContent key={tabDef.key} value={tabDef.key} className="mt-4">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {entriesFor(tabDef.key).map(sectionTile)}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
