import React, { useState } from 'react';
import {
  Lock,
  EyeOff,
  CheckCircle2,
  XCircle,
  Sliders
} from 'lucide-react';

export const PrivacyCenter: React.FC = () => {
  const [slotSharingOptIn, setSlotSharingOptIn] = useState<boolean>(true);
  const [sensorTelemetryOptIn, setSensorTelemetryOptIn] = useState<boolean>(true);
  const [directoryVisible, setDirectoryVisible] = useState<boolean>(false);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold mb-2">
              <Lock className="w-3.5 h-3.5" />
              COMMUNITY DATA PRIVACY & GOVERNANCE CENTER
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Data Minimization Architecture: Privacy by Design
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Separates operational utility from surveillance. Tracks infrastructure and utility states, NEVER individual resident lives or private audio.
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-700/80 rounded-xl p-3 text-right">
            <div className="text-xs text-slate-400 font-bold uppercase">Transparency Score</div>
            <div className="text-2xl font-black text-emerald-400">98% Protected</div>
            <p className="text-[11px] text-slate-400">Raw behavioral data not exposed</p>
          </div>
        </div>
      </div>

      {/* Data Abstraction Rules: What AI Sees vs What It Exposes */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <EyeOff className="w-5 h-5 text-cyan-400" />
          Data Abstraction Standard (What System Blocks vs What System Allows)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Blocked Raw Tracking */}
          <div className="bg-red-950/30 border border-red-500/40 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-black text-red-400 uppercase">
              <XCircle className="w-4 h-4" /> Raw Behavioral Tracking (BLOCKED BY SYSTEM)
            </div>
            <div className="text-sm font-bold text-white font-mono bg-slate-950 p-2.5 rounded border border-slate-800">
              "Resident A leaves flat at 8:57 AM and returns at 6:32 PM."
            </div>
            <p className="text-xs text-red-200">
              <strong>Why it is blocked:</strong> Exposes personal daily habits, routines, and creates surveillance risks.
            </p>
          </div>

          {/* Allowed Abstraction */}
          <div className="bg-emerald-950/30 border border-emerald-500/40 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-black text-emerald-400 uppercase">
              <CheckCircle2 className="w-4 h-4" /> Operational AI Abstraction (ALLOWED BY SYSTEM)
            </div>
            <div className="text-sm font-bold text-white font-mono bg-slate-950 p-2.5 rounded border border-slate-800">
              "Parking Slot #42 is predicted to be available from 9:00 AM – 5:00 PM."
            </div>
            <p className="text-xs text-emerald-200">
              <strong>Why it works:</strong> Converts private schedules into an anonymous, functional Resource + Time metric without identifying the resident.
            </p>
          </div>
        </div>
      </div>

      {/* Granular Resident Toggles */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Sliders className="w-5 h-5 text-cyan-400" />
          Resident Sovereign Privacy Controls
        </h3>

        <div className="space-y-3">
          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-sm font-bold text-white">Parking Slot Sharing Permissions</div>
              <div className="text-xs text-slate-400">Enable or disable AI predictions on your private parking slot</div>
            </div>
            <input
              type="checkbox"
              checked={slotSharingOptIn}
              onChange={() => setSlotSharingOptIn(!slotSharingOptIn)}
              className="w-5 h-5 accent-cyan-400 cursor-pointer"
            />
          </div>

          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-sm font-bold text-white">Common-Area Sensor Telemetry Opt-In</div>
              <div className="text-xs text-slate-400">Allow anonymized acoustic pattern and motion sensors in hallway zones</div>
            </div>
            <input
              type="checkbox"
              checked={sensorTelemetryOptIn}
              onChange={() => setSensorTelemetryOptIn(!sensorTelemetryOptIn)}
              className="w-5 h-5 accent-cyan-400 cursor-pointer"
            />
          </div>

          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-sm font-bold text-white">Directory Contact Visibility</div>
              <div className="text-xs text-slate-400">Keep contact details hidden from public society directory</div>
            </div>
            <input
              type="checkbox"
              checked={directoryVisible}
              onChange={() => setDirectoryVisible(!directoryVisible)}
              className="w-5 h-5 accent-cyan-400 cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
