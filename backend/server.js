import express from 'express';
import http from 'http';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import fs from 'fs';

// 1. Instantly parse environment conditions
dotenv.config();
import connectDB from './src/config/db.js';

// 2. Import Modular Routers
import adminRoutes from './src/routes/adminRoutes.js';
import uploadRoutes from './src/routes/uploadRoutes.js';
import rideRoutes from './src/routes/rideRoutes.js';
import driverRoutes from './src/routes/driverRoutes.js';
import authRoutes from './src/routes/authRoutes.js';

// 3. Import System Services & Core Middlewares
import { initCronJobs } from './src/services/cronService.js';
import { initializeSockets } from './src/services/socketService.js';
import { errorHandler, notFound } from './src/middleware/errorHandler.js';

const app = express();
const server = http.createServer(app);
app.set('trust proxy', 1);

//  Ensure uploads directory exists on disk on server startup
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 4. Global Production Shield Middlewares (Configure Helmet to allow cross-origin media loading)
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(cors());
app.use(express.json());

//  4b. SERVE UPLOADS DIRECTORY AS STATIC ASSETS FOR DOCUMENT VIEWING
app.use('/uploads', express.static(uploadDir));

if (process.env.NODE_ENV === 'development') { 
  app.use(morgan('dev'));
}

// 5. REST API Route Bindings
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/driver', driverRoutes);
app.use('/api/v1/rides', rideRoutes);
app.use('/api/v1/upload', uploadRoutes);

app.get('/api/health', (req, res) => res.json({ success: true, data: { message: 'CampusRide V2 Backend Engine is Live' } }));

// 6. Global Catch Handlers
app.use(notFound);
app.use(errorHandler);

// 7. Initialize Real-Time Transport Handshakes
const io = initializeSockets(server);
app.set('io', io); 

// 8. Safe Execution Pipeline Bootstrapper
const startApplication = async () => {
  try {
    // Force runtime execution engine to wait until Atlas database is live
    await connectDB();
    
    // Background automation systems initialization
    initCronJobs();
    
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(` CampusRide V2 Core Engine Online [Production Ready]`);
      console.log(`Operational traffic active on port: ${PORT}`);
    });
  } catch (error) {
    console.error(` Critical Operational Bootstrapper Fault: ${error.message}`);
    process.exit(1);
  }
};

startApplication();