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

async function fixAdminAuth() {
  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB_NAME || 'eighty7nexus');

    console.log('🔧 Fixing admin authentication...\n');

    // Find the admin user
    const admin = await db.collection('user').findOne({ role: 'admin' });

    if (!admin) {
      console.log('❌ No admin account found');
      process.exit(1);
    }

    const adminId = String(admin._id);
    console.log(`Found admin: ${admin.email} (ID: ${adminId})`);

    // Check if account already exists
    const existingAccount = await db
      .collection('account')
      .findOne({ userId: adminId });

    if (existingAccount) {
      console.log('✓ Better Auth account already exists');
      console.log(existingAccount);
      process.exit(0);
    }

    // Create the missing account entry
    console.log('\n🔐 Creating Better Auth credential account...\n');
    
    const accountDoc = {
      userId: adminId,
      providerId: 'credential',
      accountId: adminId,
      password: admin.password, // Reuse the existing password hash
      createdAt: admin.createdAt || new Date(),
    };

    const result = await db.collection('account').insertOne(accountDoc);
    
    console.log('✅ Successfully created Better Auth account!');
    console.log(`   Document ID: ${result.insertedId}`);
    console.log(`   User ID: ${adminId}`);
    console.log(`   Provider: credential`);
    console.log('\n✨ Admin should now be able to log in!');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

fixAdminAuth();
