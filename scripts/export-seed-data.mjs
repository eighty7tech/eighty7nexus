import path from "path";
import { fileURLToPath } from "url";
import { mkdirSync, writeFileSync } from "fs";
import { MongoClient, BSON } from "mongodb";

/**
 * Export the live store's catalog into `scripts/seed-data/` snapshots.
 *
 * `scripts/seed.mjs` seeds a fresh install from these files, so a reseeded
 * database reproduces the live demo — same products, categories, vendors,
 * storefront pages, menus and settings — instead of generated placeholder
 * data. Re-run this against the live database whenever the demo content
 * changes, review the diff, and commit the updated snapshots.
 *
 * What is deliberately NOT exported:
 * - Customers, users, sessions, orders, carts, payments, ledgers — real
 *   operational data and PII. The seed generates its own demo accounts
 *   and orders.
 * - Credentials of any kind: payment gateways, SMTP, storage, OAuth,
 *   analytics and AI keys, vendor bank details, Stripe references.
 * - Store-page version history (heavy, and meaningless on a fresh install).
 *
 * Media note: image URLs are exported as-is, so seeded installs render the
 * demo catalog from the same public bucket the live store uses.
 *
 * Usage: pnpm db:seed:export   (reads MONGODB_URI / MONGODB_DB_NAME)
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OUT_DIR = path.join(__dirname, "seed-data");

/** Key names that must never appear in a snapshot (checked after sanitizing). */
const SENSITIVE_KEY_PATTERN =
  /secret|password|token|api[_-]?key|apikey|credential|privatekey/i;
/** Keys the pattern matches that are known-safe (not credentials). */
const SENSITIVE_KEY_ALLOWLIST = new Set([
  "serviceTokenAllowList", // Shippo service-level identifiers, not credentials
  "courierIdAllowList",
]);

function stripKeys(doc, keys) {
  for (const key of keys) delete doc[key];
  return doc;
}

function hasContent(value) {
  if (value === null || value === undefined || value === false) return false;
  if (typeof value === "string") return value.length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.keys(value).length > 0;
  return true;
}

/** Collect object key paths that look like filled-in credentials so a future
 * schema change can't silently leak one into a committed snapshot. Emptied
 * fields (e.g. a blanked token) are fine — only non-empty values flag. */
function findSensitiveKeys(value, basePath, out) {
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    value.forEach((entry, i) =>
      findSensitiveKeys(entry, `${basePath}[${i}]`, out),
    );
    return;
  }
  for (const [key, child] of Object.entries(value)) {
    const keyPath = basePath ? `${basePath}.${key}` : key;
    if (
      SENSITIVE_KEY_PATTERN.test(key) &&
      !SENSITIVE_KEY_ALLOWLIST.has(key) &&
      hasContent(child)
    ) {
      out.push(keyPath);
    }
    findSensitiveKeys(child, keyPath, out);
  }
}

async function exportSeedData() {
  const MONGODB_URI = process.env.MONGODB_URI;
  const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || "eighty7nexus";

  if (!MONGODB_URI) {
    console.error("❌ Missing MONGODB_URI in environment.");
    process.exit(1);
  }

  const client = new MongoClient(MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
  });
  await client.connect();
  const db = client.db(MONGODB_DB_NAME);
  console.log(`✓ Connected to ${db.databaseName} (read-only export)`);

  const settings = await db.collection("settings").findOne({});
  if (!settings) {
    console.error("❌ No settings document found — is this the right database?");
    process.exit(1);
  }

  // The live store's own absolute URLs become relative links on export so
  // snapshots never point a fresh install back at the demo domain.
  const storeDomain = (settings.general?.storeDomain || "").replace(/\/+$/, "");

  const files = new Map();

  // ---- Vendors (approved only; demo user accounts are created at seed time) ----
  const vendors = await db
    .collection("vendors")
    .find({ status: "approved" })
    .sort({ createdAt: 1 })
    .toArray();
  for (const vendor of vendors) {
    stripKeys(vendor, ["userId", "bankDetails", "stripeCustomerId", "planId"]);
  }
  const vendorIds = new Set(vendors.map((v) => String(v._id)));
  files.set("vendors.json", vendors);

  // ---- Inventory locations for those vendors ----
  const locations = (
    await db.collection("inventorylocations").find({}).toArray()
  ).filter((location) => vendorIds.has(String(location.vendorId)));
  files.set("inventory-locations.json", locations);

  // ---- Catalog ----
  const categories = await db
    .collection("categories")
    .find({})
    .sort({ order: 1, name: 1 })
    .toArray();
  files.set("categories.json", categories);

  const brands = await db
    .collection("brands")
    .find({})
    .sort({ order: 1 })
    .toArray();
  for (const brand of brands) {
    // A brand owned by a vendor that isn't exported would dangle.
    if (brand.ownerVendorId && !vendorIds.has(String(brand.ownerVendorId))) {
      brand.ownerVendorId = null;
    }
  }
  files.set("brands.json", brands);

  files.set(
    "global-variants.json",
    await db.collection("globalvariants").find({}).sort({ position: 1 }).toArray(),
  );

  const products = (
    await db
      .collection("products")
      .find({ status: "active" })
      .sort({ createdAt: 1 })
      .toArray()
  ).filter((product) => vendorIds.has(String(product.vendorId)));
  files.set("products.json", products);

  files.set(
    "collections.json",
    await db.collection("collections").find({}).sort({ position: 1 }).toArray(),
  );

  // ---- Storefront ----
  files.set("menus.json", await db.collection("menus").find({}).toArray());
  files.set("sliders.json", await db.collection("sliders").find({}).toArray());

  const storePages = await db.collection("storepages").find({}).toArray();
  for (const page of storePages) {
    // Version history is per-install working data, and by far the heaviest
    // part of the document. Author ids are stamped at seed time.
    page.history = [];
    if (page.draft) page.draft.updatedBy = null;
    if (page.published) page.published.publishedBy = null;
  }
  files.set("store-pages.json", storePages);

  // ---- Blog ----
  files.set(
    "blog-categories.json",
    await db.collection("blogcategories").find({}).toArray(),
  );
  const blogPosts = await db.collection("blogposts").find({}).toArray();
  for (const post of blogPosts) {
    // Authorship is stamped with the seeded admin at import time.
    stripKeys(post, ["password", "authorId", "authorName"]);
  }
  files.set("blog-posts.json", blogPosts);

  // ---- Vendor plans & onboarding ----
  const vendorPlans = await db
    .collection("vendorplans")
    .find({})
    .sort({ sortOrder: 1 })
    .toArray();
  for (const plan of vendorPlans) {
    stripKeys(plan, [
      "createdBy",
      "stripePriceId",
      "stripeProductId",
      "stripePriceActive",
      "stripePriceCurrency",
      "stripeSyncedAt",
    ]);
  }
  files.set("vendor-plans.json", vendorPlans);

  const onboardingTemplate = await db
    .collection("onboardingtemplates")
    .findOne({ key: "default" });
  if (onboardingTemplate) stripKeys(onboardingTemplate, ["updatedBy"]);
  files.set(
    "onboarding-template.json",
    onboardingTemplate ? [onboardingTemplate] : [],
  );

  // ---- Settings: presentation/config sections only, never credentials. ----
  // Excluded on purpose: payment, email, storage, security, analytics — the
  // seed's own safe defaults apply and each install configures its own.
  const SETTINGS_SECTIONS = [
    "general",
    "appearance",
    "orders",
    "shipping",
    "social",
    "maintenance",
    "pos",
    "multiVendorMode",
    "aiSalesAgent",
    "aiAuthoring",
    "homePage",
    "contentPages",
    "header",
    "footer",
    "vendorConfig",
    "boosting",
    "onlineStore",
    "checkout",
    "productCard",
    "notifications",
  ];
  const settingsSnapshot = {};
  for (const section of SETTINGS_SECTIONS) {
    if (settings[section] !== undefined) {
      settingsSnapshot[section] = settings[section];
    }
  }
  // Feature config survives, but anything needing an API key ships disabled —
  // a fresh install turns them back on after adding its own keys.
  if (settingsSnapshot.aiSalesAgent) settingsSnapshot.aiSalesAgent.enabled = false;
  if (settingsSnapshot.aiAuthoring) {
    delete settingsSnapshot.aiAuthoring.apiKey;
    settingsSnapshot.aiAuthoring.enabled = false;
  }
  const shippo = settingsSnapshot.shipping?.carriers?.shippo;
  if (shippo) {
    shippo.testToken = "";
    shippo.enabled = false;
  }
  files.set("settings.json", settingsSnapshot);

  await client.close();

  // ---- Sanitize sweep, domain rewrite, write ----
  mkdirSync(OUT_DIR, { recursive: true });

  const sensitive = [];
  const counts = {};
  for (const [filename, payload] of files) {
    findSensitiveKeys(payload, filename.replace(/\.json$/, ""), sensitive);

    let text = BSON.EJSON.stringify(payload, undefined, 2, { relaxed: true });
    if (storeDomain) {
      text = text.split(storeDomain).join("");
    }
    writeFileSync(path.join(OUT_DIR, filename), text + "\n");
    counts[filename] = Array.isArray(payload) ? payload.length : 1;
    console.log(
      `   ✓ ${filename} (${counts[filename]} ${Array.isArray(payload) ? "docs" : "doc"})`,
    );
  }

  if (sensitive.length > 0) {
    console.error(
      "\n❌ Credential-looking keys made it into the snapshot — fix the export rules for:",
    );
    for (const keyPath of sensitive) console.error(`   - ${keyPath}`);
    process.exit(1);
  }

  writeFileSync(
    path.join(OUT_DIR, "manifest.json"),
    JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        sourceDb: MONGODB_DB_NAME,
        counts,
      },
      undefined,
      2,
    ) + "\n",
  );

  console.log(`\n✅ Snapshot written to ${OUT_DIR}`);
  console.log(
    "   Review the diff (git diff scripts/seed-data) before committing.",
  );
}

exportSeedData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Export failed:", error);
    process.exit(1);
  });
