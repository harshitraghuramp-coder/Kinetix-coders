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
} from 'lucide-react';
import { Room, RoomStatus } from '../../types/rooms';

interface RoomDetailsModalProps {
  room: Room | null;
  status: RoomStatus | null;
  isOpen: boolean;
  onClose: () => void;
  isFavorite: boolean;
  onToggleFavorite: (roomId: string) => void;
  onUpdateRoom: (updatedRoom: Room) => void;
  dateStr: string;
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
}) => {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [capacity, setCapacity] = useState<number>(room?.capacity || 60);
  const [hasAC, setHasAC] = useState<boolean>(room?.hasAC || false);
  const [hasProjector, setHasProjector] = useState<boolean>(room?.hasProjector || false);
  const [hasSmartBoard, setHasSmartBoard] = useState<boolean>(room?.hasSmartBoard || false);
  const [hasWifi, setHasWifi] = useState<boolean>(room?.hasWifi ?? true);
  const [hasPowerOutlets, setHasPowerOutlets] = useState<boolean>(room?.hasPowerOutlets ?? true);

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100">
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

        {/* Live Availability Status Banner */}
        <div
          className={`p-4 rounded-xl border mb-5 flex items-start justify-between gap-3 ${
            status.isFreeForEntireDuration
              ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200'
              : status.status === 'AVAILABLE_SOON'
              ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-950 dark:text-amber-200'
              : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-950 dark:text-rose-200'
          }`}
        >
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-extrabold flex items-center gap-1.5">
                {status.isFreeForEntireDuration ? '🟢 AVAILABLE' : status.status === 'AVAILABLE_SOON' ? '🟡 AVAILABLE SOON' : '🔴 OCCUPIED'}
              </span>
              <span className="text-xs font-mono bg-white/70 dark:bg-slate-900/70 px-2 py-0.5 rounded border border-current">
                {status.availableTimeRange}
              </span>
            </div>
            {status.freeUntil && (
              <p className="text-xs mt-1 font-medium">
                Free continuously until: <strong>{status.freeUntil}</strong> ({status.freeMinutes} mins)
              </p>
            )}
            {status.currentClass && (
              <p className="text-xs mt-1 text-rose-700 dark:text-rose-300">
                Current Class: <strong>{status.currentClass.name}</strong> ({status.currentClass.section}) until {status.currentClass.until}
              </p>
            )}
            {status.nextClass && (
              <p className="text-xs mt-0.5 text-slate-700 dark:text-slate-300">
                Next Class: <strong>{status.nextClass.name}</strong> at {status.nextClass.startsAt}
              </p>
            )}
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
