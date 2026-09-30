import express from 'express';
import cors from 'cors';
import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Load Environment Variables from .env file
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, 'data.json');

// Initialize Gemini AI Client
const geminiApiKey = process.env.GEMINI_API_KEY;
let aiClient = null;
if (geminiApiKey && geminiApiKey.trim() !== '' && geminiApiKey !== 'your_gemini_api_key_here') {
  try {
    aiClient = new GoogleGenAI({ apiKey: geminiApiKey });
    console.log('🤖 Google Gemini AI engine initialized successfully!');
  } catch (err) {
    console.warn('⚠️ Could not initialize Gemini AI client:', err.message);
  }
} else {
    console.log('💡 Note: GEMINI_API_KEY not set in .env. AI endpoints will operate in smart simulation mode.');
}

// Optional MongoDB Mongoose Connection
let isMongoConnected = false;
if (process.env.MONGODB_URI && process.env.MONGODB_URI.startsWith('mongodb')) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
      isMongoConnected = true;
      console.log('🍃 Connected to MongoDB database!');
    })
    .catch((err) => {
      console.warn('⚠️ MongoDB connection error, falling back to local JSON database:', err.message);
    });
}

// Initial Data Structure
const defaultData = {
  waterData: {
    overheadTank: 74,
    undergroundSump: 92,
    recycledWater: 58,
    phLevel: 7.2,
    tdsLevel: 145,
    todayConsumptionLiters: 48200,
    flowRateLPM: 120,
    pumpAutoCutoffActive: true,
    lastQualityCheck: "Today, 08:30 AM"
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
    evacuationRouteOpen: true
  },
  visitorRequests: [
    { id: 'v1', visitorName: 'Ramesh Kumar', category: 'Delivery', unitNumber: 'B-402', otpCode: '4829', status: 'PENDING', entryTime: 'Pending' },
    { id: 'v2', visitorName: 'Anita Roy', category: 'Guest', unitNumber: 'A-101', otpCode: '1192', status: 'APPROVED', entryTime: '10:15 AM' },
    { id: 'v3', visitorName: 'FastClean Maid', category: 'Service', unitNumber: 'C-201', otpCode: '9940', status: 'APPROVED', entryTime: '08:00 AM' }
  ],
  maintenanceTickets: [
    { id: 'm1', title: 'Corridor Light Flicker', unit: 'Tower A 3rd Fl', priority: 'LOW', status: 'OPEN', date: '2026-09-29', technician: 'Ramesh (Electrician)' },
    { id: 'm2', title: 'Low Water Pressure', unit: 'B-604', priority: 'MEDIUM', status: 'IN_PROGRESS', date: '2026-09-29', technician: 'Suresh (Plumber)' },
    { id: 'm3', title: 'Main Gate Sensor Calib', unit: 'Gate 1', priority: 'HIGH', status: 'RESOLVED', date: '2026-09-28', technician: 'AI System Auto' }
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
    { id: 'r1', name: 'Clubhouse Banquet Hall', category: 'Amenity', status: 'AVAILABLE', pricePerHour: 500, bookedBy: null },
    { id: 'r2', name: 'EV Fast Charger Spot 1', category: 'Utility', status: 'BUSY', pricePerHour: 80, bookedBy: 'Rahul (A-101)' },
    { id: 'r3', name: 'Rooftop BBQ Grill Area', category: 'Amenity', status: 'AVAILABLE', pricePerHour: 200, bookedBy: null }
  ],
  actionLogs: [
    { id: 'log1', timestamp: '16:05:12', action: 'Overhead Tank Auto-Cutoff Executed', module: 'WATER', riskLevel: 'LOW', details: 'Pumps shut down safely at 95% threshold.' },
    { id: 'log2', timestamp: '15:40:00', action: 'Visitor OTP Auto-Verified', module: 'SECURITY', riskLevel: 'LOW', details: 'Ramesh Kumar allowed entry at Gate 1.' }
  ],
  users: [
    {
      id: 'u-1',
      name: 'Rahul Sharma',
      email: 'rahul@society.com',
      passwordHash: '$2a$10$E8.3G/pD0HjJzSgO1.vO3.lE.aT4J.H.29Z/vXp3Q/LqZk2m2b4C.', // password: 123456
      role: 'Resident',
      flatNumber: 'A-101',
      phone: '+91 98765 43210',
      emergencyContact: '+91 98765 00000',
      vehicleNumber: 'MH 12 AB 1234'
    },
    {
      id: 'u-2',
      name: 'Priya Patel (Admin)',
      email: 'admin@society.com',
      passwordHash: '$2a$10$E8.3G/pD0HjJzSgO1.vO3.lE.aT4J.H.29Z/vXp3Q/LqZk2m2b4C.', // password: 123456
      role: 'Facility Admin',
      flatNumber: 'Management Office',
      phone: '+91 98765 11111',
      emergencyContact: '+91 98765 00000',
      vehicleNumber: 'MH 12 CD 5678'
    }
  ],
  userSettings: {
    accountProfile: {
      residentName: 'Rohit Sharma',
      flatNumber: 'Unit C-402',
      emergencyContact: '+91 98765 00000',
      verifiedBadge: true,
      familyMembers: [
        { id: 'fm-1', name: 'Priya Sharma', relation: 'Spouse', phone: '+91 98765 11111' },
        { id: 'fm-2', name: 'Aarav Sharma', relation: 'Child', phone: '' }
      ],
      registeredVehicles: [
        { id: 'v-1', plateNumber: 'MH-02-CP-1234', vehicleType: 'EV Car', slotAssigned: '#42' },
        { id: 'v-2', plateNumber: 'MH-02-CP-5678', vehicleType: 'Scooter', slotAssigned: '#42B' }
      ],
      digitalPasskeys: {
        rfidCardId: 'RFID-9842-X',
        biometricPassEnabled: true,
        mobileNfcKeyEnabled: true
      }
    },
    aiAutomation: {
      autoValveV102Shutoff: true,
      humanApprovalRequiredForRoutine: true,
      motionPirSensitivity: 'MEDIUM',
      ambientLightThresholdLux: 30,
      predictiveShortageAlerts: true,
      predictiveShortageFrequency: 'IMMEDIATE'
    },
    privacyData: {
      cctvEdgeProcessingOnly: true,
      noiseGuardianRawMicDisabled: true,
      activityLogsRetentionDays: 30,
      autoDeleteLogsEnabled: true
    },
    notificationsAlerts: {
      criticalAlertsOverrideSound: true,
      infoAlertsEnabled: true,
      routineAlertsEnabled: true,
      quietHoursEnabled: true,
      quietHoursStart: '22:00',
      quietHoursEnd: '07:00'
    },
    visitorSecurityRules: {
      preApprovedDeliveriesSilentPass: true,
      guestVerificationMethod: 'QR_OTP',
      blacklistedVisitors: [
        { id: 'bl-1', name: 'Unknown Vendor', reason: 'Unauthorized Soliciting', date: '2026-08-12' }
      ]
    },
    walletSharing: {
      pCoinsBalance: 450,
      bankPayoutAccount: 'HDFC Bank **** 4892',
      resourceSharingAvailabilityWindow: '09:00 AM - 08:00 PM',
      toolSecurityDepositLimitPCoins: 100,
      trustScorePrivateMode: true
    },
    appSystemPreferences: {
      theme: 'dark',
      language: 'hi',
      emergencyVoiceLanguage: 'hi',
      cacheSizeMb: 12.4,
      offlineSyncEnabled: true,
      rnVersion: 'RN Version 1.0'
    }
  }
};

// Data Persistence Helper
function loadDb() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Error reading DB file, using default data', err);
  }
  fs.writeFileSync(DB_FILE, JSON.stringify(defaultData, null, 2));
  return defaultData;
}

function saveDb(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error saving DB file', err);
  }
}

let db = loadDb();

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Broadcast helper for real-time updates to all connected web app clients
function broadcast(type, payload) {
  const message = JSON.stringify({ type, payload });
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

wss.on('connection', (ws) => {
  console.log('⚡ Web Client connected to Smart Building WebSocket Server');
  ws.send(JSON.stringify({ type: 'INITIAL_SYNC', payload: db }));
});

// ==========================================
// REST API Endpoints
// ==========================================

// Server Health & Status Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    systemName: 'COMMUNITY BRAIN OS - Server',
    database: isMongoConnected ? 'MongoDB Connected' : 'Local Data Storage (data.json)',
    geminiAiActive: !!aiClient,
    connectedWebsocketClients: wss.clients.size,
    timestamp: new Date().toISOString()
  });
});

// 1. Full State Sync
app.get('/api/sync', (req, res) => {
  res.json({ success: true, data: db });
});

// 2. Gemini AI Integration Endpoints (Role-Tailored Answers)
app.post('/api/ai/ask', async (req, res) => {
  const { question, prompt, role } = req.body;
  const userQuery = question || prompt || 'Provide status summary';
  const userRole = role || 'Resident';

  if (aiClient) {
    try {
      const response = await aiClient.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `You are RAAH NAGAR AI, the central autonomous intelligence governing RAAH NAGAR Smart Society.
You are talking to a user with the role of: "${userRole}".

Role-Specific Guidelines:
- If role is "Resident": Answer with focus on their flat comfort, amenity availability, guest approvals, noise policies, water level, and EV charger spots. Keep language warm and polite.
- If role is "Facility Admin": Answer with high-level operational diagnostics, financial cost/consumption data, vendor SLAs, system logs, and security compliance.
- If role is "Security Guard": Answer with focus on gate pass OTP verifications, unrecognized visitor alerts, parking spot unauthorized occupancy, and emergency siren actions.
- If role is "Maintenance Tech": Answer with technical diagnostics (plumbing flow rates, pump auto-cutoff thresholds, lift ARD battery status, electrician ticket priorities).

Current System Telemetry:
- Water Tank: ${db.waterData.overheadTank}%
- Fire Alarm Active: ${db.fireEmergencyData.isAlarmActive}
- Pending Visitor Gate Approvals: ${db.visitorRequests.filter(v => v.status === 'PENDING').length}
- Open Maintenance Tickets: ${db.maintenanceTickets.filter(m => m.status === 'OPEN').length}

User Question: "${userQuery}"

Provide a concise, role-tailored, professional response.`
      });
      return res.json({ success: true, answer: response.text, mode: 'gemini-live' });
    } catch (err) {
      console.error('Gemini API query error:', err);
    }
  }

  // Fallback AI simulation tailored to user role if GEMINI_API_KEY is not configured
  let roleMock = '';
  if (userRole === 'Security Guard') {
    roleMock = `🛡️ [RAAH NAGAR Security AI]: Gate 1 operating normally. ${db.visitorRequests.filter(v => v.status === 'PENDING').length} visitor OTP approvals pending. All perimeter sensors clear.`;
  } else if (userRole === 'Facility Admin') {
    roleMock = `👑 [RAAH NAGAR Admin AI]: Society systems optimal. Water tank at ${db.waterData.overheadTank}%, 0 critical breaches. ${db.maintenanceTickets.length} active maintenance logs.`;
  } else if (userRole === 'Maintenance Tech') {
    roleMock = `🔧 [RAAH NAGAR Tech AI]: Pump Cutoff V-102 Active. Lift ARD Battery: 98%. Open tickets: ${db.maintenanceTickets.filter(m => m.status === 'OPEN').length}.`;
  } else {
    roleMock = `🏠 [RAAH NAGAR Resident AI]: Hello Resident! Systems running smoothly. Water tank level is ${db.waterData.overheadTank}%. To ask live questions to Gemini AI, add your GEMINI_API_KEY in backend .env.`;
  }

  return res.json({ success: true, answer: roleMock, mode: 'simulation' });
});

app.post('/api/ai/analyze-emergency', async (req, res) => {
  const { emergencyType, zone, details } = req.body;
  const context = `Emergency Type: ${emergencyType || 'General'}, Zone: ${zone || 'Main Premises'}, Details: ${details || 'Sensor triggered'}`;

  if (aiClient) {
    try {
      const response = await aiClient.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `You are the AI Safety Controller for a Smart Residential Building. Analyze this emergency and output 3 immediate safety action steps: ${context}`
      });
      return res.json({ success: true, analysis: response.text, mode: 'gemini-live' });
    } catch (err) {
      console.error('Gemini Emergency Analysis Error:', err);
    }
  }

  const fallbackAnalysis = `🚨 Automated Emergency Protocol Activated for ${emergencyType || 'FIRE/LIFT'}.\n1. Evacuation routes opened automatically.\n2. Security guards notified on mobile.\n3. Automatic rescue/safety protocols engaged.`;
  return res.json({ success: true, analysis: fallbackAnalysis, mode: 'simulation' });
});

// 3. Water Management
app.get('/api/water', (req, res) => res.json(db.waterData));
app.post('/api/water/update', (req, res) => {
  db.waterData = { ...db.waterData, ...req.body };
  saveDb(db);
  broadcast('WATER_UPDATED', db.waterData);
  res.json({ success: true, data: db.waterData });
});

// 4. Smart Parking
app.get('/api/parking', (req, res) => res.json(db.parkingSlots));
app.post('/api/parking/toggle/:id', (req, res) => {
  const { id } = req.params;
  db.parkingSlots = db.parkingSlots.map(slot => 
    slot.id === id ? { ...slot, isOccupied: !slot.isOccupied } : slot
  );
  saveDb(db);
  broadcast('PARKING_UPDATED', db.parkingSlots);
  res.json({ success: true, data: db.parkingSlots });
});

// 5. Fire Emergency
app.get('/api/fire', (req, res) => res.json(db.fireEmergencyData));
app.post('/api/fire/trigger', (req, res) => {
  db.fireEmergencyData = {
    ...db.fireEmergencyData,
    isAlarmActive: true,
    affectedZone: req.body.zone || 'Tower B Floor 4',
    sprinklersStatus: 'ACTIVATED',
    fireDepartmentNotified: true
  };
  const newLog = {
    id: `log-${Date.now()}`,
    timestamp: new Date().toLocaleTimeString(),
    action: '🔥 FIRE EMERGENCY ALARM TRIGGERED',
    module: 'FIRE',
    riskLevel: 'HIGH',
    details: `Fire detected in ${db.fireEmergencyData.affectedZone}. Auto-dialed Fire Brigade.`
  };
  db.actionLogs.unshift(newLog);
  saveDb(db);
  broadcast('FIRE_EMERGENCY', db.fireEmergencyData);
  broadcast('NEW_ACTION_LOG', newLog);
  res.json({ success: true, data: db.fireEmergencyData });
});

app.post('/api/fire/reset', (req, res) => {
  db.fireEmergencyData = defaultData.fireEmergencyData;
  saveDb(db);
  broadcast('FIRE_EMERGENCY', db.fireEmergencyData);
  res.json({ success: true, data: db.fireEmergencyData });
});

// 6. Visitor Management
app.get('/api/visitors', (req, res) => res.json(db.visitorRequests));
app.post('/api/visitors/add', (req, res) => {
  const newVisitor = {
    id: `v-${Date.now()}`,
    visitorName: req.body.visitorName,
    category: req.body.category || 'Guest',
    unitNumber: req.body.unitNumber,
    otpCode: Math.floor(1000 + Math.random() * 9000).toString(),
    status: 'PENDING',
    entryTime: 'Pending'
  };
  db.visitorRequests.unshift(newVisitor);
  saveDb(db);
  broadcast('VISITOR_UPDATED', db.visitorRequests);
  res.json({ success: true, data: newVisitor });
});

app.post('/api/visitors/approve/:id', (req, res) => {
  const { id } = req.params;
  db.visitorRequests = db.visitorRequests.map(v => 
    v.id === id ? { ...v, status: 'APPROVED', entryTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) } : v
  );
  saveDb(db);
  broadcast('VISITOR_UPDATED', db.visitorRequests);
  res.json({ success: true, data: db.visitorRequests });
});

// 7. Maintenance Tickets
app.get('/api/maintenance', (req, res) => res.json(db.maintenanceTickets));
app.post('/api/maintenance/create', (req, res) => {
  const newTicket = {
    id: `m-${Date.now()}`,
    title: req.body.title,
    unit: req.body.unit,
    priority: req.body.priority || 'MEDIUM',
    status: 'OPEN',
    date: new Date().toISOString().split('T')[0],
    technician: 'Unassigned'
  };
  db.maintenanceTickets.unshift(newTicket);
  saveDb(db);
  broadcast('MAINTENANCE_UPDATED', db.maintenanceTickets);
  res.json({ success: true, data: newTicket });
});

// 8. Lift Emergency
app.get('/api/lift', (req, res) => res.json(db.liftStatuses));
app.post('/api/lift/trigger-sos/:id', (req, res) => {
  const { id } = req.params;
  db.liftStatuses = db.liftStatuses.map(lift => 
    lift.id === id ? { ...lift, status: 'SOS_TRIGGERED' } : lift
  );
  const newLog = {
    id: `log-${Date.now()}`,
    timestamp: new Date().toLocaleTimeString(),
    action: '🚨 LIFT SOS BUTTON PRESSED',
    module: 'LIFT',
    riskLevel: 'HIGH',
    details: `Emergency intercom activated in ${id}. Automatic Rescue Device engaged.`
  };
  db.actionLogs.unshift(newLog);
  saveDb(db);
  broadcast('LIFT_UPDATED', db.liftStatuses);
  broadcast('NEW_ACTION_LOG', newLog);
  res.json({ success: true, data: db.liftStatuses });
});

app.post('/api/lift/reset/:id', (req, res) => {
  const { id } = req.params;
  db.liftStatuses = db.liftStatuses.map(lift => 
    lift.id === id ? { ...lift, status: 'NORMAL' } : lift
  );
  saveDb(db);
  broadcast('LIFT_UPDATED', db.liftStatuses);
  res.json({ success: true, data: db.liftStatuses });
});

// 9. Noise Guardian
app.get('/api/noise', (req, res) => res.json(db.noiseData));
app.post('/api/noise/escalate', (req, res) => {
  const nextStage = Math.min(3, (db.noiseData.currentViolationStage || 0) + 1);
  db.noiseData.currentViolationStage = nextStage;
  db.noiseData.currentDecibels = 68;
  saveDb(db);
  broadcast('NOISE_UPDATED', db.noiseData);
  res.json({ success: true, data: db.noiseData });
});

app.post('/api/noise/reset', (req, res) => {
  db.noiseData.currentViolationStage = 0;
  db.noiseData.currentDecibels = 48;
  saveDb(db);
  broadcast('NOISE_UPDATED', db.noiseData);
  res.json({ success: true, data: db.noiseData });
});

// 10. Resource Booking
app.get('/api/resources', (req, res) => res.json(db.resourceItems));
app.post('/api/resources/book/:id', (req, res) => {
  const { id } = req.params;
  const { bookedBy } = req.body;
  db.resourceItems = db.resourceItems.map(item => 
    item.id === id ? { ...item, status: 'BUSY', bookedBy: bookedBy || 'Resident' } : item
  );
  saveDb(db);
  broadcast('RESOURCE_UPDATED', db.resourceItems);
  res.json({ success: true, data: db.resourceItems });
});

// 11. Push Notifications Endpoint
app.post('/api/notifications/send', (req, res) => {
  const { title, message, targetRole } = req.body;
  const notifPayload = {
    id: `notif-${Date.now()}`,
    title: title || 'Society Notice',
    message: message || 'Notice from management',
    targetRole: targetRole || 'All',
    time: new Date().toLocaleTimeString()
  };
  broadcast('PUSH_NOTIFICATION', notifPayload);
  res.json({ success: true, notification: notifPayload });
});

// 12. AI Action Logs
app.get('/api/logs', (req, res) => res.json(db.actionLogs));

// 12b. Comprehensive User & AI Settings Endpoints
app.get('/api/settings', (req, res) => {
  const settings = db.userSettings || defaultData.userSettings;
  res.json({ success: true, settings });
});

app.put('/api/settings', (req, res) => {
  const updatedSettings = {
    ...db.userSettings,
    ...req.body
  };
  db.userSettings = updatedSettings;
  saveDb(db);
  broadcast('SETTINGS_UPDATED', updatedSettings);
  res.json({ success: true, settings: updatedSettings });
});

// ==========================================
// 13. AUTHENTICATION & USER PROFILE ENDPOINTS
// ==========================================

// Signup API
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password, role, flatNumber, phone } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }

    if (!db.users) db.users = [];
    const existingUser = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = {
      id: `u-${Date.now()}`,
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: role || 'Resident',
      flatNumber: flatNumber || 'A-101',
      phone: phone || '',
      emergencyContact: '',
      vehicleNumber: '',
      createdAt: new Date().toISOString()
    };

    db.users.push(newUser);
    saveDb(db);

    const token = jwt.sign(
      { userId: newUser.id, email: newUser.email, role: newUser.role },
      process.env.JWT_SECRET || 'super_secret_society_jwt_key_2026',
      { expiresIn: '7d' }
    );

    const { passwordHash: _, ...safeUser } = newUser;
    res.json({ success: true, token, user: safeUser });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ success: false, message: 'Server error during signup.' });
  }
});

// Login API
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    if (!db.users) db.users = [];
    const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash || '');
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'super_secret_society_jwt_key_2026',
      { expiresIn: '7d' }
    );

    const { passwordHash: _, ...safeUser } = user;
    res.json({ success: true, token, user: safeUser });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
});

// Forgot Password API
app.post('/api/auth/forgot-password', (req, res) => {
  const { email } = req.body;
  if (!db.users) db.users = [];
  const user = db.users.find(u => u.email.toLowerCase() === (email || '').toLowerCase());

  if (!user) {
    return res.status(404).json({ success: false, message: 'Email not found in society registry.' });
  }

  const simulatedOtp = '482910';
  user.resetOtp = simulatedOtp;
  user.resetOtpExpires = Date.now() + 10 * 60 * 1000;
  saveDb(db);

  res.json({
    success: true,
    message: `Password reset OTP generated! (Simulated OTP: ${simulatedOtp})`,
    simulatedOtp
  });
});

// Reset Password API
app.post('/api/auth/reset-password', async (req, res) => {
  const { email, otp, newPassword } = req.body;
  if (!db.users) db.users = [];
  const user = db.users.find(u => u.email.toLowerCase() === (email || '').toLowerCase());

  if (!user || user.resetOtp !== otp) {
    return res.status(400).json({ success: false, message: 'Invalid OTP code.' });
  }

  user.passwordHash = await bcrypt.hash(newPassword, 10);
  delete user.resetOtp;
  delete user.resetOtpExpires;
  saveDb(db);

  res.json({ success: true, message: 'Password reset successfully! You can now log in.' });
});

// Update Profile API
app.put('/api/auth/profile/:userId', async (req, res) => {
  const { userId } = req.params;
  const { name, phone, emergencyContact, flatNumber, vehicleNumber, password } = req.body;

  if (!db.users) db.users = [];
  const userIndex = db.users.findIndex(u => u.id === userId);
  if (userIndex === -1) {
    return res.status(404).json({ success: false, message: 'User profile not found.' });
  }

  let updatedUser = { ...db.users[userIndex] };
  if (name !== undefined) updatedUser.name = name;
  if (phone !== undefined) updatedUser.phone = phone;
  if (emergencyContact !== undefined) updatedUser.emergencyContact = emergencyContact;
  if (flatNumber !== undefined) updatedUser.flatNumber = flatNumber;
  if (vehicleNumber !== undefined) updatedUser.vehicleNumber = vehicleNumber;

  if (password && password.trim() !== '') {
    updatedUser.passwordHash = await bcrypt.hash(password, 10);
  }

  db.users[userIndex] = updatedUser;
  saveDb(db);

  const { passwordHash: _, ...safeUser } = updatedUser;
  res.json({ success: true, user: safeUser });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(`🚀 COMMUNITY BRAIN Smart Society Backend running on port ${PORT}`);
  console.log(`📡 WebSocket server live at ws://localhost:${PORT}`);
  console.log(`🤖 Gemini AI Status: ${aiClient ? 'Active (Live Key)' : 'Active (Simulation Mode)'}`);
  console.log(`💾 Database Status: ${isMongoConnected ? 'MongoDB' : 'Local JSON Storage'}`);
  console.log(`=================================================`);
});
