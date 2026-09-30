import React, { useState } from 'react';
import { ShieldCheck, Star, Lock, Award, CheckCircle2, UserCheck, Coins } from 'lucide-react';
import { getTranslation } from '../../utils/i18n';
import { initialTrustData, initialEscrowItems, type TrustScoreItem, type EscrowDepositItem } from '../../data/mockData';

interface CommunityTrustProps {
  currentLang?: string;
}

export const CommunityTrust: React.FC<CommunityTrustProps> = ({ currentLang = 'en' }) => {
  const [trustScores] = useState<TrustScoreItem[]>(initialTrustData);
  const [escrowItems, setEscrowItems] = useState<EscrowDepositItem[]>(initialEscrowItems);
  const [activeTab, setActiveTab] = useState<'score' | 'escrow' | 'rate'>('score');

  // Rating Modal state
  const [ratingCategory, setRatingCategory] = useState<string>('Neighborliness');
  const [ratingStars, setRatingStars] = useState<number>(5);
  const [ratingNote, setRatingNote] = useState<string>('');
  const [ratingSubmitted, setRatingSubmitted] = useState<boolean>(false);

  const myTrust = trustScores[0];

  const handleReleaseEscrow = (id: string) => {
    setEscrowItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'RELEASED' } : item))
    );
  };

  const handleRatingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRatingSubmitted(true);
    setTimeout(() => {
      setRatingSubmitted(false);
      setRatingNote('');
    }, 3000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="glass-panel p-6 rounded-2xl bg-gradient-to-r from-emerald-900/30 via-slate-900 to-indigo-900/30 border border-emerald-500/30">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
              <ShieldCheck className="w-8 h-8 shrink-0" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {getTranslation(currentLang, 'trustTitle') || '14. Community Trust & Escrow Engine'}
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 font-semibold border border-emerald-500/30">
                  Feature 14 • Verified Security
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                {getTranslation(currentLang, 'trustSubtitle') || 'Zero-Knowledge private resident ratings & locked smart escrow deposits for tools & services.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-900/80 p-1.5 rounded-xl border border-slate-800 shrink-0">
            <button
              onClick={() => setActiveTab('score')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'score' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Trust Score
            </button>
            <button
              onClick={() => setActiveTab('escrow')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'escrow' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Escrow Vault ({escrowItems.filter((i) => i.status === 'HEDGED').length})
            </button>
            <button
              onClick={() => setActiveTab('rate')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'rate' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Private Review
            </button>
          </div>
        </div>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'score' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* My Trust Card */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500 shrink-0" />
                My Resident Trust Score
              </h3>
              <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                {myTrust.tier} Member
              </span>
            </div>

            <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-2">
              <div className="relative w-28 h-28 flex items-center justify-center rounded-full bg-gradient-to-tr from-emerald-500 to-cyan-500 p-1 shadow-lg shadow-emerald-500/20">
                <div className="w-full h-full rounded-full bg-slate-950 flex flex-col items-center justify-center">
                  <span className="text-3xl font-black text-white">{myTrust.trustScore}</span>
                  <span className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider">/ 100 PTS</span>
                </div>
              </div>
              <p className="text-xs font-semibold text-slate-300 pt-2">{myTrust.residentName} ({myTrust.unit})</p>
              <div className="flex items-center gap-1 text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
                ))}
                <span className="text-xs text-slate-400 ml-1">({myTrust.totalRatings} Reviews)</span>
              </div>
            </div>

            {/* Badges Earned */}
            <div>
              <h4 className="text-xs font-semibold text-slate-400 mb-2">Verified Achievement Badges</h4>
              <div className="flex flex-wrap gap-2">
                {myTrust.badges.map((badge, idx) => (
                  <span key={idx} className="px-2.5 py-1 rounded-xl text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3 h-3 shrink-0" />
                    {badge}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>Identity verified via ANPR & Registry proof.</span>
            </div>
          </div>

          {/* Leaderboard & Trust Rules */}
          <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                Community Trust Index
              </h3>
              <span className="text-xs text-slate-400">Zero-Knowledge Encrypted</span>
            </div>

            <div className="space-y-3">
              {trustScores.map((item) => (
                <div key={item.id} className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-indigo-600 flex items-center justify-center font-bold text-white text-sm">
                      {item.residentName.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        {item.residentName}
                        {item.verifiedOwner && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">Verified</span>
                        )}
                      </h4>
                      <p className="text-xs text-slate-400">{item.unit} • {item.onTimeReturns} Successful Tool Returns</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-base font-extrabold text-emerald-400">{item.trustScore} / 100</div>
                    <div className="text-xs text-amber-400 font-semibold">{item.tier}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* How Trust Works */}
            <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/20 space-y-2">
              <h4 className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 shrink-0" />
                How Privacy-First Trust Scoring Works
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Ratings are aggregated anonymously. Neighbors rate punctuality on tool sharing, noise adherence, and parking discipline without exposing personal identity or comments publicly.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Escrow Vault Tab */}
      {activeTab === 'escrow' && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Coins className="w-4 h-4 text-emerald-400 shrink-0" />
                P-Coins Smart Escrow Protection
              </h3>
              <p className="text-xs text-slate-400">Security deposits held safely in escrow until borrowed tools are returned undamaged.</p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Active Smart Contract
            </span>
          </div>

          <div className="space-y-4">
            {escrowItems.map((item) => (
              <div key={item.id} className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">{item.itemName}</span>
                    {item.status === 'HEDGED' ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                        <Lock className="w-3 h-3 shrink-0" /> LOCKED IN ESCROW
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 shrink-0" /> RELEASED TO OWNER
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">Borrower: {item.borrower} • Owner: {item.owner}</p>
                  <p className="text-[11px] text-slate-500">Window: {item.startDate} → Due: {item.dueDate}</p>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block">Locked Deposit</span>
                    <span className="text-lg font-black text-amber-400 flex items-center gap-1">
                      <Coins className="w-4 h-4 shrink-0" /> {item.depositAmountPCoins} P-Coins
                    </span>
                  </div>

                  {item.status === 'HEDGED' && (
                    <button
                      onClick={() => handleReleaseEscrow(item.id)}
                      className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition-all shrink-0 flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4 shrink-0" /> Verify & Release
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Private Review Tab */}
      {activeTab === 'rate' && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-2xl mx-auto space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-cyan-400 shrink-0" />
              Submit Private Encrypted Rating
            </h3>
            <p className="text-xs text-slate-400">Your feedback is cryptographically anonymized to maintain community harmony.</p>
          </div>

          {ratingSubmitted ? (
            <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
              <h4 className="text-sm font-bold text-emerald-300">Rating Encrypted & Submitted!</h4>
              <p className="text-xs text-slate-400">Thank you for contributing to society trust and safety.</p>
            </div>
          ) : (
            <form onSubmit={handleRatingSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">Rating Category</label>
                <select
                  value={ratingCategory}
                  onChange={(e) => setRatingCategory(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white outline-none"
                >
                  <option value="Neighborliness">Tool Return & Care</option>
                  <option value="Noise Adherence">Quiet Hours Adherence</option>
                  <option value="Parking Discipline">Parking Discipline</option>
                  <option value="Gate Verification">Gate Visitor Courtesy</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">Star Rating</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRatingStars(star)}
                      className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 transition-all"
                    >
                      <Star className={`w-5 h-5 ${star <= ratingStars ? 'fill-amber-400 text-amber-400' : 'text-slate-600'}`} />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-amber-400 ml-2">{ratingStars} / 5 Stars</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">Private Note (Optional)</label>
                <textarea
                  rows={3}
                  value={ratingNote}
                  onChange={(e) => setRatingNote(e.target.value)}
                  placeholder="Details remain private to AI Trust Engine..."
                  className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white outline-none resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-bold text-xs shadow-md hover:from-emerald-400 hover:to-cyan-400 transition-all"
              >
                Submit Anonymized Rating
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
};
