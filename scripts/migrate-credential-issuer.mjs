import mongoose from "mongoose";

/**
 * Credential account issuer migration (Better Auth 1.1+ compatibility)
 * ====================================================================
 *
 * Better Auth 1.1+ requires credential accounts to carry `issuer: "local:credential"`
 * alongside `providerId: "credential"`. Without this field, Better Auth's
 * credential lookup ignores the account during sign-in and rejects the attempt
 * with 401 UNAUTHORIZED (`INVALID_EMAIL_OR_PASSWORD`).
 *
 * This migration inspects the `account` collection and backfills
 * `issuer: "local:credential"` on all credential accounts where it is missing.
 *
 * Usage:
 *   node --env-file=.env scripts/migrate-credential-issuer.mjs            (apply)
 *   node --env-file=.env scripts/migrate-credential-issuer.mjs --dry-run  (report only)
 */

const DRY_RUN = process.argv.includes("--dry-run");

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI is not set. Pass --env-file=.env");
    throw new Error("Missing MONGODB_URI");
  }

  const dbName = process.env.MONGODB_DB_NAME;

  console.log(
    `\nCredential account issuer migration${DRY_RUN ? " (dry run — no changes)" : ""}\n`,
  );

  await mongoose.connect(uri, { ...(dbName ? { dbName } : {}) });
  console.log("✓ Connected to MongoDB");

  try {
    const db = mongoose.connection.db;
    if (!db) throw new Error("Database connection not ready");

    const accounts = db.collection("account");
    const filter = {
      providerId: "credential",
      issuer: { $ne: "local:credential" },
    };

    const count = await accounts.countDocuments(filter);
    console.log(`Found ${count} credential account(s) missing 'issuer: "local:credential"'`);

    if (count === 0) {
      console.log("Nothing to do: all credential accounts are already up to date.\n");
      return;
    }

    const unmigrated = await accounts.find(filter).toArray();
    for (const acc of unmigrated) {
      console.log(`  - Account ID: ${acc._id}, User ID: ${acc.userId}, Current issuer: ${acc.issuer ?? "(none)"}`);
    }

    if (DRY_RUN) {
      console.log(`\nDry run complete. Would update ${count} account(s).\n`);
      return;
    }

    const result = await accounts.updateMany(filter, {
      $set: { issuer: "local:credential" },
    });

    console.log(`\n✓ Successfully updated ${result.modifiedCount} account(s) with 'issuer: "local:credential"'.\n`);
  } finally {
    await mongoose.disconnect();
    console.log("✓ Disconnected from MongoDB");
  }
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
