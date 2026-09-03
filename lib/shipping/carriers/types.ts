import type {
  CarrierLabelFileType,
  CarrierMode,
  CarrierProvider,
  DimensionUnit,
  ParcelWeightUnit,
} from "@/lib/shipping/carrier-config";

/**
 * The vocabulary every carrier is translated into.
 *
 * Nothing here references a Mongoose model or a provider's own field names:
 * `build-request.ts` maps Eighty7Nexus's domain into these shapes and each adapter
 * maps these shapes into its provider's. Keeping the middle language free of
 * both ends is what stops Shiprocket's four-step flow or Shippo's rate objects
 * leaking into the routes.
 */

export interface CarrierAddress {
  name: string;
  company?: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  postalCode: string;
  /** ISO-3166 alpha-2, uppercased. Carriers reject country names. */
  country: string;
  phone?: string;
  email?: string;
}

export interface CarrierParcel {
  length: number;
  width: number;
  height: number;
  dimensionUnit: DimensionUnit;
  weight: number;
  weightUnit: ParcelWeightUnit;
}

export interface CarrierCustomsItem {
  description: string;
  quantity: number;
  netWeight: number;
  weightUnit: ParcelWeightUnit;
  valueAmount: number;
  valueCurrency: string;
  originCountry?: string;
  hsCode?: string;
}

export interface CarrierShipmentRequest {
  /** Stable per sub-order; providers that de-duplicate see it as their order id. */
  reference: string;
  orderNumber: string;
  shipFrom: CarrierAddress;
  shipTo: CarrierAddress;
  parcels: CarrierParcel[];
  /** Populated only for a cross-border shipment. */
  customsItems?: CarrierCustomsItem[];
  /** Amount to collect on delivery; absent for a prepaid order. */
  cod?: { amount: number; currency: string };
  /** Order value, needed by providers that price against declared value. */
  declaredValue?: { amount: number; currency: string };
  /**
   * What the customer was charged for shipping, in the order's currency.
   *
   * Declared separately from `cod.amount` because a provider that computes the
   * collectable itself needs the components, not the total — and a prepaid
   * order still wants it on the invoice.
   */
  shippingAmount?: number;
  items?: Array<{
    name: string;
    sku?: string;
    quantity: number;
    unitPrice: number;
  }>;
}

export interface CarrierRateQuote {
  provider: CarrierProvider;
  /** Redeemed by `purchaseLabel`; may expire (see CARRIER_RATE_TTL_MS). */
  rateId: string;
  /** Provider-side shipment handle, when the quote created one. */
  shipmentId?: string;
  orderId?: string;
  carrierName: string;
  serviceName: string;
  serviceToken?: string;
  amount: number;
  currency: string;
  estimatedDays?: number;
  /** Provider hints such as CHEAPEST / FASTEST / BESTVALUE. */
  attributes?: string[];
}

export interface CarrierLabel {
  transactionId: string;
  trackingNumber: string;
  trackingUrl?: string;
  labelUrl: string;
  labelFormat: CarrierLabelFileType;
  carrierName: string;
  serviceName?: string;
  amount?: number;
  currency?: string;
  /** Provider state carried forward so a retry can resume mid-sequence. */
  resume?: CarrierResumeState;
}

/**
 * What a partially completed purchase left behind.
 *
 * Shiprocket creates an order, then assigns an AWB, then generates a label —
 * three calls that can fail independently. Persisting each step's handle is
 * what lets a retry continue instead of creating a second Indian shipment.
 * Shippo ignores it.
 */
export interface CarrierResumeState {
  providerOrderId?: string;
  providerShipmentId?: string;
  providerTransactionId?: string;
  trackingNumber?: string;
  labelUrl?: string;
}

export type NormalizedTrackingStatus =
  | "unknown"
  | "pre_transit"
  | "in_transit"
  | "out_for_delivery"
  | "delivered"
  | "returned"
  | "failure";

export interface CarrierTrackingEvent {
  at: Date;
  status: NormalizedTrackingStatus;
  providerStatus?: string;
  description?: string;
  location?: string;
}

export interface CarrierTracking {
  status: NormalizedTrackingStatus;
  eta?: Date;
  events: CarrierTrackingEvent[];
}

/** Everything an adapter needs to talk to one account. */
export interface CarrierContext {
  provider: CarrierProvider;
  mode: CarrierMode;
  /**
   * Whose carrier account this call spends from.
   *
   * The adapters do not care, but the books do: a label bought on a vendor's
   * own token costs the vendor, not the platform, and posting it as a platform
   * expense overstates costs the store never bore. Deciding it here is what
   * keeps that answer in the same place the credentials are chosen.
   */
  accountOwner: "platform" | "vendor";
  /** Shippo token, or the Shiprocket bearer once logged in. */
  token?: string;
  shiprocket?: {
    email?: string;
    password?: string;
    pickupLocationName?: string;
    channelId?: string;
    /** Persisted 240h token, reused across cold starts. */
    cachedToken?: string;
    cachedTokenExpiresAt?: Date;
    /** Lets the adapter write a refreshed token back to settings. */
    onToken?: (token: string, expiresAt: Date) => Promise<void>;
  };
  shippo?: {
    labelFileType?: CarrierLabelFileType;
    serviceTokenAllowList?: string[];
  };
}

export interface CarrierWebhookEnvelope {
  provider: CarrierProvider;
  /** Stable per delivered event; the de-duplication key. */
  eventId: string;
  type: string;
  /** The provider handle the event is about. */
  objectId?: string;
  trackingNumber?: string;
  transactionId?: string;
  /** True when the event came from the provider's test environment. */
  test?: boolean;
}
