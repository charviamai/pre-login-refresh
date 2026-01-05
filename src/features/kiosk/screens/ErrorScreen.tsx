import React from 'react';
import { useKiosk } from '../../../contexts/KioskContext';
import { Button } from '../../../shared/components/ui';

interface ErrorScreenProps {
  error: string | null;
}

export const ErrorScreen: React.FC<ErrorScreenProps> = ({ error }) => {
  const { reset } = useKiosk();

  const handleReset = () => {
    reset();
  };

  return (
    <div className="max-w-xl w-full text-center">
      <div className="mb-8">
        <div className="w-24 h-24 bg-red-900/50 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-red-700 animate-pulse">
          <svg
            className="w-12 h-12 text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h1 className="text-4xl font-bold mb-4 text-red-400">Oops! Something Went Wrong</h1>
        <p className="text-xl text-gray-300">We encountered an error</p>
      </div>

      <div className="bg-red-900/30 border-2 border-red-700 rounded-lg p-6 mb-8">
        <h3 className="font-semibold text-red-300 mb-2">Error Details:</h3>
        <p className="text-red-200 font-mono text-sm">
          {error || 'An unknown error occurred'}
        </p>
      </div>

      <div className="space-y-4">
        <Button onClick={handleReset} size="lg" fullWidth>
          Return to Start
        </Button>

        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <p className="text-sm text-gray-400">
            <strong className="text-white">Need help?</strong>
            <br />
            If this error persists, please contact a staff member for assistance.
          </p>
        </div>
      </div>
    </div>
  );
};
