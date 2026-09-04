import type { CredentialEnvSources } from "@/lib/credentials";
import type { CredentialMetaMap } from "@/lib/settings/credential-fields";
import type { CountryAvailability } from "@/lib/country-availability";
import type {
  CarrierLabelFileType,
  CarrierLabelStorage,
  CarrierMode,
  CarrierProvider,
  CarrierRateChoice,
  DimensionUnit,
  ParcelWeightUnit,
} from "@/lib/shipping/carrier-config";
import type { IGhanaDeliveryMethod } from "@/types";

/**
 * The carrier last refused our credentials. Dates arrive as strings over the
 * wire, which is the only difference from the server-side shape.
 */
export interface CarrierAuthFailure {
  at: string;
  message?: string;
}

/** Gateway allowlist for vendor→platform payments (boosts, subscriptions). */
export interface PlatformPaymentMethodToggles {
  stripe: boolean;
  paypal: boolean;
  razorpay: boolean;
  paystack: boolean;
  pesapal: boolean;
  iotec: boolean;
}

/**
 * One storage provider's credentials. The union of every provider's fields —
 * each backend uses the subset it needs (R2 has no region, S3 no endpoint).
 * Secrets never reach the browser; they arrive as masked hints in `_meta`.
 */
export interface StorageProviderCredentials {
  accountId?: string;
  endpoint?: string;
  region?: string;
  bucketName?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  publicUrl?: string;
}

export interface Settings {
  general: {
    storeName: string;
    storeDescription?: string;
    storeEmail: string;
    storePhone?: string;
    storeDomain?: string;
    storeAddress?: string;
    logoUrl?: string;
    darkModeLogoUrl?: string;
    faviconUrl?: string;
    appIconUrl?: string;
    defaultLanguage: string;
    defaultCurrency: string;
    supportedLanguages: string[];
    supportedCurrencies: string[];
    exchangeRateProvider?: "open.er-api.com" | "exchangerate-api.com" | "custom";
    exchangeRateApiKey?: string;
    countryAvailability: CountryAvailability;
    timezone: string;
    hideDefaultLocalePrefix?: boolean;
    disableDecimals?: boolean;
    blockedCountries?: string[];
    blockedMessage?: string;
    deliveryInformation?: { icon: string; text: string; subtext?: string }[] | string;
    multiBranchMode?: {
      enabled: boolean;
      defaultBranchId?: string;
    };
  };
  appearance: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    /** Legacy documents may still hold `"system"`; read via `normalizeThemeMode`. */
    theme: "light" | "dark" | "system";

    contrast: boolean;
    rtl: boolean;
    collapsedSidebar: boolean;
    navLayout: "vertical" | "horizontal" | "mini";
    navColor: "integrate" | "apparent";
    presetColor: "default" | "cyan" | "purple" | "blue" | "orange" | "red";
    customPresets?: CustomColorPreset[];
    fontFamily?: string;
    borderRadius?: string;
    adminLayout?: "cards" | "dense" | "studio" | "minimal" | "command";
    dashboardTemplate?: string;
    typography?: {
      headingFont?: string;
      headingWeight?: number;
      headingLetterSpacing?: string;
      headingTransform?: "none" | "uppercase" | "capitalize" | "lowercase";
      headingColor?: string;
      bodyFont?: string;
      bodyWeight?: number;
      bodyLineHeight?: string;
      bodyColor?: string;
      monoFont?: string;
      monoColor?: string;
      accentFont?: string;
      customFonts?: {
        id: string;
        name: string;
        fileUrl: string;
        format: "woff2" | "woff" | "ttf" | "otf";
        weight?: number;
      }[];
    };
    paymentIcons?: string[];
    authUI?: {
      theme?: string;
      popupEnabled?: boolean;
      coverImage?: string;
      logoUrl?: string;
      backgroundImageUrl?: string;
      sideImageUrl?: string;
      heading?: string;
      subheading?: string;
    };
    /** Style of the admin header action buttons (POS, Multi-Branch, Visit Website). */
    headerButtonStyle?: "default" | "capsule" | "cyber" | "glass" | "luxe";
  };
  payment: {
    stripe: {
      enabled: boolean;
      publishableKey?: string;
      secretKey?: string;
      webhookSecret?: string;
    };
    paypal: {
      enabled: boolean;
      clientId?: string;
      clientSecret?: string;
      mode: "sandbox" | "live";
      webhookId?: string;
    };
    razorpay: {
      enabled: boolean;
      keyId?: string;
      keySecret?: string;
      webhookSecret?: string;
    };
    paystack: {
      enabled: boolean;
      publicKey?: string;
      secretKey?: string;
      passChargesToCustomer?: boolean;
    };
    pesapal: {
      enabled: boolean;
      consumerKey?: string;
      consumerSecret?: string;
      mode: "sandbox" | "live";
      ipnId?: string;
    };
    iotec: {
      enabled: boolean;
      clientId?: string;
      clientSecret?: string;
      walletId?: string;
      mode: "sandbox" | "live";
    };
    cod: {
      enabled: boolean;
      instructions?: string;
      minOrderAmount?: number;
      maxOrderAmount?: number;
    };
  };
  _meta?: {
    /**
     * Masked preview + presence flag for every credential, keyed by settings
     * dot-path (e.g. "payment.stripe.secretKey"). The raw values are stripped
     * server-side, so these fields always read as empty in the form.
     */
    credentials?: CredentialMetaMap;
    /** Test/live derived server-side from each gateway's stored key prefix. */
    keyModes?: {
      stripe?: "test" | "live";
      razorpay?: "test" | "live";
      paystack?: "test" | "live";
    };
    demoMode?: {
      enabled?: boolean;
      message?: string;
    };
    envSources?: CredentialEnvSources;
    /**
     * Origin Better Auth is configured with (`BETTER_AUTH_URL` →
     * `NEXT_PUBLIC_APP_URL`). The OAuth screen builds the provider redirect
     * URIs from this, not from `window.location`, so the URL an admin copies
     * into Google/Meta is the one the server will actually send.
     */
    authBaseUrl?: string;
  };
  email: {
    provider: "smtp" | "sendgrid" | "ses" | "mailgun";
    enabled: boolean;
    smtp: {
      host?: string;
      port: number;
      user?: string;
      password?: string;
      secure: boolean;
    };
    fromEmail?: string;
    fromName?: string;
    replyTo?: string;
    apiKey?: string;
    logRetentionDays?: 7 | 30 | 90;
  };
  sms: {
    enabled: boolean;
    provider: "twilio" | "messagebird" | "hubtel" | "arkesel";
    twilioAccountSid?: string;
    twilioAuthToken?: string;
    twilioFromNumber?: string;
    messagebirdAccessKey?: string;
    messagebirdOriginator?: string;
    hubtelClientId?: string;
    hubtelClientSecret?: string;
    hubtelSenderId?: string;
    arkeselApiKey?: string;
    arkeselSenderId?: string;
  };
  otp: {
    enabled: boolean;
    methods: ("email" | "sms")[];
    enforceForAdmin: boolean;
    enforceForVendor: boolean;
    enforceForCustomer: boolean;
  };
  notifications: {
    admin: {
      newOrders: NotificationChannelSettings;
      newCustomers: NotificationChannelSettings;
      newVendors: NotificationChannelSettings;
      returns: NotificationChannelSettings;
      payments: NotificationChannelSettings;
    };
    staff: {
      newOrders: NotificationChannelSettings;
      newCustomers: NotificationChannelSettings;
      returns: NotificationChannelSettings;
      payments: NotificationChannelSettings;
      lowStock: NotificationChannelSettings;
    };
    vendor: {
      applicationStatus: NotificationChannelSettings;
      newOrders: NotificationChannelSettings;
      returns: NotificationChannelSettings;
    };
    customer: {
      orderUpdates: NotificationChannelSettings;
      returnUpdates: NotificationChannelSettings;
    };
  };
  whatsapp: {
    enabled: boolean;
    provider: "meta" | "twilio" | "messagebird";
    metaPhoneNumberId?: string;
    metaAccessToken?: string;
    twilioAccountSid?: string;
    twilioAuthToken?: string;
    twilioFromNumber?: string;
    messagebirdAccessKey?: string;
    messagebirdChannelId?: string;
    templates: {
      orderConfirmation?: string;
      shippingUpdate?: string;
      deliveryUpdate?: string;
      reviewRequest?: string;
    };
  };
  orders: {
    prefix: string;
    taxRate: number;
    freeShippingThreshold?: number;
    defaultShippingCost: number;
    commission: {
      vendorRate: number;
      minWithdrawalAmount: number;
    };
    /** Optional: a store saved before these settings existed carries none. */
    returns?: {
      shippingRefund?: "never" | "merchant_fault" | "always";
      restockingFeePercent?: number;
      returnShippingFee?: number;
      refundAdminFeePercent?: number;
      refundAdminFeeCap?: number;
      billVendorCodShipping?: boolean;
    };
  };
  shipping: {
    enabled: boolean;
    weightUnit?: "kg" | "lb";
    origin?: {
      country: string;
      state?: string;
      city?: string;
      postalCode?: string;
      address1?: string;
      address2?: string;
    };
    ghanaDeliveryMethods?: IGhanaDeliveryMethod[];
    delivery?: {
      processingDaysMin: number;
      processingDaysMax: number;
      showEstimatedDelivery: boolean;
    };
    zones: Array<{
      id: string;
      name: string;
      countries: string[];
      regions?: string[];
      /**
       * "Rest of the world": priced only when no other zone matched, ignoring
       * its own countries/regions. Supersedes the single `fallbackRate`.
       */
      isFallback?: boolean;
      rates: Array<{
        id: string;
        name: string;
        type: "flat" | "free_over" | "subtotal_range" | "weight_range";
        price: number;
        freeOver?: number;
        minSubtotal?: number;
        maxSubtotal?: number;
        minWeight?: number;
        maxWeight?: number;
        pricePerWeightUnit?: number;
        minDays?: number;
        maxDays?: number;
        active: boolean;
      }>;
    }>;
    fallbackRate?: {
      enabled: boolean;
      name: string;
      price: number;
      minDays?: number;
      maxDays?: number;
    };
    customs?: {
      enabled: boolean;
      dutyMode: "DDP" | "DDU";
      dutyRatePercent?: number;
      deMinimis?: number;
    };
    vendorShipping?: {
      enabled: boolean;
    };
    /** Who takes the cash on a COD sale, store-wide. See lib/cod-collection.ts. */
    codCollectedBy?: "vendor" | "platform";
    carriers?: {
      enabled: boolean;
      labelStorage?: CarrierLabelStorage;
      shippo: {
        enabled: boolean;
        mode: CarrierMode;
        // Tokens are never sent to the browser — presence is read from
        // `_meta.credentials`. The keys exist so an admin can type a new value.
        testToken?: string;
        liveToken?: string;
        webhookSecret?: string;
        webhookRegisteredAt?: string;
        labelFileType?: CarrierLabelFileType;
        serviceTokenAllowList?: string[];
        authFailure?: CarrierAuthFailure;
      };
      shiprocket: {
        enabled: boolean;
        email?: string;
        password?: string;
        pickupLocationName?: string;
        channelId?: string;
        webhookToken?: string;
        courierIdAllowList?: number[];
        authFailure?: CarrierAuthFailure;
      };
    };
    packages?: Array<{
      id: string;
      name: string;
      length: number;
      width: number;
      height: number;
      dimensionUnit: DimensionUnit;
      emptyWeight?: number;
      weightUnit?: ParcelWeightUnit;
      maxWeight?: number;
      isDefault?: boolean;
      active: boolean;
    }>;
    /**
     * Tracking pages for couriers we do not book through an API, so a
     * hand-entered AWB is something a shopper can click rather than read.
     */
    courierTrackingLinks?: Array<{
      carrier: string;
      urlTemplate: string;
    }>;
    automation?: {
      enabled: boolean;
      includeCod: boolean;
      minOrderValue?: number;
      maxOrderValue?: number;
      rateChoice: CarrierRateChoice;
      fixedProvider?: CarrierProvider;
      fixedServiceToken?: string;
      buyLabel: boolean;
      markOrderShipped: boolean;
      restrictToCountries?: string[];
      maxLabelCost?: number;
    };
  };
  seo: {
    metaTitle?: string;
    metaDescription?: string;
    metaKeywords?: string;
    ogImage?: string;
  };
  social: {
    facebookUrl?: string;
    twitterUrl?: string;
    instagramUrl?: string;
    youtubeUrl?: string;
    linkedinUrl?: string;
    tiktokUrl?: string;
    share?: SocialShareSettings;
  };
  analytics: {
    googleAnalyticsId?: string;
    googleTagManagerId?: string;
    facebookPixelId?: string;
    tiktokPixelId?: string;
    plausibleDomain?: string;
    plausibleApiKey?: string;
    plausibleSelfHosted?: boolean;
    plausibleBaseUrl?: string;
  };
  maintenance: {
    enabled: boolean;
    title?: string;
    message?: string;
    backgroundImageUrl?: string;
    countdownEnabled?: boolean;
    countdownEndsAt?: string;
    allowedIPs?: string[];
  };
  security: {
    emailVerificationRequired: boolean;
    emailVerificationForVendors: boolean;
    emailVerificationRequiredSince?: string;
    emailVerificationForVendorsSince?: string;
    smtpVerifiedAt?: string;
    twoFactorEnabled: boolean;
    twoFactorRequiredForAdmin: boolean;
    twoFactorRequiredForVendors: boolean;
    twoFactorRequiredForStaff: boolean;
    googleOAuthEnabled: boolean;
    googleClientId?: string;
    googleClientSecret?: string;
    facebookOAuthEnabled: boolean;
    facebookAppId?: string;
    facebookAppSecret?: string;
    sessionMaxAgeDays: number;
    maxLoginAttempts: number;
    lockoutDurationMinutes: number;
    rateLimiting?: {
      enabled: boolean;
      ipPreset: "default" | "lenient" | "moderate" | "strict";
      adminPreset: "default" | "lenient" | "moderate" | "strict";
      vendorPreset: "default" | "lenient" | "moderate" | "strict";
      checkoutPreset: "default" | "lenient" | "moderate" | "strict";
      cartPreset: "default" | "lenient" | "moderate" | "strict";
      couponPreset: "default" | "lenient" | "moderate" | "strict";
      authPreset: "default" | "lenient" | "moderate" | "strict";
    };
    minPasswordLength: number;
    requireUppercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
  };
  pos: {
    enabled: boolean;
    allowAdminSales: boolean;
    allowVendorSales: boolean;
    allowSellerSales: boolean;
    kdsEnabled?: boolean;
    customerDisplayEnabled?: boolean;
    stockAuditEnabled?: boolean;
    kioskEnabled?: boolean;
    offlineSyncEnabled?: boolean;
    bopisEnabled?: boolean;
    transfersEnabled?: boolean;
    reportsEnabled?: boolean;
    scaleEnabled?: boolean;
    posLayout?:
      | "classic"
      | "touch_grocery"
      | "scan_compact"
      | "grid_visual"
      | "kiosk_self"
      | "restaurant_cafe";
    language?: string;
    defaultPosLocationId?: string;
    customize?: {
      printedReceiptsEnabled: boolean;
      receiptPrinter?: string;
      soundEnabled: boolean;
      soundVolume: number;
      soundAddToCart: boolean;
      soundOrderComplete: boolean;
      soundPayment: boolean;
      soundError: boolean;
      denominations?: number[];
    };
    checkout?: {
      paymentMethods: ("cash" | "card" | "manual" | "bank")[];
      offlinePaymentsEnabled: boolean;
    };
    orders?: {
      orderNumberPrefix: string;
    };
    receipt?: {
      logoUrl?: string;
      headerText?: string;
      footerText?: string;
      taxNumber?: string;
      showQrCode: boolean;
      qrCodeUrl?: string;
      returnPolicyText?: string;
    };
  };
  multiBranch: {
    enabled: boolean;
    allowBranchPickup: boolean;
    autoAssignOrderToNearestBranch: boolean;
    allowBranchInventoryTransfer: boolean;
    requireStaffBranchAssignment: boolean;
    defaultBranchId?: string;
  };
  wholesale?: {
    enabled: boolean;
    mode: "hybrid" | "gated" | "disabled";
    guestPricing: "show_retail" | "hide_prices" | "login_for_pricing";
    minOrderValue: number;
    autoApproveApplications: boolean;
    defaultTierId?: string;
    allowNetTerms: boolean;
    allowedNetTerms: string[];
    poRequired: boolean;
    defaultCreditLimit: number;
    enableRfqs: boolean;
    minRfqCartValue: number;
    defaultQuoteValidityDays: number;
    taxExemptionEnabled: boolean;
    showDualPrice: boolean;
  };
  multiVendorMode: {
    enabled: boolean;
    canManageProducts: boolean;
    canViewOrders: boolean;
    canManageOrders: boolean;
    canManageStoreSettings: boolean;
    canViewAnalytics: boolean;
    canManageDiscounts: boolean;
    canManagePayouts: boolean;
    canAccessPOS: boolean;
  };
  vendorConfig: {
    plansEnabled: boolean;
    allowRegistration: boolean;
    autoApprove: boolean;
    freeTrialDays: number;
    requirePlanSelection: boolean;
    requiredDocuments: string[];
    defaultPlanId?: string;
    paymentMethods?: PlatformPaymentMethodToggles;
  };
  boosting: {
    enabled: boolean;
    paymentMethods?: PlatformPaymentMethodToggles;
    placements: {
      home: boolean;
      listing: boolean;
      productPage: boolean;
    };
    listingSlots: number;
    productPageSlots: number;
    hideOutOfStock: boolean;
    holdMinutes: number;
    bookingHorizonDays: number;
    maxBookingDays: number;
  };
  storage: {
    /** "local" is legacy-only — pre-v1.5 documents; never selectable. */
    provider: "cloudflare_r2" | "s3" | "minio" | "digitalocean" | "local";
    r2?: StorageProviderCredentials;
    s3?: StorageProviderCredentials;
    minio?: StorageProviderCredentials;
    digitalocean?: StorageProviderCredentials;
    // The pre-v1.5 flat credentials (endpoint, accountId, region, bucketName,
    // accessKeyId, secretAccessKey, publicUrl) are gone from this type: the
    // admin payload strips them and the save handler refuses to write them, so
    // declaring them here only suggested to the next reader that the settings
    // screen still deals in them. The server-side fallback that keeps
    // un-migrated installs serving media lives in `resolveStorageCredentials`.
    maxFileSizeMB: number;
    maxImageSizeMB?: number;
    maxVideoSizeMB?: number;
    maxModelSizeMB?: number;
    allowedMimeTypes: string[];
    pathPrefix?: string;
  };
  onlineStore?: {
    activeTheme?: string;
    themeSettings?: Record<string, unknown>;
    floatingTabs?: {
      id: string;
      name: string;
      position: "left-center" | "left-bottom" | "right-center" | "right-bottom";
      styleVariant: "rounded-float" | "block-edge" | "pill-minimal" | "modern-glow" | "glass-panel" | "neumorphic" | "edge-reveal" | "icon-dock" | "gradient-burst" | "default";
      displayOnMobile?: boolean;
      items: {
        id: string;
        name: string;
        icon: string;
        url?: string;
        type: "link" | "ai_assistant" | "back_to_top" | "category_trigger";
      }[];
    }[];
    trackOrder?: {
      theme?: "modern-glass" | "classic-minimal" | "vibrant-gradient" | "dark-luxury" | "corporate-pro";
      showMapIllustration?: boolean;
      showItemList?: boolean;
      accentColor?: string;
      enableGlassmorphism?: boolean;
      ghanaPostGps?: boolean;
      dispatchRiderInfo?: boolean;
      momoCodTracking?: boolean;
    };
  };
  aiSalesAgent?: {
    enabled: boolean;
    model: "gpt-5.4-mini" | "gpt-5.4" | "gpt-5.5" | "gpt-5.4-nano";
    temperature: number;
    reasoningEffort: "none" | "low" | "medium" | "high";
    maxRecommendations: number;
    agentName: string;
    greeting: string;
    tone: "friendly" | "professional" | "playful" | "luxury";
    instructions?: string;
    escalationMessage: string;
    widget: {
      position: "bottom-right" | "bottom-left";
      primaryColor: string;
      accentColor: string;
      avatarUrl?: string;
      footerText?: string;
    };
    capabilities: {
      productQA: boolean;
      recommendations: boolean;
      cartActions: boolean;
      checkoutHandoff: boolean;
      orderStatus: boolean;
    };
  };
  aiAuthoring?: {
    enabled: boolean;
    /** Write-only; the server strips it from every response. */
    apiKey?: string;
    textModel: "" | "gpt-4.1-mini" | "gpt-4.1" | "gpt-5-mini" | "gpt-5";
    imageModel: "" | "gpt-image-1" | "gpt-image-1-mini";
    surfaces: {
      products: boolean;
      categories: boolean;
      collections: boolean;
      brands: boolean;
      blogPosts: boolean;
      contentPages: boolean;
      reviews: boolean;
      heroBanner: boolean;
    };
    imageDefaults: {
      size: "auto" | "1024x1024" | "1024x1536" | "1536x1024";
      quality: "auto" | "medium" | "high";
    };
    brandVoice: {
      tone: "" | "friendly" | "professional" | "luxury" | "playful" | "supportive";
      instructions: string;
      imageStyle?: string;
    };
    brandKit?: {
      primaryColor?: string;
      secondaryColor?: string;
      logoUrl?: string;
    };
    access: {
      staffEnabled: boolean;
      vendorsEnabled: boolean;
    };
    limits: {
      textPerUserPerDay: number;
      imagePerUserPerDay: number;
    };
  };
  compliance: {
    cookieConsent: {
      enabled: boolean;
      layout: "bottom-banner" | "center-modal";
      theme: "light" | "dark" | "system";
      privacyPolicyUrl?: string;
      text: {
        title: string;
        message: string;
        acceptButton: string;
        declineButton: string;
      };
    };
  };
}

export interface CustomColorPreset {
  id: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
}

export interface NotificationChannelSettings {
  inApp: boolean;
  email: boolean;
  browserPush: boolean;
}

export interface CustomShareButton {
  id: string;
  label: string;
  urlTemplate: string;
  enabled: boolean;
  icon?: string;
}

export interface SocialShareSettings {
  enabled: boolean;
  copyLink: boolean;
  facebook: boolean;
  twitter: boolean;
  whatsapp: boolean;
  telegram: boolean;
  pinterest: boolean;
  linkedin: boolean;
  email: boolean;
  custom: CustomShareButton[];
}
