import React, { useState } from 'react';
import {
  GraduationCap,
  User,
  UserCheck,
  Mail,
  Lock,
  Phone,
  Eye,
  EyeOff,
  UserPlus,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Layers,
  Sun,
  Moon,
} from 'lucide-react';
import {
  findUserByRegistration,
  generateSalt,
  hashPassword,
  isValidEmail,
  isValidRegistrationNumber,
  saveRegisteredUser,
  setActiveSession,
  validatePasswordStrength,
} from '../../utils/authSecurity';
import { StudentUser } from '../../types/auth';
import { OFFICIAL_TIMETABLES } from '../../data/timetableData';

interface RegisterPageProps {
  onRegisterSuccess: (user: StudentUser) => void;
  onNavigateLogin: () => void;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({
  onRegisterSuccess,
  onNavigateLogin,
  isDarkMode,
  onToggleDarkMode,
}) => {
  // Form fields
  const [name, setName] = useState('');
  const [regNumber, setRegNumber] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [year, setYear] = useState('III Year');
  const [branch, setBranch] = useState('ECE');
  const [section, setSection] = useState('A');

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Available unique years, branches, sections from official timetables
  const availableYears = ['I Year', 'II Year', 'III Year', 'IV Year'];
  const availableBranches = ['ECE', 'BME', 'ECE-DS', 'SEEE'];
  const availableSections = ['A', 'B', 'DS A', 'DS'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // 1. Required fields check
    if (!name.trim()) {
      setErrorMessage('Student Name is required.');
      return;
    }

    const trimmedReg = regNumber.trim().toUpperCase();
    if (!trimmedReg) {
      setErrorMessage('Registration Number is required.');
      return;
    }

    // 2. Registration number format check
    const regCheck = isValidRegistrationNumber(trimmedReg);
    if (!regCheck.valid) {
      setErrorMessage(regCheck.message || 'Invalid registration number.');
      return;
    }

    // 3. Uniqueness check
    const existing = findUserByRegistration(trimmedReg);
    if (existing) {
      setErrorMessage(`Registration number ${trimmedReg} is already registered. Please sign in or use forgot password.`);
      return;
    }

    // 4. Email validation
    if (!email.trim()) {
      setErrorMessage('Email address is required.');
      return;
    }
    if (!isValidEmail(email)) {
      setErrorMessage('Please enter a valid email address (e.g. student@srmist.edu.in).');
      return;
    }

    // 5. Password strength
    const pwdCheck = validatePasswordStrength(password);
    if (!pwdCheck.valid) {
      setErrorMessage(pwdCheck.message || 'Password does not meet security requirements.');
      return;
    }

    // 6. Confirm password match
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter your password.');
      return;
    }

    if (!year || !branch || !section) {
      setErrorMessage('Please select Year, Branch, and Section.');
      return;
    }

    setIsLoading(true);

    try {
      // Generate salt and hash
      const salt = generateSalt();
      const passwordHash = await hashPassword(password, salt);

      const newUser: StudentUser = {
        registrationNumber: trimmedReg,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || undefined,
        passwordHash,
        salt,
        year,
        branch,
        section,
        createdAt: new Date().toISOString(),
        isFirstLogin: true, // Mark first-login setup
      };

      saveRegisteredUser(newUser);

      // Create session
      setActiveSession({
        registrationNumber: newUser.registrationNumber,
        name: newUser.name,
        token: `session_${newUser.registrationNumber}_${Date.now()}`,
        loginTime: new Date().toISOString(),
      });

      onRegisterSuccess(newUser);
    } catch (err) {
      setErrorMessage('Failed to create student account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-slate-100 flex flex-col justify-center items-center px-4 py-8 antialiased relative">
      {/* Top right dark mode toggle */}
      {onToggleDarkMode && (
        <div className="absolute top-4 right-4">
          <button
            type="button"
            onClick={onToggleDarkMode}
            className="p-2 sm:px-3 sm:py-1.5 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all cursor-pointer flex items-center gap-1.5 shadow-sm text-xs font-semibold"
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDarkMode ? (
              <>
                <Sun className="w-4 h-4 text-amber-300" />
                <span className="hidden sm:inline">Light</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-indigo-300" />
                <span className="hidden sm:inline">Dark</span>
              </>
            )}
          </button>
        </div>
      )}

      <div className="max-w-xl w-full space-y-6">
        {/* Brand / Logo Area */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-blue-600 shadow-xl text-white">
            <GraduationCap className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-sans">
            Student Registration
          </h1>
          <p className="text-xs sm:text-sm text-indigo-200/80 font-medium">
            Create your personalized SRM IST Attendance Portal profile
          </p>
        </div>

        {/* Registration Card */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-6 sm:p-8 text-slate-800 border border-white/20">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Student Account Setup</h2>
              <p className="text-xs text-slate-500">All fields with * are required.</p>
            </div>
            <button
              type="button"
              onClick={onNavigateLogin}
              className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Login</span>
            </button>
          </div>

          {/* Error Notice */}
          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <div className="font-semibold">{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Student Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Aarav Sharma"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900"
                    required
                  />
                </div>
              </div>

              {/* Registration Number */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Registration Number <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={regNumber}
                    onChange={(e) => setRegNumber(e.target.value.toUpperCase())}
                    placeholder="e.g. RA2211003010123"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900 font-mono uppercase"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Email Address */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Official / Personal Email <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. student@srmist.edu.in"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900"
                    required
                  />
                </div>
              </div>

              {/* Phone (Optional) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Phone Number <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900"
                  />
                </div>
              </div>
            </div>

            {/* Academic Classification */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                <span>Academic Section Classification</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {/* Year */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Year Level <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-800"
                    required
                  >
                    {availableYears.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Branch */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Branch <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-800"
                    required
                  >
                    {availableBranches.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Section */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Section <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-800"
                    required
                  >
                    {availableSections.map((s) => (
                      <option key={s} value={s}>
                        Sec {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <p className="text-[10px] text-slate-500 mt-2">
                This automatically connects your account to the official timetable uploaded for your section.
              </p>
            </div>

            {/* Passwords */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 6 chars (letters & numbers)"
                    className="w-full pl-9 pr-9 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Confirm Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full pl-9 pr-9 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-3 py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Register & Continue to Dashboard</span>
                </>
              )}
            </button>
          </form>

          {/* Already have an account */}
          <div className="mt-5 pt-4 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-600">
              Already registered?{' '}
              <button
                type="button"
                onClick={onNavigateLogin}
                className="font-bold text-indigo-600 hover:text-indigo-800 transition cursor-pointer"
              >
                Sign In
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
