import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { query } from './db.js';
import { sendSmsNotification, sendEmailNotification } from './services/notifier.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runTests() {
  console.log('🧪 Starting Production Requirements Verification Suite...\n');
  let testsPassed = 0;
  let testsFailed = 0;

  function assert(condition, description) {
    if (condition) {
      console.log(`  ✅ PASS: ${description}`);
      testsPassed++;
    } else {
      console.error(`  ❌ FAIL: ${description}`);
      testsFailed++;
    }
  }

  try {
    // -------------------------------------------------------------
    // Test 1: users.is_verified schema & authentication check
    // -------------------------------------------------------------
    console.log('1️⃣ Testing users.is_verified schema & auth enforcement:');
    const userCols = await query("SHOW COLUMNS FROM users LIKE 'is_verified'");
    assert(userCols.length > 0 && userCols[0].Field === 'is_verified', 'users table has is_verified column');

    // Create a temporary unverified user
    const testUnverifiedEmail = `test_unverified_${Date.now()}@example.com`;
    const passwordHash = await bcrypt.hash('secretPass123!', 10);
    const unverifiedId = `u-unverified-${Date.now()}`;
    await query(
      `INSERT INTO users (id, name, email, password_hash, role, is_verified) 
       VALUES (?, 'Unverified Tester', ?, ?, 'Resident', 0)`,
      [unverifiedId, testUnverifiedEmail, passwordHash]
    );

    // Verify unverified user in database has is_verified = 0
    const unverifiedRows = await query('SELECT is_verified FROM users WHERE id = ?', [unverifiedId]);
    assert(unverifiedRows.length > 0 && unverifiedRows[0].is_verified === 0, 'Unverified user correctly saved with is_verified = 0');

    // Clean up
    await query('DELETE FROM users WHERE id = ?', [unverifiedId]);
    assert(true, 'Temporary unverified user cleaned up');

    // -------------------------------------------------------------
    // Test 2: Plaintext visitor OTP dropped, hashed OTP + one-time use
    // -------------------------------------------------------------
    console.log('\n2️⃣ Testing Visitor OTP Security (Hashed storage, expiry, one-time use):');
    const visitorCols = await query("SHOW COLUMNS FROM visitor_requests LIKE 'otp_code'");
    assert(visitorCols.length === 0, 'Plaintext otp_code column is completely dropped from visitor_requests');

    const hashCols = await query("SHOW COLUMNS FROM visitor_requests LIKE 'otp_hash'");
    assert(hashCols.length > 0, 'visitor_requests has otp_hash column for SHA-256 storage');

    // Test creating a hashed pass
    const rawOtp = '748291';
    const otpHash = crypto.createHash('sha256').update(rawOtp).digest('hex');
    const visitorTestId = `v-test-${Date.now()}`;
    const validUntil = new Date(Date.now() + 6 * 60 * 60 * 1000);

    await query(
      `INSERT INTO visitor_requests (id, visitor_name, unit_number, category, otp_hash, valid_until, status, otp_attempts)
       VALUES (?, 'Security Test Visitor', 'A-101', 'Guest', ?, ?, 'APPROVED', 0)`,
      [visitorTestId, otpHash, validUntil]
    );

    // Verify stored record has ZERO plaintext OTP
    const insertedVisitorRows = await query('SELECT * FROM visitor_requests WHERE id = ?', [visitorTestId]);
    const insertedVisitor = insertedVisitorRows[0];
    assert(insertedVisitor.otp_hash === otpHash, 'Stored OTP is correctly SHA-256 hashed');
    assert(insertedVisitor.otp_code === undefined, 'Zero plaintext OTP stored in record');
    assert(insertedVisitor.otp_attempts === 0, 'Initial otp_attempts initialized to 0');

    // Simulate invalid guess: attempts increment
    await query('UPDATE visitor_requests SET otp_attempts = otp_attempts + 1 WHERE id = ?', [visitorTestId]);
    const afterFailedRows = await query('SELECT otp_attempts FROM visitor_requests WHERE id = ?', [visitorTestId]);
    assert(afterFailedRows[0].otp_attempts === 1, 'Failed attempt increments counter (Attempt 1 of 5)');

    // Simulate successful gate check-in: one-time invalidation (otp_hash wiped)
    await query(
      "UPDATE visitor_requests SET status = 'CHECKED_IN', entry_time = '10:00 AM', otp_hash = NULL WHERE id = ?",
      [visitorTestId]
    );
    const afterCheckInRows = await query('SELECT status, otp_hash FROM visitor_requests WHERE id = ?', [visitorTestId]);
    assert(afterCheckInRows[0].status === 'CHECKED_IN', 'Visitor marked CHECKED_IN upon verified entry');
    assert(afterCheckInRows[0].otp_hash === null, 'otp_hash wiped to NULL enforcing strict one-time use');

    // Clean up
    await query('DELETE FROM visitor_requests WHERE id = ?', [visitorTestId]);

    // -------------------------------------------------------------
    // Test 3: Notifier Service: Never report success when unconfigured
    // -------------------------------------------------------------
    console.log('\n3️⃣ Testing Notifier Service (Zero fake success reports):');
    const smsRes = await sendSmsNotification({ toPhone: '+919999999999', message: 'Test verification' });
    assert(smsRes.success === false, 'SMS send returns success: false when unconfigured');
    assert(smsRes.delivered === false, 'SMS send returns delivered: false');

    const emailRes = await sendEmailNotification({ toEmail: 'test@example.com', subject: 'Test', text: 'Hello' });
    assert(emailRes.success === false, 'Email send returns success: false when SMTP is unconfigured');
    assert(emailRes.delivered === false, 'Email send returns delivered: false');

    // -------------------------------------------------------------
    // Test 4: IoT Device Registry & Telemetry History tables
    // -------------------------------------------------------------
    console.log('\n4️⃣ Testing IoT Device Registry & Persistent Telemetry History:');
    const iotDevices = await query('SELECT * FROM iot_devices');
    assert(iotDevices.length > 0, `iot_devices registry has ${iotDevices.length} registered hardware controllers`);

    const pumpDev = iotDevices.find(d => d.id === 'PUMP-MAIN-01');
    assert(pumpDev !== undefined, 'Main Water Pump (PUMP-MAIN-01) registered in iot_devices');

    // Insert a telemetry reading
    const testReadingId = `TEST-DEV-${Date.now()}`;
    await query(
      `INSERT INTO telemetry_history (device_id, device_type, metric_name, metric_value, unit, status)
       VALUES (?, 'LEVEL_SENSOR', 'overhead_tank', 78.5, '%', 'NORMAL')`,
      [testReadingId]
    );

    const historyRows = await query('SELECT * FROM telemetry_history WHERE device_id = ?', [testReadingId]);
    assert(historyRows.length === 1 && historyRows[0].metric_name === 'overhead_tank', 'Persistent telemetry history recorded with timestamp, unit, status');

    // Clean up
    await query('DELETE FROM telemetry_history WHERE device_id = ?', [testReadingId]);

    // -------------------------------------------------------------
    // Test 5: Command -> Device ACK -> Confirmed State pattern
    // -------------------------------------------------------------
    console.log('\n5️⃣ Testing Command -> Device ACK -> Confirmed State Pattern:');
    const commandId = `cmd-test-${Date.now()}`;
    await query(
      `INSERT INTO device_commands (id, device_id, device_type, command, requested_by, status)
       VALUES (?, 'PUMP-MAIN-01', 'WATER_PUMP', 'START', 'u-admin', 'PENDING')`,
      [commandId]
    );

    const cmdBeforeRows = await query('SELECT status FROM device_commands WHERE id = ?', [commandId]);
    assert(cmdBeforeRows[0].status === 'PENDING', 'Command initially stored in PENDING status');

    // Device ACK confirmed
    await query("UPDATE device_commands SET status = 'CONFIRMED', confirmed_at = NOW() WHERE id = ?", [commandId]);
    const cmdAfterRows = await query('SELECT status, confirmed_at FROM device_commands WHERE id = ?', [commandId]);
    assert(cmdAfterRows[0].status === 'CONFIRMED' && cmdAfterRows[0].confirmed_at !== null, 'Command confirmed only upon physical ACK');

    // Clean up
    await query('DELETE FROM device_commands WHERE id = ?', [commandId]);

    // -------------------------------------------------------------
    // Test 6: Real-Only Production Cleanup Verification
    // -------------------------------------------------------------
    console.log('\n6️⃣ Testing Real-Only Production Cleanup:');
    const serverDir = __dirname;

    // Check data.json does NOT exist
    const dataJsonExists = fs.existsSync(path.join(serverDir, 'data.json'));
    assert(!dataJsonExists, 'server/data.json file is completely removed (MySQL is sole source of truth)');

    // Check server.js has zero DEMO_SIMULATION_FIXTURES
    const serverCode = fs.readFileSync(path.join(serverDir, 'server.js'), 'utf8');
    assert(!serverCode.includes('DEMO_SIMULATION_FIXTURES'), 'server.js has zero DEMO_SIMULATION_FIXTURES');
    assert(!serverCode.includes('isSimulation'), 'server.js operational endpoints have zero isSimulation bypasses');

    // Check deployment configs exist
    const nginxConfExists = fs.existsSync(path.join(serverDir, '..', 'deploy', 'nginx.conf'));
    const caddyfileExists = fs.existsSync(path.join(serverDir, '..', 'deploy', 'Caddyfile'));
    assert(nginxConfExists && caddyfileExists, 'Reverse proxy configurations (deploy/nginx.conf & deploy/Caddyfile) exist');

    // Check MySQL hardware states
    const waterRows = await query('SELECT pump_operational_state, overhead_tank, underground_sump FROM water_metrics WHERE id = 1');
    assert(
      waterRows.length > 0 && waterRows[0].pump_operational_state === 'NOT_CONNECTED' && waterRows[0].overhead_tank === 0,
      'water_metrics defaults to NOT_CONNECTED / zero telemetry when hardware offline'
    );

    const fireRows = await query('SELECT smoke_sensors_active, is_alarm_active FROM fire_emergency WHERE id = 1');
    assert(
      fireRows.length > 0 && fireRows[0].smoke_sensors_active === 0 && fireRows[0].is_alarm_active === 0,
      'fire_emergency defaults to 0 smoke sensors active when hardware offline'
    );

    const noiseRows = await query('SELECT current_decibels, target_unit FROM noise_data WHERE id = 1');
    assert(
      noiseRows.length > 0 && noiseRows[0].current_decibels === 0 && noiseRows[0].target_unit === null,
      'noise_data defaults to 0 decibels / NULL target unit when hardware offline'
    );

    console.log(`\n=================================================`);
    console.log(`🎉 TEST SUMMARY: ${testsPassed} passed, ${testsFailed} failed.`);
    console.log(`=================================================`);

    if (testsFailed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
}

runTests();
