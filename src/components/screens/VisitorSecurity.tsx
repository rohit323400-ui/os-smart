import React, { useState } from 'react';
import {
  ShieldCheck,
  UserCheck,
  UserX,
  QrCode,
  Video,
  CheckCircle2,
  KeyRound,
  AlertCircle,
  Copy,
  Check,
  Clock
} from 'lucide-react';
import type { VisitorRequest } from '../../data/mockData';

interface VisitorSecurityProps {
  requests: VisitorRequest[];
  onApprove: (id: string) => void;
  onDeny: (id: string) => void;
  onCreatePass?: (params: { visitorName: string; unitNumber: string; category: string; phone?: string }) => Promise<any>;
  onVerifyGatePass?: (otpCode: string, unitNumber?: string) => Promise<any>;
  userRole?: string;
  currentUserFlat?: string;
}

export const VisitorSecurity: React.FC<VisitorSecurityProps> = ({
  requests,
  onApprove,
  onDeny,
  onCreatePass,
  onVerifyGatePass,
  userRole = 'Resident',
  currentUserFlat = 'A-101'
}) => {
  const [silentDeliveryActive, setSilentDeliveryActive] = useState<boolean>(true);
  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);

  // Create Pass Form State
  const [visitorName, setVisitorName] = useState<string>('');
  const [unitNumber, setUnitNumber] = useState<string>(currentUserFlat || 'A-101');
  const [category, setCategory] = useState<string>('Guest');
  const [phone, setPhone] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [generatedPass, setGeneratedPass] = useState<{ code: string; validUntil: string } | null>(null);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // Gate Verification State (For Security Guards / Gate Desk)
  const [verifyOtp, setVerifyOtp] = useState<string>('');
  const [verifyUnit, setVerifyUnit] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verifyFeedback, setVerifyFeedback] = useState<{ success: boolean; message: string } | null>(null);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitorName.trim() || !unitNumber.trim() || !onCreatePass) return;

    setIsSubmitting(true);
    try {
      const res = await onCreatePass({
        visitorName: visitorName.trim(),
        unitNumber: unitNumber.trim(),
        category,
        phone: phone.trim() || undefined
      });

      if (res && res.success && res.oneTimePasscode) {
        setGeneratedPass({
          code: res.oneTimePasscode,
          validUntil: res.validUntil || 'Valid for 6 hours'
        });
      } else {
        alert(res?.error || 'Failed to generate visitor pass.');
      }
    } catch (err: any) {
      alert('Error generating visitor pass: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGateVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyOtp.trim() || !onVerifyGatePass) return;

    setIsVerifying(true);
    setVerifyFeedback(null);
    try {
      const res = await onVerifyGatePass(verifyOtp.trim(), verifyUnit.trim() || undefined);
      if (res && res.success) {
        setVerifyFeedback({
          success: true,
          message: res.message || 'Pass verified successfully! Access granted.'
        });
        setVerifyOtp('');
        setVerifyUnit('');
      } else {
        setVerifyFeedback({
          success: false,
          message: res?.error || 'Invalid passcode or expired pass.'
        });
      }
    } catch {
      setVerifyFeedback({
        success: false,
        message: 'Network error verifying pass.'
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-200 dark:border-slate-800 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-700 dark:text-cyan-400 text-xs font-semibold mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              SMART SECURITY & VISITOR ACCESS SYSTEM
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Cryptographic Gate Verification & One-Time Passcodes
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
              Zero plaintext OTP storage. SHA-256 hashed gate passes, automatic carrier SMS dispatch, 5-attempt brute-force protection, and strict one-time check-in invalidation.
            </p>
          </div>

          {/* Create Pre-Approved Guest Pass Button */}
          <button
            onClick={() => {
              setGeneratedPass(null);
              setVisitorName('');
              setPhone('');
              setCreateModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-extrabold text-xs shadow-lg shadow-cyan-500/20 flex items-center gap-2 hover:opacity-95 transition-opacity cursor-pointer shrink-0"
          >
            <QrCode className="w-4 h-4" /> Create One-Time Visitor Pass
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Active Visitor Requests Cards */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
              Active Visitor Passes & Requests ({requests.length})
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {userRole === 'Resident' ? 'Showing Your Flat Visitors' : 'Showing Society Gate Stream'}
            </span>
          </div>

          {requests.length === 0 ? (
            <div className="glass-panel rounded-2xl p-10 border border-slate-200 dark:border-slate-800 text-center space-y-2">
              <ShieldCheck className="w-10 h-10 text-slate-400 mx-auto opacity-40" />
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">No active visitor passes currently recorded.</p>
              <p className="text-xs text-slate-500">Create a one-time pass above for expected guests, deliveries, or cabs.</p>
            </div>
          ) : (
            requests.map((request) => (
              <div
                key={request.id}
                className="glass-panel rounded-2xl p-5 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center gap-5 relative overflow-hidden"
              >
                {/* Avatar / Category Badge */}
                <div className="relative w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-900 border-2 border-cyan-500/40 flex flex-col items-center justify-center shrink-0">
                  <UserCheck className="w-8 h-8 text-cyan-600 dark:text-cyan-400" />
                  <span className="mt-1 text-[9px] font-black bg-cyan-500 text-slate-950 px-1.5 py-0.2 rounded uppercase">
                    {request.category}
                  </span>
                </div>

                {/* Request Info */}
                <div className="flex-1 space-y-1.5 text-center sm:text-left w-full">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <h4 className="text-base font-extrabold text-slate-900 dark:text-white">{request.name}</h4>
                    <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 justify-center sm:justify-start">
                      <Clock className="w-3 h-3" /> {request.timestamp}
                    </span>
                  </div>

                  <div className="text-xs text-cyan-700 dark:text-cyan-300 font-semibold">{request.company}</div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-slate-300">
                    <span>Flat / Unit: <strong className="text-slate-900 dark:text-white">{request.targetFlat}</strong></span>
                    {request.vehiclePlate && request.vehiclePlate !== '--' && (
                      <span>Vehicle: <code className="bg-slate-200 dark:bg-slate-900 px-1.5 py-0.5 rounded text-cyan-600 dark:text-cyan-400">{request.vehiclePlate}</code></span>
                    )}
                  </div>

                  {/* Status & Verification Details */}
                  <div className="bg-slate-100 dark:bg-slate-900/90 rounded-xl p-2.5 border border-slate-200 dark:border-slate-800 text-xs flex items-center justify-between">
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 font-medium">Status: </span>
                      <span className={`font-black uppercase ${
                        request.status === 'approved' || request.status === 'CHECKED_IN' ? 'text-emerald-600 dark:text-emerald-400' :
                        request.status === 'denied' ? 'text-red-500' : 'text-amber-500'
                      }`}>
                        {request.status}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">One-Time Hashed Pass</span>
                  </div>

                  {/* Action Buttons */}
                  {request.status === 'pending' && (
                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={() => onApprove(request.id)}
                        className="flex-1 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <UserCheck className="w-4 h-4" /> APPROVE ENTRY
                      </button>
                      <button
                        onClick={() => onDeny(request.id)}
                        className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <UserX className="w-4 h-4" /> DENY
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right Col: Gate Check-in Panel & Live Camera */}
        <div className="space-y-4">
          {/* Gate Verification Panel (Security Guard / Gate Desk) */}
          <div className="glass-panel rounded-2xl p-5 border-2 border-cyan-500/50 shadow-xl space-y-4">
            <div className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
              <h4 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wide">
                Security Gate Verification
              </h4>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Verify 6-digit visitor OTP code presented at the security barrier. Passcode is SHA-256 validated and immediately invalidated upon entry.
            </p>

            <form onSubmit={handleGateVerify} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                  6-Digit OTP Passcode *
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  placeholder="e.g. 849201"
                  value={verifyOtp}
                  onChange={(e) => setVerifyOtp(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-center font-mono text-lg font-bold tracking-widest focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                  Destination Flat / Unit (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. A-101"
                  value={verifyUnit}
                  onChange={(e) => setVerifyUnit(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-cyan-500"
                />
              </div>

              {verifyFeedback && (
                <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                  verifyFeedback.success
                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
                    : 'bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400'
                }`}>
                  {verifyFeedback.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                  <span>{verifyFeedback.message}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isVerifying || verifyOtp.length < 6}
                className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isVerifying ? 'Verifying with SHA-256...' : 'Verify & Grant Gate Entry'}
              </button>
            </form>
          </div>

          {/* Live Gate Camera Feed Link */}
          <div className="glass-panel rounded-2xl p-4 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Video className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                Live Gate CCTV Feed
              </h4>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-500/30">
                Gate 1 Active
              </span>
            </div>

            <div className="relative h-36 bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center group">
              <img
                src="https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?auto=format&fit=crop&w=400&q=80"
                alt="Gate CCTV"
                className="w-full h-full object-cover opacity-70 group-hover:scale-105 transition-transform"
              />
              <div className="absolute bottom-2 left-2 text-[10px] bg-slate-950/80 px-2 py-0.5 rounded text-cyan-300 font-mono">
                Gate Barrier Camera Online
              </div>
            </div>
          </div>

          {/* Silent Delivery Preferences Toggle */}
          <div className="glass-panel rounded-2xl p-4 border border-slate-200 dark:border-slate-800 space-y-2">
            <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Preferences</h4>
            <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-900/80 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">Silent Delivery Approvals</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">Allow verified Amazon/Ekart couriers to lobby drop zone</div>
              </div>
              <input
                type="checkbox"
                checked={silentDeliveryActive}
                onChange={() => setSilentDeliveryActive(!silentDeliveryActive)}
                className="w-4 h-4 accent-cyan-400 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Create Visitor Pass Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <QrCode className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                Issue One-Time Visitor Pass
              </h3>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            {generatedPass ? (
              <div className="text-center space-y-4 py-2">
                <div className="w-14 h-14 bg-emerald-500/20 border border-emerald-500/40 rounded-full flex items-center justify-center mx-auto text-emerald-500">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">Passcode Generated!</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Share this code with your visitor. Valid for 6 hours.
                  </p>
                </div>

                <div className="bg-slate-100 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <span className="text-2xl font-mono font-black text-cyan-600 dark:text-cyan-400 tracking-widest">
                    {generatedPass.code}
                  </span>
                  <button
                    onClick={() => copyToClipboard(generatedPass.code)}
                    className="p-2 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1 text-xs font-bold cursor-pointer"
                  >
                    {copiedCode ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  🛡️ Security Note: The passcode is hashed with SHA-256 before being stored in the database. Plaintext code is never saved.
                </p>

                <button
                  onClick={() => setCreateModalOpen(false)}
                  className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs cursor-pointer"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateSubmit} className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Visitor Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Kumar"
                    value={visitorName}
                    onChange={(e) => setVisitorName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Flat / Unit *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. A-101"
                      value={unitNumber}
                      onChange={(e) => setUnitNumber(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:border-cyan-500"
                    >
                      <option value="Guest">Guest</option>
                      <option value="Delivery">Delivery</option>
                      <option value="Service">Service / Tech</option>
                      <option value="Cab">Cab / Taxi</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Visitor Phone Number (Optional SMS Dispatch)
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. +91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:border-cyan-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    If configured with SMS_API_KEY, pass is sent via SMS automatically.
                  </span>
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setCreateModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-300 dark:hover:bg-slate-700 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-bold text-xs shadow-md disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? 'Generating Pass...' : 'Generate Hashed Pass'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
