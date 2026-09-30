import React from 'react';
import {
  ClipboardList,
  Download
} from 'lucide-react';
import type { ActionLogItem } from '../../data/mockData';
import { getTranslation } from '../../utils/i18n';

interface AiActionLogProps {
  logs: ActionLogItem[];
  currentLang?: string;
}

export const AiActionLog: React.FC<AiActionLogProps> = ({ logs, currentLang = 'en' }) => {
  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-200 dark:border-slate-800 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-700 dark:text-cyan-400 text-xs font-semibold mb-2">
              <ClipboardList className="w-3.5 h-3.5 shrink-0" />
              Feature 16 • AI Action Audit Log
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {getTranslation(currentLang, 'actionlog') || '16. Transparent AI Activity & Accountability Ledger'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
              An unalterable real-time audit ledger detailing every autonomous or human-assisted system intervention, confidence score, and impact metric.
            </p>
          </div>

          <button
            onClick={() => alert('Exported official audit log CSV for society managers & auditors!')}
            className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-slate-200 flex items-center gap-2 shrink-0 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" /> {getTranslation(currentLang, 'exportAuditLog') || 'Export Audit Ledger (CSV)'}
          </button>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="glass-panel rounded-2xl p-5 border border-slate-200 dark:border-slate-800 overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
              <th className="py-3 px-3">Timestamp</th>
              <th className="py-3 px-3">Trigger Source</th>
              <th className="py-3 px-3">Anomaly Detected</th>
              <th className="py-3 px-3">Confidence</th>
              <th className="py-3 px-3">Action Executed</th>
              <th className="py-3 px-3">Impact Metric</th>
              <th className="py-3 px-3">Rule Compliance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-100 dark:hover:bg-slate-900/60 transition-colors">
                <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-slate-200 whitespace-nowrap">{log.timestamp}</td>
                <td className="py-3 px-3 font-medium text-cyan-700 dark:text-cyan-300">{log.triggerSource}</td>
                <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                  <div>{log.anomalyDetected}</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">{log.location}</div>
                </td>
                <td className="py-3 px-3">
                  <span className={`px-2 py-0.5 rounded font-bold ${
                    log.confidence > 90 ? 'bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30' : 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                  }`}>
                    {log.confidence}%
                  </span>
                </td>
                <td className="py-3 px-3 font-semibold text-emerald-700 dark:text-emerald-400">{log.actionExecuted}</td>
                <td className="py-3 px-3 font-bold text-amber-700 dark:text-amber-400">{log.impact}</td>
                <td className="py-3 px-3 text-[11px] text-slate-500 dark:text-slate-400">{log.reasonRule}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
