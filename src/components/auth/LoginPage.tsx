import React, { useState } from 'react';
import {
  GraduationCap,
  Lock,
  UserCheck,
  Eye,
  EyeOff,
  LogIn,
  UserPlus,
  HelpCircle,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Sun,
  Moon,
} from 'lucide-react';
import {
  findUserByRegistration,
  hashPassword,
  isValidRegistrationNumber,
  setActiveSession,
} from '../../utils/authSecurity';
import { StudentUser } from '../../types/auth';

interface LoginPageProps {
  onLoginSuccess: (user: StudentUser) => void;
  onNavigateRegister: () => void;
  onNavigateForgotPassword: () => void;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
  onNavigateRegister,
  onNavigateForgotPassword,
  isDarkMode,
  onToggleDarkMode,
}) => {
  const [regNumber, setRegNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedReg = regNumber.trim().toUpperCase();
    if (!trimmedReg) {
      setErrorMessage('Please enter your registration number.');
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    const regValidation = isValidRegistrationNumber(trimmedReg);
    if (!regValidation.valid) {
      setErrorMessage(regValidation.message || 'Invalid registration number format.');
      return;
    }

    setIsLoading(true);

    try {
      // Find user
      const user = findUserByRegistration(trimmedReg);

      if (!user) {
        // Generic security error message to avoid account enumeration
        setErrorMessage('Invalid registration number or password.');
        setIsLoading(false);
        return;
      }

      // Hash provided password with user's salt and compare
      const computedHash = await hashPassword(password, user.salt);

      if (computedHash !== user.passwordHash) {
        // Same generic error message
        setErrorMessage('Invalid registration number or password.');
        setIsLoading(false);
        return;
      }

      // Create session
      setActiveSession({
        registrationNumber: user.registrationNumber,
        name: user.name,
        token: `session_${user.registrationNumber}_${Date.now()}`,
        loginTime: new Date().toISOString(),
      });

      onLoginSuccess(user);
    } catch (err) {
      setErrorMessage('An unexpected authentication error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper for quick demo testing
  const handleQuickFillDemo = (reg: string) => {
    setRegNumber(reg);
    setPassword('Demo@123');
    setErrorMessage(null);
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

      <div className="max-w-md w-full space-y-6">
        {/* Brand / Logo Area */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-blue-600 shadow-xl shadow-indigo-500/25 ring-4 ring-indigo-500/20 text-white">
            <GraduationCap className="w-9 h-9" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-sans">
              Student Attendance Portal
            </h1>
            <p className="text-xs sm:text-sm text-indigo-200/80 font-medium mt-1">
              SRM Institute of Science & Technology • Official Timetable Planner
            </p>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-6 sm:p-8 text-slate-800 border border-white/20">
          <div className="border-b border-slate-100 pb-4 mb-5">
            <h2 className="text-lg font-bold text-slate-900">Sign in to your account</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter your official college registration number and password.
            </p>
          </div>

          {/* Error Notice */}
          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <div className="font-semibold">{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Registration Number Input */}
            <div>
              <label
                htmlFor="regNumber"
                className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
              >
                Registration Number <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <UserCheck className="w-4 h-4" />
                </div>
                <input
                  id="regNumber"
                  type="text"
                  value={regNumber}
                  onChange={(e) => setRegNumber(e.target.value.toUpperCase())}
                  placeholder="e.g. RA2211003010123 or DEMO001"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 font-mono transition uppercase placeholder:normal-case placeholder:font-sans"
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="block text-xs font-bold text-slate-700 uppercase tracking-wider"
                >
                  Password <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={onNavigateForgotPassword}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your account password"
                  className="w-full pl-10 pr-10 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 transition"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold text-sm shadow-md shadow-indigo-600/25 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Login to Attendance Portal</span>
                </>
              )}
            </button>
          </form>

          {/* Switch to Register */}
          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-600">
              Don&apos;t have an account yet?{' '}
              <button
                type="button"
                onClick={onNavigateRegister}
                className="font-bold text-indigo-600 hover:text-indigo-800 transition cursor-pointer inline-flex items-center gap-1 ml-1"
              >
                <UserPlus className="w-3.5 h-3.5 inline" />
                <span>Create Student Account</span>
              </button>
            </p>
          </div>
        </div>

        {/* Demo Testing Accounts Card */}
        <div className="bg-slate-800/80 backdrop-blur-md rounded-2xl border border-slate-700/80 p-4 sm:p-5 text-slate-300">
          <div className="flex items-center justify-between gap-2 border-b border-slate-700/80 pb-2.5 mb-3">
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-300">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Multi-Student Demo Accounts</span>
            </div>
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-indigo-900/60 text-indigo-200 rounded border border-indigo-700/50">
              Quick Test
            </span>
          </div>

          <p className="text-xs text-slate-400 mb-3">
            Click any demo profile to test completely isolated student attendance data:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Demo Student 1 */}
            <button
              type="button"
              onClick={() => handleQuickFillDemo('DEMO001')}
              className="text-left p-2.5 rounded-xl bg-slate-900/70 hover:bg-slate-900 border border-slate-700 hover:border-indigo-500/60 transition cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white group-hover:text-indigo-300">
                  Aarav Sharma
                </span>
                <span className="text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800 px-1.5 py-0.5 rounded">
                  85%+ Safe
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono mt-1">
                ID: DEMO001 • Sec: III ECE-A
              </div>
              <div className="text-[10px] text-indigo-400 mt-1">Pass: Demo@123</div>
            </button>

            {/* Demo Student 2 */}
            <button
              type="button"
              onClick={() => handleQuickFillDemo('DEMO002')}
              className="text-left p-2.5 rounded-xl bg-slate-900/70 hover:bg-slate-900 border border-slate-700 hover:border-indigo-500/60 transition cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white group-hover:text-indigo-300">
                  Diya Patel
                </span>
                <span className="text-[10px] font-mono bg-amber-950 text-amber-300 border border-amber-800 px-1.5 py-0.5 rounded">
                  71% Warning
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono mt-1">
                ID: DEMO002 • Sec: III ECE-B
              </div>
              <div className="text-[10px] text-indigo-400 mt-1">Pass: Demo@123</div>
            </button>
          </div>
        </div>

        {/* Security & Isolation Footnote */}
        <div className="text-center space-y-1 text-slate-400 text-xs">
          <div className="flex items-center justify-center gap-1.5 text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>SHA-256 password hashing with unique salts</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Each student&apos;s subjects, OD records, and simulator calculations are isolated.
          </p>
        </div>
      </div>
    </div>
  );
};
