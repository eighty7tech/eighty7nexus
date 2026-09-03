/**
 * The shopper's chosen location, and how it is carried between requests.
 *
 * Three places hold it, each for a different reason:
 *
 * - **URL** (`?lat=&lng=&radius=&city=`) — makes a filtered grid shareable and
 *   is what the product query actually reads.
 * - **localStorage** — remembers the choice across visits.
 * - **cookie** — lets a server component render location-aware HTML on the
 *   first paint. Without it the page would render the whole catalogue and then
 *   visibly re-filter once the client hydrated.
 *
 * The cookie is deliberately not `httpOnly`: the picker reads and writes it on
 * the client, and it holds a city and a coarsened coordinate — nothing that
 * needs protecting from script. See `roundShopperCoordinate` for why coarse.
 */

import {
  DEFAULT_RADIUS_KM,
  isUsableLatLng,
  normalizeRadiusKm,
} from "@/lib/locations/vendor-geo";

/**
 * Decimal places kept on a shopper's own coordinate. Two is a ~1.1 km grid.
 *
 * `lib/locations/vendor-distance.ts` refuses to publish a vendor's exact point
 * because "a `[lng, lat]` pair at seven decimal places is a doorstep". A
 * shopper's point is the same fact about a person who never filled in an
 * address form, and it ends up in far more places than a vendor's ever does: a
 * year-long cookie, localStorage, and — because the grid is shareable by design
 * — the URL, which travels into bookmarks, `Referer` headers, the `callbackUrl`
 * of any login redirect, and analytics as `$current_url`.
 *
 * The smallest radius the filter offers is 5 km, and the server already rounds
 * to this same grid before querying (`cacheGridCoordinate`), so nothing
 * downstream can tell the difference. Coarsening happens at capture and again
 * on every read, so a coordinate stored by an older build, or arriving from
 * somebody else's shared link, is cleaned rather than merely not-worsened.
 */
const SHOPPER_COORDINATE_DECIMALS = 2;

/** Coarsen one half of a shopper's point. Non-finite input passes through. */
export function roundShopperCoordinate(value: number): number {
  if (!Number.isFinite(value)) return value;
  const factor = 10 ** SHOPPER_COORDINATE_DECIMALS;
  return Math.round(value * factor) / factor;
}

/**
 * The single value `?pickup=` carries. Exported so the control that writes it,
 * the query layer that reads it, and the strip rule all name the same token —
 * a mismatch here is invisible: the button looks selected and nothing filters.
 */
export const PICKUP_NEARBY_PARAM = "nearby";

export type ShopperLocation = {
  /** Human-readable place, shown on the pill. Always present when a location is set. */
  label: string;
  lat?: number;
  lng?: number;
  /** Kilometres, or `null` for everywhere. */
  radiusKm: number | null;
  /**
   * True when the point came from the browser's geolocation rather than from
   * picking a city, so the UI can say "Near me" instead of naming a place the
   * shopper never chose.
   */
  precise?: boolean;
};

/**
 * A city name names an area, not a single physical point. Keep city selections
 * point-free so a 5 km radius is never measured from an arbitrary marketplace
 * vendor inside a much larger city.
 */
export function cityShopperLocation(label: string): ShopperLocation | null {
  const city = label.trim();
  if (!city) return null;

  return {
    label: city,
    radiusKm: null,
    precise: false,
  };
}

/** A finite radius and nearest sort require both halves of a real point. */
export function hasLocationCoordinates(lat: unknown, lng: unknown): boolean {
  const coordinate = (value: unknown) => {
    if (typeof value === "number") return value;
    if (typeof value !== "string" || !value.trim()) return NaN;
    return Number(value);
  };

  return isUsableLatLng(coordinate(lat), coordinate(lng));
}

/** Raw location fields a server-rendered listing can forward to a product query. */
export type RequestLocation = {
  lat?: string;
  lng?: string;
  radius?: string;
  city?: string;
  /**
   * The "Pickup near me" facet, carried here rather than as its own prop
   * because it is meaningless without a location and every listing already
   * forwards this object wholesale. Absent means "All" — there is no `all`
   * value to write.
   *
   * Spelled `pickup` in the URL and `pickupNearby` in code: the param is what a
   * shopper sees and shares, the field name is what makes a spread into
   * `getStorefrontProducts` land on the right key without a rename at each site.
   */
  pickupNearby?: string;
};

type RequestLocationSearch = Record<string, string | string[] | undefined>;

const requestValue = (value: string | string[] | undefined) =>
  typeof value === "string" ? value : undefined;

/**
 * Resolve URL and saved location state without reading request cookies itself.
 *
 * A URL with either coordinate half is authoritative: the query validator may
 * discard an incomplete point, but it must not combine it with a different
 * saved location.
 */
export function resolveRequestLocationValues(
  search: RequestLocationSearch,
  stored: ShopperLocation | null,
): RequestLocation {
  const lat = requestValue(search.lat);
  const lng = requestValue(search.lng);
  const city = requestValue(search.city);
  // Read outside the branch below: the facet lives in the URL while the point
  // may come from the cookie, and a shopper who set "Pickup near me" on a
  // remembered location must not have the facet silently dropped.
  const pickupNearby = requestValue(search.pickup);

  if (lat || lng || city) {
    return {
      lat,
      lng,
      radius: requestValue(search.radius),
      city,
      pickupNearby,
    };
  }

  if (!stored) return pickupNearby ? { pickupNearby } : {};

  return {
    lat: stored.lat?.toString(),
    lng: stored.lng?.toString(),
    radius: stored.radiusKm?.toString(),
    city: stored.precise ? undefined : stored.label,
    pickupNearby,
  };
}

/**
 * Distance ordering is deliberately bound to coordinates present in the URL,
 * not a saved location recovered from the cookie. A shared `sortBy=distance`
 * link without a point must therefore use the same recency fallback the
 * storefront query would use for an invalid origin.
 */
export function normalizeRequestSortBy(
  sortBy: string | undefined,
  search: RequestLocationSearch,
): string | undefined {
  return normalizeDistanceSortForLocation(
    sortBy,
    requestValue(search.lat),
    requestValue(search.lng),
  );
}

export const LOCATION_STORAGE_KEY = "eighty7nexus.location";
export const LOCATION_COOKIE = "eighty7nexus_location";

/** A year: the choice is a standing preference, not a session detail. */
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

/**
 * Parse a stored or transmitted location, dropping anything unusable.
 *
 * Deliberately tolerant: this reads a cookie and a localStorage entry that a
 * previous version of the app may have written, and a shopper whose stored
 * location no longer parses should silently fall back to no location rather
 * than see an error.
 */
export function parseShopperLocation(value: unknown): ShopperLocation | null {
  if (!value || typeof value !== "object") return null;

  const raw = value as Partial<ShopperLocation>;
  const label = typeof raw.label === "string" ? raw.label.trim() : "";
  if (!label) return null;

  const hasPoint = isUsableLatLng(raw.lat, raw.lng);

  return {
    label,
    // Coarsened on the way in, so a point written by an older build — or by a
    // shared link the recipient's picker re-persisted — is cleaned rather than
    // carried at full precision for another year.
    lat: hasPoint ? roundShopperCoordinate(raw.lat as number) : undefined,
    lng: hasPoint ? roundShopperCoordinate(raw.lng as number) : undefined,
    // `null` (everywhere) is a real choice and must survive the round trip, so
    // it is only replaced by the default when the field is entirely absent.
    radiusKm:
      raw.radiusKm === null ? null : normalizeRadiusKm(raw.radiusKm) ?? null,
    precise: raw.precise === true && hasPoint,
  };
}

/** Parse the JSON-encoded cookie value. */
export function parseLocationCookie(
  value: string | undefined | null,
): ShopperLocation | null {
  if (!value) return null;

  try {
    return parseShopperLocation(JSON.parse(decodeURIComponent(value)));
  } catch {
    // A cookie written by an older version, or truncated in transit. Treated as
    // "no location" rather than as an error the shopper has to clear by hand.
    return null;
  }
}

/** Serialize for the cookie. */
export function serializeLocationCookie(location: ShopperLocation): string {
  return encodeURIComponent(JSON.stringify(location));
}

/** The `document.cookie` string that persists a location. */
export function locationCookieString(location: ShopperLocation): string {
  return `${LOCATION_COOKIE}=${serializeLocationCookie(
    location,
  )}; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}; samesite=lax`;
}

/** The `document.cookie` string that clears it. */
export function clearLocationCookieString(): string {
  return `${LOCATION_COOKIE}=; path=/; max-age=0; samesite=lax`;
}

/**
 * The query params a location contributes to a storefront URL.
 *
 * Only what is actually set: a location with no coordinates contributes a city
 * alone, and a `null` radius contributes nothing rather than `radius=null`,
 * which would read as a filter that is not there.
 */
export function locationSearchParams(
  location: ShopperLocation | null,
): Record<string, string> {
  if (!location) return {};

  const params: Record<string, string> = {};

  if (hasLocationCoordinates(location.lat, location.lng)) {
    params.lat = String(location.lat);
    params.lng = String(location.lng);
    if (location.radiusKm) params.radius = String(location.radiusKm);
  }

  // Sent alongside the coordinates, not instead of them: it is what reaches
  // vendors in the city whose address never geocoded.
  if (!location.precise) params.city = location.label;

  return params;
}

/** Strip every location param, for "clear location". */
export function stripLocationParams(params: URLSearchParams): void {
  for (const key of ["lat", "lng", "radius", "city"]) {
    params.delete(key);
  }
}

/**
 * `distance` is meaningful only while the next location has a real point.
 * Keep this alongside the URL helpers so every location-changing control
 * applies the same rule before it navigates.
 */
export function stripDistanceSortForLocation(
  params: URLSearchParams,
  location: ShopperLocation | null,
): void {
  if (
    params.get("sortBy") === "distance" &&
    !hasLocationCoordinates(location?.lat, location?.lng)
  ) {
    params.delete("sortBy");
  }
}

/**
 * "Pickup near me" needs a point, exactly as `distance` ordering does.
 *
 * Separate from `stripLocationParams` on purpose. Every location control does
 * strip-then-re-apply, so folding the facet into the strip would silently drop
 * it every time a shopper nudged the radius slider. This drops it only when the
 * *next* location cannot answer it — clearing the location, or switching to a
 * city name, which names an area rather than a point to measure from.
 */
export function stripPickupFacetForLocation(
  params: URLSearchParams,
  location: ShopperLocation | null,
): void {
  if (!hasLocationCoordinates(location?.lat, location?.lng)) {
    params.delete("pickup");
  }
}

/**
 * A manually edited or stale shared URL can request distance ordering without
 * a point. Match the query layer's recency fallback so the visible sort
 * control never points at a hidden option.
 */
export function normalizeDistanceSortForLocation(
  sortBy: string | undefined,
  lat: unknown,
  lng: unknown,
): string | undefined {
  return sortBy === "distance" && !hasLocationCoordinates(lat, lng)
    ? "createdAt"
    : sortBy;
}

/**
 * Read a location back out of a URL, so a shared link sets the picker rather
 * than showing a filtered grid with an empty control.
 */
export function locationFromSearchParams(
  params: URLSearchParams,
): ShopperLocation | null {
  const city = params.get("city")?.trim() || "";
  const rawLat = params.get("lat");
  const rawLng = params.get("lng");
  const hasPoint = hasLocationCoordinates(rawLat, rawLng);
  // Someone else's link may carry their doorstep. It is not re-persisted at
  // that precision on this device.
  const lat = hasPoint ? roundShopperCoordinate(Number(rawLat)) : undefined;
  const lng = hasPoint ? roundShopperCoordinate(Number(rawLng)) : undefined;

  if (!city && !hasPoint) return null;

  return {
    // A shared link with coordinates but no city has no name to show; the pill
    // falls back to the generic label rather than printing raw numbers.
    label: city || "Near me",
    lat,
    lng,
    radiusKm: normalizeRadiusKm(params.get("radius")),
    precise: hasPoint && !city,
  };
}

export { DEFAULT_RADIUS_KM };
