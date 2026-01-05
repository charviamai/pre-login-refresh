import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Input } from '../../shared/components/ui';
import { PublicButton } from '../../shared/components/ui/PublicButton';
import { ErrorBanner } from '../../shared/components/ErrorBanner';
import { AuthPageLayout } from '../../shared/components/AuthPageLayout';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, logout, isAuthenticated, user, error: authError, clearError } = useAuth();

  const [credentials, setCredentials] = useState({
    identifier: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Email validation helper (matches SignupPage pattern)
  const validateEmailOrPhone = (value: string): string | null => {
    if (!value || !value.trim()) {
      return 'Email or phone number is required';
    }

    // Check if it looks like an email
    if (value.includes('@')) {
      if (!value.includes('.') || value.endsWith('.') || value.startsWith('@')) {
        return 'Please enter a valid email address';
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return 'Please enter a valid email address';
      }
    } else {
      // Treat as phone - basic validation
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

  // Check for force login parameter (allows switching users)
  const searchParams = new URLSearchParams(window.location.search);
  const forceLogin = searchParams.get('switch') === 'true';

  // If switching users, log out current user first
  useEffect(() => {
    if (forceLogin && isAuthenticated) {
      logout();
    }
  }, [forceLogin]);

  // Redirect if already authenticated (unless force login)
  useEffect(() => {
    if (isAuthenticated && user && !forceLogin) {
      redirectBasedOnRole();
    }
  }, [isAuthenticated, user, forceLogin]);

  const redirectBasedOnRole = () => {
    if (!user) return;

    switch (user.role) {
      case 'PLATFORM_ADMIN':
        navigate('/internal-admin/dashboard');
        break;
      case 'CLIENT_ADMIN':
        navigate('/client/dashboard');
        break;
      case 'EMPLOYEE':
        // Employees go to shop selection first
        navigate('/employee/select-shop');
        break;
      default:
        navigate('/');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({ ...prev, [name]: value }));
    clearError();
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

    // Client-side validation
    const errors: Record<string, string> = {};

    const identifierError = validateEmailOrPhone(credentials.identifier);
    if (identifierError) {
      errors.identifier = identifierError;
    }

    if (!credentials.password) {
      errors.password = 'Password is required';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);

    try {
      await login(credentials);
      // Redirect will happen via useEffect after successful login
    } catch (err) {
      // Error is handled by auth context
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthPageLayout maxWidth="lg">
      {/* Charvium-style Card */}
      <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-xl shadow-indigo-500/10 dark:shadow-slate-900/50 border border-slate-200 dark:border-slate-700 p-8 overflow-hidden">
        {/* Floating Particles Background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
          <div className="absolute top-10 left-10 w-2 h-2 bg-indigo-400 rounded-full animate-float blur-[1px]" style={{ animationDelay: '0s', animationDuration: '6s' }} />
          <div className="absolute top-32 right-16 w-1.5 h-1.5 bg-purple-400 rounded-full animate-float blur-[1px]" style={{ animationDelay: '1.5s', animationDuration: '8s' }} />
          <div className="absolute bottom-24 left-20 w-2.5 h-2.5 bg-indigo-300 rounded-full animate-float blur-[1px]" style={{ animationDelay: '3s', animationDuration: '7s' }} />
          <div className="absolute bottom-40 right-24 w-1 h-1 bg-purple-300 rounded-full animate-float blur-[1px]" style={{ animationDelay: '4s', animationDuration: '9s' }} />
        </div>

        {authError && <ErrorBanner message={authError} onClose={clearError} />}

        <form onSubmit={handleSubmit} className={`space-y-4 relative ${mounted ? 'animate-slide-up-fade' : 'opacity-0'}`}>
          <h2 className="text-2xl md:text-xl text-center font-bold mb-6 text-slate-800 dark:text-white">
            Welcome Back!
          </h2>

          <Input
            name="identifier"
            label="Email or Mobile Number"
            value={credentials.identifier}
            onChange={handleChange}
            error={fieldErrors.identifier}
            required
            fullWidth
            autoComplete="email"
            placeholder="Enter your email or mobile"
            className="focus-within:shadow-[0_0_15px_rgba(99,102,241,0.2)] transition-all duration-300"
          />

          <div>
            <Input
              name="password"
              type="password"
              label="Password"
              value={credentials.password}
              onChange={handleChange}
              error={fieldErrors.password}
              required
              fullWidth
              autoComplete="current-password"
              showPasswordToggle
              className="focus-within:shadow-[0_0_15px_rgba(99,102,241,0.2)] transition-all duration-300"
            />
            <div className="mt-2 text-right">
              <a href="/forgot-password" className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 font-medium transition-colors duration-300">
                Forgot Password?
              </a>
            </div>
          </div>

          <div className="flex justify-center mt-6 pt-2">
            <PublicButton
              type="submit"
              disabled={loading}
              variant="primary"
              size="lg"
              className="w-full max-w-xs"
            >
              {loading ? (
                <span className="flex items-center gap-2 justify-center">
                  <span>Logging in...</span>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </span>
              ) : 'Login'}
            </PublicButton>
          </div>

          {/* Sign up link */}
          <p className="text-center text-sm text-slate-600 dark:text-slate-400 mt-4">
            Don't have an account?{' '}
            <a href="/signup" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 font-medium">
              Sign up
            </a>
          </p>
        </form>
      </div>
    </AuthPageLayout>
  );
};
