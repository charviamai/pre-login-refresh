// Palm Bridge API - communicates with rk3568_r device
const PALM_BRIDGE_URL = import.meta.env.VITE_PALM_BRIDGE_URL || 'http://localhost:8088';

export const palmBridgeApi = {
    /**
     * Check if palm reader is connected and ready
     */
    async getStatus() {
        const response = await fetch(`${PALM_BRIDGE_URL}/status`);
        if (!response.ok) {
            throw new Error('Failed to connect to palm reader');
        }
        return await response.json();
    },

    /**
     * Capture palm and return biometric features
     * This will hang until a palm is placed on the reader!
     */
    async capturePalm() {
        const response = await fetch(`${PALM_BRIDGE_URL}/capture`, {
            method: 'POST',
        });

        if (!response.ok) {
            throw new Error('Palm capture failed');
        }

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Palm capture failed');
        }

        return {
            rgbFeature: data.rgbFeature,
            irFeature: data.irFeature,
            timestamp: data.timestamp
        };
    },

    /**
     * Health check
     */
    async checkHealth() {
        try {
            const response = await fetch(`${PALM_BRIDGE_URL}/health`);
            return response.ok;
        } catch {
            return false;
        }
    }
};
