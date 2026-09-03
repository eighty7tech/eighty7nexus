"use client";

import { useEffect, useState } from "react";
import {
  DndContext,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ChevronDown,
  GripVertical,
  Loader2,
  Plus,
  RotateCcw,
  Star,
  Trash2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { AdminFormStickyHeader } from "@/components/admin/admin-form-sticky-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/toast-notification";
import { createTSafe } from "@/components/admin/online-store/t-safe";
import {
  ColorRow,
  SliderRow,
  TypographyRow,
} from "@/components/admin/store-pages/product-main-editor";
import { ProductCardPreview } from "@/components/admin/online-store/product-card-preview";
import {
  PRODUCT_CARD_ELEMENTS,
  PRODUCT_CARD_ELEMENT_LABELS,
  PRODUCT_CARD_TEMPLATE_IDS,
  PRODUCT_CARD_TEMPLATE_LABELS,
  PRODUCT_CARD_TEMPLATES,
  EMPTY_CARD_TYPOGRAPHY,
  getDefaultProductCardConfig,
  normalizeProductCardConfig,
  type ProductCardConfig,
  type ProductCardElement,
  type ProductCardGroup,
  type ProductCardHoverEffect,
  type ProductCardTypographyKey,
  type ProductCardVisibility,
} from "@/lib/products/product-card-config";
import { cn } from "@/lib/utils";

type TSafe = ReturnType<typeof createTSafe>;

type SettingsPayload = {
  success?: boolean;
  data?: { productCard?: unknown };
};

function cloneConfig(value: ProductCardConfig): ProductCardConfig {
  return JSON.parse(JSON.stringify(value)) as ProductCardConfig;
}

const VISIBILITY_ROWS: { key: keyof ProductCardVisibility; label: string }[] = [
  { key: "cartButtonAlways", label: "Always Show Cart Button" },
  { key: "discountChip", label: "Discount chip" },
  { key: "discountChipOnImage", label: "Discount chip on preview image" },
  { key: "itemSold", label: "Item sold" },
  { key: "ratingCount", label: "Rating count" },
  { key: "ratingMinimized", label: "Rating minimized" },
  { key: "variantCount", label: "Variant Count" },
];

const TYPOGRAPHY_ROWS: { key: ProductCardTypographyKey; label: string }[] = [
  { key: "brand", label: "Brand Text" },
  { key: "product", label: "Product Text" },
  { key: "category", label: "Category Text" },
  { key: "price", label: "Price Text" },
  { key: "discounted", label: "Discounted Price Text" },
  { key: "cart", label: "Cart Text" },
];

const HOVER_EFFECTS: { key: ProductCardHoverEffect; label: string }[] = [
  { key: "zoom", label: "Zoom in" },
  { key: "second-image", label: "Second image" },
  { key: "none", label: "None" },
];

/**
 * The product card configurator (Figma 534:1869 / 534:709): sticky live
 * preview on the left; on the right the "Order" panel (template picker modal
 * + grouped draggable element rows), the Visibility switches, and the Style
 * panel. One store-wide config, saved to `settings.productCard`.
 */
export function ProductCardBuilder({ locale }: { locale: string }) {
  const t = useTranslations();
  const tSafe = createTSafe(t);

  const [config, setConfig] = useState<ProductCardConfig>(() =>
    getDefaultProductCardConfig(),
  );
  const [initialConfig, setInitialConfig] = useState<ProductCardConfig>(() =>
    getDefaultProductCardConfig(),
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [addItemOpen, setAddItemOpen] = useState(false);

  const isDirty = JSON.stringify(config) !== JSON.stringify(initialConfig);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch("/api/admin/settings", { method: "GET" });
        const payload = (await response.json()) as SettingsPayload;
        if (cancelled) return;
        const loaded = normalizeProductCardConfig(payload.data?.productCard);
        setConfig(loaded);
        setInitialConfig(cloneConfig(loaded));
      } catch {
        // Defaults stay in place; save still works.
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const save = async () => {
    try {
      setIsSaving(true);
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          section: "productCard",
          data: normalizeProductCardConfig(config),
        }),
      });
      const payload = (await response.json()) as SettingsPayload;
      if (!response.ok || payload.success !== true) {
        throw new Error("save failed");
      }
      const saved = normalizeProductCardConfig(payload.data?.productCard);
      setConfig(saved);
      setInitialConfig(cloneConfig(saved));
      toast.success(tSafe("admin.productCardStudio.toast.saved", "Product card saved"));
    } catch {
      toast.error(
        tSafe(
          "admin.productCardStudio.toast.saveFailed",
          "Could not save the product card",
        ),
      );
    } finally {
      setIsSaving(false);
    }
  };

  // ---- config patch helpers ------------------------------------------------
  const groups = config.groups;
  const commitGroups = (next: ProductCardGroup[]) =>
    setConfig({ ...config, groups: next });
  const patchVisibility = (patch: Partial<ProductCardVisibility>) =>
    setConfig({ ...config, visibility: { ...config.visibility, ...patch } });
  const patchStyle = (patch: Partial<ProductCardConfig["style"]>) =>
    setConfig({ ...config, style: { ...config.style, ...patch } });
  const patchTypography = (
    key: ProductCardTypographyKey,
    patch: Partial<(typeof EMPTY_CARD_TYPOGRAPHY)>,
  ) =>
    patchStyle({
      typography: {
        ...config.style.typography,
        [key]: {
          ...(config.style.typography[key] ?? EMPTY_CARD_TYPOGRAPHY),
          ...patch,
        },
      },
    });

  const applyTemplate = (id: (typeof PRODUCT_CARD_TEMPLATE_IDS)[number]) => {
    // Templates replace the WHOLE config — order, visibility, and style land
    // in the panels below, where the merchant tweaks from there.
    setConfig(cloneConfig(PRODUCT_CARD_TEMPLATES[id]));
    setTemplatesOpen(false);
  };

  const usedKeys = new Set(
    groups.flatMap((group) => group.items.map((item) => item.key)),
  );
  const availableElements = PRODUCT_CARD_ELEMENTS.filter(
    (key) => !usedKeys.has(key),
  );

  const elementLabel = (key: ProductCardElement) =>
    tSafe(
      `admin.productCardStudio.elements.${key}`,
      PRODUCT_CARD_ELEMENT_LABELS[key],
    );

  // ---- drag & drop across groups (same pattern as product-main-editor) ----
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const findGroupIndex = (id: string) =>
    groups.findIndex(
      (group) => group.id === id || group.items.some((item) => item.key === id),
    );

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;
    const from = findGroupIndex(String(active.id));
    const to = findGroupIndex(String(over.id));
    if (from < 0 || to < 0 || from === to) return;

    const next = groups.map((group) => ({ ...group, items: [...group.items] }));
    const fromItems = next[from].items;
    const itemIndex = fromItems.findIndex((item) => item.key === active.id);
    if (itemIndex < 0) return;
    const [moved] = fromItems.splice(itemIndex, 1);
    const overIndex = next[to].items.findIndex((item) => item.key === over.id);
    next[to].items.splice(
      overIndex < 0 ? next[to].items.length : overIndex,
      0,
      moved,
    );
    commitGroups(next);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = findGroupIndex(String(active.id));
    const to = findGroupIndex(String(over.id));
    if (from < 0 || from !== to) return; // cross-group moves happen in onDragOver
    const items = groups[from].items;
    const oldIndex = items.findIndex((item) => item.key === active.id);
    const newIndex = items.findIndex((item) => item.key === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const next = groups.map((group, index) =>
      index === from
        ? { ...group, items: arrayMove(items, oldIndex, newIndex) }
        : group,
    );
    commitGroups(next);
  };

  const patchItem = (key: ProductCardElement, on: boolean) => {
    commitGroups(
      groups.map((group) => ({
        ...group,
        items: group.items.map((item) =>
          item.key === key ? { ...item, on } : item,
        ),
      })),
    );
  };

  const addItem = (key: ProductCardElement) => {
    const next = groups.map((group) => ({ ...group, items: [...group.items] }));
    if (next.length === 0) next.push({ id: crypto.randomUUID(), items: [] });
    next[next.length - 1].items.push({ key, on: true });
    commitGroups(next);
    setAddItemOpen(false);
  };

  const visibilityExample = (key: keyof ProductCardVisibility) => {
    switch (key) {
      case "cartButtonAlways":
        return (
          <span className="rounded-[4px] bg-foreground px-2 py-0.5 text-[10px] font-bold text-background">
            {tSafe("admin.productCardStudio.chips.cart", "Cart")}
          </span>
        );
      case "discountChip":
      case "discountChipOnImage":
        return (
          <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-600 dark:bg-rose-500/15 dark:text-rose-300">
            10% OFF
          </span>
        );
      case "itemSold":
        return (
          <span className="border-s border-border ps-2 text-[11px] text-muted-foreground">
            3 sold
          </span>
        );
      case "ratingCount":
        return (
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Star className="h-3 w-3 fill-amber-500 text-amber-500" /> (350)
          </span>
        );
      case "ratingMinimized":
        return (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-foreground">
            <Star className="h-3 w-3 fill-amber-500 text-amber-500" /> 4.9
          </span>
        );
      case "variantCount":
        return (
          <span className="text-[11px] font-semibold text-sky-600">+12</span>
        );
      default:
        return null;
    }
  };

  const subheading = (text: string) => (
    <p className="text-base font-bold tracking-tight text-foreground">{text}</p>
  );

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <AdminFormStickyHeader
        className="!mx-0 -mt-2 border-b-0 px-0 shadow-none md:px-0"
        title={tSafe("admin.productCardStudio.title", "Product Card")}
        status={
          <Badge variant={isDirty ? "secondary" : "default"}>
            {isDirty
              ? tSafe("admin.productCardStudio.status.unsaved", "Unsaved changes")
              : tSafe("admin.productCardStudio.status.live", "Live")}
          </Badge>
        }
        actions={
          <>
            <Button
              type="button"
              variant="outline"
              disabled={!isDirty || isSaving}
              onClick={() => setConfig(cloneConfig(initialConfig))}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              {tSafe("admin.productCardStudio.reset", "Reset")}
            </Button>
            <Button
              type="button"
              disabled={!isDirty || isSaving}
              onClick={() => void save()}
            >
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {tSafe("admin.productCardStudio.save", "Save")}
            </Button>
          </>
        }
      />

      <p className="text-sm text-muted-foreground">
        {tSafe(
          "admin.productCardStudio.subtitle",
          "Design the product card every grid, carousel and search result renders. Changes go live on save.",
        )}
      </p>

      <div className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)] lg:items-start">
        {/* Live preview — sticky so it stays beside the panel being edited. */}
        <Card className="lg:sticky lg:top-[calc(var(--dashboard-header-height,4rem)+4.5rem)]">
          <CardHeader>
            <CardTitle>
              {tSafe("admin.productCardStudio.preview", "Card Preview")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ProductCardPreview
              config={config}
              className="mx-auto w-full max-w-[280px]"
            />
          </CardContent>
        </Card>

        <div className="space-y-6">
          {/* Order */}
          <Card>
            <CardHeader>
              <CardTitle>
                {tSafe("admin.productCardStudio.order", "Order")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-2">
                <Label>
                  {tSafe("admin.productCardStudio.template", "Template")}
                </Label>
                <button
                  type="button"
                  onClick={() => setTemplatesOpen(true)}
                  className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 text-sm shadow-xs transition-colors hover:border-primary/50"
                >
                  <span>
                    {tSafe(
                      `admin.productCardStudio.templates.${config.template}`,
                      PRODUCT_CARD_TEMPLATE_LABELS[config.template],
                    )}
                  </span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>

              <DndContext
                id="product-card-order"
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
              >
                <div className="space-y-4">
                  {groups.map((group, index) => (
                    <OrderGroup
                      key={group.id}
                      group={group}
                      index={index}
                      tSafe={tSafe}
                      elementLabel={elementLabel}
                      onToggle={patchItem}
                      onRemoveGroup={() =>
                        commitGroups(groups.filter((g) => g.id !== group.id))
                      }
                    />
                  ))}
                </div>
              </DndContext>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Button
                  type="button"
                  onClick={() =>
                    commitGroups([
                      ...groups,
                      { id: crypto.randomUUID(), items: [] },
                    ])
                  }
                  className="rounded-full px-5 font-semibold"
                >
                  {tSafe("admin.productCardStudio.addGroup", "Add Group")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={availableElements.length === 0}
                  onClick={() => setAddItemOpen(true)}
                  className="gap-1.5 rounded-full px-5 font-semibold"
                >
                  {tSafe("admin.productCardStudio.addItem", "Add Item")}
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Visibility */}
          <Card>
            <CardHeader>
              <CardTitle>
                {tSafe("admin.productCardStudio.visibility", "Visibility")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {VISIBILITY_ROWS.map(({ key, label }) => (
                <div
                  key={key}
                  className="flex items-center justify-between gap-3"
                >
                  <span className="flex min-w-0 items-center gap-2 text-sm text-foreground">
                    <span className="truncate">
                      {tSafe(
                        `admin.productCardStudio.visibilityRows.${key}`,
                        label,
                      )}
                    </span>
                    {visibilityExample(key)}
                  </span>
                  <Switch
                    checked={config.visibility[key]}
                    onCheckedChange={(checked) =>
                      patchVisibility({ [key]: checked })
                    }
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Style */}
          <Card>
            <CardHeader>
              <CardTitle>
                {tSafe("admin.productCardStudio.style", "Style")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2.5">
                {subheading(tSafe("admin.productCardStudio.styleCard", "Card"))}
                <SliderRow
                  label={tSafe(
                    "admin.productCardStudio.styleRows.cardRadius",
                    "Card radius",
                  )}
                  value={config.style.cardRadius}
                  max={40}
                  onChange={(cardRadius) => patchStyle({ cardRadius })}
                />
                <SliderRow
                  label={tSafe(
                    "admin.productCardStudio.styleRows.cardPadding",
                    "Card padding",
                  )}
                  value={config.style.cardPadding}
                  max={40}
                  onChange={(cardPadding) => patchStyle({ cardPadding })}
                />
                <ColorRow
                  label={tSafe(
                    "admin.productCardStudio.styleRows.cardBackground",
                    "Card background",
                  )}
                  value={config.style.cardBackground}
                  onChange={(cardBackground) => patchStyle({ cardBackground })}
                />
                <ColorRow
                  label={tSafe(
                    "admin.productCardStudio.styleRows.cardBorder",
                    "Card border",
                  )}
                  value={config.style.cardBorder}
                  onChange={(cardBorder) => patchStyle({ cardBorder })}
                />
                <SliderRow
                  label={tSafe(
                    "admin.productCardStudio.styleRows.cardBorderWidth",
                    "Card border thickness",
                  )}
                  value={config.style.cardBorderWidth}
                  max={4}
                  step={0.5}
                  onChange={(cardBorderWidth) => patchStyle({ cardBorderWidth })}
                />
                <SliderRow
                  label={tSafe(
                    "admin.productCardStudio.styleRows.cardShadow",
                    "Card shadow",
                  )}
                  value={config.style.cardShadow}
                  max={60}
                  zeroLabel={tSafe("admin.productCardStudio.none", "None")}
                  onChange={(cardShadow) => patchStyle({ cardShadow })}
                />
              </div>

              <div className="space-y-2.5">
                {subheading(
                  tSafe("admin.productCardStudio.stylePreview", "Preview"),
                )}
                <ColorRow
                  label={tSafe(
                    "admin.productCardStudio.styleRows.previewBackground",
                    "Preview background",
                  )}
                  value={config.style.previewBackground}
                  onChange={(previewBackground) =>
                    patchStyle({ previewBackground })
                  }
                />
                <SliderRow
                  label={tSafe(
                    "admin.productCardStudio.styleRows.previewRadius",
                    "Preview radius",
                  )}
                  value={config.style.previewRadius}
                  max={40}
                  onChange={(previewRadius) => patchStyle({ previewRadius })}
                />
                <SliderRow
                  label={tSafe(
                    "admin.productCardStudio.styleRows.previewHeight",
                    "Preview height",
                  )}
                  value={config.style.previewHeight}
                  max={500}
                  step={10}
                  zeroLabel={tSafe("admin.productCardStudio.auto", "Auto")}
                  onChange={(previewHeight) => patchStyle({ previewHeight })}
                />
                <div className="flex items-center justify-between gap-3">
                  <span className="min-w-0 truncate text-sm text-foreground">
                    {tSafe(
                      "admin.productCardStudio.styleRows.previewHover",
                      "Preview hover effect",
                    )}
                  </span>
                  <NativeSelect
                    value={config.style.previewHover}
                    onChange={(event) =>
                      patchStyle({
                        previewHover: event.target
                          .value as ProductCardHoverEffect,
                      })
                    }
                    className="w-40 rounded-lg"
                  >
                    {HOVER_EFFECTS.map(({ key, label }) => (
                      <option key={key} value={key}>
                        {tSafe(
                          `admin.productCardStudio.hoverEffects.${key}`,
                          label,
                        )}
                      </option>
                    ))}
                  </NativeSelect>
                </div>
              </div>

              <div className="space-y-2.5">
                {subheading(tSafe("admin.productCardStudio.styleGap", "Gap"))}
                <SliderRow
                  label={tSafe(
                    "admin.productCardStudio.styleRows.groupGap",
                    "Group gap",
                  )}
                  value={config.style.groupGap}
                  max={60}
                  onChange={(groupGap) => patchStyle({ groupGap })}
                />
                <SliderRow
                  label={tSafe(
                    "admin.productCardStudio.styleRows.itemGap",
                    "Item gap",
                  )}
                  value={config.style.itemGap}
                  max={40}
                  onChange={(itemGap) => patchStyle({ itemGap })}
                />
              </div>

              <div className="space-y-2.5">
                {subheading(
                  tSafe("admin.productCardStudio.styleTypography", "Typography"),
                )}
                {TYPOGRAPHY_ROWS.map(({ key, label }) => (
                  <TypographyRow
                    key={key}
                    label={tSafe(
                      `admin.productCardStudio.typographyRows.${key}`,
                      label,
                    )}
                    value={config.style.typography[key]}
                    onChange={(patch) => patchTypography(key, patch)}
                    tSafe={tSafe}
                  />
                ))}
              </div>

              <div className="space-y-2.5">
                {subheading(tSafe("admin.productCardStudio.styleCart", "Cart"))}
                <ColorRow
                  label={tSafe(
                    "admin.productCardStudio.styleRows.cartBackground",
                    "Cart Button background",
                  )}
                  value={config.style.cartBackground}
                  onChange={(cartBackground) => patchStyle({ cartBackground })}
                />
                <ColorRow
                  label={tSafe(
                    "admin.productCardStudio.styleRows.cartBorder",
                    "Cart Button border",
                  )}
                  value={config.style.cartBorder}
                  onChange={(cartBorder) => patchStyle({ cartBorder })}
                />
                <SliderRow
                  label={tSafe(
                    "admin.productCardStudio.styleRows.cartBorderWidth",
                    "Cart border thickness",
                  )}
                  value={config.style.cartBorderWidth}
                  max={4}
                  step={0.5}
                  onChange={(cartBorderWidth) => patchStyle({ cartBorderWidth })}
                />
                <SliderRow
                  label={tSafe(
                    "admin.productCardStudio.styleRows.cartRadius",
                    "Cart button radius",
                  )}
                  value={config.style.cartRadius}
                  max={30}
                  onChange={(cartRadius) => patchStyle({ cartRadius })}
                />
              </div>

              <div className="space-y-2.5">
                {subheading(
                  tSafe("admin.productCardStudio.styleStock", "Out of Stock"),
                )}
                <ColorRow
                  label={tSafe(
                    "admin.productCardStudio.styleRows.stockBackground",
                    "Stock background",
                  )}
                  value={config.style.stockBackground}
                  onChange={(stockBackground) => patchStyle({ stockBackground })}
                />
                <ColorRow
                  label={tSafe(
                    "admin.productCardStudio.styleRows.stockBorder",
                    "Stock border",
                  )}
                  value={config.style.stockBorder}
                  onChange={(stockBorder) => patchStyle({ stockBorder })}
                />
                <SliderRow
                  label={tSafe(
                    "admin.productCardStudio.styleRows.stockBorderWidth",
                    "Stock border thickness",
                  )}
                  value={config.style.stockBorderWidth}
                  max={4}
                  step={0.5}
                  onChange={(stockBorderWidth) =>
                    patchStyle({ stockBorderWidth })
                  }
                />
                <SliderRow
                  label={tSafe(
                    "admin.productCardStudio.styleRows.stockRadius",
                    "Stock badge radius",
                  )}
                  value={config.style.stockRadius}
                  max={30}
                  onChange={(stockRadius) => patchStyle({ stockRadius })}
                />
                <TypographyRow
                  label={tSafe(
                    "admin.productCardStudio.typographyRows.stock",
                    "Stock Text",
                  )}
                  value={config.style.typography.stock}
                  onChange={(patch) => patchTypography("stock", patch)}
                  tSafe={tSafe}
                />
              </div>

              <div className="space-y-2.5">
                {subheading(
                  tSafe(
                    "admin.productCardStudio.styleMiscellaneous",
                    "Miscellaneous",
                  ),
                )}
                <ColorRow
                  label={tSafe(
                    "admin.productCardStudio.styleRows.ratingColor",
                    "Rating Color",
                  )}
                  value={config.style.ratingColor}
                  onChange={(ratingColor) => patchStyle({ ratingColor })}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Card Templates modal — picking one replaces the whole config. */}
      <Dialog open={templatesOpen} onOpenChange={setTemplatesOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {tSafe("admin.productCardStudio.templatesTitle", "Card Templates")}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-6 pt-2 sm:grid-cols-2 lg:grid-cols-3">
            {PRODUCT_CARD_TEMPLATE_IDS.map((id) => {
              const selected = config.template === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => applyTemplate(id)}
                  aria-pressed={selected}
                  className={cn(
                    "flex flex-col gap-3 rounded-xl border p-3 text-left transition-colors",
                    selected
                      ? "border-primary ring-1 ring-primary"
                      : "border-transparent hover:border-primary/40",
                  )}
                >
                  <span
                    className={cn(
                      "w-fit rounded-md px-3 py-1 text-sm font-semibold",
                      selected
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground",
                    )}
                  >
                    {tSafe(
                      `admin.productCardStudio.templates.${id}`,
                      PRODUCT_CARD_TEMPLATE_LABELS[id],
                    )}
                  </span>
                  <ProductCardPreview
                    config={PRODUCT_CARD_TEMPLATES[id]}
                    outOfStock={false}
                    className="pointer-events-none w-full"
                  />
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Item dialog — elements not currently placed in any group. */}
      <Dialog open={addItemOpen} onOpenChange={setAddItemOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {tSafe("admin.productCardStudio.addItem", "Add Item")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-1">
            {availableElements.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => addItem(key)}
                className="flex w-full items-center rounded-md border border-transparent px-3 py-2 text-left text-sm font-medium transition-colors hover:border-border hover:bg-accent/40"
              >
                {elementLabel(key)}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---- Order group ----------------------------------------------------------

function OrderGroup({
  group,
  index,
  tSafe,
  elementLabel,
  onToggle,
  onRemoveGroup,
}: {
  group: ProductCardGroup;
  index: number;
  tSafe: TSafe;
  elementLabel: (key: ProductCardElement) => string;
  onToggle: (key: ProductCardElement, on: boolean) => void;
  onRemoveGroup: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: group.id });

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <p className="text-sm font-semibold">
          {tSafe("admin.productCardStudio.groupLabel", "Group {number}", {
            number: index + 1,
          })}
        </p>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 rounded-full bg-muted/60 text-muted-foreground hover:text-red-600 dark:hover:text-red-400"
          onClick={onRemoveGroup}
          aria-label={tSafe("admin.productCardStudio.removeGroup", "Remove group")}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
      <SortableContext
        items={group.items.map((item) => item.key)}
        strategy={verticalListSortingStrategy}
      >
        <div
          ref={setNodeRef}
          className={cn(
            "space-y-2 rounded-md transition-colors",
            isOver && "bg-accent/30",
            group.items.length === 0 &&
              "border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground",
          )}
        >
          {group.items.length === 0
            ? tSafe(
                "admin.productCardStudio.emptyGroup",
                "Drag an element here, or remove the group.",
              )
            : group.items.map((item) => (
                <OrderRow
                  key={item.key}
                  item={item}
                  label={elementLabel(item.key)}
                  onToggle={(on) => onToggle(item.key, on)}
                />
              ))}
        </div>
      </SortableContext>
    </div>
  );
}

function OrderRow({
  item,
  label,
  onToggle,
}: {
  item: { key: ProductCardElement; on: boolean };
  label: string;
  onToggle: (on: boolean) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.key });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("flex items-center gap-1.5", isDragging && "z-10 opacity-80")}
    >
      <button
        type="button"
        className="cursor-grab touch-none p-1 text-muted-foreground"
        {...attributes}
        {...listeners}
        aria-label="Reorder"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="flex min-w-0 flex-1 items-center justify-between gap-3 rounded-full border border-border bg-card px-4 py-2">
        <span
          className={cn(
            "truncate text-sm font-medium",
            !item.on && "text-muted-foreground",
          )}
        >
          {label}
        </span>
        <Switch checked={item.on} onCheckedChange={onToggle} />
      </div>
    </div>
  );
}
