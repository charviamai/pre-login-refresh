// Get URLs from environment variables
const BRIDGE_URL = import.meta.env.VITE_PALM_BRIDGE_URL || 'http://127.0.0.1:8088';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

// Types
export interface NFCRegisterResult {
    success: boolean;
    nfc_uid?: string;
    error?: string;
    timestamp?: string;
}

export interface NFCVerifyResult {
    success: boolean;
    nfc_uid?: string;
    error?: string;
    timestamp?: string;
}

export interface IdentifyNFCResult {
    matched: boolean;
    customer_id?: string;
    customer_name?: string;
    nfc_uid?: string;
    error?: string;
}

export interface RegisterNFCResponse {
    success: boolean;
    message?: string;
    customer_id?: string;
    nfc_uid?: string;
    error?: string;
}

// Helper for Fetch with Timeout
async function bridgeFetch<T>(endpoint: string, options: RequestInit & { timeout?: number } = {}): Promise<T> {
    const { timeout = 10000, ...fetchOptions } = options;
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(`${BRIDGE_URL}${endpoint}`, {
            ...fetchOptions,
            signal: controller.signal,
            method: 'POST', // Default to POST for bridge actions
            headers: { 'Accept': 'application/json', ...(fetchOptions.headers || {}) },
        });
        clearTimeout(id);

        if (!response.ok) {
            throw new Error(`Bridge error: ${response.status}`);
        }
        return await response.json();
    } catch (error: any) {
        clearTimeout(id);
        throw error;
    }
}

// NFC Bridge Service - Communicates with D+930 Android App
export const nfcBridgeService = {
    /**
     * Register a new NFC tag (read UID)
     * Uses D+930 serial port reader
     */
    async register(timeoutMs: number = 15000): Promise<NFCRegisterResult> {
        try {
            return await bridgeFetch<NFCRegisterResult>('/nfc/register', {
                timeout: timeoutMs,
            });
        } catch (error: any) {

            return {
                success: false,
                error: error.message || 'Failed to connect to NFC reader',
            };
        }
    },

    /**
     * Verify an existing NFC tag (read UID)
     * Uses D+930 serial port reader
     */
    async verify(timeoutMs: number = 10000): Promise<NFCVerifyResult> {
        try {
            return await bridgeFetch<NFCVerifyResult>('/nfc/verify', {
                timeout: timeoutMs,
            });
        } catch (error: any) {

            return {
                success: false,
                error: error.message || 'Failed to connect to NFC reader',
            };
        }
    },
};

// NFC API Service - Communicates with Backend
export const nfcApiService = {
    /**
     * Identify customer by NFC UID
     */
    async identify(
        nfcUid: string,
        authToken: string
    ): Promise<IdentifyNFCResult> {
        try {
            const response = await fetch(`${API_BASE_URL}/biometrics/kiosk/identify-nfc/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Device-Key': authToken,
                },
                body: JSON.stringify({
                    nfc_uid: nfcUid,
                }),
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.statusText}`);
            }

            return await response.json();
        } catch (error: any) {

            return {
                matched: false,
                error: error.message || 'Identification failed',
            };
        }
    },

    /**
     * Register NFC tag to customer
     */
    async register(
        customerId: string,
        nfcUid: string,
        authToken: string,
        shopId?: string,
        deviceId?: string
    ): Promise<RegisterNFCResponse> {
        try {
            const response = await fetch(`${API_BASE_URL}/biometrics/kiosk/register-nfc/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Device-Key': authToken,
                },
                body: JSON.stringify({
                    customer_id: customerId,
                    nfc_uid: nfcUid,
                    shop_id: shopId,
                    device_id: deviceId,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                return {
                    success: false,
                    error: data.error || data.detail || 'Registration failed',
                };
            }

            return data;
        } catch (error: any) {

            return {
                success: false,
                error: error.message || 'Registration failed',
            };
        }
    },
};
