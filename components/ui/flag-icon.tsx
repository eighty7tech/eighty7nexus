"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * FlagIcon
 *
 * Renders a country flag as a real SVG image instead of a Unicode
 * regional-indicator emoji.
 *
 * Why: Windows (Segoe UI Emoji) deliberately ships no flag glyphs, so
 * emoji flags like "🇺🇸" render as the bare letters "US" there, while
 * macOS/iOS show the actual flag. Serving an image makes flags render
 * identically on every platform.
 *
 * Uses flagcdn.com via a plain <img> (not next/image) so it needs no
 * entry in next.config `images.remotePatterns`.
 */

const CDN = "https://flagcdn.com";

export interface FlagIconProps
  extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> {
  /** ISO 3166-1 alpha-2 country code, e.g. "US", "BD". Case-insensitive. */
  countryCode: string;
  /** Rendered width in px. Height follows the 4:3 flag ratio unless `round` is true. Default 20. */
  size?: number;
  /** Whether to render the flag as a perfect circle. */
  round?: boolean;
}

export function FlagIcon({
  countryCode,
  size = 20,
  round = false,
  className,
  alt,
  ...props
}: FlagIconProps) {
  const code = countryCode?.toLowerCase();

  if (!code) return null;

  // flagcdn serves widths as w20, w40, w80, w160... Request 2x for crispness.
  const width = Math.round(size);
  const height = round ? width : Math.round((size * 3) / 4);

  return (
    <img
      src={`${CDN}/w40/${code}.png`}
      srcSet={`${CDN}/w80/${code}.png 2x`}
      width={width}
      height={height}
      alt={alt ?? countryCode.toUpperCase()}
      loading="lazy"
      decoding="async"
      className={cn("inline-block shrink-0 object-cover", round ? "rounded-full" : "rounded-[3px]", className)}
      style={{ width, height }}
      {...props}
    />
  );
}
