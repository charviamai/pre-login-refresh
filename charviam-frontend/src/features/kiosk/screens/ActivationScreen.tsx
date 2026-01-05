import React, { useState } from 'react';
import { useKiosk } from '../../../contexts/KioskContext';
import { Button, Input } from '../../../shared/components/ui';

interface DeviceOption {
  id: string;
  name: string;
  shop_name: string;
  code: string;
}

export const ActivationScreen: React.FC = () => {
  const { state, activate, error: contextError } = useKiosk();
  const [accessCode, setAccessCode] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [deviceOptions, setDeviceOptions] = useState<DeviceOption[] | null>(null);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);

  const isActivating = state === 'ACTIVATING';
  const displayError = contextError || localError;

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!accessCode.trim()) {
      setLocalError('Please enter your employee access code');
      return;
    }

    try {
      const result = await activate(accessCode.trim(), selectedDeviceId || undefined);

      // Check if we need device selection
      if (result?.requires_device_selection && result.devices) {
        setDeviceOptions(result.devices);
        setLocalError(null);
      }
    } catch (err: unknown) {

      const apiError = err as { error?: string; message?: string };
      const errorMessage = apiError?.error || apiError?.message || 'Activation failed. Please check your access code.';
      setLocalError(errorMessage);
    }
  };

  const handleDeviceSelect = async (deviceId: string) => {
    setSelectedDeviceId(deviceId);
    setLocalError(null);

    try {
      await activate(accessCode.trim(), deviceId);
    } catch (err: unknown) {

      const apiError = err as { error?: string; message?: string };
      const errorMessage = apiError?.error || apiError?.message || 'Failed to activate device.';
      setLocalError(errorMessage);
    }
  };

  // Device selection screen
  if (deviceOptions && deviceOptions.length > 0) {
    return (
      <div className="max-w-md w-full mx-auto">
        <div className="text-center mb-8">
          <div className="w-24 h-24 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-12 h-12 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold mb-2">Select Device</h1>
          <p className="text-gray-400">
            You have access to multiple devices. Please select one:
          </p>
        </div>

        <div className="space-y-3">
          {deviceOptions.map((device) => (
            <button
              key={device.id}
              onClick={() => handleDeviceSelect(device.id)}
              disabled={isActivating}
              className="w-full p-4 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg text-left transition-colors disabled:opacity-50"
            >
              <div className="font-semibold text-lg text-white">{device.name}</div>
              <div className="text-sm text-gray-400">{device.shop_name}</div>
            </button>
          ))}
        </div>

        {displayError && (
          <div className="mt-4 p-3 bg-red-900/30 border border-red-500/50 rounded-md">
            <p className="text-red-400 text-sm text-center">{displayError}</p>
          </div>
        )}

        <button
          onClick={() => {
            setDeviceOptions(null);
            setSelectedDeviceId(null);
            setAccessCode('');
          }}
          className="mt-6 w-full text-gray-400 hover:text-white text-sm underline"
        >
          ← Back to login
        </button>
      </div>
    );
  }

  // Main activation screen
  return (
    <div className="max-w-md w-full mx-auto">
      <div className="text-center mb-8">
        <div className="w-24 h-24 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-12 h-12 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        </div>
        <h1 className="text-3xl font-bold mb-2">Employee Sign In</h1>
        <p className="text-gray-400">
          Enter access code to activate this kiosk
        </p>
      </div>

      <form onSubmit={handleActivate} className="space-y-4">
        <div>
          <Input
            label="Access Code"
            type="password"
            showPasswordToggle={true}
            value={accessCode}
            onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
            placeholder=" XXXXXX "
            disabled={isActivating}
            className="text-center text-2xl font-mono tracking-wider bg-white border-gray-300 text-black placeholder-gray-500"
            autoFocus
            fullWidth
          />
          <p className="text-xs text-gray-500 mt-1">
            Your personal 6-character access code from your employee profile
          </p>
        </div>

        {displayError && (
          <div className="p-3 bg-red-900/30 border border-red-500/50 rounded-md">
            <p className="text-red-400 text-sm text-center">{displayError}</p>
          </div>
        )}

        <Button
          type="submit"
          size="lg"
          loading={isActivating}
          disabled={!accessCode.trim()}
          fullWidth
        >
          {isActivating ? 'Signing In...' : 'Sign In'}
        </Button>
      </form>

      <p className="mt-8 text-sm text-gray-400 text-center">
        <span className="text-white font-semibold">Need help?</span>
        <br />
        Contact your administrator for your access code.
      </p>
    </div>
  );
};
