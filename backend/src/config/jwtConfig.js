/**
 * Canonical JWT Secret Resolver
 * 
 * Centralizes JWT secret resolution across:
 * 1. Token signing (authController.js)
 * 2. REST route authentication verification (authMiddleware.js)
 * 3. Socket.IO handshake verification (socketService.js)
 * 
 * In production/staging, process.env.JWT_SECRET is authoritative.
 * In development/test with no env var set, a single consistent fallback is used everywhere.
 */
export const getJwtSecret = () => {
  return process.env.JWT_SECRET || 'campusride_super_secret_key_2026';
};
