import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Subject,
  StudentProfile,
  SubjectCalculation,
  LeaveRecord,
  LeavePolicy,
} from './types/attendance';
import { SectionTimetable } from './types/timetable';
import { OFFICIAL_TIMETABLES } from './data/timetableData';
import {
  calculateSubject,
  calculateSemesterStats,
  getDefaultNovemberDeadline,
  toISODateString,
  formatDisplayDate,
} from './utils/attendanceMath';
import { countScheduledClassesInDateRange } from './utils/timetableDateMath';
import { simulateLeaveImpact } from './utils/leaveSimulatorMath';
import { Header, MainNavTab } from './components/Header';
import { DatePlanningBar } from './components/DatePlanningBar';
import { TimetableSectionSelector } from './components/TimetableSectionSelector';
import { TimetableViewer } from './components/TimetableViewer';
import { IrreversibleDetentionBanner } from './components/IrreversibleDetentionBanner';
import { OverallDashboard } from './components/OverallDashboard';
import { SubjectCard } from './components/SubjectCard';
import { SubjectTable } from './components/SubjectTable';
import { AddEditSubjectModal } from './components/AddEditSubjectModal';
import { WhatIfSimulator } from './components/WhatIfSimulator';
import { ResetConfirmModal } from './components/ResetConfirmModal';
import { MathFormulaGuide } from './components/MathFormulaGuide';
import { AttendanceAnalytics } from './components/AttendanceAnalytics';
import { ODMedicalSimulator } from './components/ODMedicalSimulator';
import { AttendanceAdvisorChat } from './components/AttendanceAdvisorChat';
import { FreeClassroomLocator } from './components/locator/FreeClassroomLocator';
import { LoginPage } from './components/auth/LoginPage';
import { RegisterPage } from './components/auth/RegisterPage';
import { ForgotPasswordModal } from './components/auth/ForgotPasswordModal';
import { StudentProfileModal } from './components/auth/StudentProfileModal';
import { FirstLoginSetupModal } from './components/auth/FirstLoginSetupModal';
import { StudentUser, StudentPersonalData } from './types/auth';
import {
  initializeDemoAccountsIfNeeded,
  getActiveSession,
  setActiveSession,
  findUserByRegistration,
  getStudentData,
  saveStudentData,
  saveRegisteredUser,
} from './utils/authSecurity';
import {
  LayoutGrid,
  TableProperties,
  Sparkles,
  Plus,
  Info,
  FileSpreadsheet,
  Bot,
  AlertTriangle,
  BookOpen,
  Building2,
} from 'lucide-react';

export default function App() {
  // Authentication & Session State
  const [currentUser, setCurrentUser] = useState<StudentUser | null>(null);
  const [authView, setAuthView] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isFirstLoginModalOpen, setIsFirstLoginModalOpen] = useState(false);
  const [isAppInitialized, setIsAppInitialized] = useState(false);

  // Dark Mode Theme State & Persistence
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('attendplan_theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('attendplan_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('attendplan_theme', 'light');
    }
  }, [isDarkMode]);

  const handleToggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
  };

  // Navigation tab
  const [activeTab, setActiveTab] = useState<MainNavTab>('DASHBOARD');

  // Dynamic Dates (detected at runtime from current environment)
  const todayDate = useMemo(() => new Date(), []);
  const todayDateStr = useMemo(() => toISODateString(todayDate), [todayDate]);

  // Per-student isolated state
  const [planningDate, setPlanningDate] = useState<string>(todayDateStr);
  const [semesterEndDate, setSemesterEndDate] = useState<string>(() => {
    return `${todayDate.getFullYear()}-12-18`;
  });
  const [novemberDeadline, setNovemberDeadline] = useState<string>(() => {
    return getDefaultNovemberDeadline(todayDate);
  });
  const [customHolidays, setCustomHolidays] = useState<string[]>([]);
  const [selectedTimetableId, setSelectedTimetableId] = useState<string>('2026-27-III-ECE-A');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [leaveRecords, setLeaveRecords] = useState<LeaveRecord[]>([]);
  const [leavePolicy, setLeavePolicy] = useState<LeavePolicy>('COUNT_AS_ATTENDED');
  const [viewMode, setViewMode] = useState<'CARDS' | 'TABLE'>('CARDS');
  const [selectedTarget, setSelectedTarget] = useState<number>(75);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [subjectToEdit, setSubjectToEdit] = useState<Subject | null>(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [lastCalculationNotice, setLastCalculationNotice] = useState<string | null>(null);

  // Find matching timetable for section
  const findMatchingTimetable = useCallback(
    (year: string, branch: string, section: string): SectionTimetable | undefined => {
      return OFFICIAL_TIMETABLES.find((t) => {
        const yMatch =
          t.yearLevel.toLowerCase().includes(year.toLowerCase()) ||
          year.toLowerCase().includes(t.yearLevel.toLowerCase());
        const bMatch =
          t.branch.toLowerCase().includes(branch.toLowerCase()) ||
          branch.toLowerCase().includes(t.branch.toLowerCase());
        const sMatch =
          t.section.toLowerCase() === section.toLowerCase() ||
          t.section.toLowerCase().includes(section.toLowerCase());
        return yMatch && bMatch && sMatch;
      });
    },
    []
  );

  // Helper to generate subjects from a timetable
  const generateSubjectsFromTimetable = useCallback(
    (timetable: SectionTimetable): Subject[] => {
      return timetable.subjects.map((sub, idx) => {
        let conducted = 28;
        let attended = 24;

        if (idx === 0) {
          conducted = 30;
          attended = 26;
        } else if (idx === 1) {
          conducted = 28;
          attended = 26;
        } else if (idx === 2) {
          conducted = 31;
          attended = 22;
        } else if (idx === 3) {
          conducted = 26;
          attended = 17;
        }

        return {
          id: `sub_${timetable.id}_${sub.code}_${idx}`,
          name: sub.name,
          code: sub.code,
          conducted,
          attended,
          faculty: sub.faculty,
          category: sub.isLab ? 'Lab' : 'Theory',
          weeklyFrequency: sub.periodsPerWeek,
        };
      });
    },
    []
  );

  // Load a student's personal data into the state
  const loadStudentSessionData = useCallback(
    (user: StudentUser) => {
      const stored = getStudentData(user.registrationNumber);
      if (stored) {
        setSubjects(stored.subjects || []);
        setPlanningDate(stored.planningDate || todayDateStr);
        setSemesterEndDate(stored.semesterEndDate || `${todayDate.getFullYear()}-12-18`);
        setNovemberDeadline(stored.novemberDeadline || getDefaultNovemberDeadline(todayDate));
        setSelectedTarget(stored.selectedTarget || 75);
        setSelectedTimetableId(stored.selectedTimetableId || '2026-27-III-ECE-A');
        setCustomHolidays(stored.customHolidays || []);
        setLeaveRecords(stored.leaveRecords || []);
        setLeavePolicy(stored.leavePolicy || 'COUNT_AS_ATTENDED');
        setStatusFilter(stored.statusFilter || 'ALL');
        setViewMode(stored.viewMode || 'CARDS');
      } else {
        // Initialize from enrolled section
        const matched =
          findMatchingTimetable(user.year, user.branch, user.section) || OFFICIAL_TIMETABLES[0];
        const newSubs = generateSubjectsFromTimetable(matched);
        setSubjects(newSubs);
        setPlanningDate(todayDateStr);
        setSemesterEndDate(`${todayDate.getFullYear()}-12-18`);
        setNovemberDeadline(getDefaultNovemberDeadline(todayDate));
        setSelectedTarget(75);
        setSelectedTimetableId(matched.id);
        setCustomHolidays([]);
        setLeaveRecords([]);
        setLeavePolicy('COUNT_AS_ATTENDED');
        setStatusFilter('ALL');
        setViewMode('CARDS');

        // Immediately persist initial student data
        saveStudentData(user.registrationNumber, {
          subjects: newSubs,
          planningDate: todayDateStr,
          semesterEndDate: `${todayDate.getFullYear()}-12-18`,
          novemberDeadline: getDefaultNovemberDeadline(todayDate),
          selectedTarget: 75,
          selectedTimetableId: matched.id,
          customHolidays: [],
          leaveRecords: [],
          leavePolicy: 'COUNT_AS_ATTENDED',
          statusFilter: 'ALL',
          viewMode: 'CARDS',
        });
      }
    },
    [findMatchingTimetable, generateSubjectsFromTimetable, todayDate, todayDateStr]
  );

  // Persist current student data to localStorage whenever any attendance or preference value changes
  useEffect(() => {
    if (currentUser && isAppInitialized) {
      const dataToSave: StudentPersonalData = {
        subjects,
        planningDate,
        semesterEndDate,
        novemberDeadline,
        selectedTarget,
        selectedTimetableId,
        customHolidays,
        leaveRecords,
        leavePolicy,
        statusFilter,
        viewMode,
      };
      saveStudentData(currentUser.registrationNumber, dataToSave);
    }
  }, [
    currentUser,
    isAppInitialized,
    subjects,
    planningDate,
    semesterEndDate,
    novemberDeadline,
    selectedTarget,
    selectedTimetableId,
    customHolidays,
    leaveRecords,
    leavePolicy,
    statusFilter,
    viewMode,
  ]);

  // Initialization: Seed demo accounts & restore active session
  useEffect(() => {
    const init = async () => {
      await initializeDemoAccountsIfNeeded();
      const activeSession = getActiveSession();
      if (activeSession && activeSession.registrationNumber) {
        const found = findUserByRegistration(activeSession.registrationNumber);
        if (found) {
          setCurrentUser(found);
          loadStudentSessionData(found);
          if (found.isFirstLogin) {
            setIsFirstLoginModalOpen(true);
          }
        } else {
          setActiveSession(null);
        }
      }
      setIsAppInitialized(true);
    };
    init();
  }, [loadStudentSessionData]);

  // Current Timetable object
  const currentTimetable = useMemo(() => {
    const found = OFFICIAL_TIMETABLES.find((t) => t.id === selectedTimetableId);
    return found || OFFICIAL_TIMETABLES[0];
  }, [selectedTimetableId]);

  // Check if current student's enrolled section has an official timetable
  const sectionHasTimetable = useMemo(() => {
    if (!currentUser) return true;
    return !!findMatchingTimetable(currentUser.year, currentUser.branch, currentUser.section);
  }, [currentUser, findMatchingTimetable]);

  // DATE-BASED TIMETABLE COUNTING ENGINE
  // 1. Scheduled classes between Today's date and the selected Planning date
  const todayToPlanningResult = useMemo(() => {
    return countScheduledClassesInDateRange(
      currentTimetable,
      todayDateStr,
      planningDate,
      customHolidays,
      false
    );
  }, [currentTimetable, todayDateStr, planningDate, customHolidays]);

  // 2. Scheduled classes between Planning date and Semester End date
  const planningToEndResult = useMemo(() => {
    return countScheduledClassesInDateRange(
      currentTimetable,
      planningDate,
      semesterEndDate,
      customHolidays,
      true
    );
  }, [currentTimetable, planningDate, semesterEndDate, customHolidays]);

  // 3. Scheduled classes between Current date and November deadline
  const currentToNovResult = useMemo(() => {
    return countScheduledClassesInDateRange(
      currentTimetable,
      todayDateStr,
      novemberDeadline,
      customHolidays,
      true
    );
  }, [currentTimetable, todayDateStr, novemberDeadline, customHolidays]);

  // Compute subject attendance calculations using official timetable date counts
  const calculations: SubjectCalculation[] = useMemo(() => {
    return subjects.map((sub) => {
      let remainingForSub = sub.remainingManual;
      if (remainingForSub === undefined || isNaN(remainingForSub)) {
        if (sub.code && planningToEndResult.bySubject[sub.code] !== undefined) {
          remainingForSub = planningToEndResult.bySubject[sub.code];
        } else {
          remainingForSub = Math.max(0, (sub.weeklyFrequency || 4) * 8);
        }
      }

      let classesBeforeNov = 0;
      if (sub.code && currentToNovResult.bySubject[sub.code] !== undefined) {
        classesBeforeNov = currentToNovResult.bySubject[sub.code];
      } else {
        classesBeforeNov = Math.max(0, Math.round((sub.weeklyFrequency || 4) * 6));
      }

      return calculateSubject(sub, remainingForSub, selectedTarget, classesBeforeNov);
    });
  }, [subjects, planningToEndResult, currentToNovResult, selectedTarget]);

  // Overall semester-wide statistics
  const semesterStats = useMemo(() => {
    return calculateSemesterStats(calculations, selectedTarget);
  }, [calculations, selectedTarget]);

  // Irreversible Detention Subjects
  const detentionSubjects = useMemo(() => {
    return calculations.filter((c) => c.warningLevel === 'IRREVERSIBLE_DETENTION');
  }, [calculations]);

  // Filtered calculations for display
  const filteredCalculations = useMemo(() => {
    if (statusFilter === 'ALL') return calculations;
    return calculations.filter((c) => c.warningLevel === statusFilter);
  }, [calculations, statusFilter]);

  // AUTH HANDLERS
  const handleLoginSuccess = (user: StudentUser) => {
    setCurrentUser(user);
    loadStudentSessionData(user);
    if (user.isFirstLogin) {
      setIsFirstLoginModalOpen(true);
    }
  };

  const handleRegisterSuccess = (user: StudentUser) => {
    setCurrentUser(user);
    loadStudentSessionData(user);
    setIsFirstLoginModalOpen(true);
  };

  const handleLogout = () => {
    // Persist latest state before logout
    if (currentUser) {
      saveStudentData(currentUser.registrationNumber, {
        subjects,
        planningDate,
        semesterEndDate,
        novemberDeadline,
        selectedTarget,
        selectedTimetableId,
        customHolidays,
        leaveRecords,
        leavePolicy,
        statusFilter,
        viewMode,
      });
    }

    setActiveSession(null);
    setCurrentUser(null);
    setAuthView('LOGIN');
    setActiveTab('DASHBOARD');
  };

  const handleUpdateUserProfile = (updatedUser: StudentUser) => {
    setCurrentUser(updatedUser);
    saveRegisteredUser(updatedUser);

    // If section changed, see if we should synchronize with new timetable
    const matched = findMatchingTimetable(
      updatedUser.year,
      updatedUser.branch,
      updatedUser.section
    );
    if (matched && matched.id !== selectedTimetableId) {
      setSelectedTimetableId(matched.id);
      setLastCalculationNotice(`Synchronized timetable for Section ${updatedUser.section} (${matched.displayName})`);
      setTimeout(() => setLastCalculationNotice(null), 3500);
    }
  };

  const handleFirstLoginComplete = (
    updatedUser: StudentUser,
    chosenTimetable: SectionTimetable,
    preferredTarget: number
  ) => {
    setCurrentUser(updatedUser);
    saveRegisteredUser(updatedUser);
    setSelectedTimetableId(chosenTimetable.id);
    setSelectedTarget(preferredTarget);
    const newSubs = generateSubjectsFromTimetable(chosenTimetable);
    setSubjects(newSubs);
    setIsFirstLoginModalOpen(false);
    setLastCalculationNotice(`Welcome ${updatedUser.name}! Timetable loaded for ${chosenTimetable.displayName}`);
    setTimeout(() => setLastCalculationNotice(null), 4000);
  };

  // DASHBOARD ACTION HANDLERS
  const handleSelectTimetable = (timetableId: string) => {
    setSelectedTimetableId(timetableId);
    const chosen = OFFICIAL_TIMETABLES.find((t) => t.id === timetableId);
    if (chosen) {
      const newSubs = generateSubjectsFromTimetable(chosen);
      setSubjects(newSubs);
      setLastCalculationNotice(`Synchronized ${newSubs.length} subjects from ${chosen.displayName}`);
      setTimeout(() => setLastCalculationNotice(null), 3500);
    }
  };

  const handleSyncSubjects = () => {
    const newSubs = generateSubjectsFromTimetable(currentTimetable);
    setSubjects(newSubs);
    setLastCalculationNotice(`Loaded all subjects and schedules from ${currentTimetable.displayName}`);
    setTimeout(() => setLastCalculationNotice(null), 3500);
  };

  const handleOpenAdd = () => {
    setSubjectToEdit(null);
    setIsModalOpen(true);
  };

  const handleEditSubject = (id: string) => {
    const sub = subjects.find((s) => s.id === id);
    if (sub) {
      setSubjectToEdit(sub);
      setIsModalOpen(true);
    }
  };

  const handleDeleteSubject = (id: string) => {
    setSubjects((prev) => prev.filter((s) => s.id !== id));
  };

  const handleSaveSubject = (savedSubject: Subject) => {
    setSubjects((prev) => {
      const exists = prev.some((s) => s.id === savedSubject.id);
      if (exists) {
        return prev.map((s) => (s.id === savedSubject.id ? savedSubject : s));
      }
      return [...prev, savedSubject];
    });
  };

  const handleQuickUpdate = (
    id: string,
    attendedDelta: number,
    conductedDelta: number
  ) => {
    setSubjects((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const newConducted = Math.max(0, s.conducted + conductedDelta);
        const newAttended = Math.min(newConducted, Math.max(0, s.attended + attendedDelta));
        const newRemaining =
          s.remainingManual !== undefined
            ? Math.max(0, s.remainingManual - conductedDelta)
            : undefined;
        return {
          ...s,
          conducted: newConducted,
          attended: newAttended,
          remainingManual: newRemaining,
        };
      })
    );
  };

  const handleAddHoliday = (holidayDate: string) => {
    if (!customHolidays.includes(holidayDate)) {
      setCustomHolidays((prev) => [...prev, holidayDate]);
    }
  };

  const handleRemoveHoliday = (holidayDate: string) => {
    setCustomHolidays((prev) => prev.filter((h) => h !== holidayDate));
  };

  const handleResetConfirm = () => {
    setSubjects([]);
    setLeaveRecords([]);
    setIsResetConfirmOpen(false);
  };

  const handleLoadDemo = () => {
    handleSelectTimetable('2026-27-III-ECE-A');
    setPlanningDate(todayDateStr);
    setSelectedTarget(75);
    setStatusFilter('ALL');
  };

  const handleRecalculate = () => {
    setLastCalculationNotice(
      `Recalculated at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })} using ${currentTimetable.displayName}`
    );
    setTimeout(() => setLastCalculationNotice(null), 3000);
  };

  const handleScrollToSubject = (subjectId: string) => {
    setActiveTab('DASHBOARD');
    setTimeout(() => {
      const el = document.getElementById(`subject-card-${subjectId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  const handleSaveLeave = (leave: LeaveRecord) => {
    setLeaveRecords((prev) => {
      const exists = prev.some((l) => l.id === leave.id);
      if (exists) {
        return prev.map((l) => (l.id === leave.id ? leave : l));
      }
      return [...prev, leave];
    });
  };

  const handleDeleteLeave = (id: string) => {
    setLeaveRecords((prev) => prev.filter((l) => l.id !== id));
  };

  const handleApplyLeaveRecordToActual = (record: LeaveRecord) => {
    const impact = simulateLeaveImpact(
      currentTimetable,
      subjects,
      record,
      leavePolicy,
      customHolidays
    );

    setSubjects((prev) =>
      prev.map((sub) => {
        const subImp = impact.subjectImpacts.find(
          (imp) => imp.subjectCode === sub.code || imp.subjectName === sub.name
        );
        if (
          subImp &&
          subImp.classesMissed > 0 &&
          subImp.afterConducted !== undefined &&
          subImp.afterAttended !== undefined
        ) {
          return {
            ...sub,
            conducted: subImp.afterConducted,
            attended: subImp.afterAttended,
          };
        }
        return sub;
      })
    );

    setLeaveRecords((prev) =>
      prev.map((l) => (l.id === record.id ? { ...l, applied: true } : l))
    );

    setLastCalculationNotice(`Successfully applied ${record.leaveType} leave to attendance records.`);
    setTimeout(() => setLastCalculationNotice(null), 3500);
  };

  // If not yet initialized, show minimal loader
  if (!isAppInitialized) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-white rounded-full animate-spin" />
          <p className="text-xs font-mono text-slate-400">Loading Student Attendance Portal...</p>
        </div>
      </div>
    );
  }

  // 1. UN-AUTHENTICATED ENTRY POINT: Render Login or Registration
  if (!currentUser) {
    return (
      <>
        {authView === 'LOGIN' ? (
          <LoginPage
            onLoginSuccess={handleLoginSuccess}
            onNavigateRegister={() => setAuthView('REGISTER')}
            onNavigateForgotPassword={() => setIsForgotPasswordOpen(true)}
            isDarkMode={isDarkMode}
            onToggleDarkMode={handleToggleDarkMode}
          />
        ) : (
          <RegisterPage
            onRegisterSuccess={handleRegisterSuccess}
            onNavigateLogin={() => setAuthView('LOGIN')}
            isDarkMode={isDarkMode}
            onToggleDarkMode={handleToggleDarkMode}
          />
        )}

        <ForgotPasswordModal
          isOpen={isForgotPasswordOpen}
          onClose={() => setIsForgotPasswordOpen(false)}
          onSuccess={(reg) => {
            setAuthView('LOGIN');
          }}
        />
      </>
    );
  }

  // 2. AUTHENTICATED PORTAL: Render Complete Student Dashboard
  return (
    <div className="min-h-screen bg-slate-100/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans flex flex-col antialiased transition-colors">
      {/* 1. Header Bar with Student Profile, Dark Mode Toggle & Tab Navigation */}
      <Header
        user={currentUser}
        onAddSubject={handleOpenAdd}
        onReset={() => setIsResetConfirmOpen(true)}
        onLoadDemo={handleLoadDemo}
        onRecalculate={handleRecalculate}
        hasCustomData={subjects.length > 0}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onLogout={handleLogout}
        isDarkMode={isDarkMode}
        onToggleDarkMode={handleToggleDarkMode}
      />

      {/* Recalculate Toast Notice */}
      {lastCalculationNotice && (
        <div className="bg-indigo-600 text-white text-xs font-semibold py-1.5 px-4 text-center tracking-wide transition-all shadow-inner">
          ✓ {lastCalculationNotice}
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Requirement 12: Warning if selected section does not match an uploaded timetable */}
        {!sectionHasTimetable && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm flex items-start gap-3 shadow-xs">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold">Timetable Section Notice:</strong>
              <p className="mt-0.5">
                No timetable was found for your selected section ({currentUser.year} {currentUser.branch} Sec {currentUser.section}). Please verify your section in your Profile or select an official timetable below.
              </p>
            </div>
          </div>
        )}

        {/* TAB 1: DASHBOARD (MAIN PLANNER VIEW) */}
        {activeTab === 'DASHBOARD' && (
          <div className="space-y-6">
            {/* Irreversible Detention Alert (Shown ONLY when mathematically proven impossible) */}
            {detentionSubjects.length > 0 && (
              <IrreversibleDetentionBanner
                detentionSubjects={detentionSubjects}
                onScrollToSubject={handleScrollToSubject}
              />
            )}

            {/* Free Classrooms Quick Locator Banner */}
            <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 rounded-2xl p-4 sm:p-5 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold">
                    Need an empty classroom for team study or project work?
                  </h3>
                  <p className="text-xs text-emerald-100 mt-0.5">
                    Live timetable conflict detection across all floors • Search by duration, AC, floor & capacity.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('FREE_CLASSROOMS')}
                className="px-4 py-2 rounded-xl bg-white text-emerald-800 hover:bg-emerald-50 text-xs font-bold transition shadow-sm cursor-pointer whitespace-nowrap self-start sm:self-auto"
              >
                Find Free Classrooms →
              </button>
            </div>

            {/* Official PDF Section Timetable Selector */}
            <TimetableSectionSelector
              timetables={OFFICIAL_TIMETABLES}
              selectedTimetableId={selectedTimetableId}
              onSelectTimetable={handleSelectTimetable}
              syncWithTimetableSubjects={handleSyncSubjects}
            />

            {/* Date Planning & Statutory Deadline Bar */}
            <DatePlanningBar
              todayDate={todayDate}
              planningDate={planningDate}
              onPlanningDateChange={setPlanningDate}
              semesterEndDate={semesterEndDate}
              onSemesterEndDateChange={setSemesterEndDate}
              novemberDeadline={novemberDeadline}
              onNovemberDeadlineChange={setNovemberDeadline}
              onResetPlanningToToday={() => setPlanningDate(todayDateStr)}
              classesFromTodayToPlanning={todayToPlanningResult.totalClasses}
              classesFromPlanningToEnd={planningToEndResult.totalClasses}
              classesFromCurrentToNovember={currentToNovResult.totalClasses}
              customHolidays={customHolidays}
              onAddHoliday={handleAddHoliday}
              onRemoveHoliday={handleRemoveHoliday}
            />

            {/* Overall Semester Results Dashboard */}
            <OverallDashboard
              stats={semesterStats}
              selectedTarget={selectedTarget}
              onSelectTarget={setSelectedTarget}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              totalSubjectCount={subjects.length}
            />

            {/* Subject Section Header & View Toggles */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                    Subject Attendance Matrix
                  </h2>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-700">
                    {filteredCalculations.length} {filteredCalculations.length === 1 ? 'Subject' : 'Subjects'}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Student: <strong className="text-slate-800">{currentUser.name}</strong> ({currentUser.registrationNumber}) | Timetable:{' '}
                  <strong className="text-slate-800">{currentTimetable.displayName}</strong> | Target:{' '}
                  <strong className="text-indigo-600 font-bold">{selectedTarget}%</strong>
                </p>
              </div>

              <div className="flex items-center gap-2">
                {/* View Switcher: Cards vs Table */}
                <div className="bg-slate-200/80 p-1 rounded-lg flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setViewMode('CARDS')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                      viewMode === 'CARDS'
                        ? 'bg-white text-indigo-600 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Cards</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('TABLE')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                      viewMode === 'TABLE'
                        ? 'bg-white text-indigo-600 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <TableProperties className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Table</span>
                  </button>
                </div>

                {/* Quick Add Subject Button */}
                <button
                  type="button"
                  onClick={handleOpenAdd}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs cursor-pointer transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Subject</span>
                </button>
              </div>
            </div>

            {/* Subjects Content: Cards vs Table vs Empty State */}
            {filteredCalculations.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-10 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                  <Info className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">
                    {subjects.length === 0
                      ? 'No subjects currently loaded'
                      : `No subjects match the filter "${statusFilter}"`}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mt-1">
                    {subjects.length === 0
                      ? `Sync subjects directly from ${currentTimetable.displayName} or create your own custom subject.`
                      : 'Try selecting "All Subjects" or adjust your filter selection.'}
                  </p>
                </div>
                <div className="flex items-center justify-center gap-3 pt-2">
                  {subjects.length === 0 ? (
                    <>
                      <button
                        type="button"
                        onClick={handleSyncSubjects}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs cursor-pointer"
                      >
                        <FileSpreadsheet className="w-4 h-4" />
                        <span>Sync from {currentTimetable.displayName}</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleOpenAdd}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Custom Subject</span>
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setStatusFilter('ALL')}
                      className="px-4 py-2 text-xs sm:text-sm font-semibold text-indigo-600 hover:bg-indigo-50 rounded-lg border border-indigo-200 cursor-pointer"
                    >
                      Clear Filter
                    </button>
                  )}
                </div>
              </div>
            ) : viewMode === 'CARDS' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-5">
                {filteredCalculations.map((calc) => (
                  <SubjectCard
                    key={calc.subject.id}
                    calc={calc}
                    selectedTarget={selectedTarget}
                    onEdit={handleEditSubject}
                    onDelete={handleDeleteSubject}
                    onQuickUpdate={handleQuickUpdate}
                  />
                ))}
              </div>
            ) : (
              <SubjectTable
                calculations={filteredCalculations}
                selectedTarget={selectedTarget}
                onEdit={handleEditSubject}
                onDelete={handleDeleteSubject}
                onQuickUpdate={handleQuickUpdate}
              />
            )}

            {/* Interactive What-If Simulator */}
            {calculations.length > 0 && (
              <WhatIfSimulator
                calculations={calculations}
                selectedTarget={selectedTarget}
              />
            )}

            {/* Mathematical Rules & Statutory Guide */}
            <MathFormulaGuide />
          </div>
        )}

        {/* TAB: FREE CLASSROOM LOCATOR (PHASE 2 SMART FREE CLASSROOM SYSTEM) */}
        {activeTab === 'FREE_CLASSROOMS' && (
          <div className="space-y-6">
            <FreeClassroomLocator />
          </div>
        )}

        {/* TAB 2: MY SUBJECTS / ATTENDANCE MATRIX */}
        {activeTab === 'MY_SUBJECTS' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  Subject Attendance Records
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Manage attended and conducted classes with 1-tap quick buttons or edit specific details.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleOpenAdd}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs cursor-pointer transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Subject</span>
                </button>
              </div>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  View Style:
                </span>
                <button
                  type="button"
                  onClick={() => setViewMode('CARDS')}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                    viewMode === 'CARDS'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                  }`}
                >
                  Cards
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('TABLE')}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                    viewMode === 'TABLE'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                  }`}
                >
                  Table
                </button>
              </div>

              <div className="text-xs text-slate-500">
                Target: <strong className="text-indigo-600 font-bold">{selectedTarget}%</strong>
              </div>
            </div>

            {viewMode === 'CARDS' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-5">
                {calculations.map((calc) => (
                  <SubjectCard
                    key={calc.subject.id}
                    calc={calc}
                    selectedTarget={selectedTarget}
                    onEdit={handleEditSubject}
                    onDelete={handleDeleteSubject}
                    onQuickUpdate={handleQuickUpdate}
                  />
                ))}
              </div>
            ) : (
              <SubjectTable
                calculations={calculations}
                selectedTarget={selectedTarget}
                onEdit={handleEditSubject}
                onDelete={handleDeleteSubject}
                onQuickUpdate={handleQuickUpdate}
              />
            )}
          </div>
        )}

        {/* TAB 3: TIMETABLE VIEWER */}
        {activeTab === 'TIMETABLE' && (
          <div className="space-y-6">
            <TimetableViewer
              timetables={OFFICIAL_TIMETABLES}
              selectedTimetable={currentTimetable}
              onSelectTimetable={handleSelectTimetable}
            />
          </div>
        )}

        {/* TAB 4: ATTENDANCE HEALTH DASHBOARD + VISUAL CHARTS */}
        {activeTab === 'ANALYTICS' && (
          <div className="space-y-6">
            <AttendanceAnalytics
              stats={semesterStats}
              calculations={calculations}
              selectedTarget={selectedTarget}
              currentTimetable={currentTimetable}
              planningDate={planningDate}
              semesterEndDate={semesterEndDate}
            />
          </div>
        )}

        {/* TAB 5: OD / MEDICAL LEAVE SIMULATOR */}
        {activeTab === 'OD_SIMULATOR' && (
          <div className="space-y-6">
            <ODMedicalSimulator
              currentTimetable={currentTimetable}
              subjects={subjects}
              leavePolicy={leavePolicy}
              onLeavePolicyChange={setLeavePolicy}
              leaveRecords={leaveRecords}
              onAddLeaveRecord={handleSaveLeave}
              onDeleteLeaveRecord={handleDeleteLeave}
              onApplyLeaveToActual={handleApplyLeaveRecordToActual}
              customHolidays={customHolidays}
            />
          </div>
        )}

        {/* TAB 6: ATTENDANCE ADVISOR / AI ASSISTANT FULL VIEW */}
        {activeTab === 'ADVISOR' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-md shadow-indigo-100">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Attendance Advisor AI & Strategic Planner
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500">
                    Mathematically verified advice personalized for {currentUser.name} ({currentUser.registrationNumber}) using {currentTimetable.displayName}.
                  </p>
                </div>
              </div>

              <div className="pt-4">
                <p className="text-xs sm:text-sm text-slate-600 mb-6 leading-relaxed">
                  Ask any questions about attendance tradeoffs, safe bunking limits, upcoming sick leave impact,
                  or the optimal path to reach 75%, 80%, or 90% without risking Irreversible Detention.
                </p>

                {/* Embedded Chat Box */}
                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                  <AttendanceAdvisorChat
                    currentTimetable={currentTimetable}
                    subjects={subjects}
                    calculations={calculations}
                    stats={semesterStats}
                    planningDate={planningDate}
                    semesterEndDate={semesterEndDate}
                    novemberDeadline={novemberDeadline}
                    todayDateStr={todayDateStr}
                    leaveRecords={leaveRecords}
                    leavePolicy={leavePolicy}
                    customHolidays={customHolidays}
                    selectedTarget={selectedTarget}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Floating AI Advisor Chatbot Button (Available across all tabs when not on ADVISOR tab) */}
      {activeTab !== 'ADVISOR' && (
        <AttendanceAdvisorChat
          currentTimetable={currentTimetable}
          subjects={subjects}
          calculations={calculations}
          stats={semesterStats}
          planningDate={planningDate}
          semesterEndDate={semesterEndDate}
          novemberDeadline={novemberDeadline}
          todayDateStr={todayDateStr}
          leaveRecords={leaveRecords}
          leavePolicy={leavePolicy}
          customHolidays={customHolidays}
          selectedTarget={selectedTarget}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6 mt-12 text-center text-xs text-slate-500 dark:text-slate-400 transition-colors">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© {todayDate.getFullYear()} Student Attendance Portal. Grounded in SRM IST official PDF timetables.</p>
          <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400">
            <span>Student: {currentUser.name} ({currentUser.registrationNumber})</span>
            <span>•</span>
            <span>Statutory 75.00% Threshold</span>
            <span>•</span>
            <span>November Recovery Deadline</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AddEditSubjectModal
        isOpen={isModalOpen}
        subjectToEdit={subjectToEdit}
        defaultRemainingClasses={Math.max(0, Math.round(planningToEndResult.totalClasses / Math.max(1, subjects.length)))}
        availableTimetableSubjects={currentTimetable.subjects}
        onSave={handleSaveSubject}
        onClose={() => setIsModalOpen(false)}
      />

      <ResetConfirmModal
        isOpen={isResetConfirmOpen}
        onConfirm={handleResetConfirm}
        onCancel={() => setIsResetConfirmOpen(false)}
      />

      {/* Profile Modal */}
      {currentUser && (
        <StudentProfileModal
          isOpen={isProfileModalOpen}
          user={currentUser}
          onClose={() => setIsProfileModalOpen(false)}
          onUpdateUser={handleUpdateUserProfile}
        />
      )}

      {/* First Login Setup Modal */}
      {currentUser && (
        <FirstLoginSetupModal
          isOpen={isFirstLoginModalOpen}
          user={currentUser}
          onComplete={handleFirstLoginComplete}
        />
      )}
    </div>
  );
}
