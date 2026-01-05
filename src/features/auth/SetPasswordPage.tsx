import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Input } from '../../shared/components/ui';
import { PublicButton } from '../../shared/components/ui/PublicButton';
import { ErrorBanner } from '../../shared/components/ErrorBanner';
import { authApi } from '../../shared/utils/api-service';
import { AuthPageLayout } from '../../shared/components/AuthPageLayout';
import { PasswordStrengthIndicator, PasswordStrengthBar } from '../../shared/components/PasswordStrengthIndicator';
import { validatePasswordPolicy, containsSecurityThreat } from '../../shared/utils/inputSanitization';

export const SetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [passwordMismatch, setPasswordMismatch] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Verify token on mount
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setTokenValid(false);
        setVerifying(false);
        return;
      }

      try {
        await authApi.verifySetPasswordToken(token);
        setTokenValid(true);
      } catch (err: any) {
        setTokenValid(false);
      } finally {
        setVerifying(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!token) {
      setError('Invalid or missing token');
      return;
    }

    // Check password policy
    const validation = validatePasswordPolicy(password);
    if (!validation.isValid) {
      setError(validation.errors[0]);
      return;
    }

    // Check for security threats
    if (containsSecurityThreat(password)) {
      setError('Password contains invalid characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      await authApi.setPassword(token, password);
      setSuccess(true);
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to set password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Verifying state
  if (verifying) {
    return (
      <AuthPageLayout maxWidth="lg" showBackLink={false}>
        <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-xl shadow-indigo-500/10 dark:shadow-slate-900/50 border border-slate-200 dark:border-slate-700 p-8">
          <div className="text-center relative py-8">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-indigo-100 dark:bg-indigo-900/30 mb-4">
              <svg className="animate-spin h-8 w-8 text-indigo-600 dark:text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-700 dark:text-white mb-2">Verifying Link...</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Please wait while we verify your account setup link.</p>
          </div>
        </div>
      </AuthPageLayout>
    );
  }

  // Invalid/Already used token state
  if (tokenValid === false) {
    return (
      <AuthPageLayout maxWidth="md" showBackLink={false}>
        <div className="min-h-[500px] flex items-center justify-center px-4">
          <div className="w-full max-w-md">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200/60 overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500"></div>

              <div className="p-8 sm:p-10">
                <div className="flex justify-center mb-6">
                  <div className="relative">
                    <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full"></div>
                    <div className="relative bg-gradient-to-br from-emerald-50 to-teal-50 rounded-full p-4 shadow-lg">
                      <svg className="h-12 w-12 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="text-center space-y-3 mb-8">
                  <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                    Account Setup Complete
                  </h1>
                  <p className="text-slate-600 text-base leading-relaxed max-w-sm mx-auto">
                    You have already completed your account setup. Click below to login.
                  </p>
                </div>

                <div className="flex justify-center">
                  <PublicButton
                    onClick={() => navigate('/login')}
                    variant="primary"
                    size="lg"
                  >
                    Go to Login
                  </PublicButton>
                </div>

                <div className="mt-6 pt-6 border-t border-slate-100">
                  <p className="text-xs text-center text-slate-500">
                    Setup links can only be used once for security reasons.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AuthPageLayout>
    );
  }

  // No token provided - different from expired
  if (!token) {
    return (
      <AuthPageLayout maxWidth="lg" backLinkTo="/login" backLinkText="Return to Login">
        <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-xl shadow-indigo-500/10 dark:shadow-slate-900/50 border border-slate-200 dark:border-slate-700 p-8 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
            <div className="absolute top-10 left-10 w-2 h-2 bg-indigo-400 rounded-full animate-float blur-[1px]" style={{ animationDelay: '0s', animationDuration: '6s' }} />
            <div className="absolute top-32 right-16 w-1.5 h-1.5 bg-purple-400 rounded-full animate-float blur-[1px]" style={{ animationDelay: '1.5s', animationDuration: '8s' }} />
          </div>

          <div className="text-center relative">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
              <svg className="h-8 w-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Invalid Link</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              This password setup link is invalid or has expired.
            </p>
          </div>
        </div>
      </AuthPageLayout>
    );
  }

  if (success) {
    return (
      <AuthPageLayout maxWidth="lg" showBackLink={false}>
        <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-xl shadow-indigo-500/10 dark:shadow-slate-900/50 border border-slate-200 dark:border-slate-700 p-8 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
            <div className="absolute top-10 left-10 w-2 h-2 bg-indigo-400 rounded-full animate-float blur-[1px]" style={{ animationDelay: '0s', animationDuration: '6s' }} />
            <div className="absolute top-32 right-16 w-1.5 h-1.5 bg-purple-400 rounded-full animate-float blur-[1px]" style={{ animationDelay: '1.5s', animationDuration: '8s' }} />
          </div>

          <div className="text-center relative">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 mb-4">
              <svg className="h-8 w-8 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Password Set Successfully!</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Your password has been updated. Redirecting to login...
            </p>
          </div>
        </div>
      </AuthPageLayout>
    );
  }

  return (
    <AuthPageLayout maxWidth="lg" showBackLink={false}>
      <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-xl shadow-indigo-500/10 dark:shadow-slate-900/50 border border-slate-200 dark:border-slate-700 p-8 overflow-hidden">
        {/* Floating Particles Background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
          <div className="absolute top-10 left-10 w-2 h-2 bg-indigo-400 rounded-full animate-float blur-[1px]" style={{ animationDelay: '0s', animationDuration: '6s' }} />
          <div className="absolute top-32 right-16 w-1.5 h-1.5 bg-purple-400 rounded-full animate-float blur-[1px]" style={{ animationDelay: '1.5s', animationDuration: '8s' }} />
        </div>

        {error && <ErrorBanner message={error} onClose={() => setError(null)} />}

        <form onSubmit={handleSubmit} className={`space-y-4 relative ${mounted ? 'animate-slide-up-fade' : 'opacity-0'}`}>
          <h2 className="text-2xl md:text-xl text-center font-bold mb-4 text-slate-800 dark:text-white">
            Set Your Password
          </h2>

          <div className="space-y-2">
            {/* Custom label with inline strength bar */}
            <div className="flex items-center mb-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                New Password<span className="text-red-500 ml-1">*</span>
              </label>
              <PasswordStrengthBar password={password} />
            </div>
            <Input
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              fullWidth
              showPasswordToggle
              className="focus-within:shadow-[0_0_15px_rgba(99,102,241,0.2)] transition-all duration-300"
            />
            <PasswordStrengthIndicator
              password={password}
              confirmPassword={confirmPassword}
              onMismatchChange={setPasswordMismatch}
            />
          </div>

          <Input
            name="confirmPassword"
            type="password"
            label="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={passwordMismatch ? 'Passwords do not match' : undefined}
            required
            fullWidth
            showPasswordToggle
            className={`focus-within:shadow-[0_0_15px_rgba(99,102,241,0.2)] transition-all duration-300 ${passwordMismatch ? 'border-red-500 ring-1 ring-red-500' : ''}`}
          />

          <div className="flex justify-center mt-6 pb-4">
            <PublicButton
              type="submit"
              disabled={loading}
              variant="primary"
              size="lg"
              className="w-full max-w-xs"
            >
              {loading ? (
                <span className="flex items-center gap-2 justify-center">
                  <span>Setting...</span>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </span>
              ) : 'Set Password'}
            </PublicButton>
          </div>
        </form>
      </div>
    </AuthPageLayout>
  );
};
