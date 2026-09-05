import dotenv from 'dotenv';
import { MongoClient, ObjectId } from 'mongodb';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const MONGODB_URI = process.env.MONGODB_URI;
const client = new MongoClient(MONGODB_URI);

async function fixIssuer() {
  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB_NAME || 'eighty7nexus');

    console.log('🔧 Fixing admin account issuer field...\n');

    // Get the admin user
    const admin = await db.collection('user').findOne({ role: 'admin' });
    if (!admin) {
      console.log('❌ No admin found');
      process.exit(1);
    }

    const adminId = String(admin._id);
    console.log(`Found admin: ${admin.email} (ID: ${adminId})\n`);

    // Get the admin's account
    const account = await db.collection('account').findOne({
      userId: adminId,
      providerId: 'credential'
    });

    if (!account) {
      console.log('❌ No credential account found for admin');
      process.exit(1);
    }

    console.log('Current account document:');
    console.log(JSON.stringify(account, null, 2));

    // Update the account with issuer field if missing
    if (!account.issuer) {
      console.log('\n📝 Adding issuer field...\n');
      const result = await db.collection('account').updateOne(
        { _id: account._id },
        {
          $set: {
            issuer: 'local:credential'
          }
        }
      );

      if (result.modifiedCount > 0) {
        console.log('✅ Successfully updated account with issuer field!');
        
        // Show updated document
        const updated = await db.collection('account').findOne({ _id: account._id });
        console.log('\nUpdated document:');
        console.log(JSON.stringify(updated, null, 2));
      } else {
        console.log('⚠️  No changes made');
      }
    } else {
      console.log('\n✓ Account already has issuer field');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

fixIssuer();
