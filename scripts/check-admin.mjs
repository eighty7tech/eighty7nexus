import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env file
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in .env');
  process.exit(1);
}

const client = new MongoClient(MONGODB_URI);

async function checkAdmin() {
  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB_NAME || 'eighty7nexus');

    console.log('🔍 Checking admin accounts...\n');

    // Find all admin users
    const admins = await db.collection('user').find({ role: 'admin' }).toArray();

    if (admins.length === 0) {
      console.log('❌ No admin accounts found in database');
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
      
      // Check if account exists in better-auth account table
      const account = await db
        .collection('account')
        .findOne({ userId: String(admin._id) });

      if (account) {
        console.log(`✓ Better Auth account found`);
        console.log(`  Provider: ${account.providerId}`);
        console.log(`  Account ID: ${account.accountId}`);
      } else {
        console.log(`✗ NO Better Auth account found (THIS IS THE PROBLEM!)`);
      }
      console.log('\n');
    }

    // Check the account table for all records
    console.log('📋 All accounts in database:');
    const allAccounts = await db.collection('account').find({}).toArray();
    console.log(`Total accounts: ${allAccounts.length}`);
    allAccounts.forEach(acc => {
      console.log(`  - userId: ${acc.userId}, provider: ${acc.providerId}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

checkAdmin();
