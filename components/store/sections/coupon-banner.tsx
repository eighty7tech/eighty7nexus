import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { AppImage } from "@/components/ui/app-image";
import { Button } from "@/components/ui/button";
import { type Locale } from "@/config/i18n.config";
import { CouponCodeButton } from "./coupon-code-button";
import {
  isExternalSectionHref,
  resolveSectionHref,
} from "./section-shell";

interface CouponBannerProps {
  locale: Locale;
  heading: string;
  subheading: string;
  code: string;
  ctaLabel: string;
  href: string;
  imageSrc: string;
}

/**
 * The "GET 20% OFF — use code VIBE20" strip. Displays and copies a code the
 * admin created in Discounts; it does not validate one, so a typo here shows
 * a code checkout will reject — the discount itself stays the source of
 * truth.
 */
export async function CouponBanner({
  locale,
  heading,
  subheading,
  code,
  ctaLabel,
  href,
  imageSrc,
}: CouponBannerProps) {
  if (!heading && !code) return null;

  const [tHome, tCommon] = await Promise.all([
    getTranslations({ locale, namespace: "home" }),
    getTranslations({ locale, namespace: "common" }),
  ]);
  const resolvedHref = href ? resolveSectionHref(locale, href) : "";

  return (
    <section className="py-5 lg:py-8">
      <div className="container mx-auto px-4">
        <div className="relative overflow-hidden rounded-md bg-foreground text-background">
          {imageSrc ? (
            <>
              <AppImage
                src={imageSrc}
                alt=""
                fill
                className="object-cover"
                sizes="(min-width: 1360px) 1328px, 100vw"
              />
              <div className="absolute inset-0 bg-black/60" aria-hidden />
            </>
          ) : null}

          <div className="relative flex flex-col items-start justify-between gap-5 p-6 text-white sm:flex-row sm:items-center sm:p-8">
            <div className="max-w-xl space-y-1.5">
              {heading ? (
                <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  {heading}
                </h2>
              ) : null}
              {subheading ? (
                <p className="text-sm text-white/80 sm:text-base">
                  {subheading}
                </p>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {code ? (
                <CouponCodeButton
                  code={code}
                  copyLabel={tHome("copyCode")}
                  copiedLabel={tCommon("copiedToClipboard")}
                  className="border-white/60 bg-transparent text-white hover:bg-white/10 hover:text-white"
                />
              ) : null}
              {ctaLabel && resolvedHref ? (
                <Button
                  asChild
                  className="h-11 rounded-full bg-white px-6 text-sm font-medium text-black hover:bg-white/90"
                >
                  <Link
                    href={resolvedHref}
                    {...(isExternalSectionHref(href)
                      ? { target: "_blank", rel: "noopener noreferrer" }
                      : {})}
                  >
                    {ctaLabel}
                  </Link>
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
