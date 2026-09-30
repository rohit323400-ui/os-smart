import React, { useState } from 'react';
import {
  Cpu,
  Eye,
  Brain,
  TrendingUp,
  ShieldCheck,
  CheckSquare,
  Play,
  ClipboardList,
  RotateCcw,
  Sparkles,
  Sliders,
  Lock
} from 'lucide-react';
import { getTranslation } from '../../utils/i18n';

interface AiBrainArchitectureProps {
  currentLang?: string;
}

export const AiBrainArchitecture: React.FC<AiBrainArchitectureProps> = ({ currentLang = 'en' }) => {
  const [activeStep, setActiveStep] = useState<number>(1);

  const pipelineSteps = [
    {
      step: 1,
      title: 'Observe',
      subtitle: 'Data Collection (Input Layer)',
      icon: Eye,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10',
      borderColor: 'border-cyan-500/30',
      description: 'Ingests data streams from IoT water flow meters, smart meters, gate barrier logs, elevator telematics, acoustic sensors, and CCTV computer vision.',
      systemAction: 'Raw telemetry ingestion without capturing verbal audio or private resident tracking.'
    },
    {
      step: 2,
      title: 'Understand',
      subtitle: 'Context & Pattern Analysis',
      icon: Brain,
      color: 'text-indigo-400',
      bgColor: 'bg-indigo-500/10',
      borderColor: 'border-indigo-500/30',
      description: 'Evaluates live patterns against baseline consumption models (e.g., identifies flow rates three times higher than typical Sunday afternoons).',
      systemAction: 'Converts raw sensor signals into structured operational context.'
    },
    {
      step: 3,
      title: 'Predict',
      subtitle: 'Risk Forecasting Engine',
      icon: TrendingUp,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30',
      description: 'Forecasts that Block B will deplete its reservoir in under 120 minutes if inflow remains unchanged, or garbage bin overflow in 35 minutes.',
      systemAction: 'Predicts infrastructure bottlenecks before residents suffer disruptions.'
    },
    {
      step: 4,
      title: 'Risk Analysis',
      subtitle: 'Confidence Gating (>90%)',
      icon: ShieldCheck,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/30',
      description: 'Calculates an exact certainty score (e.g., "Possible Critical Leakage: 91% Confidence"). Categorizes consequences into routine vs high-hazard events.',
      systemAction: 'Prevents false positives by cross-referencing multiple sensor signals.'
    },
    {
      step: 5,
      title: 'Verification Gate',
      subtitle: 'Human vs Controlled Autonomy',
      icon: CheckSquare,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/30',
      description: 'Routine tasks require human verification (1-tap admin sign-off). Critical off-hour emergencies (fire, burst pipe at 2 AM) activate controlled automatic isolation.',
      systemAction: 'Enforces strict legal boundaries of AI autonomy.'
    },
    {
      step: 6,
      title: 'Action Execution',
      subtitle: 'Direct System Control',
      icon: Play,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/30',
      description: 'Executes physical actions: shuts motorized main valve V-102, dispatches plumber, brightens pathway streetlights, unlatches fire escape doors.',
      systemAction: 'Performs precise background interventions without manual lag.'
    },
    {
      step: 7,
      title: 'AI Action Log',
      subtitle: 'Immutable Audit Ledger',
      icon: ClipboardList,
      color: 'text-pink-400',
      bgColor: 'bg-pink-500/10',
      borderColor: 'border-pink-500/30',
      description: 'Immediately writes a public, unalterable log containing exact timestamp, trigger source, confidence score, action executed, and impact metrics.',
      systemAction: 'Preserves full operational accountability for society managers & auditors.'
    },
    {
      step: 8,
      title: 'Continuous Learning',
      subtitle: 'Closed-Loop Model Refinement',
      icon: RotateCcw,
      color: 'text-teal-400',
      bgColor: 'bg-teal-500/10',
      borderColor: 'border-teal-500/30',
      description: 'Logs mean time to resolution (MTTR) and post-incident human feedback to refine variance calculations and improve future predictive precision.',
      systemAction: 'Continuously adapts to seasonal and daily resident habit shifts.'
    }
  ];

  const currentStepData = pipelineSteps[activeStep - 1];

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-200 dark:border-slate-800 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-700 dark:text-indigo-400 text-xs font-semibold mb-2">
              <Cpu className="w-3.5 h-3.5 shrink-0" />
              Feature 02 • AI Brain Architecture
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {getTranslation(currentLang, 'architecture') || '02. 8-Step AI Brain Engine & Learning Pipeline'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
              An active system controller executing an 8-stage closed-loop pipeline from multi-sensor telemetry ingestion to autonomous safety intervention.
            </p>
          </div>

          <div className="bg-slate-100 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-right">
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase">System Type</div>
            <div className="text-xs font-extrabold text-cyan-600 dark:text-cyan-400 flex items-center gap-1.5 justify-end">
              <Sparkles className="w-3.5 h-3.5 shrink-0" /> Active System Controller
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">Zero passive prompt loops • 24/7 Telemetry</p>
          </div>
        </div>
      </div>

      {/* 8-Step Interactive Pipeline Flow Visualizer */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-200 dark:border-slate-800">
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Sliders className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
          Interactive 8-Step Observation & Learning Flow (Click to inspect)
        </h3>

        {/* Step Buttons horizontal strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 mb-6">
          {pipelineSteps.map((stepItem) => {
            const Icon = stepItem.icon;
            const isSelected = activeStep === stepItem.step;
            return (
              <button
                key={stepItem.step}
                onClick={() => setActiveStep(stepItem.step)}
                className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between h-24 cursor-pointer ${
                  isSelected
                    ? `${stepItem.bgColor} ${stepItem.borderColor} ring-2 ring-cyan-500/50 scale-[1.02]`
                    : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className={`text-[10px] font-black ${stepItem.color}`}>
                    STEP 0{stepItem.step}
                  </span>
                  <Icon className={`w-4 h-4 shrink-0 ${stepItem.color}`} />
                </div>
                <div className="text-xs font-bold text-slate-900 dark:text-white truncate mt-2">{stepItem.title}</div>
              </button>
            );
          })}
        </div>

        {/* Active Step Detailed Card */}
        <div className="bg-slate-100 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/80 rounded-xl p-5 relative">
          <div className="flex items-start justify-between gap-4 mb-4 border-b border-slate-200 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${currentStepData.bgColor} border ${currentStepData.borderColor} flex items-center justify-center shrink-0`}>
                <currentStepData.icon className={`w-5 h-5 ${currentStepData.color}`} />
              </div>
              <div>
                <span className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-widest">
                  Stage {currentStepData.step} of 8 Pipeline
                </span>
                <h4 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">{currentStepData.title}: {currentStepData.subtitle}</h4>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-2">
              <button
                disabled={activeStep === 1}
                onClick={() => setActiveStep((prev) => Math.max(1, prev - 1))}
                className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 disabled:opacity-40"
              >
                Previous Step
              </button>
              <button
                disabled={activeStep === 8}
                onClick={() => setActiveStep((prev) => Math.min(8, prev + 1))}
                className="px-3 py-1.5 rounded-lg bg-cyan-500 text-xs font-bold text-slate-950 disabled:opacity-40"
              >
                Next Step
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-slate-950/60 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
              <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Operational Mechanism</div>
              <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed">{currentStepData.description}</p>
            </div>

            <div className="bg-white dark:bg-slate-950/60 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
              <div className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 uppercase mb-1">AI Autonomous Controller Action</div>
              <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed">{currentStepData.systemAction}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Decision Boundaries & Governance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-panel rounded-2xl p-5 border border-slate-200 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            Human Verification (Default Path)
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
            For standard operational anomalies, AI drafts the action and waits for 1-tap admin sign-off.
          </p>
          <div className="bg-slate-100 dark:bg-slate-900 rounded-xl p-3 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 space-y-1">
            <div className="flex justify-between font-bold text-slate-900 dark:text-white">
              <span>Standard Maintenance Ticket #1042</span>
              <span className="text-amber-600 dark:text-amber-400">Pending Admin Sign-off</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400">PIR Light Sensor pole #3 current drop detected.</p>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-5 border border-slate-200 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
            Controlled Emergency Autonomy (&gt;90% Confidence)
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
            For time-critical off-hour life safety hazards, AI acts instantly to isolate hazard then logs full audit trail.
          </p>
          <div className="bg-slate-100 dark:bg-slate-900 rounded-xl p-3 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 space-y-1">
            <div className="flex justify-between font-bold text-slate-900 dark:text-white">
              <span>Automatic Main Line Isolation (Valve V-102)</span>
              <span className="text-emerald-600 dark:text-emerald-400">Executed (02:14 AM)</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400">Prevented ~4,200L water loss before plumbing crew arrived.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
