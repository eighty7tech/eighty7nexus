"use client";

import type { Settings } from "./types";
import { useEffect, useMemo, useState } from "react";
import { toast } from "@/components/ui/toast-notification";
import { useAppSettings as useAppSettingsStore } from "@/stores/app-settings";
import { useCurrencyStore } from "@/providers/currency-provider";
import {
  useAppSettings as usePublicAppSettings,
} from "@/providers/app-settings-provider";
import { getSectionIdFromPath, isPlainObject, setNestedValue } from "./utils";
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
} from "@/config/branding.config";
import { normalizeNotificationSettings } from "@/lib/notification-settings";
import { apiClient, ApiClientError } from "@/lib/api/client";
import { normalizeCountryAvailability } from "@/lib/country-availability";
import type { CarrierProvider } from "@/lib/shipping/carrier-config";

const REQUIRED_OBJECT_SECTIONS = [
  "general",
  "appearance",
  "compliance",
  "payment",
  "email",
  "orders",
  "shipping",
  "seo",
  "social",
  "analytics",
  "maintenance",
  "security",
  "pos",
  "multiBranch",
  "multiVendorMode",
  "vendorConfig",
  "notifications",
  "storage",
  "aiSalesAgent",
] as const;

const DEFAULT_GENERAL_SETTINGS: Settings["general"] = {
  storeName: DEFAULT_STORE_NAME,
  storeEmail: "store@example.com",
  defaultLanguage: DEFAULT_LANGUAGE,
  defaultCurrency: DEFAULT_CURRENCY,
  supportedLanguages: [DEFAULT_LANGUAGE],
  supportedCurrencies: [DEFAULT_CURRENCY],
  countryAvailability: normalizeCountryAvailability(undefined),
  timezone: DEFAULT_TIMEZONE,
};

function normalizeStringArray(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) return fallback;
  const normalized = value.filter((item): item is string => typeof item === "string");
  return normalized.length ? normalized : fallback;
}

function normalizeSettingsPayload(value: unknown): Settings | null {
  if (!isPlainObject(value)) return null;

  const normalized: Record<string, unknown> = { ...value };
  for (const section of REQUIRED_OBJECT_SECTIONS) {
    if (!isPlainObject(normalized[section])) {
      normalized[section] = {};
    }
  }

  const general = normalized.general as Record<string, unknown>;
  normalized.general = {
    ...DEFAULT_GENERAL_SETTINGS,
    ...general,
    supportedLanguages: normalizeStringArray(
      general.supportedLanguages,
      DEFAULT_GENERAL_SETTINGS.supportedLanguages,
    ),
    supportedCurrencies: normalizeStringArray(
      general.supportedCurrencies,
      DEFAULT_GENERAL_SETTINGS.supportedCurrencies,
    ),
    countryAvailability: normalizeCountryAvailability(
      general.countryAvailability,
    ),
  };

  normalized.notifications = normalizeNotificationSettings(
    normalized.notifications,
  );

  return normalized as unknown as Settings;
}

function normalizeComparableValue(value: unknown): unknown {
  if (value === undefined || value === null || value === "") return undefined;

  if (Array.isArray(value)) {
    return value.map((item) => normalizeComparableValue(item));
  }

  if (isPlainObject(value)) {
    const normalized: Record<string, unknown> = {};
    for (const [key, nestedValue] of Object.entries(value)) {
      const next = normalizeComparableValue(nestedValue);
      if (next !== undefined) normalized[key] = next;
    }
    return normalized;
  }

  return value;
}

function comparableJson(value: unknown) {
  return JSON.stringify(normalizeComparableValue(value));
}

function pickSecurityFields(
  settings: Settings,
  keys: Array<keyof Settings["security"]>,
) {
  const security = settings.security || {};
  return keys.reduce<Record<string, unknown>>((acc, key) => {
    acc[String(key)] = security[key];
    return acc;
  }, {});
}

function getComparableSection(section: string, settings: Settings): unknown {
  if (section === "oauth") {
    return {
      ...pickSecurityFields(settings, [
        "googleOAuthEnabled",
        "googleClientId",
        "googleClientSecret",
        "facebookOAuthEnabled",
        "facebookAppId",
        "facebookAppSecret",
      ]),
      googleClientSecretSet: Boolean(
        settings._meta?.credentials?.["security.googleClientSecret"]?.set,
      ),
      facebookAppSecretSet: Boolean(
        settings._meta?.credentials?.["security.facebookAppSecret"]?.set,
      ),
    };
  }

  if (section === "twoFactor") {
    return pickSecurityFields(settings, [
      "twoFactorEnabled",
      "twoFactorRequiredForAdmin",
      "twoFactorRequiredForVendors",
      "twoFactorRequiredForStaff",
    ]);
  }

  if (section === "emailVerification") {
    return pickSecurityFields(settings, [
      "emailVerificationRequired",
      "emailVerificationForVendors",
    ]);
  }

  if (section === "security") {
    return pickSecurityFields(settings, [
      "sessionMaxAgeDays",
      "maxLoginAttempts",
      "lockoutDurationMinutes",
      "minPasswordLength",
      "requireUppercase",
      "requireNumbers",
      "requireSpecialChars",
    ]);
  }

  const key = section === "marketplace" ? "multiVendorMode" : section;
  return (settings as unknown as Record<string, unknown>)[key];
}

function getEffectiveDirtySections(
  settings: Settings | null,
  initialSettings: Settings | null,
  dirtySectionHints: Set<string>,
) {
  const next = new Set<string>();
  if (!settings || !initialSettings) return next;

  for (const section of dirtySectionHints) {
    const current = getComparableSection(section, settings);
    const initial = getComparableSection(section, initialSettings);
    if (comparableJson(current) !== comparableJson(initial)) {
      next.add(section);
    }
  }

  return next;
}

export function useAdminSettings(initialData?: unknown) {
  const { refreshSettings } = usePublicAppSettings();
  // Server-seeded settings (from the admin settings layout) let us skip the
  // on-mount client fetch and its skeleton flash entirely. Normalized once so
  // the initial render already has real data.
  const seededSettings = useMemo(
    () => normalizeSettingsPayload(initialData),
    // initialData is a stable server prop for the life of the layout; seeding
    // once is intentional (refetch() handles refreshes).
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const [settings, setSettings] = useState<Settings | null>(seededSettings);
  const [initialSettings, setInitialSettings] = useState<Settings | null>(
    seededSettings,
  );
  const [isLoading, setIsLoading] = useState(!seededSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [isTestingEmail, setIsTestingEmail] = useState(false);
  const [isTestingPayment, setIsTestingPayment] = useState(false);
  const [isTestingOAuth, setIsTestingOAuth] = useState(false);
  const [isRegisteringPesapalIpn, setIsRegisteringPesapalIpn] = useState(false);
  const [isCarrierBusy, setIsCarrierBusy] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [dirtySectionHints, setDirtySectionHints] = useState<Set<string>>(
    () => new Set(),
  );
  const dirtySections = useMemo(
    () =>
      getEffectiveDirtySections(
        settings,
        initialSettings,
        dirtySectionHints,
      ),
    [settings, initialSettings, dirtySectionHints],
  );
  const isDemoMode = Boolean(settings?._meta?.demoMode?.enabled);
  const demoModeMessage =
    settings?._meta?.demoMode?.message ||
    "Demo mode is enabled. Settings changes are disabled on this demo site.";

  const notifyDemoMode = () => {
    toast.error(demoModeMessage);
  };

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/admin/settings", {
        method: "GET",
        cache: "no-store",
      });
      const json = (await res.json()) as unknown;
      const data = isPlainObject(json) ? json : {};
      if (data.success === true && "data" in data) {
        const loaded = normalizeSettingsPayload(data.data);
        if (!loaded) {
          toast.error("Failed to load settings");
          setSettings(null);
          setInitialSettings(null);
          return;
        }
        setSettings(loaded);
        setInitialSettings(loaded);
        setDirtySectionHints(new Set());
      } else {
        toast.error("Failed to load settings");
        setSettings(null);
        setInitialSettings(null);
        setDirtySectionHints(new Set());
      }
    } catch {
      toast.error("Failed to load settings");
      setSettings(null);
      setInitialSettings(null);
      setDirtySectionHints(new Set());
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Already hydrated from the server-rendered layout — no client fetch needed.
    if (seededSettings) return;
    const timer = window.setTimeout(() => {
      void fetchSettings();
    }, 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const markSectionDirty = (sectionId: string) => {
    if (isDemoMode) {
      notifyDemoMode();
      return;
    }
    setDirtySectionHints((prev) => {
      const next = new Set(prev);
      next.add(sectionId);
      return next;
    });
  };

  const updateNestedField = (path: string, value: unknown) => {
    if (isDemoMode) {
      notifyDemoMode();
      return;
    }
    const sectionId = getSectionIdFromPath(path);
    if (sectionId) markSectionDirty(String(sectionId));
    setSettings((prev) => {
      if (!prev) return prev;
      return setNestedValue(
        prev as unknown as Record<string, unknown>,
        path,
        value,
      ) as unknown as Settings;
    });
  };

  const updateFieldInSection = (section: string, path: string, value: unknown) => {
    if (isDemoMode) {
      notifyDemoMode();
      return;
    }
    const resolvedPath = path.includes(".") ? path : `${section}.${path}`;
    markSectionDirty(section);
    setSettings((prev) => {
      if (!prev) return prev;
      return setNestedValue(
        prev as unknown as Record<string, unknown>,
        resolvedPath,
        value,
      ) as unknown as Settings;
    });
  };

  const saveSection = async (section: string, data: unknown) => {
    if (isDemoMode) {
      notifyDemoMode();
      return false;
    }
    try {
      setIsSaving(true);
      const apiSection =
        // `marketplace` is the shell's id for the multi-vendor screen — the
        // dirty-check and the nav already map it that way. Sending it to
        // "general" would have written marketplace data into the wrong section
        // the first time anything called this with that id.
        section === "marketplace"
          ? "multiVendorMode"
          : section === "twoFactor" ||
              section === "oauth" ||
              section === "emailVerification"
            ? "security"
            : section;
      // The payload is sent as the caller built it. There used to be a
      // hard-coded key list here that rebuilt the "general" object, which was a
      // second copy of the server's SECTION_ALLOWED_KEYS — and it silently
      // drifted: `general.appIconUrl` was added to the schema, the API and the
      // Branding tab, but never here, so uploading an app icon reported "saved"
      // and stored nothing. The API is the single authority; it drops unknown
      // keys rather than rejecting the request (see validateSectionUpdate).
      const saved = await apiClient.put<unknown>("/api/admin/settings", {
        section: apiSection,
        data,
      });
      {
        const nextSettings = normalizeSettingsPayload(saved);
        if (!nextSettings) {
          toast.error("Failed to save settings");
          return false;
        }
        setSettings(nextSettings);
        setInitialSettings(nextSettings);
        if (apiSection === "appearance" && nextSettings.appearance) {
          useAppSettingsStore.setState({
            themeMode: normalizeThemeMode(nextSettings.appearance.theme),
            contrast: Boolean(nextSettings.appearance.contrast),
            rtl: Boolean(nextSettings.appearance.rtl),
            collapsedSidebar: Boolean(nextSettings.appearance.collapsedSidebar),
            navLayout: nextSettings.appearance.navLayout || "mini",
            navColor: nextSettings.appearance.navColor || "integrate",
            adminLayout: nextSettings.appearance.adminLayout || "cards",
            typography: nextSettings.appearance.typography,
            presetColor:
              nextSettings.appearance.presetColor || DEFAULT_PRESET_COLOR,
            primaryColor:
              nextSettings.appearance.primaryColor || DEFAULT_PRIMARY_COLOR,
            secondaryColor:
              nextSettings.appearance.secondaryColor || DEFAULT_SECONDARY_COLOR,
            accentColor:
              nextSettings.appearance.accentColor || DEFAULT_ACCENT_COLOR,
            authUI: nextSettings.appearance.authUI,
            dbHydrated: true,
          });
        }
        if (apiSection === "general" && nextSettings.general) {
          const newCurrency = nextSettings.general.defaultCurrency || DEFAULT_CURRENCY;
          const currentCurrency = useCurrencyStore.getState().currency.code;
          if (newCurrency.toUpperCase() !== currentCurrency.toUpperCase()) {
            useCurrencyStore.getState().setCurrency(newCurrency);
          }
        }
        // Every section, not just "general". The public payload also carries the
        // multi-vendor, POS, boosting, social, share, appearance and maintenance
        // values that the sidebar and storefront read through
        // `AppSettingsProvider` — refreshing only after "general" is why
        // switching POS on left the admin looking at a nav that had not changed
        // and reasonably concluding the toggle was broken. One cached GET.
        await refreshSettings();
        setDirtySectionHints((prev) => {
          const next = new Set(prev);
          next.delete(section);
          return next;
        });
        toast.success("Settings saved");
        return true;
      }
    } catch (error) {
      if (error instanceof ApiClientError && error.status === 429) {
        const fallback = error.retryAfter
          ? `Too many requests. Please try again in ${error.retryAfter} seconds.`
          : "Too many requests. Please try again shortly.";
        toast.error(error.message || fallback);
        return false;
      }
      toast.error(
        error instanceof ApiClientError && error.message
          ? error.message
          : "Failed to save settings",
      );
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const saveSections = async (data: Record<string, unknown>) => {
    if (isDemoMode) {
      notifyDemoMode();
      return false;
    }
    try {
      setIsSaving(true);
      const saved = await apiClient.put<unknown>("/api/admin/settings", {
        data,
      });
      {
        const nextSettings = normalizeSettingsPayload(saved);
        if (!nextSettings) {
          toast.error("Failed to save settings");
          return false;
        }
        setSettings(nextSettings);
        setInitialSettings(nextSettings);
        if (nextSettings.appearance) {
          useAppSettingsStore.setState({
            themeMode: normalizeThemeMode(nextSettings.appearance.theme),
            contrast: Boolean(nextSettings.appearance.contrast),
            rtl: Boolean(nextSettings.appearance.rtl),
            collapsedSidebar: Boolean(nextSettings.appearance.collapsedSidebar),
            navLayout: nextSettings.appearance.navLayout || "mini",
            navColor: nextSettings.appearance.navColor || "integrate",
            adminLayout: nextSettings.appearance.adminLayout || "cards",
            typography: nextSettings.appearance.typography,
            presetColor:
              nextSettings.appearance.presetColor || DEFAULT_PRESET_COLOR,
            primaryColor:
              nextSettings.appearance.primaryColor || DEFAULT_PRIMARY_COLOR,
            secondaryColor:
              nextSettings.appearance.secondaryColor || DEFAULT_SECONDARY_COLOR,
            accentColor:
              nextSettings.appearance.accentColor || DEFAULT_ACCENT_COLOR,
            authUI: nextSettings.appearance.authUI,
            dbHydrated: true,
          });
        }
        await refreshSettings();
        setDirtySectionHints(new Set());
        toast.success("Settings saved");
        return true;
      }
    } catch (error) {
      if (error instanceof ApiClientError && error.status === 429) {
        const fallback = error.retryAfter
          ? `Too many requests. Please try again in ${error.retryAfter} seconds.`
          : "Too many requests. Please try again shortly.";
        toast.error(error.message || fallback);
        return false;
      }
      toast.error("Failed to save settings");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const testSmtp = async () => {
    if (isDemoMode) {
      notifyDemoMode();
      return;
    }
    try {
      setIsTestingEmail(true);
      const result = await apiClient.request<unknown>(
        "POST",
        "/api/admin/settings/test-email",
        { testEmail },
      );
      toast.success(result.message || "Test email sent");
    } catch (error) {
      toast.error(
        error instanceof Error && error.message
          ? error.message
          : "Failed to send test email",
      );
    } finally {
      setIsTestingEmail(false);
    }
  };

  const testPaymentConnection = async (
    provider:
      | "stripe"
      | "paypal"
      | "razorpay"
      | "paystack"
      | "pesapal"
      | "iotec",
  ) => {
    if (isDemoMode) {
      notifyDemoMode();
      return;
    }
    try {
      setIsTestingPayment(true);
      const result = await apiClient.request<unknown>(
        "POST",
        "/api/admin/settings/test-payment",
        { provider },
      );
      toast.success(result.message || "Connected");
    } catch (error) {
      toast.error(
        error instanceof Error && error.message
          ? error.message
          : "Connection failed",
      );
    } finally {
      setIsTestingPayment(false);
    }
  };

  /**
   * Verify a social-login provider's stored credentials.
   *
   * Gated on a saved section for the same reason the carrier actions are: the
   * secrets never come back to the browser, so the server can only test what is
   * already persisted — testing with unsaved edits in the form would report on
   * the *previous* credentials and read as a false pass.
   */
  const testOAuthConnection = async (provider: "google" | "facebook") => {
    if (isDemoMode) {
      notifyDemoMode();
      return;
    }
    if (dirtySections.has("oauth")) {
      toast.error("Save the OAuth settings before verifying the credentials");
      return;
    }
    try {
      setIsTestingOAuth(true);
      const result = await apiClient.request<unknown>(
        "POST",
        "/api/admin/settings/test-oauth",
        { provider },
      );
      toast.success(result.message || "Credentials verified");
    } catch (error) {
      toast.error(
        error instanceof Error && error.message
          ? error.message
          : "Verification failed",
      );
    } finally {
      setIsTestingOAuth(false);
    }
  };

  const registerPesapalIpn = async () => {
    if (isDemoMode) {
      notifyDemoMode();
      return;
    }
    if (dirtySections.has("payment")) {
      toast.error("Save payment settings before registering the Pesapal IPN URL");
      return;
    }

    try {
      setIsRegisteringPesapalIpn(true);
      const result = await apiClient.request<{ ipnId: string; url: string }>(
        "POST",
        "/api/admin/settings/pesapal/register-ipn",
      );
      toast.success(result.message || "Pesapal IPN registered");
      await fetchSettings();
    } catch (error) {
      toast.error(
        error instanceof Error && error.message
          ? error.message
          : "Failed to register Pesapal IPN",
      );
    } finally {
      setIsRegisteringPesapalIpn(false);
    }
  };

  /**
   * Carrier actions all share one busy flag and one guard: they reach a live
   * carrier account, so an unsaved credential in the form would be tested
   * against the previously stored one and report a misleading result.
   */
  const requireSavedShipping = (action: string): boolean => {
    if (isDemoMode) {
      notifyDemoMode();
      return false;
    }
    if (dirtySections.has("shipping")) {
      toast.error(`Save shipping settings before ${action}`);
      return false;
    }
    return true;
  };

  const testCarrierConnection = async (provider: CarrierProvider) => {
    if (!requireSavedShipping("testing the connection")) return;
    try {
      setIsCarrierBusy(true);
      const result = await apiClient.request<{ account?: string; mode?: string }>(
        "POST",
        "/api/admin/settings/test-carrier",
        { provider },
      );
      toast.success(result.message || "Connected");
    } catch (error) {
      toast.error(
        error instanceof Error && error.message ? error.message : "Connection failed",
      );
    } finally {
      setIsCarrierBusy(false);
    }
  };

  const registerCarrierWebhook = async (provider: CarrierProvider) => {
    if (!requireSavedShipping("registering the webhook")) return;
    try {
      setIsCarrierBusy(true);
      const result = await apiClient.request<{ url: string }>(
        "POST",
        `/api/admin/settings/carriers/${provider}/register-webhook`,
      );
      toast.success(result.message || "Webhook URL generated");
      await fetchSettings();
      return result.data?.url;
    } catch (error) {
      toast.error(
        error instanceof Error && error.message
          ? error.message
          : "Failed to generate the webhook URL",
      );
    } finally {
      setIsCarrierBusy(false);
    }
  };

  const disconnectCarrier = async (provider: CarrierProvider) => {
    if (isDemoMode) {
      notifyDemoMode();
      return;
    }
    try {
      setIsCarrierBusy(true);
      const result = await apiClient.request<unknown>(
        "POST",
        "/api/admin/settings/carriers/disconnect",
        { provider },
      );
      toast.success(result.message || "Carrier disconnected");
      await fetchSettings();
    } catch (error) {
      toast.error(
        error instanceof Error && error.message
          ? error.message
          : "Failed to disconnect the carrier",
      );
    } finally {
      setIsCarrierBusy(false);
    }
  };

  const fetchShiprocketPickupLocations = async (): Promise<string[]> => {
    if (!requireSavedShipping("loading pickup locations")) return [];
    try {
      setIsCarrierBusy(true);
      const result = await apiClient.request<{ locations: string[] }>(
        "GET",
        "/api/admin/settings/carriers/shiprocket/pickup-locations",
      );
      return result.data?.locations ?? [];
    } catch (error) {
      toast.error(
        error instanceof Error && error.message
          ? error.message
          : "Failed to load pickup locations",
      );
      return [];
    } finally {
      setIsCarrierBusy(false);
    }
  };

  const hasUnsaved = (): boolean => {
    return dirtySections.size > 0;
  };

  return {
    settings,
    setSettings,
    isLoading,
    isSaving,
    isTestingEmail,
    isTestingPayment,
    isTestingOAuth,
    isRegisteringPesapalIpn,
    testEmail,
    setTestEmail,
    dirtySections,
    markSectionDirty,
    updateNestedField,
    updateFieldInSection,
    saveSection,
    saveSections,
    testSmtp,
    testPaymentConnection,
    testOAuthConnection,
    registerPesapalIpn,
    isCarrierBusy,
    testCarrierConnection,
    registerCarrierWebhook,
    disconnectCarrier,
    fetchShiprocketPickupLocations,
    refetch: fetchSettings,
    hasUnsaved,
    isDemoMode,
    demoModeMessage,
  };
}
