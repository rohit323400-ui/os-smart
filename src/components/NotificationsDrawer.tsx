import React, { useState } from 'react';
import { X, Bell } from 'lucide-react';
import type {
  FireEmergencyData,
  LiftStatus,
  WaterData,
  VisitorRequest,
  MaintenanceTicket,
  NoiseData,
  ActionLogItem
} from '../data/mockData';

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  fireData: FireEmergencyData;
  liftStatus: LiftStatus;
  waterData: WaterData;
  visitorRequests: VisitorRequest[];
  maintenanceTickets: MaintenanceTicket[];
  noiseData: NoiseData;
  actionLogs: ActionLogItem[];
}

interface RealNotificationItem {
  id: string;
  category: 'CRITICAL' | 'INFORMATIONAL' | 'ROUTINE';
  title: string;
  body: string;
  time: string;
}

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({
  isOpen,
  onClose,
  fireData,
  liftStatus,
  waterData,
  visitorRequests,
  maintenanceTickets,
  noiseData,
  actionLogs
}) => {
  const [filter, setFilter] = useState<'ALL' | 'CRITICAL' | 'INFORMATIONAL' | 'ROUTINE'>('ALL');

  if (!isOpen) return null;

  // Build live notification list from real MySQL and IoT telemetry state
  const liveNotifs: RealNotificationItem[] = [];

  // 1. Critical Subsystem Alarms
  if (fireData.isActive) {
    liveNotifs.push({
      id: 'alert-fire',
      category: 'CRITICAL',
      title: 'FIRE EMERGENCY ALARM ACTIVE',
      body: `Affected Zone: ${fireData.affectedZone || 'All Sectors'}. Evacuation route is active.`,
      time: 'LIVE'
    });
  }

  if (liftStatus.status === 'TRAPPED_EMERGENCY') {
    liveNotifs.push({
      id: 'alert-lift',
      category: 'CRITICAL',
      title: 'LIFT SOS TRAPPED OCCUPANT',
      body: `${liftStatus.liftName}: SOS button pressed. Intercom and emergency crew alerted.`,
      time: 'LIVE'
    });
  }

  if (waterData.leakageDetected) {
    liveNotifs.push({
      id: 'alert-water',
      category: 'CRITICAL',
      title: 'WATER PIPELINE LEAK ANOMALY',
      body: `Abnormal surge flow rate detected (${waterData.flowRateLPM} LPM). Isolation command queued.`,
      time: 'LIVE'
    });
  }

  // 2. Informational Notifications (Visitors & Noise)
  visitorRequests
    .filter((v) => v.status === 'PENDING' || v.status === 'pending')
    .forEach((v) => {
      liveNotifs.push({
        id: `visitor-${v.id}`,
        category: 'INFORMATIONAL',
        title: `Visitor Gate Entry: ${v.visitorName}`,
        body: `Visiting Flat ${v.unitNumber} (${v.category || 'Guest'}). Awaiting entry verification.`,
        time: v.entryTime || 'Pending'
      });
    });

  if (noiseData.currentViolationStage > 0) {
    liveNotifs.push({
      id: 'alert-noise',
      category: 'INFORMATIONAL',
      title: `Acoustic Decibel Warning (Stage ${noiseData.currentViolationStage}/3)`,
      body: `Sound levels reached ${noiseData.currentDecibels} dB in unit ${noiseData.targetUnit || 'Monitored Unit'}.`,
      time: 'Active'
    });
  }

  // 3. Routine Notifications (Maintenance & Logs)
  maintenanceTickets
    .filter((t) => t.status === 'OPEN')
    .slice(0, 5)
    .forEach((t) => {
      liveNotifs.push({
        id: `ticket-${t.id}`,
        category: 'ROUTINE',
        title: `Open Ticket: ${t.title}`,
        body: `Unit ${t.unit} • Priority: ${t.priority} • Assigned: ${t.technician || 'Unassigned'}`,
        time: t.date || 'Today'
      });
    });

  actionLogs.slice(0, 4).forEach((log) => {
    liveNotifs.push({
      id: `log-${log.id}`,
      category: 'ROUTINE',
      title: log.action,
      body: log.impact || log.deviceAffected || 'Logged in security audit trail.',
      time: log.timestamp || 'Recent'
    });
  });

  const filtered = liveNotifs.filter((item) => {
    if (filter === 'ALL') return true;
    return item.category === filter;
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-md h-full bg-[#0b0f19] border-l border-slate-800 p-5 flex flex-col justify-between shadow-2xl">
        <div>
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-cyan-400" />
              <h3 className="text-base font-bold text-white">Live Activity Alerts</h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                {liveNotifs.length}
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg bg-slate-900 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Categories Filter */}
          <div className="flex gap-1.5 p-1 bg-slate-900 rounded-xl border border-slate-800 mb-4 text-xs font-semibold">
            {(['ALL', 'CRITICAL', 'INFORMATIONAL', 'ROUTINE'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`flex-1 py-1.5 rounded-lg transition-all text-[11px] cursor-pointer ${
                  filter === cat
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-200px)] pr-1">
            {filtered.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                ✨ No active alerts in this category. All community subsystems secure.
              </div>
            ) : (
              filtered.map((n) => (
                <div
                  key={n.id}
                  className={`p-3.5 rounded-xl border text-xs space-y-1 ${
                    n.category === 'CRITICAL'
                      ? 'bg-red-950/40 border-red-500/50 text-slate-200'
                      : n.category === 'INFORMATIONAL'
                      ? 'bg-cyan-950/40 border-cyan-500/40 text-slate-200'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold">
                    <span className={n.category === 'CRITICAL' ? 'text-red-400' : 'text-cyan-400'}>
                      [{n.category}] {n.title}
                    </span>
                    <span className="text-[10px] text-slate-400">{n.time}</span>
                  </div>
                  <p className="text-slate-300 text-[11px]">{n.body}</p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800 text-center text-xs text-slate-500">
          Source of Truth: MySQL Database & Live IoT Telemetry Streams
        </div>
      </div>
    </div>
  );
};
