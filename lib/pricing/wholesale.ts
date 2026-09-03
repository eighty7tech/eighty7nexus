import type { IProduct, ProductVariant, VolumePricingTier, TierPriceOverride } from "@/types";
import type { IWholesaleTier } from "@/models/wholesale-tier.model";
import type { IWholesaleProfile } from "@/models/wholesale-profile.model";

export interface ResolvedWholesalePrice {
  isWholesaleApplied: boolean;
  unitPrice: number;
  originalPrice: number;
  discountPercentage: number;
  savingsPerUnit: number;
  appliedTierName?: string;
  appliedRuleType?: "tier_discount" | "volume_pricing" | "tier_price_override" | "custom_discount";
  moq: number;
  stepQuantity: number;
}

/**
 * Calculates effective unit price for a wholesale buyer given quantity,
 * user tier profile, and product volume/tier pricing configuration.
 */
export function calculateWholesalePrice(params: {
  product: Partial<IProduct>;
  variant?: Partial<ProductVariant>;
  quantity: number;
  wholesaleProfile?: Partial<IWholesaleProfile> | null;
  wholesaleTier?: Partial<IWholesaleTier> | null;
}): ResolvedWholesalePrice {
  const { product, variant, quantity, wholesaleProfile, wholesaleTier } = params;
  
  const basePrice = Number(variant?.price ?? product.price ?? 0);
  const wholesaleSettings = product.wholesale;

  const moq = wholesaleSettings?.enabled ? Math.max(1, wholesaleSettings.moq || 1) : 1;
  const stepQuantity = wholesaleSettings?.enabled ? Math.max(1, wholesaleSettings.stepQuantity || 1) : 1;

  // If buyer has no approved wholesale profile, return standard retail price
  if (!wholesaleProfile || wholesaleProfile.status !== "approved") {
    return {
      isWholesaleApplied: false,
      unitPrice: basePrice,
      originalPrice: basePrice,
      discountPercentage: 0,
      savingsPerUnit: 0,
      moq,
      stepQuantity,
    };
  }

  let effectivePrice = basePrice;
  let appliedRuleType: ResolvedWholesalePrice["appliedRuleType"] = undefined;
  const appliedTierName = wholesaleTier?.name;

  // 1. Check custom discount percentage on profile
  if (
    typeof wholesaleProfile.customDiscountPercentage === "number" &&
    wholesaleProfile.customDiscountPercentage > 0
  ) {
    const discount = (basePrice * wholesaleProfile.customDiscountPercentage) / 100;
    effectivePrice = Math.max(0, basePrice - discount);
    appliedRuleType = "custom_discount";
  }
  // 2. Check product-specific tier price override
  else if (
    wholesaleProfile.tierId &&
    wholesaleSettings?.tierPricing &&
    Array.isArray(wholesaleSettings.tierPricing)
  ) {
    const tierIdStr = String(wholesaleProfile.tierId);
    const tierOverride = wholesaleSettings.tierPricing.find(
      (tp) => String(tp.tierId) === tierIdStr
    );
    if (tierOverride && typeof tierOverride.price === "number") {
      effectivePrice = tierOverride.price;
      appliedRuleType = "tier_price_override";
    }
  }

  // 3. Check volume pricing tables on product if rule not overridden or if volume pricing is better
  if (
    wholesaleSettings?.volumePricing &&
    Array.isArray(wholesaleSettings.volumePricing) &&
    wholesaleSettings.volumePricing.length > 0
  ) {
    // Find matching volume tier
    const matchingTier = wholesaleSettings.volumePricing.find((vp) => {
      if (quantity < vp.minQuantity) return false;
      if (vp.maxQuantity && quantity > vp.maxQuantity) return false;
      return true;
    });

    if (matchingTier) {
      let volumePrice = basePrice;
      if (matchingTier.discountType === "fixed_price") {
        volumePrice = matchingTier.value;
      } else if (matchingTier.discountType === "percentage_off") {
        volumePrice = Math.max(0, basePrice - (basePrice * matchingTier.value) / 100);
      }

      if (volumePrice < effectivePrice || !appliedRuleType) {
        effectivePrice = volumePrice;
        appliedRuleType = "volume_pricing";
      }
    }
  }

  // 4. Fallback to default tier discount if no specific rule matched yet
  if (
    !appliedRuleType &&
    wholesaleTier &&
    typeof wholesaleTier.defaultDiscountPercentage === "number" &&
    wholesaleTier.defaultDiscountPercentage > 0
  ) {
    const discount = (basePrice * wholesaleTier.defaultDiscountPercentage) / 100;
    effectivePrice = Math.max(0, basePrice - discount);
    appliedRuleType = "tier_discount";
  }

  const savingsPerUnit = Math.max(0, basePrice - effectivePrice);
  const discountPercentage = basePrice > 0 ? Math.round((savingsPerUnit / basePrice) * 100) : 0;

  return {
    isWholesaleApplied: effectivePrice < basePrice,
    unitPrice: effectivePrice,
    originalPrice: basePrice,
    discountPercentage,
    savingsPerUnit,
    appliedTierName,
    appliedRuleType,
    moq,
    stepQuantity,
  };
}
