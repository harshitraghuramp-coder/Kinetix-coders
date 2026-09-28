import React from 'react';
import { SubjectCalculation, WarningLevel } from '../types/attendance';
import { Edit2, Trash2, Check, X, ShieldAlert, CheckCircle2, AlertTriangle, Flame } from 'lucide-react';

interface SubjectTableProps {
  calculations: SubjectCalculation[];
  selectedTarget: number;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onQuickUpdate: (id: string, attendedDelta: number, conductedDelta: number) => void;
}

export const SubjectTable: React.FC<SubjectTableProps> = ({
  calculations,
  selectedTarget,
  onEdit,
  onDelete,
  onQuickUpdate,
}) => {
  const getBadge = (level: WarningLevel) => {
    switch (level) {
      case 'SAFE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>SAFE</span>
          </span>
        );
      case 'WARNING':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            <span>WARNING</span>
          </span>
        );
      case 'RECOVERABLE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-orange-50 text-orange-800 border border-orange-300">
            <Flame className="w-3 h-3 text-orange-600" />
            <span>RECOVERABLE</span>
          </span>
        );
      case 'IRREVERSIBLE_DETENTION':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-black bg-red-600 text-white animate-pulse">
            <ShieldAlert className="w-3 h-3" />
            <span>DETENTION</span>
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
              <th className="py-3 px-4">Subject</th>
              <th className="py-3 px-3 text-center">Conducted</th>
              <th className="py-3 px-3 text-center">Attended</th>
              <th className="py-3 px-3 text-center">Current %</th>
              <th className="py-3 px-3 text-center">Remaining</th>
              <th className="py-3 px-3 text-center">Must Attend ({selectedTarget}%)</th>
              <th className="py-3 px-3 text-center">Can Miss ({selectedTarget}%)</th>
              <th className="py-3 px-3 text-center">Max Possible</th>
              <th className="py-3 px-3 text-center">Nov Deadline</th>
              <th className="py-3 px-3 text-center">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {calculations.map((calc) => {
              const sub = calc.subject;
              const analysis =
                selectedTarget === 80
                  ? calc.analysis80
                  : selectedTarget === 90
                  ? calc.analysis90
                  : calc.analysis75;

              return (
                <tr
                  key={sub.id}
                  className={`hover:bg-slate-50/70 transition-colors ${
                    calc.warningLevel === 'IRREVERSIBLE_DETENTION'
                      ? 'bg-red-50/40'
                      : calc.warningLevel === 'WARNING'
                      ? 'bg-amber-50/20'
                      : ''
                  }`}
                >
                  <td className="py-3 px-4 font-semibold text-slate-900">
                    <div>
                      <span>{sub.name}</span>
                      {sub.code && (
                        <span className="ml-1.5 text-[11px] font-mono font-medium text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                          {sub.code}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-center font-medium text-slate-700">
                    {sub.conducted}
                  </td>
                  <td className="py-3 px-3 text-center font-medium text-slate-700">
                    {sub.attended}
                  </td>
                  <td className="py-3 px-3 text-center font-bold">
                    <span
                      className={
                        calc.currentPercentage >= 75
                          ? 'text-emerald-600'
                          : 'text-rose-600'
                      }
                    >
                      {calc.currentPercentage.toFixed(2)}%
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center font-medium text-slate-700">
                    {calc.effectiveRemaining}
                  </td>
                  <td className="py-3 px-3 text-center font-bold">
                    {!analysis.isPossible ? (
                      <span className="text-red-600 font-extrabold">Impossible</span>
                    ) : analysis.isAlreadyAchieved ? (
                      <span className="text-emerald-600">0 (Achieved)</span>
                    ) : (
                      <span className="text-indigo-600">
                        {analysis.requiredToAttend} / {calc.effectiveRemaining}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-center font-semibold text-slate-700">
                    {analysis.isPossible ? (
                      <span
                        className={
                          analysis.maxCanMiss > 0
                            ? 'text-emerald-700 font-bold'
                            : 'text-slate-500'
                        }
                      >
                        {analysis.maxCanMiss}
                      </span>
                    ) : (
                      <span className="text-slate-400">0</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-center font-semibold text-slate-800">
                    {calc.maxPossibleFinalPercentage.toFixed(2)}%
                  </td>
                  <td className="py-3 px-3 text-center text-xs">
                    {calc.currentPercentage >= 75 ? (
                      <span className="text-emerald-700 font-bold">Safe</span>
                    ) : !calc.novemberAnalysis.isRecoverableBeforeNov ? (
                      <span className="text-red-700 font-extrabold bg-red-100 px-1.5 py-0.5 rounded text-[10px]">
                        Impossible
                      </span>
                    ) : (
                      <span className="text-indigo-700 font-semibold">
                        Need {calc.novemberAnalysis.requiredBeforeNov}/{calc.novemberAnalysis.classesBeforeNov}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-center">
                    {getBadge(calc.warningLevel)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => onQuickUpdate(sub.id, 1, 1)}
                        className="p-1 text-emerald-700 hover:bg-emerald-50 rounded cursor-pointer"
                        title="Quick Log: Attended (+1/+1)"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onQuickUpdate(sub.id, 0, 1)}
                        className="p-1 text-rose-700 hover:bg-rose-50 rounded cursor-pointer"
                        title="Quick Log: Missed (+0/+1)"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onEdit(sub.id)}
                        className="p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
                        title="Edit Subject"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(sub.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                        title="Delete Subject"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
