import React, { useState, useEffect } from 'react';
import { X, BookPlus, AlertCircle } from 'lucide-react';
import { Subject } from '../types/attendance';
import { OfficialSubject } from '../types/timetable';

interface AddEditSubjectModalProps {
  isOpen: boolean;
  subjectToEdit: Subject | null;
  defaultRemainingClasses: number;
  availableTimetableSubjects: OfficialSubject[];
  onSave: (subject: Subject) => void;
  onClose: () => void;
}

export const AddEditSubjectModal: React.FC<AddEditSubjectModalProps> = ({
  isOpen,
  subjectToEdit,
  defaultRemainingClasses,
  availableTimetableSubjects,
  onSave,
  onClose,
}) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [faculty, setFaculty] = useState('');
  const [conducted, setConducted] = useState<string>('30');
  const [attended, setAttended] = useState<string>('24');
  const [remainingManual, setRemainingManual] = useState<string>('20');
  const [weeklyFrequency, setWeeklyFrequency] = useState<string>('4');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (subjectToEdit) {
      setName(subjectToEdit.name);
      setCode(subjectToEdit.code || '');
      setFaculty(subjectToEdit.faculty || '');
      setConducted(String(subjectToEdit.conducted));
      setAttended(String(subjectToEdit.attended));
      setRemainingManual(
        subjectToEdit.remainingManual !== undefined
          ? String(subjectToEdit.remainingManual)
          : String(defaultRemainingClasses)
      );
      setWeeklyFrequency(String(subjectToEdit.weeklyFrequency || 4));
    } else {
      setName('');
      setCode('');
      setFaculty('');
      setConducted('30');
      setAttended('24');
      setRemainingManual(String(defaultRemainingClasses));
      setWeeklyFrequency('4');
    }
    setError(null);
  }, [subjectToEdit, isOpen, defaultRemainingClasses]);

  if (!isOpen) return null;

  const numConducted = Math.max(0, parseInt(conducted, 10) || 0);
  const numAttended = Math.max(0, parseInt(attended, 10) || 0);
  const numRemaining = Math.max(0, parseInt(remainingManual, 10) || 0);
  const currentPct = numConducted > 0 ? ((numAttended / numConducted) * 100).toFixed(2) : '100.00';

  const handleSelectFromTimetable = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedCode = e.target.value;
    if (!selectedCode) return;
    const found = availableTimetableSubjects.find((s) => s.code === selectedCode);
    if (found) {
      setName(found.name);
      setCode(found.code);
      setFaculty(found.faculty);
      setWeeklyFrequency(String(found.periodsPerWeek));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Please enter a subject name.');
      return;
    }

    if (numAttended > numConducted) {
      setError('Classes attended cannot be greater than classes conducted so far.');
      return;
    }

    const newSubject: Subject = {
      id: subjectToEdit ? subjectToEdit.id : `sub-${Date.now()}`,
      name: name.trim(),
      code: code.trim() || undefined,
      faculty: faculty.trim() || undefined,
      conducted: numConducted,
      attended: numAttended,
      remainingManual: numRemaining,
      weeklyFrequency: parseInt(weeklyFrequency, 10) || 4,
    };

    onSave(newSubject);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <BookPlus className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              {subjectToEdit ? 'Edit Subject Details' : 'Add Subject from Timetable'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Select from Timetable */}
          {availableTimetableSubjects.length > 0 && !subjectToEdit && (
            <div>
              <label className="block text-xs font-semibold text-indigo-700 mb-1">
                ⚡ Select from Timetable Subjects:
              </label>
              <select
                onChange={handleSelectFromTimetable}
                defaultValue=""
                className="w-full text-xs font-semibold bg-indigo-50/60 border border-indigo-200 rounded-lg px-3 py-2 text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="">-- Choose a course from timetable --</option>
                {availableTimetableSubjects.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.code} - {s.name} ({s.periodsPerWeek} periods/wk)
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Subject Name & Code */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Subject Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Distributed Systems"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError(null);
                }}
                className="w-full text-sm font-medium text-slate-800 bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Code (Optional)
              </label>
              <input
                type="text"
                placeholder="21ECC301P"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full text-sm font-mono font-medium text-slate-800 bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Faculty */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Faculty / Instructor (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Dr. Manikandan"
              value={faculty}
              onChange={(e) => setFaculty(e.target.value)}
              className="w-full text-xs font-medium text-slate-800 bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* Conducted & Attended */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Classes Conducted *
              </label>
              <input
                type="number"
                min="0"
                required
                value={conducted}
                onChange={(e) => {
                  setConducted(e.target.value);
                  setError(null);
                }}
                className="w-full text-sm font-bold text-slate-800 bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Classes Attended *
              </label>
              <input
                type="number"
                min="0"
                max={numConducted}
                required
                value={attended}
                onChange={(e) => {
                  setAttended(e.target.value);
                  setError(null);
                }}
                className="w-full text-sm font-bold text-slate-800 bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Live Calculated Percentage Badge */}
          <div className="p-2.5 rounded-lg bg-indigo-50/70 border border-indigo-100 flex items-center justify-between text-xs">
            <span className="font-semibold text-indigo-950">
              Current Calculated Attendance:
            </span>
            <span
              className={`font-black text-sm px-2 py-0.5 rounded ${
                Number(currentPct) >= 75
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-rose-100 text-rose-800'
              }`}
            >
              {currentPct}%
            </span>
          </div>

          {/* Remaining Classes in Semester */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Remaining Classes
              </label>
              <input
                type="number"
                min="0"
                value={remainingManual}
                onChange={(e) => setRemainingManual(e.target.value)}
                className="w-full text-sm font-bold text-slate-800 bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-500">
                Calculated from timetable
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Classes Per Week
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={weeklyFrequency}
                onChange={(e) => setWeeklyFrequency(e.target.value)}
                className="w-full text-sm font-bold text-slate-800 bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-500">
                Periods in weekly timetable
              </span>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm cursor-pointer"
            >
              {subjectToEdit ? 'Save Changes' : 'Add Subject'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
