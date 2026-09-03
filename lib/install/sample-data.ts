import "server-only";

import { getSettings } from "@/models/settings.model";
import { getOrCreateDefaultVendor } from "@/lib/multi-vendor";
import { importProductsJson } from "@/lib/products/import-export";
import sampleCatalog from "./sample-catalog.json";

/**
 * The wizard's bounded sample import: the 50-product admin catalog that
 * ships with the source (a copy of docs/samples/vendor-catalogs/
 * admin-catalog-50.json, bundled here so production builds carry it).
 *
 * It rides the SAME import pipeline the admin Products screen uses —
 * `importProductsJson` with `createMissingCategories`, owned by the default
 * vendor — so a wizard install and a hand import produce identical data.
 * Collections are not part of the sample; the template's collection shelves
 * stay quiet until the merchant curates some (or runs the full demo seed).
 */
export async function importSampleCatalog(adminUserId: string): Promise<{
  created: number;
  failed: number;
}> {
  const settings = await getSettings();
  const vendor = await getOrCreateDefaultVendor(adminUserId);
  const result = await importProductsJson(JSON.stringify(sampleCatalog), {
    defaultVendorId: String(vendor._id),
    productSource: "admin",
    allowFeatured: true,
    countryAvailability: settings.general?.countryAvailability,
  });
  return { created: result.created, failed: result.failed };
}
