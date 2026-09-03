import { NotFoundError, ValidationError } from "@/lib/api/errors";
import { withApi } from "@/lib/api/handler";
import { successResponse } from "@/lib/api/response";
import { STORAGE_CREDENTIAL_BLOCKS } from "@/lib/credentials";
import { createInstallAdmin } from "@/lib/install/create-admin";
import {
  installPayloadSchema,
  type InstallPayload,
} from "@/lib/install/payload";
import { importSampleCatalog } from "@/lib/install/sample-data";
import {
  assertInstallable,
  claimInstall,
  markInstalled,
  releaseInstallClaim,
} from "@/lib/install/status";
import { clearStorageConfigCache } from "@/lib/storage";
import { applyThemeStarter } from "@/lib/storefront/themes/apply-starter";
import { THEME_MANIFESTS } from "@/lib/storefront/themes/registry";
import { getSettings, Settings } from "@/models/settings.model";
import { seedGhanaDeliveryMethods } from "@/lib/install/default-delivery-methods";

/**
 * Dotted `$set` paths for the chosen backend, or nothing at all when the
 * buyer chose to configure storage later.
 *
 * Credentials go into that provider's OWN block (`storage.r2.*`,
 * `storage.s3.*`, …), never the deprecated flat fields — the same rule the
 * admin save follows, so a wizard install and a hand-typed one leave an
 * identical document. Only the keys the provider actually uses are written:
 * an empty public URL must stay absent so `resolveStorageCredentials` can
 * still fall through to `STORAGE_PUBLIC_URL` from `.env`.
 */
function storageUpdates(
  storage: InstallPayload["storage"],
): Record<string, string> {
  if (!storage) return {};
  const { provider, ...credentials } = storage;
  const block = STORAGE_CREDENTIAL_BLOCKS[provider];
  const updates: Record<string, string> = { "storage.provider": provider };
  for (const [field, value] of Object.entries(credentials)) {
    if (typeof value === "string" && value.trim() !== "") {
      updates[`storage.${block}.${field}`] = value;
    }
  }
  return updates;
}

/**
 * The wizard's one-shot finish. Order is chosen for RECOVERABILITY:
 *
 *   settings → CLAIM → store basics → ADMIN → sample → template → stamp
 *
 * The claim is the concurrency line: `assertInstallable()` is a read, so on
 * an unauthenticated endpoint two requests can both pass it and both create
 * a super-admin. One atomic conditional update settles who proceeds, and a
 * failure before the admin hands the claim straight back.
 *
 * Everything before the admin can be retried freely (the wizard stays
 * open). The moment the admin exists the wizard is locked by definition —
 * so every later step is best-effort: a failure becomes a warning in the
 * response, the install is stamped anyway, and the buyer finishes the rest
 * signed in (Products → Import, or Themes → Use this template). A locked
 * half-configured store beats an open wizard on a store with an admin.
 */
export const POST = withApi(
  {
    auth: "optional",
    rateLimit: { action: "install:complete", preset: "moderate" },
  },
  async ({ request }) => {
    await assertInstallable();

    const body = await request.json().catch(() => null);
    const parsed = installPayloadSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError(
        parsed.error.issues[0]?.message ?? "Invalid installation payload",
      );
    }
    const payload = parsed.data;

    const manifest = THEME_MANIFESTS.find(
      (candidate) =>
        candidate.id === payload.template && candidate.status === "stable",
    );
    if (!manifest) {
      throw new ValidationError("Unknown template");
    }

    // 1. Materialize the settings singleton with model defaults, so both the
    //    claim below and the $set after it land on a complete document.
    await getSettings();

    // 2. Take the one lease. `assertInstallable()` above is a READ, so two
    //    requests arriving together both pass it; this conditional update is
    //    atomic, so only one of them gets to create an admin. The loser is
    //    answered exactly like a post-install caller.
    if (!(await claimInstall())) {
      throw new NotFoundError("Not found");
    }

    let userId: string;
    try {
      const supported = payload.store.language === "en"
        ? ["en"]
        : ["en", payload.store.language];
      await Settings.updateOne(
        {},
        {
          $set: {
            "general.storeName": payload.store.name,
            "general.defaultLanguage": payload.store.language,
            "general.supportedLanguages": supported,
            "general.defaultCurrency": payload.store.currency,
            "multiVendorMode.enabled": payload.store.multiVendor,
            "pos.enabled": payload.store.pos,
            ...storageUpdates(payload.storage),
          },
        },
      );
      // The config is memoized for a minute; this process may already have
      // read the empty pre-install one while serving the wizard.
      clearStorageConfigCache();

      // 3. The admin — the last step that may refuse (password policy). From
      //    here on the wizard is locked, so nothing below throws outward.
      ({ userId } = await createInstallAdmin(payload.admin));
    } catch (error) {
      // Nothing durable happened yet: hand the lease straight back so the
      // buyer can correct their password and submit again, rather than
      // staring at a 404 until the lease expires.
      await releaseInstallClaim();
      throw error;
    }

    const warnings: string[] = [];

    // 4. Sample catalog (optional).
    if (payload.sampleData) {
      try {
        const imported = await importSampleCatalog(userId);
        if (imported.failed > 0) {
          warnings.push(
            `Sample catalog: ${imported.failed} of ${imported.created + imported.failed} products failed to import`,
          );
        }
      } catch {
        warnings.push(
          "The sample catalog could not be imported — you can import one from Products after signing in",
        );
      }
    }

    // 5. The chosen template, published — the same path as the admin
    //    Themes page, AFTER the sample so the binder sees the catalog.
    try {
      await applyThemeStarter(manifest, "publish", userId);
    } catch {
      warnings.push(
        "The template could not be applied — pick it under Online Store → Themes after signing in",
      );
    }

    // 6. Seed default Ghana logistics & bus parcel delivery methods.
    try {
      await seedGhanaDeliveryMethods();
    } catch {
      warnings.push(
        "Default delivery methods could not be populated — you can add them from Shipping & Delivery in Admin",
      );
    }

    // 7. Lock the wizard for good.
    await markInstalled();

    return successResponse({ ok: true, warnings });
  },
);
