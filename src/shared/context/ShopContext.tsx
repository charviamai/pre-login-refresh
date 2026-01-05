/**
 * ShopContext - Global shop selection context
 * Provides selected shop and timezone across the entire client application
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { adminApi } from '../utils/api-service';
import { TimezoneProvider } from './TimezoneContext';

const STORAGE_KEY = 'global_selected_shop';

interface Shop {
    id: string;
    name: string;
    timezone?: string;
    address?: string;
}

interface ShopContextType {
    shops: Shop[];
    selectedShop: Shop | null;
    selectedShopId: string; // 'ALL' or a specific shop ID
    setSelectedShopId: (shopId: string) => void;
    isAllShopsSelected: boolean;
    loading: boolean;
    error: string | null;
    refreshShops: () => Promise<void>;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

interface ShopProviderProps {
    children: React.ReactNode;
}

export const ShopProvider: React.FC<ShopProviderProps> = ({ children }) => {
    const [shops, setShops] = useState<Shop[]>([]);
    const [selectedShopId, setSelectedShopIdState] = useState<string>(() => {
        // Initialize from localStorage, default to 'ALL'
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved || 'ALL';
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Persist selection to localStorage
    const setSelectedShopId = useCallback((shopId: string) => {
        setSelectedShopIdState(shopId);
        localStorage.setItem(STORAGE_KEY, shopId);
    }, []);

    const loadShops = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await adminApi.getShops();
            const shopList = Array.isArray(data) ? data : ((data as unknown as { results?: Shop[] })?.results || []);
            setShops(shopList);

            // If the saved shop ID no longer exists (shop deleted), reset to ALL
            if (selectedShopId !== 'ALL' && !shopList.find(s => s.id === selectedShopId)) {
                setSelectedShopId('ALL');
            }
        } catch (err) {

            setError('Failed to load shops');
        } finally {
            setLoading(false);
        }
    }, [selectedShopId, setSelectedShopId]);

    useEffect(() => {
        loadShops();
    }, []);

    const selectedShop = selectedShopId === 'ALL' ? null : (shops.find(s => s.id === selectedShopId) || null);
    const isAllShopsSelected = selectedShopId === 'ALL';
    const timezone = selectedShop?.timezone || 'America/New_York';

    const value: ShopContextType = {
        shops,
        selectedShop,
        selectedShopId,
        setSelectedShopId,
        isAllShopsSelected,
        loading,
        error,
        refreshShops: loadShops
    };

    return (
        <ShopContext.Provider value={value}>
            <TimezoneProvider timezone={timezone}>
                {children}
            </TimezoneProvider>
        </ShopContext.Provider>
    );
};

export const useShop = (): ShopContextType => {
    const context = useContext(ShopContext);
    if (!context) {
        throw new Error('useShop must be used within a ShopProvider');
    }
    return context;
};

export const useShopOptional = (): ShopContextType | undefined => {
    return useContext(ShopContext);
};

export default ShopContext;

