import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const initializeSockets = (server) => {
  const io = new Server(server, {
    cors: { origin: '*', methods: ['GET', 'POST', 'PUT'] }
  });

  // BUG 7 FIXED: JWT Handshake Middleware (No unauthorized access)
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
    if (!token) return next(new Error('Authentication error: No token provided'));
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded; // Attach verified user to socket
      next();
    } catch (err) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🟢 Authenticated Device Connected: ${socket.user.id}`);
    
    // Automatically join their secure private room
    socket.join(socket.user.id);

    socket.on('driver:location-update', async (data) => {
      // BUG 8 FIXED: Never trust client payload for identity. Use socket.user.id
      const driverId = socket.user.id;
      const { latitude, longitude } = data;
      
      await User.findByIdAndUpdate(driverId, { 
        currentLocation: { type: 'Point', coordinates: [longitude, latitude] }
      });

      socket.broadcast.emit('map:driver-moved', { driverId, latitude, longitude });
    });

    // BUG 2 FIXED: Removed 'ride:new-request' and 'ride:accepted' listeners. 
    // The HTTP Controllers are now the absolute single source of truth for matchmaking.

    socket.on('disconnect', () => {
      console.log(`🔴 Device Disconnected: ${socket.user.id}`);
    });
  });

  return io;
};