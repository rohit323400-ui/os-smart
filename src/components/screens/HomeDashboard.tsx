import React from 'react';
import {
  Activity,
  AlertTriangle,
  Droplets,
  Zap,
  Car,
  Flame,
  Wrench,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import type { WaterData, LiftStatus, FireEmergencyData, ParkingSlot, VisitorRequest, MaintenanceTicket } from '../../data/mockData';
import { getTranslation } from '../../utils/i18n';

interface HomeDashboardProps {
  waterData: WaterData;
  liftStatus: LiftStatus;
  fireData: FireEmergencyData;
  parkingSlots: ParkingSlot[];
  visitorRequests?: VisitorRequest[];
  maintenanceTickets?: MaintenanceTicket[];
  isBackendConnected?: boolean;
  onNavigateTab: (tab: any) => void;
  userRole?: string;
  currentLang?: string;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  waterData,
  liftStatus,
  fireData,
  parkingSlots,
  visitorRequests = [],
  maintenanceTickets = [],
  isBackendConnected = false,
  onNavigateTab,
  userRole,
  currentLang
}) => {
  const freeSlotsCount = parkingSlots.filter((s) => s.status === 'vacant').length;
  const sharedSlotsCount = parkingSlots.filter((s) => s.status === 'shared').length;
  const pendingVisitors = visitorRequests.filter((v) => v.status === 'pending');
  const activeTickets = maintenanceTickets.filter((t) => t.status !== 'Resolved');

  const hasCriticalEmergency = fireData.isActive || liftStatus.status === 'TRAPPED_EMERGENCY' || waterData.leakageDetected;
  const hasActionPending = pendingVisitors.length > 0 || activeTickets.length > 0;

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header Greeting & Health Status Banner */}
      <div className="glass-panel rounded-2xl p-5 sm:p-6 border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              {getTranslation(currentLang || 'en', 'appSubtitle')}
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Welcome, {userRole || 'Resident'} 👋
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              RAAH NAGAR AI Operating System Active (24/7) • Filtered for {userRole || 'Resident'} view.
            </p>
          </div>

          {/* Real Operational Status Header Badge */}
          <div className="flex items-center gap-3 bg-slate-900/90 border border-slate-700/60 rounded-xl p-3 shadow-lg">
            <div className="relative">
              {hasCriticalEmergency ? (
                <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 animate-bounce">
                  <AlertTriangle className="w-6 h-6" />
                </div>
              ) : hasActionPending ? (
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 animate-pulse">
                  <AlertTriangle className="w-6 h-6" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              )}
            </div>

            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Operational State</div>
              <div className="text-base font-extrabold text-white flex items-center gap-2">
                {hasCriticalEmergency ? (
                  <span className="text-red-400">CRITICAL ALERT</span>
                ) : hasActionPending ? (
                  <span className="text-amber-400">ATTENTION REQUIRED</span>
                ) : (
                  <span className="text-emerald-400">COMMUNITY STABLE</span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                {hasCriticalEmergency
                  ? 'Urgent emergency event active. Emergency services / team alerted.'
                  : hasActionPending
                  ? `${pendingVisitors.length} visitor(s) pending, ${activeTickets.length} open maintenance ticket(s).`
                  : (isBackendConnected ? 'All live subsystems functioning within normal parameters.' : 'Standing by for live telemetry stream from IoT Gateway.')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Priority Emergency Alerts Hub (High Contrast) */}
      {(fireData.isActive || liftStatus.status === 'TRAPPED_EMERGENCY' || waterData.leakageDetected) && (
        <div className="bg-gradient-to-r from-red-950/80 via-slate-900 to-amber-950/80 border-2 border-red-500/70 rounded-2xl p-5 shadow-2xl neon-border-red">
          <div className="flex items-center justify-between border-b border-red-500/30 pb-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-red-500/20 border border-red-500/50 flex items-center justify-center text-red-400 animate-bounce">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white tracking-wide">EMERGENCY ALERTS HUB</h3>
                <p className="text-xs text-red-300">Isolated high-priority incidents require immediate response</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-red-500 text-slate-950 text-xs font-black rounded-full uppercase tracking-wider animate-pulse">
              Active Priority 1
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Fire Incident */}
            {fireData.isActive && (
              <div
                onClick={() => onNavigateTab('fire')}
                className="bg-red-900/30 border border-red-500/40 rounded-xl p-3.5 hover:bg-red-900/50 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between text-xs font-bold text-red-400 mb-1">
                  <span className="flex items-center gap-1"><Flame className="w-4 h-4" /> FIRE ALERT</span>
                  <span>{fireData.confidenceScore ? `${fireData.confidenceScore}% CONFIDENCE` : 'VERIFIED'}</span>
                </div>
                <div className="text-sm font-bold text-white">{fireData.location}</div>
                <p className="text-xs text-slate-300 mt-1">Smoke Level: {fireData.smokeLevel}% • Evacuation routes active</p>
                <div className="mt-3 text-xs text-red-400 font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  View 3D Evacuation Plan <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            )}

            {/* Lift Incident */}
            {liftStatus.status === 'TRAPPED_EMERGENCY' && (
              <div
                onClick={() => onNavigateTab('lift')}
                className="bg-amber-900/30 border border-amber-500/40 rounded-xl p-3.5 hover:bg-amber-900/50 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between text-xs font-bold text-amber-400 mb-1">
                  <span className="flex items-center gap-1"><Wrench className="w-4 h-4" /> LIFT TRAPPED</span>
                  <span>{liftStatus.errorCode || 'FAULT'}</span>
                </div>
                <div className="text-sm font-bold text-white">{liftStatus.tower} - {liftStatus.liftId}</div>
                <p className="text-xs text-slate-300 mt-1">Location: {liftStatus.floors} • Technician ETA: {liftStatus.technicianEtaMinutes}m</p>
                <div className="mt-3 text-xs text-amber-400 font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Open Live Cabin Cam <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            )}

            {/* Water Leak Incident */}
            {waterData.leakageDetected && (
              <div
                onClick={() => onNavigateTab('water')}
                className="bg-cyan-900/30 border border-cyan-500/40 rounded-xl p-3.5 hover:bg-cyan-900/50 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between text-xs font-bold text-cyan-400 mb-1">
                  <span className="flex items-center gap-1"><Droplets className="w-4 h-4" /> LEAKAGE ANOMALY</span>
                  <span>{waterData.leakageConfidence ? `${waterData.leakageConfidence}% CONFIDENCE` : 'DETECTED'}</span>
                </div>
                <div className="text-sm font-bold text-white">{waterData.leakageLocation}</div>
                <p className="text-xs text-slate-300 mt-1">Valve Status: {waterData.valveClosed ? 'Closed (Isolated)' : 'Open'}</p>
                <div className="mt-3 text-xs text-cyan-400 font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Inspect Flow Telemetry <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. Utility Status Visualizer Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Smart Water Card */}
        <div
          onClick={() => onNavigateTab('water')}
          className="glass-panel glass-panel-hover rounded-2xl p-4 cursor-pointer relative overflow-hidden group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Droplets className="w-5 h-5" />
            </div>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
              waterData.mainTankLevel > 0 && waterData.mainTankLevel < 25
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
            }`}>
              {waterData.mainTankLevel === 0 ? 'Awaiting Telemetry' : waterData.mainTankLevel < 25 ? 'Low Level' : 'Optimal Level'}
            </span>
          </div>

          <div className="text-xs font-bold text-slate-400">WATER RESERVOIR CAPACITY</div>
          <div className="text-2xl font-extrabold text-white mt-1 flex items-baseline gap-2">
            {waterData.mainTankLevel > 0 ? `${waterData.mainTankLevel}%` : 'Standby'}
            <span className="text-xs font-normal text-slate-400">Total Tank Vol</span>
          </div>

          {/* Dynamic Progress Bar */}
          <div className="w-full bg-slate-800 rounded-full h-2 mt-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-amber-500 to-cyan-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, waterData.mainTankLevel))}%` }}
            />
          </div>

          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="text-slate-400">Pump State:</span>
            <span className="font-bold text-cyan-400">{waterData.mainPumpStatus || 'IDLE'}</span>
          </div>
        </div>

        {/* Dynamic Space-Time Parking Card */}
        <div
          onClick={() => onNavigateTab('parking')}
          className="glass-panel glass-panel-hover rounded-2xl p-4 cursor-pointer relative overflow-hidden group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Car className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {parkingSlots.length > 0 ? `${parkingSlots.length} Total Slots` : 'Parking Grid'}
            </span>
          </div>

          <div className="text-xs font-bold text-slate-400">AVAILABLE PARKING SLOTS</div>
          <div className="text-2xl font-extrabold text-white mt-1 flex items-baseline gap-2">
            {freeSlotsCount} Free
            <span className="text-xs font-normal text-emerald-400">({sharedSlotsCount} Shared Active)</span>
          </div>

          {/* Dynamic Progress Bar */}
          <div className="w-full bg-slate-800 rounded-full h-2 mt-3 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${parkingSlots.length > 0 ? Math.round((freeSlotsCount / parkingSlots.length) * 100) : 0}%` }}
            />
          </div>

          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="text-slate-400">Occupancy:</span>
            <span className="font-bold text-cyan-400">
              {parkingSlots.length > 0 ? `${parkingSlots.length - freeSlotsCount} Occupied` : 'Awaiting DB Sync'}
            </span>
          </div>
        </div>

        {/* Maintenance / Power Grid */}
        <div
          onClick={() => onNavigateTab('maintenance')}
          className="glass-panel glass-panel-hover rounded-2xl p-4 cursor-pointer relative overflow-hidden group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Zap className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Solar & Grid
            </span>
          </div>

          <div className="text-xs font-bold text-slate-400">FACILITY TICKETS & GRID</div>
          <div className="text-2xl font-extrabold text-white mt-1 flex items-baseline gap-2">
            {activeTickets.length} Active
            <span className="text-xs font-normal text-slate-400">Open Tickets</span>
          </div>

          <div className="w-full bg-slate-800 rounded-full h-2 mt-3 overflow-hidden">
            <div
              className="bg-indigo-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${activeTickets.length > 0 ? Math.min(100, activeTickets.length * 25) : 10}%` }}
            />
          </div>

          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="text-slate-400">Status:</span>
            <span className="font-bold text-slate-300">
              {activeTickets.length > 0 ? `${activeTickets[0].title.slice(0, 24)}...` : 'All Systems Operational'}
            </span>
          </div>
        </div>

        {/* Security & Gate Status */}
        <div
          onClick={() => onNavigateTab('security')}
          className="glass-panel glass-panel-hover rounded-2xl p-4 cursor-pointer relative overflow-hidden group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
              {pendingVisitors.length > 0 ? 'Pending Approvals' : 'Gate Active'}
            </span>
          </div>

          <div className="text-xs font-bold text-slate-400">GATE VISITOR ACCESS</div>
          <div className="text-2xl font-extrabold text-white mt-1 flex items-baseline gap-2">
            {pendingVisitors.length} Visitors
            <span className="text-xs font-normal text-amber-400">
              {pendingVisitors.length > 0 ? 'Action Required' : 'Cleared'}
            </span>
          </div>

          <div className="w-full bg-slate-800 rounded-full h-2 mt-3 overflow-hidden">
            <div
              className="bg-purple-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${pendingVisitors.length > 0 ? 85 : 15}%` }}
            />
          </div>

          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="text-slate-400">Latest Visitor:</span>
            <span className="font-bold text-cyan-400 truncate max-w-[140px]">
              {visitorRequests.length > 0 ? visitorRequests[0].name : 'No Recent Visitors'}
            </span>
          </div>
        </div>
      </div>

      {/* 4. AI Community Health Visualizer Graph & Actionable Recommendations Carousel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Continuous Telemetry Chart */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-5 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-cyan-400" />
                AI Community Health Telemetry Visualizer
              </h3>
              <p className="text-xs text-slate-400">
                Continuous load curves across electrical grid, water intake flow, and IoT sensor connectivity
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="flex items-center gap-1 text-cyan-400"><span className="w-2.5 h-2.5 rounded-full bg-cyan-400" /> Electrical</span>
              <span className="flex items-center gap-1 text-emerald-400"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> Solar</span>
              <span className="flex items-center gap-1 text-indigo-400"><span className="w-2.5 h-2.5 rounded-full bg-indigo-400" /> IoT Grid</span>
            </div>
          </div>

          {/* SVG Canvas Mock Telemetry Wave Graph */}
          <div className="relative h-48 w-full bg-slate-900/60 rounded-xl p-3 border border-slate-800/80 flex items-end justify-between gap-1 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/5 to-transparent pointer-events-none" />

            {/* Grid Lines */}
            <div className="absolute inset-0 flex flex-col justify-between p-3 pointer-events-none opacity-20">
              <div className="border-b border-slate-600 w-full" />
              <div className="border-b border-slate-600 w-full" />
              <div className="border-b border-slate-600 w-full" />
            </div>

            {/* Bars/Curves Simulation */}
            {[40, 55, 35, 70, 85, 60, 45, 90, 75, 50, 65, 80, 95, 70, 60, 40, 55, 75, 85, 90].map((val, idx) => (
              <div key={idx} className="flex-1 flex flex-col justify-end gap-1 h-full z-10 group">
                <div
                  style={{ height: `${val}%` }}
                  className="w-full bg-gradient-to-t from-cyan-600 to-cyan-400 rounded-t-sm opacity-80 group-hover:opacity-100 transition-all"
                />
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-800">
            <span>Peak Demand Window: 07:00 AM - 09:30 AM</span>
            <span className="text-cyan-400 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> 99.8% Anomaly Detection Confidence
            </span>
          </div>
        </div>

        {/* Right Col: Actionable AI Recommendations Carousel */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                Actionable AI Recommendations
              </h3>
              <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full font-semibold">
                3 Nudges
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Carousel-style practical nudges delivering energy savings and guest slot optimizations.
            </p>

            <div className="space-y-3">
              {/* Nudge 1 */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 hover:border-cyan-500/40 transition-all">
                <div className="flex items-center justify-between text-xs font-bold text-cyan-400 mb-1">
                  <span className="flex items-center gap-1"><Zap className="w-3.5 h-3.5" /> Tariff Optimization</span>
                  <span className="text-emerald-400">Save 12% Energy</span>
                </div>
                <p className="text-xs text-slate-200">
                  Shift heavy washing machine & dishwashing usage past 8:00 PM to leverage off-peak tariff.
                </p>
              </div>

              {/* Nudge 2 */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 hover:border-cyan-500/40 transition-all">
                <div className="flex items-center justify-between text-xs font-bold text-indigo-400 mb-1">
                  <span className="flex items-center gap-1"><Car className="w-3.5 h-3.5" /> Guest Parking Swap</span>
                  <span className="text-cyan-400">+50 P-Coins</span>
                </div>
                <p className="text-xs text-slate-200">
                  Your Slot #42 is predicted empty till 5 PM. Confirm auto-swap for visiting guest vehicle MH-04.
                </p>
              </div>

              {/* Nudge 3 */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 hover:border-cyan-500/40 transition-all">
                <div className="flex items-center justify-between text-xs font-bold text-amber-400 mb-1">
                  <span className="flex items-center gap-1"><Droplets className="w-3.5 h-3.5" /> Water Conservation</span>
                  <span className="text-amber-400">Block B Warning</span>
                </div>
                <p className="text-xs text-slate-200">
                  Municipal supply delay detected. Conserve non-essential water usage until 06:00 AM refill.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('architecture')}
            className="mt-4 w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 flex items-center justify-center gap-2 transition-all"
          >
            Explore AI Decision Architecture <ArrowRight className="w-4 h-4 text-cyan-400" />
          </button>
        </div>
      </div>
    </div>
  );
};
