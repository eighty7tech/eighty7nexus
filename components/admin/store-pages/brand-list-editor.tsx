"use client";

import { useEffect, useState } from "react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Check, GripVertical, ImageOff, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { AppImage } from "@/components/ui/app-image";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { NativeSelect } from "@/components/ui/native-select";
import { createTSafe } from "@/components/admin/online-store/t-safe";
import { apiClient } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import type {
  BlockInstance,
  SectionCatalogEntry,
} from "@/lib/storefront/sections/types";
import { VARIANT_FIELD_KEY } from "@/lib/storefront/sections/types";
import { buildBlockInstance } from "./instance-factory";

interface BrandOption {
  _id: string;
  name: string;
  logo?: string;
}

/**
 * The Brand List section's bespoke inspector — the Figma "Brands" panel: a
 * Template dropdown over the design variants, then the picked brands (logo
 * and name side by side) with an outline "Add Brand" pill that opens a
 * picker over the store's Brands (Products → Brands). No manual uploads —
 * the brand catalog is the single source of logos.
 */
export function BrandListEditor({
  entry,
  sectionId,
  settings,
  blocks,
  onSettingChange,
  onBlocksChange,
}: {
  entry: SectionCatalogEntry;
  sectionId: string;
  settings: Record<string, unknown>;
  blocks: BlockInstance[];
  onSettingChange: (key: string, value: unknown) => void;
  onBlocksChange: (updater: (blocks: BlockInstance[]) => BlockInstance[]) => void;
}) {
  const t = useTranslations();
  const tSafe = createTSafe(t);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [brands, setBrands] = useState<BrandOption[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiClient
      // assignable = approved, live brands — the storefront-visible set.
      .get<{ data?: BrandOption[] } | BrandOption[]>(
        "/api/brands?assignable=true",
      )
      .then((payload) => {
        if (cancelled) return;
        setBrands(Array.isArray(payload) ? payload : (payload?.data ?? []));
      })
      .catch(() => {
        if (!cancelled) setBrands([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const brandById = new Map((brands ?? []).map((brand) => [brand._id, brand]));
  const pickedIds = new Set(
    blocks.map((block) =>
      typeof block.settings.brand === "string" ? block.settings.brand : "",
    ),
  );

  const variants = entry.variants ?? [];
  const storedVariant = settings[VARIANT_FIELD_KEY];
  const activeVariant = variants.some((v) => v.key === storedVariant)
    ? (storedVariant as string)
    : variants[0]?.key;

  const brandDef = entry.blocks.find((def) => def.type === "brand");
  const atMax = brandDef?.max !== undefined && blocks.length >= brandDef.max;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    onBlocksChange((current) => {
      const from = current.findIndex((block) => block.id === active.id);
      const to = current.findIndex((block) => block.id === over.id);
      if (from < 0 || to < 0) return current;
      return arrayMove(current, from, to);
    });
  };

  const addBrand = (brandId: string) => {
    const block = buildBlockInstance(entry, "brand");
    block.settings.brand = brandId;
    onBlocksChange((current) => [...current, block]);
    setPickerOpen(false);
  };

  const previewImages = blocks
    .filter((block) => block.visible)
    .map((block) =>
      typeof block.settings.brand === "string"
        ? (brandById.get(block.settings.brand)?.logo ?? "")
        : "",
    )
    .filter(Boolean);

  return (
    <div className="space-y-5">
      {variants.length > 1 ? (
        <div className="space-y-1.5">
          <p className="text-sm font-semibold">
            {tSafe("admin.storeBuilder.brandEditor.template", "Template")}
          </p>
          <NativeSelect
            aria-label={tSafe(
              "admin.storeBuilder.brandEditor.template",
              "Template",
            )}
            value={activeVariant}
            onChange={(event) =>
              onSettingChange(VARIANT_FIELD_KEY, event.target.value)
            }
          >
            {variants.map((variant) => (
              <option key={variant.key} value={variant.key}>
                {tSafe(
                  `admin.storeBuilder.sections.${entry.type}.variants.${variant.key}`,
                  variant.name,
                )}
              </option>
            ))}
          </NativeSelect>
        </div>
      ) : null}

      {previewImages.length > 0 ? (
        <div className="space-y-1.5">
          <p className="text-sm font-semibold">
            {tSafe("admin.storeBuilder.brandEditor.preview", "Preview")}
          </p>
          {/* Mirrors the storefront tiles for the chosen template (the
              classes match BrandList's), centered in the frame. */}
          <div className="rounded-md border border-border bg-muted/30 px-4 py-5">
            <div
              className={cn(
                "flex flex-wrap items-center justify-center",
                activeVariant === "strip" ? "gap-6 sm:gap-10" : "gap-3",
              )}
            >
              {previewImages.map((image, index) => (
                <span
                  key={`${image}-${index}`}
                  className={
                    activeVariant === "strip"
                      ? "flex h-12 shrink-0 items-center justify-center px-1"
                      : "flex h-16 w-32 shrink-0 items-center justify-center rounded-md border border-border/70 bg-card px-4"
                  }
                >
                  <AppImage
                    src={image}
                    alt=""
                    width={96}
                    height={40}
                    className="max-h-10 w-auto object-contain opacity-80 grayscale"
                    sizes="96px"
                  />
                </span>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      <div className="space-y-3">
        <p className="text-sm font-semibold">
          {tSafe("admin.storeBuilder.brandEditor.brandList", "Brand List")}
        </p>

        {/* Pinned id: SSR'd dnd-kit contexts hydrate mismatched without one. */}
        <DndContext
          id={`brand-list-editor-${sectionId}`}
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={blocks.map((block) => block.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {blocks.map((block) => (
                <SortableBrandRow
                  key={block.id}
                  block={block}
                  brand={
                    typeof block.settings.brand === "string"
                      ? brandById.get(block.settings.brand)
                      : undefined
                  }
                  brandsLoaded={brands !== null}
                  tSafe={tSafe}
                  onRemove={() =>
                    onBlocksChange((current) =>
                      current.filter((candidate) => candidate.id !== block.id),
                    )
                  }
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        <Button
          type="button"
          variant="outline"
          disabled={atMax}
          onClick={() => setPickerOpen(true)}
          className="gap-1.5 rounded-full px-5 font-semibold"
        >
          {tSafe("admin.storeBuilder.addBlock.brand", "Add Brand")}
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="max-h-[70vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {tSafe("admin.storeBuilder.addBlock.brand", "Add Brand")}
            </DialogTitle>
          </DialogHeader>
          {brands === null ? (
            <div className="space-y-2" aria-hidden>
              {Array.from({ length: 4 }, (_, index) => (
                <div
                  key={index}
                  className="h-12 animate-pulse rounded-md bg-accent"
                />
              ))}
            </div>
          ) : brands.length === 0 ? (
            <p className="py-4 text-sm text-muted-foreground">
              {tSafe(
                "admin.storeBuilder.brandEditor.noBrands",
                "No brands yet — add brands under Products → Brands first.",
              )}
            </p>
          ) : (
            <div className="space-y-1">
              {brands.map((brand) => {
                const picked = pickedIds.has(brand._id);
                return (
                  <button
                    key={brand._id}
                    type="button"
                    disabled={picked}
                    onClick={() => addBrand(brand._id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-md border border-transparent px-2 py-1.5 text-left transition-colors",
                      picked
                        ? "opacity-50"
                        : "hover:border-border hover:bg-accent/40",
                    )}
                  >
                    <BrandLogo logo={brand.logo} name={brand.name} />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">
                      {brand.name}
                    </span>
                    {picked ? (
                      <Check className="h-4 w-4 shrink-0 text-primary" />
                    ) : null}
                  </button>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BrandLogo({ logo, name }: { logo?: string; name: string }) {
  return (
    <span className="flex h-10 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border/70 bg-muted/40">
      {logo ? (
        <AppImage
          src={logo}
          alt={name}
          width={64}
          height={40}
          className="max-h-8 w-auto object-contain"
        />
      ) : (
        <ImageOff className="h-4 w-4 text-muted-foreground" aria-hidden />
      )}
    </span>
  );
}

function SortableBrandRow({
  block,
  brand,
  brandsLoaded,
  tSafe,
  onRemove,
}: {
  block: BlockInstance;
  brand: BrandOption | undefined;
  brandsLoaded: boolean;
  tSafe: ReturnType<typeof createTSafe>;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: block.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "flex items-center gap-2 rounded-md border border-border bg-card px-2 py-1.5",
        isDragging && "z-10 shadow-md",
      )}
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
      <BrandLogo logo={brand?.logo} name={brand?.name ?? ""} />
      <span
        className={cn(
          "min-w-0 flex-1 truncate text-sm font-medium",
          !brand && "text-muted-foreground",
        )}
      >
        {brand
          ? brand.name
          : brandsLoaded
            ? // The picked brand fell out of the catalog (archived,
              // deactivated) — the storefront skips it; here it stays
              // deletable instead of vanishing silently.
              tSafe(
                "admin.storeBuilder.brandEditor.unknownBrand",
                "Brand no longer available",
              )
            : "…"}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 rounded-full bg-muted/60 text-muted-foreground hover:text-red-600 dark:hover:text-red-400"
        onClick={onRemove}
        aria-label={tSafe(
          "admin.storeBuilder.brandEditor.removeBrand",
          "Remove brand",
        )}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
