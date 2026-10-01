import jwt from 'jsonwebtoken';
import { query } from '../db.js';
import { hasPermission } from '../rbac.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_society_jwt_key_2026';

// ⏱️ Sliding Window Rate Limiter (In-Memory per IP)
const rateLimitMap = new Map();

export function rateLimit({ windowMs = 60000, maxRequests = 100, message = 'Too many requests, please try again later.' }) {
  return (req, res, next) => {
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
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
    
    // Check if user exists in MySQL database
    try {
      const users = await query('SELECT id, name, email, role, flat_number, phone, is_verified FROM users WHERE id = ?', [decoded.id]);
      if (users.length === 0) {
        return res.status(401).json({
          success: false,
          error: 'User account associated with this token no longer exists.'
        });
      }
      req.user = users[0];
    } catch (dbErr) {
      // If DB read fails, fallback to decoded JWT claims
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

// 🛡️ Direct Role Restriction Middleware (e.g. ['Facility Admin', 'Super Admin'])
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
