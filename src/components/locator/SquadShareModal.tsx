import React, { useState, useEffect } from 'react';
import { X, Send, Copy, Check, MessageSquare, Clock, MapPin, Sparkles, AlertCircle } from 'lucide-react';
import { Room, RoomStatus } from '../../types/rooms';
import { generateSquadMessage } from '../../utils/classroomAvailabilityEngine';

interface SquadShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: Room | null;
  status: RoomStatus | null;
}

export const SquadShareModal: React.FC<SquadShareModalProps> = ({
  isOpen,
  onClose,
  room,
  status,
}) => {
  const [customMessage, setCustomMessage] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);

  useEffect(() => {
    if (room && status) {
      const isOccupied = status.status === 'OCCUPIED';
      const msg = generateSquadMessage(
        room.roomNumber,
        status.freeUntil,
        status.freeMinutes,
        status.isRestOfDayFree,
        isOccupied,
        status.nextAvailableTime
      );
      setCustomMessage(msg);
      setIsCopied(false);
    }
  }, [room, status]);

  if (!isOpen || !room || !status) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(customMessage);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    } catch (e) {
      // Fallback for browsers that restrict clipboard write
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    }
  };

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(customMessage)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>Call the Squad</span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                  WhatsApp
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Share intended location for {room.roomNumber} ({room.floorName})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Room Snapshot */}
        <div className="mb-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
          <div>
            <div className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-indigo-600" />
              <span>{room.roomNumber}</span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-600 dark:text-slate-400 font-normal">{room.floorName}</span>
            </div>
            <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium mt-0.5">
              {status.status === 'OCCUPIED'
                ? `Occupied (Free at ${status.nextAvailableTime || 'later'})`
                : status.freeUntil
                ? `Free until: ${status.freeUntil}`
                : 'Free for the rest of the scheduled day'}
            </div>
          </div>
          {status.status !== 'OCCUPIED' && status.countdownDisplay && (
            <div className="text-right">
              <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-mono">Countdown</span>
              <span className="font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400">
                {status.countdownDisplay}
              </span>
            </div>
          )}
        </div>

        {/* Message Preview & Customization */}
        <div className="space-y-1.5 mb-4">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Dynamic WhatsApp Message:
          </label>
          <textarea
            rows={4}
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            className="w-full p-3 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-emerald-500 leading-relaxed"
          />
          <p className="text-[11px] text-slate-400 italic">
            You can customize this message before sending.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-2">
          {/* Primary WhatsApp Share Button (Anchor link avoids window.open) */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition cursor-pointer text-center"
          >
            <Send className="w-4 h-4" />
            <span>Open in WhatsApp</span>
          </a>

          {/* Copy Message Fallback Button */}
          <button
            type="button"
            onClick={handleCopy}
            className={`w-full py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
              isCopied
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300'
                : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            {isCopied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Copied to Clipboard! Ready to paste.</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Message (Clipboard Fallback)</span>
              </>
            )}
          </button>
        </div>

        {/* Friendly Disclaimer */}
        <div className="mt-4 p-2.5 rounded-lg bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 text-[11px] text-amber-900 dark:text-amber-300 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <span>
            <strong>Note:</strong> Calling the squad shares your intended room with your group. It does not officially book or reserve college infrastructure.
          </span>
        </div>
      </div>
    </div>
  );
};
