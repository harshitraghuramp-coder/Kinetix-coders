import { Room, RoomStatus, StructuredRoomQuery, RankedRoomMatch, RoomClassSession } from '../types/rooms';
import { OFFICIAL_TIMETABLES } from '../data/timetableData';
import { SectionTimetable } from '../types/timetable';

/**
 * Standard College Time Slots
 */
export const COLLEGE_TIME_SLOTS = [
  { period: 1, startTime: '09:00', endTime: '09:50', label: 'Period 1 (09:00 - 09:50)' },
  { period: 2, startTime: '09:55', endTime: '10:45', label: 'Period 2 (09:55 - 10:45)' },
  { period: 3, startTime: '10:50', endTime: '11:40', label: 'Period 3 (10:50 - 11:40)' },
  { period: 4, startTime: '11:45', endTime: '12:35', label: 'Period 4 (11:45 - 12:35)' },
  { period: 5, startTime: '12:35', endTime: '13:30', label: 'Lunch Break (12:35 - 01:30)', isLunch: true },
  { period: 6, startTime: '13:30', endTime: '14:20', label: 'Period 6 (01:30 - 02:20)' },
  { period: 7, startTime: '14:25', endTime: '15:15', label: 'Period 7 (02:25 - 03:15)' },
  { period: 8, startTime: '15:20', endTime: '16:10', label: 'Period 8 (03:20 - 04:10)' },
  { period: 9, startTime: '16:15', endTime: '17:05', label: 'Period 9 (04:15 - 05:05)' },
];

/**
 * Normalizes time string "HH:mm" or "H:mm" to minutes from midnight
 */
export function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const parts = timeStr.trim().split(':');
  const h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  return h * 60 + m;
}

/**
 * Formats minutes from midnight to "h:mm A" (e.g. 840 -> "2:00 PM")
 */
export function minutesToDisplayTime(minutes: number): string {
  const m = Math.max(0, Math.min(24 * 60 - 1, minutes));
  const hours24 = Math.floor(m / 60);
  const mins = m % 60;
  const period = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  const minsStr = mins.toString().padStart(2, '0');
  return `${hours12}:${minsStr} ${period}`;
}

/**
 * Formats "HH:mm" to "h:mm A"
 */
export function formatHHMMToDisplay(timeStr: string): string {
  return minutesToDisplayTime(timeToMinutes(timeStr));
}

/**
 * Determines day of week name from date string YYYY-MM-DD
 */
export function getDayOfWeekName(dateStr: string): 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday' {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  const days: ('Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday')[] = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];
  return days[d.getDay()] as any;
}

/**
 * Checks whether a room number matches a timetable venue
 * e.g. "IST 602" matches "IST602", "IST 602 / FN", "IST 602 / AN"
 */
export function doesRoomMatchVenue(roomNumber: string, venue: string): boolean {
  if (!venue || !roomNumber) return false;
  const cleanRoom = roomNumber.replace(/\s+/g, '').toUpperCase();
  const cleanVenue = venue.replace(/\s+/g, '').toUpperCase();
  return cleanVenue.includes(cleanRoom) || cleanRoom.includes(cleanVenue);
}

/**
 * Retrieves all scheduled class sessions for a specific room on a given date
 */
export function getScheduledClassesForRoom(room: Room, dateStr: string): RoomClassSession[] {
  const dayName = getDayOfWeekName(dateStr);
  if (dayName === 'Saturday' || dayName === 'Sunday') {
    return []; // No scheduled classes on weekends
  }

  const sessions: RoomClassSession[] = [];

  // Inspect all 10+ timetables
  OFFICIAL_TIMETABLES.forEach((tt) => {
    if (!tt.venue) return;
    if (doesRoomMatchVenue(room.roomNumber, tt.venue)) {
      const daySlots = tt.schedule[dayName] || [];
      daySlots.forEach((slotName, idx) => {
        if (!slotName || slotName.trim() === '-' || slotName.toUpperCase() === 'LUNCH') {
          return;
        }

        const slotDef = COLLEGE_TIME_SLOTS[idx];
        if (!slotDef) return;

        // Find subject details
        const sub = tt.subjects.find((s) => s.slot === slotName || s.name === slotName || s.code === slotName);
        const subjectName = sub ? sub.name : slotName;
        const faculty = sub ? sub.faculty : undefined;

        sessions.push({
          subjectName,
          subjectCode: sub?.code,
          sectionDisplayName: tt.displayName,
          faculty,
          startTime: slotDef.startTime,
          endTime: slotDef.endTime,
          period: slotDef.period,
        });
      });
    }
  });

  return sessions;
}

/**
 * CORE AVAILABILITY ENGINE:
 * Answers: isRoomFree(room, date, startTime, endTime)
 * Returns TRUE if and only if NO scheduled class overlaps ANY minute of [startTime, endTime].
 */
export function isRoomFree(room: Room, dateStr: string, startTime: string, endTime: string): boolean {
  const reqStart = timeToMinutes(startTime);
  const reqEnd = timeToMinutes(endTime);

  if (reqEnd <= reqStart) return false;

  const scheduled = getScheduledClassesForRoom(room, dateStr);

  for (const session of scheduled) {
    const classStart = timeToMinutes(session.startTime);
    const classEnd = timeToMinutes(session.endTime);

    // Overlap condition: (reqStart < classEnd) && (reqEnd > classStart)
    if (reqStart < classEnd && reqEnd > classStart) {
      return false; // CONFLICT FOUND!
    }
  }

  return true;
}

/**
 * Formats seconds into HH:MM:SS string
 * e.g. 2838 -> "00:47:18"
 */
export function formatSecondsToHHMMSS(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Generates dynamic WhatsApp message for "Call the Squad"
 */
export function generateSquadMessage(
  roomNumber: string,
  freeUntil: string | null,
  freeMinutes: number,
  isRestOfDayFree: boolean = false,
  isOccupied: boolean = false,
  nextAvailableTime: string | null = null
): string {
  if (isOccupied) {
    if (nextAvailableTime) {
      return `📍 Heading to ${roomNumber}!\nIt will be free starting at ${nextAvailableTime}.\nSee you there!`;
    }
    return `📍 Checking out ${roomNumber}!\nIt's currently in class, but should be free soon.\nStay posted!`;
  }

  if (isRestOfDayFree || freeUntil?.toLowerCase().includes('rest of the scheduled day')) {
    return `📍 Heading to ${roomNumber}!\nIt's free for the rest of the scheduled day.\nOur group can work here until then. Come fast!`;
  }

  // Short period (< 45 mins)
  if (freeMinutes > 0 && freeMinutes <= 45) {
    return `📍 ${roomNumber} is free now, but only until ${freeUntil || 'soon'}.\nCome quickly!`;
  }

  // Long period (>= 120 mins)
  if (freeMinutes >= 120) {
    return `📍 Heading to ${roomNumber}!\nIt's free until ${freeUntil || 'later'}.\nOur group can work here until then. Come fast!`;
  }

  // Standard period
  return `📍 Heading to ${roomNumber}!\nIt's free until ${freeUntil || 'next class'}.\nCome fast!`;
}

/**
 * Calculates detailed room status, available until, next class, and full schedule with live countdown
 */
export function calculateRoomStatus(
  room: Room,
  dateStr: string,
  queryStartTime: string,
  durationMinutes: number,
  secondsOffset: number = 0
): RoomStatus {
  const queryStartMins = timeToMinutes(queryStartTime);
  const queryEndMins = queryStartMins + durationMinutes;
  const currentTotalSeconds = queryStartMins * 60 + Math.max(0, Math.min(59, secondsOffset));

  const scheduled = getScheduledClassesForRoom(room, dateStr).sort(
    (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
  );

  const dayName = getDayOfWeekName(dateStr);
  const isWeekend = dayName === 'Saturday' || dayName === 'Sunday';

  // Check conflicts with the requested duration
  const conflictSlots: { startTime: string; endTime: string; subject: string; section: string }[] = [];
  scheduled.forEach((s) => {
    const cStart = timeToMinutes(s.startTime);
    const cEnd = timeToMinutes(s.endTime);
    if (queryStartMins < cEnd && queryEndMins > cStart) {
      conflictSlots.push({
        startTime: s.startTime,
        endTime: s.endTime,
        subject: s.subjectName,
        section: s.sectionDisplayName,
      });
    }
  });

  const isFreeForEntireDuration = !isWeekend && conflictSlots.length === 0;

  // Find active class at current time
  const activeClass = scheduled.find((s) => {
    const sSec = timeToMinutes(s.startTime) * 60;
    const eSec = timeToMinutes(s.endTime) * 60;
    return currentTotalSeconds >= sSec && currentTotalSeconds < eSec;
  });

  // Find next class strictly starting after currentTotalSeconds
  const upcomingClass = scheduled.find((s) => {
    const sSec = timeToMinutes(s.startTime) * 60;
    return sSec > currentTotalSeconds;
  });

  // Calculate Available Until & Countdown
  let freeUntil: string | null = null;
  let freeMinutes = 0;
  let secondsRemainingUntilNextClass: number | null = null;
  let secondsRemainingInCurrentClass: number | null = null;
  let isRestOfDayFree = false;
  let countdownDisplay = '00:00:00';

  if (isWeekend) {
    freeUntil = 'Free for the rest of the scheduled day';
    isRestOfDayFree = true;
    countdownDisplay = 'Weekend - No Classes';
  } else if (activeClass) {
    const activeEndSec = timeToMinutes(activeClass.endTime) * 60;
    secondsRemainingInCurrentClass = Math.max(0, activeEndSec - currentTotalSeconds);
    countdownDisplay = formatSecondsToHHMMSS(secondsRemainingInCurrentClass);
    freeUntil = null;
    freeMinutes = 0;
  } else if (upcomingClass) {
    const nextStartSec = timeToMinutes(upcomingClass.startTime) * 60;
    secondsRemainingUntilNextClass = Math.max(0, nextStartSec - currentTotalSeconds);
    freeMinutes = Math.max(0, Math.floor(secondsRemainingUntilNextClass / 60));
    countdownDisplay = formatSecondsToHHMMSS(secondsRemainingUntilNextClass);
    freeUntil = formatHHMMToDisplay(upcomingClass.startTime);
  } else {
    // No more scheduled classes on this day!
    isRestOfDayFree = true;
    freeUntil = 'Free for the rest of the scheduled day';
    freeMinutes = 240;
    countdownDisplay = 'Free for rest of day';
  }

  // Available Time Range
  const availableRangeEndMins = queryStartMins + freeMinutes;
  const availableTimeRange = isWeekend
    ? 'All Day (Weekend)'
    : freeMinutes > 0
    ? `${minutesToDisplayTime(queryStartMins)} → ${isRestOfDayFree ? 'End of Day' : minutesToDisplayTime(availableRangeEndMins)}`
    : 'Currently Occupied';

  // Calculate Next Available Time if currently occupied or has a conflict
  let nextAvailableTime: string | null = null;
  if (!isFreeForEntireDuration && !isWeekend) {
    // Scan ahead from queryStartTime in 10-minute steps up to 17:05
    for (let t = queryStartMins; t <= timeToMinutes('17:05') - durationMinutes; t += 10) {
      const checkStart = `${Math.floor(t / 60).toString().padStart(2, '0')}:${(t % 60).toString().padStart(2, '0')}`;
      const checkEnd = `${Math.floor((t + durationMinutes) / 60).toString().padStart(2, '0')}:${((t + durationMinutes) % 60).toString().padStart(2, '0')}`;
      if (isRoomFree(room, dateStr, checkStart, checkEnd)) {
        nextAvailableTime = minutesToDisplayTime(t);
        break;
      }
    }
  }

  // Determine Overall Status
  let status: 'AVAILABLE' | 'OCCUPIED' | 'AVAILABLE_SOON' | 'NOT_AVAILABLE' = 'AVAILABLE';
  if (isWeekend) {
    status = 'NOT_AVAILABLE';
  } else if (activeClass) {
    status = 'OCCUPIED';
  } else if (upcomingClass && secondsRemainingUntilNextClass !== null && secondsRemainingUntilNextClass <= 30 * 60) {
    // Free right now, but will be occupied in <= 30 minutes!
    status = 'AVAILABLE_SOON';
  } else if (isRestOfDayFree || !upcomingClass) {
    status = 'AVAILABLE';
  } else {
    status = 'AVAILABLE';
  }

  // Build full day period schedule
  const todaySchedule = COLLEGE_TIME_SLOTS.map((slot) => {
    const matchedSession = scheduled.find((s) => s.period === slot.period);
    return {
      period: slot.period,
      timeRange: `${formatHHMMToDisplay(slot.startTime)} - ${formatHHMMToDisplay(slot.endTime)}`,
      isOccupied: !!matchedSession,
      subject: matchedSession?.subjectName,
      section: matchedSession?.sectionDisplayName,
      isBreak: slot.isLunch,
    };
  });

  return {
    status,
    isFreeForEntireDuration,
    currentClass: activeClass
      ? {
          name: activeClass.subjectName,
          section: activeClass.sectionDisplayName,
          until: formatHHMMToDisplay(activeClass.endTime),
          faculty: activeClass.faculty,
        }
      : null,
    nextClass: upcomingClass
      ? {
          name: upcomingClass.subjectName,
          section: upcomingClass.sectionDisplayName,
          startsAt: formatHHMMToDisplay(upcomingClass.startTime),
          faculty: upcomingClass.faculty,
        }
      : null,
    freeUntil,
    freeMinutes,
    availableTimeRange,
    nextAvailableTime,
    todaySchedule,
    conflictSlots,
    secondsRemainingUntilNextClass,
    secondsRemainingInCurrentClass,
    countdownDisplay,
    isRestOfDayFree,
  };
}

/**
 * Natural Language Query Parser
 * Understands:
 * - "I need an AC room on the ground floor for 8 people for 2 hours"
 * - "for me and 5 friends" (= 6 people)
 * - "for 10 people"
 * - "for our 20-member project team"
 * - "from 1 PM to 3 PM"
 * - "for 90 minutes"
 * - "until 5 PM"
 * - "tomorrow from 10 AM to 12 PM"
 */
export function parseNaturalLanguageRoomQuery(query: string, referenceDate: Date = new Date()): StructuredRoomQuery {
  const q = query.toLowerCase().trim();

  // 1. Date Detection
  let targetDate = new Date(referenceDate);
  if (q.includes('tomorrow')) {
    targetDate.setDate(targetDate.getDate() + 1);
  } else if (q.includes('day after tomorrow')) {
    targetDate.setDate(targetDate.getDate() + 2);
  } else {
    // Check specific days like "on monday", "this friday"
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    for (let i = 0; i < 7; i++) {
      if (q.includes(dayNames[i])) {
        const curDay = targetDate.getDay();
        let diff = i - curDay;
        if (diff <= 0) diff += 7;
        targetDate.setDate(targetDate.getDate() + diff);
        break;
      }
    }
  }

  const dateStr = `${targetDate.getFullYear()}-${(targetDate.getMonth() + 1).toString().padStart(2, '0')}-${targetDate.getDate().toString().padStart(2, '0')}`;

  // 2. Start Time & Duration Detection
  let startMinutes = referenceDate.getHours() * 60 + referenceDate.getMinutes();
  // Round up to nearest 5 minutes
  startMinutes = Math.ceil(startMinutes / 5) * 5;

  let durationMinutes = 120; // Default 2 hours if not specified

  // Regex for "from X to Y" (e.g. "from 1 PM to 3 PM", "from 10:30 am to 12:30 pm", "1 to 3", "3 to 5")
  const fromToMatch = q.match(/(?:from\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*(?:to|until|-)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
  if (fromToMatch) {
    let startH = parseInt(fromToMatch[1], 10);
    const startM = fromToMatch[2] ? parseInt(fromToMatch[2], 10) : 0;
    const startMeridiem = fromToMatch[3] ? fromToMatch[3].toLowerCase() : null;

    let endH = parseInt(fromToMatch[4], 10);
    const endM = fromToMatch[5] ? parseInt(fromToMatch[5], 10) : 0;
    const endMeridiem = fromToMatch[6] ? fromToMatch[6].toLowerCase() : null;

    // Normalizing meridiem
    if (startMeridiem === 'pm' && startH < 12) startH += 12;
    if (startMeridiem === 'am' && startH === 12) startH = 0;
    if (!startMeridiem && startH >= 1 && startH <= 6) startH += 12; // Infer afternoon (1 PM - 6 PM)

    if (endMeridiem === 'pm' && endH < 12) endH += 12;
    if (endMeridiem === 'am' && endH === 12) endH = 0;
    if (!endMeridiem && endH >= 1 && endH <= 7) endH += 12;

    startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    if (endMinutes > startMinutes) {
      durationMinutes = endMinutes - startMinutes;
    }
  } else {
    // Check for "until X PM"
    const untilMatch = q.match(/until\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
    if (untilMatch) {
      let untilH = parseInt(untilMatch[1], 10);
      const untilM = untilMatch[2] ? parseInt(untilMatch[2], 10) : 0;
      const meridiem = untilMatch[3] ? untilMatch[3].toLowerCase() : null;
      if (meridiem === 'pm' && untilH < 12) untilH += 12;
      if (!meridiem && untilH >= 1 && untilH <= 6) untilH += 12;
      const endMins = untilH * 60 + untilM;
      if (endMins > startMinutes) {
        durationMinutes = endMins - startMinutes;
      }
    } else {
      // Check for duration phrases
      // e.g. "for 90 minutes", "for 45 mins", "for 30 minutes"
      const minsMatch = q.match(/(\d+)\s*(?:minute|minutes|min|mins)/i);
      if (minsMatch) {
        durationMinutes = parseInt(minsMatch[1], 10);
      } else {
        // e.g. "for 2 hours", "for 3 hrs", "for 1.5 hours", "for 1 hour"
        const hoursMatch = q.match(/(\d+(?:\.\d+)?)\s*(?:hour|hours|hr|hrs)/i);
        if (hoursMatch) {
          durationMinutes = Math.round(parseFloat(hoursMatch[1]) * 60);
        }
      }
    }
  }

  // Cap start time to college window (08:30 to 17:00) if querying general future
  if (startMinutes < 9 * 60 && !q.includes('am')) {
    // If night time, default to 09:00 AM on target date
    startMinutes = 9 * 60;
  }

  const endMinutes = startMinutes + durationMinutes;
  const startTimeStr = `${Math.floor(startMinutes / 60).toString().padStart(2, '0')}:${(startMinutes % 60).toString().padStart(2, '0')}`;
  const endTimeStr = `${Math.floor(endMinutes / 60).toString().padStart(2, '0')}:${(endMinutes % 60).toString().padStart(2, '0')}`;
  const displayTimeRange = `${minutesToDisplayTime(startMinutes)} → ${minutesToDisplayTime(endMinutes)}`;

  // 3. Group Size / Capacity Interpretation (Requirement 10)
  let minCapacity: number | undefined = undefined;

  // "for me and 5 friends" -> 1 + 5 = 6
  const meAndFriendsMatch = q.match(/(?:for\s+)?me\s+and\s+(\d+)\s+(?:friends|people|teammates|students)/i);
  if (meAndFriendsMatch) {
    minCapacity = 1 + parseInt(meAndFriendsMatch[1], 10);
  } else {
    // "for our 20-member project team" -> 20
    const memberTeamMatch = q.match(/(\d+)\s*[- ]\s*member/i);
    if (memberTeamMatch) {
      minCapacity = parseInt(memberTeamMatch[1], 10);
    } else {
      // "for 10 people", "for 8 students", "for 15 of us"
      const peopleMatch = q.match(/(?:for\s+)?(\d+)\s*(?:people|students|members|persons|folks|of us)/i);
      if (peopleMatch) {
        minCapacity = parseInt(peopleMatch[1], 10);
      }
    }
  }

  // 4. Floor Extraction (Requirement 4)
  let floor: number | null | undefined = undefined;
  if (q.includes('ground') || q.includes('floor 0') || q.includes('0th floor') || q.includes('level 0')) {
    floor = 0;
  } else if (q.includes('first floor') || q.includes('1st floor') || q.includes('floor 1')) {
    floor = 1;
  } else if (q.includes('second floor') || q.includes('2nd floor') || q.includes('floor 2')) {
    floor = 2;
  } else if (q.includes('third floor') || q.includes('3rd floor') || q.includes('floor 3')) {
    floor = 3;
  } else if (q.includes('fourth floor') || q.includes('4th floor') || q.includes('floor 4')) {
    floor = 4;
  } else if (q.includes('fifth floor') || q.includes('5th floor') || q.includes('floor 5')) {
    floor = 5;
  } else if (q.includes('sixth floor') || q.includes('6th floor') || q.includes('floor 6')) {
    floor = 6;
  } else if (q.includes('seventh floor') || q.includes('7th floor') || q.includes('floor 7')) {
    floor = 7;
  }

  // 5. Features Extraction (Requirement 4 & 6)
  const requireAC = q.includes('ac') && !q.includes('non-ac') && !q.includes('non ac') ? true : undefined;
  const requireProjector = q.includes('projector') ? true : undefined;
  const requireSmartBoard = q.includes('smart board') || q.includes('smartboard') ? true : undefined;
  const requireLab = q.includes('lab') || q.includes('computer') ? true : undefined;
  const requireQuiet = q.includes('quiet') || q.includes('silent') ? true : undefined;

  // 6. Ambiguity Check (Requirement 13)
  // e.g. "I need a room for my team" without capacity or duration
  let isAmbiguous = false;
  let clarificationMessage: string | undefined = undefined;
  if (
    (q.includes('my team') || q.includes('our team') || q.includes('for study') || q.includes('for project')) &&
    !minCapacity &&
    !q.includes('hour') &&
    !q.includes('min') &&
    !fromToMatch
  ) {
    isAmbiguous = true;
    clarificationMessage = 'Sure! How many people are in your team, and how long do you need the room?';
  }

  return {
    date: dateStr,
    startTime: startTimeStr,
    endTime: endTimeStr,
    durationMinutes,
    displayTimeRange,
    floor,
    requireAC,
    minCapacity,
    requireProjector,
    requireSmartBoard,
    requireLab,
    requireQuiet,
    originalQuery: query,
    isAmbiguous,
    clarificationMessage,
  };
}

/**
 * Ranks all rooms based on factual match criteria
 */
export function rankRoomsForQuery(
  rooms: Room[],
  parsedQuery: StructuredRoomQuery
): {
  matches: RankedRoomMatch[];
  alternatives: { reason: string; room: Room; status: RoomStatus }[];
} {
  const matches: RankedRoomMatch[] = [];
  const alternatives: { reason: string; room: Room; status: RoomStatus }[] = [];

  rooms.forEach((room) => {
    const status = calculateRoomStatus(
      room,
      parsedQuery.date,
      parsedQuery.startTime,
      parsedQuery.durationMinutes
    );

    const matchReasons: string[] = [];
    const mismatchReasons: string[] = [];
    let score = 0;

    // CRITERION 1: CONFLICT PROTECTION (Requirement 11)
    // Must be completely free for the ENTIRE duration!
    if (!status.isFreeForEntireDuration) {
      mismatchReasons.push(`Conflict: Class scheduled during requested period (${status.conflictSlots.map((c) => c.subject).join(', ')})`);
    } else {
      matchReasons.push(`Free for entire ${Math.round(parsedQuery.durationMinutes / 60 * 10) / 10}h (${status.availableTimeRange})`);
      score += 100;
    }

    // CRITERION 2: Floor match
    if (parsedQuery.floor !== undefined && parsedQuery.floor !== null) {
      if (room.floor === parsedQuery.floor) {
        matchReasons.push(`${room.floorName}`);
        score += 20;
      } else {
        mismatchReasons.push(`On ${room.floorName} (Requested: Floor ${parsedQuery.floor})`);
      }
    }

    // CRITERION 3: AC requirement
    if (parsedQuery.requireAC) {
      if (room.hasAC) {
        matchReasons.push('Air Conditioned (AC)');
        score += 15;
      } else {
        mismatchReasons.push('Non-AC Room');
      }
    }

    // CRITERION 4: Capacity requirement
    if (parsedQuery.minCapacity) {
      if (room.capacity >= parsedQuery.minCapacity) {
        matchReasons.push(`Capacity: ${room.capacity} (Need: ${parsedQuery.minCapacity})`);
        score += 15;
      } else {
        mismatchReasons.push(`Capacity ${room.capacity} < ${parsedQuery.minCapacity} requested`);
      }
    }

    // CRITERION 5: Facilities
    if (parsedQuery.requireProjector) {
      if (room.hasProjector) {
        matchReasons.push('Projector Available');
        score += 10;
      } else {
        mismatchReasons.push('No Projector');
      }
    }

    if (parsedQuery.requireSmartBoard) {
      if (room.hasSmartBoard) {
        matchReasons.push('Smart Board Available');
        score += 10;
      } else {
        mismatchReasons.push('No Smart Board');
      }
    }

    if (parsedQuery.requireLab) {
      if (room.isLab || room.hasComputer) {
        matchReasons.push('Lab / Computers Available');
        score += 10;
      } else {
        mismatchReasons.push('Standard Classroom (Not Lab)');
      }
    }

    // Must be completely free to be in primary matches
    if (status.isFreeForEntireDuration && mismatchReasons.length === 0) {
      matches.push({
        room,
        status,
        score,
        matchReasons,
        mismatchReasons,
      });
    } else if (status.isFreeForEntireDuration && mismatchReasons.length > 0) {
      // Room is free for entire time, but differs slightly in floor or AC
      alternatives.push({
        reason: mismatchReasons.join(' • '),
        room,
        status,
      });
    } else if (!status.isFreeForEntireDuration && status.nextAvailableTime) {
      // Room has conflict now, but becomes available later (Requirement 15)
      alternatives.push({
        reason: `Available later starting at ${status.nextAvailableTime} (Free until ${status.freeUntil || 'End of Day'})`,
        room,
        status,
      });
    }
  });

  // Sort matches by score descending
  matches.sort((a, b) => b.score - a.score);

  return { matches, alternatives };
}
