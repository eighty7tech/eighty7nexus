import mongoose from "mongoose";
const APPLY=process.argv.includes("--apply");
await mongoose.connect(process.env.MONGODB_URI,{dbName:process.env.MONGODB_DB_NAME});
const db=mongoose.connection.db;
const orphan=[{$lookup:{from:"vendors",localField:"vendorId",foreignField:"_id",as:"v"}},{$match:{v:{$size:0}}}];

const subs=await db.collection("vendorsubscriptions").aggregate(orphan).toArray();
const apps=await db.collection("vendorapplications").aggregate([...orphan,
  {$match:{status:{$ne:"rejected"}}}]).toArray();

// Safety: never touch an orphan still live at Stripe.
const live=subs.filter(r=>r.provider==="stripe"&&r.paymentProviderRef&&
  !["canceled","incomplete_expired"].includes(String(r.providerStatus)));
if(live.length){console.log("ABORT: orphans with live Stripe refs:",live.map(r=>r.paymentProviderRef));process.exit(1);}

console.log(APPLY?"=== APPLY ===":"=== DRY RUN ===");
console.log("subscriptions to retire:",subs.length);
for(const r of subs) console.log("  -",r.planSnapshot?.name,"| status:",r.status,"-> cancelled | slot:",r.occupiesActiveSlot,"-> false");
console.log("applications to retire:",apps.length);
for(const r of apps) console.log("  -",r.planSnapshot?.name,"| status:",r.status,"-> rejected");

if(!APPLY){console.log("\n(no changes written)");await mongoose.disconnect();process.exit(0);}

const subPatch={status:"cancelled",occupiesActiveSlot:false,pendingPlanId:null,pendingPlanSnapshot:null,
  pendingCommissionRateSnapshot:null,pendingChangeType:null,pendingChangeStatus:null,nextRetryAt:null,
  lastReconcileError:"Vendor deleted"};
const appPatch={status:"rejected",paymentStatus:"expired",lastError:"Vendor deleted"};
const s=await db.collection("vendorsubscriptions").updateMany({_id:{$in:subs.map(r=>r._id)}},{$set:subPatch});
const a=apps.length?await db.collection("vendorapplications").updateMany({_id:{$in:apps.map(r=>r._id)}},{$set:appPatch}):{modifiedCount:0};
console.log("\nretired subscriptions:",s.modifiedCount,"| applications:",a.modifiedCount);
await mongoose.disconnect();
