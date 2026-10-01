import React, { useState } from 'react';
import { Car, QrCode, Navigation, ShieldCheck, Clock, MapPin, Plus } from 'lucide-react';
import { getTranslation } from '../../utils/i18n';
import { initialGuestPasses, type GuestPass } from '../../data/mockData';

interface GuestParkingProps {
  currentLang?: string;
}

export const GuestParking: React.FC<GuestParkingProps> = ({ currentLang = 'en' }) => {
  const [passes, setPasses] = useState<GuestPass[]>(initialGuestPasses);
  const [showModal, setShowModal] = useState<boolean>(false);

  // New Pass Form
  const [guestName, setGuestName] = useState<string>('');
  const [vehiclePlate, setVehiclePlate] = useState<string>('');
  const [validHours, setValidHours] = useState<string>('4');

  // Dynamic Routing Simulation State
  const [isRerouting, setIsRerouting] = useState<boolean>(false);

  const handleCreatePass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName || !vehiclePlate) return;

    const newPass: GuestPass = {
      id: `gp-${Date.now()}`,
      guestName,
      vehiclePlate,
      assignedSlot: `Slot G-0${Math.floor(Math.random() * 8) + 1} (Level B1)`,
      validityWindow: `${validHours} Hours Pass`,
      status: 'ACTIVE',
      invitingFlat: 'Unit C-402 (You)'
    };

    setPasses((prev) => [newPass, ...prev]);
    setGuestName('');
    setVehiclePlate('');
    setShowModal(false);
  };

  const handleTriggerReroute = (passId: string) => {
    setIsRerouting(true);
    setTimeout(() => {
      setPasses((prev) =>
        prev.map((p) =>
          p.id === passId
            ? { ...p, assignedSlot: 'Slot G-09 (Re-Routed Near Lift 2)', status: 'REROUTED' }
            : p
        )
      );
      setIsRerouting(false);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-2xl bg-gradient-to-r from-cyan-900/30 via-slate-900 to-indigo-900/30 border border-cyan-500/30">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
              <Car className="w-8 h-8 shrink-0" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {getTranslation(currentLang, 'guestParkingTitle') || '15. Guest Parking & AI Dynamic Re-Routing'}
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 font-semibold border border-cyan-500/30">
                  Feature 15 • Gate Sync
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                {getTranslation(currentLang, 'guestParkingSubtitle') || 'Instant digital QR guest passes with real-time automatic slot re-allocation if occupied.'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs shadow-md flex items-center gap-2 shrink-0 transition-all"
          >
            <Plus className="w-4 h-4 shrink-0" /> Generate Guest Pass
          </button>
        </div>
      </div>

      {/* Grid: Active Passes & Dynamic Routing Visualizer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Guest Passes List */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <QrCode className="w-4 h-4 text-cyan-400 shrink-0" />
              Active Visitor Parking Passes
            </h3>
            <span className="text-xs text-slate-400 font-medium">Auto-Synced with ANPR Gate</span>
          </div>

          <div className="space-y-4">
            {passes.map((pass) => (
              <div
                key={pass.id}
                className={`p-5 rounded-2xl border transition-all ${
                  pass.status === 'REROUTED'
                    ? 'bg-amber-500/10 border-amber-500/40'
                    : 'bg-slate-900/60 border-slate-800'
                }`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shrink-0">
                      <QrCode className="w-8 h-8" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-bold text-slate-900 dark:text-white">{pass.guestName}</h4>
                        {pass.status === 'REROUTED' ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                            <Navigation className="w-3 h-3 shrink-0 animate-bounce" /> AUTO REROUTED
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            ACTIVE PASS
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">Vehicle: {pass.vehiclePlate} • Invited by {pass.invitingFlat}</p>
                      <p className="text-xs font-semibold text-cyan-400 mt-1 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 shrink-0" /> Assigned: {pass.assignedSlot}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:items-end gap-2 w-full sm:w-auto">
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-500" /> {pass.validityWindow}
                    </span>

                    <button
                      onClick={() => handleTriggerReroute(pass.id)}
                      disabled={isRerouting}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-amber-400 font-semibold border border-amber-500/30 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Navigation className="w-3.5 h-3.5 shrink-0" />
                      Dynamic Slot Re-Allocation
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 2D Parking Floor Map & Dynamic Routing Status */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-6">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Navigation className="w-4 h-4 text-cyan-400 shrink-0" />
            2D Guest Zone Routing Grid
          </h3>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Gate 1 Entry</span>
              <span className="text-emerald-400 font-mono">ANPR Sensor: Active</span>
            </div>

            {/* 2D Guest Slot Grid */}
            <div className="grid grid-cols-3 gap-2 py-2">
              {['G-01', 'G-02', 'G-03', 'G-04', 'G-05', 'G-06'].map((slot) => {
                const isAssigned = passes.some((p) => p.assignedSlot.includes(slot));
                return (
                  <div
                    key={slot}
                    className={`p-3 rounded-xl text-center border text-xs font-bold transition-all ${
                      isAssigned
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm'
                        : 'bg-slate-900 text-slate-500 border-slate-800'
                    }`}
                  >
                    <div className="text-[10px] text-slate-400 font-normal">SLOT</div>
                    {slot}
                    <div className="text-[9px] mt-0.5 font-medium">{isAssigned ? 'RESERVED' : 'FREE'}</div>
                  </div>
                );
              })}
            </div>

            <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/20 text-xs text-slate-300 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <span>
                If a resident parks in a guest spot, AI detects ANPR camera conflict and sends direct SMS navigation map link to guest car screen.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Create Guest Pass Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Car className="w-5 h-5 text-cyan-400" />
                Issue Digital Guest Pass
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePass} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Guest Name / Purpose</label>
                <input
                  type="text"
                  required
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="e.g. Ramesh Verma (Family Guest)"
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Vehicle License Plate Number</label>
                <input
                  type="text"
                  required
                  value={vehiclePlate}
                  onChange={(e) => setVehiclePlate(e.target.value)}
                  placeholder="e.g. MH-12-AB-1234"
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white uppercase outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Pass Validity Window</label>
                <select
                  value={validHours}
                  onChange={(e) => setValidHours(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white outline-none"
                >
                  <option value="2">2 Hours</option>
                  <option value="4">4 Hours</option>
                  <option value="8">8 Hours</option>
                  <option value="24">Full Day (24 Hours)</option>
                </select>
              </div>

              <div className="pt-2 flex items-center gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md"
                >
                  Generate Pass & QR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
