import { create } from "zustand";
import { persist } from "zustand/middleware";
import { IDeliveryMethod, IPickupStation } from "@/types";

export type CheckoutCountry = "Ghana" | "International";

export interface CheckoutState {
  country: CheckoutCountry;
  
  // Ghana-specific address fields
  ghanaAddress: {
    fullName: string;
    phone: string;
    region: string;
    district: string;
    town: string;
    street: string;
    building: string;
    digitalAddress: string;
    landmark: string;
  };
  
  // International address fields
  internationalAddress: {
    fullName: string;
    street: string;
    apartment: string;
    city: string;
    state: string;
    postalCode: string;
    countryCode: string;
    phone: string;
  };

  deliveryMethod: IDeliveryMethod | null;
  pickupStation: IPickupStation | null;
  
  // Actions
  setCountry: (country: CheckoutCountry) => void;
  updateGhanaAddress: (address: Partial<CheckoutState["ghanaAddress"]>) => void;
  updateInternationalAddress: (address: Partial<CheckoutState["internationalAddress"]>) => void;
  setDeliveryMethod: (method: IDeliveryMethod | null) => void;
  setPickupStation: (station: IPickupStation | null) => void;
  resetCheckout: () => void;
}

const initialState = {
  country: "Ghana" as CheckoutCountry,
  ghanaAddress: {
    fullName: "",
    phone: "",
    region: "",
    district: "",
    town: "",
    street: "",
    building: "",
    digitalAddress: "",
    landmark: "",
  },
  internationalAddress: {
    fullName: "",
    street: "",
    apartment: "",
    city: "",
    state: "",
    postalCode: "",
    countryCode: "",
    phone: "",
  },
  deliveryMethod: null,
  pickupStation: null,
};

export const useCheckoutStore = create<CheckoutState>()(
  persist(
    (set) => ({
      ...initialState,
      setCountry: (country) =>
        set((state) => ({
          country,
          // Reset delivery method when switching countries since availability changes
          deliveryMethod: null,
          pickupStation: null,
        })),
      updateGhanaAddress: (updates) =>
        set((state) => ({
          ghanaAddress: { ...state.ghanaAddress, ...updates },
        })),
      updateInternationalAddress: (updates) =>
        set((state) => ({
          internationalAddress: { ...state.internationalAddress, ...updates },
        })),
      setDeliveryMethod: (deliveryMethod) => set({ deliveryMethod }),
      setPickupStation: (pickupStation) => set({ pickupStation }),
      resetCheckout: () => set(initialState),
    }),
    {
      name: "checkout-storage",
    }
  )
);
