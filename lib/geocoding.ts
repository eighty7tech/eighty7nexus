/**
 * Forward geocoding for vendor addresses.
 *
 * The storefront's Directions button used to hand Google Maps the address as a
 * text query, which is a *search*: "Seattle 4214, Washington" lands on whatever
 * Google thinks is closest, and for anything but a well-known business that is
 * routinely the wrong block or the wrong city entirely. Resolving the address
 * to coordinates once, at save time, makes the pin exact — the deep link then
 * carries lat/lng instead of a phrase to guess at.
 *
 * Uses Nominatim (OpenStreetMap): no API key, no per-request billing. Its usage
 * policy requires an identifying User-Agent and at most one request per second,
 * both of which this module honours — geocoding only ever runs on an explicit
 * vendor save, never in a loop or on page render.
 */

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

/** Nominatim's policy asks for a real contact; the app URL is the honest one. */
const USER_AGENT = `Eighty7Nexus/1.0 (${
  process.env.NEXT_PUBLIC_APP_URL || "https://eighty7nexus.app"
})`;

/**
 * Nominatim asks for =<1 req/sec. A vendor save is a single lookup, so the only
 * way to breach that is two vendors saving in the same second — the gap below
 * serialises those without needing a queue.
 */
const MIN_REQUEST_GAP_MS = 1100;
let lastRequestAt = 0;

/** Beyond this the address is almost certainly unreachable, not just slow. */
const REQUEST_TIMEOUT_MS = 5000;

export interface GeoCoordinates {
  lat: number;
  lng: number;
  /**
   * What the geocoder actually matched, kept so a vendor can see whether it
   * understood their address and so support can debug a wrong pin without
   * re-running the lookup.
   */
  formatted?: string;
  /** ISO timestamp of the lookup, used to decide when a re-geocode is due. */
  geocodedAt?: string;
}

export interface GeocodeAddressInput {
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

/** The address parts, in the order a geocoder reads them best. */
function addressParts(address: GeocodeAddressInput): string[] {
  return [
    address.street,
    address.city,
    address.state,
    address.postalCode,
    address.country,
  ]
    .map((part) => (typeof part === "string" ? part.trim() : ""))
    .filter(Boolean);
}

/**
 * The single string identifying this address. Callers compare it across saves:
 * when it is unchanged there is nothing to re-geocode, which is what keeps an
 * unrelated edit (a phone number, a description) from spending a network round
 * trip and from disturbing coordinates that are already correct.
 */
export function addressGeocodeKey(address: GeocodeAddressInput): string {
  return addressParts(address).join(", ").toLowerCase();
}

function isUsableCoordinate(lat: unknown, lng: unknown): boolean {
  return (
    typeof lat === "number" &&
    typeof lng === "number" &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180 &&
    // 0,0 is in the Atlantic. It is what a failed parse produces far more often
    // than it is a real vendor location, so it is treated as no answer.
    !(lat === 0 && lng === 0)
  );
}

/**
 * Resolve an address to coordinates, or `null` when it cannot be resolved.
 *
 * Never throws: geocoding is an enhancement to the Directions button, so a
 * network failure or an unrecognised address must leave the vendor's save
 * succeeding with the address stored exactly as typed. The caller keeps any
 * previously-known coordinates in that case rather than clearing them.
 */
export async function geocodeAddress(
  address: GeocodeAddressInput,
): Promise<GeoCoordinates | null> {
  // Nominatim AND-s every term in the query, so one part it cannot match sinks
  // the whole lookup — a non-standard state abbreviation ("DHK" for Dhaka) or a
  // house number it has never seen returns nothing at all, even when the rest
  // of the address is unambiguous. Each attempt drops the part most likely to
  // be the blocker, so a good address degrades to a coarser pin instead of to
  // no pin. Ordered most- to least-precise; the first hit wins.
  for (const attempt of geocodeAttempts(address)) {
    const parts = addressParts(attempt);
    // A country on its own resolves to the centroid of a nation — technically a
    // coordinate, useless as a pin. Two parts is the floor for a real place.
    if (parts.length < 2) continue;

    const resolved = await lookup(parts.join(", "));
    if (resolved) return resolved;
  }

  return null;
}

/**
 * Progressively coarser versions of an address, each dropping the part most
 * likely to be unmatchable. Duplicates are filtered by the caller's key so a
 * missing field never costs a redundant network round trip.
 */
function geocodeAttempts(
  address: GeocodeAddressInput,
): GeocodeAddressInput[] {
  const attempts: GeocodeAddressInput[] = [
    address,
    // State is the usual offender: vendors type codes ("DHK", "AK") that
    // Nominatim treats as literal text rather than as a region.
    { ...address, state: undefined },
    // Then the postal code, which is wrong or absent often enough to matter.
    { ...address, state: undefined, postalCode: undefined },
    // Then the street, which fails for new developments and informal addresses.
    { ...address, state: undefined, postalCode: undefined, street: undefined },
  ];

  const seen = new Set<string>();
  return attempts.filter((attempt) => {
    const key = addressGeocodeKey(attempt);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** One rate-limited Nominatim call. Never throws; `null` means no answer. */
async function lookup(query: string): Promise<GeoCoordinates | null> {
  const wait = MIN_REQUEST_GAP_MS - (Date.now() - lastRequestAt);
  if (wait > 0) {
    await new Promise((resolve) => setTimeout(resolve, wait));
  }
  lastRequestAt = Date.now();

  const url = `${NOMINATIM_URL}?${new URLSearchParams({
    q: query,
    format: "json",
    limit: "1",
    addressdetails: "0",
  })}`;

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      cache: "no-store",
    });

    if (!response.ok) return null;

    const results = (await response.json()) as Array<{
      lat?: string;
      lon?: string;
      display_name?: string;
    }>;

    const match = Array.isArray(results) ? results[0] : undefined;
    if (!match) return null;

    const lat = Number.parseFloat(match.lat ?? "");
    const lng = Number.parseFloat(match.lon ?? "");
    if (!isUsableCoordinate(lat, lng)) return null;

    return {
      lat,
      lng,
      formatted:
        typeof match.display_name === "string" ? match.display_name : undefined,
      geocodedAt: new Date().toISOString(),
    };
  } catch {
    // Timeout, DNS failure, malformed JSON — all mean "no coordinates today".
    return null;
  }
}

/**
 * Normalize stored coordinates read back from the database, dropping anything
 * that is not a usable point. Documents written before this field existed, or
 * by an older client, come back as undefined rather than as a bad pin.
 */
export function resolveCoordinates(value: unknown): GeoCoordinates | undefined {
  if (!value || typeof value !== "object") return undefined;
  const raw = value as Partial<GeoCoordinates>;
  if (!isUsableCoordinate(raw.lat, raw.lng)) return undefined;

  return {
    lat: raw.lat as number,
    lng: raw.lng as number,
    formatted:
      typeof raw.formatted === "string" && raw.formatted.trim()
        ? raw.formatted.trim()
        : undefined,
    geocodedAt:
      typeof raw.geocodedAt === "string" && raw.geocodedAt.trim()
        ? raw.geocodedAt
        : undefined,
  };
}
