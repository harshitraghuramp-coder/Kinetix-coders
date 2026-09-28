import React, { useState } from 'react';
import { GraduationCap, BookOpen, Users, PlusCircle, Check, X, Settings2 } from 'lucide-react';
import { StudentProfile } from '../types/attendance';

interface ProfileSelectorProps {
  profile: StudentProfile;
  onProfileChange: (newProfile: StudentProfile) => void;
  years: string[];
  branches: string[];
  sections: string[];
  onAddBranch: (branch: string) => void;
  onAddSection: (section: string) => void;
}

export const ProfileSelector: React.FC<ProfileSelectorProps> = ({
  profile,
  onProfileChange,
  years,
  branches,
  sections,
  onAddBranch,
  onAddSection,
}) => {
  const [showAddSection, setShowAddSection] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [showAddBranch, setShowAddBranch] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');

  const handleCreateSection = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSectionName.trim()) {
      const trimmed = newSectionName.trim();
      onAddSection(trimmed);
      onProfileChange({ ...profile, section: trimmed });
      setNewSectionName('');
      setShowAddSection(false);
    }
  };

  const handleCreateBranch = (e: React.FormEvent) => {
    e.preventDefault();
    if (newBranchName.trim()) {
      const trimmed = newBranchName.trim();
      onAddBranch(trimmed);
      onProfileChange({ ...profile, branch: trimmed });
      setNewBranchName('');
      setShowAddBranch(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
        <div className="flex items-center gap-2">
          <Settings2 className="w-4 h-4 text-indigo-600" />
          <h2 className="text-sm font-semibold text-slate-800">
            Student Academic Profile
          </h2>
        </div>
        <span className="text-xs text-slate-500 hidden sm:inline">
          {profile.year} • {profile.branch} • {profile.section}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
        {/* Year Dropdown */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5 flex items-center gap-1.5">
            <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
            <span>Academic Year</span>
          </label>
          <select
            value={profile.year}
            onChange={(e) => onProfileChange({ ...profile, year: e.target.value })}
            className="w-full text-sm font-medium text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-colors"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        {/* Branch Dropdown & Custom Branch */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium text-slate-600 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-slate-400" />
              <span>Department / Branch</span>
            </label>
            {!showAddBranch && (
              <button
                type="button"
                onClick={() => setShowAddBranch(true)}
                className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium inline-flex items-center gap-0.5 cursor-pointer"
              >
                <PlusCircle className="w-3 h-3" />
                <span>Add</span>
              </button>
            )}
          </div>

          {showAddBranch ? (
            <form onSubmit={handleCreateBranch} className="flex items-center gap-1.5">
              <input
                type="text"
                autoFocus
                placeholder="e.g. Data Science"
                value={newBranchName}
                onChange={(e) => setNewBranchName(e.target.value)}
                className="w-full text-xs font-medium text-slate-800 bg-white border border-indigo-400 rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              />
              <button
                type="submit"
                className="p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md cursor-pointer"
                title="Save branch"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setShowAddBranch(false)}
                className="p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-md cursor-pointer"
                title="Cancel"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </form>
          ) : (
            <select
              value={profile.branch}
              onChange={(e) => onProfileChange({ ...profile, branch: e.target.value })}
              className="w-full text-sm font-medium text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none truncate transition-colors"
            >
              {branches.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Section Dropdown & Custom Section */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium text-slate-600 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              <span>Class / Section</span>
            </label>
            {!showAddSection && (
              <button
                type="button"
                onClick={() => setShowAddSection(true)}
                className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium inline-flex items-center gap-0.5 cursor-pointer"
              >
                <PlusCircle className="w-3 h-3" />
                <span>Add</span>
              </button>
            )}
          </div>

          {showAddSection ? (
            <form onSubmit={handleCreateSection} className="flex items-center gap-1.5">
              <input
                type="text"
                autoFocus
                placeholder="e.g. Section E"
                value={newSectionName}
                onChange={(e) => setNewSectionName(e.target.value)}
                className="w-full text-xs font-medium text-slate-800 bg-white border border-indigo-400 rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              />
              <button
                type="submit"
                className="p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md cursor-pointer"
                title="Save section"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setShowAddSection(false)}
                className="p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-md cursor-pointer"
                title="Cancel"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </form>
          ) : (
            <select
              value={profile.section}
              onChange={(e) => onProfileChange({ ...profile, section: e.target.value })}
              className="w-full text-sm font-medium text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-colors"
            >
              {sections.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>
    </div>
  );
};
