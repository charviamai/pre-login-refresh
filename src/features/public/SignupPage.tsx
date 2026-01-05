import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Input, Select } from '../../shared/components/ui';
import { PublicButton } from '../../shared/components/ui/PublicButton';
import { PhoneInput } from '../../shared/components/PhoneInput';
import { AddressAutocomplete } from '../../shared/components/AddressAutocomplete';
import { authApi } from '../../shared/utils/api-service';
import { ErrorBanner } from '../../shared/components/ErrorBanner';
import { AuthPageLayout } from '../../shared/components/AuthPageLayout';
import { PasswordStrengthIndicator, PasswordStrengthBar } from '../../shared/components/PasswordStrengthIndicator';
import { validatePasswordPolicy, containsSecurityThreat, validateFormSecurity, sanitizeFormData } from '../../shared/utils/inputSanitization';
import type { SignupRequest } from '../../shared/types';

const MAX_ATTEMPTS = 2;

export const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [attemptCount, setAttemptCount] = useState(0);
  const [showContactSupport, setShowContactSupport] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(true); // Auto-accept terms
  const [showManualAddressFields, setShowManualAddressFields] = useState(false);
  const [addressAutoFilled, setAddressAutoFilled] = useState(false);
  const [currentStep, setCurrentStep] = useState<1 | 2>(1); // Step 1: Basic Info, Step 2: Security Questions

  const [formData, setFormData] = useState<SignupRequest>({
    name_first: '',
    name_last: '',
    email: '',
    phone: '',
    country_code: 'US',  // Default to USA
    shop_name: '',
    shop_location: '',
    shop_address_line1: '',
    shop_address_line2: '',
    shop_city: '',
    shop_state: '',
    shop_zip_code: '',
    shop_country: 'US',
    password: '',
    password_confirm: '',
    plan: 'STANDARD',
    // Security questions (optional but recommended)
    security_question_1: undefined,
    security_answer_1: '',
    security_question_2: undefined,
    security_answer_2: '',
    security_question_3: undefined,
    security_answer_3: '',
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-check terms when all required fields are filled
  useEffect(() => {
    const allRequiredFilled =
      formData.name_first?.trim() &&
      formData.email?.trim() &&
      formData.phone?.trim() &&
      formData.shop_name?.trim() &&
      formData.shop_location?.trim() &&
      formData.password?.trim() &&
      formData.password_confirm?.trim() &&
      formData.plan;

    if (allRequiredFilled && !termsAccepted) {
      setTermsAccepted(true);
    }
  }, [formData]);

  // Real-time validation states
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);
  const [phoneAvailable, setPhoneAvailable] = useState<boolean | null>(null);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [checkingPhone, setCheckingPhone] = useState(false);
  const [passwordMismatch, setPasswordMismatch] = useState(false);

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear field-specific error when user types
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }

    // Reset validation state on change
    if (name === 'email') setEmailAvailable(null);
    if (name === 'phone') setPhoneAvailable(null);
  };

  const handleCountryChange = (countryCode: string) => {
    setFormData((prev) => ({ ...prev, country_code: countryCode }));
    // Re-validate phone if country changes and phone is entered
    if (formData.phone) {
      setPhoneAvailable(null);
    }
  };

  // Check Email Availability
  const checkEmail = async (email: string) => {
    // Clear previous email errors
    setFieldErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.email;
      return newErrors;
    });

    // Check if email is empty
    if (!email) {
      return;
    }

    // Validate email format first
    const formatError = getEmailFormatError(email);
    if (formatError) {
      setEmailAvailable(null);
      setFieldErrors(prev => ({
        ...prev,
        email: formatError
      }));
      return;
    }

    // Check email availability in database
    setCheckingEmail(true);
    try {
      const result = await authApi.checkEmail(email);
      setEmailAvailable(result.available);
      if (!result.available) {
        setFieldErrors(prev => ({ ...prev, email: result.message }));
      }
    } catch (err) {
      console.error('Email check failed:', err);
    } finally {
      setCheckingEmail(false);
    }
  };

  // Check Phone Availability
  const checkPhone = async (phone: string) => {
    if (!phone) return;

    setCheckingPhone(true);
    try {
      const result = await authApi.checkPhone(phone, formData.country_code || 'US');
      setPhoneAvailable(result.available);
      if (!result.available) {
        setFieldErrors(prev => ({ ...prev, phone: result.message }));
      } else if (result.phone_normalized) {
        // Optional: Update with normalized phone or just keep as user typed
      }
    } catch (err) {
      console.error('Phone check failed:', err);
    } finally {
      setCheckingPhone(false);
    }
  };

  // Validation helpers
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

  const validatePhone = (phone: string): boolean => {
    // Basic validation - more robust validation happens on backend/normalization
    return phone.length >= 7;
  };

  // Handle "Next" button - validate Step 1 before advancing
  const handleNextStep = () => {
    const errors: Record<string, string> = {};

    // Validate all Step 1 fields
    if (!formData.name_first?.trim()) errors.name_first = 'First name is required';
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    if (!formData.phone) {
      errors.phone = 'Phone number is required';
    } else if (!validatePhone(formData.phone)) {
      errors.phone = 'Please enter a valid phone number';
    }
    if (!formData.shop_name || formData.shop_name.length < 2) {
      errors.shop_name = 'Shop name must be at least 2 characters';
    }
    if (!formData.shop_location || formData.shop_location.length < 10) {
      errors.shop_location = 'Please enter a valid shop address';
    }

    const passwordValidation = validatePasswordPolicy(formData.password || '');
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (!passwordValidation.isValid) {
      errors.password = passwordValidation.errors[0];
    }
    if (!formData.password_confirm) {
      errors.password_confirm = 'Please confirm your password';
    } else if (formData.password !== formData.password_confirm) {
      errors.password_confirm = 'Passwords do not match';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setCurrentStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    // Check if we've exceeded max attempts
    if (attemptCount >= MAX_ATTEMPTS) {
      setShowContactSupport(true);
      return;
    }

    // Client-side validation
    const errors: Record<string, string> = {};

    if (!formData.name_first || !formData.name_first.trim()) {
      errors.name_first = 'First name is required';
    }
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      errors.email = 'Please enter a valid email address';
    } else if (emailAvailable === false) {
      errors.email = 'Email is already taken';
    }

    if (!formData.phone) {
      errors.phone = 'Phone number is required';
    } else if (!validatePhone(formData.phone)) {
      errors.phone = 'Please enter a valid phone number';
    } else if (phoneAvailable === false) {
      errors.phone = 'Phone number is already associated with an account';
    }

    if (!formData.shop_name || formData.shop_name.length < 2) {
      errors.shop_name = 'Shop name must be at least 2 characters';
    }
    if (!formData.shop_location || formData.shop_location.length < 10) {
      errors.shop_location = 'Please enter a valid shop address (min 10 characters)';
    }

    // Check ALL fields for security threats (SQL injection, XSS, etc.)
    const securityErrors = validateFormSecurity(formData as unknown as Record<string, unknown>);
    Object.assign(errors, securityErrors);

    // Validate password using policy
    const passwordValidation = validatePasswordPolicy(formData.password || '');
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (!passwordValidation.isValid) {
      errors.password = passwordValidation.errors[0];
    }

    // Additional security check for password
    if (formData.password && containsSecurityThreat(formData.password)) {
      errors.password = 'Password contains invalid characters';
    }

    if (!formData.password_confirm) {
      errors.password_confirm = 'Please confirm your password';
    } else if (formData.password !== formData.password_confirm) {
      errors.password_confirm = 'Passwords do not match';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    // Sanitize all form data before submission
    const sanitizedData = sanitizeFormData(formData as unknown as Record<string, unknown>) as unknown as SignupRequest;

    setLoading(true);

    try {
      const response = await authApi.signup(sanitizedData);

      // Handle structured response
      if (response.status === 'SUCCESS' || response.status === 'PARTIAL_SUCCESS') {
        // Navigate to success page with state
        navigate('/signup/success', {
          state: {
            requestId: response.request_id,
            emailFailed: response.email_status === 'FAILED',
          },
        });
      } else {
        // FAILURE case - should not happen if backend returns 201
        setAttemptCount((prev) => prev + 1);
        setError(response.message || 'Signup failed. Please try again.');
        if (response.errors) {
          setFieldErrors(response.errors);
        }
        if (attemptCount >= MAX_ATTEMPTS - 1) {
          setShowContactSupport(true);
        }
      }
    } catch (err: any) {
      // Network or server error
      setAttemptCount((prev) => prev + 1);
      setError(err.message || 'Something went wrong. Please try again.');
      if (err.errors) {
        setFieldErrors(err.errors);
      }
      if (attemptCount >= MAX_ATTEMPTS - 1) {
        setShowContactSupport(true);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthPageLayout
      maxWidth="2xl"
      showBackLink={false}
    >
      <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-xl shadow-indigo-500/10 dark:shadow-slate-900/50 border border-slate-200 dark:border-slate-700 p-8 overflow-hidden">
        {/* Floating Particles Background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
          <div className="absolute top-10 left-10 w-2 h-2 bg-indigo-400 rounded-full animate-float blur-[1px]" style={{ animationDelay: '0s', animationDuration: '6s' }} />
          <div className="absolute top-32 right-16 w-1.5 h-1.5 bg-purple-400 rounded-full animate-float blur-[1px]" style={{ animationDelay: '1.5s', animationDuration: '8s' }} />
        </div>

        {error && <ErrorBanner message={error} onClose={() => setError(null)} />}

        <form onSubmit={handleSubmit} className={`space-y-4 relative ${mounted ? 'animate-slide-up-fade' : 'opacity-0'}`}>
          <h2 className="text-lg text-center font-bold mb-4 text-slate-800 dark:text-white">
            {currentStep === 1 ? 'Create an Account' : 'Security Questions'}
          </h2>

          {/* STEP 1: Basic Information */}
          {currentStep === 1 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="animate-slide-up-fade" style={{ animationDelay: '0.05s' }}>
                  <Input
                    name="name_first"
                    label="First Name"
                    value={formData.name_first}
                    onChange={handleChange}
                    error={fieldErrors.name_first}
                    required
                    fullWidth
                    className="focus-within:shadow-[0_0_15px_rgba(14,165,233,0.2)] transition-all duration-300"
                  />
                </div>
                <div className="animate-slide-up-fade" style={{ animationDelay: '0.1s' }}>
                  <Input
                    name="name_last"
                    label="Last Name"
                    value={formData.name_last}
                    onChange={handleChange}
                    error={fieldErrors.name_last}
                    fullWidth
                    className="focus-within:shadow-[0_0_15px_rgba(14,165,233,0.2)] transition-all duration-300"
                  />
                </div>
              </div>

              {/* Email - Full Width */}
              <div className="animate-slide-up-fade" style={{ animationDelay: '0.15s' }}>
                <Input
                  name="email"
                  type="email"
                  label="Email Address"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={() => checkEmail(formData.email)}
                  error={fieldErrors.email}
                  isAvailable={emailAvailable}
                  helperText={
                    checkingEmail
                      ? 'Checking availability...'
                      : undefined
                  }
                  required
                  fullWidth
                  maxLength={254}
                  className="focus-within:shadow-[0_0_15px_rgba(14,165,233,0.2)] transition-all duration-300"
                />
              </div>

              {/* Mobile Number - Full Width */}
              <div className="animate-slide-up-fade" style={{ animationDelay: '0.2s' }}>
                <PhoneInput
                  name="phone"
                  label="Mobile Number"
                  value={formData.phone}
                  onChange={handleChange}
                  onBlur={() => checkPhone(formData.phone)}
                  countryCode={formData.country_code || 'US'}
                  onCountryChange={handleCountryChange}
                  error={fieldErrors.phone}
                  isAvailable={phoneAvailable}
                  helperText={
                    checkingPhone
                      ? 'Checking...'
                      : undefined
                  }
                  required
                  placeholder="0000000000"
                />
              </div>

              <Input
                name="shop_name"
                label="Shop Name"
                value={formData.shop_name}
                onChange={handleChange}
                error={fieldErrors.shop_name}
                required
                fullWidth
                className="focus-within:shadow-[0_0_15px_rgba(14,165,233,0.2)] transition-all duration-300"
              />

              <AddressAutocomplete
                name="shop_location"
                label="Shop Address"
                value={formData.shop_location || ''}
                onChange={(e) => {
                  handleChange(e);
                  // If user is typing (not selecting), show manual fields after a delay
                  if (!addressAutoFilled) {
                    setShowManualAddressFields(true);
                  }
                }}
                onAddressSelect={(address) => {
                  // Auto-fill all structured fields from selected address
                  setFormData((prev) => ({
                    ...prev,
                    shop_location: address.formatted,
                    shop_address_line1: address.addressLine1 || '',
                    shop_address_line2: address.addressLine2 || '',
                    shop_city: address.city || '',
                    shop_state: address.stateCode || address.state || '',
                    shop_zip_code: address.postalCode || '',
                    shop_country: address.countryCode?.toUpperCase() || 'US',
                  }));
                  setAddressAutoFilled(true);
                  setShowManualAddressFields(false);
                }}
                error={fieldErrors.shop_location}
                required
                fullWidth
                countryCode="us"
                placeholder="Start typing your shop address..."
                className="focus-within:shadow-[0_0_15px_rgba(14,165,233,0.2)] transition-all duration-300"
              />

              {/* Manual Address Fields - shown when autocomplete not used */}
              {showManualAddressFields && !addressAutoFilled && (
                <div className="space-y-3 p-4 bg-amber-50 border border-amber-200 rounded-lg animate-slideDown">
                  <p className="text-sm text-amber-700 font-medium">Please fill in your address details:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Input
                      name="shop_city"
                      label="City"
                      value={formData.shop_city || ''}
                      onChange={handleChange}
                      error={fieldErrors.shop_city}
                      required
                      fullWidth
                    />
                    <Input
                      name="shop_state"
                      label="State"
                      value={formData.shop_state || ''}
                      onChange={handleChange}
                      error={fieldErrors.shop_state}
                      required
                      fullWidth
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Input
                      name="shop_zip_code"
                      label="ZIP Code"
                      value={formData.shop_zip_code || ''}
                      onChange={handleChange}
                      error={fieldErrors.shop_zip_code}
                      required
                      fullWidth
                    />
                    <Select
                      name="shop_country"
                      label="Country"
                      value={formData.shop_country || 'US'}
                      onChange={handleChange}
                      options={[{ value: 'US', label: 'United States' }]}
                      fullWidth
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {/* Custom label with inline strength bar */}
                <div className="flex items-center mb-2">
                  <label htmlFor="input-password" className="text-sm font-semibold text-gray-700">
                    Password<span className="text-red-500 ml-1">*</span>
                  </label>
                  <PasswordStrengthBar password={formData.password || ''} />
                </div>
                <Input
                  id="input-password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  error={fieldErrors.password}
                  required
                  fullWidth
                  showPasswordToggle
                  className="focus-within:shadow-[0_0_15px_rgba(14,165,233,0.2)] transition-all duration-300"
                />
                <PasswordStrengthIndicator
                  password={formData.password || ''}
                  confirmPassword={formData.password_confirm || ''}
                  onMismatchChange={setPasswordMismatch}
                />
              </div>

              <Input
                name="password_confirm"
                type="password"
                label="Confirm Password"
                value={formData.password_confirm}
                onChange={handleChange}
                error={fieldErrors.password_confirm || (passwordMismatch ? 'Passwords do not match' : undefined)}
                required
                fullWidth
                showPasswordToggle
                className={`focus-within:shadow-[0_0_15px_rgba(14,165,233,0.2)] transition-all duration-300 ${passwordMismatch ? 'border-red-500 ring-1 ring-red-500' : ''}`}
              />

              <Select
                name="plan"
                label="Plan"
                value={formData.plan}
                onChange={handleChange}
                options={[{ value: 'STANDARD', label: 'Standard Plan' }]}
                required
                fullWidth
                className="focus-within:shadow-[0_0_15px_rgba(14,165,233,0.2)] transition-all duration-300"
              />

              {/* Terms and Conditions */}
              <div className="flex items-start gap-3 mt-4">
                <input
                  type="checkbox"
                  id="termsAccepted"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-1 h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
                />
                <label htmlFor="termsAccepted" className="text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
                  I agree to the{' '}
                  <a href="/terms" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 font-medium transition-colors">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="/privacy" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 font-medium transition-colors">
                    Privacy Policy
                  </a>
                </label>
              </div>
            </>
          )}

          {/* STEP 2: Security Questions */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-slide-up-fade">

              {/* Question 1 */}
              <div className="space-y-2">
                <Select
                  name="security_question_1"
                  label="Security Question 1"
                  value={formData.security_question_1 || ''}
                  onChange={handleChange}
                  options={[
                    { value: '', label: 'Select a question...' },
                    ...[
                      { value: 'CITY', label: 'What is your favorite city?' },
                      { value: 'FOOD', label: 'What is your favourite type of food?' },
                      { value: 'DESSERT', label: 'What is your favourite dessert?' },
                    ].filter(opt =>
                      opt.value !== formData.security_question_2 &&
                      opt.value !== formData.security_question_3
                    )
                  ]}
                  required
                  fullWidth
                />
                <Input
                  name="security_answer_1"
                  label="Your Answer"
                  value={formData.security_answer_1 || ''}
                  onChange={handleChange}
                  placeholder="Enter your answer"
                  required
                  fullWidth
                />
              </div>

              {/* Question 2 */}
              <div className="space-y-2">
                <Select
                  name="security_question_2"
                  label="Security Question 2"
                  value={formData.security_question_2 || ''}
                  onChange={handleChange}
                  options={[
                    { value: '', label: 'Select a question...' },
                    ...[
                      { value: 'CITY', label: 'What is your favorite city?' },
                      { value: 'FOOD', label: 'What is your favourite type of food?' },
                      { value: 'DESSERT', label: 'What is your favourite dessert?' },
                    ].filter(opt =>
                      opt.value !== formData.security_question_1 &&
                      opt.value !== formData.security_question_3
                    )
                  ]}
                  required
                  fullWidth
                />
                <Input
                  name="security_answer_2"
                  label="Your Answer"
                  value={formData.security_answer_2 || ''}
                  onChange={handleChange}
                  placeholder="Enter your answer"
                  required
                  fullWidth
                />
              </div>

              {/* Question 3 */}
              <div className="space-y-2">
                <Select
                  name="security_question_3"
                  label="Security Question 3"
                  value={formData.security_question_3 || ''}
                  onChange={handleChange}
                  options={[
                    { value: '', label: 'Select a question...' },
                    ...[
                      { value: 'CITY', label: 'What is your favorite city?' },
                      { value: 'FOOD', label: 'What is your favourite type of food?' },
                      { value: 'DESSERT', label: 'What is your favourite dessert?' },
                    ].filter(opt =>
                      opt.value !== formData.security_question_1 &&
                      opt.value !== formData.security_question_2
                    )
                  ]}
                  required
                  fullWidth
                />
                <Input
                  name="security_answer_3"
                  label="Your Answer"
                  value={formData.security_answer_3 || ''}
                  onChange={handleChange}
                  placeholder="Enter your answer"
                  required
                  fullWidth
                />
              </div>
            </div>
          )}

          {/* Submit Section */}
          {showContactSupport ? (
            <div className="bg-sky-50 border border-sky-200 rounded-xl p-6 text-center">
              <h3 className="text-lg font-semibold text-slate-800 mb-2">Need Help?</h3>
              <p className="text-slate-600 mb-4">
                We're experiencing some issues. Please contact our support team:
              </p>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="font-medium">Email:</span>{' '}
                  <a href="mailto:support@charviam.com" className="text-sky-600 hover:text-sky-500">
                    support@charviam.com
                  </a>
                </p>
                <p>
                  <span className="font-medium">Phone:</span>{' '}
                  <a href="tel:+15551234567" className="text-sky-600 hover:text-sky-500">
                    (555) 123-4567
                  </a>
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-4 mb-2">
              {/* Step indicator and buttons */}
              <div className="flex justify-between items-center">
                {/* Back button (only on Step 2) */}
                {currentStep === 2 && (
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="px-4 py-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-semibold transition-colors flex items-center gap-1 text-sm"
                  >
                    <span>←</span> Back
                  </button>
                )}

                {/* Step indicator text (compact) */}
                {currentStep === 1 && (
                  <p className="text-xs text-slate-500">Step 1 of 2</p>
                )}

                {/* Next or Submit button */}
                {currentStep === 1 ? (
                  <PublicButton
                    type="button"
                    onClick={handleNextStep}
                    disabled={loading || !termsAccepted}
                    variant="primary"
                  >
                    Next →
                  </PublicButton>
                ) : (
                  <div className="flex items-center gap-3">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Step 2 of 2</p>
                    <PublicButton
                      type="submit"
                      disabled={loading}
                      variant="primary"
                    >
                      {loading ? (
                        <span className="flex items-center gap-2 justify-center">
                          <span>Creating Account...</span>
                          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        </span>
                      ) : 'Sign Up'}
                    </PublicButton>
                  </div>
                )}
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Footer - Combined Navigation */}
      <div className="flex justify-center items-center gap-3 mt-4 text-sm">
        <Link to="/" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors">
          ← Back to Home
        </Link>
        <span className="text-slate-400 dark:text-slate-600">|</span>
        <div>
          <span className="text-slate-700 dark:text-slate-300">Already have an account? </span>
          <Link to="/login" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-semibold transition-colors">
            Log in
          </Link>
        </div>
      </div>
    </AuthPageLayout>
  );
};
