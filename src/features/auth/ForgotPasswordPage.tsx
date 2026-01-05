import React, { useState, useEffect } from 'react';
import { Input } from '../../shared/components/ui';
import { PublicButton } from '../../shared/components/ui/PublicButton';
import { authApi } from '../../shared/utils/api-service';
import { ErrorBanner } from '../../shared/components/ErrorBanner';
import { AuthPageLayout } from '../../shared/components/AuthPageLayout';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Email validation helper
  const validateEmailOrPhone = (value: string): string | null => {
    if (!value || !value.trim()) {
      return 'Email or phone number is required';
    }

    if (value.includes('@')) {
      if (!value.includes('.') || value.endsWith('.') || value.startsWith('@')) {
        return 'Please enter a valid email address';
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return 'Please enter a valid email address';
      }
    } else {
      const digitsOnly = value.replace(/\D/g, '');
      if (digitsOnly.length < 10) {
        return 'Please enter a valid email or phone number';
      }
    }
    return null;
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setFieldError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldError(null);

    // Validate email/phone format
    const validationError = validateEmailOrPhone(email);
    if (validationError) {
      setFieldError(validationError);
      return;
    }

    setLoading(true);

    try {
      await authApi.requestPasswordReset(email);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <AuthPageLayout maxWidth="lg" backLinkTo="/login" backLinkText="Back to Login">
        <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-xl shadow-indigo-500/10 dark:shadow-slate-900/50 border border-slate-200 dark:border-slate-700 p-8">
          <div className="text-center relative">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-indigo-100 dark:bg-indigo-900/30 mb-4">
              <svg className="h-8 w-8 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Check Your Email</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              If an account with this email exists, we've sent you a password reset link.
              Please check your inbox and follow the instructions.
            </p>
            <div className="flex justify-center pb-4">
              <PublicButton href="/login" variant="primary" size="lg">
                Back to Login
              </PublicButton>
            </div>
          </div>
        </div>
      </AuthPageLayout>
    );
  }

  return (
    <AuthPageLayout
      maxWidth="lg"
      showBackLink={false}
    >
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
          <div className="absolute bottom-24 left-20 w-2.5 h-2.5 bg-indigo-300 rounded-full animate-float blur-[1px]" style={{ animationDelay: '3s', animationDuration: '7s' }} />
          <div className="absolute bottom-40 right-24 w-1 h-1 bg-purple-300 rounded-full animate-float blur-[1px]" style={{ animationDelay: '4s', animationDuration: '9s' }} />
        </div>

        {error && <ErrorBanner message={error} onClose={() => setError(null)} />}

        <form onSubmit={handleSubmit} className={`space-y-4 relative ${mounted ? 'animate-slide-up-fade' : 'opacity-0'}`}>
          <h2 className="text-2xl md:text-xl text-center font-bold mb-4 text-slate-800 dark:text-white">
            Reset Your Password
          </h2>

          <Input
            name="email"
            type="email"
            label="Email or Mobile Number"
            value={email}
            onChange={handleChange}
            error={fieldError || undefined}
            placeholder="your@email.com or mobile number"
            required
            fullWidth
            maxLength={254}
            className="focus-within:shadow-[0_0_15px_rgba(99,102,241,0.2)] transition-all duration-300"
          />

          <div className="flex justify-center mb-6 mt-4">
            <PublicButton
              type="submit"
              disabled={loading}
              variant="primary"
              size="lg"
              className="w-full max-w-xs"
            >
              {loading ? (
                <span className="flex items-center gap-2 justify-center">
                  <span>Sending...</span>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </span>
              ) : 'Send Reset Link'}
            </PublicButton>
          </div>
        </form>
      </div>
    </AuthPageLayout>
  );
};
