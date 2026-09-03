"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  Store,
  Globe,
  Languages,
  CircleDollarSign,
  MapPinned,
  Banknote,
  Truck,
  ShieldAlert,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CountrySelect } from "@/components/common/country-multi-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { toast } from "@/components/ui/toast-notification";
import type { Settings } from "@/components/admin/settings/types";
import { SettingsTabHeader } from "./settings-tab-header";
import { StickySaveFooter } from "./sticky-save-footer";
import {
  currencyLabel,
  currencyOptionsFor,
} from "@/components/admin/settings/general/constants";
import { AddCurrencyField } from "@/components/admin/settings/general/add-currency-field";
import { isValidLocale, localeConfig, locales } from "@/config/i18n.config";
import {
  COUNTRY_AVAILABILITY_MODES,
  sanitizeCountryCodes,
} from "@/lib/country-availability";
import { COUNTRIES } from "@/lib/country-options";
import { TIMEZONE_OPTIONS } from "@/lib/timezones";
import { DEFAULT_CURRENCY } from "@/config/branding.config";
import { DeliveryInfoBuilder } from "@/components/admin/settings/general/delivery-info-builder";

const LANGUAGE_OPTIONS = locales.map(code => ({
  code,
  name: localeConfig[code].name
}));

export function GeneralSettingsTab(props: {
  settings: Settings;
  isSaving: boolean;
  isDirty: boolean;
  updateNestedField: (path: string, value: unknown) => void;
  onSave: () => Promise<boolean> | boolean;
}) {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const currentLocale = useLocale();
  // Custom codes added in this session stay on screen after being unchecked,
  // so an accidental uncheck doesn't make the row vanish before saving.
  const [addedCurrencies, setAddedCurrencies] = useState<string[]>([]);

  const defaultLanguage = props.settings.general.defaultLanguage || "en";
  const defaultCurrency = props.settings.general.defaultCurrency || DEFAULT_CURRENCY;
  const countryAvailabilityMode =
    props.settings.general.countryAvailability?.mode ===
    COUNTRY_AVAILABILITY_MODES.SELECTED
      ? COUNTRY_AVAILABILITY_MODES.SELECTED
      : COUNTRY_AVAILABILITY_MODES.ALL;
  const selectedCountryCodes = sanitizeCountryCodes(
    props.settings.general.countryAvailability?.countryCodes,
  );

  const supportedLanguages = Array.from(
    new Set([
      ...(props.settings.general.supportedLanguages?.length
        ? props.settings.general.supportedLanguages
        : ["en"]),
      defaultLanguage,
    ]),
  );
  const supportedCurrencies = Array.from(
    new Set([
      ...(props.settings.general.supportedCurrencies?.length
        ? props.settings.general.supportedCurrencies
        : ["USD"]),
      defaultCurrency,
    ]),
  );
  const currencyOptions = currencyOptionsFor([
    ...supportedCurrencies,
    ...addedCurrencies,
  ]);

  const handleToggleInList = (
    path: "general.supportedLanguages" | "general.supportedCurrencies",
    current: string[],
    value: string,
    checked: boolean,
  ) => {
    const next = checked
      ? Array.from(new Set([...current, value]))
      : current.filter((v) => v !== value);
    if (next.length === 0) return;

    props.updateNestedField(path, next);

    if (path === "general.supportedLanguages") {
      const defaultLang = props.settings.general.defaultLanguage || "en";
      if (!next.includes(defaultLang)) {
        props.updateNestedField("general.defaultLanguage", next[0]);
      }
    }

    if (path === "general.supportedCurrencies") {
      const defaultCurr = props.settings.general.defaultCurrency || "USD";
      if (!next.includes(defaultCurr)) {
        props.updateNestedField("general.defaultCurrency", next[0]);
      }
    }
  };

  const handleAddCurrency = (code: string) => {
    setAddedCurrencies((prev) => (prev.includes(code) ? prev : [...prev, code]));
    props.updateNestedField("general.supportedCurrencies", [
      ...supportedCurrencies,
      code,
    ]);
  };

  const handleSetDefaultCurrency = (code: string) => {
    if (!supportedCurrencies.includes(code)) {
      props.updateNestedField("general.supportedCurrencies", [
        ...supportedCurrencies,
        code,
      ]);
    }
    props.updateNestedField("general.defaultCurrency", code);
  };

  const handleSave = async () => {
    if (
      countryAvailabilityMode === COUNTRY_AVAILABILITY_MODES.SELECTED &&
      selectedCountryCodes.length === 0
    ) {
      toast.error("Select at least one country, or choose All countries.");
      return;
    }

    const didSave = await props.onSave();
    if (!didSave || !pathname) return;

    const nextLocale = props.settings.general.defaultLanguage || "en";

    if (!isValidLocale(nextLocale) || currentLocale === nextLocale) {
      return;
    }

    const firstSegment = pathname.split("/").filter(Boolean)[0];
    const hasLocalePrefix = isValidLocale(firstSegment);

    const nextPathname = hasLocalePrefix
      ? pathname.replace(`/${firstSegment}`, `/${nextLocale}`)
      : `/${nextLocale}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;

    window.location.href = nextPathname;
  };

  return (
    <div className="relative">
      <div className="space-y-6">
        <SettingsTabHeader
          title={t("admin.settings.general.title")}
          description={t("admin.settings.general.description")}
        />

        {/* Section 1 -- Store Information */}
        <div className="rounded-lg border bg-card text-card-foreground">
          <div className="flex items-center gap-3 border-b px-6 py-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Store className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">Store Information</h3>
              <p className="text-xs text-muted-foreground">
                Basic details about your store
              </p>
            </div>
          </div>
          <div className="px-6 py-5 space-y-5">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="storeName">
                  {t("admin.settings.general.storeName")}
                </Label>
                <Input
                  id="storeName"
                  value={props.settings.general.storeName || ""}
                  onChange={(e) =>
                    props.updateNestedField("general.storeName", e.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="storeEmail">
                  {t("admin.settings.general.storeEmail")}
                </Label>
                <Input
                  id="storeEmail"
                  value={props.settings.general.storeEmail || ""}
                  onChange={(e) =>
                    props.updateNestedField(
                      "general.storeEmail",
                      e.target.value,
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="storePhone">
                  {t("admin.settings.general.phone")}
                </Label>
                <Input
                  id="storePhone"
                  value={props.settings.general.storePhone || ""}
                  onChange={(e) =>
                    props.updateNestedField(
                      "general.storePhone",
                      e.target.value,
                    )
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="storeDomain">
                {t("admin.settings.general.storeDomain")}
              </Label>
              <Input
                id="storeDomain"
                value={props.settings.general.storeDomain || ""}
                onChange={(e) =>
                  props.updateNestedField("general.storeDomain", e.target.value)
                }
                placeholder="https://example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="storeDescription">
                {t("admin.settings.general.storeDescription")}
              </Label>
              <Textarea
                id="storeDescription"
                value={props.settings.general.storeDescription || ""}
                onChange={(e) =>
                  props.updateNestedField(
                    "general.storeDescription",
                    e.target.value,
                  )
                }
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="storeAddress">
                {t("admin.settings.general.address")}
              </Label>
              <Textarea
                id="storeAddress"
                value={props.settings.general.storeAddress || ""}
                onChange={(e) =>
                  props.updateNestedField(
                    "general.storeAddress",
                    e.target.value,
                  )
                }
                rows={2}
              />
            </div>
          </div>
        </div>

        {/* Brand assets (logos + favicon) now live on the Branding tab. */}

        {/* Section 2 -- Regional Defaults */}
        <div className="rounded-lg border bg-card text-card-foreground">
          <div className="flex items-center gap-3 border-b px-6 py-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Globe className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">Regional Defaults</h3>
              <p className="text-xs text-muted-foreground">
                Timezone, language, and currency preferences
              </p>
            </div>
          </div>
          <div className="px-6 py-5">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="timezone">
                  {t("admin.settings.general.timezone")}
                </Label>
                <SearchableSelect
                  id="timezone"
                  value={props.settings.general.timezone || "GMT"}
                  onValueChange={(v) =>
                    props.updateNestedField("general.timezone", v)
                  }
                  options={TIMEZONE_OPTIONS.map((tz) => ({
                    value: tz.value,
                    label: tz.label,
                    keywords: `${tz.value} ${tz.offset}`,
                  }))}
                  searchPlaceholder="Search timezone (e.g. GMT, Accra, London)..."
                />
              </div>
              <div className="space-y-2">
                <Label>{t("admin.settings.general.defaultLanguage")}</Label>
                <SearchableSelect
                  value={props.settings.general.defaultLanguage || "en"}
                  onValueChange={(v) =>
                    props.updateNestedField("general.defaultLanguage", v)
                  }
                  options={supportedLanguages.map((code) => ({
                    value: code,
                    label:
                      LANGUAGE_OPTIONS.find((x) => x.code === code)?.name ||
                      code,
                  }))}
                  searchPlaceholder="Search language..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="defaultCurrency">
                  {t("admin.settings.general.defaultCurrency")}
                </Label>
                <SearchableSelect
                  id="defaultCurrency"
                  value={props.settings.general.defaultCurrency || "GHS"}
                  onValueChange={(v) =>
                    props.updateNestedField("general.defaultCurrency", v)
                  }
                  options={supportedCurrencies.map((code) => ({
                    value: code,
                    label: currencyLabel(code),
                  }))}
                  // The trigger keeps showing just the code; the name is only
                  // there to make the list searchable.
                  renderValue={(option) => option.value}
                  searchPlaceholder="Search currency..."
                />
              </div>
            </div>
            
            <div className="mt-6 flex items-start space-x-3 rounded-lg border p-4 hover:bg-muted/40">
              <Checkbox
                id="disableDecimals"
                checked={props.settings.general.disableDecimals || false}
                onCheckedChange={(checked) =>
                  props.updateNestedField("general.disableDecimals", checked)
                }
              />
              <div className="space-y-1">
                <Label htmlFor="disableDecimals" className="text-sm font-medium leading-none cursor-pointer">
                  Disable Decimals in Prices
                </Label>
                <p className="text-[13px] text-muted-foreground leading-snug">
                  When enabled, all prices will be displayed as whole numbers (e.g., $10 instead of $10.00).
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-start space-x-3 rounded-lg border p-4 hover:bg-muted/40">
              <Checkbox
                id="hideDefaultLocalePrefix"
                checked={props.settings.general.hideDefaultLocalePrefix || false}
                onCheckedChange={(checked) =>
                  props.updateNestedField(
                    "general.hideDefaultLocalePrefix",
                    checked,
                  )
                }
              />
              <div className="space-y-1">
                <Label htmlFor="hideDefaultLocalePrefix" className="text-sm font-medium leading-none cursor-pointer">
                  Hide Default Language Prefix
                </Label>
                <p className="text-[13px] text-muted-foreground leading-snug">
                  When enabled, the default language will be served at the root URL (e.g., <code>/</code> instead of <code>/en</code>).
                  Requires saving to take effect. Note: This can also be set via the <code>HIDE_DEFAULT_LOCALE_PREFIX</code> environment variable.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3 -- Country Availability */}
        <div className="rounded-lg border bg-card text-card-foreground">
          <div className="flex items-center gap-3 border-b px-6 py-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <MapPinned className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">Available countries</h3>
              <p className="text-xs text-muted-foreground">
                Control the country lists used across checkout, vendor
                onboarding, addresses, shipping, and product forms.
              </p>
            </div>
          </div>
          <div className="space-y-5 px-6 py-5">
            <RadioGroup
              value={countryAvailabilityMode}
              onValueChange={(mode) =>
                props.updateNestedField("general.countryAvailability", {
                  mode,
                  countryCodes:
                    mode === COUNTRY_AVAILABILITY_MODES.ALL
                      ? []
                      : selectedCountryCodes.length
                        ? selectedCountryCodes
                        : ["GH"],
                })
              }
              className="grid gap-3 md:grid-cols-2"
            >
              <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-4 hover:bg-muted/40">
                <RadioGroupItem
                  value={COUNTRY_AVAILABILITY_MODES.ALL}
                  className="mt-0.5"
                />
                <span className="space-y-1">
                  <span className="block text-sm font-medium">
                    All countries
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    Show every supported country ({COUNTRIES.length}) in all
                    country pickers.
                  </span>
                </span>
              </label>
              <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-4 hover:bg-muted/40">
                <RadioGroupItem
                  value={COUNTRY_AVAILABILITY_MODES.SELECTED}
                  className="mt-0.5"
                />
                <span className="space-y-1">
                  <span className="block text-sm font-medium">
                    Specific countries
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    Only show the countries you select below.
                  </span>
                </span>
              </label>
            </RadioGroup>

            {countryAvailabilityMode ===
            COUNTRY_AVAILABILITY_MODES.SELECTED ? (
              <div className="space-y-2">
                <Label>Countries</Label>
                <CountrySelect
                  multiple={true}
                  value={selectedCountryCodes}
                  onChange={(countryCodes: string[]) =>
                    props.updateNestedField("general.countryAvailability", {
                      mode: COUNTRY_AVAILABILITY_MODES.SELECTED,
                      countryCodes,
                    })
                  }
                  valueFormat="code"
                  restrictToAvailableCountries={false}
                  placeholder="Select countries"
                  searchPlaceholder="Search countries or ISO codes..."
                  emptyText="No countries found."
                />
                {selectedCountryCodes.length === 0 ? (
                  <p className="text-xs text-destructive">
                    Select at least one country before saving.
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {selectedCountryCodes.length}{" "}
                    {selectedCountryCodes.length === 1 ? "country" : "countries"}{" "}
                    selected.
                  </p>
                )}
              </div>
            ) : null}
          </div>
        </div>

        {/* Section 4 -- Supported Languages */}
        <div className="rounded-lg border bg-card text-card-foreground">
          <div className="flex items-center gap-3 border-b px-6 py-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Languages className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">
                {t("admin.settings.general.supportedLanguages")}
              </h3>
              <p className="text-xs text-muted-foreground">
                {t("admin.settings.general.supportedLanguagesDesc")}
              </p>
            </div>
          </div>
          <div className="px-6 py-5">
            <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
              {LANGUAGE_OPTIONS.map((l) => {
                const isDefault = l.code === defaultLanguage;
                const isChecked = supportedLanguages.includes(l.code);
                return (
                  <label
                    key={l.code}
                    className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors cursor-pointer hover:bg-muted/50 ${
                      isChecked
                        ? "border-primary/30 bg-primary/5"
                        : "border-border"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={(v) =>
                          handleToggleInList(
                            "general.supportedLanguages",
                            supportedLanguages,
                            l.code,
                            Boolean(v),
                          )
                        }
                      />
                      <span className="font-medium">{l.name}</span>
                    </span>
                    {isDefault && (
                      <Badge
                        variant="secondary"
                        className="text-[10px] px-1.5 py-0"
                      >
                        Default
                      </Badge>
                    )}
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        {/* Section 5 -- Supported Currencies */}
        <div className="rounded-lg border bg-card text-card-foreground">
          <div className="flex items-center gap-3 border-b px-6 py-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <CircleDollarSign className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">
                {t("admin.settings.general.supportedCurrencies")}
              </h3>
              <p className="text-xs text-muted-foreground">
                {t("admin.settings.general.supportedCurrenciesDesc")}
              </p>
            </div>
          </div>
          <div className="space-y-4 px-6 py-5">
            <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
              {currencyOptions.map((c) => {
                const isDefault = c.code === defaultCurrency;
                const isChecked = supportedCurrencies.includes(c.code);
                return (
                  <div
                    key={c.code}
                    className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2.5 text-sm transition-colors hover:bg-muted/50 ${
                      isChecked
                        ? "border-primary/30 bg-primary/5"
                        : "border-border"
                    }`}
                  >
                    <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2">
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={(v) =>
                          handleToggleInList(
                            "general.supportedCurrencies",
                            supportedCurrencies,
                            c.code,
                            Boolean(v),
                          )
                        }
                      />
                      <span className="flex min-w-0 items-baseline gap-1.5">
                        <span className="font-medium">{c.code}</span>
                        {c.name ? (
                          <span className="truncate text-xs text-muted-foreground">
                            {c.name}
                          </span>
                        ) : null}
                      </span>
                    </label>
                    {isDefault ? (
                      <Badge
                        variant="secondary"
                        className="shrink-0 text-[10px] px-1.5 py-0"
                      >
                        Default
                      </Badge>
                    ) : isChecked ? (
                      <button
                        type="button"
                        onClick={() => handleSetDefaultCurrency(c.code)}
                        className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      >
                        Set default
                      </button>
                    ) : null}
                  </div>
                );
              })}
            </div>

            <AddCurrencyField
              existing={supportedCurrencies}
              onAdd={handleAddCurrency}
            />
          </div>
        </div>

        {/* Exchange Rate API */}
        <div className="overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm">
          <div className="border-b bg-muted/50 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <Banknote className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">Live Exchange Rates</h3>
                <p className="text-xs text-muted-foreground">Configure automatic currency conversion.</p>
              </div>
            </div>
          </div>
          <div className="space-y-4 px-6 py-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="exchangeRateProvider">Provider</Label>
                <Select
                  value={props.settings.general.exchangeRateProvider || "open.er-api.com"}
                  onValueChange={(v) => props.updateNestedField("general.exchangeRateProvider", v)}
                >
                  <SelectTrigger id="exchangeRateProvider">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open.er-api.com">Open Exchange Rates (Free, No Key)</SelectItem>
                    <SelectItem value="exchangerate-api.com">ExchangeRate-API (Requires Key)</SelectItem>
                    <SelectItem value="custom">Custom Implementation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="exchangeRateApiKey">API Key</Label>
                <Input
                  id="exchangeRateApiKey"
                  type="password"
                  placeholder="Optional for free provider"
                  value={props.settings.general.exchangeRateApiKey || ""}
                  onChange={(e) => props.updateNestedField("general.exchangeRateApiKey", e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Global Delivery Information */}
        <div className="overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm">
          <div className="border-b bg-muted/50 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <Truck className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">Delivery Information</h3>
                <p className="text-xs text-muted-foreground">Global delivery and shipping details shown on all product pages.</p>
              </div>
            </div>
          </div>
          <div className="px-6 py-5">
            <DeliveryInfoBuilder
              value={props.settings.general.deliveryInformation || []}
              onChange={(v) => props.updateNestedField("general.deliveryInformation", v)}
            />
          </div>
        </div>

        {/* Access Control (Country Blocking) */}
        <div className="overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm">
          <div className="border-b bg-muted/50 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-destructive/10">
                <ShieldAlert className="h-4 w-4 text-destructive" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">Access Control</h3>
                <p className="text-xs text-muted-foreground">Block specific countries from accessing the storefront.</p>
              </div>
            </div>
          </div>
          <div className="space-y-4 px-6 py-5">
            <div className="space-y-2">
              <Label htmlFor="blockedCountries">Blocked Countries</Label>
              <CountrySelect
                id="blockedCountries"
                multiple={true}
                valueFormat="code"
                value={props.settings.general.blockedCountries || []}
                onChange={(codes) =>
                  props.updateNestedField("general.blockedCountries", codes)
                }
              />
              <p className="text-xs text-muted-foreground">
                Visitors from these countries will see the "Access Denied" page. Admin dashboard access remains unblocked.
              </p>
            </div>
            
            <div className="space-y-2 pt-2">
              <Label htmlFor="blockedMessage">Custom Blocked Message</Label>
              <Input
                id="blockedMessage"
                placeholder="This website is currently not available in your region."
                value={props.settings.general.blockedMessage || ""}
                onChange={(e) =>
                  props.updateNestedField("general.blockedMessage", e.target.value)
                }
              />
              <p className="text-xs text-muted-foreground">
                Optional custom message to display on the blocked screen.
              </p>
            </div>
          </div>


        </div>
      </div>

      <StickySaveFooter
        label={t("admin.settings.general.save")}
        isSaving={props.isSaving}
        isDirty={props.isDirty}
        onSave={handleSave}
      />
    </div>
  );
}
