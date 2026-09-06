"use client";

import type { ComponentType } from "react";
import type { CredentialMetaMap } from "@/lib/settings/credential-fields";
import {
  BarChart3,
  Bell,
  Building2,
  CreditCard,
  HardDrive,
  KeyRound,
  Layers,
  Link2,
  Lock,
  Mail,
  MapPin,
  MessagesSquare,
  Monitor,
  Package,
  Palette,
  Rocket,
  Search,
  Shield,
  ShoppingBag,
  Sparkles,
  Store,
  Truck,
  Wrench,
} from "lucide-react";

export type AdminSettingsSectionId =
  | "general"
  | "appearance"
  | "floating-tabs"
  | "track-order"
  | "marketplace"
  | "multi-branch"
  | "boosting"
  | "pos"
  | "receipt"
  | "otp"
  | "twoFactor"
  | "oauth"
  | "security"
  | "payment"
  | "email"
  | "notifications"
  | "messaging"
  | "orders"
  | "checkout"
  | "shipping"
  | "seo"
  | "social"
  | "analytics"
  | "maintenance"
  | "storage"
  | "aiAuthoring"
  | "whatsapp"
  | "wholesale"
  | "system-management"
  | "advanced"
  | "compliance";

export const SECTION_TO_PATH: Record<AdminSettingsSectionId, string> = {
  general: "general",
  appearance: "appearance",
  "floating-tabs": "floating-tabs",
  "track-order": "track-order",
  marketplace: "marketplace",
  "multi-branch": "multi-branch",
  boosting: "boosting",
  pos: "pos",
  receipt: "receipt",
  otp: "otp",
  twoFactor: "two-factor",
  oauth: "oauth",
  security: "security",
  payment: "payment",
  email: "email",
  notifications: "notifications",
  messaging: "messaging",
  orders: "orders",
  checkout: "checkout",
  shipping: "shipping",
  seo: "seo",
  social: "social",
  analytics: "analytics",
  maintenance: "maintenance",
  storage: "storage",
  aiAuthoring: "ai-authoring",
  whatsapp: "whatsapp",
  wholesale: "wholesale",
  "system-management": "system-management",
  advanced: "advanced",
  compliance: "compliance",
};

export type SectionStatus = "ok" | "warning" | "disabled";

export type AdminSettingsGroupId =
  | "store"
  | "commerce"
  | "salesTools"
  | "communication"
  | "authentication"
  | "growth"
  | "advanced";

export type AdminSettingsSection = {
  id: AdminSettingsSectionId;
  tab: AdminSettingsSectionId;
  group: AdminSettingsGroupId;
  labelKey: string;
  defaultLabel: string;
  icon: ComponentType<{ className?: string }>;
};

// Sidebar group headers. Group order comes from ADMIN_SETTINGS_SECTIONS
// (sections of one group must stay contiguous there); this map only names
// the groups.
export const ADMIN_SETTINGS_GROUPS: Record<
  AdminSettingsGroupId,
  { labelKey: string; defaultLabel: string }
> = {
  store: {
    labelKey: "admin.settings.groups.store",
    defaultLabel: "Store",
  },
  commerce: {
    labelKey: "admin.settings.groups.commerce",
    defaultLabel: "Commerce",
  },
  salesTools: {
    labelKey: "admin.settings.groups.salesTools",
    defaultLabel: "Sales Tools",
  },
  communication: {
    labelKey: "admin.settings.groups.communication",
    defaultLabel: "Communication",
  },
  // "Authentication", not "Security" — the header would otherwise stutter
  // against its own "Security & Access Control" child, and everything in the
  // group (OAuth, 2FA, password/lockout/session policy) is sign-in related.
  authentication: {
    labelKey: "admin.settings.groups.authentication",
    defaultLabel: "Authentication",
  },
  growth: {
    labelKey: "admin.settings.groups.growth",
    defaultLabel: "Growth",
  },
  advanced: {
    labelKey: "admin.settings.groups.advanced",
    defaultLabel: "Advanced",
  },
};

// Ordered as a setup journey: store identity first, then the money path a
// new store cannot launch without, then optional selling features,
// communication, set-once security, growth tooling, and infrastructure last.
// Sections sharing a group must stay contiguous — the sidebar derives its
// group headers from transitions in this list.
export const ADMIN_SETTINGS_SECTIONS: AdminSettingsSection[] = [
  {
    id: "general",
    tab: "general",
    group: "store",
    labelKey: "admin.settings.general.title",
    defaultLabel: "General",
    icon: Store,
  },
  {
    id: "appearance",
    tab: "appearance",
    group: "store",
    labelKey: "admin.settings.appearance.title",
    defaultLabel: "Branding",
    icon: Palette,
  },
  {
    id: "floating-tabs",
    tab: "floating-tabs",
    group: "store",
    labelKey: "admin.settings.floatingTabs.title",
    defaultLabel: "Floating Tabs",
    icon: Layers,
  },
  {
    id: "track-order",
    tab: "track-order",
    group: "store",
    labelKey: "admin.settings.trackOrder.title",
    defaultLabel: "Track Order Page",
    icon: MapPin,
  },
  {
    id: "marketplace",
    tab: "marketplace",
    group: "store",
    labelKey: "admin.settings.security.multiVendor.label",
    defaultLabel: "Multi-Vendor Management",
    icon: ShoppingBag,
  },
  {
    id: "multi-branch",
    tab: "multi-branch",
    group: "store",
    labelKey: "admin.settings.multiBranch.title",
    defaultLabel: "Multi-Branch & Locations",
    icon: Building2,
  },
  {
    id: "compliance",
    tab: "compliance",
    group: "store",
    labelKey: "admin.settings.compliance.title",
    defaultLabel: "Compliance & Legal",
    icon: Shield,
  },
  {
    id: "payment",
    tab: "payment",
    group: "commerce",
    labelKey: "admin.settings.payment.title",
    defaultLabel: "Payment Settings",
    icon: CreditCard,
  },
  {
    id: "orders",
    tab: "orders",
    group: "commerce",
    labelKey: "admin.settings.orders.title",
    defaultLabel: "Order Settings",
    icon: Package,
  },
  {
    id: "checkout",
    tab: "checkout",
    group: "commerce",
    labelKey: "admin.settings.checkout.title",
    defaultLabel: "Checkout",
    icon: ShoppingBag,
  },
  {
    id: "shipping",
    tab: "shipping",
    group: "commerce",
    labelKey: "admin.settings.shipping.title",
    defaultLabel: "Shipping & Delivery",
    icon: Truck,
  },
  {
    id: "wholesale",
    tab: "wholesale",
    group: "commerce",
    labelKey: "admin.settings.wholesale.title",
    defaultLabel: "Wholesale (B2B)",
    icon: ShoppingBag,
  },
  {
    id: "boosting",
    tab: "boosting",
    group: "salesTools",
    labelKey: "admin.settings.boosting.title",
    defaultLabel: "Product Boosting",
    icon: Rocket,
  },
  {
    id: "pos",
    tab: "pos",
    group: "salesTools",
    labelKey: "admin.settings.pos.title",
    defaultLabel: "Offline POS & Terminal",
    icon: Monitor,
  },
  {
    id: "receipt",
    tab: "receipt",
    group: "salesTools",
    labelKey: "admin.settings.receipt.title",
    defaultLabel: "Receipt Settings",
    icon: Monitor,
  },
  {
    id: "email",
    tab: "email",
    group: "communication",
    labelKey: "admin.settings.email.title",
    defaultLabel: "Email Configuration (SMTP)",
    icon: Mail,
  },
  {
    id: "notifications",
    tab: "notifications",
    group: "communication",
    labelKey: "admin.settings.notifications.title",
    defaultLabel: "Notification Settings",
    icon: Bell,
  },
  {
    id: "messaging",
    tab: "messaging",
    group: "communication",
    labelKey: "admin.settings.messaging.title",
    defaultLabel: "Omnichannel Messaging",
    icon: MessagesSquare,
  },
  {
    id: "whatsapp",
    tab: "whatsapp",
    group: "communication",
    labelKey: "admin.settings.whatsapp.title",
    defaultLabel: "WhatsApp Integration",
    icon: MessagesSquare, // or another appropriate icon
  },
  {
    id: "oauth",
    tab: "oauth",
    group: "authentication",
    labelKey: "admin.settings.oauth.title",
    defaultLabel: "OAuth / Social Login",
    icon: KeyRound,
  },
  {
    id: "twoFactor",
    tab: "twoFactor",
    group: "authentication",
    labelKey: "admin.settings.twoFactor.title",
    defaultLabel: "Two-Factor Authentication",
    icon: Lock,
  },
  {
    id: "otp",
    tab: "otp",
    group: "authentication",
    labelKey: "admin.settings.otp.title",
    defaultLabel: "OTP & SMS",
    icon: Shield,
  },
  {
    id: "security",
    tab: "security",
    group: "authentication",
    labelKey: "admin.settings.security.title",
    defaultLabel: "Security & Access Control",
    icon: Shield,
  },
  {
    id: "seo",
    tab: "seo",
    group: "growth",
    labelKey: "admin.settings.seo.title",
    defaultLabel: "SEO Settings",
    icon: Search,
  },
  {
    id: "social",
    tab: "social",
    group: "growth",
    labelKey: "admin.settings.social.title",
    defaultLabel: "Social / Links",
    icon: Link2,
  },
  {
    id: "analytics",
    tab: "analytics",
    group: "growth",
    labelKey: "admin.settings.analytics.title",
    defaultLabel: "Analytics",
    icon: BarChart3,
  },
  {
    id: "aiAuthoring",
    tab: "aiAuthoring",
    group: "growth",
    labelKey: "admin.settings.ai.title",
    defaultLabel: "AI Configuration",
    icon: Sparkles,
  },
  {
    id: "storage",
    tab: "storage",
    group: "advanced",
    labelKey: "admin.settings.storage.title",
    defaultLabel: "Storage",
    icon: HardDrive,
  },
  {
    id: "maintenance",
    tab: "maintenance",
    group: "advanced",
    labelKey: "admin.settings.maintenance.title",
    defaultLabel: "Maintenance",
    icon: Wrench,
  },
  {
    id: "system-management",
    tab: "system-management",
    group: "advanced",
    labelKey: "admin.settings.systemManagement.title",
    defaultLabel: "System Management",
    icon: HardDrive,
  },
  {
    id: "advanced",
    tab: "advanced",
    group: "advanced",
    labelKey: "admin.settings.advanced.title",
    defaultLabel: "Advanced Configs",
    icon: Wrench,
  },
];

type SettingsForStatus = {
  maintenance?: { enabled?: boolean };
  boosting?: { enabled?: boolean };
  payment?: {
    stripe?: { enabled?: boolean };
    paypal?: { enabled?: boolean };
    razorpay?: { enabled?: boolean };
    paystack?: { enabled?: boolean };
    pesapal?: { enabled?: boolean };
    iotec?: { enabled?: boolean };
  };
  email?: { enabled?: boolean; provider?: string; smtp?: { host?: string; user?: string } };
  shipping?: {
    enabled?: boolean;
    zones?: Array<{ rates?: unknown[] }>;
    carriers?: {
      enabled?: boolean;
      shippo?: { enabled?: boolean; mode?: "test" | "live" };
      shiprocket?: { enabled?: boolean; pickupLocationName?: string };
    };
  };
  storage?: { provider?: string; bucketName?: string };
  security?: {
    twoFactorEnabled?: boolean;
    googleOAuthEnabled?: boolean;
    facebookOAuthEnabled?: boolean;
  };
  aiAuthoring?: { enabled?: boolean };
  _meta?: {
    credentials?: CredentialMetaMap;
    envSources?: {
      ai?: { apiKey?: boolean };
      payment?: {
        stripe?: { publishableKey?: boolean; secretKey?: boolean };
        paypal?: { clientId?: boolean; clientSecret?: boolean };
        razorpay?: { keyId?: boolean; keySecret?: boolean };
        paystack?: { publicKey?: boolean; secretKey?: boolean };
        pesapal?: {
          consumerKey?: boolean;
          consumerSecret?: boolean;
          ipnId?: boolean;
        };
        iotec?: {
          clientId?: boolean;
          clientSecret?: boolean;
          walletId?: boolean;
        };
      };
      security?: {
        googleClientId?: boolean;
        googleClientSecret?: boolean;
        facebookAppId?: boolean;
        facebookAppSecret?: boolean;
      };
      storage?: { accessKeyId?: boolean };
      shipping?: {
        shippo?: {
          testToken?: boolean;
          liveToken?: boolean;
          webhookSecret?: boolean;
        };
        shiprocket?: {
          email?: boolean;
          password?: boolean;
          pickupLocationName?: boolean;
          webhookToken?: boolean;
        };
      };
    };
  };
};

export function getSectionStatus(
  sectionId: AdminSettingsSectionId,
  settings: SettingsForStatus,
): SectionStatus {
  if (sectionId === "maintenance") {
    return settings.maintenance?.enabled ? "warning" : "ok";
  }

  if (sectionId === "boosting") {
    return settings.boosting?.enabled ? "ok" : "disabled";
  }

  if (sectionId === "payment") {
    const cred = (path: string) =>
      Boolean(settings._meta?.credentials?.[path]?.set);
    const env = settings._meta?.envSources?.payment;

    const providers: Array<{ enabled: boolean; configured: boolean }> = [
      {
        enabled: settings.payment?.stripe?.enabled ?? false,
        configured:
          cred("payment.stripe.secretKey") || Boolean(env?.stripe?.secretKey),
      },
      {
        enabled: settings.payment?.paypal?.enabled ?? false,
        configured:
          cred("payment.paypal.clientSecret") ||
          Boolean(env?.paypal?.clientSecret),
      },
      {
        enabled: settings.payment?.razorpay?.enabled ?? false,
        configured:
          cred("payment.razorpay.keySecret") ||
          Boolean(env?.razorpay?.keySecret),
      },
      {
        enabled: settings.payment?.paystack?.enabled ?? false,
        configured:
          cred("payment.paystack.secretKey") ||
          Boolean(env?.paystack?.secretKey),
      },
      {
        enabled: settings.payment?.pesapal?.enabled ?? false,
        configured:
          (cred("payment.pesapal.consumerKey") ||
            Boolean(env?.pesapal?.consumerKey)) &&
          (cred("payment.pesapal.consumerSecret") ||
            Boolean(env?.pesapal?.consumerSecret)) &&
          (cred("payment.pesapal.ipnId") || Boolean(env?.pesapal?.ipnId)),
      },
      {
        enabled: settings.payment?.iotec?.enabled ?? false,
        configured:
          (cred("payment.iotec.clientId") || Boolean(env?.iotec?.clientId)) &&
          (cred("payment.iotec.clientSecret") ||
            Boolean(env?.iotec?.clientSecret)) &&
          (cred("payment.iotec.walletId") || Boolean(env?.iotec?.walletId)),
      },
    ];

    return providers.some((p) => p.enabled && !p.configured)
      ? "warning"
      : "ok";
  }

  if (sectionId === "email") {
    if (!settings.email?.enabled) return "disabled";
    if (settings.email.provider !== "smtp") return "ok";
    const host = settings.email.smtp?.host;
    const user = settings.email.smtp?.user;
    return !host || !user ? "warning" : "ok";
  }

  if (sectionId === "storage") {
    if (!settings.storage) return "ok";
    const bucketName = settings.storage.bucketName;
    const accessKeyId =
      settings._meta?.credentials?.["storage.accessKeyId"]?.set ||
      settings._meta?.envSources?.storage?.accessKeyId;
    return !bucketName || !accessKeyId ? "warning" : "ok";
  }

  if (sectionId === "oauth") {
    const googleEnabled = settings.security?.googleOAuthEnabled ?? false;
    const facebookEnabled = settings.security?.facebookOAuthEnabled ?? false;
    const oauthEnv = settings._meta?.envSources?.security;
    const oauthCred = (path: string) =>
      Boolean(settings._meta?.credentials?.[path]?.set);
    const googleConfigured =
      (oauthCred("security.googleClientId") ||
        Boolean(oauthEnv?.googleClientId)) &&
      (oauthCred("security.googleClientSecret") ||
        Boolean(oauthEnv?.googleClientSecret));
    const facebookConfigured =
      (oauthCred("security.facebookAppId") ||
        Boolean(oauthEnv?.facebookAppId)) &&
      (oauthCred("security.facebookAppSecret") ||
        Boolean(oauthEnv?.facebookAppSecret));
    const hasWarning =
      (googleEnabled && !googleConfigured) || (facebookEnabled && !facebookConfigured);
    return hasWarning ? "warning" : "ok";
  }

  if (sectionId === "twoFactor") {
    const enabled = settings.security?.twoFactorEnabled ?? false;
    return enabled ? "ok" : "disabled";
  }

  if (sectionId === "shipping") {
    const enabled = settings.shipping?.enabled ?? false;
    if (!enabled) return "disabled";

    // A carrier switched on but missing its credentials will fail on the first
    // label purchase, which is the worst place to discover it — surface it here
    // the same way an unconfigured payment gateway is surfaced.
    const carriers = settings.shipping?.carriers;
    if (carriers?.enabled) {
      const cred = (path: string) =>
        Boolean(settings._meta?.credentials?.[path]?.set);
      const env = settings._meta?.envSources?.shipping;

      if (carriers.shippo?.enabled) {
        const tokenPath =
          carriers.shippo.mode === "live"
            ? "shipping.carriers.shippo.liveToken"
            : "shipping.carriers.shippo.testToken";
        const tokenFromEnv =
          carriers.shippo.mode === "live"
            ? env?.shippo?.liveToken
            : env?.shippo?.testToken;
        if (!cred(tokenPath) && !tokenFromEnv) return "warning";
      }

      if (carriers.shiprocket?.enabled) {
        const configured =
          (cred("shipping.carriers.shiprocket.email") ||
            Boolean(env?.shiprocket?.email)) &&
          (cred("shipping.carriers.shiprocket.password") ||
            Boolean(env?.shiprocket?.password)) &&
          // Shiprocket cannot dispatch without a registered pickup nickname,
          // so an unset one is as blocking as a missing password.
          (Boolean(carriers.shiprocket.pickupLocationName) ||
            Boolean(env?.shiprocket?.pickupLocationName));
        if (!configured) return "warning";
      }
    }

    const zones = settings.shipping?.zones ?? [];
    if (zones.length === 0) return "warning";
    const hasRates = zones.some((z) => Array.isArray(z.rates) && z.rates.length > 0);
    return hasRates ? "ok" : "warning";
  }

  if (sectionId === "aiAuthoring") {
    if (settings.aiAuthoring?.enabled === false) return "disabled";
    const keyAvailable =
      Boolean(settings._meta?.credentials?.["aiAuthoring.apiKey"]?.set) ||
      (settings._meta?.envSources?.ai?.apiKey ?? false);
    return keyAvailable ? "ok" : "warning";
  }

  return "ok";
}
