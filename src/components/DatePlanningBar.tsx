import React, { useState } from 'react';
import { Calendar, Clock, Target, CalendarDays, Plus, X, Tag } from 'lucide-react';
import { formatDisplayDate } from '../utils/attendanceMath';

interface DatePlanningBarProps {
  todayDate: Date;
  planningDate: string;
  onPlanningDateChange: (dateStr: string) => void;
  semesterEndDate: string;
  onSemesterEndDateChange: (dateStr: string) => void;
  novemberDeadline: string;
  onNovemberDeadlineChange: (dateStr: string) => void;
  onResetPlanningToToday: () => void;
  classesFromTodayToPlanning: number;
  classesFromPlanningToEnd: number;
  classesFromCurrentToNovember: number;
  customHolidays: string[];
  onAddHoliday: (date: string) => void;
  onRemoveHoliday: (date: string) => void;
}

export const DatePlanningBar: React.FC<DatePlanningBarProps> = ({
  todayDate,
  planningDate,
  onPlanningDateChange,
  semesterEndDate,
  onSemesterEndDateChange,
  novemberDeadline,
  onNovemberDeadlineChange,
  onResetPlanningToToday,
  classesFromTodayToPlanning,
  classesFromPlanningToEnd,
  classesFromCurrentToNovember,
  customHolidays,
  onAddHoliday,
  onRemoveHoliday,
}) => {
  const [newHoliday, setNewHoliday] = useState('');
  const [showHolidayInput, setShowHolidayInput] = useState(false);

  const isPlanningToday =
    new Date(planningDate).toDateString() === todayDate.toDateString();

  const handleAddHolidaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newHoliday) {
      onAddHoliday(newHoliday);
      setNewHoliday('');
      setShowHolidayInput(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 sm:p-5 space-y-4">
      {/* 3 Main Date Controls */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 divide-y md:divide-y-0 md:divide-x divide-slate-100">
        {/* 1. Today's Auto-Detected Real Date */}
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600 flex-shrink-0 mt-0.5">
            <Clock className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Today's Date
              </span>
              <span className="inline-flex items-center px-1.5 py-0.2 text-[10px] font-bold bg-emerald-50 text-emerald-700 rounded-sm border border-emerald-200">
                LIVE
              </span>
            </div>
            <p className="text-sm sm:text-base font-bold text-slate-800 tracking-tight mt-0.5">
              {formatDisplayDate(todayDate)}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Detected from system/browser
            </p>
          </div>
        </div>

        {/* 2. Planning Date Picker */}
        <div className="pt-3 md:pt-0 md:pl-4 flex items-start gap-3">
          <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600 flex-shrink-0 mt-0.5">
            <Calendar className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Planning Date
              </span>
              {!isPlanningToday && (
                <button
                  type="button"
                  onClick={onResetPlanningToToday}
                  className="text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer underline"
                >
                  Reset Today
                </button>
              )}
            </div>
            <input
              type="date"
              value={planningDate}
              onChange={(e) => onPlanningDateChange(e.target.value)}
              className="mt-1 w-full text-xs font-semibold text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
            />
            <p className="text-[11px] font-medium text-indigo-700 mt-1">
              {classesFromTodayToPlanning > 0
                ? `${classesFromTodayToPlanning} timetable periods till planning`
                : 'Current simulation date'}
            </p>
          </div>
        </div>

        {/* 3. Semester End Date */}
        <div className="pt-3 md:pt-0 md:pl-4 flex items-start gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600 flex-shrink-0 mt-0.5">
            <CalendarDays className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Semester End Date
              </span>
            </div>
            <input
              type="date"
              value={semesterEndDate}
              onChange={(e) => onSemesterEndDateChange(e.target.value)}
              className="mt-1 w-full text-xs font-semibold text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
            />
            <p className="text-[11px] font-medium text-emerald-700 mt-1">
              <strong>{classesFromPlanningToEnd}</strong> timetable classes left
            </p>
          </div>
        </div>

        {/* 4. November Recovery Deadline */}
        <div className="pt-3 md:pt-0 md:pl-4 flex items-start gap-3">
          <div className="p-2.5 rounded-lg bg-amber-50 text-amber-600 flex-shrink-0 mt-0.5">
            <Target className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Nov Recovery Deadline
              </span>
              <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-1 py-0.2 rounded">
                Default
              </span>
            </div>
            <input
              type="date"
              value={novemberDeadline}
              onChange={(e) => onNovemberDeadlineChange(e.target.value)}
              className="mt-1 w-full text-xs font-semibold text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
            />
            <p className="text-[11px] font-medium text-amber-700 mt-1">
              <strong>{classesFromCurrentToNovember}</strong> classes before Nov deadline
            </p>
          </div>
        </div>
      </div>

      {/* Explicit Holidays & Non-Working Days Configuration (Requirement 10) */}
      <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-slate-600 flex items-center gap-1">
            <Tag className="w-3.5 h-3.5 text-slate-400" />
            Holidays / Academic Leaves:
          </span>
          {customHolidays.length === 0 ? (
            <span className="text-slate-400 italic">None added (Weekends are automatically excluded)</span>
          ) : (
            customHolidays.map((h) => (
              <span
                key={h}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 font-medium"
              >
                <span>{h}</span>
                <button
                  type="button"
                  onClick={() => onRemoveHoliday(h)}
                  className="text-slate-400 hover:text-rose-600 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))
          )}
        </div>

        <div>
          {showHolidayInput ? (
            <form onSubmit={handleAddHolidaySubmit} className="flex items-center gap-1.5">
              <input
                type="date"
                required
                value={newHoliday}
                onChange={(e) => setNewHoliday(e.target.value)}
                className="text-xs px-2 py-1 border border-indigo-400 rounded bg-white"
              />
              <button
                type="submit"
                className="px-2 py-1 bg-indigo-600 text-white rounded text-xs font-semibold cursor-pointer"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => setShowHolidayInput(false)}
                className="px-2 py-1 bg-slate-200 text-slate-700 rounded text-xs cursor-pointer"
              >
                Cancel
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setShowHolidayInput(true)}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>Add Holiday / Non-working Day</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
