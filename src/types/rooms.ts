export interface Room {
  id: string; // e.g. "IST-204"
  roomNumber: string; // e.g. "IST 204"
  floor: number; // 0 for Ground, 1, 2, 3, 4, 5, 6, 7
  floorName: string; // "Ground Floor", "1st Floor", etc.
  capacity: number; // e.g. 60
  hasAC: boolean;
  hasProjector: boolean;
  hasSmartBoard: boolean;
  hasComputer: boolean;
  isLab: boolean;
  hasPowerOutlets: boolean;
  hasWifi: boolean;
  building: string; // e.g. "IST Tech Park"
  isQuiet: boolean;
  roomType: 'Classroom' | 'Seminar Hall' | 'Computer Lab' | 'Electronics Lab' | 'Discussion Room';
}

export type RoomAvailabilityStatus = 'AVAILABLE' | 'OCCUPIED' | 'AVAILABLE_SOON' | 'NOT_AVAILABLE';

export interface RoomClassSession {
  subjectName: string;
  subjectCode?: string;
  sectionDisplayName: string;
  faculty?: string;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  period: number;
}

export interface RoomStatus {
  status: RoomAvailabilityStatus;
  isFreeForEntireDuration: boolean;
  currentClass: {
    name: string;
    section: string;
    until: string;
    faculty?: string;
  } | null;
  nextClass: {
    name: string;
    section: string;
    startsAt: string;
    faculty?: string;
  } | null;
  freeUntil: string | null; // e.g. "02:30 PM" or "Free for the rest of the scheduled day"
  freeMinutes: number; // consecutive minutes from start time until next class
  availableTimeRange: string; // e.g. "02:00 PM → 04:10 PM"
  nextAvailableTime: string | null; // e.g. "03:20 PM" if occupied now
  todaySchedule: {
    period: number;
    timeRange: string;
    isOccupied: boolean;
    subject?: string;
    section?: string;
    isBreak?: boolean;
  }[];
  conflictSlots: {
    startTime: string;
    endTime: string;
    subject: string;
    section: string;
  }[];
  // Phase 3 Live Countdown properties
  secondsRemainingUntilNextClass: number | null;
  secondsRemainingInCurrentClass: number | null;
  countdownDisplay: string; // "00:47:18" or "Free rest of day" or "Occupied"
  isRestOfDayFree: boolean;
}

export interface StructuredRoomQuery {
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  durationMinutes: number; // e.g. 120
  displayTimeRange: string; // "2:00 PM → 4:00 PM"
  floor?: number | null;
  requireAC?: boolean;
  minCapacity?: number;
  requireProjector?: boolean;
  requireSmartBoard?: boolean;
  requireLab?: boolean;
  requireQuiet?: boolean;
  building?: string;
  originalQuery: string;
  isAmbiguous?: boolean;
  clarificationMessage?: string;
}

export interface RankedRoomMatch {
  room: Room;
  status: RoomStatus;
  score: number;
  matchReasons: string[];
  mismatchReasons: string[];
}
