"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  ArrowRight,
  BadgePercent,
  CalendarClock,
  ChevronDown,
  CircleHelp,
  DollarSign,
  Globe2,
  Grid,
  Home,
  Layers,
  LayoutDashboard,
  LayoutGrid,
  LogIn,
  LogOut,
  MessageCircle,
  Moon,
  MoreHorizontal,
  Package,
  PackageSearch,
  Rss,
  Settings,
  ShoppingBag,
  Store,
  Sun,
  Tags,
  User,
  UserPlus,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  MegaMenuItemVisual,
  getHeaderMenuItemKey,
} from "@/components/layout/store-header/mega-menu";
import type { HeaderMenuItem } from "@/components/layout/store-header";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { AppImage } from "@/components/ui/app-image";
import * as Icons from "lucide-react";

function RecursiveMobileMenuItem({
  item,
  locale,
  closeMobileMenu,
  depth = 0,
}: {
  item: HeaderMenuItem;
  locale: string;
  closeMobileMenu: () => void;
  depth?: number;
}) {
  const Icon = item.icon ? (Icons as any)[item.icon] : null;

  if (item.children && item.children.length > 0) {
    return (
      <MobileNavDisclosure
        icon={Icon || Grid}
        label={item.label}
        className={cn("pt-1", depth > 0 && "pl-4 opacity-90")}
      >
        {item.children.map((child, idx) => (
          <RecursiveMobileMenuItem
            key={`${child.href}-${idx}`}
            item={child}
            locale={locale}
            closeMobileMenu={closeMobileMenu}
            depth={depth + 1}
          />
        ))}
      </MobileNavDisclosure>
    );
  }

  let href = item.href || "/";
  if (href.startsWith("/")) {
    href = `/${locale}${href === "/" ? "" : href}`;
  }

  return (
    <MobileNavRow
      href={href}
      icon={Icon || ArrowRight}
      label={item.label}
      active={false} // Would need path comparison
      onNavigate={closeMobileMenu}
      className={cn(depth > 0 && "pl-6 text-sm opacity-90")}
    />
  );
}

import { buildLoginUrl } from "@/lib/return-path";
import { useAuth } from "@/hooks/use-auth";
import type { ThemeMode } from "@/config/branding.config";
import { useAppTheme } from "@/providers/theme-provider";
import { useCurrency } from "@/providers/currency-provider";
import { useLanguage } from "@/providers/language-provider";
import type {
  CategoryNode,
  CollectionItem,
} from "@/components/layout/store-header/types";

// Hard ceiling on the drawer's category dropdown. The admin-facing
// `categoryMenu.mobileLimit` can be set higher, but a drawer dropdown that
// unfolds into a dozen rows defeats the point of collapsing it — anything past
// this belongs on the categories page behind "View all".
const MOBILE_CATEGORY_LIMIT = 7;

export interface MobileMenuSheetProps {
  locale: string;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  closeMobileMenu: () => void;
  categories: CategoryNode[];
  collections: CollectionItem[];
  brandName: string;
  brandLogoUrl: string;
  showMobileMarketSelectors: boolean;
  showMobileThemeSelector: boolean;
  showMobileCollections: boolean;
  showMobileAccountSummary: boolean;
  showMobileCategoryShortcuts: boolean;
  showLanguageSelector: boolean;
  showCurrencySelector: boolean;
  showCollectionsMenu: boolean;
  showUtilityMenu: boolean;
  showAccountMenu: boolean;
  categoryMenuLabel: string;
  collectionsMenuLabel: string;
  categoriesPageHref: string;
  getDashboardLink: () => string | null;
  getSettingsLink: () => string;
  handleLogout: () => void | Promise<void>;
  handleMobileLanguageChange: (value: string) => void;
  handleThemeChange: (value: ThemeMode) => void;
  menuItems: HeaderMenuItem[] | undefined;
  megaMenuRootItems: HeaderMenuItem[];
  hasCustomMegaMenu: boolean;
  categoryMobileLimit: number;
  collectionsLimit: number;
  megaMenuRootLimit: number;
  mobileMenuItems?: HeaderMenuItem[];
}

export function MobileMenuSheet({
  locale,
  isOpen,
  setIsOpen,
  closeMobileMenu,
  categories,
  collections,
  brandName,
  brandLogoUrl,
  showMobileMarketSelectors,
  showMobileThemeSelector,
  showMobileCollections,
  showMobileAccountSummary,
  showMobileCategoryShortcuts,
  showLanguageSelector,
  showCurrencySelector,
  showCollectionsMenu,
  showUtilityMenu,
  showAccountMenu,
  categoryMenuLabel,
  collectionsMenuLabel,
  categoriesPageHref,
  getDashboardLink,
  getSettingsLink,
  handleLogout,
  handleMobileLanguageChange,
  handleThemeChange,
  menuItems,
  megaMenuRootItems,
  hasCustomMegaMenu,
  categoryMobileLimit,
  collectionsLimit,
  megaMenuRootLimit,
  mobileMenuItems,
}: MobileMenuSheetProps) {
  const t = useTranslations();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { theme } = useAppTheme();
  const { currency, currencies, setCurrency } = useCurrency();
  const { language, languages } = useLanguage();
  // Admin menu hrefs arrive locale-prefixed; strip that (plus query/trailing
  // slash) so they can be compared against route slugs.
  const normalizeMenuPath = (href: string) => {
    let path = href.split(/[?#]/)[0].toLowerCase();
    const prefix = `/${locale.toLowerCase()}`;
    if (path === prefix) return "/";
    if (path.startsWith(`${prefix}/`)) path = path.slice(prefix.length);
    if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
    return path;
  };

  // Home / products / collections are hardcoded rows below, so admin menu
  // entries pointing at those same pages are dropped rather than rendered
  // twice — the default header menu ships with its own "Products" link, which
  // used to appear as a duplicate at the bottom of the list.
  const builtinPaths = new Set(["/", "/products", "/collections"]);
  const adminMenuItems = (menuItems ?? []).filter(
    (item) => !builtinPaths.has(normalizeMenuPath(item.href)),
  );

  // Catalog destinations sit with the primary shop links; help and company
  // pages get their own quieter group, so the drawer reads as two short
  // blocks instead of one undifferentiated list.
  const isShopPath = (path: string) =>
    [
      "/brands",
      "/categories",
      "/pre-order",
      "/deals",
      "/new-arrivals",
      "/best-sellers",
    ].some((slug) => path === slug || path.startsWith(`${slug}/`));
  const shopMenuItems = adminMenuItems.filter((item) =>
    isShopPath(normalizeMenuPath(item.href)),
  );
  const moreMenuItems = adminMenuItems.filter(
    (item) => !isShopPath(normalizeMenuPath(item.href)),
  );

  // One glyph per known destination — a wall of identical package icons said
  // nothing about where a row leads.
  const menuItemIcon = (item: HeaderMenuItem): LucideIcon => {
    const path = normalizeMenuPath(item.href);
    const label = item.label.toLowerCase();
    if (path.startsWith("/blog") || label.includes("blog")) return Rss;
    if (path.startsWith("/track-order") || label.includes("track"))
      return PackageSearch;
    if (path.startsWith("/contact")) return MessageCircle;
    if (path.startsWith("/brands")) return Tags;
    if (path.startsWith("/pre-order")) return CalendarClock;
    if (path.includes("vendor") || label.includes("vendor")) return Store;
    if (path.startsWith("/faq") || path.startsWith("/help")) return CircleHelp;
    if (path.startsWith("/deals")) return BadgePercent;
    if (path.startsWith("/categories")) return LayoutGrid;
    return Package;
  };

  const isActivePath = (href: string) =>
    pathname === href ||
    (href !== `/${locale}` && pathname.startsWith(`${href}/`));

  const moreLabel = t.has("common.more") ? t("common.more") : "More";
  const themeLabel = t.has("common.theme") ? t("common.theme") : "Theme";

  // The dropdown renders one flat list of top-level entries — no child
  // categories. Source is the custom mega menu when the store has one, the
  // real category tree otherwise, but both are gated on `categories.length`:
  // the mega mirror can be fed by the seeded default menu, which used to keep
  // a hardcoded grid of dead links in the drawer after every real category was
  // removed.
  const categoryEntries: {
    key: string;
    href: string;
    label: string;
    target?: string;
    // `null` when the entry has no artwork of its own — the row draws a blank
    // spacer instead of inventing a glyph, so the labels stay on one edge.
    visual: ReactNode | null;
  }[] =
    hasCustomMegaMenu && megaMenuRootItems.length > 0
      ? megaMenuRootItems.map((item, idx) => ({
          key: getHeaderMenuItemKey(item) ?? `mega-${idx}`,
          href: item.href,
          label: item.label,
          target: item.target,
          visual: <MegaMenuItemVisual item={item} className="h-4 w-4" />,
        }))
      : categories.map((cat) => ({
          key: cat._id,
          href: `/${locale}/products?category=${encodeURIComponent(cat.slug)}`,
          label: cat.name,
          // A category's own `image` is its catalog artwork, not a mega-menu
          // promo, so it is still fair game as the row visual here.
          visual:
            cat.icon || cat.image ? (
              <AppImage
                src={(cat.icon || cat.image) as string}
                alt={cat.name}
                className="h-5 w-5 object-contain"
                width={20}
                height={20}
              />
            ) : null,
        }));
  const visibleCategoryEntries = categoryEntries.slice(
    0,
    Math.min(categoryMobileLimit, megaMenuRootLimit, MOBILE_CATEGORY_LIMIT),
  );
  const showCategorySection =
    showMobileCategoryShortcuts &&
    (visibleCategoryEntries.length > 0 || !hasCustomMegaMenu);

  const hasCustomMobileMenu = mobileMenuItems && mobileMenuItems.length > 0;

  return (
    // Trigger-less by design: the drawer is opened from the bottom nav's Menu
    // tab (via `useMobileMenu`), which sits in the thumb zone instead of the
    // top-right corner the hamburger used to occupy. The header slot it left
    // behind now holds the cart.
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="w-[min(85vw,320px)] gap-0 overflow-y-auto p-0"
      >
        <SheetTitle className="sr-only">Menu</SheetTitle>
        <div className="flex min-h-full flex-col pb-[env(safe-area-inset-bottom)]">
          {/* Sticky brand bar. The sheet's default close button floated over
              whatever content happened to be under it at 70% opacity and
              scrolled away on a long drawer; this gives it a real 36px target
              that stays reachable, and puts the theme switch — a preference,
              not a destination — in the chrome instead of a "Settings" section
              that collided with the account area's dashboard settings link. */}
          <div className="sticky top-0 z-10 flex items-center gap-2 border-b bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80">
            <Link
              href={`/${locale}`}
              onClick={closeMobileMenu}
              className="flex min-w-0 flex-1 items-center gap-2"
            >
              {brandLogoUrl ? (
                <AppImage
                  src={brandLogoUrl}
                  alt={brandName}
                  className="h-7 w-auto max-w-[150px] object-contain object-left"
                  width={150}
                  height={28}
                />
              ) : (
                <>
                  <Store className="h-5 w-5 shrink-0 text-primary" />
                  <span className="truncate text-base font-bold">
                    {brandName}
                  </span>
                </>
              )}
            </Link>

            {showMobileThemeSelector && (
              /* Light and dark only — no "System" option, the storefront never
                 follows the visitor's OS preference. Icon-only up here: the
                 labels cost width the brand row needs. */
              <div
                role="group"
                aria-label={themeLabel}
                className="inline-flex shrink-0 rounded-full border p-0.5"
              >
                {[
                  { mode: "light" as const, label: "Light", icon: Sun },
                  { mode: "dark" as const, label: "Dark", icon: Moon },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = theme === item.mode;
                  return (
                    <button
                      key={item.mode}
                      type="button"
                      aria-label={item.label}
                      aria-pressed={isSelected}
                      onClick={() => handleThemeChange(item.mode)}
                      className={cn(
                        "grid h-7 w-8 place-items-center rounded-full transition-colors",
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </button>
                  );
                })}
              </div>
            )}

            <SheetClose className="grid h-11 w-11 shrink-0 place-items-center rounded-full border bg-muted/60 text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-95">
              <X className="h-5 w-5" />
              <span className="sr-only">{t("common.close")}</span>
            </SheetClose>
          </div>

          <div className="mb-4 mt-2 px-5 pb-[env(safe-area-inset-top)]">
            <AppImage
              src={brandLogoUrl}
              alt={brandName}
              width={112}
              height={32}
              className="h-8 w-auto object-contain object-left"
              priority
            />
          </div>

          {hasCustomMobileMenu ? (
            <nav className="flex flex-col gap-1 px-3 py-4">
              {mobileMenuItems.map((item, idx) => (
                <RecursiveMobileMenuItem
                  key={`custom-${idx}`}
                  item={item}
                  locale={locale}
                  closeMobileMenu={closeMobileMenu}
                />
              ))}
            </nav>
          ) : (
            <>
              {/* Legacy fallback if no custom mobile drawer menu is set */}
              <nav className="flex flex-col gap-1 px-3 py-4">
                <MobileNavRow
                  href={`/${locale}`}
                  icon={Home}
                  label={t("nav.home")}
                  active={isActivePath(`/${locale}`)}
                  onNavigate={closeMobileMenu}
                />
                <MobileNavRow
                  href={`/${locale}/products`}
                  icon={Layers}
                  label={t("nav.products")}
                  active={isActivePath(`/${locale}/products`)}
                  onNavigate={closeMobileMenu}
                />
                {shopMenuItems.map((item, idx) => (
                  <MobileNavRow
                    key={`sm-${item.href}-${idx}`}
                    href={item.href}
                    icon={menuItemIcon(item)}
                    label={item.label}
                    active={
                      item.target !== "_blank" && isActivePath(item.href)
                    }
                    onNavigate={closeMobileMenu}
                    target={item.target}
                  />
                ))}
                {showCollectionsMenu && collections.length > 0 && (
                  <MobileNavRow
                    href={`/${locale}/collections`}
                    icon={LayoutDashboard}
                    label={collectionsMenuLabel}
                    active={isActivePath(`/${locale}/collections`)}
                    onNavigate={closeMobileMenu}
                  />
                )}

                {showUtilityMenu &&
                  (moreMenuItems.length > 0 ||
                    !menuItems ||
                    menuItems.length === 0) && (
                    <MobileNavDisclosure
                      icon={MoreHorizontal}
                      label={moreLabel}
                      className="pt-2"
                    >
                      {menuItems && menuItems.length > 0 ? (
                        moreMenuItems.map((item, idx) => (
                          <MobileNavRow
                            key={`mm-${item.href}-${idx}`}
                            href={item.href}
                            icon={menuItemIcon(item)}
                            label={item.label}
                            active={
                              item.target !== "_blank" && isActivePath(item.href)
                            }
                            onNavigate={closeMobileMenu}
                            target={item.target}
                          />
                        ))
                      ) : (
                        <>
                          <MobileNavRow
                            href={`/${locale}/blog`}
                            icon={Rss}
                            label={t("nav.blog")}
                            active={isActivePath(`/${locale}/blog`)}
                            onNavigate={closeMobileMenu}
                          />
                          <MobileNavRow
                            href={`/${locale}/track-order`}
                            icon={PackageSearch}
                            label="Track Order"
                            active={isActivePath(`/${locale}/track-order`)}
                            onNavigate={closeMobileMenu}
                          />
                        </>
                      )}
                    </MobileNavDisclosure>
                  )}
              </nav>

              {showCategorySection && (
                <>
                  <Separator />
                  <section className="px-3 py-4">
                    <MobileNavDisclosure
                      icon={LayoutGrid}
                      label={categoryMenuLabel}
                      action={
                        <Link
                          href={categoriesPageHref}
                          onClick={closeMobileMenu}
                          className="shrink-0 text-xs font-medium text-primary"
                        >
                          {t("common.viewAll")}
                        </Link>
                      }
                    >
                      {visibleCategoryEntries.map((entry) => (
                        <Link
                          key={entry.key}
                          href={entry.href}
                          target={entry.target}
                          rel={
                            entry.target === "_blank"
                              ? "noopener noreferrer"
                              : undefined
                          }
                          onClick={closeMobileMenu}
                          className="flex h-11 items-center gap-3 rounded-xl px-3 text-sm transition-colors hover:bg-muted active:bg-muted"
                        >
                          <span
                            aria-hidden={!entry.visual || undefined}
                            className={cn(
                              "grid h-7 w-7 shrink-0 place-items-center rounded-lg",
                              entry.visual && "bg-muted/60",
                            )}
                          >
                            {entry.visual}
                          </span>
                          <span className="truncate">{entry.label}</span>
                        </Link>
                      ))}
                    </MobileNavDisclosure>
                  </section>
                </>
              )}

              {showMobileCollections && collections.length > 0 && (
                <>
                  <Separator />
                  <section className="px-5 py-4">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-sm font-semibold">
                        {collectionsMenuLabel}
                      </h3>
                      <Link
                        href={`/${locale}/collections`}
                        onClick={closeMobileMenu}
                        className="text-xs font-medium text-primary"
                      >
                        {t("common.viewAll")}
                      </Link>
                    </div>
                    <div className="scrollbar-hide -mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2">
                      {collections.slice(0, collectionsLimit).map((collection) => (
                        <Link
                          key={collection._id}
                          href={`/${locale}/collections/${collection.slug}`}
                          onClick={closeMobileMenu}
                          className="group flex w-36 shrink-0 snap-start flex-col gap-2 rounded-xl transition-transform active:scale-95"
                        >
                          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border bg-muted/30">
                            {collection.image?.url ? (
                              <AppImage
                                src={collection.image.url}
                                alt={collection.image.alt || collection.title}
                                fill
                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                                sizes="144px"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-muted">
                                <LayoutDashboard className="h-6 w-6 text-muted-foreground/30" />
                              </div>
                            )}
                          </div>
                          <span className="line-clamp-2 text-[13px] font-medium leading-tight group-hover:text-primary">
                            {collection.title}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </section>
                </>
              )}
            </>
          )}

          <div className="mt-auto flex flex-col p-5">
            {showAccountMenu && (
              <>
                <Separator />
                <section className="px-3 py-4">
                  <MobileNavLabel>{t("common.account")}</MobileNavLabel>
                  <div className="grid gap-1 text-sm font-medium">
                    {isLoading ? (
                      <>
                        <div className="h-11 animate-pulse rounded-xl bg-muted/60" />
                        <div className="h-11 animate-pulse rounded-xl bg-muted/60" />
                        <div className="h-11 animate-pulse rounded-xl bg-muted/60" />
                      </>
                    ) : isAuthenticated && user ? (
                      <>
                        {getDashboardLink() ? (
                          <>
                            <Link
                              href={getDashboardLink()!}
                              onClick={closeMobileMenu}
                              className="flex h-11 items-center gap-3 rounded-xl px-3 transition-colors hover:bg-muted active:bg-muted"
                            >
                              <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                              {t("common.dashboard")}
                            </Link>
                            <Link
                              href={getSettingsLink()}
                              onClick={closeMobileMenu}
                              className="flex h-11 items-center gap-3 rounded-xl px-3 transition-colors hover:bg-muted active:bg-muted"
                            >
                              <Settings className="h-4 w-4 text-muted-foreground" />
                              {t("admin.settings.title")}
                            </Link>
                          </>
                        ) : (
                          <>
                            <Link
                              href={`/${locale}/account`}
                              onClick={closeMobileMenu}
                              className="flex h-11 items-center gap-3 rounded-xl px-3 transition-colors hover:bg-muted active:bg-muted"
                            >
                              <User className="h-4 w-4 text-muted-foreground" />
                              {t("common.account")}
                            </Link>
                            <Link
                              href={`/${locale}/account/orders`}
                              onClick={closeMobileMenu}
                              className="flex h-11 items-center gap-3 rounded-xl px-3 transition-colors hover:bg-muted active:bg-muted"
                            >
                              <Package className="h-4 w-4 text-muted-foreground" />
                              {t("orders.myOrders")}
                            </Link>
                            <Link
                              href={`/${locale}/account/profile`}
                              onClick={closeMobileMenu}
                              className="flex h-11 items-center gap-3 rounded-xl px-3 transition-colors hover:bg-muted active:bg-muted"
                            >
                              <User className="h-4 w-4 text-muted-foreground" />
                              {t("common.profile")}
                            </Link>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            closeMobileMenu();
                            void handleLogout();
                          }}
                          className="flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 active:bg-destructive/10"
                        >
                          <LogOut className="h-4 w-4" />
                          {t("common.logout")}
                        </button>
                      </>
                    ) : (
                      <>
                        {showMobileAccountSummary && (
                          <>
                            <Link
                              href={buildLoginUrl(locale, pathname)}
                              onClick={closeMobileMenu}
                              className="flex h-11 items-center gap-3 rounded-xl px-3 font-semibold text-primary transition-colors hover:bg-primary/10 active:bg-primary/10"
                            >
                              <LogIn className="h-4 w-4" />
                              {t("common.signIn")}
                            </Link>
                            <Link
                              href={`/${locale}/register`}
                              onClick={closeMobileMenu}
                              className="flex h-11 items-center gap-3 rounded-xl px-3 transition-colors hover:bg-muted active:bg-muted"
                            >
                              <UserPlus className="h-4 w-4 text-muted-foreground" />
                              {t("common.register")}
                            </Link>
                          </>
                        )}
                        <Link
                          href={buildLoginUrl(locale, `/${locale}/account/orders`)}
                          onClick={closeMobileMenu}
                          className="flex h-11 items-center gap-3 rounded-xl px-3 transition-colors hover:bg-muted active:bg-muted"
                        >
                          <Package className="h-4 w-4 text-muted-foreground" />
                          {t("common.myOrders")}
                        </Link>
                        <Link
                          href={buildLoginUrl(
                            locale,
                            `/${locale}/account/profile`,
                          )}
                          onClick={closeMobileMenu}
                          className="flex h-11 items-center gap-3 rounded-xl px-3 transition-colors hover:bg-muted active:bg-muted"
                        >
                          <User className="h-4 w-4 text-muted-foreground" />
                          {t("common.profile")}
                        </Link>
                      </>
                    )}
                  </div>
                </section>
              </>
            )}

            {showMobileMarketSelectors && (
              <>
                <Separator />
                <section className="grid gap-3 px-5 py-4">
                  {showLanguageSelector && (
                    <label className="grid gap-1.5 text-sm font-medium">
                      <span className="flex items-center gap-2">
                        <Globe2 className="h-4 w-4 text-muted-foreground" />
                        {t("common.language")}
                      </span>
                      <div className="relative">
                        <select
                          value={language.code}
                          onChange={(event) =>
                            handleMobileLanguageChange(event.target.value)
                          }
                          className="h-11 w-full appearance-none rounded-xl border bg-background px-3 pr-9 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                        >
                          {languages.map((lang) => (
                            <option key={lang.code} value={lang.code}>
                              {lang.name}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      </div>
                    </label>
                  )}

                  {showCurrencySelector && (
                    <label className="grid gap-1.5 text-sm font-medium">
                      <span className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        {t("common.currency")}
                      </span>
                      <div className="relative">
                        <select
                          value={currency.code}
                          onChange={(e) => setCurrency(e.target.value)}
                          className="h-11 w-full appearance-none rounded-xl border bg-background px-3 pr-9 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                        >
                          {currencies.map((curr) => (
                            <option key={curr.code} value={curr.code}>
                              {curr.code} ({curr.symbol})
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      </div>
                    </label>
                  )}
                </section>
              </>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function MobileNavRow({
  href,
  icon: Icon,
  label,
  active,
  onNavigate,
  target,
  className,
}: {
  href: string;
  icon: LucideIcon | React.ComponentType<{ className?: string }>;
  label: string;
  active?: boolean;
  onNavigate: () => void;
  target?: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      target={target}
      rel={target === "_blank" ? "noopener noreferrer" : undefined}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex h-11 items-center gap-3 rounded-xl px-3 transition-colors",
        active ? "bg-accent text-primary" : "hover:bg-muted active:bg-muted",
        className,
      )}
    >
      <Icon
        className={cn(
          "h-4 w-4 shrink-0",
          active ? "text-primary" : "text-muted-foreground",
        )}
      />
      <span className="truncate">{label}</span>
    </Link>
  );
}

function MobileNavDisclosure({
  icon: Icon,
  label,
  action,
  className,
  children,
  defaultOpen = false,
}: {
  icon?: LucideIcon | React.ComponentType<{ className?: string }>;
  label: string;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={className}>
      <div className="flex items-center gap-2 px-3">
        <button
          type="button"
          onClick={() => setIsOpen((open) => !open)}
          aria-expanded={isOpen}
          className="flex min-w-0 flex-1 items-center gap-2 py-1 text-left"
        >
          <div className="flex h-11 flex-1 items-center gap-3 font-medium">
            {Icon && <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />}
            <span className="truncate">{label}</span>
          </div>
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
              isOpen && "rotate-180",
            )}
          />
        </button>
        {action}
      </div>

      {isOpen && <div className="animate-in fade-in slide-in-from-top-1">{children}</div>}
    </div>
  );
}

function MobileNavLabel({ children }: { children: ReactNode }) {
  return (
    <p className="px-3 pb-1 pt-3 text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
      {children}
    </p>
  );
}
