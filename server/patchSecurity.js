import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: 'raah_nagar_db'
};

async function patchSecurity() {
  console.log('🔒 Hardening Database Schema for Production Security...');
  const pool = mysql.createPool(dbConfig);
  const conn = await pool.getConnection();

  // 1. User Settings - add settings_json for granular per-user configuration
  const [usCols] = await conn.query(
    "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'raah_nagar_db' AND TABLE_NAME = 'user_settings'"
  );
  const usColNames = usCols.map(c => c.COLUMN_NAME);
  if (!usColNames.includes('settings_json')) {
    console.log('➕ Adding settings_json to user_settings');
    await conn.query("ALTER TABLE user_settings ADD COLUMN settings_json JSON DEFAULT NULL");
  }

  // 2. Users Table - add reset_otp_hash and reset_otp_attempts
  const [uCols] = await conn.query(
    "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'raah_nagar_db' AND TABLE_NAME = 'users'"
  );
  const uColNames = uCols.map(c => c.COLUMN_NAME);
  if (!uColNames.includes('reset_otp_hash')) {
    console.log('➕ Adding reset_otp_hash to users');
    await conn.query("ALTER TABLE users ADD COLUMN reset_otp_hash VARCHAR(255) DEFAULT NULL");
  }
  if (!uColNames.includes('reset_otp_attempts')) {
    console.log('➕ Adding reset_otp_attempts to users');
    await conn.query("ALTER TABLE users ADD COLUMN reset_otp_attempts INT DEFAULT 0");
  }
  if (uColNames.includes('reset_otp')) {
    console.log('🗑️ Removing insecure plaintext reset_otp from users');
    await conn.query("ALTER TABLE users DROP COLUMN reset_otp");
  }

  // 3. Visitor Requests - add otp_hash and otp_attempts
  const [vCols] = await conn.query(
    "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'raah_nagar_db' AND TABLE_NAME = 'visitor_requests'"
  );
  const vColNames = vCols.map(c => c.COLUMN_NAME);
  if (!vColNames.includes('otp_hash')) {
    console.log('➕ Adding otp_hash to visitor_requests');
    await conn.query("ALTER TABLE visitor_requests ADD COLUMN otp_hash VARCHAR(255) DEFAULT NULL");
  }
  if (!vColNames.includes('otp_attempts')) {
    console.log('➕ Adding otp_attempts to visitor_requests');
    await conn.query("ALTER TABLE visitor_requests ADD COLUMN otp_attempts INT DEFAULT 0");
  }

  // 4. Waste Bins - add vendor dispatch info
  const [wbCols] = await conn.query(
    "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'raah_nagar_db' AND TABLE_NAME = 'waste_bins'"
  );
  const wbColNames = wbCols.map(c => c.COLUMN_NAME);
  if (!wbColNames.includes('vendor_name')) {
    console.log('➕ Adding vendor_name to waste_bins');
    await conn.query("ALTER TABLE waste_bins ADD COLUMN vendor_name VARCHAR(100) DEFAULT NULL");
  }

  console.log('✅ Security Schema Hardening Complete!');
  conn.release();
  process.exit(0);
}

patchSecurity().catch(err => {
  console.error('Security patch error:', err);
  process.exit(1);
});
