import React, { useState } from 'react';
import { SubjectCalculation, OverallSemesterStats } from '../types/attendance';
import { SectionTimetable } from '../types/timetable';
import {
  PieChart,
  BarChart3,
  TrendingUp,
  Activity,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ShieldAlert,
  Calendar,
} from 'lucide-react';

interface AttendanceAnalyticsProps {
  stats: OverallSemesterStats;
  calculations: SubjectCalculation[];
  selectedTarget: number;
  currentTimetable: SectionTimetable;
  planningDate: string;
  semesterEndDate: string;
}

export const AttendanceAnalytics: React.FC<AttendanceAnalyticsProps> = ({
  stats,
  calculations,
  selectedTarget,
  currentTimetable,
  planningDate,
  semesterEndDate,
}) => {
  const [selectedSubIndex, setSelectedSubIndex] = useState<number>(0);

  // Circular progress calculations for Overall Attendance Doughnut Chart
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const overallPct = Math.min(100, Math.max(0, stats.currentPercentage));
  const strokeDashoffset = circumference - (overallPct / 100) * circumference;

  // Breakdown counts
  const totalSubs = Math.max(1, calculations.length);
  const safePct = ((stats.safeCount / totalSubs) * 100).toFixed(1);
  const warningPct = ((stats.warningCount / totalSubs) * 100).toFixed(1);
  const recoverablePct = ((stats.recoverableCount / totalSubs) * 100).toFixed(1);
  const detentionPct = ((stats.detentionCount / totalSubs) * 100).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Top Row: Overall Doughnut + Status Breakdown Chart */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* A. Overall Circular/Doughnut Progress Chart */}
        <div className="md:col-span-5 bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 sm:p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-4">
            <div className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">Overall Attendance Health</h3>
            </div>
            <span
              className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full ${
                stats.currentPercentage >= 75
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}
            >
              {stats.currentPercentage >= 75 ? 'Statutory Safe' : 'Below 75%'}
            </span>
          </div>

          <div className="relative flex items-center justify-center my-2">
            <svg className="w-44 h-44 transform -rotate-90">
              {/* Background circle */}
              <circle
                cx="88"
                cy="88"
                r={radius}
                stroke="#e2e8f0"
                strokeWidth="14"
                fill="transparent"
              />
              {/* Target 75% indicator line */}
              <circle
                cx="88"
                cy="88"
                r={radius}
                stroke="#cbd5e1"
                strokeWidth="16"
                strokeDasharray={`2 ${circumference / 4 - 2}`}
                fill="transparent"
              />
              {/* Animated Progress circle */}
              <circle
                cx="88"
                cy="88"
                r={radius}
                stroke={
                  stats.currentPercentage >= 80
                    ? '#10b981'
                    : stats.currentPercentage >= 75
                    ? '#0d9488'
                    : stats.currentPercentage >= 65
                    ? '#f59e0b'
                    : '#ef4444'
                }
                strokeWidth="14"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                className="transition-all duration-700 ease-out"
              />
            </svg>

            {/* Inner Center Text */}
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-3xl font-black text-slate-900 tracking-tight">
                {stats.currentPercentage.toFixed(2)}%
              </span>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Overall
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5">
                Target: {selectedTarget}%
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-center text-xs mt-3 pt-3 border-t border-slate-100">
            <div className="bg-slate-50 p-2 rounded-lg">
              <span className="block text-[10px] text-slate-500 font-medium">Attended / Total</span>
              <span className="font-bold text-slate-800">
                {stats.totalAttended} / {stats.totalConducted} classes
              </span>
            </div>
            <div className="bg-slate-50 p-2 rounded-lg">
              <span className="block text-[10px] text-slate-500 font-medium">Max Possible</span>
              <span className="font-bold text-emerald-700">
                {stats.maxPossiblePercentage.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>

        {/* C. Attendance Status Visual Category Breakdown */}
        <div className="md:col-span-7 bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 sm:p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">Attendance Status Breakdown</h3>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              Total: {calculations.length} subjects
            </span>
          </div>

          {/* Stacked Percentage Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-600 font-semibold">
              <span>Category Distribution</span>
              <span>100% of curriculum</span>
            </div>
            <div className="w-full h-4 bg-slate-100 rounded-full flex overflow-hidden shadow-inner">
              {stats.safeCount > 0 && (
                <div
                  style={{ width: `${safePct}%` }}
                  className="bg-emerald-500 h-full transition-all duration-500"
                  title={`Safe: ${stats.safeCount} (${safePct}%)`}
                />
              )}
              {stats.warningCount > 0 && (
                <div
                  style={{ width: `${warningPct}%` }}
                  className="bg-amber-500 h-full transition-all duration-500"
                  title={`Warning: ${stats.warningCount} (${warningPct}%)`}
                />
              )}
              {stats.recoverableCount > 0 && (
                <div
                  style={{ width: `${recoverablePct}%` }}
                  className="bg-orange-500 h-full transition-all duration-500"
                  title={`Recoverable: ${stats.recoverableCount} (${recoverablePct}%)`}
                />
              )}
              {stats.detentionCount > 0 && (
                <div
                  style={{ width: `${detentionPct}%` }}
                  className="bg-red-600 h-full transition-all duration-500"
                  title={`Detention: ${stats.detentionCount} (${detentionPct}%)`}
                />
              )}
            </div>
          </div>

          {/* 4 Detail Grid Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4">
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200/70 text-center">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
              <span className="text-xs font-bold text-emerald-950 block">Safe</span>
              <span className="text-xl font-extrabold text-emerald-700">{stats.safeCount}</span>
              <span className="text-[10px] text-emerald-600 block mt-0.5">{safePct}%</span>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/70 text-center">
              <AlertTriangle className="w-4 h-4 text-amber-600 mx-auto mb-1" />
              <span className="text-xs font-bold text-amber-950 block">Warning</span>
              <span className="text-xl font-extrabold text-amber-700">{stats.warningCount}</span>
              <span className="text-[10px] text-amber-600 block mt-0.5">{warningPct}%</span>
            </div>

            <div className="p-3 rounded-xl bg-orange-50 border border-orange-200/70 text-center">
              <Flame className="w-4 h-4 text-orange-600 mx-auto mb-1" />
              <span className="text-xs font-bold text-orange-950 block">Recoverable</span>
              <span className="text-xl font-extrabold text-orange-700">{stats.recoverableCount}</span>
              <span className="text-[10px] text-orange-600 block mt-0.5">{recoverablePct}%</span>
            </div>

            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-center">
              <ShieldAlert className="w-4 h-4 text-red-600 mx-auto mb-1" />
              <span className="text-xs font-bold text-red-950 block">Detention</span>
              <span className="text-xl font-extrabold text-red-700">{stats.detentionCount}</span>
              <span className="text-[10px] text-red-600 block mt-0.5">{detentionPct}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* B. Subject-wise Attendance Comparative Bar Chart with Threshold Indicator */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Subject-wise Attendance Comparison
              </h3>
              <p className="text-xs text-slate-500">
                Visual benchmark against mandatory 75% threshold
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs font-medium">
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="w-3 h-3 rounded-sm bg-emerald-500" /> Safe (&ge;75%)
            </span>
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="w-3 h-3 rounded-sm bg-rose-500" /> Risk (&lt;75%)
            </span>
            <span className="flex items-center gap-1.5 text-slate-800 font-bold">
              <span className="w-2.5 h-0.5 bg-slate-900" /> 75% Statutory Line
            </span>
          </div>
        </div>

        {/* Visual Bar List with 75% threshold guide */}
        <div className="space-y-4 pt-1">
          {calculations.map((calc, i) => {
            const pct = calc.currentPercentage;
            const isSafe = pct >= 75;
            const sub = calc.subject;

            return (
              <div key={sub.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-800 truncate max-w-xs flex items-center gap-1.5">
                    <strong>{sub.name}</strong>
                    {sub.code && (
                      <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                        {sub.code}
                      </span>
                    )}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 text-[11px]">
                      {sub.attended} / {sub.conducted} classes
                    </span>
                    <span
                      className={`font-black text-sm px-2 py-0.5 rounded ${
                        isSafe
                          ? 'text-emerald-700 bg-emerald-50'
                          : 'text-rose-700 bg-rose-50'
                      }`}
                    >
                      {pct.toFixed(2)}%
                    </span>
                  </div>
                </div>

                {/* Progress bar container with 75% line */}
                <div className="relative w-full h-4 bg-slate-100 rounded-lg overflow-hidden">
                  <div
                    style={{ width: `${Math.min(100, pct)}%` }}
                    className={`h-full rounded-lg transition-all duration-500 ${
                      calc.warningLevel === 'IRREVERSIBLE_DETENTION'
                        ? 'bg-red-600'
                        : isSafe
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                        : 'bg-gradient-to-r from-rose-500 to-amber-500'
                    }`}
                  />
                  {/* Vertical 75% threshold indicator mark */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-slate-900/70 z-10"
                    style={{ left: '75%' }}
                    title="75% Requirement Threshold"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* D. Future Attendance Projections Matrix */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Future Attendance Projections (Current vs Minimum Plan vs 100% Plan)
              </h3>
              <p className="text-xs text-slate-500">
                End-of-semester simulations across all remaining timetable classes
              </p>
            </div>
          </div>
          <span className="text-xs font-bold bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg border border-indigo-200">
            Planning Horizon: {semesterEndDate}
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <th className="py-2.5 px-3">Subject</th>
                <th className="py-2.5 px-3 text-center">Remaining</th>
                <th className="py-2.5 px-3 text-center">Current %</th>
                <th className="py-2.5 px-3 text-center bg-indigo-50/50">
                  Projected with 75% Plan
                </th>
                <th className="py-2.5 px-3 text-center bg-emerald-50/50">
                  Projected with 100% Plan
                </th>
                <th className="py-2.5 px-3 text-center">Feasibility</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {calculations.map((calc) => {
                const sub = calc.subject;
                const a75 = calc.analysis75;
                const rem = calc.effectiveRemaining;
                const totalFinal = sub.conducted + rem;

                // Projected if student attends minimum required:
                const planAttended = sub.attended + a75.requiredToAttend;
                const planPct =
                  totalFinal === 0
                    ? 100
                    : Number(((planAttended / totalFinal) * 100).toFixed(2));

                return (
                  <tr key={sub.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                      {sub.name}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-slate-600">
                      {rem}
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold">
                      <span
                        className={
                          calc.currentPercentage >= 75
                            ? 'text-emerald-700'
                            : 'text-rose-700'
                        }
                      >
                        {calc.currentPercentage.toFixed(2)}%
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold bg-indigo-50/30 text-indigo-900">
                      {a75.isPossible ? (
                        <span>
                          {planPct.toFixed(2)}% ({a75.requiredToAttend} more attended)
                        </span>
                      ) : (
                        <span className="text-red-600 font-extrabold">Impossible</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold bg-emerald-50/30 text-emerald-800">
                      {calc.maxPossibleFinalPercentage.toFixed(2)}% (all {rem} attended)
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {calc.warningLevel === 'IRREVERSIBLE_DETENTION' ? (
                        <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-black bg-red-600 text-white">
                          DETENTION
                        </span>
                      ) : a75.isAlreadyAchieved ? (
                        <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          Already Secured
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                          Recoverable
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
