/**
 * Ghana Address Utility Functions
 */

import { IGhanaRegion } from "@/types";

export interface GhanaAddressFormatOptions {
  includeDigitalAddress?: boolean;
  includeLandmark?: boolean;
}

/**
 * Format a Ghana address object into a standard string
 */
export function formatGhanaAddress(
  address: {
    building?: string;
    street?: string;
    town: string;
    district: string;
    region: string;
    digitalAddress?: string;
    landmark?: string;
  },
  options: GhanaAddressFormatOptions = { includeDigitalAddress: true, includeLandmark: false }
): string {
  const parts = [];

  if (address.building) parts.push(address.building);
  if (address.street) parts.push(address.street);
  parts.push(address.town);
  parts.push(address.district);
  parts.push(address.region);
  
  if (options.includeDigitalAddress && address.digitalAddress) {
    parts.push(`(GPS: ${address.digitalAddress})`);
  }
  
  if (options.includeLandmark && address.landmark) {
    parts.push(`Near ${address.landmark}`);
  }

  return parts.filter(Boolean).join(", ");
}

/**
 * Compare two addresses to see if they are identical (for checkout state updates)
 */
export function areAddressesEqual(addr1: any, addr2: any): boolean {
  if (!addr1 || !addr2) return false;
  return JSON.stringify(addr1) === JSON.stringify(addr2);
}

/**
 * Basic reverse geocoding integration interface
 * (Placeholder to be implemented with Google Maps API during Phase 8)
 */
export async function reverseGeocodeGhanaAddress(
  lat: number,
  lng: number
): Promise<Partial<any>> {
  // TODO: Integrate Google Maps Reverse Geocoding API
  // Constrain results to bounds of Ghana and map address components to region/district
  console.warn("Reverse geocoding not yet implemented for:", lat, lng);
  return {};
}
