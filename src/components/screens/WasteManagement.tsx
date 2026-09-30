import React from 'react';
import {
  Trash2,
  AlertTriangle,
  Truck,
  PhoneCall,
  ShieldCheck
} from 'lucide-react';
import type { WasteBinData } from '../../data/mockData';

interface WasteManagementProps {
  bins: WasteBinData[];
  onDispatchVendor: (binId: string) => void;
}

export const WasteManagement: React.FC<WasteManagementProps> = ({
  bins,
  onDispatchVendor
}) => {
  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold mb-2">
              <Trash2 className="w-3.5 h-3.5" />
              SMART WASTE MANAGEMENT: CENTRAL DUMP YARDS & BINS
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Predictive Computer Vision & Ultrasonic Fill Monitor
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Autonomously predicts dump yard overflow windows, auto-dispatches municipal collection trucks, and operates in zero-resident-spam silent mode.
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-700/80 rounded-xl p-3 text-right">
            <div className="text-xs text-slate-400 font-bold uppercase">Resident Alert Status</div>
            <div className="text-sm font-extrabold text-emerald-400 flex items-center gap-1 justify-end">
              <ShieldCheck className="w-4 h-4" /> SILENT BACKGROUND ROUTINE
            </div>
            <p className="text-[11px] text-slate-400">Residents experience zero noise or clutter</p>
          </div>
        </div>
      </div>

      {/* Critical Overflow Risk Alert Card */}
      <div className="bg-slate-900/90 border-2 border-amber-500/70 rounded-2xl p-5 shadow-xl neon-border-amber">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 animate-bounce">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-black px-2 py-0.5 rounded bg-amber-500 text-slate-950 uppercase">
                OVERFLOW VELOCITY FORECAST
              </span>
              <h3 className="text-base font-extrabold text-white mt-0.5">
                CRITICAL OVERFLOW RISK DETECTED: Ground Central Dump Yard (89% Capacity)
              </h3>
              <p className="text-xs text-slate-300">
                AI projects threshold breach in <strong>35 minutes</strong> based on Sunday morning disposal patterns.
              </p>
            </div>
          </div>

          <span className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold rounded-full">
            Auto-Webhook Dispatched
          </span>
        </div>
      </div>

      {/* Bin Depth Gauges & Live Computer Vision */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bins List */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-cyan-400" />
            Communal Bins & Dump Station Depth Levels
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {bins.map((bin) => (
              <div key={bin.binId} className="glass-panel rounded-2xl p-4 border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase">{bin.name}</div>
                  <div className="text-2xl font-black text-white mt-1">{bin.fillPercentage}% Full</div>

                  {/* Fill Bar */}
                  <div className="w-full bg-slate-800 rounded-full h-2.5 mt-3 overflow-hidden">
                    <div
                      style={{ width: `${bin.fillPercentage}%` }}
                      className={`h-full rounded-full ${
                        bin.fillPercentage > 80
                          ? 'bg-gradient-to-r from-amber-500 to-red-500'
                          : 'bg-gradient-to-r from-emerald-500 to-cyan-400'
                      }`}
                    />
                  </div>

                  <div className="mt-3 text-xs text-slate-300 flex items-center justify-between">
                    <span>Forecast:</span>
                    <span className="font-bold text-amber-400">Critical in {bin.predictedOverflowMins} mins</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800">
                  {bin.vendorDispatched ? (
                    <div className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                      <Truck className="w-4 h-4" /> Dispatched to {bin.vendorName}
                    </div>
                  ) : (
                    <button
                      onClick={() => onDispatchVendor(bin.binId)}
                      className="w-full py-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 text-xs font-bold"
                    >
                      Dispatch Collection Truck
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live GPS Waste Truck Tracking Map */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-white flex items-center gap-2">
                <Truck className="w-4 h-4 text-emerald-400" />
                REAL-TIME GPS TRUCK ACTIONS
              </h4>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-bold">
                ETA: 12 Mins
              </span>
            </div>

            <p className="text-xs text-slate-400 mb-3">
              CleanCity Logistics garbage collection truck route dispatch.
            </p>

            {/* GPS Map Graphic Simulation */}
            <div className="relative h-44 bg-slate-950 rounded-xl overflow-hidden border border-slate-800 p-3 flex flex-col justify-between">
              <div className="flex justify-between items-center text-[10px] text-slate-400 z-10">
                <span>Truck ID: #WT-89</span>
                <span className="text-emerald-400 font-bold">En Route to Central Bay</span>
              </div>

              <div className="my-auto text-center z-10">
                <Truck className="w-8 h-8 text-emerald-400 mx-auto animate-bounce" />
                <div className="text-xs font-bold text-white mt-1">CleanCity Logistics #104</div>
                <div className="text-[10px] text-slate-400">Driver Contact: +91 98201-44321</div>
              </div>

              <div className="text-[10px] text-slate-400 text-center z-10 border-t border-slate-800 pt-1">
                Zero Resident WhatsApp Spam • Pure Background Automation
              </div>
            </div>
          </div>

          <button
            onClick={() => alert('Driver called directly! Driver confirmed arrival in 10 minutes.')}
            className="mt-4 w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 border border-slate-700"
          >
            <PhoneCall className="w-4 h-4 text-emerald-400" /> Call Waste Truck Driver
          </button>
        </div>
      </div>
    </div>
  );
};
