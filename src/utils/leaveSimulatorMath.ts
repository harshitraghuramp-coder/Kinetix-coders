import { SectionTimetable, OfficialSubject } from '../types/timetable';
import { Subject, LeaveRecord, LeavePolicy, SubjectLeaveImpact } from '../types/attendance';
import { countScheduledClassesInDateRange } from './timetableDateMath';

/**
 * Calculates how an OD or Medical leave impacts subjects according to the selected policy:
 * - COUNT_AS_ATTENDED:
 *     conducted' = conducted + missedClasses
 *     attended' = attended + missedClasses
 *     percentage = (attended + approved) / (conducted + approved)
 * - COUNT_AS_ABSENT:
 *     conducted' = conducted + missedClasses
 *     attended' = attended (0 added)
 *     percentage = attended / (conducted + missedClasses)
 * - EXCLUDE_FROM_TOTAL:
 *     conducted' = conducted (excluded from count if already part of schedule)
 *     attended' = attended
 *     or if simulated on conducted classes:
 *     effective = attended / Math.max(1, (conducted - excluded))
 */
export function simulateLeaveImpact(
  timetable: SectionTimetable,
  subjects: Subject[],
  leave: Omit<LeaveRecord, 'id' | 'applied'>,
  policy: LeavePolicy,
  customHolidays: string[] = []
): {
  totalAffectedPeriods: number;
  subjectImpacts: SubjectLeaveImpact[];
  summaryText: string;
} {
  // Count scheduled classes within leave range using official timetable
  const rangeResult = countScheduledClassesInDateRange(
    timetable,
    leave.startDate,
    leave.endDate,
    customHolidays,
    true
  );

  let totalAffectedPeriods = 0;
  const subjectImpacts: SubjectLeaveImpact[] = [];

  subjects.forEach((sub) => {
    // If leave was restricted to a specific subject, skip others
    if (leave.subjectCode && sub.code && leave.subjectCode !== sub.code) {
      return;
    }

    const missedClasses = (sub.code && rangeResult.bySubject[sub.code]) || 0;
    if (missedClasses > 0) {
      totalAffectedPeriods += missedClasses;

      const beforeConducted = Math.max(1, sub.conducted);
      const beforeAttended = sub.attended;
      const beforePct = Number(((beforeAttended / beforeConducted) * 100).toFixed(2));

      let afterConducted = sub.conducted;
      let afterAttended = sub.attended;

      if (policy === 'COUNT_AS_ATTENDED') {
        afterConducted += missedClasses;
        afterAttended += missedClasses;
      } else if (policy === 'COUNT_AS_ABSENT') {
        afterConducted += missedClasses;
      } else if (policy === 'EXCLUDE_FROM_TOTAL') {
        // Excluded from total calculation
        // If it's a future scheduled class, conducted doesn't grow; if already conducted, subtract
        afterConducted = Math.max(afterAttended, sub.conducted); 
      }

      const afterPct =
        afterConducted === 0
          ? 100
          : Number(((afterAttended / afterConducted) * 100).toFixed(2));
      const differencePct = Number((afterPct - beforePct).toFixed(2));
      const isBelow75 = afterPct < 75;

      let explanation = '';
      if (policy === 'COUNT_AS_ATTENDED') {
        explanation = `${missedClasses} ${leave.leaveType} classes counted as attended (+${missedClasses} attended, +${missedClasses} total).`;
      } else if (policy === 'COUNT_AS_ABSENT') {
        explanation = `${missedClasses} ${leave.leaveType} classes counted as absent (0 attended, +${missedClasses} total).`;
      } else {
        explanation = `${missedClasses} ${leave.leaveType} classes completely excluded from total attendance tally.`;
      }

      subjectImpacts.push({
        subjectCode: sub.code || sub.name,
        subjectName: sub.name,
        classesMissed: missedClasses,
        beforeAttendance: beforePct,
        afterAttendance: afterPct,
        differencePct,
        isBelow75,
        explanation,
        afterConducted,
        afterAttended,
      });
    }
  });

  const leaveName =
    leave.leaveType === 'OD'
      ? 'On-Duty (OD)'
      : leave.leaveType === 'MEDICAL'
      ? 'Medical Leave'
      : 'Approved Leave';

  let policyExplanation = '';
  if (policy === 'COUNT_AS_ATTENDED') {
    policyExplanation = `All ${totalAffectedPeriods} approved ${leaveName} classes are being counted as attended according to your selected policy.`;
  } else if (policy === 'COUNT_AS_ABSENT') {
    policyExplanation = `All ${totalAffectedPeriods} ${leaveName} classes are being counted as absent according to your selected policy.`;
  } else {
    policyExplanation = `All ${totalAffectedPeriods} ${leaveName} classes are excluded from total class denominators according to your selected policy.`;
  }

  return {
    totalAffectedPeriods,
    subjectImpacts,
    summaryText: policyExplanation,
  };
}
