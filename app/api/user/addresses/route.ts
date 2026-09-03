import { z } from "zod";
import { ObjectId } from "mongodb";
import { mongoose } from "@/lib/db";
import { successResponse } from "@/lib/api/response";
import { ValidationError } from "@/lib/api/errors";
import { validateBody } from "@/lib/api/validate";
import { AddressSchema } from "@/lib/validations";
import { withApi } from "@/lib/api/handler";
import { getSettings } from "@/models/settings.model";
import { isCountryAllowed } from "@/lib/country-availability";
import {
  resolveAddressIndex,
  serializeAddresses,
} from "@/lib/saved-addresses";

const AddAddressBodySchema = z.object({
  address: AddressSchema,
});

// `id` is preferred and `index` is the legacy fallback for addresses saved
// before the sub-schema carried one; see `lib/saved-addresses.ts`. Both are
// optional at the schema level so the resolver can decide, which keeps one
// "invalid address" error shape instead of two different validation failures.
const UpdateAddressBodySchema = z.object({
  id: z.string().trim().min(1).optional(),
  index: z.coerce.number().int().min(0).optional(),
  address: AddressSchema,
});

const DeleteAddressBodySchema = z.object({
  id: z.string().trim().min(1).optional(),
  index: z.coerce.number().int().min(0).optional(),
});

async function assertCountryAvailable(country: string) {
  const settings = await getSettings();
  if (!isCountryAllowed(country, settings.general?.countryAvailability)) {
    throw new ValidationError({
      "address.country": ["Selected country is not available"],
    });
  }
}

/**
 * GET /api/user/addresses
 * Get user's addresses
 */
export const GET = withApi(
  { auth: "user" },
  async ({ session }) => {
    const db = mongoose.connection.db;
    if (!db) throw new Error("Database not connected");

    const user = await db
      .collection("user")
      .findOne({ _id: new ObjectId(session.user.id) });

    return successResponse({ addresses: serializeAddresses(user?.addresses) });
  },
);

/**
 * POST /api/user/addresses
 * Add new address
 */
export const POST = withApi(
  { auth: "user" },
  async ({ request, session }) => {
    const db = mongoose.connection.db;
    if (!db) throw new Error("Database not connected");

    const { address } = await validateBody(request, AddAddressBodySchema);
    await assertCountryAvailable(address.country);

    const user = await db.collection("user").findOne(
      { _id: new ObjectId(session.user.id) },
      { projection: { addresses: 1 } },
    );

    const currentAddresses = Array.isArray((user as any)?.addresses)
      ? ((user as any).addresses as any[])
      : [];

    const normalizedAddress = {
      ...address,
      // Minted here because these routes write through the raw driver, which
      // does not run the sub-schema's `_id` default. Without it a newly added
      // address would be index-only — the very state the id is meant to end.
      _id: new ObjectId(),
      label: address.label || "home",
      isDefault: Boolean(address.isDefault),
    };

    const addresses =
      currentAddresses.length === 0
        ? [{ ...normalizedAddress, isDefault: true }]
        : normalizedAddress.isDefault
          ? [
              ...currentAddresses.map((a) => ({ ...a, isDefault: false })),
              normalizedAddress,
            ]
          : [...currentAddresses, { ...normalizedAddress, isDefault: false }];

    await db
      .collection("user")
      .updateOne(
        { _id: new ObjectId(session.user.id) },
        { $set: { addresses } },
      );

    return successResponse(
      { addresses: serializeAddresses(addresses) },
      "Address added successfully",
    );
  },
);

/**
 * PUT /api/user/addresses
 * Update existing address
 */
export const PUT = withApi(
  { auth: "user" },
  async ({ request, session }) => {
    const db = mongoose.connection.db;
    if (!db) throw new Error("Database not connected");

    const { id, index: rawIndex, address } = await validateBody(
      request,
      UpdateAddressBodySchema,
    );
    await assertCountryAvailable(address.country);

    const user = await db.collection("user").findOne(
      { _id: new ObjectId(session.user.id) },
      { projection: { addresses: 1 } },
    );

    const addresses = Array.isArray((user as any)?.addresses)
      ? (((user as any).addresses as any[]).map((a) => ({ ...a })) as any[])
      : [];

    const index = resolveAddressIndex(addresses, { id, index: rawIndex });
    if (index === null) {
      throw new ValidationError({ index: ["Invalid address index"] });
    }

    const existing = addresses[index];
    const updated = {
      ...existing,
      ...address,
      label: address.label || existing.label || "home",
    };

    addresses[index] = updated;

    if (updated.isDefault) {
      for (let i = 0; i < addresses.length; i++) {
        addresses[i] = { ...addresses[i], isDefault: i === index };
      }
    }

    if (!addresses.some((a) => a.isDefault) && addresses.length > 0) {
      addresses[0] = { ...addresses[0], isDefault: true };
    }

    await db
      .collection("user")
      .updateOne(
        { _id: new ObjectId(session.user.id) },
        { $set: { addresses } },
      );

    return successResponse(
      { addresses: serializeAddresses(addresses) },
      "Address updated successfully",
    );
  },
);

/**
 * DELETE /api/user/addresses
 * Delete address by index
 */
export const DELETE = withApi(
  // Shopper-owned data: removing your own address stays available on demo.
  { auth: "user", demo: "allow" },
  async ({ request, session }) => {
    const db = mongoose.connection.db;
    if (!db) throw new Error("Database not connected");

    const { id, index: rawIndex } = await validateBody(
      request,
      DeleteAddressBodySchema,
    );

    // Get current addresses
    const user = await db
      .collection("user")
      .findOne({ _id: new ObjectId(session.user.id) });

    if (!user?.addresses) {
      return successResponse({ addresses: [] }, "No addresses to delete");
    }

    const index = resolveAddressIndex(user.addresses, { id, index: rawIndex });
    if (index === null) {
      throw new ValidationError({ index: ["Invalid address index"] });
    }

    const removedWasDefault = Boolean(user.addresses[index]?.isDefault);

    const updatedAddresses = user.addresses.filter((_: unknown, i: number) => i !== index);

    if (
      removedWasDefault &&
      updatedAddresses.length > 0 &&
      !updatedAddresses.some((a: any) => a?.isDefault)
    ) {
      updatedAddresses[0] = { ...updatedAddresses[0], isDefault: true };
    }

    await db
      .collection("user")
      .updateOne(
        { _id: new ObjectId(session.user.id) },
        { $set: { addresses: updatedAddresses } },
      );

    return successResponse(
      { addresses: serializeAddresses(updatedAddresses) },
      "Address deleted successfully",
    );
  },
);
