import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getSettings } from "@/models/settings.model";

export async function GET(request: Request) {
  try {
    await connectDB();
    const settings = await getSettings();
    const defaultCurrency = settings?.general?.defaultCurrency || "USD";
    const provider = settings?.general?.exchangeRateProvider || "open.er-api.com";
    const apiKey = settings?.general?.exchangeRateApiKey || "";

    let apiUrl = `https://open.er-api.com/v6/latest/${defaultCurrency}`;
    
    if (provider === "exchangerate-api.com" && apiKey) {
      apiUrl = `https://v6.exchangerate-api.com/v6/${apiKey}/latest/${defaultCurrency}`;
    }

    // Cache the fetch request for 12 hours to avoid rate limits
    const res = await fetch(apiUrl, { next: { revalidate: 43200 } });
    
    if (!res.ok) {
      throw new Error(`Failed to fetch rates: ${res.statusText}`);
    }

    const data = await res.json();
    return NextResponse.json({
      base: defaultCurrency,
      rates: data.rates || data.conversion_rates || {},
    });
  } catch (error) {
    console.error("Exchange rate fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch exchange rates" }, { status: 500 });
  }
}
