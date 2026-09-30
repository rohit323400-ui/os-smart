import React, { useState } from 'react';
import {
  ShieldCheck,
  UserCheck,
  UserX,
  QrCode,
  Video,
  CheckCircle2
} from 'lucide-react';
import type { VisitorRequest } from '../../data/mockData';

interface VisitorSecurityProps {
  requests: VisitorRequest[];
  onApprove: (id: string) => void;
  onDeny: (id: string) => void;
}

export const VisitorSecurity: React.FC<VisitorSecurityProps> = ({
  requests,
  onApprove,
  onDeny
}) => {
  const [silentDeliveryActive, setSilentDeliveryActive] = useState<boolean>(true);
  const [qrModalOpen, setQrModalOpen] = useState<boolean>(false);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              SMART SECURITY & VISITOR ACCESS SYSTEM
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              AI Visual & Credential Scan Gate Management
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Automatic courier matching, silent delivery drop-offs, two-way gate camera links, and resident 1-tap approvals.
            </p>
          </div>

          {/* Quick Pre-Approve QR Pass Button */}
          <button
            onClick={() => setQrModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-extrabold text-xs shadow-lg shadow-cyan-500/20 flex items-center gap-2"
          >
            <QrCode className="w-4 h-4" /> Create Pre-Approved Guest Pass
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Active Visitor Requests Cards */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-cyan-400" />
            Active Visitor Access Requests
          </h3>

          {requests.map((request) => (
            <div
              key={request.id}
              className="glass-panel rounded-2xl p-5 border border-slate-800 flex flex-col sm:flex-row items-center gap-5 relative overflow-hidden"
            >
              {/* Photo */}
              <div className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-cyan-500/40 shrink-0">
                <img
                  src={request.photoUrl}
                  alt={request.name}
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-1 left-1 right-1 text-[9px] font-black bg-slate-950/80 text-cyan-300 text-center rounded py-0.5 uppercase">
                  {request.category}
                </span>
              </div>

              {/* Request Info */}
              <div className="flex-1 space-y-1.5 text-center sm:text-left">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <h4 className="text-lg font-extrabold text-white">{request.name}</h4>
                  <span className="text-xs text-slate-400">{request.timestamp}</span>
                </div>

                <div className="text-xs text-cyan-300 font-semibold">{request.company}</div>

                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
                  <span>Target: <strong className="text-white">{request.targetFlat}</strong></span>
                  <span>• Plate: <code className="bg-slate-900 px-1.5 py-0.5 rounded text-cyan-400">{request.vehiclePlate}</code></span>
                </div>

                {/* Risk Meter */}
                <div className="bg-slate-900/90 rounded-xl p-2.5 border border-slate-800 text-xs">
                  <div className="flex items-center justify-between font-bold mb-1">
                    <span className="text-slate-400">Risk & Verification Meter:</span>
                    <span className="text-emerald-400">Risk: LOW - Routine Match</span>
                  </div>
                  <p className="text-[11px] text-slate-400">{request.verificationDetails}</p>
                </div>

                {/* Action Buttons */}
                {request.status === 'pending' ? (
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => onApprove(request.id)}
                      className="flex-1 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-1.5"
                    >
                      <UserCheck className="w-4 h-4" /> APPROVE (Silent Delivery)
                    </button>
                    <button
                      onClick={() => onDeny(request.id)}
                      className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs shadow-lg shadow-red-600/20 flex items-center justify-center gap-1.5"
                    >
                      <UserX className="w-4 h-4" /> DENY
                    </button>
                  </div>
                ) : (
                  <div className="pt-2 text-xs font-bold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Decision Processed: {request.status.toUpperCase()}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Right Col: Gate Camera & Preferences */}
        <div className="space-y-4">
          {/* Live Gate Camera Feed Link */}
          <div className="glass-panel rounded-2xl p-4 border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-white flex items-center gap-2">
                <Video className="w-4 h-4 text-cyan-400" />
                Live Gate CCTV Feed
              </h4>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                Main Gate Barrier #1
              </span>
            </div>

            <div className="relative h-40 bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center group">
              <img
                src="https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?auto=format&fit=crop&w=400&q=80"
                alt="Gate CCTV"
                className="w-full h-full object-cover opacity-70 group-hover:scale-105 transition-transform"
              />
              <div className="absolute bottom-2 left-2 text-[10px] bg-slate-950/80 px-2 py-0.5 rounded text-cyan-300 font-mono">
                ANPR License Scanner Active
              </div>
            </div>
          </div>

          {/* Silent Delivery Preferences Toggle */}
          <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase">RESIDENT PRIVACY & PREFERENCES</h4>

            <div className="flex items-center justify-between bg-slate-900/80 p-3 rounded-xl border border-slate-800">
              <div>
                <div className="text-xs font-bold text-white">Silent Delivery Approvals</div>
                <div className="text-[11px] text-slate-400">Allow verified Amazon/Ekart couriers to lobby drop zone without ringing doorbell</div>
              </div>
              <input
                type="checkbox"
                checked={silentDeliveryActive}
                onChange={() => setSilentDeliveryActive(!silentDeliveryActive)}
                className="w-5 h-5 accent-cyan-400 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* QR Modal Simulation */}
      {qrModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel rounded-2xl max-w-sm w-full p-6 border border-slate-700 text-center space-y-4">
            <h3 className="text-lg font-bold text-white">Pre-Approved Guest Entry Pass</h3>
            <p className="text-xs text-slate-400">Share this dynamic QR code with expected guests or family for seamless gate entry.</p>

            <div className="w-44 h-44 bg-white p-3 rounded-2xl mx-auto flex items-center justify-center shadow-xl">
              <QrCode className="w-36 h-36 text-slate-950" />
            </div>

            <div className="text-xs font-bold text-cyan-400 font-mono">PASS CODE: CB-GUEST-9942</div>

            <button
              onClick={() => setQrModalOpen(false)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
            >
              Close Pass
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
