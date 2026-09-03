import mongoose from "mongoose";

/**
 * Performance index migration (query-optimization audit)
 * ======================================================
 *
 * Brings existing databases in line with the index set defined in the models
 * after the performance / query-shape audit. Every added index removes an
 * in-memory sort (a bounded scan followed by a SORT stage) for a list endpoint
 * that filters on an equality key and sorts by createdAt.
 *
 * What it does (same guarded pattern as migrate-product-review-indexes.mjs):
 *   1. Ensures the new indexes exist (idempotent; the running app also creates
 *      them via Mongoose autoIndex, but re-asserting makes the drop step safe).
 *   2. Drops the single-field indexes each new compound supersedes — but ONLY
 *      after verifying the superseding index is present. Nothing is dropped
 *      blind.
 *
 * Superseded (dropped) → superseding (ensured):
 *   user.role_1                       → role_1_createdAt_-1
 *   products.vendorId_1               → vendorId_1_createdAt_-1
 *   paymenttransactions.status_1      → status_1_createdAt_-1
 *   paymenttransactions.provider_1    → provider_1_createdAt_-1
 *   coupons.status_1                  → status_1_createdAt_-1
 *   coupons.vendorId_1                → vendorId_1_createdAt_-1
 *
 * Purely-additive indexes (no drop): user.createdAt_-1, vendors.createdAt_-1,
 * products.status_1_brand_1_createdAt_-1, products.status_1_collectionIds_1_createdAt_-1.
 *
 * Deployment ordering matters: run this AFTER deploying the code whose schemas
 * define the new index set. If an older build (whose schema still declares the
 * single-field indexes) is live, autoIndex will simply recreate them.
 *
 * Usage:
 *   node --env-file=.env scripts/migrate-perf-indexes.mjs            (apply)
 *   node --env-file=.env scripts/migrate-perf-indexes.mjs --dry-run  (report only)
 */

const DRY_RUN = process.argv.includes("--dry-run");

// Indexes that must exist before we drop anything they supersede. Names match
// Mongoose's default naming so they coincide with the schema-managed indexes
// (no duplicates are created).
const ENSURE = {
  user: [
    { name: "createdAt_-1", key: { createdAt: -1 } },
    { name: "role_1_createdAt_-1", key: { role: 1, createdAt: -1 } },
  ],
  products: [
    { name: "vendorId_1_createdAt_-1", key: { vendorId: 1, createdAt: -1 } },
    {
      name: "status_1_brand_1_createdAt_-1",
      key: { status: 1, brand: 1, createdAt: -1 },
    },
    {
      name: "status_1_collectionIds_1_createdAt_-1",
      key: { status: 1, collectionIds: 1, createdAt: -1 },
    },
  ],
  paymenttransactions: [
    { name: "status_1_createdAt_-1", key: { status: 1, createdAt: -1 } },
    { name: "provider_1_createdAt_-1", key: { provider: 1, createdAt: -1 } },
  ],
  coupons: [
    { name: "status_1_createdAt_-1", key: { status: 1, createdAt: -1 } },
    { name: "vendorId_1_createdAt_-1", key: { vendorId: 1, createdAt: -1 } },
  ],
  vendors: [{ name: "createdAt_-1", key: { createdAt: -1 } }],
};

// Stale indexes to drop, each gated on the superseding index being present.
const DROP = {
  user: [{ name: "role_1", requires: ["role_1_createdAt_-1"] }],
  products: [{ name: "vendorId_1", requires: ["vendorId_1_createdAt_-1"] }],
  paymenttransactions: [
    { name: "status_1", requires: ["status_1_createdAt_-1"] },
    { name: "provider_1", requires: ["provider_1_createdAt_-1"] },
  ],
  coupons: [
    { name: "status_1", requires: ["status_1_createdAt_-1"] },
    { name: "vendorId_1", requires: ["vendorId_1_createdAt_-1"] },
  ],
};

async function listIndexNames(collection) {
  try {
    const indexes = await collection.indexes();
    return new Set(indexes.map((index) => index.name));
  } catch {
    // Collection does not exist yet (fresh install) — nothing to migrate.
    return null;
  }
}

async function migrateCollection(db, collectionName) {
  const collection = db.collection(collectionName);
  const existing = await listIndexNames(collection);

  if (existing === null) {
    console.log(`   • ${collectionName}: collection not found, skipping`);
    return;
  }

  // 1. Ensure the new indexes.
  for (const { name, key } of ENSURE[collectionName] || []) {
    if (existing.has(name)) {
      console.log(`   ✓ ${collectionName}.${name} already present`);
      continue;
    }
    if (DRY_RUN) {
      console.log(`   [dry-run] would create ${collectionName}.${name}`);
      continue;
    }
    await collection.createIndex(key, { name });
    existing.add(name);
    console.log(`   + created ${collectionName}.${name}`);
  }

  // 2. Drop superseded single-field indexes (guarded).
  for (const { name, requires } of DROP[collectionName] || []) {
    if (!existing.has(name)) {
      console.log(`   • ${collectionName}.${name} not present, nothing to drop`);
      continue;
    }

    const missing = requires.filter((req) => !existing.has(req));
    // In dry-run the ensure step above didn't actually create anything, so a
    // requirement may legitimately be "missing" only because it wasn't created
    // yet — surface that rather than treating it as unsafe.
    if (missing.length > 0 && !DRY_RUN) {
      console.warn(
        `   ! SKIP drop ${collectionName}.${name}: superseding index missing (${missing.join(", ")})`,
      );
      continue;
    }

    if (DRY_RUN) {
      console.log(
        `   [dry-run] would drop ${collectionName}.${name} (superseded by ${requires.join(", ")})`,
      );
      continue;
    }

    await collection.dropIndex(name);
    existing.delete(name);
    console.log(`   - dropped ${collectionName}.${name}`);
  }
}

async function run() {
  const MONGODB_URI = process.env.MONGODB_URI;
  const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME;

  if (!MONGODB_URI) {
    console.error("❌ Missing MONGODB_URI in environment.");
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGODB_URI, {
      ...(MONGODB_DB_NAME ? { dbName: MONGODB_DB_NAME } : {}),
      maxPoolSize: 1,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log("✓ Connected to MongoDB");

    const db = mongoose.connection.db;
    if (!db) {
      console.error("❌ Database connection not available");
      process.exit(1);
    }

    console.log(
      `\n📇 Performance index migration${DRY_RUN ? " (DRY RUN)" : ""}...\n`,
    );

    for (const collectionName of [
      "user",
      "products",
      "paymenttransactions",
      "coupons",
      "vendors",
    ]) {
      console.log(`-- ${collectionName} --`);
      await migrateCollection(db, collectionName);
    }

    console.log(
      `\n✅ Index migration ${DRY_RUN ? "dry-run complete (no changes made)" : "completed"}.\n`,
    );
  } catch (error) {
    console.error("\n❌ Index migration failed:", error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log("✓ Disconnected from MongoDB");
  }
}

run()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
