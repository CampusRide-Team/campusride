import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return res.status(401).json({ success: false, error: { code: 'AUTH_FAILED', message: 'User no longer exists' } });
      }

      // IMMEDIATE SUSPENSION ENFORCEMENT CHECK
      if (user.isSuspended || user.isBlocked) {
        return res.status(403).json({ 
          success: false, 
          error: { 
            code: 'ACCOUNT_SUSPENDED', 
            message: 'Your account has been suspended by administration.' 
          } 
        });
      }

      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({ success: false, error: { code: 'AUTH_FAILED', message: 'Not authorized, token failed or expired' } });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, error: { code: 'AUTH_FAILED', message: 'Not authorized, no token provided' } });
  }
};

export const requireRole = (role) => (req, res, next) => {
  if (req.user && req.user.role === role) {
    next();
  } else {
    res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: `Access denied. Requires ${role} role.` } });
  }
};