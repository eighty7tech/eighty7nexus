import { DEFAULT_CURRENCY } from "@/config/branding.config";
import { normalizeCurrencyCode } from "@/lib/currency-codes";

/**
 * Currency display metadata.
 *
 * Lives here — not in `providers/currency-provider` — because server components
 * and route handlers need the same symbol/locale mapping the client store uses.
 * The provider is a `"use client"` module, so importing it from a server file
 * would drag a client boundary into the server graph.
 */
export interface Currency {
  code: string;
  symbol: string;
  name: string;
  locale: string;
}

export const CURRENCIES: Currency[] = [
  { code: "GHS", symbol: "GH₵", name: "Ghanaian Cedi", locale: "en-GH" },
  { code: "USD", symbol: "$", name: "US Dollar", locale: "en-US" },
  { code: "EUR", symbol: "€", name: "Euro", locale: "de-DE" },
  { code: "GBP", symbol: "£", name: "British Pound", locale: "en-GB" },
  { code: "BDT", symbol: "৳", name: "Bangladeshi Taka", locale: "bn-BD" },
  { code: "INR", symbol: "₹", name: "Indian Rupee", locale: "en-IN" },
  { code: "TRY", symbol: "₺", name: "Turkish Lira", locale: "tr-TR" },
  { code: "PKR", symbol: "₨", name: "Pakistani Rupee", locale: "ur-PK" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen", locale: "ja-JP" },
  { code: "CNY", symbol: "¥", name: "Chinese Yuan", locale: "zh-CN" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar", locale: "en-AU" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar", locale: "en-CA" },
  { code: "PEN", symbol: "S/", name: "Peruvian Sol", locale: "es-PE" },
  { code: "SAR", symbol: "﷼", name: "Saudi Riyal", locale: "ar-SA" },
  { code: "AED", symbol: "د.إ", name: "UAE Dirham", locale: "ar-AE" },
  { code: "SGD", symbol: "S$", name: "Singapore Dollar", locale: "en-SG" },
  { code: "MYR", symbol: "RM", name: "Malaysian Ringgit", locale: "ms-MY" },
  { code: "THB", symbol: "฿", name: "Thai Baht", locale: "th-TH" },
  { code: "KRW", symbol: "₩", name: "South Korean Won", locale: "ko-KR" },
  { code: "ZAR", symbol: "R", name: "South African Rand", locale: "en-ZA" },
  { code: "KES", symbol: "KSh", name: "Kenyan Shilling", locale: "en-KE" },
  { code: "UGX", symbol: "USh", name: "Ugandan Shilling", locale: "en-UG" },
  { code: "NGN", symbol: "₦", name: "Nigerian Naira", locale: "en-NG" },
  { code: "DZD", symbol: "د.ج", name: "Algerian Dinar", locale: "ar-DZ" },
  { code: "QAR", symbol: "ر.ق", name: "Qatari Riyal", locale: "ar-QA" },
  { code: "KWD", symbol: "د.ك", name: "Kuwaiti Dinar", locale: "ar-KW" },
  { code: "BHD", symbol: ".د.ب", name: "Bahraini Dinar", locale: "ar-BH" },
  { code: "OMR", symbol: "ر.ع.", name: "Omani Rial", locale: "ar-OM" },
];

/**
 * Metadata for a currency code. Admins may configure any ISO 4217 code, so an
 * unknown code degrades to using the code itself as its own symbol rather than
 * silently falling back to USD — a "$" on a store that never chose dollars is
 * worse than a bare "SEK".
 */
export function resolveCurrency(code: string | null | undefined): Currency {
  const normalized = normalizeCurrencyCode(code);
  const known = CURRENCIES.find((entry) => entry.code === normalized);
  if (known) return known;

  const fallbackCode = normalized || DEFAULT_CURRENCY;
  return {
    code: fallbackCode,
    symbol: fallbackCode,
    name: fallbackCode,
    locale: "en-US",
  };
}

/**
 * The prefix used on money *inputs* (where a formatted string can't be shown).
 * Unknown codes render as the code itself, which is what `resolveCurrency`
 * already provides.
 */
export function currencySymbolOf(code: string | null | undefined): string {
  const currency = resolveCurrency(code);
  return currency.symbol || currency.code;
}
