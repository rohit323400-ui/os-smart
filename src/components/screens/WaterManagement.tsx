import React, { useState } from 'react';
import {
  Droplets,
  AlertTriangle,
  Activity,
  Clock,
  CheckSquare,
  LifeBuoy
} from 'lucide-react';
import type { WaterData } from '../../data/mockData';
import { getTranslation } from '../../utils/i18n';

interface WaterManagementProps {
  waterData: WaterData;
  onToggleValve: () => void;
  onConfirmVerification: () => void;
  currentLang?: string;
  defaultSubTab?: 'monitoring' | 'leakage';
}

export const WaterManagement: React.FC<WaterManagementProps> = ({
  waterData,
  onToggleValve,
  onConfirmVerification,
  currentLang = 'en',
  defaultSubTab = 'monitoring'
}) => {
  const [isAdminVerified, setIsAdminVerified] = useState<boolean>(false);
  const [activeSubTab, setActiveSubTab] = useState<'monitoring' | 'leakage'>(defaultSubTab);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-200 dark:border-slate-800 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-700 dark:text-cyan-400 text-xs font-semibold mb-2">
              <Droplets className="w-3.5 h-3.5 shrink-0" />
              Features 04 & 05 • Smart Water Engine
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {getTranslation(currentLang, 'water') || '04 & 05. Water Monitoring & Valve V-102 Auto Cut-Off'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
              Continuous ultrasonic depth sensing, predictive shortage forecasting, automated pump diagnostics, and autonomous leak isolation valves.
            </p>
          </div>

          {/* Sub-tab Switcher for 04-monitoring vs 05-leakage */}
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shrink-0">
            <button
              onClick={() => setActiveSubTab('monitoring')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'monitoring'
                  ? 'bg-cyan-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Droplets className="w-3.5 h-3.5 shrink-0" />
              04. Monitoring & Tank Level
            </button>
            <button
              onClick={() => setActiveSubTab('leakage')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'leakage'
                  ? 'bg-cyan-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LifeBuoy className="w-3.5 h-3.5 shrink-0" />
              05. Valve V-102 Shut-off
            </button>
          </div>
        </div>
      </div>

      {/* Feature 04: Tank Level Monitoring & Shortage Prediction */}
      {(activeSubTab === 'monitoring' || activeSubTab === 'leakage') && (
        <div className="space-y-6">
          {/* Predictive Shortage Alert Header */}
          <div className="bg-gradient-to-r from-amber-950/80 via-slate-900 to-cyan-950/80 border-2 border-amber-500/70 rounded-2xl p-4 shadow-xl neon-border-amber">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 animate-pulse shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded bg-amber-500 text-slate-950 uppercase">
                    Feature 04 • Shortage AI Prediction
                  </span>
                  <h3 className="text-sm sm:text-base font-extrabold text-white mt-0.5">
                    Water Shortage Risk: {waterData.predictedShortageBlock} depletion in {waterData.predictedShortageHours} Hours
                  </h3>
                  <p className="text-xs text-slate-300">
                    Municipal intake delayed. Auxiliary standby pump ready.
                  </p>
                </div>
              </div>

              <button
                onClick={() => alert('Emergency Borewell Auxiliary Pump Cycle Initiated!')}
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 whitespace-nowrap shrink-0 cursor-pointer"
              >
                Trigger Auxiliary Pump Cycle
              </button>
            </div>
          </div>

          {/* Gauges & Telemetry Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Main Tank Gauge */}
            <div className="glass-panel rounded-2xl p-5 border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-between text-center">
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Main Overhead Reservoir</div>
              <div className="relative w-36 h-36 my-3 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="72" cy="72" r="60" stroke="#1e293b" strokeWidth="12" fill="transparent" />
                  <circle
                    cx="72"
                    cy="72"
                    r="60"
                    stroke="#f59e0b"
                    strokeWidth="12"
                    fill="transparent"
                    strokeDasharray="377"
                    strokeDashoffset={377 - (377 * waterData.mainTankLevel) / 100}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-black text-slate-900 dark:text-white">{waterData.mainTankLevel}%</span>
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">CRITICAL LOW</span>
                </div>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Ultrasonic Sensor #W-101 • Live</div>
            </div>

            {/* Sump Tank Gauge */}
            <div className="glass-panel rounded-2xl p-5 border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-between text-center">
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Underground Sump Tank</div>
              <div className="relative w-36 h-36 my-3 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="72" cy="72" r="60" stroke="#1e293b" strokeWidth="12" fill="transparent" />
                  <circle
                    cx="72"
                    cy="72"
                    r="60"
                    stroke="#06b6d4"
                    strokeWidth="12"
                    fill="transparent"
                    strokeDasharray="377"
                    strokeDashoffset={377 - (377 * waterData.undergroundSumpLevel) / 100}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-black text-slate-900 dark:text-white">{waterData.undergroundSumpLevel}%</span>
                  <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-bold">NORMAL STABLE</span>
                </div>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Municipal Line Intake Active</div>
            </div>

            {/* Pump Runtimes & Inflow */}
            <div className="glass-panel rounded-2xl p-5 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
              <div>
                <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-3">Pump Diagnostics</div>

                <div className="space-y-3">
                  <div className="bg-slate-100 dark:bg-slate-900 rounded-xl p-3 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">Main Pump #1</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">Runtime: 4h 12m today</div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                      {waterData.mainPumpStatus}
                    </span>
                  </div>

                  <div className="bg-slate-100 dark:bg-slate-900 rounded-xl p-3 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">Standby Pump #2</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">Runtime: 0h 45m today</div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {waterData.standbyPumpStatus}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-3 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" /> Auto-cycle balances motor wear
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feature 05: Emergency Water Leakage & Valve V-102 Auto Shut-Off */}
      <div className="glass-panel rounded-2xl p-6 border-2 border-cyan-500/60 shadow-2xl relative overflow-hidden neon-border-cyan space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black px-2.5 py-0.5 rounded bg-cyan-500 text-slate-950 uppercase">
                Feature 05 • Valve V-102 Control
              </span>
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400">BLOCK B ANOMALY DETECTED</span>
            </div>
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
              AI Water Leakage Detection & Motorized Valve V-102 Cut-Off
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Overnight flow surge detected in Block B Service Shaft (4,200 L Saved by Auto Cut-off)
            </p>
          </div>

          <div className="bg-slate-100 dark:bg-slate-900 border border-cyan-500/40 rounded-xl p-3 text-right shrink-0">
            <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Confidence Score</div>
            <div className="text-xl font-black text-cyan-600 dark:text-cyan-400">{waterData.leakageConfidence}% CONFIDENCE</div>
            <div className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">Critical Leakage Verified</div>
          </div>
        </div>

        {/* Visual Graph & Motorized Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-slate-900/90 rounded-xl p-4 border border-slate-800">
            <div className="flex items-center justify-between mb-3 text-xs font-bold text-slate-300">
              <span className="flex items-center gap-2"><Activity className="w-4 h-4 text-cyan-400" /> Flow Rate Sensor Telemetry vs Baseline</span>
              <span className="text-cyan-400">185 L/min Surge!</span>
            </div>

            <div className="h-36 flex items-end justify-between gap-3 p-2 bg-slate-950 rounded-lg border border-slate-800">
              <div className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                <div className="w-full bg-slate-700 h-[30%] rounded-t-sm" />
                <span className="text-[10px] text-slate-400">Baseline (45L)</span>
              </div>
              <div className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                <div className="w-full bg-slate-600 h-[35%] rounded-t-sm" />
                <span className="text-[10px] text-slate-400">Normal (52L)</span>
              </div>
              <div className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                <div className="w-full bg-gradient-to-t from-red-600 to-amber-500 h-[95%] rounded-t-sm animate-pulse" />
                <span className="text-[10px] text-red-400 font-bold">Surge (185L)</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/90 rounded-xl p-4 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase mb-2">Motorized Valve Controls</div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-300">Valve V-102 State:</span>
                  <span className={waterData.valveClosed ? 'text-cyan-400' : 'text-emerald-400'}>
                    {waterData.valveClosed ? 'CLOSED (ISOLATED)' : 'OPEN'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">Motorized solenoid valve controller</p>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <button
                onClick={() => {
                  setIsAdminVerified(true);
                  onConfirmVerification();
                  alert('Verification accepted! Emergency plumber crew assigned.');
                }}
                className="w-full py-2 px-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <CheckSquare className="w-4 h-4 shrink-0" /> {isAdminVerified ? 'Admin Verified ✓ (Plumber Dispatched)' : 'Verify & Dispatch Repair Team'}
              </button>

              <button
                onClick={onToggleValve}
                className={`w-full py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  waterData.valveClosed
                    ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    : 'bg-red-500/20 text-red-300 border-red-500/40 hover:bg-red-500/30'
                }`}
              >
                {waterData.valveClosed ? 'Re-Open Valve V-102' : 'Shut-Off Valve V-102 Now'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
