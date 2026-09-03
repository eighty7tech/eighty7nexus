import Link from "next/link";
import { Package, Rss } from "lucide-react";
import { AppImage } from "@/components/ui/app-image";

/**
 * The trending-links row at the bottom of the navbar (the Figma "Top Tags"
 * row): quick jumps into searches, categories, or campaign pages, as plain
 * text links — no chips, no borders. Renders nothing until the admin adds
 * tags, unless the header parks its utility links here.
 *
 * Visually this row belongs to the navbar: it wears the header's background
 * and casts the header's shadow, and a globals.css rule (keyed off
 * `data-top-tags`) suppresses the header bar's own shadow while this row
 * renders — so the nav shadow starts AFTER this row, not between it and
 * the bar above.
 *
 * When Header Studio places the utility links on this row, they render
 * right-aligned beside the tags (the Figma layout); the same globals.css
 * rule then hides the header's own fallback strip.
 */
export function TopTags({
  locale,
  tags,
  utilityLinks = [],
}: {
  locale: string;
  tags: { id: string; label: string; href: string }[];
  utilityLinks?: { label: string; href: string; target?: string; icon?: string }[];
}) {
  const visible = tags.filter((tag) => tag.label.trim());
  if (visible.length === 0 && utilityLinks.length === 0) return null;

  const resolveHref = (raw: string) => {
    if (!raw) return `/${locale}/products`;
    if (raw.startsWith("http")) return raw;
    return `/${locale}${raw.startsWith("/") ? raw : `/${raw}`}`;
  };

  return (
    <div
      data-top-tags
      className="bg-background shadow-[0_2px_10px_rgba(15,23,42,0.06)] dark:shadow-[0_2px_10px_rgba(0,0,0,0.35)]"
    >
      <div className="container mx-auto flex items-center gap-6 overflow-x-auto px-4 pb-3 pt-1 scrollbar-none lg:gap-8">
        {visible.map((tag) => (
          <Link
            key={tag.id}
            href={resolveHref(tag.href)}
            className="shrink-0 text-[13px] font-medium text-foreground/80 transition-colors hover:text-foreground"
          >
            {tag.label}
          </Link>
        ))}
        {utilityLinks.length > 0 ? (
          <div className="ms-auto flex shrink-0 items-center gap-6">
            {utilityLinks.map((link) => {
              const isBlog =
                link.label.toLowerCase() === "blog" ||
                link.href.includes("/blog");
              const isTrackOrder =
                link.label.toLowerCase() === "track order" ||
                link.href.includes("/track-order");
              return (
                <Link
                  key={`${link.href}-${link.label}`}
                  href={link.href}
                  target={link.target}
                  rel={link.target === "_blank" ? "noopener noreferrer" : undefined}
                  className="inline-flex shrink-0 items-center gap-2 text-[13px] font-medium text-foreground/80 transition-colors hover:text-foreground"
                >
                  {link.icon ? (
                    <AppImage
                      src={link.icon}
                      alt={link.label}
                      width={16}
                      height={16}
                      className="h-4 w-4 object-contain"
                    />
                  ) : isTrackOrder ? (
                    <Package className="h-4 w-4" />
                  ) : isBlog ? (
                    <Rss className="h-4 w-4" />
                  ) : null}
                  <span className="whitespace-nowrap">{link.label}</span>
                </Link>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}
