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

const FAVORITES_STORAGE_KEY = 'attendplan_favorite_rooms_v1';
const RECENT_SEARCHES_KEY = 'attendplan_room_recent_searches_v1';

export const FreeClassroomLocator: React.FC = () => {
  // 1. Current runtime date & time
  const [liveNow, setLiveNow] = useState<Date>(() => new Date());

  // Keep live time ticking every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setLiveNow(new Date());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const liveDateStr = useMemo(() => {
    return `${liveNow.getFullYear()}-${(liveNow.getMonth() + 1).toString().padStart(2, '0')}-${liveNow.getDate().toString().padStart(2, '0')}`;
  }, [liveNow]);

  const liveTimeHHMM = useMemo(() => {
    return `${liveNow.getHours().toString().padStart(2, '0')}:${liveNow.getMinutes().toString().padStart(2, '0')}`;
  }, [liveNow]);

  // 2. Room dataset (with user-customized capacities & specs preserved)
  const [rooms, setRooms] = useState<Room[]>(() => getCustomizedRooms());

  // 3. User filter inputs
  const [selectedDate, setSelectedDate] = useState<string>(liveDateStr);
  const [selectedStartTime, setSelectedStartTime] = useState<string>(() => {
    // Round to nearest 5 minutes
    const mins = Math.ceil((liveNow.getHours() * 60 + liveNow.getMinutes()) / 5) * 5;
    return `${Math.floor(mins / 60).toString().padStart(2, '0')}:${(mins % 60).toString().padStart(2, '0')}`;
  });
  const [selectedDuration, setSelectedDuration] = useState<number>(120); // 120 mins = 2 hours
  const [selectedFloor, setSelectedFloor] = useState<number | 'ALL'>('ALL');
  const [acOnly, setAcOnly] = useState<boolean>(false);
  const [minCapacityInput, setMinCapacityInput] = useState<number>(0);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'AVAILABLE' | 'AVAILABLE_SOON' | 'OCCUPIED'>('ALL');
  const [favoritesOnly, setFavoritesOnly] = useState<boolean>(false);

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
      return saved ? JSON.parse(saved) : ['IST-204', 'IST-001', 'IST-518'];
    } catch (e) {
      return ['IST-204', 'IST-001', 'IST-518'];
    }
  });

  // 7. Modal state
  const [selectedRoomForDetails, setSelectedRoomForDetails] = useState<Room | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Persist favorites
  useEffect(() => {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favoriteRoomIds));
  }, [favoriteRoomIds]);

  // Persist recent searches
  useEffect(() => {
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(recentSearches));
  }, [recentSearches]);

  // Handle "Use Current Time" (Requirement 2)
  const handleUseCurrentTime = () => {
    const now = new Date();
    setLiveNow(now);
    setSelectedDate(liveDateStr);
    const mins = Math.ceil((now.getHours() * 60 + now.getMinutes()) / 5) * 5;
    const timeStr = `${Math.floor(mins / 60).toString().padStart(2, '0')}:${(mins % 60).toString().padStart(2, '0')}`;
    setSelectedStartTime(timeStr);
    setActiveParsedQuery(null);
  };

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
      date: selectedDate,
      startTime: selectedStartTime,
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

  // Calculate status for all rooms under current date & start time
  const allRoomStatuses = useMemo(() => {
    const map = new Map<string, RoomStatus>();
    rooms.forEach((r) => {
      const status = calculateRoomStatus(
        r,
        effectiveQuery.date,
        effectiveQuery.startTime,
        effectiveQuery.durationMinutes
      );
      map.set(r.id, status);
    });
    return map;
  }, [rooms, effectiveQuery]);

  // Filtered rooms for Floor Grid
  const gridRooms = useMemo(() => {
    return rooms.filter((r) => {
      if (selectedFloor !== 'ALL' && r.floor !== selectedFloor) return false;
      if (acOnly && !r.hasAC) return false;
      if (minCapacityInput > 0 && r.capacity < minCapacityInput) return false;
      if (favoritesOnly && !favoriteRoomIds.includes(r.id)) return false;

      const st = allRoomStatuses.get(r.id);
      if (!st) return false;

      if (statusFilter === 'AVAILABLE' && !st.isFreeForEntireDuration) return false;
      if (statusFilter === 'AVAILABLE_SOON' && st.status !== 'AVAILABLE_SOON') return false;
      if (statusFilter === 'OCCUPIED' && st.status !== 'OCCUPIED') return false;

      return true;
    });
  }, [
    rooms,
    selectedFloor,
    acOnly,
    minCapacityInput,
    favoritesOnly,
    favoriteRoomIds,
    statusFilter,
    allRoomStatuses,
  ]);

  // Handle Natural Language Search Submission
  const handleNLSearch = (queryToRun?: string) => {
    const queryText = (queryToRun !== undefined ? queryToRun : nlSearchQuery).trim();
    if (!queryText) return;

    const parsed = parseNaturalLanguageRoomQuery(queryText, liveNow);
    setActiveParsedQuery(parsed);

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

  const handleOpenRoomDetails = (room: Room) => {
    setSelectedRoomForDetails(room);
    setIsDetailsOpen(true);
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
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Free Classroom Locator
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline">
                Phase 2 Intelligent Availability
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
              Find an Uninterrupted Free Classroom
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Guaranteed free for your entire requested duration with strict conflict protection.
            </p>
          </div>

          {/* Current Time Display & Use Current Time button */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-right">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Current Time
              </div>
              <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-mono">
                {liveNow.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
              <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
                {nextTimetableChange}
              </div>
            </div>

            <button
              type="button"
              onClick={handleUseCurrentTime}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 flex items-center gap-2 transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Use Current Time</span>
            </button>
          </div>
        </div>

        {/* 2. Natural Language AI Search Bar (Requirement 3 & 24) */}
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
                placeholder="Try: I need an AC room on the ground floor for 8 people for 2 hours..."
                className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Find Room</span>
            </button>
          </form>

          {/* Quick example prompts */}
          <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
            <span className="text-[11px] font-semibold text-slate-400">Suggestions:</span>
            {[
              'AC room on ground floor for 8 people for 2 hours',
              'Room for 90 minutes',
              'Classroom from 1 PM to 3 PM',
              'For me and 5 friends for 2 hours',
              'Projector room tomorrow 10 AM to 12 PM',
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

          {/* Search History (Requirement 22) */}
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

        {/* Extracted Requirements Preview (Requirement 24) */}
        {activeParsedQuery && (
          <div className="mt-4 p-3.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-indigo-950 dark:text-indigo-200 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-extrabold uppercase tracking-wider text-[10px] flex items-center gap-1 text-indigo-700 dark:text-indigo-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Parsed Query Requirements</span>
              </span>
              <button
                type="button"
                onClick={() => setActiveParsedQuery(null)}
                className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                Reset to Manual Filters
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

      {/* 3. Date, Time & Requirement Selector Panel (Requirement 1) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Exact Availability Interval
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-500">
            Checking continuous slot: <strong>{effectiveQuery.displayTimeRange}</strong>
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
              <option value="ALL">All Rooms</option>
              <option value="AVAILABLE">Available for Entire Time</option>
              <option value="AVAILABLE_SOON">Available Soon</option>
              <option value="OCCUPIED">Occupied</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. Best Matching Rooms Section (Requirement 9 & 14) */}
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
                className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-emerald-500/40 dark:border-emerald-500/30 p-4 shadow-xs hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-lg font-extrabold text-slate-900 dark:text-white">
                          {room.roomNumber}
                        </h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                          🟢 AVAILABLE
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {room.floorName} • Capacity: {room.capacity}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleFavorite(room.id)}
                      className="p-1 rounded-md text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition cursor-pointer"
                    >
                      <Star
                        className={`w-4 h-4 ${favoriteRoomIds.includes(room.id) ? 'fill-amber-400 text-amber-500' : 'text-slate-300 dark:text-slate-600'}`}
                      />
                    </button>
                  </div>

                  {/* Available window */}
                  <div className="mt-3 p-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 text-xs text-emerald-950 dark:text-emerald-200">
                    <div className="font-bold flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Free: {status.availableTimeRange}</span>
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
                    {room.hasSmartBoard && <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">Smart Board</span>}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenRoomDetails(room)}
                    className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                  >
                    <span>View Room</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
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
                      onClick={() => handleOpenRoomDetails(room)}
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

      {/* 5. Floor Grid Interface Upgrade (Requirement 7 & 19) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Floor-by-Floor Classroom Grid
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Click any room to inspect current status, next class, available time, and full daily timetable.
            </p>
          </div>

          {/* Floor Selector Pills */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar">
            <button
              type="button"
              onClick={() => setSelectedFloor('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                selectedFloor === 'ALL'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              All Floors
            </button>
            {[0, 1, 2, 3, 4, 5, 6, 7].map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setSelectedFloor(f)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                  selectedFloor === f
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {f === 0 ? 'Ground' : `Floor ${f}`}
              </button>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>🟢 AVAILABLE (Free for requested time)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>🟡 AVAILABLE SOON (Free in &lt;30m)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span>🔴 OCCUPIED (Class in session)</span>
          </div>
        </div>

        {/* The Grid Cards */}
        {gridRooms.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            No rooms found matching the current floor/status filters.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
            {gridRooms.map((room) => {
              const st = allRoomStatuses.get(room.id);
              if (!st) return null;

              const isFav = favoriteRoomIds.includes(room.id);

              return (
                <div
                  key={room.id}
                  onClick={() => handleOpenRoomDetails(room)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer hover:shadow-md relative flex flex-col justify-between ${
                    st.isFreeForEntireDuration
                      ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-300/70 dark:border-emerald-800/80 hover:border-emerald-500'
                      : st.status === 'AVAILABLE_SOON'
                      ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-300/70 dark:border-amber-800/80 hover:border-amber-500'
                      : 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-300/70 dark:border-rose-800/80 hover:border-rose-500'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                            {room.roomNumber}
                          </h4>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                              st.isFreeForEntireDuration
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : st.status === 'AVAILABLE_SOON'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            }`}
                          >
                            {st.isFreeForEntireDuration
                              ? '🟢 AVAILABLE'
                              : st.status === 'AVAILABLE_SOON'
                              ? '🟡 AVAILABLE SOON'
                              : '🔴 OCCUPIED'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {room.floorName} • Capacity: {room.capacity}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleFavorite(room.id);
                        }}
                        className="p-1 text-amber-500 hover:scale-110 transition cursor-pointer"
                      >
                        <Star
                          className={`w-4 h-4 ${isFav ? 'fill-amber-400 text-amber-500' : 'text-slate-300 dark:text-slate-600'}`}
                        />
                      </button>
                    </div>

                    {/* Status Breakdown for Available vs Occupied (Requirement 7) */}
                    {st.isFreeForEntireDuration ? (
                      <div className="mt-3 text-xs">
                        <div className="text-emerald-800 dark:text-emerald-300 font-semibold flex items-center gap-1">
                          <Clock className="w-3 h-3 text-emerald-600" />
                          <span>Free until: <strong>{st.freeUntil || 'End of Day'}</strong></span>
                        </div>
                        {st.nextClass && (
                          <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 truncate">
                            Next: {st.nextClass.name} at {st.nextClass.startsAt}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="mt-3 text-xs">
                        {st.currentClass ? (
                          <div className="text-rose-700 dark:text-rose-300 font-semibold truncate">
                            Class: <strong>{st.currentClass.name}</strong> until {st.currentClass.until}
                          </div>
                        ) : (
                          <div className="text-amber-700 dark:text-amber-300 font-semibold">
                            Conflict during requested period
                          </div>
                        )}
                        {st.nextAvailableTime && (
                          <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                            Free at: <strong>{st.nextAvailableTime}</strong>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
                    <span className="flex items-center gap-1 font-semibold">
                      {room.hasAC ? 'AC Room' : 'Non-AC'}
                    </span>
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline">
                      View Details →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Room Details Modal */}
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
        />
      )}
    </div>
  );
};
