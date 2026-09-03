"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  GalleryHorizontalEnd,
  ImageIcon,
  ImagePlus,
  X,
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
import { NativeSelect } from "@/components/ui/native-select";
import { createTSafe } from "@/components/admin/online-store/t-safe";
import { SliderPreview } from "@/components/admin/sliders/slider-card";
import { apiClient } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { normalizeSlides, type SliderDocument } from "@/lib/sliders/types";
import type {
  BlockInstance,
  SectionCatalogEntry,
} from "@/lib/storefront/sections/types";
import { BlockEditor } from "./block-editor";
import { SectionImageField } from "./section-image-field";

interface CollectionOption {
  _id: string;
  title: string;
}

/**
 * The Featured Collection ("Top Collections") inspector. The generic block
 * list stays (drag, hide, remove, Add Collection) — this editor supplies
 * what the generated fields cannot: rows labeled with the PICKED
 * collection's name, and the feature slot as one control that takes either
 * an image upload or a saved slider, like a hero grid cell.
 */
export function FeaturedCollectionEditor({
  entry,
  sectionId,
  settings,
  blocks,
  onSettingChange,
  onBlocksChange,
  locale,
  languages,
  defaultLanguage,
}: {
  entry: SectionCatalogEntry;
  sectionId: string;
  settings: Record<string, unknown>;
  blocks: BlockInstance[];
  onSettingChange: (key: string, value: unknown) => void;
  onBlocksChange: (
    updater: (blocks: BlockInstance[]) => BlockInstance[],
  ) => void;
  locale: string;
  languages: string[];
  defaultLanguage: string;
}) {
  const t = useTranslations();
  const tSafe = createTSafe(t);

  // ---- data the rows need: collection names, saved sliders ----------------
  const [collections, setCollections] = useState<CollectionOption[] | null>(
    null,
  );
  const [sliders, setSliders] = useState<SliderDocument[] | null>(null);
  const [featureDialog, setFeatureDialog] = useState<{
    blockId: string;
    mode: "choose" | "sliders" | "image";
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiClient
      // paginatedResponse nests the rows: { data, pagination }, NOT an array.
      .get<{ data?: CollectionOption[] } | CollectionOption[]>(
        "/api/admin/collections?page=1&limit=100&status=active",
      )
      .then((payload) => {
        if (cancelled) return;
        const items = Array.isArray(payload) ? payload : (payload?.data ?? []);
        setCollections(items);
      })
      .catch(() => {
        if (!cancelled) setCollections([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const loadSliders = () => {
    apiClient
      .get<SliderDocument[]>("/api/admin/sliders")
      .then((list) => {
        if (!Array.isArray(list)) return setSliders([]);
        setSliders(
          list.map((entry) => ({
            ...entry,
            slides: normalizeSlides(entry.slides),
          })),
        );
      })
      .catch(() => setSliders((current) => current ?? []));
  };
  useEffect(loadSliders, []);
  // The Sliders page opens from here in another tab — refresh the list every
  // time the pick dialog comes up so a just-created slider is offered.
  useEffect(() => {
    if (featureDialog?.mode === "sliders") loadSliders();
  }, [featureDialog?.mode]);

  const collectionTitle = useMemo(() => {
    const byId = new Map((collections ?? []).map((c) => [c._id, c.title]));
    return (id: unknown) =>
      typeof id === "string" ? byId.get(id) : undefined;
  }, [collections]);
  const sliderByHandle = useMemo(
    () => new Map((sliders ?? []).map((entry) => [entry.handle, entry])),
    [sliders],
  );

  const patchBlock = (blockId: string, patch: Record<string, unknown>) =>
    onBlocksChange((current) =>
      current.map((block) =>
        block.id === blockId
          ? { ...block, settings: { ...block.settings, ...patch } }
          : block,
      ),
    );

  const str = (value: unknown) => (typeof value === "string" ? value : "");
  const dialogBlock = featureDialog
    ? blocks.find((block) => block.id === featureDialog.blockId)
    : undefined;

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
          {tSafe("admin.storeBuilder.fields.title", "Title")}
        </p>
        <Input
          value={str(settings.title)}
          onChange={(event) => onSettingChange("title", event.target.value)}
        />
      </div>

      <BlockEditor
        entry={entry}
        sectionId={sectionId}
        blocks={blocks}
        onChange={onBlocksChange}
        languages={languages}
        defaultLanguage={defaultLanguage}
        locale={locale}
        labelFor={(block) => collectionTitle(block.settings.collection)}
        renderFields={(block) => (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-4">
            <div className="space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                {tSafe("admin.storeBuilder.fields.collection", "Collection")}
              </p>
              <NativeSelect
                value={str(block.settings.collection)}
                onChange={(event) =>
                  patchBlock(block.id, { collection: event.target.value })
                }
                disabled={collections === null}
                className="w-full"
              >
                <option value="">
                  {tSafe(
                    "admin.storeBuilder.selectCollection",
                    "Select a collection…",
                  )}
                </option>
                {(collections ?? []).map((option) => (
                  <option key={option._id} value={option._id}>
                    {option.title}
                  </option>
                ))}
                {/* Keep a stored id selectable even off the first page. */}
                {str(block.settings.collection) &&
                collections &&
                !collections.some(
                  (option) => option._id === block.settings.collection,
                ) ? (
                  <option value={str(block.settings.collection)}>
                    {str(block.settings.collection)}
                  </option>
                ) : null}
              </NativeSelect>
            </div>

            <div className="space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                {tSafe(
                  "admin.storeBuilder.fields.maxProducts",
                  "Max products to show",
                )}
              </p>
              <Input
                type="number"
                inputMode="numeric"
                min={4}
                max={6}
                value={
                  typeof block.settings.limit === "number"
                    ? block.settings.limit
                    : 4
                }
                onChange={(event) => {
                  const parsed = Number(event.target.value);
                  patchBlock(block.id, {
                    limit: Number.isFinite(parsed)
                      ? Math.min(6, Math.max(4, Math.floor(parsed)))
                      : 4,
                  });
                }}
              />
            </div>
            </div>

            <div className="flex flex-col space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                {tSafe(
                  "admin.storeBuilder.fields.featureImage",
                  "Feature image",
                )}
              </p>
              <FeatureSlot
                block={block}
                sliderByHandle={sliderByHandle}
                tSafe={tSafe}
                onOpen={() =>
                  setFeatureDialog({ blockId: block.id, mode: "choose" })
                }
                onClear={() =>
                  patchBlock(block.id, {
                    kind: "image",
                    image: "",
                    slider: "",
                  })
                }
              />
            </div>
          </div>
        )}
      />

      {featureDialog && dialogBlock ? (
        <FeatureContentDialog
          state={featureDialog}
          onStateChange={setFeatureDialog}
          block={dialogBlock}
          sectionId={sectionId}
          sectionType={entry.type}
          locale={locale}
          sliders={sliders}
          onPatch={(patch) => patchBlock(dialogBlock.id, patch)}
          tSafe={tSafe}
        />
      ) : null}
    </div>
  );
}

/**
 * The feature slot at rest: what is currently chosen (image thumbnail or
 * real slider preview), or the "Add image or slide" plate. Clicking it —
 * either way — opens the content dialog.
 */
function FeatureSlot({
  block,
  sliderByHandle,
  tSafe,
  onOpen,
  onClear,
}: {
  block: BlockInstance;
  sliderByHandle: Map<string, SliderDocument>;
  tSafe: ReturnType<typeof createTSafe>;
  onOpen: () => void;
  onClear: () => void;
}) {
  const str = (value: unknown) => (typeof value === "string" ? value : "");
  const kind = block.settings.kind === "slider" ? "slider" : "image";
  const image = str(block.settings.image);
  const handle = str(block.settings.slider);
  const slider = kind === "slider" && handle
    ? sliderByHandle.get(handle)
    : undefined;
  const filled = kind === "image" ? Boolean(image) : Boolean(handle);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onOpen}
        className={cn(
          "group relative flex aspect-square w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-lg text-center transition-shadow",
          filled
            ? "bg-card hover:ring-2 hover:ring-primary/40"
            : "border border-dashed border-border bg-muted/40 hover:ring-2 hover:ring-primary/30",
        )}
      >
        {kind === "image" && image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : slider ? (
          <>
            <span className="pointer-events-none absolute inset-0">
              <SliderPreview
                slider={slider}
                className="h-full w-full rounded-lg aspect-auto"
              />
            </span>
            <span className="absolute bottom-1.5 start-1.5 max-w-[80%] truncate rounded-md bg-background/85 px-2 py-0.5 text-xs font-medium shadow-sm">
              {slider.name}
            </span>
          </>
        ) : handle ? (
          // The stored handle's slider was deleted — keep it visible (and
          // replaceable) instead of silently blank.
          <span className="max-w-full truncate px-3 text-sm font-medium text-amber-600 dark:text-amber-400">
            {handle}
          </span>
        ) : (
          <>
            <span className="grid h-9 w-9 place-items-center rounded-md bg-accent text-muted-foreground">
              <ImagePlus className="h-4.5 w-4.5" />
            </span>
            <span className="text-sm font-medium text-muted-foreground">
              {tSafe(
                "admin.storeBuilder.featuredCollection.addFeature",
                "Add an image or a slide",
              )}
            </span>
          </>
        )}
      </button>
      {filled ? (
        <button
          type="button"
          onClick={onClear}
          aria-label={tSafe(
            "admin.storeBuilder.sliderBlock.removeContent",
            "Remove content",
          )}
          className="absolute end-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-background/90 text-muted-foreground shadow-sm transition-colors hover:text-red-600 dark:hover:text-red-400"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </div>
  );
}

/** The pick dialog — image upload or saved slider, like a hero grid cell. */
function FeatureContentDialog({
  state,
  onStateChange,
  block,
  sectionId,
  sectionType,
  locale,
  sliders,
  onPatch,
  tSafe,
}: {
  state: { blockId: string; mode: "choose" | "sliders" | "image" };
  onStateChange: (
    next: { blockId: string; mode: "choose" | "sliders" | "image" } | null,
  ) => void;
  block: BlockInstance;
  sectionId: string;
  sectionType: string;
  locale: string;
  sliders: SliderDocument[] | null;
  onPatch: (patch: Record<string, unknown>) => void;
  tSafe: ReturnType<typeof createTSafe>;
}) {
  const str = (value: unknown) => (typeof value === "string" ? value : "");
  const currentSlider = str(block.settings.slider);
  const slidersHref = `/${locale}/admin/online-store/sliders`;
  const title =
    state.mode === "sliders"
      ? tSafe("admin.storeBuilder.sliderBlock.pickSlider", "Pick a slider")
      : state.mode === "image"
        ? tSafe("admin.storeBuilder.sliderBlock.cellImage", "Image")
        : tSafe(
            "admin.storeBuilder.featuredCollection.featureTitle",
            "Add feature content",
          );

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onStateChange(null);
      }}
    >
      <DialogContent
        className={cn(
          "max-h-[85vh] overflow-y-auto",
          // The slider list shows REAL previews — give them room.
          state.mode === "sliders"
            ? "sm:max-w-[min(110rem,calc(100vw-4rem))]"
            : "sm:max-w-xl",
        )}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {state.mode !== "choose" ? (
              <button
                type="button"
                onClick={() => onStateChange({ ...state, mode: "choose" })}
                aria-label={tSafe("admin.storeBuilder.sliderBlock.back", "Back")}
                className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            ) : null}
            {title}
          </DialogTitle>
        </DialogHeader>

        {state.mode === "choose" ? (
          <div className="grid grid-cols-2 gap-3">
            {(
              [
                {
                  key: "image",
                  icon: ImageIcon,
                  label: tSafe(
                    "admin.storeBuilder.sliderBlock.cellImage",
                    "Image",
                  ),
                  hint: tSafe(
                    "admin.storeBuilder.featuredCollection.imageHint",
                    "A static picture, linked to the collection.",
                  ),
                },
                {
                  key: "sliders",
                  icon: GalleryHorizontalEnd,
                  label: tSafe(
                    "admin.storeBuilder.sliderBlock.cellSlider",
                    "Slider",
                  ),
                  hint: tSafe(
                    "admin.storeBuilder.sliderBlock.cellSliderHint",
                    "A saved slider from the Sliders page.",
                  ),
                },
              ] as const
            ).map(({ key, icon: Icon, label, hint }) => (
              <button
                key={key}
                type="button"
                onClick={() => onStateChange({ ...state, mode: key })}
                className="flex flex-col items-center gap-2 rounded-lg border border-border bg-card p-6 text-center transition-colors hover:border-primary/60 hover:bg-accent/40"
              >
                <span className="grid h-11 w-11 place-items-center rounded-md bg-accent text-foreground">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="text-sm font-semibold">{label}</span>
                <span className="text-xs text-muted-foreground">{hint}</span>
              </button>
            ))}
          </div>
        ) : state.mode === "sliders" ? (
          <div className="space-y-3">
            {sliders === null ? null : sliders.length === 0 ? (
              <p className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                {tSafe(
                  "admin.storeBuilder.sliderBlock.noSliders",
                  "No sliders yet — create one on the Sliders page.",
                )}
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {sliders.map((option) => (
                  <button
                    key={String(option._id ?? option.handle)}
                    type="button"
                    onClick={() => {
                      onPatch({ kind: "slider", slider: option.handle });
                      onStateChange(null);
                    }}
                    aria-pressed={currentSlider === option.handle}
                    className={cn(
                      "flex flex-col gap-2 rounded-lg border p-3 text-left transition-colors",
                      currentSlider === option.handle
                        ? "border-primary ring-1 ring-primary"
                        : "border-border hover:border-primary/60 hover:bg-accent/40",
                    )}
                  >
                    {/* The real storefront component, exactly as the
                        Sliders page previews it — never a stand-in. */}
                    <span className="pointer-events-none block">
                      <SliderPreview
                        slider={option}
                        className="aspect-[16/6] w-full rounded-md"
                      />
                    </span>
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="min-w-0 truncate text-sm font-semibold">
                        {option.name}
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {option.slides.length}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            )}
            <Button asChild type="button" variant="outline" className="w-full">
              <Link href={slidersHref} target="_blank">
                {tSafe(
                  "admin.storeBuilder.sliderBlock.createEdit",
                  "Create / Edit Sliders",
                )}
              </Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <SectionImageField
              value={
                block.settings.kind === "image"
                  ? str(block.settings.image)
                  : ""
              }
              onChange={(url) => onPatch({ kind: "image", image: url })}
              context={{
                locale,
                sectionType,
                sectionId,
                blockType: block.type,
                blockId: block.id,
              }}
              uploadTitle={tSafe(
                "admin.storeBuilder.imageUploadTitle",
                "Drag and drop an image, or click to browse",
              )}
              previewAspectRatio="3 / 4"
            />
            <Button
              type="button"
              className="w-full"
              onClick={() => onStateChange(null)}
            >
              {tSafe("admin.storeBuilder.sliderBlock.done", "Done")}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
