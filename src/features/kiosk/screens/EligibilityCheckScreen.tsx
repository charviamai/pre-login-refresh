import React, { useEffect, useState } from 'react';
import { useKiosk } from '../../../contexts/KioskContext';

export const EligibilityCheckScreen: React.FC = () => {
  const { currentCustomer, eligibility, error, state, checkEligibility, setState } = useKiosk();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Trigger eligibility check for both EXISTING_CUSTOMER and CHECKING_ELIGIBILITY states
    if (currentCustomer && !eligibility && (state === 'CHECKING_ELIGIBILITY' || state === 'EXISTING_CUSTOMER')) {
      performEligibilityCheck();
    } else {
      setChecking(false);
    }
  }, [currentCustomer, state]);

  const performEligibilityCheck = async () => {
    if (!currentCustomer) {
      return;
    }
    setChecking(true);
    try {
      await checkEligibility(currentCustomer.id);
    } catch (err) {
      console.error('Eligibility check failed:', err);
    } finally {
      setChecking(false);
    }
  };

  // Show loading state
  if (checking || (!eligibility && !error)) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Checking Eligibility...</h1>
          <p className="text-gray-300">Verifying your account</p>
        </div>
      </div>
    );
  }

  // Show error if eligibility check failed
  if (error && !eligibility) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-red-900/50 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-red-700">
            <svg className="w-10 h-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-2 text-red-400">Eligibility Check Failed</h1>
          <p className="text-gray-300 mb-4">{error}</p>
          <button
            onClick={() => setState('IDLE')}
            className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-6 rounded-lg"
          >
            Start Over
          </button>
        </div>
      </div>
    );
  }

  if (!eligibility) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <p className="text-xl text-gray-400">No eligibility data available</p>
      </div>
    );
  }

  // Check if eligible
  const isEligible = eligibility.eligible;
  const reasons = eligibility.reason ? [eligibility.reason] : [];

  if (!isEligible) {
    const nextAtIso = eligibility.next_available_at;
    let waitMessage: string | null = null;
    if (nextAtIso) {
      const next = new Date(nextAtIso).getTime();
      const now = Date.now();
      const diffMs = Math.max(next - now, 0);
      const diffMinutesTotal = Math.ceil(diffMs / 60000);
      const hours = Math.floor(diffMinutesTotal / 60);
      const minutes = diffMinutesTotal % 60;
      waitMessage = hours > 0
        ? `Please wait ${hours} hour${hours !== 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''} to play again.`
        : `Please wait ${minutes} minute${minutes !== 1 ? 's' : ''} to play again.`;
    }
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-red-900/50 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-red-700">
            <svg className="w-10 h-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-2 text-red-400">Not Eligible</h1>
          <p className="text-gray-300 mb-4">{waitMessage || 'Sorry, you cannot play at this time'}</p>

          {reasons.length > 0 && (
            <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 mb-4">
              <p className="text-red-200">{reasons[0]}</p>
            </div>
          )}

          <button
            onClick={() => setState('IDLE')}
            className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-6 rounded-lg"
          >
            Start Over
          </button>
        </div>
      </div>
    );
  }

  // Success - eligible to play
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-green-900/50 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-green-500 animate-pulse">
          <svg className="w-10 h-10 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold mb-2 text-green-400">You're All Set!</h1>
        <p className="text-gray-300 mb-6">
          Welcome back, {currentCustomer?.name_first}!
        </p>

        <div className="bg-green-900/20 border border-green-700 rounded-lg p-4 mb-6">
          <div className="flex justify-around">
            <div>
              <p className="text-sm text-gray-400">Status</p>
              <p className="text-xl font-bold text-green-400">Verified</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Games Available</p>
              <p className="text-xl font-bold text-green-400">{eligibility.available_modes?.length || 0}</p>
            </div>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-center gap-4">
          <button
            onClick={() => setState('IDLE')}
            className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-6 rounded-lg flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <button
            onClick={() => setState('MODE_SELECTION')}
            className="bg-primary-600 hover:bg-primary-500 text-white font-semibold py-2 px-6 rounded-lg flex items-center gap-2"
          >
            Continue
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};
