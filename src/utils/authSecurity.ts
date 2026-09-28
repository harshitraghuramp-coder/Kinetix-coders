import { StudentUser, StudentPersonalData, AuthSession } from '../types/auth';
import { OFFICIAL_TIMETABLES } from '../data/timetableData';
import { Subject } from '../types/attendance';

const USERS_STORAGE_KEY = 'attendplan_registered_users_v1';
const SESSION_STORAGE_KEY = 'attendplan_active_session_v1';
const STUDENT_DATA_KEY_PREFIX = 'attendplan_student_data_';

/**
 * Computes SHA-256 hash using the Web Crypto API
 */
export async function hashPassword(password: string, salt: string): Promise<string> {
  const text = `${salt}:${password}`;
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  // Lightweight fallback for non-crypto environments
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(16, '0');
}

/**
 * Generates a random cryptographic salt string
 */
export function generateSalt(): string {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const arr = new Uint8Array(16);
    window.crypto.getRandomValues(arr);
    return Array.from(arr)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/**
 * Validates registration number format: alphanumeric, 3 to 25 characters
 */
export function isValidRegistrationNumber(reg: string): { valid: boolean; message?: string } {
  const trimmed = reg.trim().toUpperCase();
  if (!trimmed) {
    return { valid: false, message: 'Registration number is required.' };
  }
  if (trimmed.length < 3) {
    return { valid: false, message: 'Registration number must be at least 3 characters.' };
  }
  if (trimmed.length > 25) {
    return { valid: false, message: 'Registration number must be 25 characters or fewer.' };
  }
  // Allow letters, numbers, hyphens, and slashes
  const validPattern = /^[A-Z0-9\-\/]+$/;
  if (!validPattern.test(trimmed)) {
    return { valid: false, message: 'Registration number can only contain letters, numbers, and hyphens.' };
  }
  return { valid: true };
}

/**
 * Validates standard email address format
 */
export function isValidEmail(email: string): boolean {
  const trimmed = email.trim();
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(trimmed);
}

/**
 * Validates password strength (min 6 characters, must contain at least one letter and one number)
 */
export function validatePasswordStrength(password: string): { valid: boolean; message?: string } {
  if (!password) {
    return { valid: false, message: 'Password is required.' };
  }
  if (password.length < 6) {
    return { valid: false, message: 'Password must be at least 6 characters long.' };
  }
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  if (!hasLetter || !hasDigit) {
    return { valid: false, message: 'Password must contain both letters and numbers.' };
  }
  return { valid: true };
}

/**
 * Basic sanitization of user strings
 */
export function sanitizeInput(input: string): string {
  return input.trim().replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Generate initial timetable-grounded subjects for a demo student
 */
function createDemoSubjects(timetableId: string, profileType: 'HIGH_ATTENDANCE' | 'WARNING_ATTENDANCE'): Subject[] {
  const tt = OFFICIAL_TIMETABLES.find((t) => t.id === timetableId) || OFFICIAL_TIMETABLES[0];
  return tt.subjects.map((sub, idx) => {
    let conducted = 30;
    let attended = 26;

    if (profileType === 'HIGH_ATTENDANCE') {
      // Safe overall: 85% - 93%
      conducted = 28 + (idx % 4);
      attended = conducted - (idx % 3);
    } else {
      // Warning & recoverable mix: some 68%, 71%, 74%
      conducted = 32;
      if (idx === 0) {
        attended = 23; // 71.8%
      } else if (idx === 1) {
        attended = 21; // 65.6% (recoverable)
      } else if (idx === 2) {
        attended = 27; // 84.3%
      } else {
        attended = 24; // 75.0%
      }
    }

    return {
      id: `sub_${tt.id}_${sub.code}_${idx}`,
      name: sub.name,
      code: sub.code,
      conducted,
      attended,
      faculty: sub.faculty,
      category: sub.isLab ? 'Lab' : 'Theory',
      weeklyFrequency: sub.periodsPerWeek,
    };
  });
}

/**
 * Initialize demo student accounts if not already seeded
 */
export async function initializeDemoAccountsIfNeeded(): Promise<void> {
  if (typeof window === 'undefined') return;

  const existing = localStorage.getItem(USERS_STORAGE_KEY);
  if (!existing || JSON.parse(existing).length === 0) {
    const salt1 = 'salt_demo_001_srmist';
    const salt2 = 'salt_demo_002_srmist';
    const hash1 = await hashPassword('Demo@123', salt1);
    const hash2 = await hashPassword('Demo@123', salt2);

    const demo1: StudentUser = {
      registrationNumber: 'DEMO001',
      name: 'Aarav Sharma',
      email: 'aarav.sharma@srmist.edu.in',
      passwordHash: hash1,
      salt: salt1,
      phone: '9876543210',
      year: 'III Year',
      branch: 'ECE',
      section: 'A',
      createdAt: new Date().toISOString(),
      isFirstLogin: false,
    };

    const demo2: StudentUser = {
      registrationNumber: 'DEMO002',
      name: 'Diya Patel',
      email: 'diya.patel@srmist.edu.in',
      passwordHash: hash2,
      salt: salt2,
      phone: '9876501234',
      year: 'III Year',
      branch: 'ECE',
      section: 'B',
      createdAt: new Date().toISOString(),
      isFirstLogin: false,
    };

    const users = [demo1, demo2];
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));

    // Seed Demo 1 data (III ECE-A - High Safe Attendance)
    const demo1Data: StudentPersonalData = {
      subjects: createDemoSubjects('2026-27-III-ECE-A', 'HIGH_ATTENDANCE'),
      planningDate: new Date().toISOString().split('T')[0],
      semesterEndDate: `${new Date().getFullYear()}-12-18`,
      novemberDeadline: `${new Date().getFullYear()}-11-05`,
      selectedTarget: 75,
      selectedTimetableId: '2026-27-III-ECE-A',
      customHolidays: [],
      leaveRecords: [
        {
          id: 'leave_demo1_od',
          leaveType: 'OD',
          startDate: '2026-10-12',
          endDate: '2026-10-13',
          reason: 'IEEE College Hackathon',
          applied: false,
          classesAffected: 6,
        },
      ],
      leavePolicy: 'COUNT_AS_ATTENDED',
      statusFilter: 'ALL',
      viewMode: 'CARDS',
    };
    localStorage.setItem(`${STUDENT_DATA_KEY_PREFIX}DEMO001`, JSON.stringify(demo1Data));

    // Seed Demo 2 data (III ECE-B - Borderline/Warning Attendance)
    const demo2Data: StudentPersonalData = {
      subjects: createDemoSubjects('2026-27-III-ECE-B', 'WARNING_ATTENDANCE'),
      planningDate: new Date().toISOString().split('T')[0],
      semesterEndDate: `${new Date().getFullYear()}-12-18`,
      novemberDeadline: `${new Date().getFullYear()}-11-05`,
      selectedTarget: 80,
      selectedTimetableId: '2026-27-III-ECE-B',
      customHolidays: [],
      leaveRecords: [
        {
          id: 'leave_demo2_med',
          leaveType: 'MEDICAL',
          startDate: '2026-10-05',
          endDate: '2026-10-07',
          reason: 'Viral Fever and Rest',
          applied: false,
          classesAffected: 11,
        },
      ],
      leavePolicy: 'COUNT_AS_ATTENDED',
      statusFilter: 'ALL',
      viewMode: 'CARDS',
    };
    localStorage.setItem(`${STUDENT_DATA_KEY_PREFIX}DEMO002`, JSON.stringify(demo2Data));
  }
}

/**
 * Retrieve all registered users
 */
export function getAllRegisteredUsers(): StudentUser[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(USERS_STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

/**
 * Find user by registration number (case-insensitive)
 */
export function findUserByRegistration(reg: string): StudentUser | undefined {
  const normalized = reg.trim().toUpperCase();
  const users = getAllRegisteredUsers();
  return users.find((u) => u.registrationNumber.toUpperCase() === normalized);
}

/**
 * Save or update user
 */
export function saveRegisteredUser(user: StudentUser): void {
  if (typeof window === 'undefined') return;
  const users = getAllRegisteredUsers();
  const index = users.findIndex((u) => u.registrationNumber.toUpperCase() === user.registrationNumber.toUpperCase());
  if (index >= 0) {
    users[index] = user;
  } else {
    users.push(user);
  }
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

/**
 * Active Session management
 */
export function getActiveSession(): AuthSession | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(SESSION_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

export function setActiveSession(session: AuthSession | null): void {
  if (typeof window === 'undefined') return;
  if (!session) {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  } else {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  }
}

/**
 * Per-student isolated attendance data management
 */
export function getStudentData(reg: string): StudentPersonalData | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(`${STUDENT_DATA_KEY_PREFIX}${reg.toUpperCase()}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

export function saveStudentData(reg: string, data: StudentPersonalData): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`${STUDENT_DATA_KEY_PREFIX}${reg.toUpperCase()}`, JSON.stringify(data));
}
