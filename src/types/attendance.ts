export type WarningLevel = 'SAFE' | 'WARNING' | 'RECOVERABLE' | 'IRREVERSIBLE_DETENTION';

export interface Subject {
  id: string;
  name: string;
  code?: string;
  slot?: string;
  faculty?: string;
  conducted: number;
  attended: number;
  remainingManual?: number; // Manually specified or timetable calculated remaining classes
  weeklyFrequency?: number; // Classes per week from timetable
  targetPercentage?: number; // Subject specific target or defaults to global (75)
  isLab?: boolean;
}

export interface TargetAnalysis {
  target: number; // e.g. 75, 80, 90
  requiredToAttend: number; // minimum classes to attend out of remaining
  maxCanMiss: number; // maximum classes that can be missed out of remaining
  isPossible: boolean; // whether reaching target is mathematically possible
  isAlreadyAchieved: boolean; // whether student already reached target even with 0 attendance
  maxPossibleAttendance: number; // if student attends all remaining classes
  shortfallPercentage: number; // how far off if impossible
  instantBunkableNow: number; // consecutive classes student can skip right now based on conducted classes
}

export interface NovemberAnalysis {
  classesBeforeNov: number;
  isRecoverableBeforeNov: boolean;
  requiredBeforeNov: number;
  maxPossibleByNov: number;
  explanation: string;
}

export interface SubjectCalculation {
  subject: Subject;
  currentPercentage: number;
  effectiveRemaining: number;
  warningLevel: WarningLevel;
  statusLabel: string;
  statusExplanation: string;
  maxPossibleFinalPercentage: number;
  analysis75: TargetAnalysis;
  analysis80: TargetAnalysis;
  analysis90: TargetAnalysis;
  customAnalysis?: TargetAnalysis;
  novemberAnalysis: NovemberAnalysis;
}

export interface StudentProfile {
  year: string;
  branch: string;
  section: string;
}

export type LeaveType = 'OD' | 'MEDICAL' | 'APPROVED_OTHER';
export type LeavePolicy = 'COUNT_AS_ATTENDED' | 'COUNT_AS_ABSENT' | 'EXCLUDE_FROM_TOTAL';

export interface LeaveRecord {
  id: string;
  leaveType: LeaveType;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  subjectCode?: string; // Optional: specific subject, or undefined for all
  reason?: string;
  applied: boolean; // whether committed to actual attendance or simulation-only
  classesAffected?: number;
}

export interface SubjectLeaveImpact {
  subjectCode: string;
  subjectName: string;
  classesMissed: number;
  beforeAttendance: number; // percentage
  afterAttendance: number; // percentage
  differencePct: number;
  isBelow75: boolean;
  explanation: string;
  afterConducted?: number;
  afterAttended?: number;
}

export interface OverallSemesterStats {
  totalConducted: number;
  totalAttended: number;
  totalRemaining: number;
  currentPercentage: number;
  maxPossiblePercentage: number;
  safeCount: number;
  warningCount: number;
  recoverableCount: number;
  detentionCount: number;
  overallAnalysis75: TargetAnalysis;
  overallAnalysis80: TargetAnalysis;
  overallAnalysis90: TargetAnalysis;
}
