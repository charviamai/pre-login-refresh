import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useKiosk } from '../../../contexts/KioskContext';
import { Button, Input } from '../../../shared/components/ui';

type ScanStatus = 'countdown' | 'scanning' | 'success' | 'not_found' | 'error';

export const IdentificationScreen: React.FC = () => {
  const { identifyCustomer, config, setState, currentCustomer, checkEligibility } = useKiosk();
  const [countdown, setCountdown] = useState(5);
  const [scanStatus, setScanStatus] = useState<ScanStatus>('countdown');
  const [showPhoneLookup, setShowPhoneLookup] = useState(false);
  const [phone, setPhone] = useState('');
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [_capturedImage, setCapturedImage] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Get identification type from config
  const identificationType = config?.device?.identification_type || 'FACE';
  const isFace = identificationType === 'FACE';

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraError(null);
    } catch (err) {

      setCameraError('Unable to access camera. Please check permissions.');
    }
  }, []);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  // Capture image from video
  const captureImage = useCallback((): string | null => {
    if (!videoRef.current || !canvasRef.current) return null;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      return canvas.toDataURL('image/jpeg', 0.8);
    }
    return null;
  }, []);

  // Start scanning after countdown
  useEffect(() => {
    if (showPhoneLookup) return;

    if (countdown > 0 && scanStatus === 'countdown') {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && scanStatus === 'countdown') {
      setScanStatus('scanning');
      performScan();
    }
  }, [countdown, scanStatus, showPhoneLookup]);

  // Initialize camera on mount
  useEffect(() => {
    if (!showPhoneLookup && isFace) {
      startCamera();
    }
    return () => stopCamera();
  }, [showPhoneLookup, isFace, startCamera, stopCamera]);

  const performScan = async () => {
    try {
      // Capture image if using face recognition
      let imageData: string | undefined;
      if (isFace && videoRef.current) {
        imageData = captureImage() || undefined;
        if (imageData) {
          setCapturedImage(imageData);
        } else {
          setScanStatus('error');
          return;
        }
      } else if (!isFace) {
        // For palm, we'd need palm reader integration
        // For now, simulate
        imageData = undefined;
      }

      if (!imageData && isFace) {
        setScanStatus('error');
        return;
      }

      // Simulate a brief scanning delay for UX
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Call identify customer
      const result = await identifyCustomer(imageData || '');

      // Handle result
      if (result?.existing_customer) {
        // Customer found - show success
        setScanStatus('success');
        // After showing success, proceed to eligibility check
        setTimeout(async () => {
          setState('CHECKING_ELIGIBILITY');
          await checkEligibility(result.existing_customer.id);
        }, 2000);
      } else if (result?.temp_biometric_token) {
        // No customer found - show not found message
        setScanStatus('not_found');
        // After showing message, proceed to registration
        setTimeout(() => {
          setState('NEW_CUSTOMER');
        }, 2000);
      } else {
        setScanStatus('not_found');
      }

    } catch (err: any) {

      const errorMsg = err.error || err.message || '';
      if (errorMsg.includes('not found') || errorMsg.includes('No customer') || errorMsg.includes('Customer not found')) {
        setScanStatus('not_found');
      } else {
        setScanStatus('error');
      }
    }
  };

  const handleCancel = () => {
    stopCamera();
    setState('IDLE');
  };

  const handlePhoneLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) {
      setLookupError('Please enter a phone number');
      return;
    }

    setSubmitting(true);
    setLookupError(null);

    try {
      await identifyCustomer(phone.trim());
      setScanStatus('success');
    } catch (err: any) {
      setLookupError(err.error || err.message || 'Lookup failed. Please try again.');
      setSubmitting(false);
    }
  };

  const handleSwitchToPhone = () => {
    stopCamera();
    setShowPhoneLookup(true);
    setScanStatus('countdown');
  };

  const handleSwitchToBiometric = () => {
    setShowPhoneLookup(false);
    setCountdown(5);
    setScanStatus('countdown');
    setCapturedImage(null);
  };

  const handleRetry = () => {
    setCountdown(3);
    setScanStatus('countdown');
    setCapturedImage(null);
  };

  const handleProceedToPlay = () => {
    setState('ELIGIBLE');
  };

  const handleProceedToRegister = () => {
    setState('NEW_CUSTOMER');
  };

  // Success state - show green indicator and proceed banner
  if (scanStatus === 'success' && currentCustomer) {
    return (
      <div className="max-w-2xl w-full text-center">
        <div className="mb-8">
          {/* Green success icon */}
          <div className="w-32 h-32 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
            <svg className="w-16 h-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-green-400 mb-4">Welcome Back!</h1>
          <p className="text-2xl text-white mb-2">{currentCustomer.name_first} {currentCustomer.name_last}</p>
          <p className="text-xl text-gray-300">You've been identified successfully</p>
        </div>

        {/* Proceed to Play Banner */}
        <div className="bg-gradient-to-r from-green-600 to-green-500 rounded-xl p-6 mb-8 shadow-lg">
          <div className="flex items-center justify-center space-x-4">
            <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-left">
              <h2 className="text-2xl font-bold text-white">Ready to Play!</h2>
              <p className="text-green-100">Click below to start your game</p>
            </div>
          </div>
        </div>

        <Button size="lg" onClick={handleProceedToPlay} className="px-12 py-4 text-xl bg-green-600 hover:bg-green-700">
          Let's Play!
        </Button>
      </div>
    );
  }

  // Not found state - offer to register
  if (scanStatus === 'not_found') {
    return (
      <div className="max-w-2xl w-full text-center">
        <div className="mb-8">
          <div className="w-24 h-24 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-yellow-400 mb-4">Not Found</h1>
          <p className="text-xl text-gray-300 mb-6">
            We couldn't find you in our system. Would you like to register?
          </p>
        </div>

        <div className="flex space-x-4 justify-center">
          <Button variant="secondary" size="lg" onClick={handleRetry}>
            Try Again
          </Button>
          <Button size="lg" onClick={handleProceedToRegister} className="bg-yellow-600 hover:bg-yellow-700">
            Register Now
          </Button>
        </div>

        <div className="mt-6">
          <Button variant="ghost" onClick={handleCancel}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  // Phone lookup mode
  if (showPhoneLookup) {
    return (
      <div className="max-w-xl w-full text-center">
        <div className="mb-8">
          <div className="w-20 h-20 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold mb-4">Phone Lookup</h1>
          <p className="text-xl text-gray-300">Enter your phone number to find your account</p>
        </div>

        <form onSubmit={handlePhoneLookup} className="space-y-6">
          {lookupError && (
            <div className="bg-red-900/50 border border-red-700 rounded-lg p-4">
              <p className="text-red-200">{lookupError}</p>
            </div>
          )}

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <Input
              type="tel"
              label="Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter your phone number"
              helperText="Enter the phone number you registered with"
              fullWidth
              autoFocus
            />
          </div>

          <div className="flex space-x-4">
            <Button type="button" variant="secondary" size="lg" onClick={handleSwitchToBiometric} className="flex-1">
              Use {isFace ? 'Face' : 'Palm'} Instead
            </Button>
            <Button type="submit" size="lg" loading={submitting} className="flex-1">
              Find Account
            </Button>
          </div>
        </form>

        <div className="mt-6">
          <Button variant="ghost" onClick={handleCancel}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  // Camera/Biometric scan mode
  return (
    <div className="max-w-2xl w-full text-center">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Customer Identification</h1>
        <p className="text-xl text-gray-300">
          {countdown > 0
            ? `${isFace ? 'Please look at the camera' : 'Place your palm on the reader'} in ${countdown}...`
            : scanStatus === 'scanning'
              ? 'Scanning...'
              : scanStatus === 'error'
                ? 'Scan failed'
                : 'Get ready...'}
        </p>
      </div>

      {/* Camera/Biometric Preview */}
      <div className={`relative rounded-lg border-4 overflow-hidden mb-8 ${scanStatus === 'error' ? 'border-red-500 bg-red-900/20' : 'border-primary-500 bg-gray-800'
        }`}>
        <div className="aspect-video flex items-center justify-center relative">
          {/* Camera Error */}
          {cameraError && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80 z-10">
              <div className="text-center p-6">
                <svg className="w-16 h-16 mx-auto mb-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-red-400">{cameraError}</p>
                <Button variant="secondary" size="sm" onClick={startCamera} className="mt-4">
                  Retry Camera
                </Button>
              </div>
            </div>
          )}

          {/* Live Video Feed */}
          {isFace && !cameraError && (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${countdown > 0 ? 'opacity-50' : ''}`}
              style={{ transform: 'scaleX(-1)' }} // Mirror the video
            />
          )}

          {/* Canvas for capturing (hidden) */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Countdown Overlay */}
          {countdown > 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900/60 z-20">
              <div className="text-center">
                <div className="text-9xl font-bold text-primary-500 mb-4 animate-pulse">{countdown}</div>
                <p className="text-xl text-gray-300">Get ready...</p>
              </div>
            </div>
          )}

          {/* Palm Reader Placeholder (when not using face) */}
          {!isFace && countdown === 0 && (
            <div className="flex items-center justify-center">
              <div className="w-64 h-80 border-4 border-primary-500 rounded-lg relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg
                    className={`w-32 h-32 ${scanStatus === 'scanning' ? 'animate-pulse text-primary-400' : 'text-gray-500'}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
                  </svg>
                </div>
              </div>
            </div>
          )}

          {/* Face Detection Frame Overlay */}
          {isFace && countdown === 0 && !cameraError && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-48 h-64 border-4 border-primary-400 rounded-full relative">
                {/* Corner Brackets */}
                <div className="absolute -top-2 -left-2 w-8 h-8 border-t-4 border-l-4 border-primary-400 rounded-tl-lg" />
                <div className="absolute -top-2 -right-2 w-8 h-8 border-t-4 border-r-4 border-primary-400 rounded-tr-lg" />
                <div className="absolute -bottom-2 -left-2 w-8 h-8 border-b-4 border-l-4 border-primary-400 rounded-bl-lg" />
                <div className="absolute -bottom-2 -right-2 w-8 h-8 border-b-4 border-r-4 border-primary-400 rounded-br-lg" />

                {/* Scanning Line */}
                {scanStatus === 'scanning' && (
                  <div className="absolute inset-0 overflow-hidden rounded-full">
                    <div className="w-full h-1 bg-green-400 animate-scan" />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status Text */}
      <div className="space-y-4">
        {scanStatus === 'scanning' && (
          <div className="flex items-center justify-center space-x-2 text-green-400">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-400" />
            <span className="font-semibold">Processing {isFace ? 'face recognition' : 'palm scan'}...</span>
          </div>
        )}

        {scanStatus === 'error' && (
          <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 mb-4">
            <p className="text-red-200">Scan failed. Please try again.</p>
          </div>
        )}

        <div className="flex space-x-4 justify-center">
          {scanStatus === 'error' && (
            <Button variant="primary" onClick={handleRetry}>
              Try Again
            </Button>
          )}
          <Button variant="secondary" onClick={handleSwitchToPhone}>
            Use Phone Number
          </Button>
          <Button variant="ghost" onClick={handleCancel}>
            Cancel
          </Button>
        </div>
      </div>

      <div className="mt-8 p-4 bg-gray-800 rounded-lg border border-gray-700">
        <p className="text-sm text-gray-400">
          <strong className="text-white">Privacy Notice:</strong> Your biometric data is used
          solely for customer identification and is securely stored in compliance with applicable
          privacy laws.
        </p>
      </div>

      <style>{`
        @keyframes scan {
          0% { transform: translateY(0); }
          50% { transform: translateY(256px); }
          100% { transform: translateY(0); }
        }
        .animate-scan {
          animation: scan 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};
