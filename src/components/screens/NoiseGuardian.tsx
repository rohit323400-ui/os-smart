import React from 'react';
import {
  Volume2,
  ShieldCheck,
  Activity,
  CheckCircle2
} from 'lucide-react';
import type { NoiseData } from '../../data/mockData';

interface NoiseGuardianProps {
  noiseData: NoiseData;
  onSimulateEscalation: () => void;
}

export const NoiseGuardian: React.FC<NoiseGuardianProps> = ({
  noiseData,
  onSimulateEscalation
}) => {
  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold mb-2">
              <Volume2 className="w-3.5 h-3.5" />
              PRIVACY-PRESERVING NOISE GUARDIAN: SMART & PRIVATE
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Edge-Compute Non-Verbal Acoustic Intelligence
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Analyzes decibel waves and frequency spectrums locally on hardware chips. Zero speech context recorded or eavesdropped.
            </p>
          </div>

          {/* Privacy Assured Badge */}
          <div className="bg-emerald-950/60 border border-emerald-500/50 rounded-xl p-3 text-right">
            <div className="text-xs font-extrabold text-emerald-400 flex items-center gap-1 justify-end">
              <ShieldCheck className="w-4 h-4" /> PRIVACY ASSURED
            </div>
            <p className="text-[11px] text-slate-300">No conversations recorded or stored</p>
            <p className="text-[10px] text-emerald-400">Analyzing sound patterns only</p>
          </div>
        </div>
      </div>

      {/* Noise Event Detected Card */}
      {noiseData.currentViolationStage > 0 && (
        <div className="bg-slate-900/90 border-2 border-amber-500/70 rounded-2xl p-5 shadow-xl neon-border-amber">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 animate-pulse">
                <Volume2 className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-black px-2 py-0.5 rounded bg-amber-500 text-slate-950 uppercase">
                  NOISE EVENT DETECTED
                </span>
                <h3 className="text-base font-extrabold text-white mt-0.5">
                  Noise level above community limit during quiet hours ({noiseData.currentDecibels} dB &gt; 15 mins)
                </h3>
                <p className="text-xs text-slate-300">
                  Event Type: Persistent Noise • Triangulated Origin: <strong>{noiseData.targetUnit} (Block B Area 4)</strong>
                </p>
              </div>
            </div>

            <button
              onClick={onSimulateEscalation}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-amber-500/20"
            >
              Advance Escalation Stage ({noiseData.currentViolationStage}/3)
            </button>
          </div>
        </div>
      )}

      {/* Decibel Monitor Graph & 3-Stage Escalation Ladder */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Decibel Graph */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-5 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-cyan-400" />
                Noise Activity Log (Quiet Hours: 10:00 PM - 7:00 AM)
              </h3>
              <span className="text-xs font-mono text-cyan-400 font-bold">Limit Threshold: 55 dB</span>
            </div>

            {/* Decibel Bar Graph */}
            <div className="h-44 bg-slate-950 rounded-xl p-3 border border-slate-800 flex items-end justify-between gap-2 overflow-hidden">
              {noiseData.decibelHistory.map((item, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                  <div
                    style={{ height: `${(item.db / 100) * 100}%` }}
                    className={`w-full rounded-t-sm ${item.db > 60
                      ? 'bg-gradient-to-t from-amber-600 to-red-500 animate-pulse'
                      : 'bg-slate-700'
                      }`}
                  />
                  <span className="text-[10px] text-slate-400">{item.time}</span>
                  <span className="text-[9px] font-mono text-slate-300">{item.db} dB</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
            <span>Machine Learning Signature: Confirmed Amplified Subwoofer Pattern (88% Confidence)</span>
            <span className="text-emerald-400 font-bold">Non-Verbal Feature Extraction</span>
          </div>
        </div>

        {/* 3-Stage Progressive Escalation Ladder */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase">PROGRESSIVE VIOLATION ESCALATION LADDER</h3>

          {/* Stage 1 */}
          <div className={`p-3 rounded-xl border text-xs space-y-1 ${noiseData.currentViolationStage >= 1 ? 'bg-slate-900 border-amber-500/50 text-slate-200' : 'bg-slate-950 border-slate-800 text-slate-500'
            }`}>
            <div className="flex items-center justify-between font-bold">
              <span className="text-amber-400">STAGE 1: Private Digital Warning</span>
              {noiseData.currentViolationStage >= 1 && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            </div>
            <p className="text-[11px] text-slate-400">
              Autonomously sends a courteous, private push notification to resident of unit {noiseData.targetUnit}. No public shaming.
            </p>
          </div>

          {/* Stage 2 */}
          <div className={`p-3 rounded-xl border text-xs space-y-1 ${noiseData.currentViolationStage >= 2 ? 'bg-slate-900 border-amber-500/50 text-slate-200' : 'bg-slate-950 border-slate-800 text-slate-500'
            }`}>
            <div className="flex items-center justify-between font-bold">
              <span className="text-amber-400">STAGE 2: Persistent Escalation</span>
              {noiseData.currentViolationStage >= 2 && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            </div>
            <p className="text-[11px] text-slate-400">
              Secondary alert sent after 15-min grace period. Pre-filled ticket logged for management review.
            </p>
          </div>

          {/* Stage 3 */}
          <div className={`p-3 rounded-xl border text-xs space-y-1 ${noiseData.currentViolationStage >= 3 ? 'bg-slate-900 border-red-500/50 text-slate-200' : 'bg-slate-950 border-slate-800 text-slate-500'
            }`}>
            <div className="flex items-center justify-between font-bold">
              <span className="text-red-400">STAGE 3: Management Physical Action</span>
              {noiseData.currentViolationStage >= 3 && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            </div>
            <p className="text-[11px] text-slate-400">
              Escalated to security personnel or building administrators for physical intervention per society bylaws.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
