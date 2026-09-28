import React, { useState } from 'react';
import {
  X,
  HelpCircle,
  Mail,
  UserCheck,
  Lock,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  KeyRound,
} from 'lucide-react';
import {
  findUserByRegistration,
  generateSalt,
  hashPassword,
  saveRegisteredUser,
  validatePasswordStrength,
} from '../../utils/authSecurity';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (regNumber: string) => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [step, setStep] = useState<'VERIFY' | 'NEW_PASSWORD' | 'SUCCESS'>('VERIFY');
  const [regNumber, setRegNumber] = useState('');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [verifiedUserReg, setVerifiedUserReg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedReg = regNumber.trim().toUpperCase();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedReg || !trimmedEmail) {
      setErrorMessage('Please provide both your registration number and email.');
      return;
    }

    const user = findUserByRegistration(trimmedReg);

    // Generic verification check to prevent user enumeration
    if (!user || user.email.toLowerCase() !== trimmedEmail) {
      setErrorMessage('Could not verify registration details. Please check your Registration Number and Email.');
      return;
    }

    setVerifiedUserReg(user.registrationNumber);
    setStep('NEW_PASSWORD');
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!verifiedUserReg) return;

    const pwdCheck = validatePasswordStrength(newPassword);
    if (!pwdCheck.valid) {
      setErrorMessage(pwdCheck.message || 'Password must be at least 6 characters with letters and numbers.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsLoading(true);

    try {
      const user = findUserByRegistration(verifiedUserReg);
      if (!user) {
        setErrorMessage('User record not found.');
        setIsLoading(false);
        return;
      }

      // Generate new salt and hash
      const newSalt = generateSalt();
      const newHash = await hashPassword(newPassword, newSalt);

      const updatedUser = {
        ...user,
        salt: newSalt,
        passwordHash: newHash,
      };

      saveRegisteredUser(updatedUser);
      setStep('SUCCESS');
    } catch (err) {
      setErrorMessage('Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinish = () => {
    if (verifiedUserReg) {
      onSuccess(verifiedUserReg);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-fadeIn">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center gap-2 text-indigo-600">
            <KeyRound className="w-5 h-5" />
            <h3 className="text-base font-bold text-slate-900">Reset Student Password</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Demo Security Notice */}
        <div className="mb-4 p-2.5 rounded-lg bg-indigo-50 border border-indigo-100 text-[11px] text-indigo-900 flex items-start gap-2">
          <HelpCircle className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0 mt-0.5" />
          <span>
            <strong>Secure Reset Protocol:</strong> Passwords are never retrieved in plain text. Confirm your registration credentials to set a new cryptographic password hash.
          </span>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* STEP 1: Verify Identity */}
        {step === 'VERIFY' && (
          <form onSubmit={handleVerify} className="space-y-4">
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
                  placeholder="e.g. RA2211003010123 or DEMO001"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 uppercase font-mono"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Registered Email Address <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. aarav.sharma@srmist.edu.in"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-xs cursor-pointer"
              >
                Verify & Continue
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: Set New Password */}
        {step === 'NEW_PASSWORD' && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                New Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min. 6 chars (letters & numbers)"
                  className="w-full pl-9 pr-9 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
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

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Confirm New Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full pl-9 pr-9 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStep('VERIFY')}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-xs cursor-pointer disabled:opacity-70"
              >
                {isLoading ? 'Updating...' : 'Save New Password'}
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: Success Screen */}
        {step === 'SUCCESS' && (
          <div className="text-center py-4 space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Password Updated Successfully</h4>
              <p className="text-xs text-slate-500 mt-1">
                Your new password has been securely hashed and stored. You can now log in with your updated credentials.
              </p>
            </div>
            <button
              type="button"
              onClick={handleFinish}
              className="mt-2 w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition cursor-pointer"
            >
              Return to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
