import React from 'react';
import {
  UserCheck,
  Bell,
  User,
  Sun,
  Moon,
  Globe,
  Settings
} from 'lucide-react';

import { type UserProfileData } from './AuthModal';
import { SUPPORTED_LANGUAGES, getTranslation } from '../utils/i18n';

interface HeaderProps {
  systemState: 'STABLE' | 'ATTENTION' | 'EMERGENCY';
  userRole: 'Resident' | 'Facility Admin' | 'Security Guard' | 'Maintenance Tech';
  onSelectRole: (role: 'Resident' | 'Facility Admin' | 'Security Guard' | 'Maintenance Tech') => void;
  onOpenNotifications: () => void;
  notificationCount: number;
  currentUser: UserProfileData | null;
  onOpenAuthModal: () => void;
  onOpenProfileModal: () => void;
  onOpenSettings?: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  currentLang: string;
  onChangeLang: (lang: string) => void;
  isBackendConnected?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  systemState,
  userRole,
  onSelectRole,
  onOpenNotifications,
  notificationCount,
  currentUser,
  onOpenAuthModal,
  onOpenProfileModal,
  onOpenSettings,
  theme,
  onToggleTheme,
  currentLang,
  onChangeLang,
  isBackendConnected
}) => {
  return (
    <header className="bg-white/95 dark:bg-[#0b0f19]/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/80 px-4 py-3 shadow-md transition-colors z-40">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-4">
        
        {/* Left: Official RAAH NAGAR Logo Branding */}
        <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-start shrink-0">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="RAAH NAGAR Logo"
              className="w-10 h-10 object-contain rounded-xl border border-cyan-500/30 shadow-md shadow-cyan-500/20 bg-slate-950 p-0.5 shrink-0"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5 whitespace-nowrap">
                  {getTranslation(currentLang, 'appTitle')}
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 flex items-center gap-1 shrink-0">
                    <span className={`w-1.5 h-1.5 rounded-full ${isBackendConnected ? 'bg-emerald-500 dark:bg-emerald-400 animate-pulse' : 'bg-amber-500 dark:bg-amber-400'}`} />
                    {isBackendConnected ? 'LIVE BACKEND' : 'LOCAL OS'}
                  </span>
                </h1>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium hidden sm:block">
                {getTranslation(currentLang, 'appSubtitle')}
              </p>
            </div>
          </div>
        </div>

        {/* Middle: Real-Time Operational Infrastructure Health Display */}
        <div className="flex items-center gap-2.5 py-1.5 px-3.5 rounded-xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-xs shrink-0">
          <div className="flex items-center gap-2">
            {systemState === 'STABLE' && (
              <>
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-bold text-emerald-700 dark:text-emerald-400">COMMUNITY OS NOMINAL</span>
                <span className="text-slate-400 dark:text-slate-500">•</span>
                <span className="text-slate-600 dark:text-slate-400 hidden sm:inline">All Hardware Subsystems Secured</span>
              </>
            )}
            {systemState === 'ATTENTION' && (
              <>
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                <span className="font-bold text-amber-700 dark:text-amber-400">ACTION PENDING</span>
                <span className="text-slate-400 dark:text-slate-500">•</span>
                <span className="text-slate-600 dark:text-slate-400 hidden sm:inline">Operator Verification Required</span>
              </>
            )}
            {systemState === 'EMERGENCY' && (
              <>
                <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                <span className="font-bold text-red-600 dark:text-red-400">CRITICAL EMERGENCY REPORTED</span>
              </>
            )}
          </div>
        </div>

        {/* Right: Controls, User Account & Settings (Fully Scrollable on Mobile) */}
        <div className="flex items-center gap-2 w-full lg:w-auto justify-start lg:justify-end overflow-x-auto scrollbar-none py-1 flex-nowrap shrink-0">
          
          {/* System Status Indicator Badge */}
          <div className="hidden xl:flex items-center gap-2 px-2.5 py-1.5 rounded-xl border text-xs font-semibold bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 shrink-0">
            {systemState === 'STABLE' && (
              <>
                <div className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse shrink-0" />
                <span className="text-emerald-700 dark:text-emerald-400 font-medium">System: Stable</span>
              </>
            )}
            {systemState === 'ATTENTION' && (
              <>
                <div className="w-2 h-2 rounded-full bg-amber-500 dark:bg-amber-400 animate-pulse shrink-0" />
                <span className="text-amber-700 dark:text-amber-400 font-medium">Attention Req.</span>
              </>
            )}
            {systemState === 'EMERGENCY' && (
              <>
                <div className="w-2 h-2 rounded-full bg-red-500 animate-ping shrink-0" />
                <span className="text-red-700 dark:text-red-400 font-bold">EMERGENCY</span>
              </>
            )}
          </div>
          
          {/* 20-Language Selector */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2 py-1.5 text-xs text-slate-700 dark:text-slate-300 shrink-0">
            <Globe className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" />
            <select
              value={currentLang}
              onChange={(e) => onChangeLang(e.target.value)}
              className="bg-transparent text-slate-900 dark:text-white font-medium outline-none cursor-pointer text-xs"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                  {lang.flag} {lang.nativeName} ({lang.name})
                </option>
              ))}
            </select>
          </div>

          {/* Dark / Light Theme Toggle */}
          <button
            onClick={onToggleTheme}
            className="p-1.5 sm:p-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-amber-500 dark:text-amber-400 hover:border-amber-500/40 transition-all shrink-0 cursor-pointer"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400 shrink-0" /> : <Moon className="w-4 h-4 text-indigo-600 shrink-0" />}
          </button>

          {/* Role Selector Dropdown */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2 py-1.5 text-xs text-slate-700 dark:text-slate-300 shrink-0">
            <UserCheck className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" />
            <select
              value={userRole}
              onChange={(e) => onSelectRole(e.target.value as any)}
              className="bg-transparent text-slate-900 dark:text-white font-semibold outline-none cursor-pointer text-xs"
            >
              <option value="Resident" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Resident</option>
              <option value="Facility Admin" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Facility Admin</option>
              <option value="Security Guard" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Security Guard</option>
              <option value="Maintenance Tech" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Maintenance Tech</option>
            </select>
          </div>

          {/* User Profile & Settings Pair (Positioned side by side) */}
          <div className="flex items-center gap-1.5 shrink-0">
            {currentUser ? (
              <button
                onClick={onOpenProfileModal}
                className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 hover:border-cyan-500/40 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-white transition-all shrink-0 cursor-pointer shadow-sm"
                title="View & Edit Profile"
              >
                <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center font-bold text-[9px] text-white shrink-0">
                  {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <span className="font-semibold text-xs whitespace-nowrap">{currentUser.name}</span>
              </button>
            ) : (
              <button
                onClick={onOpenAuthModal}
                className="flex items-center gap-1 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-semibold px-2.5 py-1.5 rounded-xl shadow-md shadow-cyan-500/20 transition-all shrink-0 cursor-pointer whitespace-nowrap"
              >
                <User className="w-3.5 h-3.5 shrink-0" />
                {getTranslation(currentLang, 'signInRegister')}
              </button>
            )}

            {/* SETTINGS BUTTON (Right next to Profile Box!) */}
            <button
              onClick={onOpenSettings}
              className="flex items-center gap-1 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 hover:border-cyan-400 rounded-xl px-2.5 py-1.5 text-xs font-bold transition-all shrink-0 cursor-pointer shadow-sm active:scale-95 whitespace-nowrap"
              title="System Settings"
            >
              <Settings className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" />
              <span>{getTranslation(currentLang, 'settings')}</span>
            </button>
          </div>

          {/* Notifications Bell Button */}
          <button
            onClick={onOpenNotifications}
            className="relative flex items-center justify-center p-1.5 sm:p-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:border-cyan-500/40 transition-all shrink-0 cursor-pointer"
            title="Notifications & Alerts"
          >
            <Bell className="w-4 h-4 shrink-0" />
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-cyan-500 text-slate-950 font-bold text-[10px] rounded-full flex items-center justify-center animate-pulse">
                {notificationCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
