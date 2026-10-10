import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { getJwtSecret } from '../config/jwtConfig.js';

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, getJwtSecret());

      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return res.status(401).json({
          success: false,
          error: { code: 'USER_NOT_FOUND', message: 'User account no longer exists' }
        });
      }

      // Immediate Suspension Enforcement
      if (user.isSuspended || user.isBlocked) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'ACCOUNT_SUSPENDED',
            message: 'Your account has been suspended by administration.'
          }
        });
      }

      // Transitional role normalization: normalize 'student' to 'passenger'
      if (user.role === 'student') {
        user.role = 'passenger';
      }

      req.user = user;
      return next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: { code: 'TOKEN_EXPIRED', message: 'Authentication token has expired. Please log in again.' }
        });
      }
      return res.status(401).json({
        success: false,
        error: { code: 'TOKEN_INVALID', message: 'Authentication token is invalid or malformed.' }
      });
    }
  }

  return res.status(401).json({
    success: false,
    error: { code: 'AUTH_NO_TOKEN', message: 'Not authorized, no bearer token provided.' }
  });
};

/**
 * Enforces specific role authorization (accepts single role string or array of roles)
 */
export const requireRole = (roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
    });
  }

  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  
  // Account for transitional role equivalency: 'passenger' is equivalent to 'student'
  const effectiveUserRole = req.user.role === 'student' ? 'passenger' : req.user.role;
  const isMatch = allowedRoles.some(r => r === effectiveUserRole || (r === 'passenger' && req.user.role === 'student'));

  if (isMatch) {
    return next();
  }

  return res.status(403).json({
    success: false,
    error: {
      code: 'FORBIDDEN',
      message: `Access denied. Requires one of [${allowedRoles.join(', ')}] role.`
    }
  });
};

/**
 * Passenger Role Guard (permits canonical 'passenger' and transitional 'student')
 */
export const requirePassenger = (req, res, next) => {
  return requireRole(['passenger', 'student'])(req, res, next);
};

/**
 * Approved Driver Guard.
 * Enforces that driver account is approved by administration and not suspended.
 */
export const requireApprovedDriver = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
    });
  }

  if (req.user.role !== 'driver') {
    return res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Access denied. Requires driver role.' }
    });
  }

  const isApproved = req.user.approvalStatus === 'approved' || req.user.isApproved === true;
  if (!isApproved) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'PENDING_APPROVAL',
        message: 'Driver account is pending administrator verification and approval.'
      }
    });
  }

  return next();
};

/**
 * Admin Role Guard
 */
export const requireAdmin = (req, res, next) => {
  return requireRole('admin')(req, res, next);
};