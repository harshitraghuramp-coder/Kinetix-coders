import { Subject, LeaveRecord, LeavePolicy } from './attendance';

export interface StudentUser {
  registrationNumber: string; // e.g. "RA2211003010123" or "DEMO001"
  name: string;
  email: string;
  passwordHash: string; // SHA-256 hash of (password + salt)
  salt: string;
  phone?: string;
  year: string; // "I Year" | "II Year" | "III Year" | "IV Year"
  branch: string; // "ECE" | "BME" | "ECE-DS" | etc.
  section: string; // "A" | "B" | "DS A" | etc.
  createdAt: string;
  isFirstLogin?: boolean;
}

export interface StudentPersonalData {
  subjects: Subject[];
  planningDate: string;
  semesterEndDate: string;
  novemberDeadline: string;
  selectedTarget: number;
  selectedTimetableId: string;
  customHolidays: string[];
  leaveRecords: LeaveRecord[];
  leavePolicy: LeavePolicy;
  statusFilter: string;
  viewMode: 'CARDS' | 'TABLE';
}

export interface AuthSession {
  registrationNumber: string;
  name: string;
  token: string;
  loginTime: string;
}
