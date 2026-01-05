import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { apiClient } from '../shared/utils/api-client';
import { kioskApi } from '../shared/utils/api-service';
import type {
  KioskState,
  KioskConfig,
  Customer,
  CustomerEligibility,
  Ticket,
  CustomerRegistration,
  ApiError,
  SpinResult,
} from '../shared/types';

// ============================================================================
// KIOSK CONTEXT TYPES
// ============================================================================

// Employee info for kiosk login
interface KioskEmployee {
  id: string;
  full_name: string;
  name_first: string;
  name_last: string;
  email: string;
  access_code: string;
}

interface KioskContextType {
  // State
  state: KioskState;
  deviceToken: string | null;
  deviceInfo: { id: string; name: string; shop_name: string } | null;
  config: KioskConfig | null;
  currentCustomer: Customer | null;
  eligibility: CustomerEligibility | null;
  currentTicket: Ticket | null;
  error: string | null;
  tempBiometricToken: string | null;
  matchAmount: number | null;
  pendingPhone?: string | null;
  pendingPalmFeatures?: { rgbFeature: string; irFeature: string } | null;
  currentEmployee: KioskEmployee | null;

  // Actions
  activate: (accessCode: string, deviceId?: string) => Promise<{ requires_device_selection?: boolean; devices?: Array<{ id: string; name: string; shop_name: string; code: string }> } | void>;
  bootstrap: () => Promise<void>;
  employeeLogin: (accessCode: string) => Promise<void>;
  employeeLogout: () => void;
  identifyCustomer: (phone: string) => Promise<any>;
  registerCustomer: (data: CustomerRegistration) => Promise<any>;
  checkEligibility: (customerId?: string) => Promise<void>;
  selectMode: (mode: 'SPIN' | 'MATCH') => void;
  performSpin: () => Promise<SpinResult | null>;
  performMatch: (amount: number) => Promise<{
    cooldown: boolean;
    nextAvailableAt?: string;
    cooldownRemainingSeconds?: number;
    lastTicketStatus?: string | null;
    lastTicketBarcode?: string | null;
    verificationRequired?: boolean;
  } | undefined>;
  setMatchAmount: (amount: number) => void;
  setPendingPhone?: (phone: string | null) => void;
  setPendingPalmFeatures?: (features: { rgbFeature: string; irFeature: string } | null) => void;
  setCurrentCustomer?: (customer: any) => void;
  reset: () => void;
  logout: () => void;
  setState: (state: KioskState) => void;
  clearError: () => void;
}

// ============================================================================
// KIOSK CONTEXT
// ============================================================================

const KioskContext = createContext<KioskContextType | undefined>(undefined);

export const useKiosk = () => {
  const context = useContext(KioskContext);
  if (!context) {
    throw new Error('useKiosk must be used within a KioskProvider');
  }
  return context;
};

// ============================================================================
// KIOSK PROVIDER
// ============================================================================

interface KioskProviderProps {
  children: ReactNode;
}

export const KioskProvider: React.FC<KioskProviderProps> = ({ children }) => {
  const [state, setState] = useState<KioskState>('NO_DEVICE_TOKEN');
  const [deviceToken, setDeviceToken] = useState<string | null>(null);
  const [deviceInfo, setDeviceInfo] = useState<{ id: string; name: string; shop_name: string } | null>(null);
  const [config, setConfig] = useState<KioskConfig | null>(null);
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);
  const [eligibility, setEligibility] = useState<CustomerEligibility | null>(null);
  const [currentTicket, setCurrentTicket] = useState<Ticket | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tempBiometricToken, setTempBiometricToken] = useState<string | null>(null);
  const [matchAmount, setMatchAmount] = useState<number | null>(null);
  const [pendingPhone, setPendingPhone] = useState<string | null>(null);
  const [pendingPalmFeatures, setPendingPalmFeatures] = useState<{ rgbFeature: string; irFeature: string } | null>(null);
  const [currentEmployee, setCurrentEmployee] = useState<KioskEmployee | null>(null);

  // --------------------------------------------------------------------------
  // Restore session on mount
  // --------------------------------------------------------------------------
  useEffect(() => {
    const restoreSession = async () => {
      const savedToken = localStorage.getItem('device_token');
      const savedConfig = localStorage.getItem('kiosk_config');
      const savedEmployee = localStorage.getItem('kiosk_employee');

      if (savedToken && savedConfig && savedEmployee) {
        // Full session exists - device activated AND employee logged in
        try {
          const parsedConfig = JSON.parse(savedConfig) as KioskConfig;
          const parsedEmployee = JSON.parse(savedEmployee) as KioskEmployee;

          apiClient.setDeviceToken(savedToken);
          setDeviceToken(savedToken);
          setConfig(parsedConfig);
          setCurrentEmployee(parsedEmployee);

          if (parsedConfig.device && parsedConfig.shop) {
            setDeviceInfo({
              id: parsedConfig.device.id,
              name: parsedConfig.device.name,
              shop_name: parsedConfig.shop.name,
            });
          }

          setState('IDLE');
          startHeartbeat();

          // Fetch fresh settings in background to get latest shop settings
          try {
            const freshConfig = await kioskApi.getBootstrap();

            setConfig(freshConfig);
            localStorage.setItem('kiosk_config', JSON.stringify(freshConfig));
          } catch (e) {
            // Silently fail - using cached config is acceptable
            console.log('Could not fetch fresh config:', e);
          }
        } catch (e) {

          // Clear everything and require fresh activation
          localStorage.removeItem('device_token');
          localStorage.removeItem('kiosk_config');
          localStorage.removeItem('kiosk_employee');
          setState('NO_DEVICE_TOKEN');
        }
      } else {
        // No valid session - clear any partial data and require activation
        localStorage.removeItem('device_token');
        localStorage.removeItem('kiosk_config');
        localStorage.removeItem('kiosk_employee');
        setState('NO_DEVICE_TOKEN');
      }
    };

    restoreSession();
  }, []);

  // --------------------------------------------------------------------------
  // Activate Device
  // --------------------------------------------------------------------------

  const activate = async (accessCode: string, deviceId?: string): Promise<{ requires_device_selection?: boolean; devices?: Array<{ id: string; name: string; shop_name: string; code: string }> } | void> => {
    try {
      setState('ACTIVATING');
      setError(null);


      const response = await kioskApi.activateWithAccessCode(accessCode, deviceId);


      // Check if device selection is required
      if (response.requires_device_selection && response.devices) {
        setState('NO_DEVICE_TOKEN'); // Stay on activation screen
        return { requires_device_selection: true, devices: response.devices };
      }

      // Store device token
      if (response.device_token) {
        apiClient.setDeviceToken(response.device_token);
        setDeviceToken(response.device_token);
      }

      // Response includes full config + employee info
      if (response.device && response.shop && response.settings) {
        const kioskConfig: KioskConfig = {
          device: response.device,
          shop: response.shop,
          tenant: response.tenant,
          settings: response.settings,
          promotions: response.promotions || [],
          prizes: response.prizes || [],
          promotion: response.promotion || null,  // Match game config from backend
        };

        setConfig(kioskConfig);

        // Set device info
        setDeviceInfo({
          id: response.device.id,
          name: response.device.name,
          shop_name: response.shop.name,
        });

        // Set employee info (included in activation response)
        if (response.employee) {
          const employee: KioskEmployee = {
            id: response.employee.id,
            full_name: response.employee.full_name,
            name_first: response.employee.name_first,
            name_last: response.employee.name_last,
            email: response.employee.email,
            access_code: response.employee.access_code,
          };
          setCurrentEmployee(employee);
          localStorage.setItem('kiosk_employee', JSON.stringify(employee));
        }

        // Check if config is complete
        if (!response.settings || !response.shop) {
          setState('CONFIG_ERROR');
          setError('Incomplete kiosk configuration. Please contact admin.');
          return;
        }

        // Save to localStorage
        localStorage.setItem('device_token', response.device_token);
        localStorage.setItem('kiosk_config', JSON.stringify(kioskConfig));

        // Activation + Employee login complete - go directly to IDLE
        setState('IDLE');

        startHeartbeat();
      } else if (!response.requires_device_selection) {
        setState('CONFIG_ERROR');
        setError('Incomplete activation response. Please contact admin.');
      }
    } catch (err: unknown) {

      const apiError = err as ApiError | { error?: string; message?: string; status_code?: number };
      const errorMessage = apiError.error || apiError.message || 'Activation failed. Please check your access code.';

      setError(errorMessage);
      setState('NO_DEVICE_TOKEN');
      throw err;
    }
  };

  // --------------------------------------------------------------------------
  // Bootstrap - Load Kiosk Configuration
  // --------------------------------------------------------------------------

  const bootstrap = async () => {
    try {
      setState('BOOTSTRAPPING');
      setError(null);


      const kioskConfig = await kioskApi.getBootstrap();

      setConfig(kioskConfig);

      // Set device info from config
      if (kioskConfig.device && kioskConfig.shop) {
        setDeviceInfo({
          id: kioskConfig.device.id,
          name: kioskConfig.device.name,
          shop_name: kioskConfig.shop.name,
        });
      }

      // Check if config is complete
      if (!kioskConfig.settings || !kioskConfig.shop) {
        setState('CONFIG_ERROR');
        setError('Incomplete kiosk configuration. Please contact admin.');
        return;
      }

      // Config loaded successfully
      setState('IDLE');

      // Start heartbeat (optional)
      startHeartbeat();
    } catch (err: unknown) {

      // Extract error message from ApiError format
      const apiError = err as { error?: string; message?: string; status_code?: number };
      const errorMessage = apiError.error || apiError.message || 'Failed to load kiosk configuration';
      setError(errorMessage);
      setState('CONFIG_ERROR');
      throw err;
    }
  };

  // --------------------------------------------------------------------------
  // Employee Login - Validate access code for this device
  // --------------------------------------------------------------------------

  const employeeLogin = async (accessCode: string) => {
    try {
      setState('EMPLOYEE_LOGGING_IN');
      setError(null);


      const response = await kioskApi.employeeLogin(accessCode);


      if (response.success && response.employee) {
        const employee: KioskEmployee = {
          id: response.employee.id,
          full_name: response.employee.full_name,
          name_first: response.employee.name_first,
          name_last: response.employee.name_last,
          email: response.employee.email,
          access_code: response.employee.access_code,
        };

        setCurrentEmployee(employee);
        localStorage.setItem('kiosk_employee', JSON.stringify(employee));

        setState('IDLE');
      } else {
        setError('Login failed. Please try again.');
        setState('EMPLOYEE_LOGIN');
      }
    } catch (err: unknown) {

      const apiError = err as ApiError | { error?: string; message?: string };
      const errorMessage = apiError.error || apiError.message || 'Invalid access code. Please try again.';
      setError(errorMessage);
      setState('EMPLOYEE_LOGIN');
      throw err;
    }
  };

  // --------------------------------------------------------------------------
  // Employee Logout - Return to activation screen (employee needs to re-authenticate)
  // --------------------------------------------------------------------------

  const employeeLogout = () => {
    // Clear everything - employee must re-enter device code + access code
    localStorage.removeItem('device_token');
    localStorage.removeItem('kiosk_config');
    localStorage.removeItem('kiosk_employee');
    apiClient.clearDeviceToken();
    setDeviceToken(null);
    setDeviceInfo(null);
    setConfig(null);
    setCurrentEmployee(null);
    setCurrentCustomer(null);
    setEligibility(null);
    setCurrentTicket(null);
    setError(null);
    setTempBiometricToken(null);
    setMatchAmount(null);
    setState('NO_DEVICE_TOKEN');
  };

  // --------------------------------------------------------------------------
  // Identify Customer via Phone Number (simplified - no biometric)
  // --------------------------------------------------------------------------

  const identifyCustomer = async (phone: string) => {
    try {
      setState('IDENTIFYING');
      setError(null);

      // Phone-based lookup
      const result = await kioskApi.lookupByPhone(phone);

      if (result.found && result.customer) {
        // Existing customer found
        setCurrentCustomer(result.customer);
        setState('CHECKING_ELIGIBILITY');
        await checkEligibility(result.customer.id);
        return result;
      } else {
        // Customer not found - go to registration
        setPendingPhone(phone);
        setState('NEW_CUSTOMER');
        return result;
      }
    } catch (err: unknown) {
      // Customer not found (404 or similar) - go to NEW_CUSTOMER
      // If customer not found (404 or similar), go to NEW_CUSTOMER
      setPendingPhone(phone);
      setState('NEW_CUSTOMER');
      throw err;
    }
  };

  // --------------------------------------------------------------------------
  // Register New Customer
  // --------------------------------------------------------------------------

  const registerCustomer = async (data: CustomerRegistration) => {
    try {
      setState('REGISTERING');
      setError(null);

      const registrationData = {
        ...data,
        temp_biometric_token: tempBiometricToken || undefined,
      };

      const customer = await kioskApi.register(registrationData);
      setCurrentCustomer(customer);
      setTempBiometricToken(null);

      // Return customer for palm registration - let caller handle state transition
      return customer;
    } catch (err: unknown) {
      const error = err as { message?: string };
      setError(error.message || 'Customer registration failed');
      setState('NEW_CUSTOMER');
      throw err;
    }
  };

  // --------------------------------------------------------------------------
  // Check Eligibility
  // --------------------------------------------------------------------------

  const checkEligibility = async (customerId?: string) => {
    const customerIdToCheck = customerId || currentCustomer?.id;

    if (!customerIdToCheck) {
      setError('No customer selected');
      return;
    }

    try {
      setState('CHECKING_ELIGIBILITY');
      setError(null);

      const eligibilityData = await kioskApi.getEligibility(customerIdToCheck);
      setEligibility(eligibilityData);

      if (eligibilityData.eligible) {
        setState('ELIGIBLE');
      } else {
        // Don't go back to IDLE - show error but stay in ELIGIBLE_CHECK state
        setError(eligibilityData.reason || 'Customer not eligible');
      }
    } catch (err: unknown) {
      const error = err as { error?: string; message?: string };
      const errorMessage = error.error || error.message || 'Eligibility check failed';
      setError(errorMessage);
      // Don't go back to IDLE on error
      setState('CHECKING_ELIGIBILITY');
      throw err;
    }
  };

  // --------------------------------------------------------------------------
  // Perform Spin
  // --------------------------------------------------------------------------

  const performSpin = async (): Promise<SpinResult | null> => {
    if (!currentCustomer) {
      setError('No customer selected');
      return null;
    }

    try {
      setState('SPINNING');
      setError(null);

      // Use new spin campaign endpoint
      const result = await kioskApi.spinExecute(currentCustomer.id);

      // Create ticket object (backend returns ticket ID and amount)
      const ticket: Partial<Ticket> = {
        id: result.ticket_id,
        amount: result.amount,
        issued_by_mode: 'SPIN',
        barcode: result.barcode,
        expires_at: result.expires_at,
      };

      setCurrentTicket(ticket as Ticket);

      // Return result for UI use
      return result;
    } catch (err: unknown) {
      const error = err as { message?: string };
      setError(error.message || 'Spin failed');
      setState('MODE_SELECTION');
      throw err;
    }
  };

  // --------------------------------------------------------------------------
  // Perform Match
  // --------------------------------------------------------------------------

  const performMatch = async (amount: number) => {
    if (!currentCustomer) {
      setError('No customer selected');
      return;
    }

    try {
      setState('MATCH_MODE');
      setError(null);

      const result = await kioskApi.match(currentCustomer.id, amount);

      // Check if in cooldown (can_play: false)
      if (result.can_play === false) {
        // Return cooldown info for UI to display
        return {
          cooldown: true,
          nextAvailableAt: result.next_available_at,
          cooldownRemainingSeconds: result.cooldown_remaining_seconds,
          lastTicketStatus: result.last_ticket_status,
          lastTicketBarcode: result.last_ticket_barcode,
          verificationRequired: result.verification_required,
        };
      }

      // Create ticket object with new fields
      const ticket: Partial<Ticket> = {
        id: result.ticket_id,
        amount: result.amount,
        issued_by_mode: 'MATCH',
        barcode: result.barcode,
        nextAvailableAt: result.next_available_at,
        verificationRequired: result.verification_required,
        matchStatus: result.match_status,
      };

      setCurrentTicket(ticket as Ticket);
      setState('TICKET_ISSUED');
      return { cooldown: false };
    } catch (err: unknown) {
      const error = err as { message?: string };
      setError(error.message || 'Match failed');
      setState('ELIGIBLE');
      throw err;
    }
  };

  // --------------------------------------------------------------------------
  // Select Game Mode
  // --------------------------------------------------------------------------

  const selectMode = (mode: 'SPIN' | 'MATCH') => {
    if (mode === 'SPIN') {
      setState('SPIN_MODE');
    } else if (mode === 'MATCH') {
      setState('MATCH_MODE');
    }
  };

  // --------------------------------------------------------------------------
  // Reset Kiosk Session
  // --------------------------------------------------------------------------

  const reset = () => {
    setCurrentCustomer(null);
    setEligibility(null);
    setCurrentTicket(null);
    setError(null);
    setTempBiometricToken(null);
    setMatchAmount(null);
    setState('IDLE');
  };

  // --------------------------------------------------------------------------
  // Logout (Clear device token and return to activation)
  // --------------------------------------------------------------------------

  const logout = () => {
    localStorage.removeItem('device_token');
    localStorage.removeItem('kiosk_config');
    localStorage.removeItem('kiosk_employee');
    apiClient.clearDeviceToken();
    setDeviceToken(null);
    setDeviceInfo(null);
    setConfig(null);
    setCurrentCustomer(null);
    setCurrentEmployee(null);
    setEligibility(null);
    setCurrentTicket(null);
    setError(null);
    setTempBiometricToken(null);
    setState('NO_DEVICE_TOKEN');
  };

  // --------------------------------------------------------------------------
  // Clear Error
  // --------------------------------------------------------------------------

  const clearError = () => {
    setError(null);
  };

  // --------------------------------------------------------------------------
  // Heartbeat (Optional)
  // --------------------------------------------------------------------------

  useEffect(() => {
    let heartbeatInterval: ReturnType<typeof setInterval> | null = null;

    if (deviceToken && (state === 'IDLE' || state.startsWith('CUSTOMER_') || state === 'ELIGIBLE' || state.includes('MODE'))) {
      // Start heartbeat only when device is activated and we're in an active state
      heartbeatInterval = setInterval(async () => {
        try {
          // Ensure token is still in apiClient
          if (!apiClient.getDeviceToken()) {
            apiClient.setDeviceToken(deviceToken);
          }

          await kioskApi.sendHeartbeat();
        } catch (err) {
          // Silently ignore heartbeat failures (expected when device is not activated)
          // Heartbeat errors are normal for web dashboard
        }
      }, 600000); // Every 10 minutes
    }

    return () => {
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
      }
    };
  }, [deviceToken, state]);

  const startHeartbeat = () => {
    // This function is now a no-op since useEffect handles heartbeat
    // Keeping it for backwards compatibility
  };

  // --------------------------------------------------------------------------
  // Context Value
  // --------------------------------------------------------------------------

  const value: KioskContextType = {
    state,
    deviceToken,
    deviceInfo,
    config,
    currentCustomer,
    eligibility,
    currentTicket,
    error,
    tempBiometricToken,
    matchAmount,
    pendingPhone,
    pendingPalmFeatures,
    currentEmployee,
    activate,
    bootstrap,
    employeeLogin,
    employeeLogout,
    identifyCustomer,
    registerCustomer,
    checkEligibility,
    selectMode,
    performSpin,
    performMatch,
    setMatchAmount,
    setPendingPhone,
    setPendingPalmFeatures,
    setCurrentCustomer,
    reset,
    logout,
    setState,
    clearError,
  };

  return <KioskContext.Provider value={value}>{children}</KioskContext.Provider>;
};
