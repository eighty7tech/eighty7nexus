import dotenv from 'dotenv';
import { MongoClient, ObjectId } from 'mongodb';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const MONGODB_URI = process.env.MONGODB_URI;
const client = new MongoClient(MONGODB_URI);

async function inspect() {
  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB_NAME || 'eighty7nexus');

    console.log('📋 All accounts:\n');
    const accounts = await db.collection('account').find({}).toArray();
    accounts.forEach((acc, i) => {
      console.log(`${i + 1}. ${JSON.stringify(acc, null, 2)}`);
    });

    console.log('\n👥 All admin users:\n');
    const admins = await db.collection('user').find({ role: 'admin' }).toArray();
    admins.forEach((user, i) => {
      console.log(`${i + 1}. ID: ${user._id}, Email: ${user.email}`);
    });

    // Check if the admin's ID is already in the accounts table with different issuer
    const adminId = admins[0]?._id?.toString();
    if (adminId) {
      console.log(`\n🔍 Checking for admin ${adminId} in accounts:\n`);
      const adminAccounts = await db.collection('account').find({ accountId: adminId }).toArray();
      console.log(`Found ${adminAccounts.length} account(s):`);
      adminAccounts.forEach((acc) => {
        console.log(JSON.stringify(acc, null, 2));
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

inspect();
