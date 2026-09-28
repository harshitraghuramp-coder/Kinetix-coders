import { SectionTimetable, OfficialSubject } from '../types/timetable';

export interface DateClassCountResult {
  totalClasses: number;
  bySubject: Record<string, number>; // subject code or id -> count of scheduled periods
  datesChecked: number;
  holidaysSkipped: number;
  weekendsSkipped: number;
}

const DAY_NAMES: ('Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday')[] = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

/**
 * Counts scheduled classes between startDate and endDate according to the official timetable.
 *
 * @param timetable The selected section timetable (official source of truth)
 * @param startDateStr "YYYY-MM-DD"
 * @param endDateStr "YYYY-MM-DD"
 * @param customHolidays List of "YYYY-MM-DD" strings to exclude as holidays
 * @param includeStartDate Whether to include startDate in count (default: true)
 */
export function countScheduledClassesInDateRange(
  timetable: SectionTimetable,
  startDateStr: string,
  endDateStr: string,
  customHolidays: string[] = [],
  includeStartDate: boolean = true
): DateClassCountResult {
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);

  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  const holidaySet = new Set(customHolidays.map((h) => h.trim()));

  const bySubject: Record<string, number> = {};
  timetable.subjects.forEach((s) => {
    bySubject[s.code] = 0;
  });

  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) {
    return {
      totalClasses: 0,
      bySubject,
      datesChecked: 0,
      holidaysSkipped: 0,
      weekendsSkipped: 0,
    };
  }

  let totalClasses = 0;
  let datesChecked = 0;
  let holidaysSkipped = 0;
  let weekendsSkipped = 0;

  const current = new Date(start);
  if (!includeStartDate) {
    current.setDate(current.getDate() + 1);
  }

  while (current <= end) {
    datesChecked++;
    const dateIso = current.toISOString().split('T')[0];
    const dayOfWeek = DAY_NAMES[current.getDay()];

    if (dayOfWeek === 'Sunday' || dayOfWeek === 'Saturday') {
      weekendsSkipped++;
    } else if (holidaySet.has(dateIso)) {
      holidaysSkipped++;
    } else {
      // It is a valid timetable day!
      const periods = timetable.schedule[dayOfWeek];
      if (periods && Array.isArray(periods)) {
        for (const periodSlot of periods) {
          if (!periodSlot || periodSlot === '-' || periodSlot === 'LUNCH') {
            continue;
          }

          // Match periodSlot to subjects in this timetable
          // Slot can be 'A', 'B', 'C', 'Che lab', 'Workshop', 'CDC', 'G', 'F / G', etc.
          const matchedSubject = findSubjectBySlot(timetable.subjects, periodSlot);
          if (matchedSubject) {
            bySubject[matchedSubject.code] = (bySubject[matchedSubject.code] || 0) + 1;
            totalClasses++;
          } else {
            // Check if slot name matches any subject directly
            totalClasses++;
          }
        }
      }
    }

    current.setDate(current.getDate() + 1);
  }

  return {
    totalClasses,
    bySubject,
    datesChecked,
    holidaysSkipped,
    weekendsSkipped,
  };
}

/**
 * Matches a timetable slot string (e.g. "A", "LAB", "F / G", "Che lab", "German") to an OfficialSubject.
 */
export function findSubjectBySlot(subjects: OfficialSubject[], slotStr: string): OfficialSubject | undefined {
  const cleanSlot = slotStr.trim();

  // Direct match on slot
  let found = subjects.find((s) => s.slot.toLowerCase() === cleanSlot.toLowerCase());
  if (found) return found;

  // Match if slotStr contains multiple, like "F / G"
  if (cleanSlot.includes('/')) {
    const parts = cleanSlot.split('/').map((p) => p.trim().toLowerCase());
    found = subjects.find((s) => parts.includes(s.slot.toLowerCase()));
    if (found) return found;
  }

  // Match by code or name
  found = subjects.find(
    (s) =>
      s.code.toLowerCase() === cleanSlot.toLowerCase() ||
      s.name.toLowerCase() === cleanSlot.toLowerCase() ||
      cleanSlot.toLowerCase().includes(s.name.toLowerCase())
  );
  if (found) return found;

  // Partial match (e.g., "Che lab" matches "Chemistry Laboratory")
  if (cleanSlot.toLowerCase().includes('lab')) {
    found = subjects.find((s) => s.isLab && cleanSlot.toLowerCase().includes(s.slot.toLowerCase()));
    if (found) return found;
  }

  return undefined;
}
