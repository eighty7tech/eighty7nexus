"use client";

import { useEffect } from "react";
import { useAppSettings } from "@/providers/app-settings-provider";
import { useAppSettings as useAppSettingsStore } from "@/stores/app-settings";
import { buildGoogleFontUrl } from "@/lib/typography/google-fonts-catalog";
import type { ITypographySettings } from "@/models/settings.model";

export function TypographyApplier({
  initialTypography,
}: {
  initialTypography?: ITypographySettings;
}) {
  const { initialSettings } = useAppSettings() as {
    initialSettings?: { appearance?: { typography?: ITypographySettings } };
  };
  const storeTypography = useAppSettingsStore((s) => s.typography);

  const typography =
    storeTypography ||
    initialSettings?.appearance?.typography ||
    initialTypography;

  useEffect(() => {
    if (!typography) return;

    // 1. Google Fonts Dynamic Link Injection
    const requestedFamilies = [
      typography.headingFont,
      typography.bodyFont,
      typography.monoFont,
      typography.accentFont,
    ].filter(Boolean) as string[];

    const googleUrl = buildGoogleFontUrl(requestedFamilies);
    let linkEl = document.getElementById("dynamic-google-fonts") as HTMLLinkElement | null;

    if (googleUrl) {
      if (!linkEl) {
        linkEl = document.createElement("link");
        linkEl.id = "dynamic-google-fonts";
        linkEl.rel = "stylesheet";
        document.head.appendChild(linkEl);
      }
      if (linkEl.href !== googleUrl) {
        linkEl.href = googleUrl;
      }
    } else if (linkEl) {
      linkEl.remove();
    }

    // 2. Custom Fonts @font-face style injection
    let customFontEl = document.getElementById("custom-uploaded-fonts") as HTMLStyleElement | null;
    if (typography.customFonts && typography.customFonts.length > 0) {
      if (!customFontEl) {
        customFontEl = document.createElement("style");
        customFontEl.id = "custom-uploaded-fonts";
        document.head.appendChild(customFontEl);
      }
      const fontFaces = typography.customFonts
        .map(
          (cf) => `
        @font-face {
          font-family: '${cf.name}';
          src: url('${cf.fileUrl}') format('${cf.format === "ttf" ? "truetype" : cf.format}');
          font-weight: ${cf.weight || 400};
          font-style: normal;
          font-display: swap;
        }
      `,
        )
        .join("\n");
      customFontEl.textContent = fontFaces;
    } else if (customFontEl) {
      customFontEl.remove();
    }

    // 3. CSS Variables Application
    const root = document.documentElement;

    if (typography.headingFont) {
      root.style.setProperty(
        "--font-heading",
        `'${typography.headingFont}', var(--font-inter), sans-serif`,
      );
    }
    if (typography.headingWeight) {
      root.style.setProperty(
        "--font-heading-weight",
        String(typography.headingWeight),
      );
    }
    if (typography.headingLetterSpacing) {
      root.style.setProperty(
        "--font-heading-spacing",
        typography.headingLetterSpacing,
      );
    }
    if (typography.headingTransform) {
      root.style.setProperty(
        "--font-heading-transform",
        typography.headingTransform,
      );
    }
    if (typography.headingColor) {
      root.style.setProperty("--font-heading-color", typography.headingColor);
    }

    if (typography.bodyFont) {
      root.style.setProperty(
        "--font-sans",
        `'${typography.bodyFont}', var(--font-inter), sans-serif`,
      );
      root.style.setProperty(
        "--font-body",
        `'${typography.bodyFont}', var(--font-inter), sans-serif`,
      );
    }
    if (typography.bodyWeight) {
      root.style.setProperty(
        "--font-body-weight",
        String(typography.bodyWeight),
      );
    }
    if (typography.bodyLineHeight) {
      root.style.setProperty(
        "--font-body-line-height",
        typography.bodyLineHeight,
      );
    }
    if (typography.bodyColor) {
      root.style.setProperty("--font-body-color", typography.bodyColor);
    }

    if (typography.monoFont) {
      root.style.setProperty(
        "--font-mono",
        `'${typography.monoFont}', var(--font-geist-mono), monospace`,
      );
    }
    if (typography.monoColor) {
      root.style.setProperty("--font-mono-color", typography.monoColor);
    }
  }, [typography, storeTypography]);

  return null;
}
