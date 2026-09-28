import { Subject, TargetAnalysis, SubjectCalculation, OverallSemesterStats, WarningLevel } from '../types/attendance';

/**
 * Calculates detailed target attendance analysis for a given target percentage (e.g. 75, 80, 90).
 *
 * @param conducted Classes conducted so far (C >= 0)
 * @param attended Classes attended so far (0 <= A <= C)
 * @param remaining Remaining scheduled classes in semester (R >= 0)
 * @param targetPct Target percentage e.g. 75
 */
export function calculateTargetAnalysis(
  conducted: number,
  attended: number,
  remaining: number,
  targetPct: number
): TargetAnalysis {
  const safeConducted = Math.max(0, conducted);
  const safeAttended = Math.min(safeConducted, Math.max(0, attended));
  const safeRemaining = Math.max(0, remaining);
  const totalClasses = safeConducted + safeRemaining;
  const targetRatio = targetPct / 100;

  // Maximum possible attendance if student attends ALL remaining classes
  const maxPossibleAttendance =
    totalClasses === 0
      ? 100
      : Math.min(100, Number((((safeAttended + safeRemaining) / totalClasses) * 100).toFixed(2)));

  // How many classes must be attended out of remaining R classes to reach targetRatio:
  // (safeAttended + x) / totalClasses >= targetRatio
  // => x >= targetRatio * totalClasses - safeAttended
  const exactRequired = targetRatio * totalClasses - safeAttended;
  const rawCeilRequired = Math.ceil(exactRequired);

  // If rawCeilRequired <= 0, target is already guaranteed even if 0 remaining classes are attended
  const isAlreadyAchieved = rawCeilRequired <= 0;
  const requiredToAttend = isAlreadyAchieved ? 0 : Math.max(0, rawCeilRequired);

  // Check if mathematically possible with available remaining classes
  const isPossible = requiredToAttend <= safeRemaining;

  // Maximum classes student can miss out of remaining R classes
  // (safeAttended + safeRemaining - m) / totalClasses >= targetRatio
  // => m <= safeAttended + safeRemaining - targetRatio * totalClasses
  let maxCanMiss = 0;
  if (isPossible) {
    const rawMiss = Math.floor(safeAttended + safeRemaining - targetRatio * totalClasses);
    maxCanMiss = Math.min(safeRemaining, Math.max(0, rawMiss));
  } else {
    maxCanMiss = 0;
  }

  // Calculate shortfall percentage if recovery is impossible
  const shortfallPercentage = !isPossible ? Number((targetPct - maxPossibleAttendance).toFixed(2)) : 0;

  // Instant bunk allowance: how many consecutive classes can student miss right now based on conducted classes?
  // attended / (conducted + b) >= targetRatio => b <= (attended - targetRatio * conducted) / targetRatio
  let instantBunkableNow = 0;
  if (safeConducted > 0 && safeAttended / safeConducted >= targetRatio) {
    const rawInstantBunk = Math.floor((safeAttended - targetRatio * safeConducted) / targetRatio);
    instantBunkableNow = Math.max(0, rawInstantBunk);
  }

  return {
    target: targetPct,
    requiredToAttend,
    maxCanMiss,
    isPossible,
    isAlreadyAchieved,
    maxPossibleAttendance,
    shortfallPercentage,
    instantBunkableNow,
  };
}

/**
 * Calculates full analysis and status warning level for a subject.
 *
 * Warning levels:
 * - GREEN (SAFE): Current attendance is safely above target (e.g. >= 75%) and can miss at least 1-2 classes or target guaranteed.
 * - YELLOW (WARNING): Current attendance is at or slightly above target (75% - 78%) or miss allowance is critical (0 or 1).
 * - RED (RECOVERABLE): Current attendance is below target (< 75%), but recovery is mathematically possible if remaining classes are attended.
 * - CRITICAL (IRREVERSIBLE_DETENTION): Attendance is below target AND even attending 100% of remaining classes CANNOT reach the 75% threshold!
 */
export function calculateSubject(
  subject: Subject,
  globalPlanningRemaining?: number,
  primaryTarget: number = 75,
  classesBeforeNov: number = 0
): SubjectCalculation {
  const conducted = Math.max(0, Number(subject.conducted) || 0);
  const attended = Math.min(conducted, Math.max(0, Number(subject.attended) || 0));

  // Determine remaining classes: subject override, or planning remaining, or 0
  const effectiveRemaining =
    subject.remainingManual !== undefined && !isNaN(subject.remainingManual)
      ? Math.max(0, Number(subject.remainingManual))
      : globalPlanningRemaining !== undefined
      ? Math.max(0, globalPlanningRemaining)
      : 0;

  const currentPercentage =
    conducted === 0 ? 100 : Number(((attended / conducted) * 100).toFixed(2));

  // Compute standard targets: 75, 80, 90
  const analysis75 = calculateTargetAnalysis(conducted, attended, effectiveRemaining, 75);
  const analysis80 = calculateTargetAnalysis(conducted, attended, effectiveRemaining, 80);
  const analysis90 = calculateTargetAnalysis(conducted, attended, effectiveRemaining, 90);

  // November Deadline Analysis
  // Calculate if student can reach 75% by November deadline using the classes scheduled before November
  const safeNovClasses = Math.max(0, classesBeforeNov);
  const novTotal = conducted + safeNovClasses;
  const maxPossibleByNov = novTotal === 0 ? 100 : Number((((attended + safeNovClasses) / novTotal) * 100).toFixed(2));
  const rawNovReq = Math.ceil(0.75 * novTotal - attended);
  const requiredBeforeNov = Math.max(0, rawNovReq);
  const isRecoverableBeforeNov = requiredBeforeNov <= safeNovClasses;

  let novExplanation = '';
  if (currentPercentage >= 75) {
    novExplanation = `Currently safely at or above 75% (${currentPercentage.toFixed(2)}%).`;
  } else if (!isRecoverableBeforeNov) {
    novExplanation = `Recovery before November is mathematically impossible. Even attending all ${safeNovClasses} classes before November yields at most ${maxPossibleByNov.toFixed(2)}% (requires ${requiredBeforeNov}).`;
  } else {
    novExplanation = `Must attend ${requiredBeforeNov} of ${safeNovClasses} classes before the November deadline to reach 75%.`;
  }

  const novemberAnalysis = {
    classesBeforeNov: safeNovClasses,
    isRecoverableBeforeNov,
    requiredBeforeNov,
    maxPossibleByNov,
    explanation: novExplanation,
  };

  let warningLevel: WarningLevel = 'SAFE';
  let statusLabel = 'SAFE';
  let statusExplanation = '';

  // Rule 6: IRREVERSIBLE DETENTION MUST ONLY be shown when reaching the mandatory minimum (75%) is mathematically impossible!
  if (!analysis75.isPossible) {
    warningLevel = 'IRREVERSIBLE_DETENTION';
    statusLabel = 'IRREVERSIBLE DETENTION';
    statusExplanation = `Recovery is mathematically impossible. Even with 100% attendance in all ${effectiveRemaining} remaining classes, your final attendance will be at most ${analysis75.maxPossibleAttendance.toFixed(
      2
    )}%, falling short of 75.00% by ${analysis75.shortfallPercentage.toFixed(2)}%.`;
  } else if (currentPercentage < 75) {
    warningLevel = 'RECOVERABLE';
    statusLabel = 'RECOVERABLE';
    statusExplanation = `Currently below 75%, but recovery is possible. You must attend at least ${analysis75.requiredToAttend} of the ${effectiveRemaining} remaining classes (can miss at most ${analysis75.maxCanMiss}).`;
  } else if (currentPercentage >= 75 && (analysis75.maxCanMiss <= 1 || currentPercentage < 78)) {
    warningLevel = 'WARNING';
    statusLabel = 'CLOSE TO MINIMUM';
    statusExplanation = `Attendance (${currentPercentage.toFixed(
      2
    )}%) is close to the 75% boundary. You have a margin of only ${analysis75.maxCanMiss} missable class${analysis75.maxCanMiss === 1 ? '' : 'es'}.`;
  } else {
    warningLevel = 'SAFE';
    statusLabel = 'SAFELY ABOVE TARGET';
    statusExplanation = analysis75.isAlreadyAchieved
      ? `Target 75% already secured! Even if you attend 0 remaining classes, your attendance stays above 75%.`
      : `Safe standing. You must attend ${analysis75.requiredToAttend} out of ${effectiveRemaining} remaining classes to maintain >=75%.`;
  }

  return {
    subject,
    currentPercentage,
    effectiveRemaining,
    warningLevel,
    statusLabel,
    statusExplanation,
    maxPossibleFinalPercentage: analysis75.maxPossibleAttendance,
    analysis75,
    analysis80,
    analysis90,
    novemberAnalysis,
  };
}

/**
 * Calculates semester-wide aggregated stats across all subjects.
 */
export function calculateSemesterStats(
  subjectCalcs: SubjectCalculation[],
  primaryTarget: number = 75
): OverallSemesterStats {
  const totalConducted = subjectCalcs.reduce((sum, item) => sum + Math.max(0, item.subject.conducted), 0);
  const totalAttended = subjectCalcs.reduce((sum, item) => sum + Math.max(0, item.subject.attended), 0);
  const totalRemaining = subjectCalcs.reduce((sum, item) => sum + item.effectiveRemaining, 0);

  const currentPercentage =
    totalConducted === 0 ? 100 : Number(((totalAttended / totalConducted) * 100).toFixed(2));

  const totalPossibleFinal = totalConducted + totalRemaining;
  const maxPossiblePercentage =
    totalPossibleFinal === 0
      ? 100
      : Number((((totalAttended + totalRemaining) / totalPossibleFinal) * 100).toFixed(2));

  let safeCount = 0;
  let warningCount = 0;
  let recoverableCount = 0;
  let detentionCount = 0;

  for (const calc of subjectCalcs) {
    if (calc.warningLevel === 'IRREVERSIBLE_DETENTION') detentionCount++;
    else if (calc.warningLevel === 'RECOVERABLE') recoverableCount++;
    else if (calc.warningLevel === 'WARNING') warningCount++;
    else safeCount++;
  }

  const overallAnalysis75 = calculateTargetAnalysis(totalConducted, totalAttended, totalRemaining, 75);
  const overallAnalysis80 = calculateTargetAnalysis(totalConducted, totalAttended, totalRemaining, 80);
  const overallAnalysis90 = calculateTargetAnalysis(totalConducted, totalAttended, totalRemaining, 90);

  return {
    totalConducted,
    totalAttended,
    totalRemaining,
    currentPercentage,
    maxPossiblePercentage,
    safeCount,
    warningCount,
    recoverableCount,
    detentionCount,
    overallAnalysis75,
    overallAnalysis80,
    overallAnalysis90,
  };
}

/**
 * Calculates estimated remaining teaching days / weeks between planning date and deadline date,
 * excluding weekends (Saturday/Sunday).
 */
export function calculateTeachingDaysAndWeeks(
  planningDateStr: string,
  deadlineDateStr: string
): { workingDays: number; fullWeeks: number; totalDays: number } {
  const start = new Date(planningDateStr);
  const end = new Date(deadlineDateStr);

  // Normalize to midnight UTC/local
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) {
    return { workingDays: 0, fullWeeks: 0, totalDays: 0 };
  }

  let workingDays = 0;
  let current = new Date(start);

  while (current <= end) {
    const dayOfWeek = current.getDay();
    // Monday = 1 through Friday = 5
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      workingDays++;
    }
    current.setDate(current.getDate() + 1);
  }

  const diffTime = Math.abs(end.getTime() - start.getTime());
  const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  const fullWeeks = Math.floor(workingDays / 5);

  return { workingDays, fullWeeks, totalDays };
}

/**
 * Returns a default deadline date in November of current or next relevant year.
 */
export function getDefaultNovemberDeadline(referenceDate: Date = new Date()): string {
  const year = referenceDate.getFullYear();
  const currentMonth = referenceDate.getMonth(); // 0-indexed, 10 is November

  // If currently in or before November, default to November 30 of current year.
  // If in December, default to next year's November 30.
  const targetYear = currentMonth <= 10 ? year : year + 1;
  return `${targetYear}-11-30`;
}

/**
 * Format a Date or date string to readable format e.g. "Mon, Sep 28, 2026"
 */
export function formatDisplayDate(dateInput: string | Date): string {
  if (!dateInput) return '';
  const d = typeof dateInput === 'string' ? new Date(dateInput + (dateInput.length === 10 ? 'T00:00:00' : '')) : dateInput;
  if (isNaN(d.getTime())) return String(dateInput);
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format ISO YYYY-MM-DD from a Date object
 */
export function toISODateString(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
