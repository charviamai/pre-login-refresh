import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '../../shared/components/ui/Input';
import { Select } from '../../shared/components/ui';
import { PhoneInput } from '../../shared/components/PhoneInput';
import { Button } from '../../shared/components/ui/Button';
import { authApi } from '../../shared/utils/api-service';
import { PasswordStrengthIndicator, PasswordStrengthBar } from '../../shared/components/PasswordStrengthIndicator';
import { validatePasswordPolicy, containsSecurityThreat, validateFormSecurity, sanitizeFormData } from '../../shared/utils/inputSanitization';
import type { SignupRequest } from '../../shared/types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'signup' | 'login' | 'reset';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, defaultTab = 'login' }) => {
  const [activeTab, setActiveTab] = useState<'signup' | 'login' | 'reset'>(defaultTab);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const navigate = useNavigate();

  // Login form state
  const [loginData, setLoginData] = useState({
    identifier: '',
    password: ''
  });

  // Signup form state
  const [signupData, setSignupData] = useState<SignupRequest>({
    name_first: '',
    name_last: '',
    email: '',
    phone: '',
    country_code: 'US',
    shop_name: '',
    shop_location: '',
    password: '',
    password_confirm: '',
    plan: 'STANDARD'
  });

  // Real-time validation states
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);
  const [phoneAvailable, setPhoneAvailable] = useState<boolean | null>(null);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [checkingPhone, setCheckingPhone] = useState(false);

  // Reset password form state
  const [resetEmail, setResetEmail] = useState('');

  // Field errors
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Password mismatch state for red border
  const [passwordMismatch, setPasswordMismatch] = useState(false);

  if (!isOpen) return null;

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLoginData({
      ...loginData,
      [e.target.name]: e.target.value
    });
    setFieldErrors({ ...fieldErrors, [e.target.name]: '' });
  };

  const handleSignupChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSignupData({
      ...signupData,
      [e.target.name]: e.target.value
    });
    setFieldErrors({ ...fieldErrors, [e.target.name]: '' });
  };

  const handleCountryChange = (countryCode: string) => {
    setSignupData((prev) => ({ ...prev, country_code: countryCode }));
    if (signupData.phone) setPhoneAvailable(null);
  };

  // Email validation helper
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const getEmailFormatError = (email: string): string | null => {
    if (!email) return null;

    if (!email.includes('@')) {
      return `Please include an '@' in the email address. '${email}' is missing an '@'.`;
    }

    const parts = email.split('@');
    if (parts.length > 2) {
      return `A part following '@' should not contain the symbol '@'.`;
    }

    if (parts[0].length === 0) {
      return `Please enter a part followed by '@'. '${email}' is incomplete.`;
    }

    if (parts[1] && !parts[1].includes('.')) {
      return `Please enter a part following '@'. '${parts[1]}' is incomplete.`;
    }

    if (parts[1] && parts[1].endsWith('.')) {
      return `'.' is used at a wrong position in '${parts[1]}'.`;
    }

    if (!validateEmail(email)) {
      return `Please enter a valid email address.`;
    }

    return null;
  };

  // Async Validation
  const checkEmail = async (email: string) => {
    // Clear previous email errors
    setFieldErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.email;
      return newErrors;
    });

    if (!email) return;

    // Validate email format first
    const formatError = getEmailFormatError(email);
    if (formatError) {
      setEmailAvailable(null);
      setFieldErrors(prev => ({ ...prev, email: formatError }));
      return;
    }

    // Check database availability
    setCheckingEmail(true);
    try {
      const result = await authApi.checkEmail(email);
      setEmailAvailable(result.available);
      if (!result.available) setFieldErrors(prev => ({ ...prev, email: result.message }));
    } catch (e) {
      if (import.meta.env.DEV) console.error('Email check error:', e);
    } finally { setCheckingEmail(false); }
  };

  const checkPhone = async (phone: string) => {
    if (!phone || phone.length < 5) return;
    setCheckingPhone(true);
    try {
      const result = await authApi.checkPhone(phone, signupData.country_code || 'US');
      setPhoneAvailable(result.available);
      if (!result.available) setFieldErrors(prev => ({ ...prev, phone: result.message }));
    } catch (e) {
      if (import.meta.env.DEV) console.error('Phone check error:', e);
    } finally { setCheckingPhone(false); }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Security check for login inputs
    if (containsSecurityThreat(loginData.identifier) || containsSecurityThreat(loginData.password)) {
      setError('Invalid characters detected in input');
      return;
    }

    setLoading(true);

    try {
      const response = await authApi.login({ identifier: loginData.identifier, password: loginData.password });

      // Store tokens
      localStorage.setItem('access_token', response.access_token);
      if (response.refresh_token) {
        localStorage.setItem('refresh_token', response.refresh_token);
      }

      // Get current user
      const userResponse = await authApi.getCurrentUser();
      const role = userResponse.role;

      // Redirect based on role
      if (role === 'CLIENT_ADMIN') {
        navigate('/client/dashboard');
      } else if (role === 'EMPLOYEE') {
        navigate('/employee/select-shop');
      } else if (role === 'PLATFORM_ADMIN') {
        navigate('/internal-admin/dashboard');
      }

      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    // Check ALL fields for security threats
    const securityErrors = validateFormSecurity(signupData as unknown as Record<string, unknown>);
    if (Object.keys(securityErrors).length > 0) {
      setFieldErrors(securityErrors);
      return;
    }

    // Validate password policy
    const passwordValidation = validatePasswordPolicy(signupData.password || '');
    if (!passwordValidation.isValid) {
      setFieldErrors({ password: passwordValidation.errors[0] });
      return;
    }

    // Additional security check for password
    if (containsSecurityThreat(signupData.password || '')) {
      setFieldErrors({ password: 'Password contains invalid characters' });
      return;
    }

    // Validate passwords match
    if (signupData.password !== signupData.password_confirm) {
      setFieldErrors({ password_confirm: 'Passwords do not match' });
      return;
    }

    setLoading(true);

    try {
      // Sanitize all inputs before submission
      const sanitizedData = sanitizeFormData(signupData as unknown as Record<string, unknown>);
      await authApi.signup(sanitizedData as unknown as SignupRequest);
      navigate('/signup/success');
      onClose();
    } catch (err: any) {
      if (err.response?.data) {
        const errors = err.response.data;
        if (typeof errors === 'object') {
          setFieldErrors(errors);
        } else {
          setError('Signup failed. Please try again.');
        }
      } else {
        setError('Network error. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      await authApi.requestPasswordReset(resetEmail);
      setSuccess('Password reset instructions have been sent to your email.');
      setResetEmail('');
    } catch (err: any) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md glass-card rounded-2xl shadow-2xl overflow-hidden animate-slide-up-fade">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10"
          aria-label="Close modal"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header with logo/title */}
        <div className="px-8 pt-8 pb-4 text-center">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
            ArcadeX
          </h2>
          <p className="text-gray-400 mt-0 text-sm leading-none">@ Charaviam Product</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10 px-8">
          <button
            onClick={() => setActiveTab('login')}
            className={`flex-1 py-3 text-sm font-medium transition-colors relative ${activeTab === 'login'
              ? 'text-cyan-400'
              : 'text-gray-400 hover:text-gray-300'
              }`}
          >
            Log In
            {activeTab === 'login' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-cyan-500" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('signup')}
            className={`flex-1 py-3 text-sm font-medium transition-colors relative ${activeTab === 'signup'
              ? 'text-cyan-400'
              : 'text-gray-400 hover:text-gray-300'
              }`}
          >
            Sign Up
            {activeTab === 'signup' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-cyan-500" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('reset')}
            className={`flex-1 py-3 text-sm font-medium transition-colors relative ${activeTab === 'reset'
              ? 'text-cyan-400'
              : 'text-gray-400 hover:text-gray-300'
              }`}
          >
            Reset
            {activeTab === 'reset' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-cyan-500" />
            )}
          </button>
        </div>

        {/* Content */}
        <div className="p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm">
              {success}
            </div>
          )}

          {/* Login Tab */}
          {activeTab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                name="identifier"
                label="Email or Mobile Number"
                value={loginData.identifier}
                onChange={handleLoginChange}
                placeholder="Enter your email or mobile"
                required
                fullWidth
              />
              <Input
                name="password"
                type="password"
                label="Password"
                value={loginData.password}
                onChange={handleLoginChange}
                placeholder="Enter your password"
                required
                fullWidth
              />
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => setActiveTab('reset')}
                  className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  Forgot Password?
                </button>
              </div>
              <Button
                type="submit"
                fullWidth
                disabled={loading}
                className="btn-glow"
              >
                {loading ? 'Logging in...' : 'Log In'}
              </Button>
            </form>
          )}

          {/* Signup Tab */}
          {activeTab === 'signup' && (
            <form onSubmit={handleSignup} className="space-y-1.5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                <Input
                  name="name_first"
                  label="First Name"
                  value={signupData.name_first}
                  onChange={handleSignupChange}
                  error={fieldErrors.name_first}
                  placeholder="e.g. Jane"
                  required
                  fullWidth
                />
                <Input
                  name="name_last"
                  label="Last Name"
                  value={signupData.name_last}
                  onChange={handleSignupChange}
                  error={fieldErrors.name_last}
                  placeholder="e.g. Doe"
                  fullWidth
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                <Input
                  name="email"
                  type="email"
                  label="Email"
                  value={signupData.email}
                  onChange={handleSignupChange}
                  onBlur={() => checkEmail(signupData.email)}
                  error={fieldErrors.email}
                  isAvailable={emailAvailable}
                  isLoading={checkingEmail}
                  placeholder="jane@example.com"
                  required
                  fullWidth
                  maxLength={254}
                />
                <PhoneInput
                  name="phone"
                  label="Mobile Number"
                  value={signupData.phone}
                  onChange={handleSignupChange}
                  onBlur={() => checkPhone(signupData.phone)}
                  countryCode={signupData.country_code || 'US'}
                  onCountryChange={handleCountryChange}
                  error={fieldErrors.phone}
                  isAvailable={phoneAvailable}
                  isLoading={checkingPhone}
                  placeholder="555-0123"
                  required
                />
              </div>

              <Input
                name="shop_name"
                label="Shop Name"
                value={signupData.shop_name}
                onChange={handleSignupChange}
                error={fieldErrors.shop_name}
                placeholder="e.g. Station 1 Gaming"
                required
                fullWidth
              />
              <Input
                name="shop_location"
                label="Shop Address"
                value={signupData.shop_location}
                onChange={handleSignupChange}
                error={fieldErrors.shop_location}
                placeholder="123 Main St, City, State"
                autoComplete="street-address"
                required
                fullWidth
              />

              <div>
                {/* Custom label with inline strength bar */}
                <div className="flex items-center mb-1.5">
                  <label className="text-sm font-semibold text-gray-700">
                    Password<span className="text-red-500 ml-1">*</span>
                  </label>
                  <PasswordStrengthBar password={signupData.password || ''} />
                </div>
                <Input
                  name="password"
                  type="password"
                  value={signupData.password}
                  onChange={handleSignupChange}
                  error={fieldErrors.password}
                  placeholder="Create a strong password"
                  required
                  fullWidth
                  showPasswordToggle
                />
                <PasswordStrengthIndicator
                  password={signupData.password || ''}
                  confirmPassword={signupData.password_confirm || ''}
                  onMismatchChange={setPasswordMismatch}
                />
              </div>
              <Input
                name="password_confirm"
                type="password"
                label="Confirm Password"
                value={signupData.password_confirm}
                onChange={handleSignupChange}
                error={fieldErrors.password_confirm || (passwordMismatch ? 'Passwords do not match' : undefined)}
                placeholder="Confirm your password"
                required
                fullWidth
                showPasswordToggle
              />
              <Select
                name="plan"
                label="Plan"
                value={signupData.plan}
                onChange={(e) => setSignupData({ ...signupData, plan: e.target.value as any })}
                options={[{ value: 'STANDARD', label: 'Standard Plan' }]}
                required
                fullWidth
              />
              <Button
                type="submit"
                fullWidth
                disabled={loading}
                className="btn-glow mt-4"
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </form>
          )}

          {/* Reset Password Tab */}
          {activeTab === 'reset' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <p className="text-sm text-gray-400 mb-4">
                Enter your email address and we'll send you instructions to reset your password.
              </p>
              <Input
                name="email"
                type="email"
                label="Email Address"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="your@email.com"
                required
                fullWidth
                maxLength={254}
              />
              <Button
                type="submit"
                fullWidth
                disabled={loading}
                className="btn-glow"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
