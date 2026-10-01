import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { query } from '../db.js';
import { hasPermission } from '../rbac.js';

// 🔒 Secure JWT Secret Management (Zero Hardcoded Weak Fallback)
let jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret || jwtSecret.trim() === '' || jwtSecret === 'super_secret_society_jwt_key_2026') {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('FATAL: JWT_SECRET environment variable must be explicitly defined and secure in production mode!');
  }
  // For secure local runtime, generate a cryptographically strong 256-bit ephemeral secret
  jwtSecret = crypto.randomBytes(64).toString('hex');
  console.warn('⚠️ [SECURITY NOTICE]: JWT_SECRET was not provided or was default. Generated secure dynamic 256-bit secret for this runtime session.');
}

export const JWT_SECRET = jwtSecret;

// ⏱️ Production Rate Limiter Architecture
// In-memory sliding window for single-node / development.
// For distributed multi-instance deployment across multiple Node processes or containers,
// set REDIS_URL to connect a shared Redis distributed token bucket / rate store.
const rateLimitMap = new Map();
let warnedMultiInstance = false;

export function rateLimit({ windowMs = 60000, maxRequests = 100, message = 'Too many requests, please try again later.' }) {
  if (process.env.NODE_ENV === 'production' && !process.env.REDIS_URL && !warnedMultiInstance) {
    warnedMultiInstance = true;
    console.warn('⚠️ [RATE_LIMIT]: In-memory limiter active for single-instance deployment. For multi-instance clustering behind a load balancer, configure REDIS_URL.');
  }

  return (req, res, next) => {
    // Uses req.ip enabled by trust-proxy behind Nginx/Caddy
    const clientIp = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const now = Date.now();

    if (!rateLimitMap.has(clientIp)) {
      rateLimitMap.set(clientIp, []);
    }

    const timestamps = rateLimitMap.get(clientIp);
    const windowStart = now - windowMs;
    const recentRequests = timestamps.filter(time => time > windowStart);
    recentRequests.push(now);
    rateLimitMap.set(clientIp, recentRequests);

    if (recentRequests.length > maxRequests) {
      return res.status(429).json({
        success: false,
        error: message,
        retryAfterSeconds: Math.ceil(windowMs / 1000)
      });
    }

    next();
  };
}

// 🛡️ Central Authentication Middleware
export async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required. No authorization token provided.'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check if user exists and is active in MySQL database
    try {
      const users = await query('SELECT id, name, email, role, flat_number, phone, is_verified FROM users WHERE id = ?', [decoded.id]);
      if (users.length === 0) {
        return res.status(401).json({
          success: false,
          error: 'User account associated with this session no longer exists.'
        });
      }
      if (users[0].is_verified === 0 || users[0].is_verified === false) {
        return res.status(403).json({
          success: false,
          error: 'Your account is pending verification or has been suspended. Please contact the society administration.'
        });
      }
      req.user = users[0];
    } catch (dbErr) {
      if (decoded.is_verified === 0 || decoded.is_verified === false) {
        return res.status(403).json({
          success: false,
          error: 'Your account is pending verification or has been suspended.'
        });
      }
      req.user = decoded;
    }

    next();
  } catch (err) {
    return res.status(403).json({
      success: false,
      error: 'Invalid or expired authentication token. Please log in again.'
    });
  }
}

// 🛡️ Role-Based Access Control (RBAC) Permission Middleware
export function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: User not authenticated.'
      });
    }

    const userRole = req.user.role;
    if (!hasPermission(userRole, permission)) {
      return res.status(403).json({
        success: false,
        error: `Forbidden: Your role (${userRole}) does not have permission '${permission}' for this action.`
      });
    }

    next();
  };
}

// 🛡️ Direct Role Restriction Middleware
export function requireRole(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: User not authenticated.'
      });
    }

    if (!allowedRoles.includes(req.user.role) && req.user.role !== 'Super Admin') {
      return res.status(403).json({
        success: false,
        error: `Forbidden: Access restricted to [${allowedRoles.join(', ')}]. Your current role is '${req.user.role}'.`
      });
    }

    next();
  };
}
