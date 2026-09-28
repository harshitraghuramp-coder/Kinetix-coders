import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Flame,
  ShieldX,
  Layers,
  GraduationCap,
  CalendarCheck,
  TrendingUp,
} from 'lucide-react';
import { OverallSemesterStats } from '../types/attendance';

interface OverallDashboardProps {
  stats: OverallSemesterStats;
  selectedTarget: number;
  onSelectTarget: (target: number) => void;
  statusFilter: string;
  onStatusFilterChange: (filter: string) => void;
  totalSubjectCount: number;
}

export const OverallDashboard: React.FC<OverallDashboardProps> = ({
  stats,
  selectedTarget,
  onSelectTarget,
  statusFilter,
  onStatusFilterChange,
  totalSubjectCount,
}) => {
  const currentAnalysis =
    selectedTarget === 80
      ? stats.overallAnalysis80
      : selectedTarget === 90
      ? stats.overallAnalysis90
      : stats.overallAnalysis75;

  return (
    <div className="space-y-4">
      {/* 4 Quick Stat Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Aggregate Attendance % */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-4 sm:p-5 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Current Overall
            </span>
            <GraduationCap className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {stats.currentPercentage.toFixed(2)}%
            </span>
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                stats.currentPercentage >= 75
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}
            >
              {stats.currentPercentage >= 75 ? 'Above 75%' : 'Below 75%'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            {stats.totalAttended} attended of {stats.totalConducted} conducted
          </p>
          {/* Visual Mini Progress Bar */}
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                stats.currentPercentage >= 75 ? 'bg-emerald-500' : 'bg-rose-500'
              }`}
              style={{ width: `${Math.min(100, stats.currentPercentage)}%` }}
            />
          </div>
        </div>

        {/* Card 2: Total Remaining Classes */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-4 sm:p-5">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Total Remaining
            </span>
            <CalendarCheck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {stats.totalRemaining}
            </span>
            <span className="text-xs font-medium text-slate-500">classes left</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Across {totalSubjectCount} subjects till deadline
          </p>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
            <div
              className="bg-blue-500 h-full rounded-full"
              style={{
                width: `${Math.min(
                  100,
                  (stats.totalRemaining /
                    Math.max(1, stats.totalConducted + stats.totalRemaining)) *
                    100
                )}%`,
              }}
            />
          </div>
        </div>

        {/* Card 3: Max Possible Final Attendance */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-4 sm:p-5">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Max Possible
            </span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {stats.maxPossiblePercentage.toFixed(2)}%
            </span>
            <span className="text-xs font-medium text-emerald-600">at 100% attendance</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            If you attend every remaining class
          </p>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full"
              style={{ width: `${Math.min(100, stats.maxPossiblePercentage)}%` }}
            />
          </div>
        </div>

        {/* Card 4: Target Threshold Breakdown */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-4 sm:p-5">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              {selectedTarget}% Attendance Target
            </span>
            <div className="flex gap-1">
              {[75, 80, 90].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => onSelectTarget(t)}
                  className={`text-[11px] font-bold px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                    selectedTarget === t
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {t}%
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            {currentAnalysis.isPossible ? (
              <>
                <span className="text-2xl sm:text-3xl font-extrabold text-indigo-700 tracking-tight">
                  {currentAnalysis.requiredToAttend}
                </span>
                <span className="text-xs font-medium text-slate-500">
                  to attend (can miss {currentAnalysis.maxCanMiss})
                </span>
              </>
            ) : (
              <span className="text-lg font-bold text-rose-600">
                Impossible (Short {currentAnalysis.shortfallPercentage.toFixed(1)}%)
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-2">
            {currentAnalysis.isAlreadyAchieved
              ? `Overall target ${selectedTarget}% already secured!`
              : `Overall required to reach ${selectedTarget}% semester-wide`}
          </p>
        </div>
      </div>

      {/* Status Categorization Pills / Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-slate-500" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
            Subject Breakdown:
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {/* All Filter */}
          <button
            type="button"
            onClick={() => onStatusFilterChange('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              statusFilter === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All Subjects ({totalSubjectCount})
          </button>

          {/* Safe */}
          <button
            type="button"
            onClick={() => onStatusFilterChange('SAFE')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              statusFilter === 'SAFE'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/60'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Safe ({stats.safeCount})</span>
          </button>

          {/* Warning */}
          <button
            type="button"
            onClick={() => onStatusFilterChange('WARNING')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              statusFilter === 'WARNING'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200/60'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Warning ({stats.warningCount})</span>
          </button>

          {/* Recoverable */}
          <button
            type="button"
            onClick={() => onStatusFilterChange('RECOVERABLE')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              statusFilter === 'RECOVERABLE'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'bg-orange-50 text-orange-800 hover:bg-orange-100 border border-orange-200/60'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Recoverable ({stats.recoverableCount})</span>
          </button>

          {/* Detention */}
          <button
            type="button"
            onClick={() => onStatusFilterChange('IRREVERSIBLE_DETENTION')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              statusFilter === 'IRREVERSIBLE_DETENTION'
                ? 'bg-red-700 text-white shadow-xs'
                : 'bg-red-50 text-red-800 hover:bg-red-100 border border-red-300'
            }`}
          >
            <ShieldX className="w-3.5 h-3.5 text-red-600" />
            <span>Detention ({stats.detentionCount})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
