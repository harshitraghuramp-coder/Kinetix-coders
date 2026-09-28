import React, { useState } from 'react';
import {
  Layers,
  MapPin,
  Clock,
  Users,
  Wind,
  Tv,
  Star,
  Sparkles,
  Send,
  Eye,
  Box,
  Compass,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { Room, RoomStatus } from '../../types/rooms';

interface BuildingMapProps {
  rooms: Room[];
  roomStatuses: Map<string, RoomStatus>;
  selectedFloor: number | 'ALL';
  onSelectFloor: (floor: number | 'ALL') => void;
  selectedRoomId: string | null;
  onSelectRoom: (room: Room) => void;
  favoriteRoomIds: string[];
  onToggleFavorite: (roomId: string) => void;
  claimedRoomId: string | null;
  highlightedRoomIds: string[]; // Room IDs matching AI search
  onOpenSquadShare: (room: Room, status: RoomStatus) => void;
  isLiveMode: boolean;
  currentTimeDisplay: string;
}

export const BuildingMap: React.FC<BuildingMapProps> = ({
  rooms,
  roomStatuses,
  selectedFloor,
  onSelectFloor,
  selectedRoomId,
  onSelectRoom,
  favoriteRoomIds,
  onToggleFavorite,
  claimedRoomId,
  highlightedRoomIds,
  onOpenSquadShare,
  isLiveMode,
  currentTimeDisplay,
}) => {
  // Perspective view toggle: Isometric 3D vs Flat Blueprint
  const [viewStyle, setViewStyle] = useState<'ISOMETRIC_3D' | 'FLAT_BLUEPRINT'>('ISOMETRIC_3D');

  const availableFloors = [0, 1, 2, 3, 4, 5, 6, 7];

  const getFloorTitle = (f: number) => {
    if (f === 0) return 'Ground Floor';
    if (f === 1) return '1st Floor';
    if (f === 2) return '2nd Floor';
    if (f === 3) return '3rd Floor';
    return `${f}th Floor`;
  };

  // Group rooms by floor
  const roomsByFloor = React.useMemo(() => {
    const map = new Map<number, Room[]>();
    availableFloors.forEach((f) => map.set(f, []));
    rooms.forEach((r) => {
      const arr = map.get(r.floor) || [];
      arr.push(r);
      map.set(r.floor, arr);
    });
    return map;
  }, [rooms]);

  // Determine floors to render
  const floorsToRender = selectedFloor === 'ALL' ? availableFloors : [selectedFloor];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-xs space-y-5">
      {/* 1. Header with Floor Navigation & 3D Perspective Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
              Interactive Building Map
            </h3>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              IST Tech Park
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Click any classroom block to inspect timetable, countdown, and call your squad.
          </p>
        </div>

        {/* 3D vs Flat View Style Toggle */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
            <button
              type="button"
              onClick={() => setViewStyle('ISOMETRIC_3D')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                viewStyle === 'ISOMETRIC_3D'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Box className="w-3.5 h-3.5" />
              <span>3D Isometric</span>
            </button>
            <button
              type="button"
              onClick={() => setViewStyle('FLAT_BLUEPRINT')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                viewStyle === 'FLAT_BLUEPRINT'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Flat Blueprint</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Floor Selector Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 no-scrollbar border-b border-slate-100 dark:border-slate-800">
        <button
          type="button"
          onClick={() => onSelectFloor('ALL')}
          className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            selectedFloor === 'ALL'
              ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-600/20'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>View All Floors</span>
        </button>

        {availableFloors.map((f) => {
          const count = (roomsByFloor.get(f) || []).length;
          const isSelected = selectedFloor === f;
          return (
            <button
              key={f}
              type="button"
              onClick={() => onSelectFloor(f)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-600/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <span>{f === 0 ? 'Ground' : `${f}th Floor`}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 3. Visual Map Legend (Requirement 9 & 20) */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-bold px-1">
        <div className="flex flex-wrap items-center gap-3 sm:gap-5">
          <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
            <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-xs shadow-emerald-500/40 ring-2 ring-emerald-200 dark:ring-emerald-950" />
            <span>🟢 AVAILABLE NOW</span>
          </div>
          <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
            <span className="w-3 h-3 rounded-full bg-amber-500 shadow-xs shadow-amber-500/40 ring-2 ring-amber-200 dark:ring-amber-950" />
            <span>🟡 AVAILABLE SOON (&lt;30m)</span>
          </div>
          <div className="flex items-center gap-1.5 text-rose-700 dark:text-rose-400">
            <span className="w-3 h-3 rounded-full bg-rose-500 shadow-xs shadow-rose-500/40 ring-2 ring-rose-200 dark:ring-rose-950" />
            <span>🔴 OCCUPIED</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
            <span className="w-3 h-3 rounded-full bg-slate-400 dark:bg-slate-600" />
            <span>⚪ NO DATA / UNAVAILABLE</span>
          </div>
        </div>

        {/* Required Schematic Disclaimer (Requirement 22) */}
        <span className="text-[11px] font-medium text-slate-400 italic">
          Schematic floor layout — not to scale
        </span>
      </div>

      {/* 4. Schematic Map Floor Renderings */}
      <div className={`space-y-6 transition-all ${viewStyle === 'ISOMETRIC_3D' ? 'perspective-1000' : ''}`}>
        {floorsToRender.map((floorNum) => {
          const floorRooms = roomsByFloor.get(floorNum) || [];
          if (floorRooms.length === 0) return null;

          return (
            <div
              key={floorNum}
              className={`rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 p-4 sm:p-5 transition-all ${
                viewStyle === 'ISOMETRIC_3D'
                  ? 'shadow-lg hover:shadow-xl dark:shadow-none transform-gpu transition-transform'
                  : ''
              }`}
            >
              {/* Floor Header Bar */}
              <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-2.5 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-extrabold text-xs flex items-center justify-center font-mono">
                    {floorNum === 0 ? 'G' : floorNum}
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                      {getFloorTitle(floorNum)}
                    </h4>
                    <span className="text-[10px] text-slate-400 font-mono">
                      IST Tech Park • Level {floorNum}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-slate-500 hidden sm:inline">
                    {floorRooms.length} Classrooms on Level
                  </span>
                  {selectedFloor === 'ALL' && (
                    <button
                      type="button"
                      onClick={() => onSelectFloor(floorNum)}
                      className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                    >
                      Focus Level →
                    </button>
                  )}
                </div>
              </div>

              {/* Schematic Floor Grid Representation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
                {floorRooms.map((room) => {
                  const status = roomStatuses.get(room.id);
                  const isSelected = selectedRoomId === room.id;
                  const isFavorite = favoriteRoomIds.includes(room.id);
                  const isClaimed = claimedRoomId === room.id;
                  const isAiMatched = highlightedRoomIds.includes(room.id);

                  if (!status) return null;

                  // Color styling based on actual status
                  let borderClass = 'border-slate-300 dark:border-slate-700';
                  let bgClass = 'bg-white dark:bg-slate-900';
                  let badgeClass = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
                  let statusText = '⚪ NO DATA';
                  let dotColor = 'bg-slate-400';

                  if (status.status === 'AVAILABLE') {
                    borderClass = isSelected
                      ? 'border-emerald-500 ring-3 ring-emerald-500/30'
                      : isAiMatched
                      ? 'border-emerald-500 ring-2 ring-emerald-400 shadow-md shadow-emerald-500/20'
                      : 'border-emerald-300 dark:border-emerald-800/80 hover:border-emerald-500';
                    bgClass = 'bg-emerald-50/50 dark:bg-emerald-950/20';
                    badgeClass = 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200';
                    statusText = '🟢 FREE NOW';
                    dotColor = 'bg-emerald-500';
                  } else if (status.status === 'AVAILABLE_SOON') {
                    borderClass = isSelected
                      ? 'border-amber-500 ring-3 ring-amber-500/30'
                      : isAiMatched
                      ? 'border-amber-500 ring-2 ring-amber-400 shadow-md shadow-amber-500/20'
                      : 'border-amber-300 dark:border-amber-800/80 hover:border-amber-500';
                    bgClass = 'bg-amber-50/50 dark:bg-amber-950/20';
                    badgeClass = 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200';
                    statusText = '🟡 SOON (&lt;30m)';
                    dotColor = 'bg-amber-500';
                  } else if (status.status === 'OCCUPIED') {
                    borderClass = isSelected
                      ? 'border-rose-500 ring-3 ring-rose-500/30'
                      : 'border-rose-200 dark:border-rose-800/70 hover:border-rose-400';
                    bgClass = 'bg-rose-50/40 dark:bg-rose-950/20';
                    badgeClass = 'bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-200';
                    statusText = '🔴 OCCUPIED';
                    dotColor = 'bg-rose-500';
                  }

                  return (
                    <div
                      key={room.id}
                      onClick={() => onSelectRoom(room)}
                      className={`relative rounded-xl border p-3.5 transition-all duration-200 cursor-pointer flex flex-col justify-between ${bgClass} ${borderClass} ${
                        viewStyle === 'ISOMETRIC_3D' ? 'hover:-translate-y-1 shadow-xs hover:shadow-md' : 'hover:shadow-xs'
                      }`}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onSelectRoom(room);
                        }
                      }}
                      aria-label={`Room ${room.roomNumber}, ${statusText}`}
                    >
                      {/* Top Badges (AI Match, Claimed, Favorite) */}
                      <div>
                        <div className="flex items-start justify-between gap-1.5 mb-2">
                          <div className="flex flex-wrap items-center gap-1">
                            <span className="font-mono font-black text-base text-slate-900 dark:text-white">
                              {room.roomNumber}
                            </span>
                            {isAiMatched && (
                              <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-indigo-600 text-white flex items-center gap-0.5 animate-pulse">
                                <Sparkles className="w-2.5 h-2.5" />
                                <span>AI Match</span>
                              </span>
                            )}
                            {isClaimed && (
                              <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-700 flex items-center gap-0.5">
                                <MapPin className="w-2.5 h-2.5" />
                                <span>Claimed</span>
                              </span>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleFavorite(room.id);
                            }}
                            className="p-1 rounded text-amber-500 hover:scale-110 transition cursor-pointer"
                            title={isFavorite ? 'Remove favorite' : 'Add favorite'}
                          >
                            <Star
                              className={`w-4 h-4 ${isFavorite ? 'fill-amber-400 text-amber-500' : 'text-slate-300 dark:text-slate-600'}`}
                            />
                          </button>
                        </div>

                        {/* Status Label + Indicator */}
                        <div className="flex items-center gap-1.5 mb-2.5">
                          <span className={`w-2 h-2 rounded-full ${dotColor} ${status.status === 'AVAILABLE' ? 'animate-pulse' : ''}`} />
                          <span className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded ${badgeClass}`}>
                            {statusText}
                          </span>
                        </div>

                        {/* LIVE COUNTDOWN TIMER (Requirement 5) */}
                        <div className="p-2 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 text-xs mb-2">
                          {status.status === 'OCCUPIED' ? (
                            <div>
                              <div className="text-[9px] uppercase tracking-wider text-rose-600 dark:text-rose-400 font-extrabold">
                                Class in Session:
                              </div>
                              <div className="font-bold text-slate-800 dark:text-slate-200 truncate mt-0.5">
                                {status.currentClass?.name || 'Class ongoing'}
                              </div>
                              <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                                Free at: <strong>{status.nextAvailableTime || status.currentClass?.until || 'later'}</strong>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div className="flex items-center justify-between text-[9px] uppercase tracking-wider text-slate-500 font-mono">
                                <span>Time Remaining:</span>
                                <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                                  {status.freeUntil ? `Until ${status.freeUntil}` : 'Rest of Day'}
                                </span>
                              </div>
                              <div className="font-mono font-black text-sm text-slate-900 dark:text-white tracking-wider mt-0.5 flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                                <span>{status.countdownDisplay}</span>
                              </div>
                              {status.nextClass && (
                                <div className="text-[10px] text-slate-600 dark:text-slate-400 truncate mt-1">
                                  Next: <strong>{status.nextClass.name}</strong> ({status.nextClass.startsAt})
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Bottom Room Specs & Quick Share Button */}
                      <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-1.5 font-medium">
                          <span>{room.capacity} seats</span>
                          {room.hasAC && <span className="text-emerald-600 font-bold">• AC</span>}
                        </div>

                        {/* Quick Squad Share Button (Requirement 16) */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenSquadShare(room, status);
                          }}
                          className="px-2 py-0.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950 dark:hover:bg-emerald-900 text-emerald-800 dark:text-emerald-300 font-bold text-[10px] flex items-center gap-1 cursor-pointer transition"
                          title="Call the squad for this room"
                        >
                          <Send className="w-2.5 h-2.5" />
                          <span>Squad</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
