/**
 * Validates a Ghana Post GPS code format (e.g., GA-123-4567, WS-202-3494).
 * The format is typically: 2 letters, hyphen, 3 or 4 digits, hyphen, 4 digits.
 */
export function isValidGhanaGPS(gpsCode: string): boolean {
  if (!gpsCode) return false;
  
  // Normalize by uppercase and trimming whitespace
  const normalized = gpsCode.trim().toUpperCase();
  
  // Regex: 2 letters (Region & District), a dash, 3 or 4 digits (Area), a dash, 4 digits (Street/Building)
  const gpsRegex = /^[A-Z]{2}-\d{3,4}-\d{4}$/;
  
  return gpsRegex.test(normalized);
}

/**
 * Formats user input into a Ghana Post GPS format if possible.
 * Inserts hyphens as the user types (e.g., GA1234567 -> GA-123-4567).
 */
export function formatGhanaGPS(value: string): string {
  if (!value) return "";
  
  // Remove all non-alphanumeric characters
  const cleaned = value.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  
  let formatted = cleaned;
  if (cleaned.length > 2) {
    formatted = `${cleaned.slice(0, 2)}-${cleaned.slice(2)}`;
  }
  if (cleaned.length > 5 && cleaned.length <= 10) {
    // Determine if the middle block has 3 or 4 digits based on total length.
    // For a standard 9-character code (2 letters + 7 digits), the middle block is 3 digits.
    // E.g., GA1234567 -> GA-123-4567
    const middleLength = cleaned.length === 10 ? 4 : 3;
    formatted = `${cleaned.slice(0, 2)}-${cleaned.slice(2, 2 + middleLength)}-${cleaned.slice(2 + middleLength, 2 + middleLength + 4)}`;
  }
  
  return formatted;
}
