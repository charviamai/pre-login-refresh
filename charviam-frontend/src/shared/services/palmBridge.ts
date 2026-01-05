/**
 * Palm Bridge Service
 * Communicates with VP930 palm scanner device and backend API
 */

// Get URLs from environment variables
const PALM_BRIDGE_URL = import.meta.env.VITE_PALM_BRIDGE_URL || 'http://127.0.0.1:8088';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export interface PalmFeatures {
    rgbFeature: string;
    irFeature: string;
    timestamp?: number;
}

export interface PalmStatus {
    connected: boolean;
    deviceReady: boolean;
    algorithmStatus: string;
    deviceInfo: string;
}

export interface PalmCaptureResult {
    success: boolean;
    rgbFeature?: string;
    irFeature?: string;
    timestamp?: number;
    error?: string;
}

export interface PalmIdentifyResult {
    matched: boolean;
    customer_id?: string;
    customer_name?: string;
    similarity_score?: number;
    matched_hand?: string;
    threshold?: number;
    processing_time_ms?: number;
    reason?: string;
    error?: string;
}

export interface PalmRegisterResult {
    success: boolean;
    customer_id?: string;
    customer_name?: string;
    error?: string;
}

/**
 * Palm Bridge Service - Device Communication
 */
export const palmBridgeService = {
    /**
     * Check if palm scanner device is ready
     */
    async getStatus(): Promise<PalmStatus> {
        try {
            const response = await fetch(`${PALM_BRIDGE_URL}/status`, {
                method: 'GET',
                headers: { 'Accept': 'application/json' },
            });

            if (!response.ok) {
                throw new Error(`Status check failed: ${response.status}`);
            }

            const data = await response.json();

            // API returns {palm: {connected, algorithmReady, enabled}, ...}
            // Map it to our PalmStatus interface
            const palmData = data.palm || {};
            return {
                connected: palmData.connected === true,
                deviceReady: palmData.algorithmReady === true,
                algorithmStatus: palmData.algorithmReady ? 'ENABLED' : 'DISABLED',
                deviceInfo: data.server?.uptime ? `Uptime: ${data.server.uptime}ms` : '',
            };
        } catch (error) {

            return {
                connected: false,
                deviceReady: false,
                algorithmStatus: 'ERROR',
                deviceInfo: '',
            };
        }
    },

    /**
     * Capture palm from device
     * @param timeout - Timeout in milliseconds (default 20000ms = 20 seconds)
     */
    async capture(timeout: number = 20000): Promise<PalmCaptureResult> {
        try {
            const response = await fetch(`${PALM_BRIDGE_URL}/palm/capture`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    timeout: timeout,
                    showPreview: true,  // Request live preview on Android device
                }),
            });

            if (!response.ok) {
                throw new Error(`Capture failed: ${response.status}`);
            }

            const result = await response.json();

            if (result.success === false) {
                return {
                    success: false,
                    error: result.error || 'Capture failed',
                };
            }

            return {
                success: true,
                rgbFeature: result.rgbFeature,
                irFeature: result.irFeature,
                timestamp: result.timestamp,
            };
        } catch (error: any) {

            return {
                success: false,
                error: error.message || 'Failed to capture palm',
            };
        }
    },
};

/**
 * Palm API Service - Backend Communication
 */
export const palmApiService = {
    /**
     * Identify customer by palm scan
     */
    async identify(
        features: PalmFeatures,
        authToken: string
    ): Promise<PalmIdentifyResult> {
        try {
            const response = await fetch(`${API_BASE_URL}/biometrics/kiosk/identify-palm/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Device-Key': authToken,
                },
                body: JSON.stringify({
                    rgb_feature: features.rgbFeature,
                    ir_feature: features.irFeature,
                }),
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                throw new Error(error.error || `API error: ${response.status}`);
            }

            return await response.json();
        } catch (error: any) {

            return {
                matched: false,
                error: error.message || 'Failed to identify palm',
            };
        }
    },

    /**
     * Register both palms for a customer
     */
    async register(
        customerId: string,
        rightPalm: PalmFeatures,
        leftPalm: PalmFeatures,
        authToken: string,
        shopId?: string,
        deviceId?: string
    ): Promise<PalmRegisterResult> {
        try {
            const response = await fetch(`${API_BASE_URL}/biometrics/kiosk/register-palm/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Device-Key': authToken,
                },
                body: JSON.stringify({
                    customer_id: customerId,
                    right_rgb_feature: rightPalm.rgbFeature,
                    right_ir_feature: rightPalm.irFeature,
                    left_rgb_feature: leftPalm.rgbFeature,
                    left_ir_feature: leftPalm.irFeature,
                    shop_id: shopId,
                    device_id: deviceId,
                }),
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                throw new Error(error.error || `API error: ${response.status}`);
            }

            return await response.json();
        } catch (error: any) {

            return {
                success: false,
                error: error.message || 'Failed to register palm',
            };
        }
    },

    /**
     * Get palm registration status for a customer
     */
    async getStatus(
        customerId: string,
        authToken: string
    ): Promise<{ has_right_palm: boolean; has_left_palm: boolean; fully_registered: boolean }> {
        try {
            const response = await fetch(`${API_BASE_URL}/biometrics/kiosk/palm-status/${customerId}/`, {
                method: 'GET',
                headers: {
                    'X-Device-Key': authToken,
                },
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            return await response.json();
        } catch (error) {

            return {
                has_right_palm: false,
                has_left_palm: false,
                fully_registered: false,
            };
        }
    },
};
