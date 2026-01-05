import React, { useState, useEffect, useRef } from 'react';
import { useKiosk } from '../../../contexts/KioskContext';
import { palmBridgeService, palmApiService, PalmFeatures } from '../../../shared/services/palmBridge';
import { nfcBridgeService, nfcApiService } from '../../../shared/services/nfcBridge';

interface MatchedCustomer {
  id: string;
  name: string;
  matched_hand?: string;
  similarity_score?: number;
  method: 'PALM' | 'NFC' | 'PHONE';
}

type ScanMethod = 'PALM' | 'NFC' | 'PHONE';

export const IdleScreen: React.FC = () => {
  const {
    setState,
    config,
    setCurrentCustomer,
    setPendingPalmFeatures,
    identifyCustomer: identifyByPhone,
  } = useKiosk() as any;

  // Configuration - Read from shop settings (verification_palm_enabled, etc.)
  // Defaults to true if settings not available
  const enablePalm = config?.settings?.verification_palm_enabled !== false;
  const enableNFC = config?.settings?.verification_nfc_enabled !== false;
  const enablePhone = config?.settings?.verification_phone_enabled !== false;

  const [showOptions, setShowOptions] = useState(false); // New: controls whether to show method cards
  const [activeMethod, setActiveMethod] = useState<ScanMethod | null>(null);
  const [statusMessage, setStatusMessage] = useState('Select an option to play');
  const [isProcessing, setIsProcessing] = useState(false);

  // Hardware Status
  const [palmStatus, setPalmStatus] = useState<'checking' | 'ready' | 'error'>('checking');
  const [nfcStatus, setNfcStatus] = useState<'checking' | 'ready' | 'error'>('checking');

  // Phone Input
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState<string | null>(null);

  // Confirmation state
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [matchedCustomer, setMatchedCustomer] = useState<MatchedCustomer | null>(null);

  // Refs for canceling operations
  const isMounted = useRef(true);

  // Get shop name from config
  const shopName = config?.shop?.name || 'Shop';

  // Check hardware status on mount
  useEffect(() => {
    isMounted.current = true;
    checkHardwareStatus();
    const interval = setInterval(checkHardwareStatus, 10000);

    return () => {
      isMounted.current = false;
      clearInterval(interval);
    };
  }, []);

  const checkHardwareStatus = async () => {
    // Check Palm
    if (enablePalm) {
      try {
        const status = await palmBridgeService.getStatus();
        if (isMounted.current) {
          if (status.connected && status.deviceReady) {
            setPalmStatus('ready');
          } else {
            setPalmStatus('error');
          }
        }
      } catch (e) {
        if (isMounted.current) setPalmStatus('error');
      }
    }

    // Check NFC
    if (enableNFC) {
      // For NFC serial, we assume ready if no error, but we can't easily "ping" it without reading
      // We'll just assume ready for UI purposes unless a specific error occurred
      if (isMounted.current) setNfcStatus('ready');
    }
  };

  const handlePalmStart = async () => {
    if (palmStatus !== 'ready') {
      setStatusMessage('Palm scanner not ready');
      return;
    }

    setActiveMethod('PALM');
    setIsProcessing(true);
    setStatusMessage('🖐️ Place your palm on the scanner...');

    try {
      const captureResult = await palmBridgeService.capture();

      if (!isMounted.current) return;

      if (!captureResult.success || !captureResult.rgbFeature || !captureResult.irFeature) {
        setStatusMessage(`❌ ${captureResult.error || 'Capture failed. Try again.'}`);
        setTimeout(() => {
          if (isMounted.current) {
            setIsProcessing(false);
            setActiveMethod(null);
          }
        }, 2000);
        return;
      }

      setStatusMessage('Identifying...');

      const features: PalmFeatures = {
        rgbFeature: captureResult.rgbFeature,
        irFeature: captureResult.irFeature,
        timestamp: captureResult.timestamp,
      };

      // Identify
      const authToken = localStorage.getItem('device_token') || '';
      const identifyResult = await palmApiService.identify(features, authToken);

      if (!isMounted.current) return;

      if (identifyResult.matched && identifyResult.customer_id) {
        setMatchedCustomer({
          id: identifyResult.customer_id,
          name: identifyResult.customer_name || 'Unknown',
          matched_hand: identifyResult.matched_hand,
          similarity_score: identifyResult.similarity_score,
          method: 'PALM'
        });
        setShowConfirmation(true);
      } else {
        // New customer
        setStatusMessage('New player detected! Redirecting to registration...');
        setPendingPalmFeatures?.(features);
        setTimeout(() => setState('NEW_CUSTOMER'), 1500);
      }

    } catch (error: any) {

      setStatusMessage(`❌ ${error.message || 'Error occurred.'}`);
      setTimeout(() => {
        if (isMounted.current) {
          setIsProcessing(false);
          setActiveMethod(null);
        }
      }, 2000);
    }
  };

  const handleNFCStart = async () => {
    setActiveMethod('NFC');
    setIsProcessing(true);
    setStatusMessage('📲 Tap your NFC tag/card...');

    try {
      // Read NFC Tag
      // Timeout 15s to give user time to tap
      const readResult = await nfcBridgeService.verify(15000);

      if (!isMounted.current) return;

      if (!readResult.success || !readResult.nfc_uid) {
        setStatusMessage(`❌ ${readResult.error || 'NFC read failed.'}`);
        setTimeout(() => {
          if (isMounted.current) {
            setIsProcessing(false);
            setActiveMethod(null);
          }
        }, 2000);
        return;
      }

      setStatusMessage('Checking tag...');

      // Identify
      const authToken = localStorage.getItem('device_token') || '';
      const identifyResult = await nfcApiService.identify(readResult.nfc_uid, authToken);

      if (!isMounted.current) return;

      if (identifyResult.matched && identifyResult.customer_id) {
        setMatchedCustomer({
          id: identifyResult.customer_id,
          name: identifyResult.customer_name || 'Unknown',
          method: 'NFC'
        });
        setShowConfirmation(true);
      } else {
        // NFC not found - we CANNOT auto-register NFC without a customer. 
        // So we must tell them to register via other means or ask for phone? 
        // Requirement says: "Registration includes capturing both palms... and tagging NFC"
        // So if NFC is unknown, they are likely a new user.
        // But we need their demographics first. So we go to registration.
        // We can treat this NFC as a "pending NFC" to attach?
        // For now, simple flow: Go to registration.

        setStatusMessage('Tag not recognized. Redirecting to registration...');
        // Ideally we'd pass the nfc_uid to registration to avoid re-tap
        // But context doesn't have setPendingNfcUid yet. We'll skip that for this iteration
        // or maybe pass it via pendingPhone hack? No bad idea.

        setTimeout(() => setState('NEW_CUSTOMER'), 1500);
      }

    } catch (error: any) {

      setStatusMessage(`❌ ${error.message || 'Error occurred.'}`);
      setTimeout(() => {
        if (isMounted.current) {
          setIsProcessing(false);
          setActiveMethod(null);
        }
      }, 2000);
    }
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber || phoneNumber.length < 10) {
      setPhoneError('Please enter a valid phone number');
      return;
    }

    setPhoneError(null);
    setIsProcessing(true);
    setStatusMessage('Looking up account...');

    try {
      const result = await identifyByPhone(phoneNumber);
      // identifyByPhone in context handles state transition found/not-found
      // found -> CHECKING_ELIGIBILITY -> ELIGIBLE (not logic is slightly mixed in context)
      // If it throws, it means not found or error

      if (result && result.customer) {
        setMatchedCustomer({
          id: result.customer.id,
          name: result.customer.full_name || 'Unknown',
          method: 'PHONE'
        });
        setShowConfirmation(true);
      }

    } catch (error: any) {
      // Context sets state to NEW_CUSTOMER on 404
      // If we are here, something else might have happened or we need to handle UI
      // But likely context already switched state.

    }
  };

  const handleConfirmIdentity = () => {
    if (matchedCustomer) {
      setCurrentCustomer?.(matchedCustomer);
      setShowConfirmation(false);
      setState('EXISTING_CUSTOMER');
    }
  };

  const handleNotMe = () => {
    setShowConfirmation(false);
    setMatchedCustomer(null);
    setIsProcessing(false);
    setActiveMethod(null);
    setState('NEW_CUSTOMER');
  };

  const handleCancel = () => {
    setIsProcessing(false);
    setActiveMethod(null);
    setShowOptions(false); // Return to TAP TO PLAY screen
    setStatusMessage('Select an option to play');
    setPhoneNumber('');
  };

  // Render Active Process
  const renderActiveProcess = () => (
    <div className="w-full max-w-lg bg-gray-800 rounded-3xl p-8 border border-gray-700 shadow-2xl relative">
      <button
        onClick={handleCancel}
        className="absolute top-4 right-4 text-gray-400 hover:text-white"
      >
        ✕
      </button>

      <div className="text-center">
        {activeMethod === 'PALM' && (
          <div className="text-8xl mb-6 animate-pulse">🖐️</div>
        )}
        {activeMethod === 'NFC' && (
          <div className="text-8xl mb-6 animate-pulse">📲</div>
        )}
        {activeMethod === 'PHONE' && (
          <div className="mb-6">
            <div className="text-6xl mb-4">⌨️</div>
            <form onSubmit={handlePhoneSubmit} className="space-y-4">
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="(555) 555-5555"
                className="w-full px-6 py-4 bg-gray-900 border border-gray-600 rounded-xl text-2xl text-white text-center focus:outline-none focus:border-primary-500"
                autoFocus
              />
              {phoneError && <p className="text-red-400 text-sm">{phoneError}</p>}
              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-4 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-xl font-bold transition-colors"
              >
                {isProcessing ? 'Checking...' : 'Continue'}
              </button>
            </form>
          </div>
        )}

        {activeMethod !== 'PHONE' && (
          <>
            <h3 className="text-2xl font-bold text-white mb-2">{statusMessage}</h3>
            <p className="text-gray-400">Please wait while we verify your identity...</p>
          </>
        )}
      </div>
    </div>
  );

  // Main Render
  if (showConfirmation && matchedCustomer) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center px-8">
        <div className="bg-gray-800 rounded-2xl p-8 max-w-lg w-full border border-gray-700 shadow-2xl text-center">
          <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">✓</span>
          </div>

          <h2 className="text-3xl font-bold text-white mb-2">
            Welcome Back!
          </h2>
          <p className="text-gray-400 mb-6">
            Is this you?
          </p>

          <div className="bg-gray-900 rounded-xl p-6 mb-6">
            <p className="text-4xl font-bold text-primary-400 mb-2">
              {matchedCustomer.name}
            </p>
            {matchedCustomer.method === 'PALM' && (
              <p className="text-sm text-gray-500">
                Match: {Math.round((matchedCustomer.similarity_score || 0) * 100)}% • {matchedCustomer.matched_hand} hand
              </p>
            )}
          </div>

          <div className="flex gap-4 justify-center">
            <button
              onClick={handleNotMe}
              className="px-8 py-4 bg-gray-700 hover:bg-gray-600 text-white rounded-xl text-lg font-semibold transition-all"
            >
              Not Me
            </button>
            <button
              onClick={handleConfirmIdentity}
              className="px-8 py-4 bg-green-600 hover:bg-green-500 text-white rounded-xl text-lg font-semibold transition-all"
            >
              Yes, That's Me
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center px-8">
      <div className="text-center w-full max-w-6xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold mb-6 text-white">
          Welcome to {shopName}
        </h1>
        <p className="text-xl md:text-2xl text-blue-400 mb-12">
          Check your eligibility to play promotional game today!
        </p>

        {/* Step 1: Initial TAP TO PLAY screen */}
        {!showOptions && !activeMethod && (
          <>
            {/* Flow Steps - Simple Text */}
            <div className="flex items-center justify-center gap-4 mb-12 text-xl text-gray-300">
              <span className="text-blue-400 font-semibold">Play</span>
              <span className="text-gray-500">→</span>
              <span className="text-blue-400 font-semibold">Win</span>
              <span className="text-gray-500">→</span>
              <span className="text-blue-400 font-semibold">Redeem</span>
            </div>

            {/* Tap to Play Button */}
            <button
              onClick={() => setShowOptions(true)}
              className="bg-blue-600 hover:bg-blue-500 text-white text-3xl font-bold py-6 px-16 rounded-full transition-all transform hover:scale-105 shadow-lg shadow-blue-600/30 mb-10"
            >
              TAP TO PLAY
            </button>

            {/* Disclaimer */}
            <p className="text-gray-400 text-sm max-w-xl mx-auto">
              <span className="font-semibold text-gray-300">Disclaimer</span> - Must be at least 21 years or older to play.
            </p>
          </>
        )}

        {/* Step 2: Method Selection Cards */}
        {showOptions && !activeMethod && (
          <div className="flex justify-center w-full">
            <div className="flex flex-col md:flex-row gap-6 justify-center items-center w-full max-w-4xl">
              {enablePalm && (
                <button
                  onClick={handlePalmStart}
                  disabled={palmStatus !== 'ready'}
                  className={`group flex flex-col items-center justify-center p-8 rounded-2xl w-56 h-56 transition-all duration-300 transform hover:scale-105 shadow-xl border-2 ${palmStatus === 'ready'
                    ? 'bg-gray-800/90 hover:bg-blue-600 text-white border-gray-600 hover:border-blue-400'
                    : 'bg-gray-800/50 text-gray-500 cursor-not-allowed opacity-60 border-gray-700'
                    }`}
                >
                  {/* Palm/Fingerprint Icon */}
                  <div className="w-20 h-20 mb-4 flex items-center justify-center">
                    <svg viewBox="0 0 64 64" className="w-16 h-16 text-blue-400 group-hover:text-white transition-colors">
                      <defs>
                        <linearGradient id="palmGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#60A5FA" />
                          <stop offset="100%" stopColor="#3B82F6" />
                        </linearGradient>
                      </defs>
                      {/* Palm outline */}
                      <path d="M32 4C18.745 4 8 14.745 8 28v8c0 13.255 10.745 24 24 24s24-10.745 24-24v-8C56 14.745 45.255 4 32 4z"
                        fill="none" stroke="currentColor" strokeWidth="2" opacity="0.3" />
                      {/* Fingerprint lines */}
                      <path d="M20 28c0-6.627 5.373-12 12-12s12 5.373 12 12" fill="none" stroke="currentColor" strokeWidth="2" />
                      <path d="M24 28c0-4.418 3.582-8 8-8s8 3.582 8 8" fill="none" stroke="currentColor" strokeWidth="2" />
                      <path d="M28 28c0-2.209 1.791-4 4-4s4 1.791 4 4" fill="none" stroke="currentColor" strokeWidth="2" />
                      <path d="M32 28v16" fill="none" stroke="currentColor" strokeWidth="2" />
                      <path d="M26 32c0 3.314 2.686 6 6 6s6-2.686 6-6" fill="none" stroke="currentColor" strokeWidth="2" />
                      <path d="M22 36c0 5.523 4.477 10 10 10s10-4.477 10-10" fill="none" stroke="currentColor" strokeWidth="2" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold">Palm Scan</h3>
                  <p className="mt-2 text-sm text-gray-400 group-hover:text-blue-100 transition-colors">Fastest & Secure</p>
                </button>
              )}

              {enableNFC && (
                <button
                  onClick={handleNFCStart}
                  disabled={nfcStatus !== 'ready'}
                  className={`group flex flex-col items-center justify-center p-8 rounded-2xl w-56 h-56 transition-all duration-300 transform hover:scale-105 shadow-xl border-2 ${nfcStatus === 'ready'
                    ? 'bg-gray-800/90 hover:bg-blue-600 text-white border-gray-600 hover:border-blue-400'
                    : 'bg-gray-800/50 text-gray-500 cursor-not-allowed opacity-60 border-gray-700'
                    }`}
                >
                  {/* NFC Tap Card Icon */}
                  <div className="w-20 h-20 mb-4 flex items-center justify-center">
                    <svg viewBox="0 0 64 64" className="w-16 h-16 text-blue-400 group-hover:text-white transition-colors">
                      {/* Card base */}
                      <rect x="8" y="20" width="36" height="28" rx="4" fill="currentColor" opacity="0.3" />
                      <rect x="8" y="20" width="36" height="28" rx="4" fill="none" stroke="currentColor" strokeWidth="2" />
                      {/* Card chip */}
                      <rect x="14" y="28" width="10" height="8" rx="1" fill="currentColor" opacity="0.5" />
                      {/* NFC waves */}
                      <path d="M48 24c4 4 4 12 0 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      <path d="M52 20c6 6 6 18 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      <path d="M56 16c8 8 8 24 0 32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold">Tap Card</h3>
                  <p className="mt-2 text-sm text-gray-400 group-hover:text-blue-100 transition-colors">NFC Tag / Phone</p>
                </button>
              )}

              {enablePhone && (
                <button
                  onClick={() => { setActiveMethod('PHONE'); setStatusMessage('Enter your phone number'); }}
                  className="group flex flex-col items-center justify-center p-8 rounded-2xl w-56 h-56 bg-gray-800/90 hover:bg-blue-600 text-white transition-all duration-300 transform hover:scale-105 shadow-xl border-2 border-gray-600 hover:border-blue-400"
                >
                  {/* Phone with Keypad Icon */}
                  <div className="w-20 h-20 mb-4 flex items-center justify-center">
                    <svg viewBox="0 0 64 64" className="w-16 h-16 text-blue-400 group-hover:text-white transition-colors">
                      {/* Phone body */}
                      <rect x="16" y="4" width="32" height="56" rx="4" fill="currentColor" opacity="0.3" />
                      <rect x="16" y="4" width="32" height="56" rx="4" fill="none" stroke="currentColor" strokeWidth="2" />
                      {/* Screen */}
                      <rect x="20" y="10" width="24" height="36" rx="2" fill="currentColor" opacity="0.2" />
                      {/* Keypad dots */}
                      <circle cx="26" cy="18" r="2" fill="currentColor" />
                      <circle cx="32" cy="18" r="2" fill="currentColor" />
                      <circle cx="38" cy="18" r="2" fill="currentColor" />
                      <circle cx="26" cy="26" r="2" fill="currentColor" />
                      <circle cx="32" cy="26" r="2" fill="currentColor" />
                      <circle cx="38" cy="26" r="2" fill="currentColor" />
                      <circle cx="26" cy="34" r="2" fill="currentColor" />
                      <circle cx="32" cy="34" r="2" fill="currentColor" />
                      <circle cx="38" cy="34" r="2" fill="currentColor" />
                      <circle cx="32" cy="42" r="2" fill="currentColor" />
                      {/* Home button */}
                      <circle cx="32" cy="54" r="3" fill="none" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold">Phone Number</h3>
                  <p className="mt-2 text-sm text-gray-400 group-hover:text-blue-100 transition-colors">Manual Entry</p>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Active Process (scanning/input) */}
        {activeMethod && (
          <div className="flex justify-center w-full">
            {renderActiveProcess()}
          </div>
        )}

        {/* Back button when showing options */}
        {showOptions && !activeMethod && (
          <button
            onClick={() => setShowOptions(false)}
            className="mt-10 text-gray-400 hover:text-white transition-colors text-lg"
          >
            ← Back
          </button>
        )}

        {/* Disclaimer for method selection */}
        {showOptions && !activeMethod && (
          <p className="mt-8 text-gray-400 text-sm max-w-xl mx-auto">
            <span className="font-semibold text-gray-300">Disclaimer</span> - Must be at least 21 years or older to play.
          </p>
        )}
      </div>
    </div>
  );
};
