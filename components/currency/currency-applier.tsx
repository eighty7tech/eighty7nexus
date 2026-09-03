"use client";

import { useEffect, useState } from "react";
import { useAppSettings } from "@/providers/app-settings-provider";
import { useCurrencyStore } from "@/providers/currency-provider";

function normalizeCurrencyCode(code: string | undefined) {
  return String(code || "USD").toUpperCase();
}

function applyCurrency(code: string) {
  const store = useCurrencyStore.getState();
  if (store.currency.code !== code) {
    store.setCurrency(code);
  }
}

async function fetchExchangeRates() {
  try {
    const res = await fetch("/api/currency/rates");
    if (!res.ok) return;
    const data = await res.json();
    if (data.rates && data.base) {
      useCurrencyStore.getState().setRates(data.base, data.rates);
    }
  } catch (error) {
    console.error("Failed to fetch exchange rates", error);
  }
}

/**
 * Currency Applier
 *
 * Applies the customer's selected currency from localStorage, falling back
 * to the admin-configured default currency (settings.general.defaultCurrency).
 * Also fetches live exchange rates.
 */
export function CurrencyApplier() {
  const { defaultCurrency, disableDecimals, isLoading } = useAppSettings();

  // Seed the store during the first render, before {children} of
  // <AppProviders> mount, so SSR output and the hydration pass both format
  // prices in the configured currency — no USD flash, no hydration mismatch.
  // useState's initializer is the render-phase slot that runs once per mount;
  // no component is subscribed to the store yet, and applyCurrency no-ops
  // when the code already matches, so StrictMode's double invoke is harmless.
  useState(() => {
    if (!isLoading) {
      applyCurrency(normalizeCurrencyCode(defaultCurrency));
      useCurrencyStore.getState().setDisableDecimals(disableDecimals);
    }
    return null;
  });

  useEffect(() => {
    if (isLoading) return;
    
    // Fetch rates on mount
    fetchExchangeRates();

    // Check localStorage for a user-preferred currency
    try {
      const stored = localStorage.getItem("preferredCurrency");
      if (stored) {
        applyCurrency(normalizeCurrencyCode(stored));
        return;
      }
    } catch (e) {
      // Ignore
    }

    applyCurrency(normalizeCurrencyCode(defaultCurrency));
    useCurrencyStore.getState().setDisableDecimals(disableDecimals);
  }, [defaultCurrency, disableDecimals, isLoading]);

  // Sync back to localStorage when user changes currency
  useEffect(() => {
    const unsub = useCurrencyStore.subscribe((state, prevState) => {
      if (state.currency.code !== prevState.currency.code) {
        try {
          localStorage.setItem("preferredCurrency", state.currency.code);
        } catch (e) {
          // Ignore
        }
      }
    });
    return unsub;
  }, []);

  return null;
}
