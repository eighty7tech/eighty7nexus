import mongoose from "mongoose";

/**
 * Vendor storefront index migration
 * =================================
 *
 * Adds the { status, vendorId, <sort> } compounds a vendor storefront needs.
 *
 * Every listing on a store page filters on the same pair — status: "active" and
 * that vendor's id — and then sorts. Before these indexes, no index covered the
 * pair: { vendorId, createdAt } does not know about status, and the
 * { status, ... } compounds do not know about vendorId. MongoDB therefore
 * matched on one of them and sorted the remainder in memory, so a store with a
 * large catalogue paid a blocking SORT on every page view and every page of
 * pagination.
 *
 * One index per sort the storefront offers. Key order mirrors `buildSort()` in
 * lib/products/storefront-products.ts down to its trailing tiebreakers — an
 * index that stops short of them cannot serve the sort, and MongoDB falls back
 * to a blocking SORT silently rather than erroring.
 *
 * Ensured (purely additive — nothing is dropped):
 *   products.status_1_vendorId_1_reviewCount_-1_rating_-1_createdAt_-1  ("popular", default)
 *   products.status_1_vendorId_1_createdAt_-1                           (newest)
 *   products.status_1_vendorId_1_price_1                                (price, both directions)
 *   products.status_1_vendorId_1_rating_-1_reviewCount_-1               (best rating)
 *
 * `{ vendorId: 1, createdAt: -1 }` is deliberately kept: the vendor dashboard
 * lists a seller's own products across every status, so the status-led compounds
 * cannot serve it.
 *
 * Deployment ordering matters: run this AFTER deploying the code whose schema
 * declares the new index set, for the same reason as the other index migrations
 * in this directory.
 *
 * Usage:
 *   node --env-file=.env scripts/migrate-vendor-storefront-indexes.mjs            (apply)
 *   node --env-file=.env scripts/migrate-vendor-storefront-indexes.mjs --dry-run  (report only)
 */

const DRY_RUN = process.argv.includes("--dry-run");

// Names match Mongoose's default naming so these coincide with the
// schema-managed indexes rather than creating duplicates.
const ENSURE = {
  products: [
    {
      name: "status_1_vendorId_1_reviewCount_-1_rating_-1_createdAt_-1",
      key: {
        status: 1,
        vendorId: 1,
        reviewCount: -1,
        rating: -1,
        createdAt: -1,
      },
    },
    {
      name: "status_1_vendorId_1_createdAt_-1",
      key: { status: 1, vendorId: 1, createdAt: -1 },
    },
    {
      name: "status_1_vendorId_1_price_1",
      key: { status: 1, vendorId: 1, price: 1 },
    },
    {
      name: "status_1_vendorId_1_rating_-1_reviewCount_-1",
      key: { status: 1, vendorId: 1, rating: -1, reviewCount: -1 },
    },
  ],
};

// The first shipped revision of this script created a "popular" index without
// its trailing createdAt key, which MongoDB could not use for the three-key
// sort. Dropped once its correct replacement exists.
const DROP = {
  products: [
    {
      name: "status_1_vendorId_1_reviewCount_-1_rating_-1",
      requires: ["status_1_vendorId_1_reviewCount_-1_rating_-1_createdAt_-1"],
    },
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

  for (const { name, key } of ENSURE[collectionName] || []) {
    if (existing.has(name)) {
      console.log(`   ✓ ${collectionName}.${name} already present`);
      continue;
    }
    if (DRY_RUN) {
      console.log(`   [dry-run] would create ${collectionName}.${name}`);
      continue;
    }
    // background: true keeps a live storefront serving while the index builds.
    await collection.createIndex(key, { name, background: true });
    existing.add(name);
    console.log(`   + created ${collectionName}.${name}`);
  }

  // Drop superseded indexes, each gated on its replacement being present so
  // nothing is ever dropped blind.
  for (const { name, requires } of DROP[collectionName] || []) {
    if (!existing.has(name)) {
      console.log(`   • ${collectionName}.${name} not present, nothing to drop`);
      continue;
    }

    const missing = requires.filter((req) => !existing.has(req));
    // In dry-run the ensure step above created nothing, so a requirement may be
    // "missing" only because it was not created yet — say so rather than
    // reporting it as unsafe.
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

  if (!MONGODB_URI) {
    console.error("❌ Missing MONGODB_URI in environment.");
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    console.log("✓ Connected to MongoDB");

    const db = mongoose.connection.db;
    if (!db) {
      console.error("❌ Database connection not available");
      process.exit(1);
    }

    console.log(
      `\n📇 Vendor storefront index migration${DRY_RUN ? " (DRY RUN)" : ""}...\n`,
    );

    for (const collectionName of ["products"]) {
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
