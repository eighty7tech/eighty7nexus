import type { CSSProperties } from "react";
import {
  isValidCssColor,
  readableForegroundColor,
} from "@/lib/appearance-colors";

/**
 * Turn the active theme's visual-styler settings into the inline CSS
 * variables and data attributes the `.store-surface` wrapper carries. The
 * companion CSS lives in globals.css ("Theme engine: visual styler") — the
 * attributes exist so rules there can stay conditional (e.g. dark mode keeps
 * its own background even when a custom light background is set).
 *
 * Blank or malformed values produce nothing, so the theme/branding defaults
 * stay in effect — same contract as `buildCustomColorVars`.
 */

/** `--radius` steps for the "cardRoundness" setting ("theme" = omit). */
const ROUNDNESS_RADII: Record<string, string> = {
  none: "0rem",
  small: "0.375rem",
  medium: "0.625rem",
  large: "1rem",
  extra: "1.5rem",
};

export interface ThemeSurfaceProps {
  style?: CSSProperties;
  dataAttributes: Record<string, string>;
}

export function getThemeSurfaceProps(
  settings: Record<string, unknown>,
): ThemeSurfaceProps {
  const style: Record<string, string> = {};
  const dataAttributes: Record<string, string> = {};

  const background =
    typeof settings.backgroundColor === "string"
      ? settings.backgroundColor.trim()
      : "";
  if (isValidCssColor(background)) {
    style["--store-custom-bg"] = background;
    dataAttributes["data-custom-bg"] = "";
  }

  const accent =
    typeof settings.accentColor === "string" ? settings.accentColor.trim() : "";
  if (isValidCssColor(accent)) {
    // Scoped to the storefront surface: action buttons, links, rings. The
    // admin keeps its own Branding colors. Portaled overlays (drawers,
    // dropdowns) attach to <body> and keep the global brand color.
    style["--primary"] = accent;
    style["--ring"] = accent;
    style["--primary-foreground"] = readableForegroundColor(accent);
  }

  const roundness =
    typeof settings.cardRoundness === "string" ? settings.cardRoundness : "";
  if (roundness in ROUNDNESS_RADII) {
    // Inline var beats the per-theme `data-store-theme` token, which is
    // exactly the intent: "theme" omits it and the token stays in charge.
    style["--radius"] = ROUNDNESS_RADII[roundness];
  }

  const buttonStyle =
    typeof settings.buttonStyle === "string" ? settings.buttonStyle : "";
  if (
    buttonStyle === "rounded" ||
    buttonStyle === "pill" ||
    buttonStyle === "square"
  ) {
    dataAttributes["data-button-style"] = buttonStyle;
  }

  return {
    style: Object.keys(style).length > 0 ? (style as CSSProperties) : undefined,
    dataAttributes,
  };
}
