import { connectDB, mongoose } from "@/lib/db";
import { USER_ROLES } from "@/config/app.config";

async function checkAdminStatus() {
  try {
    await connectDB();
    const db = mongoose.connection.db;

    console.log("🔍 Checking admin accounts...\n");

    const admins = await db
      .collection("user")
      .find({ role: USER_ROLES.ADMIN })
      .toArray();

    if (admins.length === 0) {
      console.log("❌ No admin accounts found in database");
      process.exit(1);
    }

    console.log(`Found ${admins.length} admin account(s):\n`);

    for (const admin of admins) {
      console.log(`📧 Email: ${admin.email}`);
      console.log(`👤 Name: ${admin.name}`);
      console.log(`🔐 Role: ${admin.role}`);
      console.log(`📊 Status: ${admin.status}`);
      console.log(`✅ Email Verified: ${admin.emailVerified}`);
      console.log(`🕐 Created At: ${admin.createdAt}`);
      console.log(`🔑 Has Password: ${!!admin.password}`);
      console.log("---");

      // Check if account exists in better-auth account table
      const account = await db
        .collection("account")
        .findOne({ userId: String(admin._id) });

      if (account) {
        console.log(`✓ Better Auth account found`);
        console.log(`  Provider: ${account.providerId}`);
        console.log(`  Account ID: ${account.accountId}`);
      } else {
        console.log(`✗ NO Better Auth account found (THIS IS THE PROBLEM!)`);
      }
      console.log("\n");
    }

    // Also check for duplicate issues
    const adminsByEmail = await db
      .collection("user")
      .aggregate([
        { $match: { role: USER_ROLES.ADMIN } },
        { $group: { _id: "$email", count: { $sum: 1 } } },
        { $match: { count: { $gt: 1 } } },
      ])
      .toArray();

    if (adminsByEmail.length > 0) {
      console.log("⚠️  WARNING: Duplicate admin emails found!");
      adminsByEmail.forEach((dup: any) => {
        console.log(`  ${dup._id}: ${dup.count} accounts`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

checkAdminStatus();
