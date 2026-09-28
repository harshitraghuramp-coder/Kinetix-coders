import React from 'react';
import { SectionTimetable } from '../types/timetable';
import { Calendar, BookOpen, Layers, CheckCircle2 } from 'lucide-react';

interface TimetableSectionSelectorProps {
  timetables: SectionTimetable[];
  selectedTimetableId: string;
  onSelectTimetable: (id: string) => void;
  syncWithTimetableSubjects: () => void;
}

export const TimetableSectionSelector: React.FC<TimetableSectionSelectorProps> = ({
  timetables,
  selectedTimetableId,
  onSelectTimetable,
  syncWithTimetableSubjects,
}) => {
  const current = timetables.find((t) => t.id === selectedTimetableId) || timetables[0];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 sm:p-5 space-y-3">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-600" />
          <h2 className="text-sm font-bold text-slate-800">
            Selected Official Class / Section Timetable
          </h2>
        </div>
        <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
          Source: Official SRM IST PDF
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
        {/* Dropdown */}
        <div className="sm:col-span-8">
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Choose Your Class Timetable:
          </label>
          <select
            value={selectedTimetableId}
            onChange={(e) => onSelectTimetable(e.target.value)}
            className="w-full text-xs sm:text-sm font-bold text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
          >
            {timetables.map((t) => (
              <option key={t.id} value={t.id}>
                {t.displayName} — {t.branch} ({t.section})
              </option>
            ))}
          </select>
        </div>

        {/* Sync Subjects Button */}
        <div className="sm:col-span-4 sm:pt-4">
          <button
            type="button"
            onClick={syncWithTimetableSubjects}
            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg shadow-2xs transition-colors cursor-pointer"
            title="Load all subjects from this timetable into attendance planner"
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
            <span>Sync All Subjects ({current.subjects.length})</span>
          </button>
        </div>
      </div>

      {/* Info Pills */}
      <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-600">
        <span className="bg-slate-100 px-2 py-0.5 rounded font-medium">
          Academic Year: <strong>{current.academicYear}</strong>
        </span>
        <span className="bg-slate-100 px-2 py-0.5 rounded font-medium">
          Semester: <strong>{current.semesterType} ({current.semesterNum})</strong>
        </span>
        <span className="bg-slate-100 px-2 py-0.5 rounded font-medium">
          Venue: <strong>{current.venue || 'Campus'}</strong>
        </span>
        <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded font-medium flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          <span>Timetable active for calculation</span>
        </span>
      </div>
    </div>
  );
};
