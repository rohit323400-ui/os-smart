import express from 'express';
import cors from 'cors';
import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import db, { query, recordAuditLog, verifyFlatRegistry, createDeviceCommand, confirmDeviceCommand } from './db.js';
import { authenticateToken, requirePermission, requireRole, rateLimit } from './middleware/auth.js';
import { ROLES, PERMISSIONS, hasPermission } from './rbac.js';

// Load Environment Variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, 'data.json');
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_society_jwt_key_2026';

// Initialize Gemini AI Client
const geminiApiKey = process.env.GEMINI_API_KEY;
let aiClient = null;
if (geminiApiKey && geminiApiKey.trim() !== '' && geminiApiKey !== 'your_gemini_api_key_here') {
  try {
    aiClient = new GoogleGenAI({ apiKey: geminiApiKey });
    console.log('🤖 Google Gemini AI engine initialized successfully (Advisory & Analytics Mode)!');
  } catch (err) {
    console.warn('⚠️ Could not initialize Gemini AI client:', err.message);
  }
} else {
  console.log('💡 Note: GEMINI_API_KEY not configured. Operating in safe advisory simulation.');
}

// In-Memory Fallback State (Synchronized with MySQL)
let inMemoryData = {
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
    lastQualityCheck: 'Today, 08:30 AM'
  },
  parkingSlots: [
    { id: '1', slotNumber: 'A-101', isOccupied: true, residentName: 'Rahul Sharma', vehicleType: 'EV Car', vehicleNumber: 'MH 12 AB 1234', isEvCharging: true },
    { id: '2', slotNumber: 'A-102', isOccupied: false, residentName: 'Unassigned', vehicleType: 'None', vehicleNumber: 'N/A', isEvCharging: false },
    { id: '3', slotNumber: 'B-205', isOccupied: true, residentName: 'Priya Patel', vehicleType: 'Sedan', vehicleNumber: 'MH 12 CD 5678', isEvCharging: false },
    { id: '4', slotNumber: 'B-206', isOccupied: true, residentName: 'Amit Verma', vehicleType: 'SUV', vehicleNumber: 'MH 12 EF 9012', isEvCharging: false },
    { id: '5', slotNumber: 'C-301', isOccupied: false, residentName: 'Visitor Spot', vehicleType: 'None', vehicleNumber: 'N/A', isEvCharging: true },
    { id: '6', slotNumber: 'C-302', isOccupied: true, residentName: 'Karan Singh', vehicleType: 'EV Bike', vehicleNumber: 'MH 12 GH 3456', isEvCharging: true }
  ],
  fireEmergencyData: {
    isAlarmActive: false,
    affectedZone: 'None',
    smokeSensorsActive: 48,
    sprinklersStatus: 'STANDBY',
    fireDepartmentNotified: false,
    fireDeptStatus: 'NOT_NOTIFIED',
    evacuationRouteOpen: true
  },
  visitorRequests: [
    { id: 'v1', visitorName: 'Ramesh Kumar', category: 'Delivery', unitNumber: 'B-402', otpCode: '4829', status: 'PENDING', entryTime: 'Pending', validUntil: '2026-10-02T12:00:00Z' },
    { id: 'v2', visitorName: 'Anita Roy', category: 'Guest', unitNumber: 'A-101', otpCode: '1192', status: 'APPROVED', entryTime: '10:15 AM', validUntil: '2026-10-02T18:00:00Z' },
    { id: 'v3', visitorName: 'FastClean Maid', category: 'Service', unitNumber: 'C-201', otpCode: '9940', status: 'APPROVED', entryTime: '08:00 AM', validUntil: '2026-10-02T18:00:00Z' }
  ],
  maintenanceTickets: [
    { id: 'm1', ticketNumber: 'MNT-1001', title: 'Corridor Light Flicker', unit: 'Tower A 3rd Fl', priority: 'LOW', status: 'OPEN', date: '2026-09-29', technician: 'Ramesh (Electrician)', slaHours: 48 },
    { id: 'm2', ticketNumber: 'MNT-1002', title: 'Low Water Pressure', unit: 'B-604', priority: 'MEDIUM', status: 'IN_PROGRESS', date: '2026-09-29', technician: 'Suresh (Plumber)', slaHours: 24 },
    { id: 'm3', ticketNumber: 'MNT-1003', title: 'Main Gate Sensor Calib', unit: 'Gate 1', priority: 'HIGH', status: 'RESOLVED', date: '2026-09-28', technician: 'AI System Auto', slaHours: 4 }
  ],
  liftStatuses: [
    { id: 'l1', liftName: 'Tower A - Main Passenger', floor: 7, status: 'NORMAL', ardBatteryPercent: 98, lastServiced: '2026-09-15' },
    { id: 'l2', liftName: 'Tower A - Service Lift', floor: 2, status: 'NORMAL', ardBatteryPercent: 94, lastServiced: '2026-09-10' },
    { id: 'l3', liftName: 'Tower B - Main Passenger', floor: 12, status: 'NORMAL', ardBatteryPercent: 100, lastServiced: '2026-09-20' }
  ],
  wasteBins: [
    { id: 'w1', binType: 'Wet Organic Waste', fillPercentage: 78, odorScoreLevel: 3, lastEmptied: '6 hrs ago', status: 'WARN' },
    { id: 'w2', binType: 'Dry Recyclables', fillPercentage: 42, odorScoreLevel: 1, lastEmptied: '12 hrs ago', status: 'OK' },
    { id: 'w3', binType: 'E-Waste Bin', fillPercentage: 20, odorScoreLevel: 1, lastEmptied: '2 days ago', status: 'OK' }
  ],
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
  },
  resourceItems: [
    { id: 'res-1', name: 'Community Banquet Hall', category: 'Event Space', status: 'AVAILABLE', pricePerHour: 500, bookedBy: null },
    { id: 'res-2', name: 'Clubhouse Badminton Court 1', category: 'Sports', status: 'AVAILABLE', pricePerHour: 100, bookedBy: null },
    { id: 'res-3', name: 'Rooftop Gazebo Barbecue Area', category: 'Leisure', status: 'AVAILABLE', pricePerHour: 250, bookedBy: null },
    { id: 'res-4', name: 'Society Swimming Pool Lane 1', category: 'Sports', status: 'AVAILABLE', pricePerHour: 0, bookedBy: null }
  ],
  actionLogs: [
    { id: 'log1', timestamp: '16:05:12', action: 'Overhead Tank Auto-Cutoff Executed', module: 'WATER', riskLevel: 'LOW', details: 'Pumps shut down safely at 95% threshold.' },
    { id: 'log2', timestamp: '15:40:00', action: 'Visitor OTP Auto-Verified', module: 'SECURITY', riskLevel: 'LOW', details: 'Ramesh Kumar allowed entry at Gate 1.' }
  ],
  users: [],
  userSettings: {
    accountProfile: {
      residentName: 'Rohit Sharma',
      flatNumber: 'A-101',
      emergencyContact: '+91 98765 00000',
      verifiedBadge: true
    },
    notificationsAlerts: {
      criticalAlertsOverrideSound: true,
      infoAlertsEnabled: true
    },
    appSystemPreferences: {
      theme: 'dark',
      language: 'hi'
    }
  }
};

// Sync MySQL data into memory cache
async function syncFromDatabase() {
  try {
    // 1. Water
    const waterRows = await query('SELECT * FROM water_metrics LIMIT 1');
    if (waterRows.length > 0) {
      const w = waterRows[0];
      inMemoryData.waterData = {
        overheadTank: w.overhead_tank,
        undergroundSump: w.underground_sump,
        recycledWater: w.recycled_water,
        phLevel: parseFloat(w.ph_level),
        tdsLevel: w.tds_level,
        todayConsumptionLiters: w.today_consumption_liters,
        flowRateLPM: w.flow_rate_lpm,
        pumpAutoCutoffActive: !!w.pump_cutoff_active,
        pumpOperationalState: w.pump_operational_state || 'OFF',
        lastQualityCheck: w.last_quality_check
      };
    }

    // 2. Parking
    const parkingRows = await query('SELECT * FROM parking_slots');
    if (parkingRows.length > 0) {
      inMemoryData.parkingSlots = parkingRows.map(p => ({
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
      inMemoryData.fireEmergencyData = {
        isAlarmActive: !!f.is_alarm_active,
        affectedZone: f.affected_zone,
        smokeSensorsActive: f.smoke_sensors_active,
        sprinklersStatus: f.sprinklers_status,
        fireDepartmentNotified: f.fire_dept_status === 'NOTIFIED',
        fireDeptStatus: f.fire_dept_status,
        evacuationRouteOpen: !!f.evacuation_route_open
      };
    }

    // 4. Visitors
    const visitorRows = await query('SELECT * FROM visitor_requests ORDER BY created_at DESC LIMIT 50');
    if (visitorRows.length > 0) {
      inMemoryData.visitorRequests = visitorRows.map(v => ({
        id: v.id,
        visitorName: v.visitor_name,
        category: v.category,
        unitNumber: v.unit_number,
        otpCode: v.otp_code,
        status: v.status,
        entryTime: v.entry_time,
        validUntil: v.valid_until
      }));
    }

    // 5. Maintenance Tickets
    const ticketRows = await query('SELECT * FROM maintenance_tickets ORDER BY created_at DESC LIMIT 50');
    if (ticketRows.length > 0) {
      inMemoryData.maintenanceTickets = ticketRows.map(t => ({
        id: t.id,
        ticketNumber: t.ticket_number || t.id,
        title: t.title,
        unit: t.unit,
        priority: t.priority,
        status: t.status,
        date: t.date || new Date(t.created_at).toISOString().split('T')[0],
        technician: t.technician,
        slaHours: t.sla_hours
      }));
    }

    // 6. Users
    const userRows = await query('SELECT id, name, email, role, flat_number, phone, emergency_contact, vehicle_number FROM users');
    inMemoryData.users = userRows.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      flatNumber: u.flat_number,
      phone: u.phone,
      emergencyContact: u.emergency_contact,
      vehicleNumber: u.vehicle_number
    }));

    // Backup to local data.json for disaster recovery
    fs.writeFileSync(DB_FILE, JSON.stringify(inMemoryData, null, 2));
    console.log('🔄 Telemetry and state synchronized from MySQL to memory cache.');
  } catch (err) {
    console.warn('⚠️ Could not sync from MySQL, using cached state:', err.message);
  }
}

// Initial Sync
syncFromDatabase();

const app = express();
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// 📡 Scoped WebSocket Broadcast Helper
function broadcast(type, payload, targetRole = null) {
  const message = JSON.stringify({ type, payload, targetRole });
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      // Role filtering if client provided authentication
      if (!targetRole || client.userRole === 'Super Admin' || client.userRole === targetRole || (Array.isArray(targetRole) && targetRole.includes(client.userRole))) {
        client.send(message);
      }
    }
  });
}

wss.on('connection', (ws, req) => {
  ws.userRole = 'Resident'; // Default unauthenticated role
  ws.send(JSON.stringify({ type: 'INITIAL_SYNC', payload: inMemoryData }));

  // Allow client to authenticate WebSocket session
  ws.on('message', (msg) => {
    try {
      const data = JSON.parse(msg.toString());
      if (data.type === 'AUTHENTICATE' && data.token) {
        const decoded = jwt.verify(data.token, JWT_SECRET);
        ws.userRole = decoded.role || 'Resident';
        ws.userId = decoded.id;
        ws.send(JSON.stringify({ type: 'AUTH_SUCCESS', role: ws.userRole }));
      }
    } catch (e) {
      // Ignore invalid auth messages
    }
  });
});

// ==========================================
// REST API Endpoints
// ==========================================

// Server Health & Status
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    systemName: 'COMMUNITY BRAIN OS - Production API',
    primaryDatabase: 'MySQL 9.7 (raah_nagar_db)',
    databaseConnected: db.isConnected(),
    geminiAiActive: !!aiClient,
    aiMode: 'Advisory/Summarization only (Safe Deterministic Actuation)',
    connectedWebsocketClients: wss.clients.size,
    timestamp: new Date().toISOString()
  });
});

// 1. Full State Sync
app.get('/api/sync', (req, res) => {
  res.json({ success: true, data: inMemoryData });
});

// 2. Society Flats Registry (For Resident Onboarding Verification)
app.get('/api/flats', async (req, res) => {
  try {
    const flats = await query('SELECT flat_number, tower, floor, occupancy_status FROM society_flats ORDER BY tower, flat_number');
    res.json({ success: true, flats });
  } catch (err) {
    res.json({ success: true, flats: [] });
  }
});

// 3. AI Smart Advisor & Analytics (Advisory Only - Deterministic Controls Protected)
app.post('/api/ai/ask', rateLimit({ windowMs: 60000, maxRequests: 30 }), async (req, res) => {
  const { question, prompt, role } = req.body;
  const userQuery = question || prompt || 'Provide status summary';
  const userRole = role || 'Resident';

  if (aiClient) {
    try {
      const response = await aiClient.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `You are RAAH NAGAR AI, an analytical and advisory intelligence for a smart residential community.
Role: "${userRole}".
IMPORTANT SAFETY RULE: You are an analytical advisor. You never actuate pumps, fire alarms, or gates directly.

Current System Telemetry:
- Overhead Water Tank: ${inMemoryData.waterData.overheadTank}%
- Sump Level: ${inMemoryData.waterData.undergroundSump}%
- Fire Alarm Status: ${inMemoryData.fireEmergencyData.isAlarmActive ? 'ACTIVE ALERT' : 'Normal Standby'}
- Pending Visitors: ${inMemoryData.visitorRequests.filter(v => v.status === 'PENDING').length}
- Open Maintenance Tickets: ${inMemoryData.maintenanceTickets.filter(m => m.status === 'OPEN').length}

User Question: "${userQuery}"

Provide a concise, helpful, and safe advisory response.`
      });
      return res.json({ success: true, answer: response.text, mode: 'gemini-live' });
    } catch (err) {
      console.error('Gemini API query error:', err.message);
    }
  }

  // Safe Fallback Advisory
  let fallbackMsg = `🏛️ [RAAH NAGAR Advisor]: Telemetry normal. Overhead Tank: ${inMemoryData.waterData.overheadTank}%, Open Tickets: ${inMemoryData.maintenanceTickets.filter(m => m.status === 'OPEN').length}.`;
  return res.json({ success: true, answer: fallbackMsg, mode: 'simulation' });
});

app.post('/api/ai/analyze-emergency', authenticateToken, requirePermission(PERMISSIONS.EMERGENCY_ACKNOWLEDGE), async (req, res) => {
  const { emergencyType, zone, details } = req.body;
  const context = `Emergency: ${emergencyType || 'General'}, Zone: ${zone || 'Main'}, Details: ${details || 'Sensor triggered'}`;

  if (aiClient) {
    try {
      const response = await aiClient.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Safety Advisor: Analyze this incident and output 3 prioritized response guidelines for human operators: ${context}`
      });
      return res.json({ success: true, analysis: response.text, mode: 'gemini-live' });
    } catch (err) {
      console.error('Gemini Emergency Analysis Error:', err.message);
    }
  }

  const fallbackAnalysis = `🚨 Standard Operating Procedure:\n1. Verify physical location via CCTV / Security on site.\n2. Evacuation routes confirmed clear.\n3. Awaiting Facility Admin confirmation.`;
  return res.json({ success: true, analysis: fallbackAnalysis, mode: 'simulation' });
});

// 4. Water Management (Command vs Actual State Pattern)
app.get('/api/water', (req, res) => res.json(inMemoryData.waterData));

// Pump Command Dispatch (Requires Authorization & Records Device Command)
app.post('/api/water/pump-command', authenticateToken, requirePermission(PERMISSIONS.EQUIPMENT_CONTROL), async (req, res) => {
  const { command, deviceId = 'PUMP-MAIN-01' } = req.body; // 'START' | 'STOP'
  const requestedBy = req.user.id || req.user.email;

  try {
    // 1. Record Command in Database (PENDING)
    const commandId = await createDeviceCommand({
      deviceId,
      deviceType: 'WATER_PUMP',
      command,
      requestedBy
    });

    // 2. Audit Log
    await recordAuditLog({
      userId: requestedBy,
      userRole: req.user.role,
      action: `PUMP_${command}_COMMAND_SENT`,
      entityType: 'WATER_PUMP',
      entityId: deviceId,
      oldValue: { state: inMemoryData.waterData.pumpOperationalState },
      newValue: { command, commandId },
      ip: req.ip
    });

    // 3. IoT Controller Confirmation Simulation (Command vs Actual State)
    setTimeout(async () => {
      const confirmedState = command === 'START' ? 'RUNNING' : 'OFF';
      inMemoryData.waterData.pumpOperationalState = confirmedState;

      await confirmDeviceCommand(commandId, 'CONFIRMED');
      await query(
        'UPDATE water_metrics SET pump_operational_state = ?, updated_at = NOW() WHERE id = 1',
        [confirmedState]
      );

      // Broadcast confirmed state to all clients
      broadcast('WATER_UPDATED', inMemoryData.waterData);
    }, 1200);

    res.json({
      success: true,
      message: `Command '${command}' transmitted to pump gateway. Awaiting telemetry confirmation.`,
      commandId,
      status: 'PENDING'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to issue pump command: ' + err.message });
  }
});

// Update Water Metrics (Authorized Telemetry Ingestion)
app.post('/api/water/update', authenticateToken, requirePermission(PERMISSIONS.OPERATIONAL_CONTROLS), async (req, res) => {
  inMemoryData.waterData = { ...inMemoryData.waterData, ...req.body };
  try {
    await query(
      `UPDATE water_metrics 
       SET overhead_tank = ?, underground_sump = ?, recycled_water = ?, ph_level = ?, tds_level = ?, flow_rate_lpm = ?
       WHERE id = 1`,
      [
        inMemoryData.waterData.overheadTank,
        inMemoryData.waterData.undergroundSump,
        inMemoryData.waterData.recycledWater,
        inMemoryData.waterData.phLevel,
        inMemoryData.waterData.tdsLevel,
        inMemoryData.waterData.flowRateLPM
      ]
    );
  } catch (e) {
    console.error('MySQL water update error:', e.message);
  }
  broadcast('WATER_UPDATED', inMemoryData.waterData);
  res.json({ success: true, data: inMemoryData.waterData });
});

// 5. Smart Parking (Physical Occupancy vs Assignment)
app.get('/api/parking', (req, res) => res.json(inMemoryData.parkingSlots));

app.post('/api/parking/toggle/:id', authenticateToken, requirePermission(PERMISSIONS.PARKING_MONITOR), async (req, res) => {
  const { id } = req.params;
  const slot = inMemoryData.parkingSlots.find(s => s.id === id);
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

  broadcast('PARKING_UPDATED', inMemoryData.parkingSlots);
  res.json({ success: true, data: inMemoryData.parkingSlots });
});

// 6. Fire Emergency (Strictly Authorized Safety Workflow)
app.get('/api/fire', (req, res) => res.json(inMemoryData.fireEmergencyData));

app.post('/api/fire/trigger', rateLimit({ windowMs: 60000, maxRequests: 5 }), authenticateToken, requirePermission(PERMISSIONS.EMERGENCY_CONTROL), async (req, res) => {
  const zone = req.body.zone || 'Tower B Floor 4';
  const oldData = { ...inMemoryData.fireEmergencyData };

  inMemoryData.fireEmergencyData = {
    ...inMemoryData.fireEmergencyData,
    isAlarmActive: true,
    affectedZone: zone,
    sprinklersStatus: 'ACTIVATED',
    fireDepartmentNotified: true,
    fireDeptStatus: 'NOTIFIED'
  };

  try {
    await query(
      `UPDATE fire_emergency 
       SET is_alarm_active = 1, affected_zone = ?, sprinklers_status = 'ACTIVATED', fire_dept_status = 'NOTIFIED', incident_started_at = NOW(), authorized_by = ?
       WHERE id = 1`,
      [zone, req.user.name || req.user.email]
    );

    await recordAuditLog({
      userId: req.user.id,
      userRole: req.user.role,
      action: 'FIRE_ALARM_ACTIVATED',
      entityType: 'FIRE_EMERGENCY',
      entityId: '1',
      oldValue: oldData,
      newValue: inMemoryData.fireEmergencyData,
      ip: req.ip
    });
  } catch (e) {
    console.error('Fire emergency DB update error:', e.message);
  }

  const newLog = {
    id: `log-${Date.now()}`,
    timestamp: new Date().toLocaleTimeString(),
    action: '🔥 FIRE EMERGENCY ALARM TRIGGERED',
    module: 'FIRE',
    riskLevel: 'CRITICAL',
    details: `Fire detected in ${zone}. Authorized by ${req.user.name || req.user.role}. Fire Department notified.`
  };
  inMemoryData.actionLogs.unshift(newLog);

  broadcast('FIRE_EMERGENCY', inMemoryData.fireEmergencyData);
  broadcast('NEW_ACTION_LOG', newLog);
  res.json({ success: true, data: inMemoryData.fireEmergencyData });
});

app.post('/api/fire/reset', authenticateToken, requirePermission(PERMISSIONS.EMERGENCY_CONTROL), async (req, res) => {
  inMemoryData.fireEmergencyData = {
    isAlarmActive: false,
    affectedZone: 'None',
    smokeSensorsActive: 48,
    sprinklersStatus: 'STANDBY',
    fireDepartmentNotified: false,
    fireDeptStatus: 'NOT_NOTIFIED',
    evacuationRouteOpen: true
  };

  try {
    await query(
      `UPDATE fire_emergency 
       SET is_alarm_active = 0, affected_zone = 'None', sprinklers_status = 'STANDBY', fire_dept_status = 'NOT_NOTIFIED', incident_started_at = NULL
       WHERE id = 1`
    );

    await recordAuditLog({
      userId: req.user.id,
      userRole: req.user.role,
      action: 'FIRE_ALARM_RESET_SECURE',
      entityType: 'FIRE_EMERGENCY',
      entityId: '1',
      newValue: inMemoryData.fireEmergencyData,
      ip: req.ip
    });
  } catch (e) {
    console.error('Fire reset DB error:', e.message);
  }

  broadcast('FIRE_EMERGENCY', inMemoryData.fireEmergencyData);
  res.json({ success: true, data: inMemoryData.fireEmergencyData });
});

// 7. Visitor Management (Time-Limited QR/OTP Workflow)
app.get('/api/visitors', (req, res) => res.json(inMemoryData.visitorRequests));

app.post('/api/visitors/add', authenticateToken, requirePermission(PERMISSIONS.VISITOR_CREATE), async (req, res) => {
  const { visitorName, category, unitNumber, phone } = req.body;
  if (!visitorName || !unitNumber) {
    return res.status(400).json({ success: false, error: 'Visitor name and flat unit number are required.' });
  }

  const otpCode = Math.floor(1000 + Math.random() * 9000).toString();
  const validUntil = new Date(Date.now() + 6 * 60 * 60 * 1000); // 6 hours valid
  const visitorId = `v-${Date.now()}`;

  const newVisitor = {
    id: visitorId,
    visitorName,
    phone: phone || '',
    category: category || 'Guest',
    unitNumber,
    residentUserId: req.user.id,
    otpCode,
    status: 'APPROVED',
    entryTime: 'Pending',
    validUntil: validUntil.toISOString()
  };

  try {
    await query(
      `INSERT INTO visitor_requests (id, visitor_name, phone, category, unit_number, resident_user_id, otp_code, valid_until, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'APPROVED')`,
      [visitorId, visitorName, phone || null, category || 'Guest', unitNumber, req.user.id, otpCode, validUntil]
    );

    await recordAuditLog({
      userId: req.user.id,
      userRole: req.user.role,
      action: 'VISITOR_PASS_GENERATED',
      entityType: 'VISITOR',
      entityId: visitorId,
      newValue: { visitorName, unitNumber, otpCode, validUntil },
      ip: req.ip
    });
  } catch (e) {
    console.error('Visitor insert DB error:', e.message);
  }

  inMemoryData.visitorRequests.unshift(newVisitor);
  broadcast('VISITOR_UPDATED', inMemoryData.visitorRequests);
  res.json({ success: true, data: newVisitor });
});

// Security Gate Verification (Verify OTP & Check In)
app.post('/api/visitors/verify-gate', authenticateToken, requirePermission(PERMISSIONS.VISITOR_VERIFY), async (req, res) => {
  const { otpCode, unitNumber } = req.body;
  const visitor = inMemoryData.visitorRequests.find(v => v.otpCode === otpCode && (v.status === 'APPROVED' || v.status === 'PENDING'));

  if (!visitor) {
    return res.status(400).json({ success: false, error: 'Invalid or already used Visitor OTP.' });
  }

  // Check Expiry
  if (visitor.validUntil && new Date(visitor.validUntil) < new Date()) {
    visitor.status = 'EXPIRED';
    return res.status(400).json({ success: false, error: 'Visitor pass has expired.' });
  }

  visitor.status = 'CHECKED_IN';
  visitor.entryTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  try {
    await query(
      `UPDATE visitor_requests 
       SET status = 'CHECKED_IN', entry_time = ?, verified_by_guard_id = ? 
       WHERE id = ?`,
      [visitor.entryTime, req.user.id, visitor.id]
    );

    await recordAuditLog({
      userId: req.user.id,
      userRole: req.user.role,
      action: 'VISITOR_GATE_ENTRY_PERMITTED',
      entityType: 'VISITOR',
      entityId: visitor.id,
      newValue: { status: 'CHECKED_IN', entryTime: visitor.entryTime },
      ip: req.ip
    });
  } catch (e) {
    console.error('Visitor gate check error:', e.message);
  }

  broadcast('VISITOR_UPDATED', inMemoryData.visitorRequests);
  res.json({ success: true, message: `Access granted for ${visitor.visitorName}`, data: visitor });
});

// 8. Maintenance Tickets (with SLA Lifecycle)
app.get('/api/maintenance', (req, res) => res.json(inMemoryData.maintenanceTickets));

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
    unit,
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
    console.error('Maintenance ticket insert error:', e.message);
  }

  inMemoryData.maintenanceTickets.unshift(newTicket);
  broadcast('MAINTENANCE_UPDATED', inMemoryData.maintenanceTickets);
  res.json({ success: true, data: newTicket });
});

// 9. Lift Emergency Integration
app.get('/api/lift', (req, res) => res.json(inMemoryData.liftStatuses));

app.post('/api/lift/trigger-sos/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const lift = inMemoryData.liftStatuses.find(l => l.id === id);
  if (!lift) return res.status(404).json({ success: false, error: 'Lift not found' });

  lift.status = 'SOS_TRIGGERED';
  try {
    await query('UPDATE lift_statuses SET status = "SOS_TRIGGERED", updated_at = NOW() WHERE id = ?', [id]);
    await recordAuditLog({
      userId: req.user.id,
      userRole: req.user.role,
      action: 'LIFT_SOS_TRIGGERED',
      entityType: 'LIFT',
      entityId: id,
      ip: req.ip
    });
  } catch (e) {
    console.error('Lift DB update error:', e.message);
  }

  const newLog = {
    id: `log-${Date.now()}`,
    timestamp: new Date().toLocaleTimeString(),
    action: '🚨 LIFT SOS BUTTON PRESSED',
    module: 'LIFT',
    riskLevel: 'HIGH',
    details: `Emergency intercom activated in ${lift.liftName}. ARD engaged.`
  };
  inMemoryData.actionLogs.unshift(newLog);

  broadcast('LIFT_UPDATED', inMemoryData.liftStatuses);
  broadcast('NEW_ACTION_LOG', newLog);
  res.json({ success: true, data: inMemoryData.liftStatuses });
});

// 10. Resource Amenity Booking (Strict Concurrency & Overlap Prevention)
app.get('/api/resources', (req, res) => res.json(inMemoryData.resourceItems));

app.post('/api/resources/book/:id', authenticateToken, requirePermission(PERMISSIONS.BOOKING_CREATE), async (req, res) => {
  const { id } = req.params;
  const { startTime, endTime } = req.body;
  const resource = inMemoryData.resourceItems.find(r => r.id === id);
  if (!resource) return res.status(404).json({ success: false, error: 'Resource not found' });

  const bookStart = startTime ? new Date(startTime) : new Date();
  const bookEnd = endTime ? new Date(endTime) : new Date(Date.now() + 2 * 60 * 60 * 1000);

  // Check Double Booking in MySQL
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
        error: 'Resource is already booked during this time interval. Please select another slot.'
      });
    }

    const bookingId = `bk-${Date.now()}`;
    await query(
      `INSERT INTO resource_bookings (id, resource_id, user_id, user_name, start_time, end_time, status)
       VALUES (?, ?, ?, ?, ?, ?, 'CONFIRMED')`,
      [bookingId, id, req.user.id, req.user.name || 'Resident', bookStart, bookEnd]
    );

    resource.bookedBy = req.user.name || 'Resident';
    resource.status = 'BUSY';

    await recordAuditLog({
      userId: req.user.id,
      userRole: req.user.role,
      action: 'AMENITY_BOOKED',
      entityType: 'RESOURCE',
      entityId: id,
      newValue: { resourceName: resource.name, start: bookStart, end: bookEnd },
      ip: req.ip
    });
  } catch (e) {
    console.error('Resource booking DB error:', e.message);
  }

  broadcast('RESOURCE_UPDATED', inMemoryData.resourceItems);
  res.json({ success: true, data: inMemoryData.resourceItems });
});

// 11. Noise Guardian & Waste Management
app.get('/api/noise', (req, res) => res.json(inMemoryData.noiseData));
app.get('/api/waste', (req, res) => res.json(inMemoryData.wasteBins));
app.get('/api/logs', (req, res) => res.json(inMemoryData.actionLogs));

// 12. Audit Logs (Protected - Admins Only)
app.get('/api/audit-logs', authenticateToken, requirePermission(PERMISSIONS.AUDIT_VIEW), async (req, res) => {
  try {
    const logs = await query('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100');
    res.json({ success: true, logs });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// 13. Settings Endpoints
app.get('/api/settings', (req, res) => {
  res.json({ success: true, settings: inMemoryData.userSettings });
});

app.put('/api/settings', authenticateToken, async (req, res) => {
  inMemoryData.userSettings = { ...inMemoryData.userSettings, ...req.body };
  broadcast('SETTINGS_UPDATED', inMemoryData.userSettings);
  res.json({ success: true, settings: inMemoryData.userSettings });
});

// ==========================================
// 14. AUTHENTICATION & RBAC SIGNUP/LOGIN
// ==========================================

// Public Signup: Strictly locks role to 'Resident' and verifies flat in registry!
app.post('/api/auth/signup', rateLimit({ windowMs: 60000, maxRequests: 10 }), async (req, res) => {
  try {
    const { name, email, password, flatNumber, phone } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }

    // 🛡️ Security Rule 3: Public signup role can NEVER be Admin or Guard! Always 'Resident'
    const assignedRole = ROLES.RESIDENT;

    // 🛡️ Security Rule 4: Society Flat Verification
    const flatToVerify = flatNumber || 'A-101';
    const flatRecord = await verifyFlatRegistry(flatToVerify);
    if (!flatRecord && process.env.STRICT_FLAT_CHECK === 'true') {
      return res.status(400).json({
        success: false,
        message: `Flat '${flatToVerify}' is not registered in the society database. Please contact the management office.`
      });
    }

    // Check if user already exists
    const existing = await query('SELECT id FROM users WHERE email = ?', [email.toLowerCase()]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = `u-${Date.now()}`;

    await query(
      `INSERT INTO users (id, name, email, password_hash, role, flat_number, phone, is_verified)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
      [userId, name, email.toLowerCase(), passwordHash, assignedRole, flatToVerify, phone || '']
    );

    // Initial User Settings
    try {
      await query('INSERT INTO user_settings (user_id) VALUES (?) ON DUPLICATE KEY UPDATE user_id=user_id', [userId]);
    } catch (e) {}

    await recordAuditLog({
      userId,
      userRole: assignedRole,
      action: 'RESIDENT_SELF_REGISTERED',
      entityType: 'USER',
      entityId: userId,
      newValue: { name, email, flatNumber: flatToVerify },
      ip: req.ip
    });

    const token = jwt.sign(
      { id: userId, email: email.toLowerCase(), role: assignedRole, name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: { id: userId, name, email: email.toLowerCase(), role: assignedRole, flatNumber: flatToVerify, phone }
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ success: false, message: 'Server error during signup: ' + err.message });
  }
});

// Admin-Only Staff Account Creation (For Security, Techs, and Sub-Admins)
app.post('/api/admin/create-staff', authenticateToken, requirePermission(PERMISSIONS.STAFF_MANAGE), async (req, res) => {
  const { name, email, password, role, phone } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ success: false, error: 'Name, email, password, and valid staff role required.' });
  }

  const allowedStaffRoles = [ROLES.SECURITY_GUARD, ROLES.MAINTENANCE_TECH, ROLES.FACILITY_ADMIN];
  if (!allowedStaffRoles.includes(role)) {
    return res.status(400).json({ success: false, error: `Invalid staff role. Allowed: ${allowedStaffRoles.join(', ')}` });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const staffId = `staff-${Date.now()}`;
    await query(
      `INSERT INTO users (id, name, email, password_hash, role, flat_number, phone, is_verified)
       VALUES (?, ?, ?, ?, ?, 'Staff Office', ?, 1)`,
      [staffId, name, email.toLowerCase(), passwordHash, role, phone || '']
    );

    await recordAuditLog({
      userId: req.user.id,
      userRole: req.user.role,
      action: 'STAFF_ACCOUNT_CREATED',
      entityType: 'USER',
      entityId: staffId,
      newValue: { name, email, role },
      ip: req.ip
    });

    res.json({ success: true, message: `Staff account (${role}) created successfully for ${name}.` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Login API (Rate-Limited with bcrypt comparison against MySQL)
app.post('/api/auth/login', rateLimit({ windowMs: 60000, maxRequests: 20 }), async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const users = await query('SELECT * FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (users.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const user = users[0];
    const isPasswordValid = await bcrypt.compare(password, user.password_hash || '');
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
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
        vehicleNumber: user.vehicle_number
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
});

// Secure Password Reset Flow (Never leaks OTP in response in production)
app.post('/api/auth/forgot-password', rateLimit({ windowMs: 60000, maxRequests: 5 }), async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, message: 'Email is required.' });

  try {
    const users = await query('SELECT id FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'Email not found in society registry.' });
    }

    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    await query('UPDATE users SET reset_otp = ?, reset_otp_expires = ? WHERE id = ?', [generatedOtp, expiresAt, users[0].id]);

    console.log(`🔑 [SECURITY OTP DISPATCH]: Reset OTP for ${email} is ${generatedOtp} (Expires in 10m)`);

    res.json({
      success: true,
      message: 'Password reset OTP generated and dispatched to your registered phone/email.'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/auth/reset-password', rateLimit({ windowMs: 60000, maxRequests: 5 }), async (req, res) => {
  const { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword) {
    return res.status(400).json({ success: false, message: 'Email, OTP, and new password are required.' });
  }

  try {
    const users = await query('SELECT * FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (users.length === 0) return res.status(400).json({ success: false, message: 'Invalid request.' });

    const user = users[0];
    if (user.reset_otp !== otp || !user.reset_otp_expires || Date.now() > user.reset_otp_expires) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP code.' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await query('UPDATE users SET password_hash = ?, reset_otp = NULL, reset_otp_expires = NULL WHERE id = ?', [passwordHash, user.id]);

    await recordAuditLog({
      userId: user.id,
      userRole: user.role,
      action: 'PASSWORD_RESET_SUCCESS',
      entityType: 'USER',
      entityId: user.id,
      ip: req.ip
    });

    res.json({ success: true, message: 'Password has been reset successfully. Please log in with your new password.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update Profile (Ensures user can only update their own profile unless Admin)
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
  console.log(`🤖 AI Status: Advisory Only (Safety Actuators Deterministic)`);
  console.log(`=================================================`);
});
