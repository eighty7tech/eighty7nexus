"use client";

import { createContext, useContext, type ReactNode } from "react";
import {
  DEFAULT_PRODUCT_CARD_CONFIG,
  type ProductCardConfig,
} from "@/lib/products/product-card-config";

/**
 * Delivers the store-wide product card configuration to every card without
 * threading a prop through a dozen grid/carousel call sites. Mounted once in
 * the storefront layout with the server-normalized config; anything rendered
 * outside it (admin previews, tests) falls back to the shipped default.
 */
const ProductCardConfigContext = createContext<ProductCardConfig>(
  DEFAULT_PRODUCT_CARD_CONFIG,
);

export function ProductCardConfigProvider({
  config,
  children,
}: {
  config: ProductCardConfig;
  children: ReactNode;
}) {
  return (
    <ProductCardConfigContext.Provider value={config}>
      {children}
    </ProductCardConfigContext.Provider>
  );
}

export function useProductCardConfig(): ProductCardConfig {
  return useContext(ProductCardConfigContext);
}
