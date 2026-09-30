import React, { useState, useEffect } from 'react';
import {
  ArrowUpDown,
  Video,
  Radio
} from 'lucide-react';
import type { LiftStatus } from '../../data/mockData';

interface LiftEmergencyProps {
  liftStatus: LiftStatus;
}

export const LiftEmergency: React.FC<LiftEmergencyProps> = ({ liftStatus }) => {
  const [timerSeconds, setTimerSeconds] = useState<number>(liftStatus.trappedDurationSeconds);
  const [showLiveCam, setShowLiveCam] = useState<boolean>(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimerSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')} Min`;
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-amber-950 border-2 border-amber-500 rounded-2xl p-6 shadow-2xl neon-border-amber relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border-2 border-amber-500 flex items-center justify-center text-amber-400 animate-pulse shadow-lg shadow-amber-500/30">
              <ArrowUpDown className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider animate-pulse">
                  CRITICAL LIFT EMERGENCY DETECTED
                </span>
                <span className="text-xs font-bold text-amber-300">CODE: {liftStatus.errorCode}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
                {liftStatus.tower} - {liftStatus.liftId}
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Stuck at Mid-Level (Floors 3-4) • In-Cabin Passenger Trapped • Technicians Dispatched
              </p>
            </div>
          </div>

          {/* Live Duration Timer Badge */}
          <div className="bg-slate-950/80 border border-amber-500/60 rounded-xl p-3 text-right">
            <div className="text-xs text-slate-400 font-bold uppercase">Trapped Duration</div>
            <div className="text-2xl font-mono font-black text-amber-400">{formatTimer(timerSeconds)}</div>
            <div className="text-[10px] text-cyan-400 font-bold">Technician ETA: {liftStatus.technicianEtaMinutes} Mins</div>
          </div>
        </div>
      </div>

      {/* 3D Shaft Telemetry Diagram & Dispatch Deck */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 3D Shaft Visualizer */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-5 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ArrowUpDown className="w-5 h-5 text-amber-400" />
                3D Shaft Telemetry & Vertical Position
              </h3>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Lift Car Stationary
              </span>
            </div>

            {/* Shaft Simulation Diagram */}
            <div className="relative h-64 bg-slate-950 rounded-xl p-4 border border-slate-800 flex justify-between gap-6 overflow-hidden">
              {/* Vertical Shaft Columns */}
              <div className="w-1/3 border-r border-slate-800 pr-4 flex flex-col justify-between text-xs text-slate-400 font-mono">
                <div>Floor 10 - Penthouse</div>
                <div>Floor 07 - Mid High</div>
                <div className="text-amber-400 font-bold bg-amber-500/10 px-2 py-1 rounded border border-amber-500/30">
                  Floors 3-4 (TRAPPED CAR)
                </div>
                <div>Floor 01 - Ground Lobby</div>
              </div>

              {/* Cabin & Weight Grid Diagnostics */}
              <div className="flex-1 bg-slate-900/80 rounded-xl p-3 border border-slate-800 flex flex-col justify-between text-xs">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Cabin Status:</span>
                  <span className="font-bold text-red-400">Stationary (Alarm Pulled)</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Door Interlock:</span>
                  <span className="font-bold text-amber-400">Faulty / Blocked</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">System Diagnostic:</span>
                  <span className="font-mono text-cyan-400">{liftStatus.errorCode}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">In-Cabin Occupancy Grid:</span>
                  <span className="font-bold text-emerald-400">1 Person Detected</span>
                </div>
              </div>
            </div>
          </div>

          {/* Voice Reassurance Indicator */}
          <div className="mt-4 p-3 bg-cyan-950/40 border border-cyan-500/30 rounded-xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-cyan-300 font-semibold">
              <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span>Automated Cabin Voice Reassurance Broadcast Active:</span>
            </div>
            <span className="text-slate-300">"Assistance dispatched. Tech arriving in 3 mins"</span>
          </div>
        </div>

        {/* Dispatch Receipts Deck & Live Cam Button */}
        <div className="space-y-4">
          {/* Dispatch Deck */}
          <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase">AUTOMATIC NOTIFICATIONS & DISPATCH DECK</h4>

            <div className="space-y-2 text-xs">
              <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white">Security Console</div>
                  <div className="text-[10px] text-slate-400">Dispatch Confirmed</div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">Alerted</span>
              </div>

              <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white">Elevator Tech Crew</div>
                  <div className="text-[10px] text-slate-400">Technician ETA 3 mins</div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400">Dispatched</span>
              </div>

              <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white">Family Contact</div>
                  <div className="text-[10px] text-slate-400">Context Verified</div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-400">Notified</span>
              </div>
            </div>

            <button
              onClick={() => setShowLiveCam(true)}
              className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
            >
              <Video className="w-4 h-4" /> VIEW LIVE IN-CABIN CAM
            </button>
          </div>
        </div>
      </div>

      {/* Live Cam Modal */}
      {showLiveCam && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel rounded-2xl max-w-md w-full p-6 border border-slate-700 text-center space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Video className="w-4 h-4 text-cyan-400" />
                Live Feed: Tower A - Lift 2 Cabin
              </h3>
              <span className="text-[10px] bg-red-500 text-slate-950 font-bold px-2 py-0.5 rounded animate-pulse">
                LIVE CAM
              </span>
            </div>

            <div className="relative h-48 bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center">
              <img
                src="https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?auto=format&fit=crop&w=400&q=80"
                alt="Lift Cabin Cam"
                className="w-full h-full object-cover opacity-60"
              />
              <div className="absolute bottom-2 left-2 text-[10px] bg-slate-950/80 px-2 py-0.5 rounded text-emerald-400 font-mono">
                Occupant Condition: Calm • Seated on Floor • Intercom Active
              </div>
            </div>

            <button
              onClick={() => setShowLiveCam(false)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
            >
              Close Live Cam
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
