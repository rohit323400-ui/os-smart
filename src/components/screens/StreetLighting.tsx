import React, { useState } from 'react';
import {
  Zap,
  Eye,
  Sliders,
  AlertTriangle,
  Sparkles
} from 'lucide-react';
import { getTranslation } from '../../utils/i18n';

interface StreetLightingProps {
  currentLang?: string;
}

export const StreetLighting: React.FC<StreetLightingProps> = ({ currentLang = 'en' }) => {
  const [motionDetected, setMotionDetected] = useState<boolean>(false);

  const lightPoles = [
    { id: 'P-01', location: 'Gate 1 Entrance Pathway', status: 'ACTIVE_100', currentDraw: '1.2A', motion: true },
    { id: 'P-02', location: 'Garden Walkway North', status: 'DIMMED_30', currentDraw: '0.3A', motion: false },
    { id: 'P-03', location: 'Block C Pathway B', status: 'FAULT_SILENT_TICKET', currentDraw: '0.0A', motion: false, ticketId: '#1042' },
    { id: 'P-04', location: 'Clubhouse Outer Perimeter', status: 'DIMMED_30', currentDraw: '0.3A', motion: false },
    { id: 'P-05', location: 'Tower A Guest Drop Zone', status: 'ACTIVE_100', currentDraw: '1.2A', motion: true },
    { id: 'P-06', location: 'Basement RAMP Approach', status: 'ACTIVE_100', currentDraw: '1.2A', motion: true }
  ];

  const triggerMotionSim = () => {
    setMotionDetected(true);
    setTimeout(() => {
      setMotionDetected(false);
    }, 4000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-200 dark:border-slate-800 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-700 dark:text-indigo-400 text-xs font-semibold mb-2">
              <Zap className="w-3.5 h-3.5 shrink-0" />
              Feature 06 • Motion Sensing Street Lighting
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {getTranslation(currentLang, 'lighting') || '06. PIR Motion Sensing & Silent Auto-Ticket System'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
              Streetlights auto-dim to 30% during quiet night hours to save energy. When motion is detected, PIR sensors instantly illuminate the pathway to 100%. Faulty bulbs trigger silent auto-tickets without resident complaints.
            </p>
          </div>

          <div className="bg-slate-100 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-right shrink-0">
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase">Solar & Energy Saved</div>
            <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">38% Monthly Reduction</div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">PIR Motion Edge Telemetry</p>
          </div>
        </div>
      </div>

      {/* Interactive Motion Test Deck */}
      <div className="glass-panel rounded-2xl p-5 border border-slate-200 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Eye className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
              PIR Motion Sensor Simulation Test
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Click the button to simulate a walking resident along Garden Walkway (Pole P-02).
            </p>
          </div>

          <button
            onClick={triggerMotionSim}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-cyan-500/20 flex items-center gap-2 shrink-0 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 shrink-0" /> Simulate Resident Walking Past Pole P-02
          </button>
        </div>

        {/* Visual Corridor Bar */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between gap-2 relative overflow-hidden">
          <div className={`transition-all duration-500 flex items-center gap-3 ${motionDetected ? 'text-amber-300 scale-105' : 'text-slate-500'}`}>
            <Zap className={`w-8 h-8 shrink-0 ${motionDetected ? 'text-amber-400 animate-pulse' : 'text-slate-600'}`} />
            <div>
              <div className="text-sm font-bold text-white">Pole P-02 Garden Walkway</div>
              <div className="text-xs">
                {motionDetected ? 'PIR Motion Detected → Brightness: 100% (1.2A Current)' : 'No Motion → Dimmed Standby: 30% (0.3A Current)'}
              </div>
            </div>
          </div>

          <span className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 ${motionDetected ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-slate-800 text-slate-400'}`}>
            {motionDetected ? '100% BRIGHT ACTIVE' : '30% DIMMED SAVING'}
          </span>
        </div>
      </div>

      {/* Grid of Light Poles */}
      <div className="glass-panel rounded-2xl p-5 border border-slate-200 dark:border-slate-800">
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Sliders className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
          Live Community Streetlight Pole Grid (Telemetry & Fault Detection)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {lightPoles.map((pole) => {
            const isFault = pole.status === 'FAULT_SILENT_TICKET';
            return (
              <div
                key={pole.id}
                className={`p-4 rounded-xl border transition-all ${
                  isFault
                    ? 'bg-amber-950/40 border-amber-500/60 text-slate-200 neon-border-amber'
                    : 'bg-slate-100 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-black text-cyan-700 dark:text-cyan-400 font-mono">{pole.id}</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                      isFault
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                        : pole.motion
                        ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {isFault ? 'SILENT TICKET LOGGED' : pole.status}
                  </span>
                </div>

                <div className="text-xs font-bold text-slate-900 dark:text-white">{pole.location}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex justify-between">
                  <span>Current Draw: <strong className="text-slate-900 dark:text-slate-200 font-mono">{pole.currentDraw}</strong></span>
                  <span>PIR Sensor: <strong className={pole.motion ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}>{pole.motion ? 'Motion' : 'Idle'}</strong></span>
                </div>

                {isFault && (
                  <div className="mt-3 pt-2 border-t border-amber-500/30 text-xs text-amber-400 flex items-center justify-between">
                    <span className="flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5 shrink-0" /> Ticket {pole.ticketId} Auto-Logged</span>
                    <span className="text-[10px] text-slate-400 font-mono">Current 0.0A &lt; 0.1A</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
