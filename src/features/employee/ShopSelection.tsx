import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, CardContent } from '../../shared/components/ui';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Shop Selection Screen for Employees
 * After login, employees select which shop they want to work in
 * This determines the context for all subsequent operations
 */
export const ShopSelection: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [selectedShopId, setSelectedShopId] = useState<string>('');

    // Get shops from user context
    const shops = user?.shops || [];

    const handleSelectShop = () => {
        if (!selectedShopId) return;

        // Store selected shop in sessionStorage for the current session
        const selectedShop = shops.find(s => s.id === selectedShopId);
        if (selectedShop) {
            sessionStorage.setItem('employee_selected_shop', JSON.stringify(selectedShop));
            navigate('/employee/dashboard');
        }
    };

    const handleLogout = () => {
        sessionStorage.removeItem('employee_selected_shop');
        logout();
        navigate('/login');
    };

    // If only one shop, auto-select and go to dashboard
    React.useEffect(() => {
        if (shops.length === 1) {
            sessionStorage.setItem('employee_selected_shop', JSON.stringify(shops[0]));
            navigate('/employee/dashboard');
        }
    }, [shops, navigate]);

    // If no shops assigned, show error
    if (shops.length === 0) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
                <Card className="w-full max-w-md dark:bg-slate-900 dark:border-slate-800">
                    <CardContent className="pt-6 pb-6 sm:pt-8 sm:pb-8 text-center">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                            <svg className="w-6 h-6 sm:w-8 sm:h-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2">No Shop Access</h2>
                        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4 sm:mb-6">
                            You don't have access to any shops. Please contact your administrator.
                        </p>
                        <Button variant="outline" onClick={handleLogout} fullWidth className="dark:text-white dark:border-slate-700 dark:hover:bg-slate-800">
                            Sign Out
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
            <Card className="w-full max-w-md dark:bg-slate-900 dark:border-slate-800">
                <CardContent className="pt-6 pb-6 sm:pt-8 sm:pb-8">
                    {/* Header */}
                    <div className="text-center mb-6 sm:mb-8">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                            <svg className="w-6 h-6 sm:w-8 sm:h-8 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                        </div>
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Select Your Shop</h1>
                        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1.5 sm:mt-2">
                            Welcome, <span className="font-medium text-gray-900 dark:text-gray-200">{user?.name_first}</span>! Choose which shop you're working at today.
                        </p>
                    </div>

                    {/* Shop Selection */}
                    <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                        {shops.map((shop) => (
                            <button
                                key={shop.id}
                                onClick={() => setSelectedShopId(shop.id)}
                                className={`w-full p-3 sm:p-4 rounded-lg border-2 text-left transition-all ${selectedShopId === shop.id
                                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 ring-2 ring-primary-200 dark:ring-primary-900'
                                    : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-800'
                                    }`}
                            >
                                <div className="flex items-center">
                                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center mr-2.5 sm:mr-3 ${selectedShopId === shop.id ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400'
                                        }`}>
                                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                        </svg>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className={`text-sm sm:text-base font-semibold truncate ${selectedShopId === shop.id ? 'text-primary-800 dark:text-primary-300' : 'text-gray-900 dark:text-white'}`}>{shop.name}</h3>
                                    </div>
                                    {selectedShopId === shop.id && (
                                        <svg className="w-5 h-5 sm:w-6 sm:h-6 text-primary-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Actions */}
                    <div className="space-y-2 sm:space-y-3">
                        <Button
                            onClick={handleSelectShop}
                            disabled={!selectedShopId}
                            fullWidth
                            className="py-2.5 sm:py-3 text-sm sm:text-base"
                        >
                            Continue to Dashboard
                        </Button>
                        <Button
                            variant="outline"
                            onClick={handleLogout}
                            fullWidth
                            className="text-sm sm:text-base"
                        >
                            Sign Out
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
