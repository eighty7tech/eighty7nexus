/**
 * Settings Model - Redesigned
 * Industry-standard architecture with proper sub-document organization
 */

import { cache } from "react";
import type { IGhanaDeliveryMethod } from "@/types";
import {
  ALL_VENDOR_PACKS,
  type VendorPermissionPack,
} from "@/config/permissions.config";
import mongoose, { Schema, Document, Model } from "mongoose";
import { COD_COLLECTED_BY, type CodCollectedBy } from "@/config/app.config";
import {
  getDefaultContentPagesSettings,
  type ContentPagesSettings,
} from "@/lib/content-pages-config";
import {
  getDefaultHomePageSettings,
  type HomePageSettings,
} from "@/lib/home-page-config";
import {
  getDefaultHeaderSettings,
  type HeaderSettings,
} from "@/lib/header-config";
import {
  getDefaultFooterSettings,
  type FooterSettings,
} from "@/lib/footer-config";
import {
  getDefaultCheckoutSettings,
  type CheckoutSettings,
} from "@/lib/checkout-config";
import {
  getDefaultProductPageSettings,
  type ProductPageSettings,
} from "@/lib/product-page-config";
import {
  DEFAULT_ACCENT_COLOR,
  DEFAULT_CURRENCY,
  DEFAULT_LANGUAGE,
  DEFAULT_PRESET_COLOR,
  DEFAULT_PRIMARY_COLOR,
  DEFAULT_SECONDARY_COLOR,
  DEFAULT_STORE_NAME,
  DEFAULT_THEME_MODE,
  DEFAULT_TIMEZONE,
  isLegacySeededBrandText,
  normalizeThemeMode,
  resolveFaviconUrl,
  type ThemeMode,
} from "@/config/branding.config";
import {
  DEFAULT_NOTIFICATION_SETTINGS,
  type NotificationSettings,
} from "@/lib/notification-settings";
import {
  DEFAULT_MIN_WITHDRAWAL_AMOUNT,
  DEFAULT_ORDER_PREFIX,
  DEFAULT_ORDER_SHIPPING_COST,
  DEFAULT_ORDER_TAX_RATE,
  DEFAULT_VENDOR_COMMISSION_RATE,
  ORDER_PREFIX_PATTERN,
} from "@/lib/order-settings";
import {
  DEFAULT_BILL_VENDOR_COD_SHIPPING,
  DEFAULT_REFUND_ADMIN_FEE_CAP,
  DEFAULT_REFUND_ADMIN_FEE_PERCENT,
  DEFAULT_RESTOCKING_FEE_PERCENT,
  DEFAULT_RETURN_SHIPPING_FEE,
  DEFAULT_RETURN_SHIPPING_REFUND,
  NEW_STORE_RETURN_SHIPPING_REFUND,
  RETURN_SHIPPING_REFUND_MODES,
  type ReturnShippingRefundMode,
} from "@/lib/return-policy";
import {
  DEFAULT_LOCKOUT_MINUTES,
  DEFAULT_MAX_LOGIN_ATTEMPTS,
  DEFAULT_SESSION_MAX_AGE_DAYS,
} from "@/lib/security-limits";
import { SUPPORTED_UPLOAD_MIME_TYPES } from "@/lib/storage/types";
import {
  POS_SELECTABLE_PAYMENT_METHODS,
  type POSSelectablePaymentMethod,
} from "@/lib/pos/payment";
import {
  COUNTRY_AVAILABILITY_MODES,
  DEFAULT_COUNTRY_AVAILABILITY,
  type CountryAvailability,
} from "@/lib/country-availability";
import {
  CARRIER_LABEL_FILE_TYPES,
  CARRIER_LABEL_STORAGE_MODES,
  CARRIER_MODES,
  CARRIER_PROVIDERS,
  CARRIER_RATE_CHOICES,
  DEFAULT_PACKAGE_PRESET,
  DIMENSION_UNITS,
  PARCEL_WEIGHT_UNITS,
  type CarrierLabelFileType,
  type CarrierLabelStorage,
  type CarrierMode,
  type CarrierProvider,
  type CarrierRateChoice,
  type DimensionUnit,
  type ParcelWeightUnit,
} from "@/lib/shipping/carrier-config";

// ============================================
// General Settings Sub-interface
// ============================================

export interface IGeneralSettings {
  storeName: string;
  storeDescription?: string;
  storeEmail: string;
  storePhone?: string;
  storeDomain?: string;
  storeAddress?: string;
  logoUrl?: string;
  darkModeLogoUrl?: string;
  faviconUrl?: string;
  /** Source image for the installed-app (PWA) icon; see `lib/pwa-icons.ts`. */
  appIconUrl?: string;
  defaultLanguage: string;
  defaultCurrency: string;
  disableDecimals?: boolean;
  deliveryInformation?: { icon: string; text: string; subtext?: string }[] | string;
  supportedLanguages: string[];
  supportedCurrencies: string[];
  exchangeRateProvider?: "open.er-api.com" | "exchangerate-api.com" | "custom";
  exchangeRateApiKey?: string;
  hideDefaultLocalePrefix?: boolean;
  countryAvailability: CountryAvailability;
  timezone: string;
  blockedCountries?: string[];
  blockedMessage?: string;
  multiBranchMode?: {
    enabled: boolean;
    defaultBranchId?: string;
  };
}

// ============================================
// Appearance Settings Sub-interface
// ============================================

/** Admin-defined color preset saved from the Branding tab's color picker. */
export interface ICustomColorPreset {
  id: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
}

export interface IAppearanceSettings {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  /**
   * Configured theme. `"system"` is a legacy value only readable from
   * pre-existing documents — read it through `normalizeThemeMode()`, never
   * directly, since the app no longer follows the OS preference.
   */
  theme: ThemeMode | "system";
  contrast: boolean;
  rtl: boolean;
  collapsedSidebar: boolean;
  navLayout: "vertical" | "horizontal" | "mini";
  navColor: "integrate" | "apparent";
  presetColor: "default" | "cyan" | "purple" | "blue" | "orange" | "red";
  /** User-saved color presets shown alongside the built-in ones. */
  customPresets?: ICustomColorPreset[];
  fontFamily?: string;
  borderRadius?: string;
  adminLayout?: "cards" | "dense" | "studio" | "minimal" | "command";
  dashboardTemplate?: string;
  typography?: ITypographySettings;
  authUI?: {
    theme: string;
    popupEnabled: boolean;
    coverImage?: string;
    logoUrl?: string;
    backgroundImageUrl?: string;
    sideImageUrl?: string;
    heading?: string;
    subheading?: string;
  };
  paymentIcons?: string[];
  headerButtonStyle?: "default" | "capsule" | "cyber" | "glass" | "luxe";
}

export interface ICustomFontItem {
  id: string;
  name: string;
  fileUrl: string;
  format: "woff2" | "woff" | "ttf" | "otf";
  weight?: number;
}

export interface ITypographySettings {
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
  customFonts?: ICustomFontItem[];
}

// ============================================
// Payment Settings Sub-interfaces
// ============================================

export interface IStripeSettings {
  enabled: boolean;
  publishableKey?: string;
  secretKey?: string;
  webhookSecret?: string;
}

export interface IPayPalSettings {
  enabled: boolean;
  clientId?: string;
  clientSecret?: string;
  mode: "sandbox" | "live";
  webhookId?: string;
}

export interface IRazorpaySettings {
  enabled: boolean;
  keyId?: string;
  keySecret?: string;
  webhookSecret?: string;
}

export interface IPaystackSettings {
  enabled: boolean;
  publicKey?: string;
  secretKey?: string;
  passChargesToCustomer?: boolean;
}

export interface IPesapalSettings {
  enabled: boolean;
  consumerKey?: string;
  consumerSecret?: string;
  mode: "sandbox" | "live";
  ipnId?: string;
}

export interface IIotecSettings {
  enabled: boolean;
  clientId?: string;
  clientSecret?: string;
  walletId?: string;
  mode: "sandbox" | "live";
}

export interface ICODSettings {
  enabled: boolean;
  instructions?: string;
  minOrderAmount?: number;
  maxOrderAmount?: number;
}

export interface IPaymentSettings {
  stripe: IStripeSettings;
  paypal: IPayPalSettings;
  razorpay: IRazorpaySettings;
  paystack: IPaystackSettings;
  pesapal: IPesapalSettings;
  iotec: IIotecSettings;
  cod: ICODSettings;
}

// ============================================
// Email Settings Sub-interface
// ============================================

export interface ISMTPSettings {
  host?: string;
  port: number;
  user?: string;
  password?: string;
  secure: boolean;
}

export interface IEmailSettings {
  provider: "smtp" | "sendgrid" | "ses" | "mailgun";
  enabled: boolean;
  smtp: ISMTPSettings;
  fromEmail?: string;
  fromName?: string;
  replyTo?: string;
  apiKey?: string; // For SendGrid, SES, Mailgun
  logRetentionDays?: 7 | 30 | 90;
}

export interface ISMSProviderSettings {
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
}

export interface IOTPSettings {
  enabled: boolean;
  methods: ("email" | "sms")[];
  enforceForAdmin: boolean;
  enforceForVendor: boolean;
  enforceForCustomer: boolean;
}

export interface IWhatsAppSettings {
  enabled: boolean;
  provider: "meta" | "twilio" | "messagebird";
  metaPhoneNumberId?: string;
  metaAccessToken?: string;
  twilioAccountSid?: string;
  twilioAuthToken?: string;
  twilioPhoneNumber?: string;
  messagebirdAccessKey?: string;
  messagebirdChannelId?: string;
  templates: {
    orderConfirmation: string;
    shippingUpdate: string;
    delivery: string;
    reviewRequest: string;
  };
}

// ============================================
// Order Settings Sub-interface
// ============================================

export interface ICommissionSettings {
  vendorRate: number; // Percentage
  minWithdrawalAmount: number;
}

/**
 * Return and refund policy. Every default reproduces the behaviour Eighty7Nexus had
 * before these were settings, so an untouched store sees no change — see
 * `resolveReturnPolicy` in lib/return-policy.ts.
 */
export interface IReturnPolicySettings {
  shippingRefund: ReturnShippingRefundMode;
  restockingFeePercent: number;
  returnShippingFee: number;
  refundAdminFeePercent: number;
  refundAdminFeeCap: number;
  billVendorCodShipping: boolean;
}

export interface IOrderSettings {
  prefix: string;
  taxRate: number;
  freeShippingThreshold?: number;
  defaultShippingCost: number;
  commission: ICommissionSettings;
  returns: IReturnPolicySettings;
}

export type ShippingRateType =
  | "flat"
  | "free_over"
  | "subtotal_range"
  | "weight_range";

export type ShippingWeightUnit = "kg" | "lb";

export type ShippingDutyMode = "DDP" | "DDU";

export interface IShippingOrigin {
  country: string;
  state?: string;
  city?: string;
  postalCode?: string;
  address1?: string;
  address2?: string;
}

export interface IShippingDeliveryDefaults {
  processingDaysMin: number;
  processingDaysMax: number;
  showEstimatedDelivery: boolean;
}

export interface IShippingRate {
  id: string;
  name: string;
  type: ShippingRateType;
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
}

export interface IShippingZone {
  id: string;
  name: string;
  countries: string[];
  regions?: string[];
  rates: IShippingRate[];
  /**
   * "Rest of the world": priced only when no ordinary zone matched the address,
   * ignoring its own countries/regions. Supersedes the single `fallbackRate`.
   */
  isFallback?: boolean;
}

export interface IFallbackShippingRate {
  enabled: boolean;
  name: string;
  price: number;
  minDays?: number;
  maxDays?: number;
}

export interface ICustomsSettings {
  enabled: boolean;
  dutyMode: ShippingDutyMode;
  dutyRatePercent?: number;
  deMinimis?: number;
}

export interface IVendorShippingSettings {
  enabled: boolean;
}

// ============================================
// Carrier integration (Shippo / Shiprocket)
// ============================================

/** A saved box. Carriers price by volume, so a parcel needs real dimensions. */
export interface ICarrierPackagePreset {
  id: string;
  name: string;
  length: number;
  width: number;
  height: number;
  dimensionUnit: DimensionUnit;
  /** Tare — the empty box's own weight, added to the contents. */
  emptyWeight?: number;
  weightUnit?: ParcelWeightUnit;
  /** Capacity in `weightUnit`; a heavier consignment will not choose this box. */
  maxWeight?: number;
  isDefault?: boolean;
  active: boolean;
}

export interface IShippoCarrierSettings {
  enabled: boolean;
  /** Shippo infers test/live from the token, so both are stored and selected. */
  mode: CarrierMode;
  testToken?: string;
  liveToken?: string;
  /** Minted by the register-webhook action; also stored hashed for comparison. */
  webhookSecret?: string;
  webhookSecretHash?: string;
  webhookRegisteredAt?: Date;
  labelFileType?: CarrierLabelFileType;
  /** Narrows a noisy rate list to services the merchant actually sells. */
  serviceTokenAllowList?: string[];
  authFailure?: ICarrierAuthFailure;
}

/**
 * The carrier last refused our credentials.
 *
 * A dead token is permanent by nature, so every queued job dead-letters on its
 * first attempt — correctly, and completely silently. Without somewhere to
 * record it the store keeps taking orders that quietly never ship, and the
 * carrier still reads as connected on the settings screen. Cleared by the next
 * call that succeeds, so it heals on its own once the credential is replaced.
 */
export interface ICarrierAuthFailure {
  at: Date;
  /** The provider's own words, which usually name the actual problem. */
  message?: string;
}

export interface IShiprocketCarrierSettings {
  enabled: boolean;
  email?: string;
  password?: string;
  /**
   * Shiprocket ships from a *registered nickname*, not a free-form address,
   * so this is the one field without which nothing can be dispatched.
   */
  pickupLocationName?: string;
  channelId?: string;
  webhookToken?: string;
  courierIdAllowList?: number[];
  /**
   * The 240-hour login token. Persisted as well as held in process because a
   * serverless cold start would otherwise re-login on every invocation and
   * trip Shiprocket's auth throttle.
   */
  tokenCache?: { token?: string; expiresAt?: Date };
  authFailure?: ICarrierAuthFailure;
}

export interface ICarrierAutomationSettings {
  enabled: boolean;
  /** COD orders are never `paid`, so they only auto-ship when this is on. */
  includeCod: boolean;
  minOrderValue?: number;
  maxOrderValue?: number;
  rateChoice: CarrierRateChoice;
  fixedProvider?: CarrierProvider;
  fixedServiceToken?: string;
  /** Off means "create the draft and stop", leaving the buy to a human. */
  buyLabel: boolean;
  markOrderShipped: boolean;
  restrictToCountries?: string[];
  /** Abort guard, in the carrier account's own currency. */
  maxLabelCost?: number;
}

export interface ICarrierSettings {
  /** Master switch: off hides every carrier surface and blocks every call. */
  enabled: boolean;
  shippo: IShippoCarrierSettings;
  shiprocket: IShiprocketCarrierSettings;
  labelStorage: CarrierLabelStorage;
}

export interface IShippingSettings {
  enabled: boolean;
  weightUnit?: ShippingWeightUnit;
  origin?: IShippingOrigin;
  delivery?: IShippingDeliveryDefaults;
  zones: IShippingZone[];
  fallbackRate?: IFallbackShippingRate;
  customs?: ICustomsSettings;
  vendorShipping?: IVendorShippingSettings;
  /**
   * Who takes the cash on a cash-on-delivery sale, store-wide. Individual
   * vendors may override it; see `lib/cod-collection.ts` for why the resolved
   * answer is frozen onto each consignment rather than read back from here.
   */
  codCollectedBy?: CodCollectedBy;
  carriers?: ICarrierSettings;
  packages?: ICarrierPackagePreset[];
  automation?: ICarrierAutomationSettings;
  /**
   * Tracking pages for couriers we do not book through an API.
   *
   * A hand-entered AWB has no tracking URL — the provider that would have
   * supplied one was never involved — so it reached the customer as text they
   * could do nothing with. `lib/shipping/tracking-urls.ts` ships a short
   * built-in list; this is how a merchant covers the courier they actually
   * use, and overrides ours when their lane is served by a local agent.
   */
  courierTrackingLinks?: ICourierTrackingLink[];
  
  // NEW Ghana-specific field
  ghanaDeliveryMethods?: IGhanaDeliveryMethod[];
}

/** One courier's tracking page, as a merchant configures it. */
export interface ICourierTrackingLink {
  carrier: string;
  urlTemplate: string;
}

// ============================================
// SEO Settings Sub-interface
// ============================================

export interface ISEOSettings {
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  ogImage?: string;
}

// ============================================
// Social Settings Sub-interface
// ============================================

export interface ICustomShareButton {
  id: string;
  label: string;
  urlTemplate: string;
  enabled: boolean;
  /** Optional uploaded icon URL shown on the storefront share button. */
  icon?: string;
}

export interface ISocialShareSettings {
  enabled: boolean;
  copyLink: boolean;
  facebook: boolean;
  twitter: boolean;
  whatsapp: boolean;
  telegram: boolean;
  pinterest: boolean;
  linkedin: boolean;
  email: boolean;
  custom: ICustomShareButton[];
}

export interface ISocialSettings {
  facebookUrl?: string;
  twitterUrl?: string;
  instagramUrl?: string;
  youtubeUrl?: string;
  linkedinUrl?: string;
  tiktokUrl?: string;
  share?: ISocialShareSettings;
}

// ============================================
// Analytics Settings Sub-interface
// ============================================

export interface IAnalyticsSettings {
  googleAnalyticsId?: string;
  googleTagManagerId?: string;
  facebookPixelId?: string;
  tiktokPixelId?: string;
  plausibleDomain?: string;
  plausibleApiKey?: string;
  plausibleSelfHosted?: boolean;
  plausibleBaseUrl?: string;
}

// ============================================
// Maintenance Settings Sub-interface
// ============================================

export interface IMaintenanceSettings {
  enabled: boolean;
  title?: string;
  message?: string;
  backgroundImageUrl?: string;
  countdownEnabled?: boolean;
  countdownEndsAt?: string;
  allowedIPs?: string[];
}

// ============================================
// Security Settings Sub-interface
// ============================================

export const RATE_LIMIT_PRESETS = [
  "default",
  "lenient",
  "moderate",
  "strict",
] as const;

export type RateLimitPresetSetting = (typeof RATE_LIMIT_PRESETS)[number];

export interface IRateLimitingSettings {
  enabled: boolean;
  ipPreset: RateLimitPresetSetting;
  adminPreset: RateLimitPresetSetting;
  vendorPreset: RateLimitPresetSetting;
  checkoutPreset: RateLimitPresetSetting;
  cartPreset: RateLimitPresetSetting;
  couponPreset: RateLimitPresetSetting;
  authPreset: RateLimitPresetSetting;
}

export interface ISecuritySettings {
  // Email Verification
  emailVerificationRequired: boolean;
  emailVerificationForVendors: boolean;
  emailVerificationRequiredSince?: Date;
  emailVerificationForVendorsSince?: Date;
  smtpVerifiedAt?: Date;
  smtpVerificationFingerprint?: string;

  // Two-Factor Authentication
  twoFactorEnabled: boolean;
  twoFactorRequiredForAdmin: boolean;
  twoFactorRequiredForVendors: boolean;
  twoFactorRequiredForStaff: boolean;

  // OAuth Providers
  googleOAuthEnabled: boolean;
  googleClientId?: string;
  googleClientSecret?: string;
  facebookOAuthEnabled: boolean;
  facebookAppId?: string;
  facebookAppSecret?: string;

  // Session Security
  sessionMaxAgeDays: number;
  maxLoginAttempts: number;
  lockoutDurationMinutes: number;

  // Rate Limiting
  rateLimiting?: IRateLimitingSettings;

  // Password Policy
  minPasswordLength: number;
  requireUppercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;

  // Country Blocking
  countryBlocking?: {
    enabled: boolean;
    blockedCountries: string[];
    blockMessage?: string;
    redirectUrl?: string;
    allowlistIps?: string[];
  };
}

// ============================================
// POS Settings Sub-interface
// ============================================

export interface IPOSCustomizeSettings {
  printedReceiptsEnabled: boolean;
  receiptPrinter?: string;
  soundEnabled: boolean;
  soundVolume: number;
  soundAddToCart: boolean;
  soundOrderComplete: boolean;
  soundPayment: boolean;
  soundError: boolean;
  denominations?: number[];
}

/**
 * Re-exported from `lib/pos/payment.ts`, which is the canonical list. The
 * duplicate that used to live here had drifted: it named three methods while
 * the schema enum and the POS tab both offered four.
 */
export type POSPaymentMethod = POSSelectablePaymentMethod;

export interface IPOSCheckoutSettings {
  paymentMethods: POSPaymentMethod[];
  offlinePaymentsEnabled: boolean;
}

export interface IPOSOrdersSettings {
  orderNumberPrefix: string;
}

export interface IPOSReceiptSettings {
  logoUrl?: string;
  headerText?: string;
  footerText?: string;
  taxNumber?: string;
  showQrCode: boolean;
  qrCodeUrl?: string;
  returnPolicyText?: string;
}

export interface IPOSSettings {
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
  customize: IPOSCustomizeSettings;
  checkout: IPOSCheckoutSettings;
  orders: IPOSOrdersSettings;
  receipt: IPOSReceiptSettings;
}

export interface IMultiBranchSettings {
  enabled: boolean;
  allowBranchPickup: boolean;
  autoAssignOrderToNearestBranch: boolean;
  allowBranchInventoryTransfer: boolean;
  requireStaffBranchAssignment: boolean;
  defaultBranchId?: string;
}

export interface IWholesaleSettings {
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
}

export interface IMultiVendorModeSettings {
  enabled: boolean;
  canManageProducts: boolean;
  canViewOrders: boolean;
  canManageOrders: boolean;
  canManageStoreSettings: boolean;
  canViewAnalytics: boolean;
  canManageDiscounts: boolean;
  canManagePayouts: boolean;
  canAccessPOS: boolean;
  /**
   * One switch per capability pack — the layer that replaced the eight can*
   * booleans above. Absent on a store written before the split;
   * readVendorPolicyFlags() derives it from those booleans until the migration
   * writes it down, so nothing changes on deploy.
   */
  packPolicy?: Partial<Record<VendorPermissionPack, boolean>>;
}
// ============================================
// Vendor Configuration Sub-interface
// ============================================

/** Verification-document keys an admin can mark required at registration. */
export const VENDOR_DOCUMENT_KEYS = [
  "businessLicense",
  "taxId",
  "taxCertificate",
  "governmentId",
] as const;
export type VendorDocumentKey = (typeof VENDOR_DOCUMENT_KEYS)[number];

/**
 * Policy for the vendor onboarding + plan system. Separate from
 * `multiVendorMode` (mode + permission toggles); this group governs
 * registration, approval, and the subscription/plan feature. Every plan
 * surface is gated on `multiVendorMode.enabled && vendorConfig.plansEnabled`.
 */
/**
 * Which gateways may collect vendor→platform money (boosts, subscription
 * periods). An allowlist, not a capability: the effective offer is always
 * this ∩ settings.payment.<gw>.enabled — credentials stay in Payments.
 */
export interface IPlatformPaymentMethodSettings {
  stripe: boolean;
  paypal: boolean;
  razorpay: boolean;
  paystack: boolean;
  pesapal: boolean;
  iotec: boolean;
}

export interface IVendorConfigSettings {
  /** Master switch for the vendor plan/subscription feature. */
  plansEnabled: boolean;
  /** Whether new vendors may self-register via /become-vendor. */
  allowRegistration: boolean;
  /** Approve applications automatically instead of manual admin review. */
  autoApprove: boolean;
  /** Fallback free-trial length (days) when a paid plan is chosen. */
  freeTrialDays: number;
  /** Force a plan choice at onboarding vs. a silent default fallback. */
  requirePlanSelection: boolean;
  /** Documents an applicant must supply (subset of VENDOR_DOCUMENT_KEYS). */
  requiredDocuments: VendorDocumentKey[];
  /** Plan auto-assigned when the applicant picks none (set once plans exist). */
  defaultPlanId?: string;
  /** Gateways vendors may pay plan subscriptions through. */
  paymentMethods: IPlatformPaymentMethodSettings;
}

// ============================================
// Boosting (Sponsored Products) Sub-interface
// ============================================

/**
 * Policy for paid product boosting. Pricing lives on the BoostPosition ladder;
 * the home section's title/limit live in the home-page builder. This section is
 * the feature gate, the two storefront depths it owns, and the booking rules.
 */
export interface IBoostingSettings {
  /** Master switch. Off = no storefront output, no vendor nav, no purchases. */
  enabled: boolean;
  /** Gateways vendors may pay boosts through. */
  paymentMethods: IPlatformPaymentMethodSettings;
  /** Per-surface toggles for sponsored placements. */
  placements: {
    home: boolean;
    listing: boolean;
    productPage: boolean;
  };
  /** How many top ladder rungs render on a listing page (1–12). */
  listingSlots: number;
  /** How many top ladder rungs render on the product-page rail (1–12). */
  productPageSlots: number;
  /**
   * Drop a booked product that is out of stock. Not cosmetic: the day is
   * credited back to the vendor in proportion, so this is a refund policy.
   */
  hideOutOfStock: boolean;
  /** Minutes an unpaid checkout holds its booked days (35–120). */
  holdMinutes: number;
  /** How far ahead a booking may start, in days. */
  bookingHorizonDays: number;
  /** Longest single booking, in days. */
  maxBookingDays: number;
}

// ============================================
// Storage Settings Sub-interface
// ============================================

/** Fields every S3-compatible backend needs. */
interface IStorageCredentialsBase {
  bucketName?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  publicUrl?: string;
}

/**
 * Cloudflare R2. No `region` — R2 has exactly one and the provider hardcodes
 * "auto". No `endpoint`: it is derived from `accountId`.
 */
export interface IR2StorageCredentials extends IStorageCredentialsBase {
  accountId?: string;
}

/** Amazon S3 proper. No endpoint — the SDK builds it from the region. */
export interface IS3StorageCredentials extends IStorageCredentialsBase {
  region?: string;
}

/**
 * Self-hosted MinIO. The endpoint is the whole point: it can be any host, so
 * unlike the others it has to be typed in full.
 */
export interface IMinioStorageCredentials extends IStorageCredentialsBase {
  endpoint?: string;
  region?: string;
}

/**
 * DigitalOcean Spaces. The region *is* the endpoint
 * (`<region>.digitaloceanspaces.com`), so only the datacenter slug is asked
 * for — nyc3, sgp1, fra1…
 */
export interface IDigitalOceanStorageCredentials
  extends IStorageCredentialsBase {
  region?: string;
}

export interface IStorageSettings {
  /**
   * `"local"` is legacy, never offered: pre-v1.5 installs still hold it and
   * their files live on the server's disk. Kept in the enum so those documents
   * stay valid until the store picks one of the four real providers.
   */
  provider: "cloudflare_r2" | "s3" | "minio" | "digitalocean" | "local";

  /**
   * One credential block per provider — the shape `IPaymentSettings` already
   * uses for gateways. Configuring one no longer overwrites another's keys, so
   * a provider can be tested (or migrated away from) without retyping the one
   * that is live.
   */
  r2: IR2StorageCredentials;
  s3: IS3StorageCredentials;
  minio: IMinioStorageCredentials;
  digitalocean: IDigitalOceanStorageCredentials;

  /**
   * Pre-v1.5 flat credentials: a single shared set that whichever provider was
   * active had claimed. Kept as a read-only fallback in
   * `resolveStorageCredentials` so an un-migrated install keeps serving media;
   * `pnpm db:migrate:storage-credentials` moves them into the block above.
   * Nothing writes here any more — the admin save handler no longer accepts
   * these keys.
   *
   * @deprecated Removed in v2.0.
   */
  accountId?: string;
  endpoint?: string;
  region?: string;
  bucketName?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  publicUrl?: string;

  maxFileSizeMB: number;
  // Per-media-type limits, Shopify-style. Server picks the type-specific
  // limit when present; falls back to maxFileSizeMB for unknown types.
  maxImageSizeMB?: number;
  maxVideoSizeMB?: number;
  maxModelSizeMB?: number;
  allowedMimeTypes: string[];
  pathPrefix?: string;
}

import type {
  AISalesAgentModel,
  AISalesAgentReasoningEffort,
  AISalesAgentTone,
} from "@/lib/ai-sales-agent/models";

export type { AISalesAgentModel, AISalesAgentReasoningEffort, AISalesAgentTone };

export interface IAISalesAgentCapabilities {
  productQA: boolean;
  recommendations: boolean;
  cartActions: boolean;
  checkoutHandoff: boolean;
  orderStatus: boolean;
}

export type AISalesAgentWidgetTheme =
  | "nexus-modern"
  | "nexus-glass"
  | "nexus-cyber-hud"
  | "nexus-capsule";

export interface IAISalesAgentWidgetSettings {
  position: "bottom-right" | "bottom-left";
  primaryColor: string;
  accentColor: string;
  widgetTheme?: AISalesAgentWidgetTheme;
  avatarUrl?: string;
  footerText?: string;
  headerTitle?: string;
  width: number;
  height: number;
  showFooterText: boolean;
}

export interface IAISalesAgentFaqEntry {
  question: string;
  answer: string;
  tags?: string[];
}

export interface IAISalesAgentSettings {
  enabled: boolean;
  provider: "openai" | "anthropic" | "ollama" | "custom";
  customBaseUrl?: string;
  customApiKey?: string;
  customModel?: string;
  model: AISalesAgentModel;
  temperature: number;
  reasoningEffort: AISalesAgentReasoningEffort;
  maxRecommendations: number;
  agentName: string;
  greeting: string;
  tone: AISalesAgentTone;
  instructions?: string;
  escalationMessage: string;
  widget: IAISalesAgentWidgetSettings;
  capabilities: IAISalesAgentCapabilities;
  faq: IAISalesAgentFaqEntry[];
}

export interface IAIAuthoringSurfaces {
  products: boolean;
  categories: boolean;
  collections: boolean;
  brands: boolean;
  blogPosts: boolean;
  contentPages: boolean;
  reviews: boolean;
  heroBanner: boolean;
}

export interface IAIAuthoringSettings {
  enabled: boolean;
  /** Shared OpenAI key for all AI features; OPENAI_API_KEY is the env fallback. */
  apiKey?: string;
  /** Empty string = inherit OPENAI_AUTHORING_TEXT_MODEL env or the built-in default. */
  textModel: string;
  /** Empty string = inherit OPENAI_AUTHORING_IMAGE_MODEL env or the built-in default. */
  imageModel: string;
  surfaces: IAIAuthoringSurfaces;
  imageDefaults: {
    size: "auto" | "1024x1024" | "1024x1536" | "1536x1024";
    quality: "auto" | "medium" | "high";
  };
  brandVoice: {
    /** Empty string = no default tone. */
    tone: string;
    instructions: string;
    /** Style guidance appended to every image generation prompt. */
    imageStyle: string;
  };
  /** Brand kit — colors and logo used by image generation and social export. */
  brandKit: {
    /** Hex color, "" = none. Hints generation and sets the export pad color. */
    primaryColor: string;
    secondaryColor: string;
    /** Own-storage logo URL, "" = none. Optional lockup on social exports. */
    logoUrl: string;
  };
  access: {
    staffEnabled: boolean;
    vendorsEnabled: boolean;
  };
  limits: {
    /** 0 = unlimited. */
    textPerUserPerDay: number;
    imagePerUserPerDay: number;
  };
}

export type IHomePageSettings = HomePageSettings;
export type IContentPagesSettings = ContentPagesSettings;

export interface IFloatingTabItem {
  id: string;
  name: string;
  icon: string;
  url?: string;
  type: "link" | "ai_assistant" | "back_to_top" | "category_trigger";
}

export interface IFloatingTabSettings {
  id: string;
  name: string;
  position: "left-center" | "left-bottom" | "right-center" | "right-bottom";
  styleVariant: "temu" | "alibaba" | "aliexpress" | "default";
  items: IFloatingTabItem[];
}

export interface ILoginPageSettings {
  style?: "classic-split" | "modern-glass" | "dark-luxury" | "minimal-clean" | "vibrant-gradient" | "professional-corporate";
  logoUrl?: string;
  backgroundImageUrl?: string;
  sideImageUrl?: string;
  primaryColor?: string;
  accentColor?: string;
  heading?: string;
  subheading?: string;
  socialLoginEnabled?: boolean;
  otpLoginEnabled?: boolean;
  cardPosition?: "center" | "left" | "right";
  formBorderRadius?: string;
}

export interface ITrackOrderSettings {
  theme: "modern-glass" | "classic-minimal" | "vibrant-gradient" | "dark-luxury" | "corporate-pro";
  showMapIllustration: boolean;
  showItemList: boolean;
  accentColor?: string;
  enableGlassmorphism: boolean;
}

export interface IOnlineStoreSettings {
  activeTheme?: string;
  /** Per-theme values: { [themeId]: Record<fieldKey, value> }. */
  themeSettings?: Record<string, Record<string, unknown>>;
  floatingTabs?: IFloatingTabSettings[];
  trackOrder?: ITrackOrderSettings;
}
export type INotificationSettings = NotificationSettings;
export type IHeaderSettings = HeaderSettings;
export type IFooterSettings = FooterSettings;
export type ICheckoutSettings = CheckoutSettings;
export type IProductPageSettings = ProductPageSettings;

export interface IComplianceSettings {
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
}

// ============================================
// Main Settings Interface
// ============================================

/**
 * There is exactly one settings document, and until this existed nothing said
 * so. `findOne()` followed by `create({})` let two concurrent requests on a
 * fresh install both miss and both insert; from then on reads and writes could
 * land on different documents with no error anywhere. The constant key plus a
 * unique index turns that silent fork into a caught write.
 */
export const SETTINGS_SINGLETON_KEY = "singleton";

export interface ISettings extends Document {
  /** Always `SETTINGS_SINGLETON_KEY`. Exists only to carry the unique index. */
  key?: string;

  // Grouped Sub-documents
  general: IGeneralSettings;
  appearance: IAppearanceSettings;
  compliance: IComplianceSettings;
  payment: IPaymentSettings;
  email: IEmailSettings;
  sms: ISMSProviderSettings;
  otp: IOTPSettings;
  whatsapp: IWhatsAppSettings;
  orders: IOrderSettings;
  shipping: IShippingSettings;
  seo: ISEOSettings;
  social: ISocialSettings;
  analytics: IAnalyticsSettings;
  maintenance: IMaintenanceSettings;
  security: ISecuritySettings;
  pos: IPOSSettings;
  multiBranch: IMultiBranchSettings;
  wholesale?: IWholesaleSettings;
  multiVendorMode: IMultiVendorModeSettings;
  vendorConfig: IVendorConfigSettings;
  boosting: IBoostingSettings;
  notifications: INotificationSettings;
  storage: IStorageSettings;
  aiSalesAgent: IAISalesAgentSettings;
  aiAuthoring: IAIAuthoringSettings;
  header: IHeaderSettings;
  footer: IFooterSettings;
  /** Storefront checkout appearance (constrained editor, never sectionized). */
  checkout: ICheckoutSettings;
  homePage: IHomePageSettings;
  productPages: IProductPageSettings;
  contentPages: IContentPagesSettings;
  /**
   * Store-wide product card configurator (element order groups, visibility,
   * style). Stored Mixed and normalized at every read through
   * `normalizeProductCardConfig()` — lib/products/product-card-config.ts,
   * not this document, defines the shape.
   */
  productCard: unknown;
  /** Login Page customizer settings (layout, custom logo, background image, OTP, social login, colors) */
  loginPage?: ILoginPageSettings;
  /**
   * Theme engine state: which theme is active and each theme's setting
   * values, keyed by theme id so switching preserves both sides. Stored
   * Mixed and normalized at every read through `resolveActiveTheme()` —
   * the manifest's schema, not this document, defines the shape. Written
   * only by /api/admin/theme-settings, never by the settings PUT.
   */
  onlineStore: IOnlineStoreSettings;
  /** Set once by the install wizard; its presence hard-locks /install. */
  installedAt?: Date;
  /**
   * Short-lived lease held while a wizard run is creating the admin. The
   * lock itself is `installedAt`/an existing admin; this only stops two
   * concurrent runs from both getting through the check.
   */
  installClaimedAt?: Date | null;

  // Metadata
  updatedAt: Date;
  updatedBy?: string;
}

// ============================================
// Mongoose Schema
// ============================================

// Shared by vendorConfig.paymentMethods and boosting.paymentMethods. All
// default true: the allowlist only narrows what Payments already enables.
const PlatformPaymentMethodsSchema = new Schema<IPlatformPaymentMethodSettings>(
  {
    stripe: { type: Boolean, default: true },
    paypal: { type: Boolean, default: true },
    razorpay: { type: Boolean, default: true },
    paystack: { type: Boolean, default: true },
    pesapal: { type: Boolean, default: true },
    iotec: { type: Boolean, default: true },
  },
  { _id: false },
);

/**
 * Shared by both carrier blocks — the shape is the same and the meaning is the
 * same, and two copies is how one of them ends up without the message field.
 */
/**
 * One rate-limit preset field. A factory rather than a shared object because
 * Mongoose needs a distinct definition per path — and rather than seven copies
 * of the same enum literal, which is how six of them stay in step and the
 * seventh quietly does not.
 */
const rateLimitPresetField = () => ({
  type: String,
  enum: [...RATE_LIMIT_PRESETS],
  default: "default",
});

const CarrierAuthFailureSchema = new Schema<ICarrierAuthFailure>(
  {
    at: { type: Date, required: true },
    message: { type: String, maxlength: 500 },
  },
  { _id: false },
);

const SettingsSchema = new Schema<ISettings>(
  {
    // Documents written before this field existed carry no key at all. A unique
    // index treats those as null and allows exactly one, which is precisely the
    // guarantee wanted — so an un-migrated install is already protected.
    key: {
      type: String,
      default: SETTINGS_SINGLETON_KEY,
      unique: true,
    },

    // General Settings
    general: {
      type: new Schema(
        {
          storeName: {
            type: String,
            required: true,
            default: DEFAULT_STORE_NAME,
          },
          storeDescription: String,
          storeEmail: {
            type: String,
            required: true,
            default: "store@example.com",
          },
          storePhone: String,
          storeDomain: String,
          storeAddress: String,
          logoUrl: String,
          darkModeLogoUrl: String,
          faviconUrl: String,
          appIconUrl: String,
          defaultLanguage: { type: String, default: DEFAULT_LANGUAGE },
          defaultCurrency: { type: String, default: DEFAULT_CURRENCY },
          disableDecimals: { type: Boolean, default: false },
          blockedCountries: { type: [String], default: [] },
          blockedMessage: String,
          deliveryInformation: { type: Schema.Types.Mixed, default: [] },
          supportedLanguages: {
            type: [String],
            default: ["en", "bn", "ar", "hi", "zh", "ja", "ko", "fr", "es"],
          },
          supportedCurrencies: {
            type: [String],
            default: ["USD", "EUR", "GBP", "BDT", "INR", "UGX"],
          },
          exchangeRateProvider: {
            type: String,
            enum: ["open.er-api.com", "exchangerate-api.com", "custom"],
            default: "open.er-api.com",
          },
          exchangeRateApiKey: {
            type: String,
            default: "",
          },
          hideDefaultLocalePrefix: {
            type: Boolean,
            default: false,
          },
          countryAvailability: {
            type: new Schema(
              {
                mode: {
                  type: String,
                  enum: Object.values(COUNTRY_AVAILABILITY_MODES),
                  default: DEFAULT_COUNTRY_AVAILABILITY.mode,
                },
                countryCodes: {
                  type: [String],
                  default: [],
                },
              },
              { _id: false },
            ),
            default: () => ({
              ...DEFAULT_COUNTRY_AVAILABILITY,
              countryCodes: [...DEFAULT_COUNTRY_AVAILABILITY.countryCodes],
            }),
          },
          timezone: { type: String, default: DEFAULT_TIMEZONE },
          multiBranchMode: {
            type: new Schema(
              {
                enabled: { type: Boolean, default: false },
                defaultBranchId: { type: String },
              },
              { _id: false }
            ),
            default: () => ({ enabled: false }),
          },
        },
        { _id: false },
      ),
      default: () => ({}),
    },

    // Appearance Settings
    appearance: {
      type: new Schema(
        {
          primaryColor: { type: String, default: DEFAULT_PRIMARY_COLOR },
          secondaryColor: { type: String, default: DEFAULT_SECONDARY_COLOR },
          accentColor: { type: String, default: DEFAULT_ACCENT_COLOR },
          theme: {
            type: String,
            // "system" stays in the enum only so documents written before
            // OS-preference mode was removed still validate on save (Mongoose
            // validates the whole document, not just modified paths, and
            // setters don't run on hydrate). `migrateSettings()` rewrites it to
            // "light" and every read goes through `normalizeThemeMode`, so it
            // is never honored as a mode.
            enum: ["light", "dark", "system"],
            default: DEFAULT_THEME_MODE,
          },
          contrast: { type: Boolean, default: false },
          rtl: { type: Boolean, default: false },
          collapsedSidebar: { type: Boolean, default: false },
          navLayout: {
            type: String,
            enum: ["vertical", "horizontal", "mini"],
            default: "mini",
          },
          navColor: {
            type: String,
            enum: ["integrate", "apparent"],
            default: "integrate",
          },
          presetColor: {
            type: String,
            enum: ["default", "cyan", "purple", "blue", "orange", "red"],
            default: DEFAULT_PRESET_COLOR,
          },
          customPresets: {
            type: [
              new Schema(
                {
                  id: { type: String, required: true },
                  name: { type: String, default: "" },
                  primaryColor: { type: String, default: "" },
                  secondaryColor: { type: String, default: "" },
                  accentColor: { type: String, default: "" },
                },
                { _id: false },
              ),
            ],
            default: [],
          },
          fontFamily: String,
          borderRadius: String,
          adminLayout: {
            type: String,
            enum: ["cards", "dense", "studio", "minimal", "command"],
            default: "cards",
          },
          headerButtonStyle: {
            type: String,
            enum: ["default", "capsule", "cyber", "glass", "luxe"],
            default: "capsule",
          },
          dashboardTemplate: {
            type: String,
            default: "executive",
          },
          typography: {
            type: new Schema(
              {
                headingFont: { type: String, default: "Inter" },
                headingWeight: { type: Number, default: 700 },
                headingLetterSpacing: { type: String, default: "-0.02em" },
                headingTransform: { type: String, default: "none" },
                headingColor: { type: String, default: "" },
                bodyFont: { type: String, default: "Inter" },
                bodyWeight: { type: Number, default: 400 },
                bodyLineHeight: { type: String, default: "1.5" },
                bodyColor: { type: String, default: "" },
                monoFont: { type: String, default: "Geist Mono" },
                monoColor: { type: String, default: "" },
                accentFont: { type: String, default: "" },
                customFonts: {
                  type: [
                    new Schema(
                      {
                        id: { type: String, required: true },
                        name: { type: String, required: true },
                        fileUrl: { type: String, required: true },
                        format: { type: String, default: "woff2" },
                        weight: { type: Number, default: 400 },
                      },
                      { _id: false },
                    ),
                  ],
                  default: [],
                },
              },
              { _id: false },
            ),
            default: () => ({}),
          },
          authUI: {
            type: new Schema({
              theme: {
                type: String,
                default: "split",
              },
              popupEnabled: {
                type: Boolean,
                default: true,
              },
              coverImage: { type: String, default: "" },
              logoUrl: { type: String, default: "" },
              backgroundImageUrl: { type: String, default: "" },
              sideImageUrl: { type: String, default: "" },
              heading: { type: String, default: "" },
              subheading: { type: String, default: "" },
            }, { _id: false }),
            default: () => ({ theme: "split", popupEnabled: true })
          },
          paymentIcons: { type: [String], default: [] },
        },
        { _id: false },
      ),
      default: () => ({}),
    },

    // Compliance Settings
    compliance: {
      type: new Schema(
        {
          cookieConsent: {
            type: new Schema(
              {
                enabled: { type: Boolean, default: false },
                layout: {
                  type: String,
                  enum: ["bottom-banner", "center-modal"],
                  default: "bottom-banner",
                },
                theme: {
                  type: String,
                  enum: ["light", "dark", "system"],
                  default: "system",
                },
                privacyPolicyUrl: { type: String, default: "" },
                text: {
                  type: new Schema(
                    {
                      title: { type: String, default: "Cookie Consent" },
                      message: {
                        type: String,
                        default:
                          "We use cookies to enhance your browsing experience, serve personalized ads or content, and analyze our traffic. By clicking 'Accept All', you consent to our use of cookies.",
                      },
                      acceptButton: { type: String, default: "Accept All" },
                      declineButton: { type: String, default: "Decline Optional" },
                    },
                    { _id: false }
                  ),
                  default: () => ({}),
                },
              },
              { _id: false }
            ),
            default: () => ({}),
          },
        },
        { _id: false }
      ),
      default: () => ({}),
    },

    // Online Store Settings
    onlineStore: {
      type: new Schema(
        {
          activeTheme: { type: String, default: "default" },
          themeSettings: { type: Schema.Types.Mixed, default: {} },
          floatingTabs: {
            type: [
              new Schema(
                {
                  id: { type: String, required: true },
                  name: { type: String, required: true },
                  position: {
                    type: String,
                    enum: ["left-center", "left-bottom", "right-center", "right-bottom"],
                    default: "right-center",
                  },
                  styleVariant: {
                    type: String,
                    enum: ["temu", "alibaba", "aliexpress", "default", "glass-panel", "modern-glow", "neumorphic", "rounded-float", "block-edge", "pill-minimal", "edge-reveal", "icon-dock", "gradient-burst"],
                    default: "temu",
                  },
                  displayOnMobile: {
                    type: Boolean,
                    default: true,
                  },
                  items: {
                    type: [
                      new Schema(
                        {
                          id: { type: String, required: true },
                          name: { type: String, required: true },
                          icon: { type: String, required: true },
                          url: { type: String },
                          type: {
                            type: String,
                            enum: ["link", "ai_assistant", "back_to_top", "category_trigger"],
                            default: "link",
                          },
                        },
                        { _id: false },
                      ),
                    ],
                    default: [],
                  },
                },
                { _id: false },
              ),
            ],
            default: [],
          },
          trackOrder: {
            type: new Schema(
              {
                theme: {
                  type: String,
                  enum: ["modern-glass", "classic-minimal", "vibrant-gradient", "dark-luxury", "corporate-pro"],
                  default: "modern-glass",
                },
                showMapIllustration: { type: Boolean, default: true },
                showItemList: { type: Boolean, default: true },
                accentColor: { type: String, default: "#10b981" },
                enableGlassmorphism: { type: Boolean, default: true },
              },
              { _id: false },
            ),
            default: () => ({
              theme: "modern-glass",
              showMapIllustration: true,
              showItemList: true,
              accentColor: "#10b981",
              enableGlassmorphism: true,
            }),
          },
        },
        { _id: false },
      ),
      default: () => ({}),
    },

    // Payment Settings
    payment: {
      type: new Schema(
        {
          stripe: {
            type: new Schema(
              {
                enabled: { type: Boolean, default: false },
                publishableKey: String,
                secretKey: String,
                webhookSecret: String,
              },
              { _id: false },
            ),
            default: () => ({}),
          },
          paypal: {
            type: new Schema(
              {
                enabled: { type: Boolean, default: false },
                clientId: String,
                clientSecret: String,
                mode: {
                  type: String,
                  enum: ["sandbox", "live"],
                  default: "sandbox",
                },
                webhookId: String,
              },
              { _id: false },
            ),
            default: () => ({}),
          },
          razorpay: {
            type: new Schema(
              {
                enabled: { type: Boolean, default: false },
                keyId: String,
                keySecret: String,
                webhookSecret: String,
              },
              { _id: false },
            ),
            default: () => ({}),
          },
          paystack: {
            type: new Schema(
              {
                enabled: { type: Boolean, default: false },
                publicKey: String,
                secretKey: String,
                passChargesToCustomer: { type: Boolean, default: false },
              },
              { _id: false },
            ),
            default: () => ({}),
          },
          pesapal: {
            type: new Schema(
              {
                enabled: { type: Boolean, default: false },
                consumerKey: String,
                consumerSecret: String,
                mode: {
                  type: String,
                  enum: ["sandbox", "live"],
                  default: "sandbox",
                },
                ipnId: String,
              },
              { _id: false },
            ),
            default: () => ({}),
          },
          iotec: {
            type: new Schema(
              {
                enabled: { type: Boolean, default: false },
                clientId: String,
                clientSecret: String,
                walletId: String,
                mode: {
                  type: String,
                  enum: ["sandbox", "live"],
                  default: "sandbox",
                },
              },
              { _id: false },
            ),
            default: () => ({}),
          },
          cod: {
            type: new Schema(
              {
                enabled: { type: Boolean, default: true },
                instructions: String,
                minOrderAmount: Number,
                maxOrderAmount: Number,
              },
              { _id: false },
            ),
            default: () => ({}),
          },
        },
        { _id: false },
      ),
      default: () => ({}),
    },

    // SMS Settings
    sms: {
      type: new Schema(
        {
          enabled: { type: Boolean, default: false },
          provider: {
            type: String,
            enum: ["twilio", "messagebird", "hubtel", "arkesel"],
            default: "twilio",
          },
          twilioAccountSid: String,
          twilioAuthToken: String,
          twilioFromNumber: String,
          messagebirdAccessKey: String,
          messagebirdOriginator: String,
          hubtelClientId: String,
          hubtelClientSecret: String,
          hubtelSenderId: String,
          arkeselApiKey: String,
          arkeselSenderId: String,
        },
        { _id: false },
      ),
      default: () => ({ enabled: false, provider: "twilio" }),
    },

    // OTP Settings
    otp: {
      type: new Schema(
        {
          enabled: { type: Boolean, default: false },
          methods: {
            type: [String],
            enum: ["email", "sms"],
            default: ["email"],
          },
          enforceForAdmin: { type: Boolean, default: false },
          enforceForVendor: { type: Boolean, default: false },
          enforceForCustomer: { type: Boolean, default: false },
        },
        { _id: false },
      ),
      default: () => ({
        enabled: false,
        methods: ["email"],
        enforceForAdmin: false,
        enforceForVendor: false,
        enforceForCustomer: false,
      }),
    },

    // WhatsApp Settings
    whatsapp: {
      type: new Schema(
        {
          enabled: { type: Boolean, default: false },
          provider: { type: String, enum: ["meta", "twilio", "messagebird"], default: "meta" },
          metaPhoneNumberId: { type: String },
          metaAccessToken: { type: String },
          twilioAccountSid: { type: String },
          twilioAuthToken: { type: String },
          twilioPhoneNumber: { type: String },
          messagebirdAccessKey: { type: String },
          messagebirdChannelId: { type: String },
          templates: {
            orderConfirmation: { type: String, default: "" },
            shippingUpdate: { type: String, default: "" },
            delivery: { type: String, default: "" },
            reviewRequest: { type: String, default: "" },
          },
        },
        { _id: false }
      ),
      default: () => ({
        enabled: false,
        provider: "meta",
        templates: {
          orderConfirmation: "",
          shippingUpdate: "",
          delivery: "",
          reviewRequest: "",
        },
      }),
    },

    // Email Settings
    email: {
      type: new Schema(
        {
          provider: {
            type: String,
            enum: ["smtp", "sendgrid", "ses", "mailgun"],
            default: "smtp",
          },
          enabled: { type: Boolean, default: false },
          smtp: {
            type: new Schema(
              {
                host: String,
                port: { type: Number, default: 587 },
                user: String,
                password: String,
                secure: { type: Boolean, default: false },
              },
              { _id: false },
            ),
            default: () => ({}),
          },
          fromEmail: String,
          fromName: String,
          replyTo: String,
          apiKey: String,
          logRetentionDays: {
            type: Number,
            enum: [7, 30, 90],
            default: 30,
          },
        },
        { _id: false },
      ),
      default: () => ({}),
    },

    // Order Settings
    orders: {
      type: new Schema(
        {
          prefix: {
            type: String,
            default: DEFAULT_ORDER_PREFIX,
            trim: true,
            uppercase: true,
            match: ORDER_PREFIX_PATTERN,
          },
          taxRate: {
            type: Number,
            default: DEFAULT_ORDER_TAX_RATE,
            min: 0,
            max: 1,
          },
          freeShippingThreshold: { type: Number, default: 0, min: 0 },
          defaultShippingCost: {
            type: Number,
            default: DEFAULT_ORDER_SHIPPING_COST,
            min: 0,
          },
          commission: {
            type: new Schema(
              {
                vendorRate: {
                  type: Number,
                  default: DEFAULT_VENDOR_COMMISSION_RATE,
                  min: 0,
                  max: 100,
                },
                minWithdrawalAmount: {
                  type: Number,
                  default: DEFAULT_MIN_WITHDRAWAL_AMOUNT,
                  min: 0,
                },
              },
              { _id: false },
            ),
            default: () => ({}),
          },
          returns: {
            type: new Schema(
              {
                shippingRefund: {
                  type: String,
                  enum: RETURN_SHIPPING_REFUND_MODES,
                  default: DEFAULT_RETURN_SHIPPING_REFUND,
                },
                restockingFeePercent: {
                  type: Number,
                  default: DEFAULT_RESTOCKING_FEE_PERCENT,
                  min: 0,
                  max: 100,
                },
                returnShippingFee: {
                  type: Number,
                  default: DEFAULT_RETURN_SHIPPING_FEE,
                  min: 0,
                },
                refundAdminFeePercent: {
                  type: Number,
                  default: DEFAULT_REFUND_ADMIN_FEE_PERCENT,
                  min: 0,
                  max: 100,
                },
                // 0 means uncapped, which is why there is no max here.
                refundAdminFeeCap: {
                  type: Number,
                  default: DEFAULT_REFUND_ADMIN_FEE_CAP,
                  min: 0,
                },
                billVendorCodShipping: {
                  type: Boolean,
                  default: DEFAULT_BILL_VENDOR_COD_SHIPPING,
                },
              },
              { _id: false },
            ),
            default: () => ({}),
          },
        },
        { _id: false },
      ),
      default: () => ({}),
    },

    shipping: {
      type: new Schema(
        {
          enabled: { type: Boolean, default: false },
          weightUnit: {
            type: String,
            enum: ["kg", "lb"],
            default: "kg",
          },
          origin: {
            type: new Schema(
              {
                country: { type: String, default: "" },
                state: String,
                city: String,
                postalCode: String,
                address1: String,
                address2: String,
              },
              { _id: false },
            ),
            default: undefined,
          },
          delivery: {
            type: new Schema(
              {
                processingDaysMin: { type: Number, default: 0 },
                processingDaysMax: { type: Number, default: 0 },
                showEstimatedDelivery: { type: Boolean, default: true },
              },
              { _id: false },
            ),
            default: () => ({}),
          },
          zones: {
            type: [
              new Schema(
                {
                  id: { type: String, required: true },
                  name: { type: String, required: true },
                  countries: { type: [String], default: [] },
                  regions: { type: [String], default: [] },
                  isFallback: { type: Boolean, default: false },
                  rates: {
                    type: [
                      new Schema(
                        {
                          id: { type: String, required: true },
                          name: { type: String, required: true },
                          type: {
                            type: String,
                            enum: [
                              "flat",
                              "free_over",
                              "subtotal_range",
                              "weight_range",
                            ],
                            default: "flat",
                          },
                          price: { type: Number, default: 0 },
                          freeOver: Number,
                          minSubtotal: Number,
                          maxSubtotal: Number,
                          minWeight: Number,
                          maxWeight: Number,
                          pricePerWeightUnit: Number,
                          minDays: Number,
                          maxDays: Number,
                          active: { type: Boolean, default: true },
                        },
                        { _id: false },
                      ),
                    ],
                    default: [],
                  },
                },
                { _id: false },
              ),
            ],
            default: [],
          },
          fallbackRate: {
            type: new Schema(
              {
                enabled: { type: Boolean, default: false },
                name: { type: String, default: "Standard" },
                price: { type: Number, default: 0 },
                minDays: Number,
                maxDays: Number,
              },
              { _id: false },
            ),
            default: () => ({}),
          },
          customs: {
            type: new Schema(
              {
                enabled: { type: Boolean, default: false },
                dutyMode: {
                  type: String,
                  enum: ["DDP", "DDU"],
                  default: "DDU",
                },
                dutyRatePercent: Number,
                deMinimis: Number,
              },
              { _id: false },
            ),
            default: () => ({}),
          },
          vendorShipping: {
            type: new Schema(
              {
                enabled: { type: Boolean, default: false },
              },
              { _id: false },
            ),
            default: () => ({}),
          },
          // Store-wide default for who collects COD cash. `vendor` preserves
          // the behaviour every existing order already has.
          codCollectedBy: {
            type: String,
            enum: Object.values(COD_COLLECTED_BY),
            default: COD_COLLECTED_BY.VENDOR,
          },

          // Carrier integration. Mongoose runs in strict mode, so a key absent
          // from this block is silently dropped by `settings.set()` — every new
          // carrier field must be declared here as well as on the interface.
          carriers: {
            type: new Schema(
              {
                enabled: { type: Boolean, default: false },
                labelStorage: {
                  type: String,
                  enum: CARRIER_LABEL_STORAGE_MODES,
                  default: "carrier_url",
                },
                shippo: {
                  type: new Schema(
                    {
                      enabled: { type: Boolean, default: false },
                      mode: {
                        type: String,
                        enum: CARRIER_MODES,
                        default: "test",
                      },
                      testToken: String,
                      liveToken: String,
                      webhookSecret: String,
                      webhookSecretHash: String,
                      webhookRegisteredAt: Date,
                      labelFileType: {
                        type: String,
                        enum: CARRIER_LABEL_FILE_TYPES,
                        default: "PDF_4x6",
                      },
                      serviceTokenAllowList: { type: [String], default: [] },
                      authFailure: {
                        type: CarrierAuthFailureSchema,
                        default: undefined,
                      },
                    },
                    { _id: false },
                  ),
                  default: () => ({}),
                },
                shiprocket: {
                  type: new Schema(
                    {
                      enabled: { type: Boolean, default: false },
                      email: String,
                      password: String,
                      pickupLocationName: String,
                      channelId: String,
                      webhookToken: String,
                      courierIdAllowList: { type: [Number], default: [] },
                      tokenCache: {
                        type: new Schema(
                          {
                            token: String,
                            expiresAt: Date,
                          },
                          { _id: false },
                        ),
                        default: () => ({}),
                      },
                      authFailure: {
                        type: CarrierAuthFailureSchema,
                        default: undefined,
                      },
                    },
                    { _id: false },
                  ),
                  default: () => ({}),
                },
              },
              { _id: false },
            ),
            default: () => ({}),
          },

          // Seeded with one box so the packer never reaches its last-resort
          // branch on a fresh install, and no seed script is needed.
          packages: {
            type: [
              new Schema(
                {
                  id: { type: String, required: true },
                  name: { type: String, required: true, maxlength: 120 },
                  length: { type: Number, required: true, min: 0 },
                  width: { type: Number, required: true, min: 0 },
                  height: { type: Number, required: true, min: 0 },
                  dimensionUnit: {
                    type: String,
                    enum: DIMENSION_UNITS,
                    default: "cm",
                  },
                  emptyWeight: { type: Number, min: 0, default: 0 },
                  weightUnit: {
                    type: String,
                    enum: PARCEL_WEIGHT_UNITS,
                    default: "kg",
                  },
                  maxWeight: { type: Number, min: 0 },
                  isDefault: { type: Boolean, default: false },
                  active: { type: Boolean, default: true },
                },
                { _id: false },
              ),
            ],
            default: () => [{ ...DEFAULT_PACKAGE_PRESET }],
          },

          automation: {
            type: new Schema(
              {
                enabled: { type: Boolean, default: false },
                // Off by default: a COD order is unpaid by definition, and
                // auto-buying a label for one is the merchant's risk to take
                // deliberately rather than inherit.
                includeCod: { type: Boolean, default: false },
                minOrderValue: { type: Number, min: 0 },
                maxOrderValue: { type: Number, min: 0 },
                rateChoice: {
                  type: String,
                  enum: CARRIER_RATE_CHOICES,
                  default: "cheapest",
                },
                fixedProvider: { type: String, enum: CARRIER_PROVIDERS },
                fixedServiceToken: String,
                buyLabel: { type: Boolean, default: true },
                markOrderShipped: { type: Boolean, default: true },
                restrictToCountries: { type: [String], default: [] },
                maxLabelCost: { type: Number, min: 0 },
              },
              { _id: false },
            ),
            default: () => ({}),
          },

          // Empty by default: the built-in list already covers the couriers
          // named in `tracking-urls.ts`, and a store that never hand-enters an
          // AWB needs none of this.
          courierTrackingLinks: {
            type: [
              new Schema(
                {
                  carrier: { type: String, required: true, trim: true, maxlength: 100 },
                  urlTemplate: {
                    type: String,
                    required: true,
                    trim: true,
                    maxlength: 500,
                  },
                },
                { _id: false },
              ),
            ],
            default: () => [],
          },

          ghanaDeliveryMethods: {
            type: [
              new Schema(
                {
                  id: { type: String, required: true },
                  name: { type: String, required: true },
                  iconUrl: { type: String },
                  description: { type: String },
                  basePrice: { type: Number, required: true, min: 0 },
                  minDays: { type: Number, required: true, min: 1 },
                  maxDays: { type: Number, required: true, min: 1 },
                  active: { type: Boolean, default: true },
                  coverageRegions: { type: [String], default: [] },
                  trackingUrlTemplate: { type: String },
                  createdAt: { type: Date, default: Date.now },
                  updatedAt: { type: Date, default: Date.now },
                },
                { _id: false },
              ),
            ],
            default: () => [],
          },
        },
        { _id: false },
      ),
      default: () => ({}),
    },

    // SEO Settings
    seo: {
      type: new Schema(
        {
          metaTitle: String,
          metaDescription: String,
          metaKeywords: String,
          ogImage: String,
        },
        { _id: false },
      ),
      default: () => ({}),
    },

    // Social Settings
    social: {
      type: new Schema(
        {
          facebookUrl: String,
          twitterUrl: String,
          instagramUrl: String,
          youtubeUrl: String,
          linkedinUrl: String,
          tiktokUrl: String,
          share: {
            type: new Schema(
              {
                enabled: { type: Boolean, default: true },
                copyLink: { type: Boolean, default: true },
                facebook: { type: Boolean, default: true },
                twitter: { type: Boolean, default: true },
                whatsapp: { type: Boolean, default: true },
                telegram: { type: Boolean, default: false },
                pinterest: { type: Boolean, default: false },
                linkedin: { type: Boolean, default: false },
                email: { type: Boolean, default: true },
                custom: {
                  type: [
                    new Schema(
                      {
                        id: String,
                        label: String,
                        urlTemplate: String,
                        enabled: { type: Boolean, default: true },
                        icon: String,
                      },
                      { _id: false },
                    ),
                  ],
                  default: [],
                },
              },
              { _id: false },
            ),
            default: () => ({}),
          },
        },
        { _id: false },
      ),
      default: () => ({}),
    },

    // Analytics Settings
    analytics: {
      type: new Schema(
        {
          googleAnalyticsId: String,
          googleTagManagerId: String,
          facebookPixelId: String,
          tiktokPixelId: String,
          plausibleDomain: String,
          plausibleApiKey: String,
          plausibleSelfHosted: { type: Boolean, default: false },
          plausibleBaseUrl: String,
        },
        { _id: false },
      ),
      default: () => ({}),
    },

    // Maintenance Settings
    maintenance: {
      type: new Schema(
        {
          enabled: { type: Boolean, default: false },
          title: {
            type: String,
            default: `${DEFAULT_STORE_NAME} is temporarily offline`,
          },
          message: {
            type: String,
            default:
              "We're making a few improvements behind the scenes. Thanks for your patience.",
          },
          backgroundImageUrl: String,
          countdownEnabled: { type: Boolean, default: false },
          countdownEndsAt: String,
          allowedIPs: { type: [String], default: [] },
        },
        { _id: false },
      ),
      default: () => ({}),
    },

    // Security Settings
    security: {
      type: new Schema(
        {
          emailVerificationRequired: { type: Boolean, default: false },
          emailVerificationForVendors: { type: Boolean, default: false },
          emailVerificationRequiredSince: Date,
          emailVerificationForVendorsSince: Date,
          smtpVerifiedAt: Date,
          smtpVerificationFingerprint: String,
          twoFactorEnabled: { type: Boolean, default: false },
          twoFactorRequiredForAdmin: { type: Boolean, default: false },
          twoFactorRequiredForVendors: { type: Boolean, default: false },
          twoFactorRequiredForStaff: { type: Boolean, default: false },
          googleOAuthEnabled: { type: Boolean, default: false },
          googleClientId: String,
          googleClientSecret: String,
          facebookOAuthEnabled: { type: Boolean, default: false },
          facebookAppId: String,
          facebookAppSecret: String,
          // No `min`/`max` on these four, deliberately. Mongoose validates the
          // whole document on save, not just the modified paths, so a bound
          // added here would reject *every* future security save from any store
          // already holding an out-of-range value — locking the admin out of the
          // one screen where they could correct it. The range is enforced at the
          // two places that can do so safely instead: the settings API refuses
          // to store a new bad value, and each consumer clamps what it reads
          // (`normalizeSessionMaxAgeDays`, `normalizePasswordPolicy`,
          // `normalizeLockoutPolicy`).
          sessionMaxAgeDays: {
            type: Number,
            default: DEFAULT_SESSION_MAX_AGE_DAYS,
          },
          maxLoginAttempts: {
            type: Number,
            default: DEFAULT_MAX_LOGIN_ATTEMPTS,
          },
          lockoutDurationMinutes: {
            type: Number,
            default: DEFAULT_LOCKOUT_MINUTES,
          },
          rateLimiting: {
            type: new Schema(
              {
                enabled: { type: Boolean, default: true },
                ipPreset: rateLimitPresetField(),
                adminPreset: rateLimitPresetField(),
                vendorPreset: rateLimitPresetField(),
                checkoutPreset: rateLimitPresetField(),
                cartPreset: rateLimitPresetField(),
                couponPreset: rateLimitPresetField(),
                authPreset: rateLimitPresetField(),
              },
              { _id: false },
            ),
            default: () => ({}),
          },
          minPasswordLength: { type: Number, default: 8 },
          requireUppercase: { type: Boolean, default: false },
          requireNumbers: { type: Boolean, default: false },
          requireSpecialChars: { type: Boolean, default: false },
          countryBlocking: {
            type: new Schema(
              {
                enabled: { type: Boolean, default: false },
                blockedCountries: { type: [String], default: [] },
                blockMessage: { type: String, default: "Access to this website is blocked in your country." },
                redirectUrl: { type: String, default: "" },
                allowlistIps: { type: [String], default: [] },
              },
              { _id: false },
            ),
            default: () => ({}),
          },
        },
        { _id: false },
      ),
      default: () => ({}),
    },

    // POS Settings
    pos: {
      type: new Schema(
        {
          enabled: { type: Boolean, default: false },
          allowAdminSales: { type: Boolean, default: true },
          allowVendorSales: { type: Boolean, default: true },
          allowSellerSales: { type: Boolean, default: true },
          kdsEnabled: { type: Boolean, default: true },
          customerDisplayEnabled: { type: Boolean, default: true },
          stockAuditEnabled: { type: Boolean, default: true },
          kioskEnabled: { type: Boolean, default: true },
          offlineSyncEnabled: { type: Boolean, default: true },
          bopisEnabled: { type: Boolean, default: true },
          transfersEnabled: { type: Boolean, default: true },
          reportsEnabled: { type: Boolean, default: true },
          scaleEnabled: { type: Boolean, default: true },
          posLayout: {
            type: String,
            enum: [
              "classic",
              "touch_grocery",
              "scan_compact",
              "grid_visual",
              "kiosk_self",
              "restaurant_cafe",
            ],
            default: "classic",
          },
          language: { type: String, default: "en" },
          defaultPosLocationId: { type: String },
          customize: {
            type: new Schema(
              {
                printedReceiptsEnabled: { type: Boolean, default: false },
                receiptPrinter: { type: String },
                soundEnabled: { type: Boolean, default: true },
                soundVolume: { type: Number, default: 50, min: 0, max: 100 },
                soundAddToCart: { type: Boolean, default: true },
                soundOrderComplete: { type: Boolean, default: true },
                soundPayment: { type: Boolean, default: true },
                soundError: { type: Boolean, default: true },
                denominations: { type: [Number], default: [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000, 50000] },
              },
              { _id: false },
            ),
            default: () => ({}),
          },
          checkout: {
            type: new Schema(
              {
                paymentMethods: {
                  type: [String],
                  enum: [...POS_SELECTABLE_PAYMENT_METHODS],
                  default: ["cash", "card"],
                },
                offlinePaymentsEnabled: { type: Boolean, default: false },
              },
              { _id: false },
            ),
            default: () => ({}),
          },
          orders: {
            type: new Schema(
              {
                orderNumberPrefix: { type: String, default: "POS" },
              },
              { _id: false },
            ),
            default: () => ({}),
          },
          receipt: {
            type: new Schema(
              {
                logoUrl: { type: String },
                headerText: { type: String },
                footerText: { type: String },
                taxNumber: { type: String },
                showQrCode: { type: Boolean, default: true },
                qrCodeUrl: { type: String },
                returnPolicyText: { type: String },
              },
              { _id: false },
            ),
            default: () => ({}),
          },
        },
        { _id: false },
      ),
      default: () => ({}),
    },

    // Multi-Branch Settings
    multiBranch: {
      type: new Schema(
        {
          enabled: { type: Boolean, default: false },
          allowBranchPickup: { type: Boolean, default: true },
          autoAssignOrderToNearestBranch: { type: Boolean, default: false },
          allowBranchInventoryTransfer: { type: Boolean, default: true },
          requireStaffBranchAssignment: { type: Boolean, default: false },
          defaultBranchId: { type: String },
        },
        { _id: false },
      ),
      default: () => ({
        enabled: false,
        allowBranchPickup: true,
        autoAssignOrderToNearestBranch: false,
        allowBranchInventoryTransfer: true,
        requireStaffBranchAssignment: false,
      }),
    },

    // Wholesale (B2B) Settings
    wholesale: {
      type: new Schema(
        {
          enabled: { type: Boolean, default: false },
          mode: {
            type: String,
            enum: ["hybrid", "gated", "disabled"],
            default: "hybrid",
          },
          guestPricing: {
            type: String,
            enum: ["show_retail", "hide_prices", "login_for_pricing"],
            default: "show_retail",
          },
          minOrderValue: { type: Number, default: 0 },
          autoApproveApplications: { type: Boolean, default: false },
          defaultTierId: { type: String },
          allowNetTerms: { type: Boolean, default: true },
          allowedNetTerms: {
            type: [String],
            default: ["prepaid", "net15", "net30"],
          },
          poRequired: { type: Boolean, default: false },
          defaultCreditLimit: { type: Number, default: 0 },
          enableRfqs: { type: Boolean, default: true },
          minRfqCartValue: { type: Number, default: 500 },
          defaultQuoteValidityDays: { type: Number, default: 14 },
          taxExemptionEnabled: { type: Boolean, default: true },
          showDualPrice: { type: Boolean, default: true },
        },
        { _id: false },
      ),
      default: () => ({
        enabled: false,
        mode: "hybrid",
        guestPricing: "show_retail",
        minOrderValue: 0,
        autoApproveApplications: false,
        allowNetTerms: true,
        allowedNetTerms: ["prepaid", "net15", "net30"],
        poRequired: false,
        defaultCreditLimit: 0,
        enableRfqs: true,
        minRfqCartValue: 500,
        defaultQuoteValidityDays: 14,
        taxExemptionEnabled: true,
        showDualPrice: true,
      }),
    },

    // Multi-Vendor Mode
    multiVendorMode: {
      type: new Schema(
        {
          enabled: { type: Boolean, default: false },
          canManageProducts: { type: Boolean, default: true },
          canViewOrders: { type: Boolean, default: true },
          canManageOrders: { type: Boolean, default: true },
          canManageStoreSettings: { type: Boolean, default: true },
          canViewAnalytics: { type: Boolean, default: true },
          canManageDiscounts: { type: Boolean, default: true },
          canManagePayouts: { type: Boolean, default: true },
          canAccessPOS: { type: Boolean, default: true },
          // Deliberately no default: an ABSENT map means "read the legacy
          // booleans above", while a present one is the operator's explicit
          // per-pack choice. Defaulting it would silently migrate every store.
          packPolicy: {
            type: new Schema(
              Object.fromEntries(
                ALL_VENDOR_PACKS.map((pack) => [pack, { type: Boolean }]),
              ),
              { _id: false },
            ),
            default: undefined,
          },
        },
        { _id: false },
      ),
      default: () => ({}),
    },

    // Vendor Configuration (onboarding + plan policy)
    vendorConfig: {
      type: new Schema(
        {
          plansEnabled: { type: Boolean, default: false },
          allowRegistration: { type: Boolean, default: true },
          autoApprove: { type: Boolean, default: false },
          freeTrialDays: { type: Number, default: 0, min: 0 },
          requirePlanSelection: { type: Boolean, default: false },
          requiredDocuments: {
            type: [String],
            enum: VENDOR_DOCUMENT_KEYS,
            default: [],
          },
          defaultPlanId: { type: String },
          paymentMethods: {
            type: PlatformPaymentMethodsSchema,
            default: () => ({}),
          },
        },
        { _id: false },
      ),
      default: () => ({}),
    },

    // Boosting (sponsored products). Pricing lives on the BoostPosition
    // ladder; this section is the feature gate, the depths and the booking
    // rules.
    boosting: {
      type: new Schema(
        {
          enabled: { type: Boolean, default: false },
          paymentMethods: {
            type: PlatformPaymentMethodsSchema,
            default: () => ({}),
          },
          placements: {
            type: new Schema(
              {
                home: { type: Boolean, default: true },
                listing: { type: Boolean, default: true },
                productPage: { type: Boolean, default: true },
              },
              { _id: false },
            ),
            default: () => ({}),
          },
          // 12 is MAX_PLACEMENT_DEPTH — how deep a single surface renders, not
          // how many rungs the ladder may have (BOOST_MAX_POSITIONS is 50).
          listingSlots: { type: Number, default: 2, min: 1, max: 12 },
          productPageSlots: { type: Number, default: 8, min: 1, max: 12 },
          hideOutOfStock: { type: Boolean, default: true },
          // 35 is the floor because Stripe requires checkout.session.expires_at
          // to be at least 30 minutes out and the hold is stamped before the
          // session is created.
          holdMinutes: { type: Number, default: 45, min: 35, max: 120 },
          bookingHorizonDays: { type: Number, default: 60, min: 7, max: 365 },
          maxBookingDays: { type: Number, default: 60, min: 1, max: 365 },
        },
        { _id: false },
      ),
      default: () => ({}),
    },

    // Notification Settings
    notifications: {
      type: new Schema(
        {
          admin: {
            type: new Schema(
              {
                newOrders: {
                  type: new Schema(
                    {
                      inApp: { type: Boolean, default: true },
                      email: { type: Boolean, default: false },
                      browserPush: { type: Boolean, default: true },
                    },
                    { _id: false },
                  ),
                  default: () => DEFAULT_NOTIFICATION_SETTINGS.admin.newOrders,
                },
                newCustomers: {
                  type: new Schema(
                    {
                      inApp: { type: Boolean, default: true },
                      email: { type: Boolean, default: false },
                      browserPush: { type: Boolean, default: true },
                    },
                    { _id: false },
                  ),
                  default: () => DEFAULT_NOTIFICATION_SETTINGS.admin.newCustomers,
                },
                newVendors: {
                  type: new Schema(
                    {
                      inApp: { type: Boolean, default: true },
                      email: { type: Boolean, default: true },
                      browserPush: { type: Boolean, default: true },
                    },
                    { _id: false },
                  ),
                  default: () => DEFAULT_NOTIFICATION_SETTINGS.admin.newVendors,
                },
                returns: {
                  type: new Schema(
                    {
                      inApp: { type: Boolean, default: true },
                      email: { type: Boolean, default: true },
                      browserPush: { type: Boolean, default: true },
                    },
                    { _id: false },
                  ),
                  default: () => DEFAULT_NOTIFICATION_SETTINGS.admin.returns,
                },
                payments: {
                  type: new Schema(
                    {
                      inApp: { type: Boolean, default: true },
                      email: { type: Boolean, default: false },
                      browserPush: { type: Boolean, default: true },
                    },
                    { _id: false },
                  ),
                  default: () => DEFAULT_NOTIFICATION_SETTINGS.admin.payments,
                },
              },
              { _id: false },
            ),
            default: () => DEFAULT_NOTIFICATION_SETTINGS.admin,
          },
          staff: {
            type: new Schema(
              {
                newOrders: {
                  type: new Schema(
                    {
                      inApp: { type: Boolean, default: true },
                      email: { type: Boolean, default: false },
                      browserPush: { type: Boolean, default: true },
                    },
                    { _id: false },
                  ),
                  default: () => DEFAULT_NOTIFICATION_SETTINGS.staff.newOrders,
                },
                newCustomers: {
                  type: new Schema(
                    {
                      inApp: { type: Boolean, default: true },
                      email: { type: Boolean, default: false },
                      browserPush: { type: Boolean, default: true },
                    },
                    { _id: false },
                  ),
                  default: () => DEFAULT_NOTIFICATION_SETTINGS.staff.newCustomers,
                },
                returns: {
                  type: new Schema(
                    {
                      inApp: { type: Boolean, default: true },
                      email: { type: Boolean, default: false },
                      browserPush: { type: Boolean, default: true },
                    },
                    { _id: false },
                  ),
                  default: () => DEFAULT_NOTIFICATION_SETTINGS.staff.returns,
                },
                payments: {
                  type: new Schema(
                    {
                      inApp: { type: Boolean, default: true },
                      email: { type: Boolean, default: false },
                      browserPush: { type: Boolean, default: true },
                    },
                    { _id: false },
                  ),
                  default: () => DEFAULT_NOTIFICATION_SETTINGS.staff.payments,
                },
                lowStock: {
                  type: new Schema(
                    {
                      inApp: { type: Boolean, default: true },
                      email: { type: Boolean, default: false },
                      browserPush: { type: Boolean, default: true },
                    },
                    { _id: false },
                  ),
                  default: () => DEFAULT_NOTIFICATION_SETTINGS.staff.lowStock,
                },
              },
              { _id: false },
            ),
            default: () => DEFAULT_NOTIFICATION_SETTINGS.staff,
          },
          vendor: {
            type: new Schema(
              {
                applicationStatus: {
                  type: new Schema(
                    {
                      inApp: { type: Boolean, default: true },
                      email: { type: Boolean, default: true },
                      browserPush: { type: Boolean, default: true },
                    },
                    { _id: false },
                  ),
                  default: () =>
                    DEFAULT_NOTIFICATION_SETTINGS.vendor.applicationStatus,
                },
                newOrders: {
                  type: new Schema(
                    {
                      inApp: { type: Boolean, default: true },
                      email: { type: Boolean, default: true },
                      browserPush: { type: Boolean, default: true },
                    },
                    { _id: false },
                  ),
                  default: () => DEFAULT_NOTIFICATION_SETTINGS.vendor.newOrders,
                },
                returns: {
                  type: new Schema(
                    {
                      inApp: { type: Boolean, default: true },
                      email: { type: Boolean, default: true },
                      browserPush: { type: Boolean, default: true },
                    },
                    { _id: false },
                  ),
                  default: () => DEFAULT_NOTIFICATION_SETTINGS.vendor.returns,
                },
              },
              { _id: false },
            ),
            default: () => DEFAULT_NOTIFICATION_SETTINGS.vendor,
          },
          customer: {
            type: new Schema(
              {
                orderUpdates: {
                  type: new Schema(
                    {
                      inApp: { type: Boolean, default: true },
                      email: { type: Boolean, default: true },
                      browserPush: { type: Boolean, default: true },
                    },
                    { _id: false },
                  ),
                  default: () =>
                    DEFAULT_NOTIFICATION_SETTINGS.customer.orderUpdates,
                },
                returnUpdates: {
                  type: new Schema(
                    {
                      inApp: { type: Boolean, default: true },
                      email: { type: Boolean, default: true },
                      browserPush: { type: Boolean, default: true },
                    },
                    { _id: false },
                  ),
                  default: () =>
                    DEFAULT_NOTIFICATION_SETTINGS.customer.returnUpdates,
                },
              },
              { _id: false },
            ),
            default: () => DEFAULT_NOTIFICATION_SETTINGS.customer,
          },
        },
        { _id: false },
      ),
      default: () => DEFAULT_NOTIFICATION_SETTINGS,
    },

    // Storage Settings
    storage: {
      type: new Schema(
        {
          provider: {
            type: String,
            // "local" is not selectable — see IStorageSettings. It stays in
            // the enum so pre-v1.5 documents remain valid documents.
            enum: ["cloudflare_r2", "s3", "minio", "digitalocean", "local"],
            default: "cloudflare_r2",
          },

          // Per-provider credentials. Kept apart so switching provider in the
          // admin never clobbers the other one's keys.
          r2: {
            type: new Schema(
              {
                accountId: String,
                bucketName: String,
                accessKeyId: String,
                secretAccessKey: String,
                publicUrl: String,
              },
              { _id: false },
            ),
            default: () => ({}),
          },
          s3: {
            type: new Schema(
              {
                region: { type: String, default: "us-east-1" },
                bucketName: String,
                accessKeyId: String,
                secretAccessKey: String,
                publicUrl: String,
              },
              { _id: false },
            ),
            default: () => ({}),
          },
          minio: {
            type: new Schema(
              {
                endpoint: String,
                region: { type: String, default: "us-east-1" },
                bucketName: String,
                accessKeyId: String,
                secretAccessKey: String,
                publicUrl: String,
              },
              { _id: false },
            ),
            default: () => ({}),
          },
          digitalocean: {
            type: new Schema(
              {
                region: { type: String, default: "nyc3" },
                bucketName: String,
                accessKeyId: String,
                secretAccessKey: String,
                publicUrl: String,
              },
              { _id: false },
            ),
            default: () => ({}),
          },

          // Deprecated pre-v1.5 flat credentials. Still declared so mongoose
          // hydrates them on an un-migrated document — the resolver's fallback
          // reads them, and `db:migrate:storage-credentials` clears them once
          // they have been copied into the block above. `region` deliberately
          // lost its "auto" default: re-stamping it would resurrect the field
          // on every save after the migration removed it.
          accountId: String,
          endpoint: String,
          region: String,
          bucketName: String,
          accessKeyId: String,
          secretAccessKey: String,
          publicUrl: String,

          maxFileSizeMB: { type: Number, default: 20 },
          maxImageSizeMB: { type: Number, default: 20 },
          maxVideoSizeMB: { type: Number, default: 1024 },
          maxModelSizeMB: { type: Number, default: 500 },
          allowedMimeTypes: {
            type: [String],
            // The admin narrows this list from the Storage tab; the settings
            // API refuses anything outside it. Kept in one place so the default
            // and the ceiling cannot drift apart.
            default: () => [...SUPPORTED_UPLOAD_MIME_TYPES],
          },
          pathPrefix: { type: String, default: "uploads/" },
        },
        { _id: false },
      ),
      default: () => ({}),
    },

    aiSalesAgent: {
      type: new Schema(
        {
          enabled: { type: Boolean, default: false },
          provider: {
            type: String,
            enum: ["openai", "custom"],
            default: "openai",
          },
          customBaseUrl: String,
          customApiKey: String,
          customModel: String,
          model: {
            type: String,
            enum: ["gpt-5", "gpt-5-mini", "gpt-5-nano", "gpt-4.1-mini"],
            default: "gpt-5-mini",
          },
          temperature: { type: Number, default: 0.3, min: 0, max: 1 },
          reasoningEffort: {
            type: String,
            enum: ["minimal", "low", "medium", "high"],
            default: "minimal",
          },
          maxRecommendations: { type: Number, default: 4, min: 1, max: 8 },
          agentName: { type: String, default: "Sales AI" },
          greeting: {
            type: String,
            default: "Hi! I can help you find products, compare options, add items to your cart, and check order status.",
          },
          tone: {
            type: String,
            enum: ["friendly", "professional", "playful", "luxury"],
            default: "friendly",
          },
          instructions: { type: String, default: "" },
          escalationMessage: {
            type: String,
            default:
              "I can connect you with the store team for anything that needs a human review.",
          },
          widget: {
            type: new Schema(
              {
                position: {
                  type: String,
                  enum: ["bottom-right", "bottom-left"],
                  default: "bottom-right",
                },
                primaryColor: { type: String, default: "#7c3aed" },
                accentColor: { type: String, default: "#a855f7" },
                widgetTheme: {
                  type: String,
                  enum: ["nexus-modern", "nexus-glass", "nexus-cyber-hud", "nexus-capsule"],
                  default: "nexus-modern",
                },
                avatarUrl: String,
                footerText: { type: String, default: "Powered by AI" },
                headerTitle: { type: String, default: "" },
                width: { type: Number, default: 400, min: 320, max: 640 },
                height: { type: Number, default: 680, min: 420, max: 900 },
                showFooterText: { type: Boolean, default: true },
              },
              { _id: false },
            ),
            default: () => ({}),
          },
          capabilities: {
            type: new Schema(
              {
                productQA: { type: Boolean, default: true },
                recommendations: { type: Boolean, default: true },
                cartActions: { type: Boolean, default: true },
                checkoutHandoff: { type: Boolean, default: true },
                orderStatus: { type: Boolean, default: true },
              },
              { _id: false },
            ),
            default: () => ({}),
          },
          faq: {
            type: [
              new Schema(
                {
                  question: { type: String, default: "" },
                  answer: { type: String, default: "" },
                  tags: { type: [String], default: [] },
                },
                { _id: false },
              ),
            ],
            default: () => [],
          },
        },
        { _id: false },
      ),
      default: () => ({}),
    },

    aiAuthoring: {
      type: new Schema(
        {
          enabled: { type: Boolean, default: true },
          apiKey: String,
          textModel: {
            type: String,
            enum: ["", "gpt-4.1-mini", "gpt-4.1", "gpt-5-mini", "gpt-5"],
            default: "",
          },
          imageModel: {
            type: String,
            enum: ["", "gpt-image-1", "gpt-image-1-mini"],
            default: "",
          },
          surfaces: {
            type: new Schema(
              {
                products: { type: Boolean, default: true },
                categories: { type: Boolean, default: true },
                collections: { type: Boolean, default: true },
                brands: { type: Boolean, default: true },
                blogPosts: { type: Boolean, default: true },
                contentPages: { type: Boolean, default: true },
                reviews: { type: Boolean, default: true },
                heroBanner: { type: Boolean, default: true },
              },
              { _id: false },
            ),
            default: () => ({}),
          },
          imageDefaults: {
            type: new Schema(
              {
                size: {
                  type: String,
                  enum: ["auto", "1024x1024", "1024x1536", "1536x1024"],
                  default: "auto",
                },
                quality: {
                  type: String,
                  enum: ["auto", "medium", "high"],
                  default: "high",
                },
              },
              { _id: false },
            ),
            default: () => ({}),
          },
          brandVoice: {
            type: new Schema(
              {
                tone: {
                  type: String,
                  enum: [
                    "",
                    "friendly",
                    "professional",
                    "luxury",
                    "playful",
                    "supportive",
                  ],
                  default: "",
                },
                instructions: { type: String, default: "", maxlength: 2000 },
                imageStyle: { type: String, default: "", maxlength: 1000 },
              },
              { _id: false },
            ),
            default: () => ({}),
          },
          brandKit: {
            type: new Schema(
              {
                primaryColor: { type: String, default: "", maxlength: 9 },
                secondaryColor: { type: String, default: "", maxlength: 9 },
                logoUrl: { type: String, default: "", maxlength: 2048 },
              },
              { _id: false },
            ),
            default: () => ({}),
          },
          access: {
            type: new Schema(
              {
                staffEnabled: { type: Boolean, default: true },
                vendorsEnabled: { type: Boolean, default: true },
              },
              { _id: false },
            ),
            default: () => ({}),
          },
          limits: {
            type: new Schema(
              {
                textPerUserPerDay: {
                  type: Number,
                  default: 0,
                  min: 0,
                  max: 100000,
                },
                imagePerUserPerDay: {
                  type: Number,
                  default: 0,
                  min: 0,
                  max: 100000,
                },
              },
              { _id: false },
            ),
            default: () => ({}),
          },
        },
        { _id: false },
      ),
      default: () => ({}),
    },

    // Storefront Header Settings
    header: {
      type: Schema.Types.Mixed,
      default: () => getDefaultHeaderSettings(),
    },

    footer: {
      type: Schema.Types.Mixed,
      default: () => getDefaultFooterSettings(),
    },

    checkout: {
      type: Schema.Types.Mixed,
      default: () => getDefaultCheckoutSettings(),
    },

    // Home Page Settings
    homePage: {
      type: Schema.Types.Mixed,
      default: () => getDefaultHomePageSettings(),
    },
    productPages: {
      type: Schema.Types.Mixed,
      default: () => getDefaultProductPageSettings(),
    },
    contentPages: {
      type: Schema.Types.Mixed,
      default: () => getDefaultContentPagesSettings(),
    },

    // Product card configurator. Absent on older documents — readers
    // normalize, so no default beyond an empty object is needed here.
    productCard: {
      type: Schema.Types.Mixed,
      default: () => ({}),
    },

    // Login page configuration
    loginPage: {
      type: Schema.Types.Mixed,
      default: () => ({
        style: "classic-split",
        logoUrl: "",
        backgroundImageUrl: "",
        sideImageUrl: "",
        primaryColor: "",
        accentColor: "",
        heading: "",
        subheading: "",
        socialLoginEnabled: true,
        otpLoginEnabled: false,
        cardPosition: "center",
        formBorderRadius: "md",
      }),
    },

    updatedBy: String,

    // Stamped by the install wizard's finish step. Deliberately NOT in the
    // admin settings PUT allow-list, so no API can unset it and reopen the
    // wizard on a live store.
    installedAt: Date,

    // The wizard's concurrency lease — see `claimInstall` in
    // lib/install/status.ts. Also kept out of the settings PUT allow-list:
    // it is machinery, not configuration.
    installClaimedAt: Date,
  },
  {
    timestamps: true,
  },
);

// Delete cached model in development so schema changes take effect on hot reload
if (process.env.NODE_ENV !== "production" && mongoose.models.Settings) {
  mongoose.deleteModel("Settings");
}

export const Settings: Model<ISettings> =
  mongoose.models.Settings ||
  mongoose.model<ISettings>("Settings", SettingsSchema);

let hasCheckedSettingsMigration = false;

function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: unknown }).code === 11000
  );
}

/**
 * Fetch the settings document, creating it if the store is brand new.
 *
 * One atomic `findOneAndUpdate` rather than find-then-create: the empty filter
 * matches whatever document already exists, so a second caller never inserts a
 * rival. If two callers do race an insert on a truly empty collection, the
 * unique key rejects the loser — whose retry then finds the winner's document.
 */
export async function loadSettingsDocument(): Promise<ISettings> {
  try {
    const result = await Settings.findOneAndUpdate(
      {},
      { $setOnInsert: { key: SETTINGS_SINGLETON_KEY } },
      {
        upsert: true,
        returnDocument: "after",
        setDefaultsOnInsert: true,
        includeResultMetadata: true,
      },
    );
    const settings = result.value as ISettings;

    // A store created from here on starts on the return policy the rest of the
    // world settled on, rather than on the one that exists only to leave older
    // installs alone.
    //
    // Written here rather than as the schema default because a schema default
    // is also applied when HYDRATING a stored document that lacks the path —
    // and every install predating `orders.returns` lacks it. As a schema
    // default this would have silently changed their refunds. `upserted` is
    // only set on a genuine insert, so only a brand new store is touched.
    if (result.lastErrorObject?.upserted && settings) {
      settings.set(
        "orders.returns.shippingRefund",
        NEW_STORE_RETURN_SHIPPING_REFUND,
      );
      await settings.save();
    }
    return settings;
  } catch (error) {
    if (!isDuplicateKeyError(error)) throw error;
    const settings = await Settings.findOne();
    if (settings) return settings;
    throw error;
  }
}

async function loadSettings(): Promise<ISettings> {
  if (!hasCheckedSettingsMigration) {
    hasCheckedSettingsMigration = true;
    await migrateSettings();
  }

  return loadSettingsDocument();
}

/**
 * Singleton settings accessor, memoized per server request.
 *
 * `getSettings()` was being called many times inside a single request (payment
 * finalizers, product/vendor/payout list routes, notification fan-out, etc.),
 * each issuing its own `Settings.findOne()` for the same ~62KB singleton doc.
 * React `cache()` collapses all those calls to a single Mongo round trip within
 * one request (route handler / RSC render) and returns the *same hydrated*
 * Mongoose document — so the settings-mutation paths that do
 * `getSettings()` → `settings.set(...)` → `settings.save()` keep working.
 *
 * Outside a request scope (scripts, tests, background jobs) `cache()` simply
 * doesn't memoize and forwards straight to `loadSettings`, so behavior is
 * unchanged there. The cache is per-request, so settings edited via the admin
 * PUT are visible on the very next request.
 */
export const getSettings: () => Promise<ISettings> = cache(loadSettings);

// ============================================
// Migration Helper (for existing data)
// ============================================

export async function migrateSettings(): Promise<void> {
  const settings = await Settings.findOne();
  if (!settings) return;

  // A store that forked before the unique key existed keeps serving whichever
  // document `findOne` happens to return, so say so loudly rather than let an
  // admin wonder why half their saves seem to vanish. Not repaired
  // automatically: only a human can tell which copy is the real one.
  const settingsCount = await Settings.estimatedDocumentCount();
  if (settingsCount > 1) {
    console.error(
      `Found ${settingsCount} settings documents; there must be exactly one. ` +
        "Saves and reads may disagree until the extras are removed.",
    );
  }

  type LegacySettingsDoc = Record<string, unknown> & {
    general?: Record<string, unknown>;
    appearance?: Record<string, unknown>;
    payment?: {
      stripe?: Record<string, unknown>;
    };
    email?: Record<string, unknown>;
    orders?: Record<string, unknown>;
    seo?: Record<string, unknown>;
    social?: Record<string, unknown>;
    maintenance?: Record<string, unknown>;
    pos?: {
      language?: unknown;
      customize?: unknown;
      checkout?: unknown;
    };
  };

  // Check if migration is needed (old flat structure exists)
  const doc = settings.toObject() as unknown as LegacySettingsDoc;

  // Migration: old flat fields to new structure
  const updates: Record<string, unknown> = {};
  // Paths to remove from the document. These cannot live in `updates`: Mongoose
  // strips undefined values out of an update before it is sent, so a
  // `$set: { path: undefined }` reaches Mongo as an empty `$set` and the legacy
  // field survives. Every guard below reads the *stored* document, so a field
  // that is never actually removed makes its branch fire again on every cold
  // start — re-applying stale legacy values over whatever the admin has since
  // configured. `$unset` is what makes this migration run once.
  const unsets: Record<string, 1> = {};
  let needsMigration = false;

  // No back-fill of `key` here, deliberately: Mongoose fills a missing path
  // from its schema default on read, so the hydrated document always looks like
  // it has one and nothing could tell the difference. It does not need one —
  // the unique index treats an absent field as null and permits exactly one,
  // which is the guarantee wanted either way.

  // Migrate general fields
  if (doc.storeName && !doc.general?.storeName) {
    needsMigration = true;
    updates["general.storeName"] = doc.storeName;
    updates["general.storeEmail"] = doc.storeEmail;
    updates["general.storeDescription"] = doc.storeDescription;
    updates["general.storePhone"] = doc.storePhone;
    updates["general.storeAddress"] = doc.storeAddress;
    updates["general.logoUrl"] = doc.logoUrl;
    updates["general.faviconUrl"] = doc.faviconUrl;
    updates["general.defaultLanguage"] = doc.defaultLanguage;
    updates["general.defaultCurrency"] = doc.defaultCurrency;
    updates["general.supportedLanguages"] = doc.supportedLanguages;
    updates["general.supportedCurrencies"] = doc.supportedCurrencies;
    // Straight to its modern home. Parking it on the deprecated
    // `general.multiVendorEnabled` meant the value only reached
    // `multiVendorMode.enabled` on the *next* boot, via the branch below.
    if (doc.multiVendorEnabled !== undefined) {
      updates["multiVendorMode.enabled"] = Boolean(doc.multiVendorEnabled);
    }
  }

  // Older installs stamped a bundled placeholder ("/favicon.svg", "/favicon.ico")
  // into the favicon field. Those files no longer ship, so a stored placeholder
  // is a dead path — clear it and let the store simply have no favicon until an
  // admin uploads one.
  const generalFaviconUrl =
    typeof doc.general?.faviconUrl === "string"
      ? doc.general.faviconUrl.trim()
      : "";
  if (generalFaviconUrl && !resolveFaviconUrl(generalFaviconUrl)) {
    needsMigration = true;
    updates["general.faviconUrl"] = "";
  }

  // The seeder wrote this app's own name into two fields that outrank
  // `general.storeName`: `seo.metaTitle`, which becomes the browser tab title,
  // the `og:title` and the search-result headline for every page that does not
  // set its own, and `email.fromName`, which signs every outbound email. A store
  // renamed in Settings → General kept showing the demo brand in all of them.
  // Cleared rather than only ignored on read, so the SEO and Email tabs show the
  // empty fields the storefront actually behaves as having.
  if (isLegacySeededBrandText(doc.seo?.metaTitle as string | undefined)) {
    needsMigration = true;
    updates["seo.metaTitle"] = "";
  }
  if (isLegacySeededBrandText(doc.email?.fromName as string | undefined)) {
    needsMigration = true;
    updates["email.fromName"] = "";
  }

  // The supported-currency list is fully admin-owned: it is edited in Settings
  // → General and may contain any ISO 4217 code, so nothing is injected here.
  // (An earlier revision re-added "UGX" on every boot, which silently undid an
  // admin removing it.) Only a genuinely empty list is repaired.
  const supportedCurrenciesInput =
    updates["general.supportedCurrencies"] ?? doc.general?.supportedCurrencies;
  const supportedCurrencies = Array.isArray(supportedCurrenciesInput)
    ? supportedCurrenciesInput.filter(
        (currency): currency is string => typeof currency === "string",
      )
    : [];
  if (supportedCurrencies.length === 0) {
    needsMigration = true;
    updates["general.supportedCurrencies"] = [
      String(doc.general?.defaultCurrency || DEFAULT_CURRENCY).toUpperCase(),
    ];
  }

  // Migrate appearance fields
  if (doc.primaryColor && !doc.appearance?.primaryColor) {
    needsMigration = true;
    updates["appearance.primaryColor"] = doc.primaryColor;
    updates["appearance.secondaryColor"] = doc.secondaryColor;
    updates["appearance.accentColor"] = doc.accentColor;
    updates["appearance.theme"] = normalizeThemeMode(doc.theme);
  }

  // Retire the legacy "system" theme. The app no longer follows the OS
  // preference, so an existing store configured as "system" becomes light —
  // rewritten here (rather than only normalized on read) so the admin
  // Appearance tab shows the mode the storefront actually renders.
  const configuredTheme =
    updates["appearance.theme"] ?? doc.appearance?.theme;
  if (configuredTheme === "system") {
    needsMigration = true;
    updates["appearance.theme"] = DEFAULT_THEME_MODE;
  }

  // Migrate payment fields
  if (doc.stripeEnabled !== undefined && !doc.payment?.stripe?.enabled) {
    needsMigration = true;
    updates["payment.stripe.enabled"] = doc.stripeEnabled;
    updates["payment.stripe.publishableKey"] = doc.stripePublishableKey;
    updates["payment.stripe.secretKey"] = doc.stripeSecretKey;
    updates["payment.stripe.webhookSecret"] = doc.stripeWebhookSecret;
    updates["payment.cod.enabled"] = doc.codEnabled;
    updates["payment.cod.instructions"] = doc.codInstructions;
  }

  // Migrate email fields
  if (doc.smtpEnabled !== undefined && !doc.email?.enabled) {
    needsMigration = true;
    updates["email.enabled"] = doc.smtpEnabled;
    updates["email.smtp.host"] = doc.smtpHost;
    updates["email.smtp.port"] = doc.smtpPort;
    updates["email.smtp.user"] = doc.smtpUser;
    updates["email.smtp.password"] = doc.smtpPassword;
    updates["email.smtp.secure"] = doc.smtpSecure;
    updates["email.fromEmail"] = doc.smtpFromEmail;
    updates["email.fromName"] = doc.smtpFromName;
  }

  // Migrate order fields
  if (doc.orderPrefix && !doc.orders?.prefix) {
    needsMigration = true;
    updates["orders.prefix"] = doc.orderPrefix;
    updates["orders.taxRate"] = doc.taxRate;
    updates["orders.freeShippingThreshold"] = doc.freeShippingThreshold;
    updates["orders.defaultShippingCost"] = doc.defaultShippingCost;
    updates["orders.commission.vendorRate"] = doc.vendorCommissionRate;
    updates["orders.commission.minWithdrawalAmount"] = doc.minWithdrawalAmount;
  }

  // Migrate SEO fields
  if (doc.metaTitle && !doc.seo?.metaTitle) {
    needsMigration = true;
    updates["seo.metaTitle"] = doc.metaTitle;
    updates["seo.metaDescription"] = doc.metaDescription;
    updates["seo.metaKeywords"] = doc.metaKeywords;
  }

  // Migrate social fields
  if (doc.facebookUrl && !doc.social?.facebookUrl) {
    needsMigration = true;
    updates["social.facebookUrl"] = doc.facebookUrl;
    updates["social.twitterUrl"] = doc.twitterUrl;
    updates["social.instagramUrl"] = doc.instagramUrl;
    updates["social.youtubeUrl"] = doc.youtubeUrl;
  }

  // Migrate maintenance fields
  if (doc.maintenanceMode !== undefined && !doc.maintenance?.enabled) {
    needsMigration = true;
    updates["maintenance.enabled"] = doc.maintenanceMode;
    updates["maintenance.message"] = doc.maintenanceMessage;
  }

  // Initialize POS nested structure defaults if missing
  if (doc.pos) {
    if (doc.pos.language === undefined) {
      needsMigration = true;
      updates["pos.language"] = "en";
    }
    if (!doc.pos.customize) {
      needsMigration = true;
      updates["pos.customize.printedReceiptsEnabled"] = false;
    }
    if (!doc.pos.checkout) {
      needsMigration = true;
      updates["pos.checkout.paymentMethods"] = ["cash", "card"];
      updates["pos.checkout.offlinePaymentsEnabled"] = false;
    }
  }

  // Migrate multi-vendor fields
  if (doc.general?.multiVendorEnabled !== undefined) {
    needsMigration = true;
    updates["multiVendorMode.enabled"] = Boolean(doc.general.multiVendorEnabled);
    unsets["general.multiVendorEnabled"] = 1;
  }
  if (doc.vendorPermissions) {
    const vp = doc.vendorPermissions as Record<string, unknown>;
    needsMigration = true;
    updates["multiVendorMode.canManageProducts"] = Boolean(vp.canManageProducts);
    updates["multiVendorMode.canViewOrders"] = Boolean(vp.canViewOrders);
    updates["multiVendorMode.canManageOrders"] = Boolean(vp.canManageOrders);
    updates["multiVendorMode.canManageStoreSettings"] = Boolean(
      vp.canManageStoreSettings,
    );
    updates["multiVendorMode.canViewAnalytics"] = Boolean(vp.canViewAnalytics);
    updates["multiVendorMode.canManageDiscounts"] = Boolean(
      vp.canManageDiscounts ?? vp.canManageProducts,
    );
    updates["multiVendorMode.canManagePayouts"] = Boolean(vp.canManagePayouts);
    updates["multiVendorMode.canAccessPOS"] = Boolean(vp.canAccessPOS);
    unsets["vendorPermissions"] = 1;
  }

  if (needsMigration) {
    // Mongo refuses an update that both sets and unsets the same path, and the
    // removals are what the guards above key on — so a removal always wins.
    for (const path of Object.keys(unsets)) delete updates[path];

    const operation: Record<string, unknown> = {};
    if (Object.keys(updates).length > 0) operation.$set = updates;
    if (Object.keys(unsets).length > 0) operation.$unset = unsets;

    if (Object.keys(operation).length > 0) {
      await Settings.updateOne({ _id: settings._id }, operation);
      console.log("Settings migration completed successfully");
    }
  }
}
