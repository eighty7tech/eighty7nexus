import type { IGhanaDeliveryMethod } from "@/types";
import { GHANA_REGIONS_STATIC } from "@/lib/data/ghana-locations";

/**
 * Built-in default delivery methods for Ghana shoppers when store settings
 * have not yet defined custom methods.
 */
export const DEFAULT_GHANA_DELIVERY_METHODS: IGhanaDeliveryMethod[] = [
  {
    id: "gh-express-courier",
    name: "Express Dispatch (Accra & Kumasi Metro)",
    basePrice: 35,
    minDays: 1,
    maxDays: 2,
    active: true,
    coverageRegions: ["Greater Accra", "Ashanti"],
    description: "Door-to-door expedited motorbike & courier dispatch.",
  },
  {
    id: "gh-standard-regional",
    name: "Standard Nationwide Regional Delivery",
    basePrice: 20,
    minDays: 2,
    maxDays: 4,
    active: true,
    coverageRegions: [], // nationwide
    description: "Reliable nationwide courier service across all 16 regions.",
  },
  {
    id: "gh-vip-same-day",
    name: "VIP Same-Day Delivery (Greater Accra)",
    basePrice: 50,
    minDays: 1,
    maxDays: 1,
    active: true,
    coverageRegions: ["Greater Accra"],
    description: "Priority expedited delivery directly to your doorstep.",
  },
];

/**
 * Filters the list of all configured Ghana delivery methods to return
 * only the ones that are active and cover the specified region code.
 *
 * @param methods - The full list of delivery methods configured in settings
 * @param regionCode - The region code or name of the customer's delivery address
 * @returns Array of delivery methods available for that region
 */
export function getAvailableGhanaDeliveryMethods(
  methods: IGhanaDeliveryMethod[] | undefined,
  regionCode: string
): IGhanaDeliveryMethod[] {
  const activeMethods =
    methods && methods.length > 0 ? methods : DEFAULT_GHANA_DELIVERY_METHODS;

  const normalizedRegion = (regionCode || "").trim().toLowerCase();
  const regionObj = GHANA_REGIONS_STATIC.find(
    (r) =>
      r.code.toLowerCase() === normalizedRegion ||
      r.name.toLowerCase() === normalizedRegion
  );
  const regionName = regionObj ? regionObj.name.toLowerCase() : normalizedRegion;

  return activeMethods.filter((method) => {
    if (!method.active) return false;

    // If coverageRegions is empty or undefined, it implies nationwide coverage.
    if (!method.coverageRegions || method.coverageRegions.length === 0) {
      return true;
    }

    // If region not yet specified, show all active methods so the user sees available rates
    if (!normalizedRegion) {
      return true;
    }

    // Check if the specific regionCode or regionName is within the method's coverage list.
    return method.coverageRegions.some((coverage) => {
      const normalizedCoverage = coverage.toLowerCase();
      return (
        normalizedCoverage === normalizedRegion ||
        normalizedCoverage.includes(regionName) ||
        regionName.includes(normalizedCoverage)
      );
    });
  });
}
