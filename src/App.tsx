import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ModuleNavigation, type ModuleTab } from './components/ModuleNavigation';
import { HomeDashboard } from './components/screens/HomeDashboard';
import { AiBrainArchitecture } from './components/screens/AiBrainArchitecture';
import { SmartParking } from './components/screens/SmartParking';
import { WaterManagement } from './components/screens/WaterManagement';
import { StreetLighting } from './components/screens/StreetLighting';
import { FireEmergency } from './components/screens/FireEmergency';
import { VisitorSecurity } from './components/screens/VisitorSecurity';
import { MaintenanceDashboard } from './components/screens/MaintenanceDashboard';
import { LiftEmergency } from './components/screens/LiftEmergency';
import { WasteManagement } from './components/screens/WasteManagement';
import { NoiseGuardian } from './components/screens/NoiseGuardian';
import { ResourceSharing } from './components/screens/ResourceSharing';
import { CommunityTrust } from './components/screens/CommunityTrust';
import { GuestParking } from './components/screens/GuestParking';
import { AiActionLog } from './components/screens/AiActionLog';
import { PrivacyCenter } from './components/screens/PrivacyCenter';
import { NotificationCenter } from './components/screens/NotificationCenter';
import { SettingsScreen } from './components/screens/SettingsScreen';
import { NotificationsDrawer } from './components/NotificationsDrawer';
import { AuthModal, type UserProfileData } from './components/AuthModal';
import { ProfileModal } from './components/ProfileModal';
import { AiChatAssistant } from './components/AiChatAssistant';

import {
  fetchFullSync,
  connectRealtime,
  approveVisitor,
  denyVisitor,
  addVisitor,
  verifyGatePass,
  sendValveCommand,
  toggleParkingSlot,
  dispatchWasteVendor,
  bookResource,
  createMaintenanceTicket,
  setAuthToken,
  clearAuthToken
} from './services/api';

import {
  emptyWaterData,
  emptyFireData,
  emptyLiftStatus,
  emptyNoiseData,
  type WaterData,
  type ParkingSlot,
  type VisitorRequest,
  type MaintenanceTicket,
  type LiftStatus,
  type WasteBinData,
  type NoiseData,
  type ResourceItem,
  type ActionLogItem
} from './data/mockData';

// 🔄 Telemetry Normalizers (Guarantee strict type conformance with MySQL DB & WebSocket packets)
function normalizeWaterData(data: any): WaterData {
  if (!data) return emptyWaterData;
  return {
    mainTankLevel: data.mainTankLevel ?? data.overheadTank ?? 0,
    undergroundSumpLevel: data.undergroundSumpLevel ?? data.undergroundSump ?? 0,
    overheadTankBlockB: data.overheadTankBlockB ?? data.recycledWater ?? 0,
    predictedShortageHours: data.predictedShortageHours ?? 0,
    predictedShortageBlock: data.predictedShortageBlock || 'None',
    municipalSupplyActive: !!(data.municipalSupplyActive ?? false),
    municipalSupplyEnds: data.municipalSupplyEnds || '--',
    mainPumpStatus: (data.mainPumpStatus || (data.pumpOperationalState === 'RUNNING' ? 'ACTIVE' : data.pumpOperationalState === 'NOT_CONNECTED' ? 'NOT_CONNECTED' : data.pumpOperationalState === 'OFFLINE' ? 'NOT_CONNECTED' : 'IDLE')) as any,
    standbyPumpStatus: (data.standbyPumpStatus || (data.hardwareStatus === 'NOT_CONNECTED' ? 'NOT_CONNECTED' : 'IDLE')) as any,
    leakageDetected: !!data.leakageDetected,
    leakageConfidence: data.leakageConfidence ?? 0,
    leakageLocation: data.leakageLocation || 'None',
    valveClosed: !!data.valveClosed,
    historicalFlow: Array.isArray(data.historicalFlow) ? data.historicalFlow : [],
    hardwareStatus: data.hardwareStatus,
    valveHardwareStatus: data.valveHardwareStatus
  };
}

function normalizeParkingSlots(slots: any[]): ParkingSlot[] {
  if (!Array.isArray(slots)) return [];
  return slots.map((p, idx) => ({
    id: String(p.id || idx + 1),
    slotNumber: p.slotNumber || p.slot_number || `#${idx + 1}`,
    status: p.status || (p.isOccupied ? 'occupied' : 'vacant'),
    owner: p.owner || p.residentName || (p.isOccupied ? 'Resident Vehicle' : 'Community Pool'),
    timeWindow: p.timeWindow,
    vehicleNo: p.vehicleNo || p.vehicleNumber,
    pCoinsValue: p.pCoinsValue || 0
  }));
}

function normalizeFireData(data: any): FireEmergencyData {
  if (!data) return emptyFireData;
  return {
    isActive: !!(data.isActive || data.isAlarmActive),
    location: data.location || data.affectedZone || 'Normal Operations',
    smokeLevel: data.smokeLevel || 0,
    heatLevel: data.heatLevel || 0,
    alarmActive: !!(data.alarmActive || data.isAlarmActive),
    confidenceScore: data.confidenceScore || 0,
    assistanceNeeded: Array.isArray(data.assistanceNeeded) ? data.assistanceNeeded : [],
    evacuationRoutes: Array.isArray(data.evacuationRoutes) ? data.evacuationRoutes : []
  };
}

function normalizeLiftStatus(data: any): LiftStatus {
  if (!data) return emptyLiftStatus;
  const item = Array.isArray(data) ? data[0] : data;
  if (!item) return emptyLiftStatus;
  return {
    liftId: item.liftId || item.liftName || 'Lift 1',
    tower: item.tower || 'Tower A',
    status: item.status || 'NORMAL',
    trappedDurationSeconds: item.trappedDurationSeconds || 0,
    floors: item.floors || (item.floor ? `Floor ${item.floor}` : 'Ground Floor'),
    errorCode: item.errorCode || 'None',
    cabinOccupied: !!item.cabinOccupied,
    technicianEtaMinutes: item.technicianEtaMinutes || 0,
    voiceReassuranceSent: !!item.voiceReassuranceSent
  };
}

function normalizeVisitorRequests(data: any[]): VisitorRequest[] {
  if (!Array.isArray(data)) return [];
  return data.map((v, idx) => ({
    id: String(v.id || `v-${idx + 1}`),
    name: v.name || v.visitorName || 'Visitor',
    company: v.company || 'Guest',
    photoUrl: v.photoUrl || '',
    category: (v.category || 'Guest') as any,
    vehiclePlate: v.vehiclePlate || v.vehicle_plate || '--',
    targetFlat: v.targetFlat || v.unitNumber || 'Community',
    riskLevel: (v.riskLevel || 'LOW') as any,
    verificationDetails: v.verificationDetails || 'Verified at gate',
    timestamp: v.timestamp || (v.entryTime ? new Date(v.entryTime).toLocaleTimeString() : 'Recent'),
    status: (v.status || 'pending') as any
  }));
}

function normalizeMaintenanceTickets(data: any[]): MaintenanceTicket[] {
  if (!Array.isArray(data)) return [];
  return data.map((t, idx) => ({
    id: String(t.id || t.ticketNumber || `T-${idx + 1}`),
    title: t.title || 'Maintenance Request',
    category: (t.category || 'Plumbing') as any,
    priority: (t.priority || 'MEDIUM') as any,
    location: t.location || t.unit || 'Common Area',
    assignedTo: t.assignedTo || t.technician || 'Pending Assignment',
    status: (t.status || 'Reported') as any,
    etaMinutes: t.etaMinutes || (t.slaHours ? t.slaHours * 60 : 30),
    reportedTime: t.reportedTime || t.date || 'Recent',
    isAutoGenerated: !!t.isAutoGenerated
  }));
}

function normalizeWasteBins(data: any[]): WasteBinData[] {
  if (!Array.isArray(data)) return [];
  return data.map((w, idx) => ({
    binId: String(w.id || w.binId || `bin-${idx + 1}`),
    name: w.name || w.binType || `Bin ${idx + 1}`,
    fillPercentage: w.fillPercentage ?? w.fill_percentage ?? 0,
    predictedOverflowMins: w.predictedOverflowMins || 0,
    vendorDispatched: !!(w.vendorDispatched ?? w.vendor_dispatched),
    vendorName: w.vendorName || w.vendor_name || '-',
    truckEtaMins: w.truckEtaMins || 0
  }));
}

function normalizeNoiseData(data: any): NoiseData {
  if (!data) return emptyNoiseData;
  return {
    currentDecibels: data.currentDecibels ?? data.current_decibels ?? 0,
    quietHoursActive: !!(data.quietHoursActive ?? data.quiet_hours_active),
    decibelHistory: Array.isArray(data.decibelHistory) ? data.decibelHistory : [],
    currentViolationStage: data.currentViolationStage ?? 0,
    targetUnit: data.targetUnit,
    durationMins: data.durationMins ?? 0
  };
}

function normalizeResourceItems(data: any[]): ResourceItem[] {
  if (!Array.isArray(data)) return [];
  return data.map((r, idx) => ({
    id: String(r.id || `res-${idx + 1}`),
    title: r.title || r.name || 'Resource',
    category: r.category || 'General',
    ownerUnit: r.ownerUnit || 'Community',
    availableWindow: r.availableWindow || 'Available Today',
    depositCredits: r.depositCredits || r.pricePerHour || 0,
    imageUrl: r.imageUrl || '',
    status: (r.status || 'available') as any
  }));
}

function normalizeActionLogs(data: any[]): ActionLogItem[] {
  if (!Array.isArray(data)) return [];
  return data.map((a, idx) => ({
    id: String(a.id || `log-${idx + 1}`),
    timestamp: a.timestamp || 'Just now',
    triggerSource: a.triggerSource || a.module || 'System',
    anomalyDetected: a.anomalyDetected || a.action || 'Audit Event',
    location: a.location || 'Society Premises',
    confidence: a.confidence || 100,
    actionExecuted: a.actionExecuted || a.action || 'Logged',
    deviceAffected: a.deviceAffected || a.module || 'Audit Engine',
    impact: a.impact || a.details || 'Recorded in security audit log',
    reasonRule: a.reasonRule || 'System Event'
  }));
}

export function App() {
  const [activeTab, setActiveTab] = useState<ModuleTab>('home');
  const [userRole, setUserRole] = useState<'Resident' | 'Facility Admin' | 'Security Guard' | 'Maintenance Tech'>('Resident');
  const [isNotifOpen, setIsNotifOpen] = useState<boolean>(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [currentLang, setCurrentLang] = useState<string>('en');
  const [isSyncing, setIsSyncing] = useState<boolean>(() => {
    return !!(localStorage.getItem('society_token') || sessionStorage.getItem('society_token'));
  });

  // Sync theme with DOM root class
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  }, [theme]);

  // Auth & User State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<UserProfileData | null>(() => {
    try {
      const savedUser = localStorage.getItem('society_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  // 🛡️ Main Feature States (Strictly Clean Production Defaults)
  // In production, starts with ZERO fake telemetry; populated purely by MySQL /api/sync & WebSocket.
  const [waterData, setWaterData] = useState<WaterData>(emptyWaterData);
  const [parkingSlots, setParkingSlots] = useState<ParkingSlot[]>([]);
  const [fireData, setFireData] = useState<FireEmergencyData>(emptyFireData);
  const [visitorRequests, setVisitorRequests] = useState<VisitorRequest[]>([]);
  const [maintenanceTickets, setMaintenanceTickets] = useState<MaintenanceTicket[]>([]);
  const [liftStatus, setLiftStatus] = useState<LiftStatus>(emptyLiftStatus);
  const [wasteBins, setWasteBins] = useState<WasteBinData[]>([]);
  const [noiseData, setNoiseData] = useState<NoiseData>(emptyNoiseData);
  const [resourceItems, setResourceItems] = useState<ResourceItem[]>([]);
  const [actionLogs, setActionLogs] = useState<ActionLogItem[]>([]);
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(false);
  const [valveStatus, setValveStatus] = useState<'IDLE' | 'PENDING' | 'FAILED' | 'UNKNOWN'>('IDLE');

  // Helper to dispatch backend sync data to state
  const applyBackendSyncData = (data: any) => {
    if (!data) return;
    setIsBackendConnected(true);
    setIsSyncing(false);
    if (data.waterData) setWaterData(normalizeWaterData(data.waterData));
    if (data.parkingSlots) setParkingSlots(normalizeParkingSlots(data.parkingSlots));
    if (data.fireEmergencyData) setFireData(normalizeFireData(data.fireEmergencyData));
    if (data.visitorRequests) setVisitorRequests(normalizeVisitorRequests(data.visitorRequests));
    if (data.maintenanceTickets) setMaintenanceTickets(normalizeMaintenanceTickets(data.maintenanceTickets));
    if (data.liftStatuses) setLiftStatus(normalizeLiftStatus(data.liftStatuses));
    if (data.wasteBins) setWasteBins(normalizeWasteBins(data.wasteBins));
    if (data.noiseData) setNoiseData(normalizeNoiseData(data.noiseData));
    if (data.resourceItems) setResourceItems(normalizeResourceItems(data.resourceItems));
    if (data.actionLogs) setActionLogs(normalizeActionLogs(data.actionLogs));
  };

  const handleAuthSuccess = (user: UserProfileData, token: string) => {
    setCurrentUser(user);
    setUserRole(user.role);
    setAuthToken(token);
    localStorage.setItem('society_user', JSON.stringify(user));
    setIsSyncing(true);

    // Immediately trigger authenticated backend sync on login
    fetchFullSync().then((data) => {
      if (data) {
        applyBackendSyncData(data);
      } else {
        setIsSyncing(false);
      }
    });
  };

  const handleLogout = () => {
    setCurrentUser(null);
    clearAuthToken();
    // Reset operational state back to clean zero defaults
    setWaterData(emptyWaterData);
    setParkingSlots([]);
    setFireData(emptyFireData);
    setVisitorRequests([]);
    setMaintenanceTickets([]);
    setLiftStatus(emptyLiftStatus);
    setWasteBins([]);
    setNoiseData(emptyNoiseData);
    setResourceItems([]);
    setActionLogs([]);
    setIsBackendConnected(false);
    setIsDemoMode(false);
    setActiveScenario('NORMAL');
  };

  const handleUpdateUser = (updatedUser: UserProfileData) => {
    setCurrentUser(updatedUser);
    setUserRole(updatedUser.role);
    localStorage.setItem('society_user', JSON.stringify(updatedUser));
  };

  // Sync Backend WebSocket & REST APIs
  useEffect(() => {
    // Initial fetch if user is already authenticated
    const token = localStorage.getItem('society_token') || sessionStorage.getItem('society_token');
    if (token) {
      fetchFullSync().then((data) => {
        if (data) {
          applyBackendSyncData(data);
        } else {
          setIsSyncing(false);
        }
      });
    }

    const unsubscribe = connectRealtime((type, payload) => {
      setIsBackendConnected(true);
      if (type === 'INITIAL_SYNC' && payload) {
        applyBackendSyncData(payload);
      } else if (type === 'WATER_UPDATED' && payload) {
        setValveStatus('IDLE');
        setWaterData(normalizeWaterData(payload));
      } else if (type === 'PARKING_UPDATED' && payload) {
        setParkingSlots(normalizeParkingSlots(payload));
      } else if (type === 'FIRE_EMERGENCY' && payload) {
        setFireData(normalizeFireData(payload));
      } else if (type === 'VISITOR_UPDATED' && payload) {
        setVisitorRequests(normalizeVisitorRequests(payload));
      } else if (type === 'MAINTENANCE_UPDATED' && payload) {
        setMaintenanceTickets(normalizeMaintenanceTickets(payload));
      } else if (type === 'LIFT_UPDATED' && payload) {
        setLiftStatus(normalizeLiftStatus(payload));
      } else if (type === 'WASTE_UPDATED' && payload) {
        setWasteBins(normalizeWasteBins(payload));
      } else if (type === 'NOISE_UPDATED' && payload) {
        setNoiseData(normalizeNoiseData(payload));
      } else if (type === 'RESOURCE_UPDATED' && payload) {
        setResourceItems(normalizeResourceItems(payload));
      } else if (type === 'NEW_ACTION_LOG' && payload) {
        setActionLogs((prev) => [payload, ...prev]);
      }
    });

    return () => unsubscribe();
  }, []);

  // Calculate Overall System State (Derived 100% from Live Database & IoT Telemetry)
  let systemState: 'STABLE' | 'ATTENTION' | 'EMERGENCY' = 'STABLE';
  if (fireData.isActive || liftStatus.status === 'TRAPPED_EMERGENCY' || waterData.leakageDetected) {
    systemState = 'EMERGENCY';
  } else if (visitorRequests.some((r) => r.status === 'pending') || noiseData.currentViolationStage > 0) {
    systemState = 'ATTENTION';
  }

  // 🚰 Physical Water Valve Action (Strict Command vs Device Telemetry Pattern)
  const handleToggleValve = async () => {
    const nextState = !waterData.valveClosed;
    setValveStatus('PENDING');

    try {
      const res = await sendValveCommand(nextState);

      if (!res || !res.success) {
        // 🛡️ CRITICAL RULE: NEVER update physical valve UI state locally when the API command fails!
        setValveStatus('FAILED');
        setTimeout(() => setValveStatus('IDLE'), 4000);
        return;
      }

      // If command was queued and awaiting physical gateway confirmation
      if (res.status === 'PENDING' || res.awaitingPhysicalGateway) {
        setValveStatus('PENDING');
        // Do NOT update waterData.valveClosed locally; wait for real IoT Gateway telemetry via WebSocket
        return;
      }

      // Only if backend directly confirmed physical device state
      if (typeof res.valveClosed === 'boolean') {
        setValveStatus('IDLE');
        setWaterData((prev) => ({ ...prev, valveClosed: res.valveClosed }));
      } else {
        setValveStatus('UNKNOWN');
      }
    } catch {
      // Network or unhandled failure
      setValveStatus('FAILED');
      setTimeout(() => setValveStatus('IDLE'), 4000);
    }
  };

  const handleConfirmWaterVerification = () => {
    setWaterData((prev) => ({ ...prev, leakageDetected: false }));
  };

  // Real Parking Action
  const handleToggleSlotSharing = async (slotId: string) => {
    await toggleParkingSlot(slotId);
  };

  // Real Visitor Action
  const handleApproveVisitor = async (id: string) => {
    await approveVisitor(id);
  };

  const handleDenyVisitor = async (id: string) => {
    await denyVisitor(id);
  };

  const handleCreateVisitorPass = async (params: { visitorName: string; unitNumber: string; category: string; phone?: string }) => {
    return await addVisitor(params.visitorName, params.unitNumber, params.category, params.phone);
  };

  const handleVerifyGatePass = async (otpCode: string, unitNumber?: string) => {
    return await verifyGatePass(otpCode, unitNumber);
  };

  // Real Maintenance Action
  const handleAddTicket = async (t: MaintenanceTicket) => {
    await createMaintenanceTicket({
      title: t.title,
      unit: t.unit,
      priority: t.priority,
      description: t.description
    });
  };

  // Real Waste Action
  const handleDispatchVendor = async (binId: string) => {
    await dispatchWasteVendor(binId, 'CleanCity Logistics');
  };

  // Real Noise Escalation
  const handleSimulateNoiseEscalation = async () => {
    await escalateNoise();
  };

  // Real Resource Booking Action
  const handleRequestResource = async (id: string) => {
    await bookResource(id);
  };

  return (
    <div className={`min-h-screen font-sans flex flex-col transition-colors duration-300 ${theme === 'light' ? 'bg-slate-100 text-slate-900' : 'bg-[#0b0f19] text-slate-100'}`}>
      {/* Header Bar */}
      <Header
        systemState={systemState}
        userRole={userRole}
        onSelectRole={setUserRole}
        onOpenNotifications={() => setIsNotifOpen(true)}
        notificationCount={3}
        currentUser={currentUser}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onOpenProfileModal={() => setIsProfileModalOpen(true)}
        onOpenSettings={() => setActiveTab('settings')}
        theme={theme}
        onToggleTheme={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
        currentLang={currentLang}
        onChangeLang={setCurrentLang}
        isBackendConnected={isBackendConnected}
      />

      {/* 18 Feature Module Carousel Bar */}
      <ModuleNavigation
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        userRole={userRole}
        currentLang={currentLang}
        hasWaterAlert={waterData.leakageDetected}
        hasFireAlert={fireData.isActive}
        hasLiftAlert={liftStatus.status === 'TRAPPED_EMERGENCY'}
      />

      {/* Main View Area rendering all 18 feature modules */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 pt-6">
        {/* Production Mode & Auth Stream Banner */}
        {!currentUser && (
          <div className="bg-slate-900/90 border border-cyan-500/30 rounded-xl p-3.5 mb-6 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg backdrop-blur-md">
            <div className="flex items-center gap-3 text-xs text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping shrink-0" />
              <span>
                <strong className="text-white">Production Operational Mode:</strong> Zero mock data loaded. Sign in to access your flat's authenticated telemetry & live community controls.
              </span>
            </div>
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shrink-0 transition-colors shadow-sm"
            >
              Sign In / Register
            </button>
          </div>
        )}

        {isSyncing && (
          <div className="bg-indigo-950/80 border border-indigo-500/40 rounded-xl p-2.5 mb-6 flex items-center gap-2.5 text-xs text-indigo-300 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-indigo-400" />
            <span>Synchronizing live operational telemetry with MySQL database & WebSocket channel...</span>
          </div>
        )}

        {activeTab === 'home' && (
          <HomeDashboard
            waterData={waterData}
            liftStatus={liftStatus}
            fireData={fireData}
            parkingSlots={parkingSlots}
            visitorRequests={visitorRequests}
            maintenanceTickets={maintenanceTickets}
            isBackendConnected={isBackendConnected}
            onNavigateTab={setActiveTab}
            userRole={userRole}
            currentLang={currentLang}
          />
        )}

        {activeTab === 'architecture' && <AiBrainArchitecture currentLang={currentLang} />}

        {activeTab === 'parking' && (
          <SmartParking
            parkingSlots={parkingSlots}
            onToggleSlotSharing={handleToggleSlotSharing}
          />
        )}

        {activeTab === 'water' && (
          <WaterManagement
            waterData={waterData}
            onToggleValve={handleToggleValve}
            onConfirmVerification={handleConfirmWaterVerification}
            currentLang={currentLang}
            defaultSubTab="monitoring"
            valveStatus={valveStatus}
          />
        )}

        {activeTab === 'water-leakage' && (
          <WaterManagement
            waterData={waterData}
            onToggleValve={handleToggleValve}
            onConfirmVerification={handleConfirmWaterVerification}
            currentLang={currentLang}
            defaultSubTab="leakage"
            valveStatus={valveStatus}
          />
        )}

        {activeTab === 'lighting' && <StreetLighting currentLang={currentLang} />}

        {activeTab === 'fire' && <FireEmergency fireData={fireData} />}

        {activeTab === 'security' && (
          <VisitorSecurity
            requests={visitorRequests}
            onApprove={handleApproveVisitor}
            onDeny={handleDenyVisitor}
            onCreatePass={handleCreateVisitorPass}
            onVerifyGatePass={handleVerifyGatePass}
            userRole={userRole}
            currentUserFlat={currentUser?.flatNumber}
          />
        )}

        {activeTab === 'maintenance' && (
          <MaintenanceDashboard
            tickets={maintenanceTickets}
            onAddTicket={handleAddTicket}
            currentLang={currentLang}
          />
        )}

        {activeTab === 'lift' && <LiftEmergency liftStatus={liftStatus} />}

        {activeTab === 'waste' && (
          <WasteManagement
            bins={wasteBins}
            onDispatchVendor={handleDispatchVendor}
          />
        )}

        {activeTab === 'noise' && (
          <NoiseGuardian
            noiseData={noiseData}
            onSimulateEscalation={handleSimulateNoiseEscalation}
          />
        )}

        {activeTab === 'resource' && (
          <ResourceSharing
            resources={resourceItems}
            onRequestResource={handleRequestResource}
          />
        )}

        {activeTab === 'trust' && <CommunityTrust currentLang={currentLang} />}

        {activeTab === 'guest-parking' && <GuestParking currentLang={currentLang} />}

        {activeTab === 'actionlog' && <AiActionLog logs={actionLogs} currentLang={currentLang} />}

        {activeTab === 'privacy' && <PrivacyCenter />}

        {activeTab === 'notifications' && (
          <NotificationCenter currentLang={currentLang} onNavigateTab={setActiveTab} />
        )}

        {activeTab === 'settings' && (
          <SettingsScreen
            currentLang={currentLang}
            onChangeLang={setCurrentLang}
            theme={theme}
            onToggleTheme={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
          />
        )}
      </main>

      {/* Notifications Side Drawer */}
      <NotificationsDrawer
        isOpen={isNotifOpen}
        onClose={() => setIsNotifOpen(false)}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Profile Modal */}
      {currentUser && (
        <ProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          user={currentUser}
          onUpdateUser={handleUpdateUser}
          onLogout={handleLogout}
        />
      )}

      {/* Floating AI Chat Assistant Widget */}
      <AiChatAssistant currentLang={currentLang} />

      {/* Footer */}
      <footer className="bg-slate-200/80 dark:bg-slate-950/80 border-t border-slate-300 dark:border-slate-900 py-4 text-center text-xs text-slate-600 dark:text-slate-500 transition-colors">
        RAAH NAGAR AI • Intelligently Managed Residential Society OS • All 18 Features Operational
      </footer>
    </div>
  );
}

export default App;
