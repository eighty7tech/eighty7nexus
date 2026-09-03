"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Clock, Crosshair, Loader2, MapPin, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import {
  EVERYWHERE_RADIUS_INDEX,
  RADIUS_STEPS_KM,
  radiusFromIndex,
} from "@/lib/locations/vendor-geo";
import {
  clearRecentLocations,
  readRecentLocations,
  rememberRecentLocation,
} from "@/lib/locations/recent-locations";
import {
  DEFAULT_RADIUS_KM,
  LOCATION_COOKIE,
  LOCATION_STORAGE_KEY,
  type ShopperLocation,
  clearLocationCookieString,
  cityShopperLocation,
  hasLocationCoordinates,
  locationCookieString,
  locationFromSearchParams,
  locationSearchParams,
  parseLocationCookie,
  parseShopperLocation,
  stripDistanceSortForLocation,
  stripPickupFacetForLocation,
  stripLocationParams,
  roundShopperCoordinate,
} from "@/lib/locations/shopper-location";

type MarketplaceCity = {
  city: string;
  /** Disambiguates same-named places. Absent when the vendors there set none. */
  country?: string;
  vendorCount: number;
};

/**
 * How long typing has to settle before the marketplace is re-queried.
 *
 * Long enough that a word typed at speed is one request, short enough that the
 * list still feels like it is keeping up with the caret.
 */
const SEARCH_DEBOUNCE_MS = 250;

export interface LocationPickerProps {
  /**
   * Location resolved on the server from the cookie, so the pill renders with
   * the right place on the first paint instead of flashing "Set location".
   */
  initialLocation?: ShopperLocation | null;
  className?: string;
}

const EVERYWHERE_INDEX = EVERYWHERE_RADIUS_INDEX;

/**
 * How many cities the list shows before it collapses behind "show more".
 *
 * The API returns every city with an active vendor, ordered by vendor count. On
 * a marketplace with hundreds of them an uncapped list is a scroll well with no
 * bottom, and the shopper's own city is as likely to be at row 90 as row 3. Eight
 * fills the popover without spilling, and search — not scrolling — is the way
 * out of the top eight.
 */
const COLLAPSED_CITY_COUNT = 8;

/**
 * Unlike the shared helper, an unrecognised radius here falls back to the
 * default step rather than to everywhere: this seeds a *draft* slider that the
 * shopper is about to Apply, and parking that draft on "everywhere" would turn
 * one stray Apply into a catalogue-wide search they never asked for.
 */
function indexFromRadius(radiusKm: number | null): number {
  if (radiusKm === null) return EVERYWHERE_INDEX;
  const found = RADIUS_STEPS_KM.indexOf(
    radiusKm as (typeof RADIUS_STEPS_KM)[number],
  );
  return found === -1 ? RADIUS_STEPS_KM.indexOf(DEFAULT_RADIUS_KM) : found;
}

/**
 * Seed the draft slider from a location, or from the default when there is no
 * location yet.
 *
 * The distinction matters because `radiusKm: null` is "everywhere" — a choice
 * the shopper made and that `parseShopperLocation` deliberately round-trips —
 * not an absent value. Coalescing it to the default (`location?.radiusKm ??
 * DEFAULT_RADIUS_KM`) reads it as absent, so re-opening the popover showed 40 km
 * over an everywhere search and the next Apply silently narrowed the catalogue
 * to a radius the shopper never picked.
 */
function draftIndexForLocation(location: ShopperLocation | null): number {
  return indexFromRadius(location ? location.radiusKm : DEFAULT_RADIUS_KM);
}

function browserLocationCookie(): string | undefined {
  const prefix = `${LOCATION_COOKIE}=`;
  return document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith(prefix))
    ?.slice(prefix.length);
}

export function LocationPicker({
  initialLocation = null,
  className,
}: LocationPickerProps) {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [open, setOpen] = useState(false);
  const [location, setLocation] = useState<ShopperLocation | null>(
    initialLocation,
  );
  const [cities, setCities] = useState<MarketplaceCity[]>([]);
  const [citiesLoaded, setCitiesLoaded] = useState(false);
  const [totalCities, setTotalCities] = useState(0);
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [recents, setRecents] = useState<ShopperLocation[]>([]);
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const persist = useCallback((next: ShopperLocation | null) => {
    try {
      if (next) {
        window.localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(next));
        document.cookie = locationCookieString(next);
      } else {
        window.localStorage.removeItem(LOCATION_STORAGE_KEY);
        document.cookie = clearLocationCookieString();
      }
    } catch {
      // Storage unavailable. The location still applies to this navigation via
      // the URL; it just will not be remembered.
    }
  }, []);

  // Draft radius, applied on Apply rather than on every drag — each commit is a
  // navigation, and re-querying on every tick of the slider would thrash.
  const [radiusIndex, setRadiusIndex] = useState(() =>
    draftIndexForLocation(initialLocation),
  );

  // Re-seed the draft from the live location every time the popover opens.
  //
  // Without this the slider keeps whatever it was initialised with, so a
  // location restored from storage (or changed in another tab) leaves the
  // control disagreeing with the pill right above it — and Apply would then
  // quietly overwrite the shopper's real radius with the stale draft.
  //
  // Keyed on the seeded index rather than on `location?.radiusKm`: that
  // expression is `undefined` both when there is no location and when one is set
  // to everywhere, so a shopper clearing an everywhere location would not
  // re-seed the draft back to the default. Depending on `location` itself would
  // fix that but re-seed on every navigation — the URL effect below rebuilds it
  // as a fresh object — discarding a draft the shopper was mid-way through
  // setting. The index is the only value the draft actually needs.
  const seededRadiusIndex = draftIndexForLocation(location);
  useEffect(() => {
    if (!open) return;
    setRadiusIndex(seededRadiusIndex);
  }, [open, seededRadiusIndex]);

  // Every open starts from the top of the list with an empty box. A stale query
  // from last time would look like a marketplace that lost most of its cities.
  useEffect(() => {
    if (!open) return;
    setQuery("");
    setExpanded(false);
    setGeoError(null);
    setRecents(readRecentLocations());
  }, [open]);

  // Typing is the way past the first eight cities, so the caret starts in the
  // search box. Deferred a frame: the popover animates its content in, and
  // focusing mid-transition scrolls the panel in some browsers.
  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => searchRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [open]);

  // A URL carrying a location wins over the cookie: a shared link must show the
  // grid it promises, and the pill must agree with what the grid is filtered by.
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    const fromUrl = locationFromSearchParams(params);
    if (fromUrl) {
      // A shared location is an explicit shopper choice for this browser too.
      // Persist it before any later navigation can fall back to an older cookie.
      persist(fromUrl);
      setLocation(fromUrl);
      setRadiusIndex(draftIndexForLocation(fromUrl));
      return;
    }

    // A partial location URL is still authoritative: do not retain a different
    // cookie-backed pill for a grid that correctly discarded that bad origin.
    const hasUrlLocation =
      params.has("city") || params.has("lat") || params.has("lng");
    if (hasUrlLocation || !parseLocationCookie(browserLocationCookie())) {
      setLocation(null);
      setRadiusIndex(draftIndexForLocation(null));
    }
  }, [persist, searchParams]);

  // Restore a remembered location on a URL that carries none — a shopper who
  // set Dhaka last week lands on the homepage expecting Dhaka.
  const restored = useRef(false);
  useEffect(() => {
    if (restored.current || initialLocation) return;
    restored.current = true;

    const hasUrlLocation =
      searchParams.has("city") ||
      searchParams.has("lat") ||
      searchParams.has("lng");
    if (hasUrlLocation) return;

    try {
      const stored = window.localStorage.getItem(LOCATION_STORAGE_KEY);
      const parsed = stored ? parseShopperLocation(JSON.parse(stored)) : null;
      if (parsed) {
        setLocation(parsed);
        setRadiusIndex(draftIndexForLocation(parsed));
      }
    } catch {
      // Unparseable or storage blocked (private mode, disabled cookies). The
      // picker simply starts empty.
    }
  }, [initialLocation, searchParams]);

  // Cities are only needed once the popover opens, so the list is not fetched
  // on every page load for a control most shoppers never touch. Re-runs as the
  // shopper types: the endpoint returns a capped page, so the city they want may
  // simply not be in the first one.
  useEffect(() => {
    if (!open) return;

    const needle = query.trim();

    // The first open has nothing to show yet, so it queries immediately;
    // keystrokes wait out the debounce against a list that is already rendered.
    const delay = citiesLoaded ? SEARCH_DEBOUNCE_MS : 0;

    let cancelled = false;
    const timer = setTimeout(() => {
      (async () => {
        try {
          const url = needle
            ? `/api/locations/cities?q=${encodeURIComponent(needle)}`
            : "/api/locations/cities";
          const response = await fetch(url);
          if (!response.ok) return;
          const payload = await response.json();
          if (cancelled) return;

          const rows = payload?.data?.cities;
          if (Array.isArray(rows)) setCities(rows);
          const total = payload?.data?.total;
          if (typeof total === "number") setTotalCities(total);
        } catch {
          // Offline or a failed request: the last good list stays on screen and
          // is filtered locally, so the picker degrades instead of emptying.
        } finally {
          if (!cancelled) setCitiesLoaded(true);
        }
      })();
    }, delay);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // `citiesLoaded` is read for the first-open delay but deliberately not a
    // dependency: it flips on the first response and would re-fire the effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, query]);

  const commit = useCallback(
    (next: ShopperLocation | null) => {
      persist(next);
      setLocation(next);
      setOpen(false);

      // Clearing a location is a shopper saying "not this place" — keeping the
      // history would put what they just dismissed back at the top of the panel.
      if (next) setRecents(rememberRecentLocation(next));
      else {
        clearRecentLocations();
        setRecents([]);
      }

      const params = new URLSearchParams(searchParams.toString());
      stripLocationParams(params);
      for (const [key, value] of Object.entries(locationSearchParams(next))) {
        params.set(key, value);
      }
      stripDistanceSortForLocation(params, next);
      stripPickupFacetForLocation(params, next);
      // A narrower location can leave the current page past the end of the
      // results, which would render an empty grid that looks like "nothing here".
      params.delete("page");

      const queryString = params.toString();
      router.push(queryString ? `${pathname}?${queryString}` : pathname);
    },
    [pathname, persist, router, searchParams],
  );

  const handleUseMyLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoError(t("location.unsupported"));
      return;
    }

    setLocating(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        commit({
          label: t("location.nearMe"),
          // Coarsened here, at the only point full-precision GPS enters the
          // app. Everything downstream — cookie, localStorage, the shareable
          // URL, analytics' `$current_url` — inherits whatever this writes, and
          // a 5 km radius cannot tell a doorstep from its neighbourhood.
          lat: roundShopperCoordinate(position.coords.latitude),
          lng: roundShopperCoordinate(position.coords.longitude),
          radiusKm: radiusFromIndex(radiusIndex),
          precise: true,
        });
      },
      () => {
        // Denied, unavailable, or timed out — all the same to the shopper, who
        // just needs the city list instead. Permission denial is the common
        // case and is not an error worth alarming them about.
        setLocating(false);
        setGeoError(t("location.permissionDenied"));
      },
      { timeout: 10_000, maximumAge: 5 * 60 * 1000 },
    );
  }, [commit, radiusIndex, t]);

  const handlePickCity = useCallback(
    (city: MarketplaceCity) => {
      const cityLocation = cityShopperLocation(city.city);
      if (cityLocation) commit(cityLocation);
    },
    [commit],
  );

  const searching = query.trim().length > 0;

  // The server has already applied the query; this re-applies it locally so the
  // list narrows on the keystroke instead of waiting out the debounce, and so a
  // failed request leaves a filtered list rather than a stale unfiltered one.
  const filteredCities = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return cities;
    return cities.filter((city) => city.city.toLowerCase().includes(needle));
  }, [cities, query]);

  // A search is already a narrowing, so its results are never collapsed — a
  // shopper who typed their city must see it, not "show 4 more".
  const collapsed = !searching && !expanded;
  const visibleCities = collapsed
    ? filteredCities.slice(0, COLLAPSED_CITY_COUNT)
    : filteredCities;

  // Counted against the marketplace total, not the fetched page: the endpoint
  // caps what it returns, so "show 4 more" would understate a marketplace with
  // hundreds of cities and leave the rest looking like they do not exist.
  const hiddenCityCount = searching
    ? 0
    : Math.max(totalCities, filteredCities.length) - visibleCities.length;

  // Recents duplicate rows in a top-eight the shopper can already see, and the
  // section only earns its space when it points somewhere the list does not.
  const recentLocations = useMemo(() => {
    if (searching) return [];
    const shown = new Set(
      visibleCities.map((city) => city.city.trim().toLowerCase()),
    );
    return recents.filter(
      (entry) => entry.precise || !shown.has(entry.label.trim().toLowerCase()),
    );
  }, [recents, searching, visibleCities]);

  const radiusKm = radiusFromIndex(radiusIndex);
  const radiusLabel =
    radiusKm === null
      ? t("location.everywhere")
      : t("location.withinKm", { km: radiusKm });

  const pillLabel = location?.label ?? t("location.setLocation");

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-left text-sm transition-colors hover:bg-foreground/5",
            className,
          )}
          aria-label={t("location.chooseLocation")}
        >
          <MapPin className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          <span className="flex flex-col leading-tight">
            <span className="max-w-[9rem] truncate font-medium">
              {pillLabel}
            </span>
            {location && hasLocationCoordinates(location.lat, location.lng) ? (
              <span className="text-[11px] text-muted-foreground">
                {location.radiusKm === null
                  ? t("location.everywhere")
                  : t("location.withinKm", { km: location.radiusKm })}
              </span>
            ) : null}
          </span>
        </button>
      </PopoverTrigger>

      <PopoverContent align="start" sideOffset={10} className="w-[320px] p-0">
        <div className="space-y-4 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">{t("location.title")}</h3>
            {location ? (
              <button
                type="button"
                onClick={() => commit(null)}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="h-3 w-3" aria-hidden="true" />
                {t("location.clear")}
              </button>
            ) : null}
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={handleUseMyLocation}
            disabled={locating}
            className="h-10 w-full justify-start gap-2"
          >
            {locating ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Crosshair className="h-4 w-4" aria-hidden="true" />
            )}
            {t("location.useMyLocation")}
          </Button>

          {geoError ? (
            <p className="text-xs text-muted-foreground">{geoError}</p>
          ) : null}

          {location && hasLocationCoordinates(location.lat, location.lng) ? (
            <div className="space-y-2">
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  {t("location.radius")}
                </span>
                <span className="text-xs font-semibold">{radiusLabel}</span>
              </div>
              <Slider
                min={0}
                max={EVERYWHERE_INDEX}
                step={1}
                value={[radiusIndex]}
                onValueChange={(values) => setRadiusIndex(values[0])}
                aria-label={t("location.radius")}
              />
            </div>
          ) : null}

          <div className="space-y-2">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                ref={searchRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t("location.searchCity")}
                className="h-9 pl-8"
              />
            </div>

            {recentLocations.length > 0 ? (
              <div className="space-y-0.5">
                <p className="px-2 pt-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  {t("location.recent")}
                </p>
                {recentLocations.map((entry) => (
                  <button
                    key={`${entry.label}-${entry.precise ? "point" : "city"}`}
                    type="button"
                    onClick={() => commit(entry)}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent"
                  >
                    <Clock
                      className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <span className="truncate">{entry.label}</span>
                  </button>
                ))}
              </div>
            ) : null}

            <div
              className={cn(
                "space-y-0.5 overflow-y-auto",
                // Collapsed, the list is short by construction and a scroll area
                // would only add a stray inner scrollbar. Expanded or searching,
                // it needs the cap back.
                collapsed ? "max-h-none" : "max-h-52",
              )}
            >
              {!searching && recentLocations.length > 0 ? (
                <p className="px-2 pt-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  {t("location.popular")}
                </p>
              ) : null}

              {!citiesLoaded ? (
                <p className="px-1 py-2 text-xs text-muted-foreground">
                  {t("common.loading")}
                </p>
              ) : filteredCities.length === 0 ? (
                <p className="px-1 py-2 text-xs text-muted-foreground">
                  {t("location.noCities")}
                </p>
              ) : (
                visibleCities.map((city) => {
                  const active =
                    location?.label.toLowerCase() === city.city.toLowerCase();

                  return (
                    <button
                      key={city.city}
                      type="button"
                      onClick={() => handlePickCity(city)}
                      className={cn(
                        "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent",
                        active && "bg-accent font-medium",
                      )}
                    >
                      <span className="truncate">
                        {city.city}
                        {city.country ? (
                          // Muted and inline rather than a second line: it
                          // disambiguates two same-named cities without turning
                          // every unambiguous row into two-line text.
                          <span className="text-muted-foreground">
                            , {city.country}
                          </span>
                        ) : null}
                      </span>
                      {/* The store count sets expectations before the shopper
                          commits to a place, rather than after an empty grid. */}
                      <span className="ml-2 shrink-0 text-xs text-muted-foreground">
                        {city.vendorCount}
                      </span>
                    </button>
                  );
                })
              )}
            </div>

            {hiddenCityCount > 0 ? (
              collapsed ? (
                <button
                  type="button"
                  onClick={() => setExpanded(true)}
                  className="w-full rounded-md px-2 py-1.5 text-left text-xs font-medium text-primary transition-colors hover:bg-accent"
                >
                  {t("location.showMoreCities", { count: hiddenCityCount })}
                </button>
              ) : (
                // Expanded and still short of the total: the rest were never
                // fetched, so offering another "show more" would be a button
                // that cannot deliver. Point at the control that can.
                <p className="px-2 py-1.5 text-xs text-muted-foreground">
                  {t("location.searchForMoreCities", {
                    count: hiddenCityCount,
                  })}
                </p>
              )
            ) : null}
          </div>

          {location && hasLocationCoordinates(location.lat, location.lng) ? (
            <Button
              type="button"
              onClick={() =>
                commit({ ...location, radiusKm: radiusFromIndex(radiusIndex) })
              }
              className="h-10 w-full"
            >
              {t("location.apply")}
            </Button>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}
