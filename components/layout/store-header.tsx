"use client";

import Link from "next/link";
import Image from "next/image";
import {
  ShoppingCart,
  Search,
  User,
  LayoutDashboard,
  LogOut,
  Package,
  Phone,
  Heart,
  Settings,
  Store,
  ChevronDown,
  Sun,
  Moon,
  Sparkles,
  Rss,
  Layers,
  ArrowRight,
  ArrowLeftRight,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { useTranslations } from "next-intl";
import { signOut } from "@/lib/auth-client";
import { Badge } from "@/components/ui/badge";
import { useWishlist } from "@/hooks/use-wishlist";
import { useDebounce } from "@/hooks/use-debounce";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { AppImage } from "@/components/ui/app-image";
import { usePathname, useRouter } from "next/navigation";
import type { ThemeMode } from "@/config/branding.config";
import { useAppTheme } from "@/providers/theme-provider";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { appConfig, USER_ROLES } from "@/config/app.config";
import { isStaffRole } from "@/lib/staff-role";
import { getRoleDashboardPath } from "@/lib/role-dashboard";
import { buildLoginUrl } from "@/lib/return-path";
import { useAppSettings } from "@/providers/app-settings-provider";
import { useCurrency } from "@/providers/currency-provider";
import { ModernAuthPopup, type AuthTheme } from "@/components/auth/modern-auth-popup";
import {
  swapLocaleInPathname,
  useLanguage,
} from "@/providers/language-provider";
import { type Locale } from "@/config/i18n.config";
import { FlagIcon } from "@/components/ui/flag-icon";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAppSettings as useGlobalAppSettings } from "@/stores/app-settings";
import {
  DEFAULT_CATEGORY_TRIGGER,
  getDefaultHeaderSettings,
  resolveHeaderLogoUrl,
  type HeaderSettings,
} from "@/lib/header-config";
import { cn } from "@/lib/utils";
import {
  MAX_MEGA_MENU_LEVEL_2_ITEMS,
  MAX_MEGA_MENU_ROOT_ITEMS,
} from "@/lib/menu-depth";

export interface HeaderMenuItem {
  label: string;
  href: string;
  target?: "_self" | "_blank";
  icon?: string;
  image?: string;
  description?: string;
  badge?: string;
  isFeatured?: boolean;
  /**
   * Mega menu top-level only: where this category's promo renders. Absent on
   * menus saved before the setting existed — the panel derives those from the
   * legacy `isFeatured` flag.
   */
  promoMode?: "none" | "side" | "bottom";
  /**
   * Mega menu top-level, "bottom" mode only: the pair of images that make the
   * card strip under the link columns. Menus saved before these fields existed
   * built the strip out of children flagged `isFeatured` instead.
   */
  promoImages?: string[];
  columnTitle?: string;
  navPosition?: "left" | "right";
  children?: HeaderMenuItem[];
}

import { MobileMenuSheet } from "@/components/layout/store-header/mobile-menu-sheet";
import { OverflowNav } from "@/components/layout/store-header/overflow-nav";
import { useMobileMenu } from "@/stores/mobile-menu";
import { CustomMegaMenuPanel } from "@/components/layout/store-header/mega-menu";
import { CurrencySwitcher } from "@/components/store/currency-switcher";
import { LanguageSwitcher } from "@/components/store/language-switcher";
import { HeaderModePill } from "@/components/store/header-mode-pill";
import { BranchSelectorPill } from "@/components/store/branch-selector-pill";
import {
  CategoryTriggerGlyph,
  getCategoryRailRadius,
  getCategoryTriggerStyle,
} from "@/lib/header-trigger-style";

export type CategoryNode = {
  _id: string;
  name: string;
  slug: string;
  image?: string;
  icon?: string;
  children: CategoryNode[];
};

export type CollectionItem = {
  _id: string;
  title: string;
  slug: string;
  handle?: string;
  description?: string;
  image?: { url?: string; alt?: string };
};

interface StoreHeaderProps {
  locale: Locale;
  menuItems?: HeaderMenuItem[];
  mobileMenuItems?: HeaderMenuItem[];
  megaMenuItems: HeaderMenuItem[];
  headerSettings?: HeaderSettings;
  // Nav categories + collections are now fetched on the server (in the store
  // layout) and passed in, so the mega-menu renders in the initial HTML instead
  // of after two client round-trips per page.
  initialCategories?: CategoryNode[];
  initialCollections?: CollectionItem[];
  productPageSettings?: { layout: { showMenu: boolean } };
}

type SearchSuggestion = {
  _id: string;
  slug: string;
  name?: string;
  title?: string;
  images?: string[];
};

const DESKTOP_QUICK_CATEGORY_FULL_LIMIT = 5;
const DESKTOP_QUICK_CATEGORY_PARTIAL_LIMIT = 7;
const DESKTOP_QUICK_CATEGORY_ONLY_LIMIT = 11;

function getDesktopQuickCategoryLimit(visibleNavGroupCount: number) {
  if (visibleNavGroupCount <= 0) return DESKTOP_QUICK_CATEGORY_ONLY_LIMIT;
  if (visibleNavGroupCount >= 3) return DESKTOP_QUICK_CATEGORY_FULL_LIMIT;
  return DESKTOP_QUICK_CATEGORY_PARTIAL_LIMIT;
}

export function StoreHeader({
  locale,
  menuItems,
  mobileMenuItems,
  megaMenuItems,
  headerSettings,
  initialCategories,
  initialCollections,
  productPageSettings,
}: StoreHeaderProps) {
  const t = useTranslations();
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { totalItems } = useCart();
  const { items: wishlistItems } = useWishlist();
  const { storeName, logoUrl, darkModeLogoUrl, supportedCurrencies, multiBranchEnabled, wholesaleEnabled } = useAppSettings();
  const { isDark, setTheme } = useAppTheme();
  const { setThemeMode, authUI } = useGlobalAppSettings();
  const [isAuthPopupOpen, setIsAuthPopupOpen] = useState(false);
  const [authPopupView, setAuthPopupView] = useState<"login" | "register">("login");
  const { currency, currencies, setCurrency } = useCurrency();
  const { language, languages } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [detectedCountry, setDetectedCountry] = useState("GH");

  useEffect(() => {
    setMounted(true);
    // Read country code from cookie if available
    const match = document.cookie.match(/(^| )countryCode=([^;]+)/);
    if (match) {
      setDetectedCountry(match[2]);
    }
  }, []);

  // Filter to only admin-enabled currencies; fall back to active currency alone
  const availableCurrencies = useMemo(() => {
    if (supportedCurrencies?.length) {
      const filtered = currencies.filter((c) => supportedCurrencies.includes(c.code));
      // Always include the currently selected currency even if not in list
      if (!filtered.find((c) => c.code === currency.code)) {
        const active = currencies.find((c) => c.code === currency.code);
        if (active) filtered.unshift(active);
      }
      return filtered;
    }
    // No supported currencies configured → show only the active one
    return currencies.filter((c) => c.code === currency.code);
  }, [supportedCurrencies, currencies, currency.code]);

  // The mobile drawer is opened from the bottom nav's Menu tab, which is a
  // sibling of the header rather than a child — hence the shared store.
  const isOpen = useMobileMenu((state) => state.isOpen);
  const setIsOpen = useMobileMenu((state) => state.setOpen);
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    const match = document.cookie.match(new RegExp('(^| )countryCode=([^;]+)'));
    if (match) {
      setDetectedCountry(match[2]);
    }
  }, []);

  const [isMarketModalOpen, setIsMarketModalOpen] = useState(false);
  const [isGuestMenuOpen, setIsGuestMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [pendingLanguageCode, setPendingLanguageCode] = useState(language.code);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchSuggestions, setSearchSuggestions] = useState<
    SearchSuggestion[]
  >([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  // Set for the one open the merchant scheduled, so the focus opt-out below
  // applies to that open and not to the user's own hover or click.
  const megaAutoOpenedRef = useRef(false);
  // Which path we have already auto-opened for. Closing the rail on the home
  // page has to stick — without this the effect would reopen it on the next
  // render and the panel could not be dismissed.
  const megaAutoOpenedPathRef = useRef<string | null>(null);
  // Server-seeded (see store layout). No loading state needed — the data is in
  // the initial HTML. Read straight from props (not copied into state) so a
  // router.refresh() — e.g. StorefrontRefresh after a back-nav — updates the
  // nav when categories/collections change.
  const [categoriesLoading] = useState(false);
  const categories: CategoryNode[] = initialCategories ?? [];
  const collections: CollectionItem[] = initialCollections ?? [];
  const [collectionsOpen, setCollectionsOpen] = useState(false);

  const isProductPage = pathname.match(/^\/(?:[a-z]{2}(?:-[a-zA-Z]{2})?\/)?products\//);
  const hideNavigation = isProductPage && productPageSettings?.layout.showMenu === false;
  const [activeRootCategoryId, setActiveRootCategoryId] = useState<
    string | null
  >(initialCategories?.[0]?._id ?? null);
  const [activeChildCategoryId, setActiveChildCategoryId] = useState<
    string | null
  >(initialCategories?.[0]?.children?.[0]?._id ?? null);
  const closeSuggestionsTimeoutRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);
  const categoriesMenuCloseTimeoutRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);
  const megaMenuCloseTimeoutRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);
  const collectionsMenuCloseTimeoutRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);
  const guestMenuCloseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const userMenuCloseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const debouncedSearchQuery = useDebounce(searchQuery.trim(), 350);
  // Category scope for the search pill's dropdown; "" = all categories.
  const [searchCategory, setSearchCategory] = useState("");
  const headerFullWidth = headerSettings?.layout.fullWidth ?? false;
  const headerSticky = headerSettings?.layout.sticky ?? true;
  const headerVariant = headerSettings?.layout.variant ?? "classic";
  const headerColorMode = headerSettings?.layout.color ?? "light";
  const headerTransparent = headerColorMode === "transparent";
  const isCenteredVariant = headerVariant === "centered";
  const isLogoCenterVariant = headerVariant === "logo-center";
  const isMinimalVariant = headerVariant === "minimal";
  const isNavTopVariant = headerVariant === "nav-top";
  const isBannerNavVariant = headerVariant === "banner-nav";
  // Which templates keep the nav links inline in the top row instead of (or
  // in addition to) a dedicated row below it.
  const navInTopRow = isMinimalVariant || isNavTopVariant || isCenteredVariant;
  // What the row under the top bar holds, per template. `null` = no row.
  const bottomRowKind: "nav" | "search" | "centered-nav" | null =
    headerVariant === "classic" || isBannerNavVariant
      ? "nav"
      : isNavTopVariant
        ? "search"
        : isLogoCenterVariant
          ? "centered-nav"
          : null;
  const headerLogoUrl = headerSettings?.brand.logoUrl?.trim() || "";
  const headerDarkLogoUrl = headerSettings?.brand.darkLogoUrl?.trim() || "";
  const headerLogoAlt = headerSettings?.brand.logoAlt?.trim() || "";
  const desktopLogoWidth = headerSettings?.brand.desktopLogoWidth ?? 144;
  const mobileLogoWidth = headerSettings?.brand.mobileLogoWidth ?? 112;
  const showSearch = headerSettings?.search.enabled ?? true;
  const showAiSearch = headerSettings?.search.showAiButton ?? true;
  const showSearchCategoryDropdown =
    headerSettings?.search.showCategoryDropdown ?? false;
  const searchPlaceholder =
    headerSettings?.search.placeholder?.trim() || t("common.searchPlaceholder");
  const searchDesktopWidth = headerSettings?.search.desktopWidth ?? 640;
  const searchHeight = headerSettings?.search.height ?? 40;
  const searchBorderRadius = headerSettings?.search.borderRadius ?? 999;
  const searchBorderColor =
    headerSettings?.search.borderColor?.trim() || "#dddddd";
  const showLanguageSelector =
    headerSettings?.market.showLanguageSelector ?? true;
  const showCurrencySelector =
    headerSettings?.market.showCurrencySelector ?? true;
  const showMarketSelector = showLanguageSelector || showCurrencySelector;
  const showThemeToggle = headerSettings?.widgets.showThemeToggle ?? true;
  const showAccountMenu = headerSettings?.widgets.showAccountMenu ?? true;
  const showWishlist = headerSettings?.widgets.showWishlist ?? true;
  const showCart = headerSettings?.widgets.showCart ?? true;
  const showContactButton = headerSettings?.widgets.showContact ?? false;
  const showCompareButton = headerSettings?.widgets.showCompare ?? false;
  const showActionLabels = headerSettings?.widgets.showLabels ?? false;
  const actionsGap = headerSettings?.widgets.gap ?? 24;
  const showCategoryMenu = headerSettings?.categoryMenu.enabled ?? true;
  const categoryMenuPosition =
    headerSettings?.categoryMenu.position ?? "left";
  const showMegaMenu = headerSettings?.categoryMenu.showMegaMenu ?? true;
  const showCategoryQuickLinks =
    headerSettings?.categoryMenu.showQuickLinks ?? true;
  const categoryMenuLabel =
    headerSettings?.categoryMenu.label?.trim() || t("common.allCategories");
  const categoryQuickLimit = headerSettings?.categoryMenu.quickLimit ?? 3;
  const categoryMobileLimit = headerSettings?.categoryMenu.mobileLimit ?? 8;
  const showCollectionsMenu = headerSettings?.collectionsMenu.enabled ?? true;
  const collectionsMenuPosition =
    headerSettings?.collectionsMenu.position ?? "left";
  const collectionsMenuLabel =
    headerSettings?.collectionsMenu.label?.trim() || t("nav.collections");
  const collectionsLimit = headerSettings?.collectionsMenu.limit ?? 12;
  const showUtilityMenu = headerSettings?.utilityMenu.enabled ?? true;
  const utilityPlacement = headerSettings?.utilityMenu.placement ?? "menu";
  const showMobileSearch =
    showSearch && (headerSettings?.mobile.showSearch ?? true);
  const showMobileAccountSummary =
    showAccountMenu && (headerSettings?.mobile.showAccountSummary ?? true);
  const showMobileCategoryShortcuts =
    showCategoryMenu && (headerSettings?.mobile.showCategoryShortcuts ?? true);
  const showMobileCollections =
    showCollectionsMenu && (headerSettings?.mobile.showCollections ?? true);
  const showMobileMarketSelectors =
    showMarketSelector && (headerSettings?.mobile.showMarketSelectors ?? true);
  const showMobileThemeSelector =
    showThemeToggle && (headerSettings?.mobile.showThemeSelector ?? true);
  const rawCategoryPromoHref =
    headerSettings?.categoryMenu.promoHref?.trim() || "";
  const categoryPromoHref =
    !rawCategoryPromoHref
      ? `/${locale}/products`
      : rawCategoryPromoHref.startsWith("http://") ||
    rawCategoryPromoHref.startsWith("https://")
      ? rawCategoryPromoHref
      : rawCategoryPromoHref.startsWith(`/${locale}`)
        ? rawCategoryPromoHref
        : rawCategoryPromoHref.startsWith("/")
          ? `/${locale}${rawCategoryPromoHref}`
          : `/${locale}/${rawCategoryPromoHref}`;
  const categoryPromoImageSrc =
    headerSettings?.categoryMenu.promoImageSrc?.trim() || "";
  const categoryPromoTitle =
    headerSettings?.categoryMenu.promoTitle?.trim() || "";
  const categoryPromoSubtitle =
    headerSettings?.categoryMenu.promoSubtitle?.trim() || "";
  const hasCategoryPromoContent = Boolean(
    categoryPromoTitle || categoryPromoSubtitle || categoryPromoImageSrc,
  );
  const showCategoryPromoCard =
    showCategoryMenu &&
    (headerSettings?.categoryMenu.showPromoCard ?? false) &&
    hasCategoryPromoContent;
  // "dark" pins the dark scheme regardless of the shopper's theme; "color"
  // paints theme primary instead of the custom schemes entirely.
  const activeHeaderColors =
    headerColorMode === "color"
      ? undefined
      : headerColorMode === "dark" || isDark
        ? headerSettings?.colors.dark
        : headerSettings?.colors.light;
  // Falls back to the shipped defaults when a store has no saved header yet, so
  // the trigger never renders unstyled while settings are still loading.
  const categoryTrigger =
    headerSettings?.categoryMenu.trigger ?? DEFAULT_CATEGORY_TRIGGER;
  const categoryRailRadius = getCategoryRailRadius(categoryTrigger);
  const megaTriggerLook = getCategoryTriggerStyle(categoryTrigger, {
    isDark,
    open: megaMenuOpen,
  });
  const flatTriggerLook = getCategoryTriggerStyle(categoryTrigger, {
    isDark,
    open: categoriesOpen,
  });
  const headerContainerClass = headerFullWidth
    ? "w-full px-4 sm:px-6 lg:px-8"
    : "container mx-auto px-4";
  const headerThemeStyle =
    headerColorMode === "color"
      ? ({
          // Theme primary as the bar. Popovers keep the store surface —
          // a primary-colored dropdown would swallow its own content.
          "--background": "var(--primary)",
          "--foreground": "var(--primary-foreground)",
          "--muted-foreground": "var(--primary-foreground)",
        } as CSSProperties)
      : activeHeaderColors
        ? ({
            // Transparent mode keeps the custom TEXT colors but hands the
            // background to the glass treatment below — a solid custom bg
            // would defeat the whole point of the setting.
            ...(headerTransparent
              ? {}
              : { "--background": activeHeaderColors.backgroundColor }),
            "--foreground": activeHeaderColors.textColor,
            "--popover": activeHeaderColors.backgroundColor,
            "--popover-foreground": activeHeaderColors.textColor,
            "--muted-foreground": activeHeaderColors.textColor,
            "--header-search-bg": activeHeaderColors.searchBackgroundColor,
            "--header-search-text": activeHeaderColors.searchTextColor,
          } as CSSProperties)
        : undefined;
  const searchInputStyle = {
    ...(activeHeaderColors
      ? {
          backgroundColor: "var(--header-search-bg)",
          color: "var(--header-search-text)",
        }
      : {}),
    borderColor: searchBorderColor,
    borderRadius: searchBorderRadius,
    height: searchHeight,
  } as CSSProperties;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSearchSuggestions(false);
    if (searchQuery.trim()) {
      const params = new URLSearchParams({ search: searchQuery });
      if (searchCategory) params.set("category", searchCategory);
      router.push(`/${locale}/products?${params.toString()}`);
    }
  };

  const handleAISalesAgentOpen = () => {
    setShowSearchSuggestions(false);
    window.dispatchEvent(new CustomEvent("ai-sales-agent:open"));
  };

  const handleSearchQueryChange = (value: string) => {
    setSearchQuery(value);
    if (value.trim().length < 2) {
      setSearchSuggestions([]);
      setIsSearching(false);
      setShowSearchSuggestions(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    window.location.href = `/${locale}`;
  };

  const getDashboardLink = () => getRoleDashboardPath(locale, user?.role);

  const getSettingsLink = () => {
    const role = user?.role;
    if (role === USER_ROLES.ADMIN) return `/${locale}/admin/settings`;
    if (role === USER_ROLES.VENDOR) return `/${locale}/vendor/settings`;
    if (isStaffRole(role)) return `/${locale}/staff/profile`;
    return `/${locale}/account`;
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // ONE rule, shared with the admin's Header style preview — see
  // resolveHeaderLogoUrl. Header-level artwork wins where it is set; the
  // store's general logos are the fallback (and, today, the only ones the
  // studio uploads).
  const currentLogoUrl = resolveHeaderLogoUrl({
    colorMode: headerColorMode,
    brand: headerSettings?.brand ?? getDefaultHeaderSettings().brand,
    isDark,
    lightLogoUrl:
      headerLogoUrl || (typeof logoUrl === "string" ? logoUrl : ""),
    darkLogoUrl:
      headerDarkLogoUrl ||
      (typeof darkModeLogoUrl === "string" ? darkModeLogoUrl : ""),
  });

  const handleThemeToggle = () => {
    const nextMode = isDark ? "light" : "dark";
    setTheme(nextMode);
    setThemeMode(nextMode);
  };

  const handleMarketModalOpenChange = (open: boolean) => {
    setIsMarketModalOpen(open);
    if (open) {
      setPendingLanguageCode(language.code);
    }
  };

  const handleMarketSettingsSave = () => {
    const newLocale = pendingLanguageCode;
    const currentLocale = language.code;

    // Language changes are pure navigation: the URL locale is the source of
    // truth, and next-intl's middleware persists the choice via NEXT_LOCALE.
    if (newLocale !== currentLocale) {
      router.push(swapLocaleInPathname(pathname, currentLocale, newLocale));
    }

    setIsMarketModalOpen(false);
  };

  const handleThemeChange = (nextMode: ThemeMode) => {
    setTheme(nextMode);
    setThemeMode(nextMode);
  };

  const handleMobileLanguageChange = (newLocale: string) => {
    const currentLocale = locale || language.code;

    if (newLocale !== currentLocale) {
      router.push(swapLocaleInPathname(pathname, currentLocale, newLocale));
      setIsOpen(false);
    }
  };

  const closeMobileMenu = () => setIsOpen(false);

  const openGuestMenu = () => {
    if (guestMenuCloseTimeoutRef.current) {
      clearTimeout(guestMenuCloseTimeoutRef.current);
    }
    setIsGuestMenuOpen(true);
  };

  const closeGuestMenu = () => {
    if (guestMenuCloseTimeoutRef.current) {
      clearTimeout(guestMenuCloseTimeoutRef.current);
    }

    guestMenuCloseTimeoutRef.current = setTimeout(() => {
      setIsGuestMenuOpen(false);
    }, 120);
  };

  const openUserMenu = () => {
    if (userMenuCloseTimeoutRef.current) {
      clearTimeout(userMenuCloseTimeoutRef.current);
    }
    setIsUserMenuOpen(true);
  };

  const closeUserMenu = () => {
    if (userMenuCloseTimeoutRef.current) {
      clearTimeout(userMenuCloseTimeoutRef.current);
    }

    userMenuCloseTimeoutRef.current = setTimeout(() => {
      setIsUserMenuOpen(false);
    }, 120);
  };

  const openCategoriesMenu = () => {
    if (categoriesMenuCloseTimeoutRef.current) {
      clearTimeout(categoriesMenuCloseTimeoutRef.current);
    }
    setCategoriesOpen(true);
  };

  const closeCategoriesMenu = () => {
    if (categoriesMenuCloseTimeoutRef.current) {
      clearTimeout(categoriesMenuCloseTimeoutRef.current);
    }

    categoriesMenuCloseTimeoutRef.current = setTimeout(() => {
      setCategoriesOpen(false);
    }, 120);
  };

  const openMegaMenu = () => {
    if (megaMenuCloseTimeoutRef.current) {
      clearTimeout(megaMenuCloseTimeoutRef.current);
    }
    setMegaMenuOpen(true);
  };

  const closeMegaMenu = () => {
    if (megaMenuCloseTimeoutRef.current) {
      clearTimeout(megaMenuCloseTimeoutRef.current);
    }

    megaMenuCloseTimeoutRef.current = setTimeout(() => {
      setMegaMenuOpen(false);
    }, 120);
  };

  // In click mode the hover handlers come off entirely; Radix's own click
  // toggle is what opens the panel, and it already works in both modes.
  const categoryHoverProps =
    categoryTrigger.openOn === "hover"
      ? { onMouseEnter: openMegaMenu, onMouseLeave: closeMegaMenu }
      : {};
  const flatCategoryHoverProps =
    categoryTrigger.openOn === "hover"
      ? { onMouseEnter: openCategoriesMenu, onMouseLeave: closeCategoriesMenu }
      : {};

  const openCollectionsMenu = () => {
    if (collectionsMenuCloseTimeoutRef.current) {
      clearTimeout(collectionsMenuCloseTimeoutRef.current);
    }
    setCollectionsOpen(true);
  };

  const closeCollectionsMenu = () => {
    if (collectionsMenuCloseTimeoutRef.current) {
      clearTimeout(collectionsMenuCloseTimeoutRef.current);
    }

    collectionsMenuCloseTimeoutRef.current = setTimeout(() => {
      setCollectionsOpen(false);
    }, 120);
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeRoot =
    categories.find((c) => c._id === activeRootCategoryId) || categories[0];
  const rootChildren = activeRoot?.children || [];
  const visibleRootChildren = rootChildren.slice(0, MAX_MEGA_MENU_LEVEL_2_ITEMS);
  const rootHasNested = visibleRootChildren.some(
    (c) => (c.children?.length || 0) > 0,
  );
  const isFlatCategoryList =
    categories.length > 0 &&
    categories.every((c) => (c.children?.length || 0) === 0);
  const showPromoCards = showCategoryPromoCard;
  const activeChild =
    visibleRootChildren.find((c) => c._id === activeChildCategoryId) ||
    visibleRootChildren[0];
  const megaSource = (
    rootHasNested ? activeChild?.children || [] : visibleRootChildren
  ).slice(
    0,
    rootHasNested
      ? (activeChild?.children || []).length
      : MAX_MEGA_MENU_LEVEL_2_ITEMS,
  );
  const categoriesPageHref = `/${locale}/categories`;
  const visibleCategoryRoots = categories.slice(0, MAX_MEGA_MENU_ROOT_ITEMS);
  const hasCategoryOverflow = categories.length > MAX_MEGA_MENU_ROOT_ITEMS;
  // The rail shows every category and scrolls — the old 7-item cap silently
  // dropped the rest. Which category is open lives inside the panel.
  const megaMenuRootItems = (megaMenuItems || []).filter((item) =>
    item.label.trim(),
  );
  const hasCustomMegaMenu =
    showCategoryMenu && showMegaMenu && megaMenuRootItems.length > 0;

  const setActiveRoot = (root: CategoryNode) => {
    setActiveRootCategoryId(root._id);
    setActiveChildCategoryId(
      root.children?.slice(0, MAX_MEGA_MENU_LEVEL_2_ITEMS)[0]?._id ?? null,
    );
  };

  const utilityMenuItems =
    showUtilityMenu && menuItems && menuItems.length > 0 ? menuItems : [];
  // The links only flow with the menu row in "menu" placement; the other
  // placements lift the whole group out into its own slot, where the
  // per-link left/right side no longer applies.
  // The header's OWN custom menu links carry no navPosition — only pages
  // picked under "Selected pages" get an explicit left/right side. They are
  // primary nav, so they always ride beside the collections link and never
  // follow the utility placement, which would strand them at the end of the
  // tags row reading as utility links.
  const customNavMenuItems = utilityMenuItems.filter(
    (item) => !item.navPosition,
  );
  const positionedUtilityItems = utilityMenuItems.filter(
    (item) => item.navPosition,
  );
  const menuRowUtilityItems =
    utilityPlacement === "menu" ? positionedUtilityItems : [];
  const flowingUtilityMenuItems = menuRowUtilityItems.filter(
    (item) => item.navPosition === "left",
  );
  const fixedUtilityMenuItems = menuRowUtilityItems.filter(
    (item) => item.navPosition === "right",
  );
  const hasVisibleCollectionNav = showCollectionsMenu && collections.length > 0;
  const hasVisibleUtilityNav = utilityMenuItems.length > 0;
  const desktopQuickCategoryLimit = getDesktopQuickCategoryLimit(
    [showCategoryMenu, hasVisibleCollectionNav, hasVisibleUtilityNav].filter(
      Boolean,
    ).length,
  );
  const visibleQuickCategoryLimit = Math.min(
    categoryQuickLimit,
    desktopQuickCategoryLimit,
  );
  const navCategories = showCategoryQuickLinks
    ? categories.slice(0, visibleQuickCategoryLimit)
    : [];
  const showBottomNav =
    showCategoryMenu ||
    hasVisibleCollectionNav ||
    navCategories.length > 0 ||
    hasVisibleUtilityNav;
  const isStoreHome = pathname === `/${locale}` || pathname === `/${locale}/`;

  /**
   * Drops the category rail open when a shopper lands on the home page, the way
   * the big marketplaces do — the catalogue is the point of the home page, so
   * making someone hover to see it costs a step.
   *
   * Deliberately fires once per visit rather than tracking `megaMenuOpen`:
   * re-opening a rail the shopper just dismissed would make it undismissable.
   */
  useEffect(() => {
    if (!hasCustomMegaMenu || !categoryTrigger.openOnHome) return;

    if (!isStoreHome) {
      // Re-arm on the way out, so coming back to home opens it again.
      megaAutoOpenedPathRef.current = null;
      return;
    }

    if (megaAutoOpenedPathRef.current === pathname) return;
    // The rail lives in the bottom nav, which only exists from xl up, but Radix
    // portals the panel to the body — opening it below that width would float a
    // detached panel over a layout that has no trigger for it.
    if (!window.matchMedia("(min-width: 1280px)").matches) return;

    megaAutoOpenedPathRef.current = pathname;
    megaAutoOpenedRef.current = true;
    setMegaMenuOpen(true);
  }, [
    hasCustomMegaMenu,
    categoryTrigger.openOnHome,
    isStoreHome,
    pathname,
  ]);

  useEffect(() => {
    if (debouncedSearchQuery.length < 2) {
      return;
    }

    const controller = new AbortController();
    const fetchSuggestions = async () => {
      setIsSearching(true);
      try {
        const params = new URLSearchParams({
          search: debouncedSearchQuery,
          limit: "6",
          page: "1",
          // Suggestions render only name/slug/image — request card fields, not
          // full variant/media-heavy product documents.
          cardFieldsOnly: "true",
        });

        const response = await fetch(`/api/products?${params.toString()}`, {
          signal: controller.signal,
        });
        const result = await response.json();
        const products = Array.isArray(result?.data?.data)
          ? result.data.data
          : [];
        setSearchSuggestions(products);
        setShowSearchSuggestions(true);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setSearchSuggestions([]);
        }
      } finally {
        setIsSearching(false);
      }
    };

    void fetchSuggestions();
    return () => controller.abort("cleanup");
  }, [debouncedSearchQuery]);

  // Publish the sticky header's real height (top row + optional nav row)
  // so store pages can position their own sticky elements below it.
  const stickyWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = stickyWrapperRef.current;
    if (!el) return;
    const root = document.documentElement;
    const update = () => {
      root.style.setProperty(
        "--storefront-header-height",
        `${headerSticky ? el.offsetHeight : 0}px`,
      );
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => {
      observer.disconnect();
      root.style.removeProperty("--storefront-header-height");
    };
  }, [headerSticky]);

  useEffect(() => {
    return () => {
      if (closeSuggestionsTimeoutRef.current) {
        clearTimeout(closeSuggestionsTimeoutRef.current);
      }
      if (categoriesMenuCloseTimeoutRef.current) {
        clearTimeout(categoriesMenuCloseTimeoutRef.current);
      }
      if (megaMenuCloseTimeoutRef.current) {
        clearTimeout(megaMenuCloseTimeoutRef.current);
      }
      if (collectionsMenuCloseTimeoutRef.current) {
        clearTimeout(collectionsMenuCloseTimeoutRef.current);
      }
      if (guestMenuCloseTimeoutRef.current) {
        clearTimeout(guestMenuCloseTimeoutRef.current);
      }
      if (userMenuCloseTimeoutRef.current) {
        clearTimeout(userMenuCloseTimeoutRef.current);
      }
    };
  }, []);

  /** Open/close handlers shared by every search field on the header. */
  const searchFieldFocusProps = {
    onFocus: () => {
      if (closeSuggestionsTimeoutRef.current) {
        clearTimeout(closeSuggestionsTimeoutRef.current);
      }
      if (searchQuery.trim().length >= 2) {
        setShowSearchSuggestions(true);
      }
    },
    onBlur: () => {
      closeSuggestionsTimeoutRef.current = setTimeout(() => {
        setShowSearchSuggestions(false);
      }, 140);
    },
  };

  /**
   * Product suggestions dropdown, shared by the full search bar and the
   * icon pill — only one input-bearing form mounts per template, so the
   * panel renders exactly once.
   */
  const renderSearchSuggestions = (panelClassName: string) =>
    showSearchSuggestions && searchQuery.trim().length >= 2 ? (
      <div
        className={cn(
          "absolute top-full z-[100] mt-2 overflow-hidden rounded-2xl border bg-background shadow-lg",
          panelClassName,
        )}
      >
        <div className="max-h-80 overflow-y-auto p-2">
          {isSearching ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              {t("common.loading")}
            </div>
          ) : searchSuggestions.length > 0 ? (
            <div className="space-y-1">
              {searchSuggestions.map((product) => {
                const label = product.name || product.title || "Product";
                return (
                  <Link
                    key={product._id}
                    href={`/${locale}/products/${product.slug}`}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-muted/60"
                    onClick={() => {
                      setSearchQuery(label);
                      setShowSearchSuggestions(false);
                    }}
                  >
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-muted/40">
                      {product.images?.[0] ? (
                        <AppImage
                          src={product.images[0]}
                          alt={label}
                          className="h-full w-full object-cover"
                          width={40}
                          height={40}
                        />
                      ) : (
                        <div className="h-full w-full bg-muted/60" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{label}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              {t("common.noProductsFound")}
            </div>
          )}
        </div>
        {!isSearching && searchSuggestions.length > 0 && (
          <div className="border-t px-3 py-2 text-xs text-muted-foreground">
            {t("common.pressEnterToSearch")} &quot;{searchQuery}&quot;
          </div>
        )}
      </div>
    ) : null;

  /**
   * The desktop search pill, placed per header template: wide inside the top
   * row (classic/banner-nav), compact on logo-center's left track, or
   * stretched across its own row (nav-top). One closure so the placements
   * can never drift.
   */
  const desktopSearchForm = (placement: "row" | "below" | "compact") => (
    <form
      onSubmit={handleSearch}
      className={cn(
        "relative hidden min-w-0 md:block",
        placement === "row" &&
          cn("flex-1", utilityPlacement !== "search" && "xl:shrink-0"),
        placement === "below" && "w-full flex-1",
        placement === "compact" && "w-64 shrink-0",
      )}
      style={
        placement === "row"
          ? {
              flexBasis: searchDesktopWidth,
              maxWidth: searchDesktopWidth,
              width: "100%",
            }
          : undefined
      }
    >
                  <div className="relative" {...searchFieldFocusProps}>
                    {showSearchCategoryDropdown && categories.length > 0 ? (
                      <div className="absolute left-1.5 top-1/2 z-10 flex -translate-y-1/2 items-center">
                        <select
                          aria-label={
                            t.has("common.allCategories")
                              ? t("common.allCategories")
                              : "All categories"
                          }
                          value={searchCategory}
                          onChange={(event) =>
                            setSearchCategory(event.target.value)
                          }
                          className="h-7 max-w-32 cursor-pointer appearance-none truncate rounded-full bg-muted/60 py-0 pl-3 pr-7 text-xs font-medium text-foreground/80 outline-none transition-colors hover:bg-muted"
                        >
                          <option value="">
                            {t.has("common.allCategories")
                              ? t("common.allCategories")
                              : "All"}
                          </option>
                          {categories.map((category) => (
                            <option key={category._id} value={category.slug}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none -ml-5 h-3 w-3 text-foreground/50" />
                      </div>
                    ) : (
                      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    )}
                    <Input
                      type="search"
                      placeholder={searchPlaceholder}
                      className={cn(
                        "h-10 w-full rounded-full border border-[#dddddd] bg-transparent pr-12 text-sm shadow-none placeholder:opacity-70 focus-visible:border-[#d3d3d3] focus-visible:bg-transparent focus-visible:ring-0 dark:border-white/15 dark:focus-visible:border-white/25",
                        showSearchCategoryDropdown && categories.length > 0
                          ? "pl-[9.75rem]"
                          : "pl-11",
                      )}
                      style={searchInputStyle}
                      value={searchQuery}
                      onChange={(e) => handleSearchQueryChange(e.target.value)}
                    />
                    {showAiSearch && (
                      <button
                        type="button"
                        onClick={handleAISalesAgentOpen}
                        aria-label={t("common.aiSearch")}
                        className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-fuchsia-500 transition-colors hover:text-fuchsia-600"
                      >
                        <Image
                          src="/AI Icon.png"
                          alt="Search"
                          height={24}
                          width={24}
                        />
                      </button>
                    )}
                  </div>
                  {renderSearchSuggestions("left-4 right-4")}
    </form>
  );

  /**
   * The small icon-search pill from the Figma cards (minimal / centered):
   * a slim pill whose dark button submits; the input expands on focus so
   * the compact look never costs the shopper a working search.
   */
  const iconSearchForm = (
    <form onSubmit={handleSearch} className="relative hidden shrink-0 xl:block">
      <div
        {...searchFieldFocusProps}
        className="flex h-10 w-28 items-center rounded-full border border-[#dddddd] bg-transparent p-1 pl-3 transition-[width] duration-200 focus-within:w-72 dark:border-white/15"
        style={
          activeHeaderColors
            ? {
                backgroundColor: "var(--header-search-bg)",
                color: "var(--header-search-text)",
              }
            : undefined
        }
      >
        <input
          type="search"
          value={searchQuery}
          aria-label={searchPlaceholder}
          onChange={(e) => handleSearchQueryChange(e.target.value)}
          className="w-full min-w-0 flex-1 bg-transparent text-sm outline-none"
        />
        <button
          type="submit"
          aria-label={searchPlaceholder}
          className="grid h-8 w-10 shrink-0 place-items-center rounded-lg bg-foreground text-background transition-opacity hover:opacity-90"
        >
          <Search className="h-4 w-4" />
        </button>
      </div>
      {renderSearchSuggestions("left-auto right-0 w-80 max-w-[85vw]")}
    </form>
  );


  /**
   * One renderer for every plain nav link (utility/pages menu items), shared
   * by the bottom nav row, the inline top-row nav, and the centered nav row
   * so the templates cannot drift apart.
   */
  const renderUtilityLink = (
    item: HeaderMenuItem,
    idx: number,
    keyPrefix: string,
  ) => {
    const isBlog =
      item.label.toLowerCase() === "blog" || item.href.includes("/blog");
    const isTrackOrder =
      item.label.toLowerCase() === "track order" ||
      item.href.includes("/track-order");
    const iconSrc = item.icon;

    return (
      <Link
        key={`${keyPrefix}-${item.href}-${idx}`}
        href={item.href}
        target={item.target}
        rel={item.target === "_blank" ? "noopener noreferrer" : undefined}
        className={`inline-flex shrink-0 items-center gap-2 transition-colors hover:text-primary ${
          pathname === item.href ||
          (item.href !== `/${locale}` && pathname.startsWith(item.href))
            ? "text-foreground"
            : "text-foreground/80"
        }`}
      >
        {iconSrc ? (
          <AppImage
            src={iconSrc}
            alt={item.label}
            width={16}
            height={16}
            className="h-4 w-4 object-contain"
          />
        ) : isTrackOrder ? (
          <Package className="h-4 w-4" />
        ) : isBlog ? (
          <Rss className="h-4 w-4" />
        ) : null}
        <span className="whitespace-nowrap">{item.label}</span>
      </Link>
    );
  };

  /**
   * The collections dropdown. Referenced from several template slots, but
   * only ever mounted in one of them per variant.
   */
  const collectionsNavPopover = (
    <Popover open={collectionsOpen} onOpenChange={setCollectionsOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          onMouseEnter={openCollectionsMenu}
          onMouseLeave={closeCollectionsMenu}
          className="inline-flex shrink-0 items-center gap-1 font-semibold text-foreground transition-colors hover:text-primary"
        >
          {collectionsMenuLabel}
          <ChevronDown className="h-3.5 w-3.5 text-foreground/55" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={10}
        onMouseEnter={openCollectionsMenu}
        onMouseLeave={closeCollectionsMenu}
        className="w-190 overflow-hidden rounded-t-none rounded-b-md border-0 bg-popover p-6 shadow-[0_18px_40px_rgba(15,23,42,0.12)]"
      >
        <div className="grid grid-cols-3 gap-x-8 gap-y-5">
          {collections.map((col) => (
            <Link
              key={col._id}
              href={`/${locale}/collections/${col.slug}`}
              onClick={() => setCollectionsOpen(false)}
              className="group flex items-center gap-3"
            >
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-muted/40">
                {col.image?.url ? (
                  <AppImage
                    src={col.image.url}
                    alt={col.image.alt || col.title}
                    width={56}
                    height={56}
                    className="h-14 w-14 object-cover"
                  />
                ) : (
                  <div className="grid h-full w-full place-items-center text-muted-foreground">
                    <Layers className="h-5 w-5" />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-[15px] font-semibold text-foreground transition-colors group-hover:text-primary">
                  {col.title}
                </p>
                {col.description && (
                  <p className="truncate text-[12px] text-muted-foreground">
                    {col.description}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );

  const quickCategoryLinks =
    showCategoryQuickLinks && categoriesLoading
      ? Array.from({
          length: visibleQuickCategoryLimit,
        }).map((_, idx) => (
          <div
            key={idx}
            className="h-5 w-20 animate-pulse rounded bg-muted/60"
          />
        ))
      : navCategories.map((cat) => (
          <Link
            key={cat._id}
            href={`/${locale}/products?category=${encodeURIComponent(
              cat.slug,
            )}`}
            // shrink-0: a link that doesn't fit is hidden whole by
            // OverflowNav — flex-shrinking it would crush the label away
            // and leave a bare icon.
            className="inline-flex shrink-0 items-center gap-2 text-foreground/80 transition-colors hover:text-primary"
          >
            {cat.icon || cat.image ? (
              <AppImage
                src={(cat.icon || cat.image) as string}
                alt={cat.name}
                className="h-5 w-5 shrink-0 object-contain"
                width={20}
                height={20}
              />
            ) : (
              <Package className="h-4 w-4 shrink-0 text-muted-foreground" />
            )}
            <span className="block max-w-28 truncate lg:max-w-36 xl:max-w-44">
              {cat.name}
            </span>
          </Link>
        ));

  /** Nav links as one flat inline run (top-row nav, centered nav row). */
  const hasInlineNavContent =
    hasVisibleCollectionNav ||
    navCategories.length > 0 ||
    customNavMenuItems.length > 0 ||
    menuRowUtilityItems.length > 0;
  const inlineNavLinks = (
    <>
      {hasVisibleCollectionNav && collectionsNavPopover}
      {customNavMenuItems.map((item, idx) =>
        renderUtilityLink(item, idx, "inline-nav-custom"),
      )}
      {quickCategoryLinks}
      {[...flowingUtilityMenuItems, ...fixedUtilityMenuItems].map((item, idx) =>
        renderUtilityLink(item, idx, "inline-nav"),
      )}
    </>
  );

  /**
   * The utility links as one self-contained group, for the placements that
   * lift them out of the menu row ("search" and "tags"). It always sits at
   * the END of its row's content but INSIDE the row — never to the right of
   * the cart and the other action icons, which stay the header's last word.
   */
  const utilityLinksGroup =
    utilityPlacement !== "menu" && positionedUtilityItems.length > 0 ? (
      <OverflowNav className="hidden shrink-0 items-center gap-6 text-sm xl:flex">
        {positionedUtilityItems.map((item, idx) =>
          renderUtilityLink(item, idx, `utility-${utilityPlacement}`),
        )}
      </OverflowNav>
    ) : null;

  /** The "All Categories" trigger — mega rail or flat popover. */
  const categoryTriggerElement = (
    <>
      {hasCustomMegaMenu && (
        <Popover open={megaMenuOpen} onOpenChange={setMegaMenuOpen}>
          <PopoverTrigger asChild>
            {/* Size, fill, border and corner radius are all merchant
                settings; the rail below reads the same width so the
                two stay one card, and the resolver squares the bottom
                corners while open. */}
            <Button
              {...categoryHoverProps}
              // On the banner-nav strip the merchant-styled fill would blend
              // into the primary background, so the trigger goes ghost there.
              style={isBannerNavVariant ? undefined : megaTriggerLook.style}
              className={cn(
                "justify-between gap-3 px-3.5 text-[13.5px] font-medium",
                isBannerNavVariant
                  ? "h-9 rounded-md border-0 bg-transparent font-semibold text-primary-foreground shadow-none hover:bg-white/10 hover:text-primary-foreground"
                  : megaTriggerLook.className,
                bottomRowKind === "nav" &&
                  categoryMenuPosition === "right" &&
                  "order-3 ml-auto",
              )}
            >
              <span className="inline-flex min-w-0 items-center gap-2.5">
                {categoryTrigger.showIcon ? (
                  <CategoryTriggerGlyph
                    icon={categoryTrigger.icon}
                    className="h-4 w-4 shrink-0"
                  />
                ) : null}
                <span className="truncate">{categoryMenuLabel}</span>
              </span>
              {categoryTrigger.showChevron ? (
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 shrink-0 transition-transform duration-200",
                    megaMenuOpen && "rotate-180",
                  )}
                />
              ) : null}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            sideOffset={2}
            {...categoryHoverProps}
            // An auto-opened rail must not pull focus: nobody asked
            // for it, and landing a keyboard or screen-reader user
            // inside a menu on page load is disorienting. Radix moves
            // focus into the content by default, so opt out for the
            // one open the merchant scheduled rather than the user.
            onOpenAutoFocus={(event) => {
              if (!megaAutoOpenedRef.current) return;
              megaAutoOpenedRef.current = false;
              event.preventDefault();
            }}
            // Width follows the panel: 232px while only the rail is
            // showing, wider once a flyout opens. The rail and flyout
            // carry their own surface and shadow, so the popover
            // itself is just a positioner.
            className="z-[100] w-auto max-w-[calc(100vw-2rem)] border-0 bg-transparent p-0 shadow-none"
          >
            <CustomMegaMenuPanel
              roots={megaMenuRootItems}
              railLabel={categoryMenuLabel}
              viewAllHref={categoriesPageHref}
              viewAllLabel={t("home.viewAllCategories")}
              viewAllShortLabel={t("common.viewAll")}
              railRadius={categoryRailRadius}
              railWidth={categoryTrigger.width}
              onNavigate={() => setMegaMenuOpen(false)}
            />
          </PopoverContent>
        </Popover>
      )}

      {!hasCustomMegaMenu && showCategoryMenu && (
        <Popover open={categoriesOpen} onOpenChange={setCategoriesOpen}>
          <PopoverTrigger asChild>
            {/* Same merchant settings as the mega trigger: this is the
                same "All Categories" button, just without a rail under
                it, so it must not drift into a second look. */}
            <Button
              {...flatCategoryHoverProps}
              style={isBannerNavVariant ? undefined : flatTriggerLook.style}
              className={cn(
                "justify-between",
                isBannerNavVariant
                  ? "h-9 rounded-md border-0 bg-transparent font-semibold text-primary-foreground shadow-none hover:bg-white/10 hover:text-primary-foreground"
                  : flatTriggerLook.className,
                bottomRowKind === "nav" &&
                  categoryMenuPosition === "right" &&
                  "order-3 ml-auto",
              )}
            >
              <span className="inline-flex min-w-0 items-center gap-2">
                {categoryTrigger.showIcon ? (
                  <CategoryTriggerGlyph
                    icon={categoryTrigger.icon}
                    className="h-4 w-4 shrink-0"
                  />
                ) : null}
                <span className="truncate">{categoryMenuLabel}</span>
              </span>
              {categoryTrigger.showChevron ? (
                <ChevronDown className="h-4 w-4 shrink-0 opacity-70" />
              ) : null}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            sideOffset={10}
            {...flatCategoryHoverProps}
            className={cn(
              "z-[100]",
              isFlatCategoryList
                ? "w-75 rounded-t-none rounded-b-2xl border-0 p-2"
                : rootHasNested
                  ? showPromoCards
                    ? "w-275 overflow-hidden rounded-t-none rounded-b-2xl border-0 p-0"
                    : "w-235 overflow-hidden rounded-t-none rounded-b-2xl border-0 p-0"
                  : showPromoCards
                    ? "w-235 overflow-hidden rounded-t-none rounded-b-2xl border-0 p-0"
                    : "w-195 overflow-hidden rounded-t-none rounded-b-2xl border-0 p-0"
            )}
          >
            {isFlatCategoryList ? (
              <div className="space-y-1">
                {categoriesLoading ? (
                  <div className="space-y-2 p-1">
                    {Array.from({ length: 10 }).map((_, idx) => (
                      <div
                        key={idx}
                        className="h-10 w-full rounded-sm bg-muted/60 animate-pulse"
                      />
                    ))}
                  </div>
                ) : categories.length > 0 ? (
                  <>
                    {visibleCategoryRoots.map((root) => (
                      <Link
                        key={root._id}
                        href={`/${locale}/products?category=${encodeURIComponent(
                          root.slug,
                        )}`}
                        onClick={() => setCategoriesOpen(false)}
                        className="flex items-center rounded-md px-3 py-2 text-sm text-foreground/90 hover:bg-muted"
                      >
                        <span className="inline-flex min-w-0 items-center gap-3">
                          <span className="grid h-8 w-8 place-items-center rounded-md bg-muted/40">
                            {root.icon || root.image ? (
                              <AppImage
                                src={(root.icon || root.image) as string}
                                alt={root.name}
                                className="h-8 w-8 rounded-md object-cover"
                                width={32}
                                height={32}
                              />
                            ) : (
                              <Package className="h-4 w-4 text-muted-foreground" />
                            )}
                          </span>
                          <span className="truncate">{root.name}</span>
                        </span>
                      </Link>
                    ))}
                    {hasCategoryOverflow ? (
                      <Link
                        href={categoriesPageHref}
                        onClick={() => setCategoriesOpen(false)}
                        className="mt-1 flex h-10 items-center justify-center gap-2 rounded-md border bg-background px-3 text-sm font-medium text-foreground hover:bg-muted"
                      >
                        View All
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    ) : null}
                  </>
                ) : (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    {t("common.noCategories")}
                  </div>
                )}
              </div>
            ) : (
              <div
                className={`grid ${
                  rootHasNested
                    ? showPromoCards
                      ? "grid-cols-[260px_220px_1fr_340px]"
                      : "grid-cols-[260px_220px_1fr]"
                    : showPromoCards
                      ? "grid-cols-[260px_1fr_340px]"
                      : "grid-cols-[260px_1fr]"
                }`}
              >
                <div className="bg-popover p-3">
                  <div className="space-y-1">
                    {categoriesLoading ? (
                      <div className="space-y-2">
                        {Array.from({ length: 10 }).map((_, idx) => (
                          <div
                            key={idx}
                            className="h-10 w-full rounded-lg bg-muted/60 animate-pulse"
                          />
                        ))}
                      </div>
                    ) : categories.length > 0 ? (
                      <>
                        {visibleCategoryRoots.map((root) => {
                          const isActive = activeRoot?._id === root._id;
                          const hasChildren =
                            (root.children?.length || 0) > 0;
                          return (
                            <Link
                              key={root._id}
                              href={`/${locale}/products?category=${encodeURIComponent(
                                root.slug,
                              )}`}
                              onMouseEnter={() => setActiveRoot(root)}
                              onClick={() => setCategoriesOpen(false)}
                              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] transition-colors ${
                                isActive
                                  ? "bg-muted text-foreground"
                                  : "text-foreground/85 hover:bg-muted/60"
                              }`}
                            >
                              <span className="grid h-5 w-5 shrink-0 place-items-center text-foreground/70">
                                {root.icon || root.image ? (
                                  <AppImage
                                    src={
                                      (root.icon || root.image) as string
                                    }
                                    alt={root.name}
                                    width={20}
                                    height={20}
                                    className="h-5 w-5 object-contain"
                                  />
                                ) : (
                                  <Package className="h-4 w-4" />
                                )}
                              </span>
                              <span className="flex-1 truncate">
                                {root.name}
                              </span>
                              {hasChildren && rootHasNested && (
                                <ChevronDown className="h-3.5 w-3.5 -rotate-90 text-muted-foreground" />
                              )}
                            </Link>
                          );
                        })}
                        {hasCategoryOverflow ? (
                          <Link
                            href={categoriesPageHref}
                            onClick={() => setCategoriesOpen(false)}
                            className="mt-2 flex h-10 items-center justify-center gap-2 rounded-lg border bg-background px-3 text-[13px] font-medium text-foreground hover:bg-muted"
                          >
                            View All
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        ) : null}
                      </>
                    ) : (
                      <div className="px-3 py-2 text-sm text-muted-foreground">
                        {t("common.noCategories")}
                      </div>
                    )}
                  </div>
                </div>

                {rootHasNested && (
                  <div className="bg-popover p-3">
                    <div className="space-y-1">
                      {visibleRootChildren.map((child) => {
                        const isActive = activeChild?._id === child._id;
                        const hasChildren =
                          (child.children?.length || 0) > 0;
                        return (
                          <Link
                            key={child._id}
                            href={`/${locale}/products?category=${encodeURIComponent(
                              child.slug,
                            )}`}
                            onMouseEnter={() =>
                              setActiveChildCategoryId(child._id)
                            }
                            onClick={() => setCategoriesOpen(false)}
                            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] transition-colors ${
                              isActive
                                ? "bg-muted text-foreground"
                                : "text-foreground/85 hover:bg-muted/60"
                            }`}
                          >
                            <span className="grid h-5 w-5 shrink-0 place-items-center text-foreground/70">
                              {child.icon || child.image ? (
                                <AppImage
                                  src={(child.icon || child.image) as string}
                                  alt={child.name}
                                  width={20}
                                  height={20}
                                  className="h-5 w-5 object-contain"
                                />
                              ) : (
                                <Package className="h-4 w-4" />
                              )}
                            </span>
                            <span className="flex-1 truncate">{child.name}</span>
                            {hasChildren && (
                              <ChevronDown className="h-3.5 w-3.5 -rotate-90 text-muted-foreground" />
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="bg-popover px-8 py-6">
                  {megaSource.length > 0 ? (
                    <div className="grid grid-cols-2 gap-x-10 gap-y-3">
                      {megaSource.map((col) => (
                        <Link
                          key={col._id}
                          href={`/${locale}/products?category=${encodeURIComponent(
                            col.slug,
                          )}`}
                          onClick={() => setCategoriesOpen(false)}
                          className="flex items-center gap-2 text-[13px] text-foreground/85 transition-colors hover:text-primary"
                        >
                          {col.icon || col.image ? (
                            <AppImage
                              src={(col.icon || col.image) as string}
                              alt={col.name}
                              width={20}
                              height={20}
                              className="h-5 w-5 shrink-0 object-contain"
                            />
                          ) : (
                            <Package className="h-4 w-4 shrink-0 text-muted-foreground" />
                          )}
                          <span className="truncate">{col.name}</span>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      {t("common.selectCategory")}
                    </div>
                  )}
                </div>

                {showPromoCards && (
                  <div className="bg-popover p-4">
                    <Link
                      href={categoryPromoHref}
                      className="group relative flex h-full flex-col overflow-hidden rounded-2xl bg-linear-to-br from-[#eceaf6] via-[#f1ecf6] to-[#dfd6ef] p-5"
                    >
                      {categoryPromoTitle ? (
                        <div className="text-[15px] font-semibold leading-tight text-foreground">
                          {categoryPromoTitle}
                        </div>
                      ) : null}
                      {categoryPromoSubtitle ? (
                        <div className="mt-1 inline-flex items-center gap-1 text-[13px] text-foreground/75">
                          {categoryPromoSubtitle}
                          <Sparkles className="h-3.5 w-3.5 text-fuchsia-500" />
                        </div>
                      ) : null}
                      {categoryPromoImageSrc ? (
                        <div className="relative mt-auto flex h-40 items-end justify-center pt-4">
                          <AppImage
                            src={categoryPromoImageSrc}
                            width={220}
                            height={220}
                            alt={categoryPromoTitle || "Header promo"}
                            aria-hidden="true"
                            className="h-full w-auto object-contain transition-transform duration-300 group-hover:scale-105"
                            loading="lazy"
                          />
                        </div>
                      ) : null}
                    </Link>
                  </div>
                )}
              </div>
            )}
          </PopoverContent>
        </Popover>
      )}
    </>
  );

  /**
   * The full nav row (classic and banner-nav): trigger | flowing links |
   * fixed right group. Rendered inside the container (classic) or on the
   * full-bleed primary strip (banner-nav).
   */
  const navRowContent = (
    <>
      {categoryTriggerElement}

      {/* Quick category nav */}
      <OverflowNav className="flex min-w-0 flex-1 items-center gap-7 text-sm">
        {hasVisibleCollectionNav &&
          collectionsMenuPosition === "left" &&
          collectionsNavPopover}
        {customNavMenuItems.map((item, idx) =>
          renderUtilityLink(item, idx, "nav-custom"),
        )}
        {quickCategoryLinks}
        {flowingUtilityMenuItems.map((item, idx) =>
          renderUtilityLink(item, idx, "nav"),
        )}
      </OverflowNav>

      {fixedUtilityMenuItems.length > 0 ||
      (showCollectionsMenu &&
        collectionsMenuPosition === "right" &&
        collections.length > 0) ? (
        <div className="ml-auto flex shrink-0 items-center gap-6 text-sm">
          {showCollectionsMenu &&
          collectionsMenuPosition === "right" &&
          collections.length > 0 ? (
            <Link
              href={`/${locale}/collections`}
              className="inline-flex shrink-0 items-center gap-2 font-semibold text-foreground transition-colors hover:text-primary"
            >
              <Layers className="h-4 w-4" />
              <span className="whitespace-nowrap">
                {collectionsMenuLabel}
              </span>
            </Link>
          ) : null}
          {fixedUtilityMenuItems.map((item, idx) =>
            renderUtilityLink(item, idx, "fixed-nav"),
          )}
        </div>
      ) : null}
    </>
  );

  return (
    <>
      <div
        ref={stickyWrapperRef}
        data-sticky-header
        className={`${headerSticky ? "sticky top-0" : "relative"} z-50 w-full`}
      >
        <header
          className={cn(
            "w-full [&_button]:cursor-pointer",
            headerTransparent
              ? "border-b border-border/40 bg-background/70 backdrop-blur-md supports-[backdrop-filter]:bg-background/60"
              : "bg-background shadow-[0_2px_10px_rgba(15,23,42,0.06)] dark:shadow-[0_2px_10px_rgba(0,0,0,0.35)]",
          )}
          style={headerThemeStyle}
        >
          <div className={headerContainerClass}>
            {/* Top row, arranged per template. "centered" and "logo-center"
                turn it into a 3-track grid at xl with the logo on the middle
                track; the others stay a flex row. */}
            <div
              className={cn(
                "flex items-center gap-4 py-3 xl:gap-6",
                (isCenteredVariant || isLogoCenterVariant) &&
                  "xl:grid xl:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]",
              )}
            >
              <div
                className={cn(
                  "flex min-w-0 flex-1 items-center md:flex-none xl:flex-1",
                  // With the utility group sharing this row the brand mark
                  // sizes to its content and never gives way — `flex-1` has
                  // a zero basis, so the logo would otherwise collapse to
                  // nothing before the search bar yielded a pixel.
                  utilityPlacement === "search" && "xl:flex-none",
                  (isCenteredVariant || isLogoCenterVariant) &&
                    "xl:col-start-2 xl:row-start-1 xl:flex-none xl:justify-self-center",
                )}
              >
                <Link
                  href={`/${locale}`}
                  className="flex shrink-0 items-center gap-2"
                >
                  {currentLogoUrl ? (
                    <span
                      className="relative block h-8 w-[var(--header-logo-mobile-width)] overflow-hidden sm:w-[var(--header-logo-desktop-width)]"
                      style={
                        {
                          "--header-logo-mobile-width": `${mobileLogoWidth}px`,
                          "--header-logo-desktop-width": `${desktopLogoWidth}px`,
                        } as CSSProperties
                      }
                    >
                      <AppImage
                        src={currentLogoUrl}
                        alt={headerLogoAlt || storeName || "Logo"}
                        className="h-8 w-full object-contain object-left"
                        width={144}
                        height={32}
                        priority
                      />
                    </span>
                  ) : (
                    <>
                      <Store className="h-6 w-6 text-primary" />
                      <span className="truncate text-xl font-bold">
                        {typeof storeName === "string" && storeName.trim()
                          ? storeName
                          : appConfig.name}
                      </span>
                    </>
                  )}
                </Link>
              </div>

              {/* No location control in the header, on any breakpoint:
                  location is a listing filter, not a global context, so it
                  lives with the filters on the pages it narrows — the
                  sidebar/sheet groups on /products and vendor stores, a pill
                  above the category and pre-order grids. */}

              {/* Inline nav links (minimal / nav-top templates, and the
                  left track of "centered") */}
              {navInTopRow && hasInlineNavContent && !hideNavigation && (
                <OverflowNav
                  className={cn(
                    "hidden min-w-0 flex-1 items-center gap-6 text-sm xl:flex",
                    // No justify-self here: the item must fill (and hide
                    // overflow within) its grid track, not size to content.
                    isCenteredVariant && "xl:col-start-1 xl:row-start-1",
                  )}
                >
                  {inlineNavLinks}
                </OverflowNav>
              )}

              {/* Pill search bar (tablet / desktop), sized per template:
                  wide for classic/banner-nav, compact for minimal, on the
                  left track for logo-center. nav-top and centered place
                  theirs elsewhere. */}
              {showSearch &&
                (headerVariant === "classic" || isBannerNavVariant) &&
                desktopSearchForm("row")}
              {showSearch && isMinimalVariant && iconSearchForm}
              {showSearch && isLogoCenterVariant && (
                <div className="flex min-w-0 items-center gap-6 xl:col-start-1 xl:row-start-1 xl:justify-self-start">
                  {desktopSearchForm("compact")}
                  {/* logo-center's search owns the left grid track, so the
                      group rides inside it rather than becoming a 4th
                      column the 3-track grid has no room for. */}
                  {utilityPlacement === "search" ? utilityLinksGroup : null}
                </div>
              )}

              {/* "search" placement: the links sit right after the search
                  bar, still ahead of the action icons. nav-top's bar lives
                  on the row below, so its group goes there; the two
                  centered templates carry theirs inside a grid track. */}
              {utilityPlacement === "search" &&
              !isNavTopVariant &&
              !isCenteredVariant &&
              !isLogoCenterVariant
                ? utilityLinksGroup
                : null}

              {/* Right widgets cluster */}
              <div
                className={cn(
                  "flex flex-1 shrink-0 items-center justify-end gap-4 md:flex-none xl:flex-1 xl:[gap:var(--header-actions-gap,1.5rem)]",
                  (isCenteredVariant || isLogoCenterVariant) &&
                    "xl:col-start-3 xl:row-start-1 xl:flex-none",
                )}
                style={
                  { "--header-actions-gap": `${actionsGap}px` } as CSSProperties
                }
              >
                {/* "centered" keeps its search compact, beside the actions.
                    Its utility group joins the same track, ahead of every
                    action icon. */}
                {utilityPlacement === "search" && isCenteredVariant
                  ? utilityLinksGroup
                  : null}
                {showSearch && isCenteredVariant && iconSearchForm}

                {/* Mode & Branch Pills */}
                <div className="hidden lg:flex items-center gap-2 mr-2">
                  {wholesaleEnabled && <HeaderModePill />}
                  {multiBranchEnabled && <BranchSelectorPill />}
                </div>

                {/* Theme toggle */}
                {showThemeToggle && (
                  <button
                    type="button"
                    onClick={handleThemeToggle}
                    aria-label={
                      isDark
                        ? t("common.switchToLightMode")
                        : t("common.switchToDarkMode")
                    }
                    className={cn(
                      "hidden text-foreground/80 transition-colors hover:text-primary",
                      showActionLabels
                        ? "xl:flex xl:flex-col xl:items-center xl:gap-1"
                        : "h-9 w-9 place-items-center rounded-full xl:grid",
                    )}
                  >
                    {isDark ? (
                      <Sun className="h-5 w-5" />
                    ) : (
                      <Moon className="h-5 w-5" />
                    )}
                    {showActionLabels && (
                      <span className="text-[10px] font-medium leading-none">
                        {t.has("common.theme") ? t("common.theme") : "Theme"}
                      </span>
                    )}
                  </button>
                )}

                {/* Contact shortcut (Action Group's "Contact" chip) */}
                {showContactButton && (
                  <Link
                    href={`/${locale}/contact`}
                    aria-label={
                      t.has("nav.contact") ? t("nav.contact") : "Contact"
                    }
                    className={cn(
                      "hidden text-foreground/80 transition-colors hover:text-primary",
                      showActionLabels
                        ? "xl:flex xl:flex-col xl:items-center xl:gap-1"
                        : "h-9 w-9 place-items-center rounded-full xl:grid",
                    )}
                  >
                    <Phone className="h-5 w-5" />
                    {showActionLabels && (
                      <span className="text-[10px] font-medium leading-none">
                        {t.has("nav.contact") ? t("nav.contact") : "Contact"}
                      </span>
                    )}
                  </Link>
                )}

                {/* Compare shortcut (Action Group's "Compare" chip) */}
                {showCompareButton && (
                  <Link
                    href={`/${locale}/compare`}
                    aria-label={
                      t.has("nav.compare") ? t("nav.compare") : "Compare"
                    }
                    className={cn(
                      "hidden text-foreground/80 transition-colors hover:text-primary",
                      showActionLabels
                        ? "xl:flex xl:flex-col xl:items-center xl:gap-1"
                        : "h-9 w-9 place-items-center rounded-full xl:grid",
                    )}
                  >
                    <ArrowLeftRight className="h-5 w-5" />
                    {showActionLabels && (
                      <span className="text-[10px] font-medium leading-none">
                        {t.has("nav.compare") ? t("nav.compare") : "Compare"}
                      </span>
                    )}
                  </Link>
                )}

                {/* Currency & Country selector */}
                {showMarketSelector && (
                  <div className="flex items-center gap-2">
                    <div className="relative flex items-center">
                      {showLanguageSelector && <LanguageSwitcher detectedCountry={detectedCountry} className="h-9 hover:bg-accent/50 hover:text-accent-foreground rounded-md transition-colors" />}
                      {showCurrencySelector && <CurrencySwitcher className="h-9 hover:bg-accent/50 hover:text-accent-foreground rounded-md transition-colors" />}
                    </div>
                  </div>
                )}

                {/* User / auth */}
                {showAccountMenu && (isLoading || !mounted ? (
                  <div className="hidden h-9 w-24 animate-pulse rounded-md bg-muted xl:block" />
                ) : isAuthenticated && user ? (
                  <div className="flex items-center gap-3">
                    <DropdownMenu
                      open={isUserMenuOpen}
                      onOpenChange={setIsUserMenuOpen}
                      modal={false}
                    >
                      <div
                        className="hidden xl:block"
                        onMouseEnter={openUserMenu}
                        onMouseLeave={closeUserMenu}
                      >
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className="flex items-center gap-2 text-left hover:opacity-80 transition-opacity"
                            onClick={openUserMenu}
                          >
                            <Avatar className="h-9 w-9 border border-border shadow-sm">
                              <AvatarImage
                                src={user.image || undefined}
                                alt={user.name}
                                referrerPolicy="no-referrer"
                              />
                              <AvatarFallback className="bg-primary/10 text-primary font-medium">
                                {getInitials(user.name)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="hidden flex-col gap-[2px] leading-none xl:flex">
                              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                                {t("common.welcome")}
                              </span>
                              <span className="inline-flex items-center gap-1 text-[13px] font-semibold leading-none tracking-tight">
                                <span className="max-w-[100px] truncate">
                                  {user.name}
                                </span>
                                <ChevronDown className="h-3.5 w-3.5 text-foreground/50" />
                              </span>
                            </span>
                          </button>
                        </DropdownMenuTrigger>
                      </div>
                      <DropdownMenuContent
                        align="end"
                        side="bottom"
                        sideOffset={10}
                        className="w-[280px] rounded-[24px] border border-border/50 bg-background/95 p-0 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] backdrop-blur-xl dark:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)]"
                        onMouseEnter={openUserMenu}
                        onMouseLeave={closeUserMenu}
                      >
                        <div className="p-4 border-b border-border/40 bg-muted/30 rounded-t-[24px]">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 border border-background shadow-sm">
                              <AvatarImage src={user.image || undefined} />
                              <AvatarFallback className="bg-primary/10 text-primary">
                                {getInitials(user.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="font-semibold text-[14px] leading-tight">{user.name}</span>
                              <span className="text-[12px] text-muted-foreground truncate max-w-[180px]">
                                {user.email}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="p-3">
                          {getDashboardLink() ? (
                            <div className="space-y-1">
                              <DropdownMenuItem asChild className="h-10 rounded-xl px-3 cursor-pointer">
                                <Link href={getDashboardLink()!}>
                                  <LayoutDashboard className="mr-3 h-4 w-4 text-muted-foreground" />
                                  <span className="font-medium">{t("common.dashboard")}</span>
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild className="h-10 rounded-xl px-3 cursor-pointer">
                                <Link href={getSettingsLink()}>
                                  <Settings className="mr-3 h-4 w-4 text-muted-foreground" />
                                  <span className="font-medium">{t("admin.settings.title")}</span>
                                </Link>
                              </DropdownMenuItem>
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 gap-2">
                              <Link href={`/${locale}/account`} className="flex flex-col items-center justify-center gap-2 rounded-xl p-3 hover:bg-accent transition-colors border border-transparent hover:border-border/50">
                                <User className="h-5 w-5 text-primary" />
                                <span className="text-[12px] font-medium">{t("common.account")}</span>
                              </Link>
                              <Link href={`/${locale}/account/orders`} className="flex flex-col items-center justify-center gap-2 rounded-xl p-3 hover:bg-accent transition-colors border border-transparent hover:border-border/50">
                                <Package className="h-5 w-5 text-primary" />
                                <span className="text-[12px] font-medium">{t("orders.myOrders")}</span>
                              </Link>
                              {showWishlist && (
                                <Link href={`/${locale}/account/wishlist`} className="flex flex-col items-center justify-center gap-2 rounded-xl p-3 hover:bg-accent transition-colors border border-transparent hover:border-border/50 relative">
                                  <Heart className="h-5 w-5 text-primary" />
                                  <span className="text-[12px] font-medium">{t("nav.wishlist") || "Wishlist"}</span>
                                  {wishlistItems.length > 0 && (
                                    <Badge variant="destructive" className="absolute top-2 right-2 h-4 min-w-4 px-1 text-[9px] flex items-center justify-center">
                                      {wishlistItems.length}
                                    </Badge>
                                  )}
                                </Link>
                              )}
                              <Link href={`/${locale}/account/profile`} className="flex flex-col items-center justify-center gap-2 rounded-xl p-3 hover:bg-accent transition-colors border border-transparent hover:border-border/50">
                                <Settings className="h-5 w-5 text-primary" />
                                <span className="text-[12px] font-medium">{t("common.profile") || "Profile"}</span>
                              </Link>
                            </div>
                          )}
                        </div>
                        
                        <div className="p-3 border-t border-border/40">
                          <button
                            onClick={handleLogout}
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-destructive/10 text-destructive h-10 font-semibold hover:bg-destructive/20 transition-colors"
                          >
                            <LogOut className="h-4 w-4" />
                            {t("common.logout")}
                          </button>
                        </div>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ) : (
                  <DropdownMenu
                    open={isGuestMenuOpen}
                    onOpenChange={setIsGuestMenuOpen}
                    modal={false}
                  >
                    <div
                      className="hidden xl:block"
                      onMouseEnter={openGuestMenu}
                      onMouseLeave={closeGuestMenu}
                    >
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className="flex items-center gap-2 text-left leading-none hover:opacity-80 transition-opacity"
                          onClick={openGuestMenu}
                        >
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-accent-foreground border border-border">
                            <User className="h-5 w-5" />
                          </div>
                          <span className="flex flex-col gap-[2px]">
                            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                              {t("common.welcome")}
                            </span>
                            <span className="inline-flex items-center gap-1 whitespace-nowrap text-[13px] font-semibold leading-none tracking-tight">
                              <span>
                                {t("common.login")} / {t("common.register")}
                              </span>
                              <ChevronDown className="h-3.5 w-3.5 text-foreground/50" />
                            </span>
                          </span>
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        side="bottom"
                        sideOffset={10}
                        className="w-[320px] rounded-[24px] border border-border/50 bg-background/95 p-0 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] backdrop-blur-xl dark:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)]"
                        onMouseEnter={openGuestMenu}
                        onMouseLeave={closeGuestMenu}
                      >
                        <div className="p-6">
                          <div className="flex flex-col items-center text-center mb-5">
                            <h3 className="text-lg font-bold mb-1">Welcome to {storeName}</h3>
                            <p className="text-xs text-muted-foreground mb-4">Sign in to enjoy exclusive benefits, track orders, and more.</p>
                            
                            <Link
                              href={buildLoginUrl(locale, pathname)}
                              onClick={(e) => {
                                if (authUI?.popupEnabled) {
                                  e.preventDefault();
                                  setAuthPopupView("login");
                                  setIsAuthPopupOpen(true);
                                }
                                setIsGuestMenuOpen(false);
                              }}
                              className="flex h-11 w-full items-center justify-center rounded-full bg-primary text-[15px] font-bold text-primary-foreground hover:bg-primary/90 hover:scale-[1.02] transition-all shadow-md hover:shadow-lg"
                            >
                              {t("common.signIn")}
                            </Link>
                            
                            <div className="mt-4 flex items-center gap-1.5 text-[13px]">
                              <span className="text-muted-foreground">New to {storeName}?</span>
                              <Link
                                href={`/${locale}/register`}
                                onClick={(e) => {
                                  if (authUI?.popupEnabled) {
                                    e.preventDefault();
                                    setAuthPopupView("register");
                                    setIsAuthPopupOpen(true);
                                  }
                                  setIsGuestMenuOpen(false);
                                }}
                                className="font-bold text-primary hover:underline"
                              >
                                {t("common.register")}
                              </Link>
                            </div>
                          </div>
                          
                          <div className="border-t border-border/40 -mx-6 mb-4" />
                          
                          <div className="grid grid-cols-2 gap-2">
                            <Link
                              href={buildLoginUrl(locale, `/${locale}/account`)}
                              className="flex flex-col items-center justify-center gap-2 rounded-xl p-3 hover:bg-accent transition-colors border border-transparent hover:border-border/50 group"
                            >
                              <LayoutDashboard className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                              <span className="text-[12px] font-medium">{t("common.dashboard")}</span>
                            </Link>
                            <Link
                              href={buildLoginUrl(locale, `/${locale}/account/orders`)}
                              className="flex flex-col items-center justify-center gap-2 rounded-xl p-3 hover:bg-accent transition-colors border border-transparent hover:border-border/50 group"
                            >
                              <Package className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                              <span className="text-[12px] font-medium">{t("common.myOrders")}</span>
                            </Link>
                            {showWishlist && (
                              <Link
                                href={buildLoginUrl(locale, `/${locale}/account/wishlist`)}
                                className="flex flex-col items-center justify-center gap-2 rounded-xl p-3 hover:bg-accent transition-colors border border-transparent hover:border-border/50 group"
                              >
                                <Heart className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                <span className="text-[12px] font-medium">{t("nav.wishlist")}</span>
                              </Link>
                            )}
                            <Link
                              href={buildLoginUrl(locale, `/${locale}/account/profile`)}
                              className="flex flex-col items-center justify-center gap-2 rounded-xl p-3 hover:bg-accent transition-colors border border-transparent hover:border-border/50 group"
                            >
                              <User className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                              <span className="text-[12px] font-medium">{t("common.profile")}</span>
                            </Link>
                          </div>
                        </div>
                      </DropdownMenuContent>
                    </div>
                  </DropdownMenu>
                ))}

                {/* Cart. Below xl this is the storefront's only cart entry
                    point — it took over the slot the hamburger used to hold,
                    and the bottom nav trades its Cart tab for Menu — so it
                    renders there regardless of the header widget setting.
                    From xl up it still follows `showCart`. */}
                <>
                  <button
                    type="button"
                    onClick={() => setIsCartOpen(true)}
                    className={cn(
                      "relative grid h-9 w-9 place-items-center text-foreground/90 transition-colors hover:text-primary",
                      showActionLabels &&
                        "xl:flex xl:h-auto xl:w-auto xl:flex-col xl:items-center xl:gap-1",
                      !showCart && "xl:hidden",
                    )}
                    aria-label={t("common.openCart")}
                  >
                    <ShoppingCart className="h-5 w-5" />
                    {showActionLabels && (
                      <span className="hidden text-[10px] font-medium leading-none xl:block">
                        {t("common.cart")}
                      </span>
                    )}
                    {totalItems > 0 && (
                      <span className="absolute -top-1 -right-1 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-none text-primary-foreground shadow">
                        {totalItems > 99 ? "99+" : totalItems}
                      </span>
                    )}
                  </button>
                  <CartDrawer
                    open={isCartOpen}
                    onOpenChange={setIsCartOpen}
                    locale={locale}
                  />
                </>

                {/* Mobile menu drawer. Its trigger lives in the bottom nav
                    now, so this only renders the drawer itself. */}
                <MobileMenuSheet
                  locale={locale}
                  isOpen={isOpen}
                  setIsOpen={setIsOpen}
                  closeMobileMenu={closeMobileMenu}
                  categories={categories}
                  collections={collections}
                  brandName={
                    typeof storeName === "string" && storeName.trim()
                      ? storeName
                      : appConfig.name
                  }
                  brandLogoUrl={currentLogoUrl}
                  showMobileMarketSelectors={showMobileMarketSelectors}
                  showMobileThemeSelector={showMobileThemeSelector}
                  showMobileCollections={showMobileCollections}
                  showMobileAccountSummary={showMobileAccountSummary}
                  showMobileCategoryShortcuts={showMobileCategoryShortcuts}
                  showLanguageSelector={showLanguageSelector}
                  showCurrencySelector={showCurrencySelector}
                  showCollectionsMenu={showCollectionsMenu}
                  showUtilityMenu={showUtilityMenu}
                  showAccountMenu={showAccountMenu}
                  categoryMenuLabel={categoryMenuLabel}
                  collectionsMenuLabel={collectionsMenuLabel}
                  categoriesPageHref={categoriesPageHref}
                  getDashboardLink={getDashboardLink}
                  getSettingsLink={getSettingsLink}
                  handleLogout={handleLogout}
                  handleMobileLanguageChange={handleMobileLanguageChange}
                  handleThemeChange={handleThemeChange}
                  menuItems={menuItems}
                  mobileMenuItems={mobileMenuItems}
                  megaMenuRootItems={megaMenuRootItems}
                  hasCustomMegaMenu={hasCustomMegaMenu}
                  categoryMobileLimit={categoryMobileLimit}
                  collectionsLimit={collectionsLimit}
                  megaMenuRootLimit={MAX_MEGA_MENU_ROOT_ITEMS}
                />
              </div>
            </div>

            {/* Mobile search row. The pill above appears only from `md`, which
                left phones with no search affordance at all — it was reachable
                only by opening the hamburger. Submits through the same handler,
                so results and the AI trigger behave identically. */}
            {showSearch && showMobileSearch && (
              <form onSubmit={handleSearch} className="pb-3 md:hidden">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder={searchPlaceholder}
                    className="h-10 w-full rounded-full border border-[#dddddd] bg-transparent pl-11 pr-12 text-sm shadow-none placeholder:opacity-70 focus-visible:border-[#d3d3d3] focus-visible:bg-transparent focus-visible:ring-0 dark:border-white/15 dark:focus-visible:border-white/25"
                    style={searchInputStyle}
                    value={searchQuery}
                    onChange={(e) => handleSearchQueryChange(e.target.value)}
                  />
                  {showAiSearch && (
                    <button
                      type="button"
                      onClick={handleAISalesAgentOpen}
                      aria-label={t("common.aiSearch")}
                      className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-fuchsia-500 transition-colors hover:text-fuchsia-600"
                    >
                      <Image
                        src="/AI Icon.png"
                        alt=""
                        height={24}
                        width={24}
                      />
                    </button>
                  )}
                </div>
              </form>
            )}

            {/* nav-top: categories trigger + full-width search bar on row 2 */}
            {bottomRowKind === "search" && (showSearch || showCategoryMenu) && (
              <div className="hidden items-center gap-4 pb-3 md:flex">
                <div className="hidden shrink-0 xl:block">
                  {categoryTriggerElement}
                </div>
                {showSearch && desktopSearchForm("below")}
                {utilityPlacement === "search" ? utilityLinksGroup : null}
              </div>
            )}

            {/* logo-center: the nav links centered on their own row */}
            {bottomRowKind === "centered-nav" && hasInlineNavContent && !hideNavigation && (
              <OverflowNav className="hidden items-center justify-center gap-7 pb-3 text-sm xl:flex">
                {inlineNavLinks}
              </OverflowNav>
            )}

            {/* classic: categories button | quick-nav | utility links */}
            {bottomRowKind === "nav" && !isBannerNavVariant && showBottomNav && !hideNavigation && (
              <div className="hidden items-center gap-6 pb-3 xl:flex">
                {navRowContent}
              </div>
            )}
          </div>

          {/* banner-nav: the same nav row on a full-bleed primary strip */}
          {bottomRowKind === "nav" && isBannerNavVariant && showBottomNav && !hideNavigation && (
            <div
              className="hidden bg-primary text-primary-foreground xl:block"
              style={
                {
                  "--foreground": "var(--primary-foreground)",
                  "--muted-foreground": "var(--primary-foreground)",
                } as CSSProperties
              }
            >
              <div className={headerContainerClass}>
                <div className="flex items-center gap-6 py-2">
                  {navRowContent}
                </div>
              </div>
            </div>
          )}

          {/* "tags" placement, with no top-tags row to join: the group gets
              its own bottom strip. When the top-tags section IS rendering,
              it draws these links on its own row (the Figma layout) and a
              globals.css `:has()` rule hides this one — same mechanism the
              tag row already uses to take over the header's shadow. */}
          {utilityPlacement === "tags" && utilityLinksGroup ? (
            <div data-header-utility-strip className="border-t border-black/5">
              <div className={headerContainerClass}>
                <div className="flex items-center justify-end py-2">
                  {utilityLinksGroup}
                </div>
              </div>
            </div>
          ) : null}
        </header>
      </div>

      <ModernAuthPopup 
        isOpen={isAuthPopupOpen}
        onOpenChange={setIsAuthPopupOpen}
        locale={locale}
        theme={(authUI?.theme as AuthTheme) || "split"}
        defaultView={authPopupView}
        storeName={storeName}
        logoUrl={authUI?.logoUrl || logoUrl || undefined}
        backgroundImageUrl={authUI?.backgroundImageUrl || undefined}
        sideImageUrl={authUI?.sideImageUrl || authUI?.coverImage || undefined}
        heading={authUI?.heading || undefined}
        subheading={authUI?.subheading || undefined}
        oauthEnabled={{ google: false, facebook: false }}
      />
    </>
  );
}
