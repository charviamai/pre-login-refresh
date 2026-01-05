import React, { useEffect } from 'react';
import { 
  validatePasswordPolicy, 
  calculatePasswordStrength, 
  getStrengthInfo,
  containsSecurityThreat,
  ALLOWED_SPECIAL_CHARS_DISPLAY
} from '../utils/inputSanitization';

interface PasswordStrengthIndicatorProps {
  password: string;
  confirmPassword?: string;
  showRequirements?: boolean;
  onMismatchChange?: (isMismatch: boolean) => void;
}

interface PasswordStrengthBarProps {
  password: string;
}

/**
 * Small inline strength bar to show next to password label
 */
export const PasswordStrengthBar: React.FC<PasswordStrengthBarProps> = ({ password }) => {
  const strength = calculatePasswordStrength(password);
  const strengthInfo = getStrengthInfo(strength);

  if (!password) return null;

  return (
    <div className="flex items-center gap-2 ml-2">
      <div className="w-16 h-1.5 bg-slate-300 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${strengthInfo.bgClass}`}
          style={{ width: `${(strength / 5) * 100}%` }}
        />
      </div>
      <span className={`text-xs font-medium ${strengthInfo.textColor}`}>
        {strengthInfo.label}
      </span>
    </div>
  );
};

/**
 * Password Strength Indicator Component
 * Shows requirements checklist only (bar is shown inline with label)
 */
export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
  password,
  confirmPassword,
  showRequirements = true,
  onMismatchChange,
}) => {
  const validation = validatePasswordPolicy(password);
  const hasSQLInjection = containsSecurityThreat(password);
  
  const showMismatch = confirmPassword !== undefined && 
                       confirmPassword.length > 0 && 
                       password !== confirmPassword;

  // Notify parent component of mismatch state changes
  useEffect(() => {
    if (onMismatchChange) {
      onMismatchChange(showMismatch);
    }
  }, [showMismatch, onMismatchChange]);

  if (!password) return null;

  return (
    <div className="mt-3 space-y-2">
      {/* SQL Injection Warning */}
      {hasSQLInjection && (
        <div className="flex items-center gap-2 p-2 bg-red-500/10 border border-red-500/30 rounded-lg">
          <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="text-xs text-red-400">Password contains invalid characters</span>
        </div>
      )}

      {/* Requirements Checklist - 2x2 Grid */}
      {showRequirements && (
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
          <RequirementItem 
            met={validation.checks.minLength} 
            text="At least 8 characters" 
          />
          <RequirementItem 
            met={validation.checks.hasUppercase && validation.checks.hasLowercase} 
            text="Upper and lowercase letters" 
          />
          <RequirementItem 
            met={validation.checks.hasNumber} 
            text="Contains a number" 
          />
          <RequirementItem 
            met={validation.checks.hasSpecialChar} 
            text={`Contains special character (${ALLOWED_SPECIAL_CHARS_DISPLAY})`} 
          />
        </div>
      )}
    </div>
  );
};

/**
 * Individual requirement check item
 */
const RequirementItem: React.FC<{ met: boolean; text: string }> = ({ met, text }) => (
  <div className={`text-xs flex items-center gap-1.5 transition-colors ${
    met ? 'text-green-500' : 'text-slate-500'
  }`}>
    <span className="w-3.5 h-3.5 flex items-center justify-center flex-shrink-0">
      {met ? (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <span className="w-1.5 h-1.5 rounded-full border border-current" />
      )}
    </span>
    {text}
  </div>
);

export default PasswordStrengthIndicator;
