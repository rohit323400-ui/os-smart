import React, { useState } from 'react';
import {
  Car,
  Coins,
  Clock,
  Sliders,
  ArrowRightLeft,
  RefreshCw
} from 'lucide-react';
import type { ParkingSlot } from '../../data/mockData';

interface SmartParkingProps {
  parkingSlots: ParkingSlot[];
  onToggleSlotSharing: (slotId: string) => void;
}

export const SmartParking: React.FC<SmartParkingProps> = ({
  parkingSlots,
  onToggleSlotSharing
}) => {
  const [timeWindow, setTimeWindow] = useState<string>('9:00 AM - 5:00 PM');
  const [pCoins, setPCoins] = useState<number>(450);
  const [isReturningEarly, setIsReturningEarly] = useState<boolean>(false);
  const [swapAlertActive, setSwapAlertActive] = useState<boolean>(true);

  const vacantCount = parkingSlots.filter((s) => s.status === 'vacant').length;
  const sharedCount = parkingSlots.filter((s) => s.status === 'shared').length;
  const guestCount = parkingSlots.filter((s) => s.status === 'guest').length;
  const occupiedCount = parkingSlots.filter((s) => s.status === 'occupied').length;

  const handleReturnEarly = () => {
    setIsReturningEarly(true);
    setTimeout(() => {
      alert('AI Protocol Activated: Guest vehicle in Slot #42 has been automatically rerouted to Slot #18 via ANPR notification!');
    }, 300);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Banner */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold mb-2">
              <Car className="w-3.5 h-3.5" />
              SMART DYNAMIC PARKING: SPACE + TIME ENGINE
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              COMMUNITY AI is optimizing parking utilization 24/7
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Treats parking as a dynamic, time-slot asset. Maximizes parking demand without constructing new concrete space.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-slate-900 border border-slate-700/80 rounded-xl p-3 text-right">
              <div className="text-xs text-slate-400 font-bold uppercase">Effective Capacity</div>
              <div className="text-lg font-extrabold text-emerald-400">+45% Utilization</div>
              <p className="text-[11px] text-slate-400">Zero new concrete built</p>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Swap In-Progress Alert Banner */}
      {swapAlertActive && (
        <div className="bg-slate-900/90 border border-cyan-500/50 rounded-2xl p-4 shadow-lg flex items-center justify-between gap-4 neon-border-cyan">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 animate-spin">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black px-2 py-0.5 rounded bg-cyan-500 text-slate-950 uppercase">
                  ANPR Swap Active
                </span>
                <span className="text-xs text-slate-400">10s ago</span>
              </div>
              <h4 className="text-sm font-bold text-white mt-0.5">
                DYNAMIC SWAP IN PROGRESS: Resident returned unexpectedly to Slot #14 → Guest redirected to Slot #18
              </h4>
            </div>
          </div>
          <button
            onClick={() => setSwapAlertActive(false)}
            className="text-xs text-slate-400 hover:text-white px-2 py-1 bg-slate-800 rounded-lg"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Resident Slot #42 Control Card & Parking Economy */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Slot #42 Management */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-5 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
              <div>
                <span className="text-xs font-bold text-cyan-400 uppercase">My Assigned Slot</span>
                <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
                  YOUR SLOT #42
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Vehicle: MH-02-CP-1234
                  </span>
                </h3>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400">Sharing Rule Active</span>
                <div className="text-sm font-bold text-cyan-400">Weekdays 9:00 AM - 5:00 PM</div>
              </div>
            </div>

            {/* Time Window Adjuster */}
            <div className="bg-slate-900/90 rounded-xl p-4 border border-slate-800 mb-4">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-2">
                <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-cyan-400" /> Active Sharing Time Boundary:</span>
                <span className="text-cyan-400 font-mono text-sm">{timeWindow}</span>
              </div>

              <input
                type="range"
                min="1"
                max="3"
                defaultValue="2"
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '1') setTimeWindow('8:00 AM - 4:00 PM');
                  if (val === '2') setTimeWindow('9:00 AM - 5:00 PM');
                  if (val === '3') setTimeWindow('10:00 AM - 6:00 PM');
                }}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>Early Shift (8am-4pm)</span>
                <span>Standard Shift (9am-5pm)</span>
                <span>Late Shift (10am-6pm)</span>
              </div>
            </div>

            <p className="text-xs text-slate-300">
              When you leave for work in the morning, the AI lists your unused bay for guest parking. If you leave late or return early, 1-tap options activate safe emergency swap protocols.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="mt-4 flex flex-wrap gap-3 pt-3 border-t border-slate-800">
            <button
              onClick={handleReturnEarly}
              className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                isReturningEarly
                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                  : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30'
              }`}
            >
              <RefreshCw className="w-4 h-4" />
              {isReturningEarly ? 'Early Return Triggered (Swap Rerouted)' : "I'm Returning Early: Trigger Swap"}
            </button>
            <button
              onClick={() => alert('Sharing schedule extended by +2 hours. Guest reservation updated.')}
              className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700"
            >
              I'm Leaving Late: Extend Sharing
            </button>
          </div>
        </div>

        {/* My Parking Economy Card */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Coins className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Maintenance Credits
              </span>
            </div>

            <div className="text-xs font-bold text-slate-400">MY PARKING ECONOMY</div>
            <div className="text-3xl font-black text-white mt-1 flex items-baseline gap-2">
              {pCoins} <span className="text-sm font-semibold text-amber-400">P-Coins</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Earned by sharing idle parking spaces. Redeemable for society maintenance fee discounts or guest priority passes.
            </p>

            <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-800 mt-4 space-y-2 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>This Month Shared:</span>
                <span className="font-bold text-emerald-400">42 Hours</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Maintenance Credit:</span>
                <span className="font-bold text-cyan-400">₹450 Off Next Bill</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              setPCoins((prev) => prev + 50);
              alert('Redeemed +50 P-Coins into your monthly maintenance wallet!');
            }}
            className="mt-4 w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-extrabold text-xs shadow-lg shadow-amber-500/20 transition-all hover:brightness-110"
          >
            Redeem P-Coins for Maintenance Waiver
          </button>
        </div>
      </div>

      {/* Interactive Space + Time Map Grid Visualizer */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Sliders className="w-5 h-5 text-cyan-400" />
              Live Space + Time Parking Slot Grid
            </h3>
            <p className="text-xs text-slate-300">
              Vibrant Color Mapping: 🟢 Green = Vacant (Khali) • 🩵 Light Blue = Shared (P-Coins) • 🔷 Blue = Guest Reserved • 🩶 Grey = Resident Occupied
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
            <span className="flex items-center gap-1 px-2 py-1 rounded bg-emerald-500/20 border border-emerald-500/50 text-emerald-300">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" /> 🟢 Vacant ({vacantCount})
            </span>
            <span className="flex items-center gap-1 px-2 py-1 rounded bg-cyan-500/20 border border-cyan-400 text-cyan-300">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" /> 🩵 Shared ({sharedCount})
            </span>
            <span className="flex items-center gap-1 px-2 py-1 rounded bg-blue-600/30 border border-blue-500 text-blue-200">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> 🔷 Guest ({guestCount})
            </span>
            <span className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 border border-slate-600 text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400" /> 🩶 Occupied ({occupiedCount})
            </span>
          </div>
        </div>

        {/* Slot Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {parkingSlots.map((slot) => {
            let colorClasses = 'bg-slate-800/90 border-2 border-slate-600 text-slate-200';
            let badgeText = 'OCCUPIED';
            let badgeBg = 'bg-slate-700 text-slate-300';

            if (slot.status === 'vacant') {
              colorClasses = 'bg-emerald-950/60 border-2 border-emerald-500 text-emerald-200 hover:bg-emerald-900/80 shadow-md shadow-emerald-500/10';
              badgeText = '🟢 VACANT (KHALI)';
              badgeBg = 'bg-emerald-500 text-slate-950 font-black';
            } else if (slot.status === 'shared') {
              colorClasses = 'bg-cyan-950/60 border-2 border-cyan-400 text-cyan-200 hover:bg-cyan-900/80 shadow-md shadow-cyan-500/10';
              badgeText = '🩵 LIGHT BLUE SHARED';
              badgeBg = 'bg-cyan-400 text-slate-950 font-black';
            } else if (slot.status === 'guest') {
              colorClasses = 'bg-blue-950/60 border-2 border-blue-500 text-blue-200 hover:bg-blue-900/80 shadow-md shadow-blue-500/10';
              badgeText = '🔷 BLUE GUEST';
              badgeBg = 'bg-blue-500 text-white font-black';
            } else if (slot.status === 'disputed') {
              colorClasses = 'bg-amber-950/60 border-2 border-amber-500 text-amber-200 animate-pulse';
              badgeText = '⚠️ DISPUTED';
              badgeBg = 'bg-amber-500 text-slate-950 font-black';
            }

            return (
              <div
                key={slot.id}
                className={`p-3.5 rounded-xl border transition-all relative flex flex-col justify-between h-32 ${colorClasses}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-base font-black tracking-wide">{slot.slotNumber}</span>
                  <span className={`text-[9px] uppercase px-1.5 py-0.5 rounded shadow ${badgeBg}`}>
                    {badgeText}
                  </span>
                </div>

                <div className="mt-1">
                  <div className="text-xs font-bold truncate">{slot.owner}</div>
                  {slot.timeWindow && (
                    <div className="text-[10px] text-cyan-300 font-mono font-semibold">{slot.timeWindow}</div>
                  )}
                  {slot.vehicleNo && (
                    <div className="text-[10px] opacity-90 font-mono">{slot.vehicleNo}</div>
                  )}
                </div>

                {slot.status === 'shared' && (
                  <button
                    onClick={() => onToggleSlotSharing(slot.id)}
                    className="mt-1 w-full text-[10px] font-bold py-1 rounded bg-cyan-400 text-slate-950 hover:bg-cyan-300 transition-all cursor-pointer shadow"
                  >
                    Manage Slot
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
