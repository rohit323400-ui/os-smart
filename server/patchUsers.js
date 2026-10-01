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

async function patchSchema() {
  const pool = mysql.createPool(dbConfig);
  const conn = await pool.getConnection();

  console.log('🔧 Inspecting and patching users table columns...');

  const [cols] = await conn.query(
    "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'raah_nagar_db' AND TABLE_NAME = 'users'"
  );
  const colNames = cols.map(c => c.COLUMN_NAME);

  if (!colNames.includes('role')) {
    console.log('➕ Adding column: role');
    await conn.query("ALTER TABLE users ADD COLUMN role ENUM('Resident', 'Facility Admin', 'Security Guard', 'Maintenance Tech', 'Super Admin') NOT NULL DEFAULT 'Resident'");
  }
  if (!colNames.includes('flat_number')) {
    console.log('➕ Adding column: flat_number');
    await conn.query("ALTER TABLE users ADD COLUMN flat_number VARCHAR(50) DEFAULT 'A-101'");
  }
  if (!colNames.includes('password_hash')) {
    console.log('➕ Adding column: password_hash');
    await conn.query("ALTER TABLE users ADD COLUMN password_hash VARCHAR(255) DEFAULT NULL");
  }
  if (!colNames.includes('emergency_contact')) {
    console.log('➕ Adding column: emergency_contact');
    await conn.query("ALTER TABLE users ADD COLUMN emergency_contact VARCHAR(30) DEFAULT NULL");
  }
  if (!colNames.includes('vehicle_number')) {
    console.log('➕ Adding column: vehicle_number');
    await conn.query("ALTER TABLE users ADD COLUMN vehicle_number VARCHAR(50) DEFAULT NULL");
  }
  if (!colNames.includes('is_verified')) {
    console.log('➕ Adding column: is_verified');
    await conn.query("ALTER TABLE users ADD COLUMN is_verified TINYINT(1) DEFAULT 1");
  }
  if (!colNames.includes('reset_otp')) {
    console.log('➕ Adding column: reset_otp');
    await conn.query("ALTER TABLE users ADD COLUMN reset_otp VARCHAR(10) DEFAULT NULL");
  }
  if (!colNames.includes('reset_otp_expires')) {
    console.log('➕ Adding column: reset_otp_expires');
    await conn.query("ALTER TABLE users ADD COLUMN reset_otp_expires BIGINT DEFAULT NULL");
  }

  // Populate data
  await conn.query("UPDATE users SET password_hash = password WHERE password_hash IS NULL AND password IS NOT NULL");
  await conn.query("UPDATE users SET flat_number = flat_no WHERE (flat_number IS NULL OR flat_number = 'A-101') AND flat_no IS NOT NULL");

  // Make old columns flexible
  await conn.query("ALTER TABLE users MODIFY COLUMN password VARCHAR(255) NULL");
  await conn.query("ALTER TABLE users MODIFY COLUMN flat_no VARCHAR(50) NULL");

  // Ensure default demo users exist with valid bcrypt hash
  const [existingAdmin] = await conn.query("SELECT * FROM users WHERE email = 'admin@society.com'");
  if (existingAdmin.length === 0) {
    console.log('🌱 Seeding Facility Admin user (admin@society.com)...');
    await conn.query(`
      INSERT INTO users (id, name, email, password, password_hash, role, flat_no, flat_number, phone)
      VALUES ('u-admin', 'Priya Patel (Admin)', 'admin@society.com', '123456', '$2a$10$E8.3G/pD0HjJzSgO1.vO3.lE.aT4J.H.29Z/vXp3Q/LqZk2m2b4C.', 'Facility Admin', 'Management Office', 'Management Office', '+91 98765 11111')
    `);
  } else {
    await conn.query("UPDATE users SET role = 'Facility Admin' WHERE email = 'admin@society.com'");
  }

  const [existingResident] = await conn.query("SELECT * FROM users WHERE email = 'rahul@society.com'");
  if (existingResident.length === 0) {
    console.log('🌱 Seeding Resident user (rahul@society.com)...');
    await conn.query(`
      INSERT INTO users (id, name, email, password, password_hash, role, flat_no, flat_number, phone)
      VALUES ('u-resident', 'Rahul Sharma', 'rahul@society.com', '123456', '$2a$10$E8.3G/pD0HjJzSgO1.vO3.lE.aT4J.H.29Z/vXp3Q/LqZk2m2b4C.', 'Resident', 'A-101', 'A-101', '+91 98765 43210')
    `);
  }

  console.log('✅ Users table successfully patched and verified!');
  conn.release();
  process.exit(0);
}

patchSchema().catch(err => {
  console.error('Patch error:', err);
  process.exit(1);
});
