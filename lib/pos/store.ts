import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { POSProduct } from "./db";
import { getApplicableRule, calculateDiscountedPrice } from "./pricing-engine";
import type { IPricingRule } from "@/models/pricing-rule.model";

export interface POSCartItem {
  cartItemId: string; // Unique ID for this line item instance
  product: POSProduct;
  variantId?: string;
  quantity: number;
  price: number; // Snapshot of price at time of adding
  discountedPrice?: number; // Price after rules applied
  appliedRuleId?: string;
}

interface POSStoreState {
  cart: POSCartItem[];
  subtotal: number;
  tax: number;
  total: number;
  rules: IPricingRule[];
  setRules: (rules: IPricingRule[]) => void;
  addToCart: (
    product: POSProduct,
    variantId?: string,
    customQuantity?: number,
    customPrice?: number,
  ) => void;
  removeFromCart: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
}

const calculateTotals = (cart: POSCartItem[], rules: IPricingRule[] = []) => {
  let subtotal = 0;
  
  // Create engine-compatible cart
  const engineCart = cart.map(c => ({
    productId: c.product._id,
    categoryId: c.product.category,
    quantity: c.quantity,
    price: c.price,
  }));

  const updatedCart = cart.map(item => {
    const rule = getApplicableRule(
      {
        productId: item.product._id,
        categoryId: item.product.category,
        quantity: item.quantity,
        price: item.price,
      },
      engineCart,
      rules
    );

    let discountedPrice = item.price;
    let appliedRuleId: string | undefined = undefined;
    if (rule) {
      discountedPrice = calculateDiscountedPrice(item.price, rule);
      appliedRuleId = rule._id?.toString();
    }
    
    subtotal += discountedPrice * item.quantity;
    
    return {
      ...item,
      discountedPrice,
      appliedRuleId
    };
  });

  const tax = subtotal * 0.1; // Hardcoded 10% for now, could be dynamic
  return { subtotal, tax, total: subtotal + tax, cart: updatedCart };
};

export const usePOSStore = create<POSStoreState>()(
  persist(
    (set, get) => ({
      cart: [],
      subtotal: 0,
      tax: 0,
      total: 0,
      rules: [],
      setRules: (rules) => {
        set((state) => {
          return { rules, ...calculateTotals(state.cart, rules) };
        });
      },
      addToCart: (product, variantId, customQuantity, customPrice) => {
        set((state) => {
          const qty = customQuantity ?? 1;
          const existingItemIndex = state.cart.findIndex(
            (item) => item.product._id === product._id && item.variantId === variantId && !customPrice
          );
          
          const newCart = [...state.cart];
          
          if (existingItemIndex > -1) {
             newCart[existingItemIndex].quantity += qty;
          } else {
             const price = customPrice !== undefined
               ? customPrice
               : variantId 
                 ? product.variants?.find(v => v.id === variantId)?.price || product.price
                 : product.price;

             newCart.push({
               cartItemId: crypto.randomUUID(),
               product,
               variantId,
               quantity: qty,
               price,
             });
          }

          return calculateTotals(newCart, state.rules);
        });
      },
      removeFromCart: (cartItemId) => {
        set((state) => {
          const newCart = state.cart.filter(item => item.cartItemId !== cartItemId);
          return calculateTotals(newCart, state.rules);
        });
      },
      updateQuantity: (cartItemId, quantity) => {
        set((state) => {
          const newCart = state.cart.map(item => 
            item.cartItemId === cartItemId ? { ...item, quantity: Math.max(1, quantity) } : item
          );
          return calculateTotals(newCart, state.rules);
        });
      },
      clearCart: () => {
        set({ cart: [], subtotal: 0, tax: 0, total: 0 });
      }
    }),
    {
      name: "pos-cart-storage", // stores in localStorage to persist across reloads
    }
  )
);
