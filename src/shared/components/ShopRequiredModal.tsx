/**
 * ShopRequiredModal - Modal that prompts user to select a specific shop
 * Used on pages that require a specific shop (Machine Readings, Shift Schedule, etc.)
 */

import React from 'react';
import { Modal } from './ui';
import { useShop } from '../context/ShopContext';

interface ShopRequiredModalProps {
    isOpen: boolean;
    title?: string;
    description?: string;
}

export const ShopRequiredModal: React.FC<ShopRequiredModalProps> = ({
    isOpen,
    title = 'Shop Selection Required',
    description = 'This feature requires a specific shop to be selected. Please select a shop from the dropdown in the header.'
}) => {
    const { shops, setSelectedShopId } = useShop();

    const handleSelectShop = (shopId: string) => {
        if (shopId) {
            setSelectedShopId(shopId);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={() => { }} title={title} size="sm">
            <div className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    {description}
                </p>

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Select a Shop
                    </label>
                    <select
                        onChange={(e) => handleSelectShop(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                        defaultValue=""
                    >
                        <option value="" disabled>Choose a shop...</option>
                        {shops.map((shop) => (
                            <option key={shop.id} value={shop.id}>
                                {shop.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="pt-2">
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                        You can also use the shop dropdown in the header to change your selection at any time.
                    </p>
                </div>
            </div>
        </Modal>
    );
};
