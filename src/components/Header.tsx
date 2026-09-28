import React, { useState, useRef, useEffect } from 'react';
import {
  CalendarCheck2,
  Sparkles,
  RefreshCw,
  Plus,
  RotateCcw,
  LayoutDashboard,
  BookOpen,
  Calendar,
  BriefcaseMedical,
  BarChart3,
  Bot,
  User,
  LogOut,
  Settings,
  ChevronDown,
  Shield,
  Layers,
  Sun,
  Moon,
  Building2,
} from 'lucide-react';
import { StudentUser } from '../types/auth';

export type MainNavTab =
  | 'DASHBOARD'
  | 'FREE_CLASSROOMS'
  | 'MY_SUBJECTS'
  | 'TIMETABLE'
  | 'OD_SIMULATOR'
  | 'ANALYTICS'
  | 'ADVISOR';

interface HeaderProps {
  user: StudentUser;
  onAddSubject: () => void;
  onReset: () => void;
  onLoadDemo: () => void;
  onRecalculate: () => void;
  hasCustomData: boolean;
  activeTab: MainNavTab;
  onTabChange: (tab: MainNavTab) => void;
  onOpenProfile: () => void;
  onLogout: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onAddSubject,
  onReset,
  onLoadDemo,
  onRecalculate,
  hasCustomData,
  activeTab,
  onTabChange,
  onOpenProfile,
  onLogout,
  isDarkMode,
  onToggleDarkMode,
}) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-30 shadow-xs transition-colors">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-3">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-blue-700 flex items-center justify-center text-white shadow-md shadow-indigo-100 dark:shadow-none flex-shrink-0">
              <CalendarCheck2 className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 dark:text-white font-sans">
                  Student Attendance Portal
                </h1>
                <span className="hidden sm:inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-800">
                  {user.branch} • Sec {user.section}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium hidden md:block">
                SRM IST official timetable engine • Ground truth attendance calculations
              </p>
            </div>
          </div>

          {/* Right Area: Dark Mode Toggle, Quick Actions & User Menu */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Dark Mode Toggle Button on Top */}
            <button
              type="button"
              onClick={onToggleDarkMode}
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/80 transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDarkMode ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400 animate-spin-slow" />
                  <span className="text-xs font-semibold hidden md:inline">Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs font-semibold hidden md:inline">Dark</span>
                </>
              )}
            </button>

            {/* Quick Actions (Desktop) */}
            <div className="hidden lg:flex items-center gap-2">
              <button
                onClick={onRecalculate}
                type="button"
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                title="Recalculate all attendance figures"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                <span>Calculate</span>
              </button>

              <button
                onClick={onAddSubject}
                type="button"
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Subject</span>
              </button>
            </div>

            {/* User Profile Dropdown Menu */}
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500 hover:bg-indigo-50/40 dark:hover:bg-slate-800 bg-white dark:bg-slate-800/80 transition cursor-pointer text-left shadow-2xs"
                aria-expanded={isUserMenuOpen}
              >
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-500 to-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:block">
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight">
                    {user.name}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono leading-tight">
                    {user.registrationNumber}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              </button>

              {/* Dropdown Popover */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800 py-2 text-slate-800 dark:text-slate-200 z-50 animate-fadeIn">
                  {/* User summary */}
                  <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100">{user.name}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                      Reg: {user.registrationNumber}
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 text-[10px] font-semibold text-indigo-700 dark:text-indigo-400">
                      <span className="bg-indigo-50 dark:bg-indigo-950/70 px-2 py-0.5 rounded border border-indigo-100 dark:border-indigo-900/50">
                        {user.year} • {user.branch} • Sec {user.section}
                      </span>
                    </div>
                  </div>

                  {/* Menu options */}
                  <div className="py-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onOpenProfile();
                      }}
                      className="w-full px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-2.5 transition cursor-pointer text-left"
                    >
                      <User className="w-4 h-4 text-slate-400" />
                      <span>Profile Information</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onOpenProfile();
                      }}
                      className="w-full px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-2.5 transition cursor-pointer text-left"
                    >
                      <Settings className="w-4 h-4 text-slate-400" />
                      <span>Settings & Password</span>
                    </button>
                  </div>

                  {/* Dark Mode in Menu for mobile convenience */}
                  <div className="py-1 border-t border-slate-100 dark:border-slate-800 sm:hidden">
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onToggleDarkMode();
                      }}
                      className="w-full px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2.5 cursor-pointer text-left"
                    >
                      {isDarkMode ? (
                        <>
                          <Sun className="w-4 h-4 text-amber-400" />
                          <span>Switch to Light Mode</span>
                        </>
                      ) : (
                        <>
                          <Moon className="w-4 h-4 text-indigo-600" />
                          <span>Switch to Dark Mode</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Quick utility controls inside dropdown for mobile */}
                  <div className="py-1 border-t border-slate-100 dark:border-slate-800 lg:hidden">
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onRecalculate();
                      }}
                      className="w-full px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2.5 cursor-pointer text-left"
                    >
                      <RefreshCw className="w-4 h-4 text-slate-400" />
                      <span>Recalculate Attendance</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onAddSubject();
                      }}
                      className="w-full px-4 py-2 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-800 flex items-center gap-2.5 cursor-pointer text-left"
                    >
                      <Plus className="w-4 h-4 text-indigo-500" />
                      <span>Add New Subject</span>
                    </button>
                  </div>

                  {/* Logout Button */}
                  <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onLogout();
                      }}
                      className="w-full px-4 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2.5 transition cursor-pointer text-left"
                    >
                      <LogOut className="w-4 h-4 text-rose-500 dark:text-rose-400" />
                      <span>Logout from Session</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="bg-slate-50/80 dark:bg-slate-950/90 border-t border-slate-200/80 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2 no-scrollbar">
            {[
              { id: 'DASHBOARD' as MainNavTab, label: 'Dashboard', icon: LayoutDashboard },
              { id: 'FREE_CLASSROOMS' as MainNavTab, label: 'Free Classrooms', icon: Building2 },
              { id: 'MY_SUBJECTS' as MainNavTab, label: 'Subjects', icon: BookOpen },
              { id: 'TIMETABLE' as MainNavTab, label: 'Timetable', icon: Calendar },
              { id: 'ANALYTICS' as MainNavTab, label: 'Analytics', icon: BarChart3 },
              { id: 'OD_SIMULATOR' as MainNavTab, label: 'Leave Simulator', icon: BriefcaseMedical },
              { id: 'ADVISOR' as MainNavTab, label: 'Attendance Advisor', icon: Bot },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => onTabChange(id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === id
                    ? 'bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-400 shadow-2xs border border-slate-200 dark:border-slate-700'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${activeTab === id ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`} />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
};
