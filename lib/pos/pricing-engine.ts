import type { IPricingRule, IPricingRuleCondition } from "@/models/pricing-rule.model";

export type CartItem = {
  productId: string;
  categoryId?: string;
  quantity: number;
  price: number;
};

/**
 * Evaluates whether a cart item matches a pricing rule condition.
 */
function evaluateCondition(
  condition: IPricingRuleCondition,
  item: CartItem,
  cartItems: CartItem[]
): boolean {
  switch (condition.type) {
    case "inventory_level":
      // Needs actual stock context, so we bypass strict evaluation here and assume true 
      // if it passed server-side matching, or we pass stock level into the engine later.
      // For now, if evaluating purely client-side without stock, we return true to not block.
      return true;

    case "time_range":
      if (condition.startTime && condition.endTime) {
        const now = new Date();
        const currentTimeStr = `${now.getHours().toString().padStart(2, "0")}:${now
          .getMinutes()
          .toString()
          .padStart(2, "0")}`;
        
        if (currentTimeStr < condition.startTime || currentTimeStr > condition.endTime) {
          return false;
        }
      }
      
      if (condition.daysOfWeek && condition.daysOfWeek.length > 0) {
        const currentDay = new Date().getDay();
        if (!condition.daysOfWeek.includes(currentDay)) {
          return false;
        }
      }
      return true;

    case "customer_segment":
      // Requires customer context. Handled outside if possible.
      return true;

    case "bundle":
      if (condition.requiredProductIds && condition.requiredProductIds.length > 0) {
        const hasAllRequired = condition.requiredProductIds.every((id) =>
          cartItems.some((ci) => ci.productId === id)
        );
        if (!hasAllRequired) return false;
      }
      
      if (condition.minQuantity && condition.minQuantity > 0) {
        const totalQty = cartItems
          .filter((ci) => ci.productId === item.productId)
          .reduce((sum, ci) => sum + ci.quantity, 0);
          
        if (totalQty < condition.minQuantity) return false;
      }
      
      return true;

    default:
      return true;
  }
}

/**
 * Returns the highest priority applicable rule for a given cart item.
 */
export function getApplicableRule(
  item: CartItem,
  cartItems: CartItem[],
  rules: IPricingRule[]
): IPricingRule | null {
  const applicableRules = rules.filter((rule) => {
    if (!rule.isActive) return false;
    
    // Check product/category applicability
    const appliesToProduct =
      !rule.applicableProductIds?.length || rule.applicableProductIds.includes(item.productId);
      
    const appliesToCategory =
      !rule.applicableCategoryIds?.length ||
      (item.categoryId && rule.applicableCategoryIds.includes(item.categoryId));
      
    if (!appliesToProduct && !appliesToCategory) return false;

    // Check time-based applicability globally
    const now = new Date();
    if (rule.startDate && new Date(rule.startDate) > now) return false;
    if (rule.endDate && new Date(rule.endDate) < now) return false;

    // Check all conditions
    if (rule.conditions && rule.conditions.length > 0) {
      const allConditionsMet = rule.conditions.every((cond) =>
        evaluateCondition(cond, item, cartItems)
      );
      if (!allConditionsMet) return false;
    }

    return true;
  });

  if (applicableRules.length === 0) return null;

  // Sort by priority descending
  applicableRules.sort((a, b) => b.priority - a.priority);
  return applicableRules[0];
}

/**
 * Calculates the discounted price for an item based on the applied rule.
 */
export function calculateDiscountedPrice(price: number, rule: IPricingRule): number {
  if (rule.discountType === "percentage") {
    return Math.max(0, price * (1 - rule.discountValue / 100));
  } else if (rule.discountType === "fixed_amount") {
    return Math.max(0, price - rule.discountValue);
  }
  return price;
}
