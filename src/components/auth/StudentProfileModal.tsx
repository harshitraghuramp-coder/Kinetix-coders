import React, { useState } from 'react';
import {
  X,
  User,
  UserCheck,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Layers,
  Save,
  CheckCircle2,
  AlertCircle,
  Shield,
} from 'lucide-react';
import { StudentUser } from '../../types/auth';
import {
  hashPassword,
  saveRegisteredUser,
  isValidEmail,
  validatePasswordStrength,
  generateSalt,
} from '../../utils/authSecurity';

interface StudentProfileModalProps {
  isOpen: boolean;
  user: StudentUser;
  onClose: () => void;
  onUpdateUser: (updatedUser: StudentUser) => void;
}

export const StudentProfileModal: React.FC<StudentProfileModalProps> = ({
  isOpen,
  user,
  onClose,
  onUpdateUser,
}) => {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [section, setSection] = useState(user.section);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const availableSections = ['A', 'B', 'DS A', 'DS'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!name.trim()) {
      setErrorMessage('Name cannot be empty.');
      return;
    }

    if (!isValidEmail(email)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);

    try {
      let updatedUser: StudentUser = {
        ...user,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        section,
      };

      // Handle password change if requested
      if (isChangingPassword) {
        if (!currentPassword) {
          setErrorMessage('Please provide your current password to set a new password.');
          setIsLoading(false);
          return;
        }

        const currentHash = await hashPassword(currentPassword, user.salt);
        if (currentHash !== user.passwordHash) {
          setErrorMessage('Current password is incorrect.');
          setIsLoading(false);
          return;
        }

        const pwdCheck = validatePasswordStrength(newPassword);
        if (!pwdCheck.valid) {
          setErrorMessage(pwdCheck.message || 'New password does not meet security requirements.');
          setIsLoading(false);
          return;
        }

        if (newPassword !== confirmPassword) {
          setErrorMessage('New passwords do not match.');
          setIsLoading(false);
          return;
        }

        const newSalt = generateSalt();
        const newHash = await hashPassword(newPassword, newSalt);

        updatedUser = {
          ...updatedUser,
          salt: newSalt,
          passwordHash: newHash,
        };
      }

      saveRegisteredUser(updatedUser);
      onUpdateUser(updatedUser);
      setSuccessMessage('Profile information updated successfully.');
      setIsChangingPassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      setErrorMessage('An error occurred while updating profile.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Student Profile</h3>
              <p className="text-[11px] text-slate-500 font-mono">
                Registration ID: {user.registrationNumber}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notices */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Read-Only Locked Academic Identity */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-indigo-600" />
                <span>Primary Identity</span>
              </span>
              <span className="text-[10px] text-slate-500 bg-slate-200 px-2 py-0.5 rounded font-mono">
                Permanent Key
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              <div>
                <span className="text-slate-500 block text-[10px]">Registration No:</span>
                <strong className="text-slate-900 font-mono">{user.registrationNumber}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Year Level:</span>
                <strong className="text-slate-900">{user.year}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Branch:</span>
                <strong className="text-slate-900">{user.branch}</strong>
              </div>
            </div>
          </div>

          {/* Editable Fields */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Section
              </label>
              <select
                value={section}
                onChange={(e) => setSection(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900"
              >
                {availableSections.map((s) => (
                  <option key={s} value={s}>
                    Section {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Password Change Toggle */}
          <div className="pt-2 border-t border-slate-100">
            {!isChangingPassword ? (
              <button
                type="button"
                onClick={() => setIsChangingPassword(true)}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition cursor-pointer"
              >
                + Change Password
              </button>
            ) : (
              <div className="space-y-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">Change Account Password</span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsChangingPassword(false);
                      setCurrentPassword('');
                      setNewPassword('');
                      setConfirmPassword('');
                    }}
                    className="text-[11px] text-slate-500 hover:text-slate-700 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg pr-8"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400"
                    >
                      {showCurrentPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      New Password
                    </label>
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min. 6 chars"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Confirm New
                    </label>
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isLoading ? 'Saving...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
