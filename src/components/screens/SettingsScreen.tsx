import React, { useState, useEffect } from 'react';
import {
  Settings,
  User,
  Shield,
  Cpu,
  Bell,
  Lock,
  Coins,
  Globe,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Car,
  Key,
  Users,
  Moon,
  Sun,
  Database,
  RefreshCw,
  Plus,
  Save,
  Check,
  Ban
} from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '../../utils/i18n';
import { fetchSettings, updateSettings } from '../../services/api';

interface SettingsScreenProps {
  currentLang: string;
  onChangeLang: (lang: string) => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  currentLang,
  onChangeLang,
  theme,
  onToggleTheme
}) => {
  const [activeSection, setActiveSection] = useState<number>(1);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // 1. Account & Profile State
  const [residentName, setResidentName] = useState<string>('Rohit Sharma');
  const [flatNumber, setFlatNumber] = useState<string>('Unit C-402');
  const [emergencyContact, setEmergencyContact] = useState<string>('+91 98765 00000');
  const [verifiedBadge] = useState<boolean>(true);
  const [familyMembers, setFamilyMembers] = useState<{ id: string; name: string; relation: string; phone: string }[]>([
    { id: 'fm-1', name: 'Priya Sharma', relation: 'Spouse', phone: '+91 98765 11111' },
    { id: 'fm-2', name: 'Aarav Sharma', relation: 'Child', phone: '' }
  ]);
  const [registeredVehicles, setRegisteredVehicles] = useState<{ id: string; plateNumber: string; vehicleType: string; slotAssigned: string }[]>([
    { id: 'v-1', plateNumber: 'MH-02-CP-1234', vehicleType: 'EV Car', slotAssigned: '#42' },
    { id: 'v-2', plateNumber: 'MH-02-CP-5678', vehicleType: 'Scooter', slotAssigned: '#42B' }
  ]);
  const [rfidCardId, setRfidCardId] = useState<string>('RFID-9842-X');
  const [biometricPassEnabled, setBiometricPassEnabled] = useState<boolean>(true);
  const [mobileNfcKeyEnabled, setMobileNfcKeyEnabled] = useState<boolean>(true);

  // 2. AI Brain & Automation Preferences State
  const [autoValveV102Shutoff, setAutoValveV102Shutoff] = useState<boolean>(true);
  const [humanApprovalRequiredForRoutine, setHumanApprovalRequiredForRoutine] = useState<boolean>(true);
  const [motionPirSensitivity, setMotionPirSensitivity] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [ambientLightThresholdLux, setAmbientLightThresholdLux] = useState<number>(30);
  const [predictiveShortageAlerts, setPredictiveShortageAlerts] = useState<boolean>(true);
  const [predictiveShortageFrequency, setPredictiveShortageFrequency] = useState<'IMMEDIATE' | 'HOURLY' | 'DAILY'>('IMMEDIATE');

  // 3. Privacy & Data Center State (Feature 17)
  const [cctvEdgeProcessingOnly, setCctvEdgeProcessingOnly] = useState<boolean>(true);
  const [noiseGuardianRawMicDisabled, setNoiseGuardianRawMicDisabled] = useState<boolean>(true);
  const [activityLogsRetentionDays, setActivityLogsRetentionDays] = useState<number>(30);
  const [autoDeleteLogsEnabled, setAutoDeleteLogsEnabled] = useState<boolean>(true);

  // 4. Notification & Alert Settings State (Feature 18)
  const [criticalAlertsOverrideSound] = useState<boolean>(true); // Always ON for life safety
  const [infoAlertsEnabled, setInfoAlertsEnabled] = useState<boolean>(true);
  const [routineAlertsEnabled, setRoutineAlertsEnabled] = useState<boolean>(true);
  const [quietHoursEnabled, setQuietHoursEnabled] = useState<boolean>(true);
  const [quietHoursStart, setQuietHoursStart] = useState<string>('22:00');
  const [quietHoursEnd, setQuietHoursEnd] = useState<string>('07:00');

  // 5. Visitor & Security Rules State (Feature 09)
  const [preApprovedDeliveriesSilentPass, setPreApprovedDeliveriesSilentPass] = useState<boolean>(true);
  const [guestVerificationMethod, setGuestVerificationMethod] = useState<'QR_OTP' | 'GATEKEEPER_CALL' | 'AUTO_APPROVE'>('QR_OTP');
  const [blacklistedVisitors, setBlacklistedVisitors] = useState<{ id: string; name: string; reason: string; date: string }[]>([
    { id: 'bl-1', name: 'Unknown Vendor', reason: 'Unauthorized Soliciting', date: '2026-08-12' }
  ]);

  // 6. Wallet & Community Sharing State (Features 03, 13, 14)
  const [pCoinsBalance] = useState<number>(450);
  const [bankPayoutAccount, setBankPayoutAccount] = useState<string>('HDFC Bank **** 4892');
  const [resourceSharingWindow, setResourceSharingWindow] = useState<string>('09:00 AM - 08:00 PM');
  const [toolDepositLimitPCoins, setToolDepositLimitPCoins] = useState<number>(100);
  const [trustScorePrivateMode, setTrustScorePrivateMode] = useState<boolean>(true);

  // 7. App & System Preferences State
  const [emergencyVoiceLanguage, setEmergencyVoiceLanguage] = useState<string>('hi');
  const [cacheSizeMb, setCacheSizeMb] = useState<number>(12.4);
  const [offlineSyncEnabled, setOfflineSyncEnabled] = useState<boolean>(true);

  // Temp input states for modals/lists
  const [newMemberName, setNewMemberName] = useState<string>('');
  const [newMemberRelation, setNewMemberRelation] = useState<string>('Family Member');
  const [newVehiclePlate, setNewVehiclePlate] = useState<string>('');
  const [newVehicleType, setNewVehicleType] = useState<string>('EV Car');
  const [newBlacklistName, setNewBlacklistName] = useState<string>('');
  const [newBlacklistReason, setNewBlacklistReason] = useState<string>('');

  // Load Settings from Backend REST API
  useEffect(() => {
    fetchSettings().then((backendSettings) => {
      if (backendSettings) {
        if (backendSettings.accountProfile) {
          if (backendSettings.accountProfile.residentName) setResidentName(backendSettings.accountProfile.residentName);
          if (backendSettings.accountProfile.flatNumber) setFlatNumber(backendSettings.accountProfile.flatNumber);
          if (backendSettings.accountProfile.emergencyContact) setEmergencyContact(backendSettings.accountProfile.emergencyContact);
          if (backendSettings.accountProfile.familyMembers) setFamilyMembers(backendSettings.accountProfile.familyMembers);
          if (backendSettings.accountProfile.registeredVehicles) setRegisteredVehicles(backendSettings.accountProfile.registeredVehicles);
          if (backendSettings.accountProfile.digitalPasskeys) {
            if (backendSettings.accountProfile.digitalPasskeys.rfidCardId) setRfidCardId(backendSettings.accountProfile.digitalPasskeys.rfidCardId);
            setBiometricPassEnabled(backendSettings.accountProfile.digitalPasskeys.biometricPassEnabled ?? true);
            setMobileNfcKeyEnabled(backendSettings.accountProfile.digitalPasskeys.mobileNfcKeyEnabled ?? true);
          }
        }
        if (backendSettings.aiAutomation) {
          setAutoValveV102Shutoff(backendSettings.aiAutomation.autoValveV102Shutoff ?? true);
          setHumanApprovalRequiredForRoutine(backendSettings.aiAutomation.humanApprovalRequiredForRoutine ?? true);
          setMotionPirSensitivity(backendSettings.aiAutomation.motionPirSensitivity || 'MEDIUM');
          setAmbientLightThresholdLux(backendSettings.aiAutomation.ambientLightThresholdLux || 30);
          setPredictiveShortageAlerts(backendSettings.aiAutomation.predictiveShortageAlerts ?? true);
          setPredictiveShortageFrequency(backendSettings.aiAutomation.predictiveShortageFrequency || 'IMMEDIATE');
        }
        if (backendSettings.privacyData) {
          setCctvEdgeProcessingOnly(backendSettings.privacyData.cctvEdgeProcessingOnly ?? true);
          setNoiseGuardianRawMicDisabled(backendSettings.privacyData.noiseGuardianRawMicDisabled ?? true);
          setActivityLogsRetentionDays(backendSettings.privacyData.activityLogsRetentionDays || 30);
          setAutoDeleteLogsEnabled(backendSettings.privacyData.autoDeleteLogsEnabled ?? true);
        }
        if (backendSettings.notificationsAlerts) {
          setInfoAlertsEnabled(backendSettings.notificationsAlerts.infoAlertsEnabled ?? true);
          setRoutineAlertsEnabled(backendSettings.notificationsAlerts.routineAlertsEnabled ?? true);
          setQuietHoursEnabled(backendSettings.notificationsAlerts.quietHoursEnabled ?? true);
          setQuietHoursStart(backendSettings.notificationsAlerts.quietHoursStart || '22:00');
          setQuietHoursEnd(backendSettings.notificationsAlerts.quietHoursEnd || '07:00');
        }
        if (backendSettings.visitorSecurityRules) {
          setPreApprovedDeliveriesSilentPass(backendSettings.visitorSecurityRules.preApprovedDeliveriesSilentPass ?? true);
          setGuestVerificationMethod(backendSettings.visitorSecurityRules.guestVerificationMethod || 'QR_OTP');
          if (backendSettings.visitorSecurityRules.blacklistedVisitors) setBlacklistedVisitors(backendSettings.visitorSecurityRules.blacklistedVisitors);
        }
        if (backendSettings.walletSharing) {
          if (backendSettings.walletSharing.bankPayoutAccount) setBankPayoutAccount(backendSettings.walletSharing.bankPayoutAccount);
          if (backendSettings.walletSharing.resourceSharingAvailabilityWindow) setResourceSharingWindow(backendSettings.walletSharing.resourceSharingAvailabilityWindow);
          setToolDepositLimitPCoins(backendSettings.walletSharing.toolSecurityDepositLimitPCoins || 100);
          setTrustScorePrivateMode(backendSettings.walletSharing.trustScorePrivateMode ?? true);
        }
        if (backendSettings.appSystemPreferences) {
          setEmergencyVoiceLanguage(backendSettings.appSystemPreferences.emergencyVoiceLanguage || 'hi');
          setOfflineSyncEnabled(backendSettings.appSystemPreferences.offlineSyncEnabled ?? true);
        }
      }
    });
  }, []);

  // Save Settings Payload to Backend REST API
  const handleSaveAllSettings = async () => {
    setIsSaving(true);
    const settingsPayload = {
      accountProfile: {
        residentName,
        flatNumber,
        emergencyContact,
        verifiedBadge,
        familyMembers,
        registeredVehicles,
        digitalPasskeys: {
          rfidCardId,
          biometricPassEnabled,
          mobileNfcKeyEnabled
        }
      },
      aiAutomation: {
        autoValveV102Shutoff,
        humanApprovalRequiredForRoutine,
        motionPirSensitivity,
        ambientLightThresholdLux,
        predictiveShortageAlerts,
        predictiveShortageFrequency
      },
      privacyData: {
        cctvEdgeProcessingOnly,
        noiseGuardianRawMicDisabled,
        activityLogsRetentionDays,
        autoDeleteLogsEnabled
      },
      notificationsAlerts: {
        criticalAlertsOverrideSound: true,
        infoAlertsEnabled,
        routineAlertsEnabled,
        quietHoursEnabled,
        quietHoursStart,
        quietHoursEnd
      },
      visitorSecurityRules: {
        preApprovedDeliveriesSilentPass,
        guestVerificationMethod,
        blacklistedVisitors
      },
      walletSharing: {
        pCoinsBalance,
        bankPayoutAccount,
        resourceSharingAvailabilityWindow: resourceSharingWindow,
        toolSecurityDepositLimitPCoins: toolDepositLimitPCoins,
        trustScorePrivateMode
      },
      appSystemPreferences: {
        theme,
        language: currentLang,
        emergencyVoiceLanguage,
        cacheSizeMb,
        offlineSyncEnabled,
        rnVersion: 'RN Version 1.0'
      }
    };

    await updateSettings(settingsPayload);
    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Helper List Operations
  const handleAddFamilyMember = () => {
    if (!newMemberName) return;
    setFamilyMembers((prev) => [
      ...prev,
      { id: `fm-${Date.now()}`, name: newMemberName, relation: newMemberRelation, phone: '' }
    ]);
    setNewMemberName('');
  };

  const handleRemoveFamilyMember = (id: string) => {
    setFamilyMembers((prev) => prev.filter((m) => m.id !== id));
  };

  const handleAddVehicle = () => {
    if (!newVehiclePlate) return;
    setRegisteredVehicles((prev) => [
      ...prev,
      { id: `v-${Date.now()}`, plateNumber: newVehiclePlate.toUpperCase(), vehicleType: newVehicleType, slotAssigned: '#42' }
    ]);
    setNewVehiclePlate('');
  };

  const handleRemoveVehicle = (id: string) => {
    setRegisteredVehicles((prev) => prev.filter((v) => v.id !== id));
  };

  const handleAddBlacklist = () => {
    if (!newBlacklistName) return;
    setBlacklistedVisitors((prev) => [
      ...prev,
      { id: `bl-${Date.now()}`, name: newBlacklistName, reason: newBlacklistReason || 'Security Boundary', date: 'Today' }
    ]);
    setNewBlacklistName('');
    setNewBlacklistReason('');
  };

  const handleRemoveBlacklist = (id: string) => {
    setBlacklistedVisitors((prev) => prev.filter((b) => b.id !== id));
  };

  const sections = [
    { id: 1, title: '1. Account & Profile', icon: User, badge: 'Verified' },
    { id: 2, title: '2. AI Automation & Valve Control', icon: Cpu, badge: 'V-102' },
    { id: 3, title: '3. Privacy & Data Center', icon: Lock, badge: 'Feature 17' },
    { id: 4, title: '4. Notifications & DND', icon: Bell, badge: 'Feature 18' },
    { id: 5, title: '5. Visitor & Security Rules', icon: Shield, badge: 'Feature 09' },
    { id: 6, title: '6. Wallet & Community Sharing', icon: Coins, badge: 'P-Coins' },
    { id: 7, title: '7. App & System Preferences', icon: Settings, badge: 'RN v1.0' }
  ];

  return (
    <div className="space-y-6 pb-16">
      {/* Top Banner Header */}
      <div className="glass-panel p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shrink-0">
              <Settings className="w-8 h-8 shrink-0" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Raah Nagar AI Master System Settings
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 font-semibold border border-cyan-500/30">
                  7 Category Matrix
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Configure resident profiles, AI brain autonomy, privacy zero-knowledge toggles, notification layers & wallet limits.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <button
              onClick={handleSaveAllSettings}
              disabled={isSaving}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
                saveSuccess
                  ? 'bg-emerald-500 hover:bg-emerald-400'
                  : 'bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500'
              }`}
            >
              {saveSuccess ? (
                <>
                  <Check className="w-4 h-4 shrink-0" /> Settings Saved to Backend!
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 shrink-0" /> {isSaving ? 'Saving...' : 'Save All Preferences'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Settings Layout: Left Navigation + Right Detail Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Side Category Navigation Tabs */}
        <div className="glass-panel p-3 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1.5 h-fit">
          <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase px-3 py-1">
            Setting Categories
          </div>
          {sections.map((sec) => {
            const Icon = sec.icon;
            const isSelected = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => setActiveSection(sec.id)}
                className={`w-full px-3.5 py-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-between text-left cursor-pointer border ${
                  isSelected
                    ? 'bg-cyan-500/10 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border-cyan-500/40 shadow-sm font-bold'
                    : 'bg-slate-50 dark:bg-slate-900/40 text-slate-600 dark:text-slate-400 border-transparent hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-500'}`} />
                  <span className="truncate">{sec.title}</span>
                </div>
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-mono shrink-0 ml-1 ${
                  isSelected ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                }`}>
                  {sec.badge}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right Side Content Panel */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* SECTION 1: Account & Profile Settings */}
          {activeSection === 1 && (
            <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <User className="w-5 h-5 text-cyan-600 dark:text-cyan-400 shrink-0" />
                  1. Account & Resident Profile Settings
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Verified Resident Badge Active
                </span>
              </div>

              {/* Form Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Resident Full Name</label>
                  <input
                    type="text"
                    value={residentName}
                    onChange={(e) => setResidentName(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Flat / Villa Number</label>
                  <input
                    type="text"
                    value={flatNumber}
                    onChange={(e) => setFlatNumber(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Emergency SOS Phone Contact</label>
                  <input
                    type="text"
                    value={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">RFID Digital Card Key ID</label>
                  <input
                    type="text"
                    value={rfidCardId}
                    onChange={(e) => setRfidCardId(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white font-mono outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Family Members List */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
                  Family Members Management
                </h4>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Member Name"
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    className="flex-1 p-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white outline-none"
                  />
                  <select
                    value={newMemberRelation}
                    onChange={(e) => setNewMemberRelation(e.target.value)}
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white outline-none"
                  >
                    <option value="Spouse">Spouse</option>
                    <option value="Child">Child</option>
                    <option value="Parent">Parent</option>
                    <option value="Sibling">Sibling</option>
                  </select>
                  <button
                    onClick={handleAddFamilyMember}
                    className="px-3 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs shrink-0 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add
                  </button>
                </div>

                <div className="space-y-2">
                  {familyMembers.map((m) => (
                    <div key={m.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white">{m.name}</span>
                        <span className="text-slate-500 dark:text-slate-400 ml-2">({m.relation})</span>
                      </div>
                      <button
                        onClick={() => handleRemoveFamilyMember(m.id)}
                        className="text-red-500 hover:text-red-400 text-xs font-semibold cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Registered Vehicles */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Car className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
                  Registered Vehicles (ANPR Plate Mapping for Dynamic Parking)
                </h4>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="License Plate Number (e.g. MH-02-CP-1234)"
                    value={newVehiclePlate}
                    onChange={(e) => setNewVehiclePlate(e.target.value)}
                    className="flex-1 p-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white uppercase outline-none"
                  />
                  <select
                    value={newVehicleType}
                    onChange={(e) => setNewVehicleType(e.target.value)}
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white outline-none"
                  >
                    <option value="EV Car">EV Car</option>
                    <option value="Sedan">Sedan</option>
                    <option value="SUV">SUV</option>
                    <option value="Scooter">Scooter</option>
                  </select>
                  <button
                    onClick={handleAddVehicle}
                    className="px-3 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs shrink-0 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add
                  </button>
                </div>

                <div className="space-y-2">
                  {registeredVehicles.map((v) => (
                    <div key={v.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-mono font-bold text-cyan-700 dark:text-cyan-400">{v.plateNumber}</span>
                        <span className="text-slate-600 dark:text-slate-300 ml-2">({v.vehicleType})</span>
                        <span className="text-slate-500 dark:text-slate-400 ml-2 font-mono">• Slot {v.slotAssigned}</span>
                      </div>
                      <button
                        onClick={() => handleRemoveVehicle(v.id)}
                        className="text-red-500 hover:text-red-400 text-xs font-semibold cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Digital Passkeys Toggles */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Key className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
                  Digital Passkeys & Mobile Credential Management
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <label className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs cursor-pointer">
                    <span className="text-slate-700 dark:text-slate-300 font-medium">Biometric Pass (FaceID / Fingerprint)</span>
                    <input
                      type="checkbox"
                      checked={biometricPassEnabled}
                      onChange={(e) => setBiometricPassEnabled(e.target.checked)}
                      className="w-4 h-4 accent-cyan-500 cursor-pointer"
                    />
                  </label>

                  <label className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs cursor-pointer">
                    <span className="text-slate-700 dark:text-slate-300 font-medium">Mobile NFC Digital Gate Key</span>
                    <input
                      type="checkbox"
                      checked={mobileNfcKeyEnabled}
                      onChange={(e) => setMobileNfcKeyEnabled(e.target.checked)}
                      className="w-4 h-4 accent-cyan-500 cursor-pointer"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: AI Brain & Automation Preferences */}
          {activeSection === 2 && (
            <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  2. AI Brain & Autonomous Action Preferences
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 border border-indigo-500/30">
                  Feature 02 Integration
                </span>
              </div>

              <div className="space-y-4">
                {/* Auto Valve Shutoff Toggle */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">Emergency Valve V-102 Auto Cut-Off</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">If water pressure anomaly &gt;90% confidence is detected at night, automatically shut motorized main valve.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoValveV102Shutoff}
                    onChange={(e) => setAutoValveV102Shutoff(e.target.checked)}
                    className="w-5 h-5 accent-cyan-500 shrink-0 cursor-pointer"
                  />
                </div>

                {/* Human Approval Required */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">Human Sign-off for Routine Tasks</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Require 1-tap admin sign-off before generating routine maintenance vendor quotes.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={humanApprovalRequiredForRoutine}
                    onChange={(e) => setHumanApprovalRequiredForRoutine(e.target.checked)}
                    className="w-5 h-5 accent-cyan-500 shrink-0 cursor-pointer"
                  />
                </div>

                {/* Motion PIR Sensitivity */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900 dark:text-white">Streetlight PIR Motion Sensitivity Level</span>
                    <span className="font-bold text-cyan-600 dark:text-cyan-400">{motionPirSensitivity} SENSITIVITY</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {(['LOW', 'MEDIUM', 'HIGH'] as const).map((lvl) => (
                      <button
                        key={lvl}
                        onClick={() => setMotionPirSensitivity(lvl)}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          motionPirSensitivity === lvl
                            ? 'bg-cyan-500 text-slate-950 shadow-md'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Ambient Light Threshold Slider */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900 dark:text-white">Ambient Light Threshold for 30% Dimming</span>
                    <span className="font-mono text-cyan-600 dark:text-cyan-400 font-bold">{ambientLightThresholdLux} LUX</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={ambientLightThresholdLux}
                    onChange={(e) => setAmbientLightThresholdLux(Number(e.target.value))}
                    className="w-full accent-cyan-500 cursor-pointer"
                  />
                </div>

                {/* Predictive Shortage Frequency */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">Predictive Shortage Alert Frequency</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Frequency of AI water shortage & equipment repair warnings.</p>
                  </div>
                  <select
                    value={predictiveShortageFrequency}
                    onChange={(e) => setPredictiveShortageFrequency(e.target.value as any)}
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none"
                  >
                    <option value="IMMEDIATE">Immediate Trigger</option>
                    <option value="HOURLY">Hourly Summary</option>
                    <option value="DAILY">Daily Digest</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 3: Privacy & Data Center (Feature 17 Integration) */}
          {activeSection === 3 && (
            <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Lock className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  3. Privacy Center & Data Minimization Settings
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                  Feature 17 Integration
                </span>
              </div>

              <div className="space-y-4">
                {/* Edge CCTV Processing */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">CCTV Edge-Processing Only (Zero Cloud Feed)</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Process video streams locally on edge camera hardware; no raw video feeds are sent to public cloud servers.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={cctvEdgeProcessingOnly}
                    onChange={(e) => setCctvEdgeProcessingOnly(e.target.checked)}
                    className="w-5 h-5 accent-emerald-500 shrink-0 cursor-pointer"
                  />
                </div>

                {/* Noise Guardian Raw Audio Disabled */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">Noise Guardian Raw Audio Recording Disabled</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Strictly monitor decibel (dB) amplitude numbers only. Mic recording of voice conversations is hard-blocked.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={noiseGuardianRawMicDisabled}
                    onChange={(e) => setNoiseGuardianRawMicDisabled(e.target.checked)}
                    className="w-5 h-5 accent-emerald-500 shrink-0 cursor-pointer"
                  />
                </div>

                {/* Activity Log Retention */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">Flat Activity History Auto-Purge Timer</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Automatically delete flat gate entries and AI logs after retention period.</p>
                  </div>
                  <select
                    value={activityLogsRetentionDays}
                    onChange={(e) => setActivityLogsRetentionDays(Number(e.target.value))}
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none"
                  >
                    <option value="7">7 Days</option>
                    <option value="30">30 Days</option>
                    <option value="90">90 Days</option>
                    <option value="365">365 Days</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 4: Notification & Alert Settings (Feature 18 Integration) */}
          {activeSection === 4 && (
            <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Bell className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
                  4. 3-Layer Notification & Quiet Hours Settings
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-500/20 text-red-700 dark:text-red-400 border border-red-500/30">
                  Feature 18 Integration
                </span>
              </div>

              <div className="space-y-4">
                {/* Layer 1 Critical Override */}
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-1.5">
                      <Flame className="w-4 h-4 shrink-0" /> Layer 1: Critical Emergency Siren Sound
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300">Fire, trapped lift SOS, water line burst (Always overrides DND & Silent mode).</p>
                  </div>
                  <span className="px-2.5 py-1 rounded bg-red-500 text-white font-bold text-[10px]">
                    {criticalAlertsOverrideSound ? 'ALWAYS ON (OVERRIDE)' : 'ENABLED'}
                  </span>
                </div>

                {/* Layer 2 Info Alerts */}
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 shrink-0" /> Layer 2: Action Required / Info Alerts
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300">Visitor arrival at gate, parcel delivery, parking slot allocation.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={infoAlertsEnabled}
                    onChange={(e) => setInfoAlertsEnabled(e.target.checked)}
                    className="w-5 h-5 accent-amber-500 shrink-0 cursor-pointer"
                  />
                </div>

                {/* Layer 3 Routine Updates */}
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 shrink-0" /> Layer 3: Routine Notices & P-Coins Updates
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300">Dustbin clearance, tool return confirmations, energy dimming updates.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={routineAlertsEnabled}
                    onChange={(e) => setRoutineAlertsEnabled(e.target.checked)}
                    className="w-5 h-5 accent-emerald-500 shrink-0 cursor-pointer"
                  />
                </div>

                {/* Quiet Hours / DND */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">Nighttime Quiet Hours (DND Mode)</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Silences Layer 2 & Layer 3 non-emergency alerts during sleep hours.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={quietHoursEnabled}
                      onChange={(e) => setQuietHoursEnabled(e.target.checked)}
                      className="w-5 h-5 accent-cyan-500 shrink-0 cursor-pointer"
                    />
                  </div>

                  {quietHoursEnabled && (
                    <div className="flex items-center gap-3 pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
                      <div>
                        <span className="text-slate-500 dark:text-slate-400 mr-2">Start Time:</span>
                        <input
                          type="time"
                          value={quietHoursStart}
                          onChange={(e) => setQuietHoursStart(e.target.value)}
                          className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                        />
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-slate-400 mr-2">End Time:</span>
                        <input
                          type="time"
                          value={quietHoursEnd}
                          onChange={(e) => setQuietHoursEnd(e.target.value)}
                          className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* SECTION 5: Visitor & Security Rules (Feature 09 Integration) */}
          {activeSection === 5 && (
            <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Shield className="w-5 h-5 text-cyan-600 dark:text-cyan-400 shrink-0" />
                  5. Gate Security & Visitor Rules
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-700 dark:text-cyan-400 border border-cyan-500/30">
                  Feature 09 Integration
                </span>
              </div>

              <div className="space-y-4">
                {/* Pre-Approved Courier Entry */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">Pre-Approved Silent Courier Pass</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Verified Amazon, Ekart, Zomato couriers receive instant silent entry QR without calling resident.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={preApprovedDeliveriesSilentPass}
                    onChange={(e) => setPreApprovedDeliveriesSilentPass(e.target.checked)}
                    className="w-5 h-5 accent-cyan-500 shrink-0 cursor-pointer"
                  />
                </div>

                {/* Guest Verification Method */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Guest Entry Verification Preference</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {[
                      { id: 'QR_OTP', label: 'Digital QR / OTP Pass' },
                      { id: 'GATEKEEPER_CALL', label: 'Gatekeeper Intercom Call' },
                      { id: 'AUTO_APPROVE', label: 'Auto-Approve Pre-Invited' }
                    ].map((method) => (
                      <button
                        key={method.id}
                        onClick={() => setGuestVerificationMethod(method.id as any)}
                        className={`p-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                          guestVerificationMethod === method.id
                            ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold shadow-md'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                        }`}
                      >
                        {method.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Gate Blacklist / Deny List */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Ban className="w-4 h-4 text-red-500 shrink-0" />
                    Blacklist / Gate Deny List
                  </h4>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Person / Vendor Name"
                      value={newBlacklistName}
                      onChange={(e) => setNewBlacklistName(e.target.value)}
                      className="flex-1 p-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Reason for Ban"
                      value={newBlacklistReason}
                      onChange={(e) => setNewBlacklistReason(e.target.value)}
                      className="flex-1 p-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white outline-none"
                    />
                    <button
                      onClick={handleAddBlacklist}
                      className="px-3 py-2 rounded-xl bg-red-500 text-white font-bold text-xs shrink-0 flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Block
                    </button>
                  </div>

                  <div className="space-y-2">
                    {blacklistedVisitors.map((b) => (
                      <div key={b.id} className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-red-600 dark:text-red-400">{b.name}</span>
                          <span className="text-slate-600 dark:text-slate-300 ml-2">• Reason: {b.reason}</span>
                        </div>
                        <button
                          onClick={() => handleRemoveBlacklist(b.id)}
                          className="text-slate-500 hover:text-white text-xs font-semibold cursor-pointer"
                        >
                          Unblock
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 6: Wallet & Community Sharing (Features 03, 13, 14 Integration) */}
          {activeSection === 6 && (
            <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Coins className="w-5 h-5 text-amber-500 shrink-0" />
                  6. P-Coins Wallet, Tool Escrow & Trust Score Settings
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                  Features 03, 13 & 14
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Wallet Balance Card */}
                <div className="p-5 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-cyan-500/20 border border-amber-500/30 space-y-2">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase">P-Coins Balance</span>
                  <div className="text-3xl font-black text-amber-500">{pCoinsBalance} P-Coins</div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Earned via parking slot sharing & tool rentals.</p>
                  <div className="pt-2">
                    <button
                      onClick={() => alert(`Payout request of ${pCoinsBalance} P-Coins initiated to ${bankPayoutAccount}!`)}
                      className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs shadow-md cursor-pointer"
                    >
                      Redeem & Bank Payout
                    </button>
                  </div>
                </div>

                {/* Bank Account Details */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Bank Account for Payouts</h4>
                  <input
                    type="text"
                    value={bankPayoutAccount}
                    onChange={(e) => setBankPayoutAccount(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white outline-none"
                  />
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Direct NEFT/UPI transfer upon redemption.</p>
                </div>
              </div>

              {/* Tool Sharing Availability Window & Security Limits */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Resource Sharing & Tool Rental Window</h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Availability Time Window</label>
                    <input
                      type="text"
                      value={resourceSharingWindow}
                      onChange={(e) => setResourceSharingWindow(e.target.value)}
                      className="w-full p-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Security Deposit Hold Limit (P-Coins)</label>
                    <input
                      type="number"
                      value={toolDepositLimitPCoins}
                      onChange={(e) => setToolDepositLimitPCoins(Number(e.target.value))}
                      className="w-full p-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Private Community Trust Score Mode */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Private Community Trust Score Mode</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Keep individual review notes encrypted; expose aggregated trust tier (Platinum/Gold) only.</p>
                </div>
                <input
                  type="checkbox"
                  checked={trustScorePrivateMode}
                  onChange={(e) => setTrustScorePrivateMode(e.target.checked)}
                  className="w-5 h-5 accent-amber-500 shrink-0 cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* SECTION 7: App & System Preferences */}
          {activeSection === 7 && (
            <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Globe className="w-5 h-5 text-cyan-600 dark:text-cyan-400 shrink-0" />
                  7. App & System Preferences
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-700 dark:text-cyan-400 border border-cyan-500/30 font-mono">
                  RN Version 1.0
                </span>
              </div>

              <div className="space-y-4">
                {/* Theme Selector */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">Visual UI Theme Mode</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Deep Navy Dark Mode vs Clean Light Mode.</p>
                  </div>

                  <button
                    onClick={onToggleTheme}
                    className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2 border border-slate-300 dark:border-slate-700 cursor-pointer"
                  >
                    {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
                    <span>{theme === 'dark' ? 'Dark Mode Active' : 'Light Mode Active'}</span>
                  </button>
                </div>

                {/* Primary Language */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">Primary Application Language</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Applies dynamically across all 18 modules & headers.</p>
                  </div>

                  <select
                    value={currentLang}
                    onChange={(e) => onChangeLang(e.target.value)}
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none cursor-pointer"
                  >
                    {SUPPORTED_LANGUAGES.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.flag} {lang.nativeName} ({lang.name})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Emergency Voice Broadcast Language */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">Emergency Cabin & Siren Audio Guidance Language</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Voice reassuring language for trapped lift cabin & fire evacuation speakers.</p>
                  </div>

                  <select
                    value={emergencyVoiceLanguage}
                    onChange={(e) => setEmergencyVoiceLanguage(e.target.value)}
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none cursor-pointer"
                  >
                    <option value="hi">हिंदी (Hindi Voice Broadcast)</option>
                    <option value="en">English (English Voice Broadcast)</option>
                    <option value="mr">मराठी (Marathi Voice Broadcast)</option>
                    <option value="gu">ગુજરાતી (Gujarati Voice Broadcast)</option>
                  </select>
                </div>

                {/* Offline Sync & System Cache */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Database className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
                    System Diagnostics & Local Storage Cache
                  </h4>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 dark:text-slate-400">App Cache Size:</span>
                      <strong className="text-slate-900 dark:text-white font-mono">{cacheSizeMb} MB</strong>
                    </div>

                    <button
                      onClick={() => {
                        setCacheSizeMb(0.0);
                        alert('App cache cleared successfully!');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-xs border border-slate-300 dark:border-slate-700 flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Clear App Cache
                    </button>
                  </div>

                  <label className="flex items-center justify-between text-xs pt-2 border-t border-slate-200 dark:border-slate-800 cursor-pointer">
                    <span className="text-slate-700 dark:text-slate-300 font-medium">Offline Data Telemetry Sync</span>
                    <input
                      type="checkbox"
                      checked={offlineSyncEnabled}
                      onChange={(e) => setOfflineSyncEnabled(e.target.checked)}
                      className="w-4 h-4 accent-cyan-500 cursor-pointer"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
