"use client";

import { useTranslations } from "next-intl";
import {
  ArrowDown,
  ArrowUp,
  CornerDownRight,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createTSafe } from "@/components/admin/online-store/t-safe";
import { cn } from "@/lib/utils";

/**
 * The header's custom links, edited in place (the Figma "Collections ▾
 * Phone Camera Shoe Bags" row). One level of nesting: a link with children
 * renders as a dropdown on the storefront. Unknown fields on items saved by
 * the full menu editor ride along untouched in `rest`.
 */
export interface MenuLinkDraft {
  key: string;
  label: string;
  url: string;
  children: MenuLinkDraft[];
  rest: Record<string, unknown>;
}

export function toMenuLinkDrafts(items: unknown): MenuLinkDraft[] {
  if (!Array.isArray(items)) return [];
  return items.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const { label, url, children, ...rest } = item as Record<string, unknown>;
    return [
      {
        key: crypto.randomUUID(),
        label: typeof label === "string" ? label : "",
        url: typeof url === "string" ? url : "",
        children: toMenuLinkDrafts(children),
        rest,
      },
    ];
  });
}

/** Drafts back to API items. Unlabeled rows are dropped, not rejected. */
export function toMenuItems(drafts: MenuLinkDraft[]): Record<string, unknown>[] {
  return drafts
    .filter((draft) => draft.label.trim())
    .map((draft) => ({
      ...draft.rest,
      label: draft.label.trim(),
      url: draft.url.trim() || "#",
      children: toMenuItems(draft.children),
    }));
}

export function newMenuLinkDraft(): MenuLinkDraft {
  return { key: crypto.randomUUID(), label: "", url: "", children: [], rest: {} };
}

function moveItem<T>(list: T[], index: number, delta: number): T[] {
  const target = index + delta;
  if (target < 0 || target >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(index, 1);
  next.splice(target, 0, item);
  return next;
}

export function HeaderMenuLinksEditor({
  links,
  onChange,
  disabled,
}: {
  links: MenuLinkDraft[];
  onChange: (links: MenuLinkDraft[]) => void;
  disabled?: boolean;
}) {
  const tSafe = createTSafe(useTranslations());

  const updateLink = (index: number, patch: Partial<MenuLinkDraft>) => {
    onChange(
      links.map((link, i) => (i === index ? { ...link, ...patch } : link)),
    );
  };

  const updateChild = (
    index: number,
    childIndex: number,
    patch: Partial<MenuLinkDraft>,
  ) => {
    updateLink(index, {
      children: links[index].children.map((child, i) =>
        i === childIndex ? { ...child, ...patch } : child,
      ),
    });
  };

  return (
    <div className={cn("space-y-3", disabled && "pointer-events-none opacity-55")}>
      {links.length === 0 ? (
        <p className="rounded-md border border-dashed px-3 py-4 text-sm text-muted-foreground">
          {tSafe(
            "admin.headerStudio.menuLinks.empty",
            "No custom links yet. Add links like Phone, Camera, or Shoes — a link with sub-links becomes a dropdown.",
          )}
        </p>
      ) : (
        links.map((link, index) => (
          <div key={link.key} className="space-y-2 rounded-md border p-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Input
                value={link.label}
                placeholder={tSafe(
                  "admin.headerStudio.menuLinks.labelPlaceholder",
                  "Label",
                )}
                onChange={(event) =>
                  updateLink(index, { label: event.target.value })
                }
                className="sm:max-w-52"
              />
              <Input
                value={link.url}
                placeholder="/products?category=phones"
                onChange={(event) =>
                  updateLink(index, { url: event.target.value })
                }
              />
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={index === 0}
                  onClick={() => onChange(moveItem(links, index, -1))}
                  aria-label={tSafe(
                    "admin.headerStudio.menuLinks.moveUp",
                    "Move up",
                  )}
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={index === links.length - 1}
                  onClick={() => onChange(moveItem(links, index, 1))}
                  aria-label={tSafe(
                    "admin.headerStudio.menuLinks.moveDown",
                    "Move down",
                  )}
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() =>
                    onChange(links.filter((_, i) => i !== index))
                  }
                  aria-label={tSafe(
                    "admin.headerStudio.menuLinks.remove",
                    "Remove link",
                  )}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {link.children.map((child, childIndex) => (
              <div
                key={child.key}
                className="flex flex-col gap-2 sm:flex-row sm:items-center sm:pl-6"
              >
                <CornerDownRight className="hidden h-4 w-4 shrink-0 text-muted-foreground sm:block" />
                <Input
                  value={child.label}
                  placeholder={tSafe(
                    "admin.headerStudio.menuLinks.subLabelPlaceholder",
                    "Sub-link label",
                  )}
                  onChange={(event) =>
                    updateChild(index, childIndex, {
                      label: event.target.value,
                    })
                  }
                  className="sm:max-w-46"
                />
                <Input
                  value={child.url}
                  placeholder="/collections/summer"
                  onChange={(event) =>
                    updateChild(index, childIndex, { url: event.target.value })
                  }
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() =>
                    updateLink(index, {
                      children: link.children.filter(
                        (_, i) => i !== childIndex,
                      ),
                    })
                  }
                  aria-label={tSafe(
                    "admin.headerStudio.menuLinks.remove",
                    "Remove link",
                  )}
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() =>
                updateLink(index, {
                  children: [...link.children, newMenuLinkDraft()],
                })
              }
              className="text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              {tSafe("admin.headerStudio.menuLinks.addSubLink", "Add sub-link")}
            </Button>
          </div>
        ))
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onChange([...links, newMenuLinkDraft()])}
      >
        <Plus className="h-4 w-4" />
        {tSafe("admin.headerStudio.menuLinks.addLink", "Add link")}
      </Button>
    </div>
  );
}
