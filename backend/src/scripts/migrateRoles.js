import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const isDryRun = !process.argv.includes('--execute') || process.argv.includes('--dry-run');

const runMigration = async () => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campusride';
  console.log(`====================================================`);
  console.log(` CAMPUSRIDE PHASE 2.1 - ROLE & IDENTITY MIGRATION`);
  console.log(` MODE: ${isDryRun ? 'DRY RUN (No changes will be written)' : 'EXECUTE (Applying changes to database)'}`);
  console.log(` MongoDB URI: ${mongoUri.replace(/:([^:@]{4})[^:@]*@/, ':****@')}`);
  console.log(`====================================================\n`);

  try {
    await mongoose.connect(mongoUri);
    console.log(' Connected to MongoDB successfully.\n');

    // 1. Scan for legacy roles ('student', 'rider')
    const legacyUsers = await User.find({
      role: { $in: ['student', 'rider', 'STUDENT', 'RIDER'] }
    }).select('_id fullName email phoneNumber role approvalStatus isApproved');

    console.log(` Found ${legacyUsers.length} users with legacy roles ('student' / 'rider').`);

    if (legacyUsers.length > 0) {
      console.log('\nSample records to migrate:');
      legacyUsers.slice(0, 10).forEach((u, i) => {
        console.log(`  [${i + 1}] ID: ${u._id} | Email: ${u.email} | Current Role: "${u.role}" -> Target: "passenger"`);
      });
      if (legacyUsers.length > 10) {
        console.log(`  ... and ${legacyUsers.length - 10} more.`);
      }
    }

    // 2. Scan drivers for approvalStatus backfill
    const driversWithoutStatus = await User.find({
      role: { $in: ['driver', 'DRIVER'] },
      $or: [
        { approvalStatus: { $exists: false } },
        { approvalStatus: null }
      ]
    }).select('_id fullName email role approvalStatus isApproved');

    console.log(`\n Found ${driversWithoutStatus.length} drivers needing approvalStatus backfill.`);

    if (!isDryRun) {
      console.log('\n Executing migration updates...');

      // Update legacy roles to passenger
      const roleResult = await User.updateMany(
        { role: { $in: ['student', 'rider', 'STUDENT', 'RIDER'] } },
        { $set: { role: 'passenger' } }
      );
      console.log(` Updated ${roleResult.modifiedCount} users to role: 'passenger'.`);

      // Backfill driver approval statuses
      let backfilledDrivers = 0;
      for (const driver of driversWithoutStatus) {
        const targetStatus = driver.isApproved ? 'approved' : 'pending';
        await User.updateOne(
          { _id: driver._id },
          { $set: { approvalStatus: targetStatus } }
        );
        backfilledDrivers++;
      }
      console.log(` Backfilled approvalStatus for ${backfilledDrivers} driver records.`);

      // Verification counts
      const passengerCount = await User.countDocuments({ role: 'passenger' });
      const driverCount = await User.countDocuments({ role: 'driver' });
      const adminCount = await User.countDocuments({ role: 'admin' });
      const legacyRemaining = await User.countDocuments({ role: { $in: ['student', 'rider'] } });

      console.log('\n================ POST-MIGRATION AUDIT ================');
      console.log(` Passengers:       ${passengerCount}`);
      console.log(` Drivers:          ${driverCount}`);
      console.log(` Admins:           ${adminCount}`);
      console.log(` Remaining Legacy: ${legacyRemaining} (Must be 0)`);
      console.log('======================================================\n');

      if (legacyRemaining === 0) {
        console.log(' Migration successfully completed with 0 remaining legacy roles.');
      } else {
        console.warn(` Warning: ${legacyRemaining} legacy records could not be migrated.`);
      }
    } else {
      console.log('\n [DRY RUN COMPLETED] Re-run with `--execute` to apply changes permanently.');
    }

  } catch (error) {
    console.error(' Migration failed with error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB.');
  }
};

runMigration();
