/**
 * Backfill `planSnapshot.stripePriceId` on Stripe vendor subscriptions.
 *
 * Vendor-initiated checkout used to record the resolved Stripe price on the
 * application snapshot only, leaving the subscription's own snapshot null. The
 * billing sync now falls back to the application snapshot so those vendors still
 * activate, but the fallback is a safety net, not a resting place: it breaks if
 * the application is later removed or moved to another plan.
 *
 * This copies the price onto the subscription so each row is self-sufficient.
 *
 * Only heals a row when every admin-recorded source agrees:
 *   - the application snapshot has a price,
 *   - the application is for the same plan as the subscription,
 *   - the subscription's top-level stripePriceId is absent or identical.
 * Anything else is reported and left alone for a human to look at. The price
 * Stripe reports is never used — it is the value being validated, not evidence.
 *
 * Dry run by default; pass --apply to write.
 *
 *   node --env-file=.env.local scripts/backfill-subscription-stripe-price.mjs
 *   node --env-file=.env.local scripts/backfill-subscription-stripe-price.mjs --apply
 */
import mongoose from "mongoose";

const APPLY = process.argv.includes("--apply");

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI is not set");
  process.exit(1);
}

await mongoose.connect(uri, { dbName: process.env.MONGODB_DB_NAME });
const db = mongoose.connection.db;

const rows = await db
  .collection("vendorsubscriptions")
  .find({
    provider: "stripe",
    $or: [
      { "planSnapshot.stripePriceId": null },
      { "planSnapshot.stripePriceId": { $exists: false } },
    ],
  })
  .toArray();

console.log(APPLY ? "=== APPLY ===" : "=== DRY RUN ===");
console.log(`fallback-dependent subscriptions: ${rows.length}\n`);

const healable = [];
const skipped = [];

for (const row of rows) {
  const application = row.applicationId
    ? await db
        .collection("vendorapplications")
        .findOne({ _id: row.applicationId })
    : null;
  const applicationPrice = application?.planSnapshot?.stripePriceId || null;
  const topLevelPrice = row.stripePriceId || null;
  const planMatches =
    application && String(application.planId) === String(row.planId);

  if (!applicationPrice) {
    skipped.push([row, "application snapshot has no price"]);
    continue;
  }
  if (!planMatches) {
    skipped.push([row, "application is for a different plan"]);
    continue;
  }
  if (topLevelPrice && topLevelPrice !== applicationPrice) {
    skipped.push([row, "top-level price disagrees with the application"]);
    continue;
  }
  healable.push([row, applicationPrice]);
}

for (const [row, price] of healable) {
  console.log(`heal ${row._id} | ${row.planSnapshot?.name} -> ${price}`);
}
for (const [row, reason] of skipped) {
  console.log(`skip ${row._id} | ${row.planSnapshot?.name} -- ${reason}`);
}

if (!APPLY) {
  console.log("\n(no changes written; re-run with --apply)");
  await mongoose.disconnect();
  process.exit(0);
}

let updated = 0;
for (const [row, price] of healable) {
  const result = await db.collection("vendorsubscriptions").updateOne(
    // Re-assert the precondition at write time so a concurrent change cannot be
    // overwritten by a decision made from a stale read.
    {
      _id: row._id,
      $or: [
        { "planSnapshot.stripePriceId": null },
        { "planSnapshot.stripePriceId": { $exists: false } },
      ],
    },
    { $set: { "planSnapshot.stripePriceId": price } },
  );
  updated += result.modifiedCount ?? 0;
}

console.log(`\nhealed: ${updated} | skipped: ${skipped.length}`);
await mongoose.disconnect();
