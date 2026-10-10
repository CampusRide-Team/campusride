// DEVELOPMENT TEST ACCOUNTS ONLY — NEVER SEED IN PRODUCTION
/**
 * CampusRide Development Test Account Seeder
 *
 * Purpose: Creates/reconciles two reusable development test accounts:
 *   1. CampusRide Test Passenger (role: passenger)
 *   2. CampusRide Test Driver    (role: driver, approvalStatus: approved)
 *
 * Command: npm run seed:test-users
 * Safety: Strictly blocked when NODE_ENV === 'production'
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import User from '../models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Priority environment file resolution
const defaultEnvPath = path.join(__dirname, '../../.env');
if (process.env.ENV_FILE && fs.existsSync(process.env.ENV_FILE)) {
  dotenv.config({ path: process.env.ENV_FILE });
} else if (fs.existsSync(defaultEnvPath)) {
  dotenv.config({ path: defaultEnvPath });
} else {
  dotenv.config();
}

// PRODUCTION GUARD: Refuse to execute in production environment
if (process.env.NODE_ENV === 'production') {
  console.error('\n❌ FATAL: Test-account seeding is strictly disabled in production.\n');
  process.exit(1);
}

const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campusride';

/**
 * Reusable Development Test Account Definitions
 */
export const DEV_TEST_ACCOUNTS = [
  {
    fullName: 'CampusRide Test Passenger',
    email: 'testpassenger@campusride.com',
    phoneNumber: '+233240000001',
    password: 'CampusRide2026!',
    role: 'passenger',
    approvalStatus: 'approved',
    walletBalance: 50.0,
    ratingAverage: 5.0,
    ratingCount: 5,
    totalTrips: 18,
    isSuspended: false,
    isBlocked: false,
    currentLocation: {
      type: 'Point',
      coordinates: [-0.1870, 5.6502] // Balme Library, UG Legon
    },
    avatarUrl: null,
    avatarUri: null
  },
  {
    fullName: 'CampusRide Test Driver',
    email: 'testdriver@campusride.com',
    phoneNumber: '+233240000002',
    password: 'CampusRide2026!',
    role: 'driver',
    approvalStatus: 'approved',
    isOnline: false,
    ratingAverage: 5.0,
    ratingCount: 12,
    totalTrips: 45,
    isSuspended: false,
    isBlocked: false,
    currentLocation: {
      type: 'Point',
      coordinates: [-0.1876, 5.6350] // Legon Main Gate
    },
    avatarUrl: null,
    avatarUri: null,
    driverProfile: {
      vehicle: {
        make: 'Toyota',
        model: 'Toyota Corolla 2022',
        licensePlate: 'GW-4521-26',
        color: 'Metallic Silver',
        physicalCapacity: 4
      },
      capacity: {
        chosenSharedCapacity: 3
      },
      documents: {
        licenseImg: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
        ghanaCardFront: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
        ghanaCardBack: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
        insuranceImg: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
        registrationImg: 'https://res.cloudinary.com/demo/image/upload/sample.jpg'
      }
    }
  }
];

export const seedTestAccounts = async () => {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Test-account seeding is disabled in production.');
  }

  const sanitizedUri = mongoUri.replace(/:([^:@]{4})[^:@]*@/, ':****@');
  console.log('====================================================');
  console.log(' CAMPUSRIDE — DEVELOPMENT TEST ACCOUNT SEEDER');
  console.log(` Target Database: ${sanitizedUri}`);
  console.log('====================================================\n');

  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 8000 });
    console.log(' Connected to MongoDB successfully.\n');

    const results = [];

    for (const accountDef of DEV_TEST_ACCOUNTS) {
      // Find existing by designated development email or phone
      let existing = await User.findOne({
        $or: [
          { email: accountDef.email },
          { phoneNumber: accountDef.phoneNumber }
        ]
      });

      if (existing) {
        // Idempotent reconciliation
        existing.fullName = accountDef.fullName;
        existing.email = accountDef.email;
        existing.phoneNumber = accountDef.phoneNumber;
        existing.role = accountDef.role;
        existing.approvalStatus = accountDef.approvalStatus;
        existing.isSuspended = false;
        existing.isBlocked = false;
        existing.isOnline = accountDef.isOnline || false;
        existing.walletBalance = accountDef.walletBalance || 0;
        existing.ratingAverage = accountDef.ratingAverage || 5.0;
        existing.ratingCount = accountDef.ratingCount || 0;
        existing.totalTrips = accountDef.totalTrips || 0;
        existing.currentLocation = accountDef.currentLocation;

        if (accountDef.driverProfile) {
          existing.driverProfile = accountDef.driverProfile;
        }

        // Set password to trigger pre-save bcrypt hashing hook
        existing.password = accountDef.password;
        await existing.save();

        console.log(` [UPDATED] ${accountDef.role.toUpperCase().padEnd(10)} | ${accountDef.email} (ID: ${existing._id})`);
        results.push({ email: accountDef.email, role: accountDef.role, action: 'updated', id: existing._id });
      } else {
        // Fresh creation with pre-save hash hook
        const created = new User(accountDef);
        await created.save();

        console.log(` [CREATED] ${accountDef.role.toUpperCase().padEnd(10)} | ${accountDef.email} (ID: ${created._id})`);
        results.push({ email: accountDef.email, role: accountDef.role, action: 'created', id: created._id });
      }
    }

    // Direct in-database password verification & approval sanity check
    console.log('\n Verifying credentials & database state...');
    for (const accountDef of DEV_TEST_ACCOUNTS) {
      const user = await User.findOne({ email: accountDef.email });
      const passwordMatches = await user.matchPassword(accountDef.password);
      if (!passwordMatches) {
        throw new Error(`Password verification failed for ${accountDef.email}`);
      }
      if (user.role === 'driver' && user.approvalStatus !== 'approved') {
        throw new Error(`Driver approval check failed: expected approved, got ${user.approvalStatus}`);
      }
    }

    console.log('\n====================================================');
    console.log(' CampusRide development test accounts ready.\n');
    console.log(' Passenger: ready');
    console.log(' Driver:    ready / approved');
    console.log('====================================================\n');

    return results;
  } catch (err) {
    console.error(`\n❌ Seeder Failure: ${err.message}`);
    throw err;
  } finally {
    await mongoose.disconnect();
    console.log(' Database disconnected.\n');
  }
};

// Direct CLI execution guard
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  seedTestAccounts()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
