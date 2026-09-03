import type { CSSProperties } from "react";
import { LayoutGrid, List, Menu } from "lucide-react";

import type {
  CategoryTriggerIcon,
  CategoryTriggerSettings,
  CategoryTriggerStyle,
} from "@/lib/header-config";

/**
 * Resolves the merchant's "All Categories" trigger settings into the class list
 * and inline style the button renders with. Lives outside both call sites
 * because the storefront header and the admin builder preview have to agree —
 * a preview that paints its own approximation stops being a preview.
 */

/**
 * Theme mode: colours come from the store's own tokens, so the button keeps
 * following a theme change instead of being pinned to a hex.
 */
const THEME_FILL_CLASS: Record<CategoryTriggerStyle, string> = {
  filled: "bg-primary text-primary-foreground hover:bg-primary/90",
  outline: "bg-transparent text-foreground hover:bg-foreground/[0.06]",
  // Neutral on purpose: "soft" is the quiet, unbranded chip (a pale surface
  // with ordinary body text), which is what makes it the alternative to
  // `filled` rather than a washed-out copy of it.
  soft: "bg-muted text-foreground hover:bg-muted/70",
  ghost: "bg-transparent text-foreground hover:bg-foreground/[0.06]",
};

const THEME_BORDER_CLASS: Record<CategoryTriggerStyle, string> = {
  filled: "border-primary",
  outline: "border-foreground/30",
  soft: "border-border",
  ghost: "border-foreground/20",
};

/**
 * Custom mode: the three hexes land on CSS variables rather than straight into
 * `style`, so the hover states stay ordinary Tailwind classes. Inline colours
 * would win over any `hover:` rule and leave the button dead to the pointer.
 */
const CUSTOM_FILL_CLASS: Record<CategoryTriggerStyle, string> = {
  filled:
    "bg-[var(--trigger-bg)] text-[var(--trigger-fg)] hover:bg-[color-mix(in_srgb,var(--trigger-bg)_88%,var(--trigger-fg))]",
  outline:
    "bg-transparent text-[var(--trigger-fg)] hover:bg-[color-mix(in_srgb,var(--trigger-fg)_8%,transparent)]",
  soft: "bg-[color-mix(in_srgb,var(--trigger-bg)_14%,transparent)] text-[var(--trigger-fg)] hover:bg-[color-mix(in_srgb,var(--trigger-bg)_24%,transparent)]",
  ghost:
    "bg-transparent text-[var(--trigger-fg)] hover:bg-[color-mix(in_srgb,var(--trigger-fg)_8%,transparent)]",
};

/**
 * Renders the merchant's chosen glyph. Written as a switch returning literal
 * elements rather than a name→component lookup: picking a component out of a
 * map during render reads as building a component on the fly, which remounts
 * the subtree on every identity change and is what the React lint rule warns
 * about. Three branches cost less than that.
 */
export function CategoryTriggerGlyph({
  icon,
  className,
}: {
  icon: CategoryTriggerIcon;
  className?: string;
}) {
  if (icon === "grid") return <LayoutGrid className={className} />;
  if (icon === "list") return <List className={className} />;
  return <Menu className={className} />;
}

/** Whether the background hex is doing anything at this style. */
export function categoryTriggerUsesBackground(style: CategoryTriggerStyle) {
  return style === "filled" || style === "soft";
}

/**
 * The rail sits directly under the button and the two have to read as one card,
 * so its bottom corners follow the button's radius — capped, because a pill
 * button is a reasonable choice while a pill-bottomed 400px rail is not.
 */
export function getCategoryRailRadius(trigger: CategoryTriggerSettings) {
  return Math.min(trigger.borderRadius, 16);
}

/**
 * Room the flyout may take beside the rail: whatever the viewport has left once
 * the rail and a 48px margin are gone, capped at the four-column width the
 * grid is built for.
 */
export function getMegaFlyoutMaxWidth(railWidth: number) {
  return `min(940px, calc(100vw - ${railWidth + 48}px))`;
}

export function getCategoryTriggerStyle(
  trigger: CategoryTriggerSettings,
  { isDark, open = false }: { isDark: boolean; open?: boolean },
): { className: string; style: CSSProperties } {
  const scheme = isDark ? trigger.colors.dark : trigger.colors.light;
  const custom = trigger.useCustomColors;
  const radius = trigger.borderRadius;

  const style: CSSProperties = {
    width: trigger.width,
    height: trigger.height,
    // Squared off while the panel is open so the button and the rail below it
    // read as one card rather than a button parked above a panel.
    borderRadius: open ? `${radius}px ${radius}px 0 0` : radius,
    borderWidth: trigger.borderWidth,
    borderStyle: "solid",
    ...(custom
      ? ({
          "--trigger-bg": scheme.backgroundColor,
          "--trigger-fg": scheme.textColor,
          "--trigger-border": scheme.borderColor,
        } as CSSProperties)
      : {}),
  };

  const fill = custom
    ? CUSTOM_FILL_CLASS[trigger.style]
    : THEME_FILL_CLASS[trigger.style];

  // borderWidth is its own axis: a filled button can carry an outline and a
  // ghost one can carry none, which is exactly the pair of looks merchants ask
  // for. At width 0 the colour is still declared so the box model never jumps.
  const border =
    trigger.borderWidth > 0
      ? custom
        ? "border-[var(--trigger-border)]"
        : THEME_BORDER_CLASS[trigger.style]
      : "border-transparent";

  return {
    className: [
      fill,
      border,
      trigger.style === "filled" ? "" : "shadow-none",
    ]
      .filter(Boolean)
      .join(" "),
    style,
  };
}
