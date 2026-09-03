import type { IGhanaDeliveryMethod } from "@/types";

/**
 * Constructs a tracking URL by substituting the {tracking} placeholder
 * in the delivery method's URL template with the actual tracking number.
 * 
 * @param trackingNumber - The tracking reference from the order shipment
 * @param deliveryMethod - The selected Ghana delivery method
 * @returns The fully qualified tracking URL, or null if no template exists
 */
export function buildGhanaTrackingUrl(
  trackingNumber: string,
  deliveryMethod?: IGhanaDeliveryMethod
): string | null {
  if (!trackingNumber) return null;
  
  if (deliveryMethod?.trackingUrlTemplate) {
    return deliveryMethod.trackingUrlTemplate.replace(
      "{tracking}",
      encodeURIComponent(trackingNumber)
    );
  }
  
  // Return null if no template is defined; the system will fallback
  // to default global carrier tracking logic (e.g., Shippo/Shiprocket).
  return null;
}
