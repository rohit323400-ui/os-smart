import React, { useState, useMemo } from 'react';
import { Bell, Flame, Droplets, ArrowUpDown, ShieldCheck, Trash2, Volume2, Info, CheckCircle2, AlertTriangle, Layers, Filter } from 'lucide-react';
import { getTranslation } from '../../utils/i18n';
import type {
  LayerNotification,
  FireEmergencyData,
  LiftStatus,
  WaterData,
  VisitorRequest,
  MaintenanceTicket,
  NoiseData
} from '../../data/mockData';
import { type ModuleTab } from '../ModuleNavigation';

interface NotificationCenterProps {
  currentLang?: string;
  onNavigateTab?: (tab: ModuleTab) => void;
  fireData?: FireEmergencyData;
  liftStatus?: LiftStatus;
  waterData?: WaterData;
  visitorRequests?: VisitorRequest[];
  maintenanceTickets?: MaintenanceTicket[];
  noiseData?: NoiseData;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  currentLang = 'en',
  onNavigateTab,
  fireData,
  liftStatus,
  waterData,
  visitorRequests = [],
  maintenanceTickets = [],
  noiseData
}) => {
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [activeLayerFilter, setActiveLayerFilter] = useState<'ALL' | 'CRITICAL' | 'INFO' | 'ROUTINE'>('ALL');

  // Derive notifications 100% from real verified database and device state
  const notifications: LayerNotification[] = useMemo(() => {
    const list: LayerNotification[] = [];

    if (fireData?.isActive) {
      list.push({
        id: 'notif-fire-live',
        layer: 'CRITICAL',
        title: 'FIRE EMERGENCY ACTIVE',
        message: `Emergency sensor alarm triggered in ${fireData.affectedZone || 'Tower Sector'}. Evacuation route is operational.`,
        timestamp: 'LIVE',
        read: readIds.has('notif-fire-live'),
        actionRequired: true,
        actionTab: 'fire',
        soundPlayed: true
      });
    }

    if (liftStatus?.status === 'TRAPPED_EMERGENCY') {
      list.push({
        id: 'notif-lift-live',
        layer: 'CRITICAL',
        title: 'ELEVATOR SOS TRAPPED OCCUPANT',
        message: `${liftStatus.liftName} SOS button engaged. ARD and maintenance crew notified.`,
        timestamp: 'LIVE',
        read: readIds.has('notif-lift-live'),
        actionRequired: true,
        actionTab: 'lift',
        soundPlayed: true
      });
    }

    if (waterData?.leakageDetected) {
      list.push({
        id: 'notif-water-live',
        layer: 'CRITICAL',
        title: 'CRITICAL WATER PIPE SURGE',
        message: `Abnormal flow rate of ${waterData.flowRateLPM} LPM detected. Motorized valve V-102 isolation queued.`,
        timestamp: 'LIVE',
        read: readIds.has('notif-water-live'),
        actionRequired: true,
        actionTab: 'water',
        soundPlayed: true
      });
    }

    visitorRequests
      .filter((v) => v.status === 'PENDING' || v.status === 'pending')
      .forEach((v) => {
        const id = `notif-vis-${v.id}`;
        list.push({
          id,
          layer: 'INFO',
          title: `Gate Verification: ${v.visitorName}`,
          message: `Visitor arriving for unit ${v.unitNumber}. Awaiting guard or resident confirmation.`,
          timestamp: v.entryTime || 'Pending',
          read: readIds.has(id),
          actionRequired: true,
          actionTab: 'visitors'
        });
      });

    if (noiseData && noiseData.currentViolationStage > 0) {
      const id = 'notif-noise-live';
      list.push({
        id,
        layer: 'INFO',
        title: `Acoustic Threshold Exceeded (${noiseData.currentDecibels} dB)`,
        message: `Acoustic monitor detected persistent sound levels in unit ${noiseData.targetUnit || 'Monitored Flat'}.`,
        timestamp: 'Active',
        read: readIds.has(id),
        actionRequired: false,
        actionTab: 'noise'
      });
    }

    maintenanceTickets
      .filter((t) => t.status === 'OPEN')
      .slice(0, 5)
      .forEach((t) => {
        const id = `notif-tick-${t.id}`;
        list.push({
          id,
          layer: 'ROUTINE',
          title: `Ticket Logged: ${t.title}`,
          message: `Unit ${t.unit} • Priority: ${t.priority} • Tech: ${t.technician || 'Unassigned'}`,
          timestamp: t.date || 'Today',
          read: readIds.has(id),
          actionRequired: false,
          actionTab: 'maintenance'
        });
      });

    return list;
  }, [fireData, liftStatus, waterData, visitorRequests, maintenanceTickets, noiseData, readIds]);

  const handleMarkAllRead = () => {
    setReadIds(new Set(notifications.map((n) => n.id)));
  };

  const handleToggleRead = (id: string) => {
    setReadIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const filteredNotifs = notifications.filter((n) => {
    if (activeLayerFilter === 'ALL') return true;
    return n.layer === activeLayerFilter;
  });

  const criticalCount = notifications.filter((n) => n.layer === 'CRITICAL' && !n.read).length;
  const infoCount = notifications.filter((n) => n.layer === 'INFO' && !n.read).length;
  const routineCount = notifications.filter((n) => n.layer === 'ROUTINE' && !n.read).length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-2xl bg-gradient-to-r from-red-950/40 via-slate-900 to-indigo-900/40 border border-red-500/30">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-red-500/20 text-red-400 border border-red-500/40">
              <Bell className="w-8 h-8 shrink-0 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {getTranslation(currentLang, 'notifCenterTitle') || '18. 3-Layer Notification Command Center'}
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 font-semibold border border-red-500/30">
                  Feature 18 • Priority Tiering
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                {getTranslation(currentLang, 'notifCenterSubtitle') || 'Categorized alerts: Layer 1 (Critical Emergency), Layer 2 (Action Required), Layer 3 (Routine Updates).'}
              </p>
            </div>
          </div>

          <button
            onClick={handleMarkAllRead}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 flex items-center gap-2 transition-all shrink-0"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            Mark All as Read
          </button>
        </div>
      </div>

      {/* Layer Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Layer 1: Critical */}
        <button
          onClick={() => setActiveLayerFilter('CRITICAL')}
          className={`p-5 rounded-2xl border text-left transition-all ${
            activeLayerFilter === 'CRITICAL'
              ? 'bg-red-500/20 border-red-500 shadow-lg shadow-red-500/20 scale-[1.02]'
              : 'glass-panel border-slate-200 dark:border-slate-800 hover:border-red-500/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
              <Flame className="w-4 h-4 shrink-0" /> Layer 1 • Critical
            </span>
            <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-red-500 text-white">
              {criticalCount} Unread
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2">Immediate life-safety & structural emergency sirens (Fire, Lift, Water Burst).</p>
        </button>

        {/* Layer 2: Info */}
        <button
          onClick={() => setActiveLayerFilter('INFO')}
          className={`p-5 rounded-2xl border text-left transition-all ${
            activeLayerFilter === 'INFO'
              ? 'bg-amber-500/20 border-amber-500 shadow-lg shadow-amber-500/20 scale-[1.02]'
              : 'glass-panel border-slate-200 dark:border-slate-800 hover:border-amber-500/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 shrink-0" /> Layer 2 • Action Required
            </span>
            <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-amber-500 text-slate-950">
              {infoCount} Unread
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2">Gate approvals, waste overflow alerts & decibel warnings requiring resident decision.</p>
        </button>

        {/* Layer 3: Routine */}
        <button
          onClick={() => setActiveLayerFilter('ROUTINE')}
          className={`p-5 rounded-2xl border text-left transition-all ${
            activeLayerFilter === 'ROUTINE'
              ? 'bg-emerald-500/20 border-emerald-500 shadow-lg shadow-emerald-500/20 scale-[1.02]'
              : 'glass-panel border-slate-200 dark:border-slate-800 hover:border-emerald-500/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 shrink-0" /> Layer 3 • Routine Log
            </span>
            <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-emerald-500 text-slate-950">
              {routineCount} Unread
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2">P-Coins credits, tool returns, automated streetlight energy updates & system logs.</p>
        </button>
      </div>

      {/* Notifications List */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
            <Layers className="w-4 h-4 text-cyan-400" />
            Showing: {activeLayerFilter} Notifications ({filteredNotifs.length})
          </div>

          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
            <button
              onClick={() => setActiveLayerFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                activeLayerFilter === 'ALL' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400'
              }`}
            >
              All Layers
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {filteredNotifs.map((item) => (
            <div
              key={item.id}
              className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                !item.read
                  ? item.layer === 'CRITICAL'
                    ? 'bg-red-500/10 border-red-500/40 shadow-sm'
                    : item.layer === 'INFO'
                    ? 'bg-amber-500/10 border-amber-500/40 shadow-sm'
                    : 'bg-emerald-500/10 border-emerald-500/40 shadow-sm'
                  : 'bg-slate-900/40 border-slate-800 opacity-80'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div
                  className={`p-2.5 rounded-xl text-white shrink-0 ${
                    item.layer === 'CRITICAL'
                      ? 'bg-red-500 text-white'
                      : item.layer === 'INFO'
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-emerald-500 text-slate-950'
                  }`}
                >
                  {item.category === 'Fire' && <Flame className="w-5 h-5" />}
                  {item.category === 'Water' && <Droplets className="w-5 h-5" />}
                  {item.category === 'Lift' && <ArrowUpDown className="w-5 h-5" />}
                  {item.category === 'Visitor' && <ShieldCheck className="w-5 h-5" />}
                  {item.category === 'Waste' && <Trash2 className="w-5 h-5" />}
                  {item.category === 'Noise' && <Volume2 className="w-5 h-5" />}
                  {item.category === 'System' && <Info className="w-5 h-5" />}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">{item.title}</h4>
                    <span
                      className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        item.layer === 'CRITICAL'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : item.layer === 'INFO'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      Layer {item.layer === 'CRITICAL' ? '1 (Critical)' : item.layer === 'INFO' ? '2 (Info)' : '3 (Routine)'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 mt-1">{item.message}</p>
                  <span className="text-[10px] text-slate-400 block mt-1">{item.timestamp}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                {item.actionButtonLabel && item.actionTabTarget && onNavigateTab && (
                  <button
                    onClick={() => onNavigateTab(item.actionTabTarget as any)}
                    className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold shadow-sm shrink-0 transition-all"
                  >
                    {item.actionButtonLabel}
                  </button>
                )}

                <button
                  onClick={() => handleToggleRead(item.id)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 shrink-0"
                >
                  {item.read ? 'Mark Unread' : 'Mark Read'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
