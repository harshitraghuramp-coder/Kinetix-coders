export interface TimeSlot {
  period: number;
  timeRange: string;
  slotOrSubject: string; // e.g. "A", "E", "Che lab", "Workshop", "PPS LAB", etc.
  type?: 'theory' | 'lab' | 'break' | 'activity';
  venue?: string;
}

export interface DaySchedule {
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  periods: (string | null)[]; // 9 periods or specific slots per period
}

export interface OfficialSubject {
  slot: string; // e.g., 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'LAB', or course code
  code: string;
  name: string;
  credits: string; // L-T-P-C
  periodsPerWeek: number; // exact count of scheduled periods per week
  faculty: string;
  department: string;
  isLab?: boolean;
}

export interface SectionTimetable {
  id: string; // e.g. "2026-27-III-ECE-A"
  academicYear: string; // e.g. "2026-2027" or "2024-2025"
  semesterType: 'Odd' | 'Even';
  yearLevel: string; // "I Year", "II Year", "III Year", "IV Year"
  semesterNum: string; // "I", "II", "III", "IV", "V", "VI", "VII", "VIII"
  branch: string; // "ECE", "BME", "ECE-DS", "Biotech-B; Biomed. Engg."
  section: string; // "A", "B", "DS A", "DS", "B & EEE"
  displayName: string; // e.g. "III ECE-A (Odd Sem 2026-2027)"
  venue?: string;
  timeSlots: { period: number; time: string }[];
  schedule: Record<string, string[]>; // Day ('Monday', etc.) -> array of 9 periods slot strings
  subjects: OfficialSubject[];
  workingDays: ('Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday')[];
}
