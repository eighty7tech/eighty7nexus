export const POINTS_PER_DOLLAR = 1;
export const POINTS_REDEMPTION_VALUE = 0.01; // 100 points = $1

/**
 * Calculates points earned for a given transaction amount.
 * Client-safe pure function without database dependencies.
 */
export function calculatePoints(amount: number): number {
  return Math.floor(amount * POINTS_PER_DOLLAR);
}
