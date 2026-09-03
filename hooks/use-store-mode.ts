import { create } from "zustand";

export type StoreMode = "retail" | "wholesale";

interface StoreModeState {
  mode: StoreMode;
  branchId: string | null;
  setMode: (mode: StoreMode) => void;
  setBranch: (branchId: string | null) => void;
  initFromCookies: () => void;
}

export const useStoreMode = create<StoreModeState>((set) => ({
  mode: "retail",
  branchId: null,

  setMode: (mode) => {
    // Set document cookie so SSR can read it on next page load
    if (typeof document !== "undefined") {
      document.cookie = `storeMode=${mode}; path=/; max-age=31536000; SameSite=Lax`;
    }
    set({ mode });
  },

  setBranch: (branchId) => {
    // Set document cookie
    if (typeof document !== "undefined") {
      if (branchId) {
        document.cookie = `branchId=${branchId}; path=/; max-age=31536000; SameSite=Lax`;
      } else {
        document.cookie = `branchId=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
      }
    }
    set({ branchId });
  },

  initFromCookies: () => {
    if (typeof document === "undefined") return;
    
    const cookies = document.cookie.split("; ");
    const modeCookie = cookies.find((c) => c.startsWith("storeMode="));
    const branchCookie = cookies.find((c) => c.startsWith("branchId="));

    if (modeCookie) {
      const mode = modeCookie.split("=")[1] as StoreMode;
      if (mode === "retail" || mode === "wholesale") {
        set({ mode });
      }
    }

    if (branchCookie) {
      const branchId = branchCookie.split("=")[1];
      if (branchId) {
        set({ branchId });
      }
    }
  },
}));
