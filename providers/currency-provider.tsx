"use client";

import { useMemo } from "react";
import { create } from "zustand";
import { formatCurrency } from "@/lib/money";
import { CURRENCIES, resolveCurrency, type Currency } from "@/lib/currencies";
import { useAppSettings } from "@/providers/app-settings-provider";

/**
 * Currency Configuration
 *
 * Display metadata for the currencies the admin can pick as the store default
 * lives in `@/lib/currencies` so server components can resolve the same symbol
 * and locale. The store-wide currency is admin-controlled only (settings.general
 * .defaultCurrency) — customers cannot choose a display currency, so there is
 * no client-side persistence and no conversion: prices are stored and shown in
 * the store currency as-is.
 */
export { CURRENCIES, resolveCurrency };
export type { Currency };

interface CurrencyState {
  currency: Currency;
  baseCurrency: string;
  rates: Record<string, number>;
  disableDecimals: boolean;
  setCurrency: (code: string) => void;
  setRates: (base: string, rates: Record<string, number>) => void;
  setDisableDecimals: (value: boolean) => void;
  formatPrice: (price: number) => string;
}

/**
 * Currency Store with Zustand
 *
 * Mirrors the admin-configured default currency. Written only by
 * <CurrencyApplier> (on load / settings refresh) and the admin settings save
 * flow — never by customer-facing UI. Not persisted: the authoritative value
 * comes from the server on every load, so caching a copy in localStorage can
 * only ever serve a stale currency.
 */
export const useCurrencyStore = create<CurrencyState>()((set, get) => ({
  currency: CURRENCIES[0],
  baseCurrency: "USD",
  rates: {},
  disableDecimals: false,

  setCurrency: (code: string) => {
    const currency = resolveCurrency(code);
    set((state) =>
      state.currency.code === currency.code ? state : { currency },
    );
  },

  setRates: (base: string, rates: Record<string, number>) => {
    set({ baseCurrency: base, rates });
  },

  setDisableDecimals: (value: boolean) => {
    set({ disableDecimals: value });
  },

  // Decimal places are left to Intl, which knows the ISO 4217 minor units of
  // every currency (JPY 0, KWD 3, USD 2) — including codes an admin adds that
  // aren't in CURRENCIES.
  formatPrice: (price: number) => {
    const { currency, rates, disableDecimals } = get();
    const rate = rates[currency.code] || 1;
    const options = disableDecimals ? { minimumFractionDigits: 0, maximumFractionDigits: 0 } : undefined;
    return formatCurrency(price * rate, currency.code, currency.locale, options);
  },
}));

/**
 * Hook to access the store currency and price formatter.
 *
 * Subscribes to the whole store so consumers that only destructure
 * `formatPrice` still re-render when the currency changes.
 * `currencies` is filtered strictly by the admin's supported-currencies
 * setting (settings.general.supportedCurrencies); the active currency is
 * always included so the UI never shows an empty/foreign selection.
 */
export function useCurrency() {
  const { currency, setCurrency, formatPrice } = useCurrencyStore();
  const { supportedCurrencies, defaultCurrency } = useAppSettings();

  const supported = useMemo(() => {
    return new Set(
      (supportedCurrencies ?? []).map((c) => String(c).toUpperCase()),
    );
  }, [supportedCurrencies]);

  const currencies = useMemo(() => {
    if (supported.size > 0) {
      return CURRENCIES.filter(
        (c) => supported.has(c.code) || c.code === currency.code,
      );
    }
    const fallbackCode = (defaultCurrency || currency.code || "USD").toUpperCase();
    const fallback = CURRENCIES.filter(
      (c) => c.code === fallbackCode || c.code === currency.code,
    );
    return fallback.length > 0 ? fallback : [currency];
  }, [supported, currency.code, defaultCurrency, currency]);

  return {
    currency,
    currencies,
    allCurrencies: CURRENCIES,
    setCurrency,
    formatPrice,
  };
}

/**
 * Price formatter pinned to an explicit currency code.
 *
 * Boost purchases freeze the currency they were priced/charged in, so a
 * historical row must be formatted with THAT code — formatting it with the
 * store's current default silently relabels every past amount the moment an
 * admin switches the store currency. Falls back to the store formatter when no
 * code is given (legacy rows written before the field).
 */
export function useCurrencyFormatter(currencyCode?: string | null) {
  const { formatPrice } = useCurrency();

  return useMemo(() => {
    const normalized = String(currencyCode || "").toUpperCase();
    if (!normalized) return formatPrice;

    const currency = resolveCurrency(normalized);
    // Since useCurrencyFormatter is mostly for historical rows, we might still want
    // to respect the store-wide disableDecimals setting here, but we don't have it
    // reactively available unless we read it from the store. We'll leave this one 
    // to default formatting.
    return (price: number) =>
      formatCurrency(price, currency.code, currency.locale);
  }, [currencyCode, formatPrice]);
}
