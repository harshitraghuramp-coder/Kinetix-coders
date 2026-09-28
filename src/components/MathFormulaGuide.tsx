import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, BookOpen, Calculator, ShieldCheck } from 'lucide-react';

export const MathFormulaGuide: React.FC = () => {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2.5">
          <HelpCircle className="w-4 h-4 text-indigo-600" />
          <span className="text-xs sm:text-sm font-bold text-slate-800">
            How Attendance Mathematics Works (Formulas & Statutory Rules)
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          <span>{open ? 'Hide formulas' : 'View formulas'}</span>
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {open && (
        <div className="p-5 border-t border-slate-100 bg-slate-50/50 space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
              <div className="flex items-center gap-2 mb-2 font-bold text-indigo-900">
                <Calculator className="w-4 h-4 text-indigo-600" />
                <span>1. Required Classes to Attend (Ceiling Formula)</span>
              </div>
              <p className="text-xs text-slate-600 mb-2">
                To reach target percentage <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">T%</code> (fraction <code className="font-mono">t = T / 100</code>) with conducted <code className="font-mono">C</code>, attended <code className="font-mono">A</code>, and remaining <code className="font-mono">R</code> classes:
              </p>
              <div className="bg-slate-100 p-2.5 rounded font-mono text-xs text-slate-900 font-bold mb-2">
                (A + x) / (C + R) ≥ t  ==&gt;  x ≥ ⌈t × (C + R) - A⌉
              </div>
              <ul className="text-xs text-slate-600 list-disc list-inside space-y-1">
                <li>If <code className="font-mono">x ≤ 0</code>: Target is already secured! You need 0 more classes.</li>
                <li>If <code className="font-mono">0 &lt; x ≤ R</code>: Recovery is feasible; you must attend at least <code className="font-mono">x</code> classes.</li>
                <li>If <code className="font-mono">x &gt; R</code>: Reaching <code className="font-mono">T%</code> is mathematically impossible.</li>
              </ul>
            </div>

            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
              <div className="flex items-center gap-2 mb-2 font-bold text-indigo-900">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>2. Maximum Classes You Can Miss (Floor Formula)</span>
              </div>
              <p className="text-xs text-slate-600 mb-2">
                Out of <code className="font-mono">R</code> remaining classes, the number of classes <code className="font-mono">m</code> you can afford to skip without dropping below target:
              </p>
              <div className="bg-slate-100 p-2.5 rounded font-mono text-xs text-slate-900 font-bold mb-2">
                (A + R - m) / (C + R) ≥ t  ==&gt;  m = ⌊(A + R) - t × (C + R)⌋
              </div>
              <p className="text-xs text-slate-600">
                Guaranteed safe margin. Bunking within this whole-integer limit guarantees your final percentage remains at or above the target.
              </p>
            </div>
          </div>

          <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-950">
            <h4 className="font-bold text-red-900 mb-1 flex items-center gap-1.5">
              <span>⚠️ What Triggers "IRREVERSIBLE DETENTION"?</span>
            </h4>
            <p>
              The app computes: <code className="font-mono font-bold">Max Possible % = ((Attended + Remaining) / (Conducted + Remaining)) × 100%</code>.
              If this value is strictly less than <strong>75.00%</strong>, reaching 75% is mathematically unachievable regardless of future attendance.
              The app never displays this warning for simply low attendance — ONLY when mathematical impossibility is proven.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
