import React, { useState } from 'react';
import { SectionTimetable, OfficialSubject } from '../types/timetable';
import { Calendar, Clock, Filter, BookOpen, User, Building, MapPin, Search } from 'lucide-react';

interface TimetableViewerProps {
  timetables: SectionTimetable[];
  selectedTimetable: SectionTimetable;
  onSelectTimetable: (timetableId: string) => void;
}

export const TimetableViewer: React.FC<TimetableViewerProps> = ({
  timetables,
  selectedTimetable,
  onSelectTimetable,
}) => {
  const [dayFilter, setDayFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  const filteredDays = dayFilter === 'ALL' ? days : [dayFilter];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden space-y-4 p-5 sm:p-6">
      {/* Header and Source Provenance */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[11px] font-bold bg-indigo-50 text-indigo-700 rounded-md border border-indigo-200/60 uppercase tracking-wide">
              Official PDF Source of Truth
            </span>
            <span className="text-xs text-slate-500">SRM IST Tiruchirappalli</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
            {selectedTimetable.displayName}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 flex items-center gap-3 mt-1">
            <span>
              <strong>Program:</strong> {selectedTimetable.branch} ({selectedTimetable.section})
            </span>
            {selectedTimetable.venue && (
              <span className="flex items-center gap-1 text-slate-600">
                <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                Venue: {selectedTimetable.venue}
              </span>
            )}
          </p>
        </div>

        {/* Timetable Section Dropdown */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <label className="text-xs font-semibold text-slate-600 sm:text-right">
            Select Class / Section:
          </label>
          <select
            value={selectedTimetable.id}
            onChange={(e) => onSelectTimetable(e.target.value)}
            className="text-xs font-bold bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            {timetables.map((t) => (
              <option key={t.id} value={t.id}>
                {t.displayName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200/70">
        {/* Day Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5" /> Day:
          </span>
          <button
            type="button"
            onClick={() => setDayFilter('ALL')}
            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
              dayFilter === 'ALL'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            All Days
          </button>
          {days.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDayFilter(d)}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                dayFilter === d
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              {d.slice(0, 3)}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search subject or faculty..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="text-xs pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 w-48 sm:w-60"
          />
        </div>
      </div>

      {/* Timetable Grid Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-xs text-center border-collapse">
          <thead>
            <tr className="bg-slate-100 text-slate-700 font-bold uppercase border-b border-slate-200">
              <th className="py-2.5 px-3 text-left w-24">Day / Period</th>
              {selectedTimetable.timeSlots.map((ts) => (
                <th key={ts.period} className="py-2 px-2 border-l border-slate-200">
                  <div className="font-extrabold text-slate-900">P{ts.period}</div>
                  <div className="text-[10px] text-slate-500 font-normal">{ts.time}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredDays.map((day) => {
              const periods = selectedTimetable.schedule[day] || [];
              return (
                <tr key={day} className="hover:bg-slate-50/50">
                  <td className="py-3 px-3 text-left font-bold text-slate-800 bg-slate-50 border-r border-slate-200">
                    {day}
                  </td>
                  {periods.map((slot, idx) => {
                    const isLunch = slot === 'LUNCH';
                    const isEmpty = !slot || slot === '-';
                    const isLabOrWorkshop =
                      slot.toLowerCase().includes('lab') || slot.toLowerCase().includes('workshop');

                    // Check if matches search
                    const isMatch =
                      searchQuery &&
                      slot.toLowerCase().includes(searchQuery.toLowerCase());

                    return (
                      <td
                        key={idx}
                        className={`py-2 px-1.5 border-l border-slate-200 font-medium ${
                          isLunch
                            ? 'bg-amber-50/60 text-amber-800 font-bold text-[10px]'
                            : isEmpty
                            ? 'bg-slate-50/40 text-slate-300'
                            : isLabOrWorkshop
                            ? 'bg-blue-50/80 text-blue-900 font-semibold'
                            : 'bg-white text-slate-800'
                        } ${isMatch ? 'ring-2 ring-indigo-500 font-black' : ''}`}
                      >
                        <div className="truncate max-w-[90px] mx-auto text-xs" title={slot}>
                          {slot}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Official Course & Faculty Legend Table */}
      <div className="pt-3">
        <h3 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-1.5">
          <BookOpen className="w-4 h-4 text-indigo-600" />
          <span>Extracted Subject Allocation & Faculty List</span>
        </h3>
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <th className="py-2.5 px-3">Slot</th>
                <th className="py-2.5 px-3">Sub. Code</th>
                <th className="py-2.5 px-4">Subject Name</th>
                <th className="py-2.5 px-2 text-center">L-T-P-C</th>
                <th className="py-2.5 px-2 text-center">Weekly Periods</th>
                <th className="py-2.5 px-3">Name of Faculty</th>
                <th className="py-2.5 px-3">Designation / Dept</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {selectedTimetable.subjects.map((sub) => (
                <tr key={sub.code} className="hover:bg-slate-50">
                  <td className="py-2 px-3 font-mono font-bold text-indigo-700">{sub.slot}</td>
                  <td className="py-2 px-3 font-mono text-slate-600">{sub.code}</td>
                  <td className="py-2 px-4 font-semibold text-slate-900">
                    {sub.name}
                    {sub.isLab && (
                      <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                        LAB
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-2 text-center font-mono text-slate-500">{sub.credits}</td>
                  <td className="py-2 px-2 text-center font-bold text-indigo-900 bg-indigo-50/50">
                    {sub.periodsPerWeek} / wk
                  </td>
                  <td className="py-2 px-3 text-slate-700 font-medium">{sub.faculty}</td>
                  <td className="py-2 px-3 text-slate-500">{sub.department}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
