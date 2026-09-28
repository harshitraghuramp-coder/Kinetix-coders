import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Flame,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Edit2,
  Trash2,
  Plus,
  Minus,
  Check,
  X,
  Zap,
} from 'lucide-react';
import { SubjectCalculation, WarningLevel } from '../types/attendance';

interface SubjectCardProps {
  calc: SubjectCalculation;
  selectedTarget: number;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onQuickUpdate: (id: string, attendedDelta: number, conductedDelta: number) => void;
}

export const SubjectCard: React.FC<SubjectCardProps> = ({
  calc,
  selectedTarget,
  onEdit,
  onDelete,
  onQuickUpdate,
}) => {
  const [expanded, setExpanded] = useState(false);
  const { subject, currentPercentage, effectiveRemaining, warningLevel, statusLabel, statusExplanation } = calc;

  // Active target analysis based on selectedTarget (75, 80, 90)
  const activeAnalysis =
    selectedTarget === 80
      ? calc.analysis80
      : selectedTarget === 90
      ? calc.analysis90
      : calc.analysis75;

  const getStatusBadge = (level: WarningLevel) => {
    switch (level) {
      case 'SAFE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>SAFE</span>
          </span>
        );
      case 'WARNING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>CLOSE TO MINIMUM</span>
          </span>
        );
      case 'RECOVERABLE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-orange-50 text-orange-800 border border-orange-300">
            <Flame className="w-3.5 h-3.5 text-orange-600" />
            <span>RECOVERABLE</span>
          </span>
        );
      case 'IRREVERSIBLE_DETENTION':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-red-600 text-white shadow-xs animate-pulse">
            <ShieldAlert className="w-3.5 h-3.5 text-white" />
            <span>IRREVERSIBLE DETENTION</span>
          </span>
        );
    }
  };

  const getProgressColor = (pct: number, level: WarningLevel) => {
    if (level === 'IRREVERSIBLE_DETENTION') return 'bg-red-600';
    if (pct >= 85) return 'bg-emerald-500';
    if (pct >= 75) return 'bg-teal-500';
    if (pct >= 65) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  return (
    <div
      id={`subject-card-${subject.id}`}
      className={`bg-white rounded-xl border transition-all duration-200 ${
        warningLevel === 'IRREVERSIBLE_DETENTION'
          ? 'border-red-400 shadow-md ring-1 ring-red-300'
          : warningLevel === 'WARNING'
          ? 'border-amber-300 shadow-xs'
          : warningLevel === 'RECOVERABLE'
          ? 'border-orange-300 shadow-xs'
          : 'border-slate-200/90 shadow-xs hover:border-slate-300'
      }`}
    >
      {/* Header bar */}
      <div className="p-4 sm:p-5 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                {subject.name}
              </h3>
              {subject.code && (
                <span className="text-xs font-mono font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                  {subject.code}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              {subject.attended} attended / {subject.conducted} conducted • {effectiveRemaining} classes remaining
              {subject.weeklyFrequency && ` • ${subject.weeklyFrequency} / week`}
              {subject.faculty && ` • Faculty: ${subject.faculty}`}
            </p>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {getStatusBadge(warningLevel)}
            <button
              type="button"
              onClick={() => onEdit(subject.id)}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Edit subject"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(subject.id)}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              title="Delete subject"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress Bar & Percentage display */}
        <div className="mt-3.5 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700">
              Current: <strong className="text-sm text-slate-900">{currentPercentage.toFixed(2)}%</strong>
            </span>
            <span className="text-slate-500 font-medium">
              Target: <strong className="text-slate-800">{selectedTarget}%</strong> | Max Possible:{' '}
              <strong className="text-slate-800">
                {calc.analysis75.maxPossibleAttendance.toFixed(2)}%
              </strong>
            </span>
          </div>

          {/* Dual marker progress bar showing 75% target threshold */}
          <div className="relative w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${getProgressColor(
                currentPercentage,
                warningLevel
              )}`}
              style={{ width: `${Math.min(100, currentPercentage)}%` }}
            />
            {/* 75% indicator line */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-slate-900/60 z-10"
              style={{ left: '75%' }}
              title="75% Statutory Threshold"
            />
          </div>
        </div>

        {/* Status explanation alert callout */}
        <div
          className={`mt-3 p-3 rounded-lg text-xs leading-relaxed ${
            warningLevel === 'IRREVERSIBLE_DETENTION'
              ? 'bg-red-50 text-red-900 border border-red-200 font-medium'
              : warningLevel === 'RECOVERABLE'
              ? 'bg-orange-50 text-orange-900 border border-orange-200'
              : warningLevel === 'WARNING'
              ? 'bg-amber-50 text-amber-900 border border-amber-200'
              : 'bg-emerald-50 text-emerald-900 border border-emerald-100'
          }`}
        >
          {statusExplanation}
        </div>

        {/* November Deadline Warning Callout (Requirement 7) */}
        {calc.currentPercentage < 75 && (
          <div
            className={`mt-2 p-2.5 rounded-lg text-xs flex items-start gap-2 ${
              !calc.novemberAnalysis.isRecoverableBeforeNov
                ? 'bg-rose-100/90 text-rose-950 border border-rose-300 font-semibold'
                : 'bg-indigo-50 text-indigo-900 border border-indigo-200'
            }`}
          >
            <div className="font-bold shrink-0">Nov Deadline:</div>
            <div>
              {!calc.novemberAnalysis.isRecoverableBeforeNov ? (
                <span>
                  <strong>"Recovery before November is mathematically impossible."</strong> (Scheduled: {calc.novemberAnalysis.classesBeforeNov} classes; Max possible by Nov: {calc.novemberAnalysis.maxPossibleByNov.toFixed(2)}%).
                </span>
              ) : (
                <span>
                  {calc.novemberAnalysis.explanation}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Key Metrics Grid: Must Attend vs Can Miss */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 text-center">
          <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100">
            <span className="block text-[11px] text-slate-500 font-medium">
              Must Attend ({selectedTarget}%)
            </span>
            <span
              className={`text-base font-extrabold ${
                !activeAnalysis.isPossible
                  ? 'text-rose-600'
                  : activeAnalysis.requiredToAttend > 0
                  ? 'text-indigo-600'
                  : 'text-emerald-600'
              }`}
            >
              {!activeAnalysis.isPossible
                ? 'Impossible'
                : activeAnalysis.isAlreadyAchieved
                ? '0 (Achieved)'
                : `${activeAnalysis.requiredToAttend} / ${effectiveRemaining}`}
            </span>
          </div>

          <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100">
            <span className="block text-[11px] text-slate-500 font-medium">
              Can Miss ({selectedTarget}%)
            </span>
            <span
              className={`text-base font-extrabold ${
                activeAnalysis.maxCanMiss > 0 ? 'text-emerald-600' : 'text-slate-600'
              }`}
            >
              {activeAnalysis.isPossible ? `${activeAnalysis.maxCanMiss} classes` : '0 classes'}
            </span>
          </div>

          <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100">
            <span className="block text-[11px] text-slate-500 font-medium">
              Max Possible %
            </span>
            <span className="text-base font-extrabold text-slate-800">
              {calc.maxPossibleFinalPercentage.toFixed(2)}%
            </span>
          </div>

          <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100">
            <span className="block text-[11px] text-slate-500 font-medium flex items-center justify-center gap-1">
              <Zap className="w-3 h-3 text-amber-500" />
              <span>Bunk Right Now</span>
            </span>
            <span className="text-base font-extrabold text-slate-700">
              {activeAnalysis.instantBunkableNow > 0
                ? `${activeAnalysis.instantBunkableNow} in a row`
                : '0 (None)'}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Attendance Logger (1-Tap +1 Attended / +1 Missed) */}
      <div className="bg-slate-50/80 px-4 py-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-semibold text-slate-500">
          Quick Log Today's Class:
        </span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onQuickUpdate(subject.id, 1, 1)}
            className="inline-flex items-center gap-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded-md shadow-xs cursor-pointer transition-colors"
            title="Mark 1 class attended (+1 attended, +1 conducted, -1 remaining)"
          >
            <Check className="w-3 h-3" />
            <span>Present (+1)</span>
          </button>

          <button
            type="button"
            onClick={() => onQuickUpdate(subject.id, 0, 1)}
            className="inline-flex items-center gap-1 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white px-2.5 py-1 rounded-md shadow-xs cursor-pointer transition-colors"
            title="Mark 1 class absent (0 attended, +1 conducted, -1 remaining)"
          >
            <X className="w-3 h-3" />
            <span>Absent (+1)</span>
          </button>

          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md cursor-pointer ml-1 transition-colors"
          >
            <span>{expanded ? 'Hide Targets' : 'All Targets (75/80/90%)'}</span>
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Expanded Multi-Target Comparison Table */}
      {expanded && (
        <div className="p-4 border-t border-slate-200 bg-slate-50/50">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2.5">
            Attendance Target Comparison (75%, 80%, 90%)
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                  <th className="pb-1.5 font-bold">Target</th>
                  <th className="pb-1.5 font-bold">Must Attend</th>
                  <th className="pb-1.5 font-bold">Can Miss</th>
                  <th className="pb-1.5 font-bold">Feasibility</th>
                  <th className="pb-1.5 font-bold">Instant Bunk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  { target: 75, analysis: calc.analysis75, label: '75% (Mandatory)' },
                  { target: 80, analysis: calc.analysis80, label: '80% (Merit Safe)' },
                  { target: 90, analysis: calc.analysis90, label: '90% (Distinction)' },
                ].map(({ target, analysis, label }) => (
                  <tr key={target} className="hover:bg-slate-100/50">
                    <td className="py-2 font-bold text-slate-800">{label}</td>
                    <td className="py-2">
                      {analysis.isPossible ? (
                        <span className="font-semibold text-indigo-700">
                          {analysis.isAlreadyAchieved
                            ? '0 (Already Achieved)'
                            : `${analysis.requiredToAttend} of ${effectiveRemaining}`}
                        </span>
                      ) : (
                        <span className="font-semibold text-rose-600">Impossible</span>
                      )}
                    </td>
                    <td className="py-2">
                      {analysis.isPossible ? (
                        <span className="font-semibold text-emerald-700">
                          {analysis.maxCanMiss} classes
                        </span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>
                    <td className="py-2">
                      {analysis.isPossible ? (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          Possible
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                          Short by {analysis.shortfallPercentage.toFixed(1)}%
                        </span>
                      )}
                    </td>
                    <td className="py-2 text-slate-600 font-medium">
                      {analysis.instantBunkableNow > 0
                        ? `${analysis.instantBunkableNow} right now`
                        : 'None'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
