import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      req.user = await User.findById(decoded.id).select('-password');
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