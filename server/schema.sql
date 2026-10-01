-- ====================================================================
-- 🏢 RAAH NAGAR - THE INTELLIGENT COMMUNITY OPERATING SYSTEM
-- MySQL Production Relational Database Schema & Data Migration Script
-- ====================================================================

CREATE DATABASE IF NOT EXISTS `raah_nagar_db` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE `raah_nagar_db`;

-- 1. Users & Authentication Table
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(64) PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('Resident', 'Facility Admin', 'Security Guard', 'Maintenance Tech') NOT NULL DEFAULT 'Resident',
  `flat_number` VARCHAR(50) DEFAULT 'A-101',
  `phone` VARCHAR(30) DEFAULT NULL,
  `emergency_contact` VARCHAR(30) DEFAULT NULL,
  `vehicle_number` VARCHAR(50) DEFAULT NULL,
  `reset_otp_hash` VARCHAR(255) DEFAULT NULL,
  `reset_otp_attempts` INT DEFAULT 0,
  `reset_otp_expires` BIGINT DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. Water Operations Table
CREATE TABLE IF NOT EXISTS `water_metrics` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `overhead_tank` INT NOT NULL DEFAULT 74,
  `underground_sump` INT NOT NULL DEFAULT 92,
  `recycled_water` INT NOT NULL DEFAULT 58,
  `ph_level` DECIMAL(3,1) NOT NULL DEFAULT 7.2,
  `tds_level` INT NOT NULL DEFAULT 145,
  `today_consumption_liters` INT NOT NULL DEFAULT 48200,
  `flow_rate_lpm` INT NOT NULL DEFAULT 120,
  `pump_cutoff_active` TINYINT(1) NOT NULL DEFAULT 1,
  `last_quality_check` VARCHAR(100) DEFAULT 'Today, 08:30 AM',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 3. Smart EV Parking Slots Table
CREATE TABLE IF NOT EXISTS `parking_slots` (
  `id` VARCHAR(64) PRIMARY KEY,
  `slot_number` VARCHAR(20) NOT NULL,
  `is_occupied` TINYINT(1) NOT NULL DEFAULT 0,
  `resident_name` VARCHAR(100) DEFAULT 'Unassigned',
  `vehicle_type` VARCHAR(50) DEFAULT 'None',
  `vehicle_number` VARCHAR(50) DEFAULT 'N/A',
  `is_ev_charging` TINYINT(1) NOT NULL DEFAULT 0,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 4. Fire Emergency Monitor Table
CREATE TABLE IF NOT EXISTS `fire_emergency` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `is_alarm_active` TINYINT(1) NOT NULL DEFAULT 0,
  `affected_zone` VARCHAR(100) DEFAULT 'None',
  `smoke_sensors_active` INT DEFAULT 48,
  `sprinklers_status` VARCHAR(50) DEFAULT 'STANDBY',
  `fire_dept_notified` TINYINT(1) DEFAULT 0,
  `evacuation_route_open` TINYINT(1) DEFAULT 1,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 5. Visitor Security Gate Pass Table
CREATE TABLE IF NOT EXISTS `visitor_requests` (
  `id` VARCHAR(64) PRIMARY KEY,
  `visitor_name` VARCHAR(100) NOT NULL,
  `category` ENUM('Delivery', 'Guest', 'Service', 'Cab') DEFAULT 'Guest',
  `unit_number` VARCHAR(50) NOT NULL,
  `otp_code` VARCHAR(10) NOT NULL,
  `status` ENUM('PENDING', 'APPROVED', 'DENIED') DEFAULT 'PENDING',
  `entry_time` VARCHAR(50) DEFAULT 'Pending',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 6. Maintenance Desk Tickets Table
CREATE TABLE IF NOT EXISTS `maintenance_tickets` (
  `id` VARCHAR(64) PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `unit` VARCHAR(100) NOT NULL,
  `priority` ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') DEFAULT 'MEDIUM',
  `status` ENUM('OPEN', 'IN_PROGRESS', 'RESOLVED') DEFAULT 'OPEN',
  `date` DATE DEFAULT (CURRENT_DATE),
  `technician` VARCHAR(100) DEFAULT 'Unassigned',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 7. Lift SOS Safety Table
CREATE TABLE IF NOT EXISTS `lift_statuses` (
  `id` VARCHAR(64) PRIMARY KEY,
  `lift_name` VARCHAR(100) NOT NULL,
  `floor` INT DEFAULT 0,
  `status` ENUM('NORMAL', 'SOS_TRIGGERED', 'TRAPPED_EMERGENCY', 'UNDER_MAINTENANCE') DEFAULT 'NORMAL',
  `ard_battery_percent` INT DEFAULT 100,
  `last_serviced` DATE DEFAULT (CURRENT_DATE),
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 8. Waste Management Bins Table
CREATE TABLE IF NOT EXISTS `waste_bins` (
  `id` VARCHAR(64) PRIMARY KEY,
  `bin_type` VARCHAR(100) NOT NULL,
  `fill_percentage` INT NOT NULL DEFAULT 0,
  `odor_score_level` INT DEFAULT 1,
  `last_emptied` VARCHAR(100) DEFAULT 'Today',
  `status` ENUM('OK', 'WARN', 'CRITICAL') DEFAULT 'OK',
  `vendor_dispatched` TINYINT(1) DEFAULT 0,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 9. Noise Guardian Violations Table
CREATE TABLE IF NOT EXISTS `noise_data` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `current_decibels` INT DEFAULT 48,
  `target_unit` VARCHAR(50) DEFAULT 'B-304',
  `current_violation_stage` INT DEFAULT 0,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 10. Resource Amenity Bookings Table
CREATE TABLE IF NOT EXISTS `resource_items` (
  `id` VARCHAR(64) PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `category` VARCHAR(50) DEFAULT 'Amenity',
  `status` ENUM('AVAILABLE', 'BUSY', 'MAINTENANCE') DEFAULT 'AVAILABLE',
  `price_per_hour` DECIMAL(10,2) DEFAULT 0.00,
  `booked_by` VARCHAR(100) DEFAULT NULL,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 11. AI Autonomous Action Logs Table
CREATE TABLE IF NOT EXISTS `action_logs` (
  `id` VARCHAR(64) PRIMARY KEY,
  `timestamp` VARCHAR(50) NOT NULL,
  `action` VARCHAR(255) NOT NULL,
  `module` VARCHAR(50) NOT NULL,
  `risk_level` ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') DEFAULT 'LOW',
  `details` TEXT,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ====================================================================
-- SEED INITIAL DATA
-- ====================================================================

INSERT INTO `users` (`id`, `name`, `email`, `password_hash`, `role`, `flat_number`, `phone`) 
VALUES 
('u-1', 'Rahul Sharma', 'rahul@society.com', '$2a$10$E8.3G/pD0HjJzSgO1.vO3.lE.aT4J.H.29Z/vXp3Q/LqZk2m2b4C.', 'Resident', 'A-101', '+91 98765 43210'),
('u-2', 'Priya Patel (Admin)', 'admin@society.com', '$2a$10$E8.3G/pD0HjJzSgO1.vO3.lE.aT4J.H.29Z/vXp3Q/LqZk2m2b4C.', 'Facility Admin', 'Management Office', '+91 98765 11111')
ON DUPLICATE KEY UPDATE `email`=`email`;

INSERT INTO `water_metrics` (`id`, `overhead_tank`, `underground_sump`, `recycled_water`, `ph_level`, `tds_level`, `today_consumption_liters`, `flow_rate_lpm`)
VALUES (1, 74, 92, 58, 7.2, 145, 48200, 120)
ON DUPLICATE KEY UPDATE `overhead_tank`=VALUES(`overhead_tank`);

INSERT INTO `parking_slots` (`id`, `slot_number`, `is_occupied`, `resident_name`, `vehicle_type`, `vehicle_number`, `is_ev_charging`) VALUES
('1', 'A-101', 1, 'Rahul Sharma', 'EV Car', 'MH 12 AB 1234', 1),
('2', 'A-102', 0, 'Unassigned', 'None', 'N/A', 0),
('3', 'B-205', 1, 'Priya Patel', 'Sedan', 'MH 12 CD 5678', 0)
ON DUPLICATE KEY UPDATE `slot_number`=VALUES(`slot_number`);
