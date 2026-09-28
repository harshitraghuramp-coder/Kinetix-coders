import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  Calendar,
  Layers,
  Target,
  FileCheck2,
  ArrowRight,
  BookOpen,
} from 'lucide-react';
import { StudentUser } from '../../types/auth';
import { OFFICIAL_TIMETABLES } from '../../data/timetableData';
import { SectionTimetable } from '../../types/timetable';

interface FirstLoginSetupModalProps {
  isOpen: boolean;
  user: StudentUser;
  onComplete: (
    updatedUser: StudentUser,
    selectedTimetable: SectionTimetable,
    preferredTarget: number
  ) => void;
}

export const FirstLoginSetupModal: React.FC<FirstLoginSetupModalProps> = ({
  isOpen,
  user,
  onComplete,
}) => {
  const [year, setYear] = useState(user.year || 'III Year');
  const [branch, setBranch] = useState(user.branch || 'ECE');
  const [section, setSection] = useState(user.section || 'A');
  const [target, setTarget] = useState(75);

  if (!isOpen) return null;

  // Find matching timetable
  const matchingTimetable = OFFICIAL_TIMETABLES.find((t) => {
    return (
      t.yearLevel.toLowerCase().includes(year.toLowerCase()) &&
      t.branch.toLowerCase().includes(branch.toLowerCase()) &&
      t.section.toLowerCase() === section.toLowerCase()
    );
  }) || OFFICIAL_TIMETABLES[0];

  const handleFinish = () => {
    const updatedUser: StudentUser = {
      ...user,
      year,
      branch,
      section,
      isFirstLogin: false,
    };
    onComplete(updatedUser, matchingTimetable, target);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-indigo-100">
        <div className="text-center space-y-2 mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 ring-8 ring-indigo-50/50">
            <Sparkles className="w-6 h-6 text-indigo-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            Welcome, {user.name}!
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Let&apos;s link your official college section and semester timetable.
          </p>
        </div>

        <div className="space-y-4">
          {/* Section Selection */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              <span>Confirm Your Academic Enrollment</span>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Year
                </label>
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-800"
                >
                  <option value="I Year">I Year</option>
                  <option value="II Year">II Year</option>
                  <option value="III Year">III Year</option>
                  <option value="IV Year">IV Year</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Branch
                </label>
                <select
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-800"
                >
                  <option value="ECE">ECE</option>
                  <option value="BME">BME</option>
                  <option value="ECE-DS">ECE-DS</option>
                  <option value="SEEE">SEEE</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Section
                </label>
                <select
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-800"
                >
                  <option value="A">Section A</option>
                  <option value="B">Section B</option>
                  <option value="DS A">Section DS A</option>
                  <option value="DS">Section DS</option>
                </select>
              </div>
            </div>
          </div>

          {/* Matched Official Timetable Preview */}
          <div className="p-3.5 bg-indigo-50/70 rounded-xl border border-indigo-100 flex items-start gap-3">
            <BookOpen className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-bold text-indigo-950 block">
                Found Official PDF Timetable:
              </span>
              <p className="text-indigo-800 font-semibold mt-0.5">
                {matchingTimetable.displayName}
              </p>
              <p className="text-[11px] text-indigo-600/90 mt-0.5">
                Contains {matchingTimetable.subjects.length} official subjects, weekly schedule, and period frequencies.
              </p>
            </div>
          </div>

          {/* Preferred Attendance Target */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Preferred Target Threshold</span>
              <span className="text-indigo-600 font-extrabold">{target}%</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[75, 80, 90].map((tVal) => (
                <button
                  key={tVal}
                  type="button"
                  onClick={() => setTarget(tVal)}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    target === tVal
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Target className="w-3.5 h-3.5" />
                  <span>{tVal}% Target</span>
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Statutory 75% is required by regulations; 80% and 90% are recommended for honors/placements.
            </p>
          </div>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={handleFinish}
          className="mt-6 w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition cursor-pointer"
        >
          <span>Load Timetable & Launch Dashboard</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
