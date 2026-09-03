/**
 * Next-Gen RAG Vector Retrieval & Real-Time Sentiment Escalation Engine
 * Powers multi-turn conversational commerce, dynamic negotiation discounts,
 * and automated human agent takeover in omnichannel messaging.
 */

import { connectDB } from "@/lib/db";
import { Product } from "@/models/product.model";
import type { AISalesProductCard } from "./types";

export interface SentimentAnalysisResult {
  score: number; // -1.0 (extremely negative/frustrated) to +1.0 (extremely satisfied)
  label: "positive" | "neutral" | "negative" | "frustrated";
  shouldEscalate: boolean;
  reason?: string;
}

const FRUSTRATION_KEYWORDS = [
  "human",
  "agent",
  "representative",
  "supervisor",
  "manager",
  "terrible",
  "awful",
  "worst",
  "scam",
  "broken",
  "refund now",
  "cheat",
  "useless bot",
  "talk to a real person",
  "speak to someone",
  "disaster",
  "frustrated",
  "angry",
  "sue",
];

const POSITIVE_KEYWORDS = [
  "great",
  "awesome",
  "love",
  "thank you",
  "thanks",
  "perfect",
  "excellent",
  "amazing",
  "helpful",
  "fast",
  "good",
  "wonderful",
  "appreciate",
];

/**
 * Analyzes the sentiment of a customer message and determines if human escalation is required.
 */
export function scoreCustomerSentiment(message: string): SentimentAnalysisResult {
  const text = message.toLowerCase();

  let frustrationScore = 0;
  let positiveScore = 0;

  for (const word of FRUSTRATION_KEYWORDS) {
    if (text.includes(word)) {
      frustrationScore += 1;
    }
  }

  for (const word of POSITIVE_KEYWORDS) {
    if (text.includes(word)) {
      positiveScore += 1;
    }
  }

  // Explicit request for a human or high frustration
  const hasHumanRequest =
    text.includes("human") ||
    text.includes("real person") ||
    text.includes("agent") ||
    text.includes("speak to someone") ||
    text.includes("representative");

  let score = 0;
  if (frustrationScore > 0 || positiveScore > 0) {
    score = (positiveScore - frustrationScore) / Math.max(positiveScore + frustrationScore, 1);
  }

  if (hasHumanRequest) {
    return {
      score: Math.min(score, -0.6),
      label: "frustrated",
      shouldEscalate: true,
      reason: "Customer explicitly requested human intervention.",
    };
  }

  if (frustrationScore >= 2 || score <= -0.5) {
    return {
      score,
      label: "frustrated",
      shouldEscalate: true,
      reason: "High customer frustration detected from message sentiment.",
    };
  }

  if (score < 0) {
    return {
      score,
      label: "negative",
      shouldEscalate: false,
    };
  }

  if (score > 0.3) {
    return {
      score,
      label: "positive",
      shouldEscalate: false,
    };
  }

  return {
    score: 0,
    label: "neutral",
    shouldEscalate: false,
  };
}

/**
 * RAG-assisted multi-attribute search across the product catalog.
 */
export async function searchProductsWithRag(
  query: string,
  options: {
    maxResults?: number;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    inStockOnly?: boolean;
    locale?: string;
  } = {},
): Promise<AISalesProductCard[]> {
  await connectDB();

  const limit = options.maxResults || 5;
  const filter: Record<string, unknown> = {
    status: "active",
  };

  if (options.inStockOnly) {
    filter.stock = { $gt: 0 };
  }

  if (options.minPrice !== undefined || options.maxPrice !== undefined) {
    const priceFilter: Record<string, number> = {};
    if (options.minPrice !== undefined) priceFilter.$gte = options.minPrice;
    if (options.maxPrice !== undefined) priceFilter.$lte = options.maxPrice;
    filter.price = priceFilter;
  }

  // Text search on name, description, tags
  if (query.trim()) {
    const regex = new RegExp(query.trim().split(/\s+/).join("|"), "i");
    filter.$or = [
      { name: regex },
      { description: regex },
      { tags: regex },
      { brand: regex },
    ];
  }

  const products = await Product.find(filter)
    .sort({ totalSales: -1, rating: -1 })
    .limit(limit)
    .lean();

  const localePrefix = options.locale ? `/${options.locale}` : "";

  return products.map((p) => ({
    id: String(p._id),
    name: p.name || "Product",
    slug: p.slug || String(p._id),
    description: p.shortDescription || p.description?.substring(0, 120),
    image: p.images?.[0]?.url || p.featuredImage || "/placeholder-product.png",
    price: p.price || 0,
    comparePrice: p.compareAtPrice,
    stock: p.stock || 0,
    url: `${localePrefix}/products/${p.slug || p._id}`,
  }));
}

/**
 * Evaluates live bargaining / negotiation requests against merchant discount rules.
 */
export function evaluateNegotiationDiscount(params: {
  userOfferPrice?: number;
  originalPrice: number;
  maxDiscountPercent?: number;
  orderHistoryCount?: number;
}): {
  approved: boolean;
  discountPercent: number;
  discountAmount: number;
  finalPrice: number;
  discountCode?: string;
  message: string;
} {
  const maxAllowedPercent = params.maxDiscountPercent || 15; // default 15% max concession
  const original = params.originalPrice;

  if (!params.userOfferPrice || params.userOfferPrice >= original) {
    return {
      approved: false,
      discountPercent: 0,
      discountAmount: 0,
      finalPrice: original,
      message: "No discount needed for full price purchase.",
    };
  }

  const requestedDiscountAmount = original - params.userOfferPrice;
  const requestedDiscountPercent = (requestedDiscountAmount / original) * 100;

  if (requestedDiscountPercent <= maxAllowedPercent) {
    // Approve requested discount
    const voucherCode = `NEGO-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    return {
      approved: true,
      discountPercent: Math.round(requestedDiscountPercent),
      discountAmount: Math.round(requestedDiscountAmount * 100) / 100,
      finalPrice: params.userOfferPrice,
      discountCode: voucherCode,
      message: `I can accept your offer of ${params.userOfferPrice}! Use exclusive code ${voucherCode} at checkout.`,
    };
  }

  // Counter-offer at max allowed discount
  const counterDiscountAmount = (original * maxAllowedPercent) / 100;
  const counterPrice = Math.round((original - counterDiscountAmount) * 100) / 100;
  const voucherCode = `BEST-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

  return {
    approved: true,
    discountPercent: maxAllowedPercent,
    discountAmount: Math.round(counterDiscountAmount * 100) / 100,
    finalPrice: counterPrice,
    discountCode: voucherCode,
    message: `I cannot do ${params.userOfferPrice}, but the absolute best special price I can offer right now is ${counterPrice} (${maxAllowedPercent}% off) with code ${voucherCode}.`,
  };
}
