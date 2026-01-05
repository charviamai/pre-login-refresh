import React, { useState, useMemo, useEffect } from 'react';
import { useKiosk } from '../../../contexts/KioskContext';

interface CooldownInfo {
  nextAvailableAt: string;
  cooldownRemainingSeconds: number;
  lastTicketStatus: string | null;
  verificationRequired: boolean;
}

export const MatchScreen: React.FC = () => {
  const { currentCustomer, config, setState, setMatchAmount, performMatch } = useKiosk();
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState<number>(0);
  const [isCustomSelected, setIsCustomSelected] = useState(false);
  const [cooldownInfo, setCooldownInfo] = useState<CooldownInfo | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState<number>(0);
  const [returnCountdown, setReturnCountdown] = useState<number>(6);

  // Get match config from shop settings - use backend values only
  const matchConfig = useMemo(() => {
    const promotionContent = config?.promotion;
    // Debug: log what we're receiving from backend



    return {
      amounts: promotionContent?.match_items || [],
      allowCustom: promotionContent?.match_allow_custom_amount ?? false,
      multiplier: promotionContent?.match_custom_multiplier ?? 5,
      customMin: promotionContent?.match_custom_amount_min ?? 5,
      customMax: promotionContent?.match_custom_amount_max ?? 500,
      verificationRequired: promotionContent?.match_verification_required ?? true,
    };
  }, [config]);

  // Check eligibility (cooldown) when customer arrives at Match screen
  const [isCheckingEligibility, setIsCheckingEligibility] = useState(true);

  useEffect(() => {
    const checkEligibility = async () => {
      if (!currentCustomer?.id) {
        setIsCheckingEligibility(false);
        return;
      }

      try {
        // Import API function inline to avoid circular dependency
        const { kioskApi } = await import('../../../shared/utils/api-service');
        const result = await kioskApi.matchEligibility(currentCustomer.id);



        if (result.can_play === false) {
          // Customer is in cooldown - show cooldown screen immediately
          setCooldownInfo({
            nextAvailableAt: result.next_available_at || '',
            cooldownRemainingSeconds: result.cooldown_remaining_seconds || 0,
            lastTicketStatus: result.last_ticket_status ?? null,
            verificationRequired: result.verification_required ?? true,
          });
          setCooldownSeconds(result.cooldown_remaining_seconds || 0);
          setReturnCountdown(15); // Give more time to read cooldown info
        }
      } catch (err) {
        console.error('Match eligibility check failed:', err);
      } finally {
        setIsCheckingEligibility(false);
      }
    };

    checkEligibility();
  }, [currentCustomer?.id]);

  // Initialize custom amount to min
  useEffect(() => {
    if (matchConfig.allowCustom && customAmount === 0) {
      setCustomAmount(matchConfig.customMin);
    }
  }, [matchConfig, customAmount]);

  // Cooldown timer countdown
  useEffect(() => {
    if (cooldownInfo && cooldownSeconds > 0) {
      const timer = setTimeout(() => setCooldownSeconds(cooldownSeconds - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldownInfo, cooldownSeconds]);

  // Auto-return to home countdown
  useEffect(() => {
    if (cooldownInfo && returnCountdown > 0) {
      const timer = setTimeout(() => setReturnCountdown(returnCountdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (cooldownInfo && returnCountdown === 0) {
      setState('IDLE');
    }
  }, [cooldownInfo, returnCountdown, setState]);

  const handleSelectAmount = (amount: number) => {
    setSelectedAmount(amount);
    setIsCustomSelected(false);
  };

  const handleSelectCustom = () => {
    setIsCustomSelected(true);
    setSelectedAmount(null);
  };

  const handleCustomIncrement = () => {
    const newAmount = customAmount + matchConfig.multiplier;
    if (newAmount <= matchConfig.customMax) {
      setCustomAmount(newAmount);
    }
  };

  const handleCustomDecrement = () => {
    const newAmount = customAmount - matchConfig.multiplier;
    if (newAmount >= matchConfig.customMin) {
      setCustomAmount(newAmount);
    }
  };

  const handleConfirm = async () => {
    const amountToUse = isCustomSelected ? customAmount : selectedAmount;
    if (!amountToUse) return;

    setMatchAmount(amountToUse);
    try {
      const result = await performMatch(amountToUse);
      if (result && result.cooldown) {
        // Show cooldown screen
        setCooldownInfo({
          nextAvailableAt: result.nextAvailableAt || '',
          cooldownRemainingSeconds: result.cooldownRemainingSeconds || 0,
          lastTicketStatus: result.lastTicketStatus ?? null,
          verificationRequired: result.verificationRequired ?? true,
        });
        setCooldownSeconds(result.cooldownRemainingSeconds || 0);
        setReturnCountdown(6);
      }
    } catch {
      console.error('Match attempt failed');
      setState('PRINTING_TICKET'); // Fallback? Or maybe should fail gracefully? 
      // Existing code kept 'PRINTING_TICKET', so I assume that's intended but I will log.
    }
  };

  const handleBack = () => {
    setState('MODE_SELECTION');
  };

  // Format seconds to HH:MM:SS
  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const finalAmount = isCustomSelected ? customAmount : selectedAmount;

  // Loading Screen while checking eligibility
  if (isCheckingEligibility) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="bg-gray-800 rounded-2xl p-8 max-w-md text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
          <p className="text-gray-300 text-lg">Checking eligibility...</p>
        </div>
      </div>
    );
  }

  // Cooldown Screen
  if (cooldownInfo) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="bg-gray-800 rounded-2xl p-8 max-w-md text-center">
          <div className="w-20 h-20 bg-yellow-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          <h2 className="text-2xl font-bold text-yellow-400 mb-4">COOLDOWN ACTIVE</h2>

          <p className="text-gray-300 mb-4">You can play again in:</p>
          <p className="text-4xl font-mono font-bold text-white mb-6">{formatTime(cooldownSeconds)}</p>

          {cooldownInfo.lastTicketStatus === 'PENDING' && cooldownInfo.verificationRequired && (
            <div className="bg-yellow-900/50 border border-yellow-600 rounded-xl p-4 mb-6">
              <p className="text-yellow-300 font-semibold">Your last ticket is not redeemed</p>
              <p className="text-yellow-200 text-sm mt-1">Please see an employee</p>
            </div>
          )}

          <p className="text-gray-400 text-sm mb-6">Returning home in {returnCountdown}s...</p>

          <button
            onClick={() => setState('IDLE')}
            className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-8 rounded-xl transition-all"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (

    <div className="w-full h-full flex items-center">
      <div className="flex w-full gap-8">
        {/* Left side - Amount Selection */}
        <div className="flex-1 flex flex-col items-center justify-center">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-green-400">MATCH</h1>
            <p className="text-lg text-gray-300">Select your match amount</p>
            {currentCustomer && (
              <p className="text-sm text-gray-400 mt-1">
                Welcome, {currentCustomer.name_first}!
              </p>
            )}
          </div>

          {/* Amount Selection Grid */}
          <div className="grid grid-cols-2 gap-4 mb-4 w-full max-w-md">
            {matchConfig.amounts.map((amount: number) => (
              <button
                key={amount}
                onClick={() => handleSelectAmount(amount)}
                className={`
                  relative p-6 rounded-xl border-4 transition-all transform hover:scale-105
                  ${selectedAmount === amount && !isCustomSelected
                    ? 'bg-green-600 border-green-400 shadow-lg shadow-green-500/30'
                    : 'bg-gray-800 border-gray-600 hover:border-green-500 hover:bg-gray-700'
                  }
                `}
              >
                <span className="text-4xl font-bold text-white">${amount}</span>
                {selectedAmount === amount && !isCustomSelected && (
                  <div className="absolute top-2 right-2">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Custom Amount Section */}
          {matchConfig.allowCustom && (
            <div
              className={`w-full max-w-md rounded-xl p-4 border-4 transition-all ${isCustomSelected
                  ? 'bg-green-900/30 border-green-500'
                  : 'bg-gray-800/50 border-gray-600 hover:border-green-500'
                }`}
              onClick={handleSelectCustom}
            >
              <div className="text-center mb-3">
                <span className="text-sm text-gray-300">Custom Amount (multiples of {matchConfig.multiplier})</span>
              </div>
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={(e) => { e.stopPropagation(); handleCustomDecrement(); }}
                  className="w-12 h-12 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-bold text-lg"
                  disabled={customAmount <= matchConfig.customMin}
                >
                  -{matchConfig.multiplier}
                </button>
                <div className="bg-gray-700 rounded-lg px-6 py-3 min-w-[100px] text-center">
                  <span className="text-3xl font-bold text-green-400">${customAmount}</span>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleCustomIncrement(); }}
                  className="w-12 h-12 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-bold text-lg"
                  disabled={customAmount >= matchConfig.customMax}
                >
                  +{matchConfig.multiplier}
                </button>
              </div>
              <div className="text-xs text-gray-500 text-center mt-2">
                Min: ${matchConfig.customMin} • Max: ${matchConfig.customMax}
              </div>
            </div>
          )}

          {/* Selected Amount Display */}
          {finalAmount && (
            <div className="bg-gray-800 rounded-xl p-4 mb-4 border border-gray-700 w-full max-w-md mt-4">
              <div className="flex items-center justify-between">
                <span className="text-lg text-gray-300">Selected:</span>
                <span className="text-3xl font-bold text-green-400">${finalAmount}.00</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 w-full max-w-md">
            <button
              onClick={handleBack}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white text-lg font-semibold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>

            <button
              onClick={handleConfirm}
              disabled={!finalAmount}
              className={`
                flex-1 text-lg font-bold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2
                ${finalAmount
                  ? 'bg-green-600 hover:bg-green-500 text-white transform hover:scale-105'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }
              `}
            >
              Print Receipt
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Right side - Instructions */}
        <div className="w-80 flex flex-col justify-center">
          <div className="bg-gray-800/80 rounded-xl p-6 border border-gray-700">
            <h3 className="font-bold text-xl mb-4 text-green-400">How It Works</h3>
            <ul className="text-white space-y-3 text-base">
              <li className="flex items-start gap-2">
                <span className="text-green-400 font-bold">1.</span>
                Select your match amount
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 font-bold">2.</span>
                Click "Print Receipt"
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 font-bold">3.</span>
                Take your printed receipt
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 font-bold">4.</span>
                Show receipt to employee
              </li>
            </ul>
          </div>

          <div className="bg-green-900/30 rounded-xl p-5 border border-green-700 mt-4">
            <h3 className="font-bold text-lg mb-3 text-green-400">To Redeem</h3>
            <ul className="text-white space-y-2 text-sm">
              <li>• Take your printed receipt</li>
              <li>• Show it to an employee</li>
              <li>• Employee scans barcode</li>
              <li>• Receive your match amount!</li>
            </ul>
          </div>

          <div className="bg-blue-900/30 rounded-xl p-4 border border-blue-700 mt-4">
            <p className="text-blue-200 text-sm text-center">
              💡 Match amounts are added to your account balance
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
