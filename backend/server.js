import express from 'express';
import http from 'http';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

// 1. Load config and DB first
dotenv.config();
import connectDB from './src/config/db.js';
connectDB();

// 2. Import Routes
import adminRoutes from './src/routes/adminRoutes.js';
import uploadRoutes from './src/routes/uploadRoutes.js';
import rideRoutes from './src/routes/rideRoutes.js';
import driverRoutes from './src/routes/driverRoutes.js';
import authRoutes from './src/routes/authRoutes.js';

// 3. Import Services & Middleware
import { initCronJobs } from './src/services/cronService.js';
import { initializeSockets } from './src/services/socketService.js';
import { errorHandler, notFound } from './src/middleware/errorHandler.js';

const app = express();
const server = http.createServer(app);
app.set('trust proxy', 1);

// 4. Global Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

if (process.env.NODE_ENV === 'development') { 
  app.use(morgan('dev'));
}

// 5. API Routes
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/driver', driverRoutes);
app.use('/api/v1/rides', rideRoutes);
app.use('/api/v1/upload', uploadRoutes);

app.get('/api/health', (req, res) => res.json({ success: true, data: { message: 'CampusRide V2 Backend is Live' } }));

// 6. Error Handlers (ALWAYS at the very bottom, after all routes!)
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// 7. Initialize Real-Time WebSockets
const io = initializeSockets(server);
app.set('io', io); 

// 8. Start Background Tasks
initCronJobs();

// 9. Start Server Listening
server.listen(PORT, () => console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`));
