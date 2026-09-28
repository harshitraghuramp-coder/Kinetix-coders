import React, { useState } from 'react';
import {
  SectionTimetable,
} from '../types/timetable';
import {
  Subject,
  LeaveRecord,
  LeaveType,
  LeavePolicy,
} from '../types/attendance';
import { simulateLeaveImpact } from '../utils/leaveSimulatorMath';
import { formatDisplayDate } from '../utils/attendanceMath';
import {
  BriefcaseMedical,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  FileCheck2,
  Settings2,
  Layers,
  ArrowRight,
  Sparkles,
  Info,
  Trash2,
} from 'lucide-react';

interface ODMedicalSimulatorProps {
  currentTimetable: SectionTimetable;
  subjects: Subject[];
  leavePolicy: LeavePolicy;
  onLeavePolicyChange: (policy: LeavePolicy) => void;
  leaveRecords: LeaveRecord[];
  onAddLeaveRecord: (record: LeaveRecord) => void;
  onDeleteLeaveRecord: (id: string) => void;
  onApplyLeaveToActual: (record: LeaveRecord) => void;
  customHolidays: string[];
}

export const ODMedicalSimulator: React.FC<ODMedicalSimulatorProps> = ({
  currentTimetable,
  subjects,
  leavePolicy,
  onLeavePolicyChange,
  leaveRecords,
  onAddLeaveRecord,
  onDeleteLeaveRecord,
  onApplyLeaveToActual,
  customHolidays,
}) => {
  // Simulator input state
  const [leaveType, setLeaveType] = useState<LeaveType>('MEDICAL');
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  });
  const [selectedSubjectCode, setSelectedSubjectCode] = useState<string>('');
  const [reason, setReason] = useState<string>('Viral fever recovery');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Instant simulation using the official timetable
  const simulation = simulateLeaveImpact(
    currentTimetable,
    subjects,
    {
      leaveType,
      startDate,
      endDate,
      subjectCode: selectedSubjectCode || undefined,
      reason,
    },
    leavePolicy,
    customHolidays
  );

  const handleSaveSimulation = (applyToActual: boolean = false) => {
    const newRecord: LeaveRecord = {
      id: `leave-${Date.now()}`,
      leaveType,
      startDate,
      endDate,
      subjectCode: selectedSubjectCode || undefined,
      reason,
      applied: applyToActual,
      classesAffected: simulation.totalAffectedPeriods,
    };

    onAddLeaveRecord(newRecord);
    if (applyToActual) {
      onApplyLeaveToActual(newRecord);
      setSaveSuccessMsg(
        `Leave simulation applied and committed to actual subject attendance!`
      );
    } else {
      setSaveSuccessMsg(`Leave simulation saved to your leave records list!`);
    }

    setTimeout(() => setSaveSuccessMsg(null), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-md border border-indigo-700/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-3 rounded-xl bg-blue-500/20 text-blue-300 border border-blue-400/30 flex-shrink-0 mt-1">
              <BriefcaseMedical className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  OD / Medical Leave Simulator
                </h2>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-400 text-slate-950">
                  Timetable Verified
                </span>
              </div>
              <p className="text-xs sm:text-sm text-blue-100/80 mt-1 max-w-2xl">
                Simulate approved absences without corrupting your real attendance data.
                The simulator scans <strong className="text-white underline">{currentTimetable.displayName}</strong> to identify exact classes scheduled during your leave dates.
              </p>
            </div>
          </div>

          <div className="bg-blue-950/70 border border-blue-600/40 rounded-xl p-3 text-xs text-blue-200">
            <span className="font-bold text-white block mb-0.5">Active Timetable:</span>
            <span className="text-blue-300 font-semibold">{currentTimetable.displayName}</span>
            <span className="block text-[11px] text-blue-400 mt-1">
              {currentTimetable.branch}
            </span>
          </div>
        </div>
      </div>

      {/* College Policy Configuration Section */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 sm:p-6">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
          <Settings2 className="w-5 h-5 text-indigo-600" />
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Attendance Policy Configuration
            </h3>
            <p className="text-xs text-slate-500">
              How should approved leave affect attendance? (Colleges apply distinct rules)
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Policy 1: Count as Attended */}
          <label
            className={`border rounded-xl p-3.5 flex flex-col justify-between cursor-pointer transition-all ${
              leavePolicy === 'COUNT_AS_ATTENDED'
                ? 'border-indigo-600 bg-indigo-50/70 ring-1 ring-indigo-500'
                : 'border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-start justify-between">
              <span className="text-xs font-bold text-slate-900">
                1. Count as Attended
              </span>
              <input
                type="radio"
                name="leavePolicy"
                value="COUNT_AS_ATTENDED"
                checked={leavePolicy === 'COUNT_AS_ATTENDED'}
                onChange={() => onLeavePolicyChange('COUNT_AS_ATTENDED')}
                className="mt-0.5 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
            </div>
            <p className="text-[11px] text-slate-600 mt-2">
              (Attended + OD) / (Total + OD). Standard for official university On-Duty representation or sport events.
            </p>
          </label>

          {/* Policy 2: Count as Absent */}
          <label
            className={`border rounded-xl p-3.5 flex flex-col justify-between cursor-pointer transition-all ${
              leavePolicy === 'COUNT_AS_ABSENT'
                ? 'border-indigo-600 bg-indigo-50/70 ring-1 ring-indigo-500'
                : 'border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-start justify-between">
              <span className="text-xs font-bold text-slate-900">
                2. Count as Absent
              </span>
              <input
                type="radio"
                name="leavePolicy"
                value="COUNT_AS_ABSENT"
                checked={leavePolicy === 'COUNT_AS_ABSENT'}
                onChange={() => onLeavePolicyChange('COUNT_AS_ABSENT')}
                className="mt-0.5 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
            </div>
            <p className="text-[11px] text-slate-600 mt-2">
              Attended / (Total + Leave). Evaluates leave if the university condonation committee rejects approval.
            </p>
          </label>

          {/* Policy 3: Exclude from Total */}
          <label
            className={`border rounded-xl p-3.5 flex flex-col justify-between cursor-pointer transition-all ${
              leavePolicy === 'EXCLUDE_FROM_TOTAL'
                ? 'border-indigo-600 bg-indigo-50/70 ring-1 ring-indigo-500'
                : 'border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-start justify-between">
              <span className="text-xs font-bold text-slate-900">
                3. Exclude from Calculation
              </span>
              <input
                type="radio"
                name="leavePolicy"
                value="EXCLUDE_FROM_TOTAL"
                checked={leavePolicy === 'EXCLUDE_FROM_TOTAL'}
                onChange={() => onLeavePolicyChange('EXCLUDE_FROM_TOTAL')}
                className="mt-0.5 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
            </div>
            <p className="text-[11px] text-slate-600 mt-2">
              Attended / (Total - Excluded). The classes during leave do not count toward your total required denominator.
            </p>
          </label>
        </div>

        {/* Policy Explanation Banner */}
        <div className="mt-3.5 p-3 rounded-lg bg-indigo-50/90 border border-indigo-100 flex items-start gap-2 text-xs text-indigo-900">
          <Info className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
          <p className="font-medium">{simulation.summaryText}</p>
        </div>
      </div>

      {/* Simulator Inputs & Live Calculation Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Form: Inputs */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
            <Calendar className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">Configure Leave Simulation</h3>
          </div>

          {/* Leave Type */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Leave Classification:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { type: 'MEDICAL' as LeaveType, label: 'Medical Leave' },
                { type: 'OD' as LeaveType, label: 'On-Duty (OD)' },
                { type: 'APPROVED_OTHER' as LeaveType, label: 'Other Leave' },
              ].map(({ type, label }) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setLeaveType(type)}
                  className={`py-2 px-2 rounded-lg text-xs font-bold border transition-colors cursor-pointer text-center ${
                    leaveType === type
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Start Date:
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                End Date:
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Subject Filter (Optional) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Apply to Subject (Optional):
            </label>
            <select
              value={selectedSubjectCode}
              onChange={(e) => setSelectedSubjectCode(e.target.value)}
              className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
            >
              <option value="">All Subjects during Leave Dates</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.code || s.id}>
                  {s.name} {s.code && `(${s.code})`}
                </option>
              ))}
            </select>
            <span className="text-[10px] text-slate-500 mt-1 block">
              Leave blank to simulate across all classes scheduled on these days.
            </span>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Reason / Description:
            </label>
            <input
              type="text"
              placeholder="e.g. SRM Hackathon OD / Medical Rest"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={() => handleSaveSimulation(false)}
              className="flex-1 py-2 px-3 text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg transition-colors cursor-pointer"
            >
              Save to Simulation Log
            </button>
            <button
              type="button"
              onClick={() => handleSaveSimulation(true)}
              className="flex-1 py-2 px-3 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-xs transition-colors cursor-pointer"
              title="Apply these classes directly to actual attendance records"
            >
              Apply to Actual Attendance
            </button>
          </div>

          {saveSuccessMsg && (
            <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-1.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{saveSuccessMsg}</span>
            </div>
          )}
        </div>

        {/* Right Output: Impact Matrix */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Simulated Attendance Impact
              </h3>
            </div>
            <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
              {simulation.totalAffectedPeriods} Timetable Classes Affected
            </span>
          </div>

          {/* Date Range Summary Header */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-slate-500 font-medium">Leave Period: </span>
              <strong className="text-slate-800">
                {formatDisplayDate(startDate)} → {formatDisplayDate(endDate)}
              </strong>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Total Affected: </span>
              <strong className="text-indigo-700 font-extrabold">
                {simulation.totalAffectedPeriods} Periods
              </strong>
            </div>
          </div>

          {/* Impact Cards per Subject */}
          {simulation.subjectImpacts.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-slate-200 rounded-xl space-y-2">
              <Calendar className="w-8 h-8 text-slate-400 mx-auto" />
              <h4 className="text-xs sm:text-sm font-bold text-slate-700">
                No Classes Affected in This Date Window
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                According to the timetable for {currentTimetable.displayName}, either these dates fall on weekends/holidays or no classes are scheduled.
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {simulation.subjectImpacts.map((imp) => (
                <div
                  key={imp.subjectCode}
                  className={`p-3.5 rounded-xl border transition-all ${
                    imp.isBelow75
                      ? 'border-rose-300 bg-rose-50/50'
                      : 'border-slate-200 bg-slate-50/40 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                        {imp.subjectName}
                        <span className="font-mono text-[11px] text-slate-500 bg-slate-200/70 px-1.5 py-0.2 rounded">
                          {imp.subjectCode}
                        </span>
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {imp.classesMissed} timetable classes affected during leave
                      </p>
                    </div>

                    <div className="text-right flex-shrink-0">
                      {imp.isBelow75 ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full border border-rose-300">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Below 75%</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Safe (≥75%)</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Before vs After Visual Bar */}
                  <div className="grid grid-cols-3 gap-2 bg-white p-2 rounded-lg border border-slate-200 text-center text-xs">
                    <div>
                      <span className="block text-[10px] text-slate-400 font-semibold uppercase">
                        Before Leave
                      </span>
                      <span className="font-extrabold text-slate-800">
                        {imp.beforeAttendance.toFixed(2)}%
                      </span>
                    </div>

                    <div className="flex flex-col items-center justify-center">
                      <ArrowRight className="w-4 h-4 text-slate-400" />
                      <span
                        className={`text-[10px] font-bold ${
                          imp.differencePct >= 0
                            ? 'text-emerald-600'
                            : 'text-rose-600'
                        }`}
                      >
                        {imp.differencePct > 0 ? `+${imp.differencePct}%` : `${imp.differencePct}%`}
                      </span>
                    </div>

                    <div>
                      <span className="block text-[10px] text-slate-400 font-semibold uppercase">
                        Projected After
                      </span>
                      <span
                        className={`font-black text-sm ${
                          imp.isBelow75 ? 'text-rose-600' : 'text-emerald-700'
                        }`}
                      >
                        {imp.afterAttendance.toFixed(2)}%
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-600 mt-2 font-medium">
                    {imp.explanation}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Saved Leave Records List */}
      {leaveRecords.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>Saved Leave Simulations ({leaveRecords.length})</span>
            </h3>
            <span className="text-[11px] text-slate-500">
              Locally persisted in browser storage
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {leaveRecords.map((rec) => (
              <div
                key={rec.id}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">
                      {rec.leaveType === 'MEDICAL'
                        ? 'Medical Leave'
                        : rec.leaveType === 'OD'
                        ? 'On-Duty (OD)'
                        : 'Approved Leave'}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {rec.startDate} → {rec.endDate}
                    </span>
                    {rec.applied && (
                      <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded">
                        Applied to Actual
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {rec.reason || 'No description provided'} •{' '}
                    <strong>{rec.classesAffected || 0} timetable classes</strong>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {!rec.applied && (
                    <button
                      type="button"
                      onClick={() => onApplyLeaveToActual(rec)}
                      className="px-2.5 py-1 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded border border-indigo-200 cursor-pointer"
                    >
                      Apply to Attendance
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onDeleteLeaveRecord(rec.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                    title="Delete record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
