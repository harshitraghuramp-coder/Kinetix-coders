import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search,
  Sparkles,
  Clock,
  Calendar,
  Users,
  Wind,
  Tv,
  Star,
  Layers,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  HelpCircle,
  RotateCcw,
  Zap,
  ArrowRight,
  Filter,
  Check,
  ChevronRight,
  Info,
  Building2,
  Trash2,
  Send,
  MapPin,
  Flame,
  Radio,
} from 'lucide-react';
import { Room, StructuredRoomQuery, RoomStatus, RankedRoomMatch } from '../../types/rooms';
import { getCustomizedRooms, saveCustomizedRooms } from '../../data/roomData';
import {
  calculateRoomStatus,
  parseNaturalLanguageRoomQuery,
  rankRoomsForQuery,
  formatHHMMToDisplay,
  minutesToDisplayTime,
  timeToMinutes,
  COLLEGE_TIME_SLOTS,
} from '../../utils/classroomAvailabilityEngine';
import { RoomDetailsModal } from './RoomDetailsModal';
import { SquadShareModal } from './SquadShareModal';
import { BuildingMap } from './BuildingMap';

const FAVORITES_STORAGE_KEY = 'attendplan_favorite_rooms_v1';
const RECENT_SEARCHES_KEY = 'attendplan_room_recent_searches_v1';
const CLAIMED_ROOM_KEY = 'attendplan_claimed_room_v1';

export const FreeClassroomLocator: React.FC = () => {
  // 1. Current runtime date & time
  const [liveNow, setLiveNow] = useState<Date>(() => new Date());

  // Dual mode: LIVE MODE vs PLANNING MODE (Requirement 6)
  const [isLiveMode, setIsLiveMode] = useState<boolean>(true);

  // Single shared timer ticking every 1000ms (1 second) for countdown precision (Requirement 5 & 21)
  useEffect(() => {
    const timer = setInterval(() => {
      setLiveNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const liveDateStr = useMemo(() => {
    return `${liveNow.getFullYear()}-${(liveNow.getMonth() + 1).toString().padStart(2, '0')}-${liveNow.getDate().toString().padStart(2, '0')}`;
  }, [liveNow]);

  const liveTimeHHMM = useMemo(() => {
    return `${liveNow.getHours().toString().padStart(2, '0')}:${liveNow.getMinutes().toString().padStart(2, '0')}`;
  }, [liveNow]);

  const liveTimeFormatted = useMemo(() => {
    return liveNow.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }, [liveNow]);

  // 2. Room dataset (with user-customized capacities & specs preserved)
  const [rooms, setRooms] = useState<Room[]>(() => getCustomizedRooms());

  // 3. User filter inputs
  const [selectedDate, setSelectedDate] = useState<string>(liveDateStr);
  const [selectedStartTime, setSelectedStartTime] = useState<string>(() => {
    const mins = Math.ceil((liveNow.getHours() * 60 + liveNow.getMinutes()) / 5) * 5;
    return `${Math.floor(mins / 60).toString().padStart(2, '0')}:${(mins % 60).toString().padStart(2, '0')}`;
  });
  const [selectedDuration, setSelectedDuration] = useState<number>(120); // 120 mins = 2 hours
  const [selectedFloor, setSelectedFloor] = useState<number | 'ALL'>('ALL');
  const [acOnly, setAcOnly] = useState<boolean>(false);
  const [minCapacityInput, setMinCapacityInput] = useState<number>(0);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'AVAILABLE' | 'AVAILABLE_SOON' | 'OCCUPIED'>('ALL');
  const [favoritesOnly, setFavoritesOnly] = useState<boolean>(false);

  // Claimed room state (Requirement 12)
  const [claimedRoomId, setClaimedRoomId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(CLAIMED_ROOM_KEY) || null;
  });

  // Selected room highlight on map (Requirement 11)
  const [selectedMapRoomId, setSelectedMapRoomId] = useState<string | null>(null);

  // 4. Natural language AI room search
  const [nlSearchQuery, setNlSearchQuery] = useState<string>('');
  const [activeParsedQuery, setActiveParsedQuery] = useState<StructuredRoomQuery | null>(null);

  // 5. Recent searches
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem(RECENT_SEARCHES_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // 6. Favorite rooms
  const [favoriteRoomIds, setFavoriteRoomIds] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem(FAVORITES_STORAGE_KEY);
      return saved ? JSON.parse(saved) : ['IST-204', 'IST-509', 'IST-518'];
    } catch (e) {
      return ['IST-204', 'IST-509', 'IST-518'];
    }
  });

  // 7. Modals state
  const [selectedRoomForDetails, setSelectedRoomForDetails] = useState<Room | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Squad Share Modal state (Requirement 13 & 16)
  const [squadShareData, setSquadShareData] = useState<{ room: Room; status: RoomStatus } | null>(null);
  const [isSquadShareOpen, setIsSquadShareOpen] = useState(false);

  // Persist favorites
  useEffect(() => {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favoriteRoomIds));
  }, [favoriteRoomIds]);

  // Persist recent searches
  useEffect(() => {
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(recentSearches));
  }, [recentSearches]);

  // Persist claimed room
  const handleToggleClaim = useCallback((roomId: string) => {
    setClaimedRoomId((prev) => {
      const next = prev === roomId ? null : roomId;
      if (next) {
        localStorage.setItem(CLAIMED_ROOM_KEY, next);
      } else {
        localStorage.removeItem(CLAIMED_ROOM_KEY);
      }
      return next;
    });
  }, []);

  // Handle Switch to Live Mode (Requirement 6)
  const handleSwitchToLiveMode = useCallback(() => {
    const now = new Date();
    setLiveNow(now);
    setIsLiveMode(true);
    setSelectedDate(liveDateStr);
    const mins = Math.ceil((now.getHours() * 60 + now.getMinutes()) / 5) * 5;
    const timeStr = `${Math.floor(mins / 60).toString().padStart(2, '0')}:${(mins % 60).toString().padStart(2, '0')}`;
    setSelectedStartTime(timeStr);
    setActiveParsedQuery(null);
  }, [liveDateStr]);

  // Next timetable change calculation (e.g. next period bell)
  const nextTimetableChange = useMemo(() => {
    const curMins = liveNow.getHours() * 60 + liveNow.getMinutes();
    for (const slot of COLLEGE_TIME_SLOTS) {
      const sMins = timeToMinutes(slot.startTime);
      const eMins = timeToMinutes(slot.endTime);
      if (curMins < sMins) {
        return `Next period starts at ${formatHHMMToDisplay(slot.startTime)} (in ${sMins - curMins}m)`;
      }
      if (curMins >= sMins && curMins < eMins) {
        return `Current period ends at ${formatHHMMToDisplay(slot.endTime)} (in ${eMins - curMins}m)`;
      }
    }
    return 'Classes finished for today';
  }, [liveNow]);

  // Construct structured query for search
  const effectiveQuery: StructuredRoomQuery = useMemo(() => {
    if (activeParsedQuery) {
      return activeParsedQuery;
    }

    const startMins = timeToMinutes(selectedStartTime);
    const endMins = startMins + selectedDuration;
    const endTimeStr = `${Math.floor(endMins / 60).toString().padStart(2, '0')}:${(endMins % 60).toString().padStart(2, '0')}`;
    const displayRange = `${minutesToDisplayTime(startMins)} → ${minutesToDisplayTime(endMins)}`;

    return {
      date: isLiveMode ? liveDateStr : selectedDate,
      startTime: isLiveMode ? liveTimeHHMM : selectedStartTime,
      endTime: endTimeStr,
      durationMinutes: selectedDuration,
      displayTimeRange: displayRange,
      floor: selectedFloor === 'ALL' ? undefined : selectedFloor,
      requireAC: acOnly ? true : undefined,
      minCapacity: minCapacityInput > 0 ? minCapacityInput : undefined,
      originalQuery: 'Manual Filter Selection',
    };
  }, [
    activeParsedQuery,
    isLiveMode,
    liveDateStr,
    liveTimeHHMM,
    selectedDate,
    selectedStartTime,
    selectedDuration,
    selectedFloor,
    acOnly,
    minCapacityInput,
  ]);

  // Process and rank rooms
  const { matches, alternatives } = useMemo(() => {
    return rankRoomsForQuery(rooms, effectiveQuery);
  }, [rooms, effectiveQuery]);

  // IDs of matching rooms from AI search / structured query (Requirement 10 & 23)
  const highlightedRoomIds = useMemo(() => {
    return matches.map((m) => m.room.id);
  }, [matches]);

  // Calculate status for all rooms under current date, start time, and seconds offset (Requirement 5)
  const allRoomStatuses = useMemo(() => {
    const map = new Map<string, RoomStatus>();
    const queryDate = isLiveMode ? liveDateStr : selectedDate;
    const queryTime = isLiveMode ? liveTimeHHMM : selectedStartTime;
    const secondsOffset = isLiveMode ? liveNow.getSeconds() : 0;

    rooms.forEach((r) => {
      const status = calculateRoomStatus(
        r,
        queryDate,
        queryTime,
        effectiveQuery.durationMinutes,
        secondsOffset
      );
      map.set(r.id, status);
    });
    return map;
  }, [rooms, isLiveMode, liveDateStr, liveTimeHHMM, selectedDate, selectedStartTime, liveNow, effectiveQuery.durationMinutes]);

  // Handle Natural Language Search Submission
  const handleNLSearch = (queryToRun?: string) => {
    const queryText = (queryToRun !== undefined ? queryToRun : nlSearchQuery).trim();
    if (!queryText) return;

    const parsed = parseNaturalLanguageRoomQuery(queryText, liveNow);
    setActiveParsedQuery(parsed);
    setIsLiveMode(false); // Enter planning mode for specific query

    // Sync input fields with parsed query
    setSelectedDate(parsed.date);
    setSelectedStartTime(parsed.startTime);
    setSelectedDuration(parsed.durationMinutes);
    if (parsed.floor !== undefined && parsed.floor !== null) {
      setSelectedFloor(parsed.floor);
    }
    if (parsed.requireAC !== undefined) {
      setAcOnly(parsed.requireAC);
    }
    if (parsed.minCapacity !== undefined) {
      setMinCapacityInput(parsed.minCapacity);
    }

    // Save to recent searches
    if (!recentSearches.includes(queryText)) {
      setRecentSearches((prev) => [queryText, ...prev.slice(0, 7)]);
    }
  };

  const handleClearHistory = () => {
    setRecentSearches([]);
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  };

  const handleToggleFavorite = (roomId: string) => {
    setFavoriteRoomIds((prev) =>
      prev.includes(roomId) ? prev.filter((id) => id !== roomId) : [...prev, roomId]
    );
  };

  // Open Room Details Modal
  const handleOpenRoomDetails = (room: Room) => {
    setSelectedRoomForDetails(room);
    setSelectedMapRoomId(room.id);
    setIsDetailsOpen(true);
  };

  // Selecting a room from AI search results (Requirement 11)
  const handleSelectRoomFromResult = (room: Room) => {
    setSelectedFloor(room.floor);
    setSelectedMapRoomId(room.id);
    setSelectedRoomForDetails(room);
    setIsDetailsOpen(true);
  };

  // Quick Share from search results or map (Requirement 16)
  const handleOpenSquadShare = (room: Room, status: RoomStatus) => {
    setSquadShareData({ room, status });
    setIsSquadShareOpen(true);
  };

  const handleUpdateRoomSpecs = (updatedRoom: Room) => {
    const newRooms = rooms.map((r) => (r.id === updatedRoom.id ? updatedRoom : r));
    setRooms(newRooms);
    saveCustomizedRooms(newRooms);
    setSelectedRoomForDetails(updatedRoom);
  };

  return (
    <div className="space-y-6">
      {/* 1. Top Real-Time Status & Live Availability Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Free Classroom Locator
              </span>

              {/* Requirement 6: Live Mode vs Planning Mode Badge */}
              {isLiveMode ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500 text-white shadow-2xs">
                  <Radio className="w-3 h-3 animate-ping" />
                  <span>● LIVE MODE</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-white shadow-2xs">
                  <span>● PLANNING MODE</span>
                </span>
              )}
            </div>

            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
              Find an Uninterrupted Free Classroom
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Interactive 3D building map with real-time countdown, strict timetable conflict protection, and WhatsApp squad coordination.
            </p>
          </div>

          {/* Current Time Display & Live / Planning Mode Controls (Requirement 6) */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-right">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {isLiveMode ? 'Live Browser Clock' : 'Planned Time'}
              </div>
              <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-mono tracking-wider">
                {isLiveMode ? liveTimeFormatted : `${selectedStartTime} (${selectedDate})`}
              </div>
              <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
                {nextTimetableChange}
              </div>
            </div>

            {isLiveMode ? (
              <button
                type="button"
                onClick={() => setIsLiveMode(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-2 transition cursor-pointer border border-slate-300 dark:border-slate-700"
                title="Manually choose custom date & time"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Planning Mode</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSwitchToLiveMode}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-2 transition cursor-pointer"
                title="Switch back to current live time"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>● Switch to Live Mode</span>
              </button>
            )}
          </div>
        </div>

        {/* 2. Natural Language AI Search Bar (Requirement 10 & 23) */}
        <div className="mt-5 pt-5 border-t border-slate-100 dark:border-slate-800">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Where do you want to work? (AI Smart Finder)</span>
          </label>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleNLSearch();
            }}
            className="flex flex-col sm:flex-row gap-2"
          >
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={nlSearchQuery}
                onChange={(e) => setNlSearchQuery(e.target.value)}
                placeholder="Try: I need an AC room for 8 people for 2 hours..."
                className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Find & Highlight Rooms</span>
            </button>
          </form>

          {/* Quick example prompts */}
          <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
            <span className="text-[11px] font-semibold text-slate-400">Suggestions:</span>
            {[
              'I need an AC room for 8 people for 2 hours',
              'Room for 90 minutes',
              'Classroom from 1 PM to 3 PM',
              'For me and 5 friends for 2 hours',
              'AC room on ground floor',
            ].map((promptText) => (
              <button
                key={promptText}
                type="button"
                onClick={() => {
                  setNlSearchQuery(promptText);
                  handleNLSearch(promptText);
                }}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-slate-700 hover:text-indigo-600 transition cursor-pointer"
              >
                &ldquo;{promptText}&rdquo;
              </button>
            ))}
          </div>

          {/* Search History */}
          {recentSearches.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Recent Searches:
              </span>
              {recentSearches.map((hist, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setNlSearchQuery(hist);
                    handleNLSearch(hist);
                  }}
                  className="text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-indigo-600 cursor-pointer"
                >
                  {hist}
                </button>
              ))}
              <button
                type="button"
                onClick={handleClearHistory}
                className="text-[10px] text-slate-400 hover:text-rose-500 cursor-pointer ml-auto flex items-center gap-1"
                title="Clear recent searches"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear History</span>
              </button>
            </div>
          )}
        </div>

        {/* Extracted Requirements Preview */}
        {activeParsedQuery && (
          <div className="mt-4 p-3.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-indigo-950 dark:text-indigo-200 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-extrabold uppercase tracking-wider text-[10px] flex items-center gap-1 text-indigo-700 dark:text-indigo-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Parsed Query Requirements (Highlighted on Building Map)</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setActiveParsedQuery(null);
                  handleSwitchToLiveMode();
                }}
                className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                Reset to Live Mode
              </button>
            </div>

            {activeParsedQuery.isAmbiguous && activeParsedQuery.clarificationMessage && (
              <div className="my-2 p-2.5 rounded-lg bg-amber-100/70 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 flex items-start gap-2">
                <HelpCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold">Clarification Needed:</strong>{' '}
                  {activeParsedQuery.clarificationMessage}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-2 font-mono text-[11px]">
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[9px] uppercase">Date</span>
                <strong>{activeParsedQuery.date}</strong>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[9px] uppercase">Required Time</span>
                <strong>{activeParsedQuery.displayTimeRange}</strong>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[9px] uppercase">Duration</span>
                <strong>{activeParsedQuery.durationMinutes} mins</strong>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[9px] uppercase">Group Size</span>
                <strong>{activeParsedQuery.minCapacity ? `${activeParsedQuery.minCapacity} people` : 'Any'}</strong>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[9px] uppercase">AC / Floor</span>
                <strong>
                  {activeParsedQuery.requireAC ? 'AC' : 'Any'} • {activeParsedQuery.floor !== undefined && activeParsedQuery.floor !== null ? `Floor ${activeParsedQuery.floor}` : 'Any Floor'}
                </strong>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Planning & Filters Panel */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Date & Interval Parameters
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-500">
            Evaluating continuous slot: <strong>{effectiveQuery.displayTimeRange}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Date Picker */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Select Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setIsLiveMode(false);
                setActiveParsedQuery(null);
              }}
              className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
            />
          </div>

          {/* Start Time */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Start Time
            </label>
            <input
              type="time"
              value={selectedStartTime}
              onChange={(e) => {
                setSelectedStartTime(e.target.value);
                setIsLiveMode(false);
                setActiveParsedQuery(null);
              }}
              className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
            />
          </div>

          {/* Duration Selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Required Duration
            </label>
            <select
              value={selectedDuration}
              onChange={(e) => {
                setSelectedDuration(parseInt(e.target.value, 10));
                setActiveParsedQuery(null);
              }}
              className="w-full px-3 py-2 text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
            >
              <option value={30}>30 Minutes</option>
              <option value={45}>45 Minutes</option>
              <option value={60}>1 Hour (60m)</option>
              <option value={90}>1.5 Hours (90m)</option>
              <option value={120}>2 Hours (120m)</option>
              <option value={180}>3 Hours (180m)</option>
              <option value={240}>4 Hours (240m)</option>
            </select>
          </div>

          {/* Minimum Capacity */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Group Size / Capacity
            </label>
            <input
              type="number"
              placeholder="e.g. 8 people"
              min={0}
              max={200}
              value={minCapacityInput || ''}
              onChange={(e) => {
                setMinCapacityInput(parseInt(e.target.value, 10) || 0);
                setActiveParsedQuery(null);
              }}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {/* Feature Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={acOnly}
                onChange={(e) => {
                  setAcOnly(e.target.checked);
                  setActiveParsedQuery(null);
                }}
                className="rounded text-indigo-600"
              />
              <span>AC Only</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={favoritesOnly}
                onChange={(e) => setFavoritesOnly(e.target.checked)}
                className="rounded text-indigo-600"
              />
              <span className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span>Show Favorites Only ({favoriteRoomIds.length})</span>
              </span>
            </label>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-500">Status Filter:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-2.5 py-1 text-xs bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
            >
              <option value="ALL">All Statuses</option>
              <option value="AVAILABLE">Free for Entire Time</option>
              <option value="AVAILABLE_SOON">Available Soon</option>
              <option value="OCCUPIED">Occupied</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. Best Matching Rooms Section (Requirement 9, 11, 16) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Best Matching Classrooms
            </h3>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              {matches.length} {matches.length === 1 ? 'Match' : 'Matches'}
            </span>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Guaranteed zero conflicts between {effectiveQuery.displayTimeRange}
          </span>
        </div>

        {matches.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {matches.map(({ room, status, matchReasons }) => (
              <div
                key={room.id}
                onClick={() => handleSelectRoomFromResult(room)}
                className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-emerald-500/40 dark:border-emerald-500/30 p-4 shadow-xs hover:shadow-md transition flex flex-col justify-between cursor-pointer"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-lg font-extrabold text-slate-900 dark:text-white">
                          {room.roomNumber}
                        </h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                          🟢 FREE NOW
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {room.floorName} • Capacity: {room.capacity}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleFavorite(room.id);
                      }}
                      className="p-1 rounded-md text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition cursor-pointer"
                    >
                      <Star
                        className={`w-4 h-4 ${favoriteRoomIds.includes(room.id) ? 'fill-amber-400 text-amber-500' : 'text-slate-300 dark:text-slate-600'}`}
                      />
                    </button>
                  </div>

                  {/* Available window & Live Countdown */}
                  <div className="mt-3 p-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 text-xs text-emerald-950 dark:text-emerald-200">
                    <div className="font-bold flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Free: {status.availableTimeRange}</span>
                      </div>
                      {status.countdownDisplay && (
                        <span className="font-mono font-black text-xs text-emerald-700 dark:text-emerald-300">
                          {status.countdownDisplay}
                        </span>
                      )}
                    </div>
                    {status.nextClass && (
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                        Next class starts at: <strong>{status.nextClass.startsAt}</strong> ({status.nextClass.name})
                      </p>
                    )}
                  </div>

                  {/* Factual Match Reasons */}
                  <div className="mt-3 space-y-1">
                    {matchReasons.map((reason, idx) => (
                      <div
                        key={idx}
                        className="text-[11px] text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
                      >
                        <Check className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                        <span>{reason}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[11px] text-slate-500">
                    {room.hasAC && <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">AC</span>}
                    {room.hasProjector && <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">Projector</span>}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Requirement 16: Share From Search Results */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenSquadShare(room, status);
                      }}
                      className="px-2.5 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 rounded-lg flex items-center gap-1 cursor-pointer transition border border-emerald-200 dark:border-emerald-800"
                    >
                      <Send className="w-3 h-3" />
                      <span>📲 Share</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectRoomFromResult(room);
                      }}
                      className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                    >
                      <span>Locate on Map</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Requirement 14: No Room Available & Factual Alternatives */
          <div className="bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-5 text-amber-950 dark:text-amber-200 space-y-3">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold">
                  No rooms completely match all criteria for {effectiveQuery.displayTimeRange}
                </h4>
                <p className="text-xs mt-0.5 text-amber-800 dark:text-amber-300">
                  {effectiveQuery.floor !== undefined && effectiveQuery.floor !== null
                    ? `No free rooms found on Floor ${effectiveQuery.floor} with requested duration (${effectiveQuery.durationMinutes}m).`
                    : `No rooms are free continuously for the full ${effectiveQuery.durationMinutes} minutes.`}
                </p>
              </div>
            </div>

            {alternatives.length > 0 && (
              <div className="pt-2 border-t border-amber-200/80 dark:border-amber-800/80 space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider block">
                  Possible Alternatives & Next Available Windows:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {alternatives.slice(0, 4).map(({ room, status, reason }, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleSelectRoomFromResult(room)}
                      className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800 text-xs flex items-center justify-between cursor-pointer hover:border-indigo-500 transition"
                    >
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">
                          {room.roomNumber} ({room.floorName})
                        </div>
                        <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                          {reason}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 5. Phase 3 Interactive Building Map (Requirement 1, 2, 3, 5, 9, 10, 22) */}
      <BuildingMap
        rooms={rooms}
        roomStatuses={allRoomStatuses}
        selectedFloor={selectedFloor}
        onSelectFloor={setSelectedFloor}
        selectedRoomId={selectedMapRoomId}
        onSelectRoom={handleOpenRoomDetails}
        favoriteRoomIds={favoriteRoomIds}
        onToggleFavorite={handleToggleFavorite}
        claimedRoomId={claimedRoomId}
        highlightedRoomIds={highlightedRoomIds}
        onOpenSquadShare={handleOpenSquadShare}
        isLiveMode={isLiveMode}
        currentTimeDisplay={isLiveMode ? liveTimeFormatted : `${selectedStartTime} (${selectedDate})`}
      />

      {/* Room Details Modal (Requirement 4, 5, 7, 8, 12, 13) */}
      {selectedRoomForDetails && (
        <RoomDetailsModal
          room={selectedRoomForDetails}
          status={allRoomStatuses.get(selectedRoomForDetails.id) || null}
          isOpen={isDetailsOpen}
          onClose={() => setIsDetailsOpen(false)}
          isFavorite={favoriteRoomIds.includes(selectedRoomForDetails.id)}
          onToggleFavorite={handleToggleFavorite}
          onUpdateRoom={handleUpdateRoomSpecs}
          dateStr={effectiveQuery.date}
          currentTimeDisplay={isLiveMode ? liveTimeFormatted : `${selectedStartTime} (${selectedDate})`}
          isClaimed={claimedRoomId === selectedRoomForDetails.id}
          onToggleClaim={handleToggleClaim}
          onOpenSquadShare={(r, s) => handleOpenSquadShare(r, s)}
        />
      )}

      {/* Squad Share Modal (Requirement 13, 14, 15) */}
      {squadShareData && (
        <SquadShareModal
          isOpen={isSquadShareOpen}
          onClose={() => setIsSquadShareOpen(false)}
          room={squadShareData.room}
          status={squadShareData.status}
        />
      )}
    </div>
  );
};
