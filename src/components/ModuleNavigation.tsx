import React, { useRef } from 'react';
import {
  LayoutDashboard,
  Cpu,
  Car,
  Droplets,
  Flame,
  ShieldCheck,
  Wrench,
  ArrowUpDown,
  Trash2,
  Volume2,
  Share2,
  Lock,
  ClipboardList,
  Zap,
  Award,
  Bell,
  ChevronLeft,
  ChevronRight,
  LifeBuoy
} from 'lucide-react';
import { isTabAllowed, type UserRole } from '../utils/rbac';
import { getTranslation } from '../utils/i18n';

export type ModuleTab =
  | 'home'
  | 'architecture'
  | 'parking'
  | 'water'
  | 'water-leakage'
  | 'lighting'
  | 'fire'
  | 'lift'
  | 'security'
  | 'waste'
  | 'maintenance'
  | 'noise'
  | 'resource'
  | 'trust'
  | 'guest-parking'
  | 'actionlog'
  | 'privacy'
  | 'notifications'
  | 'settings';

interface ModuleNavigationProps {
  activeTab: ModuleTab;
  onSelectTab: (tab: ModuleTab) => void;
  userRole: UserRole;
  currentLang: string;
  hasWaterAlert?: boolean;
  hasFireAlert?: boolean;
  hasLiftAlert?: boolean;
}

export const ModuleNavigation: React.FC<ModuleNavigationProps> = ({
  activeTab,
  onSelectTab,
  userRole,
  currentLang,
  hasWaterAlert,
  hasFireAlert,
  hasLiftAlert
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Complete list of all 18 features!
  const allTabs: {
    id: ModuleTab;
    numberStr: string;
    labelKey: string;
    icon: React.FC<{ className?: string }>;
    badge?: string;
    alert?: boolean;
  }[] = [
    { id: 'home', numberStr: '01', labelKey: 'home', icon: LayoutDashboard },
    { id: 'architecture', numberStr: '02', labelKey: 'architecture', icon: Cpu },
    { id: 'parking', numberStr: '03', labelKey: 'parking', icon: Car, badge: 'P-Coins' },
    { id: 'water', numberStr: '04', labelKey: 'water', icon: Droplets },
    { id: 'water-leakage', numberStr: '05', labelKey: 'waterLeakage', icon: LifeBuoy, alert: hasWaterAlert, badge: 'V-102' },
    { id: 'lighting', numberStr: '06', labelKey: 'lighting', icon: Zap, badge: 'PIR' },
    { id: 'fire', numberStr: '07', labelKey: 'fire', icon: Flame, alert: hasFireAlert },
    { id: 'lift', numberStr: '08', labelKey: 'lift', icon: ArrowUpDown, alert: hasLiftAlert },
    { id: 'security', numberStr: '09', labelKey: 'security', icon: ShieldCheck, badge: '1 Pass' },
    { id: 'waste', numberStr: '10', labelKey: 'waste', icon: Trash2, badge: '89%' },
    { id: 'maintenance', numberStr: '11', labelKey: 'maintenance', icon: Wrench, badge: 'NLP' },
    { id: 'noise', numberStr: '12', labelKey: 'noise', icon: Volume2, badge: 'dB' },
    { id: 'resource', numberStr: '13', labelKey: 'resource', icon: Share2, badge: 'Tools' },
    { id: 'trust', numberStr: '14', labelKey: 'trust', icon: Award, badge: 'Escrow' },
    { id: 'guest-parking', numberStr: '15', labelKey: 'guestParking', icon: Car, badge: 'Guest' },
    { id: 'actionlog', numberStr: '16', labelKey: 'actionlog', icon: ClipboardList, badge: 'Audit' },
    { id: 'privacy', numberStr: '17', labelKey: 'privacy', icon: Lock },
    { id: 'notifications', numberStr: '18', labelKey: 'notifications', icon: Bell, badge: '3-Layer' }
  ];

  const visibleTabs = allTabs.filter((t) => isTabAllowed(userRole, t.id));

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -280, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 280, behavior: 'smooth' });
    }
  };

  return (
    <div className="bg-white/95 dark:bg-[#0b0f19]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/80 sticky top-0 z-30 shadow-sm transition-colors">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-2 flex items-center gap-1.5 relative group">
        
        {/* Left Carousel Scroll Button */}
        <button
          onClick={scrollLeft}
          className="flex items-center justify-center p-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-white shadow-md shrink-0 z-10 transition-all cursor-pointer"
          title="Scroll Left"
        >
          <ChevronLeft className="w-4 h-4 shrink-0" />
        </button>

        {/* Horizontal Scrollable Container */}
        <div
          ref={scrollContainerRef}
          className="flex-1 flex items-center gap-1.5 overflow-x-auto scrollbar-none scroll-smooth py-1 px-1"
        >
          {visibleTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`relative px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-2 border shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-cyan-500/10 dark:bg-gradient-to-r dark:from-cyan-500/20 dark:to-indigo-500/20 text-cyan-700 dark:text-cyan-300 border-cyan-500/40 shadow-sm scale-105'
                    : 'bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <span className={`text-[10px] font-mono px-1 py-0.2 rounded font-bold ${
                  isActive ? 'bg-cyan-500/20 text-cyan-700 dark:text-cyan-300' : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                }`}>
                  {tab.numberStr}
                </span>

                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-500 dark:text-slate-400'}`} />
                <span className="shrink-0">{getTranslation(currentLang, tab.labelKey)}</span>

                {tab.alert && (
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping shrink-0" title="Active Alert!" />
                )}

                {tab.badge && !tab.alert && (
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold shrink-0 ${
                      isActive
                        ? 'bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Right Carousel Scroll Button */}
        <button
          onClick={scrollRight}
          className="flex items-center justify-center p-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-white shadow-md shrink-0 z-10 transition-all cursor-pointer"
          title="Scroll Right"
        >
          <ChevronRight className="w-4 h-4 shrink-0" />
        </button>

      </div>
    </div>
  );
};
