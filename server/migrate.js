import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: 'raah_nagar_db',
  multipleStatements: true
};

export async function runMigration() {
  console.log('🚀 Running Production Schema Migration for raah_nagar_db...');
  const pool = mysql.createPool(dbConfig);

  try {
    const connection = await pool.getConnection();
    console.log('✅ Connected to MySQL database successfully!');

    // 1. Flats & Society Verification Registry
    await connection.query(`
      CREATE TABLE IF NOT EXISTS society_flats (
        id VARCHAR(64) PRIMARY KEY,
        tower VARCHAR(50) NOT NULL,
        floor INT NOT NULL,
        flat_number VARCHAR(50) NOT NULL UNIQUE,
        owner_name VARCHAR(100) NOT NULL,
        owner_contact VARCHAR(30) NOT NULL,
        occupancy_status ENUM('Owner-Occupied', 'Rented', 'Vacant') DEFAULT 'Owner-Occupied',
        is_verified TINYINT(1) DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

    // 2. Users Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(150) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role ENUM('Resident', 'Facility Admin', 'Security Guard', 'Maintenance Tech', 'Super Admin') NOT NULL DEFAULT 'Resident',
        flat_number VARCHAR(50) DEFAULT 'A-101',
        phone VARCHAR(30) DEFAULT NULL,
        emergency_contact VARCHAR(30) DEFAULT NULL,
        vehicle_number VARCHAR(50) DEFAULT NULL,
        is_verified TINYINT(1) DEFAULT 1,
        reset_otp VARCHAR(10) DEFAULT NULL,
        reset_otp_expires BIGINT DEFAULT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

    // 3. User Specific Notification Settings
    await connection.query(`
      CREATE TABLE IF NOT EXISTS user_settings (
        user_id VARCHAR(64) PRIMARY KEY,
        emergency_alerts TINYINT(1) DEFAULT 1,
        water_leak_alerts TINYINT(1) DEFAULT 1,
        visitor_gate_alerts TINYINT(1) DEFAULT 1,
        noise_violation_alerts TINYINT(1) DEFAULT 0,
        maintenance_sms_alerts TINYINT(1) DEFAULT 0,
        marketing_notifications TINYINT(1) DEFAULT 0,
        theme ENUM('dark', 'light') DEFAULT 'dark',
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    // 4. Audit Log Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(64) DEFAULT 'SYSTEM',
        user_role VARCHAR(50) DEFAULT 'SYSTEM',
        action VARCHAR(100) NOT NULL,
        entity_type VARCHAR(50) NOT NULL,
        entity_id VARCHAR(64) DEFAULT NULL,
        old_value JSON DEFAULT NULL,
        new_value JSON DEFAULT NULL,
        ip_address VARCHAR(45) DEFAULT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

    // 5. Water Metrics & Telemetry History
    await connection.query(`
      CREATE TABLE IF NOT EXISTS water_metrics (
        id INT AUTO_INCREMENT PRIMARY KEY,
        overhead_tank INT NOT NULL DEFAULT 74,
        underground_sump INT NOT NULL DEFAULT 92,
        recycled_water INT NOT NULL DEFAULT 58,
        ph_level DECIMAL(3,1) NOT NULL DEFAULT 7.2,
        tds_level INT NOT NULL DEFAULT 145,
        today_consumption_liters INT NOT NULL DEFAULT 48200,
        flow_rate_lpm INT NOT NULL DEFAULT 120,
        pump_cutoff_active TINYINT(1) NOT NULL DEFAULT 1,
        pump_operational_state ENUM('OFF', 'RUNNING', 'AUTO_CUTOFF', 'OFFLINE') DEFAULT 'OFF',
        last_quality_check VARCHAR(100) DEFAULT 'Today, 08:30 AM',
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;

      CREATE TABLE IF NOT EXISTS water_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        overhead_tank INT NOT NULL,
        underground_sump INT NOT NULL,
        flow_rate_lpm INT NOT NULL,
        tds_level INT NOT NULL,
        ph_level DECIMAL(3,1) NOT NULL
      ) ENGINE=InnoDB;
    `);

    // 6. Device Command Execution (Command vs Actual State Pattern)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS device_commands (
        id VARCHAR(64) PRIMARY KEY,
        device_id VARCHAR(64) NOT NULL,
        device_type VARCHAR(50) NOT NULL,
        command VARCHAR(100) NOT NULL,
        requested_by VARCHAR(64) NOT NULL,
        status ENUM('PENDING', 'CONFIRMED', 'FAILED', 'TIMEOUT') DEFAULT 'PENDING',
        error_message VARCHAR(255) DEFAULT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        confirmed_at DATETIME DEFAULT NULL
      ) ENGINE=InnoDB;
    `);

    // 7. Parking Slots & Vehicles
    await connection.query(`
      CREATE TABLE IF NOT EXISTS parking_slots (
        id VARCHAR(64) PRIMARY KEY,
        slot_number VARCHAR(20) NOT NULL UNIQUE,
        assigned_user_id VARCHAR(64) DEFAULT NULL,
        resident_name VARCHAR(100) DEFAULT 'Unassigned',
        is_occupied TINYINT(1) NOT NULL DEFAULT 0,
        vehicle_type VARCHAR(50) DEFAULT 'None',
        vehicle_number VARCHAR(50) DEFAULT 'N/A',
        is_ev_charging TINYINT(1) NOT NULL DEFAULT 0,
        sensor_status ENUM('ONLINE', 'OFFLINE') DEFAULT 'ONLINE',
        last_sensor_ping DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

    // 8. Fire Emergency Monitoring
    await connection.query(`
      CREATE TABLE IF NOT EXISTS fire_emergency (
        id INT AUTO_INCREMENT PRIMARY KEY,
        is_alarm_active TINYINT(1) NOT NULL DEFAULT 0,
        affected_zone VARCHAR(100) DEFAULT 'None',
        smoke_sensors_active INT DEFAULT 48,
        sprinklers_status VARCHAR(50) DEFAULT 'STANDBY',
        fire_dept_status ENUM('NOT_NOTIFIED', 'DISPATCH_PENDING', 'NOTIFIED', 'FAILED') DEFAULT 'NOT_NOTIFIED',
        evacuation_route_open TINYINT(1) DEFAULT 1,
        incident_started_at DATETIME DEFAULT NULL,
        authorized_by VARCHAR(100) DEFAULT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

    // 9. Visitor Management Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS visitor_requests (
        id VARCHAR(64) PRIMARY KEY,
        visitor_name VARCHAR(100) NOT NULL,
        phone VARCHAR(30) DEFAULT NULL,
        category ENUM('Delivery', 'Guest', 'Service', 'Cab') DEFAULT 'Guest',
        unit_number VARCHAR(50) NOT NULL,
        resident_user_id VARCHAR(64) DEFAULT NULL,
        otp_code VARCHAR(10) NOT NULL,
        valid_from DATETIME DEFAULT CURRENT_TIMESTAMP,
        valid_until DATETIME NOT NULL,
        status ENUM('PENDING', 'APPROVED', 'CHECKED_IN', 'CHECKED_OUT', 'EXPIRED', 'DENIED') DEFAULT 'PENDING',
        entry_time VARCHAR(50) DEFAULT 'Pending',
        exit_time VARCHAR(50) DEFAULT NULL,
        verified_by_guard_id VARCHAR(64) DEFAULT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

    // 10. Maintenance Desk Tickets Table with SLA
    await connection.query(`
      CREATE TABLE IF NOT EXISTS maintenance_tickets (
        id VARCHAR(64) PRIMARY KEY,
        ticket_number VARCHAR(20) NOT NULL UNIQUE,
        title VARCHAR(255) NOT NULL,
        description TEXT DEFAULT NULL,
        unit VARCHAR(100) NOT NULL,
        resident_user_id VARCHAR(64) DEFAULT NULL,
        priority ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') DEFAULT 'MEDIUM',
        status ENUM('OPEN', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED') DEFAULT 'OPEN',
        technician VARCHAR(100) DEFAULT 'Unassigned',
        sla_hours INT DEFAULT 24,
        sla_deadline DATETIME DEFAULT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        resolved_at DATETIME DEFAULT NULL
      ) ENGINE=InnoDB;
    `);

    // 11. Lift SOS Safety Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS lift_statuses (
        id VARCHAR(64) PRIMARY KEY,
        lift_name VARCHAR(100) NOT NULL,
        floor INT DEFAULT 0,
        status ENUM('NORMAL', 'SOS_TRIGGERED', 'TRAPPED_EMERGENCY', 'UNDER_MAINTENANCE') DEFAULT 'NORMAL',
        ard_battery_percent INT DEFAULT 100,
        assigned_technician VARCHAR(100) DEFAULT 'Unassigned',
        emergency_timer_minutes INT DEFAULT 0,
        last_serviced DATE DEFAULT (CURRENT_DATE),
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

    // 12. Resource Bookings (with strict concurrency & time intervals)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS resource_items (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        category VARCHAR(50) DEFAULT 'Amenity',
        price_per_hour DECIMAL(10,2) DEFAULT 0.00,
        status ENUM('AVAILABLE', 'MAINTENANCE') DEFAULT 'AVAILABLE',
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;

      CREATE TABLE IF NOT EXISTS resource_bookings (
        id VARCHAR(64) PRIMARY KEY,
        resource_id VARCHAR(64) NOT NULL,
        user_id VARCHAR(64) NOT NULL,
        user_name VARCHAR(100) NOT NULL,
        start_time DATETIME NOT NULL,
        end_time DATETIME NOT NULL,
        status ENUM('CONFIRMED', 'CANCELLED') DEFAULT 'CONFIRMED',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (resource_id) REFERENCES resource_items(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    // 13. Waste Bins & Noise
    await connection.query(`
      CREATE TABLE IF NOT EXISTS waste_bins (
        id VARCHAR(64) PRIMARY KEY,
        bin_type VARCHAR(100) NOT NULL,
        fill_percentage INT NOT NULL DEFAULT 0,
        odor_score_level INT DEFAULT 1,
        last_emptied VARCHAR(100) DEFAULT 'Today',
        status ENUM('OK', 'WARN', 'CRITICAL') DEFAULT 'OK',
        vendor_dispatched TINYINT(1) DEFAULT 0,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;

      CREATE TABLE IF NOT EXISTS noise_events (
        id INT AUTO_INCREMENT PRIMARY KEY,
        sensor_id VARCHAR(50) NOT NULL,
        zone VARCHAR(50) NOT NULL,
        decibel_level INT NOT NULL,
        is_sustained_violation TINYINT(1) DEFAULT 0,
        recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

    // Seed default flats if empty
    const [existingFlats] = await connection.query('SELECT COUNT(*) as count FROM society_flats');
    if (existingFlats[0].count === 0) {
      console.log('🌱 Seeding initial society flats registry...');
      await connection.query(`
        INSERT INTO society_flats (id, tower, floor, flat_number, owner_name, owner_contact, occupancy_status) VALUES
        ('f-1', 'Tower A', 1, 'A-101', 'Rahul Sharma', '+91 98765 43210', 'Owner-Occupied'),
        ('f-2', 'Tower A', 1, 'A-102', 'Vikas Gupta', '+91 98765 43211', 'Rented'),
        ('f-3', 'Tower B', 2, 'B-205', 'Priya Patel', '+91 98765 11111', 'Owner-Occupied'),
        ('f-4', 'Tower B', 2, 'B-206', 'Amit Verma', '+91 98765 43212', 'Owner-Occupied'),
        ('f-5', 'Tower C', 3, 'C-301', 'Sunil Mehta', '+91 98765 43213', 'Vacant'),
        ('f-6', 'Tower C', 3, 'C-302', 'Karan Singh', '+91 98765 43214', 'Owner-Occupied');
      `);
    }

    // Seed initial resources if empty
    const [existingResources] = await connection.query('SELECT COUNT(*) as count FROM resource_items');
    if (existingResources[0].count === 0) {
      console.log('🌱 Seeding initial amenities...');
      await connection.query(`
        INSERT INTO resource_items (id, name, category, price_per_hour, status) VALUES
        ('res-1', 'Community Banquet Hall', 'Event Space', 500.00, 'AVAILABLE'),
        ('res-2', 'Clubhouse Badminton Court 1', 'Sports', 100.00, 'AVAILABLE'),
        ('res-3', 'Rooftop Gazebo Barbecue Area', 'Leisure', 250.00, 'AVAILABLE'),
        ('res-4', 'Society Swimming Pool Lane 1', 'Sports', 0.00, 'AVAILABLE');
      `);
    }

    // Seed initial water metrics if empty
    const [existingWater] = await connection.query('SELECT COUNT(*) as count FROM water_metrics');
    if (existingWater[0].count === 0) {
      await connection.query(`
        INSERT INTO water_metrics (id, overhead_tank, underground_sump, recycled_water, ph_level, tds_level, today_consumption_liters, flow_rate_lpm)
        VALUES (1, 74, 92, 58, 7.2, 145, 48200, 120);
      `);
    }

    // Seed initial fire emergency monitor if empty
    const [existingFire] = await connection.query('SELECT COUNT(*) as count FROM fire_emergency');
    if (existingFire[0].count === 0) {
      await connection.query(`
        INSERT INTO fire_emergency (id, is_alarm_active, affected_zone, smoke_sensors_active, sprinklers_status, fire_dept_status, evacuation_route_open)
        VALUES (1, 0, 'None', 48, 'STANDBY', 'NOT_NOTIFIED', 1);
      `);
    }

    connection.release();
    console.log('🎉 Production database schema migration finished successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  }
}

runMigration();
