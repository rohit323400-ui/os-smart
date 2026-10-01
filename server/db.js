import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: 'raah_nagar_db',
  waitForConnections: true,
  connectionLimit: 15,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000
};

let pool = null;
let isDbConnected = false;

try {
  pool = mysql.createPool(dbConfig);
  // Test connection
  pool.getConnection()
    .then((conn) => {
      isDbConnected = true;
      console.log('🏛️ Production MySQL Database Connected: raah_nagar_db on port', dbConfig.port);
      conn.release();
    })
    .catch((err) => {
      console.warn('⚠️ Could not connect to MySQL server:', err.message);
      isDbConnected = false;
    });
} catch (err) {
  console.warn('⚠️ MySQL pool initialization error:', err.message);
}

export function isConnected() {
  return isDbConnected;
}

export async function query(sql, params = []) {
  if (!pool) {
    throw new Error('Database pool not initialized');
  }
  const [results] = await pool.query(sql, params);
  return results;
}

// 🛡️ Audit Log Helper: Records who performed what action, previous value and new value
export async function recordAuditLog({ userId = 'SYSTEM', userRole = 'SYSTEM', action, entityType, entityId = null, oldValue = null, newValue = null, ip = null }) {
  try {
    if (!pool) return;
    const oldJson = oldValue ? JSON.stringify(oldValue) : null;
    const newJson = newValue ? JSON.stringify(newValue) : null;
    await pool.query(
      `INSERT INTO audit_logs (user_id, user_role, action, entity_type, entity_id, old_value, new_value, ip_address) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, userRole, action, entityType, entityId, oldJson, newJson, ip]
    );
  } catch (err) {
    console.error('Audit log recording failed:', err.message);
  }
}

// 🏢 Verify if a flat exists in society registry
export async function verifyFlatRegistry(flatNumber) {
  try {
    if (!pool) return true; // fallback if db is not ready
    const [rows] = await pool.query('SELECT * FROM society_flats WHERE flat_number = ?', [flatNumber]);
    return rows.length > 0 ? rows[0] : null;
  } catch (err) {
    console.error('Error verifying flat registry:', err.message);
    return null;
  }
}

// ⚡ Command vs Actual State pattern tracker
export async function createDeviceCommand({ deviceId, deviceType, command, requestedBy }) {
  try {
    const commandId = 'cmd-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    await query(
      `INSERT INTO device_commands (id, device_id, device_type, command, requested_by, status)
       VALUES (?, ?, ?, ?, ?, 'PENDING')`,
      [commandId, deviceId, deviceType, command, requestedBy]
    );
    return commandId;
  } catch (err) {
    console.error('Failed to create device command:', err.message);
    throw err;
  }
}

export async function confirmDeviceCommand(commandId, status = 'CONFIRMED', errorMessage = null) {
  try {
    await query(
      `UPDATE device_commands 
       SET status = ?, error_message = ?, confirmed_at = NOW() 
       WHERE id = ?`,
      [status, errorMessage, commandId]
    );
  } catch (err) {
    console.error('Failed to update device command:', err.message);
  }
}

export default {
  query,
  isConnected,
  recordAuditLog,
  verifyFlatRegistry,
  createDeviceCommand,
  confirmDeviceCommand
};
