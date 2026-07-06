import adminRoutes from './src/routes/adminRoutes.js';
import { initCronJobs } from './src/services/cronService.js';
import uploadRoutes from './src/routes/uploadRoutes.js';
import rideRoutes from './src/routes/rideRoutes.js';
import driverRoutes from './src/routes/driverRoutes.js';
import { initializeSockets } from './src/services/socketService.js';
import authRoutes from './src/routes/authRoutes.js';
import express from 'express';
import http from 'http';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import connectDB from './src/config/db.js';
import { errorHandler, notFound } from './src/middleware/errorHandler.js';

dotenv.config();

connectDB();
const app = express();
const server = http.createServer(app);

app.use(helmet());
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/driver', driverRoutes);
app.use('/api/v1/rides', rideRoutes);
app.use('/api/v1/upload', uploadRoutes);
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}



app.get('/api/health', (req, res) => res.json({ success: true, data: { message: 'CampusRide V2 Backend is Live' } }));
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
// Initialize Real-Time WebSockets
const io = initializeSockets(server);
app.set('io', io); // Make 'io' available in our API controllers

// Start Background Tasks
initCronJobs();

server.listen(PORT, () => console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`));