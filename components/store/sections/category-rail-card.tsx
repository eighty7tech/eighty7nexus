import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Package } from "lucide-react";
import { AppImage } from "@/components/ui/app-image";
import { getStorefrontCategories } from "@/lib/storefront-categories";
import { cn } from "@/lib/utils";
import type { Locale } from "@/config/i18n.config";

const RAIL_CATEGORY_LIMIT = 8;

/**
 * The Hero Slider's static category cell: a light, headerless department
 * list (the list IS the header — there is no "All Categories" bar above
 * it). It fills whatever grid area the chosen slider grid assigns it and is
 * not editable from the builder — its content is always the store's root
 * categories.
 *
 * The design's literal values in LIGHT mode (#f2f2f2 panel, #e7e2ff
 * hairline, #474747 labels) with a token fallback under `dark:`: the mockup
 * only specifies the light appearance, and this is a navigation list, not
 * artwork, so a fixed light panel would be a glaring white block on a dark
 * page.
 */
export async function CategoryRailCard({
  locale,
  className,
}: {
  locale: Locale;
  className?: string;
}) {
  const t = await getTranslations({ locale });

  const roots =
    (await getStorefrontCategories().catch(() => null))?.categories?.slice(
      0,
      RAIL_CATEGORY_LIMIT,
    ) ?? [];

  // An empty catalog keeps the panel (the grid reserves its area either
  // way) but renders it as a quiet plate instead of a dead list.
  return (
    <nav
      aria-label={t("common.allCategories")}
      // `[border-width:0.5px]`, not `border-[0.5px]` — the latter generates
      // no rule at all (Tailwind reads it as a colour slot). Chrome floors
      // sub-pixel borders to one device pixel; Safari draws true hairlines.
      className={cn(
        "h-full overflow-hidden rounded-[10px] border-solid border-[#e7e2ff] [border-width:0.5px] bg-[#f2f2f2] text-[#474747] dark:border-border dark:bg-muted dark:text-foreground",
        className,
      )}
    >
      {roots.length > 0 ? (
        <ul className="flex h-full flex-col gap-[25px] overflow-hidden pe-[30px] ps-[29px] pt-[26px]">
          {roots.map((category) => (
            <li key={category._id}>
              <Link
                href={`/${locale}/categories/${encodeURIComponent(category.slug)}`}
                className="flex items-center gap-2 text-[15px] font-bold transition-opacity hover:opacity-70"
              >
                <span className="grid h-[26px] w-[27px] shrink-0 place-items-center">
                  {category.icon || category.image ? (
                    <AppImage
                      src={(category.icon || category.image) as string}
                      alt=""
                      className="h-[22px] w-[22px] rounded-sm object-contain"
                      width={22}
                      height={22}
                    />
                  ) : (
                    <Package className="h-[21px] w-[21px]" aria-hidden />
                  )}
                </span>
                <span className="truncate">{category.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </nav>
  );
}
