import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Input } from '../../shared/components/ui';
import { PublicButton } from '../../shared/components/ui/PublicButton';
import { authApi } from '../../shared/utils/api-service';
import { ErrorBanner } from '../../shared/components/ErrorBanner';
import { AuthPageLayout } from '../../shared/components/AuthPageLayout';
import { PasswordStrengthIndicator, PasswordStrengthBar } from '../../shared/components/PasswordStrengthIndicator';
import { validatePasswordPolicy, containsSecurityThreat } from '../../shared/utils/inputSanitization';

export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [formData, setFormData] = useState({
    new_password: '',
    confirm_password: '',
  });
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
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
        await authApi.verifyResetToken(token);
        setTokenValid(true);
      } catch (err: any) {
        setTokenValid(false);
      } finally {
        setVerifying(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear field error when user types
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    if (!token) {
      setError('Invalid or missing reset token');
      return;
    }

    // Validate password policy
    const validation = validatePasswordPolicy(formData.new_password);
    if (!validation.isValid) {
      setFieldErrors({ new_password: validation.errors[0] });
      return;
    }

    // Check for security threats
    if (containsSecurityThreat(formData.new_password)) {
      setFieldErrors({ new_password: 'Password contains invalid characters' });
      return;
    }

    // Validate password match
    if (formData.new_password !== formData.confirm_password) {
      setFieldErrors({ confirm_password: 'Passwords do not match' });
      return;
    }

    setLoading(true);

    try {
      await authApi.resetPassword({
        token,
        new_password: formData.new_password,
        confirm_password: formData.confirm_password,
      });
      setSuccess(true);

      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. The link may have expired.');
      if (err.errors) {
        setFieldErrors(err.errors);
      }
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
            <p className="text-sm text-slate-500 dark:text-slate-400">Please wait while we verify your password reset link.</p>
          </div>
        </div>
      </AuthPageLayout>
    );
  }

  // Invalid/Expired token state
  if (tokenValid === false) {
    return (
      <AuthPageLayout maxWidth="md" showBackLink={false}>
        <div className="min-h-[500px] flex items-center justify-center px-4">
          <div className="w-full max-w-md">
            {/* Professional Error Card */}
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200/60 overflow-hidden">
              {/* Gradient Header Bar */}
              <div className="h-1.5 bg-gradient-to-r from-red-500 via-orange-500 to-amber-500"></div>

              <div className="p-8 sm:p-10">
                {/* Icon with subtle glow */}
                <div className="flex justify-center mb-6">
                  <div className="relative">
                    <div className="absolute inset-0 bg-red-500/20 blur-2xl rounded-full"></div>
                    <div className="relative bg-gradient-to-br from-red-50 to-orange-50 rounded-full p-4 shadow-lg">
                      <svg className="h-12 w-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="text-center space-y-3 mb-8">
                  <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                    Link Expired
                  </h1>
                  <p className="text-slate-600 text-base leading-relaxed max-w-sm mx-auto">
                    This password reset link is no longer valid. It may have expired or already been used.
                  </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col items-center gap-3">
                  <PublicButton
                    onClick={() => navigate('/forgot-password')}
                    variant="primary"
                    size="lg"
                  >
                    Request New Reset Link
                  </PublicButton>

                  <button
                    onClick={() => navigate('/login')}
                    className="px-6 py-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium transition-all duration-200 flex items-center group"
                  >
                    <svg className="h-4 w-4 mr-2 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to Login
                  </button>
                </div>

                {/* Help Text */}
                <div className="mt-6 pt-6 border-t border-slate-100">
                  <p className="text-xs text-center text-slate-500">
                    Password reset links expire after 1 hour for security reasons.
                  </p>
                </div>
              </div>
            </div>

            {/* Additional Help Link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-slate-600">
                Need help?{' '}
                <a href="mailto:support@charviam.com" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium underline-offset-2 hover:underline">
                  Contact Support
                </a>
              </p>
            </div>
          </div>
        </div>
      </AuthPageLayout>
    );
  }

  // Success state
  if (success) {
    return (
      <AuthPageLayout maxWidth="lg" showBackLink={false}>
        <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-xl shadow-indigo-500/10 dark:shadow-slate-900/50 border border-slate-200 dark:border-slate-700 p-8 overflow-hidden">
          {/* Background particles */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
            <div className="absolute top-10 left-10 w-2 h-2 bg-indigo-400 rounded-full animate-float blur-[1px]" style={{ animationDelay: '0s', animationDuration: '6s' }} />
            <div className="absolute top-32 right-16 w-1.5 h-1.5 bg-purple-400 rounded-full animate-float blur-[1px]" style={{ animationDelay: '1.5s', animationDuration: '8s' }} />
          </div>

          <div className="text-center relative">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 mb-4">
              <svg className="h-8 w-8 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Password Reset Successful!</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Your password has been reset successfully. Redirecting to login...
            </p>
          </div>
        </div>
      </AuthPageLayout>
    );
  }

  return (
    <AuthPageLayout maxWidth="lg" showBackLink={false}>
      <div className="text-center mt-1 mb-2">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Remember your password?{' '}
          <a href="/login" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 font-medium transition-colors duration-300">
            Login
          </a>
        </p>
      </div>
      <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-xl shadow-indigo-500/10 dark:shadow-slate-900/50 border border-slate-200 dark:border-slate-700 p-8 overflow-hidden">
        {/* Floating Particles Background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
          <div className="absolute top-10 left-10 w-2 h-2 bg-indigo-400 rounded-full animate-float blur-[1px]" style={{ animationDelay: '0s', animationDuration: '6s' }} />
          <div className="absolute top-32 right-16 w-1.5 h-1.5 bg-purple-400 rounded-full animate-float blur-[1px]" style={{ animationDelay: '1.5s', animationDuration: '8s' }} />
        </div>


        {error && <ErrorBanner message={error} onClose={() => setError(null)} />}

        <form onSubmit={handleSubmit} className={`space-y-4 relative ${mounted ? 'animate-slide-up-fade' : 'opacity-0'}`}>
          <h2 className="text-2xl md:text-xl text-center font-bold mb-4 text-slate-800 dark:text-white">
            Set New Password
          </h2>

          <div className="space-y-2">
            {/* Custom label with inline strength bar */}
            <div className="flex items-center mb-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                New Password<span className="text-red-500 ml-1">*</span>
              </label>
              <PasswordStrengthBar password={formData.new_password} />
            </div>
            <Input
              name="new_password"
              type="password"
              value={formData.new_password}
              onChange={handleChange}
              error={fieldErrors.new_password}
              required
              fullWidth
              showPasswordToggle
              className="focus-within:shadow-[0_0_15px_rgba(99,102,241,0.2)] transition-all duration-300"
            />
            <PasswordStrengthIndicator
              password={formData.new_password}
              confirmPassword={formData.confirm_password}
              onMismatchChange={setPasswordMismatch}
            />
          </div>

          <Input
            name="confirm_password"
            type="password"
            label="Confirm Password"
            value={formData.confirm_password}
            onChange={handleChange}
            error={fieldErrors.confirm_password || (passwordMismatch ? 'Passwords do not match' : undefined)}
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
                  <span>Resetting...</span>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </span>
              ) : 'Reset Password'}
            </PublicButton>
          </div>
        </form>
      </div>
    </AuthPageLayout>
  );
};
