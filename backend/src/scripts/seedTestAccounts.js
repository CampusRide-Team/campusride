import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import User from '../models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Priority environment file resolution:
// 1. Explicit ENV_FILE argument / env var
// 2. backend/.env.e2e (if present for isolated E2E testing)
// 3. backend/.env (standard fallback)
const e2eEnvPath = path.join(__dirname, '../../.env.e2e');
const defaultEnvPath = path.join(__dirname, '../../.env');

if (process.env.ENV_FILE && fs.existsSync(process.env.ENV_FILE)) {
  dotenv.config({ path: process.env.ENV_FILE });
} else if (fs.existsSync(e2eEnvPath)) {
  dotenv.config({ path: e2eEnvPath });
} else if (fs.existsSync(defaultEnvPath)) {
  dotenv.config({ path: defaultEnvPath });
} else {
  dotenv.config();
}

const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campusride_e2e';

/**
 * Deterministic Test Account Definitions
 * Identifiable by unique .ug.edu.gh test emails
 */
export const DETERMINISTIC_TEST_ACCOUNTS = [
  {
    fullName: 'E2E System Administrator',
    email: 'admin.e2e@campusride.ug.edu.gh',
    phoneNumber: '+233200000001',
    password: 'E2EAdminPass2026!',
    role: 'admin',
    approvalStatus: 'approved'
  },
  {
    fullName: 'Kwame Passenger A',
    email: 'passenger.a@campusride.ug.edu.gh',
    phoneNumber: '+233200000002',
    password: 'E2EPass2026!',
    role: 'passenger',
    approvalStatus: 'approved',
    currentLocation: {
      type: 'Point',
      coordinates: [-0.1870, 5.6502] // Balme Library
    }
  },
  {
    fullName: 'Ama Passenger B',
    email: 'passenger.b@campusride.ug.edu.gh',
    phoneNumber: '+233200000003',
    password: 'E2EPass2026!',
    role: 'passenger',
    approvalStatus: 'approved',
    currentLocation: {
      type: 'Point',
      coordinates: [-0.1929, 5.6506] // Night Market
    }
  },
  {
    fullName: 'Kofi Driver A',
    email: 'driver.a@campusride.ug.edu.gh',
    phoneNumber: '+233200000004',
    password: 'E2EDriver2026!',
    role: 'driver',
    approvalStatus: 'approved',
    isOnline: false, // Starts offline; E2E client performs normal online heartbeat lifecycle
    currentLocation: {
      type: 'Point',
      coordinates: [-0.1876, 5.6350] // Legon Main Gate
    },
    driverProfile: {
      vehicle: {
        model: 'Toyota Corolla',
        licensePlate: 'GW-101-26',
        color: 'White',
        physicalCapacity: 4
      },
      capacity: {
        chosenSharedCapacity: 3
      },
      documents: {
        licenseImg: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
        insuranceImg: 'https://res.cloudinary.com/demo/image/upload/sample.jpg'
      }
    }
  },
  {
    fullName: 'Yaw Driver B',
    email: 'driver.b@campusride.ug.edu.gh',
    phoneNumber: '+233200000005',
    password: 'E2EDriver2026!',
    role: 'driver',
    approvalStatus: 'approved',
    isOnline: false, // Starts offline; E2E client performs normal online heartbeat lifecycle
    currentLocation: {
      type: 'Point',
      coordinates: [-0.1942, 5.6385] // Pentagon Hostel
    },
    driverProfile: {
      vehicle: {
        model: 'Hyundai Elantra',
        licensePlate: 'GW-202-26',
        color: 'Silver',
        physicalCapacity: 4
      },
      capacity: {
        chosenSharedCapacity: 3
      },
      documents: {
        licenseImg: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
        insuranceImg: 'https://res.cloudinary.com/demo/image/upload/sample.jpg'
      }
    }
  }
];

export const seedTestAccounts = async () => {
  const sanitizedUri = mongoUri.replace(/:([^:@]{4})[^:@]*@/, ':****@');
  console.log('====================================================');
  console.log(' CAMPUSRIDE PHASE 2.5 - DETERMINISTIC E2E SEEDER');
  console.log(` Target Database: ${sanitizedUri}`);
  console.log('====================================================\n');

  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
    console.log(' Connected to database successfully.\n');

    const results = [];

    for (const accountDef of DETERMINISTIC_TEST_ACCOUNTS) {
      let existing = await User.findOne({ email: accountDef.email });

      if (existing) {
        // Idempotent deterministic update: restore canonical test attributes
        existing.fullName = accountDef.fullName;
        existing.phoneNumber = accountDef.phoneNumber;
        existing.role = accountDef.role;
        existing.approvalStatus = accountDef.approvalStatus;
        existing.isSuspended = false;
        existing.isBlocked = false;
        existing.isOnline = accountDef.isOnline || false;

        if (accountDef.currentLocation) {
          existing.currentLocation = accountDef.currentLocation;
        }

        if (accountDef.driverProfile) {
          existing.driverProfile = accountDef.driverProfile;
        }

        // Trigger pre-save hook for password hash & invariant checks
        existing.password = accountDef.password;
        await existing.save();

        console.log(` [UPDATED] ${accountDef.role.toUpperCase().padEnd(10)} | ${accountDef.email} (ID: ${existing._id})`);
        results.push({ email: accountDef.email, role: accountDef.role, action: 'updated', id: existing._id });
      } else {
        // Clean creation
        const created = new User(accountDef);
        await created.save();

        console.log(` [CREATED] ${accountDef.role.toUpperCase().padEnd(10)} | ${accountDef.email} (ID: ${created._id})`);
        results.push({ email: accountDef.email, role: accountDef.role, action: 'created', id: created._id });
      }
    }

    console.log(`\n Successfully established ${results.length} deterministic test accounts.`);
    return results;
  } catch (err) {
    console.error(` Seeder Failure: ${err.message}`);
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
