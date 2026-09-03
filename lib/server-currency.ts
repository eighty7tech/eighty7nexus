import "server-only";

import { DEFAULT_CURRENCY } from "@/config/branding.config";
import { resolveCurrency, type Currency } from "@/lib/currencies";
import { formatCurrency } from "@/lib/money";
import { getSettings } from "@/models/settings.model";

/**
 * Store currency for server components and route handlers.
 *
 * The client mirrors `settings.general.defaultCurrency` through
 * `<CurrencyApplier>` into the zustand currency store, but server-rendered
 * surfaces (stats strips, list pages) have no access to that store. Reading the
 * same setting here is what keeps a server-rendered total and the client-rendered
 * row beneath it from disagreeing about the currency. `getSettings` is
 * request-cached, so calling this per stats card costs one settings read.
 */
export async function getStoreCurrency(): Promise<Currency> {
  try {
    const settings = await getSettings();
    return resolveCurrency(
      settings?.general?.defaultCurrency || DEFAULT_CURRENCY,
    );
  } catch {
    // A settings read failure must not blank out an entire page — fall back to
    // the configured default rather than throwing out of a stats strip.
    return resolveCurrency(DEFAULT_CURRENCY);
  }
}

/**
 * Money formatter bound to the store currency.
 *
 * Formatting uses the *currency's* regional locale (BDT → bn-BD) rather than
 * the visitor's UI locale, matching `useCurrency().formatPrice` on the client
 * so the same amount never renders two different ways on one page.
 */
export async function getStoreMoneyFormatter(): Promise<
  (value: number) => string
> {
  const currency = await getStoreCurrency();
  return (value: number) =>
    formatCurrency(value, currency.code, currency.locale);
}
