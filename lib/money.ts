// Currencies with no minor unit — charged in whole units, so an amount must
// never be multiplied by 100. Charging UGX/JPY with a blanket ×100 overcharges
// the payer 100×.
const ZERO_DECIMAL_CURRENCIES = new Set([
  "BIF", "CLP", "DJF", "GNF", "JPY", "KMF", "KRW", "MGA", "PYG", "RWF",
  "UGX", "VND", "VUV", "XAF", "XOF", "XPF",
]);

// Currencies whose smallest unit is 1/1000.
const THREE_DECIMAL_CURRENCIES = new Set([
  "BHD", "IQD", "JOD", "KWD", "LYD", "OMR", "TND",
]);

/**
 * How many digits the currency's smallest unit has. Every gateway adapter
 * builds its charge with this exponent (`toStripeAmount`,
 * `toRazorpayAmountSubunits`, `toPaystackAmountSubunits`) and reports back in
 * the same unit, so anything comparing a stored price against a gateway-
 * reported amount MUST use it too — a hardcoded ×100 disagrees with the actual
 * charge for every non-2-decimal currency.
 */
export function currencyMinorUnitExponent(currency: string): number {
  const normalized = (currency || "USD").trim().toUpperCase();
  if (ZERO_DECIMAL_CURRENCIES.has(normalized)) return 0;
  if (THREE_DECIMAL_CURRENCIES.has(normalized)) return 3;
  return 2;
}

/**
 * Decimal places a *stored* price may use for a currency.
 *
 * Zero-decimal currencies accept whole units only. Three-decimal currencies are
 * deliberately quantised to 2 places rather than 3: Stripe requires their
 * smallest-unit amount to be a multiple of 10, so a third decimal would be
 * rounded away by the gateway and then fail the amount cross-check that guards
 * finalization.
 */
export function currencyPriceScale(currency: string): number {
  return currencyMinorUnitExponent(currency) === 0 ? 0 : 2;
}

/**
 * The smallest price a currency can express — 1 in its minor unit. In a
 * zero-decimal currency that is 1 whole unit, so a "0.50" typed into a form
 * that assumes cents is not a valid price at all.
 */
export function currencyMinimumPrice(currency: string): number {
  return 1 / 10 ** currencyPriceScale(currency);
}

/**
 * Round a price to something the currency can actually represent, so the
 * amount charged and the amount stored can never disagree.
 */
export function quantizeToCurrency(amount: number, currency: string): number {
  const factor = 10 ** currencyPriceScale(currency);
  const value = Number(amount);
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * factor) / factor;
}

/**
 * Compare two major-unit amounts at the currency's own precision. Used on the
 * finalization path, where `expected` is what we asked the gateway to collect
 * and `actual` is what it reports having collected.
 */
export function amountsMatchForCurrency(
  expected: number,
  actual: number,
  currency: string,
): boolean {
  const factor = 10 ** currencyMinorUnitExponent(currency);
  return Math.round(expected * factor) === Math.round(actual * factor);
}

/**
 * Pin a formatting locale to Western digits.
 *
 * Money is formatted with the *currency's* regional locale (BDT → bn-BD,
 * SAR → ar-SA) so the symbol, separators and symbol placement match the
 * currency — but that locale also carries a native numbering system, which
 * would print Bengali (১,২৩৪৳) or Arabic-Indic (١٬٢٣٤) numerals on an English
 * store. The currency is not a language choice, so digits stay Latin.
 */
function withLatinDigits(locale?: string): string | undefined {
  if (!locale) return locale;
  try {
    return new Intl.Locale(locale, { numberingSystem: "latn" }).toString();
  } catch {
    // Structurally invalid tag — Intl.NumberFormat would reject it too, so
    // fall back to the runtime default instead of throwing.
    return undefined;
  }
}

export function formatCurrency(
  amount: number,
  currency: string,
  locale?: string,
  options?: Intl.NumberFormatOptions,
): string {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  const currencyCode = (currency || "USD").toUpperCase();
  const formatLocale = withLatinDigits(locale || (currencyCode === "GHS" ? "en-GH" : undefined));

  try {
    const formatted = new Intl.NumberFormat(formatLocale, {
      style: "currency",
      currency: currencyCode,
      ...options,
    }).format(safeAmount);

    if (currencyCode === "GHS") {
      return formatted.replace(/^GHS\s*/, "GH₵").replace(/\s*GHS$/, " GH₵");
    }
    return formatted;
  } catch {
    const formatted = new Intl.NumberFormat(formatLocale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(safeAmount);
    if (currencyCode === "GHS") {
      return `GH₵${formatted}`;
    }
    return `${formatted} ${currencyCode}`;
  }
}

