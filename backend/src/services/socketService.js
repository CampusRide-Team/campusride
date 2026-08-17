import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

export const initializeSockets = (server) => {
  const io = new Server(server, {
    cors: { origin: '*', methods: ['GET', 'POST', 'PUT'] }
  });

  io.use((socket, next) => {
  try {
    let token = socket.handshake.auth?.token || socket.handshake.headers?.authorization;
    if (!token) {
      console.log(" Socket Authentication Attempt. Token found: NO TOKEN");
      return next(new Error("No token provided"));
    }

    // Clean up "Bearer " prefix if present
    if (token.startsWith("Bearer ")) {
      token = token.slice(7, token.length).trim();
    }

    console.log(` Socket Authentication Attempt. Token found: YES (Length: ${token.length})`);
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded;
    next();
  } catch (err) {
    console.error(" JWT Verification Error:", err.message);
    next(new Error("invalid token"));
  }
});

  io.on('connection', (socket) => {
    const userId = socket.user?.id || socket.user?._id || socket.user?.userId;
    
    if (userId) {
      socket.join(userId.toString());
      console.log(` Driver successfully joined personal room: ${userId}`);
    } else {
      console.log("Socket connected, but socket.user object is missing or invalid:", socket.user);
    }

    socket.on('disconnect', () => {
      console.log(`Driver Disconnected: ${userId || 'Unknown'}`);
    });
  });

  return io;
};