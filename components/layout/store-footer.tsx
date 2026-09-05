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


  const renderCleanCorporate = () => (
    <>
      <div className={`${contentClass} py-16`}>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-8">
          {/* Brand & Newsletter Column */}
          <div className="md:col-span-4 flex flex-col gap-6">
            {brandNode}
            {nlConfig.enabled && (
              <div className="mt-4">
                <h4 className="text-sm font-semibold mb-2">{nlConfig.title}</h4>
                <p className="text-sm text-muted-foreground mb-4">{nlConfig.subtitle}</p>
                <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
                  <input
                    type="email"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    placeholder={nlConfig.placeholder}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    required
                  />
                  <button type="submit" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2">
                    {nlConfig.buttonText}
                  </button>
                </form>
                {newsletterSubscribed && <p className="text-xs text-green-600 mt-2">{nlConfig.successMessage}</p>}
              </div>
            )}
            <div className="mt-2">
              {socialNode}
            </div>
          </div>
          {/* Link Columns */}
          <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-8">
            {finalColumns.slice(0, 4).map((col, idx) => (
              <div key={idx}>
                <h4 className="font-semibold text-sm mb-4">{col.title}</h4>
                <ul className="space-y-3">
                  {col.links.map((link, lIdx) => (
                    <li key={lIdx}>
                      <Link href={link.href} target={link.target} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
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

  const renderElegantSerif = () => (
    <>
      <div className={`${contentClass} py-20 bg-[#faf9f8] dark:bg-zinc-950`}>
        <div className="flex flex-col items-center text-center max-w-2xl mx-auto mb-16">
          {brandNode}
          {nlConfig.enabled && (
            <div className="w-full mt-10">
              <h4 className="font-serif text-2xl mb-3">{nlConfig.title}</h4>
              <p className="text-muted-foreground mb-6 font-serif">{nlConfig.subtitle}</p>
              <form onSubmit={handleNewsletterSubmit} className="flex max-w-sm mx-auto border-b border-zinc-300 dark:border-zinc-700 pb-2">
                <input
                  type="email"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder={nlConfig.placeholder}
                  className="w-full bg-transparent border-none outline-none focus:ring-0 text-center font-serif placeholder:text-zinc-400"
                  required
                />
                <button type="submit" className="text-sm font-semibold tracking-wider uppercase text-zinc-900 dark:text-zinc-100 hover:text-primary transition-colors">
                  {nlConfig.buttonText}
                </button>
              </form>
              {newsletterSubscribed && <p className="text-sm text-green-600 mt-3 font-serif">{nlConfig.successMessage}</p>}
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16 max-w-4xl mx-auto">
          {finalColumns.slice(0, 4).map((col, idx) => (
            <div key={idx} className="text-center">
              <h4 className="font-serif text-sm tracking-widest uppercase mb-6">{col.title}</h4>
              <ul className="space-y-4">
                {col.links.map((link, lIdx) => (
                  <li key={lIdx}>
                    <Link href={link.href} target={link.target} className="text-sm text-muted-foreground hover:text-foreground transition-colors font-serif">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="flex justify-center mb-10">
          {socialNode}
        </div>
      </div>
      {renderBottomBar()}
    </>
  );

  const renderBoldMinimalist = () => (
    <>
      <div className="border-y border-border">
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
          {/* Left: Newsletter & Brand */}
          <div className="p-8 md:p-16 lg:p-24 flex flex-col justify-between min-h-[400px]">
            {nlConfig.enabled && (
              <div>
                <h2 className="text-4xl md:text-5xl lg:text-7xl font-bold uppercase tracking-tighter mb-4">
                  {nlConfig.title}
                </h2>
                <form onSubmit={handleNewsletterSubmit} className="mt-8 flex items-end gap-4">
                  <div className="flex-1 border-b-2 border-foreground pb-2">
                    <input
                      type="email"
                      value={newsletterEmail}
                      onChange={(e) => setNewsletterEmail(e.target.value)}
                      placeholder={nlConfig.placeholder}
                      className="w-full bg-transparent text-xl md:text-2xl outline-none placeholder:text-muted-foreground font-medium"
                      required
                    />
                  </div>
                  <button type="submit" className="h-12 w-12 md:h-16 md:w-16 rounded-full bg-foreground text-background flex items-center justify-center hover:scale-105 transition-transform">
                    <ArrowUpRight className="h-6 w-6 md:h-8 md:w-8" />
                  </button>
                </form>
                {newsletterSubscribed && <p className="text-sm text-green-600 mt-4">{nlConfig.successMessage}</p>}
              </div>
            )}
            <div className="mt-16 md:mt-24">
              {brandNode}
            </div>
          </div>
          {/* Right: Links */}
          <div className="p-8 md:p-16 lg:p-24 grid grid-cols-2 gap-12">
            {finalColumns.slice(0, 4).map((col, idx) => (
              <div key={idx}>
                <h4 className="text-lg font-bold mb-6">{col.title}</h4>
                <ul className="space-y-4">
                  {col.links.map((link, lIdx) => (
                    <li key={lIdx}>
                      <Link href={link.href} target={link.target} className="text-lg text-muted-foreground hover:text-foreground transition-colors font-medium">
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
      <div className={`${contentClass} py-6 flex flex-col md:flex-row justify-between items-center gap-4`}>
        {renderBottomBar()}
        {socialNode}
      </div>
    </>
  );

  const renderEcommercePro = () => (
    <>
      <div className="bg-muted/10 border-y border-border">
        <div className={`${contentClass} py-8 md:py-12`}>
          {/* Top highlight bar */}
          {nlConfig.enabled && (
            <div className="bg-background border border-border p-6 rounded-xl shadow-sm mb-12 flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h4 className="font-semibold text-lg">{nlConfig.title}</h4>
                <p className="text-sm text-muted-foreground">{nlConfig.subtitle}</p>
              </div>
              <form onSubmit={handleNewsletterSubmit} className="flex w-full md:w-auto gap-2">
                <input
                  type="email"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder={nlConfig.placeholder}
                  className="flex h-10 w-full md:w-[300px] rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  required
                />
                <button type="submit" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-primary text-primary-foreground shadow hover:bg-primary/90 h-10 px-4 py-2 shrink-0">
                  {nlConfig.buttonText}
                </button>
              </form>
            </div>
          )}
          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-3 flex flex-col gap-6">
              {brandNode}
            </div>
            <div className="lg:col-span-9 grid grid-cols-2 md:grid-cols-4 gap-8">
              {finalColumns.slice(0, 4).map((col, idx) => (
                <div key={idx}>
                  <h4 className="font-semibold text-sm uppercase tracking-wider mb-4">{col.title}</h4>
                  <ul className="space-y-3">
                    {col.links.map((link, lIdx) => (
                      <li key={lIdx}>
                        <Link href={link.href} target={link.target} className="text-sm text-muted-foreground hover:text-primary transition-colors">
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
      </div>
      <div className={`${contentClass} py-8 flex flex-col lg:flex-row justify-between items-center gap-6`}>
        <div className="flex items-center gap-6">
          {socialNode}
        </div>
        <div className="w-full lg:w-auto">
          {renderBottomBar()}
        </div>
      </div>
    </>
  );

  const renderTechStartup = () => (
    <>
      <div className={`${contentClass} py-16 lg:py-24`}>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-8">
          <div className="lg:col-span-2 flex flex-col gap-8">
            {brandNode}
            {nlConfig.enabled && (
              <div className="max-w-md mt-4">
                <p className="text-sm font-medium mb-3">{nlConfig.title}</p>
                <form onSubmit={handleNewsletterSubmit} className="relative">
                  <input
                    type="email"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    placeholder={nlConfig.placeholder}
                    className="w-full h-11 bg-muted/30 border border-border rounded-lg pl-4 pr-32 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    required
                  />
                  <button type="submit" className="absolute right-1.5 top-1.5 bottom-1.5 px-4 bg-foreground text-background text-xs font-semibold rounded-md hover:bg-foreground/90 transition-colors">
                    {nlConfig.buttonText}
                  </button>
                </form>
                {newsletterSubscribed && <p className="text-xs text-green-600 mt-2">{nlConfig.successMessage}</p>}
              </div>
            )}
          </div>
          <div className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-3 gap-8">
            {finalColumns.slice(0, 3).map((col, idx) => (
              <div key={idx}>
                <h4 className="font-medium text-sm mb-5 text-foreground/80">{col.title}</h4>
                <ul className="space-y-3.5">
                  {col.links.map((link, lIdx) => (
                    <li key={lIdx}>
                      <Link href={link.href} target={link.target} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
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
      <div className="border-t border-border">
        <div className={`${contentClass} py-6 flex flex-col-reverse md:flex-row justify-between items-center gap-4 text-muted-foreground`}>
          {renderBottomBar()}
          {socialNode}
        </div>
      </div>
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
      {footerStyleType === "clean-corporate" && renderCleanCorporate()}
        {footerStyleType === "elegant-serif" && renderElegantSerif()}
        {footerStyleType === "bold-minimalist" && renderBoldMinimalist()}
        {footerStyleType === "ecommerce-pro" && renderEcommercePro()}
        {footerStyleType === "tech-startup" && renderTechStartup()}
    </footer>
  );
}
