import "server-only";

import { cookies } from "next/headers";
import {
  LOCATION_COOKIE,
  parseLocationCookie,
  resolveRequestLocationValues,
  type RequestLocation,
  type ShopperLocation,
} from "@/lib/locations/shopper-location";

/**
 * The location params a storefront listing page should pass to its product
 * grid, as raw strings. The query layer validates and rounds them for cache
 * keys, so request pages never parse them differently from one another.
 */
export type { RequestLocation } from "@/lib/locations/shopper-location";

type SearchParams = Record<string, string | string[] | undefined>;

/**
 * Resolve the shopper's location for a server-rendered listing page. URL
 * values win over the saved preference; a shared URL must never be combined
 * with stale coordinates from the browser cookie.
 */
export async function resolveRequestLocation(
  search: SearchParams,
): Promise<RequestLocation> {
  const stored = parseLocationCookie(
    (await cookies()).get(LOCATION_COOKIE)?.value,
  );
  return resolveRequestLocationValues(search, stored);
}

/**
 * The location the shopper last applied, parsed from its cookie. Listing pages
 * that render their own <LocationPicker> seed it with this so the control
 * paints with the right place instead of flashing "Set location".
 */
export async function readStoredShopperLocation(): Promise<ShopperLocation | null> {
  return parseLocationCookie((await cookies()).get(LOCATION_COOKIE)?.value);
}
