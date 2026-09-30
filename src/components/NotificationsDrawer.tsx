import React, { useState } from 'react';
import { X, Bell } from 'lucide-react';

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({
  isOpen,
  onClose
}) => {
  const [filter, setFilter] = useState<'ALL' | 'CRITICAL' | 'INFORMATIONAL' | 'ROUTINE'>('ALL');
  const [notifList, setNotifList] = useState([
    {
      id: 'n-1',
      category: 'CRITICAL',
      title: 'FIRE EMERGENCY DETECTED',
      body: 'Tower A - Floor 3: Smoke level 96%. Evacuation route active.',
      time: 'Just now',
      activeInScenario: ['FIRE']
    },
    {
      id: 'n-2',
      category: 'CRITICAL',
      title: 'LIFT TRAPPED EMERGENCY',
      body: 'Tower A - Lift 2: Occupant trapped. Fault Code E-301. Technician ETA 3m.',
      time: '4 mins ago',
      activeInScenario: ['LIFT']
    },
    {
      id: 'n-3',
      category: 'CRITICAL',
      title: 'WATER MAIN LEAKAGE ANOMALY',
      body: 'Block B Main Line: 91% confidence surge. Main Valve V-102 closed.',
      time: '12 mins ago',
      activeInScenario: ['WATER']
    },
    {
      id: 'n-4',
      category: 'INFORMATIONAL',
      title: 'Water Shortage Forecast',
      body: 'Block B & C reservoir capacity at 34%. Predicted depletion in 2 hours.',
      time: '25 mins ago',
      activeInScenario: ['NORMAL', 'WATER', 'FIRE', 'LIFT']
    },
    {
      id: 'n-5',
      category: 'INFORMATIONAL',
      title: 'Parking Slot Auto-Swap Pass',
      body: 'Your Slot #42 matched for visiting guest. +50 P-Coins credited.',
      time: '1 hour ago',
      activeInScenario: ['NORMAL', 'WATER', 'FIRE', 'LIFT']
    },
    {
      id: 'n-6',
      category: 'ROUTINE',
      title: 'Streetlight Maintenance Ticket #1042',
      body: 'Current drop detected on Pole #3. Dispatched to electrical crew.',
      time: '2 hours ago',
      activeInScenario: ['NORMAL', 'WATER', 'FIRE', 'LIFT']
    }
  ]);

  if (!isOpen) return null;

  const handleClearAll = () => {
    setNotifList([]);
  };

  const filtered = notifList.filter((item) => {
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
              <h3 className="text-base font-bold text-white">Community Brain Alerts</h3>
            </div>
            <div className="flex items-center gap-2">
              {notifList.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-semibold cursor-pointer transition-all"
                  title="Clear all notifications"
                >
                  Clear All
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1 rounded-lg bg-slate-900 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* 3 Categories Filter */}
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
                ✨ No notifications. Activity center is clean!
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
          Rule: AI reduces 95% of routine notification clutter.
        </div>
      </div>
    </div>
  );
};
