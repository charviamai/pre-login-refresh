import React from 'react';
import { useKiosk } from '../../../contexts/KioskContext';
import type { GameMode } from '../../../shared/types';

export const ModeSelectionScreen: React.FC = () => {
  const { selectMode, currentCustomer, config, reset } = useKiosk();

  // Get play type from shop settings (enable_spin_promotion, enable_match_promotion)
  const showSpin = config?.settings?.enable_spin_promotion !== false;
  const showMatch = config?.settings?.enable_match_promotion !== false;

  const handleSelectMode = (mode: GameMode) => {
    selectMode(mode);
  };

  // If only one mode, auto-select it (only run once on mount)
  React.useEffect(() => {
    if (showSpin && !showMatch) {
      handleSelectMode('SPIN');
    } else if (showMatch && !showSpin) {
      handleSelectMode('MATCH');
    }
  }, []); // Only run on mount

  return (
    <div className="w-full h-full flex flex-col items-center justify-center">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2 text-white">Choose Your Game!</h1>
        <p className="text-xl text-gray-300">
          Hi {currentCustomer?.name_first}, select a game mode to play
        </p>
      </div>

      {/* Game Selection */}
      <div className={`grid ${showSpin && showMatch ? 'grid-cols-2' : 'grid-cols-1'} gap-6 max-w-3xl w-full`}>
        {/* SPIN Mode */}
        {showSpin && (
          <button
            onClick={() => handleSelectMode('SPIN')}
            className="group bg-gradient-to-br from-purple-900 to-purple-700 hover:from-purple-800 hover:to-purple-600 rounded-2xl p-6 border-4 border-purple-500 hover:border-purple-400 transition-all transform hover:scale-105"
          >
            <div className="text-center">
              <div className="w-20 h-20 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:animate-spin">
                <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>

              <h2 className="text-3xl font-bold mb-2">SPIN</h2>
              <p className="text-purple-200 mb-4">Spin the wheel to win!</p>

              <div className="bg-purple-800/50 rounded-lg p-3 border border-purple-400 text-left">
                <ul className="text-sm text-purple-100 space-y-1">
                  <li>• Spin the roulette wheel</li>
                  <li>• Win where the pointer lands</li>
                  <li>• Instant prizes!</li>
                </ul>
              </div>

              <div className="mt-4">
                <span className="inline-block bg-purple-500 text-white px-6 py-2 rounded-full font-bold group-hover:bg-purple-400">
                  Play SPIN →
                </span>
              </div>
            </div>
          </button>
        )}

        {/* MATCH Mode */}
        {showMatch && (
          <button
            onClick={() => handleSelectMode('MATCH')}
            className="group bg-gradient-to-br from-green-900 to-green-700 hover:from-green-800 hover:to-green-600 rounded-2xl p-6 border-4 border-green-500 hover:border-green-400 transition-all transform hover:scale-105"
          >
            <div className="text-center">
              <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:animate-pulse">
                <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>

              <h2 className="text-3xl font-bold mb-2">MATCH</h2>
              <p className="text-green-200 mb-4">Select amount to match!</p>

              <div className="bg-green-800/50 rounded-lg p-3 border border-green-400 text-left">
                <ul className="text-sm text-green-100 space-y-1">
                  <li>• Select $10, $20, $30 or $40</li>
                  <li>• Print your match receipt</li>
                  <li>• Redeem with employee!</li>
                </ul>
              </div>

              <div className="mt-4">
                <span className="inline-block bg-green-500 text-white px-6 py-2 rounded-full font-bold group-hover:bg-green-400">
                  Play MATCH →
                </span>
              </div>
            </div>
          </button>
        )}
      </div>

      {/* Back Button */}
      <div className="mt-6">
        <button
          onClick={() => reset()}
          className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-all"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Cancel & Start Over
        </button>
      </div>
    </div>
  );
};
