import React, { useState } from 'react';
import { SlidersHorizontal, ArrowRight, CheckCircle, AlertTriangle, Sparkles } from 'lucide-react';
import { SubjectCalculation } from '../types/attendance';

interface WhatIfSimulatorProps {
  calculations: SubjectCalculation[];
  selectedTarget: number;
}

export const WhatIfSimulator: React.FC<WhatIfSimulatorProps> = ({
  calculations,
  selectedTarget,
}) => {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
    calculations[0]?.subject.id || ''
  );
  const [simAttendedDelta, setSimAttendedDelta] = useState<number>(5);

  const selectedCalc =
    calculations.find((c) => c.subject.id === selectedSubjectId) || calculations[0];

  if (!selectedCalc) return null;

  const currentC = selectedCalc.subject.conducted;
  const currentA = selectedCalc.subject.attended;
  const maxSimClasses = Math.max(1, selectedCalc.effectiveRemaining);

  const safeSimAttended = Math.min(maxSimClasses, Math.max(0, simAttendedDelta));
  const simTotalConducted = currentC + safeSimAttended;
  const simTotalAttended = currentA + safeSimAttended;
  const simNewPercentage =
    simTotalConducted > 0
      ? Number(((simTotalAttended / simTotalConducted) * 100).toFixed(2))
      : 100;
  const diffPct = Number((simNewPercentage - selectedCalc.currentPercentage).toFixed(2));

  return (
    <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-lg border border-indigo-900/50">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b border-indigo-900/60 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-300">
            <SlidersHorizontal className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>Interactive Attendance Simulator</span>
              <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-indigo-500 text-white">
                What-If
              </span>
            </h3>
            <p className="text-xs text-indigo-200/80">
              See exact percentage jump if you attend the upcoming consecutive classes
            </p>
          </div>
        </div>

        {/* Subject Selector */}
        <select
          value={selectedSubjectId}
          onChange={(e) => {
            setSelectedSubjectId(e.target.value);
            setSimAttendedDelta(5);
          }}
          className="text-xs font-semibold bg-slate-800 text-white border border-indigo-500/50 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          {calculations.map((c) => (
            <option key={c.subject.id} value={c.subject.id}>
              {c.subject.name} (Current: {c.currentPercentage.toFixed(1)}%)
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-center">
        {/* Slider Controls */}
        <div className="space-y-3 md:col-span-2">
          <div className="flex items-center justify-between text-xs font-medium text-indigo-200">
            <span>
              If I attend the next{' '}
              <strong className="text-white text-sm font-bold bg-indigo-600 px-2 py-0.5 rounded ml-1">
                {safeSimAttended} classes
              </strong>
            </span>
            <span className="text-[11px] text-indigo-300">
              Max available: {maxSimClasses} remaining
            </span>
          </div>

          <input
            type="range"
            min="0"
            max={maxSimClasses}
            value={safeSimAttended}
            onChange={(e) => setSimAttendedDelta(parseInt(e.target.value, 10))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-400"
          />

          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>0 classes (Current)</span>
            <button
              type="button"
              onClick={() => setSimAttendedDelta(Math.min(5, maxSimClasses))}
              className="hover:text-indigo-300 underline"
            >
              +5 Classes
            </button>
            <button
              type="button"
              onClick={() => setSimAttendedDelta(Math.min(10, maxSimClasses))}
              className="hover:text-indigo-300 underline"
            >
              +10 Classes
            </button>
            <button
              type="button"
              onClick={() => setSimAttendedDelta(maxSimClasses)}
              className="hover:text-indigo-300 underline font-semibold text-indigo-300"
            >
              All Remaining ({maxSimClasses})
            </button>
          </div>
        </div>

        {/* Projected Outcome Box */}
        <div className="bg-indigo-950/70 border border-indigo-700/40 rounded-xl p-4 text-center">
          <span className="text-xs uppercase tracking-wider text-indigo-300 font-semibold block mb-1">
            Projected Attendance
          </span>
          <div className="flex items-baseline justify-center gap-2">
            <span className="text-3xl font-black text-white">
              {simNewPercentage.toFixed(2)}%
            </span>
            {diffPct > 0 && (
              <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                +{diffPct.toFixed(2)}%
              </span>
            )}
          </div>

          <p className="text-xs text-indigo-200 mt-2">
            {simTotalAttended} of {simTotalConducted} classes attended
          </p>

          <div className="mt-3 pt-2.5 border-t border-indigo-800/50 flex items-center justify-center gap-1.5 text-xs">
            {simNewPercentage >= selectedTarget ? (
              <span className="inline-flex items-center gap-1 text-emerald-300 font-semibold">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>Reaches target {selectedTarget}%</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-amber-300 font-semibold">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>Still below {selectedTarget}%</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
