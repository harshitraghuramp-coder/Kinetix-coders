import React, { useState } from 'react';
import {
  X,
  Star,
  Layers,
  Users,
  Wind,
  Tv,
  Sparkles,
  Wifi,
  Zap,
  Clock,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Edit2,
  Save,
  MapPin,
  Send,
  Copy,
  Check,
  HelpCircle,
} from 'lucide-react';
import { Room, RoomStatus } from '../../types/rooms';
import { generateSquadMessage } from '../../utils/classroomAvailabilityEngine';

interface RoomDetailsModalProps {
  room: Room | null;
  status: RoomStatus | null;
  isOpen: boolean;
  onClose: () => void;
  isFavorite: boolean;
  onToggleFavorite: (roomId: string) => void;
  onUpdateRoom: (updatedRoom: Room) => void;
  dateStr: string;
  currentTimeDisplay?: string;
  isClaimed?: boolean;
  onToggleClaim?: (roomId: string) => void;
  onOpenSquadShare?: (room: Room, status: RoomStatus) => void;
}

export const RoomDetailsModal: React.FC<RoomDetailsModalProps> = ({
  room,
  status,
  isOpen,
  onClose,
  isFavorite,
  onToggleFavorite,
  onUpdateRoom,
  dateStr,
  currentTimeDisplay,
  isClaimed = false,
  onToggleClaim,
  onOpenSquadShare,
}) => {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [capacity, setCapacity] = useState<number>(room?.capacity || 60);
  const [hasAC, setHasAC] = useState<boolean>(room?.hasAC || false);
  const [hasProjector, setHasProjector] = useState<boolean>(room?.hasProjector || false);
  const [hasSmartBoard, setHasSmartBoard] = useState<boolean>(room?.hasSmartBoard || false);
  const [hasWifi, setHasWifi] = useState<boolean>(room?.hasWifi ?? true);
  const [hasPowerOutlets, setHasPowerOutlets] = useState<boolean>(room?.hasPowerOutlets ?? true);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  if (!isOpen || !room || !status) return null;

  const handleSave = () => {
    const updated: Room = {
      ...room,
      capacity,
      hasAC,
      hasProjector,
      hasSmartBoard,
      hasWifi,
      hasPowerOutlets,
    };
    onUpdateRoom(updated);
    setIsEditing(false);
  };

  const dynamicSquadMessage = generateSquadMessage(
    room.roomNumber,
    status.freeUntil,
    status.freeMinutes,
    status.isRestOfDayFree,
    status.status === 'OCCUPIED',
    status.nextAvailableTime
  );

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(dynamicSquadMessage);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    } catch (e) {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    }
  };

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(dynamicSquadMessage)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full max-h-[92vh] overflow-y-auto p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-indigo-100 dark:shadow-none">
              {room.floor === 0 ? 'G' : room.floor}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  {room.roomNumber}
                </h3>
                <button
                  type="button"
                  onClick={() => onToggleFavorite(room.id)}
                  className="p-1 rounded-md text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition cursor-pointer"
                  title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <Star className={`w-5 h-5 ${isFavorite ? 'fill-amber-400 text-amber-500' : 'text-slate-300 dark:text-slate-600'}`} />
                </button>
                {isClaimed && (
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    <span>Selected by You</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {room.floorName} • {room.building} • {room.roomType}
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

        {/* Live Availability Status & Live Countdown Box */}
        <div
          className={`p-4 rounded-xl border mb-5 transition-all ${
            status.status === 'AVAILABLE'
              ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200'
              : status.status === 'AVAILABLE_SOON'
              ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800 text-amber-950 dark:text-amber-200'
              : status.status === 'OCCUPIED'
              ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800 text-rose-950 dark:text-rose-200'
              : 'bg-slate-100 dark:bg-slate-800/60 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-300'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black flex items-center gap-1.5">
                  {status.status === 'AVAILABLE' && '🟢 AVAILABLE NOW'}
                  {status.status === 'AVAILABLE_SOON' && '🟡 AVAILABLE BUT WILL BE OCCUPIED SOON'}
                  {status.status === 'OCCUPIED' && '🔴 OCCUPIED'}
                  {status.status === 'NOT_AVAILABLE' && '⚪ NO DATA / UNAVAILABLE'}
                </span>
              </div>
              {currentTimeDisplay && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                  Current Time: <strong>{currentTimeDisplay}</strong>
                </p>
              )}
            </div>

            {/* LIVE COUNTDOWN TIMER DISPLAY */}
            {status.countdownDisplay && (
              <div className="text-left sm:text-right bg-white/70 dark:bg-slate-900/80 px-3 py-1.5 rounded-xl border border-current shadow-2xs">
                <div className="text-[9px] font-extrabold uppercase tracking-wider opacity-75">
                  {status.status === 'OCCUPIED' ? 'Class Ends In:' : 'Next Class Begins In:'}
                </div>
                <div className="font-mono font-black text-lg sm:text-xl text-slate-900 dark:text-white tracking-widest">
                  {status.countdownDisplay}
                </div>
              </div>
            )}
          </div>

          <div className="mt-3 pt-2.5 border-t border-current/20 space-y-1 text-xs">
            {/* Available Until info */}
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-600 dark:text-slate-400">Available Until:</span>
              <strong className="font-bold">
                {status.status === 'OCCUPIED'
                  ? `Occupied (Next available around ${status.nextAvailableTime || 'later'})`
                  : status.freeUntil
                  ? status.freeUntil
                  : 'Free for the rest of the scheduled day'}
              </strong>
            </div>

            {/* Next Class Information */}
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-600 dark:text-slate-400">Next Scheduled Class:</span>
              <div className="text-right">
                {status.nextClass ? (
                  <span className="font-bold">
                    {status.nextClass.name} ({status.nextClass.section}) at {status.nextClass.startsAt}
                  </span>
                ) : (
                  <span className="font-medium text-slate-500 dark:text-slate-400 italic">
                    No upcoming class found.
                  </span>
                )}
              </div>
            </div>

            {/* Current Active Class */}
            {status.currentClass && (
              <div className="flex items-center justify-between text-rose-700 dark:text-rose-300">
                <span className="font-semibold">Current Class in Session:</span>
                <span className="font-bold text-right">
                  {status.currentClass.name} ({status.currentClass.section}) until {status.currentClass.until}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Claim Room & Call the Squad Controls (Requirements 12 & 13) */}
        <div className="p-4 bg-indigo-50/60 dark:bg-indigo-950/30 rounded-xl border border-indigo-200 dark:border-indigo-800/70 mb-5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div>
              <span className="text-xs font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Squad Coordination Hub</span>
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Indicate you intend to use {room.roomNumber} and share with your study squad.
              </p>
            </div>

            {/* Claim This Room Button */}
            {onToggleClaim && (
              <button
                type="button"
                onClick={() => onToggleClaim(room.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer whitespace-nowrap shadow-xs ${
                  isClaimed
                    ? 'bg-indigo-600 text-white shadow-indigo-600/20 hover:bg-indigo-700'
                    : 'bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-700 hover:bg-indigo-50 dark:hover:bg-slate-700'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>{isClaimed ? '✓ Claimed by You' : '📍 Claim This Room'}</span>
              </button>
            )}
          </div>

          {/* Call the Squad button (Always accessible or when claimed) */}
          <div className="pt-2 border-t border-indigo-100 dark:border-indigo-900/60 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition text-center cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>📲 Call the Squad (WhatsApp)</span>
            </a>

            <button
              type="button"
              onClick={handleCopyMessage}
              className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                isCopied
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-700 dark:text-emerald-300'
                  : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              {isCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Message</span>
                </>
              )}
            </button>
          </div>

          {/* Official Disclaimer (Requirement 12) */}
          <div className="text-[10px] text-slate-500 dark:text-slate-400 bg-white/60 dark:bg-slate-900/60 p-2 rounded-lg border border-indigo-100 dark:border-indigo-900/40 flex items-start gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0 mt-0.5" />
            <span>
              Claiming a room does not reserve it. It only helps you share your intended location with your group.
            </span>
          </div>
        </div>

        {/* Room Specifications & Facilities */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800 mb-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Room Specifications & Facilities</span>
            </span>
            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Edit2 className="w-3 h-3" />
              <span>{isEditing ? 'Cancel Edit' : 'Edit Specs'}</span>
            </button>
          </div>

          {!isEditing ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Capacity</span>
                <strong className="text-slate-900 dark:text-white font-mono text-sm">{room.capacity} seats</strong>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Air Conditioning</span>
                <strong className={room.hasAC ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400'}>
                  {room.hasAC ? '✓ Yes (AC)' : '✕ Non-AC'}
                </strong>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Projector</span>
                <strong className={room.hasProjector ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}>
                  {room.hasProjector ? '✓ Installed' : '✕ None'}
                </strong>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Smart Board</span>
                <strong className={room.hasSmartBoard ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}>
                  {room.hasSmartBoard ? '✓ Smart Board' : '✕ Standard Board'}
                </strong>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Power Outlets</span>
                <strong className={room.hasPowerOutlets ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}>
                  {room.hasPowerOutlets ? '✓ Outlets Available' : '✕ Few/None'}
                </strong>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[10px]">High-Speed Wi-Fi</span>
                <strong className={room.hasWifi ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}>
                  {room.hasWifi ? '✓ SRM Campus Wi-Fi' : '✕ Limited'}
                </strong>
              </div>
            </div>
          ) : (
            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Seating Capacity
                </label>
                <input
                  type="number"
                  value={capacity}
                  onChange={(e) => setCapacity(parseInt(e.target.value, 10) || 0)}
                  min={1}
                  max={300}
                  className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasAC}
                    onChange={(e) => setHasAC(e.target.checked)}
                    className="rounded text-indigo-600"
                  />
                  <span>Air Conditioned (AC)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasProjector}
                    onChange={(e) => setHasProjector(e.target.checked)}
                    className="rounded text-indigo-600"
                  />
                  <span>Projector</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasSmartBoard}
                    onChange={(e) => setHasSmartBoard(e.target.checked)}
                    className="rounded text-indigo-600"
                  />
                  <span>Smart Board</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasPowerOutlets}
                    onChange={(e) => setHasPowerOutlets(e.target.checked)}
                    className="rounded text-indigo-600"
                  />
                  <span>Power Outlets</span>
                </label>
              </div>

              <button
                type="button"
                onClick={handleSave}
                className="mt-2 w-full py-2 px-3 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Room Configuration</span>
              </button>
            </div>
          )}
        </div>

        {/* Schedule for Date */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Full Schedule ({dateStr})</span>
            </span>
            <span className="text-[11px] text-slate-500 font-mono">Periods 1 → 9</span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden text-xs">
            {status.todaySchedule.map((slot) => (
              <div
                key={slot.period}
                className={`py-2 px-3 flex items-center justify-between transition-colors ${
                  slot.isOccupied
                    ? 'bg-rose-50/50 dark:bg-rose-950/20 text-rose-900 dark:text-rose-200'
                    : slot.isBreak
                    ? 'bg-slate-100/60 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400'
                    : 'bg-emerald-50/40 dark:bg-emerald-950/10 text-emerald-900 dark:text-emerald-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-[11px] w-6">
                    P{slot.period}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                    {slot.timeRange}
                  </span>
                </div>
                <div className="text-right">
                  {slot.isOccupied ? (
                    <div>
                      <span className="font-bold block text-rose-700 dark:text-rose-300">
                        {slot.subject}
                      </span>
                      {slot.section && (
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">
                          {slot.section}
                        </span>
                      )}
                    </div>
                  ) : slot.isBreak ? (
                    <span className="text-[11px] font-semibold text-slate-500">
                      Lunch Break (Free)
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                      ✓ Free Period
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Close Button */}
        <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 text-right">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
