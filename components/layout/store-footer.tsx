"use client";

import { useState, type CSSProperties } from "react";
import {
  ChevronUp,
  Facebook,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  Store,
  Twitter,
  Youtube,
  Sparkles,
  ShieldCheck,
  Terminal,
  Check,
  Radio,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { appConfig } from "@/config/app.config";
import { type Locale } from "@/config/i18n.config";
import { Separator } from "@/components/ui/separator";
import { AppImage } from "@/components/ui/app-image";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAppTheme } from "@/providers/theme-provider";
import { useAppSettings } from "@/providers/app-settings-provider";
import {
  resolveFooterContactDetails,
  type FooterSettings,
} from "@/lib/footer-config";

interface FooterColumn {
  title: string;
  links: { label: string; href: string; target?: string }[];
}

interface StoreFooterProps {
  locale: Locale;
  columns?: FooterColumn[];
  footerSettings?: FooterSettings;
}

const TikTokIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43V9.84a8.16 8.16 0 0 0 4.77 1.52V8.07a4.85 4.85 0 0 1-1.84-1.38z" />
  </svg>
);

export function StoreFooter({ locale, columns, footerSettings }: StoreFooterProps) {
  const t = useTranslations();
  const {
    storeName,
    storeDescription,
    storeEmail,
    storePhone,
    storeAddress,
    logoUrl,
    darkModeLogoUrl,
    socialLinks,
  } = useAppSettings();
  const { isDark } = useAppTheme();

  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);

  const nlConfig = footerSettings?.newsletter ?? {
    enabled: true,
    title: "Stay Ahead with Eighty7 Nexus",
    subtitle: "Subscribe to receive private sale drops, exclusive collections, and VIP updates.",
    placeholder: "Enter your email address...",
    buttonText: "Subscribe",
    successMessage: "Thank you for subscribing to Eighty7 Nexus!",
    discountBadge: "WELCOME10 - 10% OFF",
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail || !newsletterEmail.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }
    setNewsletterSubscribed(true);
    toast.success(nlConfig.successMessage || "Thank you for subscribing to Eighty7 Nexus!");
  };

  const resolvedStoreName =
    typeof storeName === "string" && storeName.trim()
      ? storeName
      : appConfig.name;
  const resolvedDescription =
    typeof storeDescription === "string" && storeDescription.trim()
      ? storeDescription
      : appConfig.description;
  const footerLogoUrl = footerSettings?.brand.logoUrl?.trim() || "";
  const footerLogoAlt = footerSettings?.brand.logoAlt?.trim() || "";
  const footerDescription = footerSettings?.brand.description?.trim() || "";
  const currentLogoUrl = footerLogoUrl
    ? footerLogoUrl
    : isDark && typeof darkModeLogoUrl === "string" && darkModeLogoUrl.trim()
      ? darkModeLogoUrl
      : typeof logoUrl === "string" && logoUrl.trim()
        ? logoUrl
        : "";
  const resolvedFooterDescription = footerDescription || resolvedDescription;
  const resolvedContact = footerSettings
    ? resolveFooterContactDetails(footerSettings.contact, {
        phone: storePhone || "",
        email: storeEmail || "",
        address: storeAddress || "",
      })
    : {
        phone: storePhone?.trim() || "",
        email: storeEmail?.trim() || "",
        address: storeAddress?.trim() || "",
      };
  const activeColors = isDark
    ? footerSettings?.colors.dark
    : footerSettings?.colors.light;
  const footerStyle = activeColors
    ? ({
        "--footer-bg": activeColors.backgroundColor,
        "--footer-text": activeColors.textColor,
        "--footer-muted": activeColors.mutedTextColor,
        "--footer-border": activeColors.borderColor,
        "--footer-accent": activeColors.accentColor,
      } as CSSProperties)
    : undefined;
  const contentClass = footerSettings?.layout?.fullWidth ? "container-fluid px-4 md:px-8 max-w-none" : "container";
  const showLogo = footerSettings?.widgets.showLogo ?? true;
  const showDescription = footerSettings?.widgets.showDescription ?? true;
  const showContact = footerSettings?.widgets.showContact ?? true;
  const showSocialLinks = footerSettings?.widgets.showSocialLinks ?? true;
  const showLinkColumns = footerSettings?.widgets.showLinkColumns ?? true;
  const showCopyright = footerSettings?.widgets.showCopyright ?? true;
  const showPaymentMethods = footerSettings?.widgets.showPaymentMethods ?? true;

  const resolveHref = (raw: string) => {
    if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
    if (raw.startsWith("/")) {
      return raw.startsWith(`/${locale}`) ? raw : `/${locale}${raw}`;
    }
    return `/${locale}/${raw}`;
  };

  const fallbackShop: FooterColumn = {
    title: t("common.products"),
    links: [
      { label: t("nav.products"), href: `/${locale}/products` },
      { label: t("nav.categories"), href: `/${locale}/categories` },
      { label: t("nav.vendors"), href: `/${locale}/vendors` },
      { label: t("nav.deals"), href: `/${locale}/deals` },
      { label: t("nav.newArrivals"), href: `/${locale}/new-arrivals` },
    ],
  };
  const fallbackSupport: FooterColumn = {
    title: t("nav.help"),
    links: [
      { label: "Track Order", href: `/${locale}/track-order` },
      { label: t("nav.faq"), href: `/${locale}/faq` },
      { label: t("footer.shippingInfo"), href: `/${locale}/shipping` },
      { label: t("footer.returns"), href: `/${locale}/returns` },
    ],
  };
  const fallbackCompany: FooterColumn = {
    title: resolvedStoreName,
    links: [
      { label: t("nav.aboutUs"), href: `/${locale}/about` },
      { label: t("footer.careers"), href: `/${locale}/careers` },
      { label: t("footer.press"), href: `/${locale}/press` },
      { label: t("footer.blog"), href: `/${locale}/blog` },
    ],
  };
  const fallbackLegal: FooterColumn = {
    title: "Legal",
    links: [
      { label: t("footer.termsOfService"), href: `/${locale}/terms` },
      { label: t("footer.privacyPolicy"), href: `/${locale}/privacy` },
      { label: t("footer.cookiePolicy"), href: `/${locale}/cookies` },
      { label: t("footer.accessibility"), href: `/${locale}/accessibility` },
    ],
  };

  const configuredColumns =
    footerSettings?.linkColumns
      .map((column) => ({
        title: column.title,
        links: column.links
          .filter((link) => link.visible)
          .map((link) => ({
            label: link.label,
            href: resolveHref(link.href),
            target: link.target,
          })),
      }))
      .filter((column) => column.links.length > 0) ?? [];
  const finalColumns = footerSettings
    ? showLinkColumns
      ? configuredColumns
      : []
    : columns && columns.length > 0
      ? columns
      : [fallbackShop, fallbackSupport, fallbackCompany, fallbackLegal];

  const footerSocialLinks = footerSettings?.social.links;
  const socialItems = [
    {
      icon: Facebook,
      href: footerSocialLinks?.facebookUrl || socialLinks.facebookUrl,
      label: "Facebook",
      hoverClass: "hover:text-[#1877F2]",
    },
    {
      icon: Twitter,
      href: footerSocialLinks?.twitterUrl || socialLinks.twitterUrl,
      label: "Twitter",
      hoverClass: "hover:text-[#1DA1F2]",
    },
    {
      icon: Instagram,
      href: footerSocialLinks?.instagramUrl || socialLinks.instagramUrl,
      label: "Instagram",
      hoverClass: "hover:text-[#E4405F]",
    },
    {
      icon: Youtube,
      href: footerSocialLinks?.youtubeUrl || socialLinks.youtubeUrl,
      label: "YouTube",
      hoverClass: "hover:text-[#FF0000]",
    },
    {
      icon: Linkedin,
      href: footerSocialLinks?.linkedinUrl || socialLinks.linkedinUrl,
      label: "LinkedIn",
      hoverClass: "hover:text-[#0A66C2]",
    },
    {
      icon: TikTokIcon,
      href: footerSocialLinks?.tiktokUrl || socialLinks.tiktokUrl,
      label: "TikTok",
      hoverClass: "hover:text-[#000000] dark:hover:text-[#FFFFFF]",
    },
  ].filter((s) => typeof s.href === "string" && s.href.trim().length > 0);
  const paymentMethodIcons: string[] = footerSettings?.paymentMethods.imageUrls ?? [];
  const showPaymentMethodsImage =
    showPaymentMethods &&
    (footerSettings?.paymentMethods.enabled ?? true) &&
    paymentMethodIcons.length > 0;
  const copyrightParts = [
    footerSettings?.copyright.showYear ?? true ? new Date().getFullYear() : null,
    footerSettings?.copyright.showStoreName ?? true ? resolvedStoreName : null,
  ].filter(Boolean);
  const copyrightText =
    footerSettings?.copyright.text?.trim() || t("common.allRightsReserved");
  const mutedStyle = activeColors
    ? ({ color: "var(--footer-muted)" } as CSSProperties)
    : undefined;
  const headingStyle = activeColors
    ? ({ color: "var(--footer-text)" } as CSSProperties)
    : undefined;

  const footerStyleType = footerSettings?.layout.style || "classic";

  const brandNode = (
    <div className="flex flex-col gap-4">
      {showLogo ? (
        <Link href={`/${locale}`} className="flex items-center gap-2">
          {currentLogoUrl ? (
            <span className="relative block h-8 w-32 overflow-hidden">
              <AppImage
                src={currentLogoUrl}
                alt={footerLogoAlt || resolvedStoreName}
                className="h-8 w-full object-contain object-left"
                width={144}
                height={32}
              />
            </span>
          ) : (
            <>
              <Store
                className="h-6 w-6 text-primary"
                style={
                  activeColors
                    ? ({ color: "var(--footer-accent)" } as CSSProperties)
                    : undefined
                }
              />
              <span className="text-xl font-bold">{resolvedStoreName}</span>
            </>
          )}
        </Link>
      ) : null}
      {showDescription ? (
        <p className="max-w-xs text-sm text-muted-foreground" style={mutedStyle}>
          {resolvedFooterDescription}
        </p>
      ) : null}
      {showContact ? (
        <div className="space-y-2 text-sm text-muted-foreground mt-2" style={mutedStyle}>
          {footerSettings?.contact.title ? (
            <p className="font-semibold" style={headingStyle}>
              {footerSettings.contact.title}
            </p>
          ) : null}
          {resolvedContact.phone &&
          (footerSettings?.contact.showPhone ?? true) ? (
            <a
              href={`tel:${resolvedContact.phone.replace(/\s+/g, "")}`}
              className="flex items-center gap-2 transition-colors hover:text-primary"
            >
              <Phone className="h-4 w-4" />
              <span>{resolvedContact.phone}</span>
            </a>
          ) : null}
          {resolvedContact.email &&
          (footerSettings?.contact.showEmail ?? true) ? (
            <a
              href={`mailto:${resolvedContact.email}`}
              className="flex items-center gap-2 transition-colors hover:text-primary"
            >
              <Mail className="h-4 w-4" />
              <span>{resolvedContact.email}</span>
            </a>
          ) : null}
          {resolvedContact.address &&
          (footerSettings?.contact.showAddress ?? true) ? (
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{resolvedContact.address}</span>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );

  const copyrightNode = showCopyright ? (
    <div className="flex flex-col space-y-1">
      <p className="text-sm text-muted-foreground" style={mutedStyle}>
        {"\u00a9"} {copyrightParts.join(" ")}
        {copyrightParts.length > 0 ? ". " : ""}
        {copyrightText}
      </p>
    </div>
  ) : null;

  const developerCreditNode = footerSettings?.copyright?.developerCredit?.enabled ? (
    <div className="flex flex-col space-y-1">
      <p className="text-sm text-muted-foreground" style={mutedStyle}>
        Developed by{" "}
        <a
          href={footerSettings.copyright.developerCredit.link}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline transition-colors hover:text-primary"
          style={headingStyle}
        >
          {footerSettings.copyright.developerCredit.text}
        </a>
      </p>
    </div>
  ) : null;

  const paymentNode = showPaymentMethodsImage ? (
    <div className="flex flex-wrap items-center gap-2">
      {paymentMethodIcons.map((iconUrl, i) => (
        <AppImage
          key={i}
          src={iconUrl}
          alt={footerSettings?.paymentMethods.imageAlt || "Payment"}
          width={46}
          height={30}
          className="h-7 w-auto rounded-md border border-border/40 bg-white object-contain px-1 py-0.5 shadow-sm"
        />
      ))}
    </div>
  ) : null;

  const socialNode = showSocialLinks && socialItems.length > 0 ? (
    <div className="flex items-center gap-4">
      {socialItems.map((social) => (
        <a
          key={social.label}
          href={social.href}
          target="_blank"
          rel="noopener noreferrer"
          className={`text-muted-foreground transition-all duration-300 hover:-translate-y-1 hover:scale-110 ${social.hoverClass}`}
          style={mutedStyle}
          aria-label={social.label}
        >
          <social.icon className="h-5 w-5" />
        </a>
      ))}
    </div>
  ) : null;

  const renderBlock = (blockType: string) => {
    switch (blockType) {
      case "copyright": return copyrightNode;
      case "developer_credit": return developerCreditNode;
      case "payment_methods": return paymentNode;
      case "social_icons": return socialNode;
      case "brand_info": return brandNode;
      default: return null;
    }
  };

  const renderBottomBar = () => {
    const bottomBar = footerSettings?.bottomBar;
    if (!bottomBar || !bottomBar.enabled || bottomBar.columns.length === 0) {
      return null;
    }

    return (
      <>
        <Separator style={{ backgroundColor: activeColors ? "var(--footer-border)" : undefined }} />
        <div className={`${contentClass} py-6`}>
          <div className={`grid gap-6 items-center w-full`} style={{ gridTemplateColumns: `repeat(${bottomBar.columns.length}, minmax(0, 1fr))` }}>
            {bottomBar.columns.map((col, idx) => (
              <div 
                key={col.id || idx} 
                className={cn(
                  "flex flex-col gap-4",
                  col.alignment === "left" ? "items-start md:items-start text-left" :
                  col.alignment === "right" ? "items-center md:items-end text-center md:text-right" :
                  "items-center text-center",
                  // if there are multiple columns, on mobile they should stack centered, on desktop align properly
                  bottomBar.columns.length > 1 && "max-md:items-center max-md:text-center"
                )}
              >
                {col.blocks.map((block) => (
                  <div key={block.id}>
                    {renderBlock(block.type)}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </>
    );
  };

  const renderClassic = () => (
    <>
      <div className={`${contentClass} py-12`}>
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-6">
          <div className="col-span-2">{brandNode}</div>
          {finalColumns.map((column, idx) => (
            <div key={`${column.title}-${idx}`}>
              <h4 className="mb-4 font-semibold" style={headingStyle}>
                {column.title}
              </h4>
              <ul className="space-y-2">
                {column.links.map((link, linkIdx) => (
                  <li key={`${link.href}-${linkIdx}`}>
                    <Link
                      href={link.href}
                      target={link.target}
                      rel={link.target === "_blank" ? "noopener noreferrer" : undefined}
                      className="text-sm text-muted-foreground transition-colors hover:text-primary"
                      style={mutedStyle}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      {renderBottomBar()}
    </>
  );

  const renderCentered = () => (
    <>
      <div className={`${contentClass} py-12 flex flex-col items-center text-center`}>
        <div className="max-w-xl mx-auto flex flex-col items-center gap-6 mb-12">
          {showLogo ? (
            <Link href={`/${locale}`} className="flex items-center gap-2">
              {currentLogoUrl ? (
                <span className="relative block h-10 w-40 overflow-hidden">
                  <AppImage
                    src={currentLogoUrl}
                    alt={footerLogoAlt || resolvedStoreName}
                    className="h-10 w-full object-contain object-center"
                    width={160}
                    height={40}
                  />
                </span>
              ) : (
                <>
                  <Store
                    className="h-8 w-8 text-primary"
                    style={
                      activeColors
                        ? ({ color: "var(--footer-accent)" } as CSSProperties)
                        : undefined
                    }
                  />
                  <span className="text-2xl font-bold">{resolvedStoreName}</span>
                </>
              )}
            </Link>
          ) : null}
          {showDescription ? (
            <p className="text-sm text-muted-foreground" style={mutedStyle}>
              {resolvedFooterDescription}
            </p>
          ) : null}
          {showContact ? (
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground" style={mutedStyle}>
              {resolvedContact.phone && (footerSettings?.contact.showPhone ?? true) ? (
                <a href={`tel:${resolvedContact.phone.replace(/\s+/g, "")}`} className="flex items-center gap-2 transition-colors hover:text-primary">
                  <Phone className="h-4 w-4" />
                  <span>{resolvedContact.phone}</span>
                </a>
              ) : null}
              {resolvedContact.email && (footerSettings?.contact.showEmail ?? true) ? (
                <a href={`mailto:${resolvedContact.email}`} className="flex items-center gap-2 transition-colors hover:text-primary">
                  <Mail className="h-4 w-4" />
                  <span>{resolvedContact.email}</span>
                </a>
              ) : null}
            </div>
          ) : null}
        </div>
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 w-full">
          {finalColumns.slice(0, 4).map((column, idx) => (
            <div key={`${column.title}-${idx}`}>
              <h4 className="mb-4 font-semibold" style={headingStyle}>
                {column.title}
              </h4>
              <ul className="space-y-2">
                {column.links.map((link, linkIdx) => (
                  <li key={`${link.href}-${linkIdx}`}>
                    <Link href={link.href} target={link.target} className="text-sm text-muted-foreground transition-colors hover:text-primary" style={mutedStyle}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      {renderBottomBar()}
    </>
  );

  const renderMinimal = () => (
    <>
      <div className={`${contentClass} py-8`}>
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6 flex-wrap justify-center md:justify-start">
            {showLogo ? (
              <Link href={`/${locale}`} className="flex items-center gap-2 mr-4">
                {currentLogoUrl ? (
                  <span className="relative block h-7 w-28 overflow-hidden">
                    <AppImage src={currentLogoUrl} alt={footerLogoAlt || resolvedStoreName} className="h-7 w-full object-contain object-left" width={112} height={28} />
                  </span>
                ) : (
                  <span className="text-lg font-bold">{resolvedStoreName}</span>
                )}
              </Link>
            ) : null}
          </div>
        </div>
      </div>
      {renderBottomBar()}
    </>
  );

  const renderColumns = () => (
    <>
      <div className={`${contentClass} py-12`}>
        <div className="grid grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-5">
          {finalColumns.slice(0, 5).map((column, idx) => (
            <div key={`${column.title}-${idx}`}>
              <h4 className="mb-4 font-semibold" style={headingStyle}>
                {column.title}
              </h4>
              <ul className="space-y-2">
                {column.links.map((link, linkIdx) => (
                  <li key={`${link.href}-${linkIdx}`}>
                    <Link href={link.href} target={link.target} className="text-sm text-muted-foreground transition-colors hover:text-primary" style={mutedStyle}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      {renderBottomBar()}
    </>
  );

  const renderGrid = () => (
    <>
      <div className={`${contentClass} py-12`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="flex flex-col gap-6">{brandNode}</div>
          {finalColumns.slice(0, 3).map((column, idx) => (
            <div key={`${column.title}-${idx}`}>
              <h4 className="mb-4 font-semibold" style={headingStyle}>
                {column.title}
              </h4>
              <ul className="space-y-2">
                {column.links.map((link, linkIdx) => (
                  <li key={`${link.href}-${linkIdx}`}>
                    <Link href={link.href} target={link.target} className="text-sm text-muted-foreground transition-colors hover:text-primary" style={mutedStyle}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      {renderBottomBar()}
    </>
  );

  const renderSplit = () => (
    <div className={`${contentClass} py-12 flex flex-col lg:flex-row gap-12`}>
      <div className="lg:w-1/3 flex flex-col gap-8">
        {brandNode}
        {socialNode}
      </div>
      <div className="lg:w-2/3 grid grid-cols-2 md:grid-cols-3 gap-8">
        {finalColumns.slice(0, 3).map((column, idx) => (
          <div key={`${column.title}-${idx}`}>
            <h4 className="mb-4 font-semibold" style={headingStyle}>{column.title}</h4>
            <ul className="space-y-2">
              {column.links.map((link, linkIdx) => (
                <li key={`${link.href}-${linkIdx}`}>
                  <Link href={link.href} target={link.target} className="text-sm text-muted-foreground transition-colors hover:text-primary" style={mutedStyle}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      {renderBottomBar()}
    </div>
  );

  const renderCompact = () => (
    <>
      <div className={`${contentClass} py-8`}>
        <div className="flex flex-col items-center gap-6">
          <div className="max-w-xs">{brandNode}</div>
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            {finalColumns.flatMap(c => c.links).slice(0, 8).map((link, idx) => (
              <Link key={idx} href={link.href} target={link.target} className="hover:text-primary transition-colors text-muted-foreground" style={mutedStyle}>
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
      {renderBottomBar()}
    </>
  );

  const renderMega = () => (
    <>
      <div className={`${contentClass} py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8`}>
        <div className="lg:col-span-4 flex flex-col gap-6 pr-8">
          {brandNode}
          {socialNode}
        </div>
        <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-8">
          {finalColumns.slice(0, 4).map((column, idx) => (
            <div key={`${column.title}-${idx}`}>
              <h4 className="mb-6 font-bold uppercase tracking-wider text-xs" style={headingStyle}>{column.title}</h4>
              <ul className="space-y-3">
                {column.links.map((link, linkIdx) => (
                  <li key={`${link.href}-${linkIdx}`}>
                    <Link href={link.href} target={link.target} className="text-sm text-muted-foreground transition-colors hover:text-primary" style={mutedStyle}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      {renderBottomBar()}
    </>
  );


  const renderModernCard = () => (
    <>
      <div className={`${contentClass} py-12`}>
        <div className="rounded-2xl border bg-card/60 backdrop-blur-md p-8 md:p-10 shadow-xl border-border/80">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            <div className="md:col-span-4 flex flex-col gap-6">
              {brandNode}
              {socialNode}
            </div>
            <div className="md:col-span-8 grid grid-cols-2 md:grid-cols-3 gap-8">
              {finalColumns.slice(0, 3).map((column, idx) => (
                <div key={`${column.title}-${idx}`}>
                  <h4 className="mb-4 font-bold text-sm" style={headingStyle}>{column.title}</h4>
                  <ul className="space-y-2.5">
                    {column.links.map((link, linkIdx) => (
                      <li key={`${link.href}-${linkIdx}`}>
                        <Link href={link.href} target={link.target} className="text-sm text-muted-foreground transition-colors hover:text-primary" style={mutedStyle}>{link.label}</Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {renderBottomBar()}
    </>
  );

  const renderNewsletterHero = () => (
    <>
      {/* Top Newsletter Hero Banner */}
      {nlConfig.enabled && (
        <div className="border-b bg-primary/5 py-10 px-4">
          <div className={`${contentClass} flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left`}>
            <div>
              <div className="flex items-center gap-2 justify-center md:justify-start mb-1">
                <h3 className="text-2xl font-bold tracking-tight" style={headingStyle}>
                  {nlConfig.title}
                </h3>
                {nlConfig.discountBadge && (
                  <span className="inline-flex items-center rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-xs font-semibold text-primary">
                    {nlConfig.discountBadge}
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground" style={mutedStyle}>
                {nlConfig.subtitle}
              </p>
            </div>
            <form onSubmit={handleNewsletterSubmit} className="flex w-full max-w-md items-center gap-2">
              {newsletterSubscribed ? (
                <div className="flex items-center gap-2 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-4 py-2.5 text-sm font-semibold text-emerald-600 dark:text-emerald-400 w-full">
                  <Check className="h-4 w-4 shrink-0" />
                  <span>{nlConfig.successMessage}</span>
                </div>
              ) : (
                <>
                  <input
                    type="email"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    placeholder={nlConfig.placeholder}
                    className="h-10 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                  <button
                    type="submit"
                    className="h-10 px-5 rounded-md bg-primary text-primary-foreground font-medium text-sm shadow-xs hover:bg-primary/90 transition-colors shrink-0"
                  >
                    {nlConfig.buttonText}
                  </button>
                </>
              )}
            </form>
          </div>
        </div>
      )}

      <div className={`${contentClass} py-12`}>
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-6">
          <div className="col-span-2">{brandNode}</div>
          {finalColumns.map((column, idx) => (
            <div key={`${column.title}-${idx}`}>
              <h4 className="mb-4 font-semibold text-sm" style={headingStyle}>
                {column.title}
              </h4>
              <ul className="space-y-2">
                {column.links.map((link, linkIdx) => (
                  <li key={`${link.href}-${linkIdx}`}>
                    <Link
                      href={link.href}
                      target={link.target}
                      className="text-sm text-muted-foreground transition-colors hover:text-primary"
                      style={mutedStyle}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      {renderBottomBar()}
    </>
  );

  const renderNexusFlagship = () => (
    <>
      <div 
        className="relative overflow-hidden py-16 text-white border-t border-[#77CDCC]/30"
        style={{
          background: "linear-gradient(145deg, #001a45 0%, #172554 45%, #001a45 100%)",
        }}
      >
        {/* Ambient Cyan Aura */}
        <div className="absolute -top-24 right-10 h-96 w-96 rounded-full bg-[#77CDCC]/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 left-10 h-96 w-96 rounded-full bg-[#324071]/40 blur-3xl pointer-events-none" />

        <div className={`${contentClass} relative z-10 space-y-12`}>
          {/* Top Tier: Brand Manifesto & VIP Newsletter Card */}
          {nlConfig.enabled && (
            <div className="rounded-2xl border border-[#77CDCC]/30 bg-white/5 backdrop-blur-md p-6 sm:p-8 shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-8">
              <div className="max-w-xl text-center lg:text-left space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#77CDCC]/40 bg-[#77CDCC]/10 px-3 py-1 text-xs font-semibold text-[#77CDCC]">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>{nlConfig.discountBadge || "EXCLUSIVE VIP ACCESS"}</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                  {nlConfig.title}
                </h3>
                <p className="text-sm text-white/70 leading-relaxed">
                  {nlConfig.subtitle}
                </p>
              </div>

              <form onSubmit={handleNewsletterSubmit} className="w-full max-w-md">
                {newsletterSubscribed ? (
                  <div className="flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/20 px-4 py-3 text-sm font-semibold text-emerald-300">
                    <Check className="h-4 w-4" />
                    <span>{nlConfig.successMessage}</span>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="email"
                      value={newsletterEmail}
                      onChange={(e) => setNewsletterEmail(e.target.value)}
                      placeholder={nlConfig.placeholder}
                      className="h-11 flex-1 rounded-xl border border-white/20 bg-white/10 px-4 text-sm text-white placeholder:text-white/40 focus:border-[#77CDCC] focus:outline-none focus:ring-2 focus:ring-[#77CDCC]/40 backdrop-blur-xs"
                      required
                    />
                    <button
                      type="submit"
                      className="h-11 px-6 rounded-xl bg-[#77CDCC] font-bold text-sm text-[#001a45] shadow-[0_0_15px_rgba(119,205,204,0.4)] hover:bg-[#77CDCC]/90 transition-all active:scale-95 shrink-0"
                    >
                      {nlConfig.buttonText}
                    </button>
                  </div>
                )}
              </form>
            </div>
          )}

          {/* Middle Tier: Catalog Directory & Store Identity */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pt-4">
            <div className="md:col-span-4 space-y-4">
              <div className="flex items-center gap-3">
                {currentLogoUrl ? (
                  <img src={currentLogoUrl} alt={resolvedStoreName} className="h-9 w-auto object-contain brightness-110" />
                ) : (
                  <span className="text-2xl font-black tracking-wider text-white">
                    {resolvedStoreName}
                  </span>
                )}
              </div>
              <p className="text-sm text-white/70 leading-relaxed pr-6">
                {resolvedFooterDescription}
              </p>
              <div className="pt-2">{socialNode}</div>
            </div>

            <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
              {finalColumns.map((col, idx) => (
                <div key={`${col.title}-${idx}`} className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#77CDCC]">
                    {col.title}
                  </h4>
                  <ul className="space-y-2 text-sm">
                    {col.links.map((link, lIdx) => (
                      <li key={`${link.href}-${lIdx}`}>
                        <Link
                          href={link.href}
                          target={link.target}
                          className="text-white/70 hover:text-[#77CDCC] transition-colors inline-flex items-center gap-1.5 group"
                        >
                          <span className="h-1 w-1 rounded-full bg-[#77CDCC]/40 group-hover:bg-[#77CDCC] group-hover:w-2 transition-all" />
                          <span>{link.label}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {renderBottomBar()}
    </>
  );

  const renderNexusCyberGrid = () => (
    <>
      <div className="relative overflow-hidden py-14 bg-[#000d24] text-white border-t border-[#77CDCC]/40 font-mono">
        {/* Subtle grid background */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-10"
          style={{
            backgroundImage: "radial-gradient(#77CDCC 1px, transparent 1px)",
            backgroundSize: "24px 24px"
          }}
        />

        <div className={`${contentClass} relative z-10 space-y-10`}>
          {/* Top HUD Telemetry Strip */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#77CDCC]/20 pb-4 text-xs text-[#77CDCC]">
            <div className="flex items-center gap-3">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              <span>NODE: NEXUS_CORE_V4</span>
              <span className="hidden sm:inline-block text-white/30">|</span>
              <span className="hidden sm:inline-block">{"PROTOCOL: SECURE // TLS 1.3"}</span>
            </div>
            <div className="flex items-center gap-4 text-[11px] text-white/60">
              <span>LATENCY: 14MS</span>
              <span>UPTIME: 99.98%</span>
            </div>
          </div>

          {/* Cyber Newsletter Terminal */}
          {nlConfig.enabled && (
            <div className="rounded-xl border border-[#77CDCC]/30 bg-black/40 p-5 backdrop-blur-md shadow-[0_0_25px_rgba(119,205,204,0.1)]">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-[#77CDCC]">
                    <Terminal className="h-4 w-4" />
                    <span>{"SYS_BROADCAST // NEWSLETTER_DAEMON"}</span>
                  </div>
                  <h3 className="text-lg font-bold text-white tracking-wide">
                    {nlConfig.title}
                  </h3>
                  <p className="text-xs text-white/60">
                    {nlConfig.subtitle}
                  </p>
                </div>

                <form onSubmit={handleNewsletterSubmit} className="w-full max-w-md">
                  {newsletterSubscribed ? (
                    <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-2.5 text-xs text-emerald-400">
                      {"\u003e [SUCCESS]: "}{nlConfig.successMessage}
                    </div>
                  ) : (
                    <div className="flex rounded-lg border border-[#77CDCC]/40 bg-[#001a45]/60 overflow-hidden focus-within:ring-2 focus-within:ring-[#77CDCC]/50">
                      <span className="flex items-center px-3 text-xs text-[#77CDCC] font-bold select-none border-r border-[#77CDCC]/30 bg-black/30">
                        {"$\u003e"}
                      </span>
                      <input
                        type="email"
                        value={newsletterEmail}
                        onChange={(e) => setNewsletterEmail(e.target.value)}
                        placeholder={nlConfig.placeholder}
                        className="h-10 flex-1 bg-transparent px-3 text-xs text-white placeholder:text-white/30 focus:outline-none"
                        required
                      />
                      <button
                        type="submit"
                        className="h-10 px-4 bg-[#77CDCC] text-[#000d24] text-xs font-bold uppercase tracking-wider hover:bg-[#77CDCC]/90 transition-all shrink-0"
                      >
                        {nlConfig.buttonText}
                      </button>
                    </div>
                  )}
                </form>
              </div>
            </div>
          )}

          {/* Cyber Navigation Columns */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 pt-2">
            <div className="col-span-2 lg:col-span-2 space-y-4">
              <span className="text-xl font-bold tracking-tight text-[#77CDCC] flex items-center gap-2">
                <Terminal className="h-5 w-5" />
                {resolvedStoreName}
              </span>
              <p className="text-xs text-white/60 leading-relaxed max-w-md font-sans">
                {resolvedFooterDescription}
              </p>
              <div className="pt-2">{socialNode}</div>
            </div>

            {finalColumns.map((col, idx) => (
              <div key={`${col.title}-${idx}`} className="space-y-3">
                <h4 className="text-xs font-bold uppercase text-[#77CDCC] border-b border-[#77CDCC]/20 pb-1">
                  {"// "}{col.title}
                </h4>
                <ul className="space-y-2 text-xs">
                  {col.links.map((link, lIdx) => (
                    <li key={`${link.href}-${lIdx}`}>
                      <Link
                        href={link.href}
                        target={link.target}
                        className="text-white/70 hover:text-[#77CDCC] transition-colors flex items-center gap-1.5"
                      >
                        <span className="text-[#77CDCC]/40">&gt;</span>
                        <span>{link.label}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
      {renderBottomBar()}
    </>
  );

  const renderNexusEditorialMinimal = () => (
    <>
      <div className="relative py-16 border-t border-border/80 bg-background text-foreground font-serif">
        <div className={`${contentClass} space-y-12`}>
          {/* Editorial Top Masthead */}
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 border-b border-border/60 pb-8">
            <div className="space-y-2 max-w-lg">
              <span className="text-[11px] font-sans font-semibold uppercase tracking-[0.25em] text-primary">
                THE ARCHIVE COLLECTION
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                {resolvedStoreName}
              </h2>
              <p className="text-sm font-sans text-muted-foreground leading-relaxed">
                {resolvedFooterDescription}
              </p>
            </div>

            {/* Understated Editorial Newsletter Invite */}
            {nlConfig.enabled && (
              <div className="w-full max-w-md space-y-2 font-sans">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span>{nlConfig.title}</span>
                  {nlConfig.discountBadge && (
                    <span className="text-[10px] font-bold text-primary">{nlConfig.discountBadge}</span>
                  )}
                </div>
                <form onSubmit={handleNewsletterSubmit}>
                  {newsletterSubscribed ? (
                    <div className="text-xs font-medium text-emerald-600 dark:text-emerald-400 py-2">
                      ✓ {nlConfig.successMessage}
                    </div>
                  ) : (
                    <div className="flex items-center border-b border-foreground/40 pb-1.5 focus-within:border-primary transition-colors">
                      <input
                        type="email"
                        value={newsletterEmail}
                        onChange={(e) => setNewsletterEmail(e.target.value)}
                        placeholder={nlConfig.placeholder}
                        className="w-full bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none"
                        required
                      />
                      <button
                        type="submit"
                        className="ml-2 p-1 text-foreground hover:text-primary transition-colors shrink-0"
                        title={nlConfig.buttonText}
                      >
                        <ArrowUpRight className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </form>
              </div>
            )}
          </div>

          {/* Directory Links Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-8 font-sans">
            <div className="col-span-2 sm:col-span-1 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                Follow Along
              </h4>
              <div className="pt-1">{socialNode}</div>
            </div>

            {finalColumns.map((col, idx) => (
              <div key={`${col.title}-${idx}`} className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  {col.title}
                </h4>
                <ul className="space-y-2 text-sm">
                  {col.links.map((link, lIdx) => (
                    <li key={`${link.href}-${lIdx}`}>
                      <Link
                        href={link.href}
                        target={link.target}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
      {renderBottomBar()}
    </>
  );

  const renderGlassmorphicDock = () => (
    <>
      <div className={`${contentClass} py-14`}>
        <div 
          className="rounded-3xl border border-white/20 p-8 md:p-12 shadow-2xl relative overflow-hidden backdrop-blur-xl"
          style={{
            background: isDark
              ? "linear-gradient(135deg, rgba(30, 27, 75, 0.7) 0%, rgba(49, 46, 129, 0.6) 50%, rgba(76, 29, 149, 0.5) 100%)"
              : "linear-gradient(135deg, rgba(243, 232, 255, 0.7) 0%, rgba(224, 231, 255, 0.6) 50%, rgba(253, 242, 248, 0.7) 100%)"
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            <div className="md:col-span-5 flex flex-col gap-6">
              {brandNode}
              {socialNode}
            </div>
            <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8">
              {finalColumns.slice(0, 3).map((column, idx) => (
                <div key={`${column.title}-${idx}`}>
                  <h4 className="mb-4 font-bold text-sm" style={headingStyle}>{column.title}</h4>
                  <ul className="space-y-2.5">
                    {column.links.map((link, linkIdx) => (
                      <li key={`${link.href}-${linkIdx}`}>
                        <Link href={link.href} target={link.target} className="text-sm text-muted-foreground transition-colors hover:text-primary" style={mutedStyle}>{link.label}</Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {renderBottomBar()}
    </>
  );

  return (
    <footer
      data-store-chrome="footer"
      className="border-t bg-muted/30 text-foreground relative"
      style={{
        ...footerStyle,
        backgroundColor: activeColors ? "var(--footer-bg)" : undefined,
        color: activeColors ? "var(--footer-text)" : undefined,
        borderColor: activeColors ? "var(--footer-border)" : undefined,
      }}
    >
      {footerStyleType === "classic" && renderClassic()}
      {footerStyleType === "centered" && renderCentered()}
      {footerStyleType === "minimal" && renderMinimal()}
      {footerStyleType === "columns" && renderColumns()}
      {footerStyleType === "grid" && renderGrid()}
      {footerStyleType === "split" && renderSplit()}
      {footerStyleType === "compact" && renderCompact()}
      {footerStyleType === "mega" && renderMega()}
      {footerStyleType === "modern-card" && renderModernCard()}
      {footerStyleType === "newsletter-hero" && renderNewsletterHero()}
      {footerStyleType === "glassmorphic-dock" && renderGlassmorphicDock()}
      {footerStyleType === "nexus-flagship" && renderNexusFlagship()}
      {footerStyleType === "nexus-cyber-grid" && renderNexusCyberGrid()}
      {footerStyleType === "nexus-editorial-minimal" && renderNexusEditorialMinimal()}
    </footer>
  );
}
