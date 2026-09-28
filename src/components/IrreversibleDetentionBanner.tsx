import React from 'react';
import { AlertOctagon, ShieldAlert, ArrowUpRight, AlertTriangle } from 'lucide-react';
import { SubjectCalculation } from '../types/attendance';

interface IrreversibleDetentionBannerProps {
  detentionSubjects: SubjectCalculation[];
  onScrollToSubject?: (subjectId: string) => void;
}

export const IrreversibleDetentionBanner: React.FC<IrreversibleDetentionBannerProps> = ({
  detentionSubjects,
  onScrollToSubject,
}) => {
  if (detentionSubjects.length === 0) return null;

  return (
    <div className="rounded-2xl border-2 border-red-500 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white shadow-xl overflow-hidden animate-pulse-subtle">
      {/* Header Bar */}
      <div className="bg-red-800/80 px-5 py-3 flex items-center justify-between border-b border-red-400/30">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-white/20 backdrop-blur-xs text-white">
            <AlertOctagon className="w-6 h-6 animate-bounce" />
          </div>
          <div>
            <span className="text-xs uppercase tracking-widest font-black text-red-200">
              CRITICAL STATUTORY ALERT
            </span>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white uppercase">
              IRREVERSIBLE DETENTION
            </h2>
          </div>
        </div>
        <span className="text-xs sm:text-sm font-bold bg-white text-red-700 px-3 py-1 rounded-full shadow-xs">
          {detentionSubjects.length} Subject{detentionSubjects.length > 1 ? 's' : ''} Affected
        </span>
      </div>

      {/* Main explanation body */}
      <div className="p-5 sm:p-6 space-y-4">
        <div className="flex items-start gap-3">
          <ShieldAlert className="w-6 h-6 text-red-200 flex-shrink-0 mt-0.5" />
          <p className="text-sm sm:text-base text-red-50 leading-relaxed font-medium">
            Mathematical proof shows that reaching the statutory 75.00% semester attendance minimum
            is <strong className="underline decoration-white decoration-2 font-bold text-white">strictly impossible</strong> for
            the following subject{detentionSubjects.length > 1 ? 's' : ''}, even if you attend 100% of all
            remaining classes before the deadline.
          </p>
        </div>

        {/* Detailed subject breakdown cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
          {detentionSubjects.map((item) => {
            const sub = item.subject;
            const a75 = item.analysis75;
            const totalConducted = sub.conducted;
            const attended = sub.attended;
            const remaining = item.effectiveRemaining;
            const totalFinalClasses = totalConducted + remaining;
            const maxAttendedPossible = attended + remaining;

            return (
              <div
                key={sub.id}
                className="bg-black/25 backdrop-blur-md rounded-xl p-4 border border-white/20 hover:border-white/40 transition-colors"
              >
                <div className="flex items-start justify-between gap-2 mb-2.5">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                      {sub.name}
                      {sub.code && (
                        <span className="text-xs font-mono font-semibold bg-white/20 px-2 py-0.5 rounded text-red-100">
                          {sub.code}
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-red-200 mt-0.5">
                      Conducted: {totalConducted} | Attended: {attended} | Remaining: {remaining}
                    </p>
                  </div>

                  <span className="text-xs font-bold uppercase tracking-wider bg-red-950/80 text-red-200 border border-red-400/50 px-2 py-0.5 rounded">
                    Impossible
                  </span>
                </div>

                {/* Mathematical Matrix */}
                <div className="grid grid-cols-3 gap-2 bg-black/30 p-2.5 rounded-lg text-center mb-2.5 border border-white/10">
                  <div>
                    <span className="block text-[10px] text-red-200 font-medium">Current</span>
                    <span className="text-sm font-bold text-white">
                      {item.currentPercentage.toFixed(2)}%
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-red-200 font-medium">Required</span>
                    <span className="text-sm font-bold text-amber-300">75.00%</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-red-200 font-medium">Max Possible</span>
                    <span className="text-sm font-extrabold text-red-300">
                      {a75.maxPossibleAttendance.toFixed(2)}%
                    </span>
                  </div>
                </div>

                {/* Explicit Explanation */}
                <div className="text-xs text-red-100 space-y-1 bg-red-950/40 p-2.5 rounded-lg border border-red-500/30">
                  <p className="font-semibold text-white flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-300" />
                    Why recovery is impossible:
                  </p>
                  <p className="text-[11px] leading-relaxed">
                    Final classes in semester = {totalConducted} + {remaining} = {totalFinalClasses}.
                    Reaching 75% requires <strong className="text-white">⌈0.75 × {totalFinalClasses}⌉ = {Math.ceil(0.75 * totalFinalClasses)}</strong> attended classes.
                    Even if you attend all remaining {remaining} classes, your total attended classes will only be {attended} + {remaining} = <strong className="text-white">{maxAttendedPossible}</strong>, leaving an unbridgeable shortfall of <strong className="text-amber-200">{a75.shortfallPercentage.toFixed(2)}%</strong>.
                  </p>
                </div>

                {onScrollToSubject && (
                  <button
                    onClick={() => onScrollToSubject(sub.id)}
                    className="mt-2.5 inline-flex items-center gap-1 text-xs font-semibold text-white/90 hover:text-white underline cursor-pointer"
                  >
                    <span>View subject details</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div className="text-xs text-red-100/90 bg-red-950/50 rounded-lg p-3 border border-red-400/20">
          <p className="font-medium">
            💡 <strong>Next Steps:</strong> Please immediately consult your Head of Department (HOD)
            or Dean of Academics for medical certificate condonation, on-duty (OD) event credit,
            or remedial tutorial opportunities before the semester deadline.
          </p>
        </div>
      </div>
    </div>
  );
};
