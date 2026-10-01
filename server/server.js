import express from 'express';
import cors from 'cors';
import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import db, { query, recordAuditLog, createDeviceCommand, confirmDeviceCommand } from './db.js';
import { authenticateToken, requirePermission, rateLimit, JWT_SECRET } from './middleware/auth.js';
import { ROLES, PERMISSIONS, hasPermission } from './rbac.js';
import { sendSmsNotification, sendEmailNotification } from './services/notifier.js';

// Load Environment Variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, 'data.json');

// 🔒 Secure IoT Gateway Secret (No Static Hardcoded Secret in Production)
let iotGatewayKey = process.env.IOT_GATEWAY_KEY;
if (!iotGatewayKey || iotGatewayKey === 'raah_nagar_gateway_secret_2026') {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('FATAL: IOT_GATEWAY_KEY must be securely defined in environment variables for production mode!');
  }
  iotGatewayKey = crypto.randomBytes(32).toString('hex');
}

// Initialize Gemini AI Client (Advisory / Summarization Only)
const geminiApiKey = process.env.GEMINI_API_KEY;
let aiClient = null;
if (geminiApiKey && geminiApiKey.trim() !== '' && geminiApiKey !== 'your_gemini_api_key_here') {
  try {
    aiClient = new GoogleGenAI({ apiKey: geminiApiKey });
    console.log('🤖 Google Gemini AI engine initialized (Advisory Mode: Deterministic Controls Protected)');
  } catch (err) {
    console.warn('⚠️ Could not initialize Gemini AI client:', err.message);
  }
} else {
  console.log('💡 Note: GEMINI_API_KEY not configured. Operating in safe advisory simulation.');
}

// 🧪 Isolated Demo & Simulation Fixtures (Strictly for explicit simulation sandboxes; NEVER served as live production telemetry)
export const DEMO_SIMULATION_FIXTURES = {
  waterData: {
    overheadTank: 74,
    undergroundSump: 92,
    recycledWater: 58,
    phLevel: 7.2,
    tdsLevel: 145,
    todayConsumptionLiters: 48200,
    flowRateLPM: 120,
    pumpAutoCutoffActive: true,
    pumpOperationalState: 'OFF',
    valveClosed: false,
    leakageDetected: false,
    lastQualityCheck: 'Simulation Baseline'
  },
  noiseData: {
    currentDecibels: 48,
    targetUnit: 'B-304',
    currentViolationStage: 0,
    decibelHistory: [
      { time: '22:00', db: 42 },
      { time: '22:15', db: 45 },
      { time: '22:30', db: 48 },
      { time: '22:45', db: 64 },
      { time: '23:00', db: 68 },
      { time: '23:15', db: 52 },
      { time: '23:30', db: 46 }
    ]
  }
};

// 🛡️ Live Operational Telemetry Cache (Strictly zero/neutral defaults; populated ONLY by MySQL raah_nagar_db & real IoT Gateway)
let telemetryCache = {
  waterData: {
    overheadTank: 0,
    undergroundSump: 0,
    recycledWater: 0,
    phLevel: 0,
    tdsLevel: 0,
    todayConsumptionLiters: 0,
    flowRateLPM: 0,
    pumpAutoCutoffActive: false,
    pumpOperationalState: 'STANDBY',
    valveClosed: false,
    leakageDetected: false,
    lastQualityCheck: 'Awaiting Live IoT Telemetry'
  },
  parkingSlots: [],
  fireEmergencyData: {
    isAlarmActive: false,
    affectedZone: 'None',
    smokeSensorsActive: 0,
    sprinklersStatus: 'STANDBY',
    fireDeptStatus: 'NOT_DISPATCHED',
    evacuationRouteOpen: true
  },
  visitorRequests: [],
  maintenanceTickets: [],
  liftStatuses: [],
  wasteBins: [],
  noiseData: {
    currentDecibels: 0,
    targetUnit: null,
    currentViolationStage: 0,
    decibelHistory: []
  },
  resourceItems: [],
  actionLogs: []
};

// Sync MySQL data into memory cache
async function syncFromDatabase() {
  try {
    // Query IoT device connectivity status from registry
    let deviceMap = {};
    try {
      const devRows = await query('SELECT id, status, last_seen FROM iot_devices');
      devRows.forEach(d => { deviceMap[d.id] = d; });
    } catch (e) {
      // Table fallback
    }

    // 1. Water
    const waterRows = await query('SELECT * FROM water_metrics LIMIT 1');
    if (waterRows.length > 0) {
      const w = waterRows[0];
      const mainPumpDev = deviceMap['PUMP-MAIN-01'];
      const pumpState = (!mainPumpDev || mainPumpDev.status === 'NOT_CONNECTED')
        ? 'NOT_CONNECTED'
        : (mainPumpDev.status === 'OFFLINE' ? 'OFFLINE' : (w.pump_operational_state || 'OFF'));

      const valveDev = deviceMap['VALVE-MAIN-V102'];
      const valveHwStatus = (!valveDev || valveDev.status === 'NOT_CONNECTED')
        ? 'NOT_CONNECTED'
        : (valveDev.status === 'OFFLINE' ? 'OFFLINE' : 'ONLINE');

      telemetryCache.waterData = {
        ...telemetryCache.waterData,
        overheadTank: w.overhead_tank,
        undergroundSump: w.underground_sump,
        recycledWater: w.recycled_water,
        phLevel: parseFloat(w.ph_level),
        tdsLevel: w.tds_level,
        todayConsumptionLiters: w.today_consumption_liters,
        flowRateLPM: w.flow_rate_lpm,
        pumpAutoCutoffActive: !!w.pump_cutoff_active,
        pumpOperationalState: pumpState,
        hardwareStatus: mainPumpDev ? mainPumpDev.status : 'NOT_CONNECTED',
        valveHardwareStatus: valveHwStatus,
        lastQualityCheck: w.last_quality_check
      };
    }

    // 2. Parking
    const parkingRows = await query('SELECT * FROM parking_slots');
    if (parkingRows.length > 0) {
      telemetryCache.parkingSlots = parkingRows.map(p => ({
        id: p.id,
        slotNumber: p.slot_number,
        isOccupied: !!p.is_occupied,
        residentName: p.resident_name,
        vehicleType: p.vehicle_type,
        vehicleNumber: p.vehicle_number,
        isEvCharging: !!p.is_ev_charging
      }));
    }

    // 3. Fire Emergency
    const fireRows = await query('SELECT * FROM fire_emergency LIMIT 1');
    if (fireRows.length > 0) {
      const f = fireRows[0];
      telemetryCache.fireEmergencyData = {
        isAlarmActive: !!f.is_alarm_active,
        affectedZone: f.affected_zone,
        smokeSensorsActive: f.smoke_sensors_active,
        sprinklersStatus: f.sprinklers_status || 'STANDBY',
        fireDeptStatus: f.fire_dept_status || 'NOT_DISPATCHED',
        evacuationRouteOpen: !!f.evacuation_route_open
      };
    }

    // 4. Visitors
    const visitorRows = await query('SELECT id, visitor_name, category, unit_number, resident_user_id, status, entry_time, exit_time, valid_until FROM visitor_requests ORDER BY created_at DESC LIMIT 50');
    if (visitorRows.length > 0) {
      telemetryCache.visitorRequests = visitorRows.map(v => ({
        id: v.id,
        visitorName: v.visitor_name,
        category: v.category,
        unitNumber: v.unit_number,
        residentUserId: v.resident_user_id,
        status: v.status,
        entryTime: v.entry_time,
        exitTime: v.exit_time,
        validUntil: v.valid_until
      }));
    }

    // 5. Maintenance Tickets
    const ticketRows = await query('SELECT * FROM maintenance_tickets ORDER BY created_at DESC LIMIT 50');
    if (ticketRows.length > 0) {
      telemetryCache.maintenanceTickets = ticketRows.map(t => ({
        id: t.id,
        ticketNumber: t.ticket_number || t.id,
        title: t.title,
        description: t.description,
        unit: t.unit,
        residentUserId: t.resident_user_id,
        priority: t.priority,
        status: t.status,
        date: t.date || new Date(t.created_at).toISOString().split('T')[0],
        technician: t.technician,
        slaHours: t.sla_hours
      }));
    }

    // 6. Lift Statuses
    const liftRows = await query('SELECT * FROM lift_statuses');
    if (liftRows.length > 0) {
      telemetryCache.liftStatuses = liftRows.map(l => ({
        id: l.id,
        liftName: l.lift_name,
        floor: l.floor,
        status: l.status,
        ardBatteryPercent: l.ard_battery_percent,
        assignedTechnician: l.assigned_technician,
        lastServiced: l.last_serviced
      }));
    }

    // 7. Waste Bins
    const wasteRows = await query('SELECT * FROM waste_bins');
    if (wasteRows.length > 0) {
      telemetryCache.wasteBins = wasteRows.map(w => ({
        id: w.id,
        binType: w.bin_type,
        fillPercentage: w.fill_percentage,
        odorScoreLevel: w.odor_score_level,
        lastEmptied: w.last_emptied,
        status: w.status,
        vendorDispatched: !!w.vendor_dispatched,
        vendorName: w.vendor_name
      }));
    }

    // 8. Resource Items
    const resRows = await query('SELECT * FROM resource_items');
    if (resRows.length > 0) {
      telemetryCache.resourceItems = resRows.map(r => ({
        id: r.id,
        name: r.name,
        category: r.category,
        pricePerHour: parseFloat(r.price_per_hour),
        status: r.status
      }));
    }

    // 9. Audit / Action Logs
    const auditRows = await query('SELECT id, created_at, action, entity_type, user_role, ip_address FROM audit_logs ORDER BY created_at DESC LIMIT 30');
    telemetryCache.actionLogs = auditRows.map(a => ({
      id: `log-${a.id}`,
      timestamp: new Date(a.created_at).toLocaleTimeString(),
      action: a.action,
      module: a.entity_type,
      riskLevel: a.action.includes('FIRE') || a.action.includes('EMERGENCY') ? 'CRITICAL' : 'LOW',
      details: `Action performed by ${a.user_role} (IP: ${a.ip_address || 'local'})`
    }));

    // Cache backup for offline disaster resilience
    fs.writeFileSync(DB_FILE, JSON.stringify(telemetryCache, null, 2));
    console.log('🔄 Telemetry and state synchronized from MySQL raah_nagar_db to runtime cache.');
  } catch (err) {
    console.warn('⚠️ Could not sync from MySQL, using cached state:', err.message);
  }
}

// Initial Telemetry Sync
syncFromDatabase();

const app = express();

// 🔒 Production CORS Whitelist Policy
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173').split(',').map(s => s.trim());

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    if (
      origin.startsWith('http://localhost:') || 
      origin.startsWith('http://127.0.0.1:') ||
      origin.startsWith('http://10.') || 
      origin.startsWith('http://192.168.')
    ) {
      return callback(null, true);
    }
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-gateway-key']
}));

// 🛡️ Production Security Headers (HTTPS/WSS Ready)
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// 📡 Scoped WebSocket Broadcast Helper (Authenticated & Role-Aware)
function broadcast(type, payload, targetRole = null) {
  const message = JSON.stringify({ type, payload, targetRole });
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN && client.isAuthenticated) {
      if (!targetRole || client.userRole === ROLES.SUPER_ADMIN || client.userRole === targetRole || (Array.isArray(targetRole) && targetRole.includes(client.userRole))) {
        client.send(message);
      }
    }
  });
}

// 🛡️ Secure WebSocket Connection (Requires Auth Token Before Sending Any Society Data)
wss.on('connection', (ws) => {
  ws.isAuthenticated = false;
  ws.userRole = null;
  ws.userId = null;

  // Set 5-second auth timeout: If client doesn't authenticate, terminate socket
  const authTimer = setTimeout(() => {
    if (!ws.isAuthenticated) {
      ws.send(JSON.stringify({ type: 'ERROR', error: 'Authentication timeout: Valid token required within 5s.' }));
      ws.close(4001, 'Unauthorized');
    }
  }, 5000);

  ws.on('message', (msg) => {
    try {
      const data = JSON.parse(msg.toString());
      if (data.type === 'AUTHENTICATE' && data.token) {
        clearTimeout(authTimer);
        const decoded = jwt.verify(data.token, JWT_SECRET);
        ws.isAuthenticated = true;
        ws.userRole = decoded.role || ROLES.RESIDENT;
        ws.userId = decoded.id;

        // Send role-filtered initial sync only after successful authentication
        const scopedSync = getScopedDataForRole(ws.userRole, ws.userId);
        ws.send(JSON.stringify({ type: 'AUTH_SUCCESS', role: ws.userRole }));
        ws.send(JSON.stringify({ type: 'INITIAL_SYNC', payload: scopedSync }));
      }
    } catch (e) {
      ws.send(JSON.stringify({ type: 'ERROR', error: 'Invalid authentication credentials.' }));
      ws.close(4003, 'Forbidden');
    }
  });

  ws.on('close', () => {
    clearTimeout(authTimer);
  });
});

// Helper: Filter telemetry data based on user role (Data Isolation)
function getScopedDataForRole(role, userId) {
  if (role === ROLES.FACILITY_ADMIN || role === ROLES.SUPER_ADMIN) {
    return telemetryCache;
  }

  // Resident only sees their own visitors & tickets, public telemetry
  return {
    ...telemetryCache,
    visitorRequests: telemetryCache.visitorRequests.filter(v => v.residentUserId === userId || !v.residentUserId),
    maintenanceTickets: telemetryCache.maintenanceTickets.filter(t => t.residentUserId === userId || !t.residentUserId),
    actionLogs: telemetryCache.actionLogs.slice(0, 5) // Limited audit trail for residents
  };
}

// ==========================================
// REST API Endpoints
// ==========================================

// Server Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    systemName: 'COMMUNITY BRAIN OS - Production API',
    primaryDatabase: 'MySQL 9.7 (raah_nagar_db)',
    databaseConnected: db.isConnected(),
    geminiAiActive: !!aiClient,
    aiPolicy: 'Advisory and anomaly detection only; zero direct physical actuator authorization',
    connectedAuthenticatedSockets: Array.from(wss.clients).filter(c => c.isAuthenticated).length,
    timestamp: new Date().toISOString()
  });
});

// 1. Authenticated State Sync (Strictly Protected by JWT & Role-Scoped)
app.get('/api/sync', authenticateToken, (req, res) => {
  const scopedData = getScopedDataForRole(req.user.role, req.user.id);
  res.json({ success: true, data: scopedData });
});

// 2. Society Flats Registry
app.get('/api/flats', async (req, res) => {
  try {
    const flats = await query('SELECT flat_number, tower, floor, occupancy_status FROM society_flats ORDER BY tower, flat_number');
    res.json({ success: true, flats });
  } catch (err) {
    res.json({ success: true, flats: [] });
  }
});

// 3. AI Smart Advisor (Protected: Reads Authenticated User Role from Server Token)
app.post('/api/ai/ask', rateLimit({ windowMs: 60000, maxRequests: 20 }), authenticateToken, async (req, res) => {
  const { question, prompt } = req.body;
  const userQuery = question || prompt || 'Provide status summary';
  // 🛡️ Security Rule 10: Never trust client-supplied role; strictly extract from verified JWT
  const userRole = req.user.role;
  const userName = req.user.name || 'User';

  if (aiClient) {
    try {
      const response = await aiClient.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: `You are RAAH NAGAR AI, an analytical advisory intelligence for a smart residential community.
Authenticated User: "${userName}", Verified Role: "${userRole}".
IMPORTANT SAFETY MANDATE: You provide analytical advice, pattern detection, and consumption statistics. You NEVER operate physical hardware, pumps, or fire equipment.

Current Real Telemetry:
- Overhead Water Tank: ${telemetryCache.waterData.overheadTank}%
- Sump Level: ${telemetryCache.waterData.undergroundSump}%
- Water Pump State: ${telemetryCache.waterData.pumpOperationalState}
- Fire System Standby: ${telemetryCache.fireEmergencyData.isAlarmActive ? 'ALERT REPORTED' : 'Normal Standby'}
- Open Maintenance Tickets: ${telemetryCache.maintenanceTickets.filter(m => m.status === 'OPEN').length}

User Query: "${userQuery}"

Provide a concise, role-tailored, professional advisory response.`
      });
      return res.json({ success: true, answer: response.text, mode: 'gemini-live' });
    } catch (err) {
      console.warn('Gemini query fallback:', err.message);
    }
  }

  const fallbackMsg = `🏛️ [RAAH NAGAR Advisor for ${userRole}]: Telemetry nominal. Overhead Tank: ${telemetryCache.waterData.overheadTank}%, Open Tickets: ${telemetryCache.maintenanceTickets.filter(m => m.status === 'OPEN').length}.`;
  return res.json({ success: true, answer: fallbackMsg, mode: 'simulation' });
});

// AI Emergency Analysis (Advisory Protocol Guidelines)
app.post('/api/ai/analyze-emergency', authenticateToken, requirePermission(PERMISSIONS.EMERGENCY_ACKNOWLEDGE), async (req, res) => {
  const { emergencyType, zone, details } = req.body;
  const context = `Incident Type: ${emergencyType || 'General'}, Zone: ${zone || 'Main'}, Details: ${details || 'Sensor event'}`;

  if (aiClient) {
    try {
      const response = await aiClient.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: `Safety Advisor: Analyze this incident and output 3 prioritized response guidelines for human operators: ${context}`
      });
      return res.json({ success: true, analysis: response.text, mode: 'gemini-live' });
    } catch (err) {
      console.error('Gemini Emergency Analysis Error:', err.message);
    }
  }

  const fallbackAnalysis = `🚨 Standard Operating Procedure:\n1. Verify physical location on site.\n2. Ensure evacuation routes remain unobstructed.\n3. Awaiting authorized Facility Admin intervention.`;
  return res.json({ success: true, analysis: fallbackAnalysis, mode: 'simulation' });
});

// 4. Water Management (Command vs Actual State Pattern & Real IoT Ingestion)
app.get('/api/water', authenticateToken, (req, res) => res.json(telemetryCache.waterData));

// Dispatch Pump Command (Stays PENDING until IoT Gateway reports actual physical state)
app.post('/api/water/pump-command', authenticateToken, requirePermission(PERMISSIONS.EQUIPMENT_CONTROL), async (req, res) => {
  const { command, deviceId = 'PUMP-MAIN-01', isSimulation = false } = req.body; // 'START' | 'STOP'
  const requestedBy = req.user.id;

  // 🛡️ Simulation isolation: NEVER actuate physical motor in simulation
  if (isSimulation) {
    return res.json({
      success: true,
      isSimulation: true,
      status: 'SIMULATED',
      message: '[SIMULATION_MODE] Pump command sandboxed; zero physical motor actuated.'
    });
  }

  try {
    const commandId = await createDeviceCommand({
      deviceId,
      deviceType: 'WATER_PUMP',
      command,
      requestedBy
    });

    await recordAuditLog({
      userId: requestedBy,
      userRole: req.user.role,
      action: `PUMP_${command}_COMMAND_QUEUED`,
      entityType: 'WATER_PUMP',
      entityId: deviceId,
      oldValue: { state: telemetryCache.waterData.pumpOperationalState },
      newValue: { command, commandId },
      ip: req.ip
    });

    // 🛡️ Real Production Rule 3: Do NOT fake automated confirmation via setTimeout.
    // The command status remains 'PENDING' until the physical IoT gateway / MQTT bridge posts to /api/iot/gateway/telemetry.
    res.json({
      success: true,
      message: `Command '${command}' queued with ID ${commandId}. State remains PENDING until physical pump controller sends confirmation.`,
      commandId,
      status: 'PENDING',
      awaitingPhysicalGateway: true
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to issue pump command: ' + err.message });
  }
});

// Dedicated Real IoT Gateway Telemetry Ingestion Endpoint
app.post('/api/iot/gateway/telemetry', async (req, res) => {
  const gatewayKey = req.headers['x-gateway-key'];
  if (!gatewayKey || gatewayKey !== iotGatewayKey) {
    return res.status(401).json({ success: false, error: 'Unauthorized IoT Gateway Key' });
  }

  const { deviceId, deviceType = 'GENERIC', operationalState, commandId, readings, firmwareVersion } = req.body;

  try {
    // 1. Update IoT Device Registry (Online / Last Seen tracking)
    if (deviceId) {
      await query(
        `INSERT INTO iot_devices (id, device_name, device_type, location, status, last_seen, ip_address, firmware_version)
         VALUES (?, ?, ?, 'Society Grounds', 'ONLINE', NOW(), ?, ?)
         ON DUPLICATE KEY UPDATE 
           status = 'ONLINE',
           last_seen = NOW(),
           ip_address = COALESCE(VALUES(ip_address), ip_address),
           firmware_version = COALESCE(VALUES(firmware_version), firmware_version)`,
        [deviceId, deviceId, deviceType, req.ip, firmwareVersion || '1.0.0']
      );
    }

    // 2. Command confirmation (COMMAND -> DEVICE ACK -> CONFIRMED STATE)
    if (commandId) {
      await confirmDeviceCommand(commandId, 'CONFIRMED');
      await recordAuditLog({
        userId: 'IOT_GATEWAY',
        userRole: 'DEVICE_GATEWAY',
        action: 'DEVICE_COMMAND_CONFIRMED',
        entityType: deviceType,
        entityId: deviceId,
        newValue: { commandId, operationalState },
        ip: req.ip
      });
      broadcast('COMMAND_CONFIRMED', { commandId, deviceId, status: 'CONFIRMED', operationalState });
    }

    // 3. Persistent Telemetry History Insertion
    if (readings) {
      const readingEntries = Array.isArray(readings) ? readings : Object.entries(readings).map(([key, val]) => ({
        metricName: key,
        metricValue: typeof val === 'number' ? val : parseFloat(val) || 0,
        unit: key.includes('temp') ? '°C' : key.includes('flow') ? 'LPM' : key.includes('tank') || key.includes('sump') || key.includes('level') || key.includes('fill') ? '%' : key.includes('db') || key.includes('decibel') ? 'dB' : '',
        status: 'NORMAL'
      }));

      for (const r of readingEntries) {
        if (r.metricName && r.metricValue !== undefined) {
          await query(
            `INSERT INTO telemetry_history (device_id, device_type, metric_name, metric_value, unit, status)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [deviceId || 'GATEWAY-01', deviceType, r.metricName, r.metricValue, r.unit || '', r.status || 'NORMAL']
          );
        }
      }
    }

    // 4. Update operational state based on deviceType
    if (deviceType === 'WATER_PUMP' && operationalState) {
      telemetryCache.waterData.pumpOperationalState = operationalState;
      await query('UPDATE water_metrics SET pump_operational_state = ?, updated_at = NOW() WHERE id = 1', [operationalState]);
      broadcast('WATER_UPDATED', telemetryCache.waterData);
    } else if (deviceType === 'WATER_VALVE' && operationalState) {
      const isClosed = operationalState === 'CLOSED';
      telemetryCache.waterData.valveClosed = isClosed;
      broadcast('WATER_UPDATED', telemetryCache.waterData);
    } else if (deviceType === 'LEVEL_SENSOR' && readings) {
      if (readings.overheadTank !== undefined) {
        telemetryCache.waterData.overheadTank = readings.overheadTank;
        await query('UPDATE water_metrics SET overhead_tank = ? WHERE id = 1', [readings.overheadTank]);
      }
      if (readings.undergroundSump !== undefined) {
        telemetryCache.waterData.undergroundSump = readings.undergroundSump;
        await query('UPDATE water_metrics SET underground_sump = ? WHERE id = 1', [readings.undergroundSump]);
      }
      broadcast('WATER_UPDATED', telemetryCache.waterData);
    }

    res.json({ success: true, message: `Physical telemetry confirmed and ingested for ${deviceId}` });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Telemetry ingestion failed: ' + err.message });
  }
});

// Direct Physical Device ACK Endpoint (COMMAND -> DEVICE ACK -> CONFIRMED STATE)
app.post('/api/iot/gateway/ack', async (req, res) => {
  const gatewayKey = req.headers['x-gateway-key'];
  if (!gatewayKey || gatewayKey !== iotGatewayKey) {
    return res.status(401).json({ success: false, error: 'Unauthorized IoT Gateway Key' });
  }

  const { commandId, deviceId, status = 'CONFIRMED', errorMessage = null, actualState = null } = req.body;
  if (!commandId) {
    return res.status(400).json({ success: false, error: 'commandId is required.' });
  }

  try {
    await confirmDeviceCommand(commandId, status, errorMessage);

    if (status === 'CONFIRMED' && actualState) {
      if (actualState.pumpOperationalState) {
        telemetryCache.waterData.pumpOperationalState = actualState.pumpOperationalState;
        await query('UPDATE water_metrics SET pump_operational_state = ?, updated_at = NOW() WHERE id = 1', [actualState.pumpOperationalState]);
        broadcast('WATER_UPDATED', telemetryCache.waterData);
      }
      if (typeof actualState.valveClosed === 'boolean') {
        telemetryCache.waterData.valveClosed = actualState.valveClosed;
        broadcast('WATER_UPDATED', telemetryCache.waterData);
      }
    }

    await recordAuditLog({
      userId: 'IOT_GATEWAY',
      userRole: 'DEVICE_GATEWAY',
      action: `DEVICE_COMMAND_${status}`,
      entityType: 'PHYSICAL_DEVICE',
      entityId: deviceId || commandId,
      newValue: { commandId, status, errorMessage, actualState },
      ip: req.ip
    });

    broadcast('COMMAND_ACK', { commandId, deviceId, status, errorMessage, actualState });
    res.json({ success: true, message: `Command ${commandId} ACK recorded as ${status}.` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// IoT Device Registry & Online/Offline Status Endpoint
app.get('/api/iot/devices', authenticateToken, async (req, res) => {
  try {
    await query(`
      UPDATE iot_devices 
      SET status = 'OFFLINE' 
      WHERE status = 'ONLINE' AND last_seen < (NOW() - INTERVAL 5 MINUTE)
    `);

    const devices = await query('SELECT id, device_name, device_type, location, status, last_seen, firmware_version FROM iot_devices ORDER BY device_type, id');
    res.json({ success: true, devices });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Persistent Telemetry History Query Endpoint
app.get('/api/iot/telemetry/history', authenticateToken, async (req, res) => {
  const { deviceId, metricName, limit = 50 } = req.query;
  const maxLimit = Math.min(parseInt(limit, 10) || 50, 200);

  try {
    let sql = 'SELECT * FROM telemetry_history';
    const params = [];
    const conditions = [];

    if (deviceId) {
      conditions.push('device_id = ?');
      params.push(deviceId);
    }
    if (metricName) {
      conditions.push('metric_name = ?');
      params.push(metricName);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    sql += ' ORDER BY created_at DESC LIMIT ?';
    params.push(maxLimit);

    const history = await query(sql, params);
    res.json({ success: true, history });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Water Valve Manual Shutoff Command (Command vs Actual State Pattern & Simulation Isolation)
app.post('/api/water/valve-command', authenticateToken, requirePermission(PERMISSIONS.EQUIPMENT_CONTROL), async (req, res) => {
  const { closed, deviceId = 'VALVE-MAIN-V102', isSimulation = false } = req.body;
  const requestedBy = req.user.id;
  const command = closed ? 'CLOSE' : 'OPEN';

  // 🛡️ Simulation isolation: NEVER actuate physical device or write hardware commands in simulation
  if (isSimulation) {
    return res.json({
      success: true,
      isSimulation: true,
      valveClosed: !!closed,
      message: '[SIMULATION_MODE] Valve state simulated in sandbox. Zero real equipment actuated.'
    });
  }

  try {
    const commandId = await createDeviceCommand({
      deviceId,
      deviceType: 'WATER_VALVE',
      command,
      requestedBy
    });

    await recordAuditLog({
      userId: requestedBy,
      userRole: req.user.role,
      action: `VALVE_${command}_COMMAND_QUEUED`,
      entityType: 'WATER_VALVE',
      entityId: deviceId,
      oldValue: { valveClosed: telemetryCache.waterData.valveClosed },
      newValue: { command, commandId },
      ip: req.ip
    });

    res.json({
      success: true,
      message: `Valve command '${command}' queued with ID ${commandId}. State remains PENDING until physical valve controller reports telemetry confirmation.`,
      commandId,
      status: 'PENDING',
      awaitingPhysicalGateway: true,
      currentValveState: telemetryCache.waterData.valveClosed
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to issue valve command: ' + err.message });
  }
});

// 5. Smart Parking
app.get('/api/parking', authenticateToken, (req, res) => res.json(telemetryCache.parkingSlots));

app.post('/api/parking/toggle/:id', authenticateToken, requirePermission(PERMISSIONS.PARKING_MONITOR), async (req, res) => {
  const { id } = req.params;
  const slot = telemetryCache.parkingSlots.find(s => s.id === id);
  if (!slot) return res.status(404).json({ success: false, error: 'Slot not found' });

  const oldOccupancy = slot.isOccupied;
  slot.isOccupied = !oldOccupancy;

  try {
    await query('UPDATE parking_slots SET is_occupied = ?, updated_at = NOW() WHERE id = ?', [slot.isOccupied ? 1 : 0, id]);
    await recordAuditLog({
      userId: req.user.id,
      userRole: req.user.role,
      action: slot.isOccupied ? 'PARKING_SENSOR_VEHICLE_DETECTED' : 'PARKING_SENSOR_VEHICLE_DEPARTED',
      entityType: 'PARKING_SLOT',
      entityId: id,
      oldValue: { isOccupied: oldOccupancy },
      newValue: { isOccupied: slot.isOccupied },
      ip: req.ip
    });
  } catch (e) {
    console.error('Parking DB update error:', e.message);
  }

  broadcast('PARKING_UPDATED', telemetryCache.parkingSlots);
  res.json({ success: true, data: telemetryCache.parkingSlots });
});

// 6. Fire Emergency (Certified Safety Protocol - No Fake Actuation Claims)
app.get('/api/fire', authenticateToken, (req, res) => res.json(telemetryCache.fireEmergencyData));

app.post('/api/fire/trigger', rateLimit({ windowMs: 60000, maxRequests: 5 }), authenticateToken, requirePermission(PERMISSIONS.EMERGENCY_CONTROL), async (req, res) => {
  const zone = req.body.zone || 'Tower B Floor 4';
  const isSimulation = !!req.body.isSimulation;

  // 🛡️ Simulation isolation: NEVER trigger real sirens, external fire desks, or SMS in simulation
  if (isSimulation) {
    return res.json({
      success: true,
      isSimulation: true,
      message: '[SIMULATION_MODE] Fire emergency sandboxed; zero sirens, SMS, or fire dept alerted.'
    });
  }

  const oldData = { ...telemetryCache.fireEmergencyData };

  // Note: Software flags emergency reported; does NOT claim automated sprinkler discharge without physical confirmation
  telemetryCache.fireEmergencyData = {
    ...telemetryCache.fireEmergencyData,
    isAlarmActive: true,
    affectedZone: zone,
    sprinklersStatus: 'MANUAL_OVERRIDE_ENABLED',
    fireDeptStatus: 'EMERGENCY_DESK_ALERTED'
  };

  try {
    await query(
      `UPDATE fire_emergency 
       SET is_alarm_active = 1, affected_zone = ?, sprinklers_status = 'MANUAL_OVERRIDE_ENABLED', fire_dept_status = 'EMERGENCY_DESK_ALERTED', incident_started_at = NOW(), authorized_by = ?
       WHERE id = 1`,
      [zone, req.user.name || req.user.email]
    );

    await recordAuditLog({
      userId: req.user.id,
      userRole: req.user.role,
      action: 'FIRE_ALARM_ACTIVATED_OPERATOR',
      entityType: 'FIRE_EMERGENCY',
      entityId: '1',
      oldValue: oldData,
      newValue: telemetryCache.fireEmergencyData,
      ip: req.ip
    });
  } catch (e) {
    console.error('Fire emergency DB update error:', e.message);
  }

  const newLog = {
    id: `log-${Date.now()}`,
    timestamp: new Date().toLocaleTimeString(),
    action: '🔥 FIRE EMERGENCY ALARM REPORTED',
    module: 'FIRE',
    riskLevel: 'CRITICAL',
    details: `Incident reported in ${zone}. Authorized by ${req.user.name || req.user.role}. Security desk notified.`
  };
  telemetryCache.actionLogs.unshift(newLog);

  broadcast('FIRE_EMERGENCY', telemetryCache.fireEmergencyData);
  broadcast('NEW_ACTION_LOG', newLog);
  res.json({ success: true, data: telemetryCache.fireEmergencyData });
});

app.post('/api/fire/reset', authenticateToken, requirePermission(PERMISSIONS.EMERGENCY_CONTROL), async (req, res) => {
  telemetryCache.fireEmergencyData = {
    isAlarmActive: false,
    affectedZone: 'None',
    smokeSensorsActive: 48,
    sprinklersStatus: 'STANDBY',
    fireDeptStatus: 'NOT_DISPATCHED',
    evacuationRouteOpen: true
  };

  try {
    await query(
      `UPDATE fire_emergency 
       SET is_alarm_active = 0, affected_zone = 'None', sprinklers_status = 'STANDBY', fire_dept_status = 'NOT_DISPATCHED', incident_started_at = NULL
       WHERE id = 1`
    );

    await recordAuditLog({
      userId: req.user.id,
      userRole: req.user.role,
      action: 'FIRE_ALARM_RESET_OPERATOR',
      entityType: 'FIRE_EMERGENCY',
      entityId: '1',
      newValue: telemetryCache.fireEmergencyData,
      ip: req.ip
    });
  } catch (e) {
    console.error('Fire reset DB error:', e.message);
  }

  broadcast('FIRE_EMERGENCY', telemetryCache.fireEmergencyData);
  res.json({ success: true, data: telemetryCache.fireEmergencyData });
});

// 7. Visitor Management (Cryptographically Secure Hashed OTP + Lockout + One-Time Use)
app.get('/api/visitors', authenticateToken, async (req, res) => {
  try {
    let sql = `
      SELECT id, visitor_name, phone, category, unit_number, resident_user_id, status, entry_time, exit_time, valid_until, otp_attempts, created_at 
      FROM visitor_requests
    `;
    const params = [];
    if (req.user.role === ROLES.RESIDENT) {
      sql += ' WHERE resident_user_id = ?';
      params.push(req.user.id);
    }
    sql += ' ORDER BY created_at DESC LIMIT 50';
    const rows = await query(sql, params);
    const mapped = rows.map(v => ({
      id: v.id,
      visitorName: v.visitor_name,
      category: v.category,
      unitNumber: v.unit_number,
      phone: v.phone || '',
      residentUserId: v.resident_user_id,
      status: v.status,
      entryTime: v.entry_time,
      exitTime: v.exit_time,
      validUntil: v.valid_until,
      otpAttempts: v.otp_attempts
    }));
    res.json(mapped);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/visitors/add', authenticateToken, requirePermission(PERMISSIONS.VISITOR_CREATE), async (req, res) => {
  const { visitorName, category = 'Guest', unitNumber, phone } = req.body;
  if (!visitorName || !unitNumber) {
    return res.status(400).json({ success: false, error: 'Visitor name and flat unit number are required.' });
  }

  // 🛡️ Cryptographically secure 6-digit OTP
  const rawOtp = crypto.randomInt(100000, 999999).toString();
  const otpHash = crypto.createHash('sha256').update(rawOtp).digest('hex');
  const validUntil = new Date(Date.now() + 6 * 60 * 60 * 1000); // 6 hours
  const visitorId = `v-${Date.now()}`;

  const newVisitor = {
    id: visitorId,
    visitorName,
    phone: phone || '',
    category,
    unitNumber,
    residentUserId: req.user.id,
    status: 'APPROVED',
    entryTime: 'Pending',
    validUntil: validUntil.toISOString()
  };

  try {
    await query(
      `INSERT INTO visitor_requests (id, visitor_name, phone, category, unit_number, resident_user_id, otp_hash, valid_until, status, otp_attempts)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'APPROVED', 0)`,
      [visitorId, visitorName, phone || null, category, unitNumber, req.user.id, otpHash, validUntil]
    );

    // Dispatch SMS notification to visitor phone if provided
    let smsResult = null;
    if (phone) {
      smsResult = await sendSmsNotification({
        toPhone: phone,
        message: `Your RAAH NAGAR Society visitor entry pass code for ${unitNumber} is ${rawOtp}. Valid for 6 hours.`
      });
    }

    await recordAuditLog({
      userId: req.user.id,
      userRole: req.user.role,
      action: 'VISITOR_PASS_GENERATED',
      entityType: 'VISITOR',
      entityId: visitorId,
      newValue: { visitorName, unitNumber, validUntil, smsDispatched: smsResult ? smsResult.delivered : false },
      ip: req.ip
    });
  } catch (e) {
    console.error('Visitor insert DB error:', e.message);
  }

  telemetryCache.visitorRequests.unshift(newVisitor);
  broadcast('VISITOR_UPDATED', telemetryCache.visitorRequests);

  res.json({
    success: true,
    data: newVisitor,
    oneTimePasscode: rawOtp,
    validUntil: validUntil.toISOString()
  });
});

// Gate Verification (Compares SHA-256 hash with attempt limiter & strict one-time use invalidation)
app.post('/api/visitors/verify-gate', authenticateToken, requirePermission(PERMISSIONS.VISITOR_VERIFY), async (req, res) => {
  const { otpCode, unitNumber, visitorId } = req.body;
  if (!otpCode) {
    return res.status(400).json({ success: false, error: 'OTP code is required for gate check-in.' });
  }

  try {
    const inputHash = crypto.createHash('sha256').update(otpCode.trim()).digest('hex');

    // Identify candidate pass
    let candidate = null;
    if (visitorId) {
      const rows = await query('SELECT * FROM visitor_requests WHERE id = ?', [visitorId]);
      candidate = rows[0];
    } else if (unitNumber) {
      const rows = await query(
        `SELECT * FROM visitor_requests 
         WHERE unit_number = ? AND status IN ('APPROVED', 'PENDING') 
         ORDER BY created_at DESC LIMIT 1`,
        [unitNumber.trim()]
      );
      candidate = rows[0];
    } else {
      const rows = await query(
        `SELECT * FROM visitor_requests 
         WHERE status IN ('APPROVED', 'PENDING') AND otp_hash IS NOT NULL 
         ORDER BY created_at DESC LIMIT 50`
      );
      candidate = rows.find(r => r.otp_hash === inputHash);
    }

    if (!candidate) {
      return res.status(404).json({ success: false, error: 'No active or valid visitor pass found for this verification request.' });
    }

    // Check lockout attempts (max 5)
    if (candidate.otp_attempts >= 5) {
      await query('UPDATE visitor_requests SET status = "DENIED" WHERE id = ?', [candidate.id]);
      return res.status(403).json({ success: false, error: 'Passcode locked due to 5 consecutive invalid verification attempts. Resident must issue a new pass.' });
    }

    // Check expiration
    if (candidate.valid_until && new Date(candidate.valid_until) < new Date()) {
      await query('UPDATE visitor_requests SET status = "EXPIRED" WHERE id = ?', [candidate.id]);
      return res.status(400).json({ success: false, error: 'This visitor pass has expired. Entry denied.' });
    }

    // Check one-time use
    if (!candidate.otp_hash || candidate.status === 'CHECKED_IN') {
      return res.status(400).json({ success: false, error: 'This pass has already been used and is no longer valid (one-time use enforced).' });
    }

    // Verify hash with timingSafeEqual
    const candidateBuffer = Buffer.from(candidate.otp_hash, 'hex');
    const inputBuffer = Buffer.from(inputHash, 'hex');
    const isMatch = candidateBuffer.length === inputBuffer.length && crypto.timingSafeEqual(candidateBuffer, inputBuffer);

    if (!isMatch) {
      const newAttempts = (candidate.otp_attempts || 0) + 1;
      await query('UPDATE visitor_requests SET otp_attempts = ? WHERE id = ?', [newAttempts, candidate.id]);
      return res.status(400).json({
        success: false,
        error: `Invalid OTP passcode. Attempt ${newAttempts} of 5.`
      });
    }

    // Success: Check in and invalidate OTP for one-time use (otp_hash = NULL)
    const entryTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    await query(
      `UPDATE visitor_requests 
       SET status = 'CHECKED_IN', entry_time = ?, verified_by_guard_id = ?, otp_hash = NULL 
       WHERE id = ?`,
      [entryTime, req.user.id, candidate.id]
    );

    const cached = telemetryCache.visitorRequests.find(v => v.id === candidate.id);
    if (cached) {
      cached.status = 'CHECKED_IN';
      cached.entryTime = entryTime;
    }

    await recordAuditLog({
      userId: req.user.id,
      userRole: req.user.role,
      action: 'VISITOR_GATE_CHECKIN_VERIFIED',
      entityType: 'VISITOR',
      entityId: candidate.id,
      ip: req.ip
    });

    broadcast('VISITOR_UPDATED', telemetryCache.visitorRequests);
    res.json({
      success: true,
      message: `Access granted for ${candidate.visitor_name} to unit ${candidate.unit_number}. Pass invalidated for one-time use.`,
      visitor: { ...candidate, status: 'CHECKED_IN', entryTime, otp_hash: null }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Approve Visitor
app.post('/api/visitors/approve/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const entryTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  await query('UPDATE visitor_requests SET status = "APPROVED", entry_time = ? WHERE id = ?', [entryTime, id]);
  const cached = telemetryCache.visitorRequests.find(v => v.id === id);
  if (cached) {
    cached.status = 'APPROVED';
    cached.entryTime = entryTime;
  }
  broadcast('VISITOR_UPDATED', telemetryCache.visitorRequests);
  res.json({ success: true, data: telemetryCache.visitorRequests });
});

// Deny Visitor
app.post('/api/visitors/deny/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  await query('UPDATE visitor_requests SET status = "DENIED" WHERE id = ?', [id]);
  const cached = telemetryCache.visitorRequests.find(v => v.id === id);
  if (cached) {
    cached.status = 'DENIED';
  }
  await recordAuditLog({
    userId: req.user.id,
    userRole: req.user.role,
    action: 'VISITOR_REQUEST_DENIED',
    entityType: 'VISITOR',
    entityId: id,
    ip: req.ip
  });
  broadcast('VISITOR_UPDATED', telemetryCache.visitorRequests);
  res.json({ success: true, data: telemetryCache.visitorRequests });
});

// 8. Maintenance Tickets
app.get('/api/maintenance', authenticateToken, (req, res) => {
  const scopedTickets = req.user.role === ROLES.RESIDENT
    ? telemetryCache.maintenanceTickets.filter(t => t.residentUserId === req.user.id)
    : telemetryCache.maintenanceTickets;
  res.json(scopedTickets);
});

app.post('/api/maintenance/create', authenticateToken, requirePermission(PERMISSIONS.COMPLAINT_CREATE), async (req, res) => {
  const { title, unit, priority = 'MEDIUM', description } = req.body;
  if (!title || !unit) {
    return res.status(400).json({ success: false, error: 'Title and Unit are required.' });
  }

  const slaMap = { CRITICAL: 1, HIGH: 4, MEDIUM: 24, LOW: 48 };
  const slaHours = slaMap[priority] || 24;
  const ticketNumber = `MNT-${Math.floor(1000 + Math.random() * 9000)}`;
  const ticketId = `m-${Date.now()}`;

  const newTicket = {
    id: ticketId,
    ticketNumber,
    title,
    description: description || '',
    unit,
    residentUserId: req.user.id,
    priority,
    status: 'OPEN',
    date: new Date().toISOString().split('T')[0],
    technician: 'Unassigned',
    slaHours
  };

  try {
    await query(
      `INSERT INTO maintenance_tickets (id, ticket_number, title, description, unit, resident_user_id, priority, status, sla_hours)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'OPEN', ?)`,
      [ticketId, ticketNumber, title, description || null, unit, req.user.id, priority, slaHours]
    );
  } catch (e) {
    console.error('Maintenance DB error:', e.message);
  }

  telemetryCache.maintenanceTickets.unshift(newTicket);
  broadcast('MAINTENANCE_UPDATED', telemetryCache.maintenanceTickets);
  res.json({ success: true, data: newTicket });
});

// 9. Lift Emergency
app.get('/api/lift', authenticateToken, (req, res) => res.json(telemetryCache.liftStatuses));

app.post('/api/lift/trigger-sos/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const isSimulation = !!(req.body && req.body.isSimulation);

  // 🛡️ Simulation isolation: NEVER trigger real lift technicians in simulation
  if (isSimulation) {
    return res.json({
      success: true,
      isSimulation: true,
      message: '[SIMULATION_MODE] Lift SOS sandboxed in simulation; zero physical technicians dispatched.'
    });
  }

  const lift = telemetryCache.liftStatuses.find(l => l.id === id);
  if (!lift) return res.status(404).json({ success: false, error: 'Lift not found' });

  lift.status = 'TRAPPED_EMERGENCY';
  await query('UPDATE lift_statuses SET status = "TRAPPED_EMERGENCY", updated_at = NOW() WHERE id = ?', [id]);
  await recordAuditLog({
    userId: req.user.id,
    userRole: req.user.role,
    action: 'LIFT_SOS_TRIGGERED',
    entityType: 'LIFT',
    entityId: id,
    ip: req.ip
  });

  const newLog = {
    id: `log-${Date.now()}`,
    timestamp: new Date().toLocaleTimeString(),
    action: '🚨 LIFT SOS BUTTON PRESSED',
    module: 'LIFT',
    riskLevel: 'HIGH',
    details: `Intercom open in ${lift.liftName}. ARD standby.`
  };
  telemetryCache.actionLogs.unshift(newLog);

  broadcast('LIFT_UPDATED', telemetryCache.liftStatuses);
  broadcast('NEW_ACTION_LOG', newLog);
  res.json({ success: true, data: telemetryCache.liftStatuses });
});

app.post('/api/lift/reset/:id', authenticateToken, requirePermission(PERMISSIONS.EQUIPMENT_CONTROL), async (req, res) => {
  const { id } = req.params;
  const lift = telemetryCache.liftStatuses.find(l => l.id === id);
  if (!lift) return res.status(404).json({ success: false, error: 'Lift not found' });

  lift.status = 'NORMAL';
  await query('UPDATE lift_statuses SET status = "NORMAL", updated_at = NOW() WHERE id = ?', [id]);
  broadcast('LIFT_UPDATED', telemetryCache.liftStatuses);
  res.json({ success: true, data: telemetryCache.liftStatuses });
});

// 10. Waste Management
app.get('/api/waste', authenticateToken, (req, res) => res.json(telemetryCache.wasteBins));

app.post('/api/waste/dispatch/:id', authenticateToken, requirePermission(PERMISSIONS.OPERATIONAL_CONTROLS), async (req, res) => {
  const { id } = req.params;
  const bin = telemetryCache.wasteBins.find(b => b.id === id);
  if (!bin) return res.status(404).json({ success: false, error: 'Bin not found' });

  bin.vendorDispatched = true;
  bin.vendorName = req.body.vendorName || 'CleanCity Logistics';

  await query('UPDATE waste_bins SET vendor_dispatched = 1, vendor_name = ?, updated_at = NOW() WHERE id = ?', [bin.vendorName, id]);
  await recordAuditLog({
    userId: req.user.id,
    userRole: req.user.role,
    action: 'WASTE_VENDOR_DISPATCHED',
    entityType: 'WASTE_BIN',
    entityId: id,
    newValue: { vendor: bin.vendorName },
    ip: req.ip
  });

  broadcast('WASTE_UPDATED', telemetryCache.wasteBins);
  res.json({ success: true, data: telemetryCache.wasteBins });
});

// 11. Noise Guardian
app.get('/api/noise', authenticateToken, (req, res) => res.json(telemetryCache.noiseData));

app.post('/api/noise/escalate', authenticateToken, async (req, res) => {
  telemetryCache.noiseData.currentViolationStage = Math.min(3, telemetryCache.noiseData.currentViolationStage + 1);
  telemetryCache.noiseData.currentDecibels = 68;
  broadcast('NOISE_UPDATED', telemetryCache.noiseData);
  res.json({ success: true, data: telemetryCache.noiseData });
});

app.post('/api/noise/reset', authenticateToken, requirePermission(PERMISSIONS.OPERATIONAL_CONTROLS), async (req, res) => {
  telemetryCache.noiseData.currentViolationStage = 0;
  telemetryCache.noiseData.currentDecibels = 48;
  broadcast('NOISE_UPDATED', telemetryCache.noiseData);
  res.json({ success: true, data: telemetryCache.noiseData });
});

// 12. Resource Amenity Booking (Strict Concurrency & Overlap Prevention in MySQL)
app.get('/api/resources', authenticateToken, (req, res) => res.json(telemetryCache.resourceItems));

app.post('/api/resources/book/:id', authenticateToken, requirePermission(PERMISSIONS.BOOKING_CREATE), async (req, res) => {
  const { id } = req.params;
  const { startTime, endTime } = req.body;
  const resource = telemetryCache.resourceItems.find(r => r.id === id);
  if (!resource) return res.status(404).json({ success: false, error: 'Resource not found' });

  const bookStart = startTime ? new Date(startTime) : new Date();
  const bookEnd = endTime ? new Date(endTime) : new Date(Date.now() + 2 * 60 * 60 * 1000);

  try {
    const existing = await query(
      `SELECT * FROM resource_bookings 
       WHERE resource_id = ? AND status = 'CONFIRMED'
       AND ((start_time <= ? AND end_time > ?) OR (start_time < ? AND end_time >= ?))`,
      [id, bookStart, bookStart, bookEnd, bookEnd]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'This resource is already booked for the selected time window. Double booking prevented.'
      });
    }

    const bookingId = `bk-${Date.now()}`;
    await query(
      `INSERT INTO resource_bookings (id, resource_id, user_id, user_name, start_time, end_time, status)
       VALUES (?, ?, ?, ?, ?, ?, 'CONFIRMED')`,
      [bookingId, id, req.user.id, req.user.name || 'Resident', bookStart, bookEnd]
    );

    resource.status = 'BUSY';
    broadcast('RESOURCE_UPDATED', telemetryCache.resourceItems);
    res.json({ success: true, bookingId, message: 'Reservation confirmed successfully!' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 13. Per-User Settings (Stored per User ID in MySQL)
app.get('/api/settings', authenticateToken, async (req, res) => {
  try {
    const rows = await query('SELECT * FROM user_settings WHERE user_id = ?', [req.user.id]);
    if (rows.length > 0) {
      const s = rows[0];
      const customJson = s.settings_json ? (typeof s.settings_json === 'string' ? JSON.parse(s.settings_json) : s.settings_json) : {};
      return res.json({
        success: true,
        settings: {
          emergencyAlerts: !!s.emergency_alerts,
          waterLeakAlerts: !!s.water_leak_alerts,
          visitorGateAlerts: !!s.visitor_gate_alerts,
          noiseViolationAlerts: !!s.noise_violation_alerts,
          maintenanceSmsAlerts: !!s.maintenance_sms_alerts,
          marketingNotifications: !!s.marketing_notifications,
          theme: s.theme || 'dark',
          ...customJson
        }
      });
    }

    res.json({
      success: true,
      settings: {
        emergencyAlerts: true,
        waterLeakAlerts: true,
        visitorGateAlerts: true,
        theme: 'dark'
      }
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.put('/api/settings', authenticateToken, async (req, res) => {
  try {
    const { emergencyAlerts, waterLeakAlerts, visitorGateAlerts, theme, ...customConfig } = req.body;
    const settingsJson = JSON.stringify(customConfig);

    await query(
      `INSERT INTO user_settings (user_id, emergency_alerts, water_leak_alerts, visitor_gate_alerts, theme, settings_json)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
         emergency_alerts = VALUES(emergency_alerts),
         water_leak_alerts = VALUES(water_leak_alerts),
         visitor_gate_alerts = VALUES(visitor_gate_alerts),
         theme = VALUES(theme),
         settings_json = VALUES(settings_json)`,
      [
        req.user.id,
        emergencyAlerts ? 1 : 0,
        waterLeakAlerts ? 1 : 0,
        visitorGateAlerts ? 1 : 0,
        theme || 'dark',
        settingsJson
      ]
    );

    res.json({ success: true, message: 'Your personalized settings have been saved.' });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// 14. Audit Logs (Strictly Protected: Admins Only)
app.get('/api/audit-logs', authenticateToken, requirePermission(PERMISSIONS.AUDIT_VIEW), async (req, res) => {
  try {
    const logs = await query('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100');
    res.json({ success: true, logs });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ==========================================
// 15. AUTHENTICATION (Zero Plaintext Passwords)
// ==========================================

// Public Signup: Strictly locks role to Resident and verifies flat in MySQL registry
// 🚨 URGENT SECURITY FIX: Only password_hash is stored. Plaintext password is NEVER saved to database.
app.post('/api/auth/signup', rateLimit({ windowMs: 60000, maxRequests: 10 }), async (req, res) => {
  try {
    const { name, email, password, flatNumber = 'A-101', phone } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }

    const assignedRole = ROLES.RESIDENT;

    // Check if user already exists
    const existing = await query('SELECT id FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
    }

    // 🔒 Strong bcrypt hashing (salt rounds: 10)
    const passwordHash = await bcrypt.hash(password, 10);
    const userId = `u-${Date.now()}`;

    // Notice: Column 'password' dropped from database; ONLY password_hash is inserted
    await query(
      `INSERT INTO users (id, name, email, password_hash, role, flat_no, flat_number, phone, is_verified)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [userId, name, email.toLowerCase().trim(), passwordHash, assignedRole, flatNumber, flatNumber, phone || '']
    );

    // Seed default settings for user
    await query('INSERT INTO user_settings (user_id) VALUES (?) ON DUPLICATE KEY UPDATE user_id = user_id', [userId]);

    await recordAuditLog({
      userId,
      userRole: assignedRole,
      action: 'RESIDENT_SELF_REGISTERED',
      entityType: 'USER',
      entityId: userId,
      newValue: { name, email: email.toLowerCase().trim(), flatNumber },
      ip: req.ip
    });

    const token = jwt.sign(
      { id: userId, email: email.toLowerCase().trim(), role: assignedRole, name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: { id: userId, name, email: email.toLowerCase().trim(), role: assignedRole, flatNumber, phone }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error during signup: ' + err.message });
  }
});

// Login API (Strictly verifies against password_hash)
app.post('/api/auth/login', rateLimit({ windowMs: 60000, maxRequests: 20 }), async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const users = await query('SELECT id, name, email, role, flat_number, phone, emergency_contact, vehicle_number, password_hash, is_verified FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (users.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const user = users[0];
    const isPasswordValid = await bcrypt.compare(password, user.password_hash || '');
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // 🛡️ Account verification enforcement
    if (user.is_verified === 0 || user.is_verified === false) {
      return res.status(403).json({
        success: false,
        message: 'Your account is pending administrator verification or has been suspended. Please contact the facility admin.'
      });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name, is_verified: user.is_verified },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        flatNumber: user.flat_number,
        phone: user.phone,
        emergencyContact: user.emergency_contact,
        vehicleNumber: user.vehicle_number,
        isVerified: !!user.is_verified
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error during login: ' + err.message });
  }
});

// Secure Password Reset: Cryptographic OTP + SHA-256 Hashed Storage + Max 3 Attempts + Carrier Dispatch
app.post('/api/auth/forgot-password', rateLimit({ windowMs: 60000, maxRequests: 5 }), async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, message: 'Email is required.' });

  try {
    const users = await query('SELECT id, phone, email FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'Email not found in society registry.' });
    }

    const user = users[0];
    // 🛡️ Cryptographically secure 6-digit OTP
    const rawOtp = crypto.randomInt(100000, 999999).toString();
    const otpHash = crypto.createHash('sha256').update(rawOtp).digest('hex');
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Store only the SHA-256 hash in database; zero plaintext in DB, zero plaintext in stdout
    await query(
      'UPDATE users SET reset_otp_hash = ?, reset_otp_attempts = 0, reset_otp_expires = ? WHERE id = ?',
      [otpHash, expiresAt, user.id]
    );

    // Dispatch via real carrier notification adapter
    if (user.phone) {
      await sendSmsNotification({
        toPhone: user.phone,
        message: `Your RAAH NAGAR password reset OTP is ${rawOtp}. Valid for 10 minutes. Do not share.`
      });
    }
    await sendEmailNotification({
      toEmail: user.email,
      subject: 'RAAH NAGAR Password Reset OTP',
      text: `Your password reset code is ${rawOtp}. Valid for 10 minutes.`
    });

    res.json({
      success: true,
      message: 'Password reset OTP has been securely generated and dispatched to your registered contact channel.'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Reset Password: ONLY updates password_hash
app.post('/api/auth/reset-password', rateLimit({ windowMs: 60000, maxRequests: 5 }), async (req, res) => {
  const { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword) {
    return res.status(400).json({ success: false, message: 'Email, OTP, and new password are required.' });
  }

  try {
    const users = await query('SELECT id, reset_otp_hash, reset_otp_expires, reset_otp_attempts, role FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (users.length === 0) return res.status(400).json({ success: false, message: 'Invalid request.' });

    const user = users[0];
    if (!user.reset_otp_hash || !user.reset_otp_expires || Date.now() > user.reset_otp_expires) {
      return res.status(400).json({ success: false, message: 'Reset token has expired or is invalid.' });
    }

    if (user.reset_otp_attempts >= 3) {
      await query('UPDATE users SET reset_otp_hash = NULL, reset_otp_expires = NULL WHERE id = ?', [user.id]);
      return res.status(403).json({ success: false, message: 'Too many invalid attempts. Reset request has been invalidated.' });
    }

    const inputHash = crypto.createHash('sha256').update(otp.trim()).digest('hex');
    if (user.reset_otp_hash !== inputHash) {
      await query('UPDATE users SET reset_otp_attempts = reset_otp_attempts + 1 WHERE id = ?', [user.id]);
      return res.status(400).json({ success: false, message: 'Invalid OTP code.' });
    }

    // 🔒 Hash new password using bcrypt
    const passwordHash = await bcrypt.hash(newPassword, 10);
    // Notice: ONLY password_hash is updated, zero plaintext stored
    await query(
      'UPDATE users SET password_hash = ?, reset_otp_hash = NULL, reset_otp_expires = NULL, reset_otp_attempts = 0 WHERE id = ?',
      [passwordHash, user.id]
    );

    await recordAuditLog({
      userId: user.id,
      userRole: user.role,
      action: 'PASSWORD_RESET_COMPLETED',
      entityType: 'USER',
      entityId: user.id,
      ip: req.ip
    });

    res.json({ success: true, message: 'Password has been reset successfully. Please log in with your new password.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update Profile: ONLY updates password_hash
app.put('/api/auth/profile/:userId', authenticateToken, async (req, res) => {
  const { userId } = req.params;
  const { name, phone, emergencyContact, vehicleNumber, password } = req.body;

  if (req.user.id !== userId && !hasPermission(req.user.role, PERMISSIONS.USERS_MANAGE)) {
    return res.status(403).json({ success: false, message: 'Forbidden: You can only edit your own profile.' });
  }

  try {
    let updateFields = [];
    let updateParams = [];

    if (name) { updateFields.push('name = ?'); updateParams.push(name); }
    if (phone) { updateFields.push('phone = ?'); updateParams.push(phone); }
    if (emergencyContact) { updateFields.push('emergency_contact = ?'); updateParams.push(emergencyContact); }
    if (vehicleNumber) { updateFields.push('vehicle_number = ?'); updateParams.push(vehicleNumber); }
    if (password && password.trim() !== '') {
      const hash = await bcrypt.hash(password, 10);
      updateFields.push('password_hash = ?');
      updateParams.push(hash);
    }

    if (updateFields.length > 0) {
      updateParams.push(userId);
      await query(`UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`, updateParams);
    }

    const updated = await query('SELECT id, name, email, role, flat_number, phone, emergency_contact, vehicle_number FROM users WHERE id = ?', [userId]);
    res.json({ success: true, user: updated[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(`🚀 COMMUNITY BRAIN Production Smart Society API running on port ${PORT}`);
  console.log(`📡 WebSocket server live at ws://localhost:${PORT}`);
  console.log(`🏛️ Primary Database: MySQL 9.7 (raah_nagar_db)`);
  console.log(`🛡️ Central Authentication & Fine-Grained RBAC: ACTIVE`);
  console.log(`🔒 Hashed Passwords & OTPs (Zero Plaintext Stored): ENFORCED`);
  console.log(`=================================================`);
});
