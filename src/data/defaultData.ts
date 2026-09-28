import { StudentProfile, Subject } from '../types/attendance';

export const INITIAL_BRANCHES = [
  'Computer Science & Engineering (CSE)',
  'Information Technology (IT)',
  'Electronics & Communication (ECE)',
  'Electrical & Electronics (EEE)',
  'Mechanical Engineering (ME)',
  'Civil Engineering (CE)',
  'Artificial Intelligence & Data Science (AI/DS)',
  'Computer Science & Business Systems (CSBS)',
];

export const INITIAL_YEARS = [
  '1st Year (Semester 1 & 2)',
  '2nd Year (Semester 3 & 4)',
  '3rd Year (Semester 5 & 6)',
  '4th Year (Semester 7 & 8)',
];

export const INITIAL_SECTIONS = [
  'Section A',
  'Section B',
  'Section C',
  'Section D',
];

export const DEFAULT_PROFILE: StudentProfile = {
  year: '3rd Year (Semester 5 & 6)',
  branch: 'Computer Science & Engineering (CSE)',
  section: 'Section B',
};

export const DEMO_SUBJECTS: Subject[] = [
  {
    id: 'sub-1',
    name: 'Operating Systems',
    code: 'CS501',
    conducted: 44,
    attended: 36,
    remainingManual: 18,
    weeklyFrequency: 4,
  },
  {
    id: 'sub-2',
    name: 'Database Management Systems',
    code: 'CS502',
    conducted: 40,
    attended: 31,
    remainingManual: 20,
    weeklyFrequency: 4,
  },
  {
    id: 'sub-3',
    name: 'Design & Analysis of Algorithms',
    code: 'CS503',
    conducted: 38,
    attended: 26,
    remainingManual: 22,
    weeklyFrequency: 4,
  },
  {
    id: 'sub-4',
    name: 'Theory of Computation',
    code: 'CS504',
    conducted: 48,
    attended: 20,
    remainingManual: 16,
    weeklyFrequency: 3,
  },
  {
    id: 'sub-5',
    name: 'Computer Networks',
    code: 'CS505',
    conducted: 36,
    attended: 34,
    remainingManual: 20,
    weeklyFrequency: 4,
  },
  {
    id: 'sub-6',
    name: 'Software Engineering',
    code: 'CS506',
    conducted: 42,
    attended: 33,
    remainingManual: 18,
    weeklyFrequency: 3,
  },
];
