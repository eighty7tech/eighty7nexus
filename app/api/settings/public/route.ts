import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { connectDB } from "@/lib/db";
import { getSettings } from "@/models/settings.model";
import {
  resolveAnalyticsConfig,
  resolveOAuthCredentials,
  resolveIotecCredentials,
  resolvePayPalCredentials,
  resolvePaystackCredentials,
  resolvePesapalCredentials,
  resolveRazorpayCredentials,
  resolveStripeCredentials,
} from "@/lib/credentials";
import { isPesapalCurrency } from "@/lib/pesapal";
import {
  getDefaultHomePageSettings,
  normalizeHomePageSettings,
} from "@/lib/home-page-config";
import { normalizeHeaderSettings } from "@/lib/header-config";
import { normalizeFooterSettings } from "@/lib/footer-config";
import { normalizeCheckoutSettings } from "@/lib/checkout-config";
import { normalizeContentPagesSettings } from "@/lib/content-pages-config";
import { resolveShareSettings } from "@/lib/share-config";
import {
  DEFAULT_ACCENT_COLOR,
  DEFAULT_CURRENCY,
  DEFAULT_LANGUAGE,
  DEFAULT_PRESET_COLOR,
  DEFAULT_PRIMARY_COLOR,
  DEFAULT_SECONDARY_COLOR,
  DEFAULT_STORE_NAME,
  DEFAULT_TIMEZONE,
  normalizeThemeMode,
  resolveFaviconUrl,
} from "@/config/branding.config";
import { CACHE_TAGS } from "@/lib/cache-invalidation";
import { isDemoModeEnabled } from "@/lib/demo-mode";
import { API_CACHE_CONTROL } from "@/lib/http-cache-policy";
import {
  DEFAULT_FREE_SHIPPING_THRESHOLD,
  DEFAULT_ORDER_SHIPPING_COST,
  DEFAULT_ORDER_TAX_RATE,
} from "@/lib/order-settings";
import { isCurrentSmtpConfigurationVerified } from "@/lib/smtp-verification";
import { normalizeCountryAvailability } from "@/lib/country-availability";

const getPublicSettingsPayload = unstable_cache(
  async () => {
    await connectDB();

    const settings = await getSettings();
    const header = normalizeHeaderSettings(settings.header);
    const footer = normalizeFooterSettings(settings.footer);
    const checkout = normalizeCheckoutSettings(settings.checkout);

    // Resolve credentials from two sources (DB wins, .env is the fallback).
    const oauth = resolveOAuthCredentials(settings.security);
    const stripeCreds = resolveStripeCredentials(settings.payment?.stripe);
    const paypalCreds = resolvePayPalCredentials(settings.payment?.paypal);
    const razorpayCreds = resolveRazorpayCredentials(settings.payment?.razorpay);
    const paystackCreds = resolvePaystackCredentials(settings.payment?.paystack);
    const pesapalCreds = resolvePesapalCredentials(settings.payment?.pesapal);
    const iotecCreds = resolveIotecCredentials(settings.payment?.iotec);
    const analytics = resolveAnalyticsConfig(settings.analytics);

    const googleOAuthConfigured = Boolean(
      oauth.google.clientId && oauth.google.clientSecret,
    );
    const facebookOAuthConfigured = Boolean(
      oauth.facebook.appId && oauth.facebook.appSecret,
    );

    // Return only public settings (no secrets, credentials)
    return {
      success: true,
      data: {
        storeName: settings.general?.storeName?.trim() || DEFAULT_STORE_NAME,
        storeDescription: settings.general?.storeDescription,
        storeEmail: settings.general?.storeEmail,
        storePhone: settings.general?.storePhone,
        storeAddress: settings.general?.storeAddress,
        defaultLanguage: settings.general?.defaultLanguage || DEFAULT_LANGUAGE,
        supportedLanguages: Array.isArray(settings.general?.supportedLanguages)
          ? settings.general.supportedLanguages
          : [],
        defaultCurrency: settings.general?.defaultCurrency || DEFAULT_CURRENCY,
        supportedCurrencies: Array.isArray(settings.general?.supportedCurrencies)
          ? settings.general.supportedCurrencies
          : [],
        countryAvailability: normalizeCountryAvailability(
          settings.general?.countryAvailability,
        ),
        // Drives the login page's demo-credentials card. Env-derived, so it is
        // constant for the life of the deployment and safe to cache alongside
        // the DB settings.
        demoMode: isDemoModeEnabled(),
        multiVendorMode: {
          enabled: Boolean(settings.multiVendorMode?.enabled),
          canManageProducts: Boolean(settings.multiVendorMode?.canManageProducts),
          canViewOrders: Boolean(settings.multiVendorMode?.canViewOrders),
          canManageOrders: Boolean(settings.multiVendorMode?.canManageOrders),
          canManageStoreSettings: Boolean(
            settings.multiVendorMode?.canManageStoreSettings,
          ),
          canViewAnalytics: Boolean(settings.multiVendorMode?.canViewAnalytics),
          canManageDiscounts: Boolean(
            settings.multiVendorMode?.canManageDiscounts,
          ),
          canManagePayouts: Boolean(settings.multiVendorMode?.canManagePayouts),
          canAccessPOS: Boolean(settings.multiVendorMode?.canAccessPOS),
        },
        logoUrl: settings.general?.logoUrl,
        darkModeLogoUrl: settings.general?.darkModeLogoUrl,
        faviconUrl: resolveFaviconUrl(settings.general?.faviconUrl),
        disableDecimals: settings.general?.disableDecimals || false,
        deliveryInformation: settings.general?.deliveryInformation,
        paymentIcons:
          footer.paymentMethods.showOnProductPage &&
          footer.paymentMethods.enabled
            ? footer.paymentMethods.imageUrls
            : [],
        timezone: settings.general?.timezone || DEFAULT_TIMEZONE,

        // Appearance
        appearance: {
          primaryColor:
            settings.appearance?.primaryColor || DEFAULT_PRIMARY_COLOR,
          secondaryColor:
            settings.appearance?.secondaryColor || DEFAULT_SECONDARY_COLOR,
          accentColor: settings.appearance?.accentColor || DEFAULT_ACCENT_COLOR,
          theme: normalizeThemeMode(settings.appearance?.theme),
          contrast: settings.appearance?.contrast || false,
          rtl: settings.appearance?.rtl || false,
          collapsedSidebar: settings.appearance?.collapsedSidebar || false,
          navLayout: settings.appearance?.navLayout || "mini",
          navColor: settings.appearance?.navColor || "integrate",
          presetColor: settings.appearance?.presetColor || DEFAULT_PRESET_COLOR,
          fontFamily: settings.appearance?.fontFamily,
          borderRadius: settings.appearance?.borderRadius,
          adminLayout: settings.appearance?.adminLayout || "cards",
          typography: settings.appearance?.typography || {
            headingFont: "Inter",
            headingWeight: 700,
            headingLetterSpacing: "-0.02em",
            headingTransform: "none",
            headingColor: "",
            bodyFont: "Inter",
            bodyWeight: 400,
            bodyLineHeight: "1.5",
            bodyColor: "",
            monoFont: "Geist Mono",
            monoColor: "",
            accentFont: "",
            customFonts: [],
          },
          authUI: settings.appearance?.authUI || {
            theme: "split",
            popupEnabled: true,
          },
          headerButtonStyle: settings.appearance?.headerButtonStyle || "capsule",
        },
        // Multi-Branch Mode
        multiBranch: {
          enabled: Boolean(settings.multiBranch?.enabled),
          allowBranchPickup: settings.multiBranch?.allowBranchPickup ?? true,
          autoAssignOrderToNearestBranch: Boolean(
            settings.multiBranch?.autoAssignOrderToNearestBranch,
          ),
          allowBranchInventoryTransfer:
            settings.multiBranch?.allowBranchInventoryTransfer ?? true,
          requireStaffBranchAssignment: Boolean(
            settings.multiBranch?.requireStaffBranchAssignment,
          ),
          defaultBranchId: settings.multiBranch?.defaultBranchId,
        },

        // Wholesale Mode
        wholesale: {
          enabled: Boolean(settings.wholesale?.enabled),
          mode: settings.wholesale?.mode || "hybrid",
        },

        // Payment (only enabled status, no keys)
        payment: {
          stripeEnabled: settings.payment?.stripe?.enabled || false,
          paypalEnabled: settings.payment?.paypal?.enabled || false,
          razorpayEnabled: settings.payment?.razorpay?.enabled || false,
          paystackEnabled: settings.payment?.paystack?.enabled || false,
          paystackPassChargesToCustomer: Boolean(
            settings.payment?.paystack?.passChargesToCustomer,
          ),
          pesapalEnabled: settings.payment?.pesapal?.enabled || false,
          iotecEnabled: settings.payment?.iotec?.enabled || false,
          codEnabled: settings.payment?.cod?.enabled ?? true,
          stripePublishableKey: stripeCreds.publishableKey,
          paypalClientId: paypalCreds.clientId,
          paypalMode: paypalCreds.mode,
          razorpayKeyId: razorpayCreds.keyId,
          paystackPublicKey: paystackCreds.publicKey,
          codInstructions: settings.payment?.cod?.instructions,
          codMinOrderAmount: settings.payment?.cod?.minOrderAmount,
          codMaxOrderAmount: settings.payment?.cod?.maxOrderAmount,
          stripeConfigured:
            (settings.payment?.stripe?.enabled || false) &&
            Boolean(stripeCreds.secretKey),
          paypalConfigured:
            (settings.payment?.paypal?.enabled || false) &&
            Boolean(paypalCreds.clientId && paypalCreds.clientSecret),
          razorpayConfigured:
            (settings.payment?.razorpay?.enabled || false) &&
            Boolean(razorpayCreds.keyId && razorpayCreds.keySecret),
          paystackConfigured:
            (settings.payment?.paystack?.enabled || false) &&
            Boolean(paystackCreds.secretKey),
          pesapalConfigured:
            (settings.payment?.pesapal?.enabled || false) &&
            // Credentials alone are not enough: Pesapal refuses a currency it
            // cannot settle, so under one the storefront must not offer the
            // option at all rather than fail at submit.
            isPesapalCurrency(settings.general?.defaultCurrency) &&
            Boolean(
              pesapalCreds.consumerKey &&
                pesapalCreds.consumerSecret &&
                pesapalCreds.ipnId,
            ),
          iotecConfigured:
            (settings.payment?.iotec?.enabled || false) &&
            Boolean(
              iotecCreds.clientId &&
                iotecCreds.clientSecret &&
                iotecCreds.walletId,
            ),
        },

        // POS
        pos: {
          enabled: settings.pos?.enabled || false,
          language: settings.pos?.language || "en",
          defaultPosLocationId: settings.pos?.defaultPosLocationId,
          printedReceiptsEnabled:
            settings.pos?.customize?.printedReceiptsEnabled || false,
          offlinePaymentsEnabled:
            settings.pos?.checkout?.offlinePaymentsEnabled || false,
          allowAdminSales: settings.pos?.allowAdminSales ?? true,
          allowVendorSales: settings.pos?.allowVendorSales ?? true,
          allowSellerSales: settings.pos?.allowSellerSales ?? true,
          kdsEnabled: settings.pos?.kdsEnabled ?? true,
          customerDisplayEnabled: settings.pos?.customerDisplayEnabled ?? true,
          stockAuditEnabled: settings.pos?.stockAuditEnabled ?? true,
          kioskEnabled: settings.pos?.kioskEnabled ?? true,
          offlineSyncEnabled: settings.pos?.offlineSyncEnabled ?? true,
          bopisEnabled: settings.pos?.bopisEnabled ?? true,
          transfersEnabled: settings.pos?.transfersEnabled ?? true,
          reportsEnabled: settings.pos?.reportsEnabled ?? true,
          scaleEnabled: settings.pos?.scaleEnabled ?? true,
          posLayout: settings.pos?.posLayout || "classic",
        },

        // Product boosting (sponsored products) — the flag only; policy and
        // pricing stay admin/vendor-side.
        boosting: {
          enabled: Boolean(
            settings.multiVendorMode?.enabled && settings.boosting?.enabled,
          ),
        },

        // Vendor plans — the flag only, so the vendor sidebar can decide
        // whether to offer the billing screen. Plan prices, gateways and
        // limits stay admin/vendor-side.
        vendorPlans: {
          enabled: Boolean(
            settings.multiVendorMode?.enabled && settings.vendorConfig?.plansEnabled,
          ),
        },

        // Orders
        orders: {
          taxRate: settings.orders?.taxRate ?? DEFAULT_ORDER_TAX_RATE,
          freeShippingThreshold:
            settings.orders?.freeShippingThreshold ?? DEFAULT_FREE_SHIPPING_THRESHOLD,
          defaultShippingCost:
            settings.orders?.defaultShippingCost ?? DEFAULT_ORDER_SHIPPING_COST,
        },

        shipping: {
          enabled: settings.shipping?.enabled ?? false,
          weightUnit: settings.shipping?.weightUnit ?? "kg",
          delivery: {
            processingDaysMin: settings.shipping?.delivery?.processingDaysMin ?? 0,
            processingDaysMax: settings.shipping?.delivery?.processingDaysMax ?? 0,
            showEstimatedDelivery: settings.shipping?.delivery?.showEstimatedDelivery ?? true,
          },
          zones: settings.shipping?.zones ?? [],
          fallbackRate: settings.shipping?.fallbackRate,
          customs: settings.shipping?.customs,
          vendorShipping: settings.shipping?.vendorShipping,
          ghanaDeliveryMethods:
            settings.shipping?.ghanaDeliveryMethods &&
            settings.shipping.ghanaDeliveryMethods.length > 0
              ? settings.shipping.ghanaDeliveryMethods
              : undefined,
          origin: settings.shipping?.origin
            ? { country: settings.shipping.origin.country }
            : undefined,
        },

        // Security (only public flags)
        security: {
          emailVerificationRequired:
            Boolean(settings.security?.emailVerificationRequired) &&
            isCurrentSmtpConfigurationVerified(settings),
          // Admin toggle is authoritative; .env only supplies credentials
          // (matches lib/auth.ts). A provider shows only when explicitly
          // enabled AND usable credentials resolve.
          googleOAuthEnabled:
            Boolean(settings.security?.googleOAuthEnabled) &&
            googleOAuthConfigured,
          facebookOAuthEnabled:
            Boolean(settings.security?.facebookOAuthEnabled) &&
            facebookOAuthConfigured,
          twoFactorEnabled: settings.security?.twoFactorEnabled || false,
        },

        // SEO
        seo: {
          metaTitle: settings.seo?.metaTitle,
          metaDescription: settings.seo?.metaDescription,
          ogImage: settings.seo?.ogImage,
        },

        // Social
        social: {
          facebookUrl: settings.social?.facebookUrl,
          twitterUrl: settings.social?.twitterUrl,
          instagramUrl: settings.social?.instagramUrl,
          youtubeUrl: settings.social?.youtubeUrl,
          linkedinUrl: settings.social?.linkedinUrl,
          tiktokUrl: settings.social?.tiktokUrl,
        },

        // Share buttons (storefront product sharing)
        share: resolveShareSettings(settings.social?.share),

        // Analytics (for frontend tracking - no API keys exposed)
        analytics: {
          googleAnalyticsId: analytics.googleAnalyticsId,
          googleTagManagerId: analytics.googleTagManagerId,
          facebookPixelId: analytics.facebookPixelId,
          tiktokPixelId: analytics.tiktokPixelId,
          plausibleDomain: settings.analytics?.plausibleDomain,
          plausibleSelfHosted: settings.analytics?.plausibleSelfHosted ?? false,
          plausibleBaseUrl: settings.analytics?.plausibleBaseUrl,
        },

        // Maintenance
        maintenance: {
          enabled: settings.maintenance?.enabled || false,
          title: settings.maintenance?.title,
          message: settings.maintenance?.message,
          backgroundImageUrl: settings.maintenance?.backgroundImageUrl,
          countdownEnabled: settings.maintenance?.countdownEnabled || false,
          countdownEndsAt: settings.maintenance?.countdownEndsAt,
        },

        // Home page editor configuration
        header,
        footer,
        // Checkout branding: trust copy + policy links, read by checkout-content
        checkout,
        homePage: normalizeHomePageSettings(
          settings.homePage ?? getDefaultHomePageSettings(),
        ),
        contentPages: normalizeContentPagesSettings(settings.contentPages),
      },
    };
  },
  ["public-settings"],
  {
    revalidate: 60,
    tags: [CACHE_TAGS.settings],
  },
);

/**
 * GET /api/settings/public
 * Public endpoint to get non-sensitive app settings
 * Used by frontend to determine multi-vendor mode, POS status, etc.
 */
export async function GET() {
  try {
    return NextResponse.json(await getPublicSettingsPayload(), {
      // Server-side this is already cached (tagged `settings`, busted on every
      // admin save). Letting a browser hold its own copy on top of that is what
      // keeps a renamed store or a swapped logo showing the old value after the
      // admin has saved.
      headers: { "Cache-Control": API_CACHE_CONTROL },
    });
  } catch (error) {
    console.error("Failed to get public settings:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load settings" },
      { status: 500, headers: { "Cache-Control": "private, no-store" } },
    );
  }
}
