/**
 * When a pickup branch is open, and whether it is usable at all.
 *
 * This replaces `lib/pickup-scheduling.ts`, and the rename is the point:
 * scheduling is exactly the concept that was removed. A branch takes no
 * bookings — a shopper turns up while it is open — so opening hours are
 * guidance printed at checkout, not a constraint anything is validated against.
 *
 * What went with the old module: slot generation, the zoned date-time
 * conversion and its DST double-pass, per-slot capacity, minimum lead time, the
 * booking horizon and blackout dates. All of it existed to answer "which
 * minute may this shopper reserve", which is no longer a question.
 */

export type PickupWeeklyHours = {
  weekday: number;
  enabled: boolean;
  start: string;
  end: string;
};

export type PickupHoursSettings = {
  enabled?: boolean;
  pickupArea?: string;
  pickupAddress?: string;
  instructions?: string;
  /**
   * Retained because historical orders stored the zone their booked window was
   * expressed in, and order history still formats those. Nothing new reads it.
   */
  timeZone?: string;
  weeklyHours?: ReadonlyArray<Readonly<PickupWeeklyHours>>;
};

/** `HH:MM` as minutes past midnight, or `null` when it is not a time. */
function minutesFromTime(value: string): number | null {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return null;

  return hour * 60 + minute;
}

/**
 * Enough configuration to offer pickup at all.
 *
 * A name and somewhere to go, and that is the whole bar. The previous version
 * demanded six things at once — a valid IANA zone, a slot length inside a
 * range, a positive capacity, and at least one weekly window long enough to fit
 * a slot — and returned false without saying which was missing, so a merchant
 * who set five of six simply found pickup absent from checkout.
 */
export function isPickupScheduleConfigured(
  settings: PickupHoursSettings,
): boolean {
  return Boolean(settings.enabled && settings.pickupAddress?.trim());
}

/** Throws a human-readable error when an enabled pickup branch is unusable. */
export function assertValidPickupSchedule(settings: PickupHoursSettings): void {
  if (!settings.enabled) return;

  if (!settings.pickupAddress?.trim()) {
    throw new Error("A pickup address is required");
  }
}

/**
 * Opening hours as plain rows a checkout can print.
 *
 * Days with no window are omitted rather than listed as closed: an empty list
 * reads as "ask the shop", which is honest, where a wall of "Closed" reads as a
 * broken configuration.
 */
export function pickupOpeningHoursSummary(
  settings: PickupHoursSettings,
): Array<{ weekday: number; start: string; end: string }> {
  return (settings.weeklyHours || [])
    .filter(
      (opening) =>
        opening.enabled &&
        Number.isInteger(opening.weekday) &&
        opening.weekday >= 0 &&
        opening.weekday <= 6 &&
        minutesFromTime(opening.start) !== null &&
        minutesFromTime(opening.end) !== null,
    )
    .map((opening) => ({
      weekday: opening.weekday,
      start: opening.start,
      end: opening.end,
    }))
    .sort((a, b) => a.weekday - b.weekday);
}
