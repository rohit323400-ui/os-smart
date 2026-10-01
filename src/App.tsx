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
  triggerFireEmergency,
  resetFireEmergency,
  approveVisitor,
  escalateNoise,
  resetNoise,
  sendValveCommand,
  toggleParkingSlot,
  triggerLiftSos,
  resetLiftSos,
  dispatchWasteVendor,
  bookResource,
  createMaintenanceTicket,
  setAuthToken,
  clearAuthToken
} from './services/api';

import {
  initialWaterData,
  initialParkingSlots,
  initialFireData,
  initialVisitorRequests,
  initialMaintenanceTickets,
  initialLiftStatus,
  initialWasteBins,
  initialNoiseData,
  initialResourceItems,
  initialActionLogs,
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

export function App() {
  const [activeTab, setActiveTab] = useState<ModuleTab>('home');
  const [activeScenario, setActiveScenario] = useState<'NORMAL' | 'FIRE' | 'WATER' | 'LIFT' | 'NOISE'>('NORMAL');
  const [userRole, setUserRole] = useState<'Resident' | 'Facility Admin' | 'Security Guard' | 'Maintenance Tech'>('Resident');
  const [isNotifOpen, setIsNotifOpen] = useState<boolean>(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [currentLang, setCurrentLang] = useState<string>('en');

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

  const handleAuthSuccess = (user: UserProfileData, token: string) => {
    setCurrentUser(user);
    setUserRole(user.role);
    setAuthToken(token);
    localStorage.setItem('society_user', JSON.stringify(user));

    // Immediately trigger backend sync on login
    fetchFullSync().then((data) => {
      if (data) {
        setIsBackendConnected(true);
        if (data.waterData) setWaterData((prev) => ({ ...prev, ...data.waterData }));
        if (data.parkingSlots) setParkingSlots(data.parkingSlots);
        if (data.fireEmergencyData) setFireData((prev) => ({ ...prev, ...data.fireEmergencyData }));
        if (data.visitorRequests) setVisitorRequests(data.visitorRequests);
        if (data.maintenanceTickets) setMaintenanceTickets(data.maintenanceTickets);
        if (data.liftStatuses && data.liftStatuses.length > 0) setLiftStatus((prev) => ({ ...prev, ...data.liftStatuses[0] }));
        if (data.wasteBins) setWasteBins(data.wasteBins);
        if (data.noiseData) setNoiseData(data.noiseData);
        if (data.resourceItems) setResourceItems(data.resourceItems);
        if (data.actionLogs) setActionLogs(data.actionLogs);
      }
    });
  };

  const handleLogout = () => {
    setCurrentUser(null);
    clearAuthToken();
  };

  const handleUpdateUser = (updatedUser: UserProfileData) => {
    setCurrentUser(updatedUser);
    setUserRole(updatedUser.role);
    localStorage.setItem('society_user', JSON.stringify(updatedUser));
  };

  // Main Feature States
  const [waterData, setWaterData] = useState<WaterData>(initialWaterData);
  const [parkingSlots, setParkingSlots] = useState<ParkingSlot[]>(initialParkingSlots);
  const [fireData, setFireData] = useState(initialFireData);
  const [visitorRequests, setVisitorRequests] = useState<VisitorRequest[]>(initialVisitorRequests);
  const [maintenanceTickets, setMaintenanceTickets] = useState<MaintenanceTicket[]>(initialMaintenanceTickets);
  const [liftStatus, setLiftStatus] = useState<LiftStatus>(initialLiftStatus);
  const [wasteBins, setWasteBins] = useState<WasteBinData[]>(initialWasteBins);
  const [noiseData, setNoiseData] = useState<NoiseData>(initialNoiseData);
  const [resourceItems, setResourceItems] = useState<ResourceItem[]>(initialResourceItems);
  const [actionLogs, setActionLogs] = useState<ActionLogItem[]>(initialActionLogs);
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(false);

  // Sync Backend WebSocket & REST APIs
  useEffect(() => {
    // Initial fetch if user is already authenticated
    fetchFullSync().then((data) => {
      if (data) {
        setIsBackendConnected(true);
        if (data.waterData) setWaterData((prev) => ({ ...prev, ...data.waterData }));
        if (data.parkingSlots) setParkingSlots(data.parkingSlots);
        if (data.fireEmergencyData) setFireData((prev) => ({ ...prev, ...data.fireEmergencyData }));
        if (data.visitorRequests) setVisitorRequests(data.visitorRequests);
        if (data.maintenanceTickets) setMaintenanceTickets(data.maintenanceTickets);
        if (data.liftStatuses && data.liftStatuses.length > 0) setLiftStatus((prev) => ({ ...prev, ...data.liftStatuses[0] }));
        if (data.wasteBins) setWasteBins(data.wasteBins);
        if (data.noiseData) setNoiseData(data.noiseData);
        if (data.resourceItems) setResourceItems(data.resourceItems);
        if (data.actionLogs) setActionLogs(data.actionLogs);
      }
    });

    const unsubscribe = connectRealtime((type, payload) => {
      setIsBackendConnected(true);
      if (type === 'INITIAL_SYNC' && payload) {
        if (payload.waterData) setWaterData((prev) => ({ ...prev, ...payload.waterData }));
        if (payload.parkingSlots) setParkingSlots(payload.parkingSlots);
        if (payload.fireEmergencyData) setFireData((prev) => ({ ...prev, ...payload.fireEmergencyData }));
        if (payload.visitorRequests) setVisitorRequests(payload.visitorRequests);
        if (payload.maintenanceTickets) setMaintenanceTickets(payload.maintenanceTickets);
        if (payload.liftStatuses && payload.liftStatuses.length > 0) setLiftStatus((prev) => ({ ...prev, ...payload.liftStatuses[0] }));
        if (payload.wasteBins) setWasteBins(payload.wasteBins);
        if (payload.noiseData) setNoiseData(payload.noiseData);
        if (payload.resourceItems) setResourceItems(payload.resourceItems);
        if (payload.actionLogs) setActionLogs(payload.actionLogs);
      } else if (type === 'WATER_UPDATED') {
        setWaterData((prev) => ({ ...prev, ...payload }));
      } else if (type === 'PARKING_UPDATED') {
        setParkingSlots(payload);
      } else if (type === 'FIRE_EMERGENCY') {
        setFireData((prev) => ({ ...prev, ...payload, isActive: !!payload.isAlarmActive }));
      } else if (type === 'VISITOR_UPDATED') {
        setVisitorRequests(payload);
      } else if (type === 'MAINTENANCE_UPDATED') {
        setMaintenanceTickets(payload);
      } else if (type === 'LIFT_UPDATED') {
        if (Array.isArray(payload) && payload.length > 0) {
          setLiftStatus((prev) => ({ ...prev, ...payload[0] }));
        }
      } else if (type === 'WASTE_UPDATED') {
        setWasteBins(payload);
      } else if (type === 'NOISE_UPDATED') {
        setNoiseData(payload);
      } else if (type === 'RESOURCE_UPDATED') {
        setResourceItems(payload);
      } else if (type === 'NEW_ACTION_LOG') {
        setActionLogs((prev) => [payload, ...prev]);
      }
    });

    return () => unsubscribe();
  }, []);

  // Calculate Overall System State
  let systemState: 'STABLE' | 'ATTENTION' | 'EMERGENCY' = 'STABLE';
  if (activeScenario === 'FIRE' || activeScenario === 'WATER' || activeScenario === 'LIFT') {
    systemState = 'EMERGENCY';
  } else if (activeScenario === 'NOISE' || visitorRequests.some((r) => r.status === 'pending')) {
    systemState = 'ATTENTION';
  }

  // Scenario Handlers
  const handleSelectScenario = (scenario: 'NORMAL' | 'FIRE' | 'WATER' | 'LIFT' | 'NOISE') => {
    setActiveScenario(scenario);
    if (scenario === 'FIRE') {
      triggerFireEmergency();
      setFireData((prev) => ({ ...prev, isActive: true }));
      setActiveTab('fire');
    } else if (scenario === 'WATER') {
      setWaterData((prev) => ({ ...prev, leakageDetected: true }));
      setActiveTab('water-leakage');
    } else if (scenario === 'LIFT') {
      triggerLiftSos('l1');
      setLiftStatus((prev) => ({ ...prev, status: 'TRAPPED_EMERGENCY' }));
      setActiveTab('lift');
    } else if (scenario === 'NOISE') {
      escalateNoise();
      setNoiseData((prev) => ({ ...prev, currentViolationStage: 1 }));
      setActiveTab('noise');
    } else {
      resetFireEmergency();
      resetLiftSos('l1');
      resetNoise();
      setFireData((prev) => ({ ...prev, isActive: false }));
      setWaterData((prev) => ({ ...prev, leakageDetected: false }));
      setLiftStatus((prev) => ({ ...prev, status: 'NORMAL' }));
      setNoiseData((prev) => ({ ...prev, currentViolationStage: 0 }));
      setActiveTab('home');
    }
  };

  // Real Water Valve Action
  const handleToggleValve = async () => {
    const nextState = !waterData.valveClosed;
    const res = await sendValveCommand(nextState);
    if (res && res.success) {
      setWaterData((prev) => ({ ...prev, valveClosed: res.valveClosed }));
    } else {
      setWaterData((prev) => ({ ...prev, valveClosed: nextState }));
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

  const handleDenyVisitor = (id: string) => {
    setVisitorRequests((prev) =>
      prev.map((v) => (v.id === id ? { ...v, status: 'denied' } : v))
    );
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
        activeScenario={activeScenario}
        userRole={userRole}
        onSelectScenario={handleSelectScenario}
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
        {activeTab === 'home' && (
          <HomeDashboard
            waterData={waterData}
            liftStatus={liftStatus}
            fireData={fireData}
            parkingSlots={parkingSlots}
            onNavigateTab={setActiveTab}
            activeScenario={activeScenario}
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
          />
        )}

        {activeTab === 'water-leakage' && (
          <WaterManagement
            waterData={waterData}
            onToggleValve={handleToggleValve}
            onConfirmVerification={handleConfirmWaterVerification}
            currentLang={currentLang}
            defaultSubTab="leakage"
          />
        )}

        {activeTab === 'lighting' && <StreetLighting currentLang={currentLang} />}

        {activeTab === 'fire' && <FireEmergency fireData={fireData} />}

        {activeTab === 'security' && (
          <VisitorSecurity
            requests={visitorRequests}
            onApprove={handleApproveVisitor}
            onDeny={handleDenyVisitor}
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
