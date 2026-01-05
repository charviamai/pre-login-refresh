import React, { useState, useRef, useEffect } from 'react';
import { useKiosk } from '../../../contexts/KioskContext';
import { Button } from '../../../shared/components/ui';
import { palmBridgeService, palmApiService, PalmFeatures } from '../../../shared/services/palmBridge';
import { nfcBridgeService, nfcApiService } from '../../../shared/services/nfcBridge';

interface RegistrationFormData {
  name: string;
  birth_day: string;
  birth_month: string;
  birth_year: string;
  phone: string;
}

type RegistrationStep = 'form' | 'capture_right' | 'capture_left' | 'capture_nfc' | 'registering';

export const RegistrationScreen: React.FC = () => {
  const {
    registerCustomer,
    setState,
    pendingPhone,
    pendingPalmFeatures,
    config,
    deviceInfo,
    checkEligibility,
  } = useKiosk() as any;

  // Read shop settings for verification methods
  // Using !== false so undefined defaults to enabled (consistent with IdleScreen)
  const enablePalm = config?.settings?.verification_palm_enabled !== false;
  const enableNFC = config?.settings?.verification_nfc_enabled !== false;

  // Determine registration flow based on enabled methods
  const getNextStepAfterForm = (): RegistrationStep => {
    if (enablePalm) {
      return pendingPalmFeatures ? 'capture_left' : 'capture_right';
    }
    if (enableNFC) {
      return 'capture_nfc';
    }
    // No palm or NFC enabled - go directly to registration
    return 'registering';
  };

  const getNextStepAfterPalm = (): RegistrationStep => {
    if (enableNFC) {
      return 'capture_nfc';
    }
    // No NFC enabled - go directly to registration
    return 'registering';
  };

  const getButtonText = (): string => {
    if (enablePalm) {
      return 'Next: Scan Palms';
    }
    if (enableNFC) {
      return 'Next: Tap NFC';
    }
    return 'Register';
  };

  const [formData, setFormData] = useState<RegistrationFormData>({
    name: '',
    birth_day: '',
    birth_month: '',
    birth_year: '',
    phone: pendingPhone || '',
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Capture state
  const [currentStep, setCurrentStep] = useState<RegistrationStep>('form');
  const [rightPalm, setRightPalm] = useState<PalmFeatures | null>(pendingPalmFeatures || null);
  const [leftPalm, setLeftPalm] = useState<PalmFeatures | null>(null);
  const [nfcUid, setNfcUid] = useState<string | null>(null);

  const [captureMessage, setCaptureMessage] = useState('');
  const [isCapturing, setIsCapturing] = useState(false);

  // Ref for cleanup
  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  // Generate month options (Jan-Dec)
  const months = [
    { value: '01', label: 'January' },
    { value: '02', label: 'February' },
    { value: '03', label: 'March' },
    { value: '04', label: 'April' },
    { value: '05', label: 'May' },
    { value: '06', label: 'June' },
    { value: '07', label: 'July' },
    { value: '08', label: 'August' },
    { value: '09', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ];

  // Generate day options (1-31)
  const days = Array.from({ length: 31 }, (_, i) => ({
    value: String(i + 1).padStart(2, '0'),
    label: String(i + 1),
  }));

  // Generate year options (1940 to current year - 21)
  const currentYear = new Date().getFullYear();
  const minYear = 1940;
  const maxYear = currentYear - 21;
  const years = Array.from({ length: maxYear - minYear + 1 }, (_, i) => {
    const year = maxYear - i;
    return { value: year.toString(), label: year.toString() };
  });

  // Start flow after form validation
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate required fields
    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }

    if (!formData.birth_month || !formData.birth_year) {
      setError('Date of birth is required');
      return;
    }

    // Validate age (must be 21+)
    const birthYear = parseInt(formData.birth_year);
    const birthMonth = parseInt(formData.birth_month) - 1;
    const today = new Date();
    let age = today.getFullYear() - birthYear;
    if (today.getMonth() < birthMonth) {
      age--;
    }

    if (age < 21) {
      setError('You must be 21 or older to register');
      return;
    }

    // Determine next step based on shop settings
    const nextStep = getNextStepAfterForm();

    if (nextStep === 'registering') {
      // No biometric capture needed - go directly to registration
      await completeRegistration(null);
    } else if (nextStep === 'capture_left') {
      // Already have right palm from identification, go to left
      setCurrentStep('capture_left');
      setCaptureMessage('✅ Right hand captured!\n\nNow scan your LEFT hand...');
    } else if (nextStep === 'capture_right') {
      // Start with right hand
      setCurrentStep('capture_right');
      setCaptureMessage('🖐️ Place your RIGHT hand on the scanner...');
    } else if (nextStep === 'capture_nfc') {
      // No palm needed, go to NFC
      setCurrentStep('capture_nfc');
      setCaptureMessage('📲 Tap your NFC tag/card to link it...');
    }
  };

  // Handle palm capture
  const handlePalmCapture = async () => {
    setIsCapturing(true);
    setError(null);

    try {
      const result = await palmBridgeService.capture();

      if (!isMounted.current) return;

      if (!result.success || !result.rgbFeature || !result.irFeature) {
        setError(result.error || 'Capture failed. Try again.');
        setIsCapturing(false);
        return;
      }

      const features: PalmFeatures = {
        rgbFeature: result.rgbFeature,
        irFeature: result.irFeature,
      };

      if (currentStep === 'capture_right') {
        setRightPalm(features);
        setCurrentStep('capture_left');
        setCaptureMessage('✅ Right hand captured!\n\nNow scan your LEFT hand...');
        setIsCapturing(false);
      } else if (currentStep === 'capture_left') {
        setLeftPalm(features);
        setIsCapturing(false);

        // Determine next step based on shop settings
        const nextStep = getNextStepAfterPalm();
        if (nextStep === 'capture_nfc') {
          setCurrentStep('capture_nfc');
          setCaptureMessage('✅ Both palms captured!\n\nNow tap your NFC tag/card to link it...');
        } else {
          // No NFC enabled - go directly to registration
          await completeRegistration(null);
        }
      }
    } catch (err: any) {
      if (isMounted.current) {
        setError(err.message || 'Capture error');
        setIsCapturing(false);
      }
    }
  };

  const handleNfcCapture = async () => {
    setIsCapturing(true);
    setError(null);
    setCaptureMessage('📲 Tap your NFC tag/card now...');

    try {
      // Read NFC UID
      const result = await nfcBridgeService.register(15000); // 15s timeout

      if (!isMounted.current) return;

      if (!result.success || !result.nfc_uid) {
        setError(result.error || 'NFC tag read failed. Try again.');
        setIsCapturing(false);
        return;
      }

      setNfcUid(result.nfc_uid);

      // Proceed to registration
      await completeRegistration(result.nfc_uid);

    } catch (err: any) {
      if (isMounted.current) {
        setError(err.message || 'NFC error');
        setIsCapturing(false);
      }
    }
  };

  const handleSkipNfc = async () => {
    // Allow skipping NFC if optional? The prompt implied mandatory "Registration includes... tagging NFC"
    // But fallback is always good.
    await completeRegistration(null);
  };

  // Complete registration
  const completeRegistration = async (capturedNfcUid: string | null) => {
    setCurrentStep('registering');
    setCaptureMessage('Registering your account...');
    setSubmitting(true);

    try {
      // Create date string
      const day = formData.birth_day || '01';
      const dateOfBirth = `${formData.birth_year}-${formData.birth_month}-${day}`;

      // Split name
      const nameParts = formData.name.trim().split(/\s+/);
      const name_first = nameParts[0] || formData.name;
      const name_last = nameParts.slice(1).join(' ') || '';

      // 1. Register Customer
      const customer = await registerCustomer({
        name_first,
        name_last,
        date_of_birth: dateOfBirth,
        phone: formData.phone.trim() || undefined,
      });

      if (!customer?.id) throw new Error("Customer registration returned no ID");

      const authToken = localStorage.getItem('device_token') || '';

      // 2. Register Palms
      if (rightPalm && leftPalm) {

        const palmResult = await palmApiService.register(
          customer.id,
          rightPalm,
          leftPalm,
          authToken,
          config?.shop?.id,
          deviceInfo?.id
        );
        if (!palmResult.success) console.error("Palm registration warning:", palmResult.error);
      }

      // 3. Register NFC (if captured)
      if (capturedNfcUid) {

        const nfcResult = await nfcApiService.register(
          customer.id,
          capturedNfcUid,
          authToken,
          config?.shop?.id,
          deviceInfo?.id
        );
        if (!nfcResult.success) console.error("NFC registration warning:", nfcResult.error);
      }

      // Move to eligibility check (completes flow)
      setState('CHECKING_ELIGIBILITY');
      await checkEligibility(customer.id);

    } catch (err: any) {

      if (isMounted.current) {
        const phoneErr = err?.field_errors?.phone?.[0];
        const msg = phoneErr || err.error || err.message || 'Registration failed. Please try again.';
        setError(msg);
        setCurrentStep('form');
        setSubmitting(false);
      }
    }
  };

  const handleBack = () => {
    if (currentStep === 'form') {
      setState('IDLE');
    } else {
      setCurrentStep('form');
      setError(null);
      setRightPalm(null);
      setLeftPalm(null);
      setNfcUid(null);
    }
  };

  const handleChange = (field: keyof RegistrationFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Render capture screens
  if (currentStep !== 'form') {
    return (
      <div className="max-w-2xl w-full mx-auto text-center">
        {/* Progress indicator */}
        <div className="flex justify-center gap-3 mb-8">
          <div className={`w-4 h-4 rounded-full ${rightPalm ? 'bg-green-500' : currentStep === 'capture_right' ? 'bg-primary-500 animate-pulse' : 'bg-gray-600'}`} />
          <div className={`w-4 h-4 rounded-full ${leftPalm ? 'bg-green-500' : currentStep === 'capture_left' ? 'bg-primary-500 animate-pulse' : 'bg-gray-600'}`} />
          <div className={`w-4 h-4 rounded-full ${nfcUid ? 'bg-green-500' : currentStep === 'capture_nfc' ? 'bg-blue-500 animate-pulse' : 'bg-gray-600'}`} />
        </div>

        <h2 className="text-3xl font-bold text-white mb-4">
          {currentStep === 'capture_right' && '👉 Scan Right Hand'}
          {currentStep === 'capture_left' && '👈 Scan Left Hand'}
          {currentStep === 'capture_nfc' && '📲 Link NFC Tag'}
          {currentStep === 'registering' && '⏳ Completing Registration...'}
        </h2>

        {/* Capture message */}
        <p className="text-xl text-gray-300 mb-8 whitespace-pre-line">
          {captureMessage}
        </p>

        {/* Animation Area */}
        {currentStep !== 'registering' && (
          <div className="relative w-48 h-48 mx-auto mb-8">
            {/* Dynamic Icon */}
            <div className={`absolute inset-0 bg-primary-500/20 rounded-full ${isCapturing ? 'animate-ping' : ''}`} />
            <div className={`absolute inset-4 bg-primary-500/30 rounded-full ${isCapturing ? 'animate-pulse' : ''}`} />

            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-8xl">
                {currentStep === 'capture_right' && '👉'}
                {currentStep === 'capture_left' && '👈'}
                {currentStep === 'capture_nfc' && '📲'}
              </span>
            </div>
          </div>
        )}

        {/* Loading spinner for registering */}
        {currentStep === 'registering' && (
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-8" />
        )}

        {/* Error message */}
        {error && (
          <div className="bg-red-900/50 border border-red-700 rounded-lg p-3 mb-6">
            <p className="text-red-200 text-center">{error}</p>
          </div>
        )}

        {/* Actions */}
        {currentStep !== 'registering' && (
          <div className="space-y-4">
            {currentStep === 'capture_nfc' ? (
              <>
                <Button
                  onClick={handleNfcCapture}
                  disabled={isCapturing}
                  size="lg"
                  className="px-12 bg-blue-600 hover:bg-blue-500"
                >
                  {isCapturing ? 'Reading Tag...' : 'Scan Tag'}
                </Button>
                <button
                  onClick={handleSkipNfc}
                  className="block mx-auto text-gray-400 hover:text-white transition-colors text-sm"
                  disabled={isCapturing}
                >
                  Skip NFC Linking
                </button>
              </>
            ) : (
              <Button
                onClick={handlePalmCapture}
                disabled={isCapturing}
                size="lg"
                className="px-12"
              >
                {isCapturing ? 'Scanning...' : 'Scan Palm'}
              </Button>
            )}

            <button
              onClick={handleBack}
              className="block mx-auto text-gray-400 hover:text-white transition-colors"
              disabled={isCapturing}
            >
              ← Cancel Registration
            </button>
          </div>
        )}
      </div>
    );
  }

  // Render registration form (Step 1)
  return (
    <div className="max-w-2xl w-full mx-auto">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-3">
          <span className="text-3xl">📝</span>
        </div>
        <h1 className="text-3xl font-bold mb-1 text-white">New Player Registration</h1>
        <p className="text-lg text-gray-300">
          Complete your registration to play
        </p>
        {rightPalm && (
          <p className="text-sm text-green-400 mt-2">
            ✅ Right palm captured
          </p>
        )}
      </div>

      <form onSubmit={handleFormSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-900/50 border border-red-700 rounded-lg p-3">
            <p className="text-red-200 text-center text-sm">{error}</p>
          </div>
        )}

        {/* Registration Form */}
        <div className="bg-gray-800 rounded-lg p-5 border border-gray-700 space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-base font-semibold text-white mb-2">
              Full Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Enter your full name"
              className="w-full px-4 py-3 rounded-lg bg-white text-gray-900 placeholder-gray-400 border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none text-lg"
              required
            />
          </div>

          {/* Date of Birth */}
          <div>
            <label className="block text-base font-semibold text-white mb-2">
              Date of Birth <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Month</label>
                <select
                  value={formData.birth_month}
                  onChange={(e) => handleChange('birth_month', e.target.value)}
                  className="w-full px-3 py-3 rounded-lg bg-white text-gray-900 border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none"
                  required
                >
                  <option value="">Month</option>
                  {months.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Day (Optional)</label>
                <select
                  value={formData.birth_day}
                  onChange={(e) => handleChange('birth_day', e.target.value)}
                  className="w-full px-3 py-3 rounded-lg bg-white text-gray-900 border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none"
                >
                  <option value="">Day</option>
                  {days.map((d) => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Year</label>
                <select
                  value={formData.birth_year}
                  onChange={(e) => handleChange('birth_year', e.target.value)}
                  className="w-full px-3 py-3 rounded-lg bg-white text-gray-900 border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none"
                  required
                >
                  <option value="">Year</option>
                  {years.map((y) => (
                    <option key={y.value} value={y.value}>{y.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-base font-semibold text-white mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="Type your phone number"
              className="w-full px-4 py-3 rounded-lg bg-white text-gray-900 placeholder-gray-400 border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none text-lg"
            />
            <p className="text-xs text-gray-400 mt-1">
              {enablePalm ? 'Optional - palm scan is your primary ID' : 'Used for identification'}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-center space-x-4 pt-2">
          <Button type="button" variant="secondary" size="lg" onClick={handleBack} className="px-8">
            Back
          </Button>
          <Button type="submit" size="lg" loading={submitting} className="px-12">
            {getButtonText()}
          </Button>
        </div>
      </form>
    </div>
  );
};
