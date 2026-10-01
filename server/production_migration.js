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

export async function runProductionMigration() {
  console.log('🚀 Running Comprehensive Production Database Migration for raah_nagar_db...');
  const connection = await mysql.createConnection(dbConfig);

  try {
    // 1. Users Table: Ensure is_verified is NOT NULL DEFAULT 1
    const [userCols] = await connection.query("SHOW COLUMNS FROM users LIKE 'is_verified'");
    if (userCols.length === 0) {
      console.log('➕ Adding is_verified column to users');
      await connection.query("ALTER TABLE users ADD COLUMN is_verified TINYINT(1) NOT NULL DEFAULT 1");
    } else {
      await connection.query("ALTER TABLE users MODIFY COLUMN is_verified TINYINT(1) NOT NULL DEFAULT 1");
      await connection.query("UPDATE users SET is_verified = 1 WHERE is_verified IS NULL");
    }

    // 2. Visitor Requests: Drop plaintext otp_code, ensure otp_hash and security fields
    const [visitorCols] = await connection.query("SHOW COLUMNS FROM visitor_requests");
    const colNames = visitorCols.map(c => c.Field);

    if (colNames.includes('otp_code')) {
      console.log('🗑️ Dropping plaintext otp_code column from visitor_requests');
      await connection.query("ALTER TABLE visitor_requests DROP COLUMN otp_code");
    }

    if (!colNames.includes('otp_hash')) {
      console.log('➕ Adding otp_hash column to visitor_requests');
      await connection.query("ALTER TABLE visitor_requests ADD COLUMN otp_hash VARCHAR(64) DEFAULT NULL");
    } else {
      await connection.query("ALTER TABLE visitor_requests MODIFY COLUMN otp_hash VARCHAR(64) DEFAULT NULL");
    }

    if (!colNames.includes('otp_attempts')) {
      console.log('➕ Adding otp_attempts column to visitor_requests');
      await connection.query("ALTER TABLE visitor_requests ADD COLUMN otp_attempts INT NOT NULL DEFAULT 0");
    }

    if (!colNames.includes('valid_until')) {
      console.log('➕ Adding valid_until column to visitor_requests');
      await connection.query("ALTER TABLE visitor_requests ADD COLUMN valid_until DATETIME NOT NULL DEFAULT (CURRENT_TIMESTAMP + INTERVAL 6 HOUR)");
    }

    if (!colNames.includes('verified_by_guard_id')) {
      console.log('➕ Adding verified_by_guard_id column to visitor_requests');
      await connection.query("ALTER TABLE visitor_requests ADD COLUMN verified_by_guard_id VARCHAR(64) DEFAULT NULL");
    }

    // 3. IoT Devices Registry Table
    console.log('🛠️ Creating or verifying iot_devices table');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS iot_devices (
        id VARCHAR(64) PRIMARY KEY,
        device_name VARCHAR(100) NOT NULL,
        device_type VARCHAR(50) NOT NULL,
        location VARCHAR(100) NOT NULL,
        status ENUM('ONLINE', 'OFFLINE', 'NOT_CONNECTED', 'MAINTENANCE') NOT NULL DEFAULT 'NOT_CONNECTED',
        last_seen DATETIME DEFAULT NULL,
        ip_address VARCHAR(45) DEFAULT NULL,
        firmware_version VARCHAR(30) DEFAULT '1.0.0',
        metadata_json JSON DEFAULT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

    // Seed IoT Device Registry with initial hardware entries (status: NOT_CONNECTED until real telemetry arrives)
    console.log('🌱 Seeding iot_devices registry');
    const initialDevices = [
      ['PUMP-MAIN-01', 'Main Water Pump #1', 'WATER_PUMP', 'Main Pump Room', 'NOT_CONNECTED'],
      ['PUMP-STP-01', 'STP Recycled Water Pump', 'WATER_PUMP', 'STP Plant Basement', 'NOT_CONNECTED'],
      ['VALVE-MAIN-V102', 'Motorized Isolation Valve V-102', 'WATER_VALVE', 'Block B Service Shaft', 'NOT_CONNECTED'],
      ['TANK-OH-01', 'Tower A Overhead Tank Sensor', 'LEVEL_SENSOR', 'Tower A Rooftop', 'NOT_CONNECTED'],
      ['TANK-SUMP-01', 'Central Underground Sump Sensor', 'LEVEL_SENSOR', 'Central Ground Basin', 'NOT_CONNECTED'],
      ['FIRE-SMOKE-Z1', 'Smoke & Thermal Detector Multi-Zone 1', 'FIRE_SENSOR', 'Tower A Shaft & Corridors', 'NOT_CONNECTED'],
      ['FIRE-SMOKE-Z2', 'Smoke Detector Multi-Zone 2', 'FIRE_SENSOR', 'Clubhouse & Basement Parking', 'NOT_CONNECTED'],
      ['LIFT-A-01', 'Smart Elevator Controller - Tower A', 'ELEVATOR', 'Tower A Core Shaft', 'NOT_CONNECTED'],
      ['LIFT-B-01', 'Smart Elevator Controller - Tower B', 'ELEVATOR', 'Tower B Core Shaft', 'NOT_CONNECTED'],
      ['BIN-BIO-01', 'Biodegradable Waste Bin Sensor', 'WASTE_BIN', 'Central Waste Station A', 'NOT_CONNECTED'],
      ['BIN-NONBIO-01', 'Non-Biodegradable Bin Sensor', 'WASTE_BIN', 'Central Waste Station B', 'NOT_CONNECTED'],
      ['NOISE-SN-B304', 'Acoustic Decibel Monitor B-304', 'NOISE_SENSOR', 'Tower B Corridor L3', 'NOT_CONNECTED'],
      ['GATE-MAIN-01', 'Smart RFID/QR Barrier Gate', 'ACCESS_GATE', 'Main Society Gate 1', 'NOT_CONNECTED']
    ];

    for (const dev of initialDevices) {
      await connection.query(`
        INSERT INTO iot_devices (id, device_name, device_type, location, status)
        VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
          device_name = VALUES(device_name),
          device_type = VALUES(device_type),
          location = VALUES(location);
      `, dev);
    }

    // 4. Telemetry History Table
    console.log('🛠️ Creating or verifying telemetry_history table');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS telemetry_history (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        device_id VARCHAR(64) NOT NULL,
        device_type VARCHAR(50) NOT NULL,
        metric_name VARCHAR(50) NOT NULL,
        metric_value DECIMAL(10, 2) NOT NULL,
        unit VARCHAR(20) NOT NULL,
        status VARCHAR(30) NOT NULL DEFAULT 'NORMAL',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_device_time (device_id, created_at),
        INDEX idx_metric_time (metric_name, created_at)
      ) ENGINE=InnoDB;
    `);

    // 5. Device Commands Table verification
    console.log('🛠️ Verifying device_commands table');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS device_commands (
        id VARCHAR(64) PRIMARY KEY,
        device_id VARCHAR(64) NOT NULL,
        device_type VARCHAR(50) NOT NULL,
        command VARCHAR(100) NOT NULL,
        requested_by VARCHAR(64) NOT NULL,
        status ENUM('PENDING', 'SENT', 'ACKNOWLEDGED', 'CONFIRMED', 'FAILED', 'TIMEOUT', 'REJECTED') DEFAULT 'PENDING',
        error_message VARCHAR(255) DEFAULT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        confirmed_at DATETIME DEFAULT NULL
      ) ENGINE=InnoDB;
    `);

    console.log('✅ Production migration executed successfully!');
    await connection.end();
    return true;
  } catch (err) {
    console.error('❌ Migration failed:', err);
    await connection.end();
    throw err;
  }
}

if (process.argv[1] && process.argv[1].endsWith('production_migration.js')) {
  runProductionMigration()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
