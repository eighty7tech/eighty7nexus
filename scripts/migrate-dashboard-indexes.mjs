import mongoose from "mongoose";

/**
 * Admin dashboard index migration
 * ===============================
 *
 * The dashboard now derives its customer and refund metrics from one
 * aggregation each instead of several ranged counts. Both pipelines filter on
 * an equality key and bucket by a date, so each wants that date in the index:
 *
 *   user.roles_1              → roles_1_createdAt_-1
 *     Customer totals (all-time / this month / last month) become a covered
 *     index scan; the `roles` prefix still serves plain membership lookups,
 *     which is why the single-field index can go.
 *
 *   returnrequests            → refundStatus_1_refundedAt_-1  (purely additive)
 *     Succeeded-refund totals stop scanning the whole collection.
 *
 * Same guarded pattern as scripts/migrate-perf-indexes.mjs: nothing is dropped
 * until the superseding index is confirmed present. Running apps with
 * MONGODB_AUTO_INDEX left on create these anyway; this script is for stores
 * that manage indexes explicitly. Run it AFTER deploying the code whose schemas
 * declare the new index set.
 *
 * Usage:
 *   node --env-file=.env scripts/migrate-dashboard-indexes.mjs            (apply)
 *   node --env-file=.env scripts/migrate-dashboard-indexes.mjs --dry-run  (report only)
 */

const DRY_RUN = process.argv.includes("--dry-run");

const ENSURE = {
  user: [
    { name: "roles_1_createdAt_-1", key: { roles: 1, createdAt: -1 } },
  ],
  returnrequests: [
    {
      name: "refundStatus_1_refundedAt_-1",
      key: { refundStatus: 1, refundedAt: -1 },
    },
  ],
};

const DROP = {
  user: [{ name: "roles_1", requires: ["roles_1_createdAt_-1"] }],
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
    await collection.createIndex(key, { name });
    existing.add(name);
    console.log(`   + created ${collectionName}.${name}`);
  }

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
      `\n📇 Dashboard index migration${DRY_RUN ? " (DRY RUN)" : ""}...\n`,
    );

    for (const collectionName of ["user", "returnrequests"]) {
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
