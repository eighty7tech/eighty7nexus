import type { CarrierLabelFileType, CarrierMode, CarrierProvider } from "@/lib/shipping/carrier-config";
import type { CarrierFailure } from "./errors";
import type {
  CarrierAddress,
  CarrierContext,
  CarrierLabel,
  CarrierRateQuote,
  CarrierResumeState,
  CarrierShipmentRequest,
  CarrierTracking,
  CarrierWebhookEnvelope,
} from "./types";

/**
 * What every carrier must supply.
 *
 * Modelled on `lib/conversations/providers/registry.ts`, which exists for the
 * same reason: without a seam, the queue and the routes would interpret each
 * provider's errors inline and could not express a second provider's retry
 * semantics at all. Adding Shiprocket — whose booking flow shares nothing with
 * Shippo's — is what forces the abstraction here.
 */
export interface CarrierAdapter {
  readonly provider: CarrierProvider;

  /** Whether this carrier can serve the lane at all, before any network call. */
  supports(params: {
    originCountry?: string;
    destinationCountry?: string;
    hasPickupLocation: boolean;
  }): boolean;

  /** Must not create provider-side state — rate shopping is side-effect free. */
  getRates(
    ctx: CarrierContext,
    request: CarrierShipmentRequest,
  ): Promise<CarrierRateQuote[]>;

  /**
   * The only method allowed to create provider state, and the only one that
   * spends money. Resumable: `resume` carries whatever a previous attempt
   * completed so a retry continues rather than duplicating the consignment.
   */
  purchaseLabel(
    ctx: CarrierContext,
    params: {
      quote: CarrierRateQuote;
      request: CarrierShipmentRequest;
      idempotencyKey: string;
      resume?: CarrierResumeState;
      /**
       * Persist what a multi-call booking has completed so far.
       *
       * Returning the handles only on success is not enough: Shiprocket's
       * sequence can create the consignment and then fail to assign an AWB, and
       * an attempt that throws would take the order handle with it — leaving a
       * real consignment in the merchant's panel that Eighty7Nexus has no record of
       * and no way to cancel. Best-effort by contract; an adapter must not fail
       * a paid sequence because a local write did.
       */
      onProgress?: (resume: CarrierResumeState) => Promise<void>;
    },
  ): Promise<CarrierLabel>;

  track(
    ctx: CarrierContext,
    params: {
      trackingNumber: string;
      carrierName?: string;
      shipmentId?: string;
    },
  ): Promise<CarrierTracking>;

  voidLabel(
    ctx: CarrierContext,
    params: { transactionId?: string; awb?: string; orderId?: string },
  ): Promise<{ refunded: boolean; state: string }>;

  validateAddress?(
    ctx: CarrierContext,
    address: CarrierAddress,
  ): Promise<{
    valid: boolean;
    messages: string[];
    normalized?: CarrierAddress;
  }>;

  testConnection(ctx: CarrierContext): Promise<{
    ok: true;
    account?: string;
    mode: CarrierMode;
  }>;

  /**
   * Interpret a thrown error. `undefined` means "not a recognised provider
   * error", which the caller must treat as retryable — mistaking an unknown
   * fault for a permanent one strands an order the carrier would have taken.
   */
  classify(error: unknown): CarrierFailure | undefined;

  /** Returns null when the payload is not a recognisable event. */
  parseWebhook(params: {
    rawBody: string;
    headers: Headers;
    url: URL;
  }): CarrierWebhookEnvelope | null;
}

export type { CarrierLabelFileType };

// Imported after the interface so the adapter modules can import the type from
// here without a cycle at type level.
import { shippoAdapter } from "./shippo";
import { shiprocketAdapter } from "./shiprocket";

const ADAPTERS: Record<CarrierProvider, CarrierAdapter> = {
  shippo: shippoAdapter,
  shiprocket: shiprocketAdapter,
};

export function carrierAdapter(provider: CarrierProvider): CarrierAdapter {
  const adapter = ADAPTERS[provider];
  if (!adapter) {
    // Exhaustive by construction, but a provider added to the union without an
    // adapter must fail loudly rather than silently never ship anything.
    throw new Error(`No carrier adapter is registered for ${provider}`);
  }
  return adapter;
}

export function allCarrierAdapters(): CarrierAdapter[] {
  return Object.values(ADAPTERS);
}
