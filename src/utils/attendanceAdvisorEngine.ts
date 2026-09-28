import { SectionTimetable } from '../types/timetable';
import { Subject, SubjectCalculation, OverallSemesterStats, LeaveRecord, LeavePolicy } from '../types/attendance';
import { countScheduledClassesInDateRange } from './timetableDateMath';
import { simulateLeaveImpact } from './leaveSimulatorMath';

import {
  parseNaturalLanguageRoomQuery,
  rankRoomsForQuery,
} from './classroomAvailabilityEngine';
import { getCustomizedRooms } from '../data/roomData';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  isWarning?: boolean;
  isDetention?: boolean;
}

/**
 * Shared Attendance Advisor computation engine:
 * Resolves natural language questions using EXACT data and formulas from the shared math engine.
 */
export function answerAttendanceQuestion(
  query: string,
  context: {
    currentTimetable: SectionTimetable;
    subjects: Subject[];
    calculations: SubjectCalculation[];
    stats: OverallSemesterStats;
    planningDate: string;
    semesterEndDate: string;
    novemberDeadline: string;
    todayDateStr: string;
    leaveRecords: LeaveRecord[];
    leavePolicy: LeavePolicy;
    customHolidays: string[];
    selectedTarget: number;
  }
): { text: string; isWarning?: boolean; isDetention?: boolean } {
  const q = query.trim().toLowerCase();
  const {
    currentTimetable,
    subjects,
    calculations,
    stats,
    planningDate,
    semesterEndDate,
    novemberDeadline,
    todayDateStr,
    leavePolicy,
    customHolidays,
    selectedTarget,
  } = context;

  // 1. Most in danger / critical / lowest subject
  if (
    q.includes('danger') ||
    q.includes('risk') ||
    q.includes('lowest') ||
    q.includes('worst')
  ) {
    if (calculations.length === 0) {
      return { text: 'You do not have any subjects loaded in your dashboard right now.' };
    }

    const sortedByLowest = [...calculations].sort(
      (a, b) => a.currentPercentage - b.currentPercentage
    );
    const worst = sortedByLowest[0];
    const detentionCount = calculations.filter(
      (c) => c.warningLevel === 'IRREVERSIBLE_DETENTION'
    ).length;

    let response = `The subject in the most critical condition is **${worst.subject.name}** (${worst.currentPercentage.toFixed(2)}%).`;

    if (worst.warningLevel === 'IRREVERSIBLE_DETENTION') {
      return {
        text: `⚠️ **IRREVERSIBLE DETENTION DETECTED**\n\n${worst.subject.name} currently stands at **${worst.currentPercentage.toFixed(2)}%** with ${worst.effectiveRemaining} remaining classes. Even with 100% attendance in every remaining class, your maximum possible final attendance will be **${worst.analysis75.maxPossibleAttendance.toFixed(2)}%**, which cannot reach the mandatory 75.00% threshold.\n\nPlease contact your Head of Department immediately for remedial options.`,
        isDetention: true,
        isWarning: true,
      };
    }

    response += `\n- Current attendance: ${worst.currentPercentage.toFixed(2)}% (${worst.subject.attended}/${worst.subject.conducted} classes)`;
    response += `\n- Remaining classes: ${worst.effectiveRemaining}`;
    response += `\n- Must attend to reach 75%: **${worst.analysis75.requiredToAttend}** classes (can miss at most ${worst.analysis75.maxCanMiss}).`;
    response += `\n- Maximum possible final attendance: **${worst.maxPossibleFinalPercentage.toFixed(2)}%**.`;

    return { text: response, isWarning: worst.currentPercentage < 75 };
  }

  // 2. Questions about November Deadline ("reach 90% by November?", "november recovery", "before november")
  if (q.includes('november') || q.includes('nov')) {
    // Check target: 90% or 75% or 80%
    const target = q.includes('90') ? 90 : q.includes('80') ? 80 : 75;

    // Specific subject or overall?
    const matchedSubject = findSubjectInQuery(subjects, q);
    if (matchedSubject) {
      const calc = calculations.find((c) => c.subject.id === matchedSubject.id);
      if (!calc) return { text: `Could not retrieve data for ${matchedSubject.name}.` };

      const subCode = matchedSubject.code || '';
      const novClassesResult = countScheduledClassesInDateRange(
        currentTimetable,
        todayDateStr,
        novemberDeadline,
        customHolidays,
        true
      );
      const classesBeforeNov = (subCode && novClassesResult.bySubject[subCode]) || 0;
      const totalByNov = matchedSubject.conducted + classesBeforeNov;
      const maxAttendedByNov = matchedSubject.attended + classesBeforeNov;
      const maxPctByNov =
        totalByNov === 0 ? 100 : Number(((maxAttendedByNov / totalByNov) * 100).toFixed(2));
      const neededByNov = Math.max(
        0,
        Math.ceil((target / 100) * totalByNov - matchedSubject.attended)
      );
      const isPossibleByNov = neededByNov <= classesBeforeNov;

      if (matchedSubject.attended / Math.max(1, matchedSubject.conducted) >= target / 100) {
        return {
          text: `Yes! For **${matchedSubject.name}**, your attendance is currently **${calc.currentPercentage.toFixed(2)}%**, which already exceeds your ${target}% target.\n\nBetween today (${todayDateStr}) and the November deadline (${novemberDeadline}), there are **${classesBeforeNov}** scheduled ${matchedSubject.name} classes. You can miss up to ${calc.analysis75.maxCanMiss} classes and stay safe.`,
        };
      }

      if (!isPossibleByNov) {
        return {
          text: `❌ **Recovery before November is mathematically impossible for ${matchedSubject.name}.**\n\n- Current attendance: ${calc.currentPercentage.toFixed(2)}%\n- Scheduled classes before Nov (${novemberDeadline}): ${classesBeforeNov}\n- Even if you attend all ${classesBeforeNov} classes, your maximum attendance by November will only reach **${maxPctByNov.toFixed(2)}%**, which falls short of ${target}%.`,
          isWarning: true,
        };
      } else {
        return {
          text: `Yes, reaching ${target}% before November for **${matchedSubject.name}** is mathematically possible!\n\n- Current attendance: ${calc.currentPercentage.toFixed(2)}%\n- Scheduled classes before Nov: ${classesBeforeNov}\n- You must attend at least **${neededByNov} of the ${classesBeforeNov}** upcoming classes before the November deadline.`,
        };
      }
    } else {
      // Overall November question
      const novRange = countScheduledClassesInDateRange(
        currentTimetable,
        todayDateStr,
        novemberDeadline,
        customHolidays,
        true
      );
      return {
        text: `According to your section timetable (**${currentTimetable.displayName}**):\n\n- There are **${novRange.totalClasses} total scheduled periods** between today (${todayDateStr}) and the November recovery deadline (${novemberDeadline}).\n- Current overall attendance: **${stats.currentPercentage.toFixed(2)}%**.\n- Safe subjects: ${stats.safeCount}, At-Risk: ${stats.warningCount + stats.recoverableCount}, Detention: ${stats.detentionCount}.\n\nAsk about any specific subject (e.g., "Can I reach 75% in Discrete Mathematics by November?") for the exact period-by-period breakdown.`,
      };
    }
  }

  // 3. Questions about taking leave / sick leave / OD ("sick leave", "take leave", "take 3-day", "bunk tomorrow", "od next week")
  if (
    q.includes('leave') ||
    q.includes('sick') ||
    q.includes('od') ||
    q.includes('on-duty') ||
    q.includes('bunk') ||
    q.includes('miss')
  ) {
    // Check if user specified a specific number of days, e.g. "3-day sick leave", "2 days"
    const daysMatch = q.match(/(\d+)\s*(day|days|-day)/);
    const numDays = daysMatch ? parseInt(daysMatch[1], 10) : 1;

    // Subject matched?
    const matchedSubject = findSubjectInQuery(subjects, q);

    // Compute dates starting tomorrow or today
    const startD = new Date();
    if (q.includes('tomorrow')) {
      startD.setDate(startD.getDate() + 1);
    }
    const endD = new Date(startD);
    endD.setDate(endD.getDate() + Math.max(0, numDays - 1));

    const sStr = startD.toISOString().split('T')[0];
    const eStr = endD.toISOString().split('T')[0];

    const leaveType = q.includes('od') || q.includes('on-duty') ? 'OD' : 'MEDICAL';
    const sim = simulateLeaveImpact(
      currentTimetable,
      subjects,
      {
        leaveType,
        startDate: sStr,
        endDate: eStr,
        subjectCode: matchedSubject ? matchedSubject.code : undefined,
      },
      leavePolicy,
      customHolidays
    );

    if (matchedSubject) {
      const impact = sim.subjectImpacts.find(
        (i) => i.subjectCode === matchedSubject.code || i.subjectName === matchedSubject.name
      );
      const calc = calculations.find((c) => c.subject.id === matchedSubject.id);

      if (!impact || impact.classesMissed === 0) {
        return {
          text: `Based on your **${currentTimetable.displayName}** timetable, there are **0 classes** of ${matchedSubject.name} scheduled between ${sStr} and ${eStr} (either falling on a weekend, holiday, or off-day). Taking this leave will not impact your ${matchedSubject.name} attendance.`,
        };
      }

      let resp = `${impact.isBelow75 ? '⚠️ **Yes, this leave is risky.**' : '✓ **Safe to proceed.**'}\n\n`;
      resp += `Based on your ${matchedSubject.name} timetable, those ${numDays} day(s) contain **${impact.classesMissed}** ${matchedSubject.name} class(es).\n\n`;
      resp += `- Current attendance: **${impact.beforeAttendance.toFixed(2)}%**\n`;
      resp += `- Classes affected: **${impact.classesMissed}**\n`;
      resp += `- Projected attendance after leave: **${impact.afterAttendance.toFixed(2)}%**\n`;
      resp += `- Active policy: *${leavePolicy}*\n\n`;

      if (impact.isBelow75) {
        resp += `This leave would drop you **below 75%**. To recover, you would need to attend at least **${calc?.analysis75.requiredToAttend || 0}** of your remaining scheduled classes.`;
      } else {
        resp += `Your attendance remains comfortably above 75%.`;
      }

      return { text: resp, isWarning: impact.isBelow75 };
    } else {
      // Across all subjects
      if (sim.totalAffectedPeriods === 0) {
        return {
          text: `According to your timetable (**${currentTimetable.displayName}**), no classes occur during those ${numDays} day(s) from ${sStr} to ${eStr} (weekend or non-working day).`,
        };
      }

      let resp = `A ${numDays}-day ${leaveType === 'OD' ? 'On-Duty' : 'Leave'} from ${sStr} to ${eStr} affects **${sim.totalAffectedPeriods} timetable class(es)**:\n\n`;
      sim.subjectImpacts.forEach((imp) => {
        resp += `• **${imp.subjectName}**: ${imp.classesMissed} class(es) (${imp.beforeAttendance.toFixed(1)}% → **${imp.afterAttendance.toFixed(1)}%**)${imp.isBelow75 ? ' ⚠️ [Below 75%]' : ''}\n`;
      });
      resp += `\nPolicy applied: *${sim.summaryText}*`;

      return { text: resp, isWarning: sim.subjectImpacts.some((i) => i.isBelow75) };
    }
  }

  // 4. Questions about how many classes can be missed ("how many classes can I miss?", "bunk allowance")
  if (
    q.includes('how many') &&
    (q.includes('miss') || q.includes('bunk') || q.includes('skip'))
  ) {
    const matchedSubject = findSubjectInQuery(subjects, q);
    if (matchedSubject) {
      const calc = calculations.find((c) => c.subject.id === matchedSubject.id);
      if (!calc) return { text: `Subject data not found.` };

      const a75 = calc.analysis75;
      const a80 = calc.analysis80;
      const a90 = calc.analysis90;

      if (!a75.isPossible) {
        return {
          text: `⚠️ **IRREVERSIBLE DETENTION:** You cannot miss **any** classes in **${matchedSubject.name}**. Even with 100% attendance in all ${calc.effectiveRemaining} remaining classes, your maximum possible attendance will be **${a75.maxPossibleAttendance.toFixed(2)}%**, which is below 75%.`,
          isDetention: true,
          isWarning: true,
        };
      }

      return {
        text: `For **${matchedSubject.name}** (Current: ${calc.currentPercentage.toFixed(2)}%, Remaining: ${calc.effectiveRemaining}):\n\n- To stay at or above **75%**: You can miss up to **${a75.maxCanMiss} classes** (Must attend at least ${a75.requiredToAttend}).\n- To stay at or above **80%**: You can miss up to **${a80.isPossible ? `${a80.maxCanMiss} classes` : '0 (Not possible)'}**.\n- To stay at or above **90%**: You can miss up to **${a90.isPossible ? `${a90.maxCanMiss} classes` : '0 (Not possible)'}**.\n- **Instant Bunk Right Now**: You can miss up to **${a75.instantBunkableNow} consecutive class(es)** today without dipping below 75%.`,
      };
    } else {
      // Overall summary of missable classes
      let resp = `Here is your safe miss allowance to maintain 75% across your subjects:\n\n`;
      calculations.forEach((c) => {
        resp += `• **${c.subject.name}**: Can miss **${c.analysis75.maxCanMiss}** of ${c.effectiveRemaining} remaining classes (${c.currentPercentage.toFixed(1)}%)\n`;
      });
      return { text: resp };
    }
  }

  // 5. Questions about reaching a target ("can I reach 75%?", "can I reach 90%?", "how many to attend")
  if (
    q.includes('reach') ||
    q.includes('target') ||
    q.includes('attend continuously') ||
    q.includes('get back')
  ) {
    const target = q.includes('90') ? 90 : q.includes('80') ? 80 : 75;
    const matchedSubject = findSubjectInQuery(subjects, q);

    if (matchedSubject) {
      const calc = calculations.find((c) => c.subject.id === matchedSubject.id);
      if (!calc) return { text: `Subject data not found.` };

      const analysis =
        target === 90
          ? calc.analysis90
          : target === 80
          ? calc.analysis80
          : calc.analysis75;

      if (!analysis.isPossible) {
        return {
          text: `❌ Reaching **${target}%** in **${matchedSubject.name}** is mathematically impossible with your remaining scheduled classes.\n\n- Current attendance: ${calc.currentPercentage.toFixed(2)}%\n- Remaining classes: ${calc.effectiveRemaining}\n- Maximum possible final attendance: **${analysis.maxPossibleAttendance.toFixed(2)}%**\n- Shortfall: **${analysis.shortfallPercentage.toFixed(2)}%**`,
          isWarning: true,
          isDetention: target === 75,
        };
      }

      if (analysis.isAlreadyAchieved) {
        return {
          text: `✓ Target already achieved! For **${matchedSubject.name}**, your attendance is **${calc.currentPercentage.toFixed(2)}%**, which already exceeds ${target}%. Even if you attend 0 remaining classes, your final attendance will remain safe.`,
        };
      }

      return {
        text: `To reach **${target}%** in **${matchedSubject.name}**:\n\n- You must attend at least **${analysis.requiredToAttend} of the ${calc.effectiveRemaining}** remaining classes.\n- You can miss at most **${analysis.maxCanMiss}** classes.\n- If you attend every single remaining class, your final attendance will reach **${calc.maxPossibleFinalPercentage.toFixed(2)}%**.`,
      };
    } else {
      return {
        text: `To reach **${target}%** overall across your semester:\n\n- Overall current attendance: **${stats.currentPercentage.toFixed(2)}%**\n- Total remaining classes: **${stats.totalRemaining}**\n- You must attend at least **${target === 75 ? stats.overallAnalysis75.requiredToAttend : target === 80 ? stats.overallAnalysis80.requiredToAttend : stats.overallAnalysis90.requiredToAttend}** classes semester-wide.\n- Safe subjects: ${stats.safeCount}, At-Risk: ${stats.warningCount + stats.recoverableCount}, Detention: ${stats.detentionCount}.`,
      };
    }
  }

  // 6. Final attendance if all classes attended ("what will my final attendance be?", "if I attend every class")
  if (
    q.includes('final attendance') ||
    q.includes('attend every') ||
    q.includes('attend all') ||
    q.includes('100%')
  ) {
    let resp = `If you attend 100% of all remaining scheduled classes until ${semesterEndDate}:\n\n`;
    resp += `• **Overall Semester Final**: **${stats.maxPossiblePercentage.toFixed(2)}%** (Current: ${stats.currentPercentage.toFixed(2)}%)\n\n`;
    calculations.forEach((c) => {
      resp += `• **${c.subject.name}**: Can reach up to **${c.maxPossibleFinalPercentage.toFixed(2)}%** (from ${c.currentPercentage.toFixed(1)}%)\n`;
    });
    return { text: resp };
  }

  // 7. Room Finder queries ("which rooms are free right now?", "find me an AC room on ground floor", "where can i study")
  if (
    q.includes('room') ||
    q.includes('classroom') ||
    q.includes('free class') ||
    q.includes('study room') ||
    q.includes('empty class') ||
    q.includes('somewhere to work') ||
    q.includes('place to study')
  ) {
    const rooms = getCustomizedRooms();
    const parsed = parseNaturalLanguageRoomQuery(query);
    const { matches, alternatives } = rankRoomsForQuery(rooms, parsed);

    let resp = `🏫 **Free Classroom Availability (${parsed.displayTimeRange} on ${parsed.date})**\n\n`;

    if (parsed.isAmbiguous && parsed.clarificationMessage) {
      resp += `💡 *${parsed.clarificationMessage}*\n\n`;
    }

    if (matches.length > 0) {
      resp += `Found **${matches.length}** classroom(s) free for your **entire** requested duration without any timetable conflicts:\n\n`;
      matches.slice(0, 4).forEach(({ room, status }) => {
        resp += `• **${room.roomNumber}** (${room.floorName}): Free **${status.availableTimeRange}** (until ${status.freeUntil})\n`;
        resp += `  ↳ Capacity: ${room.capacity} | ${room.hasAC ? 'AC' : 'Non-AC'} | ${room.hasProjector ? 'Projector' : 'Standard'}\n`;
      });
      resp += `\n*You can also open the **Free Classrooms** tab for interactive floor filters, live grid view, and full daily period schedules!*`;
      return { text: resp };
    } else {
      resp += `No classrooms are completely free for the entire ${parsed.durationMinutes} minutes with all specified criteria.\n\n`;
      if (alternatives.length > 0) {
        resp += `**Recommended Alternatives:**\n`;
        alternatives.slice(0, 3).forEach(({ room, reason }) => {
          resp += `• **${room.roomNumber}** (${room.floorName}): ${reason}\n`;
        });
      }
      resp += `\n*Check the **Free Classrooms** tab to view floor-by-floor live status.*`;
      return { text: resp };
    }
  }

  // General Fallback
  return {
    text: `I'm your **Attendance Advisor AI**, directly linked to your SRM IST timetable (**${currentTimetable.displayName}**).\n\n**Current Semester Summary:**\n- Overall Attendance: **${stats.currentPercentage.toFixed(2)}%** (${stats.totalAttended}/${stats.totalConducted} classes)\n- Total Remaining Classes: **${stats.totalRemaining}**\n- Status: ${stats.safeCount} Safe, ${stats.warningCount} Warning, ${stats.recoverableCount} Recoverable, ${stats.detentionCount} Detention\n\nTry asking me:\n- *"If I take a 3-day sick leave starting tomorrow, will my Chemistry attendance drop below 75%?"*\n- *"How many classes can I miss in Discrete Mathematics?"*\n- *"Can I reach 90% by November?"*\n- *"Which subject is in the most danger?"*`,
  };
}

/**
 * Finds a subject mentioned in the natural language query by name or code.
 */
function findSubjectInQuery(subjects: Subject[], query: string): Subject | undefined {
  const q = query.toLowerCase();
  for (const s of subjects) {
    if (s.name.toLowerCase().split(' ').some((word) => word.length > 3 && q.includes(word.toLowerCase()))) {
      return s;
    }
    if (s.code && q.includes(s.code.toLowerCase())) {
      return s;
    }
  }
  return undefined;
}
