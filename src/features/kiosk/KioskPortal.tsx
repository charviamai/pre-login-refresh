import React from 'react';
import { useKiosk } from '../../contexts/KioskContext';
import { ActivationScreen } from './screens/ActivationScreen';
import { RegistrationScreen } from './screens/RegistrationScreen';
import { EligibilityCheckScreen } from './screens/EligibilityCheckScreen';
import { ModeSelectionScreen } from './screens/ModeSelectionScreen';
import { SpinScreen } from './screens/SpinScreen';
import { MatchScreen } from './screens/MatchScreen';
import { TicketPrintScreen } from './screens/TicketPrintScreen';
import { ErrorScreen } from './screens/ErrorScreen';
import { IdleScreen } from './screens/IdleScreen';

/**
 * Main Kiosk Portal Component
 *
 * Simplified flow without biometric verification:
 * - NO_DEVICE_TOKEN: Device needs activation
 * - ACTIVATING: Processing activation code
 * - IDLE: Waiting for customer (tap to play)
 * - NEW_CUSTOMER: New customer registration
 * - CHECKING_ELIGIBILITY: Checking if customer can play
 * - ELIGIBLE: Customer is eligible
 * - MODE_SELECTION: Choose SPIN or MATCH
 * - SPIN_MODE: Spin game
 * - MATCH_MODE: Match game
 * - PRINTING_TICKET: Printing ticket
 * - ERROR: Error occurred
 */
export const KioskPortal: React.FC = () => {
  const { state, deviceInfo, error, logout: _logout, employeeLogout, config, currentEmployee } = useKiosk();

  // Get shop and device names from config
  const shopName = config?.shop?.name || deviceInfo?.shop_name || 'Shop';
  const deviceName = deviceInfo?.name || 'Device';

  // Full-screen layout with dark theme - Fixed layout
  return (
    <div className="fixed inset-0 bg-gray-900 text-white flex flex-col">
      {/* Header - Shop Name and Device Name */}
      <header className="h-14 flex-none bg-gray-800 border-b border-gray-700 px-6 flex items-center">
        <div className="flex items-center justify-between w-full">
          {/* Left side - Shop Name and Device Name */}
          <div className="flex items-center">
            <h1 className="text-lg font-semibold text-white">
              {shopName} <span className="text-gray-400 font-normal">-</span> <span className="text-gray-300 font-normal">{deviceName}</span>
            </h1>
          </div>

          {/* Right side - Verification methods, Employee name, and Logout */}
          <div className="flex items-center space-x-3">
            {/* Verification methods indicator */}
            {config?.settings && (
              <span className="text-xs text-green-400 font-medium">
                {[
                  config.settings.verification_palm_enabled !== false && 'Palm',
                  config.settings.verification_nfc_enabled !== false && 'NFC',
                  config.settings.verification_phone_enabled !== false && 'Phone'
                ].filter(Boolean).join(', ')}
              </span>
            )}
            {/* Employee name when logged in */}
            {currentEmployee && (
              <span className="text-sm text-green-400">
                <svg className="w-4 h-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                {currentEmployee.full_name}
              </span>
            )}
            {/* Show end shift button if employee is logged in */}
            {currentEmployee && state !== 'NO_DEVICE_TOKEN' && state !== 'ACTIVATING' && (
              <button
                onClick={employeeLogout}
                className="ml-2 text-xs text-amber-500 hover:text-amber-300 underline"
                title="End shift and switch employee"
              >
                End Shift
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content - Fills remaining space, centered */}
      <main className="flex-1 overflow-y-auto flex items-center justify-center">
        <div className="w-full h-full flex items-center justify-center p-6">
          <div className="w-full max-w-4xl mx-auto">
            {renderScreen(state, error)}
          </div>
        </div>
      </main>

      {/* Footer - Fixed height */}
      <footer className="h-10 flex-none bg-gray-800 border-t border-gray-700 px-6 flex items-center">
        <div className="flex items-center justify-between w-full text-xs text-gray-500">
          <span>© {new Date().getFullYear()} ArcadeX Gaming Platform</span>
          {deviceInfo && <span>Device ID: {deviceInfo.id.slice(0, 8)}...</span>}
        </div>
      </footer>
    </div>
  );
};

/**
 * Route to the appropriate screen based on current state
 */
function renderScreen(state: string, error: string | null) {
  switch (state) {
    case 'NO_DEVICE_TOKEN':
    case 'ACTIVATING':
      return <ActivationScreen />;

    case 'BOOTSTRAPPING':
      return (
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4" />
          <p className="text-xl">Initializing kiosk...</p>
        </div>
      );

    case 'CONFIG_ERROR':
      return <ErrorScreen error={error || 'Configuration error. Please contact admin.'} />;

    case 'IDLE':
    case 'IDENTIFYING':
      return <IdleScreen />;

    case 'NEW_CUSTOMER':
    case 'REGISTERING':
      return <RegistrationScreen />;

    case 'EXISTING_CUSTOMER':
    case 'CHECKING_ELIGIBILITY':
      return <EligibilityCheckScreen />;

    case 'ELIGIBLE':
    case 'MODE_SELECTION':
      return <ModeSelectionScreen />;

    case 'SPIN_MODE':
    case 'SPINNING':
      return <SpinScreen />;

    case 'MATCH_MODE':
    case 'MATCHING':
      return <MatchScreen />;

    case 'TICKET_ISSUED':
    case 'PRINTING':
    case 'PRINTING_TICKET':
      return <TicketPrintScreen />;

    case 'TICKET_PRINTED':
      return <TicketPrintScreen />;

    case 'ERROR':
      return <ErrorScreen error={error} />;

    default:
      return (
        <div className="text-center">
          <p className="text-xl text-gray-400">Unknown state: {state}</p>
        </div>
      );
  }
}
