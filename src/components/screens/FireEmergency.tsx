import React from 'react';
import {
  Flame,
  PhoneCall,
  Video,
  Users,
  Navigation,
  ArrowRight
} from 'lucide-react';
import type { FireEmergencyData } from '../../data/mockData';

interface FireEmergencyProps {
  fireData: FireEmergencyData;
}

export const FireEmergency: React.FC<FireEmergencyProps> = ({ fireData }) => {
  return (
    <div className="space-y-6 pb-12">
      {/* Critical Emergency Alarm Banner */}
      <div className="bg-gradient-to-r from-red-950 via-red-900 to-slate-950 border-2 border-red-500 rounded-2xl p-6 shadow-2xl neon-border-red relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-red-500/20 border-2 border-red-500 flex items-center justify-center text-red-400 animate-bounce shadow-lg shadow-red-500/30">
              <Flame className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-red-500 text-slate-950 font-black text-xs uppercase tracking-wider animate-pulse">
                  CRITICAL FIRE EMERGENCY
                </span>
                <span className="text-xs font-bold text-red-300">PRIORITY 1 OVERLAY</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
                {fireData.location}
              </h2>
              <p className="text-xs text-red-200 mt-0.5">
                Fire Protocol Activated • Emergency Staircase Lighting set to High Visibility • Doors Unlatched
              </p>
            </div>
          </div>

          {/* AI Confidence Badge */}
          <div className="bg-slate-950/80 border border-red-500/60 rounded-xl p-3 text-right">
            <div className="text-xs text-slate-400 font-bold uppercase">AI Sensor Fusion Score</div>
            <div className="text-2xl font-black text-red-400">{fireData.confidenceScore}% CONFIDENCE</div>
            <div className="text-[10px] text-emerald-400 font-bold">Confirmed Authentic Blaze</div>
          </div>
        </div>
      </div>

      {/* Sensor Fusion Engine Telemetry */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel rounded-xl p-4 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-400">SMOKE SENSORS</div>
            <div className="text-xl font-extrabold text-red-400">{fireData.smokeLevel}% Active Peak</div>
          </div>
          <span className="text-xs font-bold px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30">
            3 Active
          </span>
        </div>

        <div className="glass-panel rounded-xl p-4 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-400">HEAT DETECTORS</div>
            <div className="text-xl font-extrabold text-amber-400">{fireData.heatLevel}% Temp Spike</div>
          </div>
          <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
            1 High Temp
          </span>
        </div>

        <div className="glass-panel rounded-xl p-4 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-400">ALARM SYSTEM</div>
            <div className="text-xl font-extrabold text-emerald-400">ACTIVE SOUNDING</div>
          </div>
          <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            Lobby & Corridors
          </span>
        </div>
      </div>

      {/* 3D Isometric Evacuation Plan & Live Thermal CCTV Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 3D Floorplan Evacuation Map Visualizer */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-5 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Navigation className="w-5 h-5 text-emerald-400" />
                3D Isometric Tower Evacuation Guidance Map
              </h3>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Safe Egress Routes Active
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Green arrows indicate safe, smoke-free stairwells. Red zones indicate compromised pathways to avoid.
            </p>

            {/* Isometric Mock Evacuation Map */}
            <div className="relative h-64 bg-slate-950 rounded-xl p-4 border border-slate-800 overflow-hidden flex flex-col justify-between">
              {/* Floor Plan Diagram Simulation */}
              <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-900 to-slate-950 pointer-events-none" />

              <div className="relative z-10 flex justify-between items-start text-xs font-bold">
                <span className="px-2 py-1 bg-red-500/20 border border-red-500/40 text-red-400 rounded">
                  RED DANGER ZONE: Floor 3 Corridor
                </span>
                <span className="px-2 py-1 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 rounded flex items-center gap-1">
                  <Navigation className="w-3.5 h-3.5" /> STAIRWELL 1 & 2 SAFE
                </span>
              </div>

              {/* Graphic Flow Lines */}
              <div className="relative z-10 my-auto grid grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-red-950/60 border border-red-500/50 rounded-lg text-red-300">
                  <div className="text-xs font-bold">Tower A - Floor 3</div>
                  <div className="text-[10px] text-red-400">SMOKE & HEAT DETECTED</div>
                </div>

                <div className="p-3 bg-emerald-950/60 border border-emerald-500/50 rounded-lg text-emerald-300 flex flex-col items-center justify-center">
                  <ArrowRight className="w-6 h-6 text-emerald-400 animate-pulse" />
                  <div className="text-[10px] font-bold">STAIRWELL 1 EGRESS</div>
                </div>

                <div className="p-3 bg-emerald-950/60 border border-emerald-500/50 rounded-lg text-emerald-300 flex flex-col items-center justify-center">
                  <ArrowRight className="w-6 h-6 text-emerald-400 animate-pulse" />
                  <div className="text-[10px] font-bold">STAIRWELL 2 EGRESS</div>
                </div>
              </div>

              <div className="relative z-10 flex justify-between items-center text-[11px] text-slate-400 pt-2 border-t border-slate-800">
                <span className="text-amber-400 font-semibold">Strict Rule: AVOID ALL ELEVATORS & LIFTS</span>
                <span>Nearest Extinguisher: Station #3 (Next to Stairwell 1)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Live CCTV Feed & Direct Emergency Dialers */}
        <div className="space-y-4">
          {/* CCTV Feed Box */}
          <div className="glass-panel rounded-2xl p-4 border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-white flex items-center gap-2">
                <Video className="w-4 h-4 text-red-400" />
                Live CCTV Window: Tower A Corridor
              </h4>
              <span className="text-[10px] px-2 py-0.5 rounded bg-red-500 text-slate-950 font-bold uppercase animate-pulse">
                REC • Thermal
              </span>
            </div>

            <div className="relative h-36 bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center group">
              <img
                src="https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?auto=format&fit=crop&w=400&q=80"
                alt="Thermal CCTV"
                className="w-full h-full object-cover opacity-60 mix-blend-luminosity"
              />
              <div className="absolute inset-0 bg-red-950/30 pointer-events-none" />
              <div className="absolute bottom-2 left-2 text-[10px] bg-slate-950/80 px-2 py-0.5 rounded text-red-300 font-mono">
                Tower A Flr 3 Cam #4 • 96% Heat Spike
              </div>
            </div>
          </div>

          {/* One-Tap Direct Emergency Dialers */}
          <div className="glass-panel rounded-2xl p-4 border border-slate-800">
            <div className="text-xs font-bold text-slate-400 uppercase mb-3">ONE-TAP DIRECT EMERGENCY CONTACTS</div>
            <div className="space-y-2">
              <button
                onClick={() => alert('Dialing Fire Brigade (101)... Emergency location dispatched!')}
                className="w-full py-2.5 px-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-red-600/30"
              >
                <PhoneCall className="w-4 h-4" /> Call Fire Brigade (101)
              </button>
              <button
                onClick={() => alert('Dialing Ambulance Services (102)...')}
                className="w-full py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs flex items-center justify-center gap-2"
              >
                <PhoneCall className="w-4 h-4" /> Call Ambulance Services (102)
              </button>
              <button
                onClick={() => alert('Alerting On-Site Security Desk... Ground team dispatched.')}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 border border-slate-700"
              >
                <PhoneCall className="w-4 h-4" /> Call Society Security Desk
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Special Assistance Tracker (People Who May Require Assistance) */}
      <div className="glass-panel rounded-2xl p-5 border border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-400" />
            PEOPLE WHO MAY REQUIRE ASSISTANCE (Priority Rescue List)
          </h3>
          <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
            2 Flats Flagged
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {fireData.assistanceNeeded.map((item, idx) => (
            <div key={idx} className="bg-slate-900 border border-amber-500/40 rounded-xl p-3.5 flex items-center justify-between">
              <div>
                <div className="text-sm font-extrabold text-white">{item.flat} - {item.occupantName}</div>
                <div className="text-xs text-amber-400 font-semibold mt-0.5">{item.category}</div>
              </div>
              <button
                onClick={() => alert(`Guard assigned to assist ${item.flat} (${item.occupantName})`)}
                className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 text-xs font-bold hover:bg-amber-400"
              >
                Assign Guard
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
