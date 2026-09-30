import React, { useState } from 'react';
import {
  Share2,
  Clock,
  Coins,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';
import type { ResourceItem } from '../../data/mockData';

interface ResourceSharingProps {
  resources: ResourceItem[];
  onRequestResource: (id: string) => void;
}

export const ResourceSharing: React.FC<ResourceSharingProps> = ({
  resources,
  onRequestResource
}) => {
  const [selectedItem, setSelectedItem] = useState<ResourceItem | null>(null);
  const [borrowModalOpen, setBorrowModalOpen] = useState<boolean>(false);

  const handleOpenBorrow = (item: ResourceItem) => {
    setSelectedItem(item);
    setBorrowModalOpen(true);
  };

  const handleConfirmRequest = () => {
    if (!selectedItem) return;
    onRequestResource(selectedItem.id);
    setBorrowModalOpen(false);
    alert(`Request sent to ${selectedItem.ownerUnit}! ${selectedItem.depositCredits} Credits reserved in escrow.`);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold mb-2">
              <Share2 className="w-3.5 h-3.5" />
              FEATURES 13 & 14: RESOURCE SHARING & COMMUNITY TRUST ESCROW
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Tools Sharing (Ladder, Drill) & Private Escrow Trust
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Borrow household tools directly from neighbors with 100% refundable escrow deposits and private 1-to-1 ratings. Zero public shaming or public credit scores.
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-700/80 rounded-xl p-3 text-right">
            <div className="text-xs text-slate-400 font-bold uppercase">Community Escrow</div>
            <div className="text-sm font-extrabold text-emerald-400 flex items-center gap-1 justify-end">
              <ShieldCheck className="w-4 h-4" /> 100% Refundable Escrow
            </div>
            <p className="text-[11px] text-slate-400">Zero public shaming scores</p>
          </div>
        </div>
      </div>

      {/* Feature 14: Community Trust & Private Escrow Panel */}
      <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-3">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          Feature 14: Private Rating & Refundable Escrow Ledger
        </h3>
        <p className="text-xs text-slate-400">
          Escrow deposit credits are held securely during the borrow window and automatically released back to your wallet upon confirmed return of undamaged tools (e.g. extension ladder, heavy drill).
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-xs">
            <div className="text-slate-400">Active Escrow Lock:</div>
            <div className="text-lg font-black text-amber-400 mt-0.5">250 Credits Locked</div>
            <div className="text-[10px] text-emerald-400">Auto-refund on return</div>
          </div>
          <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-xs">
            <div className="text-slate-400">Private Lender Feedback:</div>
            <div className="text-lg font-black text-cyan-400 mt-0.5">5.0 ★★★★★ (Clean)</div>
            <div className="text-[10px] text-slate-400">100% Private 1-to-1 Rating</div>
          </div>
          <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-xs">
            <div className="text-slate-400">Escrow Dispute Protection:</div>
            <div className="text-lg font-black text-emerald-400 mt-0.5">Zero Disputes</div>
            <div className="text-[10px] text-slate-400">AI Verified Photo Receipt</div>
          </div>
        </div>
      </div>


      {/* Resource Marketplace Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {resources.map((item) => (
          <div key={item.id} className="glass-panel rounded-2xl p-5 border border-slate-800 flex flex-col justify-between group">
            <div>
              {/* Image */}
              <div className="relative h-40 rounded-xl overflow-hidden mb-3 border border-slate-800">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded bg-slate-950/80 text-cyan-300 border border-cyan-500/30">
                  {item.category}
                </span>
                <span className="absolute bottom-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {item.status.toUpperCase()}
                </span>
              </div>

              <h4 className="text-base font-extrabold text-white">{item.title}</h4>
              <div className="text-xs text-slate-400 mt-0.5">Lender: <strong className="text-slate-200">{item.ownerUnit}</strong></div>

              <div className="bg-slate-900/90 rounded-xl p-3 border border-slate-800 mt-3 space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-cyan-400" /> Available Window:</span>
                  <span className="font-bold text-cyan-400">{item.availableWindow}</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="flex items-center gap-1"><Coins className="w-3.5 h-3.5 text-amber-400" /> Escrow Deposit:</span>
                  <span className="font-bold text-amber-400">{item.depositCredits} Credits</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => handleOpenBorrow(item)}
              disabled={item.status !== 'available'}
              className="mt-4 w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-950 font-extrabold text-xs shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
            >
              Request Borrow Slot <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Borrow Request Modal */}
      {borrowModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel rounded-2xl max-w-md w-full p-6 border border-slate-700 space-y-4">
            <h3 className="text-lg font-bold text-white">Borrow Request Voucher</h3>

            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-xs space-y-2">
              <div className="text-sm font-extrabold text-cyan-400">{selectedItem.title}</div>
              <div className="text-slate-300">Lender: {selectedItem.ownerUnit}</div>
              <div className="text-slate-300">Window: {selectedItem.availableWindow}</div>
              <div className="text-amber-400 font-bold">Escrow Deposit: {selectedItem.depositCredits} Community Credits (Auto-Refunded upon clean return)</div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleConfirmRequest}
                className="flex-1 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs"
              >
                Confirm Borrow Request
              </button>
              <button
                onClick={() => setBorrowModalOpen(false)}
                className="py-2.5 px-4 rounded-xl bg-slate-800 text-white font-bold text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
