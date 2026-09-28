import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ResetConfirmModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ResetConfirmModal: React.FC<ResetConfirmModalProps> = ({
  isOpen,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-slate-200 p-6 space-y-4">
        <div className="flex items-center gap-3 text-rose-600">
          <div className="p-2.5 rounded-full bg-rose-50 border border-rose-200">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Reset All Data?</h3>
        </div>

        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          This will clear all entered subjects, attendance records, and section configurations from your
          browser's local storage. This action cannot be undone.
        </p>

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm cursor-pointer"
          >
            Yes, Reset All
          </button>
        </div>
      </div>
    </div>
  );
};
